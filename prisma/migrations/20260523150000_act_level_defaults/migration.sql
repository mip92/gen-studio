-- Single source of truth for atmosphere fields that currently live per-shot
-- but are act-uniform in practice (audit showed 1 distinct lightingMood per
-- act for 7/8 acts, 2 distinct negative strings for the whole project).
--
-- Adds two nullable columns + backfills with the most-common value per
-- scene/project. Per-shot copies in `Shot.promptFields.lightingMood/negative`
-- remain valid as overrides; the renderer reads them first and falls back to
-- the scene/project value here when absent.

ALTER TABLE "projects" ADD COLUMN "defaultNegative" TEXT;
ALTER TABLE "scenes"   ADD COLUMN "lightingMood"    TEXT;

-- ── Backfill Project.defaultNegative ────────────────────────────────────
-- For each project, pick the negative string that appears in the most shots.
WITH mode_neg AS (
  SELECT
    s."projectId",
    s."promptFields"->>'negative' AS neg,
    COUNT(*)                       AS n
  FROM shots s
  WHERE s."promptFields"->>'negative' IS NOT NULL
    AND length(s."promptFields"->>'negative') > 0
  GROUP BY s."projectId", neg
),
top_neg AS (
  SELECT DISTINCT ON ("projectId") "projectId", neg
  FROM mode_neg
  ORDER BY "projectId", n DESC
)
UPDATE "projects" p
SET "defaultNegative" = t.neg
FROM top_neg t
WHERE p.id = t."projectId";

-- ── Backfill Scene.lightingMood ──────────────────────────────────────────
-- For each scene, pick the lightingMood that appears in the most of its shots.
WITH mode_lm AS (
  SELECT
    s."sceneId",
    s."promptFields"->>'lightingMood' AS lm,
    COUNT(*)                           AS n
  FROM shots s
  WHERE s."promptFields"->>'lightingMood' IS NOT NULL
    AND length(s."promptFields"->>'lightingMood') > 0
  GROUP BY s."sceneId", lm
),
top_lm AS (
  SELECT DISTINCT ON ("sceneId") "sceneId", lm
  FROM mode_lm
  ORDER BY "sceneId", n DESC
)
UPDATE "scenes" sc
SET "lightingMood" = t.lm
FROM top_lm t
WHERE sc.id = t."sceneId";
