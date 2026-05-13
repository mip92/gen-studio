# Gen Studio

NestJS API that orchestrates ComfyUI generation jobs for character training datasets.
One project can contain multiple characters, each with multiple age/mood profiles.

## Stack

- **NestJS** — REST API
- **Prisma + PostgreSQL** — project/character/profile data
- **ComfyUI** — image generation backend at `http://127.0.0.1:8188`

## Quick start

```bash
cp .env.example .env          # set DATABASE_URL
docker-compose up -d          # postgres
npm install
npx prisma migrate deploy
npx tsx prisma/seeds/night_courier/index.ts   # seed sample project
npm run start:dev
# API: http://localhost:3000
# Docs: http://localhost:3000/docs
```

## Data layout

```
gen-studio/
  data/
    <projectSlug>/
      comfy/
        <workflow>_api.json    # API-format ComfyUI workflow
  dist/
    projects/
      <projectId>/
        characters/
          <characterId>/
            <profileId>/
              reference.jpg    # reference image for generation
```

## Generate a dataset

```bash
# Trigger (queues ComfyUI jobs)
POST /generation/profiles/:profileId/generate-dataset

# Preview prompts without queuing
POST /generation/profiles/:profileId/generate-dataset?dryRun=true

# Check job status
GET /generation/jobs/:promptId
```

## Workflow strategies

The `WorkflowFactory` selects a `WorkflowStrategy` based on `project.settings.workflowId`
(default: `ai_syndicate_dataset_creator_v3`).

Each strategy knows its workflow filename and how to inject generation params
(positive prompt, negative, seed, filename prefix, reference image) into the template.

| id | workflow file | description |
|----|---------------|-------------|
| `ai_syndicate_dataset_creator_v3` | `ai_syndicate_dataset_creator_v3_api.json` | Multi-pass Flux-2-Klein + Z-Image-Turbo refiner |

### Adding a strategy

1. Implement `WorkflowStrategy` → `src/generation/workflows/strategies/`
2. Register in `WorkflowFactory` constructor
3. Add workflow JSON to `data/<slug>/comfy/`

### Convert UI workflow to API format

```bash
npx tsx scripts/convert_workflow.ts <ui_workflow.json> <output_api.json>
```

## Scripts

| script | usage |
|--------|-------|
| `scripts/convert_workflow.ts` | Convert ComfyUI UI-format → API-format JSON |
| `scripts/check_nodes.ts` | Print node summary for an API-format workflow |
| `scripts/create_asset_folders.ts` | Create reference image folder structure |
| `scripts/caption_florence2.py` | Florence-2 captioning for kohya_ss datasets |

## LoRA training

End-to-end pipeline: `ai_syndicate_v3` generates a dataset → Florence-2 captions
each image → `kohya_ss` trains an SDXL LoRA → path is written to
`CharacterProfile.loraPath` and the LoRA is ready to drop into INSTARAW
workflows (`zImage`, `WAN 2.2`, `SDXL_*` combos).

### One-time setup

#### 1. Install kohya_ss / sd-scripts

```powershell
cd E:\
git clone --recurse-submodules https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
.\setup.bat       # creates venv, installs torch + xformers + bitsandbytes
```

The training service expects:
- `KOHYA_DIR` → `E:\kohya_ss` (default)
- `KOHYA_PYTHON` → `E:\kohya_ss\venv\Scripts\python.exe`
- `KOHYA_SCRIPT` → `E:\kohya_ss\sd-scripts\sdxl_train_network.py`

Override via env vars in `.env` if your layout differs.

#### 2. Florence-2 dependencies

The captioning script runs against the same Python that runs ComfyUI. On this
machine that is `C:\Users\mip\AppData\Local\Programs\Python\Python312\python.exe`
(set `PYTHON_BIN` env var to override). `transformers`, `timm`, `einops`, `Pillow`
are already installed there — nothing to do.

The Florence-2 model (`microsoft/Florence-2-large`, ~1 GB) is downloaded
automatically on first run into `~/.cache/huggingface`.

#### 3. Download the SDXL base checkpoint

Place `lustifySDXLNSFW_ggwpV7.safetensors` (or any SDXL finetune) into:
```
E:\ComfyUI\models\checkpoints\SDXL\
```
Override the default by passing `baseModel` in the start request, or by
setting `LORA_BASE_MODEL` (relative to `models/checkpoints/`).

#### 4. Apply the database migration

```powershell
npx prisma migrate dev --name add_training_jobs
```

### Train a LoRA

```bash
# 1. Generate the dataset (existing endpoint)
POST /generation/profiles/:profileId/generate-dataset

# 2. Wait until ComfyUI finishes — images appear in E:\ComfyUI\output\<profileCode>*

# 3. Kick off training (returns a TrainingJob immediately, work runs in background)
POST /training/profiles/:profileId/start
{
  "triggerToken": "courier28",   # optional, derived from profileCode if omitted
  "numRepeats":   10,            # kohya repeats per image
  "maxSteps":     1500,
  "networkDim":   32,
  "baseModel":    "SDXL/lustifySDXLNSFW_ggwpV7.safetensors"
}

# 4. Poll status
GET /training/jobs/:jobId
# status: pending → preparing → captioning → training → completed | failed
```

On success, `CharacterProfile.loraPath` points at
`E:\ComfyUI\models\loras\gen-studio\<slug>\<profileCode>_sdxl.safetensors`,
which is the path INSTARAW workflows should load via their `LoraLoader` nodes.

### Pipeline data layout

```
E:\ComfyUI\
  output\
    <profileCode>_*.png                # ai_syndicate_v3 results
  models\
    checkpoints\SDXL\
      lustifySDXLNSFW_ggwpV7.safetensors
    loras\gen-studio\<slug>\
      <profileCode>_sdxl.safetensors   # final LoRA
gen-studio\data\<slug>\
  comfy\
    ai_syndicate_dataset_creator_v3_api.json
  lora\<profileCode>\
    dataset.toml                       # generated by config.builder.ts
    img\10_<token>\                    # kohya subset folder
      0001.png
      0001.txt                         # Florence-2 caption
```

### Environment variables

| var | default | purpose |
|----|----|----|
| `APP_ROOT` | `<gen-studio>` | resolves `data/`, `scripts/`, `projects/` |
| `COMFY_OUTPUT` | `E:\ComfyUI\output` | where ai_syndicate_v3 dropped images |
| `COMFY_MODELS` | `E:\ComfyUI\models` | base models + LoRA output root |
| `PYTHON_BIN` | `C:\Users\mip\AppData\Local\Programs\Python\Python312\python.exe` | runs Florence-2 |
| `FLORENCE_TASK` | `DETAILED_CAPTION` | `CAPTION` / `DETAILED_CAPTION` / `MORE_DETAILED` |
| `KOHYA_DIR` | `E:\kohya_ss` | kohya install root |
| `KOHYA_PYTHON` | `<KOHYA_DIR>\venv\Scripts\python.exe` | venv python |
| `KOHYA_SCRIPT` | `<KOHYA_DIR>\sd-scripts\sdxl_train_network.py` | trainer entrypoint |
| `LORA_BASE_MODEL` | `SDXL/lustifySDXLNSFW_ggwpV7.safetensors` | base for new LoRAs |
