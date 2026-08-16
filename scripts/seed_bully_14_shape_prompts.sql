-- ============================================================================
-- «Тот, кого они слушались» (bully) — привести композицию промпта в согласие
-- с формой панели (§5A.3: «positivePrompt пишется С УЧЁТОМ формы»).
--
-- Пять кадров, где текст спорил с панелью:
--   · четыре начинались словами «wide shot», а стоят в вертикальных панелях
--     (tall 2:3 и narrow 9:16) — модель получала бы указание строить кадр вширь
--     и рисовала бы его в узкой рамке, то есть обрезанным;
--   · A4_SH14 был ECU ладони в панели 2:3 — крупный план кисти в высокой
--     вертикали не читается, форма просит фигуру целиком.
--
-- Три из них меняют и shotType: композиция изменилась по существу, а не только
-- на словах, и колонка должна говорить правду — по ней считается чередование
-- масштабов (§5.1). Прогон масштабов перепроверен после правки, новых серий из
-- трёх нет.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

UPDATE shots sh
   SET "promptFields" = jsonb_set(
         jsonb_set(sh."promptFields", '{positive}', to_jsonb(v.positive), true),
         '{camera,shotType}', to_jsonb(v.shot_type), true),
       "shotType" = v.shot_type
FROM projects p, (VALUES

 -- tall 2:3 — стоящая фигура целиком, группа уходит вглубь за ней
 ('A1_SH14', 'WS',
  'full-length shot at eye level, Slava standing apart in the corridor with his weight even and his shoulders squared toward the group, hands loose at his sides, Tolik and the three boys smaller further down the corridor behind him, a tall window throwing flat afternoon light down the parquet'),

 -- tall 2:3 — фигура внизу, школьный блок поднимается над ней
 ('A8_SH07', 'WS',
  'full-length shot from a low angle, Slava standing on the paved approach with his weight even and his shoulders squared, the same pale brick school block rising above and behind him with new plastic windows in the old openings, a metal door with a card reader, grey afternoon'),

 -- narrow 9:16 — вертикальная стопка: лампа над головой, фигура под ней
 ('A8_SH17', 'WS',
  'full-length shot at eye level, Slava standing close against the brick beside the school entrance with his weight even and his hands in his coat pockets, the single door lamp burning directly above his head and throwing hard light straight down him, black night beyond'),

 -- narrow 9:16 — фигура за верстаком, лампа сверху, ящики снизу
 ('A9_SH09', 'MS',
  'medium shot at eye level, Slava seated at the workbench with his weight settled and his torso squared to the steel, laying out a glue tube and a clean rag in front of him, the clamp lamp directly above his head and the bank of shallow drawers below the bench, the dark garage close around the pool of light'),

 -- tall 2:3 — было ECU ладони; форма просит фигуру, жест остаётся тем же
 ('A4_SH14', 'MS',
  'full-length shot from a low angle, Slava standing in the emptying corridor with his weight even and his chin level, pushing the small plexiglass block down into the inside pocket of his school jacket, the copper bracelet sliding at his wrist, the tall corridor window rising behind him, dim end-of-day light')

) AS v(code, shot_type, positive)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT 'framing fights panel shape (must be 0)' AS check, count(*)
FROM shots sh JOIN projects p ON p.id=sh."projectId"
WHERE p.slug='bully'
  AND ( (sh."comicPanelShape" IN ('narrow','tall','tall_page') AND sh."promptFields"->>'positive' ~* '^(extreme )?wide shot')
     OR (sh."comicPanelShape"='wide' AND sh."promptFields"->>'positive' ~* '^(extreme )?close-up') )
UNION ALL
SELECT 'shotType out of sync with promptFields', count(*)
FROM shots sh JOIN projects p ON p.id=sh."projectId"
WHERE p.slug='bully' AND sh."shotType" IS DISTINCT FROM sh."promptFields"->'camera'->>'shotType'
UNION ALL
SELECT 'positive over 55 words', count(*)
FROM shots sh JOIN projects p ON p.id=sh."projectId"
WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(sh."promptFields"->>'positive'),'\s+'),1) > 55
UNION ALL
SELECT 'negations in positive', count(*)
FROM shots sh JOIN projects p ON p.id=sh."projectId"
WHERE p.slug='bully' AND sh."promptFields"->>'positive' ~* '\yno |without |not ';

-- scale runs of three after the shotType changes (must return no rows)
WITH seq AS (
  SELECT sc."sceneKey", sh."shotCode",
    CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
         WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END g,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
             WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END) OVER w p1,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
             WHEN sh."shotType" IN ('MS','MCU','OTS') THEN 'M' ELSE 'C' END,2) OVER w p2
  FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id JOIN projects p ON p.id=sh."projectId"
  WHERE p.slug='bully'
  WINDOW w AS (PARTITION BY sc.id ORDER BY sh."shotCode"))
SELECT 'scale run of 3' AS check, "shotCode" FROM seq WHERE g=p1 AND g=p2;
