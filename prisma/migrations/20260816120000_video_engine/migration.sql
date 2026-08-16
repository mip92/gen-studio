-- Which model family renders a project's clips.
--
-- Until now the answer was always Wan 2.2 — it is the project's first and only
-- video engine (`a6a0c72`, 2026-05-13; nothing preceded it, and LTX has never
-- been used here). Adding LTX-2.5 means the renderer can no longer assume one
-- graph shape: Wan's i2v is 18 nodes with a single conditioning node that takes
-- both frames, LTX-2.5 is 39 with two `LTXVAddGuide` passes, a separate audio
-- latent branch and a custom sampler.
--
-- Per PROJECT, like `visualStyle` for stills: one film, one engine, so a montage
-- never mixes two grains. No per-shot override — considered and declined.
--
-- Defaults to 'wan', so every existing project renders exactly what it did.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "videoEngine" TEXT NOT NULL DEFAULT 'wan';

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_videoEngine_check";
ALTER TABLE "projects" ADD  CONSTRAINT "projects_videoEngine_check"
  CHECK ("videoEngine" IN ('wan', 'ltx'));
