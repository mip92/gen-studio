-- Sampling tier per thumbnail render: 'scene' | 'balanced' | 'full'.
-- Additive and nullable: NULL means "service default", so every existing row
-- keeps rendering exactly as it did before this column existed.
ALTER TABLE thumbnail_jobs ADD COLUMN IF NOT EXISTS "quality" TEXT;
