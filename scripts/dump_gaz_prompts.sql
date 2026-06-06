SET client_encoding='UTF8';
\pset format unaligned
\pset fieldsep ''
\pset tuples_only on
\set pid '6a200000-0000-4000-8000-000000000001'
\o E:/tmp/gaz_prompts.txt
SELECT sh."shotCode" || '  [' || COALESCE(sh."workflowRouteKey",'-') || '/' || COALESCE((SELECT slug FROM locations l WHERE l.id=sh."locationId"),'NOLOC') || ']' || E'\n'
    || '  VIS: ' || regexp_replace(sh."promptFields"->>'positive', '^.*painterly comic-book aesthetic, ', '') || E'\n'
    || '  VO : ' || sh."narrationText" || E'\n'
FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
WHERE sh."projectId"=:'pid'
ORDER BY sc."sortOrder", sh."shotCode";
\o
