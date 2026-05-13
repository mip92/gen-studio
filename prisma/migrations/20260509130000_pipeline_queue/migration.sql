-- Pipeline queue support: add queuedAt to training_jobs (so it sorts uniformly
-- with dataset_jobs.queuedAt) and introduce scene_render_jobs (so scene
-- generation goes through the unified pipeline queue instead of fire-and-forget
-- against ComfyUI).
--
-- Already applied to dev DB via `prisma db push`; this file backfills the
-- migration history for environments that haven't been touched yet.

-- ── training_jobs.queuedAt ─────────────────────────────────────────────────
ALTER TABLE "training_jobs"
    ADD COLUMN IF NOT EXISTS "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "training_jobs_status_queuedAt_idx"
    ON "training_jobs"("status", "queuedAt");

-- ── scene_render_jobs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "scene_render_jobs" (
    "id"            TEXT NOT NULL,
    "shotId"        TEXT NOT NULL,
    "status"        TEXT NOT NULL,
    "comfyPromptId" TEXT,
    "params"        JSONB,
    "errorMessage"  TEXT,
    "queuedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"     TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),

    CONSTRAINT "scene_render_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "scene_render_jobs_shotId_idx"
    ON "scene_render_jobs"("shotId");

CREATE INDEX IF NOT EXISTS "scene_render_jobs_status_queuedAt_idx"
    ON "scene_render_jobs"("status", "queuedAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'scene_render_jobs_shotId_fkey'
    ) THEN
        ALTER TABLE "scene_render_jobs"
            ADD CONSTRAINT "scene_render_jobs_shotId_fkey"
            FOREIGN KEY ("shotId") REFERENCES "shots"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
