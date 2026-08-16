-- Lengthen the four narration lines that fell under the ~4 s floor. A ~3.5 s
-- line leaves dead air under the clip (the export floors each slot to VO+0.5 s)
-- and reads clipped. Still one sentence, lowercase start, single terminal dot —
-- f5 degrades on multi-sentence lines.
\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

UPDATE shots sh SET "narrationText" = v.t
FROM projects p, (VALUES
 ('A2_SH02', 'внутри залит засушенный василёк, синий, с обломанным краем лепестка, и через стекло видно каждую прожилку на стебле.'),
 ('A4_SH02', 'учебники разбухли по краям и слиплись, а обложки покоробило волной, будто их сушили на батарее целую ночь.'),
 ('A4_SH05', 'нина петровна поднимает весь класс и спрашивает сорок минут подряд, ни разу не повысив голоса.'),
 ('A4_SH10', 'сорок минут кончаются ничем, звенит звонок, и всех отпускают по домам как ни в чём не бывало.')
) AS v(code, t)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

SELECT 'narration under 10 words (must be 0): ' || count(*)
FROM shots sh JOIN projects p ON p.id = sh."projectId"
WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(sh."narrationText"),'\s+'),1) < 10;

SELECT count(*) AS shots,
       sum(array_length(regexp_split_to_array(trim("narrationText"), '\s+'), 1)) AS words,
       round((sum(array_length(regexp_split_to_array(trim("narrationText"), '\s+'), 1)) / 140.0)
             + (count(*) * 0.5 / 60.0), 1) AS est_minutes
FROM shots sh JOIN projects p ON p.id = sh."projectId" WHERE p.slug = 'bully';
