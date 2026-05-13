-- Track all trained LoRA variants per profile (final + epoch checkpoints)
-- so the user can pick which checkpoint to use for scene rendering.
-- Already applied to dev DB via `prisma db push`.

ALTER TABLE "character_profiles"
    ADD COLUMN IF NOT EXISTS "loraVariants" JSONB;
