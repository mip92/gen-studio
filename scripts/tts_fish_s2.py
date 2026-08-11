"""Fish Audio S2-pro worker — zero-shot voice cloning with strong RU prosody.

Mirrors the CLI contract of tts_f5.py so TTSService spawns this worker through
the same voice-clone path. Unlike the other engines this worker does NOT load
the model itself: synthesis runs on a persistent local fish-speech api_server
(the model is 9GB VRAM / ~5 min load — loading per job would be absurd). The
worker health-checks the server and AUTOSTARTS it when it is down; the server
frees the GPU by exiting on its own after FISH_S2_IDLE_TIMEOUT_SEC of silence.

Reference clips: fish wants a 10-30s reference WITH its transcript. Long refs
overflow the prompt budget (~21 audio tokens/sec). We therefore read sidecar
files prepared by scripts/build_fish_refs.py next to the project voice ref:

    <ref-dir>/<ref-stem>.fish_ref.wav   trimmed <=30s mono clip
    <ref-dir>/<ref-stem>.fish_ref.txt   its transcript (UTF-8)

If the sidecars are missing the worker fails with a clear message instead of
guessing (a wrong/empty transcript audibly degrades the clone).

Contract additions vs f5:
- --speed is applied as ffmpeg `atempo` post-processing (the model has no
  speed knob); pitch is preserved. 1.0 = no-op.
- --sentence-pause-sec 0 (the fish default) synthesises the WHOLE text in one
  request: the model sees the full shot and shapes prosody/pauses itself.
  A positive value falls back to per-sentence synthesis + silence concat.
- Emotion `[tag]` markup, if we ever pass any, is part of the text itself.

Env (all optional):
    FISH_S2_URL                default http://127.0.0.1:8880
    FISH_S2_REPO               default W:\\Programs\\fish-speech-int4-patch
    FISH_S2_PYTHON             default <repo>\\.venv\\Scripts\\python.exe
    FISH_S2_CHECKPOINT         default <repo>\\checkpoints\\s2-pro-full
    FISH_S2_AUTOSTART          default 1
    FISH_S2_STARTUP_TIMEOUT_SEC default 720 (model load takes ~5 min cold)
    FISH_S2_IDLE_TIMEOUT_SEC   default 900 (server self-terminates, frees VRAM)

Outputs: `OK <wav-path>` on stdout + exit 0; message to stderr + exit 1/2/3.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_FFMPEG = _PROJECT_ROOT / 'bin' / 'ffmpeg.exe'

FISH_URL     = os.environ.get('FISH_S2_URL', 'http://127.0.0.1:8880').rstrip('/')
FISH_REPO    = Path(os.environ.get('FISH_S2_REPO', r'W:\Programs\fish-speech-int4-patch'))
FISH_PYTHON  = Path(os.environ.get('FISH_S2_PYTHON', str(FISH_REPO / '.venv' / 'Scripts' / 'python.exe')))
FISH_CKPT    = Path(os.environ.get('FISH_S2_CHECKPOINT', str(FISH_REPO / 'checkpoints' / 's2-pro-full')))
AUTOSTART    = os.environ.get('FISH_S2_AUTOSTART', '1') != '0'
STARTUP_SEC  = int(os.environ.get('FISH_S2_STARTUP_TIMEOUT_SEC', '720'))
IDLE_SEC     = int(os.environ.get('FISH_S2_IDLE_TIMEOUT_SEC', '900'))

# First request after server (re)start pays the ~5 min model load; later
# requests take seconds. One generous timeout covers both.
REQUEST_TIMEOUT_SEC = STARTUP_SEC + 300

DEFAULT_SAMPLE_RATE = 44100  # fish native output rate


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _health_ok(timeout: float = 2.0) -> bool:
    try:
        urllib.request.urlopen(f'{FISH_URL}/v1/health', timeout=timeout)
        return True
    except Exception:
        return False


def _ensure_server() -> bool:
    """Health-check the fish api_server; spawn it detached when down."""
    if _health_ok():
        return True
    if not AUTOSTART:
        _log(f'fish server is down at {FISH_URL} and FISH_S2_AUTOSTART=0')
        return False
    if not FISH_PYTHON.exists():
        _log(f'fish venv python missing: {FISH_PYTHON} (set FISH_S2_PYTHON)')
        return False
    if not (FISH_CKPT / 'config.json').exists():
        _log(f'fish checkpoint missing: {FISH_CKPT} (set FISH_S2_CHECKPOINT)')
        return False

    listen = FISH_URL.split('//', 1)[-1]
    log_path = FISH_REPO / 'server_autostart.log'
    _log(f'starting fish api_server on {listen} (log: {log_path})')
    env = {**os.environ, 'PYTORCH_CUDA_ALLOC_CONF': 'expandable_segments:True'}
    creation = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS  # type: ignore[attr-defined]
    with open(log_path, 'ab') as log_f:
        subprocess.Popen(
            [str(FISH_PYTHON), 'tools/api_server.py',
             '--llama-checkpoint-path', str(FISH_CKPT),
             '--decoder-checkpoint-path', str(FISH_CKPT / 'codec.pth'),
             '--decoder-config-name', 'modded_dac_vq',
             '--device', 'cuda', '--half', '--lazy-load',
             '--idle-timeout-seconds', str(IDLE_SEC),
             '--max-seq-len', '4096',
             '--listen', listen],
            cwd=str(FISH_REPO), env=env, creationflags=creation,
            stdout=log_f, stderr=log_f, stdin=subprocess.DEVNULL,
        )
    deadline = time.time() + 120  # HTTP comes up fast; the MODEL loads lazily on first request
    while time.time() < deadline:
        if _health_ok():
            _log('fish server is up (model loads lazily on first request)')
            return True
        time.sleep(2)
    _log('fish server did not come up within 120s — see server_autostart.log')
    return False


def _resolve_reference(speaker: Path) -> tuple[Path, str] | None:
    """Return (clip, transcript) from build_fish_refs.py sidecars."""
    wav_sc = speaker.parent / f'{speaker.stem}.fish_ref.wav'
    txt_sc = speaker.parent / f'{speaker.stem}.fish_ref.txt'
    if wav_sc.exists() and txt_sc.exists():
        text = txt_sc.read_text(encoding='utf-8').strip()
        if text:
            return wav_sc, text
        _log(f'sidecar transcript is empty: {txt_sc}')
        return None
    _log(f'fish sidecar reference missing for {speaker.name}: expected '
         f'{wav_sc.name} + {txt_sc.name} in {speaker.parent}. '
         f'Run: python scripts/build_fish_refs.py --ref "{speaker}"')
    return None


def _synth(text: str, ref_clip_bytes: bytes, ref_text: str) -> bytes:
    """One /v1/tts round-trip; returns wav bytes or raises."""
    import ormsgpack
    payload = {
        'text': text,
        'references': [{'audio': ref_clip_bytes, 'text': ref_text}],
        'reference_id': None,
        'format': 'wav',
        'max_new_tokens': 1024,
        'chunk_length': 300,
        'top_p': 0.8,
        'repetition_penalty': 1.1,
        'temperature': 0.8,
        'streaming': False,
        'use_memory_cache': 'on',  # reference is encoded once per server life
        'seed': None,              # random: re-render should give a fresh take
    }
    req = urllib.request.Request(
        f'{FISH_URL}/v1/tts?format=msgpack',
        data=ormsgpack.packb(payload),
        headers={'content-type': 'application/msgpack'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
        return resp.read()


_SENTENCE_SPLIT = re.compile(r'(?<=[.!?…])\s+')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True)
    p.add_argument('--out',         required=True)
    p.add_argument('--voice-ref',   required=True)
    p.add_argument('--ref-text',    default='', help='IGNORED: transcript comes from the .fish_ref.txt sidecar')
    p.add_argument('--emotion-ref', default=None,
                   help='Optional clip that REPLACES --voice-ref (needs its own sidecars)')
    p.add_argument('--emotion-preset',    default=None, help='IGNORED for fish (tone = reference + inline [tags])')
    p.add_argument('--emotion-intensity', type=float, default=None, help='IGNORED for fish')
    p.add_argument('--speed', type=float, default=1.0,
                   help='Applied as ffmpeg atempo post-processing (pitch preserved)')
    p.add_argument('--sentence-pause-sec', type=float, default=0.0,
                   help='0 (default) = whole text in ONE request, model shapes pauses itself. '
                        '>0 = per-sentence synthesis + explicit silence (f5-style).')
    p.add_argument('--sample-rate', type=int, default=DEFAULT_SAMPLE_RATE)
    p.add_argument('--device', default='cuda', help='IGNORED (server owns the device)')
    args = p.parse_args()

    text_path = Path(args.text_file)
    if not text_path.exists():
        _log(f'text file missing: {text_path}')
        return 2
    text = text_path.read_text(encoding='utf-8').strip()
    if not text:
        _log('text is empty')
        return 2

    speaker = Path(args.emotion_ref) if args.emotion_ref else Path(args.voice_ref)
    if not speaker.exists():
        _log(f'speaker reference missing: {speaker}')
        return 2
    if args.emotion_preset and args.emotion_preset != 'neutral':
        _log(f'note: --emotion-preset={args.emotion_preset!r} ignored by fish '
             f'(use inline [tags] in the text or an emotion-ref clip)')

    resolved = _resolve_reference(speaker)
    if resolved is None:
        return 2
    ref_clip, ref_text = resolved
    ref_bytes = ref_clip.read_bytes()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not _ensure_server():
        return 3

    chunks = [c.strip() for c in _SENTENCE_SPLIT.split(text) if c.strip()] or [text]
    use_pauses = args.sentence_pause_sec > 0 and len(chunks) > 1

    _log(f'synthesising {len(text)} chars via {FISH_URL} (ref={ref_clip.name}, '
         f'{"pauses=%.2fs over %d chunks" % (args.sentence_pause_sec, len(chunks)) if use_pauses else "single pass"})')
    t0 = time.time()
    try:
        import io

        import numpy as np
        import soundfile as sf

        if use_pauses:
            pieces: list = []
            native_sr = DEFAULT_SAMPLE_RATE
            for i, chunk in enumerate(chunks):
                t_chunk = time.time()
                wav_bytes = _synth(chunk, ref_bytes, ref_text)
                data, native_sr = sf.read(io.BytesIO(wav_bytes), always_2d=False)
                _log(f'  chunk {i + 1}/{len(chunks)} ({len(chunk)} chars) in {time.time() - t_chunk:.1f}s')
                pieces.append(np.asarray(data, dtype=np.float32))
                if i < len(chunks) - 1:
                    pieces.append(np.zeros(int(round(native_sr * args.sentence_pause_sec)), dtype=np.float32))
            audio = np.concatenate(pieces)
            sr = native_sr
        else:
            wav_bytes = _synth(text, ref_bytes, ref_text)
            data, sr = sf.read(io.BytesIO(wav_bytes), always_2d=False)
            audio = np.asarray(data, dtype=np.float32)
    except Exception as e:  # noqa: BLE001
        _log(f'inference failed: {e!r}')
        return 1
    _log(f'synthesised in {time.time() - t0:.1f}s ({len(audio) / sr:.1f}s audio)')

    if sr != args.sample_rate:
        try:
            import librosa
            audio = librosa.resample(audio, orig_sr=sr, target_sr=args.sample_rate)
            sr = args.sample_rate
        except ImportError:
            _log(f'librosa not installed; leaving output at native {sr} Hz')

    sf.write(str(out_path), audio, sr, subtype='PCM_16')

    # --speed via atempo: pitch-preserving tempo change. atempo takes 0.5-2.0;
    # our service clamps rate to the same range, so a single filter suffices.
    if abs(args.speed - 1.0) > 1e-3:
        if not _FFMPEG.exists():
            _log(f'warning: ffmpeg missing at {_FFMPEG}; --speed={args.speed} skipped')
        else:
            tmp = out_path.parent / f'.speed_{out_path.name}'
            r = subprocess.run(
                [str(_FFMPEG), '-y', '-i', str(out_path),
                 '-filter:a', f'atempo={args.speed}', '-ar', str(sr), str(tmp)],
                capture_output=True,
            )
            if r.returncode == 0 and tmp.exists():
                tmp.replace(out_path)
                _log(f'applied atempo={args.speed}')
            else:
                _log(f'warning: atempo failed ({r.stderr.decode(errors="replace")[-300:]}); keeping 1.0x')
                try: tmp.unlink()
                except OSError: pass

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
