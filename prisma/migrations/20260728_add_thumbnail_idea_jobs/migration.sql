-- CreateTable
CREATE TABLE "thumbnail_idea_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 6,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "thumbnail_idea_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "thumbnail_idea_jobs_projectId_idx" ON "thumbnail_idea_jobs"("projectId");

-- CreateIndex
CREATE INDEX "thumbnail_idea_jobs_status_queuedAt_idx" ON "thumbnail_idea_jobs"("status", "queuedAt");

-- AddForeignKey
ALTER TABLE "thumbnail_idea_jobs" ADD CONSTRAINT "thumbnail_idea_jobs_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
