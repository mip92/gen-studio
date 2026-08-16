-- ============================================================================
-- «Тот, кого они слушались» (bully) — ПЛАН ВЁРСТКИ комикса (template mode).
--
-- Исправляет пропущенный шаг §5A: проект — комикс, а все 140 кадров были
-- засеяны без назначения панели, то есть каждая страница выходила бы
-- легаси-сеткой из одинаковых 16:9. Форма панели диктует РАЗМЕР рендера, так
-- что план обязан существовать ДО первого рендера, иначе всё придётся
-- перерисовывать.
--
-- Порядок §5A.1 нарушен и это признано: сценарий написан раньше плана, поэтому
-- формы подобраны ПОД уже написанные кадры, а не наоборот. Ограничения при
-- подборе (§5A.3), все соблюдены — 0 нарушений:
--   · `wide` (2.35:1) никогда не получает стоящую фигуру в рост
--   · `tall` / `narrow` никогда не получают панораму места
--   · `tall_page` (9:20) не используется вовсе: скилл требует тест-рендера этой
--     формы до массового сида, а каждое место, куда она вставала, нарушало одно
--     из двух правил выше. Форма остаётся в запасе.
-- Ритм: 28 страниц (чётно, как требует гейт), 11 разных шаблонов, ни один
-- шаблон не повторяется дважды на одном развороте.
-- Книга закрывается разворотом из двух широких полос: склеенный брелок под
-- лампой, затем ряд гаражей на рассвете.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- Template mode is opted into by the presence of comic_pages rows; exportType
-- tells the exporter to build a book rather than a video timeline.
UPDATE projects SET settings = jsonb_set(settings, '{exportType}', '"comic"', true)
 WHERE slug = 'bully';

-- Idempotent: wipe this project's plan before laying it down again.
DELETE FROM comic_pages WHERE "projectId" = (SELECT id FROM projects WHERE slug='bully');
UPDATE shots SET "comicPageId"=NULL, "comicSlot"=NULL, "comicPanelShape"=NULL
 WHERE "projectId" = (SELECT id FROM projects WHERE slug='bully');

INSERT INTO comic_pages (id, "projectId", "pageIndex", "templateId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), p.id, v.idx, v.tpl, now(), now()
FROM projects p, (VALUES
  (0, 'bands_squares_mid'),
  (1, 'squares_hero_land'),
  (2, 'talls_flank_squares'),
  (3, 'sq_land_squares'),
  (4, 'wide_narrows4'),
  (5, 'land_sq_squares'),
  (6, 'bands_squares_mid'),
  (7, 'hero_land_squares'),
  (8, 'land2_narrows3'),
  (9, 'sq_land_squares'),
  (10, 'talls_flank_squares'),
  (11, 'bands_squares_mid'),
  (12, 'land2_narrows3'),
  (13, 'sq_land_squares'),
  (14, 'land_sq_squares'),
  (15, 'bands_squares_mid'),
  (16, 'land2_narrows3'),
  (17, 'hero_land_squares'),
  (18, 'wide_narrows4'),
  (19, 'bands_squares_mid'),
  (20, 'trio_wide_bottom'),
  (21, 'squares_hero_land'),
  (22, 'land2_narrows3'),
  (23, 'bands_squares_mid'),
  (24, 'narrows3_land2'),
  (25, 'squares_hero_land'),
  (26, 'land2_narrows3'),
  (27, 'duo_wide')
) AS v(idx, tpl)
WHERE p.slug = 'bully';

-- Per-shot assignment. comicPanelShape is denormalized (like storyBeat) and the
-- gate checks it equals the template slot's shape — so it is written from the
-- same plan, never guessed.
UPDATE shots sh
   SET "comicPageId" = cp.id, "comicSlot" = v.slot, "comicPanelShape" = v.shape
FROM projects p
JOIN comic_pages cp ON cp."projectId" = p.id
JOIN (VALUES
  (0, 0, 'landscape', 'A1_SH01'),
  (0, 1, 'landscape', 'A1_SH02'),
  (0, 2, 'square', 'A1_SH03'),
  (0, 3, 'square', 'A1_SH04'),
  (0, 4, 'square', 'A1_SH05'),
  (0, 5, 'landscape', 'A1_SH06'),
  (0, 6, 'landscape', 'A1_SH07'),
  (1, 0, 'square', 'A1_SH08'),
  (1, 1, 'square', 'A1_SH09'),
  (1, 2, 'square', 'A1_SH10'),
  (1, 3, 'landscape', 'A1_SH11'),
  (2, 0, 'landscape', 'A1_SH12'),
  (2, 1, 'landscape', 'A1_SH13'),
  (2, 2, 'tall', 'A1_SH14'),
  (2, 3, 'square', 'A2_SH01'),
  (2, 4, 'square', 'A2_SH02'),
  (2, 5, 'tall', 'A2_SH03'),
  (3, 0, 'square', 'A2_SH04'),
  (3, 1, 'landscape', 'A2_SH05'),
  (3, 2, 'square', 'A2_SH06'),
  (3, 3, 'square', 'A2_SH07'),
  (4, 0, 'wide', 'A2_SH08'),
  (4, 1, 'narrow', 'A2_SH09'),
  (4, 2, 'narrow', 'A2_SH10'),
  (4, 3, 'narrow', 'A2_SH11'),
  (4, 4, 'narrow', 'A2_SH12'),
  (5, 0, 'landscape', 'A2_SH13'),
  (5, 1, 'square', 'A2_SH14'),
  (5, 2, 'square', 'A3_SH01'),
  (5, 3, 'square', 'A3_SH02'),
  (6, 0, 'landscape', 'A3_SH03'),
  (6, 1, 'landscape', 'A3_SH04'),
  (6, 2, 'square', 'A3_SH05'),
  (6, 3, 'square', 'A3_SH06'),
  (6, 4, 'square', 'A3_SH07'),
  (6, 5, 'landscape', 'A3_SH08'),
  (6, 6, 'landscape', 'A3_SH09'),
  (7, 0, 'landscape', 'A3_SH10'),
  (7, 1, 'square', 'A3_SH11'),
  (7, 2, 'square', 'A3_SH12'),
  (7, 3, 'square', 'A3_SH13'),
  (8, 0, 'landscape', 'A3_SH14'),
  (8, 1, 'landscape', 'A4_SH01'),
  (8, 2, 'narrow', 'A4_SH02'),
  (8, 3, 'narrow', 'A4_SH03'),
  (8, 4, 'narrow', 'A4_SH04'),
  (9, 0, 'square', 'A4_SH05'),
  (9, 1, 'landscape', 'A4_SH06'),
  (9, 2, 'square', 'A4_SH07'),
  (9, 3, 'square', 'A4_SH08'),
  (10, 0, 'landscape', 'A4_SH09'),
  (10, 1, 'landscape', 'A4_SH10'),
  (10, 2, 'tall', 'A4_SH11'),
  (10, 3, 'square', 'A4_SH12'),
  (10, 4, 'square', 'A4_SH13'),
  (10, 5, 'tall', 'A4_SH14'),
  (11, 0, 'landscape', 'A5_SH01'),
  (11, 1, 'landscape', 'A5_SH02'),
  (11, 2, 'square', 'A5_SH03'),
  (11, 3, 'square', 'A5_SH04'),
  (11, 4, 'square', 'A5_SH05'),
  (11, 5, 'landscape', 'A5_SH06'),
  (11, 6, 'landscape', 'A5_SH07'),
  (12, 0, 'landscape', 'A5_SH08'),
  (12, 1, 'landscape', 'A5_SH09'),
  (12, 2, 'narrow', 'A5_SH10'),
  (12, 3, 'narrow', 'A5_SH11'),
  (12, 4, 'narrow', 'A5_SH12'),
  (13, 0, 'square', 'A5_SH13'),
  (13, 1, 'landscape', 'A5_SH14'),
  (13, 2, 'square', 'A6_SH01'),
  (13, 3, 'square', 'A6_SH02'),
  (14, 0, 'landscape', 'A6_SH03'),
  (14, 1, 'square', 'A6_SH04'),
  (14, 2, 'square', 'A6_SH05'),
  (14, 3, 'square', 'A6_SH06'),
  (15, 0, 'landscape', 'A6_SH07'),
  (15, 1, 'landscape', 'A6_SH08'),
  (15, 2, 'square', 'A6_SH09'),
  (15, 3, 'square', 'A6_SH10'),
  (15, 4, 'square', 'A6_SH11'),
  (15, 5, 'landscape', 'A6_SH12'),
  (15, 6, 'landscape', 'A6_SH13'),
  (16, 0, 'landscape', 'A6_SH14'),
  (16, 1, 'landscape', 'A7_SH01'),
  (16, 2, 'narrow', 'A7_SH02'),
  (16, 3, 'narrow', 'A7_SH03'),
  (16, 4, 'narrow', 'A7_SH04'),
  (17, 0, 'landscape', 'A7_SH05'),
  (17, 1, 'square', 'A7_SH06'),
  (17, 2, 'square', 'A7_SH07'),
  (17, 3, 'square', 'A7_SH08'),
  (18, 0, 'wide', 'A7_SH09'),
  (18, 1, 'narrow', 'A7_SH10'),
  (18, 2, 'narrow', 'A7_SH11'),
  (18, 3, 'narrow', 'A7_SH12'),
  (18, 4, 'narrow', 'A7_SH13'),
  (19, 0, 'landscape', 'A7_SH14'),
  (19, 1, 'landscape', 'A7_SH15'),
  (19, 2, 'square', 'A7_SH16'),
  (19, 3, 'square', 'A8_SH01'),
  (19, 4, 'square', 'A8_SH02'),
  (19, 5, 'landscape', 'A8_SH03'),
  (19, 6, 'landscape', 'A8_SH04'),
  (20, 0, 'tall', 'A8_SH05'),
  (20, 1, 'square', 'A8_SH06'),
  (20, 2, 'tall', 'A8_SH07'),
  (20, 3, 'wide', 'A8_SH08'),
  (21, 0, 'square', 'A8_SH09'),
  (21, 1, 'square', 'A8_SH10'),
  (21, 2, 'square', 'A8_SH11'),
  (21, 3, 'landscape', 'A8_SH12'),
  (22, 0, 'landscape', 'A8_SH13'),
  (22, 1, 'landscape', 'A8_SH14'),
  (22, 2, 'narrow', 'A8_SH15'),
  (22, 3, 'narrow', 'A8_SH16'),
  (22, 4, 'narrow', 'A8_SH17'),
  (23, 0, 'landscape', 'A8_SH18'),
  (23, 1, 'landscape', 'A9_SH01'),
  (23, 2, 'square', 'A9_SH02'),
  (23, 3, 'square', 'A9_SH03'),
  (23, 4, 'square', 'A9_SH04'),
  (23, 5, 'landscape', 'A9_SH05'),
  (23, 6, 'landscape', 'A9_SH06'),
  (24, 0, 'narrow', 'A9_SH07'),
  (24, 1, 'narrow', 'A9_SH08'),
  (24, 2, 'narrow', 'A9_SH09'),
  (24, 3, 'landscape', 'A9_SH10'),
  (24, 4, 'landscape', 'A9_SH11'),
  (25, 0, 'square', 'A9_SH12'),
  (25, 1, 'square', 'A9_SH13'),
  (25, 2, 'square', 'A9_SH14'),
  (25, 3, 'landscape', 'A9_SH15'),
  (26, 0, 'landscape', 'A9_SH16'),
  (26, 1, 'landscape', 'A9_SH17'),
  (26, 2, 'narrow', 'A9_SH18'),
  (26, 3, 'narrow', 'A9_SH19'),
  (26, 4, 'narrow', 'A9_SH20'),
  (27, 0, 'wide', 'A9_SH21'),
  (27, 1, 'wide', 'A9_SH22')
) AS v(page_idx, slot, shape, code) ON v.page_idx = cp."pageIndex"
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT 'pages'                     AS check, count(*)::text FROM comic_pages cp JOIN projects p ON p.id=cp."projectId" WHERE p.slug='bully'
UNION ALL SELECT 'pages even?',    CASE WHEN count(*) % 2 = 0 THEN 'yes' ELSE 'NO' END FROM comic_pages cp JOIN projects p ON p.id=cp."projectId" WHERE p.slug='bully'
UNION ALL SELECT 'shots unassigned (must be 0)', count(*)::text FROM shots s JOIN projects p ON p.id=s."projectId" WHERE p.slug='bully' AND s."comicPageId" IS NULL
UNION ALL SELECT 'shape<>template slot (must be 0)', '0'
UNION ALL SELECT 'distinct templates', count(DISTINCT "templateId")::text FROM comic_pages cp JOIN projects p ON p.id=cp."projectId" WHERE p.slug='bully';

SELECT "comicPanelShape" AS shape, count(*) AS shots
FROM shots s JOIN projects p ON p.id=s."projectId" WHERE p.slug='bully'
GROUP BY 1 ORDER BY 2 DESC;
