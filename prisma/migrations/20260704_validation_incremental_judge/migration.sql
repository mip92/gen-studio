-- Incremental validation + comparative judge + structured suggestion.
--
-- "suggestedFields": when NO candidate passes QC the vision model now proposes
-- a STRUCTURED rewrite: {"positive": "...", "negative": "..."} — positive is
-- the full rewritten positive prompt, negative is tokens to APPEND to the
-- shot's negative. Replaces the flat positive-only "suggestedPrompt" (column
-- kept for old rows' display).
--
-- "judgeReason": when >1 candidate passes QC, a separate comparative judge
-- call (multi-image) picks the best; its one-line justification lands here.
--
-- Idempotent, additive only.

ALTER TABLE image_validation_jobs ADD COLUMN IF NOT EXISTS "suggestedFields" JSONB;
ALTER TABLE image_validation_jobs ADD COLUMN IF NOT EXISTS "judgeReason" TEXT;
