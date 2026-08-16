-- ============================================================================
-- «Тот, кого они слушались» (bully) — правки по аудиту Skill(gen-studio-plot-audit).
--
-- Applied by SQL rather than through PATCH /tts/... because the project is still
-- being seeded and has rendered NOTHING — zero TTS jobs, zero stills, zero clips.
-- There is no downstream artifact for the API to invalidate. Once anything is
-- rendered, narration edits must go back through the endpoint.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- ── §5(a) «сорок» — читается как ПТИЦА (сорока) ─────────────────────────────
-- Было 7 употреблений, 5 из них в связке «сорок минут» — худший случай по скиллу.
-- Оставлено ровно одно: «тебе сорок четыре» (возраст, несущий, и составное
-- числительное не читается как птица).
--
-- ── §4a «, и это» — запрещённая эпиграмма-резюме, лимит 0 (было 10) ──────────
-- ── §4a «потому что» — лимит 2 (было 5); оставлены две настоящие ────────────
-- ── §5 «стоило» в смысле ЦЕНЫ рядом с «стоял/стоишь» в смысле стояния ───────
-- ── §2 арифметика: «тридцать лет выпуска» противоречит возрасту 44 ──────────
--     (14 в акте 1 + 30 = 44 — это тридцать лет с ТЕХ СОБЫТИЙ, а не с выпуска;
--      выпуск в 17, тридцать лет спустя было бы 47). Убрано само число.
-- ── §3 непрерывность: брелок кладётся в ПОРТФЕЛЬ, а не во внутренний карман,
--     иначе в акте 4 Толик не мог достать его из портфеля.
UPDATE shots sh SET "narrationText" = v.t
FROM projects p, (VALUES
 ('A2_SH10', 'юра забирает брелок с верстака и прячет его в портфель, не поднимая головы.'),
 ('A2_SH12', 'ты отвечаешь одним словом, оно ничего не значит, но его вполне хватает.'),
 ('A3_SH05', 'слово держится на доске весь урок до самого звонка, и никто его не стирает.'),
 ('A3_SH07', 'на перекличке нина петровна называет его юрой, единственный раз за весь день.'),
 ('A3_SH11', 'ты отвечаешь, что ты его не трогал, и говоришь при этом чистую правду.'),
 ('A4_SH05', 'нина петровна поднимает весь класс и спрашивает весь урок подряд, ни разу не повысив голоса.'),
 ('A4_SH06', 'двадцать четыре человека стоят и молчат, молчание у них совсем не про страх.'),
 ('A4_SH10', 'урок кончается ничем, звенит звонок, и всех отпускают по домам как ни в чём не бывало.'),
 ('A5_SH01', 'в декабре за котельной минус восемнадцать, единственное место во дворе, куда не выходит ни одно окно.'),
 ('A5_SH02', 'толик приходит первым, и трое приходят за ним: он сказал им прийти.'),
 ('A6_SH01', 'в феврале ты приходишь в школу за полчаса до звонка, и в кабинете нет никого.'),
 ('A6_SH03', 'к первому звонку кабинет наполняется, и никто не замечает, что ты пришёл раньше всех.'),
 ('A6_SH06', 'ты отводишь взгляд первым, у тебя на это уходит примерно полсекунды.'),
 ('A6_SH07', 'три дня всё почти нормально, самые обычные три дня за всю ту зиму.'),
 ('A7_SH03', 'толик забирает его на ходу, даже не остановившись, у него на это уходит меньше секунды.'),
 ('A7_SH04', 'юра делает за ним два шага и останавливается, дальше идти уже некуда.'),
 ('A7_SH07', 'накануне ты сказал, что тебе плевать, и забирать слова назад было бы дороже.'),
 ('A7_SH11', 'ты ближе всех, и от твоего ботинка до его руки один короткий шаг.'),
 ('A8_SH04', 'ты умеешь всё, кроме одного, и оно третий год стоит у тебя в квартире.'),
 ('A8_SH06', 'в феврале приходит сообщение про встречу класса: актовый зал, суббота, шесть вечера.'),
 ('A8_SH15', 'ты держишь полный стакан ещё минут десять и не находишь, о чём говорить дальше.'),
 ('A9_SH10', 'клей ты выдавливаешь на спичку, из тюбика на такую площадь идёт слишком много.'),
 ('A9_SH12', 'руки у тебя не дрожат совсем, единственное, что за тридцать лет не поменялось.'),
 ('A9_SH19', 'и каждый раз ты давал им то лицо, которое обходилось тебе дешевле всего.')
) AS v(code, t)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- ── §3 continuity: тот же кадр в картинке — портфель, а не карман жилета ────
-- ── §5.1 три подряд кадра одной масштабной группы — по одному кадру в каждом
--     прогоне меняет масштаб (A1_SH14 M→W, A8_SH08 M→W, A9_SH03 C→M).
--     Меняется И колонка shotType, И вводное слово в positive, И camera.shotType
--     в promptFields — иначе текст кадра будет спорить с его же метаданными.
UPDATE shots sh
   SET "promptFields" = jsonb_set(
         jsonb_set(sh."promptFields", '{positive}', to_jsonb(v.positive), true),
         '{camera,shotType}', to_jsonb(v.shot_type), true),
       "shotType" = v.shot_type
FROM projects p, (VALUES

 ('A2_SH10', 'MCU',
  'medium close-up from a high angle, Yura standing hunched at the end bench with his shoulders rolled forward, sliding the small plexiglass block into the front pocket of his leather satchel, his taped glasses low on his nose, cold overhead light'),

 ('A1_SH14', 'WS',
  'wide shot at eye level, Slava standing apart from the group with his weight even and his shoulders squared toward them, hands loose at his sides, watching Tolik perform for three boys down the corridor, a tall window throwing flat afternoon light across the parquet'),

 ('A8_SH08', 'WS',
  'wide shot at eye level, a heavy red-haired man in his forties working the room with his torso turned to the tables and his weight rolling forward, a phone held out to show photographs, folding seats pushed back to the walls, guests along the long tables, warm evening light through half-lowered blinds'),

 ('A9_SH03', 'MCU',
  'medium close-up from a high angle, Slava hunched forward on the stool with his forearms on his knees and one hand gripping the handle of the bottom drawer, pulling against its runners, the drawer front scratched and paint-chipped, the darkened copper bracelet at his wrist, hard clamp-lamp light')

) AS v(code, shot_type, positive)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- ── §4b: Location.description режется по 25 слов (QWEN_WORD_BUDGET.location) ─
-- Все 10 локаций были написаны по гайду «400–700 символов» из §12.4 — это
-- CLIP-эра. На Qwen-пути composeQwenInstruction() пропускает описание через
-- capClauses(…, 25), то есть до модели доезжала только первая четверть, а
-- всё, чем локация отличалась от любой другой, срезалось с хвоста.
-- Переписано под бюджет: сначала САМО МЕСТО, потом два-три опознавательных
-- предмета. Инвентарь, атмосферная фраза и эпоха-через-перечисление убраны —
-- эпоху несут школьная форма и предметы в самих кадрах.
UPDATE locations l SET description = v.descr, "updatedAt" = now()
FROM projects p, (VALUES
 ('school_workshop',      'A late-Soviet school woodworking shop, eight scarred benches with cast-iron vices, a drill press on a steel table, pine shavings underfoot, dusty window light.'),
 ('classroom',            'A late-Soviet school classroom, three rows of paired desks with lift-up lids, a black slate board, tall windows over cast-iron radiators, worn parquet.'),
 ('corridor_2f',          'The second-floor corridor of a late-Soviet school, worn parquet, tall windows down one side over cast-iron radiators, classroom doors opposite, pale green wall panelling.'),
 ('boiler_backyard',      'The blind yard behind a school boiler house, a soot-streaked brick wall, two lagged pipes on brackets, trodden dirty snow with black cinders, broken pallets.'),
 ('schoolyard',           'The yard of a late-Soviet school, cracked asphalt with faded painted lines, welded-pipe horizontal bars, bare poplars, a pale brick four-storey block behind.'),
 ('yura_room',            'A small boy''s room in a late-Soviet flat, a desk against the window with a folding lamp, a shoebox of plexiglass offcuts and pressed flowers.'),
 ('slava_kitchen',        'A cramped kitchen in a late-Soviet flat, a small table under a checked oilcloth, a gas stove, a window onto a courtyard of identical blocks.'),
 ('garage_workbench',     'A private garage box, a heavy steel workbench under a clamp lamp, a vice, tools on a pegboard, shallow drawers beneath, oil-stained concrete floor.'),
 ('school_entrance_2020', 'The entrance of the same school three decades later, pale brick with new plastic windows, a metal door with a card reader, a paved ramp.'),
 ('reunion_hall',         'A school assembly hall set for a reunion, folding seats pushed back to the walls, a low stage, long tables under paper cloths.')
) AS v(slug, descr)
WHERE p.slug = 'bully' AND l."projectId" = p.id AND l.slug = v.slug;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT 'locations over 25 words' AS check, count(*) FROM locations l JOIN projects p ON p.id=l."projectId"
 WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(l.description),'\s+'),1) > 25
UNION ALL SELECT '«, и это»', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."narrationText" ~ ', и это\M'
UNION ALL SELECT '«потому что» (limit 2)', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."narrationText" ~ 'потому,? что'
UNION ALL SELECT '«сорок» (limit 1)', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."narrationText" ~ '\mсорок'
UNION ALL SELECT 'negations in positive', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."promptFields"->>'positive' ~* '\yno |without |not '
UNION ALL SELECT 'positive over 55 words', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(s."promptFields"->>'positive'),'\s+'),1) > 55
UNION ALL SELECT 'narration under 10 words', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND array_length(regexp_split_to_array(trim(s."narrationText"),'\s+'),1) < 10
UNION ALL SELECT 'shotType mismatch vs promptFields', count(*) FROM shots s JOIN projects p ON p.id=s."projectId"
 WHERE p.slug='bully' AND s."shotType" IS DISTINCT FROM s."promptFields"->'camera'->>'shotType';

-- scale runs of three (must return no rows)
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
SELECT 'scale run of 3' AS check, "shotCode" FROM seq WHERE g=p1 AND g=p2 ORDER BY "shotCode";
