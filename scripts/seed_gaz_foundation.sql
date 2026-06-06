-- Seed: «Газ» project FOUNDATION (Track B cautionary tale, graphic_novel_cell_shaded)
-- Riga street-racing → fatal crash → prison. exportTiming='narration' (long-form
-- 45-min model: first ~10 min animated, rest static + Ken Burns).
-- Idempotent-ish: uses fixed UUIDs + ON CONFLICT DO NOTHING so re-running is safe.
-- Direct SQL is the documented exception for SEEDING A FRESH PROJECT.
SET client_encoding = 'UTF8';
BEGIN;

-- ── Fixed UUIDs ────────────────────────────────────────────────────────────
-- proj 6a20…0001 | chars …00c1-c4 | profiles …00f1-f4 | templates …00a1-a2
-- routes …00b1-b2 | route_steps …00e1-e2

-- ── 1. Project row ──────────────────────────────────────────────────────────
INSERT INTO projects (
  id, slug, name, "targetPlatform", "safetyTier", "visualStyle", "exportTiming",
  "ttsEngine", "ttsVoiceRefPath",
  "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt", "defaultStaticMotionPrompt",
  "scriptText", "createdAt", "updatedAt"
) VALUES (
  '6a200000-0000-4000-8000-000000000001',
  'gaz',
  'Газ. История одного перекрёстка.',
  'youtube',
  'advertiser_safe',
  'graphic_novel_cell_shaded',
  'narration',
  'f5',
  'data/gaz/tts/voice_reference.mp3',
  'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, harsh dramatic shadows, side-lit drama, modern brand logos, readable license plates',
  'blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos',
  'subtle camera push-in, gentle breathing motion, natural micro-movements, character quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence',
  'completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object in frame remains completely stationary. No people walking, no figures moving, no environmental motion, no wind, no flickering lights. The entire scene is a still illustration come to life with zero motion, freeze frame',
  $script$# Газ. История одного перекрёстка.

GENRE TRACK: B (cautionary YouTube tale, «И ЭТО ВСЯ ТВОЯ ЖИЗНЬ»).
VO PERSON: 2nd person, present tense («ты»). Narrator = older, ruined self.
VISUAL STYLE: graphic_novel_cell_shaded. EXPORT: narration timing; first ~10 min animated (Wan i2v, slowed to VO), the rest static stills + Ken Burns.
SETTING: Рига (русскоязычная), 2004 → 2025. Currency: EURO (€). Baltic old-German-car culture (BMW/Audi).
LENGTH: ~45 min, ~220 shots.

LEITMOTIF (recurs verbatim, named at the end): «короткая невесомость под рёбрами — как в самой верхней точке качелей, за миг до того как полетишь вниз». First felt age 8 on the garage ramp.
FINAL IMAGE (§3.6): a child's small sneaker on wet asphalt in the blue strobe of a police light.
DISCLAIMER (end): «Эта история вымышлена. Все совпадения с реальными людьми и событиями случайные. Не повторяй чужие ошибки.»

## CAST (identity anchors — small, always-on)
- ТЫ / RACER — русскоязычный рижанин. Anchor: потёртая коричневая кожаная перчатка ТОЛЬКО на правой руке (на руле — всегда). Тёмно-русый короткий ёжик, худой, узкие усталые серые глаза. Ages: 8 (origin), 16 (first car), 19–24 (climb), 29 (crash), 36 (aftermath). Profiles: RACER_ADULT primary; RACER_TEEN, RACER_CHILD added per origin/teen acts.
- ТРЕНЕР — механик из гаражей Чиекуркалнса, ~45, втягивает в «работу»/заезды. Anchor: массивные стальные часы, постукивает по ним перед заездом. Бритая голова, седая щетина, грузный, тяжёлые руки.
- ЛИГА — латышка, ~24, точка невозврата (любовь, попытка завязать). Anchor: тонкая золотая цепочка на щиколотке. Рыжие длинные волнистые волосы, круглые очки, светлая кожа.
- ВИТЁК — безбашенный друг, ~22, ведёт тебя в чат гонщиков. Anchor: щербатый передний зуб. Пероксидный белый ёжик, дёрганый.
- Семья на сером Opel (катастрофа) — не именованы; ребёнок (кроссовка в финале). Без anchor/LoRA, описываются в шоте.

## STRUCTURE (scene = act)
0. cold_open — Южный мост, 180 на спидометре, рука в перчатке на рычаге, чёрная Audi рядом, ставка €300; на съезде у Маскавас выезжает серый Opel с семьёй. CTA: «ты ещё не знаешь, что через четыре секунды…».
1. act_01_origins — 8 лет, Болдерая, отец в порту, мать в аптеке на Маскавас; гаражная горка на велике — первая невесомость (лейтмотив).
2. act_02_first_car — 16 лет, убитая BMW E39 за €900, гаражи; первый разгон по пустой Lidostas ночью.
3. act_03_chat — 19 лет, Витёк вводит в закрытый Telegram-чат рижских гонщиков; первые ставки €50–100, видео заездов.
4. act_04_trener — Тренер, чип-тюнинг за €350, гаражи Чиекуркалнса; правила; первые серьёзные заезды.
5. act_05_climb — деньги и уважение; заезды на Южном мосту и трассе A10 Рига–Юрмала; €200–500 за ночь; ты «тихий и точный».
6. act_06_liga — Лига; впервые хочешь остаться, а не ехать; почти завязываешь; окно захлопывается.
7. act_07_night — роковая ночь (cold-open в контексте): ставка, разгон, серый Opel, удар.
8. act_08_arrest — Valsts policija, ладонь на плече; суд; €-иск; колония под Елгавой.
9. act_09_aftermath — вышел в 36, выжжен; шиномонтаж в спальном районе; не садишься за руль; пустота на месте невесомости.
10. coda — пролом четвёртой стены к зрителю; финальный кадр (детская кроссовка); дисклеймер.

NOTE: act-level VO citations live in shot.narrationText (RU, dotless per feedback_tts_no_dots). This treatment is the source of truth for plot/beats; keep synced when content changes.$script$,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ── 2. Characters ─────────────────────────────────────────────────────────
INSERT INTO characters (id, "projectId", code, "displayName", "createdAt") VALUES
  ('6a200000-0000-4000-8000-0000000000c1', '6a200000-0000-4000-8000-000000000001', 'RACER',  'Ты (гонщик)', now()),
  ('6a200000-0000-4000-8000-0000000000c2', '6a200000-0000-4000-8000-000000000001', 'TRENER', 'Тренер',      now()),
  ('6a200000-0000-4000-8000-0000000000c3', '6a200000-0000-4000-8000-000000000001', 'LIGA',   'Лига',        now()),
  ('6a200000-0000-4000-8000-0000000000c4', '6a200000-0000-4000-8000-000000000001', 'VITEK',  'Витёк',       now())
ON CONFLICT (id) DO NOTHING;

-- ── 3. project_characters M:N (the picker reads THIS, not Character.projectId) ─
INSERT INTO project_characters ("projectId", "characterId", "attachedAt") VALUES
  ('6a200000-0000-4000-8000-000000000001', '6a200000-0000-4000-8000-0000000000c1', now()),
  ('6a200000-0000-4000-8000-000000000001', '6a200000-0000-4000-8000-0000000000c2', now()),
  ('6a200000-0000-4000-8000-000000000001', '6a200000-0000-4000-8000-0000000000c3', now()),
  ('6a200000-0000-4000-8000-000000000001', '6a200000-0000-4000-8000-0000000000c4', now())
ON CONFLICT ("projectId", "characterId") DO NOTHING;

-- ── 4. Character profiles (cartoon: useIpAdapter=true, targetImages=0, no LoRA) ─
INSERT INTO character_profiles (
  id, "characterId", "profileCode", "ageLabel", "targetImages", "useIpAdapter",
  "triggerToken", "promptBase", negative, "createdAt"
) VALUES
  ('6a200000-0000-4000-8000-0000000000f1', '6a200000-0000-4000-8000-0000000000c1', 'RACER_ADULT', 'adult 28', 0, true, 'r4cerman',
   'a 28-year-old Russian-speaking man from Riga, lean wiry athletic build, short dark-brown buzz-cut hair, narrow tired grey eyes, thin face with light stubble, calm guarded expression, wearing a plain grey hooded jacket and dark jeans, ONE worn brown leather fingerless driving glove on his RIGHT hand only as a constant identity anchor, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
   'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, glamour, beard, long hair, two gloves, gloves on both hands, deformed hands, extra fingers',
   now()),
  ('6a200000-0000-4000-8000-0000000000f2', '6a200000-0000-4000-8000-0000000000c2', 'TRENER_BASE', 'adult 45', 0, true, 'tr3nerman',
   'a 45-year-old heavyset Latvian garage mechanic, completely shaved bald head, grey stubble, broad shoulders, heavy thick forearms and large scarred working hands, deep-set calm eyes, weathered face, wearing a dark oil-stained work jacket, a massive brushed-steel diver wristwatch on his left wrist as a constant identity anchor, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
   'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, young, slim, full head of hair, deformed hands, extra fingers',
   now()),
  ('6a200000-0000-4000-8000-0000000000f3', '6a200000-0000-4000-8000-0000000000c3', 'LIGA_BASE', 'adult 24', 0, true, 'lig4woman',
   'a 24-year-old Latvian woman, long wavy auburn red hair, round thin-rimmed glasses, fair freckled skin, warm intelligent eyes, slim, wearing a cream knit sweater and light jeans, a thin delicate gold chain around her right ankle as a constant identity anchor, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
   'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, blonde hair, black hair, brown hair, dark hair, glamour, heavy makeup, deformed hands, extra fingers',
   now()),
  ('6a200000-0000-4000-8000-0000000000f4', '6a200000-0000-4000-8000-0000000000c4', 'VITEK_BASE', 'adult 22', 0, true, 'vit3kman',
   'a 22-year-old jittery young man, short spiky bleached peroxide-blond hair, thin restless face, a visibly chipped front tooth as a constant identity anchor, lively reckless grin, wearing a black bomber jacket and a hoodie, cell-shaded graphic novel character with hard black ink outline and flat color blocks',
   'photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, dark hair, brown hair, older man, deformed hands, extra fingers',
   now())
ON CONFLICT (id) DO NOTHING;

-- ── 5. Workflow templates (graphic-novel: character-IP + environment) ─────────
INSERT INTO workflow_templates (id, "projectId", "templateKey", "filePath", description, "visualStyle", "createdAt") VALUES
  ('6a200000-0000-4000-8000-0000000000a1', '6a200000-0000-4000-8000-000000000001',
   'char_ip_graphic_novel', 'gaz/comfy/scene_single_character_graphic_novel_api.json',
   'Single-character cell-shaded scene (IP-Adapter anchor)', 'graphic_novel_cell_shaded', now()),
  ('6a200000-0000-4000-8000-0000000000a2', '6a200000-0000-4000-8000-000000000001',
   'environment_graphic_novel', 'gaz/comfy/scene_environment_graphic_novel_api.json',
   'Environment / B-roll cell-shaded scene (no character)', 'graphic_novel_cell_shaded', now())
ON CONFLICT (id) DO NOTHING;

-- ── 6. Workflow routes + steps ───────────────────────────────────────────────
INSERT INTO workflow_routes (id, "projectId", "routeKey", "createdAt") VALUES
  ('6a200000-0000-4000-8000-0000000000b1', '6a200000-0000-4000-8000-000000000001', 'gaz_character_ip', now()),
  ('6a200000-0000-4000-8000-0000000000b2', '6a200000-0000-4000-8000-000000000001', 'gaz_environment',  now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_route_steps (id, "workflowRouteId", "stepOrder", "workflowTemplateId") VALUES
  ('6a200000-0000-4000-8000-0000000000e1', '6a200000-0000-4000-8000-0000000000b1', 0, '6a200000-0000-4000-8000-0000000000a1'),
  ('6a200000-0000-4000-8000-0000000000e2', '6a200000-0000-4000-8000-0000000000b2', 0, '6a200000-0000-4000-8000-0000000000a2')
ON CONFLICT (id) DO NOTHING;

-- ── 7. Scenes (cold_open + 9 acts + coda = 11) ───────────────────────────────
INSERT INTO scenes (id, "projectId", "sceneKey", title, "sortOrder", "actBeat", "defaultTimeOfDay", "defaultPaletteKey", "createdAt") VALUES
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'cold_open',        'Cold open — Южный мост, 4 секунды до', 0,  'setup',      'january_night_2025',   'COLD_OPEN_sodium_wet',  now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_01_origins',   'A1 — Истоки (8 лет)',                  1,  'setup',      'summer_day_2004',      'A1_warm_sodium',        now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_02_first_car', 'A2 — Первая машина (16)',              2,  'rising',     'autumn_night_2012',    'A2_cold_garage',        now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_03_chat',      'A3 — Чат (19)',                        3,  'rising',     'winter_night_2015',    'A3_screen_glow',        now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_04_trener',    'A4 — Тренер',                          4,  'rising',     'evening_garage_2016',  'A4_oil_amber',          now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_05_climb',     'A5 — Подъём',                          5,  'rising',     'night_bridge_2018',    'A5_neon_blue',          now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_06_liga',      'A6 — Лига (точка невозврата)',         6,  'midpoint',   'summer_day_2023',      'A6_warm_daylight',      now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_07_night',     'A7 — Роковая ночь',                    7,  'climax',     'january_night_2025',   'A7_sodium_wet',         now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_08_arrest',    'A8 — Арест и суд',                     8,  'climax',     'january_dawn_2025',    'A8_grey_institutional', now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'act_09_aftermath', 'A9 — После (36 лет)',                  9,  'resolution', 'overcast_day_2033',    'A9_hollow_grey',        now()),
  (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'coda',             'Кода — четвёртая стена',               10, 'resolution', 'overcast_day_2033',    'CODA_grey',             now())
ON CONFLICT ("projectId", "sceneKey") DO NOTHING;

COMMIT;
