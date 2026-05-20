-- Exact wav duration in milliseconds, probed from the RIFF header on TTS job
-- completion (or backfilled lazily when an older row is first read by the
-- scenes endpoint). Null until measured; UI falls back to a text-length
-- heuristic until the value is populated.

ALTER TABLE "tts_jobs" ADD COLUMN "durationMs" INTEGER;
