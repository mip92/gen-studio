"""
F5-TTS Russian worker — zero-shot voice cloning for Russian (Misha24-10 fine-tune).

Mirrors the CLI contract of tts_silero.py / tts_xtts2.py so the TTS service can
spawn this worker through the same path. Like XTTS-v2 it is a voice-cloning
engine: WHO speaks comes from --voice-ref (the project voice reference clip);
there is no categorical emotion model, so --emotion-preset / --emotion-intensity
are accepted-and-ignored and --emotion-ref (if set) REPLACES --voice-ref as the
speaker clip for this render.

Russian-specific:
- F5-TTS is sensitive to lexical stress. We run RUAccent over the text first to
  insert `+` stress marks (молок+о) unless --no-accent is passed.
- Reference transcription is auto: --ref-text defaults to '' and f5-tts runs its
  built-in ASR (Whisper) on the reference clip — so the service can stay
  identical to the xtts2 flow (upload a clip, nothing else).

Weights:
    --ckpt   F5TTS_v1_Base_v2/model_last_inference.safetensors (RU v2 fine-tune)
    --vocab  F5TTS_v1_Base/vocab.txt
  Both default to gen-studio/checkpoints/f5_russian/. The base F5-TTS vocoder
  (Vocos) + RUAccent + ASR models download to the HF cache on first run.

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

# Keep every model cache on the project drive (mirrors tts_xtts2.py). Must be set
# BEFORE importing f5_tts / transformers / huggingface_hub.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME', str(_PROJECT_ROOT / '.hf_cache'))
os.environ.setdefault('TORCH_HOME', str(_PROJECT_ROOT / '.torch_cache'))
# The kohya venv also has TensorFlow installed. Transformers (used by F5's
# Whisper-based reference ASR) would otherwise try to import the TF Whisper
# implementation, which crashes under Keras 3 ("install tf-keras"). Force the
# torch backend so it never touches TF. Must be set before transformers import.
os.environ.setdefault('USE_TF', '0')
os.environ.setdefault('USE_FLAX', '0')
os.environ.setdefault('TRANSFORMERS_NO_ADVISORY_WARNINGS', '1')
# F5's Whisper-based reference ASR (transformers pipeline) shells out to the
# `ffmpeg` binary to decode the reference clip. There is no system ffmpeg, so we
# ship one under gen-studio/bin/ (installed via imageio-ffmpeg) and put it on PATH.
_BIN_DIR = _PROJECT_ROOT / 'bin'
if _BIN_DIR.exists():
    os.environ['PATH'] = str(_BIN_DIR) + os.pathsep + os.environ.get('PATH', '')

_DEFAULT_CACHE = _PROJECT_ROOT / 'checkpoints' / 'f5_russian'
_DEFAULT_CKPT  = _DEFAULT_CACHE / 'model_last_inference.safetensors'
_DEFAULT_VOCAB = _DEFAULT_CACHE / 'vocab.txt'

SUPPORTED_SAMPLE_RATES = {16000, 22050, 24000, 44100, 48000}
DEFAULT_SAMPLE_RATE = 24000  # F5-TTS native output rate


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


_ACCENTIZER = None


def _accentize(text: str) -> str:
    """Insert `+` stress marks via RUAccent. Best-effort: if RUAccent is missing
    or errors, return the text unchanged (F5 still synthesises, just less
    accurately on stress)."""
    global _ACCENTIZER
    try:
        if _ACCENTIZER is None:
            from ruaccent import RUAccent
            t0 = time.time()
            acc = RUAccent()
            # 'turbo' omograph model = good accuracy / fast; downloads once.
            acc.load(omograph_model_size='turbo', use_dictionary=True)
            _ACCENTIZER = acc
            _log(f'RUAccent loaded in {time.time() - t0:.1f}s')
        return _ACCENTIZER.process_all(text)
    except Exception as e:  # noqa: BLE001
        _log(f'warning: RUAccent unavailable ({e!r}); synthesising without stress marks')
        return text


def _prepare_ref(src: Path) -> Path:
    """F5 loads the reference clip via pydub (and Whisper-ASR via transformers),
    which prefer the ffmpeg binary for compressed formats. To stay robust we
    pre-decode any non-wav reference with soundfile (libsndfile — handles
    mp3/flac/ogg natively) into a mono WAV written NEXT TO the source ref. The
    result is cached and reused across all shots of the project (decoded once),
    so we neither litter per-shot dirs nor re-decode every job."""
    if src.suffix.lower() == '.wav':
        return src
    out = src.parent / f'.norm_{src.stem}.wav'
    try:
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            return out  # cached from an earlier job
        import numpy as np  # noqa: F401
        import soundfile as sf
        data, sr = sf.read(str(src), always_2d=True)
        mono = data.mean(axis=1).astype('float32')
        sf.write(str(out), mono, sr, subtype='PCM_16')
        _log(f'normalised reference {src.name} → {out.name} (mono {sr}Hz, {len(mono)/sr:.1f}s)')
        return out
    except Exception as e:  # noqa: BLE001
        _log(f'warning: could not pre-decode reference ({e!r}); passing original to F5')
        return src


def _load_model(ckpt: Path, vocab: Path, device: str):
    """Lazy-import f5_tts and load the RU fine-tune on top of the F5TTS_v1_Base
    architecture. Vocos vocoder downloads to HF cache on first call."""
    try:
        from f5_tts.api import F5TTS
    except ImportError as e:
        raise RuntimeError(
            f'f5-tts package missing. Install with: pip install f5-tts '
            f'(in the kohya venv). Underlying import error: {e!r}'
        ) from e

    _log(f'loading F5-TTS (ckpt={ckpt.name}, vocab={vocab.name}, device={device})')
    t0 = time.time()
    model = F5TTS(
        model='F5TTS_v1_Base',
        ckpt_file=str(ckpt),
        vocab_file=str(vocab),
        device=device,
    )
    _log(f'F5-TTS loaded in {time.time() - t0:.1f}s')
    return model


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--text-file',   required=True, help='UTF-8 text file with the narration')
    p.add_argument('--out',         required=True, help='Output wav path; parent dir created on demand')
    p.add_argument('--voice-ref',   required=True, help='Path to a wav/mp3 of the target speaker (6-15s clean)')
    p.add_argument('--ref-text',    default='',
                   help="Transcript of the reference clip. Empty (default) => f5-tts auto-transcribes via Whisper.")
    p.add_argument('--emotion-ref', default=None,
                   help='Optional emotion-reference clip. If set, REPLACES --voice-ref as the speaker for this render.')
    # Accepted for CLI parity with the IndexTTS-2 contract; F5 has no categorical
    # emotion model — logged and ignored.
    p.add_argument('--emotion-preset',    default=None, help='IGNORED for F5')
    p.add_argument('--emotion-intensity', type=float, default=None, help='IGNORED for F5')
    p.add_argument('--speed', type=float, default=1.0,
                   help='Synthesis speed (1.0=normal, <1 slower, >1 faster). F5 reads '
                        'Russian fast by default — 0.85–0.95 sounds more natural.')
    p.add_argument('--sentence-pause-sec', type=float, default=0.0,
                   help='Insert N seconds of silence after every sentence boundary '
                        '([.!?…]+). 0 = off. Text is split, each sentence synthesised '
                        'separately, then concatenated (mirrors tts_silero.py).')
    p.add_argument('--sample-rate', type=int, default=DEFAULT_SAMPLE_RATE,
                   choices=sorted(SUPPORTED_SAMPLE_RATES),
                   help='Output sample rate. F5 native is 24 kHz; we resample if requested differs.')
    p.add_argument('--ckpt',  default=str(_DEFAULT_CKPT),  help='F5 checkpoint (.safetensors/.pt)')
    p.add_argument('--vocab', default=str(_DEFAULT_VOCAB), help='F5 vocab.txt')
    p.add_argument('--no-accent', action='store_true', help='Skip RUAccent stress marking')
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

    ckpt  = Path(args.ckpt)
    vocab = Path(args.vocab)
    if not ckpt.exists():
        _log(f'checkpoint missing: {ckpt} (download F5TTS_v1_Base_v2/model_last_inference.safetensors)')
        return 2
    if not vocab.exists():
        _log(f'vocab missing: {vocab} (download F5TTS_v1_Base/vocab.txt)')
        return 2

    # emotion-ref wins over voice-ref as the speaker clip (F5 has no separate
    # emotion path) — same semantics as tts_xtts2.py.
    speaker_wav = Path(args.emotion_ref) if args.emotion_ref else Path(args.voice_ref)
    if not speaker_wav.exists():
        _log(f'speaker reference missing: {speaker_wav}')
        return 2
    if args.emotion_preset:
        _log(f'note: --emotion-preset={args.emotion_preset!r} ignored by F5 (only emotion-ref affects tone)')

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Decode mp3/compressed refs to a cached mono WAV beside the source ref.
    speaker_wav = _prepare_ref(speaker_wav)

    # ── Stress marking ───────────────────────────────────────────────────
    gen_text = text if args.no_accent else _accentize(text)
    ref_text = args.ref_text.strip()
    if ref_text and not args.no_accent:
        ref_text = _accentize(ref_text)

    # ── Model load ───────────────────────────────────────────────────────
    try:
        model = _load_model(ckpt, vocab, args.device)
    except RuntimeError as e:
        _log(f'fatal: {e}')
        return 3

    # ── Inference ────────────────────────────────────────────────────────
    import numpy as np
    import soundfile as sf

    # Split on terminal punctuation; we insert explicit pauses between sentences
    # only when asked AND there is more than one sentence to separate.
    chunks = [c.strip() for c in re.split(r'(?<=[.!?…])\s+', gen_text.strip()) if c.strip()] or [gen_text]
    use_pauses = args.sentence_pause_sec > 0 and len(chunks) > 1

    # ref_text='' makes F5 auto-transcribe the reference via Whisper on every
    # infer() call. In chunk mode that would re-run ASR per sentence, so resolve
    # the transcript ONCE up front. Best-effort — fall back to per-chunk auto-ASR.
    ref_text_resolved = ref_text
    if use_pauses and not ref_text_resolved:
        try:
            asr = (model.transcribe(str(speaker_wav)) or '').strip()
            ref_text_resolved = asr if args.no_accent else _accentize(asr)
            _log(f'transcribed reference once for chunked synthesis ({len(ref_text_resolved)} chars)')
        except Exception as e:  # noqa: BLE001
            _log(f'warning: one-shot reference transcription failed ({e!r}); each chunk will auto-ASR')

    _log(f'synthesising {len(gen_text)} chars (speaker={speaker_wav.name}, speed={args.speed}, '
         f'{"pauses=%.2fs over %d chunks" % (args.sentence_pause_sec, len(chunks)) if use_pauses else "single pass"}, '
         f'ref_text={"<auto-ASR>" if not ref_text_resolved else f"{len(ref_text_resolved)} chars"})')
    t0 = time.time()
    try:
        if use_pauses:
            pieces: list = []
            native_sr = DEFAULT_SAMPLE_RATE
            for i, chunk in enumerate(chunks):
                t_chunk = time.time()
                wav, native_sr, _ = model.infer(
                    ref_file=str(speaker_wav),
                    ref_text=ref_text_resolved,
                    gen_text=chunk,
                    speed=args.speed,
                    remove_silence=True,
                )
                _log(f'  chunk {i+1}/{len(chunks)} ({len(chunk)} chars) in {time.time()-t_chunk:.1f}s')
                pieces.append(np.asarray(wav, dtype=np.float32))
                # No trailing pause after the final sentence.
                if i < len(chunks) - 1:
                    pieces.append(np.zeros(int(round(native_sr * args.sentence_pause_sec)), dtype=np.float32))
            sf.write(str(out_path), np.concatenate(pieces), native_sr, subtype='PCM_16')
        else:
            # Single pass: F5 writes + de-silences the file directly. Auto-
            # transcribes the reference when ref_text is empty.
            model.infer(
                ref_file=str(speaker_wav),
                ref_text=ref_text_resolved,
                gen_text=gen_text,
                speed=args.speed,
                file_wave=str(out_path),
                remove_silence=True,
            )
    except Exception as e:  # noqa: BLE001
        _log(f'inference failed: {e!r}')
        return 1
    _log(f'synthesised in {time.time() - t0:.1f}s → {out_path}')

    # ── Resample to requested sr if needed ───────────────────────────────
    try:
        import soundfile as sf
        info = sf.info(str(out_path))
    except Exception as e:  # noqa: BLE001
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
