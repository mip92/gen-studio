-- «вместе со всеми» ×3 → ×2: третье употребление про ДРУГОГО героя (Юру),
-- так что повтор здесь ничего не связывает, он просто повтор.
\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';
UPDATE shots sh SET "narrationText" = 'юра стоит в четырёх метрах и слышит это не хуже остальных.'
FROM projects p WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"='A6_SH12';
SELECT count(*) AS vmeste FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."narrationText" ~ 'вместе (со )?всеми';
