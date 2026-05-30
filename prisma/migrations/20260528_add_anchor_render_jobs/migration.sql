-- Add anchor_render_jobs queue table — used by AnchorRenderService for cartoon
-- character anchor portrait generation. Same pattern as scene_render_jobs and
-- dataset_jobs (queue-managed via PipelineQueueService.tick()).
--
-- Idempotent — re-runs safe.

CREATE TABLE IF NOT EXISTS anchor_render_jobs (
  id              TEXT        PRIMARY KEY,
  "profileId"     TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending',
  "comfyPromptId" TEXT,
  "outputPath"    TEXT,
  "errorMessage"  TEXT,
  "queuedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "startedAt"     TIMESTAMPTZ,
  "completedAt"   TIMESTAMPTZ,
  CONSTRAINT anchor_render_jobs_profile_fkey
    FOREIGN KEY ("profileId") REFERENCES character_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS anchor_render_jobs_profileId_idx ON anchor_render_jobs ("profileId");
CREATE INDEX IF NOT EXISTS anchor_render_jobs_status_queuedAt_idx ON anchor_render_jobs (status, "queuedAt");
