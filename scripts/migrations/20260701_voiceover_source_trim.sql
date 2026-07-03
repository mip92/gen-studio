-- Voiceover: retain the full source clip + trim window so a library voice can be
-- re-trimmed later without re-downloading. Additive, nullable, idempotent — run
-- via `prisma db execute` (NOT `prisma migrate dev`, which would drift-reset the
-- DB against the out-of-band raw-SQL tables like props/locations).
--
--   npx prisma db execute --schema prisma/schema.prisma \
--     --file scripts/migrations/20260701_voiceover_source_trim.sql
--
-- Then `npx prisma generate` to pick up the new fields on the typed client.

ALTER TABLE "voiceovers" ADD COLUMN IF NOT EXISTS "sourceFilePath" TEXT;
ALTER TABLE "voiceovers" ADD COLUMN IF NOT EXISTS "trimStartMs" INTEGER;
ALTER TABLE "voiceovers" ADD COLUMN IF NOT EXISTS "trimEndMs" INTEGER;
