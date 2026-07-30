-- Single reference → up to three, in Picture-N order (the graph's image1..image3).
-- AlterTable
ALTER TABLE "thumbnail_jobs" ADD COLUMN "refProfileCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Carry the existing single reference over so queued/rendered ideas keep theirs.
UPDATE "thumbnail_jobs"
   SET "refProfileCodes" = ARRAY["refProfileCode"]
 WHERE "refProfileCode" IS NOT NULL AND "refProfileCode" <> '';

-- AlterTable
ALTER TABLE "thumbnail_jobs" DROP COLUMN "refProfileCode";
