-- Anchor inheritance, formalised: `character_profiles.baseProfileId`.
--
-- The COLUMN already exists in the live DB — it was added by hand on 2026-08-03
-- when the feature shipped (props precedent, see 20260801_add_prop_anchor_jobs),
-- which is why `prisma migrate diff` kept reporting it as drift. This migration
-- adopts it into the schema WITHOUT touching the data: every statement is
-- idempotent, so it is a no-op on this machine's DB and a real create on a
-- fresh one.
--
-- Deliberately NOT touched here: the other known live-DB drift (props.id
-- default), same as the vo_validation migration.

ALTER TABLE "character_profiles" ADD COLUMN IF NOT EXISTS "baseProfileId" TEXT;

CREATE INDEX IF NOT EXISTS "character_profiles_baseProfileId_idx"
    ON "character_profiles"("baseProfileId");

-- ON DELETE SET NULL: dropping a base profile degrades its descendants to
-- independent text-to-image anchor renders instead of deleting them.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'character_profiles_baseProfileId_fkey'
    ) THEN
        ALTER TABLE "character_profiles"
            ADD CONSTRAINT "character_profiles_baseProfileId_fkey"
            FOREIGN KEY ("baseProfileId") REFERENCES "character_profiles"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
