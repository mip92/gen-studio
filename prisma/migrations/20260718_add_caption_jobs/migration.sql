-- CreateTable
CREATE TABLE "caption_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "srtPath" TEXT,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "caption_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "caption_jobs_status_queuedAt_idx" ON "caption_jobs"("status", "queuedAt");
