-- Backfill `queuedAt` for training_jobs that pre-date the 20260509130000
-- pipeline_queue migration. That migration added queuedAt as NOT NULL DEFAULT
-- CURRENT_TIMESTAMP, so every legacy row got the migration's apply-time as
-- queuedAt — which can be AFTER the row's actual startedAt/completedAt and
-- makes the queue UI show "queued LATER than completed".
--
-- Symptom in the UI: failed/cancelled training rows whose `queuedAt` is
-- later than `completedAt`. Affects only training_jobs (other tables didn't
-- have the same backfill pattern at that point).

UPDATE "training_jobs"
   SET "queuedAt" = COALESCE("startedAt", "completedAt", "queuedAt")
 WHERE "completedAt" IS NOT NULL
   AND "queuedAt" > "completedAt";
