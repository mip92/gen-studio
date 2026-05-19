-- Shot-level TTS narration support. One TTSJob now belongs to either a Scene
-- (legacy whole-scene voiceover) or a Shot (~5s per-shot voiceover); never
-- both. Service code enforces exactly-one-of via runtime check.

-- AlterTable: add narration fields to Shot
ALTER TABLE "shots" ADD COLUMN "narrationText" TEXT;
ALTER TABLE "shots" ADD COLUMN "approvedTTSJobId" TEXT;

-- AlterTable: TTSJob can now reference either scene or shot.
ALTER TABLE "tts_jobs" ALTER COLUMN "sceneId" DROP NOT NULL;
ALTER TABLE "tts_jobs" ADD COLUMN "shotId" TEXT;

-- AddForeignKey
ALTER TABLE "tts_jobs" ADD CONSTRAINT "tts_jobs_shotId_fkey"
  FOREIGN KEY ("shotId") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tts_jobs_shotId_idx" ON "tts_jobs"("shotId");
