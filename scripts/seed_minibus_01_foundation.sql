-- Фундамент фильма «ТЫ — Маршрутчик» (slug: minibus).
-- Проект, каст, профили, локации, props, сцены, блоки BGM, 46 страниц вёрстки.
-- Кадры — отдельным сидером (seed_minibus_shots.py).
--   psql -U gen_studio -h localhost -d gen_studio -v ON_ERROR_STOP=1 -f seed_minibus_01_foundation.sql
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM projects WHERE slug = 'minibus') THEN
    RAISE EXCEPTION 'minibus already exists — сид первичный, повторно не запускать';
  END IF;
END $$;

-- ─────────────────────────────── ПРОЕКТ ───────────────────────────────
INSERT INTO projects (
  id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier",
  "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt",
  "defaultStaticMotionPrompt", "ttsEngine", "ttsVoiceoverId", "visualStyle",
  "exportTiming", "defaultVideoFlow", "videoEngine", "queuePriorityTier",
  "voValidationGateEnabled", "createdAt", "updatedAt"
) VALUES (
  '7e7e0000-0000-4000-8000-000000000001',
  'minibus',
  'ТЫ — Маршрутчик. И это вся твоя жизнь.',
  '{
    "styleLora": {"name": "style\\RealComic_2509_base.safetensors", "strengthModel": 0.5},
    "exportType": "comic",
    "sceneSteps": 8,
    "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors",
    "anchorPipeline": "flux_comic",
    "anchorStyleLora": {"name": "style\\Comic_Style_-_FLUX.safetensors", "strengthClip": 0.9, "strengthModel": 0.9},
    "anchorComposition": "waist-up framing, standing in a softly blurred muted interior with natural depth, gentle directional daylight, soft natural shadows",
    "propAnchorPipeline": "qwen",
    "qwenReferenceLatents": true,
    "scriptShort": {"en": "LOGLINE: A route-minibus driver rents his slot on the line for a fixed daily sum, learns to read a bus stop in one second and decide who is worth stopping for, and after eleven years discovers he owns nothing — not the route, not the bus, not a single day of employment record.\n\nARC: At twenty-eight the machine shop where Oleg worked closes and he takes a minibus route, because people will always need carrying — the one thing, it seems, that cannot be taken away. The route is not his: he rents the slot from Arkady and hands over four thousand two hundred every evening, whatever he collects. A ticket is thirty-five, so a hundred and twenty passengers is only break-even, a lap takes fifty minutes, and there are eight laps in a shift. Nobody bribes him and nothing he does is illegal. The sin is not stopping. He learns to read a stop in a second: who pays cash and boards fast, and who will hunt for a travel pass, climb the step slowly, ride two stops and ask for change. The carrier is reimbursed nineteen for a pass instead of thirty-five, and two months late. So he starts driving past the old, the slow, the short-distance riders. He drives past Zina, sixty-eight, who waits every Tuesday and Friday at six ten with a checked shopping trolley. At thirty-six the clutch costs him twenty-eight thousand out of his own pocket, because the bus is not his either. At thirty-seven his sixteen-year-old daughter boards at her own stop and watches from the rear platform as he drives past Zina.\n\nCATASTROPHE: no crash. At thirty-eight he blacks out for two seconds at a traffic light with a full salon; the mirror clips a pole, nobody notices, and he keeps driving for four more months because the plan does not wait. Then the medical commission refuses to renew his certificate, and the lease agreement shows eleven years with zero days of employment record.\n\nFINALE: he stands under the same bus shelter with a travel pass in his hand. His minibus, same route number, new driver, pulls up. He gets in and pays cash. Last image: his hand dropping coins into the same tin sweet box beside the gearshift; the new driver does not turn round.\n\nLEITMOTIF: the tin sweet box of coins beside the gearshift.\n\nKEY FACTS: four thousand two hundred a day to hand over; a ticket is thirty-five; a hundred and twenty passengers to break even; thirteen seats and up to twenty-two carried; a fifty-minute lap, eight laps a shift; nineteen reimbursed for a travel pass, two months late; twenty-eight thousand for a clutch; a fourteen-hour shift; zero days of record in eleven years; the country and the currency are never named."}
  }'::jsonb,
  '# ТЫ — Маршрутчик. И это вся твоя жизнь.

**Track B** (cautionary tale, 2-е лицо, настоящее время). **Visual style:** realcomic_qwen (flux_comic якоря, styleLora 0.5, refLatents true, sceneSteps 8). **Video engine:** wan (Wan 2.2 i2v — выбран за послушность указаниям по действию и потому, что салон маршрутки это толпа, а толпа у LTX в списке слабых мест). **TTS:** f5, голос «Кузнецов»; одна фраза на кадр, строчная первая буква, терминальная точка, числа словами. **exportTiming:** narration, все кадры animated. **Метраж:** ~25 мин ≈ 200 кадров (11 блоков), ~3300 слов. **Вёрстка:** 46 страниц шаблонной вёрстки, 200 панелей. Безымянный крупный город, наши дни, валюта не называется.

## Логлайн
Тебе тридцать девять, ты водитель маршрутки. Маршрут не твой, машина не твоя. Каждое утро ты выезжаешь в минус: план — четыре тысячи двести, которые надо сдать вечером, сколько бы людей ни село. Билет тридцать пять, значит сто двадцать человек только чтобы выйти в ноль; круг пятьдесят минут, кругов в смене восемь. Одиннадцать лет ты возишь одних и тех же людей и учишься решать за секунду, за кем стоит остановиться.

## Ключевая ирония
Ты пошёл на маршрут в двадцать восемь, когда закрыли цех, потому что людей всегда надо будет возить — единственное, чего, казалось, не отнять. Отняли всё, кроме людей: они по-прежнему стоят на остановках, только теперь среди них стоишь ты.

## Чем это НЕ «Эвакуаторщик» (держать при любых правках)
У эвакуаторщика платят ЗА ШТУКУ, соблазн приходит извне (инспектор даёт адрес), нарушение техническое, развязка — авария и лишение прав. Здесь план ФИКСИРОВАННЫЙ, никто не подкупает, решение принимает сам герой сто раз в день и оно ни разу не противозаконно; грех — не остановиться. Аварии в фильме НЕТ. Ирония вывернута: не жертва-ставшая-палачом, а палач, ставший тем, кого не берут.

## Лейтмотив (внешний, предметный и звучащий)
**Жестяная коробка из-под конфет у рычага**, куда ссыпают мелочь; крышка потеряна, дно протёрто до металла. Пять появлений на шарнирах: первая монета в первую смену · полная коробка на пике · ты считаешь её на коленях в конце смены и не добираешь до плана · пустая в день, когда ты не выехал · твоя рука опускает монеты в такую же коробку в чужой машине. Телесных лейтмотивов в фильме нет.

## Финальный образ
Твоя рука опускает монеты в жестяную коробку у чужого рычага; новый водитель не оборачивается.

## Дисклеймер
«Эта история вымышлена, все совпадения с реальными людьми и событиями случайны.» Одна фраза, последний кадр.

## Вступление (Акт 1, рабочая авария, ≤40 сек, НЕ закрывается)
Ливень, час пик, полный салон. Сдвижную дверь заклинивает с людьми внутри, снаружи под навесом очередь и опаздывающая смена. Ты достаёшь отвёртку из-под сиденья и вскрываешь механизм за сорок секунд, никто не пострадал. Эмоциональный крюк к двадцатой секунде — женщина изнутри держит дверь за поручень двумя руками, а ребёнок под навесом снаружи мокнет. Хук-строка и CTA в кадрах четыре-пять. Острота снята, история открыта: на конечной тебя ждёт Аркадий и говорит, что с понедельника план другой.

## Персонажи (латиница, различимы)
- **OLEG (Олег)** — 28 → 39, водитель маршрутки. Тёмно-русые волосы очень коротко, к тридцати девяти седеющие виски; тяжёлые плечи; серые глаза. Anchor: латунный жетон с номером маршрута, приколотый к нагрудному карману. Профили: OLEG_YOUNG (28), OLEG_MID (35), OLEG_LATE (39).
- **ZHANNA (Жанна)** — 37, жена, кассир в продуктовом. Рыжеватые волосы в низком узле, зелёные глаза. Anchor: пластиковый бейдж на витом шнурке-пружинке у пояса.
- **MILA (Мила)** — 16, дочь. Чёрные прямые волосы до плеч, тёмно-карие глаза. Anchor: большие наушники, сдвинутые на шею.
- **ARKADY (Аркадий)** — 52, держатель маршрута. Седые волосы зачёсаны назад, полный, светло-карие глаза. Anchor: кожаная папка на молнии под мышкой.
- **ZINA (Зина)** — 68, пассажирка вторника и пятницы. Белые волосы под серым платком, светло-голубые глаза. Anchor: клетчатая сумка-тележка на двух колёсах.

## Предметы (props — ровно три, каждый проходит критерий)
- **COIN_TIN — the coin tin.** Жестяная коробка из-под конфет у рычага, крышка потеряна, дно протёрто до металла. Источник лейтмотива.
- **MINIBUS — the route minibus.** Жёлтый борт, номер маршрута в трафарете на стекле, вмятина на правой сдвижной двери изнутри.
- **TRAVEL_PASS — the travel pass.** Проездной Зины: картонка в мутном файлике на сохлой резинке, угол обмахрился.

## Цифры (канон — сверять с кадрами)
План — **четыре тысячи двести** в день. Билет — **тридцать пять**. Порог безубыточности — **сто двадцать** человек. Мест в машине — **тринадцать**, возит до **двадцати двух**. Круг — **пятьдесят минут**, кругов в смене — **восемь**. Смена — **четырнадцать часов**. За проездной перевозчику компенсируют **девятнадцать** и через два месяца. Сцепление — **двадцать восемь тысяч** из своего. Зеркало о столб — **шесть тысяч**. Стаж за одиннадцать лет — **ноль дней**. Зина — вторник и пятница, **шесть десять**.

## Хронология
Девять лет — едешь этим же маршрутом стоя, с матерью (один бит внутри акта 2). Двадцать восемь — цех закрыли, первая смена. Двадцать девять — тридцать один — арифметика плана. Тридцать два — учишься читать остановку. Тридцать три — проездной, первое «мимо». Тридцать пять — Зина. Тридцать шесть — сцепление за свои. Тридцать семь — Мила на задней площадке; тогда же вступление. Тридцать восемь — две секунды на светофоре. Тридцать девять — комиссия, договор аренды, остановка.

## Структура (11 блоков, 200 кадров, 46 страниц)
1. **Акт 1 — Пятница, заклинившая дверь** (10, стр. 0–2) — вступление: ливень, полный салон, заклинившая дверь, отвёртка из-под сиденья; хук + CTA; Аркадий на конечной и новый план.
2. **Акт 2 — Двадцать восемь, цех закрыли** (18, стр. 3–6) — origin: замок на воротах цеха, первая смена помощником по маршруту, первая монета в коробку; внутри — один детский бит: в девять ты ехал этим маршрутом стоя.
3. **Акт 3 — План четыре двести** (18, стр. 7–10) — арифметика: билет тридцать пять, сто двадцать человек в ноль, круг пятьдесят минут; сдача плана в окошко будки.
4. **Акт 4 — Кто садится быстро** (18, стр. 11–14) — ты учишься читать остановку за секунду: наличные против проездного, ступенька, сдача с крупной.
5. **Акт 5 — Проездной: девятнадцать вместо тридцати пяти** (18, стр. 15–18) — экономика проездного и первое сознательное «проехал мимо».
6. **Акт 6 — Зина в шесть десять** (20, стр. 19–23) — ты знаешь их по именам, они знают твой номер; вторник ты берёшь её, в пятницу не останавливаешься.
7. **Акт 7 — Сцепление за двадцать восемь тысяч** (18, стр. 24–27) — машина не твоя, ремонт твой; яма в гараже, план идёт всё равно.
8. **Акт 8 — Мила на задней площадке** (20, стр. 28–31) — дочь садится на своей остановке и с задней площадки видит, как ты проезжаешь мимо.
9. **Акт 9 — Две секунды** (20, стр. 32–36) — выключился на светофоре с полным салоном, зеркало о столб, никто не заметил; ты ездишь ещё четыре месяца.
10. **Акт 10 — Комиссия и договор аренды** (20, стр. 37–40) — справку не продлили; в договоре аренды ни маршрута, ни машины, ни дня стажа.
11. **Финал — Остановка** (20, стр. 41–45) — ты под тем же навесом с проездным; твоя машина с новым водителем; кода к зрителю, финальный образ, дисклеймер.

## Шесть вертикалей 9:20 (tall_page)
Стр. 0 — Олег в рост в проёме заклинившей двери под стеной ливня (первый кадр фильма). Стр. 10 — Олег в рост в проходе полного салона снизу вверх. Стр. 19 — **Зина в рост одна под навесом остановки с тележкой**. Стр. 21 — Олег в рост у закрывающейся двери, рука на рычаге, и он не выходит. Стр. 33 — Олег в рост у столба, чиркнутое зеркало на уровне лица. Стр. 43 — **Олег в рост под тем же навесом с проездным в руке**. Последняя пара — намеренная рифма к стр. 19, ровно два раза.

## Правила VO (f5)
Одна фраза 10–24 слова (цель ~16), строчная первая буква, терминальная точка, числа словами. Имена собственные — с большой по правилам орфографии. Запрещены: «сорок» в любых формах, «стоил/стоило», «стоял» рядом с ценой, «понимаешь, что», «ловишь себя», «, и это», антропоморфизм, эпиграммы, мораль в теле фильма. «впервые» ≤3 на фильм, вразброс. Кросс-проектные формулировки других фильмов канала — проверять перед сдачей: совпадать может только дисклеймер и CTA. Ни страна, ни валюта не называются.

## Правило промптов (user 2026-08-25)
Позитив кадра обязан читаться как СОБЫТИЕ: камера → корпус → что делает руками с конкретным предметом → что от этого меняется в кадре → свет. «Стоит у рычага» — брак; «ведёт рычаг вниз, дверь идёт по направляющей и упирается на середине» — норма. Бюджет 55 слов не растёт: детальность берётся из выкинутых композиционных слов.',
  'youtube',
  'advertiser_safe',
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, big shiny eyes, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, state emblems, currency symbols, graphic violence, blood, gore, injured bodies, nudity, cigarettes, smoking, character reference sheet, plain studio backdrop, portrait crop',
  'blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, hyperrealistic, motion blur, warping, melted face, flicker, scene cut, sudden cut, identity change, anime character appearing, new people entering frame, extra humans',
  'he works with short precise movements of the hands, the same single figure throughout the shot, breathing and small weight shifts only, the rest of the frame holding still',
  'only ambient motion, drifting light and a slow shift of cold air, the place stays deserted, every surface and object holding its exact position',
  'f5',
  -- ttsVoiceoverId НАМЕРЕННО пустой. Голос назначается ТОЛЬКО через API:
  --   PUT /projects/<id>/tts/voiceover  {"voiceoverId": "<id голоса>"}
  -- потому что `assignToProject()` ставит ДВА поля — `ttsVoiceoverId` и
  -- `ttsVoiceRefPath` («Mirrors the shared filePath … so the render and gating
  -- code keep reading one field»). Синтез читает ИМЕННО путь. Запись одного
  -- `ttsVoiceoverId` сырым SQL даёт проект, который выглядит настроенным, а
  -- voice-clone на нём падает — так встали пять проектов (26.08.2026).
  -- Для minibus голос «Кузнецов» = d75884ae-d3f3-4c8a-94b6-35236e52a077.
  NULL,
  'realcomic_qwen',
  'narration',
  'i2v',
  'wan',
  0,
  false,
  now(), now()
);

-- ─────────────────────────────── КАСТ ───────────────────────────────
INSERT INTO characters (id, "projectId", code, "displayName", "createdAt") VALUES
 ('c0b00001-0000-4000-8000-000000000001','7e7e0000-0000-4000-8000-000000000001','OLEG','Oleg',now()),
 ('c0b00002-0000-4000-8000-000000000002','7e7e0000-0000-4000-8000-000000000001','ZHANNA','Zhanna',now()),
 ('c0b00003-0000-4000-8000-000000000003','7e7e0000-0000-4000-8000-000000000001','MILA','Mila',now()),
 ('c0b00004-0000-4000-8000-000000000004','7e7e0000-0000-4000-8000-000000000001','ARKADY','Arkady',now()),
 ('c0b00005-0000-4000-8000-000000000005','7e7e0000-0000-4000-8000-000000000001','ZINA','Zina',now());

INSERT INTO project_characters ("projectId", "characterId", "attachedAt")
SELECT '7e7e0000-0000-4000-8000-000000000001', id, now() FROM characters
WHERE "projectId" = '7e7e0000-0000-4000-8000-000000000001';

-- promptBase ≤35 слов: сложение → волосы → глаза → якорный предмет → одежда.
-- Цвет по коже не задаётся (Qwen красит его плоско), сигарет нет.
INSERT INTO character_profiles (id, "characterId", "profileCode", "ageLabel", "promptBase", "createdAt") VALUES
 ('d0c00001-0000-4000-8000-000000000001','c0b00001-0000-4000-8000-000000000001','OLEG_YOUNG','adult 28',
  'a twenty-eight-year-old man, broad shouldered and lean, dark ash-brown hair cropped short, grey eyes, a brass route-number badge pinned to his breast pocket, a grey quilted work jacket over a checked shirt', now()),
 ('d0c00002-0000-4000-8000-000000000002','c0b00001-0000-4000-8000-000000000001','OLEG_MID','adult 35',
  'a thirty-five-year-old man, heavy shoulders and a thickening waist, dark ash-brown hair cropped short, grey eyes with deep creases at the corners, a brass route-number badge pinned to his breast pocket, a navy fleece jacket', now()),
 ('d0c00003-0000-4000-8000-000000000003','c0b00001-0000-4000-8000-000000000001','OLEG_LATE','adult 39',
  'a thirty-nine-year-old man, heavy shoulders, greying at the temples, dark ash-brown hair cropped short, grey eyes with heavy lower lids, a brass route-number badge pinned to his breast pocket, a worn black softshell jacket', now()),
 ('d0c00004-0000-4000-8000-000000000004','c0b00002-0000-4000-8000-000000000002','ZHANNA_MID','adult 37',
  'a thirty-seven-year-old woman of average build, auburn hair gathered in a low knot, green eyes, a plastic shop badge on a coiled retractable cord at her waist, a maroon shop tunic over a cream blouse', now()),
 ('d0c00005-0000-4000-8000-000000000005','c0b00003-0000-4000-8000-000000000003','MILA_TEEN','teen 16',
  'a sixteen-year-old girl, slight and long-limbed, straight black hair to the shoulders, dark brown eyes, large padded headphones pushed down around her neck, an olive parka over a school sweatshirt', now()),
 ('d0c00006-0000-4000-8000-000000000006','c0b00004-0000-4000-8000-000000000004','ARKADY_MID','adult 52',
  'a fifty-two-year-old man, heavy and thick necked, grey hair combed straight back, light brown eyes, a zipped leather document folder carried under one arm, a black leather jacket over a polo shirt', now()),
 ('d0c00007-0000-4000-8000-000000000007','c0b00005-0000-4000-8000-000000000005','ZINA_OLD','adult 68',
  'a sixty-eight-year-old woman, small and stooped, white hair under a grey headscarf, pale blue eyes, a checked two-wheeled shopping trolley held by its handle, a brown wool coat with a worn collar', now());

-- ─────────────────────────── ЛОКАЦИИ ───────────────────────────
-- Место названо в ПЕРВОЙ клаузе: композер даёт локации 25 слов и режет хвост.
INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','terminus_lot','Конечная маршрута',
  'A minibus terminus on cracked asphalt at the edge of a housing district, six yellow minibuses nosed into a broken kerb, a plywood dispatcher booth with a sliding service window, oil-black puddles between the wheels, a bent metal board listing route numbers',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','minibus_cab','Кабина маршрутки',
  'The driver compartment of a yellow route minibus, a worn cloth seat under a beaded cover, a long gearshift rising from the floor, a lidless tin sweet box of coins wedged beside it, a stencilled route number on the inside of the windscreen',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','minibus_salon','Салон маршрутки',
  'The passenger salon of a route minibus, thirteen narrow seats in two rows under overhead grab handles, a rubber floor worn through along the aisle, a sliding side door dented on its inner skin, a rear platform where standing passengers hold the roof rail',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','stop_shelter','Остановка с навесом',
  'A bus shelter on a suburban avenue, a steel frame with two scratched plastic panels and a bench missing one slat, a timetable bleached blank behind cracked glass, a kerb worn into a dip by tyres, a long hospital wall across the road',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','factory_gate','Ворота закрытого цеха',
  'The gate of a closed machine shop, two steel leaves chained through a padlock, a painted works sign with letters missing, an empty guard cabin with a broken pane, weeds pushing through the loading apron, high shop windows with glass gone',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','flat_kitchen_ol','Кухня Олега и Жанны',
  'A small apartment kitchen, pale green wall tiles to shoulder height, a laminate table under the window with three stools, a gas stove with a kettle, a wall calendar with shift days ringed in ballpoint, the terminus far below through the glass',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','grocery_checkout','Касса продуктового',
  'A supermarket checkout lane, a short conveyor belt with a worn rubber surface, a card terminal on a swivel arm, racks of gum and batteries at the till, a chrome queue rail, hard even ceiling light on white floor tiles',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','garage_pit','Гаражный бокс с ямой',
  'A single garage bay with an inspection pit, a bare bulb hooked over the open pit mouth, a yellow minibus standing across it with one wheel off, tools laid out on a folded blanket, oil-dark concrete, a scrap-timber bench along the wall',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','dispatch_booth','Будка диспетчера',
  'The dispatcher booth at the terminus, a plywood counter behind a sliding window, a ruled shift sheet flattened under glass, a tin cash box and a hand-written list of route numbers on the wall, an electric heater under the counter',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','medcom_corridor','Коридор медкомиссии',
  'A medical commission corridor in a clinic, a row of chairs bolted to the wall, numbered consulting doors with paper signs taped on, a blood-pressure cuff on a trolley by the wall, scuffed linoleum, cold light from ceiling tubes',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','crossroads_light','Перекрёсток со светофором',
  'A four-way city crossroads with a traffic light on a bent post, four lanes of worn asphalt with faded stop lines, a kerb-side pole scarred at mirror height, shopfronts on the far corner, overhead wires crossing the junction',now(),now());

-- ─────────────────────────── ПРЕДМЕТЫ ───────────────────────────
INSERT INTO props (id, "projectId", code, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','COIN_TIN','the coin tin',
  'A rectangular tin sweet box with the lid long lost, the printed pattern rubbed off the rim, the bottom worn through the paint to bare metal, a shallow layer of small coins and folded notes inside, one dented corner',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','MINIBUS','the route minibus',
  'A yellow route minibus with a stencilled route number on the windscreen glass, the right sliding door dented low on its inner skin, a cracked plastic bumper, mud sprayed along the sills, a roof rail worn shiny above the rear platform',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','TRAVEL_PASS','the travel pass',
  'A cardboard travel pass in a clouded plastic sleeve on a perished elastic band, the printed month faded, one corner soft and furred from being pulled in and out, a thumbprint worn into the sleeve front',now(),now());

-- ─────────────────────────── СЦЕНЫ ───────────────────────────
INSERT INTO scenes (id, "projectId", "sceneKey", title, "sortOrder", "defaultTimeOfDay", "defaultVideoFlow", "createdAt") VALUES
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A1','Пятница, заклинившая дверь',0,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A2','Двадцать восемь, цех закрыли',1,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A3','План четыре двести',2,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A4','Кто садится быстро',3,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A5','Проездной: девятнадцать вместо тридцати пяти',4,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A6','Зина в шесть десять',5,'dawn','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A7','Сцепление за двадцать восемь тысяч',6,'night','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A8','Мила на задней площадке',7,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A9','Две секунды',8,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','A10','Комиссия и договор аренды',9,'day','i2v',now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','FIN','Остановка',10,'dawn','i2v',now());

-- ─────────────────────── БЛОКИ BGM (ACE-Step) ───────────────────────
-- Темп и тональность идут ПОЛЯМИ, не текстом промпта. shotIds заполняются
-- после посадки кадров, targetSeconds пересчитывается через API.
INSERT INTO narrative_blocks (id, "projectId", slug, title, "sortOrder", "moodPrompt", "shotIds", "targetSeconds", status, bpm, keyscale, timesignature, "createdAt", "updatedAt") VALUES
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_door','Акт 1 — Пятница, заклинившая дверь',0,
  'urgent industrial groove, tight kick and rim clicks, muted electric bass, wet metallic percussion, rain-soaked working tension, close dry mix, instrumental, no vocals','[]'::jsonb,0,'filling',104,'A minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_shop_closed','Акт 2 — Двадцать восемь, цех закрыли',1,
  'slow post-industrial lament, brushed snare, detuned upright piano, low sustained strings, empty workshop melancholy, wide room reverb, instrumental, no vocals','[]'::jsonb,0,'filling',68,'D minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_plan','Акт 3 — План четыре двести',2,
  'mechanical minimal pulse, dry drum machine, plucked bass ostinato, muted marimba figure, repetitive working arithmetic, tight clean mix, instrumental, no vocals','[]'::jsonb,0,'filling',96,'G minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_reading','Акт 4 — Кто садится быстро',3,
  'cold calculating groove, clipped closed hats, staccato synth bass, glassy bell stabs, quiet predatory focus, narrow stereo field, instrumental, no vocals','[]'::jsonb,0,'filling',100,'B minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_pass','Акт 5 — Проездной: девятнадцать вместо тридцати пяти',4,
  'sour resigned mid-tempo, soft kit with felted beater, muted guitar chords, low clarinet line, bureaucratic weariness, dusty analogue mix, instrumental, no vocals','[]'::jsonb,0,'filling',84,'E minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_zina','Акт 6 — Зина в шесть десять',5,
  'tender restrained theme, no drums, solo cello over a sustained pad, sparse piano notes, quiet human dignity, warm intimate mix, instrumental, no vocals','[]'::jsonb,0,'filling',62,'F minor','3',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_clutch','Акт 7 — Сцепление за двадцать восемь тысяч',6,
  'grinding garage blues, heavy shuffle drums, dirty bass, tremolo guitar, oily mechanical fatigue, mid-heavy mix, instrumental, no vocals','[]'::jsonb,0,'filling',88,'A minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_daughter','Акт 8 — Мила на задней площадке',7,
  'quiet devastating swell, soft toms, muted piano, high sustained strings entering late, shame seen from behind, spacious mix, instrumental, no vocals','[]'::jsonb,0,'filling',72,'C minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_two_seconds','Акт 9 — Две секунды',8,
  'suspended dread, drums only in the last third, low pulsing drone, dissonant string harmonics, one struck bell, held-breath tension, wide dark mix, instrumental, no vocals','[]'::jsonb,0,'filling',58,'Bb minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_commission','Акт 10 — Комиссия и договор аренды',9,
  'hollow institutional march, thin snare, cold electric piano, bowed bass, paperwork finality, dry corridor reverb, instrumental, no vocals','[]'::jsonb,0,'filling',76,'G minor','4',now(),now()),
 (gen_random_uuid()::text,'7e7e0000-0000-4000-8000-000000000001','bgm_finale','Финал — Остановка',10,
  'spare closing elegy, no drums, single acoustic guitar figure, distant sustained strings, cold air and small metal ambience, resigned quiet, natural room, instrumental, no vocals','[]'::jsonb,0,'filling',60,'D minor','4',now(),now());

-- ─────────────────── СТРАНИЦЫ ВЁРСТКИ (46, чётно) ───────────────────
INSERT INTO comic_pages (id, "projectId", "pageIndex", "templateId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, '7e7e0000-0000-4000-8000-000000000001', idx, tpl, now(), now()
FROM (VALUES
 (0,'tall_page_left'),(1,'wide_narrows4'),(2,'duo_wide'),
 (3,'bands_squares_mid'),(4,'narrows3_land2'),(5,'land_sq_squares'),(6,'duo_wide'),
 (7,'land2_narrows3'),(8,'talls_flank_squares'),(9,'wide_top_trio'),(10,'tall_page_right'),
 (11,'squares_hero_land'),(12,'bands_squares_mid'),(13,'narrows3_land2'),(14,'duo_wide'),
 (15,'land_sq_squares'),(16,'land2_narrows3'),(17,'trio_wide_bottom'),(18,'narrows3_land2'),
 (19,'tall_page_left'),(20,'hero_land_squares'),(21,'tall_page_right'),(22,'talls_flank_squares'),(23,'land_sq_squares'),
 (24,'sq_land_squares'),(25,'land2_narrows3'),(26,'wide_narrows4'),(27,'land_sq_squares'),
 (28,'wide_top_trio'),(29,'bands_squares_mid'),(30,'narrows3_land2'),(31,'land_sq_squares'),
 (32,'wide_narrows4'),(33,'tall_page_left'),(34,'talls_flank_squares'),(35,'hero_land_squares'),(36,'duo_wide'),
 (37,'land2_narrows3'),(38,'squares_hero_land'),(39,'bands_squares_mid'),(40,'land_sq_squares'),
 (41,'hero_land_squares'),(42,'bands_squares_mid'),(43,'tall_page_right'),(44,'land_sq_squares'),(45,'duo_wide')
) AS p(idx, tpl);

COMMIT;
