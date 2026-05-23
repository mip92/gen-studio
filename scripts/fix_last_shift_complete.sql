-- Comprehensive fix for last_shift after initial seed:
-- 1. Upgrade CONDUCTOR_BASE dataset prompts to FATHER_BASE quality level
-- 2. Restructure all 200 shots promptFields to match night_courier UI schema
--    (positive / negative / lightingMood / narrativeBeat / storyFunction / camera / location / production)
-- 3. Lift narration out of promptFields jsonb into Shot.narrationText column
-- 4. Set Shot.referenceProfileId (profileCode string) per vignetteSlug
-- 5. Set Shot.workflowRouteKey per character-presence
-- 6. Set Shot.referenceImagePool (canonical paths — files to be created by user)
-- 7. Register 4 workflow templates + 3 routes for last_shift (mirror night_courier)
-- 8. Create shot_participants for all character-bearing shots
-- 9. Fill Project.scriptText with full logline + 8-act synopsis + char bios
-- 10. Fill Scene.narrationText with per-act voiceover summary

BEGIN;

-- ============================================================================
-- 1. CONDUCTOR_BASE dataset prompts (identity-lock + variety, FATHER_BASE-level)
-- ============================================================================

UPDATE character_profiles AS cp
SET
  "ageLabel"      = '38-42',
  "targetImages"  = 40,
  "triggerToken"  = 'CONDUCTOR_BASE',
  "promptBase"    = $pb$portrait photo of CONDUCTOR_BASE, female train conductor 38 to 42 years old, dark blonde hair in low neat bun under navy peaked cap, grey-green tired eyes, thin scar above left eyebrow, natural skin pores, no makeup, dark navy double-breasted uniform jacket with single shoulder stripe and brass buttons, white shirt collar, navy trousers, grey fingerless wool gloves, realistic photo, documentary style, photorealistic, 35mm full-frame$pb$,
  "promptAngles"  = $pa$extreme close-up face front, eye level, neutral white wall background, natural skin pores, no expression, 100mm portrait lens
close-up portrait three-quarter left, neutral white wall background, soft documentary light, 85mm
close-up portrait three-quarter right, neutral white wall background, soft documentary light, 85mm
close-up strict left profile, jawline clear, neutral white wall background, 100mm
close-up strict right profile, jawline clear, neutral white wall background, 100mm
close-up slight dutch tilt three-quarter, neutral white wall background, 85mm
medium close-up chest-up front, hands at jacket lapel, neutral white wall background, 85mm
medium close-up chest-up three-quarter left, hands clasped in front, neutral white wall background, 50mm
medium close-up chest-up three-quarter right, faint tired smile, neutral white wall background, 50mm
medium shot waist-up front, hands at sides, neutral white wall background, 35mm
medium shot waist-up three-quarter left, arms loosely crossed over jacket, neutral white wall background, 35mm
medium shot waist-up three-quarter right, one hand resting on jacket pocket, neutral white wall background, 35mm
medium shot waist-up strict left profile, calm posture, neutral white wall background, 50mm
medium shot waist-up strict right profile, calm posture, neutral white wall background, 50mm
medium shot from behind head turned slightly over right shoulder, low bun and cap visible, neutral white wall background, 50mm
medium shot from behind head turned slightly over left shoulder, neutral white wall background, 50mm
full body front, standing straight hands at sides, full uniform visible, neutral white wall background, 35mm
full body three-quarter left, weight on one leg, hand resting in jacket pocket, neutral white wall background, 35mm
full body three-quarter right, head slightly turned looking off frame, neutral white wall background, 35mm
full body strict left profile, neutral white wall background, 35mm
full body strict right profile, neutral white wall background, 35mm
full body strict back view, cap and bun and shoulder stripe clearly visible, neutral white wall background, 35mm
full body three-quarter back, head turned over shoulder, neutral white wall background, 35mm
low-angle full body front, looking off frame ahead, neutral white wall background, 24mm
low-angle medium shot front, looking down toward lens, dignified posture, neutral white wall background, 35mm
high-angle full body, head slightly bowed, neutral white wall background, 35mm
high-angle close-up portrait, eyes closed for a beat of rest, neutral white wall background, 85mm
sitting on a simple bench three-quarter left, hands on knees, head turned to camera, neutral white wall background, 35mm
sitting on a simple bench strict side, looking ahead off-frame, neutral white wall background, 50mm
extreme close-up of gloved hands holding a brass ticket punch, neutral white wall background, 100mm macro
extreme close-up of gloved hand holding a vintage metal tea glass holder, neutral white wall background, 100mm macro
extreme close-up of vintage analog watch on her wrist, neutral white wall background, 100mm macro
extreme close-up of fingers adjusting cap brim, neutral white wall background, 100mm macro$pa$,
  "promptVariety" = $pv$Full body three-quarter back walking down train corridor at night, warm tungsten amber lamps in perspective behind, hand brushing each compartment door, dark navy uniform, photorealistic documentary.
Full body strict left profile walking down train corridor in cold morning light, windows showing fields strobing past, calm composed posture.
Medium shot front standing in train corridor under flickering lamp, dark emerald compartment curtain shadows, slight worry behind professional composure.
Medium close-up three-quarter left walking corridor at dusk, hand brushing wall, soft tungsten amber light from above.
Strict back full body in train vestibule looking out open window, cold wind moving stray hairs, breath visible in cool air.
Medium shot front in vestibule standing beside red emergency brake handle, single sickly yellow emergency light overhead, jaw tight.
Extreme close-up of gloved hand resting near the red brake handle, intact wire seal visible, dim emergency light.
Full body three-quarter back in train vestibule doorway facing brightening dawn outside, pink dawn sky.
Sitting alone in narrow conductor crew compartment, holding a small folded white envelope in her lap, head bowed, warm reading lamp.
Medium shot front in crew compartment, slowly removing peaked cap, dark blonde hair coming loose from low bun, exhausted.
Medium close-up profile in crew compartment by window at twilight, hand at chest where a thin chain hangs hidden under shirt.
Extreme close-up of hand pulling a thin gold chain over her head, a simple worn wedding band threaded on it, 100mm macro.
Full body standing on autumn dusk train platform checking ticket in gloved hand, sodium lamp glow, cool breath visible.
Medium shot front at carriage door punching a ticket with brass ticket punch, evening sodium platform light.
Full body three-quarter left walking along empty train platform at dawn, low fog rolling across rails, calm posture.
Medium close-up front holding a tea glass in vintage metal holder at a compartment threshold, amber corridor light.
Over-the-shoulder shot looking into a compartment doorway, watching a passenger silhouette inside, amber light spilling out.
Medium shot three-quarter right leaning lightly on a wood-paneled wall in the train corridor, faint tired smile.
Full body sitting on a folded compartment seat in the dim train corridor, head bowed, gloved hands clasped.
Strict side close-up profile against amber corridor lamp glow, dignity in stillness.
Three-quarter back medium in vestibule looking at night fields rushing past through open doorway, soft moonlight.
Medium shot strict right profile by a train window in cold daylight, birch trees strobing past in background, faint smile.
Close-up three-quarter right portrait, micro-expression of recognition crossing her face, hand involuntarily rising to chest near hidden chain, late warm afternoon light.
Close-up front portrait at moment of decision, jaw set, eyes resolved, dim emerald train interior shadow, harsh side light.
Medium shot front carrying a wrapped child in her arms through dim corridor, blanket trailing, watchful protective eyes.
Full body three-quarter back stepping down train carriage steps into pink morning fog, white shirt only no jacket no cap, hair down loose.
Full body strict back walking away into a snow-covered field at dawn, white shirt only, figure softening into pink fog.
Medium shot front in plain white shirt and trousers, dark blonde hair down loose, calm without uniform, soft morning fog light, first peace.
Three-quarter left full body in crew compartment folding navy uniform jacket and cap neatly on a seat, gentle deliberate motion.
Strict side close-up in crew compartment placing a folded white envelope on top of the folded uniform jacket, deliberate.
Medium close-up three-quarter back in train corridor, head turned to glance at a compartment as she passes.
Full body strict side in train corridor low light, holding a small folding stool to place for a passenger in vestibule, gentle expression.
Three-quarter left medium shot leaning against vestibule frame, eyes closed for a beat listening, faint smile, golden afternoon light from open window.
Sitting on a low step inside a train carriage interior, head bowed slightly, gloved hands resting on knees.
Medium close-up front looking down at a child-sized punched ticket in her hand, soft recognition in her face.
Three-quarter left full body in train corridor catching a still moment, both hands in jacket pockets, fatigue visible.
Close-up slight dutch tilt in dim dark emerald train corridor, internal pressure resolving into resolve in her eyes.
Full body low-angle in train corridor looking ahead and up, decisive posture, no longer subordinate.
Extreme close-up of her gloved hand tightening on a vestibule handrail, knuckles whitening, 100mm.
Three-quarter back chest-up at open doorway of stopped train, watching an ambulance approach across snow, dawn pink sky.
Strict side medium in pink morning fog on deserted train platform, looking back once toward the train, soft acknowledgment.
Full body strict back walking away into a featureless misty field at dawn, no destination visible, ethereal soft pink light.$pv$,
  "negative"      = $nb$different identity, older woman 60 plus, very young woman 20s, child face, man, beard, masculine features, glamour photography, heavy makeup, lipstick, mascara, eye shadow, jewelry on hands, large earrings, dangling earrings, necklace visible over shirt, cartoon, anime, cgi, 3d render, plastic skin, oversmooth skin, watermark, text, signature, low quality, blur, motion blur, modern brand logos, real-world train logos, readable text on uniform, station name signs with readable text, weapon, blood, wound, revealing clothing, tight outfit, high heels, short skirt, dress, bare shoulders, bare arms, off-shoulder, deformed hands, extra fingers, missing fingers, duplicate face, two heads, helmet, motorcycle, bicycle$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id
  AND c."projectId"   = p.id
  AND p.slug          = 'last_shift'
  AND cp."profileCode" = 'CONDUCTOR_BASE';

-- ============================================================================
-- 2. Project.scriptText (full screenplay doc in DB so UI shows it)
-- ============================================================================

UPDATE projects SET "scriptText" = $script$# Последний рейс — авторский короткий метр

## Логлайн
Безымянная проводница в свой последний рейс наблюдает 8 пассажиров — каждый
оказывается фрагментом её несбывшейся жизни. Ночью второго дня у одинокой
девочки поднимается температура между станциями. Проводница нажимает
стоп-кран — спасает девочку, теряет работу, выходит из поезда в туманное поле
и впервые за много лет — на свободу.

## Жанр и платформа
Тихая драма с депрессивной атмосферой и катартической развязкой. YouTube long
form, advertiser-safe. ~17 минут (200 шотов × 5 секунд).

## Героиня
**Проводница** (безымянная, ~38-42). LoRA `CONDUCTOR_BASE`.
- Тёмные блондинистые волосы в низком пучке, тонкий шрам над левой бровью.
- Тёмно-синий китель с одной нашивкой на плече, белый воротник, кепка.
- Под кителем — обручальное кольцо на цепочке. Reveal в A6.
- В нагрудном кармане — заявление об уходе. Catalyst в A1.

## 8 пассажиров (без LoRA, через IP-Adapter FaceID)
1. **Военный** (30) — молчание = зеркало проводницы. A2.
2. **Мать с младенцем** (25) — то, кем проводница не стала. A3.
3. **Невеста, едет одна** (24) — проводница в молодости. A3.
4. **Бизнесмен с ноутбуком** (45) — comic relief. A4.
5. **Дед-фронтовик** (80+) — образ отца. A5.
6. **Пара после ссоры** (33+32) — бывший брак проводницы. A5.
7. **Музыкант с гитарой** (22) — iconic frame акта 6. A6.
8. **Девочка с плюшевой совой** (7) — спина сюжета, плот-разворот. A1/A6/A7/A8.

## Структура — 8 актов, бит-лист Snyder/Freytag

### A1 — Boarding (Setup + Catalyst) — 22 шота
Sodium-закат на безымянном перроне. Проводница принимает билеты, посадка
всех 8 пассажиров. В кармане — заявление об уходе (плот-крючок). Поезд
трогается. VO: «Двенадцать лет я считаю чужие билеты. Сегодня — последний рейс.»

### A2 — Settling (Rising A) — 22 шота
Первая ночь. Виньетка военного. Молчаливая дань уважения между ним и
проводницей: оба знают, что значит молчать.

### A3 — Deep Night (Rising B) — 25 шотов
Виньетки матери с младенцем и невесты. Проводница помогает не словами.
Невеста под висящим платьем — самая одинокая фигура в кадре фильма.

### A4 — Pre-dawn (Rising C) — 18 шотов
Бизнесмен бьётся об отсутствие сети. Сдаётся, берёт книгу попутчика, начинает
читать. Comic relief после двух виньеток горя. Рассвет на железнодорожном мосту.

### A5 — Daylight (Rising D) — 30 шотов
Виньетки деда-фронтовика и пары после ссоры. Дед делится домашним пирогом —
проводница впервые за смену искренне улыбается. Пара мирится через прикосновение
на закрытой книге.

### A6 — Midpoint Twist — 18 шотов
Виньетка музыканта в тамбуре (iconic frame). После — проводница замечает у
девочки ту же плюшевую сову, что была у её дочери. Reveal: кольцо на цепочке
под кителем. Сюжетный поворот.

### A7 — Crisis (Climax) — 35 шотов
Вторая ночь, снежный заряд. У девочки жар. Поезд между станциями. Проводница
рвёт пломбу стоп-крана. Все 7 пассажиров просыпаются — нарезка CU. Поезд
тормозит в снежном поле. VO: «За двенадцать лет я ни разу не нарушила правил.
Один раз — стоит того.»

### A8 — Resolution (Final Image) — 30 шотов
Рассвет. Скорая забирает девочку живой. Проводница оставляет на сиденье китель,
конверт, кольцо. Выходит в туман, идёт в поле. Поезд трогается без неё. Новая
проводница в коридоре — моложе, не уставшая. Купе девочки пустое. Final image:
новая проводница машинально касается груди, где когда-нибудь повиснет её
собственная цепочка. Cut to black. VO: «Двенадцать лет — это очень долго. И
очень коротко. / Поезд идёт. Всегда идёт. Просто на следующем рейсе — буду
уже не я.»

## Правила атмосферы
- 8 палитр (по одной на акт)
- 8 типов плана в ротации, никогда 2 одинаковых подряд
- 19% B-roll без людей
- VO только в 4 шотах суммарно
- Безымянные локации (без табличек городов), безымянная героиня
- YouTube-safe: никаких self-harm, графических травм, реальных брендов

## Технический пайплайн
- LoRA `CONDUCTOR_BASE` — обучается на 40 кадрах датасета (см. promptBase /
  promptAngles / promptVariety в CharacterProfile)
- 8 пассажиров — без LoRA, IP-Adapter FaceID v2 от одного reference-портрета
  на пассажира (генерируется один раз на Flux)
- Workflow routes: 3 варианта (см. workflow_routes таблицу)

## See also
- `data/last_shift/PROJECT.md` — полная спека проекта
- `data/last_shift/SHOTLIST.md` — все 200 шотов с paste-ready промптами
$script$
WHERE slug = 'last_shift';

-- ============================================================================
-- 3. Scene.narrationText (per-act voiceover summary, RU)
-- ============================================================================

UPDATE scenes SET "narrationText" = $vo$Sodium-закат, безымянный перрон. Проводница принимает билеты у 8 пассажиров. В нагрудном кармане — заявление об уходе. Поезд трогается. «Двенадцать лет я считаю чужие билеты. Сегодня — последний рейс.»$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_01_boarding';
UPDATE scenes SET "narrationText" = $vo$Первая ночь. Военный смотрит в окно. Молчаливая дань уважения между ним и проводницей: оба знают, что значит молчать. Без VO — только колёса и амбер ламп коридора.$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_02_settling';
UPDATE scenes SET "narrationText" = $vo$Глухая ночь. Мать укачивает младенца в коридоре. Невеста плачет под висящим платьем. Проводница помогает не словами — приносит стул, не открывает дверь. Без VO.$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_03_deep_night';
UPDATE scenes SET "narrationText" = $vo$Предрассветный час. Бизнесмен бьётся об отсутствие сети, сдаётся, начинает читать книгу попутчика. Comic relief. Рассвет встречается на железнодорожном мосту. Без VO.$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_04_pre_dawn';
UPDATE scenes SET "narrationText" = $vo$День в пути через берёзовый лес. Дед-фронтовик делится домашним пирогом — проводница впервые улыбается. Пара после ссоры мирится через прикосновение на закрытой книге. Без VO.$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_05_daylight';
UPDATE scenes SET "narrationText" = $vo$Поздний золотой день. Музыкант играет в тамбуре. Проводница замечает у девочки ту же плюшевую сову, что была у её дочери. Reveal: обручальное кольцо на цепочке под кителем. Midpoint turn. Без VO.$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_06_midpoint';
UPDATE scenes SET "narrationText" = $vo$Вторая ночь, снежный заряд. У девочки жар между станциями. Проводница рвёт пломбу стоп-крана. Все 7 пассажиров просыпаются. Поезд тормозит в снежном поле. «За двенадцать лет я ни разу не нарушила правил. Один раз — стоит того.»$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_07_crisis';
UPDATE scenes SET "narrationText" = $vo$Рассвет, туман. Скорая забирает девочку живой. Проводница оставляет китель, конверт, кольцо. Уходит в туман. Поезд трогается без неё. Loop closes. «Двенадцать лет — это очень долго. И очень коротко. / Поезд идёт. Всегда идёт. Просто на следующем рейсе — буду уже не я.»$vo$ WHERE "projectId" = (SELECT id FROM projects WHERE slug='last_shift') AND "sceneKey" = 'act_08_resolution';

-- ============================================================================
-- 4. Workflow templates (mirror night_courier — paths point to existing JSONs)
-- ============================================================================

DO $$
DECLARE
  v_proj    TEXT;
  v_t_env   TEXT := gen_random_uuid()::text;
  v_t_char  TEXT := gen_random_uuid()::text;
  v_t_chrhr TEXT := gen_random_uuid()::text;
  v_t_ipad  TEXT := gen_random_uuid()::text;
  v_t_video TEXT := gen_random_uuid()::text;
  v_r_solo  TEXT := gen_random_uuid()::text;
  v_r_pax   TEXT := gen_random_uuid()::text;
  v_r_env   TEXT := gen_random_uuid()::text;
BEGIN
  SELECT id INTO v_proj FROM projects WHERE slug = 'last_shift';

  -- 5 templates
  INSERT INTO workflow_templates (id, "projectId", "templateKey", "filePath", description, "createdAt") VALUES
    (v_t_env,   v_proj, 'env_flux',         'last_shift/comfy/scene_environment_flux_api.json',     'Flux env / B-roll generation (no LoRA, no IP-Adapter)',       NOW()),
    (v_t_char,  v_proj, 'char_lora_sdxl',   'last_shift/comfy/scene_single_character_api.json',     'SDXL + CONDUCTOR_BASE LoRA single-pass for conductor shots',  NOW()),
    (v_t_chrhr, v_proj, 'char_lora_hires',  'last_shift/comfy/scene_single_character_hires_api.json','SDXL hires variant (avoid for LoRA chars — see feedback)',   NOW()),
    (v_t_ipad,  v_proj, 'char_ipadapter',   'last_shift/comfy/scene_single_character_ipadapter_api.json','SDXL + IP-Adapter FaceID for passenger shots',           NOW()),
    (v_t_video, v_proj, 'video_wan22',      'last_shift/comfy/video_wan22_i2v_api.json',            'Wan2.2 image-to-video, 5 seconds',                             NOW());

  -- 3 routes
  INSERT INTO workflow_routes (id, "projectId", "routeKey", "createdAt") VALUES
    (v_r_solo, v_proj, 'conductor_solo',  NOW()),
    (v_r_pax,  v_proj, 'passenger_ip',    NOW()),
    (v_r_env,  v_proj, 'environment',     NOW());

  -- Route steps
  INSERT INTO workflow_route_steps (id, "workflowRouteId", "stepOrder", "workflowTemplateId") VALUES
    (gen_random_uuid()::text, v_r_solo, 0, v_t_char),
    (gen_random_uuid()::text, v_r_pax,  0, v_t_ipad),
    (gen_random_uuid()::text, v_r_env,  0, v_t_env);
END $$;

-- ============================================================================
-- 5. Bulk-update shots: restructure promptFields + assign route + reference profile + ref images + lift narration
-- ============================================================================

-- Lift narrationRu from JSONB to dedicated column (only where set)
UPDATE shots
SET "narrationText" = "promptFields"->>'narrationRu'
WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'last_shift')
  AND "promptFields" ? 'narrationRu';

-- Universal negative block (resolves {NEG} placeholder)
-- and rebuild promptFields with night_courier-compatible schema.
UPDATE shots sh
SET "promptFields" = jsonb_build_object(
    'positive',     COALESCE(sh."promptFields"->>'positivePrompt', ''),
    'negative',     'different identity, deformed face, deformed hands, extra fingers, missing fingers, watermark, signature, text overlay, station name signs with readable text, modern brand logos, low quality, blur, motion blur, plastic skin, oversmooth, cartoon, anime, cgi, duplicate face, two heads, weapon, blood, wound, revealing clothing',
    'positiveSdxl', COALESCE(sh."promptFields"->>'positivePrompt', ''),
    'lightingMood', CASE sh."paletteKey"
        WHEN 'A1_sodium'        THEN 'sodium vapor platform lamps, cool autumn dusk sky, golden hour fading, warm-cool contrast'
        WHEN 'A2_amber_indigo'  THEN 'warm tungsten corridor lamps, deep indigo night windows, soft falloff, sleep silence'
        WHEN 'A3_amber_indigo'  THEN 'late night dim amber, indigo black windows, single reading lamp pools of light'
        WHEN 'A4_cool_blue'     THEN 'pre-dawn cool blue starting to warm, weary tungsten, first hint of sky'
        WHEN 'A5_cold_birch'    THEN 'cold daylight through window, intermittent strobing birch shadows, high key overcast'
        WHEN 'A6_golden_warm'   THEN 'late afternoon golden warmth slanting through window, long corridor shadows'
        WHEN 'A7_dark_emerald'  THEN 'dark emerald compartment shadows, snow blizzard outside, harsh emergency yellow flashlight'
        WHEN 'A8_pink_fog'      THEN 'milky pink dawn fog, soft diffused omnidirectional light, no harsh shadows, ethereal'
        ELSE                         'natural cinematic light'
      END,
    'narrativeBeat', COALESCE(sh."storyBeat", ''),
    'storyFunction', COALESCE(sh."narrativeFunction", ''),
    'camera',        jsonb_build_object(
                       'framing',    COALESCE(sh."shotType",  ''),
                       'angle',      COALESCE(sh."cameraAngle", 'eye'),
                       'movement',   COALESCE(sh."cameraMove",  'static')
                     ),
    'location',      jsonb_build_object(
                       'label',            CASE WHEN sh."isBroll" THEN 'Поезд / экстерьер или объект' ELSE 'Поезд / интерьер' END,
                       'interiorExterior', CASE WHEN sh."shotType" IN ('EWS') OR sh."paletteKey" LIKE '%fog' THEN 'exterior_or_mixed' ELSE 'interior' END,
                       'palette',          sh."paletteKey",
                       'timeOfDay',        sh."timeOfDay"
                     ),
    'continuity',    jsonb_build_object(
                       'withPrevious', 'Match palette, wardrobe, fatigue level with previous shot',
                       'withNext',     'Pass key props (cap, gloves, chain, envelope) to next shot'
                     ),
    'production',    jsonb_build_object(
                       'promptStatus', 'draft',
                       'notes',        '',
                       'assetRefs',    '[]'::jsonb
                     ),
    'workflowParams', jsonb_build_object(
                       'seedPolicy', 'base seed per scene + offset by shot number',
                       'ipAdapterRef', CASE sh."vignetteSlug"
                          WHEN 'military'     THEN 'last_shift/reference/passengers/passenger_01_military.png'
                          WHEN 'mother_baby'  THEN 'last_shift/reference/passengers/passenger_02_mother_baby.png'
                          WHEN 'bride'        THEN 'last_shift/reference/passengers/passenger_03_bride.png'
                          WHEN 'businessman'  THEN 'last_shift/reference/passengers/passenger_04_businessman.png'
                          WHEN 'veteran'      THEN 'last_shift/reference/passengers/passenger_05_veteran.png'
                          WHEN 'couple_fight' THEN 'last_shift/reference/passengers/passenger_06a_couple_man.png'
                          WHEN 'musician'     THEN 'last_shift/reference/passengers/passenger_07_musician.png'
                          WHEN 'child_girl'   THEN 'last_shift/reference/passengers/passenger_08_child_girl.png'
                          ELSE NULL
                       END
                     ),
    'isBroll',       sh."isBroll",
    'isIconic',      sh."isIconic",
    'frameDescription', COALESCE(sh."promptFields"->>'positivePrompt', '')
  ),
  "referenceProfileId" = CASE sh."vignetteSlug"
        WHEN 'conductor'    THEN 'CONDUCTOR_BASE'
        WHEN 'military'     THEN 'PAX_MIL'
        WHEN 'mother_baby'  THEN 'PAX_MOM'
        WHEN 'bride'        THEN 'PAX_BRIDE'
        WHEN 'businessman'  THEN 'PAX_BIZ'
        WHEN 'veteran'      THEN 'PAX_VET'
        WHEN 'couple_fight' THEN 'PAX_HE'
        WHEN 'musician'     THEN 'PAX_MUS'
        WHEN 'child_girl'   THEN 'PAX_GIRL'
        ELSE NULL
      END,
  "workflowRouteKey" = CASE
        WHEN sh."vignetteSlug" = 'conductor'  THEN 'conductor_solo'
        WHEN sh."vignetteSlug" IS NOT NULL    THEN 'passenger_ip'
        ELSE                                       'environment'
      END,
  "referenceImagePool" = CASE sh."vignetteSlug"
        WHEN 'conductor'    THEN '["last_shift/reference/conductor_dataset/conductor_front.jpg", "last_shift/reference/conductor_dataset/conductor_34_left.jpg", "last_shift/reference/conductor_dataset/conductor_34_right.jpg", "last_shift/reference/conductor_dataset/conductor_profile_left.jpg", "last_shift/reference/conductor_dataset/conductor_profile_right.jpg"]'::jsonb
        WHEN 'military'     THEN '["last_shift/reference/passengers/passenger_01_military.png"]'::jsonb
        WHEN 'mother_baby'  THEN '["last_shift/reference/passengers/passenger_02_mother_baby.png"]'::jsonb
        WHEN 'bride'        THEN '["last_shift/reference/passengers/passenger_03_bride.png"]'::jsonb
        WHEN 'businessman'  THEN '["last_shift/reference/passengers/passenger_04_businessman.png"]'::jsonb
        WHEN 'veteran'      THEN '["last_shift/reference/passengers/passenger_05_veteran.png"]'::jsonb
        WHEN 'couple_fight' THEN '["last_shift/reference/passengers/passenger_06a_couple_man.png", "last_shift/reference/passengers/passenger_06b_couple_woman.png"]'::jsonb
        WHEN 'musician'     THEN '["last_shift/reference/passengers/passenger_07_musician.png"]'::jsonb
        WHEN 'child_girl'   THEN '["last_shift/reference/passengers/passenger_08_child_girl.png"]'::jsonb
        ELSE NULL
      END
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift');

-- ============================================================================
-- 6. shot_participants: link every character-bearing shot to its profile
-- ============================================================================

INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT
  gen_random_uuid()::text,
  sh.id,
  c.id,
  cp.id,
  CASE sh."vignetteSlug"
    WHEN 'conductor'    THEN 'Conductor'
    WHEN 'military'     THEN 'Military'
    WHEN 'mother_baby'  THEN 'Mother'
    WHEN 'bride'        THEN 'Bride'
    WHEN 'businessman'  THEN 'Businessman'
    WHEN 'veteran'      THEN 'Veteran'
    WHEN 'couple_fight' THEN 'Couple (man primary)'
    WHEN 'musician'     THEN 'Musician'
    WHEN 'child_girl'   THEN 'Child'
  END
FROM shots sh
JOIN character_profiles cp ON cp."profileCode" = sh."referenceProfileId"
JOIN characters c          ON cp."characterId" = c.id
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift')
  AND sh."vignetteSlug" IS NOT NULL
  AND c."projectId"    = (SELECT id FROM projects WHERE slug = 'last_shift');

-- For couple_fight shots, add the second participant (PAX_SHE) as well
INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT
  gen_random_uuid()::text,
  sh.id,
  c.id,
  cp.id,
  'Couple (woman)'
FROM shots sh
JOIN character_profiles cp ON cp."profileCode" = 'PAX_SHE'
JOIN characters c          ON cp."characterId" = c.id
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift')
  AND sh."vignetteSlug" = 'couple_fight'
  AND c."projectId"    = (SELECT id FROM projects WHERE slug = 'last_shift');

-- For conductor-vignette shots that also feature a passenger in frame (OTS over
-- conductor shoulder watching a passenger), we don't auto-add — the OTS shot's
-- focus stays on the conductor. User can edit shot_participants if needed.

COMMIT;
