SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
SELECT 'narration with dots (want 0): '||count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%.%';
SELECT '4th-wall/CTA in body A1-A9 (want 0): '||count(*) FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
  WHERE sh."projectId"=:'pid' AND sc."sceneKey" LIKE 'act_%'
  AND (sh."narrationText" ~ 'подпиш' OR sh."narrationText" ~ 'останься со мной' OR sh."narrationText" ~ 'если ты сейчас смотришь');
SELECT 'leitmotif (невесомост) shots: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%невесомост%';
SELECT 'glove (перчатк) shots: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%перчатк%';
SELECT 'missing narration (want 0): '||count(*) FROM shots WHERE "projectId"=:'pid' AND ("narrationText" IS NULL OR "narrationText"='');
SELECT 'missing positive (want 0): '||count(*) FROM shots WHERE "projectId"=:'pid' AND ("promptFields"->>'positive') IS NULL;
SELECT 'missing locationId: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "locationId" IS NULL;
SELECT 'profiles: '||count(*) FROM character_profiles WHERE "characterId" IN (SELECT id FROM characters WHERE "projectId"=:'pid');
SELECT 'iconic total: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "isIconic";
SELECT 'broll total: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "isBroll";
SELECT 'participants total: '||count(*) FROM shot_participants p JOIN shots s ON s.id=p."shotId" WHERE s."projectId"=:'pid';
-- leitmotif by act
SELECT 'leitmotif acts: '||string_agg(DISTINCT split_part("shotCode",'_',1),',' ORDER BY split_part("shotCode",'_',1)) FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%невесомост%';
