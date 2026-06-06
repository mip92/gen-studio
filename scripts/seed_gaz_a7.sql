-- Seed: «Газ» A7 «Ночь» (scene act_07_night, 32 shots, renderMode=STATIC). Age 29, Jan 2025.
-- The catastrophe. Echoes cold open beat-for-beat then plays THROUGH the crash. Payoff of
-- "перестал слушать чутьё → погорель". Violence implied, not graphic (stillness, the sneaker,
-- silence) — cautionary, sober. Child motif planted literally. Leitmotif goes out forever.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_07_night'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, broll, iconic, route, profid, locslug) AS (VALUES
 ('A7_SH01','extreme wide shot of a silver BMW approaching the cable-stayed bridge on a January night, wet icy road, snow at the kerbs',
   'без четверти час ночи, январь, ты подъезжаешь к южному мосту, ноль градусов, асфальт мокрый и местами лёд','EWS','low',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH02','medium shot of the man getting out of the silver car at night, breath steaming, the glove on his right hand',
   'ты не садился за руль по-серьёзному полгода, руки отвыкли, но ты говоришь себе что это как на велике','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','southern_bridge'),
 ('A7_SH03','wide shot of a small crew of cars on the bridge approach at night, a bleached-blond chipped-tooth friend waving the man over',
   'витёк встречает тебя, хлопает по плечу, говорит наконец-то перчатка вернулась, все только тебя и ждали','WS','eye',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH04','medium shot of a smug rival standing by a black Audi at night, looking down his nose',
   'таллинец стоит у своей чёрной ауди, смотрит на тебя сверху вниз, говорит а я думал перчатка уже не ездит','MS','eye',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH05','close-up of hands dropping thick euro notes into a shared pot at night',
   'в банк скидывают пять тысяч евро, самый крупный заезд за всю твою жизнь, и половина уже твоя как все думают','CU','eye',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH06','medium close-up of the mans face going still as a quiet warning rises in him',
   'и тут впервые за годы твоё чутьё говорит тебе тихо и ясно, не сегодня, развернись и уезжай','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','southern_bridge'),
 ('A7_SH07','close-up of the mans face hardening as he overrides the warning, pride winning',
   'но рядом ухмыляется таллинец, и пять тысяч, и гордость, и ты впервые в жизни не слушаешь чутьё','CU','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','southern_bridge'),
 ('A7_SH08','extreme close-up of the worn glove tightening on the gear lever inside the silver car',
   'ты натягиваешь перчатку, садишься в серебристую бэху, и тренер сейчас сказал бы что ты везёшь погорель','ECU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A7_SH09','close-up of patches of black ice gleaming on the wet bridge asphalt under the lamps',
   'на мосту местами наледь, ты это видишь и говоришь себе пройду аккуратно, ты ещё думаешь что управляешь этим','CU','eye',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH10','extreme wide high shot of two cars staged at the line on the empty night bridge, a figure raising an arm',
   'вы встаёте на линию на пустом мосту, как тысячу раз до этого, витёк поднимает руку','EWS','high',false,true,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH11','extreme close-up of an arm dropping to start the race, motion frozen',
   'рука падает, и вы срываетесь, и первые секунды ты снова дома, всё как раньше','ECU','eye',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A7_SH12','medium close-up of the mans face as the old rush flares one final time',
   'под рёбрами вспыхивает та невесомость, последний раз в твоей жизни, и ты этого ещё не знаешь','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A7_SH13','close-up of a speedometer needle sweeping past one hundred eighty, dashboard glow',
   'сто шестьдесят, сто восемьдесят, чёрная ауди идёт ноздря в ноздрю, мост летит под колёса','CU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A7_SH14','medium close-up of the mans focused face with a flicker of overconfidence',
   'ты идёшь на полкорпуса впереди и решаешь дожать на съезде, там где всегда никого нет в этот час','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A7_SH15','wide shot of the two cars hurtling toward the bridge exit ramp at high speed at night',
   'ты влетаешь на съезд у маскавас на ста восьмидесяти, и полгода без практики решают всё','WS','low',false,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH16','close-up of the mans eyes catching headlights where none should be',
   'краем глаза ты ловишь свет фар там где их быть не должно, на съезде кто-то есть','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A7_SH17','extreme close-up of a tyre hitting a patch of black ice on the asphalt',
   'ты бьёшь по тормозам, но под колёсами наледь, и машина не слушается руля','ECU','eye',true,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH18','extreme wide high shot of a grey family hatchback rolling slowly onto the slip road, a father at the wheel and a woman beside him',
   'на съезд медленно выезжает серый опель, в нём отец за рулём, рядом жена, сзади спит ребёнок','EWS','high',false,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH19','close-up through a car window of a small child asleep in a booster seat, peaceful',
   'им по тридцать с небольшим, они едут домой от родни, ребёнку пять лет, он спит и ничего не чувствует','CU','eye',false,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH20','extreme close-up of a gloved hand and a boot stamping the brake pedal to the floor',
   'ты видишь их за полсекунды, твоя нога вжимает тормоз в пол, но сто восемьдесят на льду это не сорок метров','ECU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A7_SH21','wide dutch-angle shot of the silver sedan sliding sideways across the icy ramp straight toward the grey hatchback',
   'серебристую бэху разворачивает боком и несёт прямо на серый опель, и ты уже ничего не можешь сделать','WS','dutch',false,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH22','close-up of the mans face in the final instant, the dawning understanding flooding in',
   'за это мгновение ты успеваешь подумать только одно, я не успеваю, и это последняя мысль прежнего тебя','CU','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','bmw_interior'),
 ('A7_SH23','extreme close-up of a single shattering headlight, the moment of impact implied, no gore',
   'дальше удар, и звук который ты будешь слышать каждую ночь следующие двадцать лет, и потом тишина','ECU','eye',true,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH24','extreme wide high shot of two cars crushed together on the ramp, steam rising in the headlight beams, utter stillness',
   'две машины сминаются в одну, пар поднимается в свете фар, на мосту вдруг становится очень тихо','EWS','high',false,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH25','medium shot of the man climbing out of his wrecked car almost unhurt, dazed, on unsteady legs',
   'ты выходишь из своей машины почти целым, ноги держат, и идёшь к серому опелю на ватных ногах','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','maskavas_intersection'),
 ('A7_SH26','medium close-up of the crushed driver side of the grey hatchback, dark and motionless inside, no movement',
   'опель смят с водительской стороны, внутри не двигается никто, ты зовёшь но никто не отвечает','MCU','eye',false,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH27','extreme close-up of a small childs sneaker lying alone on the wet asphalt beside a broken door',
   'на мокром асфальте у разбитой двери лежит маленькая детская кроссовка, и ты не можешь отвести от неё глаз','ECU','high',true,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH28','close-up of the mans face as something breaks in him forever, hollowing out',
   'в эту секунду что-то в тебе ломается навсегда, и невесомость под рёбрами гаснет и больше не вернётся никогда','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','maskavas_intersection'),
 ('A7_SH29','medium shot of distant flashing blue lights washing over the bridge, the man standing alone, the others gone',
   'вдалеке появляются мигалки, синий свет заливает мост, витёк и остальные давно разъехались, ты стоишь один','MS','eye',false,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('A7_SH30','medium close-up of a calm hand settling on the mans shoulder from behind in the blue strobe',
   'и в этот момент тебе на плечо ложится ладонь, тихо, без нажима, и голос говорит пройдёмте со мной','MCU','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','maskavas_intersection'),
 ('A7_SH31','close-up of the mans face understanding everything at once',
   'ты понимаешь что это та самая ладонь из начала твоей истории, та секунда на которой обрывается всё','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','maskavas_intersection'),
 ('A7_SH32','extreme wide high shot of the wrecked intersection in the blue strobe, a small figure being led away from the cars',
   'двадцать один год от той бетонной горки в болдерае до этой ладони на южном мосту, всё вело сюда','EWS','high',true,true,'gaz_environment',NULL,'maskavas_intersection')
)
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "isBroll", "isIconic",
  "renderMode", "workflowRouteKey", "referenceProfileId", "locationId", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), (SELECT id FROM proj), (SELECT id FROM scn), v."shotCode",
  jsonb_build_object('positive', style.sb || ', ' || v.sub, 'narrationRu', v.narr),
  v.narr, v.stype, v.sang, 'static', v.broll, v.iconic,
  'static', v.route, v.profid,
  (SELECT id FROM locations WHERE "projectId"=(SELECT id FROM proj) AND slug=v.locslug),
  now(), now()
FROM v, style
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

UPDATE shots SET "promptFields" = "promptFields" || jsonb_build_object('positivePrompt', "promptFields"->>'positive')
WHERE "projectId"='6a200000-0000-4000-8000-000000000001' AND "promptFields"->>'positivePrompt' IS NULL;

INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, cp."characterId", s."referenceProfileId", 'ты'
FROM shots s JOIN character_profiles cp ON cp.id = s."referenceProfileId"
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A7\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
