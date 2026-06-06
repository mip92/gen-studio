-- Migration: 20260531_add_render_mode_export_timing
-- Adds the long-form "static frames + Ken Burns" production model:
--   * Shot.renderMode    — "animated" (Wan i2v clip + FHD upscale, default) or
--                          "static" (ship the still PNG only; CapCut export adds
--                          a slow Ken-Burns move at export time).
--   * Project.exportTiming — "clip" (legacy: shot = native clip length, keeps
--                          last_shift/bio_plus exports byte-identical) or
--                          "narration" (every shot held for its voiceover;
--                          animated clips slowed to fit, stills held).
-- See exports.service.ts + scripts/export_capcut.py for the consumers.
--
-- Apply by hand (Prisma shadow-database issues on Windows per
-- PROJECT_CREATION_GUIDE Приложение A):
--   psql -h localhost -U gen_studio -d gen_studio -f prisma/migrations/20260531_add_render_mode_export_timing/migration.sql
--   npx prisma migrate resolve --applied 20260531_add_render_mode_export_timing
--   npx prisma generate     (stop the backend first — the client DLL is locked)
--
-- Idempotent: re-running is safe (IF NOT EXISTS clauses + DEFAULT backfill).

BEGIN;

-- 1. Shot.renderMode --------------------------------------------------------
ALTER TABLE shots
  ADD COLUMN IF NOT EXISTS "renderMode" TEXT NOT NULL DEFAULT 'animated';

COMMENT ON COLUMN shots."renderMode" IS 'Final-cut render mode. "animated" (default) = Wan2.2 i2v clip + FHD upscale; export lays the mp4. "static" = ship the chosen still PNG only (no video/upscale); export lays the image with a slow Ken-Burns move. Readiness: animated needs a chosen video + completed upscale; static needs only a chosenRender.';

-- 2. Project.exportTiming ---------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS "exportTiming" TEXT NOT NULL DEFAULT 'clip';

COMMENT ON COLUMN projects."exportTiming" IS 'CapCut export timeline timing. "clip" (default) = each animated shot occupies its native clip length (length/fps); keeps legacy exports byte-identical. "narration" = every shot held for its voiceover length; animated clips slowed (CapCut speed) to fill, static frames held with Ken Burns.';

-- 3. Backfill existing rows (no-op thanks to the DEFAULTs above) -------------
UPDATE shots    SET "renderMode"  = 'animated' WHERE "renderMode"  IS NULL OR "renderMode"  = '';
UPDATE projects SET "exportTiming" = 'clip'     WHERE "exportTiming" IS NULL OR "exportTiming" = '';

COMMIT;
