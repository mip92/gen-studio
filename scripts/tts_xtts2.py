"""
XTTS-v2 worker — zero-shot voice cloning, multilingual incl. Russian.

Mirrors the CLI contract of tts_silero.py / tts_f5.py so the TTS service can
spawn this worker through the same path. Like F5 it is a voice-clone engine:
- XTTS has no categorical emotion presets — emotion = whatever's in the
  reference clip. We therefore IGNORE --emotion-preset and only honour
  --emotion-ref (if set, it becomes the speaker_wav for THIS render).
  Emotion-intensity is also ignored.
- Requires --language (default 'ru').

Weights live under the Coqui TTS cache (~/.cache/tts/ or
COQUI_TOS_AGREED-respecting path); ~2 GB downloaded on first run.

Outputs:
    On success → prints `OK <wav-path>` to stdout, exit 0.
    On failure → human-readable line to stderr, exit 1/2/3.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# Redirect Coqui + HuggingFace caches to project disk BEFORE any TTS / hf import.
# Default would put weights on `C:\Users\<u>\AppData\Local\tts` and
# `C:\Users\<u>\.cache\huggingface\` — both on system drive, ~2 GB.
# Override here so XTTS-v2 weights land on the project drive.
_PROJECT_ROOT  = Path(__file__).resolve().parent.parent
os.environ.setdefault('TTS_HOME', str(_PROJECT_ROOT / '.coqui_tts_cache'))
os.environ.setdefault('HF_HOME',  str(_PROJECT_ROOT / '.hf_cache'))
# Coqui's interactive TOS prompt is non-interactive in our pipeline.
os.environ.setdefault('COQUI_TOS_AGREED', '1')


SUPPORTED_SAMPLE_RATES = {16000, 22050, 24000, 44100, 48000}
DEFAULT_SAMPLE_RATE = 24000  # XTTS-v2 native output rate
# Languages XTTS-v2 supports per Coqui's model card.
ALLOWED_LANGUAGES = {
    'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru',
    'nl', 'cs', 'ar', 'zh-cn', 'hu', 'ko', 'ja', 'hi',
}


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _load_model(device: str):
    """Lazy-import TTS and load XTTS-v2. First call downloads ~2 GB to
    the Coqui cache dir."""
    try:
        # Coqui's `TTS` package (the maintained fork is `coqui-tts` on PyPI;
        # both expose the same top-level `TTS` module).
        from TTS.api import TTS
    except ImportError as e:
        raise RuntimeError(
            f'TTS package missing. Install with: '
            f'pip install coqui-tts (in the kohya venv). '
            f'Underlying import error: {e!r}'
        ) from e

    _log(f'loading XTTS-v2 on device={device} (TTS_HOME={os.environ.get("TTS_HOME")})')
    t0 = time.time()
    use_gpu = device.startswith('cuda')
    model = TTS('tts_models/multilingual/multi-dataset/xtts_v2', gpu=use_gpu)
    _log(f'XTTS-v2 loaded in {time.time() - t0:.1f}s')
    return model


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True,
                   help='UTF-8 text file with the narration')
    p.add_argument('--out',         required=True,
                   help='Output wav path; parent dir is created on demand')
    p.add_argument('--voice-ref',   required=True,
                   help='Path to a wav/mp3 of the target speaker (6-15s clean)')
    p.add_argument('--language',    default='ru',
                   help=f'ISO code from XTTS-v2 supported list ({sorted(ALLOWED_LANGUAGES)}); default ru')
    p.add_argument('--emotion-ref', default=None,
                   help='Optional emotion-reference wav. If set, REPLACES --voice-ref '
                        'as the speaker for this render (XTTS has no separate emotion path).')
    # The two below are accepted for parity with the shared voice-clone CLI
    # contract, but XTTS-v2 has no categorical emotion model and no intensity
    # scalar. We log a line and ignore them so the service stays engine-agnostic.
    p.add_argument('--emotion-preset',    default=None, help='IGNORED for XTTS')
    p.add_argument('--emotion-intensity', type=float, default=None, help='IGNORED for XTTS')
    p.add_argument('--sample-rate', type=int, default=DEFAULT_SAMPLE_RATE,
                   choices=sorted(SUPPORTED_SAMPLE_RATES),
                   help='Output sample rate. XTTS native is 24 kHz; we resample if requested differs.')
    p.add_argument('--device',      default='cuda', choices=['cpu', 'cuda'])
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

    if args.language not in ALLOWED_LANGUAGES:
        _log(f'language {args.language!r} not in XTTS-v2 list: {sorted(ALLOWED_LANGUAGES)}')
        return 2

    # Pick the speaker_wav: emotion-ref wins over voice-ref. This is XTTS-v2's
    # only knob for changing tone — it doesn't accept multiple references.
    speaker_wav = Path(args.emotion_ref) if args.emotion_ref else Path(args.voice_ref)
    if not speaker_wav.exists():
        _log(f'speaker reference missing: {speaker_wav}')
        return 2

    if args.emotion_preset:
        _log(f'note: --emotion-preset={args.emotion_preset!r} ignored by XTTS-v2 (only emotion-ref affects tone)')

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # ── Model load ───────────────────────────────────────────────────────
    try:
        model = _load_model(args.device)
    except RuntimeError as e:
        _log(f'fatal: {e}')
        return 3

    # ── Inference ────────────────────────────────────────────────────────
    _log(f'synthesising {len(text)} chars (lang={args.language}, speaker_wav={speaker_wav.name})')
    t0 = time.time()
    model.tts_to_file(
        text=text,
        speaker_wav=str(speaker_wav),
        language=args.language,
        file_path=str(out_path),
    )
    _log(f'synthesised in {time.time() - t0:.1f}s → {out_path}')

    # ── Resample to requested sr if needed ───────────────────────────────
    try:
        import soundfile as sf
        info = sf.info(str(out_path))
    except Exception as e:
        _log(f'warning: could not probe output sample rate: {e!r}')
        info = None
    if info is not None and info.samplerate != args.sample_rate:
        _log(f'resampling {info.samplerate} → {args.sample_rate} Hz')
        try:
            import numpy as np
            import librosa
            wav, sr = sf.read(str(out_path), always_2d=False)
            wav_rs = librosa.resample(np.asarray(wav, dtype=np.float32), orig_sr=sr, target_sr=args.sample_rate)
            sf.write(str(out_path), wav_rs, args.sample_rate, subtype='PCM_16')
        except ImportError:
            _log('librosa not installed; leaving file at native rate. pip install librosa to fix.')

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
