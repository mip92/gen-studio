\pset format unaligned
SELECT DISTINCT sp.label, count(*) FROM shot_participants sp JOIN shots s ON sp."shotId"=s.id WHERE s."projectId"='7e590000-0000-4000-8000-000000000001' GROUP BY 1;
