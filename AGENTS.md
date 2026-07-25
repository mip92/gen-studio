# gen-studio — architecture rules for AI agents

This is a **multi-project content factory**: one NestJS API serves many film
projects (`last_shift`, `night_courier`, more later). Every prompt, parameter,
negative, atmospheric guard, location description, character lock and motion
hint is **content** that belongs in the database. Code is the engine; content
is the cargo. If you find yourself hardcoding content into TypeScript, JSON
templates, or filesystem files — **stop**. The fix is in the DB.

These rules apply to any AI agent (Claude, GPT, Cursor, etc.) and any human
contributor working on this repo.

---

## 1. NEVER edit ComfyUI workflow JSON templates

**Files:** `data/<projectSlug>/comfy/*.json` (e.g.
`data/last_shift/comfy/video_wan22_i2v_api.json`,
`scene_single_character_v3.json`, `dataset_creator_v3.json`, etc.)

**Rule:** these are dumb shape-only templates. Their text fields are either
`PLACEHOLDER_*` sentinels or sensible fallbacks. **Never hand-edit them to
change prompts, negatives, atmospheric guards, or any content.**

**Why:** the app produces many projects. Editing a JSON file hardcodes
content into one project's filesystem, defeats the data-driven architecture,
bypasses the UI, can't be undone from the UI, and won't propagate to other
projects.

**How to add new prompt content to a workflow:**

1. Add a DB column or JSON sub-field where the content belongs:
   - Project-wide → new column on `Project` (e.g. `defaultVideoNegative`)
     or a key in `Project.settings` JSON
   - Per shot → new key in `Shot.promptFields` JSON (e.g. `motionNegative`)
   - Per scene/act → new column on `Scene` (e.g. `lightingMood`)
2. The render service reads the DB value and calls
   `set('<nodeId>', 'text', value)` on the workflow clone at render time —
   exactly like `set('9', 'text', motionPrompt)` already does for the
   video positive in `video-render.service.ts:patch()`, or
   `params.scenePrompt = positive` in `scene-render.service.ts`.
3. UI gets a field on the Project or Shot page so the user can edit it.
4. If you need a sentinel in the workflow, use `PLACEHOLDER_<UPPERCASE>` and
   document it next to the `set(…)` call.

**Examples of correctly data-driven flows already in place:**
- `Project.defaultNegative` → SDXL negative fallback chain
  (`pf.negative || project.defaultNegative`), used in
  `SceneRenderService.renderShot`.
- `Project.scriptText` → canonical screenplay; characters, locations and
  beats derive from it.
- `Shot.promptFields.positive` / `.negative` / `.camera` / etc. → per-shot
  overrides, all editable from the UI.
- `Location.description` (added 2026-05-24) → prepended to positive by
  `SceneRenderService` via `$queryRaw` lookup.
- `Scene.lightingMood`, `Scene.defaultPaletteKey`, `Scene.defaultTimeOfDay` →
  act-level defaults that shots inherit when their per-shot field is null.
- `CharacterProfile.promptBase`, `promptAngles`, `promptVariety`, `negative`,
  `triggerToken` → dataset-generator inputs, fully editable.

---

## 2. All content edits go through the REST API, not direct SQL

**Files:** see `src/projects/`, `src/shots/`, `src/scenes/`,
`src/characters/`, `src/locations/`, `src/tts/`.

**Rule:** for content edits (positives, narration, character profiles,
participants, locations) call the REST API at `http://localhost:4000/...`.
Don't write `UPDATE ...` via psql.

**Why:** direct SQL bypasses validation, sanitization (e.g.
`sanitizeNegative` in scene-render), cache invalidation and WebSocket
broadcasts to the UI — the user clicks render and sees stale data.

**Exception:** schema-shape work (migrations, seeds for a brand-new project,
the `scriptText` column which has no PATCH endpoint yet) is fine via SQL.
Bulk operations on existing rows are also OK via SQL **when** the equivalent
API doesn't yet exist — but the right fix is to add the endpoint, not to
keep using SQL.

---

## 3. All GPU jobs go through PipelineQueueService

**File:** `src/pipeline/pipeline-queue.service.ts`.

**Rule:** never spawn a Python or CUDA process from an HTTP request handler.
Always create a Prisma job row (`DatasetJob`, `TrainingJob`, `SceneRenderJob`,
`VideoRender`, `TTSJob`, `AudioRenderJob`) with `status: 'pending'` and let
`PipelineQueueService.tick()` (polling every 5s) dispatch it.

**Why:** dispatch handlers contend for the same GPU/VRAM. The queue enforces
mutually-exclusive engines (no two training runs at once; rendering blocks
training) and proper FIFO ordering across job types. Bypassing it caused a
real hang on 2026-05-14 when an auto-prompt POST handler started
ComfyUI directly while a training was running.

**Where to queue from:**
- HTTP handler → service method (`enqueue*`) → `prisma.<table>.create({ ... pending })`.
- Queue tick picks it up, sets `running`, dispatches the actual GPU call.
- On completion the service polls / observes and writes `completed` or `failed`.

---

## 4. Never queue GPU jobs unsolicited

The user must explicitly ask for a render / video / upscale via natural
language ("запусти", "поставь", "render this", "regenerate"). Do not
auto-queue work just because you fixed a prompt — the user might want to
review the fix before spending GPU on it. Fixing prompts, narration,
participants, locations etc. via API is always fine.

---

## 5. Multi-project: never hardcode a project slug

Avoid literals like `'last_shift'`, `'night_courier'` in service code or
SQL. Resolve project from the request context (route param, FK chain,
participant lookup). The only places a literal slug is acceptable are:
- One-off SQL bulk-edits or migrations (with a TODO to remove the literal).
- Per-project seed scripts (`prisma/seeds/<slug>/`) which are slug-specific
  by definition.

For library characters (`Character.projectId === null`) borrow the workflow
template from the first attached project — see Phase 2 path-helper in
`src/training/character-paths.util.ts` and
`src/generation/dataset-queue.service.ts`.

---

## 6. Render-pipeline conventions

### 6.1 SDXL scene rendering — `SceneRenderService.renderShot`

Resolves positive in this order:
1. `Shot.promptFields.positive` (verbatim if non-empty)
2. Otherwise composes from `pf.narrativeBeat`, `pf.frameDescription`,
   `pf.positiveEnvironment`, `pf.positiveCharacterLocks`, `Scene.lightingMood`
3. Prepends `Location.description` (looked up via `$queryRaw` on
   `Shot.locationId`).
4. Prepends a camera framing directive translated from `pf.camera.framing`
   when the prompt has no shot size baked in.

Negative resolution: `pf.negative || project.defaultNegative`, then
`sanitizeNegative` (strips dangerous tokens like `motion blur`,
`out of focus`, `plastic skin`, and clamps weights ≤ 1.3).

### 6.2 Video i2v rendering — `VideoRenderService.patch`

Source image is the shot's chosen render. Motion prompt is composed by
`composeMotionPrompt` from `videoRender.motionPrompt` plus
`pf.narrativeBeat`. Static-shot detection via `pf.camera.movement` starting
with `static`.

**TODO (in flight 2026-05-24):** node 10 negative is currently still
hardcoded in the workflow JSON. The proper fix in flight is:
- Add `Project.defaultVideoNegative` (DB column).
- Add `Shot.promptFields.motionNegative` (JSON sub-field).
- In `VideoRenderService.patch()`, resolve
  `motionNeg = pf.motionNegative || project.defaultVideoNegative` and
  `set('10', 'text', motionNeg)`. When both are empty, the JSON's existing
  fallback text wins (sensible default).
- UI exposes both fields on the Project page (next to `defaultNegative`)
  and on the Shot Prompts page (next to `negative`).

Same pattern for the motion-prompt fallbacks (`subtle camera push-in...`
and the long static no-motion line) — they should move to
`Project.defaultMotionPrompt` and `Project.defaultStaticMotionPrompt`.

### 6.3 Render parameters (steps/cfg/width/height/length/fps/batch)

**Stay hardcoded** as TS constants in `scene-render.service.ts` (1344×768,
batchSize=5) and `video-render.service.ts` (DEFAULT_WIDTH/HEIGHT/LENGTH/FPS).
Every project renders to the same dimensions and frame counts — these are
output-format concerns, not creative content. **Do not** add Project columns
or JSON sub-fields for them. The data-driven principle in this doc applies
to **prompt content** (positives, negatives, atmospheric guards, motion
hints) — not to numeric pipeline parameters.

---

## 7. Strategy / workflow selection

`SceneFactory.pickByParticipantCount(n)` picks a workflow strategy based on
how many characters are in the shot:

- 0 → environment workflow (no LoRA)
- 1 → single-character workflow
- 2+ → **never** use multi-LoRA strategies (they're disabled). The shot must
  be composed as **SingleWithBack** — one character face-on (sole IP-Adapter
  ref or sole LoRA), the other character written into text only with
  "from behind, face out of frame". Strip the secondary participant from
  `ShotParticipant` so only one face ref is injected.

This is enforced by convention, not yet by code. If you see a shot with 2
participants in `ShotParticipant`, fix it by removing the off-frame one and
describing them in `positive` instead.

---

## 8. Negative prompt sanity

Hard rules baked into `sanitizeNegative`:
- Never write token weights `> 1.3` (e.g. `(plastic skin:1.5)` produces
  hyper-sharp plastic AI skin). The sanitizer downscales them.
- Strip `motion blur`, `out of focus`, `plastic skin`, `oversmooth` — these
  push the model toward the opposite (hyper-sharp).
- Strip whitelist-banned tokens (deepfake-style, NSFW, etc.).

Apply the sanitizer to anything fed into `set('<negativeNode>', 'text', ...)`.

---

## 9. Character training pipeline

- One trained LoRA per `CharacterProfile` (the age/state variant).
- For passenger-only characters that aren't training a LoRA, use
  `useIpAdapter: true` on the profile. Actions gate skips dataset/training
  gates for IP-Adapter-only profiles.
- Library characters (`Character.projectId === null`) live at
  `data/_characters/<characterCode>/<profileCode>/{reference,datasets}/`
  and `models/loras/gen-studio/_characters/<characterCode>/`. Path
  resolution helpers in `src/training/character-paths.util.ts`.
- Project-bound characters use the legacy
  `data/<projectSlug>/{reference,datasets}/<profileCode>/` layout.

---

## 10. Language / encoding

The DB stores **English** prompt content because the SDXL CLIP tokenizer and
Florence-2 captioner are English-only. Cyrillic in `promptBase`,
`promptAngles`, `negative`, `positive`, etc. produces broken embeddings.

**Exception:** human-facing narration (`Scene.narrationText`,
`Shot.narrationText`, `Project.scriptText`) is in the project's source
language — Russian for `last_shift` and `night_courier`. These go to the TTS
model (which is multilingual) and the editor UI, not to SDXL.

UI labels (`Location.name`, `Character.displayName`) are also in the source
language. Only the `description` / `promptBase` etc. — what reaches SDXL —
must be English.

---

## 11. File layout

```
src/
  projects/          REST + service for Project rows
  scenes/            Scene rows (acts) — owns lightingMood, defaultPalette
  shots/             Shot rows + the standalone /shots controller
  characters/        Character + CharacterProfile + library endpoints
  locations/         Location CRUD (added 2026-05-24)
  reference-assets/  Per-project reference asset rows
  generation/
    scenes/          SceneRenderService.renderShot — SDXL dispatch
    videos/          VideoRenderService — Wan2.2 i2v + upscale
    workflows/       WorkflowFactory.loadTemplate(strategy, projectSlug)
    dataset-queue.service.ts
    generation.service.ts
  training/
    training.service.ts        kohya training dispatch
    dataset.service.ts         dataset prepare + caption
    character-paths.util.ts    library vs project-bound path resolver
    lora-variants.util.ts
  tts/               ChatterboxTTS dispatch
  bgm/               ACE-Step BGM dispatch
  exports/           CapCut JSON / mp4 packaging
  pipeline/
    pipeline-queue.service.ts  FIFO dispatcher + engine arbitration
    pipeline.controller.ts     /pipeline/queue (unified queue view)
  actions/           /actions — "what's the next gate" view
  comfy/             ComfyUI HTTP client
  prisma/            Prisma client wrapper
  workflow/          Workflow templates registry (legacy, being absorbed)
  reference-assets/
```

Per-project content lives at:

```
data/<projectSlug>/
  comfy/             *.json workflow templates  ← NEVER hand-edit
  reference/<profileCode>/reference.<ext>
  datasets/<profileCode>/img/<repeats>_<token>/
  shots/<shotCode>/                                ← rendered images live here
    videos/                                        ← Wan2.2 mp4s
data/_characters/<charCode>/<profileCode>/
  reference/, datasets/                            ← library-character layout
models/loras/gen-studio/<projectSlug>/             ← per-project LoRAs
models/loras/gen-studio/_characters/<charCode>/    ← library LoRAs
```

---

## 12. When in doubt

If a request says "fix the rendered video", look at:
1. The shot's `promptFields` in the DB — is the prompt wrong?
2. The shot's `locationId` and the Location's `description` — is the setting wrong?
3. The project's `defaultNegative` / `defaultVideoNegative` — is a global guard missing?
4. The video render's `motionPrompt` — is the motion direction wrong?

**Don't** look at:
- `data/<slug>/comfy/*.json` — that's the engine, not the cargo.
- The LoRA `.safetensors` — those are baked from datasets; the fix is upstream.

If the fix requires touching the engine (the `.json` templates or the
hardcoded TS defaults), that's a sign the engine is missing a DB-driven
field — add the field instead of patching the engine.

---

## 13. The queue lives in `queue_entries` — and so does render history

`queue_entries` is BOTH the queue and the permanent per-attempt render history.
A row is born `pending`, is claimed into `running`, then goes terminal and is
**never updated or deleted again**. Terminal rows accumulate and ARE the history.

Consequences worth knowing before you touch anything nearby:

- **Creating a job row is not enough.** The dispatcher picks work *only* from
  `queue_entries` (`QueueLedgerService.selectNext`). Any new code path that
  inserts a `SceneRenderJob` / `VideoRender` / `TTSJob` / … must also call
  `ledger.enqueue(jobType, jobId)`, or the job sits `pending` forever with no
  error anywhere. `createMany` is therefore unusable for job rows — the ledger
  needs each row's id.
- **Finishing a job row is not enough either.** Every terminal transition must
  call `ledger.close(...)`. A missed close only costs one tick (the reconcile
  pass closes it from the row's own state), but the elapsed time is then measured
  from the reconcile, not from the real completion.
- **Queue position is `rank` (a float), never `queuedAt`.** `queuedAt` means only
  "when the work was requested". Reordering rewrites `rank`; whole-project
  priority is `Project.queuePriorityTier`, which is sticky — future jobs of that
  project inherit it.
- **The ledger has no foreign keys, on purpose.** Deleting a shot, scene or
  project must NOT erase the record of time spent on it. Delete paths call
  `ledger.cancelAndSealUnder(scope, reason)` first, which stops in-flight ComfyUI
  work and seals the open entries.
- **Two hand-written partial unique indexes** live in
  `prisma/migrations/20260725_add_queue_entries/migration.sql`:
  `queue_entries_one_running` (at most one row may be `running` — the single-GPU
  invariant, enforced by the database) and `queue_entries_one_live_per_job`.
  Prisma's DSL cannot express partial indexes, so `prisma migrate dev` may offer
  to drop them as "drift" — **decline, and re-add them to any regenerated
  migration.** Losing them makes double-dispatch possible again.
- **Failures are kept.** There used to be a boot sweep that hard-deleted every
  `status='failed'` VideoRender on every restart, which is why the video defect
  rate was unmeasurable. Don't reintroduce anything like it: waste statistics are
  computed from those rows.
