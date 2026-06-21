-- Migration: 20260621_add_project_youtube_url
-- Adds Project.youtubeUrl — the published YouTube link of the finished video.
-- When set, the project is DONE: ActionsService suppresses every pipeline gate
-- for it (no more render/upscale/FPS-interp/TTS nagging on /actions), because
-- the deliverable already shipped. Null = still in production.
--
-- Apply by hand (Prisma shadow-database issues on Windows):
--   psql -h localhost -U gen_studio -d gen_studio -f prisma/migrations/20260621_add_project_youtube_url/migration.sql
--   npx prisma migrate resolve --applied 20260621_add_project_youtube_url
--   npx prisma generate     (stop the backend first — the client DLL is locked)
--
-- Idempotent: IF NOT EXISTS.

BEGIN;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;

COMMENT ON COLUMN projects."youtubeUrl" IS 'Published YouTube URL of the finished video. When set the project is DONE and /actions hides all pipeline gates for it. Null = still in production.';

COMMIT;
