\pset format aligned
\set pid '3884f4d5-4090-4c93-9518-25dbff658673'

\echo '=== §5 ЗАПРЕЩЁННЫЕ СЛОВА (омографы + ТТС) ==='
SELECT 'замок/замк' AS w, count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ '(замок|замк)'
UNION ALL SELECT 'сорок/сорока', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'сорок'
UNION ALL SELECT 'стоил/стоял', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ '(стоил|стоял|стоит)'
UNION ALL SELECT 'писать', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ '\mписать\M'
UNION ALL SELECT 'мука/муки', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ '(мука|муки)'
UNION ALL SELECT 'пропасть', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'пропаст'
UNION ALL SELECT 'плачу', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'плачу'
UNION ALL SELECT 'кружки', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'кружки'
UNION ALL SELECT 'большая вода', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'большая вода';

\echo '=== §4a КОННЕКТОРНАЯ ПЕРЕПИСЬ (цель: потому что <=2, «и это» 0) ==='
SELECT 'потому что' AS pat, count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'потому,? что'
UNION ALL SELECT ', и это', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ ', и это'
UNION ALL SELECT 'ровно', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ '\mровно\M'
UNION ALL SELECT 'вообще', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'вообще'
UNION ALL SELECT 'именно', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'именно'
UNION ALL SELECT 'при этом', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'при этом'
UNION ALL SELECT 'совершенно', count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" ~ 'совершенно';

\echo '=== §4b/4c(a) ОТРИЦАНИЯ В QWEN-ПОЗИТИВЕ (должно быть 0) ==='
SELECT "shotCode", substring("promptFields"->>'positive' from 1 for 110) FROM shots
WHERE "projectId"=:'pid' AND ("promptFields"->>'positive' ~* '\y(not|without|never|nothing|avoid)\y'
  OR "promptFields"->>'positive' ~* 'no (people|one|figures)\y'
  OR "promptFields"->>'positive' ~* 'empty of');

\echo '=== §4b КАМЕРА-ДВИЖЕНИЕ В ПОЗИТИВЕ (должно быть 0; «at eye level» это ракурс, не движение) ==='
SELECT count(*) AS camera_clause_in_positive FROM shots
WHERE "projectId"=:'pid' AND "promptFields"->>'positive' ~* ',\s*the (camera|lens)';

\echo '=== §4b БЮДЖЕТ ДЕЙСТВИЯ (55 слов) ==='
WITH t AS (SELECT "shotCode", array_length(regexp_split_to_array("promptFields"->>'positive','\s+'),1) AS w
           FROM shots WHERE "projectId"=:'pid')
SELECT max(w) AS max_words, round(avg(w)) AS avg_words, count(*) FILTER (WHERE w>55) AS over_budget FROM t;

\echo '=== §4b СТАРЫЕ ФОРМУЛЫ (все должны быть 0) ==='
SELECT 'palette of' AS pat, count(*) FROM shots WHERE "projectId"=:'pid' AND "promptFields"->>'positive' ~ 'palette of'
UNION ALL SELECT 'clean confident ink linework', count(*) FROM shots WHERE "projectId"=:'pid' AND "promptFields"->>'positive' ~* 'clean confident ink linework'
UNION ALL SELECT 'fills the frame as the single', count(*) FROM shots WHERE "projectId"=:'pid' AND "promptFields"->>'positive' ~ 'fills the frame as the single'
UNION ALL SELECT 'CLIP-теги (, WS, / , CU, ...)', count(*) FROM shots WHERE "projectId"=:'pid' AND "promptFields"->>'positive' ~ ',\s*(EWS|WS|MS|MCU|CU|ECU|INSERT)\s*,';

\echo '=== §4b ПОЗА/РАЗВОРОТ КОРПУСА в кадрах с людьми (no_stance должно быть мало) ==='
SELECT count(*) FILTER (WHERE s."shotType" NOT IN ('POV','BACK') AND s."promptFields"->>'positive' !~*
  'shoulder|spine|slump|hunch|\ylean|stoop|crouch|kneel|three-quarter|in profile|from behind|turned away|half-turn|upright|weight on|curled|sunk|squared|stooped|elbows on|standing|sitting|lying|seated|perched|bent|kneeling|turned') AS no_stance,
       count(*) AS peopled
FROM shots s WHERE s."projectId"=:'pid' AND EXISTS (SELECT 1 FROM shot_participants sp WHERE sp."shotId"=s.id);

\echo '=== §4c(b) КАДРЫ-РУКИ БЕЗ ЛЮДЕЙ С ЗАМКОМ ПУСТОТЫ (конфликт: в кадре руки) ==='
SELECT s."shotCode", substring(s."promptFields"->>'positive' from 1 for 80)
FROM shots s WHERE s."projectId"=:'pid'
  AND NOT EXISTS (SELECT 1 FROM shot_participants sp WHERE sp."shotId"=s.id)
  AND s."promptFields"->>'positive' ~* '\y(hand|hands|palm|finger|thumb|forearm|fingertip|fingertips)\y'
  AND s."promptFields"->>'motionPrompt' ~ 'place stays deserted';

\echo '=== §4c(c) ПРОФИЛЬ ПРИВЯЗАН К КАДРУ БЕЗ ЧЕЛОВЕКА ==='
SELECT s."shotCode" FROM shots s
WHERE s."projectId"=:'pid' AND s."referenceProfileId" IS NOT NULL
  AND s."promptFields"->>'positive' !~* '\y(he|his|him|she|her|man|woman|boy|vlad|grisha|nina|kostya|fitter|figure)\y';

\echo '=== §1 ДУБЛИ (нулевая терпимость) ==='
SELECT 'дубли narrationText' AS what, count(*) FROM (
  SELECT "narrationText" FROM shots WHERE "projectId"=:'pid' GROUP BY 1 HAVING count(*)>1) x
UNION ALL SELECT 'дубли positive', count(*) FROM (
  SELECT "promptFields"->>'positive' FROM shots WHERE "projectId"=:'pid' GROUP BY 1 HAVING count(*)>1) y
UNION ALL SELECT 'дубли motionPrompt', count(*) FROM (
  SELECT "promptFields"->>'motionPrompt' FROM shots WHERE "projectId"=:'pid' GROUP BY 1 HAVING count(*)>1) z
UNION ALL SELECT 'дубли endFramePrompt', count(*) FROM (
  SELECT "endFramePrompt" FROM shots WHERE "projectId"=:'pid' GROUP BY 1 HAVING count(*)>1) w;

\echo '=== §1 СТРОКИ КОРОЧЕ 6 СЛОВ (нулевая терпимость) ==='
SELECT "shotCode", "narrationText" FROM shots
WHERE "projectId"=:'pid' AND array_length(regexp_split_to_array(trim("narrationText"),'\s+'),1) < 6;

\echo '=== §1 НЕМЫЕ КАДРЫ ПО АКТАМ (<=2 на акт) ==='
SELECT sc."sceneKey", count(*) FILTER (WHERE coalesce(trim(s."narrationText"),'')='') AS silent
FROM shots s JOIN scenes sc ON sc.id=s."sceneId" WHERE s."projectId"=:'pid'
GROUP BY 1 ORDER BY min(sc."sortOrder");

\echo '=== §4b ЛОКАЦИИ: длина описания (бюджет qwen = 25 слов) ==='
SELECT slug, array_length(regexp_split_to_array(description,'\s+'),1) AS words
FROM locations WHERE "projectId"=:'pid' ORDER BY 2 DESC;

\echo '=== §4b promptBase > 35 слов ==='
SELECT cp."profileCode", array_length(regexp_split_to_array(cp."promptBase",'\s+'),1) AS words
FROM character_profiles cp JOIN characters c ON c.id=cp."characterId"
WHERE c."projectId"=:'pid' ORDER BY 2 DESC;

\echo '=== §4d ЦЕПОЧКИ ЯКОРЕЙ (ровно ОДИН null на персонажа) ==='
SELECT c.code, cp."profileCode", cp."ageLabel", b."profileCode" AS derives_from
FROM character_profiles cp JOIN characters c ON c.id=cp."characterId"
LEFT JOIN character_profiles b ON b.id=cp."baseProfileId"
WHERE c."projectId"=:'pid' AND (SELECT count(*) FROM character_profiles x WHERE x."characterId"=c.id)>1
ORDER BY c.code, cp."ageLabel"::int;
