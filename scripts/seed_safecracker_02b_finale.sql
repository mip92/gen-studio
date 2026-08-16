-- СГЕНЕРИРОВАНО scripts/seed_safecracker_shots.py — не править руками.
BEGIN;

-- F_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH01',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a small workshop room across its full width in evening light, a bench with a vice and trays of pins under a swan-neck lamp, a pegboard half empty above it',
    'motionPrompt', 'the bench lamp flickers once and steadies over the trays of pins, the tick of a lamp ballast and a radiator cooling, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pan_right')
  ),
  'тебе шестьдесят лет, и ты опять сидишь в мастерской размером два метра на три.', 'WS', 'eye', 'pan_right',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the lamp burns steadily and the pool of light on the bench has widened slightly.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'safecracker';

-- F_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH02',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad at sixty seated at the workbench with a cut-away cylinder in his fingers, reading glasses down on his nose, the bench lamp warm on his hands',
    'motionPrompt', 'his fingers turn the cylinder a quarter revolution and stop, three quick clicks and then one late one, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'руки у тебя всё те же самые, и слышат они ровно так же, как в двадцать восемь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'the cylinder has turned further and his eyes have lifted from it toward the window.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH02';

-- F_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH03',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face at the bench with his eyes closed and his head tilted toward his own hands, the lamp lighting the underside of his jaw',
    'motionPrompt', 'his head tilts a fraction further and his eyebrows lift once, a single late click arriving after the others, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'четвёртый штифт до сих пор садится позже всех остальных.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his eyebrows have settled and his eyes have opened, still lowered to his hands.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH03';

-- F_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the thirty-six-year-old standing just inside the workshop door in his black quilted jacket, hands loose at his sides, the bench and lamp across the room',
    'motionPrompt', 'he takes one step in from the doorway and stops with his hands still at his sides, a door spring stretching and a boot scuffing concrete, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'сын заходит в мастерскую в ноябре и просит открыть ему одну дверь.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_ADULT'),
  'he is one step further in and his weight has settled evenly on both feet.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_ADULT', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_ADULT'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH04';

-- F_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH05',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face turned from the bench toward the doorway, the lamp lighting one cheek, his glasses pushed up onto his forehead',
    'motionPrompt', 'his head turns fully to the doorway and his hands stop moving on the bench, the workshop going quiet and a radiator ticking, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты можешь отказать ему ровно один раз, и это единственный раз, который у тебя ещё остался.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his head has turned back toward the bench and his eyes have lowered to his hands.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH05';

-- F_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH06',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing at the bench having taken off the blue workshop coat, a rolled cloth tool wrap in one hand, the coat over the stool behind him',
    'motionPrompt', 'he lifts the rolled wrap off the bench and holds it against his chest, the soft creak of old cloth and a stool leg scraping, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты встаёшь, снимаешь халат и берёшь с полки свёрток, который не разворачивал одиннадцать лет.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'tall', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'the wrap is held higher against his chest and his other hand has come up to steady it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH06';

-- F_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH07',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, an unrolled cloth tool wrap on a bench with a single thin copper probe lying in its pocket, the cloth stained dark with years of oil',
    'motionPrompt', 'the cloth settles open and the copper probe rolls a few millimetres in its pocket, the soft unrolling of oiled cloth and one small metallic tick, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'внутри лежит та самая медная полоска, которую ты сточил в семнадцать на школьном наждаке.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the cloth lies fully open and the probe has come to rest against the seam.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'safecracker';

-- F_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH08',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing at the bench setting the copper probe down onto the wood with two fingers, the rolled wrap left open beside it, his son out of frame',
    'motionPrompt', 'he sets the probe down on the bench and lifts his fingers clear of it, a single small tap of copper on wood, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты кладёшь её обратно на верстак и говоришь ему, что больше этого не умеешь.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'tall', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his hand has withdrawn to his side and the probe lies alone in the lamp light.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH08';

-- F_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH09',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the workshop across its full width with the street door swinging shut, the bench and lamp on one side, no one in the room',
    'motionPrompt', 'the street door swings shut and the pegboard blanks knock once against the wall, a door closing and a spring pulling it tight, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'он не спорит и не уговаривает, он просто уходит, потому что ты ему давно не нужен.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'wide', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the door is fully closed and the hanging blanks have stopped swinging.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'safecracker';

-- F_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH10',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, Vlad at sixty standing before the inside of his own door in the cramped hallway, one hand raised to the topmost of seven locks, coats crowding him from the side',
    'motionPrompt', 'his hand turns the top lock and moves straight down to the next, seven bolts throwing one after another in an uneven rhythm, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'вечером ты закрываешь свою дверь сверху вниз, все семь замков, и слушаешь каждый.', 'FS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'tall_page', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his hand has reached the lowest lock and all the bolts above it are thrown.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'F_SH10';

-- F_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH11',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a steel ring on a hallway shelf carrying seven keys of different ages and makes, one bright and new, one worn to bare brass, the copper probe lying beside them',
    'motionPrompt', 'the ring settles and one key slides across another and stops, a short bright jangle dying away, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'семь ключей на одном стальном кольце, и все они от одной и той же двери.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the keys hang still on the ring, the newest one lying flat across the oldest.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'safecracker';

-- F_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'F_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the cramped hallway across its full width, the seven-locked door closed, the coats still, a single dim ceiling fitting, the mirror grey at the corners',
    'motionPrompt', 'the ceiling fitting dims a fraction and the hallway settles into stillness, only the tick of a clock beyond the frame, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'эта история вымышлена, все совпадения с реальными людьми случайны, и не повторяй чужих ошибок.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'wide', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the light has dimmed further and the hallway is almost dark, the door unchanged.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'F'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'safecracker';

COMMIT;