SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
\echo '===== PROJECT NOT-NULL FIELDS ====='
SELECT 'visualStyle='||COALESCE("visualStyle",'NULL')||' exportTiming='||COALESCE("exportTiming",'NULL')||' tts='||COALESCE("ttsEngine",'NULL')
       ||' defNeg='||(("defaultNegative"<>'')::text)||' defVidNeg='||(("defaultVideoNegative"<>'')::text)
       ||' defMot='||(("defaultMotionPrompt"<>'')::text)||' defStat='||(("defaultStaticMotionPrompt"<>'')::text)
       ||' scriptText='||((length("scriptText")>500)::text)
FROM projects WHERE id=:'pid';
\echo '===== SHOT COMPLETENESS ====='
SELECT 'shots total: '||count(*) FROM shots WHERE "projectId"=:'pid';
SELECT 'no narration: '||count(*) FROM shots WHERE "projectId"=:'pid' AND COALESCE("narrationText",'')='';
SELECT 'no positive: '||count(*) FROM shots WHERE "projectId"=:'pid' AND COALESCE("promptFields"->>'positive','')='';
SELECT 'no sceneId: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "sceneId" IS NULL;
SELECT 'no workflowRouteKey: '||count(*) FROM shots WHERE "projectId"=:'pid' AND COALESCE("workflowRouteKey",'')='';
SELECT 'no shotType: '||count(*) FROM shots WHERE "projectId"=:'pid' AND COALESCE("shotType",'')='';
SELECT 'locationId NULL (intentional minority ok): '||count(*) FROM shots WHERE "projectId"=:'pid' AND "locationId" IS NULL;
\echo '===== ROUTE COVERAGE (every used routeKey must exist) ====='
SELECT 'orphan routeKeys: '||COALESCE(string_agg(DISTINCT "workflowRouteKey",','),'none') FROM shots sh
 WHERE sh."projectId"=:'pid' AND "workflowRouteKey" IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM workflow_routes r WHERE r."projectId"=:'pid' AND r."routeKey"=sh."workflowRouteKey");
\echo '===== ROUTE <-> CONTENT (face needs profile, env must not) ====='
SELECT 'char route w/o profile: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "workflowRouteKey" LIKE '%character%' AND "referenceProfileId" IS NULL;
SELECT 'env route w/ profile: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "workflowRouteKey" LIKE '%environment' AND "referenceProfileId" IS NOT NULL;
\echo '===== PARTICIPANTS ====='
SELECT 'char shots w/o any participant: '||count(*) FROM shots s WHERE s."projectId"=:'pid' AND s."referenceProfileId" IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);
SELECT 'dual (2-participant) shots: '||count(*) FROM (SELECT s.id FROM shots s JOIN shot_participants p ON p."shotId"=s.id WHERE s."projectId"=:'pid' GROUP BY s.id HAVING count(*)>=2) x;
\echo '===== RENDER MODE / RUNTIME ====='
SELECT "renderMode"||': '||count(*) FROM shots WHERE "projectId"=:'pid' GROUP BY "renderMode";
\echo '===== IDENTITY ASSETS (anchors) ====='
SELECT 'profiles needing anchor: '||count(*) FROM character_profiles WHERE "characterId" IN (SELECT id FROM characters WHERE "projectId"=:'pid');
\echo '===== BGM ====='
SELECT 'narrative blocks: '||count(*) FROM narrative_blocks WHERE "projectId"=:'pid';
\echo '===== SCALE-RUN + DOTS + 4thWALL ====='
SELECT 'dots in narration: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%.%';
SELECT '4th-wall in body A1-A9: '||count(*) FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id WHERE sh."projectId"=:'pid' AND sc."sceneKey" LIKE 'act_%' AND (sh."narrationText" ~ 'подпиш|останься со мной|если ты сейчас смотришь');
