-- Temporarily point passenger_ip route to char_lora_sdxl template
-- (scene_single_character_api.json), so the 87 passenger shots render via the
-- existing workflow until a dedicated IP-Adapter FaceID workflow is built.
--
-- Char identity won't be face-locked across vignettes during this window —
-- each passenger's face will drift between their shots. Mitigation: keep the
-- seed fixed within one vignette so within ~10-20 shots the look stays
-- broadly consistent.
--
-- To restore IP-Adapter later: create scene_single_character_ipadapter_api.json
-- and rerun the reverse of this UPDATE pointing back at char_ipadapter.

BEGIN;

UPDATE workflow_route_steps wrs
SET "workflowTemplateId" = (
  SELECT wt.id
  FROM workflow_templates wt
  JOIN projects p ON wt."projectId" = p.id
  WHERE p.slug = 'last_shift'
    AND wt."templateKey" = 'char_lora_sdxl'
)
WHERE wrs."workflowRouteId" = (
  SELECT wr.id
  FROM workflow_routes wr
  JOIN projects p ON wr."projectId" = p.id
  WHERE p.slug = 'last_shift'
    AND wr."routeKey" = 'passenger_ip'
);

COMMIT;
