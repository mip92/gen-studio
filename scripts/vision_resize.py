"""
Downscale rendered candidate images to a small longest-side box before handing
them to the local vision model (Ollama qwen3-vl) for prompt-match validation.

Why: the vision model tokenises an image by resolution — a full-HD frame becomes
thousands of vision tokens and, on a 16 GB card that partially offloads the
model, that dominates inference time (measured 248s @ FHD vs 33s @ 768px). The
defects we score for (wrong subject, malformed hands, garbled text, distorted
face, mangled mirror reflections) are all still legible at ~768px, so we trade
tokens we don't need for a large speed-up.

Deterministic Bicubic downscale, aspect preserved. Mirrors upscale_to_fhd.py's
pairs-on-argv contract so scene-render's spawn plumbing is reused.

Usage:
    python vision_resize.py <max_dim> src1 dest1 [src2 dest2 ...]
"""

import sys
from pathlib import Path


def process(src: Path, dest: Path, max_dim: int) -> None:
    from PIL import Image
    img = Image.open(src).convert("RGB")
    w, h = img.size
    dest.parent.mkdir(parents=True, exist_ok=True)
    scale = min(max_dim / w, max_dim / h)
    if scale >= 1.0:
        # Already small enough — just re-encode (RGB, no alpha) so Ollama is happy.
        img.save(dest, "PNG")
        print(f"COPY  {src.name} ({w}x{h} <= {max_dim})", flush=True)
        return
    nw, nh = round(w * scale), round(h * scale)
    img.resize((nw, nh), Image.BICUBIC).save(dest, "PNG")
    print(f"SCALE {src.name} {w}x{h} -> {nw}x{nh}", flush=True)


def main() -> int:
    args = sys.argv[1:]
    if len(args) < 3 or (len(args) - 1) % 2 != 0:
        print(f"usage: {sys.argv[0]} <max_dim> src1 dest1 [src2 dest2 ...]", file=sys.stderr)
        return 2
    try:
        max_dim = int(args[0])
    except ValueError:
        print("max_dim must be an integer", file=sys.stderr)
        return 2
    pairs = list(zip(args[1::2], args[2::2]))
    rc = 0
    for src_str, dest_str in pairs:
        src, dest = Path(src_str), Path(dest_str)
        if not src.exists():
            print(f"MISS  {src}", file=sys.stderr, flush=True)
            rc = 1
            continue
        try:
            process(src, dest, max_dim)
        except Exception as e:
            print(f"FAIL  {src.name}: {e}", file=sys.stderr, flush=True)
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
