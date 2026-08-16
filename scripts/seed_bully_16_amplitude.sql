-- ============================================================================
-- «Тот, кого они слушались» (bully) — амплитуда двухкадрового флоу.
--
-- Задача: реализовать в проекте ВСЕ юзкейсы, кроме появления нового персонажа
-- (user 2026-08-15). Углы поворота маленькие — ограничение приходит от Wan,
-- у которого 81 кадр на дорогу между опорными, а не от Qwen: карточка 2511
-- заявляет novel view synthesis базовой моделью.
--
-- Раскладка по фильму после этой правки:
--   приближение   push_in        34 кадра
--   отдаление     pull_out       11
--   следование    track_lateral  10 + track 1
--   ОБЛЁТ         arc_left/right  8   ← новое
--   покой         static         76
--
-- Появление персонажа не реализуется нигде: Wan не вводит человека в кадр, он
-- лепит его из фона — это классический дефект i2v, а не выразительный приём.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- ── 1. Облёт на малый угол ──────────────────────────────────────────────────
-- Восемь кадров, где увидеть героя с чуть другой стороны — это смысл, а не
-- украшение. Все восемь: один субъект, средний план, есть куда двигаться.
-- Толпы и ECU намеренно пропущены: на пяти фигурах Qwen придётся досочинять
-- полкомнаты, а на сверхкрупном облетать нечего.
UPDATE shots sh SET "cameraMove" = v.mv,
       "promptFields" = jsonb_set(sh."promptFields", '{camera,movement}', to_jsonb(v.mv), true)
FROM projects p, (VALUES
  ('A1_SH02', 'arc_right'),  -- рукав в станке: облёт открывает машину
  ('A2_SH07', 'arc_left'),   -- Толик произносит «цветочки заливаешь»
  ('A3_SH10', 'arc_right'),  -- Ритка у окна: «тебе не стыдно?»
  ('A5_SH07', 'arc_left'),   -- он стоит и считает до двенадцати — центр фильма
  ('A6_SH09', 'arc_right'),  -- «а ты чё, за Гербария теперь?» при всех
  ('A7_SH07', 'arc_left'),   -- он стоит неподвижно, мимо идут люди
  ('A8_SH12', 'arc_right'),  -- кивает ровно так же, как в четырнадцать
  ('A9_SH14', 'arc_left')    -- откинулся от верстака, брелок остался под лампой
) AS v(code, mv)
WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"=v.code;

-- ── 2. Следование за героем ─────────────────────────────────────────────────
-- Один кадр переведён с отъезда на слежение: он идёт домой один через двор, и
-- камера должна идти с ним, а не оставлять его.
UPDATE shots sh SET "cameraMove" = 'track',
       "promptFields" = jsonb_set(sh."promptFields", '{camera,movement}', '"track"', true)
FROM projects p
WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"='A5_SH12';

-- ── 3. Микро-амплитуда → видимое изменение ──────────────────────────────────
-- Двадцать три кадра описывали разницу в миллиметрах и градусах: «подбородок
-- опустился на несколько градусов», «плечи осели на долю ниже». Между такими
-- опорными кадрами Wan нечего интерполировать — получается тот же кадр с чуть
-- поправленной эмоцией, ровно то, что и увидел пользователь.
--
-- Правило переписывания: изменение должно быть видно на превью в 200 пикселей.
-- Бит остаётся тот же, меняется только амплитуда.
UPDATE shots sh SET "endFramePrompt" = v.t
FROM projects p, (VALUES
 ('A1_SH10', 'the man''s hand has lifted off the shoulder and the boy has turned his face fully up to him, chin raised.'),
 ('A1_SH14', 'he has taken one step toward the group and stopped again, his shoulders turned fully toward them.'),
 ('A2_SH02', 'the lamp glare has swept across the whole block face and the sealed flower now reads clearly through the plastic.'),
 ('A2_SH14', 'his hands have closed into fists on the oilcloth and he has leaned forward over the table.'),
 ('A3_SH05', 'a fresh streak of chalk dust has fallen down the board below the word and one letter has smudged.'),
 ('A3_SH11', 'he has turned his face fully away to the window and his jaw has set hard.'),
 ('A4_SH04', 'he has turned from the glass and now faces the crowd around the radiator, his hands out of his pockets.'),
 ('A4_SH06', 'three more pupils have shifted their weight and the neat rows have begun to sag out of line.'),
 ('A4_SH08', 'his head has turned fully along the row and he is looking straight at the faces that are looking at him.'),
 ('A4_SH09', 'his head has turned fully across the aisle and he is looking straight at the boy opposite.'),
 ('A5_SH03', 'his chin has dropped to his chest and his shoulders have slid down the brick.'),
 ('A5_SH05', 'the near shoulder has dropped out of frame and the far figure has raised his chin fully level, facing him.'),
 ('A5_SH07', 'he has turned his head away from the wall and is looking off toward the yard entrance, his feet not moving.'),
 ('A5_SH08', 'his eyes have dropped fully to the trodden snow at his feet and his jaw has loosened.'),
 ('A6_SH08', 'he has lowered the chalk to the ledge and turned his shoulders square to the class.'),
 ('A7_SH05', 'his arm has straightened out over the radiator and the block now hangs clear above the iron.'),
 ('A7_SH08', 'the block has split fully in two and the halves have fallen apart onto the radiator rib, the dried flower broken loose between them.'),
 ('A8_SH04', 'the draught has pushed the door open a hand''s width and the cardboard wedge has skidded out from under it.'),
 ('A8_SH07', 'he has walked up to the door and stopped with his hand not quite touching it.'),
 ('A8_SH09', 'she has set the cup down on the paper cloth and turned to face him fully.'),
 ('A8_SH13', 'she has turned fully to the window and is looking out at the dark yard, her hand left flat on the table.'),
 ('A8_SH17', 'he has pushed off the wall and taken two steps out onto the empty approach, into the lamp light.'),
 ('A9_SH12', 'he has lifted his face out of the lamp glare and is looking at the dark ceiling above the bench.')
) AS v(code, t)
WHERE p.slug='bully' AND sh."projectId"=p.id AND sh."shotCode"=v.code;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT coalesce("cameraMove",'(null)') AS camera_move, count(*)
FROM shots s JOIN projects p ON p.id=s."projectId" WHERE p.slug='bully'
GROUP BY 1 ORDER BY 2 DESC;

SELECT 'cameraMove out of sync with promptFields' AS check, count(*)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND s."cameraMove" IS DISTINCT FROM s."promptFields"->'camera'->>'movement'
UNION ALL
SELECT 'end frames still micro', count(*)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully'
  AND s."endFramePrompt" ~* 'a few (centimetres|degrees|millimetres)|a hair|a fraction'
UNION ALL
SELECT 'end frames over 40 words (budget)', count(*)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully'
  AND array_length(regexp_split_to_array(trim(s."endFramePrompt"),'\s+'),1) > 40
UNION ALL
SELECT 'banned crossed/folded arms', count(*)
FROM shots s JOIN projects p ON p.id=s."projectId"
WHERE p.slug='bully' AND s."endFramePrompt" ~* 'arms (crossed|folded)|folded (his|her) arms';
