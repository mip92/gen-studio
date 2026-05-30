"""Generate 8 anchor portrait references for bio_plus characters via ComfyUI.

Each anchor becomes the IP-Adapter reference image for that character's
face-lock across all 200 shots. Uses gen_anchor_portrait_graphic_novel_api.json.

Prerequisites:
  - gen-studio backend running on http://localhost:4000
  - ComfyUI running on http://127.0.0.1:8188
  - Graphic_Novel_Illustration-000007.safetensors in ComfyUI/models/loras/style/
  - dreamshaperXL_lightningDPMSDE.safetensors in ComfyUI/models/checkpoints/sdxl/

Run:
  cd E:\\ComfyUI\\gen-studio\\scripts
  python generate_bio_plus_anchors.py

Outputs:
  E:\\ComfyUI\\gen-studio\\data\\bio_plus\\reference\\<PROFILE_CODE>_anchor.png
"""
import json
import os
import random
import shutil
import sys
import time
from pathlib import Path
import urllib.request
import urllib.parse
import urllib.error

COMFY_URL = "http://127.0.0.1:8188"
GENSTUDIO_URL = "http://localhost:4000"
PROJECT_SLUG = "bio_plus"
WORKFLOW_PATH = Path(r"E:\ComfyUI\gen-studio\data\bio_plus\comfy\gen_anchor_portrait_graphic_novel_api.json")
REFERENCE_DIR = Path(r"E:\ComfyUI\gen-studio\data\bio_plus\reference")
COMFY_OUTPUT_DIR = Path(r"E:\ComfyUI\output")

STYLE_PREFIX = (
    "cinematic graphic novel illustration, illustrated comic book panel, "
    "cell-shaded coloring, hard black ink outline with variable line weight, "
    "flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, "
    "no photorealism, no 3D render, no plastic skin"
)
PORTRAIT_COMPOSITION = (
    "three-quarter portrait facing camera, head-and-shoulders framing, "
    "neutral pale grey backdrop, soft north-window light, "
    "anchor reference portrait"
)
ANCHOR_NEGATIVE = (
    "photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, "
    "hyperrealistic, real human face, raytraced, deformed hands, extra fingers, "
    "two heads, watermark, text overlay, blurry, low quality, anime, manga, "
    "chibi, kawaii, oversaturated color, glamour photography, fashion shoot, "
    "full body, multiple people, group photo, profile only, back view"
)


def http_get(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))


def http_post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> int:
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching bio_plus project + characters via gen-studio API...")
    projects = http_get(f"{GENSTUDIO_URL}/projects")
    project = next((p for p in projects if p["slug"] == PROJECT_SLUG), None)
    if not project:
        print(f"ERROR: project '{PROJECT_SLUG}' not found")
        return 1

    chars = http_get(f"{GENSTUDIO_URL}/projects/{project['id']}/characters")
    profiles = []
    for c in chars:
        for prof in c.get("profiles", []):
            if prof.get("promptBase", "").strip():
                profiles.append({
                    "profile_code": prof["profileCode"],
                    "char_code":    c["code"],
                    "prompt_base":  prof["promptBase"],
                    "negative":     prof.get("negative") or ANCHOR_NEGATIVE,
                })
    print(f"Found {len(profiles)} profiles to generate anchors for:")
    for p in profiles:
        print(f"  - {p['profile_code']} (char {p['char_code']})")

    workflow_template = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))

    for p in profiles:
        anchor_path = REFERENCE_DIR / f"{p['profile_code']}_anchor.png"
        if anchor_path.exists():
            print(f"[{p['profile_code']}] anchor exists, skipping (delete file to regenerate)")
            continue

        print(f"\n[{p['profile_code']}] generating anchor...")

        positive = f"{STYLE_PREFIX}, {PORTRAIT_COMPOSITION}, {p['prompt_base']}"
        negative = p["negative"]

        wf = json.loads(json.dumps(workflow_template))  # deep copy
        wf["3"]["inputs"]["text"] = positive
        wf["4"]["inputs"]["text"] = negative
        wf["6"]["inputs"]["seed"] = random.randint(0, 2**31 - 1)
        wf["8"]["inputs"]["filename_prefix"] = f"anchor_{p['profile_code']}"

        try:
            queue_resp = http_post_json(f"{COMFY_URL}/prompt", {"prompt": wf})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            print(f"  ERROR queuing: HTTP {e.code} — {err_body[:300]}")
            continue
        except Exception as e:
            print(f"  ERROR queuing: {e}")
            continue

        prompt_id = queue_resp.get("prompt_id")
        if not prompt_id:
            print(f"  ERROR: no prompt_id in queue response: {queue_resp}")
            continue
        print(f"  queued: prompt_id={prompt_id}")

        deadline = time.time() + 300
        saved = False
        while time.time() < deadline:
            time.sleep(2)
            try:
                history = http_get(f"{COMFY_URL}/history/{prompt_id}")
            except Exception:
                continue
            entry = history.get(prompt_id)
            if not entry or "outputs" not in entry:
                continue
            outputs = entry["outputs"]
            node8 = outputs.get("8") or {}
            images = node8.get("images") or []
            if not images:
                continue
            img = images[0]
            src = COMFY_OUTPUT_DIR / img["filename"]
            if src.exists():
                shutil.copyfile(src, anchor_path)
                print(f"  saved: {anchor_path}")
                saved = True
                break
        if not saved:
            print(f"  WARNING: timeout waiting for ComfyUI output for {p['profile_code']}")

    print(f"\nAnchor portraits in {REFERENCE_DIR}:")
    for f in sorted(REFERENCE_DIR.glob("*_anchor.png")):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}  {size_kb:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
