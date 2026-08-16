-- «Тот, кто слышит замки» — Ты - МЕДВЕЖАТНИК 90-х
-- Track B, 15 минут, 128 кадров, 30 страниц комикса.
-- Движок видео: LTX-2.5 (диегетический звук — лейтмотив фильма СЛЫШИМЫЙ).
-- Флоу: flf2v на весь проект.
-- Озвучка: f5, голос voice-3 «агента Смита».
--
-- Страна, республика и город НЕ НАЗЫВАЮТСЯ (жёсткое правило проекта).
-- Эпоха названа: 1979 → 1998 → 2026.
--
-- Порядок: проект → персонажи → профили → M:N → локации → страницы → акты.
-- Кадры — отдельным файлом (seed_safecracker_shots.py).

BEGIN;

-- ─────────────────────────────────────────────────────────── проект
INSERT INTO projects (
  id, slug, name, settings, "createdAt", "updatedAt", "scriptText",
  "targetPlatform", "safetyTier",
  "defaultNegative", "defaultVideoNegative",
  "defaultMotionPrompt", "defaultStaticMotionPrompt",
  "ttsEngine", "ttsVoiceoverId", "visualStyle", "exportTiming",
  "defaultVideoFlow", "videoEngine", "queuePriorityTier"
) VALUES (
  gen_random_uuid()::text,
  'safecracker',
  'Тот, кто слышит замки',
  jsonb_build_object(
    'exportType', 'comic',
    'sceneSteps', 8,
    'anchorPipeline', 'flux_comic',
    'qwenReferenceLatents', true,
    'fluxBaseModel', 'flux1-dev-kontext_fp8_scaled.safetensors',
    'styleLora', jsonb_build_object(
      'name', 'style\RealComic_2509_base.safetensors',
      'strengthModel', 0.5),
    'anchorStyleLora', jsonb_build_object(
      'name', 'style\Comic_Style_-_FLUX.safetensors',
      'strengthClip', 0.9,
      'strengthModel', 0.9),
    'anchorComposition', 'waist-up framing, standing in a softly blurred muted interior with natural depth, gentle directional daylight, soft natural shadows',
    'scriptShort', jsonb_build_object('en',
      E'LOGLINE: A locksmith who hears a lock through his fingertips opens four hundred doors that are not his across nine years, never once taking anything from behind them, and at sixty sits behind his own door on seven locks having taught his son that a door is not an obstacle.\n\n'
      'ARC: 1994, a woman locks herself out with a child asleep and a gas ring lit; Vlad opens the door in ninety seconds and a stranger on the landing watches his hands, not the door. 1979, at thirteen he watches a fitter drill his father''s lock to death and takes the dead cylinder home. At seventeen he grinds a copper probe in the school workshop and carries it in his breast pocket for forty-three years. Through the eighties he is the only man at the ЖЭК booth who never drills. In 1994 Grisha finds him and pays two hundred dollars for fifteen seconds of looking — not opening, only naming the lock. By 1995 he opens, with one rule he calls cleanliness: he never takes anything from behind the door. In 1997 he shows his seven-year-old son that a lock is a toy. In 1998 he buys a shop and hangs a sign, and Grisha brings the one safe nobody has opened; Vlad goes because he wants to know, not because of money. He opens it in four hours, and what is inside is paper, not money.\n\n'
      'FINALE: 2026. He fits locks now, never removes them. His own door carries seven. His son, thirty-six, opens a stranger''s door with his boot, because he never learned to listen — only to enter.\n\n'
      'LEITMOTIF: the fourth pin, which always seats later than the others — a sound, and the thin copper probe that finds it.\n\n'
      'KEY FACTS:\n'
      '- ninety seconds on the first door; four hours on the last\n'
      '- two hundred dollars for fifteen seconds of looking\n'
      '- the rule he calls cleanliness: never take what is behind the door\n'
      '- seven locks on his own door; one ring, seven keys\n'
      '- the country, the republic and the town are never named')
  ),
  now(), now(),
  '',
  'youtube', 'advertiser_safe',
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, big shiny eyes, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, state emblems, currency symbols, graphic violence, blood, gore, injured bodies, nudity, cigarettes, smoking, character reference sheet, plain studio backdrop, portrait crop',
  'blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, hyperrealistic, motion blur, warping, melted face, flicker, scene cut, sudden cut, identity change, anime character appearing, new people entering frame, extra humans',
  -- LTX-диалект: действие → камера → звук → no music (см. Skill(gen-studio-ltx25) §2.4)
  'he keeps working with small precise movements of the hands, the camera pushes in slowly, quiet breathing and the faint tick of metal under his fingers, no music',
  'nothing moves except the light, the camera stays locked and fixed, only room tone and a distant hum behind the wall, no music',
  'f5',
  (SELECT id FROM voiceovers WHERE slug = 'voice-3'),
  'realcomic_qwen', 'narration',
  'flf2v', 'ltx', 1
);

-- ─────────────────────────────────────────────────────────── персонажи
-- displayName — ГОЛАЯ ЛАТИНСКАЯ КЛИЧКА (§12.3.0), роль живёт в narrationText.
INSERT INTO characters (id, "projectId", code, "displayName", "createdAt")
SELECT gen_random_uuid()::text, p.id, v.code, v.dn, now()
FROM projects p, (VALUES
  ('VLAD',   'Vlad'),
  ('GRISHA', 'Grisha'),
  ('NINA',   'Nina'),
  ('SON',    'Kostya'),
  ('FITTER', 'the fitter')
) AS v(code, dn)
WHERE p.slug = 'safecracker';

INSERT INTO project_characters ("projectId", "characterId", "attachedAt")
SELECT p.id, c.id, now()
FROM projects p JOIN characters c ON c."projectId" = p.id
WHERE p.slug = 'safecracker';

-- ─────────────────────────────────────────────────────────── профили
-- Каст РАЗЛИЧИМ по силуэту (§3.2.1): у пятерых пять разных причёсок и мастей.
-- У каждого ОДИН постоянный якорь-предмет. Ни у кого нет сигарет (§3.2).
INSERT INTO character_profiles (
  id, "characterId", "profileCode", "ageLabel", "targetImages",
  "promptBase", "triggerToken", "useIpAdapter"
)
SELECT gen_random_uuid()::text, c.id, v.pcode, v.age, 0, v.base, v.tok, false
FROM projects p
JOIN characters c ON c."projectId" = p.id
JOIN (VALUES
  ('VLAD', 'VLAD_KID', '13',
   'a thin east-european boy of thirteen, dark blond hair cut short and flattened on one side, grey-green eyes, a thin copper probe pushed through the buttonhole of his breast pocket, a brown school jacket over a grey knitted vest',
   'vladkid'),
  ('VLAD', 'VLAD_MID', '28',
   'a lean east-european man of twenty-eight, dark blond hair grown to the collar and pushed back, grey-green eyes, a narrow scar across the knuckle of his right index finger, a thin copper probe in his breast pocket, a dark green canvas work jacket over a ribbed grey sweater',
   'vladmid'),
  ('VLAD', 'VLAD_OLD', '60',
   'a broad east-european man of sixty, cropped white hair thinning at the crown, grey-green eyes behind narrow reading glasses pushed up on his forehead, a thin copper probe in his breast pocket, a faded blue workshop coat over a checked shirt',
   'vladold'),
  ('GRISHA', 'GRISHA_MID', '35',
   'a heavy east-european man of thirty-five, ginger hair receding high on both sides and cut very short, pale blue eyes, a broad flat signet ring on his left little finger, a long dark leather coat over a wine-red polo shirt',
   'grishamid'),
  ('NINA', 'NINA_MID', '30',
   'a slight east-european woman of thirty, black hair in a thick single braid over one shoulder, brown eyes, a small cream plastic butterfly clip holding the braid, a mustard cardigan over a printed cotton dress',
   'ninamid'),
  ('SON', 'SON_KID', '7',
   'a small east-european boy of seven, very fair almost white-blond hair with a straight fringe, blue eyes, a scratched plastic watch worn on his right wrist, a red tracksuit top with white stripes at the shoulders',
   'sonkid'),
  ('SON', 'SON_ADULT', '36',
   'a tall heavy-shouldered east-european man of thirty-six, fair hair shaved close at the sides and longer on top, blue eyes, a scratched steel watch worn on his right wrist, a black quilted jacket over a plain dark t-shirt',
   'sonadult'),
  ('FITTER', 'FITTER_OLD', '58',
   'a stooped east-european man of fifty-eight, grey hair combed flat across a bald crown, deep-set brown eyes, a cloth tape measure hanging around his neck, a stained brown work coat over a blue shirt buttoned to the throat',
   'fitterold')
) AS v(ccode, pcode, age, base, tok) ON v.ccode = c.code
WHERE p.slug = 'safecracker';

-- ─────────────────────────────────────────────────────────── локации
INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, v.slug, v.name, v.descr, now(), now()
FROM projects p, (VALUES
('stairwell_night_94', 'Подъезд, ночь (1994)',
 'A late-soviet apartment stairwell at night, walls painted olive to shoulder height and whitewashed above, the paint chipped in wide flakes near the switch. A single bare bulb in a wire cage throws hard shadows down a half-flight of worn concrete steps with a steel pipe handrail polished bright by hands. Two padded doors face each other across a narrow landing, one covered in cracked brown vinyl studded with upholstery nails. A folded pram leans under the window; the window glass is painted over blue on the lower half. Cold air, breath visible, an atmosphere of interrupted sleep.'),
('landing_1979', 'Площадка четвёртого этажа (1979)',
 'A fourth-floor landing in a five-storey brick block in the late seventies, walls in glossy pale green oil paint with a darker green skirting band. A tall wooden door with a single mortice lock and a small brass plate, its frame splintered white where a drill has been working. Wood dust and curled metal swarf on the concrete floor. A rubber-cased work lamp hooked over the door handle, its cable running down the stairs. A galvanised bucket, a rolled runner carpet standing on end. Warm afternoon light from a stairwell window with a broken upper pane, the atmosphere of a small domestic emergency going badly.'),
('school_workshop_83', 'Школьная мастерская (1983)',
 'A soviet school metalwork room in the early eighties, eight steel benches in two rows with heavy parallel vices bolted to their edges, the bench tops scarred and oiled black. A wall board of outlined hand tools, half the outlines empty. A pedestal grinder with a chipped guard and a bright arc of sparks marking the concrete floor beneath it. High windows with wire-reinforced glass, painted radiators underneath. A glass cabinet of steel offcuts and cut-away mechanisms. Chalky light full of suspended dust, the atmosphere of a room where boys are quiet only because they are concentrating.'),
('metalremont_booth', 'Будка Металлоремонта',
 'A tiny municipal key-cutting and repair booth built into the end wall of a residential block, barely three paces deep. A hatch window with a sliding glass panel and a scratched wooden counter worn pale in one spot. Behind it, a key-cutting machine bolted to a bench, a board of hundreds of blanks hanging on nails in rows, coils of wire, jars of springs and pins sorted by size. A gas-fired soldering stand, a stool with a taped seat. One fluorescent tube, one small fan heater. The air smells of hot brass; the atmosphere is of a place people queue at without ever coming inside.'),
('vlad_kitchen', 'Кухня Влада',
 'A small panel-block kitchen of the mid nineties, five square metres, walls papered in a faded orange geometric pattern with a wipeable tiled strip behind the sink. A white enamel gas stove with four rings and a kettle, a chipped sink under the window, a wall cabinet with sliding glass doors holding mismatched cups. A square table pushed against the wall under the window with an oilcloth cover, two stools. A radio on the windowsill beside a jam jar of dried flowers. Courtyard trees fill the window. The atmosphere is of a room used for talking rather than cooking.'),
('market_rows_90s', 'Торговые ряды, 90-е',
 'An open-air market of the mid nineties built from converted shipping containers and metal trestle tables under sagging striped awnings. Duffel bags and cardboard boxes serve as counters, hung with jeans, trainers and imported chocolate. Muddy duckboards over churned ground between the rows, puddles skinned with ice. Hand-lettered card signs, a portable cassette player on a crate, kerosene heaters glowing under the tables. Traders in padded jackets stand with their hands inside their sleeves. Grey flat daylight and the atmosphere of a place where everything is negotiable.'),
('warehouse_yard', 'Двор оптового склада',
 'A wholesale depot yard behind a long single-storey warehouse of grey silicate brick with a corrugated roof. A steel roller shutter, a smaller steel personnel door beside it with a heavy hasp and two padlocks. Stacked wooden pallets, a rusted skip, oil-stained concrete with weeds through the joints. A boom barrier and a wooden watchman''s hut with a lit window. A single floodlight on a bracket throws a hard cone across the yard and leaves the corners black. Wet air, the atmosphere of a place that is busy in daylight and deliberately empty now.'),
('office_safe_room', 'Кабинет с сейфом',
 'A private office of the late nineties on the upper floor of a converted institute building, panelled to waist height in dark veneer with heavy patterned wallpaper above. A large desk with a green leather inset, a bank of steel filing cabinets, a shelf of matching unread bound volumes. In the corner, a tall old strongroom safe standing on a low plinth, deep-green enamel with a brass keyhole escutcheon and a spoked handwheel, its paint chipped down to bare metal along the closing edge. Heavy velvet curtains drawn. Table lamp light only, the atmosphere of a room that is never used at this hour.'),
('own_shop_98', 'Своя мастерская (1998)',
 'A small independent locksmith''s shop opened in 1998 in the ground floor of a residential block, one room with a glazed street door. A proper counter with a hinged flap, a pegboard wall of cylinders, escutcheons and cut blanks arranged in neat rows. A workbench along the back wall with a vice, a drill stand, and trays of pins under a swan-neck lamp. A calendar, a receipt spike, a cash box. New paint, a floor that has been laid rather than patched. Daylight from the street plus warm bench light, the atmosphere of a place someone has deliberately made legitimate.'),
('own_flat_door', 'Своя дверь на семь замков',
 'The inside face of an apartment entrance door seen from a cramped hallway, a modern steel door skinned in dark laminate set into an older frame. Seven separate locks fitted down the closing edge at uneven intervals, each a different make and era, the newest still bright, the oldest worn to bare brass. A hanging steel chain, a spy lens, a strip of draught seal. Coats crowded on hooks to one side, a shoe rack, a mirror gone dim at the corners. One dim ceiling fitting, the atmosphere of a threshold that is maintained far past any reasonable need.'),
('stairwell_2026', 'Площадка, 2026',
 'A contemporary apartment landing in a nineties block that has been patched rather than renovated: walls repainted flat grey over old texture, a new intercom panel screwed beside an old bell push whose wires still run down the wall. Three flush steel doors with modern cylinders and one older padded door left over. A window with a new plastic frame, a cheap LED fitting with a motion sensor. A folded scooter and a bag of building rubble on the landing. Hard even light with no warmth in it, the atmosphere of a place where nobody knows their neighbours.')
) AS v(slug, name, descr)
WHERE p.slug = 'safecracker';

-- ─────────────────────────────────────────────────────────── страницы комикса
-- 30 страниц (ЧЁТНО), 128 слотов, classic_6 исключён, ни один шаблон
-- не повторяется на СОСЕДНИХ разворотах (разворот = страницы 2k, 2k+1).
INSERT INTO comic_pages (id, "projectId", "pageIndex", "templateId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, v.idx, v.tpl, now(), now()
FROM projects p, (VALUES
  ( 0, 'wide_narrows4'),       ( 1, 'talls_flank_squares'), ( 2, 'tall_page_left'),
  ( 3, 'land_sq_squares'),     ( 4, 'narrows3_land2'),      ( 5, 'wide_top_trio'),
  ( 6, 'sq_land_squares'),     ( 7, 'bands_squares_mid'),   ( 8, 'duo_wide'),
  ( 9, 'trio_wide_bottom'),    (10, 'land2_narrows3'),      (11, 'hero_land_squares'),
  (12, 'tall_page_right'),     (13, 'talls_flank_squares'), (14, 'land_sq_squares'),
  (15, 'squares_hero_land'),   (16, 'narrows3_land2'),      (17, 'tall_page_left'),
  (18, 'wide_narrows4'),       (19, 'sq_land_squares'),     (20, 'land_sq_squares'),
  (21, 'bands_squares_mid'),   (22, 'duo_wide'),            (23, 'wide_top_trio'),
  (24, 'talls_flank_squares'), (25, 'squares_hero_land'),   (26, 'duo_wide'),
  (27, 'wide_narrows4'),       (28, 'trio_wide_bottom'),    (29, 'tall_page_left')
) AS v(idx, tpl)
WHERE p.slug = 'safecracker';

-- ─────────────────────────────────────────────────────────── акты
-- §4.0c: отдельного «cold open» НЕТ, вступление — это Акт 1.
INSERT INTO scenes (
  id, "projectId", "sceneKey", title, "sortOrder",
  "defaultReferenceProfileCode", "createdAt",
  "defaultTimeOfDay", "defaultPaletteKey", "lightingMood", "defaultVideoFlow"
)
SELECT gen_random_uuid()::text, p.id, v.k, v.t, v.so, v.prof, now(), v.tod, v.pal, v.light, NULL
FROM projects p, (VALUES
  ('A1', 'Акт 1 — ночь, чужая дверь, чужой взгляд на руки', 1, 'VLAD_MID',  'night',   'cold_night',   'single caged bulb, hard shadows, breath in cold air'),
  ('A2', 'Акт 2 — 1979, замок сверлят насмерть',            2, 'VLAD_KID',  'day',     'warm_amber',   'warm afternoon light through a broken pane, dust in the air'),
  ('A3', 'Акт 3 — будка, очередь, четыреста ключей',        3, 'VLAD_MID',  'day',     'muted_grey',   'flat overcast daylight through a hatch window, one fluorescent tube'),
  ('A4', 'Акт 4 — двести долларов за пятнадцать секунд',    4, 'VLAD_MID',  'evening', 'cold_night',   'sodium yard light, one hard cone and black corners'),
  ('A5', 'Акт 5 — правило, которое он называет чистотой',   5, 'VLAD_MID',  'night',   'cold_night',   'torchlight and landing bulb, everything else unlit'),
  ('A6', 'Акт 6 — он показывает сыну, что замок игрушка',   6, 'VLAD_MID',  'evening', 'warm_amber',   'warm kitchen bulb, courtyard dusk in the window'),
  ('A7', 'Акт 7 — вывеска, и последний заказ',              7, 'VLAD_MID',  'day',     'muted_grey',   'clean daylight from the street, warm bench lamp'),
  ('A8', 'Акт 8 — четыре часа и бумага внутри',             8, 'VLAD_MID',  'night',   'cold_night',   'table lamp only, curtains drawn, the rest of the room dark'),
  ('A9', 'Акт 9 — он ставит замки и больше не снимает',     9, 'VLAD_OLD',  'day',     'muted_grey',   'even shadowless daylight, no warmth in it'),
  -- sceneKey ОБЯЗАН совпадать с префиксом кода кадра (`F_SH01` → `F`):
  -- кадры привязываются к акту по `split_part(shotCode,'_',1)`, и ключ `FN`
  -- молча оставил бы весь финал без акта — 12 INSERT'ов вернули бы 0 строк.
  ('F',  'Финал — семь ключей на одном кольце',            10, 'VLAD_OLD',  'evening', 'cold_night',   'low bench lamp against a darkening room')
) AS v(k, t, so, prof, tod, pal, light)
WHERE p.slug = 'safecracker';

COMMIT;

-- Проверка после применения:
--   SELECT count(*) FROM comic_pages cp JOIN projects p ON p.id=cp."projectId" WHERE p.slug='safecracker';  -- 30
--   SELECT count(*) FROM scenes s JOIN projects p ON p.id=s."projectId" WHERE p.slug='safecracker';         -- 10
--   SELECT count(*) FROM character_profiles cp JOIN characters c ON c.id=cp."characterId"
--     JOIN projects p ON p.id=c."projectId" WHERE p.slug='safecracker';                                     -- 8
