-- Per-clip audio switch for LTX-2.5 video.
--
-- LTX writes sound into the clip itself; until now the upscale+RIFE pass threw
-- that audio away (its CreateVideo node had no `audio` input), so no film ever
-- carried it. Now that the pass keeps it, a clip whose invented music fights the
-- act's ACE-Step score needs an off switch that does not destroy the file: the
-- CapCut segment is laid with volume=0 instead.
ALTER TABLE "video_renders" ADD COLUMN "audioMuted" BOOLEAN NOT NULL DEFAULT false;
