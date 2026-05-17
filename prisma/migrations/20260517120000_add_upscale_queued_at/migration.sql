-- AlterTable
ALTER TABLE "video_renders"
    ADD COLUMN "upscaleQueuedAt" TIMESTAMP(3);

-- Backfill so the queue ordering for the upscale lifecycle uses an upscale-
-- specific timestamp instead of the main render's queuedAt (which is set when
-- the video was *originally* rendered — often days earlier — and made every
-- newly-queued upscale jump to the front of the pipeline).
UPDATE "video_renders"
   SET "upscaleQueuedAt" = COALESCE("upscaleStartedAt", "queuedAt")
 WHERE "upscaleStatus" IS NOT NULL
   AND "upscaleQueuedAt" IS NULL;

-- CreateIndex
CREATE INDEX "video_renders_upscaleStatus_upscaleQueuedAt_idx"
    ON "video_renders"("upscaleStatus", "upscaleQueuedAt");
