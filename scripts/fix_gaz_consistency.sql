-- Fix: «Газ» plot-consistency pass (2026-05-31). Age/year backbone, 7-vs-8 years,
-- licence-at-16 contradiction, two muddy lines. Updates narrationText + promptFields.narrationRu.
SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'

-- helper applied per-row below: set both narrationText and promptFields->narrationRu

-- 1. A1_SH35 — drop the wrong "до прав ещё четыре года" (licence is 18, he is ~12)
UPDATE shots SET "narrationText"='ты считаешь дни до того как сядешь за руль по-настоящему, и они тянутся бесконечно',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('ты считаешь дни до того как сядешь за руль по-настоящему, и они тянутся бесконечно'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A1_SH35';

-- 2. A2_SH04 — clarify the price ("сотка сверху торга" was muddy; he has 400 lati)
UPDATE shots SET "narrationText"='на авторынке за ригой стоит убитая бэха в кузове е тридцать девять, серебристая, отдают за триста пятьдесят латов',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('на авторынке за ригой стоит убитая бэха в кузове е тридцать девять, серебристая, отдают за триста пятьдесят латов'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A2_SH04';

-- 3. A2_SH19 — fix licence contradiction (A2_SH09 says he is under 18)
UPDATE shots SET "narrationText"='однажды ночью тебя ловит патруль за сто сорок в городе, а прав у тебя нет, тебе всего шестнадцать',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('однажды ночью тебя ловит патруль за сто сорок в городе, а прав у тебя нет, тебе всего шестнадцать'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A2_SH19';

-- 4. A4_SH01 — age 21→20 (born 1996, year 2016)
UPDATE shots SET "narrationText"='тебе двадцать, две тысячи шестнадцатый, и однажды витёк говорит, тобой интересуется тренер',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('тебе двадцать, две тысячи шестнадцатый, и однажды витёк говорит, тобой интересуется тренер'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A4_SH01';

-- 5. A4_SH37 — age 22→21
UPDATE shots SET "narrationText"='тебе двадцать один, у тебя десять тысяч на счету, разогнанная бэха и место в бригаде тренера',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('тебе двадцать один, у тебя десять тысяч на счету, разогнанная бэха и место в бригаде тренера'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A4_SH37';

-- 6. A5_SH01 — age 24→22 + establish the peak spans years
UPDATE shots SET "narrationText"='тебе двадцать два, две тысячи восемнадцатый, и следующие годы ты проводишь на самой вершине, перчатку знает вся ночная рига',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('тебе двадцать два, две тысячи восемнадцатый, и следующие годы ты проводишь на самой вершине, перчатку знает вся ночная рига'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH01';

-- 7. A5_SH10 — "на его же ауди" was confusing
UPDATE shots SET "narrationText"='ты обыгрываешь чемпиона из каунаса и его шестисотсильную ауди, и о перчатке пишут в чатах трёх стран',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('ты обыгрываешь чемпиона из каунаса и его шестисотсильную ауди, и о перчатке пишут в чатах трёх стран'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH10';

-- 8. A5_SH33 — close the 5-year meet-vs-date gap: jump to 26 (2022) before the bookshop
UPDATE shots SET "narrationText"='проходит ещё четыре года, тебе двадцать шесть, и в один серый вторник ты едешь без цели по центру, просто чтобы не сидеть в пустой квартире',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('проходит ещё четыре года, тебе двадцать шесть, и в один серый вторник ты едешь без цели по центру, просто чтобы не сидеть в пустой квартире'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH33';

-- 9. A9_SH02 — 8→7 years (served 7 of 8 per A9_SH01)
UPDATE shots SET "narrationText"='семь лет назад сюда вошёл двадцатидевятилетний гонщик, выходит другой человек, седой и тихий',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('семь лет назад сюда вошёл двадцатидевятилетний гонщик, выходит другой человек, седой и тихий'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A9_SH02';

-- 10. A9_SH05 — 8→7 years
UPDATE shots SET "narrationText"='город изменился за семь лет, новые дома, новые машины, всё чужое, и ты в нём как турист из прошлого',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('город изменился за семь лет, новые дома, новые машины, всё чужое, и ты в нём как турист из прошлого'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A9_SH05';

-- 11. A9_SH26 — widower visiting "восемь лет"→"семь лет" (crash was ~7 years ago)
UPDATE shots SET "narrationText"='у могил стоит тот отец, постаревший, один, он приходит сюда каждую неделю семь лет',
 "promptFields"=jsonb_set("promptFields",'{narrationRu}', to_jsonb('у могил стоит тот отец, постаревший, один, он приходит сюда каждую неделю семь лет'::text))
 WHERE "projectId"=:'pid' AND "shotCode"='A9_SH26';

-- sanity: show the updated rows
SELECT "shotCode", "narrationText" FROM shots WHERE "projectId"=:'pid'
 AND "shotCode" IN ('A1_SH35','A2_SH04','A2_SH19','A4_SH01','A4_SH37','A5_SH01','A5_SH10','A5_SH33','A9_SH02','A9_SH05','A9_SH26')
 ORDER BY "shotCode";
