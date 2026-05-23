-- Fix consistency issues found by audit:
-- 1. A3_SH11 had referenceProfileId=PAX_MOM but workflowRouteKey=conductor_solo
-- 2. Five couple_fight shots still had 2 ref images — should be 1 (SingleWithBack)
-- 3. A5_SH18/22/26 (PAX_HE primary) — prompts had stray "set jaw profile" with
--    no clarity that the woman is not in frame; tightened.

BEGIN;

-- 1. Re-align workflowRouteKey to referenceProfileId everywhere (safety net)
UPDATE shots sh
SET "workflowRouteKey" = CASE
  WHEN sh."referenceProfileId" = 'CONDUCTOR_BASE' THEN 'conductor_solo'
  WHEN sh."referenceProfileId" IS NOT NULL       THEN 'passenger_ip'
  ELSE                                                 'environment'
END
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug='last_shift')
  AND sh."workflowRouteKey" != CASE
    WHEN sh."referenceProfileId" = 'CONDUCTOR_BASE' THEN 'conductor_solo'
    WHEN sh."referenceProfileId" IS NOT NULL       THEN 'passenger_ip'
    ELSE                                                 'environment'
  END;

-- 2. Couple_fight shots that kept PAX_HE — drop second reference (PAX_SHE) from pool
UPDATE shots SET
  "referenceImagePool" = '["last_shift/reference/passengers/passenger_06a_couple_man.png"]'::jsonb
WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift')
  AND "shotCode" IN ('A5_SH18','A5_SH20','A5_SH22','A5_SH26','A5_SH28')
  AND "referenceProfileId" = 'PAX_HE';

-- 3a. A5_SH18 — only him in frame, clear no second face
DO $$
DECLARE
  v_text TEXT := 'medium close-up strict side profile, 33yo man with short dark hair and trimmed beard in navy crew neck sweater, jaw set looking out the compartment window, only him in frame, his partner out of frame, cold daylight through window strobing with birch trees outside, photorealistic cinematic 50mm, natural film grain';
BEGIN
  UPDATE shots SET
    "promptFields" = jsonb_set(
      jsonb_set(
        jsonb_set("promptFields", '{positive}', to_jsonb(v_text)),
        '{positiveSdxl}', to_jsonb(v_text)
      ),
      '{frameDescription}', to_jsonb(v_text)
    )
  WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift')
    AND "shotCode" = 'A5_SH18';
END $$;

-- 3b. A5_SH22 — him with closed book, partner out of frame
DO $$
DECLARE
  v_text TEXT := 'medium shot, 33yo man with short dark hair and trimmed beard in navy crew neck sweater holding an open plain hardcover book on his lap, eyes not moving across the page pretending to read, only him in frame, his partner out of frame, cold compartment daylight, photorealistic cinematic 35mm, shallow depth of field';
BEGIN
  UPDATE shots SET
    "promptFields" = jsonb_set(
      jsonb_set(
        jsonb_set("promptFields", '{positive}', to_jsonb(v_text)),
        '{positiveSdxl}', to_jsonb(v_text)
      ),
      '{frameDescription}', to_jsonb(v_text)
    )
  WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift')
    AND "shotCode" = 'A5_SH22';
END $$;

-- 3c. A5_SH26 — him placing book between them, partner out of frame
DO $$
DECLARE
  v_text TEXT := 'medium shot, 33yo man with short dark hair and trimmed beard in navy crew neck sweater slowly closing the hardcover book with one palm and placing it deliberately on the empty seat space between him and his unseen partner, gesture of offering peace, only him in frame, cold compartment daylight, photorealistic cinematic 35mm';
BEGIN
  UPDATE shots SET
    "promptFields" = jsonb_set(
      jsonb_set(
        jsonb_set("promptFields", '{positive}', to_jsonb(v_text)),
        '{positiveSdxl}', to_jsonb(v_text)
      ),
      '{frameDescription}', to_jsonb(v_text)
    )
  WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift')
    AND "shotCode" = 'A5_SH26';
END $$;

COMMIT;
