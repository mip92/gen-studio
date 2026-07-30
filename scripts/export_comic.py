# -*- coding: utf-8 -*-
"""
Comic-spread camera fly-through exporter — LIVE-LAYER edition.

Nothing is baked into a flat page: each panel is composited LIVE on its own
CapCut layer (full-HD preserved, editable in CapCut). A "page" in the manifest is
a two-page SPREAD (разворот) on one 16:9 sheet; the camera flies through the left
page's panels, then really pans across to the right page's panels (one continuous
sheet → a real fly-over, no fade). Between spreads a transition can be applied.

Per panel, on its own slot lane (sequential, non-overlapping in time):
  1) FIRST-frame poster still  — visible [spread start … camera arrival],
     carrying the composed camera keyframes so it stays glued to the sheet.
  2) VIDEO clip                — plays [arrival … depart] (the hold window),
     slowed to fill the hold when longer than the clip (source_timerange→speed).
  3) LAST-frame poster still   — visible [depart … spread end] (extracted from
     the clip via OpenCV) so AFTER the video the panel holds on its LAST frame,
     not the first. Static shots: just one still poster for the whole spread.

The sheet (paper + inked frames + vignette, EMPTY holes) is one background layer
carrying the camera path. Every layer's transform = camera(t) composed with the
layer's fixed place on the sheet → the whole spread moves as one rigid page.

Reuses export_capcut.py finalisation (CapCut-International rewrite, registration,
subtitles, audio probing). Manifest schema: see comic_manifest.py.
CLI: python export_comic.py --manifest <path>
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any, Callable, Dict, List, Tuple

import pyJianYingDraft as draft

from export_capcut import (
    _log, _cover_scale, _audio_duration_us, _wav_duration_us,
    rewrite_for_capcut_international, register_in_capcut,
)
from comic_pagebuild import render_page

KP = draft.KeyframeProperty

BAKE_KF_PER_SEC = 60       # dense travel keyframes: CapCut lerps position linearly
                           # between them, so during the fast roll the layers only
                           # stay glued if keyframes are close (else tiny arc-chord
                           # drift shows as residual parallax, user 2026-07-24)
MIN_BAKE_STEPS  = 5
# After the dense bake the grid is thinned by `_decimate`: samples CapCut would
# reconstruct by its own linear interpolation are dropped. The budget is the largest
# on-screen error a dropped sample may introduce, in pixels of the 1920×1080 frame.
# 60/s × 4 properties × every layer made a 35-min film weigh 285 MB / 1.3M keyframes,
# which CapCut needs minutes to open and often crashes on (user 2026-07-26).
DECIMATE_TOL_PX = 4.6
PANEL_INSET     = 0.0      # gap between the inked frame and the content (0 = tight)
# Long-VO rule: never slow a clip below this speed. When the voiceover forces a
# hold longer than native/SPEED_FLOOR, play the clip at exactly the floor speed
# and pad the remainder with freeze-frame PAUSES split across the two edges
# (first frame at the head, last frame at the tail).
SPEED_FLOOR     = 0.5
TURN_US         = 700_000  # pseudo-3D page-turn duration at each spread boundary

# ── organic camera (user 2026-07-22: «не линейно, покачивания, не по прямой») ──
HOLD_KF_PER_SEC = 2        # sample holds so the parked camera gently breathes/sways
ARC_FRAC        = 0.14     # travel bows sideways this fraction of its distance
ZOOM_DIP        = 0.28     # camera pulls BACK this much at mid-travel (lift & move)
SWAY_AMP_X      = 0.0032   # low-freq handheld drift (page-normalized units)
SWAY_AMP_Y      = 0.0026
SWAY_AMP_Z      = 0.010    # ±1% zoom breathing
# Camera ROLL (user 2026-07-24): tilt during travels, alternating side, level at
# holds. pyJianYingDraft: rotation is CLOCKWISE degrees; transform_x unit = half
# canvas WIDTH, transform_y = half HEIGHT (anisotropic) → the layer positions must
# be orbited by the SAME clockwise angle in true pixels (aspect-corrected) so the
# scene rolls rigidly (else off-centre panels drift → parallax).
ROT_TRAVEL_DEG  = 3.5      # peak tilt mid-travel — pronounced, one per travel; holds level
ASPECT          = 16.0 / 9.0


def _sway(t_us: int) -> Tuple[float, float, float]:
    """Deterministic low-amplitude handheld drift as a function of time — a couple
    of incommensurate sines per axis so it never reads as a clean loop. Returns
    (dcx, dcy, zoom_mul). Applied to EVERY baked keyframe of EVERY layer (same t →
    same offset) so the whole page stays rigid while it breathes."""
    ts = t_us / 1_000_000.0
    sx = SWAY_AMP_X * math.sin(ts * 0.90 + 0.0) + 0.45 * SWAY_AMP_X * math.sin(ts * 2.17 + 1.3)
    sy = SWAY_AMP_Y * math.sin(ts * 1.13 + 2.0) + 0.45 * SWAY_AMP_Y * math.sin(ts * 1.87 + 0.6)
    sz = 1.0 + SWAY_AMP_Z * math.sin(ts * 0.67 + 0.7)
    return sx, sy, sz


# ── camera composition ────────────────────────────────────────────────────────
# The sheet is rendered at canvas aspect: at scale 1, transform 0 the WHOLE sheet
# fills the frame. Screen position (half-canvas units) of a sheet point (px,py)
# under camera (cx,cy,zoom): ( 2z(px-cx), 2z(cy-py) ) [+y = UP in CapCut].
def _placer_bg(cx: float, cy: float, z: float) -> Tuple[float, float, float]:
    """Transform for the full-sheet background layer."""
    return (z, z * (1.0 - 2.0 * cx), z * (2.0 * cy - 1.0))


def _make_panel_placer(rect: dict) -> Callable[[float, float, float], Tuple[float, float, float]]:
    """Transform for a panel layer occupying page-rect `rect`, composed with the
    camera. Uses CONTAIN scale (uniform_scale 1.0 = fit-to-canvas), so the material
    is fit INSIDE the rect — never overflowing the frame, never cropped. For a 16:9
    rect (square in normalized coords) + 16:9 content this fills the frame exactly."""
    rw = rect["w"] - 2 * PANEL_INSET
    rh = rect["h"] - 2 * PANEL_INSET
    pcx = rect["x"] + rect["w"] / 2.0
    pcy = rect["y"] + rect["h"] / 2.0
    fit = min(rw, rh)

    def f(cx: float, cy: float, z: float) -> Tuple[float, float, float]:
        return (z * fit, 2.0 * z * (pcx - cx), 2.0 * z * (cy - pcy))
    return f


def _ease(p: float) -> float:
    if p < 0.5:
        return 4.0 * p * p * p
    q = -2.0 * p + 2.0
    return 1.0 - (q * q * q) / 2.0


def _probes(cam, t: int, width: int, height: int) -> List[Tuple[float, float]]:
    """Screen position, in pixels from the frame centre, of the page's four corners
    and its centre under the camera at `t`.

    Every baked layer is the SAME camera composed with a fixed affine placer, so
    bounding how far these probes move bounds the error of the whole page. That is
    what lets the decimator below work in honest on-screen pixels instead of in
    abstract camera units. Corners are the extremes — a zoom error displaces a point
    in proportion to its distance from the centre — so they give the upper bound.
    Mirrors the sheet mapping documented above (`2z(px-cx)`, `2z(cy-py)`, +y UP) and
    the clockwise roll applied in `_bake_layer`."""
    cx, cy, z, rot = cam(int(t))
    hw, hh = width / 2.0, height / 2.0
    rad = math.radians(rot); c, s = math.cos(rad), math.sin(rad)
    out = []
    for px, py in ((0.0, 0.0), (1.0, 0.0), (0.0, 1.0), (1.0, 1.0), (0.5, 0.5)):
        X = 2.0 * z * (px - cx) * hw
        Y = 2.0 * z * (cy - py) * hh
        out.append((X * c + Y * s, -X * s + Y * c))
    return out


def _decimate(cam, grid: List[int], width: int, height: int,
              tol_px: float = DECIMATE_TOL_PX) -> List[int]:
    """Drop grid times that CapCut would reconstruct on its own anyway.

    CapCut lerps LINEARLY between keyframes, so a sample already sitting on the
    straight line between its neighbours carries no information — only weight. This
    is Ramer–Douglas–Peucker over the camera path with the deviation measured as
    on-screen probe displacement, so `tol_px` literally means "no point of the page
    is ever more than this many pixels away from where the dense bake would put it".
    Holds barely shrink (they are 2/s already and near-straight); the savings come
    from the 60/s travels, where a cubic ease needs far fewer than 60 points/s to
    stay inside a few pixels.

    Decimating the SHARED grid — rather than each baked layer afterwards — is the
    whole point. Every layer goes on sampling the same times, so the page stays
    exactly as rigid as before. Per-layer decimation would hand the layers DIFFERENT
    grids, CapCut would draw different lines between them, and the page would come
    apart in flight: the very parallax the shared grid was introduced to kill."""
    if len(grid) < 3:
        return grid
    P = [_probes(cam, t, width, height) for t in grid]
    keep = {0, len(grid) - 1}
    stack = [(0, len(grid) - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        ta, tb = grid[a], grid[b]
        span = float(tb - ta)
        worst, wi = -1.0, None
        for i in range(a + 1, b):
            u = (grid[i] - ta) / span if span else 0.0
            d = 0.0
            for (xa, ya), (xb, yb), (xi, yi) in zip(P[a], P[b], P[i]):
                d = max(d, math.hypot(xi - (xa + (xb - xa) * u),
                                      yi - (ya + (yb - ya) * u)))
            if d > worst:
                worst, wi = d, i
        if worst > tol_px:
            keep.add(wi)
            stack.append((a, wi)); stack.append((wi, b))
    return [grid[i] for i in sorted(keep)]


def _build_camera(states: List[dict], width: int = 1920, height: int = 1080):
    """Return (cam, grid): `cam(t_us)->(cx,cy,zoom)` is the continuous camera path
    (eased speed + sideways ARC + mid-travel ZOOM-OUT on travels, constant on
    holds); `grid` is the sorted list of keyframe times covering the spread (dense
    on travels, sparse on holds). EVERY layer bakes on this SAME grid so all
    layers share identical keyframe times and stay glued (CapCut lerps between
    keyframes — only a shared grid keeps the page rigid). Sway is layered on top by
    `_bake_layer` (a pure function of t, so also identical across layers)."""
    segs = []
    grid = set()
    tcount = 0                          # travel index → alternates the roll direction
    for a, b in zip(states, states[1:]):
        t0, t1 = int(a["t_us"]), int(b["t_us"])
        if t1 <= t0:
            continue
        same = (abs(a["cx"] - b["cx"]) < 1e-6 and abs(a["cy"] - b["cy"]) < 1e-6
                and abs(a["zoom"] - b["zoom"]) < 1e-6)
        ti = -1 if same else tcount
        if not same:
            tcount += 1
        segs.append((t0, t1, a, b, same, ti))
        # Sample BOTH holds and travels so the camera is alive everywhere. A slowed
        # clip that also moves is kept glued by compensating its keyframe TIMES for
        # its speed (see `_bake_layer` time_scale) — CapCut reads a slowed clip's
        # keyframe time in the SOURCE (pre-speed) domain, so we pre-scale it.
        rate = HOLD_KF_PER_SEC if same else BAKE_KF_PER_SEC
        steps = max(1 if same else MIN_BAKE_STEPS, int((t1 - t0) / 1_000_000 * rate))
        for i in range(steps + 1):
            grid.add(t0 + int((t1 - t0) * i / steps))
    if states:
        grid.add(int(states[0]["t_us"])); grid.add(int(states[-1]["t_us"]))

    def cam(t: int) -> Tuple[float, float, float, float]:
        if not segs:
            s = states[0] if states else {"cx": 0.5, "cy": 0.5, "zoom": 1.0}
            return (s["cx"], s["cy"], s["zoom"], 0.0)
        if t <= segs[0][0]:
            a = segs[0][2]; return (a["cx"], a["cy"], a["zoom"], 0.0)
        for (t0, t1, a, b, same, ti) in segs:
            if t0 <= t <= t1:
                if same:
                    # HOLD: gentle X/Y/zoom breathing over the whole hold, but ZERO
                    # roll — the (possibly SLOWED) video plays here and must stay
                    # perfectly level; rolling it meant its source-time-warped rotation
                    # keyframes desynced from the sheet → parallax (user 2026-07-24).
                    # The roll lives only on travels, where all visible layers are
                    # normal-speed posters/sheet/frames and stay rigid.
                    win = math.sin(math.pi * (t - t0) / (t1 - t0)) if t1 > t0 else 0.0
                    sx, sy, sz = _sway(t)
                    return (a["cx"] + sx * win, a["cy"] + sy * win,
                            a["zoom"] * (1.0 + (sz - 1.0) * win), 0.0)
                p = _ease((t - t0) / (t1 - t0)); bow = math.sin(math.pi * p)
                dx, dy = b["cx"] - a["cx"], b["cy"] - a["cy"]
                dist = math.hypot(dx, dy)
                px, py = (-dy / dist, dx / dist) if dist > 1e-6 else (0.0, 0.0)
                arc = ARC_FRAC * dist
                # sway is windowed by `bow` → it vanishes at both ends, so the
                # travel joins the (still) holds seamlessly with no jump.
                sx, sy, sz = _sway(t)
                # ROLL: tilt during the travel, alternating side per travel, 0 at
                # both ends → approach each panel at a slight angle, level to view it.
                sign = 1.0 if (ti % 2 == 0) else -1.0
                rot = ROT_TRAVEL_DEG * sign * bow
                return (a["cx"] + dx * p + (px * arc + sx) * bow,
                        a["cy"] + dy * p + (py * arc + sy) * bow,
                        (a["zoom"] + (b["zoom"] - a["zoom"]) * p)
                        * (1.0 - ZOOM_DIP * bow) * (1.0 + (sz - 1.0) * bow), rot)
        b = segs[-1][3]; return (b["cx"], b["cy"], b["zoom"], 0.0)

    dense = sorted(grid)
    thin = _decimate(cam, dense, width, height)
    _log(f'camera grid: {len(dense)} samples -> {len(thin)} after decimation '
         f'({len(thin)/max(1, len(dense)):.0%}, <={DECIMATE_TOL_PX}px)')
    return cam, thin


def _bake_layer(seg, cam, grid, placer, lo: int, hi: int, t0: int,
                time_scale: float = 1.0) -> int:
    """Bake one layer over its lifetime [lo, hi] (page-relative µs) by sampling the
    shared `cam` at the shared `grid` times inside the window (plus the exact
    endpoints) and mapping through `placer`. Offsets are relative to segment start
    `t0`. All layers share `cam`+`grid`, so the page stays rigid.

    `time_scale` pre-warps the written keyframe offset: a SLOWED video clip
    (speed = src/target < 1) has its keyframe times read by CapCut in the SOURCE
    domain, so pass time_scale=speed to make them land on the right timeline
    moments and track the (image) layers. Image layers use time_scale=1.0."""
    times = [t for t in grid if lo <= t <= hi]
    if not times or times[0] > lo:
        times = [lo] + times
    if times[-1] < hi:
        times = times + [hi]
    n = 0; prev = None
    for t in times:
        if prev is not None and t <= prev:
            continue
        prev = t
        cx, cy, z, rot = cam(int(t))
        s, tx, ty = placer(cx, cy, z)
        # ROLL: CapCut rotates a clip CLOCKWISE about its own centre. To roll the
        # whole scene rigidly about the frame centre, orbit each layer's position by
        # the SAME clockwise angle — in true pixels (transform_x is half-WIDTH units,
        # transform_y half-HEIGHT, so divide/multiply by ASPECT). Sign matches the
        # clockwise clip rotation (mismatched sign = double-drift = parallax).
        if rot:
            rad = math.radians(rot); c = math.cos(rad); sn = math.sin(rad)
            tx, ty = tx * c + ty * sn / ASPECT, -tx * sn * ASPECT + ty * c
        off = int((t - t0) * time_scale)
        seg.add_keyframe(KP.uniform_scale, off, s)
        seg.add_keyframe(KP.position_x,    off, tx)
        seg.add_keyframe(KP.position_y,    off, ty)
        seg.add_keyframe(KP.rotation,      off, rot)
        n += 1
    return n


# ── last-frame extraction (OpenCV; ffmpeg not required) ───────────────────────
def _last_frame_png(video_path: str, cache_dir: Path, key: str) -> "str | None":
    out = cache_dir / f"{key}_last.png"
    if out.exists():
        return str(out).replace("\\", "/")
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if total > 3:
            cap.set(cv2.CAP_PROP_POS_FRAMES, total - 3)
        last = None
        while True:
            ok, fr = cap.read()
            if not ok:
                break
            last = fr
        cap.release()
        if last is None:
            return None
        cache_dir.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(out), last)
        return str(out).replace("\\", "/")
    except Exception as e:  # noqa: BLE001
        _log(f'last-frame extract failed for {video_path}: {e!r}')
        return None


def _slice(states: List[dict], lo: int, hi: int) -> List[dict]:
    """States with lo <= t <= hi (inclusive), preserving order."""
    return [s for s in states if lo - 1 <= s["t_us"] <= hi + 1]


# ── pseudo-3D page turn ───────────────────────────────────────────────────────
def _outgoing_panels(page: dict, frames_dir: Path) -> List[dict]:
    """`page`'s panels with each animated one's still swapped for the LAST frame of
    its clip — the frame that is actually on screen when the page starts to turn.

    Without this the turn snapped every panel of the outgoing page back to its
    FIRST frame: the live layer holds the last frame at the end of a spread (the
    full-spread base underlay is built from `_last_frame_png`), while the baked turn
    images used `still_path`, which is the first frame. The mismatch reads as every
    panel jumping to a different shot the instant the page lifts (user 2026-07-26).
    Extraction is cached by shotCode, so this re-uses the PNGs the main pass wrote.
    """
    out = []
    for p in (page.get("panels") or []):
        media = p.get("media") or {}
        vpath = str(media.get("path") or '').replace("\\", "/")
        if vpath:
            last = _last_frame_png(vpath, frames_dir, str(p.get("shotCode") or ''))
            if last:
                p = {**p, "still_path": last}
        out.append(p)
    return out


def _add_page_turns(script, pages, spread_bounds, pages_dir, *,
                    width, height, ss, style, texture, frames_dir: Path,
                    tail_page=None) -> int:
    """At each spread boundary, overlay a wide book (opaque) + a leaf that flips
    across the spine. The leaf carries baked panel content (stills). The spine is
    the canvas centre, and scale_x scales about the centre, so animating scale_x
    from 1→0 (front, current right page) then 0→1 (back, next left page) reads as a
    page turning. Full-canvas images placed at scale 1 / transform 0 (= the wide
    book), so no half-page scale math is needed.

    `tail_page` exists for the CHUNKED export (`comic_chunks`), where the film is
    generated as several drafts that are rendered separately and concatenated. Turns
    live BETWEEN pages of one manifest, so a chunk would otherwise end with a hard
    cut where the flip belongs. Passing the NEXT chunk's first page renders one extra
    turn past the last spread — the chunk then ends with the flip and the next chunk
    opens on the new spread, exactly as the uncut film reads. It is render-only: the
    page never goes on this chunk's timeline. None (the full export) = unchanged."""
    from PIL import Image
    from comic_page_style import _page_boxes
    from comic_pagebuild import _rect_to_px

    # Turn images sit at CANVAS SCALE: every one of them is keyframed to
    # uniform_scale 1.0 / position 0,0 (the leaf only ever shrinks, scale_x 1→0), and
    # the camera has already pulled back to the wide book during END_HOLD. So unlike
    # the sheet — which the camera magnifies up to 3.376× — these are displayed 1:1
    # with the 1920×1080 frame and need no zoom headroom at all. ss2 keeps a 2×
    # cushion for the horizontal squeeze; the old ss4 was a straight 4× waste that
    # also softened them, since surplus raster is averaged away in the downscale
    # (measured on the ink overlay: sharpness fell monotonically as raster grew).
    # 66 full-canvas images per film — this was the export's slowest stage and the
    # bulk of its media weight, 1697 MB → ~425 MB (user 2026-07-26).
    tss = max(2, min(ss, 2))
    Wp, Hp = width * tss, height * tss

    def _cx(p):
        r = p["rect"]; return r["x"] + r["w"] / 2.0

    def _side(pg, right):  # panels on the right (True) or left (False) page
        return [p for p in (pg.get("panels") or []) if (_cx(p) >= 0.5) == right]

    def _pagebox(all_panels, right):
        """Pixel rect of the requested page's paper leaf (so the flipping leaf is
        JUST that page — no fake page-block leaves / fore-edge, which stay static)."""
        ppx = [_rect_to_px(p["rect"], Wp, Hp) for p in all_panels]
        boxes, mid = _page_boxes(ppx, Wp, Hp)
        for b in boxes:
            if (((b[0] + b[2]) / 2) >= mid) == right:
                return b
        return boxes[-1]

    def _bake_bg(panels_subset, seed, out: Path) -> str:  # opaque full book (static)
        render_page(width=width, height=height, panels=panels_subset, style_name=style,
                    texture_path=texture, supersample=tss, seed=seed,
                    bake_content=True, draw_frames=True).save(out)
        return str(out).replace("\\", "/")

    def _bake_leaf(all_panels, seed, out: Path, right: bool) -> str:  # ONE page only
        img = render_page(width=width, height=height, panels=all_panels, style_name=style,
                          texture_path=texture, supersample=tss, seed=seed,
                          bake_content=True, draw_frames=True).convert("RGBA")
        x0, y0, x1, y1 = _pagebox(all_panels, right)
        mask = Image.new("L", img.size, 0)
        mask.paste(255, (x0, y0, x1, y1))          # keep only the page rectangle
        img.putalpha(mask)
        img.save(out)
        return str(out).replace("\\", "/")

    def _kf(seg, off, sx):                          # one full transform keyframe
        seg.add_keyframe(KP.scale_x, off, max(0.02, sx))
        seg.add_keyframe(KP.scale_y, off, 1.0)
        seg.add_keyframe(KP.position_x, off, 0.0)
        seg.add_keyframe(KP.position_y, off, 0.0)

    STEPS = 10
    half = TURN_US // 2
    n = 0
    # (index, ending page, opening page, boundary). The trailing entry only exists
    # for a chunk that is followed by another one — see `tail_page` above.
    flips = [(i, pages[i], pages[i + 1], int(spread_bounds[i]))
             for i in range(len(pages) - 1)]
    if tail_page is not None:
        flips.append((len(pages) - 1, pages[-1], tail_page, int(spread_bounds[-1])))
    for i, A, B, tb in flips:
        sA = int(A.get("pageIndex", i)) + 1
        sB = int(B.get("pageIndex", i + 1)) + 1
        # Asymmetric on purpose. A is the page being turned AWAY: it must show the
        # LAST frame of each clip, matching what the live layer holds at that moment.
        # B is the page coming IN: it opens on its first frames, exactly as the next
        # spread will start. Mixing these up is what made the picture jump.
        a_panels = _outgoing_panels(A, frames_dir)
        b_panels = B.get("panels") or []
        A_out = {**A, "panels": a_panels}
        bg    = _bake_bg(_side(A_out, False) + _side(B, True), sA, pages_dir / f"turn_bg_{i:03d}.png")
        front = _bake_leaf(a_panels, sA, pages_dir / f"turn_front_{i:03d}.png", right=True)
        back  = _bake_leaf(b_panels, sB, pages_dir / f"turn_back_{i:03d}.png",  right=False)

        # Start the turn AT the boundary (not straddling it): the spread's END_HOLD
        # already pulled the camera back to the wide book, so the flip begins from
        # that wide view and plays into the next spread's opening (user 2026-07-24).
        t0 = tb

        bg_seg = draft.VideoSegment(
            draft.VideoMaterial(bg, material_name=f"turn_bg_{i}"),
            target_timerange=draft.Timerange(start=t0, duration=TURN_US))
        for off in (0, TURN_US):
            bg_seg.add_keyframe(KP.uniform_scale, off, 1.0)
            bg_seg.add_keyframe(KP.position_x, off, 0.0)
            bg_seg.add_keyframe(KP.position_y, off, 0.0)
        script.add_segment(bg_seg, track_name="comic_turn_bg"); n += 2

        fseg = draft.VideoSegment(
            draft.VideoMaterial(front, material_name=f"turn_front_{i}"),
            target_timerange=draft.Timerange(start=t0, duration=half))
        for k in range(STEPS + 1):
            p = k / STEPS
            _kf(fseg, int(half * p), math.cos(p * math.pi / 2))   # 1 → 0
        script.add_segment(fseg, track_name="comic_turn_leaf"); n += STEPS + 1

        bseg = draft.VideoSegment(
            draft.VideoMaterial(back, material_name=f"turn_back_{i}"),
            target_timerange=draft.Timerange(start=t0 + half, duration=TURN_US - half))
        for k in range(STEPS + 1):
            p = k / STEPS
            _kf(bseg, int((TURN_US - half) * p), math.sin(p * math.pi / 2))  # 0 → 1
        script.add_segment(bseg, track_name="comic_turn_leaf"); n += STEPS + 1

    _log(f'page-turns: {len(pages) - 1} boundary flip(s)')
    return n


# ── draft assembly ────────────────────────────────────────────────────────────
def build_comic_draft(manifest: dict) -> Path:
    width  = int(manifest.get("width", 1920))
    height = int(manifest.get("height", 1080))
    fps    = int(manifest.get("fps", 30))
    ss     = int(manifest.get("supersample", 3))
    style  = str(manifest.get("page_style") or "old_comic")
    texture = manifest.get("texture_path") or None
    pages   = manifest.get("pages") or []

    drafts_root = Path(manifest.get("capcut_drafts_root") or manifest["output_root"])
    drafts_root.mkdir(parents=True, exist_ok=True)
    draft_dir = drafts_root / manifest["draft_name"]
    pages_dir = Path(manifest.get("pages_dir") or (draft_dir / "pages"))
    pages_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = pages_dir.parent / "frames"          # last-frame cache

    script = draft.ScriptFile(width=width, height=height, fps=fps, maintrack_adsorb=False)
    script.add_track(draft.TrackType.video, "comic_page", relative_index=0)
    max_slots = int(manifest.get("max_panel_slots")
                    or max((len(p.get("panels") or []) for p in pages), default=1))
    # BASE lanes (below): the panel's WHOLE-SPREAD poster — a static shot's still, or
    # a video shot's LAST frame. Rendered exactly like a static panel (full span,
    # t0=0) → no drift (user 2026-07-24). SLOT lanes (above): the intro first-frame +
    # the slowed video clip, covering only [0, video_end]; after the video ends the
    # slot is empty and the base poster shows through.
    for i in range(max_slots):
        script.add_track(draft.TrackType.video, f"base_{i}", relative_index=i + 1)
    for i in range(max_slots):
        script.add_track(draft.TrackType.video, f"slot_{i}", relative_index=max_slots + 1 + i)
    # TOP track: the marker frames ride ABOVE every panel (borders visible / lap on)
    script.add_track(draft.TrackType.video, "comic_frames", relative_index=2 * max_slots + 1)
    # ABOVE everything: the page-turn overlay (opaque wide book + the flipping leaf)
    script.add_track(draft.TrackType.video, "comic_turn_bg",   relative_index=2 * max_slots + 2)
    script.add_track(draft.TrackType.video, "comic_turn_leaf", relative_index=2 * max_slots + 3)
    script.add_track(draft.TrackType.audio, "narration")

    subtitle_cues: List[tuple] = []
    page_segments: List["draft.VideoSegment"] = []
    frame_segments: List["draft.VideoSegment"] = []
    spread_bounds: List[int] = []
    total_pages = total_panels = total_clips = total_kf = total_tts = 0
    timeline_end_us = 0

    def matdims(path: str) -> Tuple[int, int]:
        try:
            m = draft.VideoMaterial(path)
            return m.width, m.height
        except Exception:
            return width, height

    for page in pages:
        panels = page.get("panels") or []
        p_start = int(page.get("page_start_us") or 0)
        p_dur   = int(page.get("page_duration_us") or 0)
        states  = page.get("camera_states") or []
        if p_dur <= 0:
            continue
        # ONE shared camera curve + keyframe grid for the whole spread → every
        # layer below bakes on it, so the sheet, videos and frames stay glued.
        cam, grid = _build_camera(states, width, height)

        pidx = int(page.get("pageIndex", 0))
        # 1) SHEET background (desk + book + EMPTY holes; NO borders — those go on
        #    the TOP overlay so they sit ABOVE the live video, not hidden under it)
        sheet = render_page(width=width, height=height, panels=panels,
                            style_name=style, texture_path=texture,
                            supersample=ss, seed=pidx + 1,
                            bake_content=False, draw_frames=False)
        png = pages_dir / f'spread_{pidx:03d}.png'
        sheet.save(png)
        bg_seg = draft.VideoSegment(
            draft.VideoMaterial(str(png).replace("\\", "/"), material_name=f'spread_{page.get("pageKey")}'),
            target_timerange=draft.Timerange(start=p_start, duration=p_dur))
        total_kf += _bake_layer(bg_seg, cam, grid, _placer_bg, 0, p_dur, 0)
        script.add_segment(bg_seg, track_name="comic_page")
        page_segments.append(bg_seg)
        total_pages += 1

        # 1b) FRAMES overlay (transparent PNG, only the marker borders) on the TOP
        #     track, carrying the SAME camera path as the sheet → the borders ride
        #     on top of every panel and lap slightly onto the footage.
        fpng = pages_dir / f'frames_{pidx:03d}.png'
        # Render the frames overlay at the SAME resolution as the paper sheet. The
        # old rule (`min(8, ss + 2)`) assumed thin geometry wants extra pixels; a
        # controlled A/B on this very overlay says the opposite — screen sharpness at
        # max zoom fell monotonically as the raster grew (ss4 218.5 / ss6 192.5 /
        # ss8 173.6, Laplacian variance of the 1920×1080 the camera actually sees).
        # Past ~1920×max_zoom the surplus pixels cannot reach the frame; they only
        # get averaged away by the downscale, which is what softened the ink lines
        # the rule existed to protect (user 2026-07-26).
        frame_ss = ss
        render_page(width=width, height=height, panels=panels, style_name=style,
                    texture_path=texture, supersample=frame_ss, seed=pidx + 1,
                    frames_only=True).save(fpng)
        fr_seg = draft.VideoSegment(
            draft.VideoMaterial(str(fpng).replace("\\", "/"), material_name=f'frames_{page.get("pageKey")}'),
            target_timerange=draft.Timerange(start=p_start, duration=p_dur))
        total_kf += _bake_layer(fr_seg, cam, grid, _placer_bg, 0, p_dur, 0)
        script.add_segment(fr_seg, track_name="comic_frames")
        frame_segments.append(fr_seg)

        # 2) LIVE panel layers
        for panel in panels:
            total_panels += 1
            slot = min(int(panel.get("slot", 0)), max_slots - 1)
            lane = f"slot_{slot}"
            rect = panel["rect"]
            still = panel.get("still_path")
            media = panel.get("media")
            arrival = int(panel.get("arrival_us") or 0)
            hold    = int(panel.get("hold_us") or 0)
            depart  = int(panel.get("depart_us") or (arrival + hold))
            zoom_focus = float(panel.get("zoom") or 1.5)

            placer_still = _make_panel_placer(rect)

            if media and media.get("path"):
                vpath = str(media["path"]).replace("\\", "/")
                # Real material length (mat.duration) — NOT the params length/fps
                # math, which over-reports for RIFE 2x smooth clips.
                mat = draft.VideoMaterial(vpath, material_name=panel["shotCode"])
                native = int(getattr(mat, "duration", 0) or 0)
                # ── long-VO rule: slow to a floor, then pad the edges with freezes ──
                # hold <= native            → trim (speed 1, play first `hold`)
                # native < hold <= native/floor → slow to fill (speed >= floor)
                # hold > native/floor       → floor speed + freeze-pauses split edges
                if native <= 0 or hold <= native:
                    pause_in = pause_out = 0
                    video_screen = hold
                    src_win = min(hold, native) if native > 0 else hold
                else:
                    max_screen = int(native / SPEED_FLOOR)
                    if hold <= max_screen:
                        pause_in = pause_out = 0
                        video_screen = hold; src_win = native      # slow to fill (>= floor)
                    else:
                        video_screen = max_screen; src_win = native  # exactly floor speed
                        pause = hold - video_screen
                        pause_in = pause // 2; pause_out = pause - pause_in
                video_start = arrival + pause_in
                video_end   = video_start + video_screen
                # BASE (below): the WHOLE-SPREAD poster = the LAST frame, baked EXACTLY
                # like a static-shot panel (full span [0,p_dur], t0=0). Static panels
                # never drift, and neither does this — the earlier per-tail short
                # segment (t0=video_end) was the thing that drifted on travels
                # (user 2026-07-24). fp + clip overlay it during [0,video_end]; after
                # the video the base shows through. Falls back to the still.
                lastf = _last_frame_png(vpath, frames_dir, panel["shotCode"])
                base_mat = lastf or still
                if base_mat:
                    bp = draft.VideoSegment(
                        draft.VideoMaterial(base_mat, material_name=f'{panel["shotCode"]}_tail'),
                        target_timerange=draft.Timerange(start=p_start, duration=p_dur),
                        source_timerange=draft.Timerange(start=0, duration=p_dur))
                    total_kf += _bake_layer(bp, cam, grid, placer_still, 0, p_dur, 0)
                    script.add_segment(bp, track_name=f"base_{slot}")
                # (a) intro first-frame poster [0 … video_start] on the SLOT lane (above base)
                if still and video_start > 0:
                    fp = draft.VideoSegment(
                        draft.VideoMaterial(still, material_name=f'{panel["shotCode"]}_first'),
                        target_timerange=draft.Timerange(start=p_start, duration=video_start),
                        source_timerange=draft.Timerange(start=0, duration=video_start))
                    total_kf += _bake_layer(fp, cam, grid, placer_still, 0, video_start, 0)
                    script.add_segment(fp, track_name=lane)
                # (b) the clip (floor-capped slow-mo — DO NOT change its speed). Bake the
                #     panel's focus state as keyframes so the video sways in lockstep.
                clip = draft.VideoSegment(
                    mat,
                    target_timerange=draft.Timerange(start=p_start + video_start, duration=video_screen),
                    source_timerange=draft.Timerange(start=0, duration=src_win) if native > 0 else None)
                speed_ratio = (src_win / video_screen) if (native > 0 and video_screen > 0) else 1.0
                total_kf += _bake_layer(clip, cam, grid, placer_still, video_start, video_end,
                                        video_start, speed_ratio)
                script.add_segment(clip, track_name=lane)
                total_clips += 1
            elif still:
                # static shot: one still poster for the whole spread (on the base lane)
                sp = draft.VideoSegment(
                    draft.VideoMaterial(still, material_name=panel["shotCode"]),
                    target_timerange=draft.Timerange(start=p_start, duration=p_dur),
                    source_timerange=draft.Timerange(start=0, duration=p_dur))
                total_kf += _bake_layer(sp, cam, grid, placer_still, 0, p_dur, 0)
                script.add_segment(sp, track_name=f"base_{slot}")

            # narration wav anchored to camera arrival
            narr = panel.get("narration")
            if narr and narr.get("path"):
                wav = str(narr["path"]).replace("\\", "/")
                actual = _wav_duration_us(wav)
                dur = actual if actual > 0 else int(narr.get("duration_us") or 0)
                if dur > 0:
                    start = p_start + arrival
                    a_seg = draft.AudioSegment(
                        draft.AudioMaterial(wav, material_name=f'{panel["shotCode"]}_narration'),
                        target_timerange=draft.Timerange(start=start, duration=dur))
                    script.add_segment(a_seg, track_name="narration")
                    total_tts += 1
                    txt = (narr.get("text") or "").strip()
                    if txt:
                        subtitle_cues.append((start, start + dur, txt))

        spread_bounds.append(p_start + p_dur)
        timeline_end_us = max(timeline_end_us, p_start + p_dur)

    # 3) between-spread PAGE-TURN. The native CapCut flips (立体翻页 …) don't render
    #    unless the effect is cached, so we build our OWN pseudo-3D turn: a full-frame
    #    wide book (left = ending spread's left page, right = next spread's right page)
    #    is overlaid at the boundary, and a leaf carrying baked content flips across
    #    the spine (scale_x, which scales about the canvas centre = the spine).
    preset = str(manifest.get("page_transition") or "none").lower()
    # `turn_tail_page` is set only by the chunked export: it renders one extra flip
    # past the final spread so the chunk ends on the turn instead of a hard cut, and
    # the timeline grows by exactly that flip.
    tail_page = manifest.get("turn_tail_page")
    if preset in ("turn3d", "turn", "flip") and (len(pages) > 1 or tail_page):
        total_kf += _add_page_turns(
            script, pages, spread_bounds, pages_dir,
            width=width, height=height, ss=ss, style=style, texture=texture,
            frames_dir=frames_dir, tail_page=tail_page)
        if tail_page:
            timeline_end_us += TURN_US

    # 4) BGM
    total_bgm = _place_bgm(script, manifest)

    # 5) write + finalise
    draft_dir.mkdir(parents=True, exist_ok=True)
    out_path = draft_dir / "draft_content.json"
    script.dump(str(out_path))
    rewrite_for_capcut_international(
        out_path, subtitle_cues if manifest.get("embed_subtitles", True) else None, drafts_root)
    register_in_capcut(drafts_root, draft_dir, manifest["draft_name"], timeline_end_us)

    _log(f'comic export: spreads={total_pages} panels={total_panels} clips={total_clips} '
         f'camera_keyframes={total_kf} narration={total_tts} bgm={total_bgm} '
         f'duration_us={timeline_end_us}')
    return draft_dir


def _bgm_label(title: str, block: str, lane: str) -> str:
    """Readable name for a BGM track/clip: WHICH ACT this music belongs to.

    The raw names were `bgm_bgm_tighten_a` — the block slug already starts with
    `bgm_`, so the prefix doubled and nothing said where in the film the act sits.

    The act name is taken from the block's own title (`narrative_blocks.title`,
    carried into the manifest as `blockTitle`) — its head before the dash is exactly
    "Акт 4" / "Cold open" / "Финал". An earlier version numbered the blocks by their
    order on the timeline instead, which was WRONG: the cold open is not an act, so
    every act came out one too high and the opening and the finale were labelled as
    acts at all (user caught it 2026-07-26). Never re-derive the act number here —
    the database already knows it."""
    head = (title or "").split("—")[0].split(" - ")[0].strip()
    if not head:
        head = block[4:] if block.startswith("bgm_") else block
    role = {"a": "осн.", "b": "запас"}.get(lane, lane)
    return f"{head} · {role}"


def _place_bgm(script: "draft.ScriptFile", manifest: dict) -> int:
    """Checkerboard BGM placement (copied from export_capcut.build_draft)."""
    BGM_CROSSFADE_US = 3_000_000
    tracks = list(manifest.get("music_tracks") or [])
    if not tracks:
        return 0
    by_block: Dict[str, List[Dict[str, Any]]] = {}
    order: List[str] = []
    for mt in tracks:
        b = str(mt.get("blockSlug") or mt.get("act") or "default") or "default"
        if b not in by_block:
            by_block[b] = []; order.append(b)
        by_block[b].append(mt)
    # The act name comes from the block itself, never from its position here.
    titles = {b: str(next((t.get("blockTitle") for t in by_block[b] if t.get("blockTitle")), ""))
              for b in order}
    placed_total = 0
    for b in order:
        tiles = sorted(by_block[b], key=lambda t: int(t.get("order") or 0))
        seen: List[str] = []
        for mt in tiles:
            lane = str(mt.get("lane") or "a")
            if lane not in seen:
                script.add_track(draft.TrackType.audio, _bgm_label(titles[b], b, lane))
                seen.append(lane)
        cursor = int(tiles[0].get("block_start_us") or 0)
        for mt in tiles:
            lane = str(mt.get("lane") or "a")
            wav = mt["path"].replace("\\", "/")
            dur = _audio_duration_us(wav) or int(mt.get("render_duration_us") or 0)
            if dur <= 0:
                continue
            start = cursor
            cursor += max(1_000_000, dur - BGM_CROSSFADE_US)
            label = _bgm_label(titles[b], b, lane)
            seg = draft.AudioSegment(
                # material_name is what CapCut prints ON the clip in the timeline —
                # label it too, not just the track, or the act stays invisible there.
                draft.AudioMaterial(wav, material_name=label),
                target_timerange=draft.Timerange(start=start, duration=dur),
                source_timerange=draft.Timerange(start=0, duration=dur), volume=0.2)
            fade = min(BGM_CROSSFADE_US, dur // 2)
            seg.add_fade(in_duration=fade, out_duration=fade)
            script.add_segment(seg, track_name=label)
            placed_total += 1
    return placed_total


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()
    mpath = Path(args.manifest)
    if not mpath.exists():
        _log(f"manifest missing: {mpath}"); return 2
    manifest = json.loads(mpath.read_text(encoding="utf-8"))
    if not manifest.get("pages"):
        _log("manifest has no pages"); return 2
    draft_dir = build_comic_draft(manifest)
    print(f"OK {draft_dir}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f"fatal: {e!r}")
        sys.exit(1)
