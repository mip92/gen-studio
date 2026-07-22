#!/usr/bin/env python
"""Transcribe a final video (mp4) into an .srt subtitle file with faster-whisper.

Runs in gen-studio/.venv-qwen3 (same venv as tts_qwen3.py — faster-whisper is
already installed there). Reused by YoutubeCaptionsService, which enqueues a
CaptionJob and dispatches it through PipelineQueueService. Whisper decodes the
mp4's audio track directly (via PyAV), so no separate audio extraction is needed.

Usage:
    python transcribe_srt.py --input <video.mp4> --output <out.srt>
                             [--language ru] [--model medium]

Outputs:
    On success → prints `OK <srt-path>` to stdout, exit 0.
    On failure → human-readable line to stderr, exit 1.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# Keep model caches on the project drive (mirrors tts_qwen3.py). Set before any
# huggingface_hub import.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME', str(_PROJECT_ROOT / '.hf_cache'))
os.environ.setdefault('USE_TF', '0')
os.environ.setdefault('USE_FLAX', '0')
_BIN_DIR = _PROJECT_ROOT / 'bin'
if _BIN_DIR.exists():
    os.environ['PATH'] = str(_BIN_DIR) + os.pathsep + os.environ.get('PATH', '')

# medium = good accuracy / acceptable CPU speed for a 25-40 min film. large-v3 is
# more accurate but markedly slower on CPU int8; override with --model if wanted.
DEFAULT_MODEL = 'medium'


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _asr_model_dir(asr_model: str) -> Path:
    """Resolve faster-whisper weights to a PLAIN local dir under checkpoints/
    (mirrors tts_qwen3._asr_model_dir — local_dir mode avoids Windows symlink
    privilege errors)."""
    if '/' in asr_model or os.sep in asr_model:
        as_path = Path(asr_model)
        if as_path.exists():
            return as_path
        repo = asr_model
    else:
        repo = f'Systran/faster-whisper-{asr_model}'
    tgt = _PROJECT_ROOT / 'checkpoints' / repo.split('/')[-1].replace('-', '_')
    if not (tgt / 'model.bin').exists():
        from huggingface_hub import snapshot_download
        _log(f'downloading {repo} → {tgt}')
        snapshot_download(repo, local_dir=str(tgt))
    return tgt


def _ts(seconds: float) -> str:
    """Seconds → SRT timestamp `HH:MM:SS,mmm`."""
    if seconds < 0:
        seconds = 0.0
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True, help='path to the mp4 to transcribe')
    ap.add_argument('--output', required=True, help='path to write the .srt to')
    ap.add_argument('--language', default='ru', help='spoken language (default ru)')
    ap.add_argument('--model', default=DEFAULT_MODEL, help='faster-whisper model')
    ap.add_argument('--initial-prompt-file', default=None,
                    help='UTF-8 file with a vocabulary/glossary (from the known VO) to bias recognition')
    ap.add_argument('--device', default='cuda', help="'cuda' (fast, falls back to CPU) or 'cpu'")
    ap.add_argument('--compute-type', default='', help="override; default float16 on cuda, int8 on cpu")
    args = ap.parse_args()

    src = Path(args.input)
    if not src.exists():
        _log(f'input not found: {src}')
        return 1
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    # Bias recognition toward the known VO vocabulary (names/terms/numbers). Read
    # from a UTF-8 file, not argv, so Cyrillic survives the Windows console codepage.
    initial_prompt = None
    if args.initial_prompt_file:
        try:
            initial_prompt = Path(args.initial_prompt_file).read_text(encoding='utf-8').strip() or None
            if initial_prompt:
                _log(f'initial_prompt ({len(initial_prompt)} chars): {initial_prompt[:80]!r}…')
        except Exception as e:  # noqa: BLE001
            _log(f'could not read initial-prompt-file: {e!r}')

    # Let CTranslate2 find the cuDNN/cuBLAS DLLs it needs for CUDA. Prefer the
    # dedicated nvidia-* packages (cuDNN 9, matches CT2 4.x); fall back to torch's.
    def _add_dll_dir(p: Path) -> None:
        if p.exists():
            os.environ['PATH'] = str(p) + os.pathsep + os.environ.get('PATH', '')
    try:
        import nvidia   # namespace package → use __path__, not __file__ (which is None)
        for nvroot in list(getattr(nvidia, '__path__', [])):
            for sub in ('cudnn', 'cublas', 'cuda_nvrtc'):
                _add_dll_dir(Path(nvroot) / sub / 'bin')
    except Exception:  # noqa: BLE001
        pass
    try:
        import torch
        _add_dll_dir(Path(torch.__file__).resolve().parent / 'lib')
    except Exception:  # noqa: BLE001
        pass

    try:
        from faster_whisper import WhisperModel
    except Exception as e:  # noqa: BLE001
        _log(f'faster-whisper not importable in this venv: {e!r}')
        return 1

    def _load(device: str):
        ctype = args.compute_type or ('float16' if device == 'cuda' else 'int8')
        return WhisperModel(str(_asr_model_dir(args.model)), device=device, compute_type=ctype), ctype

    try:
        t0 = time.time()
        # GPU (float16) is much faster; the queue is single-slot so ComfyUI is idle
        # during this run. Fall back to CPU int8 if CUDA/cuDNN isn't available.
        device = args.device
        try:
            model, ctype = _load(device)
        except Exception as e:  # noqa: BLE001
            if device != 'cpu':
                _log(f'{device} load failed ({e!r}); falling back to CPU int8')
                device = 'cpu'
                model, ctype = _load(device)
            else:
                raise
        _log(f'transcribing {src.name} (model={args.model}, device={device}/{ctype}, lang={args.language}) …')
        segments, info = model.transcribe(
            str(src),
            language=args.language,
            vad_filter=True,           # drop long silences → tighter cue timing
            initial_prompt=initial_prompt,   # known-VO vocabulary bias
        )

        count = 0
        with out.open('w', encoding='utf-8') as fh:
            for seg in segments:
                text = (seg.text or '').strip()
                if not text:
                    continue
                count += 1
                fh.write(f'{count}\n{_ts(seg.start)} --> {_ts(seg.end)}\n{text}\n\n')

        if count == 0:
            _log('no speech segments produced — empty transcript')
            return 1
        _log(f'wrote {count} cues in {time.time() - t0:.1f}s → {out}')
        print(f'OK {out}')
        return 0
    except Exception as e:  # noqa: BLE001
        _log(f'transcription failed: {e!r}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
