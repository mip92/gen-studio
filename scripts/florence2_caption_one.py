"""
Caption a single image with Florence-2 and print the caption to stdout.

Used by gen-studio's VideoRenderService to suggest a motion prompt: we caption
the shot's approved render, then concatenate motion language onto the caption.

Usage:
    python florence2_caption_one.py --image <path> [--task DETAILED_CAPTION] [--device cuda]

Requires transformers <4.50 (same constraint as the training caption pipeline).
"""
import argparse
import sys
from pathlib import Path

TASK_PROMPT = {
    "CAPTION":          "<CAPTION>",
    "DETAILED_CAPTION": "<DETAILED_CAPTION>",
    "MORE_DETAILED":    "<MORE_DETAILED_CAPTION>",
}


def _patch_flash_attn_check():
    from unittest.mock import patch
    from transformers.dynamic_module_utils import get_imports as _orig_get_imports

    def _filtered(filename):
        return [imp for imp in _orig_get_imports(filename) if imp != "flash_attn"]

    return patch("transformers.dynamic_module_utils.get_imports", new=_filtered)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--task",  default="DETAILED_CAPTION", choices=TASK_PROMPT.keys())
    ap.add_argument("--model-id", default="microsoft/Florence-2-large")
    ap.add_argument("--device", default="cuda")
    args = ap.parse_args()

    img_path = Path(args.image)
    if not img_path.is_file():
        print(f"ERROR: image not found: {img_path}", file=sys.stderr)
        return 2

    from transformers import AutoModelForCausalLM, AutoProcessor
    import torch
    from PIL import Image

    dtype = torch.float16 if args.device == "cuda" else torch.float32
    with _patch_flash_attn_check():
        processor = AutoProcessor.from_pretrained(args.model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            args.model_id, trust_remote_code=True, torch_dtype=dtype, attn_implementation="sdpa"
        ).to(args.device).eval()

    image = Image.open(img_path).convert("RGB")
    prompt = TASK_PROMPT[args.task]
    inputs = processor(text=prompt, images=image, return_tensors="pt").to(args.device, dtype)
    with torch.no_grad():
        ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=1024,
            num_beams=3,
            do_sample=False,
        )
    raw = processor.batch_decode(ids, skip_special_tokens=False)[0]
    parsed = processor.post_process_generation(raw, task=prompt, image_size=(image.width, image.height))
    # Print ONLY the caption text on stdout so the caller can capture it directly.
    sys.stdout.write(parsed[prompt].strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
