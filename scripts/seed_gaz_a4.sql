-- Seed: «Газ» A4 «Тренер» (scene act_04_trener, 38 shots). Age 21-22, Riga 2016 (EURO).
-- TRENER enters (anchor: steel watch he taps). Chip-tuning, serious-money races, his
-- rules ("погорель"), father injured → money home, crashed crew member (setup), full
-- commitment. Uses RACER_YOUNG + TRENER_BASE. renderMode default; animated-prefix re-run after.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_04_trener'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A4_SH01','extreme wide shot of a row of private garages in the Chiekurkalns district at dusk in the mid-2010s, parked old cars',
   'тебе двадцать один, две тысячи шестнадцатый, и однажды витёк говорит, тобой интересуется тренер','EWS','high','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A4_SH02','medium shot of the young man arriving on foot at a lit garage box in the evening, summoned',
   'тебя зовут в гаражи в чиекуркалнсе вечером, не на заезд, а просто поговорить, и ты едешь','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A4_SH03','wide shot of a cramped garage interior with a bald heavyset man in his mid-forties sitting at a cluttered oil-stained workbench, a car on a pit behind him',
   'за верстаком сидит тренер, лысый, грузный, лет сорока пяти, тяжёлые руки механика','WS','eye','static',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH04','extreme close-up of a massive brushed-steel diver wristwatch on a thick wrist as a finger taps its face',
   'на левой руке у него массивные стальные часы, он постукивает по ним когда думает, ты запомнишь их навсегда','ECU','eye','push_in',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A4_SH05','medium shot of the bald heavyset mentor pouring tea into a plain mug and studying the young man in silence',
   'он наливает тебе чай, молчит две минуты, потом спрашивает, сколько заездов за месяц и попадался ли','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH06','close-up of the young mans face answering steadily under the mentors gaze',
   'ты отвечаешь, двадцать заездов, ни разу, и тренер впервые смотрит тебе в глаза','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A4_SH07','medium shot of the bald mentor leaning forward making an offer, serious',
   'он говорит, у меня есть заезды на серьёзные деньги, не кепка с полтинниками, а тысячи, но там другие правила','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH08','medium close-up of the young man thinking then giving a short nod of agreement',
   'ты думаешь ровно десять секунд, как он и любит, и говоришь да, и не замечаешь как захлопывается ещё одна дверь','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A4_SH09','wide shot of the silver BMW up on the garage pit with the bald mentor working under the bonnet, tools and a laptop',
   'первым делом тренер берётся за твою бэху, говорит, с таким мотором ты только людей смешишь','WS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH10','close-up of hands plugging a laptop cable into a cars diagnostic port',
   'он подключает ноутбук к разъёму, заливает в блок управления новую прошивку за триста пятьдесят евро','CU','eye','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A4_SH11','extreme close-up of a glowing engine control unit circuit board in a hand',
   'чип-тюнинг добавляет твоей машине семьдесят лошадей, и теперь она едет совсем по-другому','ECU','eye','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A4_SH12','medium shot of the young man flooring the tuned BMW on the empty airport road at night, pressed back',
   'ты выезжаешь ночью на трассу у аэропорта, давишь газ, и тебя вжимает в кресло сильнее чем когда-либо','MS','low','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','lidostas_road'),
 ('A4_SH13','medium close-up of the young man laughing aloud alone in the car, the rush overwhelming',
   'невесомость под рёбрами становится такой острой, что ты смеёшься вслух один в пустой машине','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A4_SH14','close-up of a speedometer needle sweeping past two hundred, dashboard glow',
   'стрелка уходит за двести, чего твоя старая бэха не могла, и ты понимаешь, это другой уровень','CU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A4_SH15','medium shot of the bald mentor listening to the running engine and nodding approval',
   'тренер слушает мотор, кивает, говорит, теперь машина готова, посмотрим готов ли ты','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH16','close-up of the young mans resolved face',
   'ты готов, ты ждал этого с восьми лет, с той бетонной горки в болдерае','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A4_SH17','extreme close-up of a gloved right hand tightening its grip on a steering wheel',
   'ты натягиваешь перчатку чуть туже, и впервые думаешь о заездах не как о забаве, а как о работе','ECU','eye','static',false,false,'gaz_environment',NULL,'bmw_interior'),
 ('A4_SH18','extreme wide shot of the Southern Bridge deck at three in the morning blocked off, two powerful cars at the line, watchers',
   'первый серьёзный заезд на южном мосту в три ночи, перекрыт пацанами на въездах, в банке тысяча евро','EWS','high','static',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('A4_SH19','medium shot of the bald mentor laying down rules to the young man before the race, stern',
   'тренер говорит правила, никакого алкоголя за сутки, полное послушание старшему, не жадничать','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','southern_bridge'),
 ('A4_SH20','close-up of the mentor tapping his steel watch as he speaks a warning',
   'и главное, говорит он постукивая по часам, если перестанешь слушать чутьё, привезёшь нам погорель','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','southern_bridge'),
 ('A4_SH21','medium close-up of the young man nodding, taking in the warning',
   'ты киваешь, и эти слова ты будешь помнить, особенно потом, когда перестанешь их выполнять','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','southern_bridge'),
 ('A4_SH22','wide shot of two powerful cars launching down the empty bridge, sodium lamps blurring into one line',
   'загорается фонарик, и вы срываетесь по пустому мосту, двести двадцать, фонари в одну полосу','WS','low','track_lateral',false,true,'gaz_environment',NULL,'southern_bridge'),
 ('A4_SH23','medium close-up of the young man at the wheel in deep calm focus mid-race, a rival audi roaring alongside',
   'рядом ревёт чужая ауди, под рёбрами та самая невесомость, и тебе так спокойно как нигде больше','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A4_SH24','close-up of headlights crossing the far end of the bridge one car-length ahead',
   'ты выигрываешь корпус, потом ещё корпус, и на той стороне моста тебе отдают тысячу евро одной пачкой','CU','low','track_lateral',false,false,'gaz_environment',NULL,'southern_bridge'),
 ('A4_SH25','medium shot of the young man calmly pocketing a thick band of euro notes',
   'руки у тебя больше не дрожат, ты привык, тысяча евро за пять минут стала обычным делом','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','southern_bridge'),
 ('A4_SH26','close-up of the bald mentor counting off his cut of the money, satisfied',
   'тренер забирает свои тридцать процентов и говорит, ты тихий и точный, таких я беру к себе','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','southern_bridge'),
 ('A4_SH27','medium shot of the young man standing among a small crew of racers, belonging',
   'у тренера своя бригада, человек пять, и теперь ты один из них, у тебя есть место','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A4_SH28','extreme close-up of stacks of euro notes lying in an opened drawer',
   'к лету у тебя на счету десять тысяч евро, больше чем родители вдвоём зарабатывают за полгода','ECU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A4_SH29','medium shot of the tired father at home with a hand on his injured lower back, smaller and older',
   'тем летом отец надрывает спину в порту, его переводят на лёгкий труд, денег в доме становится меньше','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A4_SH30','medium close-up of the young man quietly pressing euro notes into his mothers hand in the kitchen',
   'ты начинаешь давать матери деньги, по триста евро, говоришь премия в автосервисе, она верит и гордится','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A4_SH31','close-up of the young man lowering his eyes as his mother touches his head',
   'она гладит тебя по голове и говорит хороший сын, и тебе тяжело слышать слово хороший','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A4_SH32','medium close-up of the young mans conflicted face, two people in one',
   'ты понимаешь что мать обнимает человека которого уже почти нет, а кто ты теперь ты и сам не знаешь','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A4_SH33','medium shot of the bald mentor speaking coldly and flatly about an absent crew member',
   'один из бригады разбивается на трассе, выживает но без ноги, тренер говорит только, не слушал чутьё','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f2','chiekurkalns_garages'),
 ('A4_SH34','close-up of the young mans face flickering with fear then forcing it down',
   'ты на секунду пугаешься, потом давишь это в себе, ты же тихий и точный, с тобой так не будет','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A4_SH35','extreme close-up of the steel watch on the mentors wrist as he taps it and moves on',
   'тренер постукивает по своим стальным часам и переводит разговор на следующий заезд как будто ничего не было','ECU','eye','static',true,false,'gaz_environment',NULL,'chiekurkalns_garages'),
 ('A4_SH36','medium shot of the young man staying, committed, not leaving the garage',
   'ты не уходишь, ты остаёшься, потому что без невесомости дни снова станут серыми, а ты так уже не можешь','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A4_SH37','wide shot of the tuned silver BMW pulling out into the night, confident',
   'тебе двадцать два, у тебя десять тысяч на счету, разогнанная бэха и место в бригаде тренера','WS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A4_SH38','extreme wide high shot of night Riga spread out below, lit and vast',
   'и тебе кажется что ты управляешь своей жизнью, хотя на самом деле ей уже управляет та невесомость','EWS','high','static',true,true,'gaz_environment',NULL,'southern_bridge')
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

-- Participants: derive character from the referenced profile (RACER or TRENER).
INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, cp."characterId", s."referenceProfileId",
       CASE WHEN cp."characterId"='6a200000-0000-4000-8000-0000000000c2' THEN 'тренер' ELSE 'ты' END
FROM shots s JOIN character_profiles cp ON cp.id = s."referenceProfileId"
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" LIKE 'A4\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
