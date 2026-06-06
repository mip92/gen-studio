-- Seed: «Газ» A3 «Чат» (scene act_03_chat, 34 shots). Age 19-20, Riga 2015 (EURO now).
-- Joins closed race-chat «Прогрев», handle «Перчатка» (ties to glove anchor), first
-- organized races + bets, reputation, denial of danger, double life. Adds RACER_YOUNG
-- profile + industrial_race_lot location. renderMode left default; animated-prefix re-run after.
SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO character_profiles (id, "characterId", "profileCode", "ageLabel", "targetImages", "useIpAdapter", "triggerToken", "promptBase", negative, "createdAt") VALUES
 ('6a200000-0000-4000-8000-0000000000f7', '6a200000-0000-4000-8000-0000000000c1', 'RACER_YOUNG', 'young adult 20', 0, true, 'r4ceryng',
  'a lean 20-year-old Russian-speaking man from Riga, short dark-brown hair, narrow focused grey eyes, faint light stubble, wearing a plain dark jacket and jeans, the worn brown leather fingerless driving glove on his RIGHT hand only as his identity anchor, intense confident expression, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
  'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, child, teenager, older man, beard, two gloves, deformed hands, extra fingers', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'industrial_race_lot', 'Промзона Кундзиньсала (заезды)',
  $d$a derelict industrial yard on Kundzinsala island in Riga at night, cracked concrete slabs, abandoned warehouse walls with broken windows, rusty gates, weeds through the tarmac, a single flickering floodlight, scattered cars parked in a loose semicircle with their headlights pointed inward, harbour cranes and the river beyond. atmosphere of a hidden after-midnight gathering place.$d$, now(), now())
ON CONFLICT ("projectId", slug) DO NOTHING;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_03_chat'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('A3_SH01','extreme wide high shot of Riga in 2015, ordinary mid-2010s city, flat overcast sky',
   'тебе девятнадцать, на дворе две тысячи пятнадцатый, латы только что поменяли на евро, ты возмужал','EWS','high','static',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('A3_SH02','medium shot of the young man looking at a phone while a jittery bleached-blond friend with a chipped tooth leans in beside him',
   'витёк добавляет тебя в закрытый чат под названием прогрев, там полтораста ночных гонщиков риги','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH03','close-up of a phone screen showing a messaging-app feed of short street-racing video thumbnails and numbers',
   'правила простые, ни лиц ни имён, только клички, видео заездов, и сколько кто поставил','CU','eye','static',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('A3_SH04','medium close-up of the young mans face lit by the phone glow at night, absorbed',
   'ты неделю просто читаешь, и в голове складывается новая карта города, где можно гонять и где нельзя','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH05','close-up of a phone chat screen listing odd anonymous usernames in a list',
   'тут пишут из иманты, из пурвциемса, из болдераи, кто на бэхе, кто на старой ауди, кто на гольфе','CU','eye','static',false,false,'gaz_environment',NULL,'bmw_interior'),
 ('A3_SH06','medium shot of the bleached-blond chipped-tooth friend talking and gesturing to the young man at night',
   'витёк говорит, выбери себе ник, под которым тебя будут знать, и ты смотришь на свою правую руку','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH07','extreme close-up of a gloved right hand beside a phone where a single word handle is being typed into a chat',
   'ты пишешь одно слово, перчатка, и с этой минуты в чате ты больше не ты, а перчатка','ECU','eye','push_in',false,true,'gaz_environment',NULL,'bmw_interior'),
 ('A3_SH08','extreme wide shot of a derelict industrial yard at night with a dozen cars parked in a loose semicircle, headlights inward',
   'первый настоящий заезд через неделю, заброшенная промзона в кундзиньсале, десяток машин в темноте','EWS','high','static',true,false,'gaz_environment',NULL,'industrial_race_lot'),
 ('A3_SH09','medium shot of hands dropping euro banknotes into an upturned cap held by a group of young men at night',
   'ставки скидывают в кепку, по полтиннику с носа, сегодня в банке двести евро на две машины','MS','eye','static',false,false,'gaz_environment',NULL,'industrial_race_lot'),
 ('A3_SH10','medium shot of the young man at his silver BMW pulling the glove onto his right hand before getting in',
   'тебя ставят против парня на ауди постарше, ты натягиваешь перчатку и садишься за руль','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH11','close-up of the young mans focused grey eyes watching a girl raising her arms between two cars at the start',
   'девчонка между машинами поднимает руки, ты смотришь только на них, всё вокруг исчезает','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH12','wide shot of two cars launching together across a dark concrete lot, headlights jumping across warehouse walls',
   'руки падают, и вы срываетесь, гравий летит из-под колёс, фары прыгают по бетонным стенам','WS','low','track_lateral',false,true,'gaz_environment',NULL,'industrial_race_lot'),
 ('A3_SH13','medium close-up of the young mans exhilarated face mid-race, the rush sharper with a rival alongside',
   'и снова та невесомость под рёбрами, только теперь рядом чужая машина, и это острее в сто раз','MCU','eye','push_in',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH14','close-up of two sets of headlights crossing a finish point by a rusty gate, one half a length ahead',
   'ты проходишь поворот на полкорпуса впереди и первым пересекаешь ржавые ворота, ты выиграл','CU','low','track_lateral',false,false,'gaz_environment',NULL,'industrial_race_lot'),
 ('A3_SH15','medium shot of the young man being handed a cap full of euro notes while others slap his car roof',
   'тебе суют кепку с двумя сотнями евро, парни хлопают по крыше, у тебя дрожат руки','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH16','close-up of the young mans face flushed with the high of winning, disbelief and joy',
   'за пять минут ты заработал столько, сколько отец в порту за неделю, и тебе двадцать лет','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH17','close-up of a phone uploading a short race video into a chat at night',
   'ночью ты выкладываешь видео заезда в чат под ником перчатка, и идёшь спать','CU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A3_SH18','close-up of a phone screen flooded with fire and thumbs-up reactions and a column of comments',
   'утром под видео полсотни огоньков и тридцать комментов, тебя поздравляют незнакомые люди','CU','eye','push_in',true,true,'gaz_environment',NULL,'racer_apartment'),
 ('A3_SH19','medium close-up of the young man reading the praise on his phone, warmth spreading on his face',
   'и тёплое чувство от чужого признания оказывается почти таким же сладким, как сама скорость','MCU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A3_SH20','medium shot of the young man confident among racers at a night meet, clearly respected',
   'ты гоняешь каждые выходные, и почти не проигрываешь, перчатку начинают знать во всей риге','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH21','close-up of a phone notes app with a short numbered list of personal rules',
   'ты выводишь себе правила, не жадничать, знать где выезд, знать где патруль, слушать чутьё','CU','eye','static',false,false,'gaz_environment',NULL,'bmw_interior'),
 ('A3_SH22','medium shot of the young man calmly turning his car around and leaving a gathering, declining a race',
   'однажды ты разворачиваешься и уезжаешь с заезда просто потому что не идёт, а наутро читаешь что там повязали троих','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','industrial_race_lot'),
 ('A3_SH23','close-up of the young mans calm calculating eyes',
   'ты понимаешь, чутьё не обманывает тех кто его слушает, и ты слушаешь','CU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH24','extreme close-up of euro banknotes accumulating in an old tea tin',
   'к зиме у тебя в банке из-под чая две тысячи евро, и ты впервые не знаешь куда их деть','ECU','eye','static',true,false,'gaz_environment',NULL,'racer_apartment'),
 ('A3_SH25','medium shot of the young man fitting new tyres and suspension parts to the silver BMW in a garage',
   'ты вкладываешь всё обратно в машину, новая резина, подвеска, и начинаешь думать про двигатель','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','chiekurkalns_garages'),
 ('A3_SH26','medium shot of parents at a dinner table while the young man sits with them, an ordinary evening',
   'родителям ты говоришь что устроился в автосервис, мать радуется, отец молча кивает','MS','eye','static',false,false,'gaz_environment',NULL,'racer_apartment'),
 ('A3_SH27','close-up of the young man averting his eyes from his mother at the table',
   'ты отводишь глаза, потому что про чат и заезды они не знают ничего, и не узнают','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A3_SH28','medium shot of the young man as an ordinary daytime student with a coffee, blending in',
   'днём ты обычный парень, учишься на заочном на автомеханика, пьёшь кофе, как все','MS','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7',NULL),
 ('A3_SH29','medium close-up of the same man at night transformed and intense, the racer persona',
   'а ночью ты перчатка, и эти двое тебя почти не пересекаются, как два разных человека','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH30','extreme wide shot of a wrecked car bent around a roadside pole at night, a grim phone-photo composition',
   'в чате выкладывают фото, парень из огре не вписался в поворот на сто шестьдесят, машина пополам','EWS','eye','static',true,true,'gaz_environment',NULL,'jurmala_highway'),
 ('A3_SH31','close-up of the young man looking at the crash photo on his phone, a brief flicker of unease',
   'ты смотришь на это фото минуту, потом листаешь дальше, с тобой такого не будет, ты же точный','CU','eye','static',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A3_SH32','medium close-up of the young mans face settling back into calm denial',
   'ты правда в это веришь, и это и есть та ложь, которую ты будешь повторять себе ещё десять лет','MCU','eye','push_in',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','racer_apartment'),
 ('A3_SH33','medium shot of the silver BMW driving home through empty streets near dawn',
   'ты едешь домой под утро, в перчатке, с деньгами в кармане и огоньками в телефоне, и тебе хорошо','MS','eye','track_lateral',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f7','bmw_interior'),
 ('A3_SH34','extreme wide high shot of night Riga from above, lit bridges and streets, vast',
   'тебе двадцать, ты король ночной риги, и ты ещё не знаешь что у этого города есть хозяева покрупнее тебя','EWS','high','static',true,false,'gaz_environment',NULL,'southern_bridge')
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
  AND s."shotCode" LIKE 'A3\_%' AND s."referenceProfileId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
