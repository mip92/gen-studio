"""
Silero V5 ru text-to-speech worker.

Spawned by NestJS TTSService.dispatchPending() — runs in the kohya/ComfyUI
venv (we reuse PYTHON_BIN env). CPU-only by default so it doesn't fight ComfyUI
for the GPU.

Inputs (CLI):
    --text-file PATH   UTF-8 text file with narration
    --out PATH         Where to write the .wav
    --voice NAME       aidar | baya | kseniya | xenia | eugene | random
                       (V5 ru speaker ids; default: eugene — calm male voice
                       that reads documentary narration well)
    --sample-rate INT  8000 | 24000 | 48000 (default 48000)

Why we accept text via a file, not argv: scenes can be 1-3 minutes of prose,
which blows past Windows' ~32k argv limit and triggers cp1251 mangling.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import torch


VOICES_V5_RU = {'aidar', 'baya', 'kseniya', 'xenia', 'eugene', 'random'}
SUPPORTED_SAMPLE_RATES = {8000, 24000, 48000}


def _log(msg: str) -> None:
    # stderr so NestJS captures it for the row's errorMessage when things fail,
    # but stdout completion lines stay clean for parseable output.
    print(msg, file=sys.stderr, flush=True)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True)
    p.add_argument('--out',         required=True)
    p.add_argument('--voice',       default='eugene')
    p.add_argument('--sample-rate', type=int, default=48000)
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

    device = torch.device(args.device)
    _log(f'loading silero V5 ru on {device} ({len(text)} chars, voice={args.voice}, sr={args.sample_rate})')

    # Cache the model under the gen-studio repo so re-runs don't re-download.
    # torch.hub.set_dir affects torch.hub.load only — Silero ships as a hub repo.
    cache_dir = os.environ.get('SILERO_CACHE_DIR') or str(Path(__file__).resolve().parent.parent / '.silero_cache')
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    torch.hub.set_dir(cache_dir)

    t0 = time.time()
    model, _example = torch.hub.load(
        repo_or_dir='snakers4/silero-models',
        model='silero_tts',
        language='ru',
        speaker='v5_ru',           # V5 Russian model id
        trust_repo=True,
    )
    model.to(device)
    _log(f'model loaded in {time.time() - t0:.1f}s')

    # apply_tts handles paragraph-level chunking; for very long text we'd split
    # ourselves, but a single scene narration (~1-3 min ≈ ≤2000 chars) is fine
    # for Silero's internal handling.
    t0 = time.time()
    audio = model.apply_tts(
        text=text,
        speaker=args.voice,
        sample_rate=args.sample_rate,
        put_accent=True,        # V5 ru: automatic stress placement
        put_yo=True,            # ё restoration
    )
    _log(f'synthesised {audio.shape[0] / args.sample_rate:.1f}s of audio in {time.time() - t0:.1f}s')

    # Silero returns a 1-D float tensor in [-1, 1]. Convert to int16 PCM and save.
    import soundfile as sf
    sf.write(str(out_path), audio.cpu().numpy(), args.sample_rate, subtype='PCM_16')
    _log(f'wrote {out_path} ({out_path.stat().st_size} bytes)')

    # Single machine-readable line on stdout so the caller doesn't have to parse logs.
    print(f'OK {out_path}', flush=True)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: {e!r}')
        sys.exit(1)
