-- Seed: «Газ» A2 «Первая машина» (scene act_02_first_car, 32 shots, renderMode=animated).
-- Age 16, Riga 2012 (currency: LATI). Glove anchor adopted; leitmotif returns 10x;
-- Vitek + race-chat foreshadow. Closes the ~10-min animated block. Uses RACER_TEEN.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_02_first_car'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A2_SH01','extreme wide shot of Riga panel-block districts under a flat grey sky, an early-2010s ordinary day, no bicycles',
   'проходит три года, тебе шестнадцать, на дворе две тысячи двенадцатый, ты больше не катаешься на велике','EWS','high','static',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('A2_SH02','medium shot of a lean 16-year-old teenager hauling crates on a port quay beside dockers, sweating, summer',
   'всё лето ты таскаешь ящики в порту рядом с отцом, складываешь латы в коробку из-под обуви','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','riga_port'),
 ('A2_SH03','close-up of a shoebox full of crumpled small-denomination banknotes hidden under a bed',
   'к августу у тебя четыреста латов, и ты знаешь на что, на свою первую машину','CU','high','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A2_SH04','medium shot of the teenager at a muddy outdoor car market inspecting an old silver sedan among rows of used cars',
   'на авторынке за ригой стоит убитая бэха в кузове е тридцать девять, серебристая, сотка сверху торга','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6',NULL),
 ('A2_SH05','close-up of a rusty dented silver old BMW sedan, rust along the wheel arches, worn but solid',
   'пробег за триста тысяч, ржавчина по аркам, но мотор живой и звучит как надо','CU','low','static',true,false,'gaz_environment',NULL,NULL),
 ('A2_SH06','medium close-up of the teenager sitting in the driver seat of his own car for the first time, hands on the worn wheel, heart pounding',
   'ты садишься за руль уже своей машины, кладёшь руки на потёртый руль, и сердце колотится как на горке','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH07','extreme close-up of a single worn brown leather right-hand driving glove found lying in an open glovebox',
   'в бардачке ты находишь одну кожаную перчатку прежнего хозяина, правую, как раз на твою руку','ECU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A2_SH08','close-up of the teenager pulling the worn brown leather glove onto his right hand like a ritual, a small private ceremony',
   'ты натягиваешь её на правую руку, и с этого дня не садишься за руль без неё, это твоя примета','CU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH09','medium shot of the teenager pushing the old silver BMW into a private garage box at dusk, hiding it',
   'машину ты прячешь в гаражах в чиекуркалнсе, родителям про неё ни слова, тебе ещё нет восемнадцати','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','chiekurkalns_garages'),
 ('A2_SH10','wide shot of the garage interior at night, the car over the pit, a work lamp on a cable, tools',
   'по вечерам ты копаешься в ней при свете переноски, меняешь масло, учишься по форумам','WS','eye','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A2_SH11','medium shot of the teenager driving slowly and jerkily across an empty lot at night, learning',
   'сначала ты учишься в пустом дворе по ночам, движок глохнет, ты трогаешься рывками','MS','low','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','lidostas_road'),
 ('A2_SH12','close-up of a gloved right hand on a gear lever, total concentration',
   'через неделю ты уже чувствуешь сцепление кончиками пальцев, машина становится продолжением тебя','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH13','extreme wide shot of an empty smooth airport approach road at night, blinking aviation lights in the distance',
   'первый настоящий разгон ты делаешь ночью на пустой дороге у аэропорта, ни одной машины','EWS','eye','static',true,false,'gaz_environment',NULL,'lidostas_road'),
 ('A2_SH14','close-up of an analog speedometer needle climbing past one hundred, dashboard glow',
   'стрелка ползёт за сто, потом за сто двадцать, мотор воет, руль дрожит в руке','CU','eye','static',false,false,'gaz_environment',NULL,'bmw_interior'),
 ('A2_SH15','medium close-up of the teenagers exhilarated face at speed, the rush flooding back, huge',
   'и под рёбрами вспыхивает та самая невесомость, только теперь в десять раз сильнее чем на горке','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH16','wide shot of the silver BMW blasting down the empty night road, lights streaking past',
   'горка из детства была игрушкой, а это уже настоящее, и обратно ты уже не хочешь','WS','low','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','lidostas_road'),
 ('A2_SH17','extreme close-up of a fuel gauge near empty and a thin worn wallet',
   'бензин съедает все твои латы, но ты находишь ещё, подрабатываешь, экономишь на еде','ECU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A2_SH18','medium shot of the teenager lovingly polishing the rusty old silver BMW until it shines',
   'ты вылизываешь эту ржавую бэху как новую, для тебя она красивее любого салона','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','chiekurkalns_garages'),
 ('A2_SH19','close-up of blue and red police lights reflected in a car rear-view mirror at night',
   'однажды ночью тебя ловит патруль за сто сорок в городе, права ты только сдал','CU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A2_SH20','medium shot of the teenager calmly handing documents through the car window to a police officer at night',
   'ты получаешь штраф на полста латов и предупреждение, но внутри ты не боишься, ты досадуешь','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH21','close-up of the teenagers calm calculating grey eyes',
   'ты понимаешь только одно, в городе есть камеры и патрули, значит надо знать где их нет','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH22','extreme wide high night view of Riga streets like a dark map, scattered lamp lines',
   'ты начинаешь запоминать город по-другому, где пусто ночью, где слепые улицы, где можно','EWS','high','static',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('A2_SH23','medium shot of older guys with tuned old BMWs and Audis gathered at a suburban petrol station at night, engine haze',
   'на заправке на окраине по ночам собираются парни на разогнанных бэхах и аудишках','MS','eye','static',false,false,'gaz_environment',NULL,'lidostas_road'),
 ('A2_SH24','medium close-up of the teenager watching the gathered racers from his own car, drawn in',
   'ты приезжаешь туда просто посмотреть, садишься в стороне, слушаешь как ревут моторы','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH25','close-up of a phone screen showing a shaky night street-racing video held in someones hand',
   'один из них показывает тебе видео ночного заезда на телефоне, у тебя пересыхает во рту','CU','eye','static',true,false,'gaz_environment',NULL,'lidostas_road'),
 ('A2_SH26','medium shot of a jittery young man with spiky bleached-blond hair and a chipped front tooth leaning into the teenagers car window, grinning',
   'к тебе подсаживается дёрганый пацан с белым ёжиком и щербатым зубом, его зовут витёк','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','lidostas_road'),
 ('A2_SH27','close-up of the chipped-tooth grin of the bleached-blond young man talking eagerly',
   'витёк говорит, у нас есть закрытый чат, там пишут где заезды и сколько ставят, хочешь добавлю','CU','eye','static',false,false,'gaz_environment',NULL,'lidostas_road'),
 ('A2_SH28','medium close-up of the teenagers tempted face, a quiet fork in his life',
   'ты говоришь хочу, и в эту секунду одна твоя дорога тихо сворачивает на другую','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','bmw_interior'),
 ('A2_SH29','wide shot of the silver BMW driving home along an empty road at dawn',
   'ты едешь домой на рассвете, в перчатке на правой руке, и впервые чувствуешь что нашёл своих','WS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','lidostas_road'),
 ('A2_SH30','medium shot of sleeping parents glimpsed through a doorway as the teenager sneaks into the dark flat',
   'родители спят, они так и не знают про машину, про гаражи, про дорогу у аэропорта','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A2_SH31','close-up of the teenager lying awake in bed, eyes open, alive and restless',
   'тебе шестнадцать, у тебя есть бэха, перчатка и чат, и тебе кажется что всё только начинается','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f6','racer_apartment'),
 ('A2_SH32','extreme wide high shot of Riga at dawn, the small silver BMW heading toward the waking city',
   'и ты прав, всё только начинается, просто ты ещё не знаешь чем это кончится','EWS','high','static',true,true,'gaz_environment',NULL,'southern_bridge')
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

INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, '6a200000-0000-4000-8000-0000000000c1', s."referenceProfileId", 'ты'
FROM shots s
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A2\_%' AND s."referenceProfileId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
