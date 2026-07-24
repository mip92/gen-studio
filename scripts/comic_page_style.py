# -*- coding: utf-8 -*-
"""
Pluggable comic-PAGE visual styles for the camera-fly-through export.

A "page style" owns ONLY the look of the page itself — the material the panels
sit on (paper / table), the vignette/grain/wear, and how each panel's frame
(border) is inked. It knows nothing about the camera, timeline, layout, or
CapCut. Adding a new style (e.g. the future dark-cinematic table) is a new
`PageStyle` subclass + one line in `PAGE_STYLES` — no other module changes.

Coordinate contract with comic_pagebuild:
  - render_background((W, H), texture_path, seed) -> RGB Image of exactly (W, H).
    Painted BELOW every panel. Panel interiors are covered by the pasted stills,
    so the background only shows through the gutters + margins.
  - draw_frame(draw, rect_px, seed) draws the panel border ON TOP of a pasted
    still. `rect_px` = (x, y, w, h) integer pixels.
  - overlay((W, H), panels_px, seed) -> RGBA Image or None. Painted ABOVE
    everything (vignette that must cross panel edges, drop shadows). None = skip.

Only PIL/Pillow — no numpy, no GPU. Deterministic given `seed`.
"""
from __future__ import annotations

import math
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageChops

RectPx = Tuple[int, int, int, int]  # (x, y, w, h)


# ── helpers ──────────────────────────────────────────────────────────────────
def _radial_vignette(size: Tuple[int, int], strength: float) -> Image.Image:
    """L-mode mask: ~255 centre → darker toward the corners. `strength` 0..1 =
    how dark the corners get. Cheap (built from PIL's 256px radial gradient)."""
    w, h = size
    grad = Image.radial_gradient("L").resize((w, h))          # 0 centre → 255 edge
    # invert so centre is bright, then compress the darkening by `strength`
    dark = int(max(0, min(255, 255 * (1.0 - strength))))
    vig = grad.point(lambda v: 255 - int(v * (255 - dark) / 255))
    return vig


def _grain(size: Tuple[int, int], sigma: float) -> Image.Image:
    """L-mode monochrome noise for paper grain."""
    return Image.effect_noise(size, sigma)


def _hgrad(size: Tuple[int, int], left: int, right: int) -> Image.Image:
    """L-mode horizontal gradient `left`→`right` across the width (cheap: 1px row)."""
    w, h = size
    row = Image.new("L", (max(1, w), 1))
    row.putdata([int(left + (right - left) * (x / max(1, w - 1))) for x in range(w)])
    return row.resize((w, h))


def _mul_region(img: Image.Image, shade: Image.Image, x: int, y: int) -> None:
    """Multiply an L-mode `shade` into the RGB `img` at (x,y) — darkens in place."""
    w, h = shade.size
    if w <= 0 or h <= 0:
        return
    reg = img.crop((x, y, x + w, y + h))
    reg = ImageChops.multiply(reg, Image.merge("RGB", (shade, shade, shade)))
    img.paste(reg, (x, y))


def _page_boxes(panels_px: Optional[List[RectPx]], W: int, H: int
                ) -> Tuple[List[Tuple[int, int, int, int]], int]:
    """SPREAD page rectangles sized from the SHEET (not from the panels) so the
    two pages nearly fill the sheet — a thin dark desk border all around and a
    central spine gap. Panels sit inside. Whether it's one or two pages is decided
    by which halves the panels occupy. Returns ([box,...], spine_x)."""
    mid = int(W / 2)
    dm = int(min(W, H) * 0.018)     # min desk margin around the open book
    # margin from panels to the page EDGE ≈ the gutter between panels (user
    # 2026-07-22), so the edge sits right next to the panels and, when the camera
    # zooms into an edge panel, the page edge + the neighbour beyond it stay in view.
    pm = int(min(W, H) * 0.013)
    groups: dict = {}
    for (x, y, w, h) in (panels_px or []):
        groups.setdefault(0 if (x + w / 2.0) < mid else 1, []).append((x, y, x + w, y + h))

    def bbox(bs):
        return (min(b[0] for b in bs), min(b[1] for b in bs),
                max(b[2] for b in bs), max(b[3] for b in bs))

    # Pages HUG the panel block (+ a comic margin) so the top/bottom/outer edges
    # sit right next to the panels and stay visible; the two leaves still MEET at
    # the fold (inner edge = centre) so the spread reads as one open book.
    if 0 in groups and 1 in groups:
        lb, rb = bbox(groups[0]), bbox(groups[1])
        yt = max(dm, min(lb[1], rb[1]) - pm)
        yb = min(H - dm, max(lb[3], rb[3]) + pm)
        boxes = [(max(dm, lb[0] - pm), yt, mid, yb),
                 (mid, yt, min(W - dm, rb[2] + pm), yb)]
    else:
        allb = [b for g in groups.values() for b in g]
        if allb:
            x0, y0, x1, y1 = bbox(allb)
            boxes = [(max(dm, x0 - pm), max(dm, y0 - pm),
                      min(W - dm, x1 + pm), min(H - dm, y1 + pm))]
        else:
            boxes = [(dm, dm, W - dm, H - dm)]
    return boxes, mid


# ── base class ────────────────────────────────────────────────────────────────
class PageStyle(ABC):
    key: str = "base"

    @abstractmethod
    def render_background(self, size: Tuple[int, int], texture_path: Optional[str],
                          seed: int, panels_px: Optional[List[RectPx]] = None) -> Image.Image: ...

    @abstractmethod
    def draw_frame(self, draw: "ImageDraw.ImageDraw", rect_px: RectPx, seed: int) -> None: ...

    def overlay(self, size: Tuple[int, int], panels_px: List[RectPx],
                seed: int) -> Optional[Image.Image]:
        return None


# ── v1: "старый комикс" — aged paper, grain, wear, inked frames ────────────────
class OldComicPageStyle(PageStyle):
    key = "old_comic"

    PAPER = (238, 226, 196)     # warm aged-paper base
    INK   = (24, 20, 16)        # not pure black — sooty ink
    DESK  = (34, 28, 22)        # dark wood/desk the open book lies on
    EDGE  = (206, 190, 156)     # cut page-block edge (a touch darker than PAPER)
    EDGE_LINE = (120, 104, 78)  # crisp page-boundary line against the desk

    def _wood(self, size, seed):
        """Dark wooden desk the open book lies on: long horizontal grain fibres +
        a few plank seams, kept dark so the pages pop off it."""
        w, h = size
        base = Image.new("RGB", (w, h), self.DESK)
        # grain fibres: thin vertical noise stretched wide → long horizontal streaks
        small = Image.effect_noise((max(1, w // 8), h), 30).convert("L")
        fib = small.resize((w, h)).filter(ImageFilter.GaussianBlur(1))
        wood = Image.merge("RGB", [
            fib.point(lambda v, i=i: max(0, min(255, int(self.DESK[i] + (v - 128) * 0.5))))
            for i in range(3)])
        base = Image.blend(base, wood, 0.6)
        # plank seams: horizontal darker lines at jittered intervals
        d = ImageDraw.Draw(base); rng = _Rng(seed or 7)
        seam = (max(0, self.DESK[0] - 16), max(0, self.DESK[1] - 13), max(0, self.DESK[2] - 10))
        y = int(h * rng.rf(0.05, 0.15))
        while y < h:
            d.line([(0, y), (w, y)], fill=seam, width=max(2, h // 500))
            y += int(h * rng.rf(0.16, 0.26))
        return base

    def _paper_fill(self, size, texture_path, seed):
        """A full-sheet slab of aged paper (base tone + optional texture + grain)."""
        w, h = size
        pg = Image.new("RGB", (w, h), self.PAPER)
        if texture_path:
            try:
                tex = Image.open(texture_path).convert("RGB").resize((w, h))
                pg = Image.blend(pg, tex, 0.5)
            except Exception:
                pass
        grain = _grain((w, h), 14.0).convert("RGB")
        pg = Image.blend(pg, grain, 0.06)
        pg = Image.blend(pg, Image.new("RGB", (w, h), self.PAPER), 0.25)
        return pg

    def render_background(self, size, texture_path, seed, panels_px=None):
        """Open-book spread: dark desk, two near-full-sheet paper pages with a
        VISIBLE cut edge (thickness) + drop shadow + crisp boundary line, and a
        SOFT central binding shadow (smooth bell — never a hard black bar)."""
        w, h = size
        boxes, mid = _page_boxes(panels_px, w, h)
        paper = self._paper_fill((w, h), texture_path, seed)

        bg = self._wood((w, h), seed)                 # wooden desk under the book
        thick = max(5, int(min(w, h) * 0.009))       # page-block thickness
        go = max(4, int(min(w, h) * 0.012))          # drop-shadow spread

        # drop shadow of each page onto the desk (down + slightly out)
        shp = Image.new("L", (w, h), 0)
        sd = ImageDraw.Draw(shp)
        for (x0, y0, x1, y1) in boxes:
            sd.rectangle([x0 - go // 2, y0 + go, x1 + go, y1 + go + thick], fill=185)
        shp = shp.filter(ImageFilter.GaussianBlur(go * 1.4))
        bg = Image.composite(Image.new("RGB", (w, h), (0, 0, 0)), bg, shp)

        d = ImageDraw.Draw(bg)
        block = max(8, int(min(w, h) * 0.018))       # page-block (stack) thickness
        lw = max(2, block // 4)                       # bevel line weight
        HI = (252, 246, 226); LO = (66, 54, 40); SEP = (150, 136, 104)
        for (x0, y0, x1, y1) in boxes:
            outer_right = len(boxes) == 1 or (x0 + x1) // 2 >= mid
            # paper leaf (the page surface). The book's THICKNESS is no longer drawn
            # per-page as a ream; it's ONE unified fore-edge block under the whole
            # spread (see below) so the stack reads as a single open book.
            bg.paste(paper.crop((x0, y0, x1, y1)), (x0, y0))
            # NO edge bevel: the page-block contours + fore-edge + binding shadow +
            # panel borders already define every edge; the old bevel lines only added
            # redundant lines around the page (user 2026-07-23).

        # soft binding shadow: a smooth bell centred on the fold, darkest at the
        # centre, fading over the gutter — NO hard line/bar.
        if len(boxes) >= 2:
            sw = int(w * 0.05)
            x_lo, x_hi = max(0, mid - sw), min(w, mid + sw)
            gwidth = x_hi - x_lo
            ytop = min(b[1] for b in boxes); ybot = max(b[3] for b in boxes)
            if gwidth > 4:
                vals = []
                for i in range(gwidth):
                    tt = (i - gwidth / 2.0) / (gwidth / 2.0)          # -1..1
                    bell = math.cos(max(-1.0, min(1.0, tt)) * (math.pi / 2)) ** 2
                    vals.append(int(255 - 120 * bell))               # ~135 at the fold
                row = Image.new("L", (gwidth, 1)); row.putdata(vals)
                _mul_region(bg, row.resize((gwidth, ybot - ytop)), x_lo, ytop)

        # Open-book PAGE-BLOCK (user 2026-07-22): the visible ream of sheets around the
        # spread, in PAPER tone (a light band, NOT bare wood). Each sheet is ONE
        # continuous edge — a STAIR-STEP at the top-outer corner, straight DOWN the
        # outer side, then ACROSS the bottom converging to the binding at the spine —
        # so the side edge and the bottom edge are the same page and read as stacked
        # sheets. Panels sit on top in the live export; the block lives entirely in the
        # desk reserve beside/below the pages, so nothing overlaps a panel.
        xL = min(b[0] for b in boxes); xR = max(b[2] for b in boxes)
        ytop = min(b[1] for b in boxes); yb = max(b[3] for b in boxes)
        foot = max(6, min(int(min(w, h) * 0.075),
                          h - yb - max(2, int(min(w, h) * 0.006))))
        if foot >= 6 and xR > xL:
            dm = int(min(w, h) * 0.018)
            PAGE_LINE = SEP                       # single paper-tan contour colour (not wood)
            lwl = max(1, int(min(w, h) * 0.0009))  # thin, crisp contour (user 2026-07-23)
            K = 7                                  # one fewer stacked leaf (user 2026-07-24)
            Nb = 26
            room_R = max(0, (w - dm) - xR)
            room_L = max(0, xL - dm)
            oR = xR + int(room_R * 0.55)          # outermost sheet x (right / left)
            oL = xL - int(room_L * 0.55)

            # bottom band drop-shadow + paper fill (thick at outer corners, pinching
            # to the spine). Drawn first so the side bands sit on top of it.
            bottom = [(oL + (oR - oL) * (i / 48),
                       yb + foot * (2.0 * (i / 48) - 1.0) ** 2) for i in range(49)]
            shp2 = Image.new("L", (w, h), 0)
            ImageDraw.Draw(shp2).polygon(
                bottom + [(oR, min(h - 1, yb + foot + go)),
                          (oL, min(h - 1, yb + foot + go))], fill=150)
            shp2 = shp2.filter(ImageFilter.GaussianBlur(go))
            bg = Image.composite(Image.new("RGB", (w, h), (0, 0, 0)), bg, shp2)
            d = ImageDraw.Draw(bg)
            d.polygon(bottom + [(oR, yb), (oL, yb)], fill=self.EDGE)               # bottom band

            # PER-SHEET STAIRCASE on each side (user 2026-07-23 red-marker drawing):
            # the page's top-outer CORNER is the HIGHEST point (the top sheet); from it
            # clean right-angle steps go DOWN-and-OUT (riser down, tread out) — each step
            # is one sheet peeking out below the one above. From its step the sheet drops
            # to the fore-edge, then runs ACROSS the bottom converging at the binding
            # (spine). Paper, not wood.
            rise = int(foot * 1.15)                       # total staircase drop below the corner
            for (edge_x, sign, room) in ((xR, +1, room_R), (xL, -1, room_L)):
                if room <= 8:
                    continue
                poly_top = [(edge_x, ytop)]
                sheets = []
                cx = edge_x
                for i in range(1, K + 1):
                    f = i / K
                    ox = edge_x + sign * int(room * 0.55 * f)      # this step's outer x
                    ty = min(yb, ytop + int(rise * f))             # this step's top (LOWER outward)
                    depth = yb + int(foot * f)                     # this sheet's fore-edge depth
                    poly_top += [(cx, ty), (ox, ty)]               # riser down, then tread out
                    path = [(cx, ty), (ox, ty), (ox, depth)]       # tread + straight side down
                    for j in range(1, Nb + 1):                     # bottom edge → converge to spine
                        t = j / Nb
                        # straight line from the outer-bottom corner to the spine base
                        # → the sheets fan cleanly to the centre-bottom, no curl
                        # (user 2026-07-24).
                        path.append((ox + (mid - ox) * t, yb + (depth - yb) * (1 - t)))
                    sheets.append(path)
                    cx = ox
                # paper fill: staircase top → down the outer side → back along page edge
                d.polygon(poly_top + [(cx, yb + foot), (edge_x, yb)], fill=self.EDGE)
                for path in sheets:                                # ONE consistent contour colour
                    d.line(path, fill=PAGE_LINE, width=lwl)
        return bg

    def draw_frame(self, draw, rect_px, seed):
        """CRISP marker-style panel border: each side is a FILLED rectangle
        straddling the panel edge (hard edges — no anti-alias fuzz, no curve-joint
        blur), so it stays sharp when the camera zooms in and laps slightly onto
        the video. Slight per-side thickness variance keeps a felt-tip feel without
        looking soft or wobbly."""
        x, y, w, h = rect_px
        rng = _Rng(seed ^ (x * 73856093) ^ (y * 19349663))
        t = max(4, int(min(w, h) * 0.024))        # bold nib
        def bar(x0, y0, x1, y1):
            draw.rectangle([x0, y0, x1, y1], fill=self.INK)
        tt = int(t * rng.rf(0.9, 1.1)); tb = int(t * rng.rf(0.9, 1.1))
        tl = int(t * rng.rf(0.9, 1.1)); tr = int(t * rng.rf(0.9, 1.1))
        bar(x - tl // 2, y - tt // 2, x + w + tr // 2, y + tt - tt // 2)          # top
        bar(x - tl // 2, y + h - tb // 2, x + w + tr // 2, y + h + tb - tb // 2)  # bottom
        bar(x - tl // 2, y - tt // 2, x + tl - tl // 2, y + h + tb - tb // 2)     # left
        bar(x + w - tr // 2, y - tt // 2, x + w + tr - tr // 2, y + h + tb - tb // 2)  # right

    def overlay(self, size, panels_px, seed):
        w, h = size
        vig = _radial_vignette((w, h), strength=0.42)
        # RGBA where alpha darkens toward the corners (multiply-like feel)
        ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        alpha = vig.point(lambda v: 255 - v)          # bright centre → 0 alpha
        ov.putalpha(alpha)
        return ov


# ── minimal fallback (used by the Phase-0 skeleton / tests) ────────────────────
class PlainPageStyle(PageStyle):
    key = "plain"

    def render_background(self, size, texture_path, seed, panels_px=None):
        return Image.new("RGB", size, (210, 210, 210))

    def draw_frame(self, draw, rect_px, seed):
        x, y, w, h = rect_px
        draw.rectangle([x, y, x + w, y + h], outline=(20, 20, 20), width=8)


class _Rng:
    """Tiny deterministic LCG so a page's ink jitter is stable across re-exports
    without pulling Math.random-style nondeterminism (kept local, no global state)."""
    def __init__(self, seed: int):
        self.s = (seed & 0xFFFFFFFF) or 0x9E3779B9

    def _next(self) -> float:
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s / 0x7FFFFFFF

    def rf(self, lo: float, hi: float) -> float:
        return lo + (hi - lo) * self._next()


PAGE_STYLES = {
    OldComicPageStyle.key: OldComicPageStyle(),
    PlainPageStyle.key:    PlainPageStyle(),
}


def get_style(name: Optional[str]) -> PageStyle:
    return PAGE_STYLES.get((name or "").strip().lower(), PAGE_STYLES["old_comic"])
