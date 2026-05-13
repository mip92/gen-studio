-- CreateTable
CREATE TABLE "video_renders" (
    "id" TEXT NOT NULL,
    "shotId" TEXT NOT NULL,
    "sourceImageFilename" TEXT NOT NULL,
    "motionPrompt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comfyPromptId" TEXT,
    "params" JSONB,
    "outputFilename" TEXT,
    "workflowFilename" TEXT NOT NULL,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "video_renders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_renders_shotId_idx" ON "video_renders"("shotId");

-- CreateIndex
CREATE INDEX "video_renders_status_queuedAt_idx" ON "video_renders"("status", "queuedAt");

-- AddForeignKey
ALTER TABLE "video_renders" ADD CONSTRAINT "video_renders_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
