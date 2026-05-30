# bio_plus comfy workflows

These ComfyUI workflows render bio_plus shots in **graphic_novel_cell_shaded** style.

## Files

- `scene_single_character_graphic_novel_api.json` — for shots with 1 character participant. Copied from `last_shift/comfy/scene_single_character_api.json`.
- `scene_environment_graphic_novel_api.json` — for B-roll / environment shots (no character). Copied from `last_shift/comfy/scene_environment_api.json`.

## TODO before first render

These are PHOTOREAL templates copied as starting points. To convert to graphic-novel:

### 1. Swap LoRA loader to comic-style LoRA

In `scene_single_character_graphic_novel_api.json`:
- Find the `LoraLoader` node (currently loads character LoRA at strength ~0.85)
- Replace `lora_name` with a comic-style LoRA file (e.g. `cinematic-comic-style-v3.safetensors` from CivitAI — pick one that pairs cleanly with SDXL base, NOT Flux)
- Set strength_model = 0.6, strength_clip = 0.6
- Remove or zero out any other character LoRA loaders if chained

### 2. Add IP-Adapter at 0.4 weight (for character shots only)

- Add IPAdapterApply node between the SDXL base model and the KSampler
- Reference image: `<APP_ROOT>/data/bio_plus/reference/<profileCode>_anchor.png` (TBD generate via Nano Banana — see character_profiles.md)
- weight = 0.4 (low enough not to fight the comic-style aesthetic)
- weight_type = 'linear'

### 3. Force aspect ratio 16:9

- EmptyLatentImage width=1344, height=768 (SDXL bucket) — already correct in copied template

### 4. Style block prepended via service

`SingleCharacterGraphicNovelSceneStrategy.buildPrompt()` already prepends the
style-block prefix automatically. Don't add it inside the JSON template.

### 5. Test first render

After conversion, test on **A1_SH22** (leitmotif birth iconic — single character close-up):
```powershell
$shotId = psql -h localhost -U gen_studio -d gen_studio -t -A -c "SELECT id FROM shots WHERE \"shotCode\"='A1_SH22' AND \"projectId\"=(SELECT id FROM projects WHERE slug='bio_plus')"
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/generation/scenes/$shotId/render"
```

Check output in `data/bio_plus/shots/A1_SH22/`. Expected: cell-shaded illustration of Elena age 28 at kitchen table with warm cheek glow (leitmotif birth) — NOT photoreal.

If too photoreal: lower IP-Adapter weight, raise style-LoRA weight, add more "graphic novel" tokens to positive.
If too cartoon (loses Elena identity): raise IP-Adapter weight to 0.5 max.
