"""Download the LTX-2.5 stack into ComfyUI's model folders.

Six files, ~47 GB, exactly the set the official ComfyUI LTX-2.5 workflows load.
The repo is GATED: `hf auth login` must have been run once, with the licence
accepted on huggingface.co/Lightricks/LTX-2.5. Without that every file 401s.

HF_HOME is NOT overridden here — it is already pointed at E:\\hf-cache on this
machine, which is both where the token lives and a disk with room for the blob
cache. Forcing it elsewhere hides the token and every download fails as if the
licence had never been accepted.

Re-running is safe: a file already in place is skipped, and a half-finished
download resumes from the cache.

    python scripts/_download_ltx25.py
"""
import os
import sys

from huggingface_hub import hf_hub_download

COMFY = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS = os.path.join(COMFY, "models")

# (repo, path inside the repo, folder under ComfyUI/models)
FILES = [
    ("Lightricks/LTX-2.5",
     "diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors",
     "diffusion_models"),
    ("Lightricks/LTX-2.5",
     "text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors",
     "text_encoders"),
    ("Comfy-Org/gemma-4",
     "text_encoders/gemma4_e2b_it_bf16.safetensors",
     "text_encoders"),
    ("Lightricks/LTX-2.5", "vae/ltx-2.5-video-vae-bf16.safetensors", "vae"),
    ("Lightricks/LTX-2.5", "vae/ltx-2.5-audio-vae-bf16.safetensors", "vae"),
    ("Lightricks/LTX-2.5",
     "latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors",
     "latent_upscale_models"),
]


def main() -> None:
    total = 0.0
    for repo, remote, folder in FILES:
        target = os.path.join(MODELS, folder)
        os.makedirs(target, exist_ok=True)
        name = remote.split("/")[-1]
        final = os.path.join(target, name)

        if os.path.exists(final):
            gb = os.path.getsize(final) / 1073741824
            total += gb
            print("уже на месте  %7.2f ГБ  %s" % (gb, name), flush=True)
            continue

        print("качаю        %s" % name, flush=True)
        try:
            got = hf_hub_download(repo_id=repo, filename=remote, local_dir=target)
        except Exception as exc:  # noqa: BLE001 — the reason matters more than the type
            print("  ОШИБКА: %s: %s" % (type(exc).__name__, str(exc)[:200]), file=sys.stderr, flush=True)
            raise

        # hf_hub_download keeps the repo's folder structure under local_dir;
        # ComfyUI wants the file directly in models/<folder>/.
        if os.path.abspath(got) != os.path.abspath(final):
            os.replace(got, final)
        gb = os.path.getsize(final) / 1073741824
        total += gb
        print("  готово     %7.2f ГБ  ->  models/%s/%s" % (gb, folder, name), flush=True)

    print("ВСЁ НА МЕСТЕ: %.1f ГБ" % total, flush=True)


if __name__ == "__main__":
    main()
