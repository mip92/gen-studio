-- Add 4 establishing shots for orientation at act openings:
--   A2_SH00  — EWS train at early night (before A2 corridor)
--   A4_SH01A — WS compartment with businessman (between A4 EWS exterior and MS businessman)
--   A5_SH00  — EWS birch forest aerial (before A5 corridor)
--   A6_SH00  — EWS train at golden hour (before A6 musician vestibule)
--
-- No API endpoint exists for bulk shot creation — documented SQL exception
-- per feedback_use_api_not_direct_db.

BEGIN;

DO $$
DECLARE
  v_proj    TEXT;
  v_a2      TEXT;
  v_a4      TEXT;
  v_a5      TEXT;
  v_a6      TEXT;
  v_ch_biz  TEXT;
  v_pr_biz  TEXT;
  v_sh_a2   TEXT := gen_random_uuid()::text;
  v_sh_a4   TEXT := gen_random_uuid()::text;
  v_sh_a5   TEXT := gen_random_uuid()::text;
  v_sh_a6   TEXT := gen_random_uuid()::text;
  v_neg     TEXT := 'different identity, deformed face, deformed hands, extra fingers, missing fingers, watermark, signature, text overlay, station name signs with readable text, modern brand logos, low quality, blur, motion blur, plastic skin, oversmooth, cartoon, anime, cgi, duplicate face, two heads, weapon, blood, wound, revealing clothing';
BEGIN
  SELECT id INTO v_proj FROM projects WHERE slug='last_shift';
  SELECT id INTO v_a2 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_02_settling';
  SELECT id INTO v_a4 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_04_pre_dawn';
  SELECT id INTO v_a5 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_05_daylight';
  SELECT id INTO v_a6 FROM scenes WHERE "projectId"=v_proj AND "sceneKey"='act_06_midpoint';
  SELECT id INTO v_ch_biz FROM characters WHERE "projectId"=v_proj AND code='PAX_BIZ';
  SELECT cp.id INTO v_pr_biz FROM character_profiles cp WHERE cp."characterId"=v_ch_biz AND cp."profileCode"='PAX_BIZ';

  -- A2_SH00 — EWS train at early night, establishes A2 location
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a2, v_proj, v_a2, 'A2_SH00',
    jsonb_build_object(
      'positive', 'aerial wide drone shot, single passenger train traveling slowly through dark nameless countryside at early night, deep indigo sky with veiled moon, single distant farm window glowing pale yellow on the horizon, no city anywhere, no logos, no readable text on signs, train carriage windows showing warm amber pinpricks of light inside, sense of mechanical solitude across a wide empty plain, photorealistic cinematic 35mm full-frame, anamorphic widescreen, natural film grain',
      'positiveSdxl', 'aerial wide drone shot, single passenger train traveling slowly through dark nameless countryside at early night, deep indigo sky with veiled moon, single distant farm window glowing pale yellow on the horizon, no city anywhere, no logos, train carriage windows showing warm amber pinpricks of light inside, photorealistic cinematic 35mm',
      'positiveTemplate', 'aerial wide drone shot, single passenger train traveling slowly through dark nameless countryside at early night, deep indigo sky, single distant farm window, {LIGHT_A2}, {STYLE}',
      'positiveEnvironment', 'Nameless rural train route at early night, single passenger train moving across wide empty post-Soviet plain, deep indigo sky above, veiled moon barely visible, single distant farm light far on the horizon, no city anywhere, no roads in view, isolation atmosphere, generic landscape no readable text, detail and atmosphere shot without people',
      'positiveCharacterLocks', 'N/A — environment / B-roll establishing shot, no character identity to lock, single-pass Flux env workflow, focus on composition and atmosphere',
      'lightingMood', 'warm tungsten corridor lamps, deep indigo night windows, soft falloff, sleep silence',
      'narrativeBeat', 'rising',
      'storyFunction', 'atmosphere',
      'camera', jsonb_build_object('framing', 'EWS', 'angle', 'high', 'movement', 'static'),
      'location', jsonb_build_object('label', 'Поезд / экстерьер или объект', 'palette', 'A2_amber_indigo', 'timeOfDay', 'early_night_day1', 'interiorExterior', 'exterior_or_mixed'),
      'continuity', jsonb_build_object('withPrevious', 'Match palette A2_amber_indigo and timeOfDay early_night_day1 with A1_SH22 sunset_day1 exterior — visual transition from autumn dusk to first night', 'withNext', 'Establishes train-at-night context before A2_SH01 cuts to interior corridor — provides the geography orientation'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Establishing shot added to orient viewer in A2 opening', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize wide aerial composition, scale of solitude, single distant light contrast; lighting mood A2_amber_indigo; expand with sensory specifics (cold air, low rail rumble) before final render',
      'frameDescription', 'aerial wide drone shot, single passenger train traveling slowly through dark nameless countryside at early night, deep indigo sky, single distant farm window, melancholy tranquility',
      'isBroll', true,
      'isIconic', false,
      'negative', v_neg
    ),
    'environment', NULL, NULL,
    'Двенадцать часов в пути. Глухая равнина. Поезд один. И я.',
    'EWS', 'high', 'static',
    'rising', 'atmosphere', NULL,
    TRUE, FALSE, 'early_night_day1', 'A2_amber_indigo',
    NOW(), NOW()
  );

  -- A4_SH01A — WS compartment establishing businessman's place
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a4, v_proj, v_a4, 'A4_SH01A',
    jsonb_build_object(
      'positive', 'wide shot of standard four-berth Eastern European train compartment interior at pre-dawn hour, pale cool blue light edging through narrow window, two upper berths visible with one occupied by a sleeping figure under a blanket (only shape visible, no face), 45yo man with salt-and-pepper receding hair and rumpled white dress shirt loosened dark grey tie hunched in the lower berth corner with an open laptop on his knees, glasses pushed up on his head, simple gold wedding ring visible on his left hand, suitcase on overhead rack, empty seat across from him, cold half-finished tea glass on small folding table, soft warm reading lamp pool on his face, photorealistic cinematic 35mm, shallow depth of field, natural film grain',
      'positiveSdxl', 'wide shot of standard four-berth train compartment at pre-dawn, two upper berths one occupied, 45yo man with salt-pepper receding hair, rumpled white shirt loose dark tie, glasses on head, gold wedding ring, hunched in lower berth corner with open laptop, suitcase on rack, empty seat across, cold tea glass, warm reading lamp, photorealistic cinematic 35mm',
      'positiveTemplate', 'wide shot of standard four-berth train compartment interior at pre-dawn hour, two upper berths one occupied by sleeping figure, {PAX_BIZ} hunched in lower berth corner with open laptop, suitcase on overhead rack, empty seat across, cold tea glass on table, {LIGHT_A4}, {STYLE}',
      'positiveEnvironment', 'standard four-berth Eastern European train compartment at pre-dawn, two pairs of berths (upper and lower) on each side, narrow window with pre-dawn cool blue light just edging in, small folding table between berths, overhead rack with suitcase, single reading lamp warm pool, no logos or readable text on belongings, enclosed intimate space',
      'positiveCharacterLocks', 'PAX_BIZ identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_04_businessman.png — 45yo man, rumpled white shirt loose dark tie, glasses pushed up on head, salt-pepper receding hair, defeated mild expression; no LoRA; identity weight ~0.8, no second IP-Adapter; sleeping figure in upper berth is silhouette only, face not visible, no identity needed',
      'lightingMood', 'pre-dawn cool blue starting to warm, weary tungsten, first hint of sky',
      'narrativeBeat', 'rising',
      'storyFunction', 'character',
      'camera', jsonb_build_object('framing', 'WS', 'angle', 'eye', 'movement', 'static'),
      'location', jsonb_build_object('label', 'Поезд / интерьер', 'palette', 'A4_cool_blue', 'timeOfDay', 'predawn_day2', 'interiorExterior', 'interior'),
      'continuity', jsonb_build_object('withPrevious', 'Match A4_SH01 EWS pre-dawn exterior palette — cool blue arriving inside the compartment', 'withNext', 'Establishes the compartment geography for the businessman vignette before A4_SH02 MS closeup'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Orientation shot — places businessman in his compartment context before MS insert', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', 'last_shift/reference/passengers/passenger_04_businessman.png'),
      'captionGenerator', 'Caption-expansion focus: emphasize wide compartment composition with character placed in corner, sleeping companion silhouette in upper berth, intimate scale of nightlong vigil; lighting mood A4_cool_blue with single warm reading lamp; expand with sensory specifics before final render',
      'frameDescription', 'wide shot four-berth train compartment at pre-dawn, businessman alone hunched in corner with laptop, sleeping figure in upper berth, intimate enclosed space',
      'isBroll', false,
      'isIconic', false,
      'negative', v_neg
    ),
    'passenger_ip', 'PAX_BIZ', '["last_shift/reference/passengers/passenger_04_businessman.png"]'::jsonb,
    'Двое спят. Один — нет. У этого одного есть ноутбук — и это, по его мнению, важная разница.',
    'WS', 'eye', 'static',
    'rising', 'character', 'businessman',
    FALSE, FALSE, 'predawn_day2', 'A4_cool_blue',
    NOW(), NOW()
  );

  -- A5_SH00 — EWS birch forest aerial, establishes A5 morning
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a5, v_proj, v_a5, 'A5_SH00',
    jsonb_build_object(
      'positive', 'aerial wide drone shot lateral tracking alongside single passenger train weaving through dense birch forest in cold morning daylight, white-and-black birch trunks creating natural strobe pattern, no city in view, no roads, no logos, generic post-Soviet northern landscape, train carriage windows reflecting the trees, peaceful steady motion, photorealistic cinematic 35mm full-frame, anamorphic widescreen, natural film grain',
      'positiveSdxl', 'aerial wide drone shot lateral tracking single passenger train through dense birch forest in cold morning daylight, white-and-black trunks strobing, no city, no roads, post-Soviet northern landscape, photorealistic cinematic 35mm',
      'positiveTemplate', 'aerial wide drone shot lateral tracking single passenger train through dense birch forest, {LIGHT_A5}, {STYLE}',
      'positiveEnvironment', 'dense birch forest in cold morning daylight, endless white-and-black trunks, no city in view, no roads, generic post-Soviet northern landscape, train weaving through, peaceful',
      'positiveCharacterLocks', 'N/A — environment / B-roll establishing shot, no character identity to lock',
      'lightingMood', 'cold daylight through window, intermittent strobing birch shadows, high key overcast',
      'narrativeBeat', 'rising',
      'storyFunction', 'atmosphere',
      'camera', jsonb_build_object('framing', 'EWS', 'angle', 'high', 'movement', 'track_lateral'),
      'location', jsonb_build_object('label', 'Поезд / экстерьер или объект', 'palette', 'A5_cold_birch', 'timeOfDay', 'day_day2', 'interiorExterior', 'exterior_or_mixed'),
      'continuity', jsonb_build_object('withPrevious', 'Transition from A4 pre-dawn (last shot was conductor at vestibule doorway facing brightening landscape) to full morning daylight — palette shift complete', 'withNext', 'Establishes the birch forest landscape that A5_SH01 corridor windows will be strobing past'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Establishing shot for A5 — shows the real landscape outside before going to interior', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize wide aerial scale, repetitive birch trunks pattern, train as small dynamic element; lighting mood A5_cold_birch high-key cold daylight; expand with sensory specifics (cold air, distant train rumble) before final render',
      'frameDescription', 'aerial wide drone shot of passenger train through dense birch forest at cold morning daylight, white-and-black trunks strobing pattern, post-Soviet northern landscape',
      'isBroll', true,
      'isIconic', false,
      'negative', v_neg
    ),
    'environment', NULL, NULL,
    'За окном — берёзы. Лес как чужой алфавит — буквы стоят, но не складываются в слова.',
    'EWS', 'high', 'track_lateral',
    'rising', 'atmosphere', NULL,
    TRUE, FALSE, 'day_day2', 'A5_cold_birch',
    NOW(), NOW()
  );

  -- A6_SH00 — EWS train at golden hour, establishes A6 golden warmth
  INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields",
                     "workflowRouteKey", "referenceProfileId", "referenceImagePool",
                     "narrationText",
                     "shotType", "cameraAngle", "cameraMove",
                     "storyBeat", "narrativeFunction", "vignetteSlug",
                     "isBroll", "isIconic", "timeOfDay", "paletteKey",
                     "createdAt", "updatedAt")
  VALUES (v_sh_a6, v_proj, v_a6, 'A6_SH00',
    jsonb_build_object(
      'positive', 'aerial wide drone shot lateral tracking alongside single passenger train at late afternoon golden hour, low sun bathing the carriage roof in deep warm gold, train moving through endless wheat-colored steppe field, single distant electric pole catching the light, no city anywhere, no roads, vestibule door of one carriage slightly open with a tiny silhouette of a person sitting inside, peaceful golden tranquility, photorealistic cinematic 35mm full-frame, anamorphic widescreen, natural film grain',
      'positiveSdxl', 'aerial wide drone shot lateral tracking single passenger train at late afternoon golden hour, low sun, warm gold carriage roof, endless wheat-colored field, distant electric pole, no city, vestibule door slightly open with tiny figure, photorealistic cinematic 35mm',
      'positiveTemplate', 'aerial wide drone shot lateral tracking single passenger train at late afternoon golden hour, low sun on carriage roof, endless wheat-colored field, vestibule door slightly open, {LIGHT_A6}, {STYLE}',
      'positiveEnvironment', 'endless wheat-colored steppe field at late afternoon golden hour, low sun raking sideways across the landscape, single distant electric pole, no city, no roads, post-Soviet southern feel, train moving sedately',
      'positiveCharacterLocks', 'N/A — environment / B-roll establishing shot, no character identity to lock, tiny silhouette of musician in vestibule is at scale of identity-not-readable',
      'lightingMood', 'late afternoon golden warmth slanting through window, long corridor shadows',
      'narrativeBeat', 'rising',
      'storyFunction', 'atmosphere',
      'camera', jsonb_build_object('framing', 'EWS', 'angle', 'high', 'movement', 'track_lateral'),
      'location', jsonb_build_object('label', 'Поезд / экстерьер или объект', 'palette', 'A6_golden_warm', 'timeOfDay', 'late_day_day2', 'interiorExterior', 'exterior_or_mixed'),
      'continuity', jsonb_build_object('withPrevious', 'Transition from A5 cold birch day to A6 warm golden hour — light source changes from overcast cool to raking sun warm', 'withNext', 'Establishes golden hour context and reveals the vestibule door open with a tiny figure visible — sets up A6_SH01 cut to musician inside that exact vestibule'),
      'production', jsonb_build_object('promptStatus', 'draft', 'notes', 'Establishing shot — places the musician vignette in space and time before A6_SH01 interior', 'assetRefs', '[]'::jsonb),
      'workflowParams', jsonb_build_object('seedPolicy', 'base seed per scene + offset by shot number', 'ipAdapterRef', NULL),
      'captionGenerator', 'Caption-expansion focus: emphasize warm raking golden light, scale of endless field, train as warm moving element, tiny silhouette as cinematic discovery (musician seen from outside before cut inside); lighting mood A6_golden_warm; expand with sensory specifics before final render',
      'frameDescription', 'aerial wide drone shot of passenger train at late afternoon golden hour through endless wheat field, vestibule door slightly open with tiny figure inside, peaceful golden tranquility',
      'isBroll', true,
      'isIconic', false,
      'negative', v_neg
    ),
    'environment', NULL, NULL,
    'Перед закатом поезд греется. Как живой. Это лучший час дня — короткий и нежный.',
    'EWS', 'high', 'track_lateral',
    'rising', 'atmosphere', NULL,
    TRUE, FALSE, 'late_day_day2', 'A6_golden_warm',
    NOW(), NOW()
  );

  -- shot_participants for A4_SH01A (businessman shot)
  INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
  VALUES (gen_random_uuid()::text, v_sh_a4, v_ch_biz, v_pr_biz, 'Businessman');

END $$;

COMMIT;
