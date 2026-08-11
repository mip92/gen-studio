"""
Pure-pixel Lanczos upscale of rendered scene images to fit a target box
(default: Full HD 1920x1080) while preserving aspect ratio. No content change —
unlike a hires-fix refiner pass, this is a deterministic resample.

Reads pairs of (src, dest) from argv: each file is read from src, upscaled if
needed, written to dest. If the source is already >= target dims, it's just
copied.

Used by scene-render.service after a ComfyUI render lands, before moving the
file from COMFY_OUTPUT into the project's shot folder. Comic-panel shots pass
--target with the panel shape's still size (comic_page_shapes.json) so a
square/tall render is never cover-cropped into a 16:9 box.

Usage:
    python upscale_to_fhd.py [--target WxH] src1 dest1 [src2 dest2 ...]
"""

import sys
from pathlib import Path

TARGET_W = 1920
TARGET_H = 1080


def process(src: Path, dest: Path, target_w: int = TARGET_W, target_h: int = TARGET_H) -> None:
    """
    Resize so the image fills exactly target_w × target_h. Strategy: scale to
    COVER the target box (max scale of width/height), then center-crop the
    excess. For typical SDXL output (1344×768, aspect 1.75) targeting FHD
    (1920×1080, aspect 1.778), the scale comes out to 1.4286 → 1920×1097, and
    we crop ~8px off the top and bottom. Always lands at exactly the target.
    """
    from PIL import Image
    img = Image.open(src)
    w, h = img.size
    dest.parent.mkdir(parents=True, exist_ok=True)
    if w == target_w and h == target_h:
        Path(dest).write_bytes(Path(src).read_bytes())
        print(f"COPY  {src.name} (already {target_w}x{target_h})", flush=True)
        return
    scale = max(target_w / w, target_h / h)
    interim_w = round(w * scale)
    interim_h = round(h * scale)
    # Lanczos for upscale, Bicubic for the rare downscale (faster, no Moiré on screenshots)
    resample = Image.LANCZOS if scale >= 1.0 else Image.BICUBIC
    upscaled = img.resize((interim_w, interim_h), resample)
    # Center crop to exactly target
    left = (interim_w - target_w) // 2
    top  = (interim_h - target_h) // 2
    cropped = upscaled.crop((left, top, left + target_w, top + target_h))
    cropped.save(dest, "PNG")
    print(f"SCALE {src.name} {w}x{h} -> {interim_w}x{interim_h} -> crop {target_w}x{target_h}", flush=True)


def main() -> int:
    args = sys.argv[1:]
    target_w, target_h = TARGET_W, TARGET_H
    if args and args[0] == "--target":
        if len(args) < 2 or "x" not in args[1]:
            print(f"usage: {sys.argv[0]} [--target WxH] src1 dest1 ...", file=sys.stderr)
            return 2
        tw, th = args[1].split("x", 1)
        target_w, target_h = int(tw), int(th)
        args = args[2:]
    if len(args) == 0 or len(args) % 2 != 0:
        print(f"usage: {sys.argv[0]} [--target WxH] src1 dest1 [src2 dest2 ...]", file=sys.stderr)
        return 2
    pairs = list(zip(args[::2], args[1::2]))
    rc = 0
    for src_str, dest_str in pairs:
        src, dest = Path(src_str), Path(dest_str)
        if not src.exists():
            print(f"MISS  {src}", file=sys.stderr, flush=True)
            rc = 1
            continue
        try:
            process(src, dest, target_w, target_h)
        except Exception as e:
            print(f"FAIL  {src.name}: {e}", file=sys.stderr, flush=True)
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
