-- bio_plus workflow templates + routes registration (graphic-novel style).
-- FIXED 2026-05-28 against actual Prisma schema (was draft against assumed schema).
-- Real columns:
--   workflow_templates: id, "projectId" NOT NULL, "templateKey", "filePath", description, "createdAt"
--     unique on ("projectId", "templateKey"). Add "visualStyle" via migration.
--   workflow_routes: id, "projectId", "routeKey", "createdAt"
--     unique on ("projectId", "routeKey"). NO displayName column.
--   workflow_route_steps: id, "workflowRouteId" (not routeId), "stepOrder", "workflowTemplateId" (not templateId)
--
-- Run AFTER:
--   1. migrations/20260528_add_visual_style.sql (adds visualStyle column to projects + workflow_templates)
--   2. seed_visual_styles.sql (registers photoreal_cinematic + graphic_novel_cell_shaded)
--   3. run_seed_bio_plus.sql (creates bio_plus project + 200 shots)
--
-- Idempotent: ON CONFLICT updates rows.

BEGIN;

-- 1. Update bio_plus project to graphic_novel_cell_shaded -------------------
UPDATE projects SET "visualStyle" = 'graphic_novel_cell_shaded'
  WHERE slug = 'bio_plus';

-- 2. Register graphic-novel workflow templates for bio_plus only ------------
DO $$
DECLARE
  v_proj_id      TEXT;
  v_tmpl_char_id TEXT := gen_random_uuid()::text;
  v_tmpl_env_id  TEXT := gen_random_uuid()::text;
  v_route_char_id TEXT := gen_random_uuid()::text;
  v_route_env_id  TEXT := gen_random_uuid()::text;
BEGIN
  SELECT id INTO v_proj_id FROM projects WHERE slug = 'bio_plus';
  IF v_proj_id IS NULL THEN
    RAISE EXCEPTION 'bio_plus project not found — run run_seed_bio_plus.sql first';
  END IF;

  -- Templates
  INSERT INTO workflow_templates (id, "projectId", "templateKey", "filePath", description, "visualStyle", "createdAt")
  VALUES
    (v_tmpl_char_id, v_proj_id, 'char_ip_graphic_novel',
     'bio_plus/comfy/scene_single_character_graphic_novel_api.json',
     'Character with IP-Adapter at 0.4 + comic style-LoRA. Cell-shaded graphic-novel.',
     'graphic_novel_cell_shaded', NOW()),
    (v_tmpl_env_id, v_proj_id, 'environment_graphic_novel',
     'bio_plus/comfy/scene_environment_graphic_novel_api.json',
     'Environment / B-roll with comic style-LoRA. Cell-shaded graphic-novel, no character.',
     'graphic_novel_cell_shaded', NOW())
  ON CONFLICT ("projectId", "templateKey") DO UPDATE SET
    "filePath" = EXCLUDED."filePath",
    description = EXCLUDED.description,
    "visualStyle" = EXCLUDED."visualStyle";

  -- Resolve template IDs (in case ON CONFLICT did UPDATE rather than INSERT)
  SELECT id INTO v_tmpl_char_id FROM workflow_templates WHERE "projectId" = v_proj_id AND "templateKey" = 'char_ip_graphic_novel';
  SELECT id INTO v_tmpl_env_id  FROM workflow_templates WHERE "projectId" = v_proj_id AND "templateKey" = 'environment_graphic_novel';

  -- Routes
  INSERT INTO workflow_routes (id, "projectId", "routeKey", "createdAt")
  VALUES
    (v_route_char_id, v_proj_id, 'bio_plus_character_ip', NOW()),
    (v_route_env_id,  v_proj_id, 'bio_plus_environment',  NOW())
  ON CONFLICT ("projectId", "routeKey") DO NOTHING;

  -- Resolve route IDs
  SELECT id INTO v_route_char_id FROM workflow_routes WHERE "projectId" = v_proj_id AND "routeKey" = 'bio_plus_character_ip';
  SELECT id INTO v_route_env_id  FROM workflow_routes WHERE "projectId" = v_proj_id AND "routeKey" = 'bio_plus_environment';

  -- Route steps (clear and reseed — single template per route, linear)
  DELETE FROM workflow_route_steps WHERE "workflowRouteId" IN (v_route_char_id, v_route_env_id);

  INSERT INTO workflow_route_steps (id, "workflowRouteId", "stepOrder", "workflowTemplateId") VALUES
    (gen_random_uuid()::text, v_route_char_id, 0, v_tmpl_char_id),
    (gen_random_uuid()::text, v_route_env_id,  0, v_tmpl_env_id);

  RAISE NOTICE 'bio_plus workflow templates + routes registered (graphic_novel_cell_shaded)';
END $$;

-- 3. Assign workflow routes to bio_plus shots --------------------------------
UPDATE shots SET "workflowRouteKey" =
  CASE WHEN "vignetteSlug" IS NULL THEN 'bio_plus_environment'
       ELSE 'bio_plus_character_ip' END
WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus');

-- 4. Verify ------------------------------------------------------------------
DO $$
DECLARE
  v_total INT;
  v_char  INT;
  v_env   INT;
  v_tmpl  INT;
  v_route INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM shots WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus');
  SELECT COUNT(*) INTO v_char  FROM shots WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus') AND "workflowRouteKey" = 'bio_plus_character_ip';
  SELECT COUNT(*) INTO v_env   FROM shots WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus') AND "workflowRouteKey" = 'bio_plus_environment';
  SELECT COUNT(*) INTO v_tmpl  FROM workflow_templates WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus');
  SELECT COUNT(*) INTO v_route FROM workflow_routes WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus');
  RAISE NOTICE 'bio_plus routing: total=%, character_ip=%, environment=%, templates=%, routes=%', v_total, v_char, v_env, v_tmpl, v_route;
END $$;

COMMIT;
