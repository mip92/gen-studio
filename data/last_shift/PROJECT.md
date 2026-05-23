# PROJECT: last_shift — Последний рейс

Авторский короткий метр на собственном AI-пайплайне ComfyUI + gen-studio.
Преемник `night_courier`. Чинит главные ошибки предшественника:
монотонный фрейминг, разжёванная мораль, монохромная палитра, длинная
проповедь во 2-м лице.

**Slug**: `last_shift`
**Project folder**: `E:/ComfyUI/gen-studio/data/last_shift/`
**Длина**: ~200 шотов × 5 сек = ~17 минут (как night_courier по длительности)
**Жанр**: тихая драма с депрессивной атмосферой и катартической развязкой
**Стандарт драматургии**: 5-актная пирамида Фрейтага + биты Snyder/Field

---

## 0. HARD RULES (из feedback memory — нельзя нарушать)

| Правило | Источник |
|---|---|
| Поля БД (prompt, narration) — только английский | `feedback_db_english_only` |
| **Никакого hires-fix на single-character LoRA шотах** — single-pass | `feedback_sdxl_hires_burns_lora` |
| Negative prompt: веса ≤ 1.3; не использовать `motion blur`, `out of focus`, `plastic skin`, `(token:1.5+)` | `feedback_negative_prompt_weights` |
| Никаких regional / ComfyCouple / LoRA-Hooks для 2-char шотов. Использовать **SingleWithBack** (1 LoRA + 2-й персонаж со спины через текст) | `feedback_two_lora_disabled` |
| GPU-джобы только через `PipelineQueueService` (Prisma job row + tick()). Никогда не спавнить Python/CUDA из HTTP-хэндлеров | `feedback_all_gpu_jobs_through_queue` |
| Florence-2 — только captioning датасета, не auto-prompt шотов | `feedback_florence2_dataset_only` |
| Не ставить GPU-джобы без явного "запусти/поставь/render" от пользователя | `feedback_no_unsolicited_gpu_jobs` |
| **Никогда 2 одинаковых ракурса подряд.** Минимум 8 типов плана в ротации. 15% B-roll без людей | `feedback_shot_variety` |
| **Видео для YouTube** — соблюдать монетизационные гайдрейлы (см. секцию 0.1) | пользователь, явное требование |

---

## 0.1 YouTube safety / монетизация

Видео идёт на YouTube → нельзя триггерить advertiser-friendly violations
(monetization yellow icon / age-gate / takedown).

| Запрещено в кадре и в VO | Почему |
|---|---|
| **Самоубийство, попытки, методы, обсуждение** | YouTube self-harm policy — мгновенная демонетизация / удаление |
| Self-harm любой формы (порезы, удары) | то же |
| Графические травмы, кровь, открытые раны | violence policy |
| Реалистичные смерти в кадре | sensitive content |
| Сексуальное / откровенная нагота | adult content |
| Наркотики, употребление, паранефалия | drugs policy |
| Алкоголь как героизация (распитие крупно) | borderline; избегать |
| Реальные бренды и логотипы (RZD, McDonald's, etc) | trademark + commercial |
| Свастика, экстремистская символика, реальные политические символы | hate / political |
| Криминальная инструкция (взлом, оружие made step-by-step) | harmful & dangerous |

### Sensitive, но допустимо если тактично

| Тема | Как обработать |
|---|---|
| Смерть ребёнка (бэкстори проводницы) | **только обиняком**: пустая сова, кольцо на цепочке, взгляд в окно — никогда визуально, никогда в VO словами |
| Болезнь (жар у девочки) | температура, обморок ОК; никакой крови, никаких медицинских деталей |
| Аварии / экстренное торможение | звук, тряска ОК; никаких разорванных тел, никаких реальных столкновений |
| Ветеран войны | ордена generic, без свастики/Z/V/реальных конфликтов; никаких боевых флешбэков с насилием |
| Развод / семейный конфликт | ссора без оскорблений в VO, без физического насилия |
| Бедность | ОК тонко, без жалости-порно |

### Принципы безопасного storytelling

- **Implication, не depiction**: тяжёлые события **намекаются**, не показываются
- **Метафора > буквализм**: туман, пустое сиденье, недопитый чай — вместо «вот что случилось»
- **Тишина > слова**: если беда — лучше молчание и B-roll, чем VO с разъяснением
- **Catalyst всегда внешний и нейтральный**: болезнь, погода, опоздание — не насилие, не суицид, не криминал

---

---

## 1. Героиня — Проводница (новая LoRA `CONDUCTOR_BASE`)

Тренируется аналогично `FATHER_BASE` (см. `night_courier/datasets/FATHER_BASE/`).
Датасет: 30–40 кадров на белом фоне в разных ракурсах (см. ниже).

### Внешность (lock-in для датасета)

| Параметр | Значение |
|---|---|
| Возраст | 38–42 |
| Волосы | dark blonde, mid-length, low bun under cap |
| Глаза | grey-green |
| Кожа | natural pores, slight under-eye shadows, no makeup |
| Телосложение | medium, slightly slender |
| Особая примета | thin scar above left eyebrow (lock identity for LoRA) |

### Гардероб (один на весь фильм)

| Слой | Описание |
|---|---|
| Китель | dark navy conductor jacket, single shoulder stripe, brass buttons, no real-world logos |
| Под кителем | white shirt collar, plain |
| Низ | navy trousers, simple |
| Головной убор | navy cap with generic cockade (no insignia text) |
| Перчатки | thin grey wool, fingerless |
| Обувь | low black boots |

### Реквизит (story props)

| Предмет | Когда появляется | Сюжет |
|---|---|---|
| Кожаный держатель билетов на поясе | S01–S05 | повседневная деталь |
| Компостер (ticket punch) | S01 | посадка |
| Фонарь | S02, S04 | ночные обходы |
| Кружка-стакан в подстаканнике, без логотипа | S02–S04 | iconic frames |
| **Обручальное кольцо на цепочке под кителем** | revealed in S03 CU | сюжетный reveal — у неё был муж |
| Заявление об уходе в кармане | S01 (ECU), S05 (она его оставляет) | сюжет |

### Готовый prompt-блок героини (paste-ready)

```
CONDUCTOR_BASE, female train conductor, late 30s, dark blonde low bun
under navy cap, grey-green tired eyes, thin scar above left eyebrow,
natural skin pores, no makeup, dark navy uniform jacket with one
shoulder stripe and brass buttons, white shirt collar, grey fingerless
wool gloves
```

### Негатив для героини (paste-ready, weights ≤ 1.3)

```
(plastic:1.2), (oversmooth:1.2), (cartoon:1.2), (anime:1.3),
makeup, lipstick, jewelry on hands, modern logos, text on uniform,
young woman, child face
```

---

## 2. 8 пассажиров (без LoRA, через IP-Adapter FaceID)

**Стратегия**: 1 референсный портрет на пассажира (сгенерить один раз на Flux),
прикалывать к шотам через IP-Adapter FaceID v2 или PuLID. Seed внутри
виньетки фиксированный. См. секцию 9 «Pipeline».

Файлы рефов: `E:/ComfyUI/gen-studio/data/last_shift/reference/passengers/`

| # | Slug | Архетип | Купе/место | Шотов | Роль в сюжете |
|---|---|---|---|---|---|
| 1 | `military` | Военный, 30, в форме без знаков | СВ, один | 18 | молчание = зеркало проводницы |
| 2 | `mother_baby` | Молодая мать, 25, с младенцем | плацкарт нижняя | 20 | то, кем проводница не стала |
| 3 | `bride` | Невеста, 24, в спортивках, платье в чехле висит | СВ | 22 | проводница в молодости |
| 4 | `businessman` | Мужчина 45, ноутбук, рубашка | купе | 16 | **comic relief** |
| 5 | `veteran` | Дед-фронтовик, 80+, ордена, везёт пирог | купе | 20 | образ отца |
| 6 | `couple_fight` | Пара 30+, ссора, потом примирение | купе | 22 | бывший брак проводницы |
| 7 | `musician` | Парень 22, гитара | плацкарт | 18 | iconic frame акта 2 |
| 8 | `child_girl` | Девочка 7 лет, одна, плюшевая сова | купе с проводницей рядом | 30 | **спина сюжета** |

Сумма виньеток: **166 шотов**. Остальные 34 — шоты проводницы, B-roll, экстерьер.

### Reference-portrait prompts (сгенерить один раз на Flux, paste-ready)

Каждый промпт даёт **один портрет 3/4 в полу-нейтральной обстановке** —
из него IP-Adapter дальше берёт лицо. Использовать Flux dev FP8,
1024×1024, CFG 3.5, 28 steps, без LoRA.

```text
[passenger_01_military.png]
30 year old man in plain dark green military shirt without insignia,
short brown buzzcut, tired hollow cheeks, sharp jawline, brown eyes
with thousand-yard stare, three-quarter portrait, soft window light,
neutral grey background, photorealistic, 50mm lens, natural skin

[passenger_02_mother_baby.png]
25 year old woman holding sleeping infant against shoulder, long dark
hair loose, no makeup, slight under-eye shadow, simple cream cardigan,
gentle tired smile, three-quarter portrait, warm window light,
neutral grey background, photorealistic, 50mm

[passenger_03_bride.png]
24 year old woman with light brown hair in messy ponytail, no makeup,
grey hoodie and joggers, holding white garment bag with wedding dress
visible through plastic, red-rimmed eyes, three-quarter portrait,
cold afternoon window light, neutral grey background, photorealistic

[passenger_04_businessman.png]
45 year old man in rumpled white dress shirt, loosened dark tie, gold
wedding ring, salt-pepper hair receding, glasses pushed up on head,
laptop visible in lap, expression of mild defeat, three-quarter
portrait, harsh overhead light, neutral grey background, photorealistic

[passenger_05_veteran.png]
80 year old man in dark wool blazer with three rows of medals (generic,
no readable text), bald head with thin white side hair, deep wrinkles,
clear pale blue eyes, calloused hands resting on cane, three-quarter
portrait, warm afternoon window light, neutral grey background

[passenger_06a_couple_man.png]
33 year old man with short dark hair and trimmed beard, navy sweater,
crossed arms, looking off-camera with jaw set, three-quarter portrait,
cold window light, neutral grey background, photorealistic

[passenger_06b_couple_woman.png]
32 year old woman with auburn hair in low ponytail, oversized grey
turtleneck, sitting hunched with arms around knees, red eyes, looking
down, three-quarter portrait, cold window light, neutral grey
background, photorealistic

[passenger_07_musician.png]
22 year old man with messy dark curly hair, denim jacket over white
tee, acoustic guitar across knees, gentle absent-minded smile, three-
quarter portrait, warm late afternoon window light, neutral grey
background, photorealistic

[passenger_08_child_girl.png]
7 year old girl with brown shoulder length hair, light blue cardigan
over white tee, holding worn plush owl with one button eye missing,
solemn dark eyes, three-quarter portrait, soft diffused light, neutral
grey background, photorealistic, natural child proportions
```

---

## 3. Мир / сеттинг

| Параметр | Значение |
|---|---|
| Тип состава | дальний пассажирский поезд (плацкарт + купе + СВ) |
| Длительность маршрута | 2 дня (1-я ночь → день → 2-я ночь → утро) |
| **Названий городов нет** | На станциях — только цифры платформ, столбы, фонари. Никаких табличек |
| **Эпоха** | размытая, около-современная: телефоны есть, но используются мало; одежда вне моды; технологии не подсвечены. Никаких визуальных «2026» |
| Бренды | никаких; всё generic |
| Язык табличек/билетов | без текста, либо размытые символы |
| Погода | S01 — закат осенний; S02 — ясная ночь; S03 — солнечный день; S04 — снежный заряд; S05 — туманное утро |

### Tokens для пейзажа (paste-ready)

```
nameless rural train route, generic eastern european landscape, no
city names, no logos, no text on signs, ambiguous era, blurred
station signs, plain platform numbers only
```

---

## 4. Сюжет — 5 актов, бит-лист

### Логлайн
Проводница в свой **последний рейс** наблюдает 8 пассажиров — каждый
оказывается фрагментом её несбывшейся жизни. Ночью второго дня
у одинокой девочки поднимается температура между станциями. Проводница
тянет стоп-кран — спасает девочку, теряет работу, выходит из поезда
в туманное поле и впервые за много лет — на свободу.

### S01 — Экспозиция / Setup (25 шотов)
**Beat**: Opening Image → Theme Stated → Setup → Catalyst

- SH01–04: ECU билета, ECU compostera, MS перрон, WS перрон в свете натрия
- SH05: CU лица проводницы — измотанное
- SH06: ECU **конверт заявления об уходе** в кармане кителя (плот-крючок)
- SH07–18: посадка 8 пассажиров (1–2 шота на каждого, в основном WS/MS)
- SH19: **CU девочки** одна с совой — последняя зашла
- SH20: проводница ставит компостер на её билет, наклон головы
- SH21–23: поезд трогается — EWS дрон через стрелки, ECU колесо стартует, WS платформа уходит
- SH24: BACK проводница в коридоре уходит вглубь вагона
- SH25: EWS поезд в осеннем закате через поле — переход

### S02 — Развитие / Rising Action (55 шотов)
**Beat**: Fun & Games + B-Story

Виньетки: военный (15) → мать с младенцем (12) → невеста (14) → бизнесмен (10).
Между ними B-roll (4 шота): ночь через окно, проводница идёт по коридору.

Эмоциональный максимум — ночная сцена с матерью, которая укачивает
в коридоре. Проводница останавливается, не говорит, смотрит, идёт дальше.

### S03 — Поворот / Midpoint (50 шотов)
**Beat**: Midpoint twist → B-story crosses A-story

Виньетки: дед-фронтовик (15) → пара после ссоры (18) → музыкант (12).
B-roll (5): день за окном, чай в подстаканнике, лампа коридора.

**КЛЮЧЕВОЙ ШОТ — середина акта**: проводница приносит девочке чай,
видит у неё **ту же плюшевую сову**, что была у её дочери.
ECU совы → CU лица проводницы → BACK проводница уходит из купе.
Здесь впервые **открывается кольцо на цепочке** под кителем.

### S04 — Кульминация / Climax (45 шотов)
**Beat**: Bad Guys Close In → All Is Lost → Dark Night of the Soul → Break into Three

- Вторая ночь. Снежный заряд за окном.
- Проводница обходит вагон, заглядывает к девочке — лоб горячий
- CU термометра (ECU цифр нет — генерик жидкость в трубке)
- Поезд между станциями (EWS снежный лес)
- Проводница в тамбуре. ECU руки на стоп-кране. CU лица.
- **Тянет.** Звук тормозов.
- Пассажиры просыпаются — нарезка CU/MCU всех 7-х (по 1 шоту каждый)
- Скорая по снегу на рассвете (EWS дрон)
- Девочку забирают живой. ECU плюшевой совы на носилках
- Проводница смотрит вслед. BACK в утреннем тумане

### S05 — Развязка / Resolution (25 шотов)
**Beat**: Final Image

- Пустое купе. ECU китель аккуратно сложен на сиденье.
- ECU **заявление об уходе** на кителе сверху
- ECU кольцо на цепочке — она оставляет его рядом
- WS пустая платформа без названия в тумане
- BACK проводница идёт в лес. **Без VO, только ветер и снег**
- EWS поезд трогается без неё
- Внутри: коридор, новая проводница — моложе, ещё не уставшая
- Final image: её лицо CU, она проходит мимо купе девочки. Купе пустое.
- Cut to black

---

## 5. Палитра по актам (lighting + tokens)

| Акт | Палитра | Hex anchors | Lighting tokens |
|---|---|---|---|
| S01 | оранжевый натрий + холодный синий неба | `#E89B4A` + `#3F5266` | `sodium vapor platform lights, cool autumn sky, golden hour fading, warm-cool contrast` |
| S02 ночь | ламповый янтарь + индиго окно | `#C58A3E` + `#1A2540` | `interior tungsten corridor lamps, deep indigo night window, warm interior cold exterior, soft falloff` |
| S03 день | холодный белый + берёзовый зелёный | `#D8E1E5` + `#7E8F4F` | `cold daylight through window, intermittent strobing through birch trees, high key, slight overcast` |
| S04 ночь 2 | тёмный изумруд штор + белый снег | `#1F3A30` + `#E8EDF1` | `dark green curtain shadows, snow blizzard outside window, harsh emergency yellow flashlight, dutch tilts allowed` |
| S05 утро | молочный розовый + туман | `#E6CFC8` + `#C8C9C4` | `milky pink dawn, low fog rolling over field, diffused soft light, ethereal, no shadows` |

---

## 6. Ракурсы — таксономия и квоты

| Код | План | Доля | Квота из 200 | Прим. |
|---|---|---|---|---|
| EWS | Extreme Wide / экстерьер | 8% | 16 | дрон, поезд через пейзаж |
| WS | Wide / полный рост | 12% | 24 | коридор, тамбур |
| MS | Medium / по пояс | 18% | 36 | купе, действия |
| MCU | Medium Close-Up / грудь | 15% | 30 | разговоры |
| CU | Close-Up / лицо | 12% | 24 | эмоция |
| ECU | Extreme Close-Up / деталь | 10% | 20 | предметы, глаз |
| OTS | Over-the-Shoulder | 8% | 16 | диалоги, проводница смотрит |
| BACK | Со спины / силуэт | 10% | 20 | изоляция, прощания |
| Прочее (POV, Dutch) | | 7% | 14 | специальные |

**Правила сборки shotlist**:
- Никогда 2 одинаковых кода подряд
- В каждой 5-шотовой группе минимум 4 разных кода
- Минимум 1 ECU на каждые 8 шотов (B-roll или iconic detail)
- Минимум 1 BACK на каждые 10 шотов

### Углы и движение

| Тип | Когда |
|---|---|
| Eye-level | базовый |
| Low-angle | дед, военный (сильнее проводницы) |
| High-angle | девочка, мать с младенцем (уязвимее) |
| Dutch tilt | только S04 (кульминация) |
| Track lateral | соединительные шоты коридора |
| Window POV | переходы между виньетками |
| Locked-off с движением в кадре | спящие пассажиры, поезд качает |

---

## 7. Iconic frames — обязательный список

Минимум 8 кадров, специально снятых под скриншот / превью.

| # | Акт | Описание |
|---|---|---|
| 1 | S01 | ECU **компостер пробивает билет девочки** — последний билет рейса |
| 2 | S02 | BACK проводница в коридоре, лампы уходят перспективой, силуэт |
| 3 | S02 | OTS мать укачивает младенца у окна ночью, проводница в дверях |
| 4 | S03 | ECU **подстаканник с чаем** на бегущем фоне берёз — Тарковский-style |
| 5 | S03 | MS музыкант с гитарой в тамбуре, против лампы, контровой |
| 6 | S03 | ECU **плюшевая сова** у девочки + reveal CU проводницы |
| 7 | S04 | ECU рука проводницы на **стоп-кране**, костяшки белые |
| 8 | S04 | EWS дрон — **поезд стоит** в снежном поле на рассвете, скорая по дороге |
| 9 | S05 | WS пустая платформа, проводница уходит в туман **со спины** |

---

## 8. B-roll каталог (34 шота без людей)

Распределение: S01=4, S02=8, S03=10, S04=8, S05=4.

### S01 (4)
- EWS дрон: поезд через осенние поля на закате
- ECU табло платформы — только цифры
- ECU билет в держателе
- WS пустой коридор вагона перед посадкой

### S02 (8)
- EWS поезд под звёздным небом
- ECU колесо на стыке, ночью
- WS коридор с лампами уходящими в перспективу
- ECU подстаканник качается
- WS тамбур, дверь полуоткрыта
- POV из окна: тёмные поля, редкие огни
- ECU занавеска купе колышется
- ECU часы проводницы

### S03 (10)
- EWS дрон: поезд через берёзовый лес
- ECU чашка чая с лимоном
- WS коридор в дневном свете
- POV окно: стробоскоп берёз
- EWS река под мостом — поезд сверху
- ECU полотенце на крючке
- WS тамбур с открытой дверью, поля
- ECU ложка в стакане
- POV окно: деревня без людей с одной собакой
- ECU табличка купе (без номера)

### S04 (8)
- EWS поезд через снежный заряд
- POV окно: снег косой стеной
- ECU термометр (без цифр)
- WS тамбур, проводница у стоп-крана (силуэт)
- ECU стоп-кран в полумраке
- EWS дрон: поезд встал в поле, рассвет
- WS снежный лес по обе стороны путей
- ECU следы скорой на снегу

### S05 (4)
- WS пустая платформа в тумане
- ECU китель сложен на сиденье + конверт сверху
- ECU кольцо на цепочке на ткани
- EWS дрон: туманное поле, фигура уходит в лес

---

## 9. Pipeline mapping

| Тип шота | Workflow | Особенности |
|---|---|---|
| Проводница одна, MS/CU/MCU | `scene_single_character_api.json` (single-pass, no hires) | LoRA `CONDUCTOR_BASE` |
| Проводница + 1 пассажир | **SingleWithBack**: 1 LoRA + 2-й со спины в тексте | НЕ regional, НЕ ComfyCouple |
| Пассажир один, MS/CU/MCU | `scene_single_character_api.json` + **IP-Adapter FaceID v2** path | референс из `reference/passengers/passenger_NN_*.png` |
| Экстерьер / B-roll | `scene_environment_flux_api.json` | без LoRA, без IP-Adapter |
| Iconic ECU (предметы) | `scene_environment_flux_api.json` + product-style prompt | low CFG |
| Видео 5 сек | `video_wan22_i2v_api.json` | image-to-video, 24fps × 5s |
| Upscale финал | `video_upscale_4x_api.json` | один раз на финале |

### Изменения, которые надо сделать в workflow до старта

1. **Добавить IP-Adapter FaceID ветку** в `scene_single_character_api.json` (опциональная, переключается флагом `useIpAdapter: true` в `promptFields`). Reference path берётся из `referenceImagePool`.
2. **Добавить тип шота `back_of_character`** в `scene-job.types.ts` — для BACK-шотов проводницы (LoRA активна, но prompt описывает спину, чтобы не было «второго лица»).
3. **Расширить `promptFields` схему**: `shotType` (EWS/WS/MS/MCU/CU/ECU/OTS/BACK), `cameraAngle` (eye/low/high/dutch), `cameraMove` (static/track/push/window_pov).

---

## 10. Prompt templates (paste-ready)

Все позитивные промпты должны явно содержать `shotType` токены и
`cameraAngle` токены — это самое важное для ракурсного разнообразия.

### Heroine, MS, eye-level, day (S03)
```
positive:
CONDUCTOR_BASE, medium shot waist-up, eye level, three-quarter view,
dark navy conductor uniform jacket with shoulder stripe and brass
buttons, navy cap, dark blonde low bun, grey-green tired eyes, thin
scar above left eyebrow, walking down train corridor, cold daylight
through window, birch trees strobing past in background, natural
skin pores, photorealistic, 35mm lens, shallow depth of field

negative:
(plastic:1.2), (oversmooth:1.2), (cartoon:1.2), (anime:1.3),
makeup, lipstick, modern logos, text on uniform, child face,
duplicate, deformed hands
```

### Heroine, BACK shot, S04 night
```
positive:
CONDUCTOR_BASE seen from behind, full body, low angle, dark navy
uniform jacket and cap, walking away into train vestibule, hand on
emergency brake handle visible at frame edge, dark green curtain
shadows, flashlight beam cutting through, snow visible through small
window, photorealistic, 35mm lens

negative: same negative block as above
```

### Passenger CU with IP-Adapter (mother_baby, S02 night)
```
positive (with IP-Adapter ref = passenger_02_mother_baby.png):
close-up face, eye level, young woman 25, holding sleeping infant
against shoulder, long dark hair loose, no makeup, gentle tired smile,
warm tungsten corridor light from above, deep indigo train window
behind, photorealistic, 50mm lens, natural skin

negative: same negative block + (young woman blonde:1.2)
```

### B-roll ECU подстаканник
```
positive:
extreme close-up, vintage metal tea glass holder on small folding
table, dark tea inside, slice of lemon, slight rim of condensation,
window beyond out of focus showing strobing birch trees, cold daylight,
photorealistic product macro, 100mm lens, very shallow depth of field

negative: text, logos, modern branding, plastic look
```

### EWS дрон, S04 кульминация
```
positive:
extreme wide aerial shot, slow dawn light, single passenger train
stopped on tracks in middle of snowy forest, ambulance with flashing
blue lights approaching on parallel road, no city in view, low fog,
muted dawn pink and snow blue palette, photorealistic, cinematic
aerial, anamorphic widescreen

negative: city skyline, modern logos, text, (motion blur:1.2)
```

---

## 10.5 Где что лежит в БД (после миграции `add_cinematic_fields`)

| Сущность в БД | Что хранит для last_shift | Заполнено |
|---|---|---|
| `projects.scriptText` | Полный сценарий (logline + 8-актный синопсис + char-bios) в Markdown | ✓ |
| `projects.targetPlatform` | `youtube` | ✓ |
| `projects.safetyTier` | `advertiser_safe` | ✓ |
| `scenes.narrationText` | Per-act VO summary RU (8 строк) | ✓ |
| `scenes.actBeat` | Snyder beat (`setup`, `rising`, `midpoint_twist`, `climax`, `final_image`) | ✓ |
| `scenes.defaultPaletteKey` | Палитра акта (`A1_sodium`, …) | ✓ |
| `scenes.defaultTimeOfDay` | Время суток акта | ✓ |
| `shots.promptFields` | JSONB с ключами: `positive`, `negative`, `positiveSdxl`, `lightingMood`, `narrativeBeat`, `storyFunction`, `camera`, `location`, `continuity`, `production`, `workflowParams`, `frameDescription`, `positiveTemplate` (бэкап с `{TOKEN}` для re-resolution), `isBroll`, `isIconic` | ✓ резолвлено |
| `shots.narrationText` | Per-shot VO RU (4 шота: A1_SH20, A7_SH35, A8_SH17, A8_SH30) | ✓ |
| `shots.shotType` / `cameraAngle` / `cameraMove` | first-class columns для квот | ✓ |
| `shots.storyBeat` / `narrativeFunction` / `vignetteSlug` | first-class columns для сюжета | ✓ |
| `shots.isBroll` / `isIconic` / `timeOfDay` / `paletteKey` | first-class columns для атмосферы | ✓ |
| `shots.referenceProfileId` | profileCode строкой: `CONDUCTOR_BASE` / `PAX_MIL` / `PAX_MOM` / … / NULL для B-roll | ✓ |
| `shots.referenceImagePool` | JSON array путей к референсам (conductor — 5 файлов из датасета, пассажиры — 1 файл, couple_fight — 2 файла) | ✓ |
| `shots.workflowRouteKey` | `conductor_solo` (63) / `passenger_ip` (87) / `environment` (50) | ✓ |
| `characters` + `character_profiles` | 10 персонажей; CONDUCTOR с LoRA-ready промптом (base/angles/variety), 9 пассажиров с `useIpAdapter=TRUE` | ✓ |
| `shot_participants` | 164 строки (1 на каждого персонажа в каждом шоте, 14 шотов couple_fight × 2 = +14 для PAX_SHE) | ✓ |
| `workflow_templates` | 5 templates: `env_flux`, `char_lora_sdxl`, `char_lora_hires`, `char_ipadapter`, `video_wan22` | ✓ |
| `workflow_routes` + `workflow_route_steps` | 3 routes: `conductor_solo` → `char_lora_sdxl`, `passenger_ip` → `char_ipadapter`, `environment` → `env_flux` | ✓ |

### CharacterProfile.CONDUCTOR_BASE — содержимое
- `promptBase` (436 char) — identity-lock tokens, одна строка
- `promptAngles` (3260 char, 32 строки) — lab-shots на нейтральном фоне для LoRA training
- `promptVariety` (5212 char, 42 строки) — environmental scenes (train corridor, vestibule, crew compartment, platform, fog, без формы) для разнообразия датасета
- `negative` (718 char) — strong negative с anti-glamour и anti-text токенами
- `triggerToken` = `CONDUCTOR_BASE`
- `targetImages` = 40
- `useIpAdapter` = FALSE
- `loraPath` = NULL → заполнить после обучения LoRA

### CharacterProfile passenger-profiles — содержимое
- `promptBase` — короткое описание для IP-Adapter ref-генерации
- `useIpAdapter` = TRUE
- `loraPath` = NULL (никогда не будет)
- референс лежит в `referenceImagePool` через `Shot` или в `reference_assets` (когда сгенеришь файлы)

---

## 11. Файлы и нейминг

```
data/last_shift/
├── PROJECT.md                       <- этот файл
├── reference/
│   ├── conductor_dataset/           <- 40 кадров для LoRA CONDUCTOR_BASE
│   └── passengers/
│       ├── passenger_01_military.png
│       ├── passenger_02_mother_baby.png
│       ├── passenger_03_bride.png
│       ├── passenger_04_businessman.png
│       ├── passenger_05_veteran.png
│       ├── passenger_06a_couple_man.png
│       ├── passenger_06b_couple_woman.png
│       ├── passenger_07_musician.png
│       └── passenger_08_child_girl.png
├── datasets/
│   └── CONDUCTOR_BASE/              <- по образцу night_courier/datasets/FATHER_BASE
├── comfy/                           <- workflow JSONы (копировать из night_courier и патчить)
├── scenes/
│   ├── scene_01_setup/
│   ├── scene_02_rising/
│   ├── scene_03_midpoint/
│   ├── scene_04_climax/
│   └── scene_05_resolution/
├── shots/                           <- генерируется через gen-studio
├── bgm/
├── finish/
└── exports/
```

### Shot code convention

`S{act}_SH{NN}` — например `S03_SH27`.
В БД — `shotCode` уникален в рамках project; формат идентичен night_courier.

### Scene keys

```
scene_01_setup
scene_02_rising
scene_03_midpoint
scene_04_climax
scene_05_resolution
```

---

## 12. Когда генерируем shotlist — алгоритм

1. Для каждого акта — взять beat-лист (секция 4)
2. Распределить виньетки пассажиров по актам (секция 2, колонка «Шотов»)
3. Вставить B-roll шоты (секция 8) — между виньетками
4. Назначить каждому шоту `shotType` из таксономии (секция 6) с проверкой квот
5. Назначить `cameraAngle` и `cameraMove`
6. Привязать к палитре акта (секция 5) — токены lighting/colour
7. Привязать сюжетный beat (секция 4) — что несёт этот шот
8. Сгенерить positive/negative prompt из шаблонов (секция 10)
9. Записать в БД через gen-studio API

Финальный CSV формата:
`shotCode | act | beat | shotType | cameraAngle | cameraMove | who | action | palette | promptPositive | promptNegative | iconic | bRoll | narrationText`

---

## 13. Audio / VO стратегия

В отличие от night_courier — **минимум VO**.
- VO только в S01 (20 сек интро от 1-го лица, голос проводницы) и S05 (10–15 сек, эпилог).
- Внутри S02–S04 — **тишина или диегетический звук** (колёса, чайник, дыхание, бубнёж радио в гарнитуре).
- 1–2 момента «голос пассажира» — без подзаголовков, мимолётно.
- BGM — отдельная история, по образцу `seed_bgm_night_courier.ts`, тоже 5 блоков, тональность от тёплого ностальгического до тревожного и обратно к катартическому.

---

## 14. Статус и что осталось

### Сделано (в БД)
- ✓ Project `last_shift` создан, scriptText заполнен (4286 char)
- ✓ 8 актов как `Scene` с `actBeat`, `defaultPaletteKey`, `defaultTimeOfDay`, `narrationText`
- ✓ 200 шотов с полным `promptFields` (резолвленным, без `{TOKEN}`), `shotType`, `cameraAngle`, `cameraMove`, `storyBeat`, `narrativeFunction`, `vignetteSlug`, `isBroll`, `isIconic`, `timeOfDay`, `paletteKey`
- ✓ 4 шота с per-shot `narrationText` (VO)
- ✓ 10 characters + 10 character_profiles (1 LoRA-ready + 9 IP-Adapter)
- ✓ CONDUCTOR_BASE с FATHER_BASE-level промптами (base + 32 angles + 42 variety + strong negative, `targetImages=40`)
- ✓ 164 shot_participants
- ✓ 5 workflow_templates + 3 workflow_routes + steps
- ✓ shots ↔ LoRA/IP-Adapter связаны через `referenceProfileId` + `referenceImagePool` + `workflowRouteKey`

### Осталось вне БД (на пользователе)
- [ ] Положить ComfyUI JSON-файлы в `data/last_shift/comfy/` (пути зарегистрированы в `workflow_templates` — скопируй из `data/night_courier/comfy/` и допили IP-Adapter ветку)
- [ ] Собрать датасет 30-40 кадров для `CONDUCTOR_BASE` (промпты в `character_profiles.promptBase/promptAngles/promptVariety` — `data/last_shift/datasets/CONDUCTOR_BASE/`)
- [ ] Обучить LoRA → записать путь в `character_profiles.loraPath` для CONDUCTOR_BASE
- [ ] Сгенерить 9 reference-портретов пассажиров на Flux (промпты в `PROJECT.md §2`) → положить в `data/last_shift/reference/passengers/`

### Открытые вопросы
- [ ] Катализатор кульминации — жар у девочки (текущий) или менять (ранние роды у матери, обморок деда, пожар без жертв)?
- [ ] BGM-палитра — оставляем Black Mesa или Sigur Rós / Nils Frahm minimalism?
- [ ] Что с девочкой в финале — мы видим её ещё раз (окно больницы) или просто исчезает после скорой?
- [ ] Бэкстори проводницы (мёртвая дочь) — оставляем обиняком (сова, кольцо) или убираем (чисто «выгорание»)?
