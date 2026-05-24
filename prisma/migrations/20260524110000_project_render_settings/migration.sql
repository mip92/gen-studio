-- Phase: data-driven render settings. All prompt/parameter content moves out
-- of TS hardcode and workflow JSON templates into Project columns + per-shot
-- promptFields overrides. See gen-studio/AGENTS.md §1, §6.2, §6.3.

ALTER TABLE "projects"
  ADD COLUMN "defaultVideoNegative"      TEXT,
  ADD COLUMN "defaultMotionPrompt"       TEXT,
  ADD COLUMN "defaultStaticMotionPrompt" TEXT,
  ADD COLUMN "defaultRenderParams"       JSONB,
  ADD COLUMN "defaultVideoParams"        JSONB;
