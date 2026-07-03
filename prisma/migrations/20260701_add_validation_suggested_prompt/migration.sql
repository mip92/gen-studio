-- When image validation finds NO acceptable candidate (all severe / none match),
-- it stores a vision-model-proposed improved positive prompt here instead of
-- force-picking a bad render. The user reviews/approves it in the UI.
--
-- Idempotent, additive only.

ALTER TABLE image_validation_jobs ADD COLUMN IF NOT EXISTS "suggestedPrompt" TEXT;
