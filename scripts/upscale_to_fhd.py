"""
Pure-pixel Lanczos upscale of rendered scene images to fit Full HD (1920x1080)
while preserving aspect ratio. No content change — unlike a hires-fix refiner
pass, this is a deterministic resample.

Reads pairs of (src, dest) from argv: each file is read from src, upscaled if
needed, written to dest. If the source is already >= target dims, it's just
copied.

Used by scene-render.service after a ComfyUI render lands, before moving the
file from COMFY_OUTPUT into the project's shot folder.

Usage:
    python upscale_to_fhd.py src1 dest1 [src2 dest2 ...]
"""

import sys
from pathlib import Path

TARGET_W = 1920
TARGET_H = 1080


def process(src: Path, dest: Path) -> None:
    """
    Resize so the image fills exactly TARGET_W × TARGET_H. Strategy: scale to
    COVER the target box (max scale of width/height), then center-crop the
    excess. For typical SDXL output (1344×768, aspect 1.75) targeting FHD
    (1920×1080, aspect 1.778), the scale comes out to 1.4286 → 1920×1097, and
    we crop ~8px off the top and bottom. Always lands at exactly 1920×1080.
    """
    from PIL import Image
    img = Image.open(src)
    w, h = img.size
    dest.parent.mkdir(parents=True, exist_ok=True)
    if w == TARGET_W and h == TARGET_H:
        Path(dest).write_bytes(Path(src).read_bytes())
        print(f"COPY  {src.name} (already {TARGET_W}x{TARGET_H})", flush=True)
        return
    scale = max(TARGET_W / w, TARGET_H / h)
    interim_w = round(w * scale)
    interim_h = round(h * scale)
    # Lanczos for upscale, Bicubic for the rare downscale (faster, no Moiré on screenshots)
    resample = Image.LANCZOS if scale >= 1.0 else Image.BICUBIC
    upscaled = img.resize((interim_w, interim_h), resample)
    # Center crop to exactly target
    left = (interim_w - TARGET_W) // 2
    top  = (interim_h - TARGET_H) // 2
    cropped = upscaled.crop((left, top, left + TARGET_W, top + TARGET_H))
    cropped.save(dest, "PNG")
    print(f"SCALE {src.name} {w}x{h} -> {interim_w}x{interim_h} -> crop {TARGET_W}x{TARGET_H}", flush=True)


def main() -> int:
    args = sys.argv[1:]
    if len(args) == 0 or len(args) % 2 != 0:
        print(f"usage: {sys.argv[0]} src1 dest1 [src2 dest2 ...]", file=sys.stderr)
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
            process(src, dest)
        except Exception as e:
            print(f"FAIL  {src.name}: {e}", file=sys.stderr, flush=True)
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
