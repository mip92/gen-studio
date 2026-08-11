# -*- coding: utf-8 -*-
"""Batch prosody / tech-artifact / stress-risk analysis for VO validation.

Runs in the kohya venv (numpy + soundfile guaranteed — same stack as tts_f5.py;
librosa is OPTIONAL and only powers the monotony check — everything else is
plain numpy so a missing librosa degrades that one flag, never the batch).

Checks per wav (all advisory — the Nest side decides pass/warn/fail):
  • monotony        — f0 coefficient-of-variation via librosa.pyin (if available)
  • long mid silence— internal RMS-envelope gap far exceeding the job's own
                      sentence pause (intentional pauses are NOT flagged)
  • clipping        — sustained near-full-scale sample runs
  • leading garbage — short quiet blob before real speech onset (same idea as
                      trim_lead_artifact.py's 'sha' envelope detector)
  • truncated end   — file ends while speech is still loud (no natural decay)
  • stress risk     — words present in RUAccent's omographs.json.gz (ambiguous
                      lexical stress). Informational ONLY — never fails a job.

Usage:
    python vo_prosody_batch.py --manifest <in.json> [--omographs <path.json.gz>]

manifest (UTF-8 JSON):
    {"jobs": [{"id": "...", "wav": "...", "text": "...", "sentencePauseSec": 1.0}]}

stdout, one UTF-8 NDJSON line per job (flushed immediately):
    {"id": "...", "ok": true, "monotone": false, "monotonyScore": 0.21,
     "longMidSilence": false, "longMidSilenceSec": 0.0, "clipping": false,
     "leadingGarbage": false, "truncatedEnd": false,
     "riskyStressWords": ["замок"]}
    {"id": "...", "ok": false, "error": "..."}
final line: {"done": true, "count": N}
"""
from __future__ import annotations

import argparse
import gzip
import io
import json
import math
import os
import re
import sys
from pathlib import Path

DEFAULT_OMOGRAPHS = os.path.join(
    os.environ.get("KOHYA_DIR", r"E:\kohya_ss"),
    "venv", "Lib", "site-packages", "ruaccent", "dictionary", "omographs.json.gz",
)

# ── tunables (env-overridable; calibrate after the first real project) ────────
FRAME_MS            = 20.0
SILENCE_GATE_DB     = float(os.environ.get("VO_QC_SILENCE_GATE_DB", "-42"))
MID_SILENCE_MARGIN  = float(os.environ.get("VO_QC_MID_SILENCE_MARGIN_SEC", "0.8"))
MID_SILENCE_MIN     = float(os.environ.get("VO_QC_MID_SILENCE_MIN_SEC", "1.6"))
CLIP_THRESHOLD      = float(os.environ.get("VO_QC_CLIP_THRESHOLD", "0.985"))
CLIP_RUN_SAMPLES    = int(os.environ.get("VO_QC_CLIP_RUN", "4"))
CLIP_MIN_RUNS       = int(os.environ.get("VO_QC_CLIP_MIN_RUNS", "3"))
LEAD_BLOB_MAX_SEC   = float(os.environ.get("VO_QC_LEAD_BLOB_MAX_SEC", "0.4"))
LEAD_GAP_MIN_SEC    = float(os.environ.get("VO_QC_LEAD_GAP_MIN_SEC", "0.25"))
LEAD_QUIET_MARGIN_DB = float(os.environ.get("VO_QC_LEAD_QUIET_MARGIN_DB", "6"))
TAIL_LOUD_DB        = float(os.environ.get("VO_QC_TAIL_LOUD_DB", "-25"))
MONOTONY_CV         = float(os.environ.get("VO_QC_MONOTONY_CV", "0.06"))


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def load_omographs(path: str) -> set:
    try:
        with gzip.open(path, "rt", encoding="utf-8") as f:
            data = json.load(f)
        keys = set(data.keys() if isinstance(data, dict) else data)
        return {str(k).strip().lower().replace("ё", "е") for k in keys}
    except Exception as e:  # noqa: BLE001
        _log(f"omographs lexicon unavailable ({e!r}) — stress-risk check disabled")
        return set()


_WORD_RE = re.compile(r"[а-яёa-z0-9-]+", re.IGNORECASE)


def risky_words(text: str, omographs: set) -> list:
    if not omographs or not text:
        return []
    seen, out = set(), []
    for raw in _WORD_RE.findall(text.lower()):
        w = raw.replace("ё", "е")
        if w in omographs and w not in seen:
            seen.add(w)
            out.append(raw)
    return out


def rms_envelope_db(mono, sr: int):
    """20ms-frame RMS in dBFS (numpy). Mirrors trim_lead_artifact.py's idea."""
    import numpy as np
    frame = max(1, int(sr * FRAME_MS / 1000.0))
    n = len(mono) // frame
    if n == 0:
        return np.array([-120.0])
    x = mono[: n * frame].reshape(n, frame).astype("float64")
    rms = np.sqrt((x ** 2).mean(axis=1)) + 1e-12
    return 20.0 * np.log10(rms)


def voiced_blobs(env_db, gate_db: float):
    """[(start_frame, end_frame_exclusive, peak_db)] of frames above the gate."""
    blobs = []
    start = None
    peak = -999.0
    for i, v in enumerate(env_db):
        if v > gate_db:
            if start is None:
                start, peak = i, v
            else:
                peak = max(peak, v)
        elif start is not None:
            blobs.append((start, i, peak))
            start = None
            peak = -999.0
    if start is not None:
        blobs.append((start, len(env_db), peak))
    return blobs


def analyze(wav_path: str, sentence_pause_sec: float, librosa_mod):
    import numpy as np
    import soundfile as sf

    data, sr = sf.read(wav_path, always_2d=True)
    mono = data.mean(axis=1).astype("float32")
    dur = len(mono) / sr
    frame_sec = FRAME_MS / 1000.0

    result = {
        "monotone": False, "monotonyScore": None,
        "longMidSilence": False, "longMidSilenceSec": 0.0,
        "clipping": False, "leadingGarbage": False, "truncatedEnd": False,
    }
    if dur <= 0.2:
        return result

    # ── clipping: several separate runs of near-full-scale samples ──────────
    clipped = np.abs(mono) >= CLIP_THRESHOLD
    if clipped.any():
        runs = 0
        run_len = 0
        for c in clipped:
            if c:
                run_len += 1
                if run_len == CLIP_RUN_SAMPLES:
                    runs += 1
            else:
                run_len = 0
        result["clipping"] = runs >= CLIP_MIN_RUNS

    env = rms_envelope_db(mono, sr)
    blobs = voiced_blobs(env, SILENCE_GATE_DB)
    if not blobs:
        return result

    # ── long mid-phrase silence: internal gap far beyond the intended pause ──
    # f5/qwen3 deliberately insert sentencePauseSec between sentences — only a
    # gap that clearly exceeds it is an anomaly.
    threshold = max(MID_SILENCE_MIN, sentence_pause_sec + MID_SILENCE_MARGIN)
    worst_gap = 0.0
    for a, b in zip(blobs, blobs[1:]):
        gap = (b[0] - a[1]) * frame_sec
        worst_gap = max(worst_gap, gap)
    if worst_gap >= threshold:
        result["longMidSilence"] = True
        result["longMidSilenceSec"] = round(worst_gap, 2)

    # ── leading garbage: short first blob, then a gap, and QUIETER than the
    #    speech after it (a real first word is never quieter — same
    #    discriminator as the 'sha' profile in trim_lead_artifact.py) ─────────
    if len(blobs) >= 2:
        first, second = blobs[0], blobs[1]
        first_len = (first[1] - first[0]) * frame_sec
        gap = (second[0] - first[1]) * frame_sec
        if (first_len <= LEAD_BLOB_MAX_SEC and gap >= LEAD_GAP_MIN_SEC
                and first[2] <= second[2] - LEAD_QUIET_MARGIN_DB):
            result["leadingGarbage"] = True

    # ── truncated ending: file ends while the envelope is still loud ─────────
    tail = env[-3:] if len(env) >= 3 else env
    if float(max(tail)) > TAIL_LOUD_DB and blobs[-1][1] >= len(env) - 1:
        result["truncatedEnd"] = True

    # ── monotony (optional, needs librosa) ───────────────────────────────────
    if librosa_mod is not None:
        try:
            y = mono if sr == 16000 else librosa_mod.resample(mono, orig_sr=sr, target_sr=16000)
            f0, voiced_flag, _ = librosa_mod.pyin(
                y, sr=16000,
                fmin=float(librosa_mod.note_to_hz("C2")),
                fmax=float(librosa_mod.note_to_hz("C6")),
                frame_length=1024,
            )
            voiced = f0[np.isfinite(f0)] if f0 is not None else np.array([])
            if voiced.size >= 20:
                cv = float(np.std(voiced) / (np.mean(voiced) + 1e-9))
                result["monotonyScore"] = round(cv, 4)
                result["monotone"] = cv < MONOTONY_CV
        except Exception as e:  # noqa: BLE001
            _log(f"pyin failed on {os.path.basename(wav_path)}: {e!r}")
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--omographs", default=DEFAULT_OMOGRAPHS)
    args = ap.parse_args()

    out = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="\n")

    def emit(obj: dict) -> None:
        out.write(json.dumps(obj, ensure_ascii=False) + "\n")
        out.flush()

    try:
        jobs = json.loads(Path(args.manifest).read_text(encoding="utf-8")).get("jobs", [])
    except Exception as e:  # noqa: BLE001
        _log(f"cannot read manifest: {e!r}")
        return 1

    omographs = load_omographs(args.omographs)
    _log(f"omographs lexicon: {len(omographs)} forms; {len(jobs)} wav(s) to analyse")

    librosa_mod = None
    try:
        import librosa as librosa_mod  # noqa: F401
    except Exception:  # noqa: BLE001
        _log("librosa not installed — monotony check disabled (everything else runs)")

    count = 0
    for job in jobs:
        job_id = str(job.get("id", ""))
        try:
            wav = str(job.get("wav", ""))
            if not job_id or not wav:
                raise ValueError("manifest entry missing id/wav")
            if not Path(wav).exists():
                raise FileNotFoundError(f"wav not found: {wav}")
            res = analyze(wav, float(job.get("sentencePauseSec") or 0.0), librosa_mod)
            res["riskyStressWords"] = risky_words(str(job.get("text") or ""), omographs)
            res["id"] = job_id
            res["ok"] = True
            emit(res)
        except Exception as e:  # noqa: BLE001 — degrade per item
            emit({"id": job_id, "ok": False, "error": f"{type(e).__name__}: {e}"})
        count += 1

    emit({"done": True, "count": count})
    return 0


if __name__ == "__main__":
    sys.exit(main())
