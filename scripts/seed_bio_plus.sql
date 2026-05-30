-- Seed: bio_plus project (200 shots, 9 acts inc. cold open + coda, 8 characters all via IP-Adapter).
-- Idempotent-by-slug: rerunning DELETEs then re-INSERTs the project (CASCADE wipes scenes/shots/characters).
-- This file is PART 1 of 2 — Project + Scenes + Characters + Profiles + Shots header.
-- Shots themselves are appended via seed_bio_plus_shots.sql (run after this one in same transaction).
--
-- All prompt content is in English (per feedback_db_english_only). narrationRu is RU for Silero TTS.
-- Narration has NO periods (per feedback_tts_no_dots) — only commas, dots replaced with comma+lowercase.
-- Visual style is cinematic graphic-novel cell-shaded (NOT photoreal — see character_profiles.md §6).
-- Identity stack: NO LoRA training. All characters use IP-Adapter at low weight 0.4-0.5.

BEGIN;

-- Idempotent cleanup ---------------------------------------------------------
DELETE FROM projects WHERE slug = 'bio_plus';

DO $$
DECLARE
  v_proj      TEXT := gen_random_uuid()::text;
  v_co        TEXT := gen_random_uuid()::text;  -- cold open scene
  v_a1        TEXT := gen_random_uuid()::text;
  v_a2        TEXT := gen_random_uuid()::text;
  v_a3        TEXT := gen_random_uuid()::text;
  v_a4        TEXT := gen_random_uuid()::text;
  v_a5        TEXT := gen_random_uuid()::text;
  v_a6        TEXT := gen_random_uuid()::text;
  v_a7        TEXT := gen_random_uuid()::text;
  v_coda      TEXT := gen_random_uuid()::text;
  v_ch_elena  TEXT := gen_random_uuid()::text;
  v_ch_sveta  TEXT := gen_random_uuid()::text;
  v_ch_viktor TEXT := gen_random_uuid()::text;
  v_ch_larisa TEXT := gen_random_uuid()::text;
  v_ch_galina TEXT := gen_random_uuid()::text;
  v_ch_tamara TEXT := gen_random_uuid()::text;
  v_ch_dolder TEXT := gen_random_uuid()::text;
  v_ch_dyoung TEXT := gen_random_uuid()::text;
  v_pr_elena  TEXT := gen_random_uuid()::text;
  v_pr_sveta  TEXT := gen_random_uuid()::text;
  v_pr_viktor TEXT := gen_random_uuid()::text;
  v_pr_larisa TEXT := gen_random_uuid()::text;
  v_pr_galina TEXT := gen_random_uuid()::text;
  v_pr_tamara TEXT := gen_random_uuid()::text;
  v_pr_dolder TEXT := gen_random_uuid()::text;
  v_pr_dyoung TEXT := gen_random_uuid()::text;
BEGIN

-- Project --------------------------------------------------------------------
INSERT INTO projects (id, slug, name, "scriptText", settings, "targetPlatform", "safetyTier", "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt", "defaultStaticMotionPrompt", "createdAt", "updatedAt")
VALUES (v_proj, 'bio_plus', 'БиоПлюс. История одной баночки магния.',
  $pp$# bio_plus — cautionary tale

**Genre:** cautionary tale (Track B — 2nd-person present-tense narrator)
**Platform:** youtube long-form
**Safety tier:** advertiser_safe
**Length:** ~16 min 40 sec, 200 shots × 5 sec
**Visual style:** cinematic graphic-novel illustration, cell-shaded, hard ink outline
**Setting:** Belarus, Mogilev (with trips to Gomel, Bobruisk, Minsk), 2008-2026
**Heroine:** single mother, 28 at start → 46 at end. Name revealed only at A7_SH06 on cleaner's badge: ЕЛЕНА.
**Sensory leitmotif:** "sweet warm knot just above the navel" — birth A1_SH22, mutation A5_SH21, death A6_SH15. Replaced by "тихая пустая пропасть точно по центру груди" from A6_SH20 onward.
**Hard rules:** no real MLM brand names (use fictional БиоПлюс), no graphic violence, no self-harm, English in DB prompt fields only, narration RU.
**VO policy:** single off-camera narrator voice. Dialogue paraphrased via narrator ("Светлана говорит: ..."). NO viewer address, NO 4th wall break, NO 1st-person shift in Coda, NO pseudo-prophecy markers, NO subjective cross-timeline comparisons.

## Structure
- Cold open (12) — 14:20 March 2024 stairwell freeze-frame
- A1 Истоки (22) — summer 2008, free magnesium sample, leitmotif birth
- A2 Вход (28) — October 2018, business centre, first purchase, first sale
- A3 Подъём (30) — 2019, Gomel/Bobruisk, growth Bronze → Silver
- A4 Сектантское ускорение (28) — March 2021, Minsk Palace of Republic, BMW, MFO loan, mother's silent refusal
- A5 Точка невозврата (25) — October 2022, Larisa exits, 2 AM call to Sveta, agreement to sell mother's flat
- A6 Катастрофа (20) — March 2024 same day as cold open, taxi, notary signing (central frame), leitmotif death
- A7 Послесловие (25) — January 2026, dormitory, cleaner uniform, name reveal Елена, Sveta arrested on TV
- Coda (10) — same evening, window view to distant pharmacy, disclaimer

## Characters (all IP-Adapter, no LoRA)
1. HEROINE_ELENA — silver cross necklace under blouse A1-A6, over A7+Coda
2. SPONSOR_SVETA — gold "Серебряный директор" lapel badge
3. LEADER_VIKTOR — gold pinky ring with fake diamond + gold-rimmed Seiko replica
4. FRIEND_LARISA — brushed-silver metal-frame glasses + always black turtleneck
5. MOM_GALINA — grey pharmacist coat + steel-link chain on reading glasses
6. NEIGHBOR_TAMARA — burgundy lipstick over natural lip line + canvas shoulder bag (A1 only)
7. DAUGHTER_OLDER — iridescent dragonfly hair clip (worn A2-A4, kept on shelf A7)
8. DAUGHTER_YOUNGER — light freckles on nose bridge + plush rabbit with one missing ear (gone by A7)$pp$,
  NULL, 'youtube', 'advertiser_safe',
  -- defaultNegative (graphic-novel cell-shaded: anti-photoreal)
  $pp$photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, harsh dramatic shadows, side-lit drama, modern brand logos, station name signs with readable text$pp$,
  -- defaultVideoNegative (Wan 2.2 i2v negatives)
  $pp$blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos$pp$,
  -- defaultMotionPrompt (subtle for non-static shots)
  $pp$subtle camera push-in, gentle breathing motion, natural micro-movements, character quietly continuing the moment, no abrupt gestures, no walking around, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence$pp$,
  -- defaultStaticMotionPrompt (locked-off shots)
  $pp$completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object in frame remains completely stationary. No people walking, no figures moving, no environmental motion, no wind, no flickering lights. The entire scene is a still illustration come to life with zero motion, freeze frame$pp$,
  NOW(), NOW());

-- Scenes (9: cold open + 7 acts + coda) --------------------------------------
INSERT INTO scenes (id, "projectId", "sceneKey", title, "sortOrder", "actBeat", "defaultPaletteKey", "defaultTimeOfDay", "createdAt") VALUES
  (v_co,   v_proj, 'cold_open',         'Cold open — Stairwell freeze',  0, 'opening_image',     'COLD_OPEN_stairwell',   'march_afternoon_2024', NOW()),
  (v_a1,   v_proj, 'act_01_origins',    'A1 — Истоки',                   1, 'setup',             'A1_sodium_summer',      'summer_afternoon_2008', NOW()),
  (v_a2,   v_proj, 'act_02_entry',      'A2 — Вход',                     2, 'rising',            'A2_corporate_teal',     'october_day_2018', NOW()),
  (v_a3,   v_proj, 'act_03_climb',      'A3 — Подъём',                   3, 'rising',            'A3_corporate_cold',     'spring_autumn_2019', NOW()),
  (v_a4,   v_proj, 'act_04_acceleration','A4 — Сектантское ускорение',   4, 'promise_of_premise','A4_minsk_neon',         'march_night_2021', NOW()),
  (v_a5,   v_proj, 'act_05_no_return',  'A5 — Точка невозврата',         5, 'bad_guys_close_in', 'A5_grey_amber_night',   'october_night_2022', NOW()),
  (v_a6,   v_proj, 'act_06_catastrophe','A6 — Катастрофа',               6, 'climax',            'A6_grey_yellow_silver', 'march_afternoon_2024', NOW()),
  (v_a7,   v_proj, 'act_07_aftermath', 'A7 — Послесловие',               7, 'all_is_lost',       'A7_winter_silver',      'january_winter_2026', NOW()),
  (v_coda, v_proj, 'coda_pharmacy',    'Coda — Та самая аптека',         8, 'final_image',       'CODA_indigo_distant',   'january_night_2026', NOW());

-- Characters -----------------------------------------------------------------
INSERT INTO characters (id, "projectId", code, "displayName", "createdAt") VALUES
  (v_ch_elena,  v_proj, 'HEROINE_ELENA',    'Heroine — Елена',                 NOW()),
  (v_ch_sveta,  v_proj, 'SPONSOR_SVETA',    'Sponsor — Светлана Орлова',       NOW()),
  (v_ch_viktor, v_proj, 'LEADER_VIKTOR',    'Regional leader — Виктор Соколовский', NOW()),
  (v_ch_larisa, v_proj, 'FRIEND_LARISA',    'Critic friend — Лариса',          NOW()),
  (v_ch_galina, v_proj, 'MOM_GALINA',       'Heroine''s mother — Галина Степановна', NOW()),
  (v_ch_tamara, v_proj, 'NEIGHBOR_TAMARA',  'Neighbour catalyst — тётя Тамара (A1 only)', NOW()),
  (v_ch_dolder, v_proj, 'DAUGHTER_OLDER',   'Older daughter (dragonfly clip)', NOW()),
  (v_ch_dyoung, v_proj, 'DAUGHTER_YOUNGER', 'Younger daughter (freckles)',     NOW());

-- Character profiles --------------------------------------------------------
-- All use IP-Adapter (useIpAdapter=TRUE) at low weight (0.4-0.5) — no LoRA training for graphic-novel style.
INSERT INTO character_profiles (id, "characterId", "profileCode", "ageLabel", "promptBase", negative, "loraPath", "triggerToken", "useIpAdapter", "createdAt") VALUES

  (v_pr_elena, v_ch_elena, 'HEROINE_ELENA_BASE', '28-46',
   $pp$HEROINE_ELENA_BASE, a Belarusian woman, mousy ash-brown hair shoulder length parted in the centre, pale grey-blue eyes set wide apart, thin pale lips slightly chapped, small dark mole on left jawline below the ear, narrow nose with a slight bump, thin silver chain necklace bearing a small Orthodox cross her mother gave her (under blouse A1-A6, over blouse A7+Coda), modest middle-class workwear of provincial Belarus, quiet observant face that rarely smiles, slight downward set at the corners of the mouth, weary patient expression, small build, no makeup, no jewelry beyond the cross necklace$pp$,
   $pp$glamour, makeup, lipstick, mascara, false eyelashes, eye shadow, jewelry on hands, large earrings, plunging neckline, model pose, fashion shoot, photoreal, photograph, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, anime, manga, chibi, kawaii, sexualization, swimwear, deformed hands, extra fingers, two heads, watermark, text$pp$,
   NULL, 'HEROINE_ELENA_BASE', TRUE, NOW()),

  (v_pr_sveta, v_ch_sveta, 'SPONSOR_SVETA_BASE', '42-50',
   $pp$SPONSOR_SVETA_BASE, a Belarusian woman in her forties, shoulder-length light-brown hair professionally styled and slightly back-combed, warm hazel eyes with practised friendly crinkles, full lips painted burgundy red with a precise rim, broad cheekbones, no visible moles or scars, slim athletic build, white tailored business blazer over white silk shell blouse, single gold-toned lapel badge reading "Серебряный директор БиоПлюс" precisely centred on the left lapel (absent only in A5 robe-call and A7 TV-arrest), small gold stud earrings, French manicure, smell of jasmine and coffee$pp$,
   $pp$sexualization, low-cut blouse, exposed cleavage, model pose, fashion shoot, glamour, photoreal, photograph, 3D render, CGI, plastic skin, hyperrealistic, anime, manga, chibi, kawaii, oversaturated, harsh dramatic shadows, deformed hands, extra fingers, two heads, watermark, text, brand logos other than BIO+ badge$pp$,
   NULL, 'SPONSOR_SVETA_BASE', TRUE, NOW()),

  (v_pr_viktor, v_ch_viktor, 'LEADER_VIKTOR_BASE', '55-58',
   $pp$LEADER_VIKTOR_BASE, a Belarusian man in his mid-fifties, broad-shouldered and tall, thick salt-and-pepper hair styled with pomade, deeply tanned face from a Turkish holiday, square jaw with grey stubble, narrow brown eyes set under heavy brows, broad fleshy nose, thin determined mouth, dark navy double-breasted suit with faint pinstripe over a powder-blue shirt and no tie, gold pinky ring with a square cubic-zirconia stone on the right hand, gold-rimmed Seiko 5 replica watch on left wrist, smell of expensive sandalwood cologne and cigarette smoke$pp$,
   $pp$weapons, gun, military insignia, swastika, Z or V symbol, real political symbols, real brand logos other than BIO+ pin, fashion shoot, glamour, photoreal, photograph, 3D render, CGI, plastic skin, hyperrealistic, anime, manga, chibi, kawaii, deformed hands, extra fingers, two heads, watermark, text, blood, wound$pp$,
   NULL, 'LEADER_VIKTOR_BASE', TRUE, NOW()),

  (v_pr_larisa, v_ch_larisa, 'FRIEND_LARISA_BASE', '38-46',
   $pp$FRIEND_LARISA_BASE, a Belarusian woman in her late thirties to mid-forties, dark-brown hair pulled back into a low ponytail with no fly-away strands, oval face with sharp cheekbones, thin oval-shaped wire glasses with brushed-silver frames, calm hazel eyes, no makeup, thin pale lips, a faint vertical line between the eyebrows from years of close reading, always wearing a fitted black turtleneck sweater of merino wool under an outer garment, small build, no jewelry, modest librarian-academic aesthetic$pp$,
   $pp$makeup, lipstick, mascara, eye shadow, jewelry, glamour, model pose, fashion shoot, photoreal, photograph, 3D render, CGI, plastic skin, hyperrealistic, anime, manga, chibi, kawaii, oversaturated, deformed hands, extra fingers, two heads, watermark, text$pp$,
   NULL, 'FRIEND_LARISA_BASE', TRUE, NOW()),

  (v_pr_galina, v_ch_galina, 'MOM_GALINA_BASE', '60-73',
   $pp$MOM_GALINA_BASE, a Belarusian woman in her sixties to seventies, thinning grey-streaked hair pinned back severely, deep-set tired grey-blue eyes with prominent crow's feet, thin pale lips set firmly, narrow lined face with a small mole on the left jawline (visual rhyme with her daughter), wearing a long grey pharmacist's lab coat over a beige knit cardigan, thin reading glasses on a steel-link chain hanging around her neck against the lab coat, no makeup, modest stud earrings, weary patient expression of decades behind a pharmacy counter$pp$,
   $pp$young, youthful, glamour, makeup, lipstick, jewelry beyond modest studs, fashion, model pose, photoreal, photograph, 3D render, CGI, plastic skin, hyperrealistic, anime, manga, chibi, kawaii, oversaturated, deformed hands, extra fingers, two heads, watermark, text, sexualization$pp$,
   NULL, 'MOM_GALINA_BASE', TRUE, NOW()),

  (v_pr_tamara, v_ch_tamara, 'NEIGHBOR_TAMARA_BASE', '55',
   $pp$NEIGHBOR_TAMARA_BASE, a Belarusian woman in her mid-fifties, salt-and-pepper hair pinned up loosely with grey roots at the temples and burgundy-dyed lengths, soft round face with kind worried eyes, burgundy lipstick painted slightly outside the natural lip line, gold-tone clip earrings, bright floral summer dress in faded blues and pinks, canvas shoulder bag with leather handles, comfortable middle-class older-woman provincial aesthetic$pp$,
   $pp$sexualization, glamour, model pose, fashion shoot, photoreal, photograph, 3D render, CGI, plastic skin, hyperrealistic, anime, manga, chibi, kawaii, oversaturated, deformed hands, extra fingers, two heads, watermark, text$pp$,
   NULL, 'NEIGHBOR_TAMARA_BASE', FALSE, NOW()),

  (v_pr_dolder, v_ch_dolder, 'DAUGHTER_OLDER_BASE', '4-18',
   $pp$DAUGHTER_OLDER_BASE, a Belarusian girl (age varies 4 to 18 per shot), ash-brown hair shoulder length, pale grey-blue eyes matching her mother, small straight nose with no bump, full pale cheeks, thin pale lips set seriously, an iridescent dragonfly hair clip with enamel blue-green wings pinned just above the right ear (worn A2-A4 actively, lying unworn on shelf A7), neat school uniform in childhood scenes (white blouse, navy pleated skirt, navy cardigan) or polo shirt with Krakow university logo at age 18, small build for age, modest natural pose, serious quiet observant child$pp$,
   $pp$adult body proportions, adult model pose, fashion shoot, runway pose, sexualization, swimwear, lingerie, exposed skin beyond face and hands, low-cut clothing, makeup, lipstick, mascara, jewelry on hands, large earrings, plunging neckline, mature breasts, hourglass figure, hip emphasis, tight clothing, leg emphasis, dance pose, gymnastics, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, deformed hands, extra fingers, two heads, watermark, text$pp$,
   NULL, 'DAUGHTER_OLDER_BASE', TRUE, NOW()),

  (v_pr_dyoung, v_ch_dyoung, 'DAUGHTER_YOUNGER_BASE', '0-15',
   $pp$DAUGHTER_YOUNGER_BASE, a Belarusian girl (age varies 0 to 15 per shot), ash-brown hair short to shoulders with small fringe across forehead, pale grey-blue eyes matching her mother and sister, small straight nose, light scatter of small freckles across the bridge of the nose and cheekbones (identity anchor), full slightly chapped lips set seriously, modest school uniform in childhood scenes or casual hoodie at home, small build for age, modest natural pose, very quiet observant child with serious eyes, plush rabbit with one missing ear present in A1-A5 scenes, absent in A7$pp$,
   $pp$adult body proportions, adult model pose, fashion shoot, runway pose, sexualization, swimwear, lingerie, exposed skin beyond face and hands, low-cut clothing, makeup, lipstick, mascara, jewelry, plunging neckline, hourglass figure, hip emphasis, tight clothing, leg emphasis, dance pose, gymnastics, ballet pose, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, deformed hands, extra fingers, two heads, watermark, text$pp$,
   NULL, 'DAUGHTER_YOUNGER_BASE', TRUE, NOW());

-- Shots ----------------------------------------------------------------------
-- Columns: id, projectId, sceneId, shotCode, promptFields,
--          shotType, cameraAngle, cameraMove, storyBeat, narrativeFunction,
--          vignetteSlug, isBroll, isIconic, timeOfDay, paletteKey,
--          createdAt, updatedAt
-- promptFields JSONB keys: positivePrompt, negativeRef, narrationRu
-- {TOKEN} placeholders resolved post-seed via scripts/resolve_bio_plus_placeholders.sql

INSERT INTO shots (id, "projectId", "sceneId", "shotCode", "promptFields", "shotType", "cameraAngle", "cameraMove", "storyBeat", "narrativeFunction", "vignetteSlug", "isBroll", "isIconic", "timeOfDay", "paletteKey", "createdAt", "updatedAt") VALUES

-- ========== COLD OPEN — STAIRWELL FREEZE (12) ==========
(gen_random_uuid()::text, v_proj, v_co, 'C_SH01', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, extreme close-up of a woman's right hand resting on a worn brushed-steel apartment door handle of door number 17, under her left elbow tucked tight a bright yellow translucent plastic document folder, on her ring finger a pale impression where a wedding band used to be, {HEROINE_ELENA_AGE_44} cropped at the forearm — no face visible, panel-building 5th floor stairwell landing of a Soviet-era apartment block in Mogilev, neon yellow ceiling bulb above casting hard rim light, deep blue-grey shadow behind, hard ink outline on every contour, cell-shaded skin tone with subtle cross-hatching at knuckles, camera at eye level locked off, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Твоя рука лежит на металлической ручке двери квартиры семнадцать на Машиностроителей четырнадцать$pp$), 'CU', 'eye', 'static', 'opening_image', 'iconic', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH02', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, extreme close-up of a bright translucent yellow plastic document folder tucked under a woman's left elbow, through the folder's plastic the cyrillic header ДОГОВОР КУПЛИ-ПРОДАЖИ visible on the top sheet, {HEROINE_ELENA_AGE_44} arm and torso only, dark navy blazer cuff, slow push-in framing, focus rack from folder edge to cyrillic header, stairwell light fading to deep blue-grey behind, hard ink outline on folder edge and cyrillic letterforms, cell-shaded folder yellow with cross-hatching for translucency, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$В сумке у тебя жёлтая папка, внутри договор купли-продажи двухкомнатной$pp$), 'ECU', 'eye', 'push_in', 'opening_image', 'plot', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH03', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, medium shot of {HEROINE_ELENA_AGE_44} standing on a Soviet panel-building 5th floor stairwell landing in Mogilev, dark navy blazer over thin white blouse, thin silver chain barely visible at collar (cross hidden underneath), bright yellow plastic folder tucked under left arm, beige tile floor, painted-cream stairwell walls with damp watermarks at the skirting, single yellow ceiling neon bulb just out of frame casting top-down light, deep blue ambient shadow in corridor depth, weary patient expression slight downward mouth corners, hard ink outline, cell-shaded coloring, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Сумма по договору сто сорок две тысячи рублей, на пятнадцать тысяч ниже рыночной$pp$), 'MS', 'eye', 'static', 'opening_image', 'character', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH04', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, close-up of {HEROINE_ELENA_AGE_44}, three-quarter view, eyes slightly closed mid-exhale lips parted releasing breath, faint twitch at left eyelid, weary patient expression, small dark mole visible on left jawline below ear, mousy ash-brown hair shoulder-length parted in centre slight grey at temples, yellow neon bulb above casting warm top-down rim light on hair and shoulder, cool blue-grey ambient shadow on in-shadow side, hard ink outline jaw nose bridge hair strands, cell-shaded skin two-tone, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Тебе нужны деньги сегодня к обеду, иначе ты не успеешь на закупку$pp$), 'CU', 'eye', 'static', 'opening_image', 'character', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH05', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, back of {HEROINE_ELENA_AGE_44} descending stairs of Soviet panel-building stairwell mid-step, dark navy blazer back ash-brown hair shoulder-length brushing collar, right arm holding painted iron stairwell railing left arm holding yellow plastic folder tight against ribs, neon yellow stairwell bulb visible above casting top-down light on shoulders, cool blue-grey shadows in lower steps beige tile floor, camera tracks laterally at eye level following descent slight motion blur on background only, hard ink outline on silhouette cell-shaded back of blazer with fold lines, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Ты уже всё проверила, доверенность от матери, паспорт, выписка из реестра$pp$), 'BACK', 'eye', 'track_lateral', 'opening_image', 'character', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH06', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, extreme close-up from low angle of single dark brown leather winter boot stepping down onto worn concrete stairwell step, boot's heel just touching rough concrete treads of sole visible, thin crack in shape of number seven running across step under heel, dark navy trouser leg above boot disappearing out of frame, soft yellow neon spilling from above casting warm pool of light, cool blue shadow under step overhang, hard ink outline on boot edge crack and step contour, cell-shaded leather two tones, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Доверенность ты оформила два года назад, мать тогда подписала, не читая$pp$), 'ECU', 'low', 'static', 'opening_image', 'atmosphere', NULL, TRUE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH07', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, medium shot of {HEROINE_ELENA_AGE_44} walking down stairs between 4th and 3rd floors of Soviet panel-building stairwell, dark navy blazer yellow folder tucked under left arm, painted-cream walls with patches of dark damp watermark a faded biro graffiti reading МАША + ИГОРЬ in cyrillic on wall behind her, single yellow neon bulb above casting top-down rim light cool blue-grey wash on far walls, camera tracks laterally at eye level following movement, hard ink outline on silhouette and cyrillic graffiti cell-shaded coloring, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Нотариус ждёт тебя через сорок минут на Ленинской, тридцать восемь$pp$), 'MS', 'eye', 'track_lateral', 'opening_image', 'character', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH08', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, close-up of {HEROINE_ELENA_AGE_44} mid-step on panel-building stairwell between 3rd and 2nd floors, face in half-shadow side-rim light from yellow neon bulb just off-frame to left, lit side warm sodium yellow shadowed side cool blue-grey, small mole on left jawline catching warm rim, ash-brown hair partially backlit by bulb above, weary patient expression mouth set firm, hard ink outline on jaw nose bridge hair contour, cell-shaded skin two-tone with subtle cross-hatching in shadow half, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Лестничная клетка пахнет жареной картошкой из двадцать четвёртой квартиры$pp$), 'CU', 'eye', 'static', 'opening_image', 'atmosphere', 'heroine_elena', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH09', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, POV shot looking straight down a Soviet panel-building stairwell spiral, multiple flights of stairs descending in receding perspective railings curving down and away, at bottom of well a glimpse of ground-floor entrance lit by cool grey daylight from front door, yellow neon bulb at each landing creating warm pools of light on descent, cool blue-grey shadows in recesses vertigo composition, hard ink outline on every railing edge and step edge cell-shaded with strong tonal separation, camera POV pushes in slowly, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$На повороте между третьим и вторым снизу хлопает входная дверь подъезда$pp$), 'POV', 'eye', 'push_in', 'opening_image', 'atmosphere', NULL, TRUE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH10', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, wide shot from high angle looking down stairwell from landing, {DAUGHTER_YOUNGER_AGE_13} ascending stairs from floor below toward camera, wears dark school winter coat over navy uniform grey school backpack on shoulders, face tilted slightly up toward where mother is freckles visible on bridge of nose, the heroine silhouette barely visible at edge of frame in foreground out of focus, yellow neon stairwell bulb above casting warm top-down light on daughter head and shoulders cool blue-grey wash on stairs descending, hard ink outline on daughter silhouette and railing cell-shaded coloring, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Это твоя младшая, сегодня в школе была короткая шестая, ты забыла$pp$), 'WS', 'high', 'static', 'opening_image', 'plot', 'daughter_younger', FALSE, FALSE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH11', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, extreme close-up of {DAUGHTER_YOUNGER_AGE_13} face eyes wide and locked on something just off-frame, freckles scattered across bridge of nose and cheekbones pale grey-blue eyes the same shade as mother, short ash-brown hair with fringe across forehead slightly damp from melted snow, in bottom-left corner of frame a sliver of bright yellow plastic folder just visible (her sight-line falls on it), yellow neon stairwell bulb out of frame casting warm side-light from right cool blue-grey shadow on left half of face, hard ink outline on eyes eyelashes nose bridge cell-shaded skin two-tone freckles as small ink dots, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Она поднимается тебе навстречу, жёлтая папка под твоим локтем повёрнута к ней$pp$), 'ECU', 'eye', 'static', 'opening_image', 'iconic', 'daughter_younger', FALSE, TRUE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW()),
(gen_random_uuid()::text, v_proj, v_co, 'C_SH12', jsonb_build_object('positivePrompt', $pp${STYLE}, {PALETTE_COLD_OPEN}, medium shot looking past heroine right shoulder from behind toward daughter on lower step, in foreground only back-of-head silhouette of {HEROINE_ELENA_AGE_44} — ash-brown shoulder-length hair dark navy blazer shoulder yellow folder corner tucked tight under left arm — face NOT visible, on lower step {DAUGHTER_YOUNGER_AGE_13} facing camera head tilted slightly up freckles on bridge of nose visible pale grey-blue eyes locked on mother face off-frame, two concrete steps between them neither moving, single yellow neon bulb on ceiling above flickers visibly, warm top-down rim on daughter hair cool blue-grey shadow on heroine back, hard ink outline cell-shaded two-tone, camera MS eye level slowly pulling out, 16:9$pp$, 'negativeRef', '{NEG}', 'narrationRu', $pp$Эта папка здесь не случайно, до неё была одна белая баночка магния в две тысячи восьмом$pp$), 'MS', 'eye', 'pull_out', 'opening_image', 'iconic', 'daughter_younger', FALSE, TRUE, 'march_afternoon_2024', 'COLD_OPEN_stairwell', NOW(), NOW());

END $$;

COMMIT;

-- ============================================================================
-- NEXT STEPS:
-- 1. Run this file: psql -h localhost -U gen_studio -d gen_studio -f seed_bio_plus.sql
-- 2. Append remaining 188 shots from:
--    - seed_bio_plus_shots_a1.sql  (22 shots — A1 Истоки)
--    - seed_bio_plus_shots_a2.sql  (28 shots — A2 Вход)
--    - seed_bio_plus_shots_a3.sql  (30 shots — A3 Подъём)
--    - seed_bio_plus_shots_a4.sql  (28 shots — A4 Сектантское ускорение)
--    - seed_bio_plus_shots_a5.sql  (25 shots — A5 Точка невозврата)
--    - seed_bio_plus_shots_a6.sql  (20 shots — A6 Катастрофа)
--    - seed_bio_plus_shots_a7.sql  (25 shots — A7 Послесловие)
--    - seed_bio_plus_shots_coda.sql (10 shots — Coda)
-- 3. Run scripts/resolve_bio_plus_placeholders.sql to substitute {TOKEN} → full identity blocks
-- 4. Run consistency audit per PROJECT_CREATION_GUIDE §12
-- ============================================================================
