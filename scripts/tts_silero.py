"""
Silero V5 ru TTS worker — pure local-file loading, zero network calls.

The model file (e.g. `v5_ru.pt`) must already be on disk under
`gen-studio/.silero_cache/` (override with env `SILERO_MODEL_PATH`).
Download once via any working network/VPN from one of:
    https://models.silero.ai/models/tts/ru/v5_ru.pt
    https://huggingface.co/imperialwool/silero-model-v3-ru/resolve/main/model.pt
    https://github.com/snakers4/silero-models#models
…and drop the .pt into the cache dir. After that this script never touches
the network — important on locked-down Russian ISPs that block github.com,
silero.ai, and HF Xet storage.

Inputs (CLI):
    --text-file PATH   UTF-8 text file with narration
    --out PATH         Where to write the .wav
    --voice NAME       aidar | baya | kseniya | xenia | eugene
    --sample-rate INT  8000 | 24000 | 48000 (default 48000)
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import torch


VOICES_V5_RU = {'aidar', 'baya', 'kseniya', 'xenia', 'eugene'}
SUPPORTED_SAMPLE_RATES = {8000, 24000, 48000}

# We accept any of these filenames in the cache dir. First match wins.
# v5_4_ru / v5_5_ru are preferred (question intonation), v5_ru is the base.
MODEL_FILENAMES = (
    'v5_5_ru.pt',
    'v5_4_ru.pt',
    'v5_3_ru.pt',
    'v5_2_ru.pt',
    'v5_ru.pt',
    'v4_ru.pt',
    'v3_ru.pt',
    'model.pt',     # whatever the HF mirror happens to name it
)


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _resolve_model_path() -> Path:
    """Locate the on-disk Silero .pt. Errors clearly if missing."""
    override = os.environ.get('SILERO_MODEL_PATH')
    if override:
        p = Path(override)
        if p.exists():
            return p
        raise FileNotFoundError(f'SILERO_MODEL_PATH points to {p}, but file is missing')

    cache_dir = Path(os.environ.get('SILERO_CACHE_DIR')
                     or str(Path(__file__).resolve().parent.parent / '.silero_cache'))
    for name in MODEL_FILENAMES:
        candidate = cache_dir / name
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f'No Silero model file found in {cache_dir}. '
        f'Looked for: {", ".join(MODEL_FILENAMES)}. '
        f'Download v5_ru.pt manually and drop it there (see scripts/tts_silero.py docstring).'
    )


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True)
    p.add_argument('--out',         required=True)
    p.add_argument('--voice',       default='eugene')
    p.add_argument('--sample-rate', type=int, default=48000)
    p.add_argument('--rate',        type=float, default=1.0,
                   help='Playback rate (1.0=normal, <1 slower, >1 faster). '
                        'Triggers SSML <prosody rate="X%%"> wrapping when != 1.0.')
    p.add_argument('--device',      default='cpu', choices=['cpu', 'cuda'])
    args = p.parse_args()

    if args.voice not in VOICES_V5_RU:
        _log(f'unknown voice {args.voice!r}; allowed: {sorted(VOICES_V5_RU)}')
        return 2
    if args.sample_rate not in SUPPORTED_SAMPLE_RATES:
        _log(f'sample rate {args.sample_rate} not supported; allowed: {sorted(SUPPORTED_SAMPLE_RATES)}')
        return 2

    text_path = Path(args.text_file)
    if not text_path.exists():
        _log(f'text file missing: {text_path}')
        return 2
    text = text_path.read_text(encoding='utf-8').strip()
    if not text:
        _log('text is empty')
        return 2

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        model_path = _resolve_model_path()
    except FileNotFoundError as e:
        _log(f'fatal: {e}')
        return 3

    device = torch.device(args.device)
    _log(f'loading silero from {model_path} on {device} '
         f'({len(text)} chars, voice={args.voice}, sr={args.sample_rate})')

    t0 = time.time()
    # PackageImporter loads the bundled torch.package format Silero ships in.
    # No GitHub, no torch.hub, no CDN calls.
    importer = torch.package.PackageImporter(str(model_path))
    model = importer.load_pickle('tts_models', 'model')
    model.to(device)
    _log(f'model loaded in {time.time() - t0:.1f}s')

    t0 = time.time()
    # Speed control via SSML when rate != 1.0. apply_ssml uses the same prosody
    # engine internally but supports <prosody rate="X%">. For normal speed we
    # stay on apply_tts (simpler, no XML escape concerns on raw text).
    if abs(args.rate - 1.0) < 0.01:
        audio = model.apply_tts(
            text=text,
            speaker=args.voice,
            sample_rate=args.sample_rate,
            put_accent=True,
            put_yo=True,
        )
    else:
        # XML-escape user text so any stray <>& don't break the SSML parse.
        import xml.sax.saxutils as _xml
        escaped = _xml.escape(text)
        rate_pct = int(round(args.rate * 100))
        ssml = f'<speak><prosody rate="{rate_pct}%">{escaped}</prosody></speak>'
        _log(f'using SSML wrapper at rate={rate_pct}%')
        audio = model.apply_ssml(
            ssml_text=ssml,
            speaker=args.voice,
            sample_rate=args.sample_rate,
            put_accent=True,
            put_yo=True,
        )
    _log(f'synthesised {audio.shape[0] / args.sample_rate:.1f}s of audio in {time.time() - t0:.1f}s')

    import soundfile as sf
    sf.write(str(out_path), audio.cpu().numpy(), args.sample_rate, subtype='PCM_16')
    _log(f'wrote {out_path} ({out_path.stat().st_size} bytes)')

    print(f'OK {out_path}', flush=True)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: {e!r}')
        sys.exit(1)
