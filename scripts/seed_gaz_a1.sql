-- Seed: «Газ» A1 «Истоки» (scene act_01_origins, 38 shots, renderMode=animated).
-- Age 8→13, Riga Bolderaja, 2004→2009 (currency: LATI, euro only from 2014).
-- Birth of the leitmotif (garage-ramp невесомость). Adds RACER_CHILD + RACER_TEEN profiles.
SET client_encoding = 'UTF8';
BEGIN;

-- New age-band profiles for the protagonist (text identity until anchors exist).
INSERT INTO character_profiles (id, "characterId", "profileCode", "ageLabel", "targetImages", "useIpAdapter", "triggerToken", "promptBase", negative, "createdAt") VALUES
 ('6a200000-0000-4000-8000-0000000000f5', '6a200000-0000-4000-8000-0000000000c1', 'RACER_CHILD', 'child 10', 0, true, 'r4cerkid',
  'a thin 10-year-old Russian-speaking boy from Riga, short dark-brown hair, large watchful grey eyes, plain unmarked face, wearing a faded t-shirt and shorts, quiet observant expression, NO gloves, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
  'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, adult, stubble, gloves, facial scars, facial marks, deformed hands, extra fingers', now()),
 ('6a200000-0000-4000-8000-0000000000f6', '6a200000-0000-4000-8000-0000000000c1', 'RACER_TEEN', 'teen 16', 0, true, 'r4certeen',
  'a lean 16-year-old Russian-speaking teenager from Riga, short dark-brown hair, narrow grey eyes, faint adolescent features, wearing a cheap dark hoodie and jeans, a worn brown leather fingerless driving glove newly adopted on his RIGHT hand only as his identity anchor, restless eager expression, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
  'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, child, beard, two gloves, deformed hands, extra fingers', now())
ON CONFLICT (id) DO NOTHING;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_01_origins'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A1_SH01','medium shot of a quiet thin 10-year-old boy sitting alone at a small kitchen table watching the room, plain unmarked face, ordinary cramped soviet flat',
   'ты тихий мальчик, тебя не бьют и не запирают, тебя просто часто не замечают','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','racer_apartment'),
 ('A1_SH02','close-up of a tired dock-worker fathers grimy heavy hands and a worn jacket at the doorway in the evening, oil and metal grime',
   'отец работает в порту докером, приходит в семь вечера, от него пахнет соляркой и железом','CU','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A1_SH03','medium shot of a tired woman in a white coat behind a pharmacy counter counting boxes of pills under fluorescent light',
   'мать стоит за прилавком аптеки на маскавас по двенадцать часов, считает чужие таблетки','MS','eye','static',false,false,'gaz_environment',NULL,'pharmacy_maskavas'),
 ('A1_SH04','wide shot of the boy alone in the small flat doing homework on the floor with a television flickering, evening',
   'после школы ты один, делаешь уроки под телевизор, еда в холодильнике, дневник подписан','WS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','racer_apartment'),
 ('A1_SH05','close-up of the boys watchful grey eyes at a window looking down into the courtyard',
   'тебя хвалят редко, ругают ещё реже, и ты рано понял, что тише значит спокойнее','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','racer_apartment'),
 ('A1_SH06','extreme wide high shot of a courtyard between panel blocks with a steep long concrete ramp leading down to garages, summer',
   'всё интересное во дворе, и самое интересное это бетонная горка к гаражам, крутая и длинная','EWS','high','static',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH07','wide shot of older boys riding bicycles fast down the steep concrete garage ramp and braking at the bottom, summer dust',
   'старшие пацаны гоняют по ней на великах, тормозят у самого низа, ты смотришь и считаешь','WS','low','track_lateral',false,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH08','medium shot of the small boy at the top of the ramp astride a battered old child bicycle with peeling paint, hesitating',
   'тебе восемь, твой велик орлёнок куплен на барахолке за тридцать латов, краска облезла','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH09','close-up of small hands gripping bicycle brake levers tightly, knuckles pale, tense',
   'ты стоишь наверху, руки на тормозах, сердце колотится, и вдруг что-то говорит не тормози','CU','eye','static',false,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH10','extreme close-up of fingers slowly releasing a bicycle brake lever, the decisive small motion',
   'и ты отпускаешь, просто отпускаешь тормоз, и горка хватает тебя и тянет вниз','ECU','eye','static',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH11','wide dutch-angle shot of the boy hurtling down the steep ramp on the bike, motion lines, wind in his hair, pure speed',
   'и под рёбрами появляется короткая невесомость, как в верхней точке качелей за миг до того как полетишь вниз','WS','dutch','track_lateral',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH12','medium close-up of the boys flushed alive face at the bottom of the ramp, eyes wide, shaking, exhilarated',
   'ты долетаешь до низа, тебя потряхивает, и это лучшее что ты чувствовал за всю свою маленькую жизнь','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH13','medium shot of the boy immediately dragging his bike back up the ramp, determined',
   'ты не идёшь домой, ты тащишь велик обратно наверх, чтобы повторить это ещё раз','MS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH14','extreme close-up of a bicycle tyre skidding on wet concrete leaving black scuff marks',
   'к концу того лета ты съезжаешь с горки сотни раз, и каждый раз тебе нужно чуть быстрее','ECU','eye','static',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH15','wide shot of the boy riding no-hands down a slope, arms out, confident',
   'в девять ты учишься съезжать без рук, в десять перестаёшь тормозить вообще','WS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH16','close-up of a scraped bloody knee and gravel, a bottle of green antiseptic nearby',
   'ты разбиваешь колени и локти, мать мажет зелёнкой и качает головой, но ты молчишь про горку','CU','high','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A1_SH17','medium shot of the boy on his bike shooting out of the courtyard arch into a street as an old car brakes hard',
   'однажды ты вылетаешь со двора прямо под старую вольво, водитель бьёт по тормозам и матерится','MS','low','handheld',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH18','close-up of the boy frozen a meter from a car bumper, but a faint strange smile, not fear',
   'ты замираешь в метре от бампера, и вместо страха внутри снова та самая невесомость','CU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH19','medium shot of the worried mother scolding the boy in the kitchen in the evening, near tears',
   'вечером мать узнаёт, плачет, берёт с тебя слово не гонять по дороге, ты киваешь','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A1_SH20','close-up of the boy nodding obediently but his eyes already somewhere else',
   'ты киваешь искренне, ты правда не хочешь её расстраивать, но слово ты не сдержишь ни разу','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','racer_apartment'),
 ('A1_SH21','extreme wide shot of an empty evening road running down toward the river dam, no people, long perspective',
   'ты просто находишь улицы подальше от дома, длинный спуск у дамбы, пустую дорогу к порту','EWS','eye','static',true,false,'gaz_environment',NULL,'riga_port'),
 ('A1_SH22','wide shot of the boy on his bike flying down the dam road at dusk, lamps streaking past',
   'там никто не видит, и ты летишь вниз к воде, пока фонари не сливаются в одну линию','WS','low','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','riga_port'),
 ('A1_SH23','medium shot of the exhausted father asleep in an armchair on a day off, the boy quietly watching him',
   'ты любишь отца, но он всё время уставший, по выходным он спит, а ты не будишь','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A1_SH24','close-up of newspaper car photos and cut-outs of bmw and audi cars pinned on a wall',
   'ты собираешь картинки машин из газет, бмв и ауди, и знаешь все модели наизусть к десяти годам','CU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A1_SH25','medium shot of the boy at a classroom window seat drawing cars in the margin of his notebook instead of writing',
   'в школе ты средний, учительница говорит способный но в облаках, рисует машины на полях тетради','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5',NULL),
 ('A1_SH26','close-up of a teachers hand pointing at a notebook margin filled with little drawings of cars',
   'тебя не ругают за это всерьёз, ты вежливый и тихий, а тихих не трогают','CU','high','static',false,false,'gaz_environment',NULL,NULL),
 ('A1_SH27','wide shot of a school yard with kids playing while one boy stands apart watching a car drive past the gate',
   'на перемене все играют, а ты смотришь как во двор заезжает чужая машина и слушаешь мотор','WS','eye','static',false,false,'gaz_environment',NULL,NULL),
 ('A1_SH28','medium close-up of the boy alone but content, calm, not lonely',
   'тебе не одиноко, у тебя есть горка, есть дамба, есть та невесомость, и этого пока хватает','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH29','close-up through a windscreen of a parked switched-off car steering wheel held by small hands',
   'ты впервые садишься за руль соседской машины во дворе, она заглушена, но ты держишь руль час','CU','eye','push_in',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH30','medium shot of the boy gripping a steering wheel of a parked car, deadly serious, rehearsing',
   'ты не играешь в гонки, ты репетируешь, ты уже знаешь что когда-нибудь это будет по-настоящему','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH31','extreme wide high shot of the Bolderaja courtyard in autumn, bare trees, time passing',
   'проходит четыре года, тебе двенадцать, отец всё так же в порту, мать всё так же в аптеке','EWS','high','static',true,true,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH32','medium shot of the boy now twelve, taller, on a bigger mountain bike at the top of a long slope',
   'ты теперь гоняешь на горном велике по дамбе, разгоняешься так что цепь воет','MS','low','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','riga_port'),
 ('A1_SH33','close-up of the twelve-year-old boys face, the need now permanent and calm',
   'невесомость под рёбрами стала нужна тебе как воздух, без неё дни серые и одинаковые','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','riga_port'),
 ('A1_SH34','wide shot of a distant highway seen from the dam, cars streaking along it at speed',
   'с дамбы видно трассу на юрмалу, машины идут по сто сорок, и ты часами смотришь на них','WS','eye','static',true,false,'gaz_environment',NULL,'jurmala_highway'),
 ('A1_SH35','medium close-up of the boy watching the distant highway with longing',
   'ты считаешь дни до того как сядешь туда сам, до прав ещё четыре года, они тянутся бесконечно','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','jurmala_highway'),
 ('A1_SH36','close-up of an older teenager riding a moped past, exhaust smoke, the boy turning to follow it',
   'в тринадцать ты впервые прокатишься на чужом мопеде и поймёшь что велик это уже мало','CU','eye','track_lateral',false,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A1_SH37','medium shot of the boy looking at his own reflection in a parked cars dark window',
   'ты смотришь на своё отражение в стекле чужой машины и видишь там будущего водителя','MS','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f5','bolderaja_yard'),
 ('A1_SH38','extreme wide high shot of Riga at dusk, the small figure of the boy on the dam, the lit city ahead',
   'тебе тринадцать, ты ещё ничего не сделал плохого, но дорога к тому перекрёстку уже началась','EWS','high','static',true,true,'gaz_environment',NULL,'riga_port')
)
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "isBroll", "isIconic",
  "renderMode", "workflowRouteKey", "referenceProfileId", "locationId", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), (SELECT id FROM proj), (SELECT id FROM scn), v."shotCode",
  jsonb_build_object('positive', style.sb || ', ' || v.sub, 'narrationRu', v.narr),
  v.narr, v.stype, v.sang, v.smove, v.broll, v.iconic,
  'animated', v.route, v.profid,
  CASE WHEN v.locslug IS NULL THEN NULL ELSE (SELECT id FROM locations WHERE "projectId"=(SELECT id FROM proj) AND slug=v.locslug) END,
  now(), now()
FROM v, style
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

UPDATE shots SET "promptFields" = "promptFields" || jsonb_build_object('positivePrompt', "promptFields"->>'positive')
WHERE "projectId"='6a200000-0000-4000-8000-000000000001' AND "promptFields"->>'positivePrompt' IS NULL;

-- Participants: RACER_CHILD on every character (face/body) shot of A1.
INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, '6a200000-0000-4000-8000-0000000000c1', s."referenceProfileId", 'ты'
FROM shots s
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A1\_%'
  AND s."referenceProfileId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
