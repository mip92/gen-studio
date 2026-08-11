# -*- coding: utf-8 -*-
"""
Desk props for the comic fly-through export: small objects (fidget spinner,
Rubik's cube, gum, headphones, phone) lying on the desk AROUND the open book.

They are baked into the same sheet PNG as the desk and the book (called from
`OldComicPageStyle.render_background` after the wood, before the pages), so
they ride the spread's camera grid for free — no extra CapCut layers, no
keyframes, no parallax risk. Visible on the wide moments: spread openings,
the ZOOM_DIP pull-back mid-travel, END_HOLD and the page turns.

The book intentionally nearly fills the sheet, so free desk is thin strips —
props are placed so they peek out from UNDER the book: the item is drawn
first, then the pages / fore-edge fans / shadows go on top and cover part of
it, which reads as "tucked under the journal".

Config travels as manifest["desk_props"]: a list of
    {"slot": <SLOTS key>, "item": <ITEMS key>, "scale"?: f, "rot"?: deg,
     "x"?: 0..1, "y"?: 0..1}
built by comic_manifest from Project.settings.comicDeskProps. Slots are CANVAS
anchors (not book-relative): the book bbox breathes with each spread's panel
layout, and props must stay glued to the desk across the whole film. Rotation
defaults to a jitter hashed from slot+item — stable across spreads, chunks and
re-exports.

PIL only, deterministic. PIL is imported lazily so comic_manifest (system
python) can import the registries for validation without needing Pillow.
"""
from __future__ import annotations

import zlib
from pathlib import Path
from typing import List, Optional, Tuple

PROPS_DIR = Path(__file__).with_name("desk_props")

# slot key -> (cx, cy) — the ITEM CENTRE in canvas fractions. Corners/edges sit
# just inside the frame so roughly half the sprite lands under the book / off
# the canvas edge, leaving a believable sliver of object on the visible desk.
SLOTS = {
    "top_left":            (0.033, 0.026),
    "top_center_left":     (0.250, 0.022),
    "top_center":          (0.500, 0.018),
    "top_center_right":    (0.750, 0.022),
    "top_right":           (0.965, 0.026),
    "left_upper":          (0.020, 0.150),
    "left":                (0.020, 0.400),
    "left_lower":          (0.020, 0.680),
    "right_upper":         (0.980, 0.160),
    "right":               (0.980, 0.430),
    "right_lower":         (0.980, 0.700),
    "bottom_left":         (0.034, 0.956),
    "bottom_center_left":  (0.250, 0.960),
    "bottom_center":       (0.500, 0.968),
    "bottom_center_right": (0.750, 0.960),
    "bottom_right":        (0.964, 0.956),
}

# item key -> sprite + default height as a fraction of canvas HEIGHT. Sized so
# the sliver on the desk reads at a glance without dwarfing the book edge —
# roughly 60% of true physical scale relative to the ~30 cm journal. All
# sprites are TOP views (the desk is seen from straight above); per-slot
# `scale` in the config multiplies `h`.
ITEMS = {
    "spinner":    {"file": "spinner.png",    "h": 0.150},
    "rubik":      {"file": "rubik.png",      "h": 0.135},
    "gum":        {"file": "gum.png",        "h": 0.062},
    "headphones": {"file": "headphones.png", "h": 0.190},
    "phone":      {"file": "phone.png",      "h": 0.230},
    # batch 2 (user 2026-08-01: «все предметы давай»)
    "pen":        {"file": "pen.png",        "h": 0.028},
    "pencil":     {"file": "pencil.png",     "h": 0.190},
    "glasses":    {"file": "glasses.png",    "h": 0.150},
    "scissors":   {"file": "scissors.png",   "h": 0.130},
    "sticky":     {"file": "sticky.png",     "h": 0.120},
    "envelope":   {"file": "envelope.png",   "h": 0.160},
    "postcard":   {"file": "postcard.png",   "h": 0.160},
    "loupe":      {"file": "loupe.png",      "h": 0.220},
    "calculator": {"file": "calculator.png", "h": 0.220},
    "keys":       {"file": "keys.png",       "h": 0.100},
    "watch":      {"file": "watch.png",      "h": 0.260},
    "lighter":    {"file": "lighter.png",    "h": 0.130},
    "coins":      {"file": "coins.png",      "h": 0.120},
    "banknote":   {"file": "banknote.png",   "h": 0.150},
    "coffee":     {"file": "coffee.png",     "h": 0.200},
    "cookie":     {"file": "cookie.png",     "h": 0.130},
    "donut":      {"file": "donut.png",      "h": 0.140},
    "chocolate":  {"file": "chocolate.png",  "h": 0.140},
    "apple":      {"file": "apple.png",      "h": 0.130},
    "usb":        {"file": "usb.png",        "h": 0.090},
    "mouse":      {"file": "mouse.png",      "h": 0.110},
    "gamepad":    {"file": "gamepad.png",    "h": 0.170},
    "cassette":   {"file": "cassette.png",   "h": 0.110},
    "dice":       {"file": "dice.png",       "h": 0.055},
    "cards":      {"file": "cards.png",      "h": 0.160},
    "domino":     {"file": "domino.png",     "h": 0.120},
    "compass":    {"file": "compass.png",    "h": 0.120},
}

_CACHE: dict = {}


def _jitter_deg(slot: str, item: str) -> float:
    """Stable per-(slot,item) rotation in [-14, 14]° — hashed, not random, so
    the desk looks identical on every spread, chunk and re-export."""
    h = zlib.crc32(f"{slot}:{item}".encode("utf-8"))
    return ((h % 2801) / 2800.0) * 28.0 - 14.0


def validate(props) -> List[dict]:
    """Keep only well-formed entries with known slot+item (one per slot)."""
    out, seen = [], set()
    for p in (props or []):
        if not isinstance(p, dict):
            continue
        slot, item = p.get("slot"), p.get("item")
        if slot not in SLOTS or item not in ITEMS or slot in seen:
            continue
        seen.add(slot)
        out.append({k: p[k] for k in ("slot", "item", "scale", "rot", "x", "y") if k in p})
    return out


def _load_sprite(item: str):
    from PIL import Image
    im = _CACHE.get(item)
    if im is None:
        im = Image.open(PROPS_DIR / ITEMS[item]["file"]).convert("RGBA")
        _CACHE[item] = im
    return im


def paste_props(bg, size: Tuple[int, int], desk_props: Optional[List[dict]],
                seed: int = 0) -> None:
    """Draw the configured props onto the RGB desk image `bg` in place.

    Per prop: scale to its canvas-height fraction, rotate, tone down toward the
    desk (slight desaturation + darkening so it does not glow against the dark
    wood — the sheet's own vignette then falls on top), and a soft drop shadow
    down-right, matching the book's own shadow direction."""
    props = validate(desk_props)
    if not props:
        return
    from PIL import Image, ImageEnhance, ImageFilter
    w, h = size
    for p in props:
        item = p["item"]
        spr = _load_sprite(item)
        target_h = ITEMS[item]["h"] * float(p.get("scale") or 1.0) * h
        f = target_h / max(1, spr.height)
        im = spr.resize((max(1, round(spr.width * f)), max(1, round(target_h))),
                        Image.LANCZOS)
        rot = float(p["rot"]) if p.get("rot") is not None else _jitter_deg(p["slot"], item)
        im = im.rotate(rot, expand=True, resample=Image.BICUBIC)

        # sit the object INTO the scene: mute saturation, pull brightness toward
        # the dark desk (sprites are shot under white studio light).
        rgb = im.convert("RGB")
        rgb = ImageEnhance.Color(rgb).enhance(0.82)
        rgb = ImageEnhance.Brightness(rgb).enhance(0.86)
        im = Image.merge("RGBA", (*rgb.split(), im.getchannel("A")))

        sx, sy = SLOTS[p["slot"]]
        cx = float(p["x"]) if p.get("x") is not None else sx
        cy = float(p["y"]) if p.get("y") is not None else sy
        x0 = round(cx * w - im.width / 2)
        y0 = round(cy * h - im.height / 2)

        blur = max(2, int(min(w, h) * 0.010))
        off = max(2, int(min(w, h) * 0.006))
        shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sh_a = im.getchannel("A").point(lambda v: int(v * 0.55))
        shadow.putalpha(sh_a)
        shadow = shadow.filter(ImageFilter.GaussianBlur(blur))

        # composite only inside the prop's own region (the sheet is huge at
        # supersample 4 — full-canvas RGBA passes per prop would be seconds),
        # clipping sources at the canvas edges (corner slots hang off-frame,
        # and alpha_composite rejects negative destinations).
        pad = blur * 2 + off
        rx0, ry0 = max(0, x0 - pad), max(0, y0 - pad)
        rx1 = min(w, x0 + im.width + pad + off)
        ry1 = min(h, y0 + im.height + pad + off)
        if rx1 <= rx0 or ry1 <= ry0:
            continue
        reg = bg.crop((rx0, ry0, rx1, ry1)).convert("RGBA")

        def _blit(src, dx, dy):
            sx0, sy0 = max(0, -dx), max(0, -dy)
            sx1 = min(src.width, reg.width - dx)
            sy1 = min(src.height, reg.height - dy)
            if sx1 > sx0 and sy1 > sy0:
                reg.alpha_composite(src.crop((sx0, sy0, sx1, sy1)),
                                    (max(0, dx), max(0, dy)))

        _blit(shadow, x0 + off - rx0, y0 + off - ry0)
        _blit(im, x0 - rx0, y0 - ry0)
        bg.paste(reg.convert("RGB"), (rx0, ry0))
