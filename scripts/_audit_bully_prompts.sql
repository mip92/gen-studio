\pset format unaligned
\pset fieldsep '\t'
\echo === locations vs 25-word Qwen budget ===
SELECT l.slug,
       array_length(regexp_split_to_array(trim(l.description),'\s+'),1) AS words,
       CASE WHEN array_length(regexp_split_to_array(trim(l.description),'\s+'),1) > 25
            THEN 'TRIMMED' ELSE 'ok' END AS verdict
FROM locations l JOIN projects p ON p.id=l."projectId" WHERE p.slug='bully' ORDER BY 2 DESC;

\echo
\echo === promptBase vs 35-word budget ===
SELECT pr."profileCode",
       array_length(regexp_split_to_array(trim(pr."promptBase"),'\s+'),1) AS words,
       (pr."promptBase" ~* 'constant identity anchor|full colou?r illustration') AS clip_tail
FROM character_profiles pr JOIN characters c ON c.id=pr."characterId"
JOIN projects p ON p.id=c."projectId" WHERE p.slug='bully' ORDER BY 2 DESC;

\echo
\echo === positive corpus checks (all must be 0) ===
SELECT 'second style block'  AS check, count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~* 'clean confident ink linework|no plastic skin|cell-shaded'
UNION ALL SELECT 'CLIP crop tags', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~ ',\s*(EWS|WS|MS|MCU|CU|ECU|INSERT)\s*,'
UNION ALL SELECT 'DOF boilerplate', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~ 'fills the frame as the single clear subject'
UNION ALL SELECT 'camera MOVEMENT clause', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~* ',\s*the camera (slowly |gently )?(track|push|pull|pan|tilt)'
UNION ALL SELECT 'palette-of formula', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~ 'palette of'
UNION ALL SELECT 'the word camera at all', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~* '\ycamera\y';

\echo
\echo === stance coverage on peopled shots (no_stance must be 0) ===
SELECT count(*) FILTER (WHERE s."shotType" NOT IN ('POV','BACK')
       AND s."promptFields"->>'positive' !~* 'shoulder|spine|slump|hunch|\ylean|stoop|crouch|kneel|three-quarter|in profile|from behind|turned away|half-turn|upright|weight on|curled|squared|elbows|standing|sitting|lying|seated|braced|hunched|forearms') AS no_stance,
       count(*) AS peopled
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND EXISTS (SELECT 1 FROM shot_participants sp WHERE sp."shotId"=s.id);

\echo
\echo === anchor chains (exactly ONE null per multi-profile character) ===
SELECT c.code, pr."profileCode", pr."ageLabel", b."profileCode" AS derives_from
FROM character_profiles pr JOIN characters c ON c.id=pr."characterId"
JOIN project_characters pc ON pc."characterId"=c.id
LEFT JOIN character_profiles b ON b.id=pr."baseProfileId"
JOIN projects p ON p.id=pc."projectId"
WHERE p.slug='bully' AND (SELECT count(*) FROM character_profiles x WHERE x."characterId"=c.id)>1
ORDER BY c.code, pr."ageLabel";

\echo
\echo === shotType runs of 3 (must be empty) ===
WITH seq AS (
  SELECT sc."sceneKey", sh."shotCode",
    CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
         WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END g,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
             WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END) OVER w p1,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
             WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END,2) OVER w p2
  FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id JOIN projects p ON p.id=sh."projectId"
  WHERE p.slug='bully'
  WINDOW w AS (PARTITION BY sc.id ORDER BY sh."shotCode"))
SELECT "sceneKey", "shotCode", g FROM seq WHERE g=p1 AND g=p2 ORDER BY "shotCode";
