-- Add image_validation_jobs queue table — used by ImageValidationService to
-- score a shot's rendered candidates with the local Ollama vision model
-- (qwen3-vl) and auto-pick the best match into Shot.chosenRender. Same
-- queue-managed pattern as scene_render_jobs / anchor_render_jobs
-- (PipelineQueueService.tick()), but dispatch stops ComfyUI first so the whole
-- GPU is free for the vision model.
--
-- Idempotent — re-runs safe. Additive only (no changes to existing tables).

CREATE TABLE IF NOT EXISTS image_validation_jobs (
  id               TEXT        PRIMARY KEY,
  "shotId"         TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
  "expectedPrompt" TEXT,
  narration        TEXT,
  candidates       JSONB,
  result           JSONB,
  "chosenFilename" TEXT,
  "errorMessage"   TEXT,
  "queuedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "startedAt"      TIMESTAMPTZ,
  "completedAt"    TIMESTAMPTZ,
  CONSTRAINT image_validation_jobs_shot_fkey
    FOREIGN KEY ("shotId") REFERENCES shots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS image_validation_jobs_shotId_idx ON image_validation_jobs ("shotId");
CREATE INDEX IF NOT EXISTS image_validation_jobs_status_queuedAt_idx ON image_validation_jobs (status, "queuedAt");
