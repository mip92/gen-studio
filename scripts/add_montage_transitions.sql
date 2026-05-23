-- Add 3 montage transition shots per classical theory:
--   A3_SH13A — spatial bridge: mother (plackart) → bride (SV compartment)
--   A5_SH16A — corridor bridge: veteran (compartment) → couple (compartment)
--   A6_SH19  — extended emotional beat after midpoint recognition (breathing
--              room before A7 crisis hits)
--
-- Theory references:
--   - Bridging cuts (Hollywood continuity) — establish spatial transit
--   - Eyeline match / corridor POV — Bresson + Tarkovsky
--   - Breathing beat (Antonioni) — hold emotion before next act
--
-- All additions follow size ladder (smooth ±1-2 step transitions) and
-- maintain conductor's wardrobe + props continuity (chain visible since A6).

BEGIN;

DO $$
DECLARE
  v_proj    TEXT;
  v_a3      TEXT;
  v_a5      TEXT;
  v_a6      TEXT;
  v_ch_cond TEXT;
  v_pr_cond TEXT;
  v_sh_a3   TEXT := gen_random_uuid()::text;
  v_sh_a5   TEXT := gen_random_uuid()::text;
  v_sh_a6   TEXT := gen_random_uuid()::text;
  v_neg     TEXT := 'different identity, deformed face, deformed hands, extra fingers, missing fingers, watermark, signature, text overlay, station name signs with readable text, modern brand logos, low quality, blur, motion blur, plastic skin, oversmooth, cartoon, anime, cgi, duplicate face, two heads, weapon, blood, wound, revealing clothing';
BEGIN
  SELECT id INTO v_proj FROM projects WHERE slug='last_shift';
  SELECT id INTO v_a3 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_03_deep_night';
  SELECT id INTO v_a5 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_05_daylight';
  SELECT id INTO v_a6 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_06_midpoint';
  SELECT id INTO v_ch_cond FROM characters WHERE "projectId"=v_proj AND code='CONDUCTOR';
  SELECT cp.id INTO v_pr_cond FROM character_profiles cp WHERE cp."characterId"=v_ch_cond AND cp."profileCode"='CONDUCTOR_BASE';

  -- A3_SH13A — spatial bridge between vignettes (mother → bride)
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a3, v_proj, v_a3, 'A3_SH13A',
    jsonb_build_object(
      'positive', 'wide shot lateral tracking, CONDUCTOR_BASE, female train conductor 38 to 42, dark blonde low bun under navy peaked cap, grey-green tired eyes, small mole at left jawline, dark navy uniform jacket with one shoulder stripe and brass buttons, grey fingerless wool gloves, walking through narrow rubber-concertina vestibule connecting two train carriages at deep night, hand brushing the wall, single sodium-yellow utility lamp overhead, slight visible breath in cold air, ahead at the end of a darker corridor a single compartment door is slightly ajar with the edge of a translucent white garment bag visible through the crack, sense of geographic transit from plackart to first-class section, photorealistic cinematic 35mm, shallow depth of field, natural film grain',
      'positiveSdxl', 'wide shot lateral tracking, CONDUCTOR_BASE walking through narrow rubber-concertina train vestibule between two carriages at deep night, single sodium utility lamp, darker corridor ahead, slightly ajar SV compartment door at end with edge of white garment bag visible inside, late night dim amber, indigo black windows, single reading lamp pools of light, photorealistic cinematic 35mm',
      'positiveTemplate', 'wide shot lateral tracking, {CONDUCTOR} walking through narrow rubber-concertina vestibule between two train carriages at deep night, single sodium utility lamp, slightly ajar SV door ahead with edge of white garment bag visible inside, {LIGHT_A3}, {STYLE}',
      'positiveEnvironment', 'narrow rubber-concertina vestibule connecting two train carriages at deep night, ribbed accordion walls, metal floor plate, single sodium-yellow utility lamp overhead, cooler air pocket, dim corridor beyond, ambiguous era post-Soviet long-distance train',
      'positiveCharacterLocks', 'CONDUCTOR_BASE LoRA identity locks: female 38-42, dark blonde low bun under navy peaked cap, grey-green tired eyes, small mole at left jawline, dark navy uniform jacket with one shoulder stripe and brass buttons, white shirt collar, grey fingerless wool gloves; documentary skin texture, no makeup, no jewelry on hands; trigger token CONDUCTOR_BASE active; single-pass SDXL, NO hires-fix',
      'lightingMood', 'late night dim amber, indigo black windows, single reading lamp pools of light, additional sodium-yellow utility vestibule lamp',
      'narrativeBeat', 'rising',
      'storyFunction', 'transition',
      'camera', jsonb_build_object('framing', 'WS', 'angle', 'eye', 'movement', 'track_lateral'),
      'location', jsonb_build_object('label', 'Поезд / интерьер', 'palette', 'A3_amber_indigo', 'timeOfDay', 'peak_night_day1', 'interiorExterior', 'interior'),
      'continuity', jsonb_build_object('withPrevious', 'Match A3_SH13 BACK retreat from mother vignette — conductor moving forward through the train; carries the previous beat outward through space', 'withNext', 'Establishes the spatial geography of the SV section before A3_SH14 wide of the bride; the doorway crack with garment bag visible foreshadows the bride vignette'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Bridge between mother and bride vignettes — viewer follows conductor across geography', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize rubber-concertina vestibule architecture, sodium utility lamp warm pool, slight cold air breath, corridor depth perspective leading to garment-bag glimpse; lighting mood A3 with utility lamp accent; expand with sensory specifics before final render',
      'frameDescription', 'wide shot lateral tracking, conductor walking through narrow vestibule between train carriages, single sodium utility lamp overhead, slightly ajar SV door at end with garment bag glimpsed inside',
      'isBroll', false,
      'isIconic', false,
      'negative', v_neg
    ),
    'conductor_solo', 'CONDUCTOR_BASE', '["last_shift/reference/conductor_dataset/conductor_front.jpg", "last_shift/reference/conductor_dataset/conductor_34_left.jpg", "last_shift/reference/conductor_dataset/conductor_34_right.jpg", "last_shift/reference/conductor_dataset/conductor_profile_left.jpg", "last_shift/reference/conductor_dataset/conductor_profile_right.jpg"]'::jsonb,
    'Между вагонами — три двери и десять метров. Десять метров — это другой мир.',
    'WS', 'eye', 'track_lateral',
    'rising', 'transition', 'conductor',
    FALSE, FALSE, 'peak_night_day1', 'A3_amber_indigo',
    NOW(), NOW()
  );

  -- A5_SH16A — corridor bridge between vignettes (veteran → couple)
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a5, v_proj, v_a5, 'A5_SH16A',
    jsonb_build_object(
      'positive', 'medium shot lateral tracking, CONDUCTOR_BASE, female train conductor 38 to 42, dark blonde low bun under navy peaked cap, grey-green tired eyes, small mole at left jawline, dark navy uniform jacket with one shoulder stripe and brass buttons, walking down the train corridor in cold morning daylight with strobing birch shadows across the floor, passing several closed compartment doors, her head turning very slightly to listen toward one door then to another, neutral attentive expression, no eye contact with camera, photorealistic cinematic 35mm full-frame, shallow depth of field, natural film grain',
      'positiveSdxl', 'medium shot lateral tracking, CONDUCTOR_BASE walking down train corridor in cold morning daylight with strobing birch shadows across floor, passing closed compartment doors, head turning slightly to listen, neutral attentive expression, cold daylight through window, intermittent strobing birch shadows, high key overcast, photorealistic cinematic 35mm',
      'positiveTemplate', 'medium shot lateral tracking, {CONDUCTOR} walking down train corridor with strobing birch shadows across floor, passing closed compartment doors, head turning slightly to listen, {LIGHT_A5}, {STYLE}',
      'positiveEnvironment', 'long-distance Eastern European train corridor in cold morning daylight, polished linoleum floor with strobing birch tree shadows crossing it from windows, multiple closed wood-paneled compartment doors with simple metal handles, no readable text, no logos, ambiguous era',
      'positiveCharacterLocks', 'CONDUCTOR_BASE LoRA identity locks: female 38-42, dark blonde low bun under navy peaked cap, grey-green tired eyes, small mole at left jawline, dark navy uniform jacket with one shoulder stripe and brass buttons, white shirt collar, grey fingerless wool gloves; documentary skin texture, no makeup; trigger token CONDUCTOR_BASE active; single-pass SDXL, NO hires-fix',
      'lightingMood', 'cold daylight through window, intermittent strobing birch shadows, high key overcast',
      'narrativeBeat', 'rising',
      'storyFunction', 'transition',
      'camera', jsonb_build_object('framing', 'MS', 'angle', 'eye', 'movement', 'track_lateral'),
      'location', jsonb_build_object('label', 'Поезд / интерьер', 'palette', 'A5_cold_birch', 'timeOfDay', 'day_day2', 'interiorExterior', 'interior'),
      'continuity', jsonb_build_object('withPrevious', 'Match A5_SH16 BACK retreat from veteran vignette — conductor in motion through corridor; strobing birch shadows continue from preceding interior shots', 'withNext', 'Carries her geographically to the couple compartment for A5_SH17 wide; her attentive head-turn establishes that she sense the difference between compartments (warm exchange vs cold silence)'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Bridge between veteran and couple vignettes — also tonal pivot from warm pie-sharing to cold three-year silence', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize medium framing of conductor in transit, strobing birch shadow pattern across her uniform, attentive head-turn micro-expression, corridor depth; lighting A5_cold_birch; expand with sensory specifics (silent corridor with distant compartment sounds) before final render',
      'frameDescription', 'medium shot lateral tracking, conductor walking down train corridor in cold morning daylight, strobing birch shadows, passing closed compartment doors, attentive head-turn',
      'isBroll', false,
      'isIconic', false,
      'negative', v_neg
    ),
    'conductor_solo', 'CONDUCTOR_BASE', '["last_shift/reference/conductor_dataset/conductor_front.jpg", "last_shift/reference/conductor_dataset/conductor_34_left.jpg", "last_shift/reference/conductor_dataset/conductor_34_right.jpg", "last_shift/reference/conductor_dataset/conductor_profile_left.jpg", "last_shift/reference/conductor_dataset/conductor_profile_right.jpg"]'::jsonb,
    'Двери одинаковые. За одной — голос. За другой — три года молчания.',
    'MS', 'eye', 'track_lateral',
    'rising', 'transition', 'conductor',
    FALSE, FALSE, 'day_day2', 'A5_cold_birch',
    NOW(), NOW()
  );

  -- A6_SH19 — extended emotional beat after midpoint recognition (breathing room)
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a6, v_proj, v_a6, 'A6_SH19',
    jsonb_build_object(
      'positive', 'close-up of CONDUCTOR_BASE face in train corridor a few steps away from the child compartment, in late afternoon golden hour light streaming sideways through windows, her hand still at her chest where the chain is now visible just under her uniform collar, eyes wide and slightly wet but not crying, lips slightly parted in a held breath of recognition and pain, processing the realization that the child has her own dead daughter''s plush owl, no movement, photorealistic cinematic 50mm portrait lens, shallow depth of field, natural film grain',
      'positiveSdxl', 'close-up CONDUCTOR_BASE face in train corridor near child compartment, late afternoon golden hour light, hand still at chest where chain is visible, eyes wide and slightly wet but not crying, lips slightly parted held breath, late afternoon golden warmth slanting through window, long corridor shadows, photorealistic cinematic 50mm',
      'positiveTemplate', 'close-up of {CONDUCTOR} face in train corridor near child compartment, hand still at chest where chain visible, eyes wide and slightly wet but not crying, lips slightly parted in held breath, {LIGHT_A6}, {STYLE}',
      'positiveEnvironment', 'train corridor in late afternoon golden hour, long slanting warm light through compartment windows, dust motes visible in beams, soft warm tone, child compartment door slightly visible at frame edge, no readable text, ambiguous era',
      'positiveCharacterLocks', 'CONDUCTOR_BASE LoRA identity locks: female 38-42, dark blonde low bun under navy peaked cap, grey-green tired eyes, small mole at left jawline, dark navy uniform jacket with one shoulder stripe and brass buttons, thin gold chain JUST VISIBLE under shirt collar (revealed for the first time in this beat), grey fingerless wool gloves; emotional micro-expression of restrained recognition; trigger token CONDUCTOR_BASE active; single-pass SDXL, NO hires-fix',
      'lightingMood', 'late afternoon golden warmth slanting through window, long corridor shadows',
      'narrativeBeat', 'midpoint_twist',
      'storyFunction', 'character',
      'camera', jsonb_build_object('framing', 'CU', 'angle', 'eye', 'movement', 'static'),
      'location', jsonb_build_object('label', 'Поезд / интерьер', 'palette', 'A6_golden_warm', 'timeOfDay', 'late_day_day2', 'interiorExterior', 'interior'),
      'continuity', jsonb_build_object('withPrevious', 'A6_SH18 BACK retreat from child compartment — now we see her FACE after the BACK shot, completing the emotional reveal; chain reveal from SH17 is held visible here', 'withNext', 'Provides breathing room before A7_SH01 crisis cut to snow storm; lets the recognition land before the storm arrives'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Antonioni-style breathing beat — extends emotional moment before crisis act break', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize close-up restrained emotional micro-expression, chain just visible at collar, golden hour light catching one cheek, no tears falling but eyes wet, held silence; lighting A6_golden_warm; expand with sensory specifics before final render',
      'frameDescription', 'close-up conductor face in corridor near child compartment, late afternoon golden light, hand at chest near chain, eyes wide and wet but not crying, held breath of recognition',
      'isBroll', false,
      'isIconic', false,
      'negative', v_neg
    ),
    'conductor_solo', 'CONDUCTOR_BASE', '["last_shift/reference/conductor_dataset/conductor_front.jpg", "last_shift/reference/conductor_dataset/conductor_34_left.jpg", "last_shift/reference/conductor_dataset/conductor_34_right.jpg", "last_shift/reference/conductor_dataset/conductor_profile_left.jpg", "last_shift/reference/conductor_dataset/conductor_profile_right.jpg"]'::jsonb,
    'Семь лет я никому не показывала это кольцо. Никому. А оно всё это время было — между мной и кителем.',
    'CU', 'eye', 'static',
    'midpoint_twist', 'character', 'conductor',
    FALSE, FALSE, 'late_day_day2', 'A6_golden_warm',
    NOW(), NOW()
  );

  -- shot_participants (all 3 are conductor primary)
  INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label) VALUES
    (gen_random_uuid()::text, v_sh_a3, v_ch_cond, v_pr_cond, 'Conductor'),
    (gen_random_uuid()::text, v_sh_a5, v_ch_cond, v_pr_cond, 'Conductor'),
    (gen_random_uuid()::text, v_sh_a6, v_ch_cond, v_pr_cond, 'Conductor');

END $$;

COMMIT;
