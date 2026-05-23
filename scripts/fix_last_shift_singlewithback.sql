-- Apply SingleWithBack pattern to all multi-face shots in last_shift.
-- One identity-locked character per shot (LoRA or IP-Adapter), the other
-- described in text as back-turned / in profile / off-camera / silhouette.
-- See feedback_two_lora_disabled.

BEGIN;

-- Helper: rewrite a single shot — replace positive + positiveSdxl + frameDescription
CREATE OR REPLACE FUNCTION pg_temp.rewrite_shot(
  p_shot_code TEXT,
  p_ref_profile TEXT,
  p_ref_pool JSONB,
  p_new_positive TEXT
) RETURNS VOID AS $fn$
BEGIN
  UPDATE shots sh
  SET "referenceProfileId" = p_ref_profile,
      "referenceImagePool" = p_ref_pool,
      "promptFields" = jsonb_set(
        jsonb_set(
          jsonb_set(sh."promptFields", '{positive}',         to_jsonb(p_new_positive)),
          '{positiveSdxl}',     to_jsonb(p_new_positive)
        ),
        '{frameDescription}',   to_jsonb(p_new_positive)
      )
  WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift')
    AND sh."shotCode" = p_shot_code;
END $fn$ LANGUAGE plpgsql;

-- ============================================================================
-- A1_SH11 — couple boarding. Primary = SHE (face). HE behind with suitcases (back of head only).
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A1_SH11',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$wide shot at carriage doorway at autumn dusk, 32yo woman with auburn hair in low ponytail and oversized grey turtleneck stepping up into train carriage looking down at the step, eyes downcast red-rimmed, her face clearly visible in three-quarter view. Behind her a 33yo man in navy crew neck sweater carrying two large suitcases follows close — only the back of his head and shoulders visible to camera, no face shown, his identity unimportant. Visible emotional distance between them, both silent, sodium platform light, photorealistic cinematic 35mm, shallow depth of field, natural film grain$pp$
);

-- ============================================================================
-- A3_SH11 — conductor + mother. Primary = MOTHER (face). Conductor back of jacket at frame edge.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A3_SH11',
  'PAX_MOM',
  '["last_shift/reference/passengers/passenger_02_mother_baby.png"]'::jsonb,
  $pp$medium shot high angle in train vestibule at deep night, 25yo woman with long dark hair loose and cream cardigan sitting on a small folding stool still gently rocking her sleeping infant, her face clearly visible in three-quarter exhausted and tender. At frame edge the back of a train conductor in dark navy uniform jacket and peaked cap is partially visible — her body turned away placing the stool, only the back of her head and the shoulder stripe of her jacket shown, no face. Late night dim amber tungsten light, deep indigo window behind, photorealistic cinematic 35mm, natural film grain$pp$
);

-- ============================================================================
-- A5_SH17 — couple symmetric. Primary = SHE (face). HE profile turned to window.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH17',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$wide symmetrical compartment shot, 32yo woman with auburn hair in low ponytail and oversized grey turtleneck sitting by the compartment door facing forward eyes downcast, her face clearly visible to camera. Across the gap from her a 33yo man in navy sweater sits by the window — his head turned fully toward the window in strict side profile, jaw visible but eyes hidden, only his side and back of head shown to camera, no eye contact, his identity unimportant. Large visible emotional distance between them, cold daylight through window, photorealistic cinematic 35mm, shallow depth of field$pp$
);

-- ============================================================================
-- A5_SH19 — her profile only. Primary = SHE.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH19',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$medium close-up strict left profile, 32yo woman with auburn hair in low ponytail and oversized grey turtleneck, eyes downcast, jaw soft, hands hidden in long sweater sleeves, cold daylight through compartment window catching one cheek, photorealistic cinematic 50mm, natural film grain$pp$
);

-- ============================================================================
-- A5_SH23 — her pouring tea. Primary = SHE.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH23',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$medium close-up, 32yo woman with auburn hair in low ponytail and oversized grey turtleneck pouring tea from a vintage thermos into a glass with slight tremble in her hand, her face partially visible in three-quarter looking down at the task, cold compartment daylight, photorealistic cinematic 50mm, shallow depth of field, natural film grain$pp$
);

-- ============================================================================
-- A5_SH25 — her eyes CU. Primary = SHE.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH25',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$close-up of 32yo woman face, auburn hair in low ponytail and oversized grey turtleneck collar visible, eyes in slow long blink, wet lashes, no makeup, cold compartment daylight, photorealistic cinematic 85mm, natural film grain$pp$
);

-- ============================================================================
-- A5_SH27 — her reaching out. Primary = SHE.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH27',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$medium close-up, 32yo woman with auburn hair in low ponytail and oversized grey turtleneck reaching out a hand with fingertips resting on a closed plain hardcover book on the seat between her and her unseen partner, her face visible in three-quarter looking down at the book, cold compartment daylight, photorealistic cinematic 50mm, shallow depth of field$pp$
);

-- ============================================================================
-- A5_SH29 — her exhale. Primary = SHE.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH29',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$close-up of 32yo woman, auburn hair in low ponytail, first slow exhale of released tension, eyes still downcast but face softening, lips slightly parted, not yet turning toward her partner, cold compartment daylight, photorealistic cinematic 85mm, natural film grain$pp$
);

-- ============================================================================
-- A5_SH30 — joined hands daylight. Primary = SHE. HE in profile turned toward her.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A5_SH30',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$wide symmetrical compartment frame, 32yo woman with auburn hair in low ponytail sitting on her side of the compartment seat, her face visible in three-quarter softening toward camera-side, no longer downcast. Across from her a 33yo man in navy sweater — only his side profile and joined hand on the book between them visible, his face turned toward her not toward camera, only his cheek and the back of his head shown. Their hands joined on a closed plain hardcover book between them, daylight softening, photorealistic cinematic 35mm, natural film grain$pp$
);

-- ============================================================================
-- A7_SH31 — couple upright in crisis. Primary = SHE (face). HE in three-quarter back, hand gripping hers in foreground.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A7_SH31',
  'PAX_SHE',
  '["last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb,
  $pp$close-up handheld, 32yo woman with auburn hair in low ponytail sitting upright in compartment in shared fear, her face visible in three-quarter to camera, lips parted in held breath. Beside her at frame edge a 33yo man in navy sweater — only the back of his head and shoulder visible, his face turned toward her not the lens, his hand visible in the foreground gripping hers tightly. Dark emerald compartment shadows, harsh emergency yellow flashlight, photorealistic cinematic 50mm, natural film grain$pp$
);

-- ============================================================================
-- A7_SH35 — conductor carrying child past passenger doors. Conductor primary,
--           passenger faces in doorways must be hidden / silhouetted / out of focus.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A7_SH35',
  'CONDUCTOR_BASE',
  '["last_shift/reference/conductor_dataset/conductor_front.jpg", "last_shift/reference/conductor_dataset/conductor_34_left.jpg", "last_shift/reference/conductor_dataset/conductor_34_right.jpg", "last_shift/reference/conductor_dataset/conductor_profile_left.jpg", "last_shift/reference/conductor_dataset/conductor_profile_right.jpg"]'::jsonb,
  $pp$medium shot low angle, CONDUCTOR_BASE, female train conductor 38 to 42, dark blonde low bun under navy peaked cap, grey-green tired eyes, thin scar above left eyebrow, dark navy uniform jacket with one shoulder stripe, grey fingerless wool gloves, carrying a feverish 7yo girl wrapped in a compartment blanket through dim train corridor toward vestibule, her face set and determined, child face partly covered by the blanket. Along the corridor passenger silhouettes watching from compartment doorways — their faces deep in shadow or completely out of focus, only outlines and the shape of doorways visible, no readable individual identity. Dark emerald compartment shadows, harsh emergency yellow flashlight, photorealistic cinematic 35mm, shallow depth of field, natural film grain$pp$
);

-- ============================================================================
-- A7_SH34 — OTS conductor lifting child. Clarify conductor from behind, child face partly obscured by being lifted.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A7_SH34',
  'PAX_GIRL',
  '["last_shift/reference/passengers/passenger_08_child_girl.png"]'::jsonb,
  $pp$OTS from behind a train conductor in dark navy uniform jacket and peaked cap — only the back of her head and shoulders visible at frame left — lifting a feverish 7yo girl with brown shoulder length hair and light blue cardigan from the berth into her arms, wrapping her in a compartment blanket, the girl''s small face visible eyes closed flushed, her worn plush owl tucked under her arm. Dark emerald compartment shadows, harsh emergency yellow flashlight from corridor, photorealistic cinematic 35mm, natural film grain$pp$
);

-- ============================================================================
-- A8_SH06 — child handoff. Primary = GIRL. Conductor + medic shown only as hands / shoulder, no faces.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A8_SH06',
  'PAX_GIRL',
  '["last_shift/reference/passengers/passenger_08_child_girl.png"]'::jsonb,
  $pp$medium close-up, 7yo girl with brown shoulder length hair in light blue cardigan, eyes closed feverish but breathing, her face the clear focus, being carefully transferred from conductor''s arms to a paramedic''s arms — only the conductor''s grey-wool-gloved hands and navy jacket sleeve visible at frame left, and the medic''s generic dark jacketed shoulder visible at frame right, neither of their faces in frame. The girl still wrapped in a compartment blanket, clutching her worn plush owl with one button eye missing. Dawn pink soft light over fresh snow, photorealistic cinematic 50mm, shallow depth of field, natural film grain$pp$
);

-- ============================================================================
-- A8_SH25 — new male conductor (different from heroine). Confirm no LoRA, no IP-Adapter — generic.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A8_SH25',
  NULL,
  NULL,
  $pp$medium shot, a different and clearly unrelated 40yo male train conductor in a similar but distinct dark navy uniform jacket and peaked cap, generic Eastern European face, no special identity, closing the train carriage door from the inside, mild puzzlement on his face about why his train was delayed, going through routine motions. Milky pink dawn fog outside through the open doorway behind him, photorealistic cinematic 35mm$pp$
);

-- ============================================================================
-- A8_SH27 — new young female conductor (different from heroine). Generic, no LoRA.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A8_SH27',
  NULL,
  NULL,
  $pp$wide lateral track inside train corridor in morning fog light, a young new female train conductor — clearly different person from the previous heroine, 25yo brunette with smooth ponytail under navy peaked cap, fresh face no fatigue lines, no scar, generic Eastern European features — walking down the corridor with bright posture, just starting her career. Same model of navy uniform jacket as the previous conductor but worn newly. Milky pink dawn light through windows. Photorealistic cinematic 35mm, natural film grain$pp$
);

-- ============================================================================
-- A8_SH30 — new young conductor echoes the gesture. Generic, no LoRA.
-- ============================================================================
SELECT pg_temp.rewrite_shot(
  'A8_SH30',
  NULL,
  NULL,
  $pp$close-up of the young new female train conductor — clearly a different person from the heroine, 25yo brunette in navy uniform jacket and peaked cap, fresh unweathered face, no scar — walking down the corridor toward camera, briefly absent-mindedly touching her own chest where one day a chain might hang but does not yet, an unconscious echo of a gesture she never saw. Slight thoughtful smile. Then frame cuts to black mid-step. Milky pink dawn fog light. Photorealistic cinematic 50mm, shallow depth of field$pp$
);

COMMIT;
