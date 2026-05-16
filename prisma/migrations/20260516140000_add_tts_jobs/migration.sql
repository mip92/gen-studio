-- AlterTable
ALTER TABLE "scenes" ADD COLUMN "narrationText" TEXT;

-- CreateTable
CREATE TABLE "tts_jobs" (
    "id"             TEXT NOT NULL,
    "sceneId"        TEXT NOT NULL,
    "text"           TEXT NOT NULL,
    "voice"          TEXT NOT NULL,
    "sampleRate"     INTEGER NOT NULL,
    "status"         TEXT NOT NULL,
    "outputFilename" TEXT,
    "errorMessage"   TEXT,
    "queuedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"      TIMESTAMP(3),
    "completedAt"    TIMESTAMP(3),

    CONSTRAINT "tts_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tts_jobs_sceneId_idx"          ON "tts_jobs"("sceneId");
CREATE INDEX "tts_jobs_status_queuedAt_idx"  ON "tts_jobs"("status", "queuedAt");

-- AddForeignKey
ALTER TABLE "tts_jobs"
    ADD CONSTRAINT "tts_jobs_sceneId_fkey"
    FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
