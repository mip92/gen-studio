-- Составные движения камеры: поворот + приближение, следование + отдаление.
-- Шесть кадров, где два движения вместе несут смысл, а не украшают.
-- Формат `первое+второе` — второе приезжает клаузой «while …» в клип и краткой
-- добавкой в end-кадр; оба канала выводятся из ЭТОЙ колонки, разойтись не могут.
\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

UPDATE shots sh SET "cameraMove" = v.mv,
       "promptFields" = jsonb_set(sh."promptFields", '{camera,movement}', to_jsonb(v.mv), true)
FROM projects p, (VALUES
  ('A1_SH02', 'arc_right+push_in'),      -- облёт станка и сжатие на застрявшую руку
  ('A2_SH11', 'track_lateral+push_in'),  -- идёт по коридору, трое жмутся ближе — камера тоже
  ('A5_SH07', 'arc_left+pull_out'),      -- облёт вокруг стоящего и расширение: он один в стороне
  ('A5_SH12', 'track+pull_out'),         -- идёт домой, двор пустеет вокруг него
  ('A7_SH07', 'arc_left+push_in'),       -- он неподвижен, мимо идут люди, камера подбирается
  ('A9_SH14', 'arc_left+pull_out')       -- откинулся, брелок остаётся один под лампой
) AS v(code, mv)
WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"=v.code;

SELECT coalesce("cameraMove",'(null)') AS camera_move, count(*)
FROM shots s JOIN projects p ON p.id=s."projectId" WHERE p.slug='bully'
GROUP BY 1 ORDER BY 2 DESC, 1;

SELECT 'cameraMove out of sync with promptFields' AS check, count(*)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND s."cameraMove" IS DISTINCT FROM s."promptFields"->'camera'->>'movement';
