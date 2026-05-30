# gen-studio · Visual-style architecture

> **Цель:** gen-studio как фреймворк, способный рендерить **любой стиль ролика** — photoreal cinematic (как last_shift/night_courier), cinematic graphic-novel (как bio_plus), Pixar 3D, Soviet animation, storybook illustration и т.д. Каждый проект выбирает свой стиль на старте; все workflow/LoRA-pipeline переключаются автоматически.
>
> **Принцип:** добавление, не замена. Существующие photoreal-воркфлоу (last_shift/comfy/*, night_courier/comfy/*) не трогаем. Новые стили — новые workflow templates + routes + LoRA-pipeline.

---

## 1. Уровни архитектуры

| Уровень | Что меняется per visual style |
|---|---|
| **Project.visualStyle** | Хранит выбранный стиль (строка-id) |
| **Style block / negative** | Стилевые токены в каждый shot prompt, character profile prompt, dataset prompt |
| **Workflow templates** | Разные ComfyUI JSON под каждый стиль (LoRA loader, checkpoint, IP-Adapter config) |
| **Workflow routes** | `<style>_character_ip`, `<style>_environment` — пер стиль |
| **LoRA-pipeline** | Photoreal = character-LoRA training; cartoon = style-LoRA + IP-Adapter (без character training) |
| **Dataset generator** | Photoreal = Florence-2 caption + ai_syndicate_dataset_creator; cartoon = no character dataset, optional style-LoRA dataset |
| **Identity-anchor strategy** | Photoreal = LoRA face-lock; cartoon = IP-Adapter @ 0.4-0.5 + text-anchor (mole/freckle/badge/etc.) |
| **Negative prompt** | Photoreal-neg vs cartoon-neg (mutually exclusive — cartoon explicitly negates "photoreal/3D render" and vice-versa) |

---

## 2. Доступные стили (registry)

| Style ID | Описание | Identity stack | Default Project |
|---|---|---|---|
| `photoreal_cinematic` | Реалистичный кинематограф, 35mm grain, документальный лук | character-LoRA + optional IP-Adapter | last_shift, night_courier |
| `graphic_novel_cell_shaded` | Cinematic graphic novel, cell-shaded, hard ink outline | IP-Adapter @ 0.4 + comic style-LoRA + text-anchor | bio_plus |
| `pixar_3d` *(planned)* | Pixar/Disney 3D rendering | IP-Adapter + 3D-style LoRA | — |
| `soviet_animation` *(planned)* | Союзмультфильм, мягкие линии, акварель | IP-Adapter + Soviet-anim style-LoRA | — |
| `storybook_illustration` *(planned)* | Акварель/гуашь, взрослая детская книга | IP-Adapter + storybook style-LoRA | — |

Регистрация новых стилей — добавлением строк в `visual_styles` registry table (см. §5) без code change.

---

## 3. Schema migration (NEW columns)

Добавляем в `Project`:

```prisma
model Project {
  // ... existing fields ...
  /// Visual style of this project. Drives workflow routing + LoRA pipeline +
  /// style-block injection into prompts. Defaults to 'photoreal_cinematic'
  /// for backwards compatibility with last_shift / night_courier.
  /// Must reference a row in visual_styles table.
  visualStyle String @default("photoreal_cinematic")
}
```

Добавляем новую таблицу `visual_styles`:

```prisma
model VisualStyle {
  id                String   @id              // 'photoreal_cinematic', 'graphic_novel_cell_shaded', etc.
  displayName       String                    // 'Photoreal cinematic', 'Graphic novel (cell-shaded)'
  /// Style-block tokens injected into every shot prompt via {STYLE} placeholder.
  styleBlock        String
  /// Negative-prompt block paired with this style. Replaces {NEG} placeholder.
  defaultNegative   String
  /// Identity-stack strategy: 'lora_face_lock' | 'ip_adapter_only' | 'ip_adapter_plus_style_lora'.
  identityStack     String
  /// LoRA-training pipeline: 'character_lora_florence2' | 'none' | 'style_lora_dataset'.
  loraPipeline      String
  /// Reference workflow template keys for this style.
  characterIpTemplateKey String?              // workflow template for single-char shots
  environmentTemplateKey String?              // workflow template for B-roll shots
  datasetTemplateKey     String?              // workflow template for dataset generation (if loraPipeline != 'none')
  loraTrainTemplateKey   String?              // workflow template for LoRA training (if loraPipeline != 'none')
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

Workflow templates получают новый column для filter-by-style:

```prisma
model WorkflowTemplate {
  // ... existing fields ...
  /// Optional: this template belongs to this visual style. Null = generic
  /// (works across styles, e.g. TTS, BGM, video upscale).
  visualStyle String?
}
```

---

## 4. Backend routing

В `pipeline-queue.service.ts` (или эквиваленте):

```typescript
async function resolveWorkflowForShot(shot: Shot, project: Project) {
  const style = await getVisualStyle(project.visualStyle);
  
  if (shot.referenceProfileId != null) {
    return style.characterIpTemplateKey;
  } else {
    return style.environmentTemplateKey;
  }
}

async function resolveLoraPipeline(project: Project) {
  const style = await getVisualStyle(project.visualStyle);
  return style.loraPipeline; // 'character_lora_florence2' | 'none' | 'style_lora_dataset'
}
```

Текущие photoreal проекты (`visualStyle = 'photoreal_cinematic'`) продолжают использовать `last_shift_character_ip` / `last_shift_environment` (или общие `character_lora_sdxl` / `environment_flux`) — никаких code-path changes для них.

---

## 5. Workflow templates per style — convention

### Photoreal (existing)
```
char_lora_sdxl                  → scene_single_character_api.json
char_ip_adapter_sdxl            → scene_single_character_ipadapter_api.json
environment_flux                → scene_environment_flux_api.json
dataset_florence2_creator       → ai_syndicate_dataset_creator_v3_api.json
```

### Graphic novel (NEW)
```
char_ip_graphic_novel           → scene_character_ip_graphic_novel_api.json  (NEW)
environment_graphic_novel       → scene_environment_graphic_novel_api.json   (NEW)
(no dataset / no character LoRA — identity via text + IP-Adapter only)
```

Style-блоки и негативы в JSON:
- Loader: SDXL base + comic-style LoRA (e.g. `cinematic-comic-style.safetensors`) at weight 0.6
- IP-Adapter: ReActor-style face IP-Adapter at weight 0.4
- Positive prompt: starts with style tokens, then identity, then scene
- Negative: photoreal+ list ("photograph, 3D render, plastic skin, ...")

---

## 6. LoRA-pipeline branching

### Photoreal path (existing)
```
1. POST /profiles/:id/generate-dataset — runs ai_syndicate_dataset_creator
2. Dataset captioned via Florence-2 + identity-anchor tokens
3. POST /lora/:id/train — runs SDXL LoRA training pipeline (1k+ steps)
4. Resulting loraPath written to character_profiles.loraPath
5. Rendered shots use loraPath in scene_single_character_api.json
```

### Graphic novel path (NEW)
```
1. Generate 1 anchor reference image via Nano Banana per character (no dataset)
2. POST /profiles/:id/upload-anchor — stores reference image path
3. NO LoRA training — character_profiles.useIpAdapter = TRUE
4. Rendered shots use IP-Adapter ref at weight 0.4 + style-LoRA at 0.6
5. Optional: train STYLE-LoRA once per project on 20-30 reference comic frames (project-wide, not per-character)
```

API endpoints:
- `POST /profiles/:id/upload-anchor` — new endpoint for cartoon path (no dataset job)
- `POST /styles/:projectId/train-style-lora` — new endpoint for optional project-wide style-LoRA training
- Existing `POST /profiles/:id/generate-dataset` and `POST /lora/:id/train` continue working for photoreal projects

---

## 7. UI implications

### Project creation form
Add **Visual style** dropdown:
- Photoreal cinematic (last_shift, night_courier)
- Graphic novel cell-shaded (bio_plus)
- *Other styles as they get registered*

Style choice locks character-profile UI behaviour:
- photoreal → shows "Generate dataset" + "Train LoRA" buttons
- graphic_novel → shows "Upload anchor reference" only

### Character profile view (ShotNarrationTab.tsx and related)
For graphic_novel projects:
- Hide LoRA-path display
- Show single anchor reference image preview
- Hide dataset/training pipeline UI sections

For photoreal projects:
- Existing UI unchanged

### Shot prompt view
Style-block tokens auto-prepended to positive prompt preview based on `project.visualStyle`. UI shows style hint:
```
[Style: graphic_novel_cell_shaded] cinematic graphic novel illustration, ... + your prompt
```

---

## 8. Implementation order (incremental)

### Phase 1 — Foundation (data only, no code changes)
- [ ] Apply Prisma migration: add `Project.visualStyle` + `visual_styles` table + `WorkflowTemplate.visualStyle`
- [ ] Seed `visual_styles` with `photoreal_cinematic` (existing) + `graphic_novel_cell_shaded` (new for bio_plus)
- [ ] Backfill all existing projects to `visualStyle = 'photoreal_cinematic'`
- [ ] Register new workflow templates for `graphic_novel_cell_shaded`

### Phase 2 — Backend routing
- [ ] Add `getVisualStyle(styleId)` helper in `pipeline-queue.service.ts`
- [ ] Refactor `resolveWorkflowForShot` to read project.visualStyle
- [ ] Add `POST /profiles/:id/upload-anchor` endpoint (cartoon path)
- [ ] Branch LoRA pipeline by style in dataset/training services

### Phase 3 — UI
- [ ] Add visual-style picker to project creation form
- [ ] Conditional UI rendering for character profile view per style
- [ ] Style hint in shot prompt preview

### Phase 4 — bio_plus integration
- [ ] Create `data/bio_plus/comfy/scene_character_ip_graphic_novel_api.json` (new file)
- [ ] Create `data/bio_plus/comfy/scene_environment_graphic_novel_api.json` (new file)
- [ ] Generate 8 anchor reference images via Nano Banana
- [ ] Upload anchors via new endpoint
- [ ] First render test on A1_SH22 (leitmotif birth iconic)

### Phase 5 — Additional styles (future)
- [ ] Register `pixar_3d`, `soviet_animation`, `storybook_illustration` in `visual_styles`
- [ ] Create corresponding workflow templates
- [ ] No further code changes needed (registry-driven)

---

## 9. Backwards compatibility guarantees

- ✅ Existing projects (`last_shift`, `night_courier`) get `visualStyle = 'photoreal_cinematic'` via backfill
- ✅ Existing workflow templates (`char_lora_sdxl`, `char_ip_adapter_sdxl`, `environment_flux`, `dataset_florence2_creator`) untouched — referenced from `visual_styles.photoreal_cinematic` row
- ✅ Existing `data/last_shift/comfy/*.json`, `data/night_courier/comfy/*.json` not modified
- ✅ Existing API endpoints (`POST /profiles/:id/generate-dataset`, `POST /lora/:id/train`) continue working for photoreal projects
- ✅ New endpoints (`POST /profiles/:id/upload-anchor`, `POST /styles/:projectId/train-style-lora`) are additions
- ✅ Frontend `ShotNarrationTab.tsx` and related continue rendering unchanged for photoreal; new conditional branches for cartoon styles

No breaking changes. Cartoon support is purely additive.

---

## 10. References
- `PROJECT_CREATION_GUIDE.md` §5 (Workflow routes) — current photoreal-only
- `character_profiles.md` §6 (Visual style variants) — bio_plus graphic-novel specifics
- `feedback_two_lora_disabled.md` — applies to both photoreal and cartoon (single face-lock rule)
- `feedback_db_english_only.md` — applies to both (all prompt content in English)
