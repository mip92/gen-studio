SET client_encoding='UTF8';
\pset format unaligned
\pset fieldsep ' | '
\pset tuples_only on
\o E:/tmp/gaz_narration.txt
SELECT sc."sortOrder", sh."shotCode", sh."narrationText"
FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
WHERE sh."projectId"='6a200000-0000-4000-8000-000000000001'
ORDER BY sc."sortOrder", sh."shotCode";
\o
