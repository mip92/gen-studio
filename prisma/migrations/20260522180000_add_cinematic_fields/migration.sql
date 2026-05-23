-- Cinematic fields for project last_shift (and future film projects).
-- Adds first-class columns for: distribution target, safety tier (Project),
-- act beat + default palette/time-of-day (Scene), camera framing/angle/move
-- + story beat + narrative function + vignette slug + B-roll / iconic flags
-- + per-shot palette/time-of-day overrides (Shot), IP-Adapter flag for
-- LoRA-less character profiles (CharacterProfile).
--
-- All additive, all nullable or with DEFAULT — safe to apply on a live DB
-- with no data loss.

ALTER TABLE "projects"
  ADD COLUMN "targetPlatform" TEXT,
  ADD COLUMN "safetyTier"     TEXT;

ALTER TABLE "scenes"
  ADD COLUMN "actBeat"           TEXT,
  ADD COLUMN "defaultPaletteKey" TEXT,
  ADD COLUMN "defaultTimeOfDay"  TEXT;

ALTER TABLE "shots"
  ADD COLUMN "shotType"          TEXT,
  ADD COLUMN "cameraAngle"       TEXT,
  ADD COLUMN "cameraMove"        TEXT,
  ADD COLUMN "storyBeat"         TEXT,
  ADD COLUMN "narrativeFunction" TEXT,
  ADD COLUMN "vignetteSlug"      TEXT,
  ADD COLUMN "isBroll"           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "isIconic"          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "timeOfDay"         TEXT,
  ADD COLUMN "paletteKey"        TEXT;

CREATE INDEX "shots_projectId_shotType_idx"     ON "shots" ("projectId", "shotType");
CREATE INDEX "shots_projectId_vignetteSlug_idx" ON "shots" ("projectId", "vignetteSlug");
CREATE INDEX "shots_projectId_isBroll_idx"      ON "shots" ("projectId", "isBroll");
CREATE INDEX "shots_projectId_isIconic_idx"     ON "shots" ("projectId", "isIconic");

ALTER TABLE "character_profiles"
  ADD COLUMN "useIpAdapter" BOOLEAN NOT NULL DEFAULT FALSE;
