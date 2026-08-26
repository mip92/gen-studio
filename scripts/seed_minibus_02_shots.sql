-- СГЕНЕРИРОВАНО scripts/seed_minibus_shots.py — не править руками.
BEGIN;

-- A1_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH01',
  jsonb_build_object(
    'positive', 'low-angle full-length shot, Oleg wedged in the half-open doorway with his weight on his back foot and his shoulder against the frame, both hands hauling the sliding door along its runner while it grinds to a stop halfway, rain sheeting past the opening',
    'motionPrompt', 'he hauls the door a hand''s width along the runner and it jams again, his shoulder pressing harder into the frame, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'ливень, час пик, и сдвижную дверь заклинило на середине.', 'FS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'tall_page', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A1_SH01';

-- A1_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH02',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a work-worn hand pushing the blade of a taped-handled screwdriver into the gap of the door runner and levering it against the jammed roller, grit and wet paint flaking off the channel, cab light raking the steel',
    'motionPrompt', 'the blade slides deeper into the channel and the roller shifts a few millimetres off its seat, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'ты достаёшь отвёртку из-под сиденья и заводишь её в щель.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'minibus';

-- A1_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH03',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the salon across its full width packed to the rear platform, seated passengers wedged shoulder to shoulder and standing ones gripping the roof rail, a woman holding the grab handle with both hands beside the stuck door, flat grey daylight through streaming glass',
    'motionPrompt', 'the standing passengers sway a few centimetres together as the bus settles on its springs and the woman''s grip tightens on the handle, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'внутри двадцать два человека, и половина из них стоит.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'wide', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'minibus';

-- A1_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH04',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the shelter across its full width with eight people crowding forward under the panel as the bus noses in, a boy at the open end yanking his hood up too late while the rain flattens his hair, water sluicing off the panel edge',
    'motionPrompt', 'rain runs off the shelter edge onto the boy''s shoulders and he lifts his chin against it while the queue holds its ground, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'под навесом ещё восемь, и один из них без капюшона.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'minibus';

-- A1_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg braced with his hip against the seat back and his shoulders squared, striking the door runner twice with the flat of his palm so the panel jumps forward onto its track, water flicking off the rubber seal',
    'motionPrompt', 'his palm strikes the runner and the door panel jumps forward a hand''s width along the track, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'сейчас расскажу, как тот, кто всех возит, остался стоять сам.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A1_SH05';

-- A1_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH06',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg''s face turned down toward the runner with his jaw set, rain light off the wet glass moving across his cheek, the brass route-number badge on his breast pocket catching the same light',
    'motionPrompt', 'his eyes come up off the runner and travel along the packed salon, his jaw loosening once, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'останься до конца и подпишись, если хочешь знать, где я свернул.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A1_SH06';

-- A1_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the sliding door running the last of its travel into the rubber seal, a woman''s hand releasing the grab handle beside it, seated passengers still wedged in place behind, grey light narrowing as the panel closes',
    'motionPrompt', 'the door seats fully into the seal and the hand on the grab handle opens and drops away, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'дверь доезжает за тридцать секунд, в салоне никто не встаёт.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'narrow', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'minibus';

-- A1_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH08',
  jsonb_build_object(
    'positive', 'close-up from directly above, a lidless tin sweet box beside the gearshift with coins and folded notes in it, a passenger''s fingers releasing three coins into the box and a driver''s hand levelling them with a thumb, the bare metal bottom showing through',
    'motionPrompt', 'the three coins drop into the box and settle, the thumb sweeping them flat across the bare metal, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'мелочь идёт через плечо в жестяную коробку, по тридцать пять.', 'CU', 'top_down', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'narrow', 4,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'minibus';

-- A1_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH09',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the terminus across its full width with six minibuses nosed into the kerb, Arkady walking at Oleg over the wet asphalt with the zipped folder held out, Oleg stepping down off his cab step and wiping his palms down his thighs',
    'motionPrompt', 'Arkady takes two paces closer over the wet asphalt and shifts the folder to his other arm while Oleg''s boot comes down off the step, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'на конечной тебя ждёт Аркадий с папкой под мышкой.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 2
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A1_SH09';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A1_SH09';

-- A1_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH10',
  jsonb_build_object(
    'positive', 'wide shot at eye level, Arkady walking away across the terminus toward his own car with the folder under his arm, the row of yellow minibuses behind him, oil-black puddles breaking his reflection, the dispatcher hatch lit yellow at the frame edge',
    'motionPrompt', 'he covers two more paces toward the car and his reflection breaks apart in the puddle behind him, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'с понедельника план четыре двести, говорит он и уходит.', 'WS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 2
WHERE p.slug = 'minibus';

-- A2_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH01',
  jsonb_build_object(
    'positive', 'close-up at eye level, a chain drawn through the two steel gate leaves and pulled taut by a padlock hasp, fresh bright scratches where the links bit into the paint, a paper notice taped to the bar above it curling at one corner, flat morning light',
    'motionPrompt', 'the chain settles a link tighter against the gate bar and the taped notice lifts and drops at its corner, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'тебе двадцать восемь, и в четверг на воротах цеха появляется цепь с пломбой, которой вчера не было.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'factory_gate'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';

-- A2_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH02',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg at twenty-eight leaning in to read the taped notice with his weight on his forward foot and one hand flattening the curled corner against the bar, three other men reading over his shoulder, weeds pushing through the apron',
    'motionPrompt', 'his hand smooths the curled corner flat against the bar and his head tips a few degrees closer to the paper, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'на бумаге написано, что производство остановлено, а подписи под этой бумагой нет ни одной живой.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'factory_gate'), NULL,
  'animated', cp.id, 'landscape', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH02';

-- A2_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH03',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg''s face turned up past the gate toward the high shop windows with their panes gone, his chin lifted and his jaw slack, morning light flat on the grey quilted work jacket and the empty glazing bars behind him',
    'motionPrompt', 'his eyes travel slowly along the row of empty windows and stop, his chin lowering a fraction, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты девять лет точил на этом станке, и другого умения у тебя за эти годы не появилось.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'factory_gate'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH03';

-- A2_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a hand laying a worn plastic works pass onto the bare sill of a guard hatch with the glass gone, three other passes already lying there in a loose fan, brick dust and a dead fly on the sill',
    'motionPrompt', 'the pass slides the last centimetre out of the fingers onto the sill and rocks once against the ones already there, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'static')
  ),
  'пропуск ты сдаёшь в пустую вахтёрскую через окошко, из которого стекло вынули ещё в прошлом году.', 'ECU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'factory_gate'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';

-- A2_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH05',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg at the shelter post tearing a tab off a printed driver-wanted notice, his shoulders turned three-quarters to camera and his thumb pressing the paper flat against the metal, the timetable bleached blank behind his hand',
    'motionPrompt', 'the tab tears away down its perforation and his thumb slides off the notice onto the post, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'на столбе у остановки висит объявление, и нужная категория у тебя есть ещё с армии.', 'MCU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH05';

-- A2_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Arkady slapping his palm twice against the yellow side panel, Oleg rubbing the stencilled route number on the windscreen glass with his thumb, both of them turned three-quarters to the bus',
    'motionPrompt', 'Arkady''s palm slaps the side panel twice and comes away, while Oleg''s shoulders turn a few degrees toward the windscreen, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'Аркадий показывает тебе борт, дважды хлопает по нему ладонью и говорит одно только слово: аренда.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ARKADY_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH06';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH06';

-- A2_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH07',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the cab interior across its full width with Oleg settling onto the beaded seat cover, his right hand closing over the long gearshift and his left pulling the door to, the dark terminus beyond the windscreen before dawn',
    'motionPrompt', 'his hand closes over the gearshift knob and the door pulls to against the seal beside his shoulder, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'первый раз ты садишься за этот руль в четверг в пять утра, и машина уже не твоя.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'landscape', 6,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH07';

-- A2_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH08',
  jsonb_build_object(
    'positive', 'close-up from a low angle, a child''s hand closed around the overhead roof rail with a woman''s larger hand gripping the same rail a span away, both knuckles pale with the effort, worn chrome under the fingers, daylight through the salon glass above',
    'motionPrompt', 'the small hand slides a few centimetres along the rail and re-grips as the floor shifts, the larger hand holding its place, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'low', 'movement', 'static')
  ),
  'в девять лет ты ехал этим же маршрутом стоя, держась за тот самый поручень у задней двери.', 'CU', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'narrow', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'minibus';

-- A2_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH09',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg at twenty-eight turned in the driver seat with his spine against the backrest, reaching back to run two fingers along the blue insulating tape wound round the salon rail, dawn light coming grey through the windscreen behind him',
    'motionPrompt', 'his fingers travel along the taped section of rail and stop at the seam, his shoulders turning back to the front, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'поручень с тех лет не поменяли, только обмотали синей изолентой в двух местах, где облез хром.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH09';

-- A2_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH10',
  jsonb_build_object(
    'positive', 'close-up from directly above, an empty tin sweet box wedged beside the gearshift with the printed pattern rubbed off its rim, a single coin dropping from two fingers toward the bare metal bottom, the paint worn through in a pale patch beneath it',
    'motionPrompt', 'the coin lands on the bare metal bottom, bounces once and settles flat, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'первая монета падает в жестяную коробку из-под конфет, и эта коробка у рычага останется навсегда.', 'CU', 'top_down', 'push_in',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'narrow', 2,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'minibus';

-- A2_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH11',
  jsonb_build_object(
    'positive', 'medium shot at eye level, a folded note travelling forward hand to hand along the packed salon toward the driver''s shoulder, three seated passengers passing it on with their eyes down, the roof rail crowded with standing arms above them',
    'motionPrompt', 'the note passes from one hand to the next and the third set of fingers closes on it, the seated passengers holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'деньги идут через плечо от рук к рукам, и сдачу ты отсчитываешь одной рукой прямо на руле.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'minibus';

-- A2_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus pulling out of the terminus past the plywood dispatcher booth, its stencilled route number lit by the low sun, five other buses still nosed into the broken kerb behind it, puddles flashing under the wheels',
    'motionPrompt', 'the bus draws a length past the booth and the sunlight runs along its side panel, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'круг пятьдесят минут, и первый ты закрываешь без единой ошибки и без единой отмены за смену.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'minibus';

-- A2_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH13',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg pushing a banded stack of notes through the sliding hatch with two fingers, Arkady''s hands closing on it from inside the booth over the glass-topped shift sheet, the electric heater glowing orange under the counter',
    'motionPrompt', 'the stack goes through the hatch and Arkady''s fingers close over it while Oleg''s hand withdraws to the sill, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'вечером ты отдаёшь выручку в окошко будки, а остаток забираешь себе наличными и без подписи.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH13';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH13';

-- A2_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH14',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg counting the remaining notes against his own thumb with his chin down, the booth window light along one side of his face, the brass route-number badge newly pinned and still bright on his pocket',
    'motionPrompt', 'his thumb flicks two notes over against his palm and his chin lifts off his chest, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'в первый вечер у тебя остаётся девятьсот, больше, чем давал цех за целую смену у станка.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH14';

-- A2_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH15',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zhanna at the laminate table dealing the notes into three small piles with her fingertips, her shoulders square and her chin down, the shop badge still on its coiled cord at her waist, warm ceiling light on the piles',
    'motionPrompt', 'her fingertips lay two more notes onto the nearest pile and square its edge, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'Жанна раскладывает их на столе в три стопки и говорит, что работа эта у тебя временная.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A2_SH15';

-- A2_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH16',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a ballpoint drawing a ring round the last unringed square of a wall calendar month, every other date already ringed in the same blue, the paper dented by the pressure of earlier rings',
    'motionPrompt', 'the pen completes the ring and lifts off the paper, the calendar page settling back flat against the wall, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'static')
  ),
  'на календаре ты обводишь смены ручкой, и свободных клеток в этом месяце не остаётся вообще.', 'ECU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'minibus';

-- A2_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the terminus at first light across its full width, six minibuses nosed into the kerb with the fog on their windscreens thinning from the bottom edge upward, frost melting off the bent route board, the hatch still shut',
    'motionPrompt', 'the fog on the nearest windscreen thins from the bottom edge upward as the light rises, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'людей всегда надо будет возить, думаешь ты в то первое утро, и в этом ты прав.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'minibus';

-- A2_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH18',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus crossing the junction away from camera under the traffic light on its bent post, the route number stencil small on the rear glass, faded stop lines passing under the wheels, overhead wires crossing above',
    'motionPrompt', 'the bus clears the stop line and moves further across the junction, the traffic light swinging a few degrees on its bent post, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'ошибаешься ты в другом: возить будешь ты, а маршрут при этом будет не твой.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'minibus';

-- A3_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg leaning over the booth counter with both forearms flat on the glass, reading the ruled shift sheet beneath it while a hand inside the hatch writes the day''s figure into the last column, the heater glowing orange below',
    'motionPrompt', 'the hand inside finishes the figure and lifts the pen clear, while Oleg''s forearms slide a hand''s width further onto the glass, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'план четыре тысячи двести, и сдать его надо до девяти вечера, сколько бы ты ни собрал.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH01';

-- A3_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH02',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the terminus across its full width with three drivers standing apart beside their nosed-in buses, each holding a folded route sheet, the plywood booth hatch open at the end of the row, morning shadows long across the wet asphalt',
    'motionPrompt', 'the nearest driver folds his route sheet once more and the others hold their positions along the row, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'выход на линию ты арендуешь у Аркадия, и в очереди на этот выход стоят ещё двое.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'minibus';

-- A3_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg hunched over the wheel with a pocket notebook braced against its rim, writing a figure at the head of a fresh column with a bitten ballpoint, dawn light coming grey through the windscreen onto the page',
    'motionPrompt', 'the pen finishes the figure and underlines it twice, his shoulders dropping over the wheel, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'билет тридцать пять, и сто двадцать человек за смену нужны только чтобы выйти в ноль, без прибыли.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH03';

-- A3_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH04',
  jsonb_build_object(
    'positive', 'close-up from directly above, a hand ruling a line down the middle of a notebook page to split it in two columns, one already headed with a figure and the other blank, the pen bearing hard enough to score the paper',
    'motionPrompt', 'the pen draws the dividing line to the bottom edge of the page and lifts away, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'в блокноте у тебя два столбика: сколько собрал и сколько ещё должен сдать до девяти вечера.', 'CU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'minibus';

-- A3_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg turning the ignition key with his shoulder pressed back into the seat, the instrument needles lifting off their stops, his other hand already closed over the gearshift, the terminus dark beyond the windscreen',
    'motionPrompt', 'the needles lift off their stops and settle, and his hand tightens on the gearshift knob, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'каждое утро ты выезжаешь в минус, и отсчёт начинается с ноля ровно в пять.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH05';

-- A3_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the salon filling from the door end, two passengers dropping onto the last free seats while three more step past them into the aisle and reach for the roof rail, coats brushing the seat backs',
    'motionPrompt', 'one passenger drops onto the last free seat and the man behind him takes hold of the roof rail, the others holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'мест в машине тринадцать, но к третьей остановке в салоне уже двадцать два человека.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';

-- A3_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH07',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus taking the junction in a line of traffic under the bent traffic light, its route number stencil bright on the windscreen, faded stop lines running under the wheels, wires crossing overhead',
    'motionPrompt', 'the bus rolls a length further across the junction and the light on its bent post swings a few degrees, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'круг пятьдесят минут, и таких кругов в смене восемь, если не считать пробки на мосту.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';

-- A3_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH08',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg standing in the open doorway with his weight on the step and his palm held out flat at hip height, four passengers filing past him and laying coins into it one after another, the shelter behind them',
    'motionPrompt', 'a second passenger lays coins into his open palm and his fingers close a little further round them, the queue holding its order, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты считаешь входящих не по лицам, а по монетам, которые ложатся тебе в ладонь.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH08';

-- A3_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH09',
  jsonb_build_object(
    'positive', 'close-up from directly above, a driver''s cupped palm holding three separate small heaps of coins pushed apart by a thumb, the calluses at the base of the fingers, the tin box edge just inside the frame below',
    'motionPrompt', 'the thumb pushes one heap of coins off the palm toward the tin and the remaining two slide together, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'тридцать пять, тридцать пять, тридцать пять, и так сто двадцать раз до обеда, почти без сдачи.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';

-- A3_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH10',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg glancing down at the tin box beside the gearshift with his chin dropped and his hand still on the wheel, midday light flat through the side glass on the notes lying in the box',
    'motionPrompt', 'his eyes drop to the box and come back to the road, his hand rolling a few degrees on the wheel rim, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'к обеду в коробке две тысячи, и половина плана к этому часу ещё не собрана.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH10';

-- A3_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH11',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg standing at the rear wheel with his weight on one hip, biting into a bread roll held in a paper napkin while his other hand rests on the mud-sprayed sill, the bus towering beside him',
    'motionPrompt', 'he takes a bite and his free hand slides along the sill to steady him, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'обед у тебя стоя, у заднего колеса, восемь минут между кругами и без чая.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'tall', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH11';

-- A3_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, six drivers queued along the booth wall in the dark with banded stacks of notes in their hands, the lit hatch throwing a yellow rectangle onto the asphalt, their buses standing dark behind them',
    'motionPrompt', 'the man at the hatch pushes his stack through and the queue shuffles one place forward along the wall, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'в девять вечера у окошка будки собирается очередь из шести водителей с одинаковыми пачками.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'minibus';

-- A3_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH13',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg at the hatch pushing a banded stack through with two fingers and drawing a thinner fold back toward his own chest with the other hand, the glass-topped shift sheet lit from inside the booth',
    'motionPrompt', 'the stack goes through the hatch and the thinner fold comes back into his palm and closes, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты отдаёшь четыре двести и оставляешь себе тысячу сто, но только если день вышел хороший.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'tall', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH13';

-- A3_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH14',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, the tin sweet box swept almost empty by a passing hand, four coins left against the dented corner and the bare metal bottom showing across the whole floor of it, cab light hard on the worn paint',
    'motionPrompt', 'the last coins slide across the bare bottom into the dented corner and stop, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'static')
  ),
  'дно коробки видно уже к девяти вечера, и для пятницы такой результат считается нормальным.', 'ECU', 'top_down', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'minibus';

-- A3_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH15',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg walking across the empty junction three-quarters away from camera with his weight forward and both hands in his jacket pockets, the traffic light blinking amber above him, shopfronts dark on the far corner',
    'motionPrompt', 'he takes two more paces across the stop line and his other foot comes forward, the amber blink crossing his shoulders, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'track_lateral')
  ),
  'домой ты идёшь пешком через весь район: автобус в эту сторону ходит только до одиннадцати.', 'FS', 'eye', 'track_lateral',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'tall', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH15';

-- A3_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH16',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zhanna half-turned from the stove with her shoulders square, sliding a covered plate onto the laminate table with both hands, the kettle just set back on the ring behind her, warm ceiling light on the cover',
    'motionPrompt', 'the plate slides the last hand''s width onto the table and her hands lift off the cover, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'Жанна греет тебе ужин и спрашивает всего одно, сколько сегодня осталось у тебя после сдачи плана.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH16';

-- A3_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the kitchen window across its full width at night with the terminus lit far below beyond the glass, six pale rectangles of parked buses in the yard lights, the drying rack and the ringed calendar at the frame edges',
    'motionPrompt', 'one of the pale rectangles below darkens as a yard light cuts out, the window glass fogging a little from the inside, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'из вашего окна видно конечную, и борта на ней ты считаешь перед сном по привычке.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'minibus';

-- A3_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH18',
  jsonb_build_object(
    'positive', 'low-angle full-length shot up the packed aisle, Oleg seen from the rear platform standing at the wheel with his shoulder turned back toward the salon and one arm reaching for a note held out over the seats, standing passengers crowding the rail above him',
    'motionPrompt', 'his reaching arm closes on the held-out note and draws it back toward the wheel, the standing passengers holding their places along the rail, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'в тридцать один ты знаешь на маршруте каждую выбоину, половину пассажиров и всех своих сменщиков.', 'FS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'tall_page', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_YOUNG'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_YOUNG', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_YOUNG'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A3_SH18';

-- A4_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH01',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg at thirty-five in the driver seat with his spine straight and his chin lifted, narrowing his eyes at something far up the road through the streaked windscreen, one hand loose on the wheel rim',
    'motionPrompt', 'his eyes narrow further on the far distance and his hand tightens once on the wheel rim, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'в тридцать два ты начинаешь читать остановку раньше, чем успеваешь к ней подъехать вплотную.', 'MCU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH01';

-- A4_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH02',
  jsonb_build_object(
    'positive', 'close-up at eye level seen through a rain-flecked windscreen, four people waiting at the shelter, two holding folded notes ready in bare fingers and one digging in a shoulder bag, the fourth turned away toward the timetable',
    'motionPrompt', 'the fingers holding the notes lift them a little higher and the hand in the bag pushes deeper, the others holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'за двести метров видно, кто стоит с деньгами в руке, а кто с проездным в сумке.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'minibus';

-- A4_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH03',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg with his shoulders squared to the road and his right hand laid over the door lever beside the seat, the pad of his thumb resting on its worn end, dash light green along the back of his hand',
    'motionPrompt', 'his thumb rolls once over the worn end of the lever and his hand stays where it is, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'рычаг двери у тебя под правой рукой, и решение занимает меньше секунды и одного взгляда.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH03';

-- A4_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH04',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the bus pulled hard into the kerb with its door already open, two passengers stepping up with notes held out in front of them, the shelter bench empty behind them, wet asphalt bright under the door',
    'motionPrompt', 'the second passenger''s foot lands on the step and the held-out note enters the doorway, the shelter behind them staying still, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'наличными платят быстро, и за такими ты останавливаешься всегда, даже прямо под запрещающим знаком.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'minibus';

-- A4_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, an older woman setting a bulging holdall onto the bus step and then lifting her own foot after it, her free hand pulling on the door frame, the queue behind her closed up tight',
    'motionPrompt', 'the holdall settles onto the step and her foot comes up after it, the people behind her holding their ground, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'на ступеньку с тяжёлой сумкой уходит четыре секунды вместо одной, и эти секунды твои.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';

-- A4_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH06',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the salon across its full width with four passengers still working their way down the aisle past seated knees, the open door bright at the far end, coats caught on seat corners',
    'motionPrompt', 'the nearest of the four turns his shoulders sideways to pass a knee and moves one seat further along, the seated passengers holding still, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'четыре секунды на человека дают шесть минут за круг и полкруга за целую смену.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';

-- A4_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH07',
  jsonb_build_object(
    'positive', 'close-up from directly above into an open shoulder bag, two hands turning over a purse, a folded scarf and a bunch of keys in search of the pass sleeve, the bag mouth held apart by a thumb',
    'motionPrompt', 'the hands lift the purse aside and push deeper into the bag, the scarf sliding down against the lining, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'проездной ищут в сумке долго, и очередь за спиной ждёт вместе с тобой молча.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';

-- A4_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH08',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg with his head turned a little toward the salon mirror and his shoulders still square to the road, his jaw tightening as he watches the queue reflected in it, dash light on one cheek',
    'motionPrompt', 'his eyes hold on the mirror and his jaw sets harder, his fingers drumming twice on the wheel rim, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты смотришь в салонное зеркало и видишь там уже не людей, а потерянные секунды.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH08';

-- A4_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH09',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, a scratched dashboard clock with its minute hand dropping onto the next division, a lap time hand-written on a strip of tape peeling away beside it, dust shaking loose in the seams of the plastic bezel',
    'motionPrompt', 'the minute hand ticks one division further past the written time and holds, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'часы на панели показывают, что этот круг ты идёшь на семь минут дольше нормы.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';

-- A4_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg pulling the door lever down and back with his right hand while a man is still two paces short of the step outside, the panel already travelling along its runner, the salon crowded behind his shoulder',
    'motionPrompt', 'the lever comes back under his hand and the door panel travels a hand''s width along the runner toward the seal, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в первый раз ты закрываешь дверь, когда человеку до неё остаётся всего два шага.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH10';

-- A4_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH11',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the bus pulling away from the kerb with its door shut, two people left standing on the pavement with their arms down at their sides, the emptied shelter bench behind them, tail lights reddening the wet stone',
    'motionPrompt', 'the bus gains a length off the kerb and the two figures grow smaller behind it, their arms staying down, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'на остановке остаются двое, и ни один из них не машет тебе вслед рукой.', 'WS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 6,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'minibus';

-- A4_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH12',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg pushing his shoulders back into the seat and blowing a breath out through his nose, both hands returning to the top of the wheel, his eyes going back to the road past the mirror',
    'motionPrompt', 'his eyes stay forward and he lets out a breath through his nose, his shoulders lowering a centimetre, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'никто не жалуется, потому что жаловаться на маршрутке в этом городе особо и некому.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH12';

-- A4_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH13',
  jsonb_build_object(
    'positive', 'close-up from directly above, the tin box filled to a finger''s depth with coins and folded notes, a thumb pressing the loose notes down flat against the coins so more will fit, the dented corner packed tight',
    'motionPrompt', 'the thumb presses the notes down against the coins and they compact a few millimetres, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'к вечеру в коробке на четыреста больше, чем было в такую же прошлую пятницу.', 'CU', 'top_down', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'narrow', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'minibus';

-- A4_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH14',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg counting the evening fold against his thumb with his forearms resting on the wheel and his back rounded, the terminus lights coming through the windscreen onto the notes',
    'motionPrompt', 'his thumb flicks three notes over in sequence and stops, his back straightening a few degrees, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты считаешь это не воровством, а скоростью, и формально ты прав по всем бумагам.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH14';

-- A4_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH15',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the lit booth hatch with a banded stack of notes sliding in through the opening and the queue rail emptying beside it, the ruled shift sheet showing under its glass, the other buses still out on the line',
    'motionPrompt', 'the banded stack is drawn in through the hatch and the sill is left bare, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'план ты закрываешь к восьми, на час раньше обычного, и очереди у окошка нет.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'minibus';

-- A4_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH16',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Arkady leaning out of the booth doorway with the folder under one arm, Oleg turning back toward him and pushing his own thin fold of notes down into his hip pocket, the yellow hatch light between them',
    'motionPrompt', 'Arkady''s hand comes off the frame and drops to the folder, while Oleg''s shoulders turn a few degrees back toward him, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'Аркадий это замечает через месяц и говорит, что ты учишься быстрее всех остальных на линии.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ARKADY_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH16';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH16';

-- A4_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, Oleg crossing the junction on foot with his hands in his pockets, the light still green above him and the road clear in either direction, dark shopfronts running away on both sides',
    'motionPrompt', 'he takes two more paces over the faded stop line and the green light holds above him, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track_lateral')
  ),
  'домой ты приходишь на час раньше и не знаешь, чем занять этот лишний час.', 'WS', 'eye', 'track_lateral',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'wide', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A4_SH17';

-- A4_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH18',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the kitchen table across its full width with a folded stack of notes beside a covered plate and its top note unfolding slowly against the plate rim, one stool pushed back, only the window glow on the laminate',
    'motionPrompt', 'the top note of the stack settles and unfolds a few millimetres against the plate rim, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'деньги ты кладёшь на стол молча, и Жанна их больше не пересчитывает по два раза.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'minibus';

-- A5_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg leaning in at the booth window with his forearm on the sill, following a line of a reimbursement sheet with his fingertip as it is turned toward him from inside, the heater glowing under the counter',
    'motionPrompt', 'his fingertip travels along the printed line and stops on a figure at its end, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в тридцать три тебе объясняют, как перевозчику считают проездные и когда за них платят.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH01';

-- A5_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH02',
  jsonb_build_object(
    'positive', 'close-up from directly above, a printed reimbursement sheet on the booth counter with two columns of figures, a pencil laid across it pointing at the lower figure, a coffee ring soaked into the paper at the corner',
    'motionPrompt', 'the pencil rolls a few millimetres down the sheet and comes to rest against the lower column, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'за проездной перевозчику компенсируют девятнадцать вместо тридцати пяти, и разницу тебе не вернёт никто.', 'CU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'square', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'minibus';

-- A5_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg in the driver seat working the sum on his fingers against the wheel rim, his lips shut and his chin down, the notebook lying shut on the passenger seat beside him, flat daylight on his knuckles',
    'motionPrompt', 'two of his fingers fold down against the wheel rim and his chin lifts off his chest, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'приходят эти девятнадцать через два месяца, а план сдавать надо сегодня, до девяти вечера.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH03';

-- A5_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a cardboard travel pass in a clouded plastic sleeve on a perished elastic band, a thumb rubbing the fogged front to read the faded month through it, the furred corner lifting away from the card',
    'motionPrompt', 'the thumb rubs across the clouded front and the furred corner lifts a little further off the card, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'static')
  ),
  'проездной в мутном файлике на резинке ты узнаёшь метров за двадцать до самой остановки.', 'ECU', 'top_down', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'TRAVEL_PASS'),
  'animated', cp.id, 'square', 3,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'minibus';

-- A5_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Zina raising one arm out toward the road with her weight coming onto her forward foot, lifting the clouded pass sleeve in her other hand, the checked trolley tipping against her hip',
    'motionPrompt', 'her raised arm lifts a few centimetres higher and the pass sleeve swings once on its elastic, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'женщина у столба поднимает руку, и в другой руке у неё этот самый файлик.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH05';

-- A5_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH06',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus running past the shelter with its door shut and its indicator dark, the woman''s raised arm still up at the kerb, spray fanning from the front wheel across the pavement edge',
    'motionPrompt', 'the bus draws a length past the shelter and the spray from its wheel reaches the kerb stone, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'ты не тормозишь, и в первый раз это решение принимаешь совершенно осознанно, без спешки.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'minibus';

-- A5_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg with his eyes flicked up to the wing mirror and his shoulders held square to the road, the small reflected figure lowering its arm in the glass beside his head, daylight banding his face',
    'motionPrompt', 'his eyes hold on the mirror a moment longer and then come back to the road, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в зеркале она опускает руку и садится на лавку под навесом ждать следующий борт.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH07';

-- A5_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH08',
  jsonb_build_object(
    'positive', 'close-up at eye level, a driver''s hand laid over the door lever with the fingers opening above it, the worn end of the lever polished by years of thumbs, the pass-window edge and the wet road sliding by out of focus behind',
    'motionPrompt', 'the fingers spread a few millimetres on the lever and settle again onto the same spot, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'рычаг двери остаётся на месте, и делать для этого не надо вообще ничего, только не двинуть рукой.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'minibus';

-- A5_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH09',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the packed salon with every passenger''s face turned down to a phone or to the floor, one man''s forehead resting on the window glass, the roof rail crowded with slack hands above them',
    'motionPrompt', 'the man''s forehead slides a centimetre down the glass and one slack hand re-grips the rail, the rest holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в салоне этого никто не замечает, потому что смотреть в салоне особо и некуда.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'narrow', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'minibus';

-- A5_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH10',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg standing at the side of the bus with his weight on one hip, counting a fold of notes held low against his stomach where the panel hides it, the mud-sprayed sill at his shoulder',
    'motionPrompt', 'his thumb turns two notes over against his stomach and his shoulders round a little further over them, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'на конечной ты стоишь у борта и считаешь, сколько сэкономил за одну эту смену.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'tall', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH10';

-- A5_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zhanna at the till dragging a packet across the scanner glass with her right hand while her left already reaches for the next, her shoulders square and her chin down, the badge swinging on its coiled cord',
    'motionPrompt', 'the packet clears the scanner glass and her left hand closes on the next one, the badge swinging once at her waist, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'Жанна на кассе пробивает чужие продукты по двенадцать часов, шесть дней в неделю, стоя.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'grocery_checkout'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH11';

-- A5_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH12',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Zhanna standing at the end of the checkout with her weight on both feet, pulling the maroon tunic straight at the hem with both hands, the emptied belt and the chrome queue rail running away beside her',
    'motionPrompt', 'her hands draw the tunic hem straight and drop to her sides, her weight settling onto one foot, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'её смена начинается в семь, и до дома ей от кассы всего две остановки.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'grocery_checkout'), NULL,
  'animated', cp.id, 'tall', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH12';

-- A5_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH13',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the kitchen across its full width in the evening with three stools drawn up and two plates on the laminate, a school timetable held to the fridge by a magnet, steam rising off a cup at the near edge',
    'motionPrompt', 'the steam off the cup bends toward the window and the timetable corner lifts a little under the magnet, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'дома вы говорите про Милу, про школу и про новую зимнюю куртку на осень.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'wide', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'minibus';

-- A5_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH14',
  jsonb_build_object(
    'positive', 'close-up at eye level, a new olive parka hanging on the hallway hook with the shop tag still looped through its zip, a hand turning the tag over to read the price, the older coats crowded behind it',
    'motionPrompt', 'the hand turns the tag fully over and lets it drop back against the zip, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'куртку Миле берут в октябре, и денег на неё в этот раз хватает впервые.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'minibus';

-- A5_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH15',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg standing in the hallway with his shoulders relaxed and his chin lifted toward the hook, one hand lifting the parka sleeve and letting it fall, dim hallway light along the fabric',
    'motionPrompt', 'he lifts the sleeve a hand''s width and lets it drop back against the coat, his chin lowering after it, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты смотришь на эту куртку в прихожей и не связываешь её с той женщиной.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH15';

-- A5_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH16',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg in the narrow hallway pulling the black softshell over one shoulder with his weight on his back foot, the brass badge already pinned to the pocket beneath it, coats crowding him from the side',
    'motionPrompt', 'the jacket comes up over his second shoulder and he squares it with a short pull at the hem, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в пять утра ты выходишь на смену, и связывать одно с другим тебе некогда.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH16';

-- A5_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the terminus before dawn with six buses nosed into the kerb and frost on their windscreens, the booth hatch shut and dark, a single mast light throwing long shadows across the broken asphalt',
    'motionPrompt', 'the frost on the nearest windscreen darkens along its lower edge as the light shifts, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'конечная в пять утра пустая, и первый борт на линию всегда уходит именно твой.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'minibus';

-- A5_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH18',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg settling into the seat and pushing the emptied tin box back into its slot beside the gearshift with the heel of his hand, his breath fogging the cold windscreen in front of him',
    'motionPrompt', 'the heel of his hand pushes the box fully into its slot and his breath spreads further across the glass, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'коробка пустая, отсчёт снова с ноля, и так триста дней в году без перерыва.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'landscape', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A5_SH18';

-- A6_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH01',
  jsonb_build_object(
    'positive', 'low-angle full-length shot, Zina standing alone under the shelter panel with her weight on both feet, both hands closed on the handle of the checked trolley in front of her, the steel frame rising past her into the pale dawn sky',
    'motionPrompt', 'she shifts her weight from one foot to the other and the trolley tips a few degrees toward her on its wheels, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'Зину ты знаешь по вторникам и пятницам: шесть десять, вторая остановка от конечной, у больницы.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall_page', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH01';

-- A6_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH02',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zina raising her right arm out toward the road with her shoulders turned after it, the grey headscarf knotted under her chin, the trolley handle still hooked in her left hand, dawn light flat on her coat collar',
    'motionPrompt', 'her raised arm lifts higher and her shoulders turn a few degrees further toward the road, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ей шестьдесят восемь, и ездит она к дочери на другой конец города через весь центр.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH02';

-- A6_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH03',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus stopped square to the shelter with its door run fully open, the woman and her trolley small at the doorway across the frame, the bus indicator throwing amber onto the wet kerb stones',
    'motionPrompt', 'the door completes its travel into the open and the amber indicator pulses once across the kerb, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'во вторник ты открываешь ей дверь и ждёшь, пока она заведёт тележку на ступеньку.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'wide', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'minibus';

-- A6_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Zina lifting the trolley sideways onto the bus step with both hands while Oleg reaches out of the driver seat, catching its far end and pulling it in over the sill',
    'motionPrompt', 'the trolley''s near wheel comes up onto the step and Oleg''s hand takes its far end, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'тележка идёт на ступеньку боком, и на всю посадку уходит семь секунд твоего круга.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH04';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH04';

-- A6_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH05',
  jsonb_build_object(
    'positive', 'close-up at eye level, two thin fingers turning the clouded pass sleeve toward the light and rubbing its fogged front clear with a thumb, the perished elastic sliding down over the knuckle',
    'motionPrompt', 'the fingers turn the sleeve a few degrees toward the light and the elastic slides down the knuckle, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'проездной она держит наготове ещё на тротуаре, чтобы никого за собой в салоне не задержать.', 'CU', 'eye', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'TRAVEL_PASS'),
  'animated', cp.id, 'square', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'minibus';

-- A6_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH06',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg dipping his chin once toward the doorway keeping his head to the road, both hands staying on the wheel, the salon mirror bright above his shoulder',
    'motionPrompt', 'his chin dips once and comes back level, his hands holding their places on the wheel, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты киваешь, не глядя на файлик: считать его всё равно никто и нигде не будет.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH06';

-- A6_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH07',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, the checked trolley standing in the aisle on its two wheels, a passenger''s boot stepping over its base and the worn rubber floor around it, another shoe waiting behind',
    'motionPrompt', 'the boot clears the trolley base and lands beyond it, the trolley rocking a few degrees on its wheels, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'static')
  ),
  'тележка стоит в проходе, и её обходят все, кто входит на следующих четырёх остановках.', 'ECU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'minibus';

-- A6_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH08',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Zina lowering herself onto the window seat with one hand on the seat back and the other keeping hold of the trolley handle so it stays upright beside her knee',
    'motionPrompt', 'she settles onto the seat and her hand on the trolley handle pulls it in against her knee, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'она садится у окна и всю дорогу держит тележку за ручку, не отпуская её.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH08';

-- A6_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH09',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus crossing the junction in morning traffic with its salon windows fogged from inside, the bent traffic light above, faded stop lines running under the wheels',
    'motionPrompt', 'the bus rolls a length further over the stop lines and the fog on the salon glass thins from the bottom, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'до её остановки двадцать две минуты, и эти минуты она за все годы не считала.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'minibus';

-- A6_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH10',
  jsonb_build_object(
    'positive', 'low-angle full-length shot, Oleg standing at the driver position with his weight even and his right hand closed over the door lever, the closed door panel filling the frame beside him from floor to roof, dawn light narrow through its glass',
    'motionPrompt', 'his hand closes harder on the lever and stays on the same spot and his weight settles onto one foot, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'в пятницу в шесть десять ты видишь её раньше, чем она успевает увидеть тебя.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'tall_page', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH10';

-- A6_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH11',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the packed salon with a folded note travelling forward over three shoulders toward the cab, standing passengers braced against the roof rail, the fogged windows grey behind them',
    'motionPrompt', 'the note passes over the third shoulder into a waiting hand, the standing passengers holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в салоне двадцать два человека, и все они в это утро платили тебе наличными.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';

-- A6_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the minibus running past the shelter at full speed, its door shut and its indicator dark, the woman with the trolley small at the kerb with her arm still raised, spray fanning off the front wheel',
    'motionPrompt', 'the bus draws a full length past the shelter and the spray off its wheel reaches the kerb, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track')
  ),
  'ты проходишь остановку на пятой передаче и даже не сбрасываешь до четвёртой перед ней.', 'WS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';

-- A6_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH13',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Zina lowering her raised arm back to the trolley handle with her weight settling onto both feet, her head turning after the bus that has gone, the empty road stretching away behind her',
    'motionPrompt', 'her arm comes down onto the trolley handle and her head turns further after the bus, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'Зина опускает руку и остаётся стоять под навесом: следующий борт по расписанию только через час.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH13';

-- A6_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH14',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg pushing the gearshift up into the next gear and keeping his eyes hard on the far road, his shoulders staying square while the mirror swings unwatched above him',
    'motionPrompt', 'his hand moves up one gear on the shift and his eyes stay forward, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты знаешь про этот час, знаешь про её дочь, и всё равно не тормозишь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH14';

-- A6_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH15',
  jsonb_build_object(
    'positive', 'close-up at eye level, the wing mirror filling the frame with the small standing figure and the trolley reflected in it, road film speckling the glass, the shelter frame shrinking behind them',
    'motionPrompt', 'the reflected figure slides toward the outer edge of the mirror glass and shrinks further, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'в зеркале она делается меньше, но на лавку под навесом почему-то уже не садится.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';

-- A6_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH16',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Zina back at the same post on Tuesday raising her arm toward the road, the trolley set down beside her forward foot, the same bleached timetable behind her shoulder',
    'motionPrompt', 'her arm rises to shoulder height and her forward foot slides a few centimetres toward the kerb, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'во вторник она снова стоит на том же месте и снова поднимает руку заранее.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH16';

-- A6_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the minibus swinging hard into the shelter with its door running open and the checked trolley coming up onto the step, the amber indicator pulsing, the queue closing up behind it',
    'motionPrompt', 'the trolley comes fully up onto the step and the indicator pulses once more, the queue holding its order, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'во вторник ты её берёшь, и на этом твоя совесть закрывается до самой пятницы.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'minibus';

-- A6_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH18',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zina leaning forward from the window seat toward the cab with one hand on the seat back in front of her, her mouth moving and her chin lifted, the trolley held upright at her knee',
    'motionPrompt', 'she leans a few centimetres further forward and her hand slides along the seat back, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'она говорит тебе спасибо каждый вторник, и каждый вторник тебе от этого спасибо неловко.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A6_SH18';

-- A6_SH19
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH19',
  jsonb_build_object(
    'positive', 'close-up from directly above, two thin hands shifting their grip one over the other on the trolley handle and closing again harder, the checked fabric creasing where the knuckles press it',
    'motionPrompt', 'the upper hand shifts its grip and closes again over the lower one, the knuckles whitening further, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'она держится за ручку тележки двумя руками так, будто её могут в любой момент отобрать.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'minibus';

-- A6_SH20
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH20',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the foam of an empty window seat rising slowly out of a shallow dent, a scuff of wheel rubber drying on the seat frame beside it, daylight moving through the fogged glass above',
    'motionPrompt', 'the dent in the cushion rises a few millimetres as the foam recovers, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'после её остановки на сиденье у окна остаётся вмятина и чёрный след от колеса.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'minibus';

-- A7_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH01',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg pressing the clutch pedal to the floor with his knee locked straight and his hand pumping the gearshift out of gear, his shoulders driven back into the seat, the windscreen tilted up at the slope',
    'motionPrompt', 'his knee drives the pedal the last of its travel and the gearshift comes out of gear under his hand, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в тридцать шесть сцепление уходит в пол на подъёме, ровно посередине третьего круга смены.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH01';

-- A7_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH02',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the minibus stopped on the incline with its door open and a line of passengers filing down the step onto the road, the hazard lights on, the traffic light on its bent post above them',
    'motionPrompt', 'the passenger on the step comes down onto the road and the line behind shuffles one place forward, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'двадцать два человека выходят и идут пешком до следующей остановки, и никто не спорит.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'minibus';

-- A7_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH03',
  jsonb_build_object(
    'positive', 'close-up from directly above the pedal box, the clutch pedal flat on the floor mat with its return spring swinging free of the bracket it has torn out of, grit sliding down into the ribs of the mat',
    'motionPrompt', 'the slack return spring swings a few millimetres on its bracket and the pedal stays down, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'педаль лежит на полу и не возвращается, и смена на этом заканчивается на четыре часа раньше.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'minibus';

-- A7_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg standing at the open cab door with a phone wedged between ear and shoulder, writing a figure on the back of his own hand with a ballpoint, his other elbow braced on the door sill',
    'motionPrompt', 'the pen finishes the figure on the back of his hand and his shoulder pushes the phone tighter against his ear, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты звонишь Аркадию и слышишь, что машина не твоя, а ремонт при этом твой.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH04';

-- A7_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg lowering himself into the inspection pit with both hands on the concrete lip and his shoulders taking his weight, the bare bulb swinging over the pit mouth, the bus standing across it above him',
    'motionPrompt', 'his arms take his weight and he drops the last step into the pit, the bulb swinging wider above the opening, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в гараже ты лезешь в яму сам, механик берёт за смену отдельно и вперёд.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH05';

-- A7_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH06',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the garage bay across its full width with the yellow bus standing over the open pit, one wheel off and leaning against the timber bench, tools laid out on a folded blanket, the bulb throwing a hard cone',
    'motionPrompt', 'the hanging bulb swings once through its arc and the cone of light slides across the laid-out tools, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'сцепление вместе с работой выходит в двадцать восемь тысяч и три ночи в яме.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'minibus';

-- A7_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH07',
  jsonb_build_object(
    'positive', 'medium close-up from a low angle inside the pit, Oleg with his shoulders wedged under the gearbox housing and both arms raised into it, taking the weight on a strap looped over his forearm, the bulb behind his head',
    'motionPrompt', 'the housing shifts a centimetre down onto the looped strap and his forearms take the load, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'low', 'movement', 'static')
  ),
  'первую ночь ты снимаешь коробку, вторую ждёшь диск, который везут с рынка через полгорода.', 'MCU', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH07';

-- A7_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH08',
  jsonb_build_object(
    'positive', 'close-up from directly above, two oil-blacked hands leaning on a long breaker bar seated on a rusted bellhousing bolt, the bar bending a few degrees under the load, rust flakes falling away from the thread',
    'motionPrompt', 'the bar gives a quarter turn and stops, rust flakes dropping off the thread beneath it, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'болты прикипели за одиннадцать лет, и каждый идёт с четвертью оборота за один раз.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'narrow', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'minibus';

-- A7_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH09',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg climbing out of the pit with one knee up on the concrete lip and a spanner still in his fist, his back rounded with the effort, the reassembled housing dark above the pit behind him',
    'motionPrompt', 'his knee takes his weight on the lip and he pushes up out of the pit onto the floor, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'третью ночь ты собираешь всё обратно и в шесть утра уже выезжаешь на линию.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'narrow', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH09';

-- A7_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH10',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the terminus at dawn with the repaired bus back in the row and the last of the wiper water running down its cleaned windscreen, frost still melting off the buses either side of it',
    'motionPrompt', 'the last of the wiper water runs down the cleaned windscreen and the hatch light steadies, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'за эти три ночи план шёл всё равно, и сдавал ты его из своих.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'minibus';

-- A7_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zhanna counting notes out of a savings envelope onto the table with her chin down, her shoulders square, the emptied envelope pinned under her left palm, warm ceiling light on the thinning stack',
    'motionPrompt', 'her fingers lay two more notes onto the table and the emptied envelope slides under her palm, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'двадцать восемь тысяч Жанна снимает с того, что вы откладывали на лето к морю.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH11';

-- A7_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH12',
  jsonb_build_object(
    'positive', 'close-up from directly above, a hand drawing a single hard line through the writing on a savings envelope and starting a new word beneath it, the ballpoint denting the paper, the flap standing open and empty',
    'motionPrompt', 'the pen completes the crossing line and begins the first stroke beneath it, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'конверт, на котором было написано море, ты подписываешь заново одним коротким рабочим словом и убираешь.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'minibus';

-- A7_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH13',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg taking the folded notes off the table and pushing them into his inside jacket pocket with two fingers, his weight on his back foot, the empty envelope left lying open on the laminate',
    'motionPrompt', 'the notes go into the pocket and his hand comes away flattening the fabric over them, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты берёшь его и не спрашиваешь, что теперь будет у вас вместо этого моря.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH13';

-- A7_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH14',
  jsonb_build_object(
    'positive', 'close-up at eye level, Zhanna''s face turned down toward the drawer she is closing with her hip, her chin low and her mouth shut, the badge cord swinging at the edge of frame, warm light along her cheek',
    'motionPrompt', 'her chin lowers a fraction further and the drawer edge nudges shut against her hip, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'Жанна не спорит с тобой ни одной минуты, она просто убирает пустой конверт назад в ящик.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH14';

-- A7_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH15',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the garage bay in the morning with the bus gone and the pit standing open across the floor, the folded blanket still holding two spanners, an oil pool spreading slowly toward the drain',
    'motionPrompt', 'the oil pool creeps a few centimetres further across the concrete toward the drain, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'машина не твоя, ремонт твой, и договор именно с таким условием ты подписал сам одиннадцать раз.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'garage_pit'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'minibus';

-- A7_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH16',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Arkady turning one page of the lease copy over on the counter with two fingers and pressing it flat, the folder lying open under his forearm, the hatch light hard on his combed-back hair',
    'motionPrompt', 'his fingers turn the page fully over and press it flat against the counter, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'Аркадий говорит, что так у всех на линии, и в этом он не врёт.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ARKADY_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH16';

-- A7_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH17',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg dragging his gaze up off the empty tin box to the black windscreen and closing his jaw, the instrument cluster lighting him from below',
    'motionPrompt', 'his eyes lift off the box to the road and his jaw shifts once, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'в этот месяц ты остаёшься при нуле и не берёшь ни одного выходного дня.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A7_SH17';

-- A7_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH18',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, two hands resting on the wheel rim with black oil worked deep under every nail and into the knuckle creases, a torn cuticle on one thumb, dash light raking across the skin',
    'motionPrompt', 'one thumb rubs across the nail of the other and the oil under it does not move, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'масло из-под ногтей не отходит две недели, и первой это замечает не Жанна, а Мила.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 27
WHERE p.slug = 'minibus';

-- A8_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH01',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a school-hour queue along the shelter across the frame, five teenagers with backpacks standing apart from the adults, the yellow minibus swinging in to the kerb behind them, morning light low along the pavement',
    'motionPrompt', 'the queue turns as one toward the arriving bus and the nearest backpack slides down a shoulder, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'Миле шестнадцать, и с сентября она ездит твоим маршрутом до школы каждое утро, кроме субботы.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'minibus';

-- A8_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH02',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Mila stepping up into the doorway with her weight on the step and one hand on the frame, the olive parka open and the headphones down around her neck, the salon dim behind her',
    'motionPrompt', 'her second foot comes up onto the step and her hand slides forward along the frame, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'она садится на своей остановке и всегда проходит в самый конец, на заднюю площадку у стекла.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH02';

-- A8_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Mila on the rear platform pushing the padded headphones down off her ears onto her neck with both hands, her shoulders squared to the aisle, the roof rail crowded above her',
    'motionPrompt', 'the headphones come down off her ears onto her neck and her hands drop to the rail, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'наушники она снимает только в салоне, чтобы не пропустить свою остановку у школьных ворот.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH03';

-- A8_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH04',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg lowering a route sheet in his fist as Mila walks past him along the bus toward the gate, neither of them turning to the other, his other hand still flat on the open cab door',
    'motionPrompt', 'she takes two more paces past the cab door and his route sheet lowers a hand''s width in his grip, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'на конечной вы не разговариваете: смена ещё не закончилась, и очередь ждёт свой выход.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'tall', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 28
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH04';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH04';

-- A8_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level from the rear platform, Mila holding the roof rail with one hand and looking forward down the aisle past standing shoulders toward the lit cab, the salon mirror small and bright at the far end',
    'motionPrompt', 'her head lifts a few degrees to see past the shoulder in front of her and her grip slides along the rail, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'с задней площадки видно кабину, салонное зеркало и твою правую руку на рычаге двери.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH05';

-- A8_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH06',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the shelter coming up on the right with Zina standing at the post, her arm already lifting and the pass sleeve in her other hand, the trolley at her foot, wet kerb bright ahead of the bus',
    'motionPrompt', 'her arm rises to shoulder height and the trolley tips a few degrees toward her, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'на второй остановке в пятницу стоит Зина с тележкой и уже поднятой рукой, как всегда.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH06';

-- A8_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH07',
  jsonb_build_object(
    'positive', 'close-up at eye level, a driver''s hand laid across the door lever with the fingers curling loosely above it, the worn end of the lever polished bright, the shelter sliding past out of focus through the glass behind',
    'motionPrompt', 'the fingers tighten a few millimetres on the lever and release again onto the same spot, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'твоя рука лежит на рычаге, и рычаг за всю остановку так и не двигается.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';

-- A8_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH08',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Mila on the rear platform with her chin turning from the passing window back toward the cab, her hand tightening on the roof rail, the fogged glass and the shelter gone behind her',
    'motionPrompt', 'her chin completes its turn toward the cab and her hand closes harder on the rail, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'Мила видит и рычаг, и Зину, и всё для себя решает раньше, чем вы отъезжаете.', 'MCU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH08';

-- A8_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH09',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the salon mirror filling the frame with a girl''s face reflected small in it, her eyes level and fixed forward, the fogged salon behind her, dash light on the mirror bezel',
    'motionPrompt', 'the reflected eyes drop away from the mirror and the face turns aside in the glass, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'в салонном зеркале ты видишь её глаза раньше, чем она успевает их от тебя отвести.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';

-- A8_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Mila turning her shoulders fully to the window and pulling the headphones back up over her ears with both hands, the aisle and the lit cab left behind her back',
    'motionPrompt', 'the headphones come up over her ears and her shoulders settle square to the window, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'она отворачивается к окну и до своей остановки вперёд больше ни разу не смотрит.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'landscape', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH10';

-- A8_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH11',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the bus stopped at the school shelter with Mila already three paces clear of the door and walking away, her back to the bus, the door still open behind her, other pupils streaming past',
    'motionPrompt', 'she takes two more paces away from the bus and the open door begins to travel shut behind her, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'на своей остановке она выходит первой и не говорит тебе до свидания через плечо.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 6,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 29
WHERE p.slug = 'minibus';

-- A8_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH12',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Mila pushing off the kitchen door frame with her shoulder and dropping her folded arms to her sides, her chin coming up toward the table, the dark hallway behind her',
    'motionPrompt', 'her folded arms drop to her sides and her shoulder comes off the door frame, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'вечером она спрашивает, всегда ли ты так делаешь или только сегодня, в эту пятницу.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 30
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH12';

-- A8_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH13',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg at the table with his face turned down to his own hands and his jaw working once, the ceiling light hard on the grey at his temples, the covered plate untouched at the frame edge',
    'motionPrompt', 'his jaw works once more and his eyes come up level toward the doorway, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты отвечаешь, что план не ждёт, и слышишь свой ответ как будто со стороны.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 30
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH13';

-- A8_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH14',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Mila turning out of the kitchen doorway into the dark hallway with her shoulders already leading, one hand pushing off the frame, the lit kitchen falling away behind her',
    'motionPrompt', 'her hand pushes off the frame and her shoulders carry her a pace into the dark hallway, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'Мила уходит в комнату и с сентября ездит в школу другим маршрутом, с одной пересадкой.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'MILA_TEEN'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 30
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'MILA_TEEN', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'MILA_TEEN'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH14';

-- A8_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH15',
  jsonb_build_object(
    'positive', 'wide shot at eye level, four pupils filing up into the open bus door at the school shelter with a gap left where nobody is standing, backpacks swinging as they climb, low sun crossing the empty pavement',
    'motionPrompt', 'the four waiting pupils shuffle forward to the open door and the gap on the bench stays empty, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'на её остановке ты больше её не видишь, и цена вышла дороже двух минут.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 30
WHERE p.slug = 'minibus';

-- A8_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH16',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Zhanna at the sink with her back three-quarters to camera, setting a washed cup upside down on the drying rack and speaking over her shoulder, the dark window in front of her',
    'motionPrompt', 'the cup goes down onto the rack and her shoulders turn a few degrees back over them, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'Жанна говорит тебе, что девочка просто выросла, и сама себе при этом ни капли не верит.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'landscape', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZHANNA_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 30
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZHANNA_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZHANNA_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH16';

-- A8_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH17',
  jsonb_build_object(
    'positive', 'wide shot at eye level, Oleg standing alone on the terminus asphalt with his hands in his pockets, the parked buses dark behind him, the lit windows of the block rising beyond the fence, one mast light overhead',
    'motionPrompt', 'he shifts his weight onto the other foot and his breath shows once in the mast light, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты стоишь во дворе до половины первого ночи и не поднимаешься к себе домой.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 31
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH17';

-- A8_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH18',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg tipping his head back toward one lit window high in the block and drawing his shoulders in against the cold, his breath showing in the mast light',
    'motionPrompt', 'his chin lifts a few degrees higher and his shoulders draw in further, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в её окне горит настольная лампа, и наушники её ты слышишь даже со двора.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 31
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH18';

-- A8_SH19
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH19',
  jsonb_build_object(
    'positive', 'close-up at eye level, a hand settling onto the door lever in the grey morning light, the fingers curling into the same worn hollow they always take, the windscreen streaked with the night''s rain behind it',
    'motionPrompt', 'the fingers settle into the hollow of the lever and close a few millimetres, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'утром ты снова кладёшь руку на тот же рычаг, и ничего в этой руке не меняется.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 31
WHERE p.slug = 'minibus';

-- A8_SH20
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH20',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg driving with his shoulders square and his eyes deliberately on the far road, his right hand still resting on the lever, the shelter blurring past the side glass beside his head',
    'motionPrompt', 'his eyes stay on the far road and his hand comes off the lever back to the wheel, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'на второй остановке в пятницу ты снова не тормозишь и снова закрываешь круг вовремя.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 31
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A8_SH20';

-- A9_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH01',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus held at the stop line across the frame with its salon windows crowded with heads, the red light burning on its bent post above, two cars idling alongside, evening haze over the junction',
    'motionPrompt', 'the bus settles a centimetre lower on its springs and the crowded heads inside sway once together, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'в тридцать восемь ты стоишь на красном на том же перекрёстке с полным салоном за спиной.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 32
WHERE p.slug = 'minibus';

-- A9_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH02',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg holding the wheel at the bottom of the rim with his head back against the rest, blinking slowly at the red light, the grey at his temples lit by the dash glow',
    'motionPrompt', 'his blink comes slower and his head presses a little further back into the rest, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'за спиной двадцать два человека, а ты на смене уже четырнадцатый час без единого перерыва.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 32
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH02';

-- A9_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH03',
  jsonb_build_object(
    'positive', 'close-up from directly above, two hands on the wheel rim with the fingers uncurling and sliding off the leather, the thumbs dropping away from the rim, dash light along the loosening knuckles',
    'motionPrompt', 'the fingers uncurl further and one hand slides a few centimetres down off the rim, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'руки на руле разжимаются сами, и ты этого в тот момент вообще не чувствуешь.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 32
WHERE p.slug = 'minibus';

-- A9_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg sliding a hand''s width lower in the seat as his chin drops onto his chest and his shoulders go slack, the wheel turning free in front of his loosening hands',
    'motionPrompt', 'his chin drops the last centimetre onto his chest and his shoulders go fully slack, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'две секунды тебя просто нет, и за эти две секунды ничего плохого не происходит.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 32
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH04';

-- A9_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH05',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg''s face snapping up off his chest with his eyes wide and unfocused, the green of the light already washing the windscreen in front of him, his jaw slack',
    'motionPrompt', 'his eyes come into focus and his jaw closes, his head lifting fully off his chest, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты возвращаешься на зелёный и не помнишь, как именно и когда он успел переключиться.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'narrow', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 32
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH05';

-- A9_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH06',
  jsonb_build_object(
    'positive', 'low-angle full-length shot, Oleg standing at the kerb-side pole beside the halted bus with his weight forward, taking the cracked mirror housing in both hands, the pole rising the full height of the frame past his shoulder with a fresh bright scar on it',
    'motionPrompt', 'his hands close on the cracked housing and turn it a few degrees back toward the glass, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'зеркало чиркает по столбу на выезде, и в салоне слышат только один сухой щелчок.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'tall_page', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 33
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH06';

-- A9_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg holding the loose mirror housing against the door with one hand while the other winds insulating tape round its stem, the crack running across the plastic under his fingers',
    'motionPrompt', 'the tape goes round the stem one full turn and his holding hand shifts its grip, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'зеркало держится на одном болте, корпус треснул поперёк, и стекло теперь держится на изоленте.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 33
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH07';

-- A9_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH08',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the packed salon across its full width with every face bent down over a phone or a window, one slack hand sliding along the roof rail and re-gripping, the cab doorway empty and bright at the far end',
    'motionPrompt', 'one slack hand re-grips the roof rail and a phone screen brightens two seats along, the rest holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'в салоне никто не поднимает головы, и никто у тебя за всю дорогу ничего не спрашивает.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'wide', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 33
WHERE p.slug = 'minibus';

-- A9_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH09',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg at the terminus finishing the tape wrap on the mirror stem with his weight on his forward foot, biting the tape off with his teeth, the yellow panel and the wiped windscreen behind his shoulder',
    'motionPrompt', 'the tape parts under his teeth and his hand presses the loose end flat against the stem, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'на конечной ты подматываешь зеркало изолентой за четыре минуты и уходишь на следующий круг.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH09';

-- A9_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH10',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the bus standing in the terminus row with the taped mirror sticking out at a wrong angle from its door, the other buses'' mirrors square and clean beside it, morning light along the line',
    'motionPrompt', 'the taped mirror trembles a few degrees on its stem as the engine turns over, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'шесть тысяч за новый корпус ты не тратишь: план от целого зеркала не меняется.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';

-- A9_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH11',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Oleg standing at the cab door with his weight even and both hands turned palm up in front of his waist, looking down into them, the taped mirror at his shoulder height beside him',
    'motionPrompt', 'his fingers curl in slowly and open again, his shoulders dropping a centimetre, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты выходишь на смену на следующее утро и ещё четыре месяца подряд без пропусков.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'tall', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH11';

-- A9_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH12',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg driving with his head resting back against the rest and one eye closing slower than the other, his hand hooked over the bottom of the wheel, grey pre-dawn light on the glass',
    'motionPrompt', 'his eye closes fully and opens again a beat later, his hand sliding a few centimetres round the rim, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'спишь ты по пять часов в сутки, и на третьем кругу глаза закрываются уже сами.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH12';

-- A9_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH13',
  jsonb_build_object(
    'positive', 'close-up at eye level, the scratched dashboard clock showing a small-hours time with its second hand sweeping, a strip of tape beside it carrying a hand-written lap figure, the plastic bezel dulled by years of dust',
    'motionPrompt', 'the second hand sweeps past the mark and the minute hand ticks one division on, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'в пятом часу утра круг идёт на автомате, и ты его потом не помнишь.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';

-- A9_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH14',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg bent forward at the waist beside the front wheel pouring water from a plastic bottle over the back of his own neck, his other hand braced on the wheel arch, steam off his shoulders in the cold',
    'motionPrompt', 'the water runs off the back of his neck onto the asphalt and his braced arm takes more of his weight, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'на конечной ты умываешься холодной водой из бутылки и через восемь минут выходишь на круг.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'tall', 5,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 34
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH14';

-- A9_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH15',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the same junction with the yellow minibus rolling up to the stop line again, the taped mirror still crooked on its door, the crowded salon glass behind it, the light amber above the bent post',
    'motionPrompt', 'the bus creeps the last metre to the stop line and the amber above it switches to red, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'через четыре месяца ты подъезжаешь к тому же светофору с таким же полным салоном.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 35
WHERE p.slug = 'minibus';

-- A9_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH16',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg snapping upright and locking both hands high on the wheel, his eyes fixing on the red light and his shoulders lifting rigid, dash glow hard under his chin',
    'motionPrompt', 'his grip closes harder on the wheel and his shoulders lift another centimetre, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'на этот раз ты успеваешь испугаться, и страх приходит к тебе с опозданием на четыре месяца.', 'MCU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 35
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH16';

-- A9_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH17',
  jsonb_build_object(
    'positive', 'close-up from directly above, two hands crushing the wheel rim at ten and two with the knuckles blanching, the leather compressing under the grip, dash light hard on the raised tendons',
    'motionPrompt', 'the knuckles whiten a shade further and the leather compresses another millimetre under the grip, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'ты держишь руль двумя руками до самой конечной и ни разу его не отпускаешь.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_cab'), NULL,
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 35
WHERE p.slug = 'minibus';

-- A9_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH18',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, the tin sweet box completely empty in its slot with the bare metal bottom showing across the whole floor of it, a single bus ticket stub lying folded in the dented corner, cold light from the side glass',
    'motionPrompt', 'the folded ticket stub uncurls a few millimetres in the dented corner, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'в субботу ты не выезжаешь на линию, и коробка у рычага остаётся пустой первый раз.', 'ECU', 'top_down', 'push_in',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'square', 3,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 35
WHERE p.slug = 'minibus';

-- A9_SH19
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH19',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow bus standing alone in the terminus row with its windscreen dry and its door shut, another driver''s bus pulling out past it toward the gate, the booth hatch open beyond them',
    'motionPrompt', 'the passing bus clears the standing one and the gate barrier lifts ahead of it, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'твой борт стоит на конечной, а на линию в этот день идёт чужой водитель.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 36
WHERE p.slug = 'minibus';

-- A9_SH20
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH20',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the kitchen across its full width with Oleg seated sideways at the table looking out at the terminus far below through the window, the ringed calendar beside his head with one square left blank',
    'motionPrompt', 'he leans a few centimetres closer to the glass and his forearm slides forward on the table, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'за эту субботу план всё равно записан, и записан он на твою фамилию в тетради.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'wide', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 36
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A9_SH20';

-- A10_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg lowering himself onto the bolted row of chairs with a folder of papers on his knees, four other men already waiting along the same row, numbered doors with taped paper signs behind them',
    'motionPrompt', 'he settles onto the seat and squares the folder on his knees with both hands, the waiting men holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в тридцать девять ты идёшь на комиссию так же, как ходил все эти годы.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 37
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH01';

-- A10_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH02',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the clinic corridor across its full width with one numbered door drifting open on its closer and the light on the linoleum widening through it, the bolted chair row along the far wall, a trolley parked between two doors',
    'motionPrompt', 'one of the numbered doors drifts a few centimetres on its closer and the light on the linoleum shifts, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'справку тебе продлевали одиннадцать раз, и все одиннадцать раз без единого лишнего вопроса.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 37
WHERE p.slug = 'minibus';

-- A10_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg turning his forearm over on the trolley edge as the cuff tightens on his upper arm, his pushed-up sleeve bunching at the elbow, a white sleeve squeezing the bulb beside it',
    'motionPrompt', 'the bulb is squeezed twice and the cuff tightens visibly on his upper arm, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'на манжете загорается цифра, и врач молча меряет тебе давление второй раз, на другой руке.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'narrow', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 37
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH03';

-- A10_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH04',
  jsonb_build_object(
    'positive', 'close-up from directly above, the needle of a blood-pressure gauge dropping back and settling well past the marked band, the cuff edge deflating below it, a pen rolling to a stop on the record card beside',
    'motionPrompt', 'the needle drops back a few degrees and settles still past the marked band, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'второй раз цифра выше первой, а третий раз никто уже делать не станет и не предложит.', 'CU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'narrow', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 37
WHERE p.slug = 'minibus';

-- A10_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg sitting on the bolted chair with his forearms on his knees and his back rounded, his head turning toward a door that has just opened, the folder slipping on his knee',
    'motionPrompt', 'his head turns toward the opened door and the folder slides a few centimetres on his knee, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты сидишь в коридоре полтора часа и слушаешь, как из кабинетов называют чужие фамилии.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'narrow', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 37
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH05';

-- A10_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH06',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg standing in the corridor holding the certificate up at chest height in both hands, his chin down over it and his shoulders drawn in, a stamped box and one hand-written word on the sheet',
    'motionPrompt', 'his thumbs press the sheet flat and his chin lowers a fraction closer to it, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в справке стоит отказ, и рядом от руки дописано одно слово, и слово это временно.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 38
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH06';

-- A10_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH07',
  jsonb_build_object(
    'positive', 'close-up from directly above, the certificate lying on the trolley top with a purple stamp across its lower box and a single word added in ballpoint beneath, two fingertips holding the sheet flat against the metal',
    'motionPrompt', 'the fingertips slide a centimetre down the sheet and hold it flatter against the metal, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'временно означает шесть месяцев, а шести месяцев без плана вы с Жанной уже не выдержите.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'square', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 38
WHERE p.slug = 'minibus';

-- A10_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH08',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg folding the certificate in half against his thigh and lifting his eyes off the corridor floor, his shoulders dropping as the tube light flattens his face',
    'motionPrompt', 'his eyes come up off the floor to the middle distance and his shoulders drop, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты считаешь в уме прямо в коридоре и видишь, что удерживать тебе больше нечего.', 'MCU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'medcom_corridor'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 38
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH08';

-- A10_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH09',
  jsonb_build_object(
    'positive', 'wide shot at eye level, Oleg laying a key set and a folded route sheet on the booth counter while Arkady reaches for them from inside the hatch, the glass-topped shift sheet between their hands, the heater glowing below',
    'motionPrompt', 'the keys leave his fingers onto the counter and Arkady''s hand closes over them, the same two figures throughout the shot, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'ключи ты отдаёшь Аркадию в понедельник вместе с путевым листом и пропуском на площадку.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 38
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH09';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH09';

-- A10_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Arkady standing at the counter unzipping the leather folder and drawing the lease copy out of it, his thumb going straight to one clause partway down the page, the hatch light hard on the paper',
    'motionPrompt', 'his thumb lands on the clause and drags down the page to its end, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'Аркадий достаёт договор аренды из папки и находит нужный пункт с первого раза, не глядя.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ARKADY_MID'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ARKADY_MID', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ARKADY_MID'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH10';

-- A10_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH11',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow bus pulling out of the terminus with a different driver''s shoulders in the cab and the same route number stencilled on the glass, the empty space it leaves in the row behind it',
    'motionPrompt', 'the bus clears the row and the empty rectangle of dry asphalt where it stood opens fully to view, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'в договоре ты арендатор, а арендатор это не работник, а всего лишь вторая сторона.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'terminus_lot'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';

-- A10_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH12',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg turning the pages of the lease copy on the counter one after another with his forefinger, the same signature repeating at the foot of every sheet, his other hand flat on the stack',
    'motionPrompt', 'his forefinger turns two more pages over and stops flat on the third, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'под каждым месяцем в этом договоре стоит твоя подпись, и так одиннадцать лет подряд.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH12';

-- A10_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH13',
  jsonb_build_object(
    'positive', 'close-up from directly above, the last page of the lease fanned open with the same ballpoint signature repeated eleven times down the margin, the counter glass beneath and a chipped mug ring soaked into the paper',
    'motionPrompt', 'the fanned pages spread a centimetre wider and the top sheet slides against the glass, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'стажа по такому договору у тебя ноль дней, и пенсии за эти годы тоже ноль.', 'CU', 'top_down', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'dispatch_booth'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';

-- A10_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH14',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg at the kitchen table holding a small employment book open in both hands with most of its pages blank, his thumbs at the last filled line, the ceiling light hard on the paper',
    'motionPrompt', 'his thumb slides down past the last filled line onto the blank page below it, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в трудовой книжке последняя запись сделана в двадцать восемь лет, ещё в том закрытом цеху.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'square', 4,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH14';

-- A10_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH15',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a woman''s finger tracking along one clause of the lease copy on the laminate table, the plastic shop badge lying beside the paper on its coiled cord, warm ceiling light across the sheet',
    'motionPrompt', 'the finger reaches the end of the clause and taps the paper twice, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'Жанна читает договор дважды и спрашивает, знал ли ты про этот пункт все эти годы.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'landscape', 5,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';

-- A10_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH16',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the kitchen at night with the lease copy spread over the whole table and its top sheet lifting at one corner and settling back, two stools pushed back at different angles, the calendar bare of new rings',
    'motionPrompt', 'the top sheet of the spread lease lifts at one corner and settles back flat, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты знал, и подписывал его каждый год, и каждый год не читал до конца.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'landscape', 6,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 39
WHERE p.slug = 'minibus';

-- A10_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH17',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg stepping in under the shelter panel out of the drizzle with his shoulders drawn up and his hands going into his pockets, three other people already waiting along the bench',
    'motionPrompt', 'his hands push fully into his pockets and his shoulders draw up another centimetre, the waiting people holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'на работу ты ездишь автобусом и стоишь на остановке вместе со всеми, без всякого жетона.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 40
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH17';

-- A10_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH18',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg turned to face the road with his chin level, looking up the avenue for a bus, the scratched shelter panel and the bleached timetable just behind his shoulder',
    'motionPrompt', 'his chin turns a few degrees further up the avenue and holds, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'первый раз ты стоишь под этим навесом с той стороны стекла, снаружи, вместе со всеми.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 40
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'A10_SH18';

-- A10_SH19
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH19',
  jsonb_build_object(
    'positive', 'close-up from directly above, a new cardboard travel pass being pushed into a clouded plastic sleeve by two thick fingers, the perished elastic band lying beside it on a table edge, hard office light on the plastic',
    'motionPrompt', 'the card slides fully home into the sleeve and the fingers withdraw from its mouth, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'top_down', 'movement', 'static')
  ),
  'проездной тебе выписывают в собесе, и он точно такой же, как у Зины, в файлике.', 'CU', 'top_down', 'static',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'TRAVEL_PASS'),
  'animated', cp.id, 'square', 2,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 40
WHERE p.slug = 'minibus';

-- A10_SH20
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A10_SH20',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, thick fingers working the pin of a brass route-number badge out of a jacket pocket flap, the fabric dimpled where the pin has sat for years, the badge tilting forward as it comes free',
    'motionPrompt', 'the pin comes clear of the fabric and the badge tilts forward into the fingers, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'латунный жетон с номером маршрута ты снимаешь с кармана сам, и просить об этом никто не стал.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'flat_kitchen_ol'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A10'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 40
WHERE p.slug = 'minibus';

-- FIN_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Oleg stepping in under the shelter at dawn with his weight settling onto both feet and his hands going into his coat pockets, the bench with its missing slat behind him, the road empty in both directions',
    'motionPrompt', 'his weight settles fully onto both feet and his hands push down into the pockets, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в шесть десять ты приходишь на вторую остановку и встаёшь под навес ждать свой борт.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 41
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH01';

-- FIN_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH02',
  jsonb_build_object(
    'positive', 'close-up at eye level, Zina''s face turning toward him under the grey headscarf with her chin lifting, one hand still closed on the trolley handle at the frame edge, one new black wheel bright against the worn checked fabric',
    'motionPrompt', 'her chin lifts further and her eyes travel up to his face, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'Зина стоит там же, тележка у неё та же, только колесо на ней новое.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 41
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH02';

-- FIN_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Zina turned square to him with the trolley pulled in against her leg, one hand lifting off the handle toward the road in a question, her mouth moving under the knotted scarf',
    'motionPrompt', 'her lifted hand opens toward the road and comes back down onto the handle, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'она узнаёт тебя, здоровается и спрашивает, почему ты сегодня стоишь тут, а не за рулём.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 41
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH03';

-- FIN_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the breast pocket of a black softshell jacket with two small pin holes left empty in the fabric, a thick thumb passing flat over the holes, dawn light raking the weave',
    'motionPrompt', 'the thumb passes over the pin holes and stops on them, pressing the fabric flat, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты отвечаешь, что по здоровью, и правда в этом ответе есть, но не вся.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 3,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 41
WHERE p.slug = 'minibus';

-- FIN_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the yellow minibus swinging in to the kerb with a young driver''s forearms visible on the wheel through the windscreen, the familiar route number stencilled on the glass in front of him',
    'motionPrompt', 'the bus rolls the last metre into the kerb and the young driver''s forearm comes off the wheel to the door lever, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'твой борт подходит в шесть двенадцать, и за рулём в нём парень лет двадцати пяти.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';

-- FIN_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH06',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the bus stopped square to the shelter with its door fully open and the old woman lifting her trolley onto the step, nobody else moving toward the door, the driver''s arm resting along the sill',
    'motionPrompt', 'the trolley''s second wheel comes up onto the step and the driver''s arm stays where it is along the sill, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'он ждёт, пока Зина заведёт тележку, и на часы за это время не смотрит.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';

-- FIN_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH07',
  jsonb_build_object(
    'positive', 'close-up at eye level, Zina turning back from inside the doorway with her chin coming round over her shoulder and her hand tightening on the frame, the trolley already in ahead of her',
    'motionPrompt', 'her chin comes further round over her shoulder and her hand tightens on the frame, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'Зина поднимается на ступеньку и оборачивается на тебя из проёма, зовёт рукой за собой.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'ZINA_OLD'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'ZINA_OLD', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'ZINA_OLD'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH07';

-- FIN_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH08',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg standing with his weight even and his hands still in his pockets, dipping his chin once toward the open door with his feet planted, the bus panel bright behind him',
    'motionPrompt', 'his chin dips once and comes back level, his feet staying where they are, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты не двигаешься с места и объяснять ей ничего в этот раз не пробуешь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 3,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH08';

-- FIN_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH09',
  jsonb_build_object(
    'positive', 'close-up at eye level, a young hand pulling the door lever back inside the cab glass while the door panel travels across the frame in front of it, the shelter reflected in the moving glass',
    'motionPrompt', 'the lever comes back under the young hand and the door panel travels across into the seal, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'дверь закрывается перед тобой, и рычаг за стеклом ведёт совсем другая, молодая, чужая рука.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 4,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';

-- FIN_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the rear of the minibus pulling away from the kerb with the route number stencilled on its back glass, the old woman''s headscarf visible through the rear window, spray off the wheels',
    'motionPrompt', 'the bus gains a length off the kerb and the stencilled number on its back glass shrinks, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'борт уходит с твоим номером на стекле и без тебя внутри, и так теперь будет всегда.', 'MS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 5,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';

-- FIN_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH11',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the shelter across its full width with Oleg alone under the panel and the road empty in both directions, the bench with its missing slat beside him, the hospital wall grey across the way',
    'motionPrompt', 'he shifts his weight onto the other foot and the empty road holds still in both directions, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'под навесом остаёшься ты один, и до следующего борта по расписанию ровно один час.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 6,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 42
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH11';

-- FIN_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH12',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg lowering himself onto the shelter bench with one hand on its frame and his knee taking the gap where the slat is missing, his coat riding up at the shoulders',
    'motionPrompt', 'he settles onto the bench and his hand comes off the frame onto his own knee, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты садишься на лавку, где не хватает одной доски, и начинаешь ждать как все.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 0,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 43
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH12';

-- FIN_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH13',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the avenue across its full width with a road-washing truck passing left to right and its spray arc crossing the empty kerb, the shelter frame at the near edge, wet stone shining behind it',
    'motionPrompt', 'the spray arc from the truck sweeps across the kerb stones and the water runs into the gutter, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'за этот час мимо проходят четыре чужих борта, одна поливальная машина и ни одного твоего.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 43
WHERE p.slug = 'minibus';

-- FIN_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH14',
  jsonb_build_object(
    'positive', 'low-angle full-length shot, Oleg standing alone under the shelter with his weight even and the clouded pass sleeve held ready in his lowered hand, the steel frame rising the full height of the frame past his shoulder into grey sky',
    'motionPrompt', 'his lowered hand turns the pass sleeve a few degrees toward the road and holds it there, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'проездной ты держишь в руке заранее, чтобы никого за собой на ступеньке не задержать.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'tall_page', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 43
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH14';

-- FIN_SH15
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH15',
  jsonb_build_object(
    'positive', 'medium shot at eye level, another yellow minibus pulling in to the kerb with a different driver leaning across to work the door lever, a stranger''s face over the wheel, the same worn kerb dip under the wheels',
    'motionPrompt', 'the driver leans across and the door starts along its runner toward the open, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'следующий борт подходит в семь десять, и водитель в нём тебе уже совсем незнаком.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'landscape', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 44
WHERE p.slug = 'minibus';

-- FIN_SH16
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH16',
  jsonb_build_object(
    'positive', 'close-up at eye level, Oleg''s face and shoulder framed in the doorway as he brings his weight up onto the step, his hand closing on the frame above his head, cab light warm on one side of his face',
    'motionPrompt', 'his weight comes fully onto the step and his hand slides higher on the frame, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты поднимаешься по ступеньке и первый раз чувствуешь, сколько времени и сил на неё уходит.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stop_shelter'), NULL,
  'animated', cp.id, 'square', 1,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 44
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH16';

-- FIN_SH17
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH17',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Oleg standing on the rear platform with one hand up on the roof rail and his shoulders squared to the aisle, the packed seats and the lit cab running away in front of him',
    'motionPrompt', 'his hand slides along the roof rail and re-grips as the floor shifts under him, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'если ты досмотрел эту историю до конца, подпишись и посмотри другие истории на канале.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'square', 2,
  (SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2."characterId" WHERE c2."projectId" = p.id AND cp2."profileCode" = 'OLEG_LATE'),
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 44
WHERE p.slug = 'minibus';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'OLEG_LATE', cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = 'OLEG_LATE'
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = 'minibus' AND s."shotCode" = 'FIN_SH17';

-- FIN_SH18
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH18',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a thick work-worn hand releasing three coins into a lidless tin sweet box wedged beside a gearshift, the box already holding notes and coins, the bare metal bottom showing under them',
    'motionPrompt', 'the three coins leave the fingers and drop into the box, settling flat against the notes, the same hands already in frame throughout the shot, every other surface holding its exact position, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'твоя рука опускает монеты в жестяную коробку у чужого рычага, ровно тридцать пять, как все.', 'ECU', 'top_down', 'push_in',
  NULL, (SELECT pr.id FROM props pr WHERE pr."projectId" = p.id AND pr.code = 'COIN_TIN'),
  'animated', cp.id, 'square', 3,
  NULL,
  false, true,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 44
WHERE p.slug = 'minibus';

-- FIN_SH19
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH19',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the salon across its full width from the rear platform, the young driver''s shoulders square to the road in the lit cab ahead, standing passengers filling the near half of the aisle, the coin box beside his hand',
    'motionPrompt', 'the driver''s shoulders stay square to the road and one standing passenger sways once, the rest holding their places, only the foreground figure moves, the background figures holding their places with only the smallest shifts of weight, the illustration in motion, hand-drawn animation cadence',
    'motionNegative', 'new people entering frame, additional figures, duplicate person, twin, clone, anime character, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'водитель не оборачивается, и ты уже не ждёшь от него, что он вообще обернётся.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'minibus_salon'), NULL,
  'animated', cp.id, 'wide', 0,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 45
WHERE p.slug = 'minibus';

-- FIN_SH20
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'FIN_SH20',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the yellow minibus crossing the junction away from camera in the morning traffic, its route number small on the back glass, wires crossing above and the light green on its bent post',
    'motionPrompt', 'the bus draws further across the junction and the green light holds above the bent post, the place stays deserted, every surface and object holding its exact position, only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence',
    'motionNegative', 'people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, manga character, extra humans appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'эта история вымышлена, все совпадения с реальными людьми и событиями совершенно случайны.', 'WS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'crossroads_light'), NULL,
  'animated', cp.id, 'wide', 1,
  NULL,
  false, false,
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'FIN'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 45
WHERE p.slug = 'minibus';

COMMIT;
