-- Anchor render jobs for PROPS.
--
-- Separate from anchor_render_jobs on purpose: that table is keyed by
-- CharacterProfile and carries the portrait + vision-QC lifecycle, none of which
-- applies to an object (user 2026-08-01 «предметы это не люди, они отдельно»).
--
-- NOTE: the `props` table itself is NOT created here. It already exists — it was
-- created by hand outside the migration system, which is why it was missing from
-- schema.prisma until today. This migration only adds the job table; the Prop
-- model added to the schema in the same change maps onto the live DDL as-is.
CREATE TABLE IF NOT EXISTS "prop_anchor_jobs" (
    "id"            TEXT NOT NULL,
    "propId"        TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'pending',
    "pipeline"      TEXT,
    "comfyPromptId" TEXT,
    "outputPath"    TEXT,
    "errorMessage"  TEXT,
    "queuedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"     TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),
    CONSTRAINT "prop_anchor_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prop_anchor_jobs_propId_idx"          ON "prop_anchor_jobs"("propId");
CREATE INDEX IF NOT EXISTS "prop_anchor_jobs_status_queuedAt_idx" ON "prop_anchor_jobs"("status", "queuedAt");

ALTER TABLE "prop_anchor_jobs"
  DROP CONSTRAINT IF EXISTS "prop_anchor_jobs_propId_fkey";
ALTER TABLE "prop_anchor_jobs"
  ADD CONSTRAINT "prop_anchor_jobs_propId_fkey"
  FOREIGN KEY ("propId") REFERENCES "props"("id") ON DELETE CASCADE ON UPDATE CASCADE;
