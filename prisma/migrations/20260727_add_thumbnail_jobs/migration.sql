-- CreateTable
CREATE TABLE "thumbnail_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idea" TEXT,
    "prompt" TEXT NOT NULL,
    "negative" TEXT,
    "batchSize" INTEGER NOT NULL DEFAULT 2,
    "candidates" JSONB,
    "chosenFilename" TEXT,
    "refProfileCode" TEXT,
    "captionSpec" JSONB,
    "comfyPromptId" TEXT,
    "artPath" TEXT,
    "outputPath" TEXT,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "thumbnail_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "thumbnail_jobs_projectId_idx" ON "thumbnail_jobs"("projectId");

-- CreateIndex
CREATE INDEX "thumbnail_jobs_status_queuedAt_idx" ON "thumbnail_jobs"("status", "queuedAt");

-- AddForeignKey
ALTER TABLE "thumbnail_jobs" ADD CONSTRAINT "thumbnail_jobs_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
