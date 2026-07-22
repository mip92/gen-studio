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

BAKE_KF_PER_SEC = 12       # linear keyframes per second of camera travel (holds emit none)
MIN_BAKE_STEPS  = 5
PANEL_INSET     = 0.0      # gap between the inked frame and the content (0 = tight)
# Long-VO rule: never slow a clip below this speed. When the voiceover forces a
# hold longer than native/SPEED_FLOOR, play the clip at exactly the floor speed
# and pad the remainder with freeze-frame PAUSES split across the two edges
# (first frame at the head, last frame at the tail).
SPEED_FLOOR     = 0.5

# ── organic camera (user 2026-07-22: «не линейно, покачивания, не по прямой») ──
HOLD_KF_PER_SEC = 2        # sample holds so the parked camera gently breathes/sways
ARC_FRAC        = 0.14     # travel bows sideways this fraction of its distance
ZOOM_DIP        = 0.28     # camera pulls BACK this much at mid-travel (lift & move)
SWAY_AMP_X      = 0.0032   # low-freq handheld drift (page-normalized units)
SWAY_AMP_Y      = 0.0026
SWAY_AMP_Z      = 0.010    # ±1% zoom breathing


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


def _build_camera(states: List[dict]):
    """Return (cam, grid): `cam(t_us)->(cx,cy,zoom)` is the continuous camera path
    (eased speed + sideways ARC + mid-travel ZOOM-OUT on travels, constant on
    holds); `grid` is the sorted list of keyframe times covering the spread (dense
    on travels, sparse on holds). EVERY layer bakes on this SAME grid so all
    layers share identical keyframe times and stay glued (CapCut lerps between
    keyframes — only a shared grid keeps the page rigid). Sway is layered on top by
    `_bake_layer` (a pure function of t, so also identical across layers)."""
    segs = []
    grid = set()
    for a, b in zip(states, states[1:]):
        t0, t1 = int(a["t_us"]), int(b["t_us"])
        if t1 <= t0:
            continue
        same = (abs(a["cx"] - b["cx"]) < 1e-6 and abs(a["cy"] - b["cy"]) < 1e-6
                and abs(a["zoom"] - b["zoom"]) < 1e-6)
        segs.append((t0, t1, a, b, same))
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

    def cam(t: int) -> Tuple[float, float, float]:
        if not segs:
            s = states[0] if states else {"cx": 0.5, "cy": 0.5, "zoom": 1.0}
            return (s["cx"], s["cy"], s["zoom"])
        if t <= segs[0][0]:
            a = segs[0][2]; return (a["cx"], a["cy"], a["zoom"])
        for (t0, t1, a, b, same) in segs:
            if t0 <= t <= t1:
                if same:
                    # HOLD: gentle sway, windowed so it is 0 at both ends (meets the
                    # still travel-endpoints seamlessly) and peaks mid-hold.
                    win = math.sin(math.pi * (t - t0) / (t1 - t0)) if t1 > t0 else 0.0
                    sx, sy, sz = _sway(t)
                    return (a["cx"] + sx * win, a["cy"] + sy * win,
                            a["zoom"] * (1.0 + (sz - 1.0) * win))
                p = _ease((t - t0) / (t1 - t0)); bow = math.sin(math.pi * p)
                dx, dy = b["cx"] - a["cx"], b["cy"] - a["cy"]
                dist = math.hypot(dx, dy)
                px, py = (-dy / dist, dx / dist) if dist > 1e-6 else (0.0, 0.0)
                arc = ARC_FRAC * dist
                # sway is windowed by `bow` → it vanishes at both ends, so the
                # travel joins the (still) holds seamlessly with no jump.
                sx, sy, sz = _sway(t)
                return (a["cx"] + dx * p + (px * arc + sx) * bow,
                        a["cy"] + dy * p + (py * arc + sy) * bow,
                        (a["zoom"] + (b["zoom"] - a["zoom"]) * p)
                        * (1.0 - ZOOM_DIP * bow) * (1.0 + (sz - 1.0) * bow))
        b = segs[-1][3]; return (b["cx"], b["cy"], b["zoom"])

    return cam, sorted(grid)


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
        cx, cy, z = cam(int(t))
        s, tx, ty = placer(cx, cy, z)
        off = int((t - t0) * time_scale)
        seg.add_keyframe(KP.uniform_scale, off, s)
        seg.add_keyframe(KP.position_x,    off, tx)
        seg.add_keyframe(KP.position_y,    off, ty)
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
    for i in range(max_slots):
        script.add_track(draft.TrackType.video, f"slot_{i}", relative_index=i + 1)
    # TOP track: the marker frames ride ABOVE every panel (borders visible / lap on)
    script.add_track(draft.TrackType.video, "comic_frames", relative_index=max_slots + 1)
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
        cam, grid = _build_camera(states)

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
        # render the frames overlay at HIGHER resolution than the paper sheet: it's
        # thin geometry the camera zooms into, so extra pixels keep the borders
        # crisp (not soapy) when magnified; the sheet paper can stay at `ss`.
        frame_ss = min(8, ss + 2)
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
                # (a) first-frame poster: travel-in + head freeze  [0 … video_start]
                if still and video_start > 0:
                    fp = draft.VideoSegment(
                        draft.VideoMaterial(still, material_name=f'{panel["shotCode"]}_first'),
                        target_timerange=draft.Timerange(start=p_start, duration=video_start))
                    total_kf += _bake_layer(fp, cam, grid, placer_still, 0, video_start, 0)
                    script.add_segment(fp, track_name=lane)
                # (b) the clip (floor-capped slow-mo). Bake the panel's focus state
                #     as keyframes (NOT a static transform) so the video breathes /
                #     sways in lockstep with the page instead of sliding under its
                #     frame during the hold.
                clip = draft.VideoSegment(
                    mat,
                    target_timerange=draft.Timerange(start=p_start + video_start, duration=video_screen),
                    source_timerange=draft.Timerange(start=0, duration=src_win) if native > 0 else None)
                # slowed clip → compensate keyframe timing for CapCut's source-time
                # warp so the moving video tracks the rest of the page.
                speed_ratio = (src_win / video_screen) if (native > 0 and video_screen > 0) else 1.0
                total_kf += _bake_layer(clip, cam, grid, placer_still, video_start, video_end,
                                        video_start, speed_ratio)
                script.add_segment(clip, track_name=lane)
                total_clips += 1
                # (c) last-frame poster: tail freeze + travel-out  [video_end … page_end]
                lastf = _last_frame_png(vpath, frames_dir, panel["shotCode"])
                if lastf and video_end < p_dur:
                    placer_last = _make_panel_placer(rect)
                    lp = draft.VideoSegment(
                        draft.VideoMaterial(lastf, material_name=f'{panel["shotCode"]}_last'),
                        target_timerange=draft.Timerange(start=p_start + video_end, duration=p_dur - video_end))
                    total_kf += _bake_layer(lp, cam, grid, placer_last, video_end, p_dur, video_end)
                    script.add_segment(lp, track_name=lane)
            elif still:
                # static shot: one still poster for the whole spread
                sp = draft.VideoSegment(
                    draft.VideoMaterial(still, material_name=panel["shotCode"]),
                    target_timerange=draft.Timerange(start=p_start, duration=p_dur))
                total_kf += _bake_layer(sp, cam, grid, placer_still, 0, p_dur, 0)
                script.add_segment(sp, track_name=lane)

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

    # 3) between-spread PAGE-TURN transition. CapCut ships pseudo-3D page flips
    #    (e.g. 立体翻页 / 翻书转场 / 翻页) — apply to BOTH the sheet and the frames
    #    overlay so the whole page turns together. "none" → hard cut.
    preset = str(manifest.get("page_transition") or "none")
    if preset and preset.lower() not in ("none", "slide") and len(page_segments) > 1:
        tt = getattr(draft.TransitionType, preset, None)
        if tt is None:
            _log(f'unknown page_transition {preset!r} — skipping (hard cut)')
        else:
            dur = int(manifest.get("page_transition_us") or 800_000)
            for seg in page_segments[:-1] + frame_segments[:-1]:
                try:
                    seg.add_transition(tt, duration=dur)
                    if seg.transition is not None and seg.transition not in script.materials:
                        script.materials.transitions.append(seg.transition)
                except Exception as e:  # noqa: BLE001
                    _log(f'page transition attach failed: {e!r}')

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
    placed_total = 0
    for b in order:
        tiles = sorted(by_block[b], key=lambda t: int(t.get("order") or 0))
        seen: List[str] = []
        for mt in tiles:
            lane = str(mt.get("lane") or "a")
            if lane not in seen:
                script.add_track(draft.TrackType.audio, f"bgm_{b}_{lane}"); seen.append(lane)
        cursor = int(tiles[0].get("block_start_us") or 0)
        for mt in tiles:
            lane = str(mt.get("lane") or "a")
            wav = mt["path"].replace("\\", "/")
            dur = _audio_duration_us(wav) or int(mt.get("render_duration_us") or 0)
            if dur <= 0:
                continue
            start = cursor
            cursor += max(1_000_000, dur - BGM_CROSSFADE_US)
            seg = draft.AudioSegment(
                draft.AudioMaterial(wav, material_name=f'bgm_{b}_{lane}'),
                target_timerange=draft.Timerange(start=start, duration=dur),
                source_timerange=draft.Timerange(start=0, duration=dur), volume=0.2)
            fade = min(BGM_CROSSFADE_US, dur // 2)
            seg.add_fade(in_duration=fade, out_duration=fade)
            script.add_segment(seg, track_name=f"bgm_{b}_{lane}")
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
