"""Video QC batch — deterministic layer of «Видео QC».

Scans every completed i2v BASE clip (videos/, pre-upscale) in the manifest and
emits raw findings as NDJSON, one line per clip, flushed immediately (same
contract as image_qc_pose_batch.py / vo_transcribe_batch.py).

Per clip:
  - full frame-diff scan (grayscale, downscaled): motion energy → static clip,
    adjacent-diff spikes → cut/flash moments
  - K sample frames (first / 25% / 50% / 75% / last):
      * insightface scrfd faces + DWPose skeletons → people/face counts vs the
        SOURCE STILL (the i2v start frame — the ground truth for who should be
        in frame); more subjects than the source → suspicious moment
      * last sample: anatomy checks (dwarf proportions, fused bodies) and
        skin-hue drift of the primary face vs the source face (синие лица)
      * first sample vs source: identity distance (the i2v first frame should
        be ≈ the source)
  - suspicious frames are written as PNGs into `framesDir` for the Nest-side
    anchored VLM classification (аниме-пришелец).

Video decode is cv2.VideoCapture (opencv wheels bundle ffmpeg) — no subprocess.
DWPose backend is chosen by weight file extension (.torchscript.pt → torch GPU,
.onnx → onnxruntime/cv2), exactly like image_qc_pose_batch.py.

Manifest (UTF-8 JSON):
  {
    "detModel": "...", "poseModel": "...", "insightfaceRoot": "...",
    "controlnetAuxSrc": "...", "framesDir": "abs tmp dir for suspicious PNGs",
    "jobs": [{"id", "video": "abs mp4", "source": "abs png of the i2v start frame"}]
  }

stdout NDJSON:
  {"id", "ok": true, "flags": [...],
   "metrics": {motionEnergy, maxCutSpike, cutSpikeAt, hueDriftDeg, blueFraction,
               identityDist, sourcePeople, sourceFaces, samples:[{t, people, faces}]},
   "suspicious": [{"timeSec", "reason", "frame": "abs png path"}]}
  {"id", "ok": false, "error": "..."}
  {"done": true, "count": N}

Flags emitted (Nest maps to Russian issues + status):
  static_clip           motion energy below floor                     → fail
  skin_hue_drift        primary face hue drifted vs source            → fail
  dwarf_proportions     adult standing figure < N head units (last)   → fail
  two_heads_one_body    two comparable faces on one skeleton (last)   → fail
  fused_bodies          overlapping skeletons on the last sample      → warn
  new_subject_mid_clip  more people/faces than the source still       → warn (+frame → VLM)
  cut_spike             adjacent-frame diff spike                     → warn (+frame → VLM)
  identity_drift        first frame far from the source still         → warn
  no_faces / no_people  informational
"""

from __future__ import annotations

import argparse
import contextlib
import json
import math
import os
import sys

# ── thresholds (env-tunable; calibrate on the webcam blue-clip set) ──────────
# Mean per-frame gray diff (0-255 scale) below this = dead clip.
STATIC_ENERGY   = float(os.environ.get("VIDEO_QC_STATIC_ENERGY", "0.6"))
# Adjacent diff spike: > SPIKE_ABS and > SPIKE_RATIO × median diff.
SPIKE_ABS       = float(os.environ.get("VIDEO_QC_SPIKE_ABS", "18"))
SPIKE_RATIO     = float(os.environ.get("VIDEO_QC_SPIKE_RATIO", "6"))
# Circular hue distance (OpenCV 0-179 units) of the primary face vs source.
HUE_DRIFT_MAX   = float(os.environ.get("VIDEO_QC_HUE_DRIFT", "30"))
# Fraction of face pixels in the blue-cyan hue band that flags on its own.
BLUE_FRACTION   = float(os.environ.get("VIDEO_QC_BLUE_FRACTION", "0.35"))
# Normalized L2 distance (64px gray) of the first frame vs the source still.
IDENTITY_MAX    = float(os.environ.get("VIDEO_QC_IDENTITY_MAX", "0.22"))
# Diff-scan working width (grayscale).
SCAN_W          = int(os.environ.get("VIDEO_QC_SCAN_WIDTH", "160"))
FACE_DET_SCORE  = float(os.environ.get("IMAGE_QC_FACE_DET_SCORE", "0.5"))
KP_CONF         = float(os.environ.get("IMAGE_QC_KP_CONF", "0.3"))
DWARF_MIN_RATIO = float(os.environ.get("IMAGE_QC_DWARF_MIN_RATIO", "4.6"))
FG_MIN_FRACTION = float(os.environ.get("IMAGE_QC_FG_MIN_FRACTION", "0.22"))
FUSED_IOU       = float(os.environ.get("IMAGE_QC_FUSED_IOU", "0.6"))
BG_FACE_FRACTION = float(os.environ.get("IMAGE_QC_BG_FACE_FRACTION", "0.4"))
TWO_HEAD_SIZE_RATIO = float(os.environ.get("IMAGE_QC_TWO_HEAD_SIZE_RATIO", "0.6"))
MIN_HEAD_UNIT_FRAC  = float(os.environ.get("IMAGE_QC_MIN_HEAD_UNIT_FRAC", "0.035"))

NOSE, NECK = 0, 1
R_HIP, R_KNEE, R_ANKLE = 8, 9, 10
L_HIP, L_KNEE, L_ANKLE = 11, 12, 13
R_EYE, L_EYE = 14, 15

SAMPLE_FRACTIONS = (0.0, 0.25, 0.5, 0.75, 1.0)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def emit(real_stdout, obj: dict) -> None:
    real_stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    real_stdout.flush()


def dist(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def bbox_iou(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    if inter <= 0:
        return 0.0
    area = lambda r: max(0.0, r[2] - r[0]) * max(0.0, r[3] - r[1])  # noqa: E731
    union = area(a) + area(b) - inter
    return inter / union if union > 0 else 0.0


class Person:
    """Geometric digest of one DWPose skeleton (same math as image QC)."""

    def __init__(self, kpts):
        body = kpts[:18]
        self.valid = {i: (float(p[0]), float(p[1])) for i, p in enumerate(body) if p[2] >= KP_CONF}
        xs = [p[0] for p in self.valid.values()]
        ys = [p[1] for p in self.valid.values()]
        self.bbox = (min(xs), min(ys), max(xs), max(ys)) if xs else None

        self.head_unit = None
        if NOSE in self.valid and NECK in self.valid:
            self.head_unit = dist(self.valid[NOSE], self.valid[NECK])
        if NOSE in self.valid:
            self.head_anchor = self.valid[NOSE]
        elif R_EYE in self.valid and L_EYE in self.valid:
            self.head_anchor = tuple((a + b) / 2 for a, b in zip(self.valid[R_EYE], self.valid[L_EYE]))
        else:
            self.head_anchor = None

        self.legs = []
        for hip, knee, ankle in ((R_HIP, R_KNEE, R_ANKLE), (L_HIP, L_KNEE, L_ANKLE)):
            if hip in self.valid and knee in self.valid and ankle in self.valid:
                self.legs.append((self.valid[hip], self.valid[knee], self.valid[ankle]))
        self.full_body = self.head_unit is not None and len(self.legs) > 0

        self.standing = False
        if self.full_body:
            neck_y = self.valid[NECK][1]
            for hip, knee, ankle in self.legs:
                ordered = neck_y < hip[1] < knee[1] < ankle[1]
                thigh_vertical = abs(knee[1] - hip[1]) >= abs(knee[0] - hip[0])
                shin_extended = abs(ankle[1] - knee[1]) >= 0.5 * abs(knee[1] - hip[1])
                if ordered and thigh_vertical and shin_extended:
                    self.standing = True
                    break

        self.head_height_ratio = None
        if self.full_body and self.head_unit and self.head_unit > 1e-6:
            ankle_y = max(leg[2][1] for leg in self.legs)
            self.head_height_ratio = (ankle_y - self.valid[NOSE][1]) / self.head_unit + 0.5


def detect(img, wholebody, face_app):
    """Skeletons + faces of one frame. Returns (persons, faces) where faces are
    insightface objects filtered by det score."""
    with contextlib.redirect_stdout(sys.stderr):
        kpts = wholebody(img)
    persons = [Person(k) for k in kpts] if kpts is not None else []
    persons = [p for p in persons if p.bbox is not None]
    h = img.shape[0]
    fg = [p for p in persons if
          (p.bbox[3] - p.bbox[1]) >= FG_MIN_FRACTION * h
          or (p.head_unit is not None and p.head_unit >= MIN_HEAD_UNIT_FRAC * h)]
    faces = []
    if face_app is not None:
        with contextlib.redirect_stdout(sys.stderr):
            all_faces = face_app.get(img)
        faces = [f for f in all_faces if float(f.det_score) >= FACE_DET_SCORE]
        heights = [float(f.bbox[3] - f.bbox[1]) for f in faces]
        primary = max(heights) if heights else 0.0
        # Foreground faces only — background heads are legitimate set dressing.
        faces = [f for f, fh in zip(faces, heights)
                 if primary == 0.0 or fh >= BG_FACE_FRACTION * primary]
    return fg, faces


def face_hue(img, face) -> tuple[float, float] | None:
    """(median hue 0-179, blue-band fraction) inside the central face patch."""
    import cv2
    import numpy as np
    x1, y1, x2, y2 = [int(v) for v in face.bbox]
    w, h = x2 - x1, y2 - y1
    if w < 8 or h < 8:
        return None
    # central 60% of the bbox — skip hair/background edges
    cx1, cy1 = x1 + int(w * 0.2), y1 + int(h * 0.2)
    cx2, cy2 = x2 - int(w * 0.2), y2 - int(h * 0.2)
    patch = img[max(0, cy1):cy2, max(0, cx1):cx2]
    if patch.size == 0:
        return None
    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
    hch, sch = hsv[..., 0].astype("float32"), hsv[..., 1].astype("float32")
    mask = sch > 30  # ignore desaturated pixels (white highlights, ink lines)
    if mask.sum() < 20:
        return None
    hues = hch[mask]
    # circular median via mean vector (adequate for a drift metric)
    ang = hues / 179.0 * 2 * math.pi
    med = math.atan2(float(np.sin(ang).mean()), float(np.cos(ang).mean()))
    med_h = (med % (2 * math.pi)) / (2 * math.pi) * 179.0
    blue = float(((hues >= 90) & (hues <= 135)).mean())
    return med_h, blue


def hue_circ_dist(a: float, b: float) -> float:
    d = abs(a - b) % 179.0
    return min(d, 179.0 - d)


def gray_identity_dist(a, b) -> float:
    """Normalized L2 between 64px grayscale versions of two images."""
    import cv2
    import numpy as np
    ga = cv2.cvtColor(cv2.resize(a, (64, 64), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    gb = cv2.cvtColor(cv2.resize(b, (64, 64), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    da = ga.astype("float32") / 255.0
    db = gb.astype("float32") / 255.0
    return float(np.sqrt(((da - db) ** 2).mean()))


def analyse_clip(job, wholebody, face_app, frames_dir):
    import cv2
    import numpy as np

    src = cv2.imread(job["source"], cv2.IMREAD_COLOR)
    if src is None:
        raise RuntimeError(f"cannot read source still: {job['source']}")

    # ── pass 1: diff scan only — learn the REAL frame count while reading ────
    # CAP_PROP_FRAME_COUNT lies on some encoders, so nothing here trusts it:
    # pass 1 stores no frames (memory-safe on any container), pass 2 re-decodes
    # and keeps exactly the indices we now know we need.
    cap = cv2.VideoCapture(job["video"])
    if not cap.isOpened():
        raise RuntimeError(f"cannot open video: {job['video']}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 16.0

    diffs: list[float] = []
    prev_small = None
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        sw = SCAN_W
        sh = max(1, int(small.shape[0] * sw / small.shape[1]))
        small = cv2.resize(small, (sw, sh), interpolation=cv2.INTER_AREA).astype("float32")
        if prev_small is not None:
            diffs.append(float(np.abs(small - prev_small).mean()))
        prev_small = small
        idx += 1
    cap.release()
    frames_total = idx
    if frames_total < 2:
        raise RuntimeError(f"clip has {frames_total} readable frame(s)")

    flags: list[str] = []
    suspicious: list[dict] = []

    motion_energy = float(np.mean(diffs))
    if motion_energy < STATIC_ENERGY:
        flags.append("static_clip")

    med = float(np.median(diffs)) or 1e-6
    max_spike = float(np.max(diffs))
    spike_at = min(int(np.argmax(diffs)) + 1, frames_total - 1)
    spike_flagged = max_spike > SPIKE_ABS and max_spike > SPIKE_RATIO * med
    if spike_flagged:
        flags.append("cut_spike")

    # ── pass 2: re-decode, keeping exactly the frames the checks need ────────
    want = sorted({min(frames_total - 1, round(f * (frames_total - 1))) for f in SAMPLE_FRACTIONS})
    grab = set(want)
    if spike_flagged:
        grab.add(spike_at)

    kept: dict[int, "np.ndarray"] = {}
    cap = cv2.VideoCapture(job["video"])
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx in grab:
            kept[idx] = frame
        idx += 1
    cap.release()

    samples: list[tuple[int, "np.ndarray"]] = [(w, kept[w]) for w in want if w in kept]
    if not samples:
        raise RuntimeError("second decode pass produced no sample frames")

    if spike_flagged:
        # NB: no `or`-fallback — ndarray truthiness raises on multi-element arrays.
        spike_frame = kept[spike_at] if spike_at in kept \
            else min(samples, key=lambda s: abs(s[0] - spike_at))[1]
        suspicious.append({"timeSec": round(spike_at / fps, 2), "reason": "cut_spike", "_frame": spike_frame})

    # ── source baseline ───────────────────────────────────────────────────────
    src_people, src_faces = detect(src, wholebody, face_app)
    src_hue = None
    if src_faces:
        primary_src = max(src_faces, key=lambda f: float(f.bbox[3] - f.bbox[1]))
        src_hue = face_hue(src, primary_src)

    # ── samples: counts + last-frame anatomy/hue + first-frame identity ─────
    sample_metrics = []
    hue_drift = None
    blue_fraction = None
    identity_dist = None

    for si, (fidx, frame) in enumerate(samples):
        people, faces = detect(frame, wholebody, face_app)
        t = round(fidx / fps, 2)
        sample_metrics.append({"t": t, "people": len(people), "faces": len(faces)})

        if len(people) > len(src_people) or len(faces) > len(src_faces):
            if "new_subject_mid_clip" not in flags:
                flags.append("new_subject_mid_clip")
            suspicious.append({"timeSec": t, "reason": "new_subject", "_frame": frame})

        if si == 0:
            identity_dist = gray_identity_dist(frame, src)
            if identity_dist > IDENTITY_MAX:
                flags.append("identity_drift")

        if si == len(samples) - 1:
            # anatomy on the closing frame — i2v degrades toward the tail
            h = frame.shape[0]
            for p in people:
                measurable = (p.full_body and p.standing and p.head_unit
                              and p.head_unit >= MIN_HEAD_UNIT_FRAC * h)
                if measurable and p.head_height_ratio is not None \
                        and p.head_height_ratio < DWARF_MIN_RATIO:
                    flags.append("anatomy_melt")
            for i in range(len(people)):
                for j in range(i + 1, len(people)):
                    if bbox_iou(people[i].bbox, people[j].bbox) >= FUSED_IOU:
                        flags.append("fused_bodies")
            # two faces on one skeleton
            assigned: dict[int, list[float]] = {}
            for f in faces:
                fh = float(f.bbox[3] - f.bbox[1])
                cx = float(f.bbox[0] + f.bbox[2]) / 2
                cy = float(f.bbox[1] + f.bbox[3]) / 2
                best_d, best_i = None, None
                for pi, p in enumerate(people):
                    if p.head_anchor is None:
                        continue
                    reach = 1.5 * (p.head_unit or fh)
                    d = dist(p.head_anchor, (cx, cy))
                    if d <= reach and (best_d is None or d < best_d):
                        best_d, best_i = d, pi
                if best_i is not None:
                    assigned.setdefault(best_i, []).append(fh)
            for fhs in assigned.values():
                if len(fhs) >= 2:
                    fhs.sort(reverse=True)
                    if fhs[1] >= TWO_HEAD_SIZE_RATIO * fhs[0]:
                        flags.append("two_heads_one_body")
            # blue faces: primary face hue vs the source face hue
            if faces and src_hue is not None:
                primary = max(faces, key=lambda f: float(f.bbox[3] - f.bbox[1]))
                fh = face_hue(frame, primary)
                if fh is not None:
                    hue_drift = round(hue_circ_dist(fh[0], src_hue[0]), 1)
                    blue_fraction = round(fh[1], 3)
                    src_blue = src_hue[1]
                    if hue_drift > HUE_DRIFT_MAX or (blue_fraction > BLUE_FRACTION and blue_fraction > src_blue + 0.2):
                        flags.append("skin_hue_drift")

    if not src_faces:
        flags.append("no_faces")
    if not src_people:
        flags.append("no_people")

    # ── persist suspicious frames as PNGs for the VLM layer ──────────────────
    out_susp = []
    for n, s in enumerate(suspicious[:4]):  # cap: 4 frames per clip is plenty
        fname = f"{job['id']}_{n}_{s['reason']}.png"
        fpath = os.path.join(frames_dir, fname)
        try:
            cv2.imwrite(fpath, s["_frame"])
            out_susp.append({"timeSec": s["timeSec"], "reason": s["reason"], "frame": fpath})
        except Exception as e:  # non-fatal: the flag still stands
            log(f"suspicious frame write failed: {e}")
            out_susp.append({"timeSec": s["timeSec"], "reason": s["reason"], "frame": None})

    return {
        "flags": sorted(set(flags)),
        "metrics": {
            "motionEnergy": round(motion_energy, 3),
            "maxCutSpike": round(max_spike, 2),
            "cutSpikeAt": round(spike_at / fps, 2),
            "hueDriftDeg": hue_drift,
            "blueFraction": blue_fraction,
            "identityDist": round(identity_dist, 4) if identity_dist is not None else None,
            "sourcePeople": len(src_people),
            "sourceFaces": len(src_faces),
            "framesTotal": frames_total,
            "samples": sample_metrics,
        },
        "suspicious": out_susp,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()

    with open(args.manifest, "r", encoding="utf-8") as fh:
        manifest = json.load(fh)
    jobs = manifest.get("jobs", [])
    frames_dir = manifest["framesDir"]
    os.makedirs(frames_dir, exist_ok=True)

    real_stdout = sys.stdout
    sys.stdout = sys.stderr  # exile library prints; NDJSON goes to real_stdout

    src_path = manifest["controlnetAuxSrc"]
    if src_path not in sys.path:
        sys.path.insert(0, src_path)

    import cv2  # noqa: F401
    from custom_controlnet_aux.dwpose.wholebody import Wholebody

    log(f"loading DWPose: det={manifest['detModel']} pose={manifest['poseModel']}")
    wholebody = Wholebody(manifest["detModel"], manifest["poseModel"])

    face_app = None
    try:
        from insightface.app import FaceAnalysis
        face_app = FaceAnalysis(
            name="antelopev2", root=manifest["insightfaceRoot"],
            allowed_modules=["detection"],
        )
        face_app.prepare(ctx_id=0, det_size=(640, 640))
    except Exception as e:
        log(f"insightface unavailable, face checks skipped: {e}")
        face_app = None

    count = 0
    for job in jobs:
        jid = job.get("id")
        try:
            result = analyse_clip(job, wholebody, face_app, frames_dir)
            if face_app is None:
                result["flags"] = sorted(set(result["flags"] + ["faces_unavailable"]))
            emit(real_stdout, {"id": jid, "ok": True, **result})
        except Exception as e:
            log(f"clip {jid} failed: {e}")
            emit(real_stdout, {"id": jid, "ok": False, "error": str(e)[:400]})
        count += 1

    emit(real_stdout, {"done": True, "count": count})
    return 0


if __name__ == "__main__":
    sys.exit(main())
