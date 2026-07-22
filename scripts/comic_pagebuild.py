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
) -> Image.Image:
    """Build and return the page image at (width*ss, height*ss).

    bake_content=True  (legacy/debug): paste each panel's still into its rect.
    bake_content=False (live-layer mode): render the SHEET only — paper + empty
    panel holes. The panel content (full-HD stills/videos) is composited live on
    its own CapCut layer on top, so nothing is flattened into this image.
    frames_only=True: return a TRANSPARENT RGBA layer with ONLY the panel borders
    (the marker frames), meant to sit ABOVE the live video layers so the borders
    are visible and lap slightly onto the footage. `draw_frames=False` skips the
    borders on the sheet (they come from the frames_only overlay instead).
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
            style.draw_frame(fdraw, rect_px, seed + i)
        return overlay

    page = style.render_background((W, H), texture_path, seed, panels_px).convert("RGB")
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
            style.draw_frame(draw, rect_px, seed + i)

    ov = style.overlay((W, H), panels_px, seed)
    if ov is not None:
        page = page.convert("RGBA")
        page.alpha_composite(ov)
        page = page.convert("RGB")
    return page


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
