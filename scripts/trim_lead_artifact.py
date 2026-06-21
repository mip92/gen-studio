"""
Trim the leading reference-bleed artifact ("понь") from a voice-clone narration wav.

Voice-clone engines (F5-TTS especially) sometimes echo a short fragment of the
speaker reference clip at the very start of every render. It shows up as:

    [tiny leading silence?] [short "понь" burst] [pause] [real speech ...]

This worker detects that structure (via ffmpeg silencedetect — the same tool the
F5 worker already ships in bin/) and cuts the file at the MIDDLE of the pause, so
the burst is gone but no speech is clipped. If the structure is NOT present the
file is left untouched (a clean render is never damaged).

Reversibility: before trimming, the untouched original is copied to --backup.
`--revert` restores it. Re-trimming refuses when a backup already exists, so the
pristine original can never be overwritten by an already-trimmed file.

CLI contract (mirrors the tts_*.py workers — single status line on stdout):
    trim : python trim_lead_artifact.py --in W.wav --backup B.wav
              -> "OK cut_ms=<int>"        (trimmed; original saved to backup)
              -> "SKIP <reason>"          (no понь / already trimmed; nothing changed)
    revert: python trim_lead_artifact.py --in W.wav --backup B.wav --revert
              -> "REVERTED"               (backup copied back, backup removed)
    errors -> human-readable line on stderr, exit 1/2.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_FFMPEG = _PROJECT_ROOT / "bin" / "ffmpeg.exe"

# ── detection params (validated on 474 real cat_lady narrations) ────────────
NOISE_DB      = "-40dB"   # silencedetect threshold
SILENCE_MIN   = 0.05      # silencedetect d= (min run to register as silence)
BURST_MIN_S   = 0.03      # the burst must be at least this (else it's just leading silence)
BURST_MAX_S   = 0.35      # ...and no longer than this (else it's speech, not понь)
GAP_MIN_S     = 0.12      # the pause after the burst must be at least this long
GAP_START_MAX = 0.40      # ...and must start before this

_re_dur    = re.compile(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)")
_re_sstart = re.compile(r"silence_start:\s*(-?[\d.]+)")
_re_send   = re.compile(r"silence_end:\s*([\d.]+)")


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def probe(ffmpeg: str, wav: Path):
    """Return (duration_s, [(silence_start, silence_end), ...]) via silencedetect."""
    out = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(wav),
         "-af", f"silencedetect=noise={NOISE_DB}:d={SILENCE_MIN}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    dur = None
    m = _re_dur.search(out)
    if m:
        h, mm, s = m.groups()
        dur = int(h) * 3600 + int(mm) * 60 + float(s)
    sil, pend = [], None
    for line in out.splitlines():
        a = _re_sstart.search(line)
        b = _re_send.search(line)
        if a:
            pend = float(a.group(1))
        if b and pend is not None:
            sil.append((max(0.0, pend), float(b.group(1))))
            pend = None
    if pend is not None and dur is not None:      # trailing silence to EOF
        sil.append((max(0.0, pend), dur))
    return dur, sil


def detect_cut(dur, sil):
    """Return (cut_s, info) or (None, reason). cut = middle of the post-понь pause."""
    if not sil:
        return None, "no silence at all - solid speech, no понь"
    for (s, e) in sil:
        if s >= GAP_START_MAX:
            break                                  # later silences are normal speech pauses
        if (e - s) < GAP_MIN_S:
            continue
        prev_end = 0.0
        for (ps, pe) in sil:
            if pe <= s:
                prev_end = pe
        burst = s - prev_end
        if burst < BURST_MIN_S:
            return None, f"no burst before pause (starts with {s:.3f}s silence) - no понь"
        if burst > BURST_MAX_S:
            return None, f"pre-pause voice too long ({burst:.3f}s) - speech, no понь"
        if e >= (dur or 1e9) - 0.05:
            return None, "pause runs to EOF - nothing after, no понь"
        return (s + e) / 2.0, f"burst {prev_end:.3f}-{s:.3f}s, cut@{(s+e)/2.0:.3f}s"
    return None, "no early substantial pause - solid speech, no понь"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in",     dest="inp",   required=True, help="Narration wav to clean (modified in place on trim)")
    p.add_argument("--backup", dest="backup", required=True, help="Where the untouched original is saved / restored from")
    p.add_argument("--ffmpeg", default=str(_DEFAULT_FFMPEG), help="ffmpeg binary")
    p.add_argument("--revert", action="store_true", help="Restore --in from --backup and delete the backup")
    args = p.parse_args()

    wav    = Path(args.inp)
    backup = Path(args.backup)
    ffmpeg = args.ffmpeg

    if args.revert:
        if not backup.exists():
            _log(f"no backup to revert from: {backup}")
            return 2
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(backup), str(wav))
        try:
            backup.unlink()
        except OSError as e:
            _log(f"warning: restored but could not remove backup ({e!r})")
        print("REVERTED", flush=True)
        return 0

    if not wav.exists():
        _log(f"input wav missing: {wav}")
        return 2
    if not Path(ffmpeg).exists():
        _log(f"ffmpeg missing: {ffmpeg}")
        return 2
    if backup.exists():
        # A backup already exists => this file was trimmed before. Refuse so we
        # never overwrite the pristine original with an already-trimmed file.
        print("SKIP already-trimmed (backup exists)", flush=True)
        return 0

    dur, sil = probe(ffmpeg, wav)
    cut_s, info = detect_cut(dur, sil)
    if cut_s is None:
        print(f"SKIP {info}", flush=True)
        return 0

    # back up the pristine original, then write the trimmed file in place.
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(wav), str(backup))
    if backup.stat().st_size != wav.stat().st_size:
        _log("backup size mismatch - aborting before trim")
        return 1
    tmp = wav.with_name(wav.stem + ".trimtmp.wav")   # keep .wav so ffmpeg picks the muxer
    rc = subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
         "-ss", f"{cut_s:.3f}", "-i", str(wav), "-c:a", "pcm_s16le", str(tmp)],
    ).returncode
    if rc != 0 or not tmp.exists():
        try: tmp.unlink()
        except OSError: pass
        try: backup.unlink()    # roll back the backup so state stays "untrimmed"
        except OSError: pass
        _log(f"ffmpeg trim failed (rc={rc})")
        return 1
    tmp.replace(wav)
    print(f"OK cut_ms={int(round(cut_s * 1000))}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f"fatal: {e!r}")
        sys.exit(1)
