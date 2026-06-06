-- Seed: «Газ» CODA (scene coda, 18 shots, renderMode=STATIC). 4th-wall address to the
-- viewer + disclaimer. The "small habit" parallel (a little speeding now = the first
-- brake-release/первое можно), "ты ехал именно сюда", the sneaker + chrysanthemums callbacks,
-- "останови сейчас, пока ладонь ещё не легла", "они тоже чьи-то жёны и пятилетние дети", disclaimer.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj  AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn   AS (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='coda'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, broll, iconic, route, profid, locslug) AS (VALUES
 ('CODA_SH01','medium close-up of the gaunt grey 36-year-old man looking directly out, quiet and direct, addressing the viewer',
   'если ты сейчас смотришь это и думаешь что у тебя всё под контролем, что ты бы никогда так не смог, послушай','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f8','racer_apartment'),
 ('CODA_SH02','close-up of an ordinary present-day driver pushing a little too fast through a city street, calm and unbothered',
   'тот восьмилетний мальчик на велике у гаражной горки думал ровно так же, он не планировал этих двадцати одного года','CU','eye',true,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('CODA_SH03','medium shot of a busy ordinary road with cars, anyone could be on it',
   'он не планировал ни тренера с его часами, ни чёрную ауди, ни тот серый опель, ни кроссовку на асфальте','MS','high',true,false,'gaz_environment',NULL,'southern_bridge'),
 ('CODA_SH04','close-up of a speedometer needle nudging just past the limit in town, an everyday small excess',
   'он просто один раз отпустил тормоз на горке, потому что это было приятно, одно маленькое движение','CU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('CODA_SH05','medium shot of a driver leaning forward to beat a changing traffic light',
   'каждый раз когда ты выжимаешь чуть больше чем можно, потому что опаздываешь, потому что никто не видит, запомни','MS','eye',true,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('CODA_SH06','close-up of a yellow traffic light being run, the car not slowing',
   'это не тот серый опель на съезде, это одно маленькое можно, самое первое, просто растянутое на годы','CU','eye',true,false,'gaz_environment',NULL,'maskavas_intersection'),
 ('CODA_SH07','medium close-up of an ordinary young driver feeling a small thrill of speed, eyes bright',
   'как только ты повторил его второй раз, а потом третий, ты уже не решаешь ничего нового','MCU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('CODA_SH08','close-up of ordinary hands gripping a steering wheel a little too tight',
   'ты просто едешь по инерции того первого тёплого качания, и однажды в январе тебе на плечо ляжет ладонь','CU','eye',true,false,'gaz_environment',NULL,'bmw_interior'),
 ('CODA_SH09','extreme close-up of a calm hand settling onto a shoulder, generic, ominous',
   'и ты поймёшь что всё это время ты ехал именно сюда, на этот съезд, к этим фарам','ECU','eye',true,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('CODA_SH10','close-up of a small childs sneaker on wet asphalt in cold light, the recurring motif',
   'останови сейчас, сбрось скорость сейчас, пока на твоём пути ещё не выехал чей-то серый опель','CU','high',true,true,'gaz_environment',NULL,'maskavas_intersection'),
 ('CODA_SH11','medium close-up of the grey narrator looking out directly, almost pleading',
   'пока у тебя ещё есть тот восьмилетний мальчик внутри который может тебя выслушать, пока ладонь ещё не легла','MCU','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f8','racer_apartment'),
 ('CODA_SH12','extreme wide shot of the Bolderaja river dam at dusk, the faint outline of a small boy on a bicycle long ago',
   'я тот мальчик который вырос и всё потерял, и я говорю с тобой пока кто-то ещё хочет слушать','EWS','high',true,false,'gaz_environment',NULL,'bolderaja_yard'),
 ('CODA_SH13','medium shot of the grey narrator alone at his window in the evening light',
   'я не верну ту женщину и того мальчика, я не верну лигу, я не верну свою жизнь, но может быть я успею к тебе','MS','eye',false,false,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f8','racer_apartment'),
 ('CODA_SH14','close-up of white chrysanthemums lying by a cemetery gate, the recurring motif',
   'береги себя и тех кто едет рядом с тобой, они тоже чьи-то жёны мужья и пятилетние дети','CU','high',true,true,'gaz_environment',NULL,'cemetery_riga'),
 ('CODA_SH15','extreme wide shot of a calm empty night road stretching away, safe and quiet',
   'сбавь газ, пристегнись, пропусти, доедь живым, это и есть вся твоя жизнь, не выкидывай её в одну секунду','EWS','eye',true,false,'gaz_environment',NULL,'jurmala_highway'),
 ('CODA_SH16','medium close-up of the grey narrator giving a last quiet steady look out',
   'тебе решать сейчас, на следующем перекрёстке, на следующем жёлтом, на следующем хочу успеть','MCU','eye',false,true,'gaz_character_ip','6a200000-0000-4000-8000-0000000000f8','racer_apartment'),
 ('CODA_SH17','wide shot of a plain dark muted end frame, an empty quiet road fading into black, no text',
   'эта история вымышлена, все совпадения с реальными людьми и событиями случайны','WS','eye',true,false,'gaz_environment',NULL,NULL),
 ('CODA_SH18','medium shot of a plain dark muted end frame fading to black, no text',
   'не повторяй чужих ошибок, береги себя и своих близких','MS','eye',true,false,'gaz_environment',NULL,NULL)
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
  AND s."shotCode" LIKE 'CODA\_%'
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
