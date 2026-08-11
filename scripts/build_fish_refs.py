"""Prepare Fish S2 sidecar references for library voices.

Fish S2 wants a 10-30s reference clip PLUS its transcript; longer clips
overflow the model's prompt budget (~21 audio tokens/sec). This script turns
any library voice reference into a pair of sidecar files next to the source:

    <stem>.fish_ref.wav   mono 44.1k clip, <=~28s, cut at a word boundary
    <stem>.fish_ref.txt   transcript of exactly that clip (UTF-8)

tts_fish_s2.py reads these sidecars at render time and refuses to run without
them, so run this once per new voice (or --all after importing several).

Run under the .venv-qwen3 python (needs faster-whisper):
    .venv-qwen3\\Scripts\\python.exe scripts\\build_fish_refs.py --all
    .venv-qwen3\\Scripts\\python.exe scripts\\build_fish_refs.py --ref data\\_voices\\<slug>\\voice_reference.mp3
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME', str(_PROJECT_ROOT / '.hf_cache'))
_FFMPEG = _PROJECT_ROOT / 'bin' / 'ffmpeg.exe'

MAX_REF_SEC = 28.0   # keep well under the ~30s guidance / prompt budget
MIN_REF_SEC = 8.0


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _asr_model_dir(asr_model: str) -> Path:
    """Same local-dir resolution as vo_transcribe_batch.py."""
    repo = f'Systran/faster-whisper-{asr_model}'
    tgt = _PROJECT_ROOT / 'checkpoints' / repo.split('/')[-1].replace('-', '_')
    if not (tgt / 'model.bin').exists():
        from huggingface_hub import snapshot_download
        _log(f'downloading {repo} → {tgt}')
        snapshot_download(repo, local_dir=str(tgt))
    return tgt


def _load_model(model_size: str, device: str):
    from faster_whisper import WhisperModel
    ctype = 'float16' if device == 'cuda' else 'int8'
    try:
        return WhisperModel(str(_asr_model_dir(model_size)), device=device, compute_type=ctype)
    except Exception as e:  # noqa: BLE001
        if device == 'cuda':
            _log(f'cuda load failed ({e!r}); falling back to CPU')
            return WhisperModel(str(_asr_model_dir(model_size)), device='cpu', compute_type='int8')
        raise


def build_one(model, ref: Path, force: bool) -> bool:
    wav_sc = ref.parent / f'{ref.stem}.fish_ref.wav'
    txt_sc = ref.parent / f'{ref.stem}.fish_ref.txt'
    if not force and wav_sc.exists() and txt_sc.exists() \
            and wav_sc.stat().st_mtime >= ref.stat().st_mtime:
        _log(f'skip {ref} (sidecars up to date)')
        return True

    segments, info = model.transcribe(str(ref), language='ru', word_timestamps=True,
                                      vad_filter=True)
    words: list[tuple[str, float, float]] = []
    for seg in segments:
        for w in seg.words or []:
            words.append((w.word.strip(), w.start, w.end))
    if not words:
        _log(f'ERROR {ref}: transcription produced no words')
        return False

    total = info.duration or words[-1][2]
    if total <= MAX_REF_SEC:
        cut_end = total
        kept = words
    else:
        # Prefer ending on terminal punctuation inside [MIN_REF_SEC, MAX_REF_SEC];
        # fall back to the last word that still fits.
        kept = [w for w in words if w[2] <= MAX_REF_SEC]
        if not kept:
            _log(f'ERROR {ref}: no word boundary before {MAX_REF_SEC}s')
            return False
        sentence_ends = [w for w in kept if w[2] >= MIN_REF_SEC and w[0].rstrip().endswith(('.', '!', '?', '…'))]
        last = sentence_ends[-1] if sentence_ends else kept[-1]
        cut_end = last[2] + 0.15
        kept = [w for w in kept if w[2] <= last[2] + 1e-3]

    transcript = ' '.join(w[0] for w in kept).strip()
    if not transcript:
        _log(f'ERROR {ref}: empty transcript after cut')
        return False

    r = subprocess.run(
        [str(_FFMPEG), '-y', '-i', str(ref), '-ss', '0', '-to', f'{cut_end:.2f}',
         '-ar', '44100', '-ac', '1', str(wav_sc)],
        capture_output=True,
    )
    if r.returncode != 0 or not wav_sc.exists():
        _log(f'ERROR {ref}: ffmpeg cut failed: {r.stderr.decode(errors="replace")[-300:]}')
        return False
    txt_sc.write_text(transcript + '\n', encoding='utf-8')
    _log(f'OK {ref.name}: {cut_end:.1f}s, {len(transcript)} chars → {wav_sc.name}')
    return True


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--ref', action='append', default=[],
                   help='Path to a specific reference file (repeatable)')
    p.add_argument('--all', action='store_true',
                   help='Process every data/_voices/*/voice_reference.* in the library')
    p.add_argument('--model', default='medium')
    p.add_argument('--device', default='cuda')
    p.add_argument('--force', action='store_true', help='Rebuild even if sidecars are fresh')
    args = p.parse_args()

    targets = [Path(r) for r in args.ref]
    if args.all:
        voices_dir = _PROJECT_ROOT / 'data' / '_voices'
        for d in sorted(voices_dir.iterdir()):
            for f in d.glob('voice_reference.*'):
                if f.suffix.lower() in ('.wav', '.mp3', '.flac', '.ogg', '.m4a'):
                    targets.append(f)
    if not targets:
        _log('nothing to do: pass --ref <file> or --all')
        return 2

    missing = [t for t in targets if not t.exists()]
    if missing:
        for t in missing:
            _log(f'missing: {t}')
        return 2

    model = _load_model(args.model, args.device)
    ok = all([build_one(model, t, args.force) for t in targets])
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
