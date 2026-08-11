# -*- coding: utf-8 -*-
"""
Render one comic PAGE to a PNG: a styled background with each panel's still
pasted (cover-cropped) into its rectangle and an inked frame drawn on top.

The page is rendered at the CANVAS aspect (16:9) so that at CapCut
`uniform_scale = 1.0` it fills the frame exactly (whole page visible); zooming
in then reveals detail — hence we render at `supersample`× the canvas size so a
zoomed panel stays crisp.

Pure PIL. No CapCut / pyJianYingDraft knowledge here — that's export_comic.py.

CLI (standalone preview / debugging):
    python comic_pagebuild.py --preview out.png
"""
from __future__ import annotations

import argparse
import math
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw

from comic_page_style import get_style, RectPx


def _rect_to_px(rect: dict, W: int, H: int) -> RectPx:
    """Normalized {x,y,w,h} (fractions of the page) → integer pixel rect."""
    x = int(round(rect["x"] * W))
    y = int(round(rect["y"] * H))
    w = int(round(rect["w"] * W))
    h = int(round(rect["h"] * H))
    return (x, y, w, h)


def _outward_limits(panels_px: List[RectPx], i: int) -> Tuple[int, int, int, int]:
    """(top, bottom, left, right) px — how far panel `i`'s frame may stick OUTWARD
    before crossing the middle of the gutter to its nearest neighbour on that side.
    Frames of two adjacent panels each get half the clear gap, so in a tight gutter
    they butt at the centre line instead of lapping onto each other's picture
    (user 2026-08-06). Sides with no neighbour are unlimited."""
    INF = 10 ** 9
    xi, yi, wi, hi = panels_px[i]
    lt = lb = ll = lr = INF
    for j, (xj, yj, wj, hj) in enumerate(panels_px):
        if j == i:
            continue
        if xj < xi + wi and xj + wj > xi:          # horizontal overlap → above/below
            if yj + hj <= yi:
                lt = min(lt, yi - (yj + hj))
            if yj >= yi + hi:
                lb = min(lb, yj - (yi + hi))
        if yj < yi + hi and yj + hj > yi:          # vertical overlap → left/right
            if xj + wj <= xi:
                ll = min(ll, xi - (xj + wj))
            if xj >= xi + wi:
                lr = min(lr, xj - (xi + wi))
    return tuple(v if v >= INF else max(0, v // 2) for v in (lt, lb, ll, lr))


def _paste_cover(base: Image.Image, still: Image.Image, rect_px: RectPx) -> None:
    """Scale `still` to COVER rect (crop overflow, no letterbox) and paste it."""
    x, y, w, h = rect_px
    if w <= 0 or h <= 0:
        return
    sw, sh = still.size
    if sw <= 0 or sh <= 0:
        return
    scale = max(w / sw, h / sh)
    nw, nh = max(1, math.ceil(sw * scale)), max(1, math.ceil(sh * scale))
    r = still.resize((nw, nh), Image.LANCZOS)
    left = (nw - w) // 2
    top  = (nh - h) // 2
    r = r.crop((left, top, left + w, top + h))
    base.paste(r, (x, y))


def render_page(
    *,
    width: int,
    height: int,
    panels: List[dict],          # each: {rect:{x,y,w,h}, still_path:str|None}
    style_name: str,
    texture_path: Optional[str],
    supersample: int = 3,
    seed: int = 0,
    bake_content: bool = True,
    frames_only: bool = False,
    draw_frames: bool = True,
    progress: Optional[float] = None,   # 0..1 position in the book → real page stacks
    desk_props: Optional[List[dict]] = None,  # objects on the desk (comic_desk_props)
    desk_color=None,                    # '#rrggbb' desk override (comic_page_style)
    desk_img: Optional[Image.Image] = None,   # pre-rendered desk (overscan underlay crop)
) -> Image.Image:
    """Build and return the page image at (width*ss, height*ss).

    bake_content=True  (legacy/debug): paste each panel's still into its rect.
    bake_content=False (live-layer mode): render the SHEET only — paper + empty
    panel holes. The panel content (full-HD stills/videos) is composited live on
    its own CapCut layer on top, so nothing is flattened into this image.
    frames_only=True: return a TRANSPARENT RGBA layer with ONLY the panel borders
    (the marker frames). The live export no longer uses this — each border is its
    own small PNG via render_panel_frame (2026-08-07, see its docstring for why) —
    kept for standalone previews/debugging. `draw_frames=False` skips the borders
    on the sheet (they come from the per-panel overlays instead).
    """
    style = get_style(style_name)
    ss = max(1, int(supersample))
    W, H = width * ss, height * ss

    # panel pixel rects up front so the style can lay the book (pages/spine/edges)
    # out AROUND the real panels instead of guessing.
    panels_px: List[RectPx] = [_rect_to_px(p["rect"], W, H) for p in panels]

    if frames_only:
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        fdraw = ImageDraw.Draw(overlay)
        for i, rect_px in enumerate(panels_px):
            style.draw_frame(fdraw, rect_px, seed + i, canvas_w=W,
                             out_limits=_outward_limits(panels_px, i))
        return overlay

    page = style.render_background((W, H), texture_path, seed, panels_px,
                                   progress=progress, desk_props=desk_props,
                                   desk_color=desk_color,
                                   desk_img=desk_img).convert("RGB")
    draw = ImageDraw.Draw(page)

    for i, p in enumerate(panels):
        rect_px = panels_px[i]
        if bake_content:
            still_path = p.get("still_path")
            if still_path:
                try:
                    still = Image.open(still_path).convert("RGB")
                    _paste_cover(page, still, rect_px)
                except Exception:
                    pass  # leave paper showing through; frame still drawn below
        if draw_frames:
            style.draw_frame(draw, rect_px, seed + i, canvas_w=W,
                             out_limits=_outward_limits(panels_px, i))

    ov = style.overlay((W, H), panels_px, seed)
    if ov is not None:
        page = page.convert("RGBA")
        page.alpha_composite(ov)
        page = page.convert("RGB")
    return page


def render_panel_frame(
    *,
    width: int,
    height: int,
    panels: List[dict],
    index: int,
    style_name: str,
    seed: int,
    scale: float,
) -> Tuple[Optional[Image.Image], Optional[dict]]:
    """ONE panel's inked border as its own small transparent RGBA image.

    The full-sheet frames overlay has a hard sharpness ceiling: keeping a border
    crisp at camera zoom z needs a sheet raster of 1920·z, the PNG grows
    quadratically with z, and past ~ss4 CapCut's own minification mushes the very
    ink lines the raster was meant to protect (A/B 2026-07-26). Template pages
    zoom well past the old grid's 3.376× (narrow slots up to 7×), which is where
    the borders went soft (user 2026-08-07: «рамки мыльные»). Rendering each
    panel's frame ALONE, at `scale`× the canvas — i.e. exactly the raster the
    camera will display at this spread's max zoom — keeps the border
    pixel-for-pixel crisp while the image stays tiny: it is just four bars on
    transparency, its raster no longer tied to the sheet's.

    `panels` must be the FULL panel list of the spread (the outward-lap clamps
    need every neighbour); `seed` is the same page seed render_page gets (the
    per-panel `+ index` is applied here). Returns (image, rect) where rect =
    {x,y,w,h} in normalized page units — the panel rect grown by the border's
    outward laps, ready for export_comic's contain-fit panel placer. (None, None)
    if the style has no bar decomposition."""
    style = get_style(style_name)
    Wv = max(1, int(round(width * scale)))
    Hv = max(1, int(round(height * scale)))
    panels_px = [_rect_to_px(p["rect"], Wv, Hv) for p in panels]
    i = int(index)
    bars = style.frame_geometry(panels_px[i], seed + i, canvas_w=Wv,
                                out_limits=_outward_limits(panels_px, i))
    if not bars:
        return None, None
    x0 = min(b[0] for b in bars); y0 = min(b[1] for b in bars)
    # PIL's rectangle() paints x1/y1 INCLUSIVE — the canvas needs the +1 or the
    # right/bottom edge row of every bar is cropped off.
    x1 = max(b[2] for b in bars) + 1; y1 = max(b[3] for b in bars) + 1
    if x1 <= x0 or y1 <= y0:
        return None, None
    img = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = getattr(style, "INK", (24, 20, 16))
    for (bx0, by0, bx1, by1) in bars:
        d.rectangle([bx0 - x0, by0 - y0, bx1 - x0, by1 - y0], fill=ink)
    rect = {"x": x0 / Wv, "y": y0 / Hv, "w": (x1 - x0) / Wv, "h": (y1 - y0) / Hv}
    return img, rect


def _preview(out: str):
    # a 2x2 debug page with grey placeholders
    panels = [
        {"rect": {"x": 0.03, "y": 0.04, "w": 0.45, "h": 0.44}, "still_path": None},
        {"rect": {"x": 0.52, "y": 0.04, "w": 0.45, "h": 0.44}, "still_path": None},
        {"rect": {"x": 0.03, "y": 0.52, "w": 0.45, "h": 0.44}, "still_path": None},
        {"rect": {"x": 0.52, "y": 0.52, "w": 0.45, "h": 0.44}, "still_path": None},
    ]
    img = render_page(width=1920, height=1080, panels=panels,
                      style_name="old_comic", texture_path=None, supersample=2)
    img.save(out)
    print("wrote", out, img.size)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", default="comic_page_preview.png")
    render = ap.parse_args()
    _preview(render.preview)
