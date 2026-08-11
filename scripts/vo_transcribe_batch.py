#!/usr/bin/env python
"""Batch-transcribe narration wavs for VO validation with faster-whisper.

Runs in gen-studio/.venv-qwen3 (same venv as transcribe_srt.py). Loads the ASR
model ONCE, then loops over every wav in the manifest, streaming one NDJSON
line per finished item to stdout (flushed immediately) so the Nest service can
persist verdicts incrementally — a killed batch loses nothing already emitted.

Usage:
    python vo_transcribe_batch.py --manifest <in.json>
                                  [--model medium] [--device cuda] [--language ru]
                                  [--initial-prompt-file glossary.txt]

manifest (UTF-8 JSON): {"jobs": [{"id": "<ttsJobId>", "wav": "<abs path>"}, ...]}

stdout, one line per job (UTF-8 NDJSON):
    {"id": "...", "ok": true, "transcript": "...",
     "words": [["слово", 0.12, 0.34, 0.91], ...],   # [word, start, end, prob]
     "durationSec": 4.8}
    {"id": "...", "ok": false, "error": "..."}       # per-item failure, batch continues
final line: {"done": true, "count": N}

stderr: progress/log lines. Exit 0 unless the model itself fails to load.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from pathlib import Path

# Keep model caches on the project drive (mirrors transcribe_srt.py). Set before
# any huggingface_hub import.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME', str(_PROJECT_ROOT / '.hf_cache'))
os.environ.setdefault('USE_TF', '0')
os.environ.setdefault('USE_FLAX', '0')
_BIN_DIR = _PROJECT_ROOT / 'bin'
if _BIN_DIR.exists():
    os.environ['PATH'] = str(_BIN_DIR) + os.pathsep + os.environ.get('PATH', '')

DEFAULT_MODEL = 'medium'   # matches the caption pipeline; short clips are fast on CUDA


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _asr_model_dir(asr_model: str) -> Path:
    """Resolve faster-whisper weights to a PLAIN local dir under checkpoints/
    (mirrors transcribe_srt.py — local_dir mode avoids Windows symlink
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--manifest', required=True, help='UTF-8 JSON manifest with {"jobs":[{"id","wav"}]}')
    ap.add_argument('--model', default=DEFAULT_MODEL, help='faster-whisper model')
    ap.add_argument('--device', default='cuda', help="'cuda' (falls back to CPU) or 'cpu'")
    ap.add_argument('--language', default='ru')
    ap.add_argument('--initial-prompt-file', default=None,
                    help='UTF-8 glossary file (known-VO vocabulary bias)')
    ap.add_argument('--compute-type', default='', help='override; float16 on cuda, int8 on cpu')
    args = ap.parse_args()

    out = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', newline='\n')

    def emit(obj: dict) -> None:
        out.write(json.dumps(obj, ensure_ascii=False) + '\n')
        out.flush()

    try:
        jobs = json.loads(Path(args.manifest).read_text(encoding='utf-8')).get('jobs', [])
    except Exception as e:  # noqa: BLE001
        _log(f'cannot read manifest: {e!r}')
        return 1

    initial_prompt = None
    if args.initial_prompt_file:
        try:
            initial_prompt = Path(args.initial_prompt_file).read_text(encoding='utf-8').strip() or None
        except Exception as e:  # noqa: BLE001
            _log(f'could not read initial-prompt-file: {e!r}')

    # cuDNN/cuBLAS DLL wiring for CTranslate2 — copied from transcribe_srt.py.
    def _add_dll_dir(p: Path) -> None:
        if p.exists():
            os.environ['PATH'] = str(p) + os.pathsep + os.environ.get('PATH', '')
    try:
        import nvidia   # namespace package → __path__, not __file__
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

    device = args.device
    try:
        model, ctype = _load(device)
    except Exception as e:  # noqa: BLE001
        if device != 'cpu':
            _log(f'{device} load failed ({e!r}); falling back to CPU int8')
            device = 'cpu'
            try:
                model, ctype = _load(device)
            except Exception as e2:  # noqa: BLE001
                _log(f'model load failed on CPU too: {e2!r}')
                return 1
        else:
            _log(f'model load failed: {e!r}')
            return 1
    _log(f'model {args.model} loaded (device={device}/{ctype}); {len(jobs)} wav(s) to transcribe')

    count = 0
    for job in jobs:
        job_id = str(job.get('id', ''))
        wav    = str(job.get('wav', ''))
        t0 = time.time()
        try:
            if not job_id or not wav:
                raise ValueError('manifest entry missing id/wav')
            if not Path(wav).exists():
                raise FileNotFoundError(f'wav not found: {wav}')
            segments, info = model.transcribe(
                wav,
                language=args.language,
                vad_filter=True,
                word_timestamps=True,
                initial_prompt=initial_prompt,
            )
            words: list = []
            texts: list[str] = []
            for seg in segments:
                if seg.text and seg.text.strip():
                    texts.append(seg.text.strip())
                for w in (seg.words or []):
                    token = (w.word or '').strip()
                    if token:
                        words.append([token, round(w.start, 3), round(w.end, 3),
                                      round(float(w.probability or 0), 3)])
            emit({
                'id': job_id,
                'ok': True,
                'transcript': ' '.join(texts),
                'words': words,
                'durationSec': round(float(getattr(info, 'duration', 0.0) or 0.0), 3),
            })
            count += 1
            _log(f'{job_id}: {len(words)} words in {time.time() - t0:.1f}s')
        except Exception as e:  # noqa: BLE001 — degrade per item, never abort the batch
            emit({'id': job_id, 'ok': False, 'error': f'{type(e).__name__}: {e}'})
            count += 1
            _log(f'{job_id}: FAILED — {e!r}')

    emit({'done': True, 'count': count})
    return 0


if __name__ == '__main__':
    sys.exit(main())
