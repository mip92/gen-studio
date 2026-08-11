-- Anchor APPROVAL, made an explicit state.
--
-- Until now nothing recorded whether a human had ever looked at an anchor. Both
-- pipelines auto-install a candidate the moment a render finishes — characters
-- in AnchorRenderService (the validator's pick), props in PropAnchorService
-- (literally the first file). So "an anchor exists on disk" meant only "the
-- machine produced something", and a portrait nobody approved went straight
-- into every scene render that used it.
--
-- NULL = waiting for review. Set = the user approved this exact image, and a
-- re-render clears it again.
--
-- Deliberately NOT backfilled (user 2026-08-11, asked explicitly): the 363
-- character anchors and 15 prop anchors already on disk all start unapproved
-- and go through review. The consequence was stated and accepted — /actions
-- shows them as pending, and shot rendering is blocked project-wide until the
-- anchors a shot depends on are approved.

ALTER TABLE "character_profiles" ADD COLUMN IF NOT EXISTS "anchorApprovedAt" TIMESTAMP(3);
ALTER TABLE "props"              ADD COLUMN IF NOT EXISTS "anchorApprovedAt" TIMESTAMP(3);
