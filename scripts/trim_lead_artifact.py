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

# ── detection profiles, one per voice ───────────────────────────────────────
# The artifact's SHAPE is the same for every voice ([burst][pause][speech]) but
# its loudness belongs to the VOICE, and that decides which method can see it:
#
#   pon — «Кошатница» (data/_voices/cat_lady), method "silencedetect". A loud
#         studio recording: the burst sits at −14…−28 dB, well clear of a −40 dB
#         gate. Validated on 474 real narrations; do not retune.
#   sha — «агента Смита» (data/_voices/voice-3), method "envelope". The burst is
#         −33…−49 dB, i.e. ON a −40 dB gate and near a −55 dB one, so fixed
#         silencedetect thresholds see it only sometimes: half the burst reads as
#         silence and the gap after it often fails to register at all. Measured
#         across 269 station narrations, a −55 dB silencedetect pass caught 217
#         and left 36 audible ones behind.
#
# The envelope method walks a 20 ms RMS envelope instead, merges the artifact's
# own ragged dips into one blob, and leans on the discriminator that actually
# separates artifact from speech: THE ARTIFACT IS QUIETER THAN THE SPEECH THAT
# FOLLOWS (quiet_margin). A real first word is as loud as the rest of the line,
# so it can never be mistaken for the artifact — a much stronger guard than
# position alone. min_blob_db keeps us off blobs already too faint to hear.
PROFILES = {
    "pon": dict(method="silencedetect",
                noise_db="-40dB", silence_min=0.05, burst_start_max=0.12,
                burst_min=0.03, burst_max=0.35, gap_min=0.12, gap_start_max=0.40),
    "sha": dict(method="envelope",
                gate_db=-58.0, frame=0.020, probe_secs=4.0, min_run=0.04,
                merge_gap=0.08, blob_start_max=0.70, blob_max=1.00,
                gap_min=0.08, gap_start_max=1.50, quiet_margin=6.0,
                min_blob_db=-48.0),
}
DEFAULT_PROFILE = "pon"

_re_dur    = re.compile(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)")
_re_sstart = re.compile(r"silence_start:\s*(-?[\d.]+)")
_re_send   = re.compile(r"silence_end:\s*([\d.]+)")


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def probe(ffmpeg: str, wav: Path, profile: dict | None = None):
    """Return (duration_s, [(silence_start, silence_end), ...]) via silencedetect."""
    p = profile or PROFILES[DEFAULT_PROFILE]
    out = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(wav),
         "-af", f"silencedetect=noise={p['noise_db']}:d={p['silence_min']}", "-f", "null", "-"],
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


def envelope(ffmpeg: str, wav: Path, p: dict, offset: float = 0.0):
    """20 ms RMS envelope (dBFS) over the head of the file, from `offset` on."""
    import math
    import struct
    raw = subprocess.run(
        [ffmpeg, "-v", "quiet", "-ss", f"{offset:.3f}", "-i", str(wav),
         "-t", str(p["probe_secs"]), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
        capture_output=True,
    ).stdout
    n = len(raw) // 2
    if n == 0:
        return []
    samples = struct.unpack("<%dh" % n, raw[:n * 2])
    step = int(16000 * p["frame"])
    out = []
    for i in range(0, n - step + 1, step):
        chunk = samples[i:i + step]
        rms = math.sqrt(sum(v * v for v in chunk) / len(chunk)) or 1e-9
        out.append(20 * math.log10(rms / 32768.0))
    return out


def _blobs(env, p):
    """Voiced runs above the gate, with the artifact's own dips merged away.
    Returns [(start_s, end_s, peak_db), ...]."""
    f, runs, i, n = p["frame"], [], 0, len(env)
    while i < n:
        if env[i] > p["gate_db"]:
            j = i
            while j < n and env[j] > p["gate_db"]:
                j += 1
            if (j - i) * f >= p["min_run"]:
                runs.append([i * f, j * f, max(env[i:j])])
            i = j
        else:
            i += 1
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < p["merge_gap"]:
            merged[-1][1] = r[1]
            merged[-1][2] = max(merged[-1][2], r[2])
        else:
            merged.append(list(r))
    return [tuple(m) for m in merged]


def detect_cut_envelope(env, profile: dict):
    """Return (cut_s, info) or (None, reason) from the RMS envelope."""
    p = profile
    b = _blobs(env, p)
    if len(b) < 2:
        return None, "no separated leading blob - solid speech, no artifact"
    (b0s, b0e, b0pk), (b1s, _b1e, _b1pk) = b[0], b[1]
    speech_peak = max(x[2] for x in b[1:])
    gap = b1s - b0e
    if b0s > p["blob_start_max"]:
        return None, f"first sound at {b0s:.3f}s, past {p['blob_start_max']:.2f}s - too late to be the artifact"
    if (b0e - b0s) > p["blob_max"]:
        return None, f"leading sound too long ({b0e - b0s:.3f}s) - speech, no artifact"
    if b0pk < p["min_blob_db"]:
        return None, f"leading blob only {b0pk:.0f}dB - already inaudible, leaving it"
    if gap < p["gap_min"]:
        return None, f"gap after leading sound only {gap:.3f}s - runs into the speech, no safe cut"
    if b0e >= p["gap_start_max"]:
        return None, f"gap starts at {b0e:.3f}s, past {p['gap_start_max']:.2f}s - a speech pause"
    if speech_peak - b0pk < p["quiet_margin"]:
        return None, (f"leading sound {b0pk:.0f}dB vs speech {speech_peak:.0f}dB - "
                      f"as loud as the speech, that is a word")
    cut = (b0e + b1s) / 2.0
    return cut, (f"blob {b0s:.3f}-{b0e:.3f}s @{b0pk:.0f}dB, speech @{speech_peak:.0f}dB, "
                 f"gap {gap:.3f}s, cut@{cut:.3f}s")


def detect_cut_envelope_total(ffmpeg: str, wav: Path, p: dict):
    """One pass, deliberately.

    A multi-pass version (cut, re-measure, cut again) was tried and REMOVED: once
    the artifact is gone, the same "quiet blob then a gap" shape fits the FIRST
    SPOKEN WORD, because a word ends in a dip before the next one and its 20 ms
    RMS runs below the loudest vowel later in the line. On station/A8_SH11 the
    second pass ate «Артёму» whole — first pass cut the «Пщи» at 0.78 s correctly,
    second pass then cut to 1.26 s, i.e. 260 ms into the word. A leftover second
    blob is far cheaper than a lost word, so we cut once and leave the rest to a
    human ear.
    """
    return detect_cut_envelope(envelope(ffmpeg, wav, p), p)


def detect_cut(dur, sil, profile: dict | None = None):
    """Return (cut_s, info) or (None, reason). cut = middle of the post-burst pause."""
    p = profile or PROFILES[DEFAULT_PROFILE]
    if not sil:
        return None, "no silence at all - solid speech, no artifact"

    # Where the very first sound of the file begins. The burst is measured from
    # HERE, not from the last silence before the pause: a quiet artifact is
    # ragged, its own dips read as silence at the gate, and anchoring on the
    # last dip would put the burst's start after the real one.
    onset = sil[0][1] if sil[0][0] <= 0.001 else 0.0
    if onset > p["burst_start_max"]:
        return None, (f"first sound starts at {onset:.3f}s, past "
                      f"{p['burst_start_max']:.2f}s - too late to be the artifact")

    for (s, e) in sil:
        if s >= p["gap_start_max"]:
            break                                  # later silences are normal speech pauses
        if s <= onset + 0.001:
            continue                               # leading silence, not the post-burst pause
        if (e - s) < p["gap_min"]:
            continue                               # a dip inside the burst, keep looking
        burst = s - onset
        if burst < p["burst_min"]:
            return None, f"no burst before pause (starts with {s:.3f}s silence) - no artifact"
        if burst > p["burst_max"]:
            return None, f"pre-pause voice too long ({burst:.3f}s) - speech, no artifact"
        if e >= (dur or 1e9) - 0.05:
            return None, "pause runs to EOF - nothing after, no artifact"
        return (s + e) / 2.0, f"burst {onset:.3f}-{s:.3f}s, cut@{(s+e)/2.0:.3f}s"
    return None, "no early substantial pause - solid speech, no artifact"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in",     dest="inp",   required=True, help="Narration wav to clean (modified in place on trim)")
    p.add_argument("--backup", dest="backup", required=True, help="Where the untouched original is saved / restored from")
    p.add_argument("--ffmpeg", default=str(_DEFAULT_FFMPEG), help="ffmpeg binary")
    p.add_argument("--revert", action="store_true", help="Restore --in from --backup and delete the backup")
    p.add_argument("--profile", default=DEFAULT_PROFILE, choices=sorted(PROFILES),
                   help="Detection profile for the voice this render used (see PROFILES)")
    p.add_argument("--dry-run", action="store_true",
                   help="Report the verdict without writing anything")
    p.add_argument("--again", action="store_true",
                   help="DANGEROUS, manual use only: trim a file that was trimmed before, "
                        "keeping the existing pristine backup. Once the bleed is gone the same "
                        "'quiet blob then a gap' shape fits the FIRST SPOKEN WORD, so a second "
                        "cut can eat it — that is exactly how «Артёму» was lost on station/"
                        "A8_SH11 (cut 780ms, then +480ms). Prefer revert + one clean pass.")
    args = p.parse_args()

    wav     = Path(args.inp)
    backup  = Path(args.backup)
    ffmpeg  = args.ffmpeg
    profile = PROFILES[args.profile]

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
    if backup.exists() and not args.again:
        # A backup already exists => this file was trimmed before. Refuse so we
        # never overwrite the pristine original with an already-trimmed file.
        print("SKIP already-trimmed (backup exists)", flush=True)
        return 0

    if profile["method"] == "envelope":
        cut_s, info = detect_cut_envelope_total(ffmpeg, wav, profile)
    else:
        dur, sil = probe(ffmpeg, wav, profile)
        cut_s, info = detect_cut(dur, sil, profile)
    if cut_s is None:
        print(f"SKIP {info}", flush=True)
        return 0
    if args.dry_run:
        print(f"WOULD-CUT cut_ms={int(round(cut_s * 1000))} ({info})", flush=True)
        return 0

    # Back up the pristine original, then write the trimmed file in place. On a
    # second pass (--again) the backup already holds the TRUE original — keep it
    # untouched, or revert would only restore the first pass's output.
    had_backup = backup.exists()
    if not had_backup:
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
        if not had_backup:
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
