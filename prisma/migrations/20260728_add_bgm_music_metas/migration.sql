-- ACE-Step 1.5 metadata conditioning per act / per tile.
--
-- Until now BgmRenderService.patch() never touched the node's bpm / keyscale /
-- timesignature inputs, so every render went out at the template defaults
-- (120 bpm, A minor, 4/4) while 369 of 385 seeded captions stated a *different*
-- tempo in their text. The tokenizer appends the metas to the model prompt as a
-- labelled "# Metas" block, so caption and metas contradicted each other on
-- every take — the documented cause of the broken rhythm.

-- AlterTable
ALTER TABLE "narrative_blocks" ADD COLUMN IF NOT EXISTS "bpm" INTEGER;
ALTER TABLE "narrative_blocks" ADD COLUMN IF NOT EXISTS "keyscale" TEXT;
ALTER TABLE "narrative_blocks" ADD COLUMN IF NOT EXISTS "timesignature" TEXT;

-- AlterTable
ALTER TABLE "music_segments" ADD COLUMN IF NOT EXISTS "bpm" INTEGER;
ALTER TABLE "music_segments" ADD COLUMN IF NOT EXISTS "keyscale" TEXT;
ALTER TABLE "music_segments" ADD COLUMN IF NOT EXISTS "timesignature" TEXT;

-- Heal a pre-existing drift: `spare` was added straight to the database by the
-- act-tiling feature without a migration, so a fresh `migrate deploy` against a
-- clean database would otherwise not have the column that schema.prisma declares.
ALTER TABLE "music_segments" ADD COLUMN IF NOT EXISTS "spare" BOOLEAN NOT NULL DEFAULT false;
