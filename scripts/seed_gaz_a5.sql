-- Seed: «Газ» A5 «Подъём» (scene act_05_climb, 40 shots). Age 24, Riga 2018 (EURO).
-- Peak of the racing career: fame, black M5, €2-3k nights, the blind-zone "science",
-- the hollow-at-the-top + "что если навсегда" + three-futures echo, and the bookshop
-- meeting with LIGA (point-of-no-return setup → A6). RACER_ADULT. Adds bookshop_terbatas.
SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'bookshop_terbatas', 'Книжный на Тербатас',
  $d$interior of a small cosy independent bookshop on Terbatas street in central Riga, tall wooden shelves packed with books, a poetry section, a little coffee corner with a chrome machine, warm pendant lights, a worn parquet floor, a tall street-facing window with afternoon light, handwritten shelf labels. atmosphere of a quiet warm paper-and-coffee refuge.$d$, now(), now())
ON CONFLICT ("projectId", slug) DO NOTHING;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_05_climb'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A5_SH01','extreme wide high shot of night Riga in the late 2010s, lit bridges over the dark river',
   'проходит два года, тебе двадцать четыре, на дворе две тысячи восемнадцатый, перчатку знает вся ночная рига','EWS','high','static',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('A5_SH02','medium shot of the confident young man at a night meet as other racers come to greet him',
   'ты больше не новичок, к тебе подходят знакомиться, тебя зовут на заезды первым','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','industrial_race_lot'),
 ('A5_SH03','wide shot of a sleek black BMW M5 sedan parked under a streetlight, menacing and clean',
   'ты покупаешь вторую машину, чёрную бэху м пятёрку за наличные, зверь под четыреста сил','WS','low','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A5_SH04','extreme close-up of a gloved right hand resting on the gear lever of the new black car',
   'старую серебристую ты не продаёшь, она стоит в гараже, но гоняешь теперь на чёрной','ECU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A5_SH05','medium close-up of the man driving the black M5 in full control at night',
   'на ней ты делаешь то что раньше не мог, и перчатка на правой руке всё та же, твоя примета','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A5_SH06','extreme wide shot of the dark forest highway at night with two cars staged for a race',
   'вы гоняете на трассе в юрмалу по ночам, перекрываете полосу, в банке по две три тысячи евро','EWS','eye','static',false,false,'gaz_environment',NULL,'jurmala_highway'),
 ('A5_SH07','wide low shot of two cars at extreme speed on the straight forest highway, pines blurring',
   'двести пятьдесят по прямой среди сосен, фары встречных редки, и ты режешь воздух как нож','WS','low','track_lateral',true,true,'gaz_environment',NULL,'jurmala_highway'),
 ('A5_SH08','medium close-up of the mans serene face at speed, utterly at home',
   'невесомость под рёбрами теперь твой дом, единственное место где тебе по-настоящему спокойно','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A5_SH09','medium shot of out-of-town racers arriving with their tuned cars at a meet',
   'к вам приезжают гонщики из вильнюса и таллина, балтийская сцена тесная, все друг про друга знают','MS','eye','static',false,false,'gaz_environment',NULL,'industrial_race_lot'),
 ('A5_SH10','close-up of the mans satisfied face after beating a rival, headlights behind',
   'ты обыгрываешь чемпиона из каунаса на его же ауди, и о перчатке пишут в чатах трёх стран','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','industrial_race_lot'),
 ('A5_SH11','medium shot of the mans mother proudly hanging a framed mechanic diploma on the flat wall',
   'днём ты заканчиваешь заочный, получаешь диплом автомеханика, мать вешает его в рамку на стену','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A5_SH12','medium close-up of the man politely declining a job offer across a service-shop desk',
   'тебе предлагают нормальную работу в сервисе за тысячу двести в месяц, и ты вежливо отказываешься','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','chiekurkalns_garages'),
 ('A5_SH13','close-up of the mans calculating face',
   'тысяча двести за месяц, когда ты делаешь столько за одну ночь, ты уже не можешь считать иначе','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A5_SH14','extreme close-up of a phone showing a hand-marked city map of camera and patrol blind zones',
   'ты знаешь ригу как никто, где слепые камеры, где пересменка патрулей, где можно разогнаться','ECU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A5_SH15','medium shot of the man driving a daytime route slowly with a stopwatch, scouting like an engineer',
   'ты выясняешь это сам, днём проезжаешь маршрут с секундомером, считаешь как настоящий инженер','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','southern_bridge'),
 ('A5_SH16','close-up of the mans eyes holding two thoughts at once, calm and double',
   'твой мозг держит два режима сразу, видимый где ты обычный парень, и невидимый где ты всё просчитал','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A5_SH17','medium shot of the bald mentor handing the man the keys to the biggest-money race, trusting',
   'тренер доверяет тебе самые денежные заезды, ты тихий и точный, ты ни разу не привёз погорель','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A5_SH18','extreme close-up of thick euro bundles stacked inside a small safe',
   'к концу того года у тебя в тайнике сорок тысяч евро, и ты не знаешь зачем тебе столько','ECU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A5_SH19','medium close-up of the man counting money with a blank joyless face',
   'ты считаешь деньги и не чувствуешь ничего, важны не они, важна только следующая невесомость','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH20','medium shot of the man sitting alone and restless in his bare rented flat at night',
   'ты снял свою квартиру чтобы не объяснять родителям ночные отъезды, и часто сидишь в ней один','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH21','close-up of the man lying awake in bed at night, a question forming',
   'однажды ночью ты ловишь себя на простой мысли, а что если это навсегда','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH22','medium close-up of the man staring at the ceiling trying and failing to picture his future',
   'ты пробуешь представить себя в тридцать, и не получается, картинка не складывается','MCU','eye','static',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH23','medium shot of the man at the dark window, three faint futures implied in his reflection',
   'либо ты так же гоняешь но уже по-крупному, либо ты где-то лежишь, либо обычная жизнь работа семья','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH24','medium close-up of the man unable to assemble the ordinary future, eyes closing',
   'третий вариант ты не можешь собрать, куски не подходят друг к другу, и ты засыпаешь без ответа','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH25','medium shot of the man carrying a new washing machine into his parents flat',
   'ты делаешь родителям ремонт, покупаешь матери стиральную машину, говоришь накопил с зарплаты','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH26','close-up of the tearful happy mother embracing the man in the kitchen',
   'мать плачет от счастья, обнимает тебя, пахнет её старыми духами, и ты думаешь только не заплакать','CU','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A5_SH27','medium close-up of the man over his mothers shoulder, the chasm in his eyes',
   'между сыном которого она обнимает и тем кто ты есть, лежит пропасть, и она всё шире','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','racer_apartment'),
 ('A5_SH28','wide shot of a deer stepping onto the forest highway as a car swerves past it at speed',
   'на трассе в юрмалу из леса выходит косуля, ты уходишь от неё на двухстах в сантиметрах','WS','eye','track_lateral',true,true,'gaz_environment',NULL,'jurmala_highway'),
 ('A5_SH29','close-up of the man shaking on the roadside verge after the near miss, then steeling up',
   'тебя трясёт минуту на обочине, потом ты заводишься и едешь дальше, потому что остановиться не умеешь','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jurmala_highway'),
 ('A5_SH30','medium close-up of the mans face with a dark realization',
   'ты понимаешь что боишься не разбиться, а того что не сможешь вернуться к обычной жизни даже если захочешь','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jurmala_highway'),
 ('A5_SH31','medium shot of the man standing at the top of his world among the crew yet visibly empty',
   'ты на вершине, у тебя машины деньги уважение, и внутри пусто как в выключенном моторе','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','industrial_race_lot'),
 ('A5_SH32','close-up of the bald mentor clapping the mans shoulder with rough approval',
   'тренер хлопает тебя по плечу, говорит ты лучший кого я видел, а тебе от этого только тяжелее','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','industrial_race_lot'),
 ('A5_SH33','medium shot of the black car drifting slowly and aimlessly through the grey daytime city centre',
   'в один серый вторник ты едешь без цели по центру, просто чтобы не сидеть в пустой квартире','MS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','southern_bridge'),
 ('A5_SH34','wide shot of a quiet city street with a small independent bookshop, the black car stopping outside',
   'ты тормозишь у книжного на улице тербатас, сам не зная зачем, ты не был в книжном лет десять','WS','eye','static',true,false,'gaz_environment',NULL,'bookshop_terbatas'),
 ('A5_SH35','medium shot of the man stepping into the warm bookshop, out of place yet calmer',
   'ты заходишь внутрь, пахнет бумагой и кофе, и ты чувствуешь себя здесь чужим и спокойным одновременно','MS','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bookshop_terbatas'),
 ('A5_SH36','medium close-up of a young woman at the poetry shelf, long wavy auburn hair, round glasses, a thin gold chain on her ankle',
   'у полки с поэзией стоит девушка, рыжие волосы, круглые очки, и тонкая золотая цепочка на щиколотке','MCU','eye','static',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','bookshop_terbatas'),
 ('A5_SH37','close-up of the mans face as something quite unlike the racing rush moves in him',
   'она поднимает на тебя глаза и улыбается просто так, и под рёбрами у тебя что-то совсем не похожее на невесомость','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bookshop_terbatas'),
 ('A5_SH38','medium shot of the auburn-haired woman in glasses asking the man a light friendly question',
   'она спрашивает не подскажешь ли что почитать, и ты, король ночной риги, не знаешь что ответить','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f3','bookshop_terbatas'),
 ('A5_SH39','medium close-up of the man caught off guard, suddenly just himself, almost smiling',
   'ты что-то мямлишь, она смеётся, и впервые за годы ты говоришь как настоящий ты, а не как перчатка','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bookshop_terbatas'),
 ('A5_SH40','extreme wide shot of the quiet daytime street, the black car parked outside the lit bookshop window',
   'ты выходишь через час с книгой которую не собирался покупать, и не знаешь что только что свернул с дороги','EWS','high','static',true,true,'gaz_environment',NULL,'bookshop_terbatas')
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
  AND s."shotCode" LIKE 'A5\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
