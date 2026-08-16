-- A1_SH02 — тот кадр, с которого начался разбор. Проскочил мимо первой выборки
-- («several centimetres» вместо «a few centimetres»), а именно он и открывает
-- фильм: рукав в патроне, героя тянет к станку. При облёте с приближением
-- субъект обязан двигаться заметно, иначе камера работает вокруг неподвижного.
\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';
UPDATE shots sh SET "endFramePrompt" =
  'his knee has given way down the column and he is pulled in hard against the machine, his free hand grabbing at the edge of the steel table.'
FROM projects p WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"='A1_SH02';

SELECT 'end frames still micro' AS check, count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."endFramePrompt" ~* '(several|half a|a) (centimetre|millimetre|degree)|a fraction|marginally|a few (centimetres|degrees|millimetres)'
UNION ALL SELECT 'end frames over 40 words', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(s."endFramePrompt"),'\s+'),1) > 40
UNION ALL SELECT 'shots with an end-frame prompt', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND coalesce(s."endFramePrompt",'') <> '';
