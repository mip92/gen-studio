\pset format unaligned
\pset fieldsep '\t'
\echo === 8 positives mentioning "camera" (gaze = OK, movement = defect) ===
SELECT s."shotCode", substring(s."promptFields"->>'positive' from '.{0,40}camera.{0,25}')
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND s."promptFields"->>'positive' ~* '\ycamera\y' ORDER BY 1;

\echo
\echo === peopled shots with no stance word ===
SELECT s."shotCode", s."shotType", substring(s."promptFields"->>'positive' from 1 for 110)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND EXISTS (SELECT 1 FROM shot_participants sp WHERE sp."shotId"=s.id)
  AND s."shotType" NOT IN ('POV','BACK')
  AND s."promptFields"->>'positive' !~* 'shoulder|spine|slump|hunch|\ylean|stoop|crouch|kneel|three-quarter|in profile|from behind|turned away|half-turn|upright|weight on|curled|squared|elbows|standing|sitting|lying|seated|braced|hunched|forearms'
ORDER BY 1;
