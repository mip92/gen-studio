"""
Captioning for kohya_ss LoRA datasets.

Two modes:
  - token-only (default, no AI):
        Writes "<token>" to <image>.txt for every image.
        Optimal for character LoRAs — kohya focuses on the face/identity
        instead of varying backgrounds.
  - florence2 (--mode florence2):
        Uses microsoft/Florence-2-large to generate detailed captions.
        Requires transformers<4.50 due to a known compat bug in the
        model's bundled config (forced_bos_token_id removed upstream).

Usage:
    python caption_florence2.py --dataset-dir <path> --token <trigger>
    python caption_florence2.py --dataset-dir <path> --token <trigger> --mode florence2
"""

import argparse
import json
import sys
from pathlib import Path

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
TASK_PROMPT = {
    "CAPTION":          "<CAPTION>",
    "DETAILED_CAPTION": "<DETAILED_CAPTION>",
    "MORE_DETAILED":    "<MORE_DETAILED_CAPTION>",
}


def _patch_flash_attn_check():
    """
    Florence-2's modeling file imports flash_attn unconditionally at module top,
    which makes transformers.dynamic_module_utils.check_imports raise even when
    flash_attn isn't actually used at runtime (Florence-2 falls back to eager).
    Patch the helper to drop flash_attn from the required-imports list.
    See https://huggingface.co/microsoft/Florence-2-large/discussions/4
    """
    from unittest.mock import patch
    from transformers.dynamic_module_utils import get_imports as _orig_get_imports

    def _filtered(filename):
        imports = _orig_get_imports(filename)
        return [imp for imp in imports if imp != "flash_attn"]

    return patch(
        "transformers.dynamic_module_utils.get_imports",
        new=_filtered,
    )


def load_model(model_id: str, device: str):
    from transformers import AutoModelForCausalLM, AutoProcessor
    import torch

    dtype = torch.float16 if device == "cuda" else torch.float32
    with _patch_flash_attn_check():
        processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_id, trust_remote_code=True, torch_dtype=dtype, attn_implementation="sdpa"
        ).to(device).eval()
    return model, processor


def caption_image(model, processor, image_path: Path, prompt: str, device: str) -> str:
    from PIL import Image
    import torch

    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=prompt, images=image, return_tensors="pt").to(
        device, torch.float16 if device == "cuda" else torch.float32
    )
    with torch.no_grad():
        ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=1024,
            num_beams=3,
            do_sample=False,
        )
    raw = processor.batch_decode(ids, skip_special_tokens=False)[0]
    parsed = processor.post_process_generation(
        raw, task=prompt, image_size=(image.width, image.height)
    )
    return parsed[prompt].strip()


def walk_images(root: Path):
    for p in sorted(root.rglob("*")):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def main():
    ap = argparse.ArgumentParser(description="Caption generator for kohya_ss")
    ap.add_argument("--dataset-dir", required=True, help="Root directory to scan recursively")
    ap.add_argument("--token", default="", help="Trigger word for the caption (e.g. zkv_woman)")
    ap.add_argument("--character-name", default="", help="Human-readable character name added as 2nd tag")
    ap.add_argument("--mode", default="florence2", choices=["token-only", "florence2"])
    ap.add_argument("--task", default="DETAILED_CAPTION", choices=TASK_PROMPT.keys())
    ap.add_argument("--model-id", default="microsoft/Florence-2-large")
    ap.add_argument("--device", default="cuda")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--progress-json", help="Optional path to write {processed, total} progress")
    args = ap.parse_args()

    root = Path(args.dataset_dir)
    if not root.is_dir():
        print(f"ERROR: not a directory: {root}", file=sys.stderr)
        sys.exit(2)

    images = list(walk_images(root))
    if not images:
        print(f"No images found under {root}")
        return

    use_florence = args.mode == "florence2"
    model = processor = prompt = None
    if use_florence:
        print(f"Loading {args.model_id} on {args.device} …", flush=True)
        model, processor = load_model(args.model_id, args.device)
        prompt = TASK_PROMPT[args.task]
    else:
        print(f"Token-only mode (token={args.token!r})", flush=True)

    total = len(images)
    for i, img_path in enumerate(images, 1):
        txt_path = img_path.with_suffix(".txt")
        if txt_path.exists() and not args.overwrite:
            print(f"[{i}/{total}] skip (exists) {img_path.name}", flush=True)
            continue

        if use_florence:
            try:
                description = caption_image(model, processor, img_path, prompt, args.device)
            except Exception as e:
                print(f"[{i}/{total}] FAIL {img_path.name}: {e}", file=sys.stderr, flush=True)
                continue
            parts = [p for p in (args.token, args.character_name, description) if p]
            caption = ", ".join(parts)
        else:
            parts = [p for p in (args.token, args.character_name) if p]
            caption = ", ".join(parts) or "photo"

        txt_path.write_text(caption, encoding="utf-8")
        print(f"[{i}/{total}] {img_path.name} -> {caption[:80]}", flush=True)

        if args.progress_json:
            Path(args.progress_json).write_text(
                json.dumps({"processed": i, "total": total}), encoding="utf-8"
            )

    print(f"Done. {total} images processed.")


if __name__ == "__main__":
    main()
