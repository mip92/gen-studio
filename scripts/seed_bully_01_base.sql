-- ============================================================================
-- «Тот, кого они слушались» (slug: bully) — base seed: project, cast, locations
--
-- Test project for the two-frame (flf2v) video flow. Track B, realcomic_qwen,
-- ~15 min ≈ ~180 shots, all animated.
--
-- Deliberate structural departure from Skill(gen-studio-scenario) §4.0a: there
-- is NO cold-open block (user 2026-08-15). §4.0a's cold open is a self-contained
-- scene that must end with "the ordinary day resuming as if nothing happened" —
-- a crisis that opens and closes carries no momentum into act 1, and this
-- channel loses ~50% of viewers inside the first 75 seconds. Act 1 opens INSIDE
-- an unresolved crisis and hands it straight to act 2.
--
-- The country, the republic and the town are never named anywhere (hard rule).
-- Soviet-era school interiors are common to the whole union, so the setting
-- carries the era without carrying a country.
--
-- Idempotent: safe to re-run. Run 02_shots.sql afterwards.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- ── Project ─────────────────────────────────────────────────────────────────
-- The four default* prompt fields are NOT NULL. Motion defaults are written as
-- POSITIVE LOCKS: on the fast i2v path cfg=1.0, where ComfyUI never evaluates
-- the uncond branch, so a negation in the positive just hands the model the
-- token it must avoid (repealed 2026-07-30 across 5 662 shots — do not copy the
-- legacy "no camera motion, no parallax" wording from older projects).
-- exportTiming='narration': the timeline slot is VO + 0.5 s and the clip is
-- slowed to fit, which is what every shipped film on this channel uses. The
-- Prisma default is 'clip' (a fixed ~5 s slot) and would silently give a
-- different film — set it explicitly.
INSERT INTO projects (
  id, slug, name, "visualStyle", "ttsEngine", "targetPlatform", "safetyTier",
  "exportTiming",
  "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt", "defaultStaticMotionPrompt",
  settings, "scriptText", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'bully',
  'Тот, кого они слушались',
  'realcomic_qwen',
  'f5',
  'youtube',
  'advertiser_safe',
  'narration',
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, big shiny eyes, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, state emblems, currency symbols, graphic violence, blood, gore, injured bodies, nudity, cigarettes, smoking, character reference sheet, plain studio backdrop, portrait crop',
  'blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, hyperrealistic, motion blur, warping, melted face, flicker, scene cut, sudden cut, identity change, anime character appearing, new people entering frame, extra humans',
  'the camera pushes in slowly, quiet breathing and small natural micro-movements, the rest of the frame holding still',
  'the camera stays locked and fixed for the whole shot, every surface and object holding its exact position, the air still and the light steady, a photograph holding its breath',
  jsonb_build_object(
    'styleLora',            jsonb_build_object('name', 'style\RealComic_2509_base.safetensors', 'strengthModel', 0.5),
    'sceneSteps',           8,
    'qwenReferenceLatents', true,
    'anchorPipeline',       'flux_comic',
    'anchorStyleLora',      jsonb_build_object('name', 'style\Comic_Style_-_FLUX.safetensors', 'strengthModel', 0.9, 'strengthClip', 0.9),
    'anchorComposition',    'waist-up framing, standing in a softly blurred muted interior with natural depth, gentle directional daylight, soft natural shadows',
    'fluxBaseModel',        'flux1-dev-kontext_fp8_scaled.safetensors'
  ),
  NULL,  -- scriptText is written by 02_script.sql (kept separate: it is prose, not config)
  now()  -- @updatedAt is applied by the Prisma client, not by the DB — a raw
         -- INSERT has to set it or it trips the NOT NULL constraint
)
ON CONFLICT (slug) DO NOTHING;

-- Two-frame flow by default. Guarded because the column only exists after the
-- 20260815120000_video_flow_flf2v migration; the rest of this seed does not
-- depend on it, so a pre-migration run still produces a usable project.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'projects' AND column_name = 'defaultVideoFlow') THEN
    EXECUTE 'UPDATE projects SET "defaultVideoFlow" = ''flf2v'' WHERE slug = ''bully''';
  ELSE
    RAISE NOTICE 'defaultVideoFlow column missing — run prisma migrate deploy, then re-run this file';
  END IF;
END $$;

-- ── Cast ────────────────────────────────────────────────────────────────────
-- displayName is a BARE LATIN GIVEN NAME: on the Qwen path it is copied verbatim
-- into the instruction as "Picture 1 is <displayName>." — a binding between a
-- picture and a name, never a description. Roles and Russian names live in
-- scriptText and narrationText, where the viewer actually meets them.
INSERT INTO characters (id, "projectId", code, "displayName")
SELECT gen_random_uuid(), p.id, v.code, v.display
FROM projects p,
     (VALUES ('SLAVA','Slava'), ('YURA','Yura'), ('TOLIK','Tolik'),
             ('RITA','Rita'),   ('KUZMICH','Kuzmich'), ('NINA','Nina')) AS v(code, display)
WHERE p.slug = 'bully'
ON CONFLICT ("projectId", code) DO NOTHING;

-- The characters PICKER reads this M:N table, not Character.projectId. Skipping
-- it is the documented way to end up with an empty /characters page.
INSERT INTO project_characters ("projectId", "characterId")
SELECT p.id, c.id FROM projects p JOIN characters c ON c."projectId" = p.id
WHERE p.slug = 'bully'
ON CONFLICT DO NOTHING;

-- ── Profiles ────────────────────────────────────────────────────────────────
-- promptBase: ≤35 words of prose for a 7B VL encoder, ordered build/age → hair →
-- eyes → signature prop → wardrobe. No negations, no CLIP tails, no colour words
-- on skin, no cigarettes, nothing behind an ear, and no prop that dictates a
-- pose (with qwenReferenceLatents ON a baked pose rides into every shot).
--
-- Cast distinctiveness is enforced here: bristle-cut dark blond / fine light
-- side-parting / coarse red / black braids / ash-blonde bun / thinning grey —
-- no two leads share a hair colour AND style.
--
-- No child carries a face-marking anchor. Yura's glasses are an object he wears,
-- not a mark on his face.
INSERT INTO character_profiles (
  id, "characterId", "profileCode", "ageLabel", "targetImages",
  "promptBase", "triggerToken", "useIpAdapter"
)
SELECT gen_random_uuid(), c.id, v.pcode, v.age, 0, v.base, v.trig, false
FROM projects p
JOIN characters c ON c."projectId" = p.id
JOIN (VALUES
  ('SLAVA', 'SLAVA_TEEN', '14',
   'a wiry east-european boy of fourteen, dark blond hair cropped to a short bristle, grey eyes, a homemade copper wire bracelet on his left wrist, a grey school jacket over a knitted vest',
   'slavateen'),
  ('SLAVA', 'SLAVA_OLD', '44',
   'a heavy-set east-european man of forty-four, greying bristle-cut hair with a receding hairline, grey eyes, a darkened copper wire bracelet on his left wrist, a navy work jacket over a faded flannel shirt',
   'slavaold'),
  ('YURA', 'YURA_TEEN', '14',
   'a slight east-european boy of fourteen, fine light hair in a side parting, pale blue eyes, thin metal glasses with one temple wrapped in blue insulating tape, a mustard knitted vest over a school shirt',
   'yurateen'),
  ('TOLIK', 'TOLIK_TEEN', '14',
   'a stocky east-european boy of fourteen, coarse red hair cut short, brown eyes, a school belt with a brass buckle polished to a mirror, a grey school jacket with the sleeves pushed up',
   'tolikteen'),
  ('RITA', 'RITA_TEEN', '14',
   'a slim east-european girl of fourteen, black hair in two braids, dark brown eyes, a red plastic claw clip above one braid, a brown school dress with a white collar and a black pinafore',
   'ritateen'),
  ('RITA', 'RITA_OLD', '44',
   'a slim east-european woman of forty-four, black hair greying at the temples in a short bob, dark brown eyes, small pearl stud earrings, a soft grey cardigan over a plain blouse',
   'ritaold'),
  ('KUZMICH', 'KUZMICH_BASE', '55',
   'a broad east-european man of fifty-five, thinning grey hair and grey stubble, deep-set brown eyes, a blue satin work coat with a scorched right sleeve over a checked shirt',
   'kuzmichbase'),
  ('NINA', 'NINA_BASE', '40',
   'a trim east-european woman of forty, ash-blonde hair in a low bun, hazel eyes, a small round wristwatch worn face-inward on her left wrist, a dark brown suit jacket over a cream blouse',
   'ninabase')
) AS v(ccode, pcode, age, base, trig) ON v.ccode = c.code
WHERE p.slug = 'bully'
ON CONFLICT ("characterId", "profileCode") DO NOTHING;

-- Age chain: the older state renders as a Qwen edit of the younger face instead
-- of a fresh person. Profiles inserted by raw SQL are NOT auto-chained — this is
-- the step that left 376 profiles unlinked across projects seeded 03.08–10.08.
UPDATE character_profiles old
   SET "baseProfileId" = young.id
  FROM character_profiles young
  JOIN characters c ON c.id = young."characterId"
  JOIN projects p ON p.id = c."projectId"
 WHERE p.slug = 'bully'
   AND old."characterId" = young."characterId"
   AND (young."profileCode", old."profileCode") IN
       (('SLAVA_TEEN','SLAVA_OLD'), ('RITA_TEEN','RITA_OLD'))
   AND old."baseProfileId" IS DISTINCT FROM young.id;

-- ── Locations ───────────────────────────────────────────────────────────────
-- description is English prose prepended to the shot positive at render time.
-- It describes the SPACE only — never style tokens (the LoRA carries style) and
-- never a country marker.
INSERT INTO locations (id, "projectId", slug, name, description, "updatedAt")
SELECT gen_random_uuid(), p.id, v.slug, v.name, v.descr, now()
FROM projects p,
(VALUES
 ('school_workshop', 'Школьная мастерская',
  'A school woodworking shop in a late-Soviet secondary school: eight scarred wooden benches in two rows, each with a cast-iron vice, a drill press bolted to a steel table at the head of the room, a wall board with hand tools hung on painted outlines, curls of pine shavings underfoot, sawdust hanging in the light from tall dusty windows, oil-painted walls in pale green up to shoulder height and whitewash above, a blackboard with a chalked cutting diagram, atmosphere of warm resinous stillness between lessons.'),
 ('classroom', 'Кабинет',
  'A late-Soviet school classroom: three rows of paired desks with lift-up lids and tubular steel legs, a black slate board with a wooden chalk ledge, a teacher table on a low platform, tall windows with wide sills and heavy net curtains, a cast-iron radiator under each window, oil-painted walls in pale ochre to shoulder height and whitewash above, a wall map and a row of framed portraits above the board, worn parquet floor, atmosphere of chalk dust and mid-morning quiet.'),
 ('corridor_2f', 'Коридор второго этажа',
  'The second-floor corridor of a late-Soviet school: a long straight run of worn parquet, tall windows down one side reaching almost to the floor, deep sills, cast-iron radiators under each window painted the same pale green as the wall panel, a whitewashed upper wall, classroom doors with small glazed panels down the other side, a stand with pinned notices, a fire hose cabinet, atmosphere of echoing emptiness between bells.'),
 ('boiler_backyard', 'Задворки за котельной',
  'The blind yard behind a school boiler house: a red brick wall streaked with soot, two lagged pipes running along it on brackets, a low iron door with a hasp, trodden dirty snow with black cinders scattered on it, a stack of broken pallets, bare poplar branches above the wall, no windows overlook this place from any direction, atmosphere of cold flat afternoon light and no witnesses.'),
 ('schoolyard', 'Школьный двор',
  'The yard of a late-Soviet school: cracked asphalt with painted lines faded almost away, two welded-pipe horizontal bars and a climbing frame, a low concrete kerb around a bed of frozen earth, tall bare poplars along the fence, a plain four-storey school block of pale brick with rows of identical windows, bicycle stands, atmosphere of grey open air and long shadows.'),
 ('yura_room', 'Комната Юры',
  'A small boy''s room in a late-Soviet flat: a desk pushed against the window with a folding lamp, a shoebox of clear plexiglass offcuts and pressed flowers on the sill, a bookshelf of school textbooks, a folding bed with a knitted blanket, a patterned rug hung on the wall above it, wallpaper in a small repeating print, atmosphere of careful quiet and a single warm lamp.'),
 ('slava_kitchen', 'Кухня в квартире',
  'A cramped kitchen in a late-Soviet flat: a small square table with an oilcloth in a check pattern, three mismatched stools, a gas stove with an enamel kettle, a wall cabinet with frosted glass doors, a window over the sink looking into a courtyard of identical blocks, a radio on the shelf, atmosphere of evening lamplight and cooling food.'),
 ('garage_workbench', 'Гаражный бокс',
  'A private garage workbench thirty years later: a heavy steel bench under a clamp lamp, a vice at one end, tools laid in rows on a pegboard, a bank of shallow drawers beneath, coffee tin of drill bits, concrete floor with old oil stains, a roller door closed behind, a small electric heater glowing, atmosphere of late-night working light in a cold space.'),
 ('school_entrance_2020', 'Вход в школу, тридцать лет спустя',
  'The entrance of the same school building three decades later: the same pale brick block with new plastic windows in the old openings, a modern metal door with a card reader, a paved ramp with a handrail added beside the steps, young lime trees planted where the poplars stood, painted parking bays, atmosphere of a grey ordinary afternoon.'),
 ('reunion_hall', 'Актовый зал на встрече выпускников',
  'A school assembly hall set for a reunion: rows of folding seats pushed back against the walls, a low stage with a heavy curtain, long tables with paper cloths and plastic cups, a garland of paper letters strung above the stage, tall windows with the blinds half down, a piano against the side wall under a cover, atmosphere of warm crowded evening light.')
) AS v(slug, name, descr)
WHERE p.slug = 'bully'
ON CONFLICT ("projectId", slug) DO NOTHING;

-- ── Report ──────────────────────────────────────────────────────────────────
SELECT 'project'    AS what, count(*) FROM projects WHERE slug = 'bully'
UNION ALL SELECT 'characters', count(*) FROM characters c JOIN projects p ON p.id = c."projectId" WHERE p.slug = 'bully'
UNION ALL SELECT 'profiles',   count(*) FROM character_profiles pr JOIN characters c ON c.id = pr."characterId" JOIN projects p ON p.id = c."projectId" WHERE p.slug = 'bully'
UNION ALL SELECT 'locations',  count(*) FROM locations l JOIN projects p ON p.id = l."projectId" WHERE p.slug = 'bully';
