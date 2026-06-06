-- Seed: «Газ» A9 «После» (scene act_09_aftermath, 30 shots, renderMode=STATIC). Age 36, 2032.
-- Release, mother at the gates, can't rebuild (record, Vitek gone to Ireland, Trener never
-- caught, Liga in Germany), never drives again, the empty pit + the impact-sound, tire shop,
-- the quiet boy returned, the cemetery + the surviving widower (8 years weekly), chrysanthemums
-- left at the gate (cannot place on the grave), the Bolderaja dam. Adds RACER_OLD profile.
SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO character_profiles (id, "characterId", "profileCode", "ageLabel", "targetImages", "useIpAdapter", "triggerToken", "promptBase", negative, "createdAt") VALUES
 ('6a200000-0000-4000-8000-0000000000f8', '6a200000-0000-4000-8000-0000000000c1', 'RACER_OLD', 'adult 36', 0, true, 'r4cerold',
  'a gaunt hollowed 36-year-old man, prematurely greying short dark hair, deep tired lines on a thin face, sunken empty grey eyes, plain grey work clothes, NO glove on either hand, a quiet broken stillness in his posture, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
  'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, young, glove, athletic, cheerful, deformed hands, extra fingers', now())
ON CONFLICT (id) DO NOTHING;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_09_aftermath'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, broll, iconic, locslug) AS (VALUES
 ('A9_SH01','extreme wide shot of high grey prison walls and a gate from the outside on an overcast day',
   'ты выходишь по удо в тридцать шесть, отсидев семь лет из восьми, ворота закрываются за спиной в последний раз','EWS','low',true,false,'jelgava_prison'),
 ('A9_SH02','medium shot of a gaunt prematurely-grey 36-year-old man stepping out of the gate with a small bag',
   'восемь лет назад сюда вошёл двадцатидевятилетний гонщик, выходит другой человек, седой и тихий','MS','eye',false,true,'jelgava_prison'),
 ('A9_SH03','wide shot of a tiny grey-haired old mother waiting beside a neighbours modest car',
   'тебя встречает мать, совсем маленькая, совсем седая, в чужой машине с соседом за рулём','WS','eye',false,false,'jelgava_prison'),
 ('A9_SH04','close-up of the gaunt man weeping as his old mother strokes his greying head',
   'ты обнимаешь её и первый раз за много лет плачешь, а она гладит тебя по седой голове и молчит','CU','eye',false,true,'jelgava_prison'),
 ('A9_SH05','extreme wide shot of a changed Riga skyline in the early 2030s, new buildings, unfamiliar',
   'город изменился за восемь лет, новые дома, новые машины, всё чужое, и ты в нём как турист из прошлого','EWS','high',true,false,'southern_bridge'),
 ('A9_SH06','medium close-up of the man holding an unfamiliar new smartphone, lost',
   'ты держишь в руках смартфон которого не понимаешь, и евро которых стало меньше, и не знаешь куда идти','MCU','eye',false,false,'racer_apartment'),
 ('A9_SH07','medium shot of the man standing in his old childhood room in the family flat',
   'ты возвращаешься в материнскую двушку на болдерае, в свою детскую комнату, где всё началось','MS','eye',false,false,'racer_apartment'),
 ('A9_SH08','medium close-up of the man receiving a polite refusal across a desk, head lowered',
   'с твоей статьёй на работу не берут, ни в сервис ни охранником, везде вежливый отказ через одного','MCU','eye',false,false,'racer_apartment'),
 ('A9_SH09','close-up of a criminal-record document with a grave charge line',
   'судимость за гибель двух человек это клеймо, и ты понимаешь что носить его будешь до конца','CU','high',true,false,NULL),
 ('A9_SH10','medium close-up of the man alone, no friends left around him',
   'старые друзья исчезли, витёк уехал в ирландию ещё на втором году твоего срока, больше ты его не видел','MCU','eye',false,false,'racer_apartment'),
 ('A9_SH11','medium shot of distant tuned cars at a far-off night meet, a life that goes on without him',
   'тренера так и не взяли, бригада до сих пор гоняет где-то между ригой и таллином, только без тебя','MS','eye',true,false,'industrial_race_lot'),
 ('A9_SH12','close-up of the mans face learning old news quietly, no anger',
   'ты узнаёшь что лига вышла замуж за врача и уехала в германию на пятый год твоего срока, ты её не ищешь','CU','eye',false,false,'racer_apartment'),
 ('A9_SH13','medium close-up of the man turning away from a parked car, refusing the wheel',
   'ты никогда больше не садишься за руль, у тебя нет прав и нет машины, и ты не хочешь','MCU','eye',false,false,'racer_apartment'),
 ('A9_SH14','extreme close-up of an expired cut driving licence lying in a drawer',
   'та невесомость под рёбрами которая вела тебя двадцать один год исчезла в ту секунду на съезде, и больше её нет','ECU','high',true,false,'racer_apartment'),
 ('A9_SH15','close-up of the mans hollow face, an emptiness where the rush used to live',
   'на её месте теперь тихая пустая яма, и ты живёшь с ней каждый день как с отрезанным пальцем','CU','eye',false,false,'racer_apartment'),
 ('A9_SH16','extreme wide shot of a small tyre-fitting workshop on the grey edge of the city',
   'через год тебя берут разнорабочим в шиномонтаж на окраине, восемьсот евро в месяц, и ты рад и этому','EWS','eye',true,false,'tire_shop'),
 ('A9_SH17','medium shot of the man changing a car tyre on a machine, grey overalls',
   'ты бортируешь колёса по двенадцать часов, и никто здесь не знает что когда-то тебя звали перчатка','MS','eye',false,false,'tire_shop'),
 ('A9_SH18','close-up of the mans quiet unremarkable face, the silent boy returned',
   'ты снова тихий, как тот мальчик со второго этажа, которого просто много не замечали','CU','eye',false,false,'tire_shop'),
 ('A9_SH19','extreme close-up of the mans bare right hand working, no glove on it anymore',
   'на твоей правой руке больше нет перчатки, она осталась в пакете под опись восемь лет назад','ECU','eye',true,false,'tire_shop'),
 ('A9_SH20','medium shot of the man shaking his head, declining a coworkers offer by a tuned car',
   'парень в сервисе зовёт тебя прохватить на его заряженной машине, ты отказываешься, говоришь не вожу','MS','eye',false,false,'tire_shop'),
 ('A9_SH21','close-up of the man waking at night, haunted by a sound only he hears',
   'по ночам ты до сих пор слышишь тот звук удара, его ты не отрежешь от себя никогда','CU','eye',false,false,'racer_apartment'),
 ('A9_SH22','medium shot of the man sitting at a window in the evening watching the road below',
   'по вечерам ты сидишь у окна и смотришь на дорогу, по которой едут чужие живые люди','MS','eye',false,false,'racer_apartment'),
 ('A9_SH23','medium close-up of the mans thoughtful face at the window',
   'и думаешь что каждый из них стоит сейчас на какой-то своей тонкой черте, и не все заметят как её перейдут','MCU','eye',false,false,'racer_apartment'),
 ('A9_SH24','extreme wide shot of a quiet Riga cemetery under an overcast sky, bare trees',
   'однажды ты приезжаешь на кладбище где похоронены та женщина и тот мальчик, ты узнал где, ты долго не решался','EWS','high',true,false,'cemetery_riga'),
 ('A9_SH25','medium shot of the man standing far back from two graves holding cheap white chrysanthemums',
   'ты стоишь в стороне с дешёвыми белыми хризантемами, и не подходишь ближе, ты не имеешь права','MS','eye',false,true,'cemetery_riga'),
 ('A9_SH26','close-up of a grief-aged man standing alone at two graves, the surviving father',
   'у могил стоит тот отец, постаревший, один, он приходит сюда каждую неделю восемь лет','CU','eye',false,true,'cemetery_riga'),
 ('A9_SH27','medium close-up of the gaunt man unable to step forward, turning to leave',
   'ты хотел бы попросить прощения, но любые слова это плевок на эти две могилы, и ты уходишь не подойдя','MCU','eye',false,false,'cemetery_riga'),
 ('A9_SH28','close-up of white chrysanthemums laid on the ground by a cemetery gate, not on a grave',
   'ты оставляешь свои хризантемы у ворот кладбища, потому что положить их на могилу ты не смеешь','CU','high',true,true,'cemetery_riga'),
 ('A9_SH29','medium shot of the man alone at his window at dusk, utterly solitary',
   'тебе тридцать шесть, у тебя нет жены, нет детей, нет друзей, есть мать, шиномонтаж и тишина','MS','eye',false,false,'racer_apartment'),
 ('A9_SH30','extreme wide high shot of grey Bolderaja at dusk with the river dam where it all began',
   'и каждый вечер ты смотришь на ту самую дамбу в болдерае, где восьмилетний мальчик впервые отпустил тормоз','EWS','high',true,true,'bolderaja_yard')
)
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "isBroll", "isIconic",
  "renderMode", "workflowRouteKey", "referenceProfileId", "locationId", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), (SELECT id FROM proj), (SELECT id FROM scn), v."shotCode",
  jsonb_build_object('positive', style.sb || ', ' || v.sub, 'narrationRu', v.narr),
  v.narr, v.stype, v.sang, 'static', v.broll, v.iconic,
  'static',
  CASE WHEN v.stype IN ('MS','MCU','CU') AND v."shotCode" NOT IN ('A9_SH03','A9_SH26') THEN 'gaz_character_ip' ELSE 'gaz_environment' END,
  CASE WHEN v.stype IN ('MS','MCU','CU') AND v."shotCode" NOT IN ('A9_SH03','A9_SH26') THEN '6a200000-0000-4000-8000-0000000000f8' ELSE NULL END,
  CASE WHEN v.locslug IS NULL THEN NULL ELSE (SELECT id FROM locations WHERE "projectId"=(SELECT id FROM proj) AND slug=v.locslug) END,
  now(), now()
FROM v, style
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

UPDATE shots SET "promptFields" = "promptFields" || jsonb_build_object('positivePrompt', "promptFields"->>'positive')
WHERE "projectId"='6a200000-0000-4000-8000-000000000001' AND "promptFields"->>'positivePrompt' IS NULL;

INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, cp."characterId", s."referenceProfileId", 'ты'
FROM shots s JOIN character_profiles cp ON cp.id = s."referenceProfileId"
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A9\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
