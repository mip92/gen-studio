-- Seed: «Газ» A6 «Лига» (scene act_06_liga, 36 shots). Age 27-29, Riga 2023→Jan 2025.
-- The point of no return: love with Liga, double-life strain, Trener ultimatum, the
-- proposal, the QUIT (sells black M5, deletes chat + handle «Перчатка», glove in drawer),
-- six months of quiet → the itch → Vitek's Tallinn challenge → "one last race" → relapse.
-- Adds 3 locations. RACER_ADULT + LIGA + TRENER.
SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'daugava_embankment', 'Набережная Даугавы',
  $d$the riverside embankment promenade along the Daugava in central Riga at golden sunset, a low stone parapet, benches, lindens, the river wide and calm, the spires of Old Riga and the cable-stayed bridge on the far bank, soft warm low light, a few strollers. atmosphere of a warm unhurried summer evening.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'jurmala_beach', 'Пляж в Юрмале',
  $d$the wide flat white-sand beach at Jurmala on the Gulf of Riga, gentle shallow sea, tall pines behind low dunes, scattered wooden beach huts, soft hazy summer daylight, a few distant figures. atmosphere of a calm warm seaside afternoon.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'sigulda_gauja', 'Сигулда, скалы Гауи',
  $d$the Gauja river valley near Sigulda in Latvia, steep red-sandstone cliffs, dense green forest in the gorge, a medieval castle ruin on a ridge, a winding river below, a wooden viewing platform, bright summer day. atmosphere of a vast green peaceful nature outlook.$d$, now(), now())
ON CONFLICT ("projectId", slug) DO NOTHING;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_06_liga'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A6_SH01','extreme wide shot of the Daugava embankment in Riga at golden summer sunset, strollers, calm river',
   'тебе двадцать семь, лето две тысячи двадцать третьего, и впервые в жизни ты проводишь выходные не на заездах','EWS','high','static',true,false,'gaz_environment',NULL,'daugava_embankment'),
 ('A6_SH02','medium shot of a young woman with long auburn hair, round glasses and a thin gold ankle chain, warm and intelligent',
   'её зовут лига, ей двадцать четыре, она работает в библиотеке и пишет диплом по латышской поэзии','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','daugava_embankment'),
 ('A6_SH03','wide shot of the man and the auburn-haired woman walking together along the sunset embankment',
   'вы гуляете по набережной даугавы до самого заката, и ты ловишь себя на том что не думаешь о машине','WS','eye','track_lateral',false,false,'gaz_environment',NULL,'daugava_embankment'),
 ('A6_SH04','extreme close-up of a thin delicate gold chain on a womans ankle as she sits on the grass',
   'на её щиколотке тонкая золотая цепочка, подарок бабушки, ты будешь видеть её каждый день','ECU','eye','static',true,true,'gaz_environment',NULL,'daugava_embankment'),
 ('A6_SH05','medium close-up of the man relaxed and open, talking like his real self',
   'с ней ты говоришь как тот парень которым ты мог бы стать, если бы в восемь лет не отпустил тот тормоз','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','daugava_embankment'),
 ('A6_SH06','medium shot of the auburn-haired woman reading from a poetry book aloud on a sandy beach',
   'она читает тебе стихи вслух на пляже в юрмале, и ты слушаешь не слова а её голос','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','jurmala_beach'),
 ('A6_SH07','close-up of the mans content peaceful face, a new unfamiliar warmth',
   'это не невесомость, это что-то медленное и тёплое, и ты не знаешь как это называется','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jurmala_beach'),
 ('A6_SH08','medium shot of the man on the phone turning away, telling a lie, the silver car behind him',
   'ты впервые звонишь тренеру и говоришь что не приедешь, у тебя температура, врёшь ему первый раз','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','chiekurkalns_garages'),
 ('A6_SH09','medium close-up of the man at a forest cliff viewpoint with the woman, completely at peace',
   'а сам едешь с лигой в сигулду смотреть на скалы и старый замок, и тебе впервые ничего больше не нужно','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','sigulda_gauja'),
 ('A6_SH10','medium shot of the man sitting with the woman in her flat, carrying an unspoken lie',
   'лига думает что ты работаешь в айти и иногда ездишь в командировки, ты живёшь с этой ложью','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','liga_apartment'),
 ('A6_SH11','close-up of the man watching the woman sleep at night, weighed down by what he hides',
   'иногда ночью ты смотришь на неё спящую и понимаешь сколько ты ей не рассказал','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','liga_apartment'),
 ('A6_SH12','medium shot of the bald mentor in his garage, displeased, arms folded',
   'тренер замечает что ты пропускаешь заезды, медленнее отвечаешь, реже выкладываешь видео','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A6_SH13','close-up of the mentor tapping his steel watch as he delivers an ultimatum',
   'он передаёт через витька короткое, если ты со мной то ты со мной весь, и стучит по стальным часам','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A6_SH14','medium close-up of the man torn between two pulls, conflicted',
   'ты не отвечаешь, ты разрываешься между двумя жизнями, и обе тянут тебя в разные стороны','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH15','medium shot of the man at a dinner table opening his mouth to confess then stopping',
   'однажды за ужином ты открываешь рот чтобы рассказать ей всё, и в последний момент закрываешь','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','liga_apartment'),
 ('A6_SH16','close-up of the auburn-haired woman in glasses sensing something hidden, looking at him a beat too long',
   'лига чувствует что ты что-то прячешь, но не давит, только смотрит на тебя дольше обычного','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','liga_apartment'),
 ('A6_SH17','medium close-up of the man realizing he must cut one of his two lives away',
   'ты понимаешь что так дальше нельзя, что одну из двух жизней придётся отрезать','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH18','wide shot of the black BMW M5 sitting unused under dust in the garage',
   'чёрная м пятёрка неделями стоит в гараже, и ты ловишь себя на мысли что не скучаешь по ней','WS','eye','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A6_SH19','medium shot of the man taking the womans hands in hers in her flat, proposing on impulse',
   'в один вечер у неё дома ты берёшь её руки в свои и говоришь выходи за меня, оно вырывается само','MS','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','liga_apartment'),
 ('A6_SH20','close-up of the auburn-haired woman through her round glasses saying yes, eyes huge',
   'она смотрит на тебя огромными глазами через круглые очки и говорит да, а за стенкой её мать плачет от счастья','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','liga_apartment'),
 ('A6_SH21','medium close-up of the man resolved, deciding everything in one night',
   'в ту же ночь ты решаешь всё, больше ни одного заезда, ты завязываешь, ради неё и ради себя','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','liga_apartment'),
 ('A6_SH22','medium shot of the man telling the bald mentor he is leaving, the mentor still',
   'ты едешь к тренеру и говоришь что выхожу, он молчит, потом кивает, говорит держать не буду','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A6_SH23','close-up of the bald mentors calm face delivering a warning',
   'но запомни, говорит он, такие как ты не уходят насовсем, скорость тебя позовёт, и ты не сможешь не ответить','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A6_SH24','medium close-up of the man insisting against the warning, a flicker of doubt',
   'ты говоришь нет, теперь у меня есть ради чего, и впервые сам в это не до конца веришь','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','chiekurkalns_garages'),
 ('A6_SH25','medium shot of the man handing the black M5 keys to a buyer, keeping the silver car',
   'ты продаёшь чёрную бэху за двадцать тысяч евро, серебристую оставляешь, на ней ты ездишь как все по правилам','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','chiekurkalns_garages'),
 ('A6_SH26','extreme close-up of a phone deleting a chat group and erasing a username',
   'ты удаляешь чат прогрев, стираешь ник перчатка, и впервые за десять лет в голове наступает тишина','ECU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A6_SH27','close-up of the man laying his worn brown leather glove into a drawer and sliding it shut',
   'ты кладёшь свою кожаную перчатку в ящик стола, и не надеваешь её три недели, и тебе почти спокойно','CU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH28','medium shot of the man and woman planning a wedding over papers at a small kitchen table',
   'вы готовите свадьбу на весну, берёте однушку в ипотеку, ты идёшь работать механиком в сервис за тысячу двести','MS','eye','static',false,false,'gaz_environment',NULL,'liga_apartment'),
 ('A6_SH29','close-up of the man lying awake, the quiet starting to ring in his ears',
   'тишина в голове длится полгода, а потом начинает звенеть, по ночам тебе снится трасса и та невесомость','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH30','medium shot of the jittery bleached-blond chipped-tooth friend appearing with news, winter coats',
   'в январе появляется витёк, говорит, парень из таллина зовёт перчатку на заезд, в банке пять тысяч евро','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A6_SH31','close-up of the man clenching his fists at a provocation',
   'говорит, тот хвастается в чатах что перчатка сдулась, испугался, спрятался за юбку, и у тебя сжимаются кулаки','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH32','medium close-up of the man telling himself the lie of one last time',
   'ты говоришь себе один раз, последний, только чтобы закрыть рот этому таллинцу, и ты сам в это веришь','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH33','medium shot of a hand taking the worn glove back out of the drawer, the silver car keys beside it',
   'ты достаёшь перчатку из ящика, и рука помнит её как родную, и невесомость просыпается ещё до машины','MS','eye','push_in',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A6_SH34','close-up of the sleepy auburn-haired woman kissing the man goodbye, trusting',
   'лиге ты говоришь что едешь к другу помочь с машиной, она целует тебя и просит не задерживаться','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','liga_apartment'),
 ('A6_SH35','medium close-up of the man stepping out into the January night, the glove on his right hand',
   'ты выходишь в январскую ночь, в перчатке, к серебристой бэхе, и не знаешь что назад в эту квартиру ты уже не вернёшься','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A6_SH36','extreme wide high shot of the silver BMW driving through empty snowy night streets toward the river bridge',
   'окно которое открыла тебе лига захлопывается в эту секунду, и ты сам нажимаешь на газ','EWS','high','track_lateral',true,true,'gaz_environment',NULL,'southern_bridge')
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
SELECT gen_random_uuid(), s.id, cp."characterId", s."referenceProfileId",
       CASE cp."characterId"
         WHEN '6a200000-0000-4000-8000-0000000000c2' THEN 'тренер'
         WHEN '6a200000-0000-4000-8000-0000000000c3' THEN 'лига'
         ELSE 'ты' END
FROM shots s JOIN character_profiles cp ON cp.id = s."referenceProfileId"
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A6\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
