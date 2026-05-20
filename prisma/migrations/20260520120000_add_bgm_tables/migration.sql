-- BGM (ACE-Step background music) infrastructure. Three new tables:
--   * narrative_blocks    — project-level chapters (Старт, Рост, Выгорание, …)
--                           with target duration derived from covered shots.
--   * music_segments      — one music track slot per segment (60s typical),
--                           multiple per block to fill target without one
--                           4-minute loop covering the whole chapter.
--   * audio_render_jobs   — ACE-Step generation history per segment; same
--                           lifecycle pattern as video_renders / tts_jobs.

-- CreateTable: narrative_blocks
CREATE TABLE "narrative_blocks" (
    "id"            TEXT NOT NULL,
    "projectId"     TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "title"         TEXT,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "moodPrompt"    TEXT,
    "shotIds"       JSONB NOT NULL,
    "targetSeconds" INTEGER,
    "status"        TEXT NOT NULL DEFAULT 'filling',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "narrative_blocks_projectId_slug_key" ON "narrative_blocks"("projectId", "slug");
CREATE INDEX "narrative_blocks_projectId_sortOrder_idx" ON "narrative_blocks"("projectId", "sortOrder");

ALTER TABLE "narrative_blocks" ADD CONSTRAINT "narrative_blocks_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: music_segments
CREATE TABLE "music_segments" (
    "id"            TEXT NOT NULL,
    "blockId"       TEXT NOT NULL,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "prompt"        TEXT,
    "durationSec"   INTEGER NOT NULL DEFAULT 60,
    "approvedJobId" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_segments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "music_segments_blockId_sortOrder_idx" ON "music_segments"("blockId", "sortOrder");

ALTER TABLE "music_segments" ADD CONSTRAINT "music_segments_blockId_fkey"
  FOREIGN KEY ("blockId") REFERENCES "narrative_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: audio_render_jobs
CREATE TABLE "audio_render_jobs" (
    "id"               TEXT NOT NULL,
    "segmentId"        TEXT NOT NULL,
    "status"           TEXT NOT NULL,
    "comfyPromptId"    TEXT,
    "params"           JSONB,
    "workflowFilename" TEXT NOT NULL DEFAULT 'bgm_acestep_api.json',
    "outputFilename"   TEXT,
    "errorMessage"     TEXT,
    "queuedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"        TIMESTAMP(3),
    "completedAt"      TIMESTAMP(3),

    CONSTRAINT "audio_render_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audio_render_jobs_segmentId_idx" ON "audio_render_jobs"("segmentId");
CREATE INDEX "audio_render_jobs_status_queuedAt_idx" ON "audio_render_jobs"("status", "queuedAt");

ALTER TABLE "audio_render_jobs" ADD CONSTRAINT "audio_render_jobs_segmentId_fkey"
  FOREIGN KEY ("segmentId") REFERENCES "music_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
