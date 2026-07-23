"""
Remove the FHD intermediate SaveVideo branch (node 6 = CreateVideo, node 7 =
SaveVideo 'video_fhd') from every combined upscale->RIFE workflow
(video_upscale_interp_api.json). The smooth branch (5->9->10->11) is independent
and untouched, so the one-pass job then writes ONLY videos_smooth.

*** RUN THIS ONLY AT BACKEND RESTART TIME. ***
The workflow JSON is read live at dispatch. If stripped while the OLD
video-render.service.ts is still running, pollUpscales expects an fhd output and
will fail every in-flight upscale. Sequence: strip --apply  ->  rebuild+restart
nest (new service code that keys completion off the smooth output).

DRY-RUN by default; --apply writes.
"""
from __future__ import annotations
import glob, json, os, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = r"W:\Programs\ComfyUI\gen-studio\data"
APPLY = "--apply" in sys.argv

files = sorted(set(
    glob.glob(os.path.join(ROOT, "*", "comfy", "video_upscale_interp_api.json")) +
    glob.glob(os.path.join(ROOT, "_templates", "comfy", "video_upscale_interp_api.json"))
))

changed = skipped = 0
for fp in files:
    wf = json.load(open(fp, encoding="utf-8"))
    ok_smooth = wf.get("11", {}).get("inputs", {}).get("filename_prefix", "").startswith("video_smooth")
    n7_fhd    = wf.get("7", {}).get("inputs", {}).get("filename_prefix", "").startswith("video_fhd")
    def refs(target):
        return [k for k, n in wf.items() if k not in ("6", "7")
                for v in n.get("inputs", {}).values()
                if isinstance(v, list) and v and str(v[0]) == target]
    if not (n7_fhd and ok_smooth):
        # already stripped, or unexpected shape
        print(f"SKIP {os.path.basename(os.path.dirname(os.path.dirname(fp)))} (n7_fhd={n7_fhd} smooth={ok_smooth})")
        skipped += 1; continue
    if refs("6") + refs("7"):
        print(f"SKIP {fp} (nodes 6/7 still referenced)"); skipped += 1; continue
    wf.pop("6", None); wf.pop("7", None)
    slug = fp.split(os.sep)[-3]
    print(f"{'STRIP' if APPLY else 'would strip'}  {slug}")
    if APPLY:
        json.dump(wf, open(fp, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    changed += 1

print(f"\n{'APPLIED' if APPLY else 'DRY-RUN'}: {changed} to change, {skipped} skipped")
