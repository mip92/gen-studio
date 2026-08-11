-- Video QC («Видео QC»): deterministic scanner + anchored Qwen-VL check of
-- completed i2v base clips, one run per project (mirrors image_qc / vo QC).
-- Verdict is 1:1 to video_renders via FK CASCADE — deleting a clip deletes its
-- verdict. Hand-authored (no shadow DB in this repo — see earlier migrations).

-- CreateTable
CREATE TABLE "video_qc_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL,
    "shotIdsOverride" JSONB,
    "totalClips" INTEGER NOT NULL DEFAULT 0,
    "processedClips" INTEGER NOT NULL DEFAULT 0,
    "lastProgressAt" TIMESTAMP(3),
    "summary" JSONB,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "video_qc_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_qc_verdicts" (
    "id" TEXT NOT NULL,
    "videoRenderId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "flags" JSONB,
    "metrics" JSONB,
    "suspicious" JSONB,
    "vlmAnswers" JSONB,
    "issues" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_qc_verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_qc_runs_projectId_status_idx" ON "video_qc_runs"("projectId", "status");

-- CreateIndex
CREATE INDEX "video_qc_runs_status_queuedAt_idx" ON "video_qc_runs"("status", "queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "video_qc_verdicts_videoRenderId_key" ON "video_qc_verdicts"("videoRenderId");

-- CreateIndex
CREATE INDEX "video_qc_verdicts_runId_idx" ON "video_qc_verdicts"("runId");

-- CreateIndex
CREATE INDEX "video_qc_verdicts_status_idx" ON "video_qc_verdicts"("status");

-- AddForeignKey
ALTER TABLE "video_qc_runs" ADD CONSTRAINT "video_qc_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_qc_verdicts" ADD CONSTRAINT "video_qc_verdicts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "video_qc_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_qc_verdicts" ADD CONSTRAINT "video_qc_verdicts_videoRenderId_fkey" FOREIGN KEY ("videoRenderId") REFERENCES "video_renders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
