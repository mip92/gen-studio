"""
Draw the clickbait caption onto a finished thumbnail art.

The art is rendered by ComfyUI WITHOUT a single letter in it (see the
`gen-studio-clickbait` skill, §4/§5.6 — user decision 2026-07-27); the caption
is drawn here, from a font file. Diffusion models have no channel for
typography: no coordinates, no font size, no per-word colour, so placement and
the red accent word were a lottery. Here they are parameters.

Because this touches no GPU, the caption can be redrawn over the same art as
many times as the operator wants — that is the whole point of splitting it out.

  ComfyUI  ->  art WITHOUT text  ->  this script + caption spec  ->  thumbnail

Caption spec (json, mirrors the table in the skill):

  {
    "lines":        ["ОН ЗАКОВАЛ МЕНЯ В ЦЕПЬ", "24 ГОДА НЕ СНИМАЛА"],
    "accent_word":  "ЗАКОВАЛ",          # the ONE word that burns
    "accent_color": "#E01B24",
    "position":     "bottom",           # top | center | bottom
    "align":        "center",           # left | center | right
    "width_pct":    88,                 # how much of the frame line 1 spans
    "font":         "impact.ttf",       # filename (searched) or absolute path
    "fill":         "#FFFFFF",
    "outline":      "#000000",
    "line_scale":   0.45,               # size of line 2 relative to line 1
    "shadow":       true
  }

Only `lines` is required; everything else falls back to the defaults above.

Run with a python that has Pillow (the export python has 11.3):

  python scripts/render_caption.py --art art.png --spec spec.json [--out out.png]
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── paths / env ─────────────────────────────────────────────────────────────
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.dirname(SCRIPTS_DIR)                              # gen-studio/
COMFY_ROOT = os.environ.get("COMFY_ROOT", r"W:\Programs\ComfyUI")

# Where a bare font filename is looked up, in order.
FONT_DIRS = [
    os.path.join(COMFY_ROOT, "custom_nodes", "ComfyUI_Comfyroll_CustomNodes", "fonts"),
    r"C:\Windows\Fonts",
    os.path.join(APP_ROOT, "assets", "fonts"),
]

# YouTube's Data API rejects thumbnails over 2MB (Studio's uploader allows 50MB —
# see youtube-launch.service.ts). Staying under it here is what stops the cover
# from silently never landing on the video.
API_THUMB_LIMIT = 2 * 1024 * 1024

# YouTube's recommended thumbnail canvas. Also keeps us well under the limit.
DEF_CANVAS = (1280, 720)

DEFAULTS = {
    "accent_color": "#E01B24",
    "position": "bottom",
    "align": "center",
    "width_pct": 88,
    "font": "impact.ttf",
    "fill": "#FFFFFF",
    "outline": "#000000",
    "line_scale": 0.45,
    "shadow": True,
}


# ── font handling ───────────────────────────────────────────────────────────
def covers_cyrillic(path: str) -> bool:
    """Real coverage check — a font can load fine and still render .notdef boxes."""
    try:
        f = ImageFont.truetype(path, 40)
        return f.getbbox("ЦЕПЬ") is not None and f.getlength("Ь") > 0
    except Exception:
        return False


def resolve_font(name: str) -> str:
    """Absolute path as-is, bare filename searched in FONT_DIRS. Cyrillic enforced."""
    candidates = [name] if os.path.isabs(name) else [os.path.join(d, name) for d in FONT_DIRS]
    for path in candidates:
        if os.path.isfile(path) and covers_cyrillic(path):
            return path
    tried = "\n  ".join(candidates)
    raise SystemExit(
        f"no Cyrillic-capable font found for {name!r}. Tried:\n  {tried}\n"
        "Drop the .ttf into one of those dirs, or pass an absolute path in the spec."
    )


def hex_rgb(value: str) -> tuple[int, int, int]:
    v = value.strip().lstrip("#")
    if len(v) != 6:
        raise SystemExit(f"bad colour {value!r} — expected #RRGGBB")
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def fit_font(font_path: str, text: str, target_px: float) -> ImageFont.FreeTypeFont:
    """Largest size whose rendered width still fits target_px.

    Truetype advance scales near-linearly with size, so one proportional guess
    lands within a pixel or two; the loop just walks off the rounding error.
    """
    probe_size = 100
    probe_width = ImageFont.truetype(font_path, probe_size).getlength(text) or 1
    size = max(8, int(probe_size * target_px / probe_width))
    while size > 8 and ImageFont.truetype(font_path, size).getlength(text) > target_px:
        size -= 1
    return ImageFont.truetype(font_path, size)


# ── drawing ─────────────────────────────────────────────────────────────────
def strip_word(word: str) -> str:
    """Compare accent words ignoring the punctuation glued to them ("ВСЁ." == "ВСЁ")."""
    return word.strip(" .,!?…:;—-«»\"'").upper()


def draw_line(
    draw: ImageDraw.ImageDraw,
    origin: tuple[float, float],
    text: str,
    font: ImageFont.FreeTypeFont,
    accent: str,
    fill: tuple[int, int, int],
    accent_fill: tuple[int, int, int],
    outline: tuple[int, int, int],
    stroke: int,
) -> None:
    """Word by word, advancing the cursor by hand — that is what lets ONE word
    take the accent colour IN PLACE instead of becoming its own line (the exact
    failure Qwen produced in half of the test renders)."""
    x, y = origin
    space = font.getlength(" ")
    for word in text.split(" "):
        colour = accent_fill if accent and strip_word(word) == strip_word(accent) else fill
        draw.text((x, y), word, font=font, fill=colour, stroke_width=stroke, stroke_fill=outline)
        x += font.getlength(word) + space


def line_origin(align: str, width: float, frame_w: int, margin: float) -> float:
    if align == "left":
        return margin
    if align == "right":
        return frame_w - margin - width
    return (frame_w - width) / 2


def render(art_path: str, spec: dict, canvas: tuple[int, int] | None) -> Image.Image:
    lines = [str(s) for s in spec.get("lines") or [] if str(s).strip()]
    if not lines:
        raise SystemExit("spec.lines is empty — nothing to draw")
    if len(lines) > 2:
        raise SystemExit(f"spec.lines has {len(lines)} lines; the caption rules allow 1-2")

    cfg = {**DEFAULTS, **{k: v for k, v in spec.items() if v is not None}}

    img = Image.open(art_path).convert("RGB")
    if canvas:
        img = img.resize(canvas, Image.LANCZOS)
    frame_w, frame_h = img.size

    font_path = resolve_font(str(cfg["font"]))
    fill, accent_fill = hex_rgb(str(cfg["fill"])), hex_rgb(str(cfg["accent_color"]))
    outline = hex_rgb(str(cfg["outline"]))

    target_px = frame_w * float(cfg["width_pct"]) / 100
    fonts = [fit_font(font_path, lines[0], target_px)]
    if len(lines) > 1:
        secondary = max(8, int(fonts[0].size * float(cfg["line_scale"])))
        # Shrink further if the shorter-but-wordier second line still overruns.
        while secondary > 8 and ImageFont.truetype(font_path, secondary).getlength(lines[1]) > target_px:
            secondary -= 1
        fonts.append(ImageFont.truetype(font_path, secondary))

    strokes = [max(2, round(f.size * 0.07)) for f in fonts]
    heights = [round(f.size * 1.12) for f in fonts]
    block_h = sum(heights)

    margin_y = round(frame_h * 0.05)
    position = str(cfg["position"])
    if position == "top":
        y = margin_y
    elif position == "center":
        y = (frame_h - block_h) / 2
    else:
        y = frame_h - block_h - margin_y

    accent = str(spec.get("accent_word") or "")
    align, margin_x = str(cfg["align"]), frame_w * (100 - float(cfg["width_pct"])) / 200

    def paint(target: Image.Image, colours: tuple, stroke_bonus: int = 0) -> None:
        d = ImageDraw.Draw(target)
        cursor_y = y
        for i, text in enumerate(lines):
            width = fonts[i].getlength(text)
            x = line_origin(align, width, frame_w, margin_x)
            draw_line(d, (x, cursor_y), text, fonts[i], accent,
                      colours[0], colours[1], colours[2], strokes[i] + stroke_bonus)
            cursor_y += heights[i]

    # Soft drop shadow: the whole caption painted black on its own layer, blurred,
    # composited under the real text. Lifts white type off a busy frame.
    if cfg["shadow"]:
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        paint(shadow, ((0, 0, 0, 190), (0, 0, 0, 190), (0, 0, 0, 190)), stroke_bonus=2)
        shadow = shadow.filter(ImageFilter.GaussianBlur(round(fonts[0].size * 0.06)))
        img = Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB")

    paint(img, (fill, accent_fill, outline))
    return img


def save_within_limit(img: Image.Image, out_path: str, max_bytes: int) -> str:
    """PNG when it fits, otherwise step JPEG quality down until it does.

    Nano Banana covers (~2.5MB) never landed on YouTube through the API for
    exactly this reason; a generated cover has no excuse to repeat it.
    """
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    if buf.tell() <= max_bytes:
        with open(out_path, "wb") as fh:
            fh.write(buf.getvalue())
        return out_path

    jpg_path = os.path.splitext(out_path)[0] + ".jpg"
    for quality in (95, 90, 85, 80, 75, 70):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, subsampling=0, optimize=True)
        if buf.tell() <= max_bytes:
            with open(jpg_path, "wb") as fh:
                fh.write(buf.getvalue())
            return jpg_path
    raise SystemExit(
        f"cannot get the thumbnail under {max_bytes} bytes even at JPEG q70 — "
        "shrink the canvas with --canvas"
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="Draw the clickbait caption onto thumbnail art.")
    ap.add_argument("--art", required=True, help="path to the text-free art PNG")
    ap.add_argument("--spec", help="path to the caption-spec json")
    ap.add_argument("--spec-json", help="the caption spec inline, as a json string")
    ap.add_argument("--out", help="output path (default: <art>_caption.png next to the art)")
    ap.add_argument("--canvas", default="1280x720",
                    help="resize to WxH before drawing, or 'keep' for the art's own size")
    ap.add_argument("--max-bytes", type=int, default=API_THUMB_LIMIT,
                    help=f"size ceiling; falls back to JPEG to hit it (default {API_THUMB_LIMIT})")
    args = ap.parse_args()

    if not os.path.isfile(args.art):
        raise SystemExit(f"art not found: {args.art}")
    if bool(args.spec) == bool(args.spec_json):
        raise SystemExit("pass exactly one of --spec or --spec-json")

    if args.spec:
        # utf-8-sig: PowerShell's `Set-Content -Encoding utf8` writes a BOM here.
        with open(args.spec, encoding="utf-8-sig") as fh:
            spec = json.load(fh)
    else:
        spec = json.loads(args.spec_json)

    if args.canvas.lower() == "keep":
        canvas = None
    else:
        try:
            w, h = (int(p) for p in args.canvas.lower().split("x"))
            canvas = (w, h)
        except ValueError:
            raise SystemExit(f"bad --canvas {args.canvas!r} — expected WxH or 'keep'")

    out = args.out or os.path.splitext(args.art)[0] + "_caption.png"
    written = save_within_limit(render(args.art, spec, canvas), out, args.max_bytes)
    print(f"saved: {written} ({os.path.getsize(written)} bytes)")


if __name__ == "__main__":
    main()
