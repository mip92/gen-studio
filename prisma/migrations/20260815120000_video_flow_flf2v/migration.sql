-- Two-frame video flow (flf2v / «2 кадра»), switchable per project, act and shot.
--
-- WHY. On the default fast path Wan2.2 gets ONE anchor — the shot's chosenRender
-- pinned to frame 0 — and then 80 frames of freedom at 4 steps, cfg=1.0 (where
-- ComfyUI does not even evaluate the uncond branch, so the negative prompt is
-- mathematically inert). Nothing constrains the far end of the clip, and that is
-- where the drift lives: characters that start walking, objects that grow out of
-- the background, faces that stop being the same face.
--
-- `WanFirstLastFrameToVideo` pins BOTH ends of the latent and masks only the
-- middle, so the trajectory is clamped on both sides. The node ships with this
-- ComfyUI build (comfy_extras/nodes_wan.py) and takes the SAME input names as
-- `WanImageToVideo` plus `end_image`, which is why the renderer swaps one node in
-- the loaded graph instead of carrying a second family of workflow JSONs.
--
-- INHERITANCE. shots."videoFlow" ?? scenes."defaultVideoFlow" ?? projects."defaultVideoFlow".
-- Same idiom as paletteKey / timeOfDay. The project column defaults to 'i2v', so
-- every project that exists today keeps rendering the byte-identical graph it
-- always rendered — this migration changes no output anywhere. Opting in is a
-- deliberate per-project, per-act or per-shot act.
--
-- NOT BACKFILLED, by the same reasoning as the anchor-approval migration: no
-- existing clip is invalidated and no existing shot is flipped. Projects already
-- in flight finish on the flow they started on.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "defaultVideoFlow" TEXT NOT NULL DEFAULT 'i2v';
ALTER TABLE "scenes"   ADD COLUMN IF NOT EXISTS "defaultVideoFlow" TEXT;

ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "videoFlow"          TEXT;
ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "endFramePrompt"     TEXT;
ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "endFrameRenders"    JSONB;
ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "chosenEndFrame"     TEXT;
ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "endFrameApprovedAt" TIMESTAMP(3);

-- Which image this particular render pinned to its last frame. Snapshot at
-- enqueue time (like params.panelShape), so re-approving a different end frame
-- later cannot retroactively change what a queued clip renders.
ALTER TABLE "video_renders" ADD COLUMN IF NOT EXISTS "endImageFilename" TEXT;

-- Only the two values the renderer knows how to dispatch may ever reach it: an
-- unknown flow must fail loudly at write time rather than silently fall back to
-- one-frame rendering somewhere deep in the dispatcher.
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_defaultVideoFlow_check";
ALTER TABLE "projects" ADD  CONSTRAINT "projects_defaultVideoFlow_check"
  CHECK ("defaultVideoFlow" IN ('i2v', 'flf2v'));

ALTER TABLE "scenes" DROP CONSTRAINT IF EXISTS "scenes_defaultVideoFlow_check";
ALTER TABLE "scenes" ADD  CONSTRAINT "scenes_defaultVideoFlow_check"
  CHECK ("defaultVideoFlow" IS NULL OR "defaultVideoFlow" IN ('i2v', 'flf2v'));

ALTER TABLE "shots" DROP CONSTRAINT IF EXISTS "shots_videoFlow_check";
ALTER TABLE "shots" ADD  CONSTRAINT "shots_videoFlow_check"
  CHECK ("videoFlow" IS NULL OR "videoFlow" IN ('i2v', 'flf2v'));

-- The /actions gate asks "which shots are on flf2v and still need an end frame".
CREATE INDEX IF NOT EXISTS "shots_projectId_videoFlow_idx" ON "shots" ("projectId", "videoFlow");

-- The Qwen-Image-Edit-2511 pass that produces an end frame. Its own table rather
-- than a flavour of scene_render_jobs: it edits an existing image instead of
-- generating one, and it snapshots the start frame + instruction it ran with so
-- a later edit of the shot cannot rewrite what a finished job did.
CREATE TABLE IF NOT EXISTS "end_frame_jobs" (
  "id"                  TEXT         NOT NULL,
  "shotId"              TEXT         NOT NULL,
  "sourceImageFilename" TEXT         NOT NULL,
  "instruction"         TEXT         NOT NULL,
  "status"              TEXT         NOT NULL,
  "comfyPromptId"       TEXT,
  "params"              JSONB,
  "outputFilename"      TEXT,
  "errorMessage"        TEXT,
  "queuedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt"           TIMESTAMP(3),
  "completedAt"         TIMESTAMP(3),
  CONSTRAINT "end_frame_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "end_frame_jobs_shotId_idx"          ON "end_frame_jobs" ("shotId");
CREATE INDEX IF NOT EXISTS "end_frame_jobs_status_queuedAt_idx" ON "end_frame_jobs" ("status", "queuedAt");

ALTER TABLE "end_frame_jobs" DROP CONSTRAINT IF EXISTS "end_frame_jobs_shotId_fkey";
ALTER TABLE "end_frame_jobs" ADD  CONSTRAINT "end_frame_jobs_shotId_fkey"
  FOREIGN KEY ("shotId") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
