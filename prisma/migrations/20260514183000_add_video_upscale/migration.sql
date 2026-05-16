-- AlterTable
ALTER TABLE "video_renders"
    ADD COLUMN "upscaleStatus"       TEXT,
    ADD COLUMN "upscaledFilename"    TEXT,
    ADD COLUMN "upscalePromptId"     TEXT,
    ADD COLUMN "upscaleStartedAt"    TIMESTAMP(3),
    ADD COLUMN "upscaleCompletedAt"  TIMESTAMP(3),
    ADD COLUMN "upscaleErrorMessage" TEXT;

-- CreateIndex
CREATE INDEX "video_renders_upscaleStatus_idx" ON "video_renders"("upscaleStatus");
