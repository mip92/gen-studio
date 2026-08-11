"""Image QC pose batch — deterministic layer of «Кадры QC».

Scores every candidate PNG in the manifest with DWPose skeletons (multi-person,
134 keypoints) + insightface scrfd faces, and emits raw geometric findings as
NDJSON, one line per image, flushed immediately — the Nest side upserts a
verdict per line, so a killed run loses nothing (same contract as
vo_transcribe_batch.py).

No ComfyUI server involved: DWPose is imported straight from
custom_nodes/comfyui_controlnet_aux/src. Run with the GLOBAL python (the one
ComfyUI itself uses) — it has torch+cu128, opencv, onnxruntime-gpu, insightface.

Manifest (UTF-8 JSON):
  {
    "detModel":  "abs path to yolox_l.onnx",
    "poseModel": "abs path to dw-ll_ucoco_384.onnx",
    "insightfaceRoot": "abs path whose models/antelopev2 holds the scrfd onnx",
    "controlnetAuxSrc": "abs path to comfyui_controlnet_aux/src",
    "jobs": [{"id", "image", "peopleExpected": int|null, "childExpected": bool}]
  }

stdout: pure NDJSON protocol (library prints are redirected to stderr).
  {"id", "ok": true, "peopleFound", "backgroundFaces", "flags": [...],
   "metrics": {...}}                     — one per image
  {"id", "ok": false, "error": "..."}    — per-image failure, batch continues
  {"done": true, "count": N}             — sentinel

Flags emitted (Nest maps them to Russian issues and pass/warn/fail):
  dwarf_proportions   adult, full body, standing, height < N head units  → fail
  two_heads_one_body  two comparable faces anchored to one skeleton      → fail
  extra_person        more foreground skeletons than ShotParticipants    → warn
  missing_person      fewer foreground skeletons than ShotParticipants   → warn
  fused_bodies        two skeleton bboxes with high IoU                  → warn
  orphan_face         big face with no skeleton (mirror/portrait/crowd)  → warn
  oversized_head      head/torso ratio anomaly on a standing figure      → warn
  no_full_body        nobody shows a full skeleton — proportions unjudged (info)
"""

from __future__ import annotations

import argparse
import contextlib
import json
import math
import os
import sys

# ── thresholds (env-tunable, calibrate after the pilot) ──────────────────────
KP_CONF             = float(os.environ.get("IMAGE_QC_KP_CONF", "0.3"))
# Standing adult below this many head-units tall → dwarf_proportions.
DWARF_MIN_RATIO     = float(os.environ.get("IMAGE_QC_DWARF_MIN_RATIO", "4.6"))
# head unit / torso length above this on a standing figure → oversized_head.
OVERSIZED_HEAD      = float(os.environ.get("IMAGE_QC_OVERSIZED_HEAD", "0.95"))
# A skeleton whose bbox height is below this fraction of image height counts as
# background (excluded from people-count and proportion checks).
FG_MIN_FRACTION     = float(os.environ.get("IMAGE_QC_FG_MIN_FRACTION", "0.22"))
# A face shorter than this fraction of the tallest face = background head.
BG_FACE_FRACTION    = float(os.environ.get("IMAGE_QC_BG_FACE_FRACTION", "0.4"))
# Two faces on one skeleton must be within this size ratio to count as a real
# second head (a tiny face overlapping a bbox is depth, not anatomy).
TWO_HEAD_SIZE_RATIO = float(os.environ.get("IMAGE_QC_TWO_HEAD_SIZE_RATIO", "0.6"))
# Skip proportion checks on skeletons whose head unit is tinier than this
# fraction of image height (too small to measure reliably).
MIN_HEAD_UNIT_FRAC  = float(os.environ.get("IMAGE_QC_MIN_HEAD_UNIT_FRAC", "0.035"))
# Longest side the image is downscaled to before inference.
MAX_DIM             = int(os.environ.get("IMAGE_QC_MAX_DIM", "1280"))
FUSED_IOU           = float(os.environ.get("IMAGE_QC_FUSED_IOU", "0.6"))
FACE_DET_SCORE      = float(os.environ.get("IMAGE_QC_FACE_DET_SCORE", "0.5"))

# OpenPose body indices (after wholebody.py's mmpose→openpose remap)
NOSE, NECK = 0, 1
R_HIP, R_KNEE, R_ANKLE = 8, 9, 10
L_HIP, L_KNEE, L_ANKLE = 11, 12, 13
R_EYE, L_EYE = 14, 15


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def emit(real_stdout, obj: dict) -> None:
    real_stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    real_stdout.flush()


def dist(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


class Person:
    """Geometric digest of one DWPose skeleton (pixel coords)."""

    def __init__(self, kpts):  # kpts: (134, 3) ndarray
        self.k = kpts
        body = kpts[:18]
        self.valid = {i: (float(p[0]), float(p[1])) for i, p in enumerate(body) if p[2] >= KP_CONF}
        xs = [p[0] for p in self.valid.values()]
        ys = [p[1] for p in self.valid.values()]
        self.bbox = (min(xs), min(ys), max(xs), max(ys)) if xs else None
        self.avg_conf = float(sum(float(p[2]) for p in body if p[2] >= KP_CONF) / max(1, len(self.valid)))

        self.head_unit = None
        if NOSE in self.valid and NECK in self.valid:
            self.head_unit = dist(self.valid[NOSE], self.valid[NECK])

        # Anchor for face→skeleton assignment: nose, else mid-eyes, else None.
        if NOSE in self.valid:
            self.head_anchor = self.valid[NOSE]
        elif R_EYE in self.valid and L_EYE in self.valid:
            self.head_anchor = tuple((a + b) / 2 for a, b in zip(self.valid[R_EYE], self.valid[L_EYE]))
        else:
            self.head_anchor = None

        self.legs = []  # (hip, knee, ankle) point triples that are fully visible
        for hip, knee, ankle in ((R_HIP, R_KNEE, R_ANKLE), (L_HIP, L_KNEE, L_ANKLE)):
            if hip in self.valid and knee in self.valid and ankle in self.valid:
                self.legs.append((self.valid[hip], self.valid[knee], self.valid[ankle]))

        self.full_body = self.head_unit is not None and len(self.legs) > 0

        # Standing = joints in vertical order AND at least one thigh more
        # vertical than horizontal. A sitting/kneeling figure compresses its
        # nose→ankle span and would false-flag as a dwarf, so proportions are
        # only judged on figures this test accepts.
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

        # Height in head units: nose→lowest ankle span / head unit, +0.5 for the
        # half head above the nose. Adults ≈ 6.5-7.5; dwarf artifacts ≈ 3-4.5.
        self.head_height_ratio = None
        if self.full_body and self.head_unit and self.head_unit > 1e-6:
            ankle_y = max(leg[2][1] for leg in self.legs)
            self.head_height_ratio = (ankle_y - self.valid[NOSE][1]) / self.head_unit + 0.5

        # Head unit vs torso length (neck→mid-hip). Oversized-head anomaly.
        self.head_torso_ratio = None
        hips = [self.valid[i] for i in (R_HIP, L_HIP) if i in self.valid]
        if self.head_unit and hips and NECK in self.valid:
            mid_hip = (sum(p[0] for p in hips) / len(hips), sum(p[1] for p in hips) / len(hips))
            torso = dist(self.valid[NECK], mid_hip)
            if torso > 1e-6:
                self.head_torso_ratio = self.head_unit / torso


def bbox_iou(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    if inter <= 0:
        return 0.0
    area = lambda r: max(0.0, r[2] - r[0]) * max(0.0, r[3] - r[1])  # noqa: E731
    union = area(a) + area(b) - inter
    return inter / union if union > 0 else 0.0


def analyse(img, people_expected, child_expected, wholebody, face_app):
    import cv2  # already imported globally; local ref for clarity

    h, w = img.shape[:2]
    scale = 1.0
    if max(h, w) > MAX_DIM:
        scale = MAX_DIM / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]

    with contextlib.redirect_stdout(sys.stderr):
        kpts_info = wholebody(img)  # (N, 134, 3) or None
    persons = [Person(k) for k in kpts_info] if kpts_info is not None else []
    persons = [p for p in persons if p.bbox is not None]

    # Foreground = big enough to be a subject, not set dressing.
    def is_foreground(p: Person) -> bool:
        bbox_h = p.bbox[3] - p.bbox[1]
        big_bbox = bbox_h >= FG_MIN_FRACTION * h
        big_head = p.head_unit is not None and p.head_unit >= MIN_HEAD_UNIT_FRAC * h
        return big_bbox or big_head

    foreground = [p for p in persons if is_foreground(p)]

    flags: list[str] = []
    metrics_persons = []

    for p in foreground:
        measurable = (
            p.full_body and p.standing
            and p.head_unit is not None
            and p.head_unit >= MIN_HEAD_UNIT_FRAC * h
        )
        if measurable and not child_expected:
            if p.head_height_ratio is not None and p.head_height_ratio < DWARF_MIN_RATIO:
                flags.append("dwarf_proportions")
            if p.head_torso_ratio is not None and p.head_torso_ratio > OVERSIZED_HEAD:
                flags.append("oversized_head")
        metrics_persons.append({
            "headHeightRatio": round(p.head_height_ratio, 2) if p.head_height_ratio else None,
            "headTorsoRatio":  round(p.head_torso_ratio, 2) if p.head_torso_ratio else None,
            "fullBodyVisible": p.full_body,
            "standing":        p.standing,
            "avgKpConf":       round(p.avg_conf, 2),
        })

    if foreground and not any(p.full_body for p in foreground):
        flags.append("no_full_body")

    for i in range(len(foreground)):
        for j in range(i + 1, len(foreground)):
            if bbox_iou(foreground[i].bbox, foreground[j].bbox) >= FUSED_IOU:
                flags.append("fused_bodies")

    people_found = len(foreground)
    if people_expected is not None:
        if people_found > people_expected:
            flags.append("extra_person")
        elif people_found < people_expected:
            flags.append("missing_person")

    # ── faces ────────────────────────────────────────────────────────────────
    background_faces = 0
    metrics_faces = []
    if face_app is not None:
        with contextlib.redirect_stdout(sys.stderr):
            faces = face_app.get(img)
        faces = [f for f in faces if float(f.det_score) >= FACE_DET_SCORE]
        heights = [float(f.bbox[3] - f.bbox[1]) for f in faces]
        primary_h = max(heights) if heights else 0.0

        assigned: dict[int, list[float]] = {}  # person idx → face heights
        for f, fh in zip(faces, heights):
            cx = float(f.bbox[0] + f.bbox[2]) / 2
            cy = float(f.bbox[1] + f.bbox[3]) / 2
            background = primary_h > 0 and fh < BG_FACE_FRACTION * primary_h
            if background:
                background_faces += 1

            person_idx = None
            if not background:
                best_d = None
                for idx, p in enumerate(foreground):
                    if p.head_anchor is None:
                        continue
                    reach = 1.5 * (p.head_unit or fh)
                    d = dist(p.head_anchor, (cx, cy))
                    if d <= reach and (best_d is None or d < best_d):
                        best_d, person_idx = d, idx
                if person_idx is not None:
                    assigned.setdefault(person_idx, []).append(fh)
                elif primary_h > 0 and fh >= TWO_HEAD_SIZE_RATIO * primary_h:
                    # Big face with no skeleton to belong to: mirror, portrait,
                    # or an uninvited someone. Never a fail on its own.
                    flags.append("orphan_face")

            metrics_faces.append({
                "h": round(fh / h, 3), "score": round(float(f.det_score), 2),
                "person": person_idx, "background": background,
            })

        for fhs in assigned.values():
            if len(fhs) >= 2:
                fhs.sort(reverse=True)
                if fhs[1] >= TWO_HEAD_SIZE_RATIO * fhs[0]:
                    flags.append("two_heads_one_body")

    return {
        "peopleFound":     people_found,
        "backgroundFaces": background_faces,
        "flags":           sorted(set(flags)),
        "metrics":         {"persons": metrics_persons, "faces": metrics_faces},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()

    with open(args.manifest, "r", encoding="utf-8") as fh:
        manifest = json.load(fh)
    jobs = manifest.get("jobs", [])

    # NDJSON protocol goes to the REAL stdout; everything else (torch/DWPose
    # prints) is exiled to stderr so a chatty library can't corrupt the stream.
    real_stdout = sys.stdout
    sys.stdout = sys.stderr

    src = manifest["controlnetAuxSrc"]
    if src not in sys.path:
        sys.path.insert(0, src)

    import cv2  # noqa: F401  (ensure it loads before model init)
    from custom_controlnet_aux.dwpose.wholebody import Wholebody

    log(f"loading DWPose: det={manifest['detModel']} pose={manifest['poseModel']}")
    wholebody = Wholebody(manifest["detModel"], manifest["poseModel"])

    face_app = None
    try:
        from insightface.app import FaceAnalysis
        log(f"loading insightface antelopev2 from {manifest['insightfaceRoot']}")
        face_app = FaceAnalysis(
            name="antelopev2", root=manifest["insightfaceRoot"],
            allowed_modules=["detection"],
        )
        face_app.prepare(ctx_id=0, det_size=(640, 640))
    except Exception as e:  # face layer is additive — skeletons still run
        log(f"insightface unavailable, face checks skipped: {e}")
        face_app = None

    count = 0
    for job in jobs:
        jid = job.get("id")
        try:
            img = cv2.imread(job["image"], cv2.IMREAD_COLOR)
            if img is None:
                raise RuntimeError(f"cannot read image: {job['image']}")
            result = analyse(
                img,
                job.get("peopleExpected"),
                bool(job.get("childExpected")),
                wholebody, face_app,
            )
            if face_app is None:
                result["flags"] = sorted(set(result["flags"] + ["faces_unavailable"]))
            emit(real_stdout, {"id": jid, "ok": True, **result})
        except Exception as e:  # per-item failure never aborts the batch
            log(f"job {jid} failed: {e}")
            emit(real_stdout, {"id": jid, "ok": False, "error": str(e)[:400]})
        count += 1

    emit(real_stdout, {"done": True, "count": count})
    return 0


if __name__ == "__main__":
    sys.exit(main())
