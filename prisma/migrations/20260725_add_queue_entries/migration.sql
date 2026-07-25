-- Unified queue + render ledger.
--
-- STRICTLY ADDITIVE: one new table, two new columns with constant defaults.
-- No existing column is dropped, renamed or rewritten, so this is safe to apply
-- to a database that holds ~38k historical job rows. `ADD COLUMN ... DEFAULT
-- <constant>` is metadata-only on PG11+ (no table rewrite, no long lock).

-- AlterTable: project-level queue priority tier ("render this film first")
ALTER TABLE "projects" ADD COLUMN "queuePriorityTier" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "projects" ADD COLUMN "queuePrioritizedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "engineClass" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "rank" DOUBLE PRECISION NOT NULL,
    "projectId" TEXT,
    "projectSlug" TEXT,
    "projectName" TEXT,
    "sceneId" TEXT,
    "sceneKey" TEXT,
    "shotId" TEXT,
    "shotCode" TEXT,
    "profileId" TEXT,
    "profileCode" TEXT,
    "characterCode" TEXT,
    "segmentId" TEXT,
    "blockSlug" TEXT,
    "label" TEXT NOT NULL,
    "workflowFilename" TEXT,
    "comfyPromptId" TEXT,
    "outputFilename" TEXT,
    "paramsSnapshot" JSONB,
    "outcome" TEXT,
    "outcomeReason" TEXT,
    "classifiedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstEligibleAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "backfilled" BOOLEAN NOT NULL DEFAULT false,
    "historyTruncated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_entries_status_rank_idx" ON "queue_entries"("status", "rank");
CREATE INDEX "queue_entries_status_engineClass_idx" ON "queue_entries"("status", "engineClass");
CREATE INDEX "queue_entries_jobType_jobId_idx" ON "queue_entries"("jobType", "jobId");
CREATE INDEX "queue_entries_jobType_status_idx" ON "queue_entries"("jobType", "status");
CREATE INDEX "queue_entries_projectId_status_idx" ON "queue_entries"("projectId", "status");
CREATE INDEX "queue_entries_projectId_outcome_idx" ON "queue_entries"("projectId", "outcome");

-- Invariants enforced by the DATABASE, not just by application code. Prisma's
-- schema DSL cannot express partial indexes, so these are hand-written and must
-- be preserved if this migration is ever regenerated.

-- (1) Single-slot GPU: at most ONE row may be `running` across every job type.
--     A partial unique index on a constant expression is the standard Postgres
--     way to say "at most one row may satisfy this predicate". This is what
--     makes a double-dispatch bug impossible rather than merely unlikely.
CREATE UNIQUE INDEX "queue_entries_one_running" ON "queue_entries"((TRUE)) WHERE "status" = 'running';

-- (2) One live entry per underlying job stage: two competing pending/running
--     entries for the same (jobType, jobId) would race to dispatch the same
--     work. Terminal rows are exempt — that is exactly how attempt history
--     accumulates.
CREATE UNIQUE INDEX "queue_entries_one_live_per_job" ON "queue_entries"("jobType", "jobId") WHERE "status" IN ('pending', 'running');
