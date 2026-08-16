-- СГЕНЕРИРОВАНО scripts/seed_safecracker_shots.py — не править руками.
BEGIN;

-- A1_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH01',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the full width of a night landing, a woman''s flat palms pressed against a padded brown door and Vlad''s shoulders and bent head low at the lock beneath them, a caged bulb throwing both shadows up the wall',
    'motionPrompt', 'he settles his shoulder lower and his free hand finds the doorframe while she strikes the door twice with the flat of her hand, the flat booming knock and the ring of a small tool set down on concrete, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'track_lateral')
  ),
  'ты на коленях у чужой двери в три часа ночи, и за этой дверью на плите стоит забытый чайник.', 'WS', 'eye', 'track_lateral',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his head has dropped closer to the lock and her hands have slid down the door, the shadows on the wall now stretched further up.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH01';

-- A1_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH02',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s right hand at the keyhole holding a thin copper probe between two fingertips, his eyes closed and his face turned away from the door toward the empty stairwell',
    'motionPrompt', 'the probe slides a fraction deeper and his jaw sets as he listens, the dry scrape of metal inside the cylinder and a bulb humming above, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'у тебя в пальцах медный щуп толщиной в полмиллиметра, ты не смотришь на замок и вообще ни на что не смотришь.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'narrow', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the probe has gone slightly deeper and his eyebrows have drawn together, his face still turned away.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH02';

-- A1_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, a dark-haired woman in a coat thrown over a nightdress standing against the opposite door with one hand at her collar, her braid loose over her shoulder',
    'motionPrompt', 'she pushes off the door and takes half a step forward then stops herself, the rustle of a coat and a short indrawn breath, a tap dripping somewhere behind a wall, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'женщина за твоей спиной третий раз повторяет, что дочери четыре года и что она спит в дальней комнате.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'she has come half a step nearer and her hand has dropped from her collar to her side.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH03';

-- A1_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the brass keyhole of a mortice lock filling the frame, the tip of a thin copper probe just inside it, scratched paint and worn metal around the escutcheon',
    'motionPrompt', 'the probe tip rotates a few degrees and stops, a faint metallic click deep inside the cylinder and then a second click a beat later, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'четвёртый штифт всегда садится позже остальных, и ты ждёшь именно его, потому что раньше него дверь не откроется.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'narrow', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the probe has rotated a little further and now sits still inside the keyhole.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'safecracker';

-- A1_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH05',
  jsonb_build_object(
    'positive', 'medium shot from a low angle, Vlad still kneeling as the padded door swings inward past his shoulder, his hand flat on the floor to steady himself, warm light from the flat falling across his face',
    'motionPrompt', 'the door swings inward and he leans back on his heels and stays down at the lock, the heavy sigh of a padded door opening and a gas ring hissing somewhere inside, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'ты открываешь её за девяносто секунд, не поднимаясь с колен и ни разу не притронувшись к сверлу.', 'MS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'narrow', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the door has opened wider and he has leaned further back on his heels, the light on his face now broader.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 0
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH05';

-- A1_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the woman passing through the open doorway with her coat flaring behind her, the hall beyond lit yellow, Vlad''s shoulder blurred at the edge of frame',
    'motionPrompt', 'she passes through the doorway and the coat flares behind her, quick footsteps on lino and the small squeak of a gas tap being turned shut, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'она пробегает мимо тебя так, что задевает плечом, и через секунду ты слышишь, как в кухне закрывают газ.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'she is further into the hall with her back fully turned, the coat settling against her legs.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH06';

-- A1_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH07',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad standing at the landing rail rolling a cloth tool wrap closed against his thigh, a folded note pushed into his breast pocket beside the copper probe',
    'motionPrompt', 'he rolls the cloth wrap closed and taps the pocket flat with two fingers, the soft slap of cloth and the click of the probe against a button, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты сматываешь инструмент в тряпочный свёрток и берёшь с неё пять тысяч купонов, столько же, сколько взял бы днём.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the wrap is fully rolled and tucked under his arm, his hand lowered from the pocket.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH07';

-- A1_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH08',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, a heavy ginger man in a long leather coat standing half a flight below on the concrete steps, one hand on the pipe handrail, his face lifted toward the landing',
    'motionPrompt', 'he lifts his chin a little and his hand slides an inch along the handrail, the faint squeak of a palm on painted steel and cold air moving in the stairwell, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'на пол-этажа ниже стоит человек, который поднялся сюда не к своей двери.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'tall', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'his chin is lifted higher and his hand has slid further along the rail toward the upper step.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH08';

-- A1_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH09',
  jsonb_build_object(
    'positive', 'close-up at eye level, the ginger man''s face turned up in the stairwell gloom, pale blue eyes tracking something low and to the side, a broad flat signet ring visible on the hand at the rail',
    'motionPrompt', 'his eyes track slowly downward and to the side and his mouth stays closed, only the hum of the caged bulb and a distant door closing two floors down, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'он стоит на пол-этажа ниже уже минут десять и смотрит не на дверь.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'his eyes have finished tracking downward and now hold still, his head tilted a fraction further.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH09';

-- A1_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH10',
  jsonb_build_object(
    'positive', 'extreme close-up from a high angle, Vlad''s two hands folding the cloth wrap, the narrow scar across his right index knuckle catching the bulb light, the copper probe lying across his palm',
    'motionPrompt', 'the fingers fold the last flap over the probe and press it down, the dry rustle of cloth and a single soft metallic tap, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'high', 'movement', 'push_in')
  ),
  'он смотрит на твои руки, и это первый человек за восемь лет, который смотрит именно туда.', 'ECU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'square', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the flap is folded flat and the probe is hidden, the fingers now resting still on the bundle.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH10';

-- A1_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH11',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, the ginger man turning away down the steps, his leather coat swinging wide at the hem, one hand still trailing on the handrail',
    'motionPrompt', 'he turns and starts down the steps with the coat swinging out behind him, unhurried heavy footfalls descending and fading, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'он ничего не говорит и уходит вниз, но лестница у вас на весь дом одна.', 'FS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'tall', 5,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'he is three steps lower with his back fully turned, the coat hem still swinging.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 1
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH11';

-- A1_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH12',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, Vlad standing alone on the landing under the caged bulb with the cloth wrap under his arm, the stairwell rising away above him in shadow',
    'motionPrompt', 'he shifts his weight onto one hip and looks up the stairwell after the sound, the last footsteps fading below and the bulb buzzing steadily, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'тебе двадцать восемь, и ты умеешь то, чего в этом городе не умеет почти никто.', 'FS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'tall_page', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his head has turned further up the stairwell and his weight has settled fully onto one hip.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 2
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH12';

-- A1_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH13',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face lit from one side by the caged bulb, his jaw tight, his eyes still fixed on the empty stairwell below',
    'motionPrompt', 'his eyes stay fixed downward and he lets out a breath through his nose, the buzz of the bulb and a car passing far outside, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'сейчас я расскажу, как это умение открыло тебе четыреста чужих дверей и заперло изнутри одну твою.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyes have lowered slightly and his mouth has closed harder, the breath finished.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 2
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A1_SH13';

-- A1_SH14
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A1_SH14',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the empty landing across its full width, the open flat door spilling warm light onto olive walls, a folded pram against the wall and the caged bulb above',
    'motionPrompt', 'the door drifts a few centimetres on its hinges and the light on the wall narrows, the slow creak of a hinge and a gas ring still hissing inside, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'если хочешь знать, чем именно ты за это заплатишь, оставайся до конца и подпишись.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'wide', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the door has drifted almost closed and the band of warm light on the wall is much narrower.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A1'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 2
WHERE p.slug = 'safecracker';

-- A2_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, a stooped grey-haired fitter in a stained brown coat setting a hand drill against a tall wooden door, a tape measure hanging round his neck, wood dust already on the floor',
    'motionPrompt', 'he leans his weight into the drill and it bites into the brass, the rising whine of a drill motor and the rattle of curling swarf falling on concrete, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в семьдесят девятом отец теряет ключи от квартиры, и слесарь из жэка приходит на четвёртый этаж со сверлом.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'landing_1979'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'FITTER_OLD'),
  'the drill has sunk further into the lock face and more swarf has gathered at his feet.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'FITTER_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'FITTER_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH01';

-- A2_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH02',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the brass lock face of a wooden door with a drill bit tearing a ragged hole through the escutcheon, bright curls of metal peeling out of it',
    'motionPrompt', 'the bit pushes deeper and the ragged hole widens as swarf peels away, the hard grind of steel on brass and a small sharp crack inside the lock, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'тебе тринадцать лет, и ты первый раз в жизни видишь, как убивают исправный механизм.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'landing_1979'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the hole is wider and torn open at one edge, a longer curl of metal hanging from it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'safecracker';

-- A2_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH03',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, a thin fair-haired boy of thirteen in a brown school jacket watching from two paces back, his shoulders drawn up and his hands pushed into his pockets',
    'motionPrompt', 'his shoulders draw up a little higher and he turns his face a few degrees away from the noise, the drill grinding on behind him and dust settling in the air, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты стоишь в двух шагах от него, и тебе физически неприятно слышать, как сверло грызёт латунь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'landing_1979'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'his face is turned further away and his shoulders have risen closer to his ears.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH03';

-- A2_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH04',
  jsonb_build_object(
    'positive', 'insert shot from directly above, a galvanised bucket with a ruined brass cylinder lying on top of rags and broken screws, wood dust drifting down onto it',
    'motionPrompt', 'the cylinder settles a centimetre deeper into the rags as dust drifts down onto it, the dull clank of metal on a galvanised rim, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'INSERT', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'сломанный цилиндр слесарь бросает в оцинкованное ведро, и никто из взрослых не смотрит, куда он падает.', 'INSERT', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'landing_1979'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the cylinder has settled deeper and is half covered by a fine layer of dust.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 3
WHERE p.slug = 'safecracker';

-- A2_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the boy crouched over a galvanised bucket on an empty landing, one hand reaching in, his school jacket open and his sleeve pushed back',
    'motionPrompt', 'his hand closes on the cylinder and lifts it clear of the rags, the scrape of metal against the bucket rim and voices behind a closed door, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты достаёшь его оттуда через сорок минут, когда все уже сидят на кухне и пьют чай.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'landing_1979'),
  'animated', cp.id, 'narrow', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'the cylinder is out of the bucket and held against his chest, his other hand steadying it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH05';

-- A2_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH06',
  jsonb_build_object(
    'positive', 'close-up from a high angle, the boy''s hands on an oilcloth table laying six small brass pins in a row by height, the opened cylinder beside them, a jam jar holding the springs',
    'motionPrompt', 'his fingers set the last pin at the end of the row and square it up with a fingernail, tiny metallic ticks as each pin touches the oilcloth, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'high', 'movement', 'push_in')
  ),
  'дома ты разбираешь его на кухонном столе и раскладываешь шесть латунных штифтов по росту, от короткого к длинному.', 'CU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'the row of six pins is complete and straight, his hand withdrawn to the edge of the table.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH06';

-- A2_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the boy holding one brass pin up against the kitchen window light between finger and thumb, his eye narrowed, the other five pins on the cloth below',
    'motionPrompt', 'he turns the pin a slow half-revolution against the window light, a faint click as it touches his thumbnail and a radio murmuring in another room, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'четвёртый оказывается длиннее остальных на треть миллиметра, и это ты запоминаешь на всю оставшуюся жизнь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'the pin has turned a half-revolution and his eye is narrowed further.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH07';

-- A2_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH08',
  jsonb_build_object(
    'positive', 'medium shot at eye level, a taller version of the same fair-haired boy at a pedestal grinder in a school metalwork room, a thin strip of copper held to the wheel, sparks arcing down to the floor',
    'motionPrompt', 'he eases the copper strip against the wheel and a fan of sparks arcs down to the concrete, the rising howl of a grinder and the crackle of sparks, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'в семнадцать лет ты точишь на школьном наждаке медную полоску, пока она не становится тоньше полумиллиметра.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'landscape', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'the copper strip is thinner and his hands have moved further along it, the spark fan shorter.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH08';

-- A2_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH09',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the boy at a scarred workbench testing the finished copper probe against his own fingertip, high wire-glass windows behind him full of chalky light',
    'motionPrompt', 'he rolls the finished probe once between finger and thumb and presses the tip to his fingertip, a small dry squeak of copper on skin and a vice being wound somewhere behind, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты делаешь её под свои пальцы и под свою руку, и другому человеку она не подойдёт никогда.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'landscape', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'the probe has rolled a half turn and now rests flat along his index finger.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 4
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH09';

-- A2_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH10',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a school metalwork room across its full width, eight steel benches in two rows with heavy vices, a wall board of tool outlines half of them empty, dust hanging in window light',
    'motionPrompt', 'dust drifts slowly through the shafts of window light above the benches, the low hum of a grinder winding down and a loose window pane ticking, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pan_right')
  ),
  'в этой мастерской восемь верстаков, и ни один из них не научил тебя ничему полезнее.', 'WS', 'eye', 'pan_right',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the dust has drifted further across the light shafts and settled lower over the benches.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'safecracker';

-- A2_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH11',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, the seventeen-year-old standing in the workshop doorway with his jacket on, one hand flat over his breast pocket, the benches receding behind him',
    'motionPrompt', 'his hand presses flat over the breast pocket and stays there as he turns to the door, the click of a light switch and a door beginning to swing, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'ты выходишь из этой мастерской с одной вещью в нагрудном кармане и носишь её следующие сорок три года.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'tall', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'he has turned further toward the doorway, his hand still flat on the pocket and his shoulder past the frame.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH11';

-- A2_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH12',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the thin copper probe lying alone on a scarred oiled bench top, its ground tip catching a single line of light, brass filings scattered around it',
    'motionPrompt', 'a filing rolls a few millimetres along the bench and stops against the probe, one small metallic tick and the settling creak of a wooden building, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'медь мягче стали и поэтому чувствует то, чего сталь не чувствует, и в этом весь фокус.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the filing has come to rest touching the probe, the line of light on the tip slightly narrower.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'safecracker';

-- A2_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A2_SH13',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the young man at the workshop bench with a row of six cut-away practice cylinders clamped in the vice, his hand on the last of them',
    'motionPrompt', 'his hand moves steadily from one clamped cylinder to the next along the row, a sequence of small clicks running down the line, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'к восемьдесят шестому ты умеешь открывать всё, что в этой стране вешают на жилые двери.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'school_workshop_83'),
  'animated', cp.id, 'tall', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_KID'),
  'his hand has reached the last cylinder in the row and rests on it, the earlier ones left turned open.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A2'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 5
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A2_SH13';

-- A3_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH01',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad seated behind a scratched wooden counter inside a cramped repair booth, a board of hundreds of key blanks on nails filling the wall behind his shoulder',
    'motionPrompt', 'he turns a key blank over twice in his fingers and sets it down on the counter, the light rattle of blanks knocking on their nails and a fan heater running, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'с восемьдесят шестого года ты сидишь в будке металлоремонта размером два метра на три.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the blank is lying flat on the counter and his hand has moved back to the machine.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH01';

-- A3_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH02',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the hatch window of the booth from inside, a queue of coats and hands visible through the sliding glass, Vlad at the cutting machine with his back half turned to them',
    'motionPrompt', 'he presses the blank against the cutter wheel and sparks jump under his hands, the high whine of the cutting wheel and coins being counted on the outside counter, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track_lateral')
  ),
  'за день через твою форточку проходит сорок ключей и три человека, потерявших всё сразу.', 'MS', 'eye', 'track_lateral',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the cut blank is further along the wheel and the sparks have thinned, his shoulders lowered.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH02';

-- A3_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH03',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face lit from one side by a fluorescent tube, reading glasses pushed up on his forehead, his eyes lowered to something out of frame below',
    'motionPrompt', 'his eyes stay lowered and his head tilts a few degrees to one side as he listens, a faint sequence of clicks close to the microphone and the tube buzzing, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты единственный мастер в районе, кто не берётся за сверло, и за это тебе прощают очередь на сорок минут.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his head has tilted a little further and his eyes have closed.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH03';

-- A3_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, a cut-away practice cylinder standing on a bench under a swan-neck lamp, six brass pins visible through the cutaway, the copper probe lying beside it',
    'motionPrompt', 'one pin drops a millimetre inside the cutaway and the others stay where they are, a single soft click and the hum of a bench lamp, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'у тебя одно правило на все девять лет вперёд: сначала слушать, и только потом трогать.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the dropped pin has settled fully and a second pin has begun to fall behind it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 6
WHERE p.slug = 'safecracker';

-- A3_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the dark-haired woman with the braid standing at the hatch window from outside, a small mailbox lock held out on her open palm, her cardigan buttoned to the throat',
    'motionPrompt', 'she holds the small lock out further on her open palm and her fingers close and open once, the tiny rattle of a mailbox lock and rain starting on the awning above, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в восемьдесят девятом ты женишься на женщине, которая пришла чинить замок от почтового ящика.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'the lock is closer to the hatch and her fingers have closed around it again.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH05';

-- A3_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the woman standing at a kitchen table with a bunch of old keys on a ring in her hand, courtyard trees filling the window behind her',
    'motionPrompt', 'she lifts the ring of keys and lets them turn once on her finger, the bright jangle of old keys and a kettle beginning to tick on the stove, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'в девяностом у вас рождается сын, и ты вешаешь над его кроватью связку старых ключей вместо погремушки.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'the keys have finished turning and hang still, her hand lowered a little.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH06';

-- A3_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH07',
  jsonb_build_object(
    'positive', 'close-up from a high angle, a bunch of worn keys on a steel ring hanging from a nail above a child''s cot rail, painted wallpaper behind, evening light low across them',
    'motionPrompt', 'the ring of keys swings a few degrees and slows to a stop, a slow diminishing jangle and a child''s breathing close by, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'high', 'movement', 'static')
  ),
  'он засыпает под этот звон, и ты считаешь это хорошей приметой.', 'CU', 'high', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the keys hang nearly still, one key resting against another.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';

-- A3_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH08',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad at the booth counter counting a thick brick of low-denomination notes with a rubber band around it, his expression flat',
    'motionPrompt', 'his thumb riffles through the brick of notes twice and he squares the edge on the counter, the dry flutter of paper and the snap of a rubber band, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'к девяносто третьему деньги в стране меняются трижды, а замки на дверях остаются ровно те же.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the notes are squared into a neat block and his thumb has stopped moving.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH08';

-- A3_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH09',
  jsonb_build_object(
    'positive', 'insert shot from directly above, a scratched wooden counter with three cut keys, a folded devalued banknote and a handwritten price card weighted down by a spring jar',
    'motionPrompt', 'the price card lifts at one corner in the heater draught and settles back down, the small flap of card and a fan heater running steadily, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'INSERT', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'за один ключ ты берёшь столько, сколько вчера стоил проезд через весь город, и это никого не смешит.', 'INSERT', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the card has settled flat again, one key nudged slightly out of line.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';

-- A3_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad walking between market rows of converted containers and trestle tables hung with jeans and boxes, traders standing with hands inside their sleeves',
    'motionPrompt', 'he keeps an even pace between the tables and passes two traders, duckboards knocking underfoot and a cassette player playing thinly from a crate, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'ты ходишь через рынок домой и видишь, как быстро у людей появляются вещи.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'landscape', 5,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is further down the row with his back three-quarters turned, the tables behind him.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH10';

-- A3_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad stopped in the market aisle looking at a container end fitted with a new steel door and two heavy padlocks, his hand resting on the strap of his bag',
    'motionPrompt', 'his head turns a few degrees to follow the steel door as he passes and his hand tightens on the strap, the clank of a padlock knocked by wind and awnings snapping, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'и как быстро у них появляются двери, которые все эти вещи должны стеречь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'landscape', 6,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his head has turned further toward the door and his grip on the strap is tighter.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 7
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH11';

-- A3_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a market row across its full width in flat grey daylight, a line of container ends each fitted with a new steel door and padlocks, muddy duckboards running between them',
    'motionPrompt', 'the awnings lift and drop along the row and a loose sheet of plastic flaps, the snap of canvas and the knock of a padlock against steel, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pan_left')
  ),
  'в этом городе за три года появляется больше стальных дверей, чем за предыдущие тридцать.', 'WS', 'eye', 'pan_left',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the awnings have settled lower and the plastic sheet has folded over on itself.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'safecracker';

-- A3_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A3_SH13',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the full width of the repair booth hatch from the street, the ginger man in the long leather coat standing at the counter with both forearms on it, the queue behind him gone',
    'motionPrompt', 'he sets both forearms on the counter and leans his weight into it, the wooden counter creaking and the sliding glass panel rattling once, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'а через полгода после той ночи человек с лестницы находит твою будку и становится в очередь.', 'WS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'wide', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'he has leaned further in over the counter and his head is lower, closer to the hatch.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A3'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 8
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A3_SH13';

-- A4_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH01',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, the ginger man standing square at the booth hatch in his long leather coat, one hand flat on the counter, the signet ring catching the tube light',
    'motionPrompt', 'he lifts one hand off the counter and turns it palm up, the creak of leather and a light tap of a ring on wood, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'он не просит открыть, он просит посмотреть.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'tall', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'his palm is fully turned up and his other hand has come off the counter.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH01';

-- A4_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH02',
  jsonb_build_object(
    'positive', 'insert shot from directly above, a scratched counter with a colour photograph of a steel personnel door and two padlocks lying on it, a single hundred-dollar note folded under one corner',
    'motionPrompt', 'the photograph slides two centimetres across the counter and stops against the spring jar, the slide of paper on wood and a fan heater running, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'INSERT', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'на прилавок ложится фотография железной двери и двести долларов одной бумажкой.', 'INSERT', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the photograph has come to rest against the jar with the note still trapped under its corner.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'safecracker';

-- A4_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH03',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad holding the photograph up close to the fluorescent tube with both hands, his glasses pulled down onto his nose, the blank board behind him',
    'motionPrompt', 'he tilts the photograph twice toward the tube and his lips move silently, the faint crackle of photographic paper and the tube buzzing, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты смотришь на неё пятнадцать секунд и называешь марку, год выпуска и слабое место.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'tall', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the photograph is tilted flatter to the light and his glasses have slid lower on his nose.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH03';

-- A4_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH04',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the interior of the booth across its full width, the counter with the photograph gone and the folded note lying alone on the wood, the hatch glass slid shut',
    'motionPrompt', 'the hatch glass slides the last centimetre closed on its own weight and the note lifts at one corner, the rattle of glass in its runner and the heater fan, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты не притронулся ни к одной чужой двери и заработал столько, сколько в будке зарабатываешь за три месяца.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'wide', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the hatch is fully closed and the note has settled flat again on the counter.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 9
WHERE p.slug = 'safecracker';

-- A4_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad standing at the kitchen table lifting the edge of the oilcloth with two fingers, the folded note half slid underneath it, the window dark behind him',
    'motionPrompt', 'he lowers the oilcloth edge flat over the note and smooths it once with his palm, the soft drag of oilcloth and a fridge motor starting up, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'дома ты кладёшь эти деньги под клеёнку на кухонном столе и три дня к ним не притрагиваешься.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the oilcloth is flat and the note is hidden, his palm resting still on the table.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH05';

-- A4_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the dark-haired woman standing in the kitchen doorway with a towel over her shoulder, looking toward the table, her braid over the other shoulder',
    'motionPrompt', 'she takes the towel off her shoulder and folds it once against her chest and stays in the doorway, the rustle of cloth and a tap running briefly in another room, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'жена спрашивает, откуда, и ты отвечаешь честно: за консультацию.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'the towel is folded smaller against her chest and her head has turned toward the table.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH06';

-- A4_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad''s face at the kitchen table lit low by the overhead bulb, his eyes on the oilcloth in front of him, his hands out of frame',
    'motionPrompt', 'his eyes stay down on the oilcloth and he breathes out slowly through his nose, only the fridge motor and a clock ticking on the wall, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'и это чистая правда, потому что ты действительно ничего не открывал и внутрь не заходил.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyes have lifted slightly toward the window and his mouth has closed harder.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH07';

-- A4_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH08',
  jsonb_build_object(
    'positive', 'close-up at eye level, the ginger man''s face under a floodlight in a depot yard, the collar of the leather coat up, breath visible, the signet hand raised near his chin',
    'motionPrompt', 'his hand comes up near his chin and one finger points past the camera, breath audible in the cold and a floodlight ballast humming, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'через месяц он приходит снова, и на этот раз фотографии в руках у него нет.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'narrow', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'his finger has fully extended past the frame edge and his chin has turned to follow it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH08';

-- A4_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH09',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing alone in the hard cone of a yard floodlight facing a steel personnel door with two padlocks, the corners of the yard completely black',
    'motionPrompt', 'he shifts his weight from one foot to the other and does not step forward, gravel grinding under a boot and a wire fence ringing in the wind, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'он привозит тебя во двор оптового склада в половине первого ночи и просто стоит рядом.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'narrow', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he has shifted fully onto the other foot and turned a few degrees toward the door.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 10
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH09';

-- A4_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad turned away from the steel door with one hand raised flat, the ginger man''s shoulder at the edge of frame, floodlight from behind them both',
    'motionPrompt', 'he raises one hand flat and holds it there steady at shoulder height, wind moving across an open yard and a distant train coupling, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты говоришь ему, что не полезешь, и он соглашается с первого раза.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his raised hand has begun to lower and his shoulders have turned further away from the door.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH10';

-- A4_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the ginger man half-lit by the floodlight, one side of his face in complete shadow, his pale eyes steady and unhurried',
    'motionPrompt', 'the lit side of his face stays still while he speaks and his eyebrows lift once, the ballast hum and a chain knocking against a shutter, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'он говорит, что ему нужен не взломщик, а человек, который скажет, сколько это займёт по времени.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'his eyebrows have settled and his head has tilted a few degrees toward the door.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH11';

-- A4_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH12',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, two fingertips resting on the shackle of a heavy padlock hanging from a steel hasp, frost on the metal, hard floodlight from one side',
    'motionPrompt', 'the fingertips press and the padlock rotates a few degrees on the hasp, the scrape of frosted steel and a single dull clank, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты подходишь к двери и кладёшь два пальца на дужку висячего замка.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the padlock has rotated further and hangs at a new angle, the fingertips still on the shackle.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'safecracker';

-- A4_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A4_SH13',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face turned slightly away from the door with his eyes lowered, the floodlight edge across his cheek, his breath showing in the cold',
    'motionPrompt', 'his eyes stay lowered and he breathes out once, a long visible breath and wind crossing the open yard, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'и говоришь: сорок секунд.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the breath has dispersed and his eyes have closed briefly, his jaw set.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A4'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 11
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A4_SH13';

-- A5_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH01',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s hands at a padlock in the floodlight cone, the copper probe held low along his palm, his face out of frame above',
    'motionPrompt', 'the probe enters the padlock body and his wrist turns a few degrees, the fine scrape of copper in a keyway and one sharp click, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'в феврале девяносто пятого ты впервые открываешь чужое сам.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'square', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the probe has turned further and the padlock shackle has lifted a few millimetres out of its body.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH01';

-- A5_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH02',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the depot yard across its full width, the steel personnel door standing ajar with both padlocks hanging open on the hasp, the floodlight cone empty of people',
    'motionPrompt', 'the steel door drifts a hand''s width further open on its own weight, the low groan of a steel door and wind across the yard, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'сорок секунд ты назвал заранее, а вышло тридцать четыре, и он это тоже засёк.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'wide', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the door has drifted further and a wider band of darkness shows behind it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'safecracker';

-- A5_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH03',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, Vlad standing outside the open steel door with his back to the darkness inside, the tool wrap under his arm, the floodlight above him',
    'motionPrompt', 'he steps back one pace from the open doorway and turns his shoulders away from it, boots on wet concrete and the door still groaning behind him, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'static')
  ),
  'ты не заходишь внутрь ни на шаг, и это становится твоим единственным правилом на девять лет.', 'FS', 'low', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'tall_page', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is a full pace further from the door with his shoulders squared away from the opening.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 12
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH03';

-- A5_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad climbing a night stairwell with the cloth wrap under his arm, olive walls passing beside him, a caged bulb overhead',
    'motionPrompt', 'he climbs two more steps at an even pace and shifts the wrap higher under his arm, unhurried footfalls on concrete and a bulb buzzing above, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'в апреле девяносто пятого это уже не склад, а обычная квартира на пятом этаже.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is two steps higher and the wrap is settled further under his arm.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH04';

-- A5_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad seated on a stairwell windowsill with his hands on his knees, an open flat door across the landing behind him, blue-painted window glass at his back',
    'motionPrompt', 'he settles back onto the sill and folds his hands together on his knees, the creak of a windowsill and voices moving inside the flat, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты открываешь дверь, отходишь обратно на площадку и садишься на подоконник у окна.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his hands have unfolded and rest flat on his knees, his shoulders lowered against the window.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH05';

-- A5_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH06',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing alone on the landing facing away from the open door, his hands in his jacket pockets, the doorway behind him bright',
    'motionPrompt', 'he shifts his weight and turns his face further from the doorway, muffled movement and drawers opening behind him, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'внутрь заходят двое чужих людей, а ты стоишь на площадке спиной к двери и считаешь про себя до трёхсот.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'tall', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his face is turned fully away and his chin has lowered toward his chest.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH06';

-- A5_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH07',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face in the landing gloom, his eyes fixed on nothing, a muscle working at his jaw',
    'motionPrompt', 'his jaw works once and his eyes hold on nothing, muffled thumps behind him and the bulb buzzing, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты называешь это чистотой: ты не берёшь ничего, что за дверью.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his jaw has stilled and his eyes have lowered to the floor.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH07';

-- A5_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH08',
  jsonb_build_object(
    'positive', 'extreme close-up from a high angle, two hands counting a folded stack of dollar notes against a knee, the copper probe lying across the thigh beside them',
    'motionPrompt', 'the thumb riffles the stack once and stops halfway through, the dry flick of banknotes and a door closing two floors below, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'high', 'movement', 'push_in')
  ),
  'за эту ночь тебе платят полторы тысячи долларов, и ты пересчитываешь их прямо на лестнице.', 'ECU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'square', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the thumb has stopped and the stack is folded closed around it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';

-- A5_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH09',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad walking down the stairwell alone with the wrap under his arm, his other hand on the pipe handrail, landings receding above him',
    'motionPrompt', 'he descends steadily with his hand sliding along the handrail, footfalls echoing down the shaft and a palm squeaking on painted steel, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'и всю дорогу домой ты повторяешь себе, что своими руками не вынес оттуда ни одной вещи.', 'FS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_night_94'),
  'animated', cp.id, 'tall', 5,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is a half flight lower with his hand further along the rail and his head turned down.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 13
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH09';

-- A5_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the dark-haired woman washing a cup at the kitchen sink with her back to the room, the window above the sink showing courtyard dusk',
    'motionPrompt', 'she rinses the cup and sets it upside down on the drainer with her back still to the room, running water shutting off and ceramic touching steel, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'жена перестаёт спрашивать про деньги в мае, и это оказывается хуже, чем если бы она спрашивала.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'the cup is on the drainer and her hands are lowered to the sink edge, her back still turned.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH10';

-- A5_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad standing in the kitchen doorway looking toward the sink, one hand still on the doorframe, his jacket not yet taken off',
    'motionPrompt', 'his hand slides down the doorframe and stops at shoulder height, the creak of a doorframe and water draining in the sink, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты покупаешь ей стиральную машину и не можешь объяснить, почему тебе стыдно.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his hand has come off the doorframe and hangs at his side, his shoulders dropped.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH11';

-- A5_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH12',
  jsonb_build_object(
    'positive', 'insert shot from directly above, a kitchen table with the oilcloth cover visibly raised in one corner over a thick block of folded notes beneath it, a jam jar of dried flowers beside',
    'motionPrompt', 'the raised corner of the oilcloth settles a few millimetres and stays proud of the table, the faint creak of a table and a fridge motor running, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'INSERT', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'под клеёнкой к июню лежит четыре с половиной тысячи, и клеёнка больше не ложится ровно.', 'INSERT', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the corner has settled slightly but still stands raised, one edge of a note showing beneath.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'safecracker';

-- A5_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A5_SH13',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad behind the booth counter under the fluorescent tube cutting a key blank, his expression unchanged from any other day',
    'motionPrompt', 'he holds the blank against the wheel and sparks jump under his hands, the whine of the cutter and the rattle of blanks on their nails, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'в будке ты сидишь всё те же шесть дней в неделю, потому что иначе это станет заметно соседям.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'metalremont_booth'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the blank is cut deeper and the spark stream has thinned, his hands lowered a fraction.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A5'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 14
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A5_SH13';

-- A6_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH01',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, a very fair-haired boy of seven in a red tracksuit top holding a small cable lock out in both hands across a kitchen table',
    'motionPrompt', 'he pushes the lock further across the table with both hands and lets go, the small clatter of a cable lock on oilcloth, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'в девяносто седьмом сыну семь лет, и он приносит тебе замок от чужого велосипеда.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_KID'),
  'the lock has slid to the middle of the table and his hands have withdrawn to the edge.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH01';

-- A6_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH02',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad seated at the kitchen table looking down at the small lock, the overhead bulb bright on his forehead, his hands not yet moving',
    'motionPrompt', 'his eyes stay on the lock and his hand comes up to the table edge and stops, a chair creaking and a clock ticking on the wall, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты должен спросить, чей он.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his hand has come to rest flat beside the lock and his eyes have lifted a fraction.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH02';

-- A6_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH03',
  jsonb_build_object(
    'positive', 'extreme close-up from a high angle, a small cable lock lying on a kitchen oilcloth with a thin copper probe already resting against its keyway',
    'motionPrompt', 'the probe slides into the keyway and turns a quarter revolution, the fine scrape of copper and a single click, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'high', 'movement', 'push_in')
  ),
  'ты не спрашиваешь.', 'ECU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the probe has turned further and the cable has sprung a centimetre free of the body.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'safecracker';

-- A6_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH04',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the fair-haired boy leaning right across the kitchen table on his elbows with his face close to the opened lock, laughing',
    'motionPrompt', 'he pushes further onto his elbows and his shoulders shake with laughing, a child laughing and the lock rattling under his arm, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'он смеётся, когда дужка выскакивает из корпуса, и тут же просит показать ещё раз.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_KID'),
  'he has come further across the table and one hand has closed around the opened lock.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 15
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH04';

-- A6_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH05',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad half-smiling across the table with the probe held up between two fingers, the kitchen bulb warm on one side of his face',
    'motionPrompt', 'he turns the probe once between his fingers and holds it steady in the light, the small tick of copper on a thumbnail and a child breathing close, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'и ты показываешь, потому что впервые за целый год он смотрит на тебя вот так.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the probe has finished turning and points toward the boy, his smile a little wider.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH05';

-- A6_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH06',
  jsonb_build_object(
    'positive', 'close-up at eye level, the boy''s small hands working a bent wire into a mailbox lock, his fringe hanging over his eyes, the tip of his tongue at the corner of his mouth',
    'motionPrompt', 'the wire twists a quarter turn and his fingers adjust their grip, the tiny scrape of wire in a cheap lock and a stairwell door slamming below, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'к восьми годам он открывает почтовый ящик соседей за одиннадцать секунд гнутой проволокой.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_KID'),
  'the wire has turned further and the mailbox flap has sprung open a centimetre.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH06';

-- A6_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the dark-haired woman standing rigid in the kitchen doorway with one hand gripping the frame, her braid pulled forward over her shoulder',
    'motionPrompt', 'her grip tightens on the doorframe and her chin comes up, the creak of a doorframe under a hand and a tap dripping, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'жена говорит, чтобы ты немедленно это прекратил, и за двенадцать лет это единственный раз, когда она повышает голос.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'her chin is higher and her hand has slid down the doorframe, the knuckles pale.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH07';

-- A6_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH08',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad seated at the kitchen table with both hands flat on the oilcloth, looking toward the doorway rather than at the boy',
    'motionPrompt', 'his hands press flatter on the oilcloth and his head turns toward the doorway, the creak of a chair and a fridge motor cutting in, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты отвечаешь, что учишь его ремеслу, и сам почти в это веришь.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'landscape', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his head has turned fully to the doorway and one hand has lifted off the table.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH08';

-- A6_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH09',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad walking the market row with two traders turning to watch him pass, his tool wrap under his arm, awnings sagging above',
    'motionPrompt', 'he passes between the tables and two traders turn their heads to follow him, duckboards knocking and a cassette player thinning behind, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'к девяносто седьмому тебя знают по имени там, где имя стоит дороже любых денег.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'landscape', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is further along the row and both traders have turned fully after him.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 16
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH09';

-- A6_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH10',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, Vlad standing alone at the end of a market row with containers rising on both sides, his hand flat over his breast pocket',
    'motionPrompt', 'his hand presses flat over the breast pocket and holds there as he looks up the row, wind snapping the awnings and a shutter rolling somewhere, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'четыреста дверей за девять лет, и ни из одной ты не вынес ни одной вещи.', 'FS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'tall_page', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his hand has lowered from the pocket and his head has turned further up the row.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH10';

-- A6_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH11',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face in flat grey market daylight, his eyes level and unhurried, his collar turned up against the cold',
    'motionPrompt', 'his eyes stay level and he breathes out slowly, wind across an open market and canvas snapping, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты считаешь это доказательством того, что ты всё ещё мастер, а не вор.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyes have narrowed slightly and his collar has shifted higher against his jaw.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A6_SH11';

-- A6_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A6_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the market row across its full width in fading light, empty trestle tables with their goods packed away, steel doors closed and padlocked along the containers',
    'motionPrompt', 'a plastic sheet lifts and drops along the empty row and a padlock swings on its hasp, canvas snapping and a padlock knocking on steel, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pan_right')
  ),
  'разницу между этими двумя словами понимаешь пока только ты.', 'WS', 'eye', 'pan_right',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'market_rows_90s'),
  'animated', cp.id, 'wide', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the plastic sheet has folded over and the padlock hangs still against the door.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A6'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 17
WHERE p.slug = 'safecracker';

-- A7_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH01',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a newly opened locksmith''s shop across its full width, a pegboard wall of cylinders and blanks in neat rows, a counter with a hinged flap, fresh paint and a laid floor',
    'motionPrompt', 'the street door stands open and daylight moves across the new floor as a curtain lifts, the creak of a door spring and traffic passing outside, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'pan_left')
  ),
  'в девяносто восьмом ты выкупаешь помещение на первом этаже и вешаешь над входом вывеску со своей фамилией.', 'WS', 'eye', 'pan_left',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the door has swung further open and the band of daylight has crossed further over the floor.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'safecracker';

-- A7_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH02',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad behind the new counter writing on a receipt pad with a ballpoint, a receipt spike and a cash box beside his elbow',
    'motionPrompt', 'he tears the receipt off the pad and pushes it onto the spike, the rip of paper and the small punch of a spike, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты берёшь честные заказы, ставишь людям замки и первый раз за четыре года платишь налоги.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the receipt is on the spike and his pen is set down flat on the counter.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH02';

-- A7_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH03',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the dark-haired woman standing just inside the glazed street door of the shop with her handbag held in both hands, the counter across the room from her',
    'motionPrompt', 'she takes one small step forward and stops with both hands still on the bag, the creak of a door spring and street traffic behind her, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'жена приходит посмотреть и стоит на пороге, не заходя внутрь.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'she is one step further inside and her hands have lowered the bag to her waist.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH03';

-- A7_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH04',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face across the shop counter looking toward the door, daylight from the street on one side of him, warm bench lamp on the other',
    'motionPrompt', 'his mouth moves once and his eyes stay on the door, only the hum of a bench lamp and traffic outside, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты говоришь ей, что всё закончилось, и в ту минуту это ещё не ложь.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his mouth has closed and his eyes have lowered to the counter in front of him.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH04';

-- A7_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH05',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the ginger man filling the glazed shop doorway in his long leather coat, one hand still on the door handle, daylight behind him',
    'motionPrompt', 'he pushes the door wider with his shoulder and steps one pace into the shop, the door spring stretching and heavy footfalls on a new floor, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'в октябре дверь открывается, и в проёме стоит он.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'narrow', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'he is a full pace inside the shop and the door has swung shut behind his shoulder.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 18
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH05';

-- A7_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH06',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the ginger man at the shop counter with both palms down on it, leaning in, the pegboard of cylinders behind him out of focus',
    'motionPrompt', 'his palms press flat on the counter and he leans further over it, the creak of a new counter and a ring tapping wood once, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'он не говорит ни слова про деньги, он говорит, что этот сейф не открыл ещё ни один человек.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'square', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'GRISHA_MID'),
  'he has leaned in further and his head is lower, both palms still flat.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'GRISHA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'GRISHA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH06';

-- A7_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH07',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad behind the counter with his hand resting on the closed cash box, his head turned toward the ginger man at the edge of frame',
    'motionPrompt', 'his hand lifts off the cash box and comes to rest on the counter edge instead, the small knock of a hand on wood and a bench lamp humming, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'и вот тут ты понимаешь, что тебя купили не деньгами, а обыкновенным интересом.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his hand has moved further along the counter toward the other man and his shoulders have squared.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH07';

-- A7_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH08',
  jsonb_build_object(
    'positive', 'extreme close-up from directly above, a shop counter with a colour photograph of a tall green strongroom safe with a spoked handwheel and a brass escutcheon, a bench lamp reflected on the print',
    'motionPrompt', 'the photograph slides across the counter and stops squarely under the lamp, the slide of glossy paper on wood, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'top_down', 'movement', 'push_in')
  ),
  'он кладёт на прилавок фотографию, и на ней замок, которого ты не видел ни разу.', 'ECU', 'top_down', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the photograph has come to rest under the lamp with the handwheel centred in the light.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'safecracker';

-- A7_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH09',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face lowered over the photograph with his glasses pushed down onto his nose, the bench lamp lighting him from below',
    'motionPrompt', 'his glasses slide a fraction lower and his eyes track slowly across the print, the faint crackle of paper and the lamp humming, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты смотришь на неё дольше, чем смотрел на любую дверь за все девять лет.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyes have stopped moving and his hand has come into frame at the edge of the photograph.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 19
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH09';

-- A7_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad standing behind his counter at closing time with the shop lights off and only the bench lamp on, the photograph still lying in front of him',
    'motionPrompt', 'he stands over the photograph and turns it ninety degrees with one finger, the scuff of paper turning on wood and a fridge unit humming next door, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты говоришь ему нет три раза за один вечер, а на четвёртый спрашиваешь, какого он года выпуска.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'the photograph is turned and his finger rests on one corner of it, his head lowered further.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH10';

-- A7_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH11',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, the dark-haired woman standing at the kitchen table folding a shirt into a canvas bag, her braid over her shoulder, her face lowered',
    'motionPrompt', 'she folds the sleeve across the shirt and presses it flat into the bag, the rustle of cloth and a bag buckle knocking on the table, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'дома ты говоришь, что уезжаешь на два дня по работе, и она даже не переспрашивает.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'NINA_MID'),
  'the shirt is packed flat and her hands rest on the closed flap of the bag.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'NINA_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'NINA_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH11';

-- A7_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH12',
  jsonb_build_object(
    'positive', 'close-up from a high angle, the fair-haired boy looking up from beside the kitchen table with his hands on the edge of it, the scratched plastic watch on his right wrist',
    'motionPrompt', 'he lifts his chin further and his fingers curl over the table edge, a child''s voice cut off short and a bag zip closing, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'high', 'movement', 'push_in')
  ),
  'сын спрашивает, возьмёшь ли ты его с собой, и ты отвечаешь, что в другой раз.', 'CU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_KID'),
  'his chin has lowered again and his hands have slipped off the table edge.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_KID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_KID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A7_SH12';

-- A7_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A7_SH13',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the thin copper probe being pushed through the buttonhole of a breast pocket, worn canvas and a loose thread beside it',
    'motionPrompt', 'the probe slides through the buttonhole and seats against the fabric, the small dry scrape of copper on canvas, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты кладёшь щуп в нагрудный карман так же, как клал его двадцать два года подряд.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'vlad_kitchen'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the probe is fully seated in the buttonhole and the pocket flap has fallen closed over it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A7'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 20
WHERE p.slug = 'safecracker';

-- A8_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad entering a panelled office at night with his tool wrap under his arm, heavy curtains drawn behind a desk, a single table lamp lighting the room',
    'motionPrompt', 'he crosses the carpet and stops with the wrap still under his arm, muffled footfalls on carpet and a radiator ticking as it cools, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'кабинет на третьем этаже бывшего института, шторы задёрнуты наглухо, горит одна настольная лампа.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is two paces further into the room with the wrap lowered to his side.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH01';

-- A8_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH02',
  jsonb_build_object(
    'positive', 'medium shot from a low angle, Vlad standing before a tall deep-green strongroom safe on a low plinth, the spoked handwheel level with his chest, brass escutcheon dull in the lamp light',
    'motionPrompt', 'he sets one palm flat on the safe door and leaves it there, the dull flat sound of a hand on thick steel, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'low', 'movement', 'tilt_up')
  ),
  'сейф выше тебя на голову и стоит на бетонном постаменте, который заливали специально под него.', 'MS', 'low', 'tilt_up',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his palm has slid down the safe door to the level of the escutcheon.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH02';

-- A8_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH03',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the brass escutcheon and spoked handwheel of an old safe filling the frame, chipped enamel down the closing edge, a copper probe tip entering the keyway',
    'motionPrompt', 'the handwheel turns a few degrees and stops against resistance, a deep muffled click somewhere inside thick steel, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты кладёшь ухо на холодную сталь и слышишь, что рядов внутри четыре, а не три.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the handwheel has turned a little further and the probe is deeper in the keyway.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';

-- A8_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH04',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face pressed side-on against the cold safe door with his eyes closed, the table lamp lighting one cheek, the copper probe held at the keyway below',
    'motionPrompt', 'his eyebrows draw together and his head presses a fraction harder against the steel, faint irregular clicks under the surface and a clock ticking across the room, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'static')
  ),
  'первый час ты только слушаешь и не поворачиваешь вообще ничего.', 'CU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyebrows have relaxed and his head has turned a few degrees along the steel.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH04';

-- A8_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH05',
  jsonb_build_object(
    'positive', 'extreme close-up from a high angle, two fingertips on the copper probe at the safe keyway, the metal worn bright around the hole, everything beyond in darkness',
    'motionPrompt', 'the fingertips rotate the probe a fraction and hold it there, one late click arriving after three quick ones, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'high', 'movement', 'push_in')
  ),
  'четвёртый ряд садится позже остальных, ровно как тот штифт из ведра в семьдесят девятом.', 'ECU', 'high', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'square', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the probe has rotated further and the fingertips have shifted their grip along it.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';

-- A8_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH06',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad sitting down on the office carpet with his back against the plinth, the heavy safe door swung open above and behind his shoulder',
    'motionPrompt', 'he lowers himself to the carpet and lets his hands drop onto his knees, the heavy swing of a steel door on its hinges and a long exhale, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'ты открываешь его за четыре часа семь минут и садишься прямо на пол рядом с постаментом.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'landscape', 5,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is fully seated with his head tipped back against the plinth and his hands loose on his knees.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH06';

-- A8_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH07',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad turned on the carpet to look up into the open mouth of the safe, one hand on the plinth edge, lamp light reaching only the lower shelf',
    'motionPrompt', 'he turns on the carpet and pushes himself up onto one knee with a hand on the plinth, the scuff of cloth on carpet and a knee joint cracking, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'и первый раз за девять лет тебе хочется посмотреть, что там внутри.', 'MS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'landscape', 6,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is up on one knee with his head level with the open shelf and both hands on the plinth.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 21
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH07';

-- A8_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH08',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the office across its full width, the tall safe standing open with its shelves visible, stacked folders and bound papers inside, the desk and drawn curtains beyond',
    'motionPrompt', 'a curtain moves once in a draught and the open safe door drifts a few centimetres, the creak of a heavy hinge and a radiator ticking, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'там нет денег.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the safe door has drifted further open and more of the paper shelves are visible.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'safecracker';

-- A8_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH09',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the open safe shelves seen across the room, a topmost folder of typed lists lying open, the table lamp reaching just far enough to light its first page',
    'motionPrompt', 'the top page of the open folder lifts and settles in the draught, the dry flap of paper and a curtain moving on its rail, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'там лежат бумаги, и на верхней папке напечатаны фамилии, которые ты знаешь по своему подъезду.', 'WS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'office_safe_room'),
  'animated', cp.id, 'wide', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the page has settled flat again and a second page beneath it has lifted slightly.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 22
WHERE p.slug = 'safecracker';

-- A8_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH10',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the depot yard across its full width in daylight, the steel personnel door standing padlocked, an empty parking place by the barrier, weeds through the concrete joints',
    'motionPrompt', 'wind crosses the empty yard and the boom barrier arm rocks slightly on its pivot, the creak of a barrier and a wire fence ringing, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'через одиннадцать дней он не приходит за расчётом, и с тех пор его больше никто не видел.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'warehouse_yard'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the barrier arm has settled and a plastic bag has blown into the corner of the frame.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'safecracker';

-- A8_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH11',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing alone in the middle of his shop with the counter flap raised behind him, the street door dark, his hands empty at his sides',
    'motionPrompt', 'he takes half a step back toward the counter and stops, the creak of a floorboard and the street door rattling in its frame, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'к тебе приходят другие люди и спрашивают не про сейф, а про то, что ты успел в нём прочитать.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'tall', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'he is half a step further back with one hand raised to the counter behind him.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH11';

-- A8_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH12',
  jsonb_build_object(
    'positive', 'close-up at eye level, Vlad''s face in the unlit shop with only street light on it, his eyes fixed level and his jaw locked, the pegboard dark behind him',
    'motionPrompt', 'his jaw locks harder and his eyes stay level and fixed, the door rattling in its frame and a car passing outside, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'ты говоришь, что ничего не читал, и это второй раз в жизни, когда тебе не верят.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_MID'),
  'his eyes have lowered a fraction and his jaw has released, his mouth pressed thin.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_MID', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_MID'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A8_SH12';

-- A8_SH13
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A8_SH13',
  jsonb_build_object(
    'positive', 'full-length shot from a low angle, the shop interior stripped bare, the pegboard empty of cylinders, a rolled sign leaning against the counter, daylight through unwashed glass',
    'motionPrompt', 'dust drifts across the empty pegboard and the rolled sign slips a few centimetres down the counter, the scrape of a sign on wood and an empty room echoing, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'low', 'movement', 'pull_out')
  ),
  'мастерскую ты закрываешь в марте девяносто девятого и вывеску со своей фамилией снимаешь сам.', 'FS', 'low', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_shop_98'),
  'animated', cp.id, 'tall', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the sign has slid further down and come to rest against the floor.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A8'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 23
WHERE p.slug = 'safecracker';

-- A9_SH01
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH01',
  jsonb_build_object(
    'positive', 'medium shot at eye level, an older broad-shouldered Vlad in a faded blue workshop coat fitting a new cylinder into a steel door on a landing, a toolbag open at his feet',
    'motionPrompt', 'he drives the cylinder home with the heel of his hand and reaches for a screwdriver, the thud of a palm on steel and a screwdriver ringing in a bag, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'с двухтысячного года ты только ставишь замки и не снимаешь больше ни одного.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'landscape', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'the cylinder is seated and the screwdriver is in his hand at the faceplate.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH01';

-- A9_SH02
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH02',
  jsonb_build_object(
    'positive', 'medium shot at eye level, Vlad walking a bright contemporary landing with a toolbag in one hand, three flush steel doors and a new intercom panel beside an old bell push',
    'motionPrompt', 'he carries the bag past the doors with his eyes straight ahead and the bag swings against his leg, a bag knocking on a knee and an LED fitting clicking on, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'track')
  ),
  'люди зовут тебя, потому что ты старый и берёшь дёшево, а вовсе не потому, что ты лучший.', 'MS', 'eye', 'track',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'landscape', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'he is further along the landing with the bag swung forward and his head turned away from the doors.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH02';

-- A9_SH03
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH03',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing in a cramped hallway facing the inside of his own steel entrance door, seven separate locks fitted down its closing edge at uneven intervals',
    'motionPrompt', 'he reaches up and turns the topmost lock and then lowers his hand to the next, two heavy bolts throwing one after the other, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'static')
  ),
  'на своей собственной двери к две тысячи пятнадцатому у тебя стоит семь замков разных лет.', 'FS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'tall', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his hand is at the second lock down and the top bolt is fully thrown.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH03';

-- A9_SH04
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH04',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, the closing edge of a steel door with three of the seven locks visible, one bright and new, one worn to bare brass, a strip of draught seal between them',
    'motionPrompt', 'a bolt slides across and seats with a solid knock, the heavy metallic thud of a bolt in its keeper, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'самый новый ты поставил в мае, хотя в подъезде за двадцать лет не случилось ни одной кражи.', 'ECU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'square', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the bolt is fully across and a second bolt below it has begun to move.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';

-- A9_SH05
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH05',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, Vlad''s face in the dim hallway lit by one ceiling fitting, his head tilted as he works a lock out of frame, reading glasses up on his forehead',
    'motionPrompt', 'his head tilts a few degrees further and his hand pauses mid-turn, one bolt grating instead of clicking cleanly, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'ты закрываешь их каждый вечер сверху вниз и на слух узнаёшь, если хоть один идёт туго.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'square', 4,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his head has straightened and his hand has resumed turning, his mouth pressed thin.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH05';

-- A9_SH06
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH06',
  jsonb_build_object(
    'positive', 'full-length shot at eye level, Vlad standing alone in the hallway facing the locked door, a set of keys lying on a low shelf beside him, coats crowded on hooks',
    'motionPrompt', 'he turns from the door and stops with his hand hovering just short of the keys on the shelf, the creak of a floorboard and a clock ticking in another room, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'FS', 'angle', 'eye', 'movement', 'pull_out')
  ),
  'жена уходит от тебя в две тысячи девятом и оставляет свои ключи на тумбочке в прихожей.', 'FS', 'eye', 'pull_out',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'tall', 5,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'VLAD_OLD'),
  'his hand has lowered away from the shelf and he has turned fully toward the hallway.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 24
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'VLAD_OLD', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'VLAD_OLD'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH06';

-- A9_SH07
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH07',
  jsonb_build_object(
    'positive', 'medium close-up at eye level, a heavy-shouldered fair-haired man in a black quilted jacket standing at a landing door, a scratched steel watch on his right wrist, his face flat and unhurried',
    'motionPrompt', 'his shoulders square toward the door and his weight shifts onto the back foot, the creak of a jacket and a landing sensor light clicking on, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MCU', 'angle', 'eye', 'movement', 'static')
  ),
  'сын вырастает, и в девятнадцать лет он первый раз открывает чужую дверь.', 'MCU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'square', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_ADULT'),
  'his weight has moved fully onto the back foot and his shoulders have turned further to the door.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_ADULT', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_ADULT'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH07';

-- A9_SH08
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH08',
  jsonb_build_object(
    'positive', 'close-up at eye level, the younger man''s face under the hard landing LED, his eyes on the door lock, no tools in his hands, his jaw relaxed',
    'motionPrompt', 'his eyes stay on the lock and he breathes in once through his nose, the hum of an LED fitting and a lift running behind the wall, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'CU', 'angle', 'eye', 'movement', 'push_in')
  ),
  'он не слушает механизм, потому что ты научил его только одному: дверь это не преграда.', 'CU', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'square', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_ADULT'),
  'his eyes have lifted from the lock to the middle of the door and his chin has dropped slightly.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_ADULT', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_ADULT'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH08';

-- A9_SH09
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH09',
  jsonb_build_object(
    'positive', 'extreme close-up at eye level, a modern door cylinder in a flush steel door, the escutcheon unmarked, hard even LED light and no shadow anywhere on it',
    'motionPrompt', 'the cylinder sits unmoving and the light on it does not change, only the hum of an LED fitting and a distant lift, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'ECU', 'angle', 'eye', 'movement', 'static')
  ),
  'у него нет ни щупа, ни терпения, ни того самого четвёртого штифта.', 'ECU', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'square', 2,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the cylinder is unchanged and a faint vibration has begun to blur its edge.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'safecracker';

-- A9_SH10
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH10',
  jsonb_build_object(
    'positive', 'medium shot at eye level, the younger man''s boot planted against a steel door beside the lock, the door frame splintering at the strike plate, his body braced back',
    'motionPrompt', 'the door bursts inward off the strike plate and the frame splinters, a single heavy impact and wood cracking, the same single figure throughout the shot, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'MS', 'angle', 'eye', 'movement', 'static')
  ),
  'он открывает её ногой за одну секунду и заходит внутрь, ни разу не оглянувшись.', 'MS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'landscape', 3,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = 'SON_ADULT'),
  'the door has swung fully inward and his boot has come down onto the threshold.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 25
WHERE p.slug = 'safecracker';
INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, 'SON_ADULT', pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = 'SON_ADULT'
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = 'safecracker' AND s."shotCode" = 'A9_SH10';

-- A9_SH11
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH11',
  jsonb_build_object(
    'positive', 'wide shot at eye level, a contemporary landing across its full width, one steel door standing open with a splintered frame, the other doors closed, a bag of rubble against the wall',
    'motionPrompt', 'the broken door rocks once on its hinges and settles against the wall, the knock of steel on plaster and a sensor light clicking off, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'static')
  ),
  'разницу между вами понимаешь только ты, и объяснять её уже некому.', 'WS', 'eye', 'static',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'stairwell_2026'),
  'animated', cp.id, 'wide', 0,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the door has come to rest against the wall and the landing has gone noticeably darker.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'safecracker';

-- A9_SH12
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, 'A9_SH12',
  jsonb_build_object(
    'positive', 'wide shot at eye level, the inside face of the seven-locked steel door across the full width of a cramped hallway, coats crowded on hooks, a dim mirror gone grey at the corners',
    'motionPrompt', 'the coats on the hooks sway slightly and settle, the creak of a coat hook and a clock ticking beyond the frame, the place stays deserted, every surface and object holding its exact position, no music',
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping, scene cut, identity change',
    'camera', jsonb_build_object('shotType', 'WS', 'angle', 'eye', 'movement', 'push_in')
  ),
  'твоя дверь в это самое время закрыта на семь замков, и ты сидишь за ней один.', 'WS', 'eye', 'push_in',
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = 'own_flat_door'),
  'animated', cp.id, 'wide', 1,
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = NULL),
  'the coats have settled still and the hallway light has dimmed a fraction.', false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = 'A9'
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = 26
WHERE p.slug = 'safecracker';

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
