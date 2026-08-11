-- Release calendar: one nullable instant per project.
-- Semantics: FACTUAL YouTube publish time (UTC) for released projects
-- (youtubeUrl set, value owned by the backfill sync), PLANNED slot for
-- unreleased ones (Tue/Thu 13:00 channel wall clock by default).
-- Naive timestamp = UTC, like every other timestamp column in this DB.
-- STRICTLY ADDITIVE single column: ADD COLUMN with no default is
-- metadata-only on PG11+ (no rewrite, no long lock). Hand-authored —
-- no shadow DB in this repo, never run `migrate dev`/`diff` against it.
ALTER TABLE "projects" ADD COLUMN "releaseAt" TIMESTAMP(3);
