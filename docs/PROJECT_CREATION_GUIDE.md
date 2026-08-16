# gen-studio · Гайд по созданию нового проекта

Этот документ — операционная инструкция по постановке нового кино-проекта
в `gen-studio`, основанная на всём что мы выучили на `night_courier` и
`last_shift`. Цель: чтобы следующий проект собирался по шагам без
переоткрытия всего пайплайна.

> **Aудитория:** ты (пользователь) + Claude. Документ описывает и решения
> (что выбирать), и техническую часть (что куда писать).

---

## Оглавление

1. [Концепт-фаза — что решаем до БД](#1-концепт-фаза)
2. [Схема БД и обязательные поля](#2-схема-бд-и-обязательные-поля)
3. [Структура `Shot.promptFields` (JSONB)](#3-структура-shotpromptfields)
4. [Character profiles — датасет-промпты для LoRA](#4-character-profiles--датасет-промпты-для-lora)
5. [Workflow routes — связка шот ↔ ComfyUI JSON](#5-workflow-routes)
6. [Файловая структура проекта](#6-файловая-структура-проекта)
7. [Seed-скрипт — первичная заливка](#7-seed-скрипт)
8. [API-эндпоинты — правки после seed](#8-api-эндпоинты)
9. [Правила сторителлинга (уроки night_courier)](#9-правила-сторителлинга)
10. [Hard rules из feedback memory](#10-hard-rules)
11. [Nano Banana — генерация референсных портретов](#11-nano-banana-промпты)
12. [Consistency-аудит — что проверять перед рендером](#12-consistency-аудит)
13. [Pipeline-порядок — от концепта до финального mp4](#13-pipeline-порядок)
14. [Чеклист «новый проект за один день»](#14-чеклист)

---

## 1. Концепт-фаза

До любого кода нужно решить:

| Решение | Пример (last_shift) |
|---|---|
| **Logline** (1 предложение) | «Безымянная проводница в последний рейс встречает 8 пассажиров — каждый зеркало её несбывшейся жизни. Ночью второго дня она тянет стоп-кран ради больной девочки» |
| **Жанр** | тихая драма, депрессивная атмосфера, катартическая развязка |
| **Платформа** | `youtube` long-form |
| **Safety tier** | `advertiser_safe` (без self-harm, без брендов, без графических травм) |
| **Длина** | ~17 минут (200 шотов × 5 сек) |
| **Структура** | 8 актов (Freytag + Snyder beats) — НЕ 5: слишком крупные блоки |
| **Главные персонажи** | 1 LoRA-героиня + 8-9 пассажиров (LoRA или IP-Adapter — см. §5) |
| **Палитра** | 8 палитр, по одной на акт (контраст между актами обязателен) |
| **Iconic frames** | ~1 на каждые 20-25 шотов (8-10 на проект) |
| **VO стратегия** | весь фильм — внутренний монолог героини (1-е лицо, ~12-15 RU слов на шот) |
| **Безымянность** | героиня/локации без имён → нет привязки к стране/городу |

**Главный антипаттерн night_courier — длинная проповедь во 2-м лице («ты»).**
В новом проекте: 1-е лицо или 3-е, никогда «ты».

---

## 2. Схема БД и обязательные поля

После миграции `20260522180000_add_cinematic_fields` структура такая:

### Project
```
id, slug (unique), name, scriptText (full screenplay md),
targetPlatform ("youtube" | "tiktok" | "shorts" | "longform"),
safetyTier ("advertiser_safe" | "limited" | "unrestricted")
```

### Scene (= 1 акт фильма)
```
id, projectId, sceneKey (e.g. "act_01_boarding"), title, sortOrder,
narrationText (per-act VO summary, не обязательно — мы используем
shot-level VO), actBeat ("setup" | "rising" | "midpoint_twist" |
"climax" | "final_image"), defaultPaletteKey (e.g. "A1_sodium"),
defaultTimeOfDay (e.g. "sunset_day1")
```

### Shot (главный движитель — у него ~25 значимых полей)

| Поле | Тип | Что хранит |
|---|---|---|
| `shotCode` | text | формат `A{actN}_SH{NN}`, уникален в рамках проекта |
| `sceneId` | text FK | акт |
| `shotType` | text | `EWS \| WS \| MS \| MCU \| CU \| ECU \| OTS \| BACK \| POV` |
| `cameraAngle` | text | `eye \| low \| high \| dutch` |
| `cameraMove` | text | `static \| track_lateral \| push_in \| pull_out \| window_pov \| locked_off \| handheld` |
| `storyBeat` | text | бит из Snyder/Freytag, free-form |
| `narrativeFunction` | text | `plot \| character \| atmosphere \| transition \| iconic` |
| `vignetteSlug` | text | какая виньетка (`conductor` / `military` / `mother_baby` / …); NULL для B-roll |
| `isBroll` | bool | true если в кадре нет персонажей |
| `isIconic` | bool | true если кадр специально под скриншот/превью |
| `timeOfDay` | text | переопределяет Scene.defaultTimeOfDay |
| `paletteKey` | text | переопределяет Scene.defaultPaletteKey |
| `narrationText` | text | RU voiceover ~12-15 слов = ~5 сек @ Silero |
| `referenceProfileId` | text | **profileCode строкой** (не UUID!), e.g. `'CONDUCTOR_BASE'` / `'PAX_MIL'` / NULL для B-roll |
| `referenceImagePool` | jsonb | массив путей к референсам, e.g. `["last_shift/reference/conductor_dataset/conductor_front.jpg", ...]` |
| `workflowRouteKey` | text | имя route, e.g. `'conductor_solo'` / `'passenger_ip'` / `'environment'` |
| `promptFields` | jsonb | главный контент-блок, см. §3 |

### Quotas (квоты типов планов на ~200 шотов)
- EWS=16, WS=24, MS=36, MCU=30, CU=24, ECU=20, OTS=16, BACK=20, POV=14
- B-roll: 15-20% от всех шотов
- Iconic: 8-12 (1 на каждые ~20 шотов)
- **Никогда 2 одинаковых `shotType` подряд внутри сцены** (`feedback_shot_variety`)

### Character & CharacterProfile
```
Character: id, projectId, code (unique per project), displayName
CharacterProfile: id, characterId, profileCode (unique per character),
  ageLabel, targetImages (30-40 для LoRA),
  promptBase, promptAngles, promptVariety, negative, triggerToken,
  loraPath (заполнится после тренировки), useIpAdapter (false для LoRA, true для IP-Adapter-only)
```

### ShotParticipant (мульти-персонажные шоты)
```
shotId, characterId, profileId, label
```
Для SingleWithBack-шотов **primary persistится через Shot.referenceProfileId**,
второй персонаж описан в позитиве как «back/off-frame», но может быть
зарегистрирован в shot_participants для отчётности.

### Workflow templates / routes / steps
```
WorkflowTemplate: templateKey (e.g. "char_lora_sdxl"), filePath (relative to data/)
WorkflowRoute: routeKey (e.g. "conductor_solo")
WorkflowRouteStep: route ↔ template, stepOrder
```

---

## 3. Структура `Shot.promptFields`

Это JSONB-блок, который воркфлоу читает при рендере. Совместим с
night_courier UI-полями:

```json
{
  "positive": "...full resolved English SDXL prompt...",
  "positiveSdxl": "...same as positive in most cases...",
  "positiveTemplate": "...with {CONDUCTOR}/{LIGHT_A1}/{STYLE} placeholders (backup)...",
  "positiveEnvironment": "...environment-only description...",
  "positiveCharacterLocks": "...identity tokens for active character + LoRA notes...",
  "frameDescription": "...same as positive (UI fallback)...",
  "negative": "...full English negative block, weights ≤ 1.3...",
  "lightingMood": "warm tungsten corridor lamps, deep indigo night windows, ...",
  "narrativeBeat": "midpoint_twist",
  "storyFunction": "plot",
  "camera": {"framing": "CU", "angle": "eye", "movement": "push_in"},
  "location": {
    "label": "Поезд / интерьер",
    "palette": "A6_golden_warm",
    "timeOfDay": "late_day_day2",
    "interiorExterior": "interior"
  },
  "continuity": {
    "withPrevious": "Match palette + wardrobe + props with previous shot",
    "withNext": "Pass key props (cap, gloves, chain, envelope) to next"
  },
  "production": {"promptStatus": "draft", "notes": "", "assetRefs": []},
  "workflowParams": {
    "seedPolicy": "base seed per scene + offset by shot number",
    "ipAdapterRef": "last_shift/reference/passengers/passenger_01_military.png"
  },
  "captionGenerator": "Caption-expansion focus: emphasize CU framing; lighting A6_golden_warm; expand with sensory specifics before final render",
  "isBroll": false,
  "isIconic": false
}
```

### Конвенция `{TOKEN}` плейсхолдеров

Изначально пиши промпт с шаблонными токенами:

```
{CONDUCTOR}     — full conductor identity block
{PAX_MIL}       — military passenger
{PAX_MOM}       — mother
...
{LIGHT_A1}      — palette A1 lighting tokens
{LIGHT_A2}      — etc.
{STYLE}         — "photorealistic cinematic, 35mm full-frame, ..."
{NEG}           — universal negative
{TRAIN_INT}     — "nameless Eastern European train interior, no logos, ..."
{TRAIN_EXT}     — "nameless rural train route, no city, ..."
```

Хранение: в `positiveTemplate` оставляем шаблон, в `positive` — резолвленную
версию (после прогона `resolve_placeholders.sql`). Это позволяет:
- UI показывает чистый промпт (без `{TOKEN}`)
- При смене глобального описания героини — перерезолвить один раз через find-replace

---

## 4. Character profiles — датасет-промпты для LoRA

Каждый персонаж со своим LoRA нуждается в **FATHER_BASE-quality** наборе:

### Поля
- **`promptBase`** (одна строка, ~400-700 char) — identity-lock токены:
  возраст, происхождение, ключевые черты лица, гардероб, особые приметы (родинка не шрам!), стиль фото
- **`promptAngles`** (~20-30 newline-разделённых строк, ~1500-3500 char) —
  «лабораторные» снимки на нейтральном сером фоне: front/3-4/profile/back,
  разные дистанции (close-up/medium/full), eye/low/high углы + ECU
  характерных предметов. Цель — lock identity в LoRA.
- **`promptVariety`** (~25-40 newline-разделённых строк, ~2500-5200 char) —
  environmental сцены из их виньетки: купе / тамбур / коридор / перрон с
  правильным реквизитом и эмоцией. Цель — научить LoRA узнавать
  персонажа в реальной среде.
- **`negative`** (~400-700 char) — character-tailored:
  - Для женщин: no makeup/lipstick/jewelry/glamour
  - Для детей: **строгие child-safety guards** — no adult proportions, no sexualization, no model pose, no swimwear, modest clothing only
  - Для военных/ветеранов: no readable insignia, no swastika/Z/V/runes, no weapons, no real-world military symbols
  - Для всех: no cartoon/anime/cgi/plastic skin/oversmooth/watermark/text/brand logos/deformed hands/two heads
- **`triggerToken`** — `<PROFILE_CODE>_BASE` (e.g. `CONDUCTOR_BASE`)
- **`targetImages`** — 30 для пассажиров, 40 для главного героя
- **`useIpAdapter`** — `false` если будем тренировать LoRA, `true` если только IP-Adapter

### Identity-anchor правила

- **Уникальная деталь** для face-lock: родинка (mole), веснушки, scar на руке (НЕ на лице — крипово). Один анкор-маркер достаточно.
- **Гардероб = одна базовая конфигурация** через весь фильм. Wardrobe change (например, героиня в финале без кителя) — допустима но
  редка, тренируется отдельно или через img2img.
- **Возраст однозначный** (не «25-35», а «25» — иначе LoRA размывается)

---

## 5. Workflow routes

### 3 стандартных маршрута:

| Route | Использовать когда | Workflow JSON |
|---|---|---|
| `conductor_solo` (LoRA single) | Главный герой с собственной LoRA | `scene_single_character_api.json` |
| `passenger_ip` (IP-Adapter) | Второстепенный персонаж без LoRA (face-lock через FaceID v2) | `scene_single_character_ipadapter_api.json` (надо создать на базе scene_single_character_api.json + IP-Adapter ноды) |
| `environment` (no character) | B-roll, экстерьеры, объекты | `scene_environment_flux_api.json` |

### Назначение route на Shot — простое правило:

```sql
workflowRouteKey =
  CASE
    WHEN referenceProfileId = 'CONDUCTOR_BASE' THEN 'conductor_solo'
    WHEN referenceProfileId IS NOT NULL       THEN 'passenger_ip'
    ELSE                                           'environment'
  END
```

### SingleWithBack для мульти-персонажных шотов

Никогда **2 LoRA + 2 IP-Adapter** в одном кадре (`feedback_two_lora_disabled`).
Если в кадре два персонажа:
1. Выбираешь **primary** — у кого лицо в кадре
2. В позитиве описываешь secondary как «back of head visible at frame edge», «in profile turned away», «hand only visible», «only their silhouette»
3. `referenceProfileId` = profileCode primary
4. `referenceImagePool` содержит только primary reference (не два!)

---

## 6. Файловая структура проекта

```
data/<slug>/
├── PROJECT.md              ← полная спека проекта (mirror of scriptText)
├── SHOTLIST.md             ← все шоты с paste-ready промптами
├── (НЕТ comfy/ — воркфлоу общие, см. ниже)
├── datasets/               ← LoRA training images
│   ├── CONDUCTOR_BASE/
│   ├── PAX_MIL/
│   └── ...
├── reference/
│   ├── conductor_dataset/  ← 5 multi-angle refs for faceswap (front, 3/4 L/R, profile L/R)
│   └── passengers/         ← single ref portrait per passenger for IP-Adapter
│       ├── passenger_01_military.png
│       ├── passenger_02_mother_baby.png
│       └── ...
├── scenes/                 ← per-scene narration wavs
├── shots/                  ← per-shot rendered images + videos
│   ├── A1_SH01/
│   │   ├── scene_A1_SH01_00001.png
│   │   ├── videos/
│   │   └── narration_*.wav
│   └── ...
├── bgm/                    ← ACE-Step BGM tracks
├── finish/                 ← final stitched mp4
├── exports/capcut/         ← CapCut import package
└── characters/             ← (optional) per-character notes
```

### Воркфлоу — общие, не копировать (2026-08-13)

Все ComfyUI-графы лежат ОДНОЙ копией в `data/_templates/comfy/`. Новому проекту
папка `comfy/` не нужна вообще — рендер сам возьмёт граф из мастера
(`src/comfy/workflow-path.ts`).

Раньше каждый проект получал свою копию (382 файла, 22 уникальных содержимых,
ни одна копия ни разу не была отредактирована), а сидеры копировали `comfy/`
**соседнего проекта**. Правка одного узла превращалась в Python-фанаут по 42
файлам (`scripts/_strip_fhd_save_branch.py` — памятник этой схеме).

Персональная копия в `data/<slug>/comfy/<file>.json` по-прежнему перебивает
мастер, если её положить — так закрепляют эксперимент на одном фильме. По
умолчанию таких копий нет ни у кого.

---

## 7. Seed-скрипт

Из-за того что у `Project.scriptText` нет PATCH API, первичная заливка
проекта делается ОДНИМ SQL-скриптом — это документированное исключение
(см. `feedback_use_api_not_direct_db`).

### Структура seed-скрипта

```sql
BEGIN;

-- Idempotent cleanup
DELETE FROM projects WHERE slug = '<new_slug>';

DO $$
DECLARE
  v_proj TEXT := gen_random_uuid()::text;
  v_a1   TEXT := gen_random_uuid()::text;
  -- ... v_a2..v_a8
  v_ch_cond TEXT := gen_random_uuid()::text;
  -- ... остальные character + profile UUIDs
BEGIN
  -- 1. Project
  INSERT INTO projects (id, slug, name, "scriptText", "targetPlatform", "safetyTier", ...) VALUES ...;

  -- 2. 8 Scenes
  INSERT INTO scenes (...) VALUES
    (v_a1, v_proj, 'act_01_<name>', 'A1 — <Title>', 0, 'setup', '<palette>', '<tod>', NOW()),
    ...;

  -- 3. Characters + CharacterProfiles (с full prompts из §4)
  INSERT INTO characters (...) VALUES ...;
  INSERT INTO character_profiles (...) VALUES ...;

  -- 4. (шага «workflow templates + routes» больше НЕТ — таблицы удалены
  --     2026-08-13, воркфлоу берутся из data/_templates/comfy/)

  -- 5. 200 Shots (с full promptFields + новыми полями схемы)
  INSERT INTO shots (...) VALUES
    (gen_random_uuid()::text, v_proj, v_a1, 'A1_SH01', jsonb_build_object(...), 'EWS', ...),
    ... 199 more tuples ...
  ;

  -- 6. shot_participants для character-bearing шотов
  INSERT INTO shot_participants (...)
  SELECT gen_random_uuid()::text, sh.id, c.id, cp.id, '<label>'
  FROM shots sh JOIN character_profiles cp ON cp."profileCode" = sh."referenceProfileId"
                JOIN characters c          ON cp."characterId" = c.id
  WHERE sh."projectId" = v_proj AND sh."vignetteSlug" IS NOT NULL;

END $$;
COMMIT;
```

### Пост-seed скрипты (применяются по очереди):

1. **`resolve_placeholders.sql`** — рекурсивный `replace()` по jsonb для
   подстановки `{CONDUCTOR}`, `{LIGHT_A1}`, `{STYLE}` etc. в реальный текст.
2. **`fix_singlewithback.sql`** — переписать positive для мульти-персонажных шотов.
3. **`fill_vo_and_prompts.sql`** — добавить 200 уникальных VO + positiveEnvironment / positiveCharacterLocks / captionGenerator (если не вошло в seed).

Эталон: `gen-studio/scripts/seed_last_shift.sql` + `fix_last_shift_complete.sql` + `fill_last_shift_vo_and_prompts.sql` + `resolve_last_shift_placeholders.sql`.

---

## 8. API-эндпоинты

Правило: **после seed — всё через API**. Direct SQL только для миграций и
тех полей, у которых нет PATCH-эндпоинта.

### Известные endpoints (gen-studio NestJS на `http://localhost:4000`)

| Метод | URL | Что делает |
|---|---|---|
| GET | `/projects/:idOrSlug/script` | читает Project.scriptText |
| GET | `/projects/:idOrSlug/scenes` | список актов + кадров + участников |
| PATCH | `/profiles/:profileId` | правит promptBase / promptAngles / promptVariety / negative / ageLabel / targetImages / triggerToken |
| GET | `/profiles/:profileId/loras` | список обученных LoRA для профиля |
| POST | `/profiles/:profileId/loras/active` | назначить активную LoRA |
| POST | `/profiles/:profileId/generate-dataset` | поставить dataset-job |
| PATCH | `/shots/:shotId` | правит shot (promptFields, ...) |
| PATCH | `/tts/shots/:shotId/narration` | правит narrationText шота |
| POST | `/tts/shots/:shotId` | сгенерить TTS для шота |
| POST | `/shots/:shotId/renders` | зарегистрировать готовый файл-кандидат кадра (НЕ ставит рендер; рендер — POST /generation/shots/:shotId/enqueue) |

### НЕТ PATCH endpoint для:
- `Project.scriptText` → direct SQL exception
- `Scene.narrationText` → direct SQL exception (или через scenes API если найдётся)

### Пример PowerShell-вызова

```powershell
$profileId = "<uuid>"
$body = @{ promptBase = "new identity tokens..." } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:4000/profiles/$profileId" `
  -ContentType "application/json" -Body $body
```

---

## 9. Правила сторителлинга

### 8-актная структура (Freytag + Snyder)

| Акт | Beats | Шотов | Что в нём |
|---|---|---|---|
| A1 Setup | Opening Image, Theme Stated, Setup, Catalyst | 22-25 | Знакомство, плот-крючок |
| A2 Rising A | Fun and Games (или эмоциональный bottom) | 20-25 | Виньетка 1 |
| A3 Rising B | B-Story | 25-30 | Виньетка 2-3 |
| A4 Bridge | Rest beat / breather | 15-20 | Comic relief или транзишн |
| A5 Rising C | Promise of Premise | 25-30 | Виньетка 4-6 |
| A6 Midpoint | Midpoint Twist | 15-20 | Сюжетный разворот |
| A7 Climax | Bad Guys Close In → All Is Lost → Dark Night → Break Into Three | 30-35 | Кульминация |
| A8 Resolution | Final Image | 25-30 | Развязка + loop closure |

### Палитры — 8 уникальных

| Акт | Палитра | Лайтинг tokens |
|---|---|---|
| A1 | sodium закат | `sodium vapor platform lamps, cool autumn dusk sky, golden hour fading, warm-cool contrast` |
| A2 | amber+indigo ночь | `warm tungsten corridor lamps, deep indigo night windows, soft falloff, sleep silence` |
| A3 | amber+indigo глубокая ночь | `late night dim amber, indigo black windows, single reading lamp pools of light` |
| A4 | cool blue рассвет | `pre-dawn cool blue starting to warm, weary tungsten, first hint of sky` |
| A5 | cold birch день | `cold daylight through window, intermittent strobing birch shadows, high key overcast` |
| A6 | golden warm закат | `late afternoon golden warmth slanting through window, long corridor shadows` |
| A7 | dark emerald + snow | `dark emerald compartment shadows, snow blizzard outside, harsh emergency yellow flashlight` |
| A8 | pink fog | `milky pink dawn fog, soft diffused omnidirectional light, no harsh shadows, ethereal` |

Между актами — обязательный контраст. Никаких двух соседних актов с похожей палитрой.

### Ракурсы (никогда 2 одинаковых подряд)

8-angle rotation: `EWS, WS, MS, MCU, CU, ECU, OTS, BACK, POV`.
Квоты на ~200 шотов:
- EWS=8%, WS=12%, MS=18%, MCU=15%, CU=12%, ECU=10%, OTS=8%, BACK=10%, POV=7%
- B-roll (без людей): 15-19%
- Iconic frames: 8-10 (одна штука на каждые ~20 шотов)

### VO — 1-е лицо героини, ~12-15 RU слов на шот

```
~13 слов = ~5 сек @ Silero V5 default rate
```

Каждая VO-строка должна:
- Описывать ВНУТРЕННИЙ голос героини (не narrator)
- Двигать арку (не повторять что и так видно в кадре)
- Быть уникальной (нет шаблонных «город спал, поезд ехал»)
- Не описывать что зритель уже видит буквально

### YouTube-safety guardrails

| Запрещено | Почему |
|---|---|
| Self-harm, suicide, методы | YouTube self-harm policy → удаление |
| Графические травмы, кровь | violence policy |
| Реальные бренды и логотипы | trademark + commercial |
| Свастика, Z/V, реальные политические символы | hate / political |
| Откровенная нагота, сексуализация | adult content |
| Наркотики, употребление | drugs policy |
| **Сексуализация детей в любой форме** | child safety — мгновенный бан |

### Sensitive-темы (можно тактично)
- Смерть ребёнка — **только обиняком** (предмет, кольцо, пустое купе), никогда визуально
- Болезнь — без крови и медицинских деталей
- Аварии — звук и тряска ОК, никаких разорванных тел
- Развод — без оскорблений в VO, без насилия

### Принципы

- **Implication, не depiction** — тяжёлые события намекаются
- **Метафора > буквализм** — туман вместо «вот что случилось»
- **Тишина > слов** — если беда, лучше silence + B-roll
- **Catalyst всегда внешний и нейтральный** — болезнь, погода, опоздание

---

## 10. Hard rules

Все из feedback memory (`C:\Users\mip\.claude\projects\E--ComfyUI\memory\`):

| Правило | Источник |
|---|---|
| Поля БД (positive/negative/триггеры): **только английский** | `feedback_db_english_only` — CLIP tokenizer не работает с кириллицей. narrationText (для TTS) — RU OK |
| **Никакого hires-fix на single-character LoRA шотах** — single-pass | `feedback_sdxl_hires_burns_lora` |
| Negative prompt: веса ≤ 1.3; не использовать `motion blur`, `out of focus`, `plastic skin`, `(token:1.5+)` | `feedback_negative_prompt_weights` |
| Никаких regional / ComfyCouple / LoRA-Hooks для 2-char шотов. **SingleWithBack** | `feedback_two_lora_disabled` |
| GPU-джобы только через `PipelineQueueService` | `feedback_all_gpu_jobs_through_queue` |
| Florence-2 — только captioning датасета, не auto-prompt шотов | `feedback_florence2_dataset_only` |
| Не ставить GPU-джобы без явного «запусти/поставь/render» от пользователя | `feedback_no_unsolicited_gpu_jobs` |
| **Никогда 2 одинаковых ракурса подряд** в сцене | `feedback_shot_variety` |
| **Use API not direct DB** (DB fallback если API нет) | `feedback_use_api_not_direct_db` |

---

## 11. Nano Banana промпты

Каждому LoRA-персонажу нужен **identity anchor** — первый высококачественный
портрет, который потом используется как seed для генерации остального
датасета (через img2img / variation / IP-Adapter).

### Структура промпта для Nano Banana

Nano Banana работает лучше с **flowing prose**, не SDXL token salad.
Формат:

1. **Открывающая фраза** — «Photorealistic documentary portrait photograph of a [возраст] [происхождение] [пол], three-quarter view facing camera, eye level, framed from [где]»
2. **Параграф 1 — лицо**: волосы, глаза, кожа, выражение, identity-anchor (родинка)
3. **Параграф 2 — одежда + реквизит**: точное описание гардероба и ключевых предметов
4. **Параграф 3 — поза + руки**: что делают руки, что на пальцах (кольцо/нет), поза
5. **Параграф 4 — фон + свет**: «pale grey-white seamless studio backdrop, soft documentary window light»
6. **Параграф 5 — техника**: «50mm prime lens at f/2.8, slight shallow DOF, natural film grain, [референсный фотограф — Magnum / Sally Mann / Salgado], 4:5 portrait»
7. **Параграф «Avoid:»** — длинный список негативов tailored под персонажа

### Identity-anchor правила

- **Маленькая родинка** на скуле / челюсти / руке — лучший face-lock без крипа
- **Веснушки** на переносице — для молодых женских персонажей
- **Шрам на руке (не на лице!)** — для военных/работяг
- **Никогда: шрам на лице героя/героини** — выглядит криповато, AI часто экзагерирует

### Универсальные негативы

```
glamour photography, beauty retouching, fashion shoot, plastic smooth
airbrushed skin, oversmooth, model pose, runway pose, makeup, lipstick,
mascara, false eyelashes, eye shadow, jewelry on hands except simple
wedding band, large earrings, dangling earrings, necklace visible,
modern brand logos, readable text on clothing, weapon, blood, wound,
cartoon, anime, manga, chibi, 3D render, CGI look, painterly
stylization, HDR, oversaturated color, harsh dramatic shadows,
side-lit drama, deformed hands, extra fingers, missing fingers, two
heads, second person in frame
```

Плюс **per-character** негативы (см. §4):
- Дети: child-safety blocks (no adult proportions, no sexualization, no fashion pose, ...)
- Военные: no readable insignia, no swastika/Z/V, no real military symbols, no weapons
- Невесты: no full wedding dress worn, no veil/tiara/bouquet
- Музыканты: no electric guitar, no drum kit, no microphone, no band

---

## 12. Consistency-аудит

Перед стартом рендера прогнать через эти проверки. Эталон — `tmp_audit.sql`
в проектной папке. Минимум:

### Полнота
```sql
SELECT
  COUNT(*) FILTER (WHERE "promptFields"->>'positive' IS NULL OR LENGTH("promptFields"->>'positive') < 50) AS positive_missing,
  COUNT(*) FILTER (WHERE "narrationText" IS NULL OR LENGTH("narrationText") < 20) AS vo_missing,
  -- ... аналогично для positiveEnvironment, positiveCharacterLocks, lightingMood, narrativeBeat
FROM shots WHERE "projectId" = (SELECT id FROM projects WHERE slug = '<slug>');
```

### Уникальность VO
```sql
SELECT COUNT(*) AS total, COUNT(DISTINCT "narrationText") AS unique
FROM shots WHERE "projectId" = ...;
-- должно быть total == unique
```

### Route ↔ profileId алайнмент
```sql
SELECT "referenceProfileId", "workflowRouteKey", COUNT(*)
FROM shots WHERE "projectId" = ...
GROUP BY "referenceProfileId", "workflowRouteKey";
-- CONDUCTOR_BASE → только conductor_solo
-- PAX_* → только passenger_ip
-- NULL → только environment
```

### Палитра сцены = палитре шотов
```sql
SELECT s."sceneKey", s."defaultPaletteKey", array_agg(DISTINCT sh."paletteKey")
FROM scenes s LEFT JOIN shots sh ON sh."sceneId" = s.id
WHERE s."projectId" = ...
GROUP BY s."sceneKey", s."defaultPaletteKey", s."sortOrder";
-- каждый array должен содержать только defaultPaletteKey акта
```

### Sequence: 2 одинаковых ракурса подряд внутри сцены
```sql
WITH scoped AS (
  SELECT "shotCode", "sceneId", "shotType",
    LAG("shotType") OVER (PARTITION BY "sceneId" ORDER BY "shotCode") AS prev_type
  FROM shots WHERE "projectId" = ...
)
SELECT * FROM scoped WHERE "shotType" = prev_type;
-- допустимы намеренные параллелизмы (ensemble CU-нарезка, still-life ECU-серия), но они должны быть осознанным выбором
```

### Реквизит-хронология
Для каждого ключевого предмета (envelope / chain / owl / др.) — проверить
что упоминается в `positive` тех шотов, где он должен фигурировать.

### scriptText ↔ promptBase
Проверить что внешность героев в `scriptText` (RU bullets в синопсисе)
совпадает с `CharacterProfile.promptBase` (EN identity tokens).

---

## 13. Pipeline-порядок

Полная последовательность от концепта до экспортированного mp4:

1. **Концепт** (1 день) — §1
2. **scriptText + структура актов + квоты ракурсов** (1 день) — §2, §9
3. **Сборка seed-скрипта** (4-6 часов) — §7
   - Project, 8 Scenes, ~200 Shots, Characters + Profiles, Workflows
4. **Прогон seed-скрипта + пост-seed скрипты** (1 час)
5. **Consistency-аудит** (30 мин) — §12
6. **Файловая структура — создать папки** — §6
7. ~~Скопировать workflow JSONs~~ — НЕ НУЖНО, воркфлоу общие (`data/_templates/comfy/`)
8. **Сгенерить Nano Banana референс-портреты** для всех персонажей — §11
   - 1 anchor на персонажа → потом 4-5 ракурсов для conductor (для faceswap), 1 для пассажиров (для IP-Adapter)
9. **Собрать датасеты для LoRA-персонажей**
   - dataset-job через UI (`POST /profiles/:profileId/generate-dataset`)
   - Использует `promptBase` + `promptAngles` + `promptVariety`
10. **Обучить LoRA** (1 ночь на персонажа на 4090) → `loraPath` пишется в DB
11. **Рендер шотов**
    - В UI: для каждого шота `POST /shots/:shotId/renders`
    - Через `PipelineQueueService` FIFO, single-slot
12. **Утвердить рендеры** — выбрать `chosenRender` для каждого шота
13. **i2v видео** (Wan2.2) — `POST /shots/:shotId/videos` для каждого
14. **Утвердить видео** — выбрать `chosenVideoId`
15. **Upscale→FPS** (one-pass) — `video_upscale_interp_api.json` (один ComfyUI-джоб выдаёт FHD + сглаженный клип; модели грузятся один раз)
16. **TTS narration** — `POST /tts/shots/:shotId` для всех 200 шотов (Silero V5 RU)
17. **BGM** — `NarrativeBlock` + `MusicSegment` через ACE-Step
18. **Сшивка финального mp4** — CapCut export через `scripts/export_capcut.py`
19. **Финальный QC** + загрузка на YouTube

---

## 14. Чеклист «новый проект за один день» (концепт-фаза)

- [ ] Logline (1 предложение)
- [ ] Жанр + платформа + safetyTier
- [ ] Длина в шотах (~200)
- [ ] 8 актов с beats + палитрами + time-of-day
- [ ] 8-10 character archetypes (1 главный + ~8 второстепенных)
- [ ] Identity-anchor для каждого (родинка/веснушки/etc — НЕ шрам на лице!)
- [ ] Сюжетные предметы (3-5 предметов с прописанной хронологией появления)
- [ ] VO-стратегия (1-е лицо? 3-е? минимум? через весь фильм?)
- [ ] Iconic frames lis (8-10)
- [ ] Финальный кадр / loop / open ending — определён
- [ ] YouTube-safety guardrails проговорены (нет ли в плане self-harm / графики / реальных брендов)

## Чеклист «всё в БД» (после seed)

- [ ] `projects.slug` создан, `scriptText` заполнен
- [ ] 8 `scenes` с `actBeat`, `defaultPaletteKey`, `defaultTimeOfDay`
- [ ] ~200 `shots` со всеми полями + `narrationText`
- [ ] `characters` + `character_profiles` с FATHER_BASE-quality промптами
- [ ] `shot_participants` для всех character-bearing шотов
- [ ] Consistency-аудит проходит (см. §12)

## Чеклист «всё в файловой системе»

- [ ] `data/<slug>/datasets/<profile>/` структура готова
- [ ] `data/<slug>/reference/passengers/passenger_*.png` сгенерированы
- [ ] `data/<slug>/reference/<main>_dataset/` мульти-ракурсные референсы
- [ ] `PROJECT.md` и `SHOTLIST.md` положены рядом для офлайн-просмотра

---

## Приложение A. Известные грабли и как обойти

| Грабли | Решение |
|---|---|
| Шрам на лице героя/героини | Не использовать. Использовать родинку/веснушки. AI экзагерирует шрам и зритель видит «крипово» |
| `promptFields.positive` с `{TOKEN}` плейсхолдерами в UI | Прогнать `resolve_placeholders.sql` — UI ждёт чистый английский без шаблонов |
| Воркфлоу не найден при рендере | Файла нет в `data/_templates/comfy/` — положить туда ОДНУ копию, не в проект |
| Prisma migrate fails: "could not create shadow database" | Write migration SQL by hand, apply with `psql -f`, register with `prisma migrate resolve --applied <name>` |
| Prisma client не пересобирается (EPERM, DLL locked) | gen-studio сервер запущен и держит DLL. Рестартануть сервер → `npx prisma generate` |
| `to_jsonb($pp$...$pp$)` ошибка «unknown type» | Использовать `DO $$ DECLARE v_text TEXT := $pp$...$pp$; BEGIN ... END $$` или явный cast |
| Идентичность пассажира «плывёт» между шотами | Зафиксировать seed внутри виньетки одного пассажира. Долгосрочно — обучить LoRA или использовать IP-Adapter |
| Кириллица в `promptFields.positive` | Заменить на английский. CLIP не работает с RU. Только `narrationText` остаётся RU (для Silero TTS) |
| 2 LoRA / 2 IP-Adapter в одном кадре | Запрещено. Использовать SingleWithBack: один primary, второй описан текстом как back/profile/off-frame |
| YouTube демонетизация | Проверить нет ли в кадре: реальных брендов, читаемых символов, self-harm, графической крови, реальной военной символики |

## Приложение B. Полезные SQL-сниппеты

### Прочитать всё про шот
```sql
SELECT
  sh."shotCode", sh."shotType", sh."cameraAngle", sh."cameraMove",
  sh."storyBeat", sh."vignetteSlug", sh."referenceProfileId",
  sh."workflowRouteKey", sh."narrationText",
  jsonb_pretty(sh."promptFields") AS prompt_fields
FROM shots sh
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = '<slug>')
  AND sh."shotCode" = '<code>';
```

### Найти все шоты одного персонажа
```sql
SELECT sh."shotCode", sh."shotType", LEFT(sh."narrationText", 60)
FROM shots sh
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = '<slug>')
  AND sh."referenceProfileId" = '<PROFILE_CODE>'
ORDER BY sh."shotCode";
```

### Найти все B-roll шоты
```sql
SELECT sh."shotCode", sh."shotType", sh."paletteKey",
  LEFT(sh."promptFields"->>'positive', 100)
FROM shots sh
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = '<slug>')
  AND sh."isBroll" = TRUE
ORDER BY sh."shotCode";
```

### Найти все iconic frames
```sql
SELECT sh."shotCode", sh."shotType", sh."vignetteSlug",
  LEFT(sh."promptFields"->>'positive', 150)
FROM shots sh
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = '<slug>')
  AND sh."isIconic" = TRUE
ORDER BY sh."shotCode";
```

## Приложение C. Структура памяти Claude

Все правила лежат в `C:\Users\mip\.claude\projects\E--ComfyUI\memory\` —
если что-то в этом гайде покажется устаревшим, **memory — источник истины**:

```
MEMORY.md                                    ← индекс
feedback_db_english_only.md
feedback_sdxl_hires_burns_lora.md
feedback_negative_prompt_weights.md
feedback_two_lora_disabled.md
feedback_all_gpu_jobs_through_queue.md
feedback_florence2_dataset_only.md
feedback_no_unsolicited_gpu_jobs.md
feedback_shot_variety.md
feedback_use_api_not_direct_db.md
```

И skill — `E:\ComfyUI\.claude\skills\gen-studio-scenario\SKILL.md` —
автоматически тянет `scriptText` из БД перед генерацией промптов.
