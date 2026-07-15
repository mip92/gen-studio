-- Add anchor_validation_jobs queue table — the character-portrait analogue of
-- image_validation_jobs. After an anchor render produces N candidate portraits,
-- AnchorValidationService scores each with the local Ollama vision model
-- (qwen3-vl) against the character's identity spec (promptBase) with a HARD
-- anti-anime rubric, and copies the best clean single-subject portrait into
-- data/<slug>/reference/<profileCode>_anchor.png. Same queue-managed pattern as
-- image_validation_jobs (PipelineQueueService.tick()), dispatch stops ComfyUI
-- first so the whole GPU is free for the vision model.
--
-- Idempotent — re-runs safe. Additive only (no changes to existing tables).

CREATE TABLE IF NOT EXISTS anchor_validation_jobs (
  id                TEXT        PRIMARY KEY,
  "profileId"       TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending',
  "expectedPrompt"  TEXT,
  candidates        JSONB,
  result            JSONB,
  "chosenFilename"  TEXT,
  "suggestedPrompt" TEXT,
  "errorMessage"    TEXT,
  "queuedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "startedAt"       TIMESTAMPTZ,
  "completedAt"     TIMESTAMPTZ,
  CONSTRAINT anchor_validation_jobs_profile_fkey
    FOREIGN KEY ("profileId") REFERENCES character_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS anchor_validation_jobs_profileId_idx ON anchor_validation_jobs ("profileId");
CREATE INDEX IF NOT EXISTS anchor_validation_jobs_status_queuedAt_idx ON anchor_validation_jobs (status, "queuedAt");
