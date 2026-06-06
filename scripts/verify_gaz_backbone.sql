SET client_encoding='UTF8';
\pset format unaligned
\pset fieldsep ' | '
\pset tuples_only on
\set pid '6a200000-0000-4000-8000-000000000001'
-- timeline-critical lines, in play order
\echo '=== AGE/YEAR BACKBONE ==='
SELECT sh."shotCode", sh."narrationText"
FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
WHERE sh."projectId"=:'pid'
 AND sh."shotCode" IN ('C_SH17','A1_SH08','A1_SH31','A1_SH38','A2_SH01','A3_SH01','A3_SH34','A4_SH01','A4_SH37','A5_SH01','A5_SH33','A6_SH01','A8_SH29','A9_SH01','A9_SH02','CODA_SH02')
ORDER BY sc."sortOrder", sh."shotCode";
\echo '=== leftover problems (want 0 rows each) ==='
SELECT 'cold-open still 300? '||"shotCode" FROM shots WHERE "projectId"=:'pid' AND "shotCode" LIKE 'C\_%' AND "narrationText" LIKE '%триста евро%';
SELECT 'still 8-years-served? '||"shotCode" FROM shots WHERE "projectId"=:'pid' AND "shotCode" LIKE 'A9%' AND ("narrationText" LIKE '%восемь лет назад%' OR "narrationText" LIKE '%за восемь лет%' OR "narrationText" LIKE '%неделю восемь лет%');
SELECT 'voровская честь? '||"shotCode" FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%воровск%';
SELECT 'licence-at-16 contradiction? '||"shotCode" FROM shots WHERE "projectId"=:'pid' AND "narrationText" LIKE '%права ты только сдал%';
