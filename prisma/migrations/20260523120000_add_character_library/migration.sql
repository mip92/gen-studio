-- Phase 1 of the character library refactor. Lets characters live independently
-- of projects (the "library") and be attached to any number of projects via the
-- new project_characters M:N join. Phase 2 (post training-queue drain) will move
-- existing per-project dataset/LoRA/reference files into data/_characters/
-- and drop the legacy `projectId` / `profileCode` columns. Until then those
-- columns stay populated for backwards compatibility with code that still
-- queries them.
--
-- All changes are additive (NOT NULL → NULL, new tables/columns, new indexes).
-- Existing rows untouched at the column level. project_characters and
-- reference_assets.characterId are backfilled inline.

-- 1. characters.projectId: NOT NULL → NULL; FK ON DELETE CASCADE → SET NULL
ALTER TABLE "characters" DROP CONSTRAINT "characters_projectId_fkey";
ALTER TABLE "characters" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "characters"
  ADD CONSTRAINT "characters_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. New join table for M:N project ↔ character.
CREATE TABLE "project_characters" (
  "projectId"   TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "attachedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_characters_pkey" PRIMARY KEY ("projectId", "characterId"),
  CONSTRAINT "project_characters_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_characters_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "project_characters_characterId_idx" ON "project_characters"("characterId");

-- 3. Backfill: every existing project-bound character gets an attach row.
INSERT INTO "project_characters" ("projectId", "characterId", "attachedAt")
SELECT "projectId", "id", "createdAt"
FROM "characters"
WHERE "projectId" IS NOT NULL;

-- 4. reference_assets: add nullable characterId FK; relax projectId; recreate FK.
ALTER TABLE "reference_assets" DROP CONSTRAINT "reference_assets_projectId_fkey";
ALTER TABLE "reference_assets" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "reference_assets" ADD COLUMN "characterId" TEXT;
ALTER TABLE "reference_assets"
  ADD CONSTRAINT "reference_assets_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reference_assets"
  ADD CONSTRAINT "reference_assets_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "characters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "reference_assets_characterId_idx" ON "reference_assets"("characterId");

-- 5. Backfill reference_assets.characterId. Resolution rule: find the
-- character whose profile.profileCode matches the asset's profileCode AND
-- whose character.projectId matches the asset's projectId. If multiple
-- profiles share a profileCode (shouldn't — profileCode is unique per
-- character), the join picks one; manual cleanup if any asset lands NULL.
UPDATE "reference_assets" ra
SET "characterId" = sub."characterId"
FROM (
  SELECT DISTINCT ON (cp."profileCode", c."projectId")
         cp."profileCode" AS code,
         c."projectId"    AS pid,
         c."id"           AS "characterId"
  FROM "character_profiles" cp
  JOIN "characters" c ON c."id" = cp."characterId"
  WHERE c."projectId" IS NOT NULL
) sub
WHERE ra."profileCode" = sub.code
  AND ra."projectId"   = sub.pid
  AND ra."characterId" IS NULL;

-- 6. Partial unique on library characters (projectId IS NULL): code globally
-- unique across the library so we can't accidentally have two "PAX_STU"
-- library entries. Project-bound rows keep using the existing
-- characters_projectId_code_key.
CREATE UNIQUE INDEX "characters_library_code_unique"
  ON "characters" ("code")
  WHERE "projectId" IS NULL;
