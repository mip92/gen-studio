-- «Газ» montage pass: break 7 runs of >=3 same-scale shots (editing theory — alternate
-- detail/medium/wide). Changes one shot's scale + its leading framing word per run.
SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
\set sb 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, '
BEGIN;

-- A3_SH16/17/18 = C,C,C  -> make SH17 a WIDE (environment, no face needed)
UPDATE shots SET "shotType"='WS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'wide shot of the young mans dim bedroom at night lit only by the cold glow of a phone screen uploading a short race video, the rest of the room in shadow')),'{positivePrompt}',to_jsonb(:'sb'||'wide shot of the young mans dim bedroom at night lit only by the cold glow of a phone screen uploading a short race video, the rest of the room in shadow'))
 WHERE "projectId"=:'pid' AND "shotCode"='A3_SH17';

-- A5_SH22..25 = M,M,M,M -> make SH23 a WIDE
UPDATE shots SET "shotType"='WS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'wide shot of the man standing small and alone at a dark window at night, faint reflections in the glass suggesting three different futures, empty room around him')),'{positivePrompt}',to_jsonb(:'sb'||'wide shot of the man standing small and alone at a dark window at night, faint reflections in the glass suggesting three different futures, empty room around him'))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH23';

-- A5_SH30..33 = M,M,M,M -> make SH31 a WIDE
UPDATE shots SET "shotType"='WS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'wide shot of the man standing among his crew of racers at a night meet yet visibly apart and hollow, cars and figures around him')),'{positivePrompt}',to_jsonb(:'sb'||'wide shot of the man standing among his crew of racers at a night meet yet visibly apart and hollow, cars and figures around him'))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH31';

-- A6_SH08..10 = M,M,M -> make SH08 a CLOSE-UP
UPDATE shots SET "shotType"='CU',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'close-up of the mans face as he tells a lie into a phone and turns away, a flicker of guilt')),'{positivePrompt}',to_jsonb(:'sb'||'close-up of the mans face as he tells a lie into a phone and turns away, a flicker of guilt'))
 WHERE "projectId"=:'pid' AND "shotCode"='A6_SH08';

-- A7_SH07..09 = C,C,C -> make SH09 a WIDE (the icy bridge deck)
UPDATE shots SET "shotType"='WS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'wide shot of the empty wet bridge deck at night with gleaming patches of black ice spread across the asphalt under the sodium lamps')),'{positivePrompt}',to_jsonb(:'sb'||'wide shot of the empty wet bridge deck at night with gleaming patches of black ice spread across the asphalt under the sodium lamps'))
 WHERE "projectId"=:'pid' AND "shotCode"='A7_SH09';

-- A9_SH06..08 = M,M,M -> make SH07 a WIDE (the childhood room)
UPDATE shots SET "shotType"='WS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'wide shot of the small cramped childhood room in the family flat, unchanged for years, the gaunt grey man standing small in the doorway')),'{positivePrompt}',to_jsonb(:'sb'||'wide shot of the small cramped childhood room in the family flat, unchanged for years, the gaunt grey man standing small in the doorway'))
 WHERE "projectId"=:'pid' AND "shotCode"='A9_SH07';

-- CODA_SH08..10 = C,C,C -> make SH08 a MEDIUM
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'medium shot of an ordinary present-day driver gripping the wheel a little too tight at a city light, an everyday small impatience')),'{positivePrompt}',to_jsonb(:'sb'||'medium shot of an ordinary present-day driver gripping the wheel a little too tight at a city light, an everyday small impatience'))
 WHERE "projectId"=:'pid' AND "shotCode"='CODA_SH08';

COMMIT;

-- re-verify scale sequences (look for any remaining XXX run of 3+)
SELECT sc."sceneKey" || ': ' || string_agg(
  CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
       WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END, '' ORDER BY sh."shotCode")
FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
WHERE sh."projectId"=:'pid' GROUP BY sc."sortOrder", sc."sceneKey" ORDER BY sc."sortOrder";
