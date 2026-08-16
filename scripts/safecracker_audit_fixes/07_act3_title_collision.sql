-- «четыреста» в титуле акта 3 столкнулось с «четырьмястами дверями» финала:
-- после правки хронологии за день через форточку идёт полсотни ключей, а
-- четыреста — это счёт ЧУЖИХ ДВЕРЕЙ за всю карьеру. Два разных «четыреста» в
-- одном фильме читаются как одно.
-- Скоуп по проекту обязателен (§11).
UPDATE scenes sc SET title = 'Акт 3 — будка, очередь, чужие ключи'
FROM projects p WHERE p.id = sc."projectId" AND p.slug = 'safecracker' AND sc."sceneKey" = 'A3';

UPDATE narrative_blocks b SET title = 'Акт 3 — будка, очередь, чужие ключи'
FROM projects p WHERE p.id = b."projectId" AND p.slug = 'safecracker' AND b.slug = 'bgm_act3';
