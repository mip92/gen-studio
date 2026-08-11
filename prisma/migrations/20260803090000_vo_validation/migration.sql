-- VO validation (audio QC of rendered narration): opt-in per-project approve
-- gate + one run row per project batch + 1:1 verdict per TTSJob.
-- NOTE: `prisma migrate diff --from-url` also surfaced unrelated live-DB drift
-- (character_profiles.baseProfileId exists in the DB but not in the schema;
-- props.id default) — deliberately NOT touched here; this migration is
-- vo_validation only.

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "voValidationGateEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "vo_validation_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL,
    "jobIdsOverride" JSONB,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "processedJobs" INTEGER NOT NULL DEFAULT 0,
    "lastProgressAt" TIMESTAMP(3),
    "summary" JSONB,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "vo_validation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vo_validation_verdicts" (
    "id" TEXT NOT NULL,
    "ttsJobId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER,
    "transcript" TEXT,
    "wer" DOUBLE PRECISION,
    "missingWords" JSONB,
    "extraWords" JSONB,
    "repeatedWords" JSONB,
    "garbledWords" JSONB,
    "riskyStressWords" JSONB,
    "prosodyFlags" JSONB,
    "techFlags" JSONB,
    "issues" JSONB,
    "textSnapshotStale" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vo_validation_verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vo_validation_runs_projectId_status_idx" ON "vo_validation_runs"("projectId", "status");

-- CreateIndex
CREATE INDEX "vo_validation_runs_status_queuedAt_idx" ON "vo_validation_runs"("status", "queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vo_validation_verdicts_ttsJobId_key" ON "vo_validation_verdicts"("ttsJobId");

-- CreateIndex
CREATE INDEX "vo_validation_verdicts_runId_idx" ON "vo_validation_verdicts"("runId");

-- CreateIndex
CREATE INDEX "vo_validation_verdicts_status_idx" ON "vo_validation_verdicts"("status");

-- AddForeignKey
ALTER TABLE "vo_validation_runs" ADD CONSTRAINT "vo_validation_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vo_validation_verdicts" ADD CONSTRAINT "vo_validation_verdicts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "vo_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vo_validation_verdicts" ADD CONSTRAINT "vo_validation_verdicts_ttsJobId_fkey" FOREIGN KEY ("ttsJobId") REFERENCES "tts_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

