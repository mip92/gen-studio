-- Image QC (кадры): deterministic-first validation of rendered shot candidates
-- (DWPose skeletons + scrfd faces + targeted Qwen fact-checklist). Successor of
-- the retired LLM-judge image_validation_jobs flow — that table is kept as
-- history, no rows are migrated. One run row per project batch + one verdict
-- per (shotId, filename) candidate.
-- Hand-authored (no shadow DB; migrate diff drags unrelated live-DB drift —
-- see 20260803090000_vo_validation's note).

-- CreateTable
CREATE TABLE "image_qc_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL,
    "shotIdsOverride" JSONB,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "processedImages" INTEGER NOT NULL DEFAULT 0,
    "lastProgressAt" TIMESTAMP(3),
    "summary" JSONB,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "image_qc_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_qc_verdicts" (
    "id" TEXT NOT NULL,
    "shotId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "peopleExpected" INTEGER,
    "peopleFound" INTEGER,
    "backgroundFaces" INTEGER,
    "poseFlags" JSONB,
    "poseMetrics" JSONB,
    "factFlags" JSONB,
    "factAnswers" JSONB,
    "issues" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_qc_verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "image_qc_runs_projectId_status_idx" ON "image_qc_runs"("projectId", "status");

-- CreateIndex
CREATE INDEX "image_qc_runs_status_queuedAt_idx" ON "image_qc_runs"("status", "queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "image_qc_verdicts_shotId_filename_key" ON "image_qc_verdicts"("shotId", "filename");

-- CreateIndex
CREATE INDEX "image_qc_verdicts_runId_idx" ON "image_qc_verdicts"("runId");

-- CreateIndex
CREATE INDEX "image_qc_verdicts_status_idx" ON "image_qc_verdicts"("status");

-- AddForeignKey
ALTER TABLE "image_qc_runs" ADD CONSTRAINT "image_qc_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_qc_verdicts" ADD CONSTRAINT "image_qc_verdicts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "image_qc_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_qc_verdicts" ADD CONSTRAINT "image_qc_verdicts_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
