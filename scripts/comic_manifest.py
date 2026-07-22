# -*- coding: utf-8 -*-
"""
GENERAL comic-manifest builder (prototype of the future Node ComicExportService).
Works for ANY project. Unit = SPREAD (разворот): two portrait pages on one 16:9
sheet. Camera flies through the LEFT page's panels top→bottom, then really pans
across to the RIGHT page's panels (one continuous sheet → real fly-over). Between
spreads export_comic applies a transition (page-turn placeholder).

Resolves real rendered video (interp→upscaled→base), per-shot VO, approved BGM
(anchored on the COMIC timeline), subtitles; timing via shot_hold_us. Video + VO
start at camera arrival; clip slowed when hold>native (export_comic). After a clip
ends the panel holds on its LAST frame (export_comic extracts it).

Run with SYSTEM python (psycopg2):
    python comic_manifest.py --slug last_shift [--max-spreads N] [--panel-frac 0.85]
"""
import argparse, json, math, os, time
import psycopg2

DB   = dict(host="localhost", user="gen_studio", password="gen_studio", dbname="gen_studio")
ROOT = "W:/Programs/ComfyUI/gen-studio"
DATA = ROOT + "/data"

# ── spread layout ─────────────────────────────────────────────────────────────
# Unit = SPREAD (разворот) = 6 panels per PAGE × 2 pages. Reading order is the
# real-comic order: the WHOLE left page (row-major) first, THEN the whole right
# page — so the camera reads one page down, then pans once across the binding to
# the next page, instead of hopping the spine on every row.
SPREAD_SIZES = [12]
MARGIN   = 0.028      # outer margin around the whole spread
MARGIN_Y = 0.040      # top/bottom margin
SPINE    = 0.055      # reserved centre gutter for the binding (thick manga-style gutter)
# Tight gutters so that when the camera zooms into a panel the NEIGHBOURS peek in
# at the edges (user 2026-07-22). Vertical (between columns) stays thinner than
# horizontal (between rows) — best practice, groups each row for the eye.
GUT_V    = 0.006      # gutter BETWEEN COLUMNS
GUT_H    = 0.012      # gutter BETWEEN ROWS

# ── timing (mirror src/exports/shot-timing.ts) ───────────────────────────────
TAIL_US, MIN_SHOT_US, NO_VO_US = 500_000, 2_500_000, 4_000_000
# ── camera tuning ─────────────────────────────────────────────────────────────
OPEN_HOLD, TRAVEL_US, END_HOLD = 900_000, 650_000, 500_000
ZOOM_MIN, ZOOM_MAX = 1.2, 7.0
DEFAULT_PANEL_FRAC = 0.85


def shot_hold_us(kind, source_us, narration_us, export_timing):
    if export_timing == "narration":
        d = (narration_us + TAIL_US) if narration_us is not None \
            else (NO_VO_US if kind == "image" else (source_us or NO_VO_US))
        d = max(d, MIN_SHOT_US)
    else:
        d = (narration_us + TAIL_US if narration_us is not None else NO_VO_US) if kind == "image" \
            else (source_us or NO_VO_US)
    if kind is None and narration_us is not None:
        d = max(d, narration_us + TAIL_US)
    return int(d)


def _place_page(m, x0, x1, y0, y1):
    """Lay `m` panels on ONE page (max 2 columns) read ROW-MAJOR (left→right, then
    next row). Each panel is 16:9 — a SQUARE in normalized coords (canvas is 16:9 →
    square-normalized = 16:9 px) — centred in its cell so full-HD content fits
    EXACTLY (no crop, no overflow). Thin vertical gutters group each row; thicker
    horizontal gutters separate rows. Short last row is centred horizontally."""
    cols = 1 if m <= 1 else 2
    rows = math.ceil(m / cols)
    pw, ph = x1 - x0, y1 - y0
    # side limited by BOTH axes so the square (16:9) tile always fits; rows are
    # then STACKED tightly (GUT_H apart) and the whole block is centred vertically
    # — no more huge gaps between rows.
    side = max(0.05, min((pw - (cols - 1) * GUT_V) / cols,
                         (ph - (rows - 1) * GUT_H) / rows))
    block_h = rows * side + (rows - 1) * GUT_H
    by0 = y0 + (ph - block_h) / 2                # centre the row-block vertically
    rects = []
    for idx in range(m):
        r, c = divmod(idx, cols)
        row_m = min(cols, m - r * cols)          # panels in this (possibly short) row
        row_w = row_m * side + (row_m - 1) * GUT_V
        rx0 = x0 + (pw - row_w) / 2              # centre the row horizontally
        cx = rx0 + c * (side + GUT_V) + side / 2
        cy = by0 + r * (side + GUT_H) + side / 2
        rects.append({"x": cx - side / 2, "y": cy - side / 2, "w": side, "h": side})
    return rects


def spread_rects(n):
    """Two-page spread with a RESERVED central spine gutter. Returns rects in
    real reading order: the entire LEFT page (row-major), then the entire RIGHT
    page. Panels never enter the spine band, so the binding shadow falls only in
    the empty gutter, never on a video."""
    y0, y1 = MARGIN_Y, 1 - MARGIN_Y
    if n <= 3:                                    # short tail spread → single page
        return _place_page(n, MARGIN, 1 - MARGIN, y0, y1)
    left_n = math.ceil(n / 2)
    right_n = n - left_n
    left = _place_page(left_n, MARGIN, 0.5 - SPINE / 2, y0, y1)
    right = _place_page(right_n, 0.5 + SPINE / 2, 1 - MARGIN, y0, y1)
    return left + right


def chunk_sizes(n):
    sizes, i, rem = [], 0, n
    while rem > 0:
        s = min(SPREAD_SIZES[i % len(SPREAD_SIZES)], rem)
        if rem - s == 1 and s < 8:
            s += 1
        sizes.append(s); rem -= s; i += 1
    return sizes


def resolve_video(slug, code, interp, upsc, base):
    for sub, fn in (("videos_smooth", interp), ("videos_fhd", upsc), ("videos", base)):
        if fn:
            p = f"{DATA}/{slug}/shots/{code}/{sub}/{fn}"
            if os.path.exists(p):
                return p
    return None


def build(slug, max_spreads, panel_frac, out, pack=False):
    conn = psycopg2.connect(**DB); cur = conn.cursor()
    cur.execute('SELECT id,"exportTiming" FROM projects WHERE slug=%s', (slug,))
    row = cur.fetchone()
    if not row:
        raise SystemExit(f"project {slug} not found")
    pid, export_timing = row
    export_timing = "narration" if export_timing == "narration" else "clip"

    cur.execute("""
        SELECT sc."sortOrder", sc."sceneKey", sh.id, sh."shotCode", sh."renderMode",
               sh."chosenRender", vr."interpFilename", vr."upscaledFilename",
               vr."outputFilename", vr.params, tj."outputFilename", tj."durationMs", tj.text
        FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
        LEFT JOIN video_renders vr ON vr.id=sh."chosenVideoId"
        LEFT JOIN tts_jobs tj ON tj.id=sh."approvedTTSJobId"
        WHERE sh."projectId"=%s ORDER BY sc."sortOrder", sh."shotCode"
    """, (pid,))
    rows = cur.fetchall()

    scenes, order = {}, []
    for r in rows:
        scenes.setdefault(r[0], []).append(r)
        if r[0] not in order:
            order.append(r[0])

    def resolve_shot(r):
        (_so, _sk, sid, code, rmode, chosen, interp, upsc, base, params,
         tts_file, tts_ms, tts_text) = r
        still = f"{DATA}/{slug}/shots/{code}/{chosen}" if chosen else None
        narration_us, narration = None, None
        if tts_file:
            wav = f"{DATA}/{slug}/shots/{code}/{tts_file}"
            if os.path.exists(wav):
                us = int(tts_ms) * 1000 if tts_ms else max(800_000, int(len(tts_text or "") / 15 * 1_000_000))
                narration_us, narration = us, {"path": wav, "duration_us": us, "text": (tts_text or "").strip()}
        media, kind, source_us = None, "image", None
        if rmode != "static":
            vid = resolve_video(slug, code, interp, upsc, base)
            if vid:
                p = params or {}
                fps, length = p.get("fps") or 16, p.get("length") or 81
                source_us = int(length / fps * 1_000_000)
                media, kind = {"path": vid, "duration_us": source_us, "source_us": source_us}, None
        return dict(shotCode=code, still=still, media=media, kind=kind,
                    source_us=source_us, narration_us=narration_us, narration=narration)

    # ── assemble spread GROUPS ──
    # default: chunk PER SCENE (a spread ≈ a scene beat; short scenes → short tail
    # spreads). --pack: chunk the whole film into full 12s ignoring scene borders
    # (every spread full except the very last; a spread may span two scenes).
    groups = []                                    # list of (skey, [shot,...])
    if pack:
        flat = []
        for so in order:
            sk = scenes[so][0][1]
            for r in scenes[so]:
                flat.append((sk, resolve_shot(r)))
        i = 0
        for size in chunk_sizes(len(flat)):
            chunk = flat[i:i + size]; i += size
            groups.append((chunk[0][0], [s for _, s in chunk]))
    else:
        for so in order:
            shots = [resolve_shot(r) for r in scenes[so]]
            sk = scenes[so][0][1]
            i0 = 0
            for size in chunk_sizes(len(shots)):
                groups.append((sk, shots[i0:i0 + size])); i0 += size

    pages, page_start, shot_arrival = [], 0, {}
    for sidx, (skey, group) in enumerate(groups):
        if max_spreads and sidx >= max_spreads:
            break
        rects = spread_rects(len(group))
        panels, states = [], [{"t_us": 0, "cx": 0.5, "cy": 0.5, "zoom": 1.0}]
        cursor = OPEN_HOLD
        for slot, sh in enumerate(group):
            rect = rects[slot]
            cx, cy = rect["x"] + rect["w"] / 2, rect["y"] + rect["h"] / 2
            zoom = max(ZOOM_MIN, min(ZOOM_MAX, panel_frac / max(rect["w"], rect["h"])))
            hold = shot_hold_us(sh["kind"], sh["source_us"], sh["narration_us"], export_timing)
            arrival = cursor + TRAVEL_US
            depart = arrival + hold
            states.append({"t_us": arrival, "cx": cx, "cy": cy, "zoom": zoom})
            states.append({"t_us": depart, "cx": cx, "cy": cy, "zoom": zoom})
            cursor = depart
            panels.append({"slot": slot, "shotCode": sh["shotCode"], "rect": rect,
                           "still_path": sh["still"], "media": sh["media"],
                           "narration": sh["narration"], "zoom": zoom,
                           "arrival_us": arrival, "hold_us": hold, "depart_us": depart})
        # No whole-spread beat at the END — after the last panel, go STRAIGHT to the
        # next spread; a short tail holds the last panel's last frame.
        page_end = cursor + END_HOLD
        pages.append({"pageIndex": sidx, "pageKey": f"{skey}_{sidx}",
                      "page_start_us": page_start, "page_duration_us": page_end,
                      "panels": panels, "camera_states": states})
        for p in panels:
            shot_arrival[p["shotCode"]] = page_start + p["arrival_us"]
        page_start += page_end

    # ── BGM (anchored on the comic timeline) ──
    music = []
    cur.execute('SELECT id, slug, "shotIds" FROM narrative_blocks WHERE "projectId"=%s ORDER BY "sortOrder"', (pid,))
    for bid, bslug, shot_ids in cur.fetchall():
        cur.execute('SELECT id,"approvedJobId",spare,"durationSec" FROM music_segments '
                    'WHERE "blockId"=%s ORDER BY spare, "sortOrder"', (bid,))
        segs = cur.fetchall()
        sid_list = shot_ids if isinstance(shot_ids, list) else []
        block_start = None
        if sid_list:
            cur.execute('SELECT "shotCode" FROM shots WHERE id = ANY(%s)', (sid_list,))
            for (sc,) in cur.fetchall():
                a = shot_arrival.get(sc)
                if a is not None and (block_start is None or a < block_start):
                    block_start = a
        if block_start is None:
            continue
        placed = 0
        for seg_id, appr, spare, dsec in segs:
            if not appr:
                continue
            cur.execute('SELECT status,"outputFilename",params FROM audio_render_jobs WHERE id=%s', (appr,))
            j = cur.fetchone()
            if not j or j[0] != "completed" or not j[1]:
                continue
            fp = f"{DATA}/{slug}/bgm/{bslug}/{j[1]}"
            if not os.path.exists(fp):
                continue
            rsec = (j[2] or {}).get("renderSec") or dsec or 60
            music.append({"blockSlug": bslug, "act": bslug, "lane": "a" if placed % 2 == 0 else "b",
                          "order": placed, "spare": bool(spare), "segmentId": seg_id, "jobId": appr,
                          "path": fp, "block_start_us": int(block_start), "render_duration_us": int(rsec) * 1_000_000})
            placed += 1
    if music:
        earliest = min(m["block_start_us"] for m in music)
        if earliest > 0:
            for m in music:
                if m["block_start_us"] == earliest:
                    m["block_start_us"] = 0

    ts = time.strftime("%Y%m%d_%H%M")
    draft_name = f"{slug}_comic_{ts}"
    out_root = f"{DATA}/{slug}/exports/comic"
    localapp = os.environ.get("LOCALAPPDATA")
    capcut_root = (localapp.replace("\\", "/") + "/CapCut/User Data/Projects/com.lveditor.draft") if localapp else out_root
    manifest = {
        "project_name": slug, "draft_name": draft_name,
        "output_root": out_root, "capcut_drafts_root": capcut_root,
        "pages_dir": f"{out_root}/{draft_name}/pages",
        "width": 1920, "height": 1080, "fps": 30,
        # supersample 4: the sheet+frames are ONE raster the camera zooms into
        # (~4x at a panel), so render 4x canvas so borders/edges stay crisp, not
        # soapy, when magnified.
        "page_style": "old_comic", "texture_path": None, "supersample": 4,
        # pseudo-3D page turn between spreads (CapCut built-in 立体翻页). Only
        # RENDERS if that effect is in CapCut's local cache (apply it once in
        # CapCut to download it) — else it shows in the editor but does nothing.
        # "none" = hard cut (current default until the effect is cached).
        "page_transition": "none", "page_transition_us": 800_000,
        "max_panel_slots": max((len(p["panels"]) for p in pages), default=1),
        "pages": pages, "music_tracks": music,
    }
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    anim = sum(1 for p in pages for pn in p["panels"] if pn["media"])
    vo = sum(1 for p in pages for pn in p["panels"] if pn["narration"])
    print(f"wrote {out}")
    print(f"  {slug}: {len(pages)} spreads, {sum(len(p['panels']) for p in pages)} panels "
          f"({anim} animated, {vo} VO), {len(music)} bgm tiles, total {page_start/1e6:.1f}s")
    print(f"  draft_name={draft_name}  max_panel_slots={manifest['max_panel_slots']}")
    cur.close(); conn.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--max-spreads", type=int, default=0)
    ap.add_argument("--panel-frac", type=float, default=DEFAULT_PANEL_FRAC)
    ap.add_argument("--pack", action="store_true",
                    help="chunk across scene borders into full 12-panel spreads")
    ap.add_argument("--out", default="E:/tmp/claude/W--Programs-ComfyUI/6d2ae475-ecda-43bb-a65a-be5f86911a92/scratchpad/comic_manifest.json")
    a = ap.parse_args()
    build(a.slug, a.max_spreads, a.panel_frac, a.out, a.pack)
