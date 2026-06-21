-- Migration: 20260621_add_video_fps_interp
-- Adds the FPS-interpolation (RIFE/FILM frame interpolation → 2× framerate)
-- lifecycle to video_renders. This is a MANDATORY final step that runs AFTER
-- the FHD upscale: it interpolates the upscaled clip to a higher framerate and
-- becomes the deliverable CapCut export ships. Lifecycle mirrors the existing
-- upscale columns: null → pending → running → completed | failed.
--   * interpStatus       — null until queued; gated on upscaleStatus='completed'
--   * interpFilename      — basename of the smoothed mp4 in shots/<code>/videos_smooth/
--   * interpPromptId      — ComfyUI prompt_id for the interpolation job
--   * interpMultiplier    — frame multiplier used (2 = double FPS)
--   * interpQueuedAt      — FIFO key for the interpolation queue (own timestamp)
--   * interpStartedAt / interpCompletedAt / interpErrorMessage
-- See video-render.service.ts, pipeline-queue.service.ts, exports.service.ts.
--
-- Apply by hand (Prisma shadow-database issues on Windows per
-- PROJECT_CREATION_GUIDE Приложение A):
--   psql -h localhost -U gen_studio -d gen_studio -f prisma/migrations/20260621_add_video_fps_interp/migration.sql
--   npx prisma migrate resolve --applied 20260621_add_video_fps_interp
--   npx prisma generate     (stop the backend first — the client DLL is locked)
--
-- Idempotent: re-running is safe (IF NOT EXISTS clauses).

BEGIN;

ALTER TABLE video_renders
  ADD COLUMN IF NOT EXISTS "interpStatus"        TEXT,
  ADD COLUMN IF NOT EXISTS "interpFilename"      TEXT,
  ADD COLUMN IF NOT EXISTS "interpPromptId"      TEXT,
  ADD COLUMN IF NOT EXISTS "interpMultiplier"    INTEGER,
  ADD COLUMN IF NOT EXISTS "interpQueuedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "interpStartedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "interpCompletedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "interpErrorMessage"  TEXT;

COMMENT ON COLUMN video_renders."interpStatus" IS 'FPS interpolation lifecycle (RIFE/FILM → 2x framerate). null → pending → running → completed | failed. MANDATORY before CapCut export; only queueable once upscaleStatus=completed.';

CREATE INDEX IF NOT EXISTS "video_renders_interpStatus_interpQueuedAt_idx"
  ON video_renders ("interpStatus", "interpQueuedAt");

COMMIT;
