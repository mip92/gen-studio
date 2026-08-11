-- Profile inheritance link: a profile can name another profile of the SAME
-- character as its BASE STATE ("previous state" — younger age, pre-injury...).
-- When set, the anchor render for this profile runs as a Qwen-Image-Edit-2511
-- EDIT of the base profile's installed anchor ("the same person, changed to
-- match this profile's promptBase") instead of an independent text-to-image —
-- so the face ages instead of being reinvented per age band.
--
-- Raw SQL by design (props precedent): the column is read via $queryRaw in
-- AnchorRenderService, so no prisma generate / backend stop is needed to ship.
ALTER TABLE character_profiles
  ADD COLUMN IF NOT EXISTS "baseProfileId" text NULL
  REFERENCES character_profiles(id) ON DELETE SET NULL;
