\pset format aligned

\echo '=== A. одиночный замок на кадре с людьми на фоне (guard спорит с картинкой) ==='
SELECT p.slug, count(*) AS kadrov, count(*) FILTER (WHERE p."youtubeUrl" IS NOT NULL) AS opublikovano
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE s."promptFields"->>'positive' ~* '\y(traders?|queue|crowd|passers-?by|shoppers|customers|onlookers|bystanders|classmates|colleagues|commuters|spectators)\y'
  AND s."promptFields"->>'motionPrompt' ~* 'the same single figure'
GROUP BY 1 ORDER BY 2 DESC;

\echo ''
\echo '=== B. люди на фоне вообще без замка фона (топ-12) ==='
SELECT p.slug, count(*) AS kadrov, count(*) FILTER (WHERE p."youtubeUrl" IS NOT NULL) AS opublikovano
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE s."promptFields"->>'positive' ~* '\y(traders?|queue|crowd|passers-?by|shoppers|customers|onlookers|bystanders|classmates|colleagues|commuters|spectators)\y'
  AND s."promptFields"->>'motionPrompt' !~* 'the same single figure'
  AND s."promptFields"->>'motionPrompt' !~* '(background figures?|(hold|keep)(s|ing)?\s+(still|(their|its)\s+places?)|barely\s+(move|shift))'
GROUP BY 1 ORDER BY 2 DESC LIMIT 12;

\echo ''
\echo '=== ИТОГО по корпусу ==='
SELECT count(*) AS vsego,
       count(*) FILTER (WHERE p."youtubeUrl" IS NOT NULL) AS opublikovano_trogat_nelzya,
       count(*) FILTER (WHERE s."chosenVideoId" IS NOT NULL) AS uzhe_s_videom,
       count(DISTINCT p.slug) AS proektov
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE s."promptFields"->>'positive' ~* '\y(traders?|queue|crowd|passers-?by|shoppers|customers|onlookers|bystanders|classmates|colleagues|commuters|spectators)\y'
  AND (s."promptFields"->>'motionPrompt' ~* 'the same single figure'
       OR s."promptFields"->>'motionPrompt' !~* '(background figures?|(hold|keep)(s|ing)?\s+(still|(their|its)\s+places?)|barely\s+(move|shift))');

\echo ''
\echo '=== safecracker — должно быть пусто ==='
SELECT s."shotCode"
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE p.slug = 'safecracker'
  AND s."promptFields"->>'positive' ~* '\y(traders?|queue|crowd|passers-?by|shoppers|customers|onlookers|bystanders|classmates|colleagues|commuters|spectators)\y'
  AND (s."promptFields"->>'motionPrompt' ~* 'the same single figure'
       OR s."promptFields"->>'motionPrompt' !~* '(background figures?|(hold|keep)(s|ing)?\s+(still|(their|its)\s+places?)|barely\s+(move|shift))');
