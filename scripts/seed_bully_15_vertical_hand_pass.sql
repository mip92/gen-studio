-- ============================================================================
-- «Тот, кого они слушались» (bully) — ручная вычитка вертикалей и полос.
--
-- Правило пользователя: «столб вертикально, лодка горизонтально, никаких
-- скриптов для подгонки». После автоподбора шаблонов КАЖДАЯ вертикаль и каждая
-- широкая полоса читается глазами, и композиция пересобирается руками там, где
-- содержание кадра лежит поперёк рамки.
--
-- Прочитано 37 панелей: 6 tall, 5 wide, 26 narrow.
--   · все 5 wide — честно горизонтальные (цех сверху, коридор с 26 свидетелями,
--     зал со столами, верстак, ряд гаражей). Не тронуты.
--   · 25 из 32 вертикалей читаются: фигуры в рост, коридор в глубину, ботинок
--     над тянущейся рукой, лампа над головой. Не тронуты.
--   · 6 переписаны ниже — в них горизонтальный предмет лежал поперёк узкой рамки.
--
-- Где композиция поменялась по существу, меняется и shotType (+ camera.shotType):
-- «full-length shot» — это WS в нашем словаре, и колонка обязана это отражать,
-- иначе аудит чередования масштабов считает по вранью.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

UPDATE shots sh
   SET "promptFields" = jsonb_set(
         jsonb_set(sh."promptFields", '{positive}', to_jsonb(v.positive), true),
         '{camera,shotType}', to_jsonb(v.shot_type), true),
       "shotType" = v.shot_type
FROM projects p, (VALUES

 -- tall 2:3. Было: верстак с разложенным инструментом Кузьмича — стол уходит
 -- поперёк кадра и в 2:3 обрезается. Стало: фигура в рост, край верстака низко,
 -- окно поднимается за ней.
 ('A2_SH03', 'WS',
  'full-length shot at eye level, Yura standing square to the bench with his weight even and his shoulders low, reaching down to set the small plexiglass block on the scarred wood with two fingers, the bench edge low across the frame and a tall dusty window rising behind him, cold workshop light'),

 -- narrow 9:16. Было: обложка учебника поперёк рёбер батареи — и предмет, и
 -- рёбра горизонтальны. Стало: взгляд ВДОЛЬ батареи, рёбра уходят колонной,
 -- обложка стоит на ребре между ними.
 ('A4_SH03', 'ECU',
  'extreme close-up looking down along a cast-iron radiator, the ribs running away from camera in a tall column, a buckled textbook cover propped on edge between two of them, the cardboard swollen and delaminating at one corner, heat shimmer rising off the iron'),

 -- tall 2:3. Было: две фигуры бок о бок — в 2:3 они жмутся. Стало: Толик в рост,
 -- плечо Славы у края кадра, коридор уходит в глубину.
 ('A4_SH11', 'WS',
  'full-length shot at eye level, Tolik standing close with his weight forward on one foot and his torso turned in, one hand cupped at chest height and half open, Slava''s shoulder at the frame edge, the emptying corridor receding behind him, late grey light from the windows'),

 -- tall 2:3. Было: «пересекает комнату» — движение поперёк. Стало: высокая
 -- балконная дверь занимает бок кадра, он проходит вплотную перед ней.
 ('A8_SH05', 'WS',
  'full-length shot at eye level, the tall balcony door standing ajar with its cardboard wedge filling one side of the frame, Slava passing close in front of it with his torso turned away and his weight already carrying him past, a tool bag on the floor behind, low evening lamp light'),

 -- narrow 9:16. Было: две руки веером над столом. Стало: съёмка сверху, одна
 -- рука над другой — стопка по высоте кадра.
 ('A9_SH07', 'CU',
  'close-up from directly above, Slava''s two hands lifting the halves of the plexiglass block out of the drawer one above the other, setting them down on the bare steel bench, fracture faces turned toward him, the copper bracelet dark at his wrist, hard lamp light'),

 -- narrow 9:16. Было: ряд верстаков и голов поперёк кадра. Стало: тот же ряд,
 -- но уходит в глубину за спину, а не растягивается вширь.
 ('A9_SH18', 'MCU',
  'medium close-up at eye level, Slava at fourteen back in the school workshop, standing at his bench three-quarters to camera with his weight on one hip and his chin level, the row of benches and turned heads receding into depth behind him, dusty window light')

) AS v(code, shot_type, positive)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- «full-length shot» в кадре, который остался MS, — рассинхрон словаря.
UPDATE shots sh SET "shotType" = 'WS',
       "promptFields" = jsonb_set(sh."promptFields", '{camera,shotType}', '"WS"', true)
FROM projects p
WHERE p.slug='bully' AND sh."projectId"=p.id
  AND sh."promptFields"->>'positive' ~* '^full-length shot' AND sh."shotType" <> 'WS';

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT 'framing fights panel shape' AS check, count(*) FROM shots sh JOIN projects p ON p.id=sh."projectId"
 WHERE p.slug='bully' AND (
     (sh."comicPanelShape" IN ('narrow','tall','tall_page') AND sh."promptFields"->>'positive' ~* '^(extreme )?wide shot')
  OR (sh."comicPanelShape"='wide' AND sh."promptFields"->>'positive' ~* '^(extreme )?close-up'))
UNION ALL SELECT 'shotType out of sync', count(*) FROM shots sh JOIN projects p ON p.id=sh."projectId"
 WHERE p.slug='bully' AND sh."shotType" IS DISTINCT FROM sh."promptFields"->'camera'->>'shotType'
UNION ALL SELECT 'positive over 55 words', count(*) FROM shots sh JOIN projects p ON p.id=sh."projectId"
 WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(sh."promptFields"->>'positive'),'\s+'),1) > 55
UNION ALL SELECT 'negations in positive', count(*) FROM shots sh JOIN projects p ON p.id=sh."projectId"
 WHERE p.slug='bully' AND sh."promptFields"->>'positive' ~* '\yno |without |not ';

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
