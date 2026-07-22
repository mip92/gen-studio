"""
Qwen3-TTS worker — zero-shot voice cloning (Qwen/Qwen3-TTS-12Hz-1.7B-Base).

Mirrors the CLI contract of tts_f5.py / tts_xtts2.py so the TTS service can
spawn this worker through the same voice-clone path. WHO speaks comes from
--voice-ref (the project voice reference clip); --emotion-ref (if set) REPLACES
--voice-ref as the speaker clip for this render. There is no categorical
emotion model on the Base variant, so --emotion-preset / --emotion-intensity
are accepted-and-ignored. --speed is likewise accepted-and-ignored: Qwen3-TTS
has no synthesis-speed knob (its own prosody model paces the read).

Qwen-specific differences from F5:
- NO RUAccent. The Russian F5 fine-tune was trained on `+`-stress-marked text;
  Qwen3-TTS was not — stress marks would leak into the audio as noise. Qwen's
  LLM text frontend resolves homograph stress itself.
- The clone prompt wants a SHORT reference (~3-15s) plus its transcript. Project
  refs are 40s-3.5min clips, so we cut a cached speech segment next to the
  source ref (.qwen_ref_<stem>.wav) and transcribe it once with faster-whisper
  (.qwen_ref_<stem>.txt). Both are reused across every shot of the project.
  If ASR is unavailable the worker falls back to x-vector-only cloning
  (no transcript, slightly weaker similarity) rather than failing the job.

Weights resolve from HF cache (gen-studio/.hf_cache) — pre-downloaded by the
venv bootstrap; first run would otherwise pull ~4.5GB.

Runs in its own venv (gen-studio/.venv-qwen3, python 3.12 + torch cu128) — the
kohya venv the other engines share is too old for Blackwell-era torch.

Outputs:
    On success → prints `OK <wav-path>` to stdout, exit 0.
    On failure → human-readable line to stderr, exit 1/2/3.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

# Keep every model cache on the project drive (mirrors tts_f5.py). Must be set
# BEFORE importing qwen_tts / transformers / huggingface_hub.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME', str(_PROJECT_ROOT / '.hf_cache'))
os.environ.setdefault('TORCH_HOME', str(_PROJECT_ROOT / '.torch_cache'))
os.environ.setdefault('USE_TF', '0')
os.environ.setdefault('USE_FLAX', '0')
os.environ.setdefault('TRANSFORMERS_NO_ADVISORY_WARNINGS', '1')
_BIN_DIR = _PROJECT_ROOT / 'bin'
if _BIN_DIR.exists():
    os.environ['PATH'] = str(_BIN_DIR) + os.pathsep + os.environ.get('PATH', '')

DEFAULT_MODEL = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'
SUPPORTED_SAMPLE_RATES = {16000, 22050, 24000, 44100, 48000}
DEFAULT_SAMPLE_RATE = 24000
# Clone-prompt segment cut from the (much longer) project reference clip.
MIN_REF_SEC = 6.0
DEFAULT_MAX_REF_SEC = 12.0


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _prepare_ref(src: Path, max_sec: float) -> Path:
    """Cut a short, speech-leading mono segment out of the project reference
    clip and cache it next to the source (.qwen_ref_<stem>.wav). Project refs
    run 40s-3.5min; Qwen's clone prompt wants ~3-15s. We skip leading silence,
    then cut at the quietest point between MIN_REF_SEC and max_sec so we don't
    chop mid-word. Cached by mtime — decoded once per voice, not per shot."""
    out = src.parent / f'.qwen_ref_{src.stem}.wav'
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
        return out
    import numpy as np
    import soundfile as sf
    data, sr = sf.read(str(src), always_2d=True)
    mono = data.mean(axis=1).astype('float32')

    # 50ms RMS envelope → find where speech starts (first window above 10% of
    # the clip's 95th-percentile loudness).
    win = max(1, int(sr * 0.05))
    n_win = max(1, len(mono) // win)
    env = np.sqrt(np.mean(
        mono[: n_win * win].reshape(n_win, win) ** 2, axis=1))
    thresh = np.percentile(env, 95) * 0.1
    loud = np.flatnonzero(env > thresh)
    start_win = int(loud[0]) if len(loud) else 0
    start = start_win * win

    seg = mono[start: start + int(sr * max_sec)]
    if len(seg) > int(sr * MIN_REF_SEC):
        # End on the quietest 50ms window after MIN_REF_SEC — a pause, not a word.
        tail_env = env[start_win + int(MIN_REF_SEC / 0.05):
                       start_win + int(max_sec / 0.05)]
        if len(tail_env):
            cut_win = int(np.argmin(tail_env)) + int(MIN_REF_SEC / 0.05)
            seg = mono[start: start + cut_win * win]
    sf.write(str(out), seg, sr, subtype='PCM_16')
    _log(f'clone ref {src.name} → {out.name} ({len(seg) / sr:.1f}s @ {sr}Hz)')
    return out


def _asr_model_dir(asr_model: str) -> Path:
    """Resolve faster-whisper weights to a PLAIN local dir under checkpoints/.
    The HF cache layout wants symlinks, and on this machine os.symlink raises
    WinError 1314 (no SeCreateSymbolicLinkPrivilege) once a partial download
    exists — local_dir mode writes real files and never symlinks."""
    if '/' in asr_model or os.sep in asr_model:  # full repo id or explicit path
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


def _ref_transcript(ref_wav: Path, asr_model: str) -> str:
    """Transcribe the (short) clone-prompt segment once with faster-whisper and
    cache the text next to it. Best-effort: '' on any failure → caller falls
    back to x-vector-only cloning."""
    cache = ref_wav.with_suffix('.txt')
    if cache.exists() and cache.stat().st_mtime >= ref_wav.stat().st_mtime:
        return cache.read_text(encoding='utf-8').strip()
    try:
        from faster_whisper import WhisperModel
        t0 = time.time()
        # CPU int8 — the segment is ≤15s, and VRAM stays free for the TTS model.
        model = WhisperModel(str(_asr_model_dir(asr_model)), device='cpu', compute_type='int8')
        segments, _info = model.transcribe(str(ref_wav), language='ru')
        text = ' '.join(s.text.strip() for s in segments).strip()
        cache.write_text(text, encoding='utf-8')
        _log(f'transcribed clone ref in {time.time() - t0:.1f}s: {text[:80]!r}')
        return text
    except Exception as e:  # noqa: BLE001
        _log(f'warning: reference ASR failed ({e!r}); falling back to x-vector-only cloning')
        return ''


def _load_model(model_id: str, device: str):
    try:
        import torch
        from qwen_tts import Qwen3TTSModel
    except ImportError as e:
        raise RuntimeError(
            f'qwen-tts package missing. Install with: pip install qwen-tts '
            f'(in gen-studio/.venv-qwen3). Underlying import error: {e!r}'
        ) from e
    _log(f'loading Qwen3-TTS ({model_id}, device={device})')
    t0 = time.time()
    kwargs = dict(
        device_map=device,
        dtype=torch.bfloat16 if device != 'cpu' else torch.float32,
    )
    try:
        # No flash-attn on Windows/Blackwell — sdpa is the fast portable path.
        model = Qwen3TTSModel.from_pretrained(
            model_id, attn_implementation='sdpa', **kwargs)
    except (TypeError, ValueError):
        model = Qwen3TTSModel.from_pretrained(model_id, **kwargs)
    _log(f'Qwen3-TTS loaded in {time.time() - t0:.1f}s')
    return model


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True, help='UTF-8 text file with the narration')
    p.add_argument('--out',         required=True, help='Output wav path; parent dir created on demand')
    p.add_argument('--voice-ref',   required=True, help='Path to a wav/mp3 of the target speaker')
    p.add_argument('--ref-text',    default='',
                   help='Transcript of the reference clip. Empty (default) => faster-whisper auto-transcribes.')
    p.add_argument('--emotion-ref', default=None,
                   help='Optional emotion-reference clip. If set, REPLACES --voice-ref as the speaker for this render.')
    # Accepted for CLI parity with the voice-clone contract — logged and ignored.
    p.add_argument('--emotion-preset',    default=None, help='IGNORED for Qwen3-TTS Base')
    p.add_argument('--emotion-intensity', type=float, default=None, help='IGNORED for Qwen3-TTS Base')
    p.add_argument('--speed', type=float, default=None,
                   help='IGNORED — Qwen3-TTS has no synthesis-speed knob.')
    p.add_argument('--sentence-pause-sec', type=float, default=0.0,
                   help='Insert N seconds of silence after every sentence boundary '
                        '([.!?…]+). 0 = off. Text is split, each sentence synthesised '
                        'separately, then concatenated (mirrors tts_f5.py).')
    p.add_argument('--sample-rate', type=int, default=DEFAULT_SAMPLE_RATE,
                   choices=sorted(SUPPORTED_SAMPLE_RATES),
                   help='Output sample rate; we resample if the model output differs.')
    p.add_argument('--model',    default=DEFAULT_MODEL, help='HF model id or local path')
    p.add_argument('--language', default='Russian', help='Narration language as Qwen names it')
    p.add_argument('--max-ref-sec', type=float, default=DEFAULT_MAX_REF_SEC,
                   help='Max length of the clone-prompt segment cut from the reference')
    p.add_argument('--asr-model', default='small',
                   help='faster-whisper model for the one-time reference transcription')
    p.add_argument('--device', default='cuda', choices=['cpu', 'cuda'])
    args = p.parse_args()

    # ── Input validation ─────────────────────────────────────────────────
    text_path = Path(args.text_file)
    if not text_path.exists():
        _log(f'text file missing: {text_path}')
        return 2
    text = text_path.read_text(encoding='utf-8').strip()
    if not text:
        _log('text is empty')
        return 2

    speaker_src = Path(args.emotion_ref) if args.emotion_ref else Path(args.voice_ref)
    if not speaker_src.exists():
        _log(f'speaker reference missing: {speaker_src}')
        return 2
    if args.emotion_preset:
        _log(f'note: --emotion-preset={args.emotion_preset!r} ignored by Qwen3-TTS (only emotion-ref affects tone)')
    if args.speed is not None and args.speed != 1.0:
        _log(f'note: --speed={args.speed} ignored — Qwen3-TTS has no speed knob')

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # ── Clone prompt: short segment + transcript, both cached per voice ──
    try:
        ref_wav = _prepare_ref(speaker_src, args.max_ref_sec)
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: could not prepare reference clip: {e!r}')
        return 2
    ref_text = args.ref_text.strip() or _ref_transcript(ref_wav, args.asr_model)

    # ── Model load ───────────────────────────────────────────────────────
    try:
        model = _load_model(args.model, args.device)
    except RuntimeError as e:
        _log(f'fatal: {e}')
        return 3

    # ── Inference ────────────────────────────────────────────────────────
    import numpy as np
    import soundfile as sf

    try:
        if ref_text:
            prompt = model.create_voice_clone_prompt(
                ref_audio=str(ref_wav), ref_text=ref_text)
        else:
            prompt = model.create_voice_clone_prompt(
                ref_audio=str(ref_wav), x_vector_only_mode=True)
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: could not build voice-clone prompt: {e!r}')
        return 1

    chunks = [c.strip() for c in re.split(r'(?<=[.!?…])\s+', text) if c.strip()] or [text]
    use_pauses = args.sentence_pause_sec > 0 and len(chunks) > 1

    _log(f'synthesising {len(text)} chars (speaker={ref_wav.name}, lang={args.language}, '
         f'{"pauses=%.2fs over %d chunks" % (args.sentence_pause_sec, len(chunks)) if use_pauses else "single pass"}, '
         f'ref_text={"<x-vector-only>" if not ref_text else f"{len(ref_text)} chars"})')
    t0 = time.time()
    try:
        if use_pauses:
            pieces: list = []
            native_sr = DEFAULT_SAMPLE_RATE
            for i, chunk in enumerate(chunks):
                t_chunk = time.time()
                wavs, native_sr = model.generate_voice_clone(
                    text=chunk, language=args.language, voice_clone_prompt=prompt)
                _log(f'  chunk {i+1}/{len(chunks)} ({len(chunk)} chars) in {time.time()-t_chunk:.1f}s')
                pieces.append(np.asarray(wavs[0], dtype=np.float32))
                # No trailing pause after the final sentence.
                if i < len(chunks) - 1:
                    pieces.append(np.zeros(int(round(native_sr * args.sentence_pause_sec)), dtype=np.float32))
            wav = np.concatenate(pieces)
        else:
            wavs, native_sr = model.generate_voice_clone(
                text=text, language=args.language, voice_clone_prompt=prompt)
            wav = np.asarray(wavs[0], dtype=np.float32)
    except Exception as e:  # noqa: BLE001
        _log(f'inference failed: {e!r}')
        return 1
    _log(f'synthesised in {time.time() - t0:.1f}s ({len(wav) / native_sr:.1f}s audio @ {native_sr}Hz)')

    # ── Resample to requested sr if needed ───────────────────────────────
    if native_sr != args.sample_rate:
        _log(f'resampling {native_sr} → {args.sample_rate} Hz')
        try:
            import librosa
            wav = librosa.resample(wav, orig_sr=native_sr, target_sr=args.sample_rate)
            native_sr = args.sample_rate
        except ImportError:
            _log('librosa not installed; leaving file at native rate. pip install librosa to fix.')

    sf.write(str(out_path), wav, native_sr, subtype='PCM_16')
    if not out_path.exists():
        _log(f'output not written: {out_path}')
        return 1
    _log(f'wrote {out_path} ({out_path.stat().st_size} bytes)')
    print(f'OK {out_path}', flush=True)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: {e!r}')
        sys.exit(1)
