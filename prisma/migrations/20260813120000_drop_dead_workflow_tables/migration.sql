-- Drop the workflow_templates / workflow_routes / workflow_route_steps trio.
--
-- These three tables mirrored the old per-project workflow layout: one row per
-- (project, templateKey) pointing at data/<slug>/comfy/<file>.json. Nothing ever
-- read them at dispatch time — every render path builds its workflow path from
-- the strategy filename (see src/comfy/workflow-path.ts). The only code that
-- touched them was WorkflowService's read/delete CRUD, exposed on endpoints the
-- frontend never called.
--
-- State at drop time: 84 templates, 84 routes, 17 route steps — most routes had
-- no steps at all, so the "route" abstraction was never finished wiring.
-- Data dumped to scratchpad/comfy_backup_20260813/workflow_tables_dump.sql.
--
-- Shot.workflowRouteKey is a plain string column and is NOT touched here: it is
-- still edited from the shot UI.

DROP TABLE IF EXISTS "workflow_route_steps";
DROP TABLE IF EXISTS "workflow_routes";
DROP TABLE IF EXISTS "workflow_templates";
