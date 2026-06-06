-- Seed: «Газ» A8 «Арест» (scene act_08_arrest, 30 shots, renderMode=STATIC). Age 29, 2025.
-- Confession (first truth in 21 years), the toll (woman+5yo died, father survived alone),
-- refuses to name Trener (futility not code), full guilt, 8yr strict regime, mother on the
-- front bench, the surviving widower's wordless gaze, Liga absent, glove confiscated, gates.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='act_08_arrest'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, broll, iconic, route, profid, locslug) AS (VALUES
 ('A8_SH01','medium shot of the man being walked to a police car under flashing blue lights, not resisting, on unsteady legs',
   'тебя ведут к машине под синими мигалками, ты не сопротивляешься, ты идёшь сам, ноги ватные','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','maskavas_intersection'),
 ('A8_SH02','wide shot of a bare green-walled police interview room with a metal table, the man seated at it',
   'тебя привозят в отдел, кабинет с зелёными стенами, металлический стол, и ты впервые в жизни говоришь правду','WS','eye',false,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH03','medium close-up of a calm tired police investigator in his forties seated across the table',
   'напротив сидит оперативник лет сорока, спокойный, усталый, он видел таких как ты много раз','MCU','eye',false,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH04','close-up of the mans face confessing plainly, no evasion, exhausted honesty',
   'ты рассказываешь всё, заезд, ставку, скорость, ты не юлишь и не отмазываешься, впервые за двадцать один год','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','police_room'),
 ('A8_SH05','medium close-up of the investigator quietly delivering the toll, grave',
   'оперативник говорит тихо, женщина и ребёнок в опеле погибли на месте, отец выжил, он остался один','MCU','eye',false,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH06','close-up of the mans face taking in the full weight of what he has done',
   'ты слышишь это и понимаешь что отнял у одного человека сразу всю его семью, жену и пятилетнего сына','CU','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','police_room'),
 ('A8_SH07','medium close-up of the investigator offering a deal, sliding a paper forward',
   'тебе предлагают меньше срок если сдашь тех кто организует заезды, назовёшь тренера и бригаду','MCU','eye',false,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH08','close-up of the mans face declining quietly, without pride',
   'и ты отказываешься, не из воровской чести, её у тебя нет, а потому что это не вернёт ни женщину ни ребёнка','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','police_room'),
 ('A8_SH09','medium shot of a thick case folder of charge documents on the metal table',
   'тебе вменяют нарушение правил повлёкшее смерть двух человек, уличные гонки, превышение, отягчающие','MS','high',true,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH10','extreme close-up of a sentencing range printed on a legal document',
   'статья тяжёлая, тебе грозит до десяти лет лишения свободы строгого режима, и ты не споришь','ECU','high',true,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH11','medium close-up of the man stating that he accepts full guilt',
   'ты признаёшь вину полностью по всем пунктам, ты не нанимаешь дорогого адвоката чтобы скостить срок','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','police_room'),
 ('A8_SH12','medium shot of the man sitting in a bare holding cell staring at the ceiling',
   'до суда ты сидишь в сизо два месяца, и впервые в жизни у тебя есть только тишина и потолок','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jelgava_prison'),
 ('A8_SH13','close-up of the mans hollow face waiting for a feeling that does not come',
   'ты ждёшь когда внутри проснётся хоть что-то, но там где была невесомость теперь только пустая яма','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jelgava_prison'),
 ('A8_SH14','medium close-up of the man lying on a cell bunk thinking of someone he lost',
   'ты думаешь о лиге каждую ночь, о золотой цепочке на её щиколотке, о свадьбе которой не будет','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jelgava_prison'),
 ('A8_SH15','extreme close-up of a returned engagement ring beside a single handwritten line on paper',
   'она присылает через адвоката одну строчку, я не знала тебя совсем, и обручального кольца ты больше не увидишь','ECU','high',true,false,'gaz_environment',NULL,NULL),
 ('A8_SH16','extreme wide shot of a modest pale-wood Latvian courtroom, the man standing alone in the railed dock',
   'суд идёт в марте, зал небольшой, светлые деревянные панели, и ты стоишь за ограждением один','EWS','eye',false,false,'gaz_environment',NULL,'courtroom'),
 ('A8_SH17','medium shot of a small grey-haired old woman alone on the front bench in a dark headscarf',
   'на первой скамейке сидит твоя мать, маленькая и седая, в том же платке в котором хоронила бы тебя','MS','eye',false,true,'gaz_environment',NULL,'courtroom'),
 ('A8_SH18','close-up of a grief-worn man across the aisle looking steadily at the dock, the surviving father',
   'через проход сидит тот отец из опеля, он выжил, он смотрит на тебя, и ты не можешь поднять глаза','CU','eye',false,true,'gaz_environment',NULL,'courtroom'),
 ('A8_SH19','medium close-up of the man in the dock unable to meet the fathers gaze, eyes down',
   'ты хотел бы сказать ему хоть что-то, но любые слова это плевок, и ты молчишь','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','courtroom'),
 ('A8_SH20','medium shot of the man in the dock saying the single word of his guilty plea',
   'на вопрос признаёшь ли ты вину ты говоришь да полностью, и больше не произносишь ни слова','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','courtroom'),
 ('A8_SH21','close-up of an empty seat in the courtroom gallery',
   'лига не приходит, её место в зале пустое, и это правильно, ей нечего здесь делать','CU','eye',true,false,'gaz_environment',NULL,'courtroom'),
 ('A8_SH22','medium close-up of a judge reading out a sentence from the bench',
   'судья зачитывает приговор, восемь лет колонии строгого режима, и зал на секунду замирает','MCU','eye',false,false,'gaz_environment',NULL,'courtroom'),
 ('A8_SH23','close-up of the old mother lowering her head without a cry',
   'мать не вскрикивает, она просто опускает голову, и ты понимаешь что состарил её на десять лет за одну ночь','CU','eye',false,true,'gaz_environment',NULL,'courtroom'),
 ('A8_SH24','medium shot of the man being led from the courtroom in handcuffs, glancing back once',
   'тебя выводят из зала в наручниках, ты оборачиваешься на мать один раз, она беззвучно говорит держись','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','courtroom'),
 ('A8_SH25','extreme close-up of a worn brown leather glove being sealed into a labelled property bag',
   'твою кожаную перчатку забирают вместе с вещами в пакет под опись, и ты отдаёшь её без сопротивления','ECU','high',true,false,'gaz_environment',NULL,'police_room'),
 ('A8_SH26','medium shot of a windowless blue prison transport van on a road',
   'тебя везут в колонию под елгавой в синем автозаке без окон, и ты считаешь повороты по памяти по привычке','MS','eye',false,false,'gaz_environment',NULL,'jelgava_prison'),
 ('A8_SH27','medium close-up of the man inside the dark van, still counting the road like a racer',
   'ты ловишь себя на том что всё ещё считаешь дорогу как гонщик, хотя за руль ты больше не сядешь никогда','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1',NULL),
 ('A8_SH28','extreme wide shot of high concrete prison walls with razor wire and a heavy gate swinging shut',
   'высокие бетонные стены, колючая проволока, ворота открываются и закрываются за твоей спиной с тяжёлым лязгом','EWS','low',true,true,'gaz_environment',NULL,'jelgava_prison'),
 ('A8_SH29','close-up of the man inside the prison yard at twenty-nine, hollow and silent',
   'тебе двадцать девять, у тебя впереди восемь лет, и та невесомость которая вела тебя с восьми лет молчит','CU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jelgava_prison'),
 ('A8_SH30','medium shot of the man alone in a cell as the heavy door closes on him',
   'дверь камеры закрывается, и ты остаёшься один на один с тем что сделал, и с тишиной которая теперь навсегда','MS','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f1','jelgava_prison')
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
  AND s."shotCode" LIKE 'A8\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
