-- Migration: 20260528_add_visual_style
-- Adds per-project visual-style selection so gen-studio can render arbitrary styles
-- (photoreal_cinematic for last_shift/night_courier, graphic_novel_cell_shaded for
-- bio_plus, plus future styles). See docs/VISUAL_STYLE_ARCHITECTURE.md for the model.
--
-- Apply by hand (Prisma shadow-database issues on Windows per
-- PROJECT_CREATION_GUIDE Приложение A):
--   psql -h localhost -U gen_studio -d gen_studio -f migrations/20260528_add_visual_style.sql
--   npx prisma migrate resolve --applied 20260528_add_visual_style
--   npx prisma generate
--
-- Idempotent: re-running is safe (IF NOT EXISTS clauses).

BEGIN;

-- 1. visual_styles registry table -------------------------------------------
CREATE TABLE IF NOT EXISTS visual_styles (
  id                        TEXT PRIMARY KEY,
  "displayName"             TEXT NOT NULL,
  "styleBlock"              TEXT NOT NULL,
  "defaultNegative"         TEXT NOT NULL,
  "identityStack"           TEXT NOT NULL CHECK ("identityStack" IN ('lora_face_lock', 'ip_adapter_only', 'ip_adapter_plus_style_lora')),
  "loraPipeline"            TEXT NOT NULL CHECK ("loraPipeline" IN ('character_lora_florence2', 'none', 'style_lora_dataset')),
  "characterIpTemplateKey"  TEXT,
  "environmentTemplateKey"  TEXT,
  "datasetTemplateKey"      TEXT,
  "loraTrainTemplateKey"    TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE visual_styles IS 'Registry of visual styles available to projects. Each row defines style-block tokens, negative-prompt block, identity-stack strategy, LoRA pipeline kind, and references to workflow templates. Backend reads project.visualStyle and looks up here.';

-- 2. Project.visualStyle column ---------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS "visualStyle" TEXT NOT NULL DEFAULT 'photoreal_cinematic';

-- FK ensures projects can only reference registered styles
-- (created AFTER seed_visual_styles.sql inserts the photoreal_cinematic row,
-- so on first apply we add the FK separately — see end of this script)

COMMENT ON COLUMN projects."visualStyle" IS 'Visual style of this project. Drives workflow routing + LoRA pipeline + style-block injection. References visual_styles.id. Default photoreal_cinematic for backwards compatibility with last_shift / night_courier.';

-- 3. WorkflowTemplate.visualStyle column ------------------------------------
ALTER TABLE workflow_templates
  ADD COLUMN IF NOT EXISTS "visualStyle" TEXT;

COMMENT ON COLUMN workflow_templates."visualStyle" IS 'Optional. If set, this workflow template is style-specific (e.g. cinema-comic IP-Adapter). Null = generic across styles (TTS, BGM, video upscale).';

-- 4. Backfill existing projects to photoreal --------------------------------
-- (No-op if migration already applied. The DEFAULT above also covers new projects.)
UPDATE projects SET "visualStyle" = 'photoreal_cinematic'
  WHERE "visualStyle" IS NULL OR "visualStyle" = '';

-- 5. FK constraint (deferred until visual_styles is seeded) ------------------
-- See bottom of seed_visual_styles.sql for ADD CONSTRAINT step. Keeping it
-- separate so this migration can run before the seed.

COMMIT;
