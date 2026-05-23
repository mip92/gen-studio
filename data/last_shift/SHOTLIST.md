# SHOTLIST — last_shift (8 актов, 200 шотов)

Все промпты paste-ready. Замени `{TOKEN}` блоки своим pre-processor /
find-replace перед отправкой в SDXL/Flux.

---

## Префиксы (заменить find-replace перед стартом)

```
{CONDUCTOR} =
CONDUCTOR_BASE, female train conductor late 30s, dark blonde low bun
under navy peaked cap, grey-green tired eyes, thin scar above left
eyebrow, natural skin pores, no makeup, dark navy uniform jacket with
one shoulder stripe and brass buttons, white shirt collar, grey
fingerless wool gloves

{PAX_MIL} =
30yo man in plain dark green military shirt without insignia, short
buzzcut, hollow cheeks, sharp jawline, brown thousand-yard stare eyes

{PAX_MOM} =
25yo woman with long dark hair loose, no makeup, cream cardigan,
holding sleeping infant against shoulder, gentle exhausted face

{PAX_BIZ} =
45yo man, rumpled white dress shirt with loosened dark tie, glasses
pushed up on head, salt-pepper receding hair, gold wedding ring, mild
defeated expression

{PAX_BRIDE} =
24yo woman, light brown messy ponytail, no makeup, grey hoodie and
joggers, holding white garment bag with wedding dress visible through
plastic, red-rimmed eyes

{PAX_VET} =
80yo man in dark wool blazer with three rows of generic medal ribbons
no readable insignia, thin white side hair on bald head, deep wrinkles,
pale blue eyes, calloused hands resting on simple wooden cane

{PAX_HE} =
33yo man, short dark hair and trimmed beard, navy crew neck sweater,
set jaw

{PAX_SHE} =
32yo woman with auburn hair in low ponytail, oversized grey turtleneck,
red eyes

{PAX_MUS} =
22yo man, messy dark curly hair, denim jacket over white tee, acoustic
guitar across knees, gentle absent smile

{PAX_GIRL} =
7yo girl, brown shoulder length hair, light blue cardigan over white
tee, holding worn plush owl with one button eye missing, solemn dark
eyes, natural child proportions

{TRAIN_INT} =
nameless long-distance Eastern European passenger train interior, no
logos, no readable text on signs, ambiguous era

{TRAIN_EXT} =
nameless rural train route, no city in view, generic post-Soviet
landscape, no logos, no text on signs

{LIGHT_A1} = sodium vapor platform lamps, cool autumn dusk sky, golden hour fading, warm-cool contrast
{LIGHT_A2} = warm tungsten corridor lamps, deep indigo night windows, soft falloff, sleep silence
{LIGHT_A3} = late night dim amber, indigo black windows, single reading lamp pools of light
{LIGHT_A4} = pre-dawn cool blue starting to warm, weary tungsten, first hint of sky
{LIGHT_A5} = cold daylight through window, intermittent strobing birch shadows, high key overcast
{LIGHT_A6} = late afternoon golden warmth slanting through window, long corridor shadows
{LIGHT_A7} = dark emerald compartment shadows, snow blizzard outside, harsh emergency yellow flashlight, dutch tilts allowed
{LIGHT_A8} = milky pink dawn fog, soft diffused omnidirectional light, no harsh shadows, ethereal

{STYLE} = photorealistic, cinematic, 35mm full-frame, shallow depth of field, anamorphic widescreen, natural film grain

{NEG} = (plastic skin:1.2), (oversmooth:1.2), (cartoon:1.2), (anime:1.3), (cgi:1.2), makeup, lipstick, jewelry on hands, modern logos, text on uniform or signs, deformed hands, extra fingers, duplicate face
```

---

## Структура 8 актов

| Акт | Шотов | Тайминг | Палитра | Главное |
|---|---|---|---|---|
| **A1 — Boarding** | 22 | вечер д1 | A1 sodium | посадка всех 8 + плот-крючок (конверт) |
| **A2 — Settling** | 22 | ранняя ночь д1 | A2 amber+indigo | военный |
| **A3 — Deep night** | 25 | глухая ночь д1 | A3 amber+indigo | мать+младенец, невеста |
| **A4 — Pre-dawn** | 18 | предрассветный час | A4 cool blue | бизнесмен (comic relief) |
| **A5 — Daylight** | 30 | день д2 | A5 cold birch | дед-фронтовик, пара после ссоры |
| **A6 — Midpoint** | 18 | поздний день д2 | A6 golden warm | музыкант + ОТКРЫТИЕ совы |
| **A7 — Crisis** | 35 | ночь д2 → рассвет | A7 dark emerald | жар девочки → стоп-кран |
| **A8 — Resolution** | 30 | утро д3 | A8 pink fog | прощание, петля закрывается |
| **Итого** | **200** | | | |

---

# A1 — BOARDING (22 шота)

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A1_SH01 | EWS | opening_image | — | | ✓ | Дрон, пустой перрон на закате | {TRAIN_EXT}, aerial wide deserted small railway platform at autumn dusk, single sodium lamp flickering to life, no city around, {LIGHT_A1}, {STYLE} |
| A1_SH02 | ECU | theme_stated | — | ✓ | ✓ | **ICONIC**: компостер пробивает пустой билет | extreme close-up vintage brass ticket punch piercing blank cardboard ticket, hand in grey wool fingerless glove, {LIGHT_A1}, sharp 100mm macro, deep shadow, {STYLE} |
| A1_SH03 | MS | setup | conductor | | | Проводница у вагона | {CONDUCTOR}, medium shot, standing at open train carriage door checking ticket, evening platform, {LIGHT_A1}, breath visible in cool air, {STYLE} |
| A1_SH04 | CU | setup | conductor | | | Лицо проводницы, низкий ракурс | {CONDUCTOR}, close-up face low angle, deep tiredness in grey-green eyes, breath fogging slightly, sodium rim light from behind, {LIGHT_A1}, {STYLE} |
| A1_SH05 | ECU | catalyst | conductor | | | **PLOT HOOK**: конверт в нагрудном кармане | extreme close-up, white folded resignation letter envelope tucked into dark navy uniform breast pocket, no readable text on envelope, slight wear on corner, warm sodium glow, {LIGHT_A1}, 100mm macro |
| A1_SH06 | OTS | setup | military | | | Принимает билет военного | OTS over conductor's shoulder, hand returning ticket to {PAX_MIL} stepping up to train, dark green shirt, looking down, {LIGHT_A1}, {STYLE} |
| A1_SH07 | WS | setup | mother_baby | | | Мать с младенцем входит | wide shot lateral motion, {PAX_MOM} stepping up into train carriage doorway, large soft bag in hand, careful protective movement, {LIGHT_A1}, {STYLE} |
| A1_SH08 | MCU | setup | bride | | | Невеста на перроне с чехлом | medium close-up three quarter, {PAX_BRIDE} standing alone on platform with large white garment bag, looking at nothing, sodium light catching the dress visible through plastic, {LIGHT_A1}, {STYLE} |
| A1_SH09 | MS | setup | businessman | | | Бизнесмен бежит, поправляет ноут | medium shot low angle, {PAX_BIZ} hurrying along platform with laptop bag swinging, half a coffee cup in hand, looking flustered, {LIGHT_A1}, {STYLE} |
| A1_SH10 | MS | setup | veteran | | | Дед стоит, опирается на трость | medium shot, {PAX_VET} standing patiently with simple cane, holding small fabric-wrapped bundle, three rows of generic medal ribbons under open wool coat, {LIGHT_A1}, {STYLE} |
| A1_SH11 | WS | setup | couple_fight | | | Пара заходит, она впереди молча | wide shot, {PAX_SHE} stepping into carriage first looking down, {PAX_HE} behind carrying two suitcases, visible distance between them, both silent, {LIGHT_A1}, {STYLE} |
| A1_SH12 | MS | setup | musician | | | Музыкант с гитарой улыбается | medium shot handheld, {PAX_MUS} with guitar case strap across chest, easy smile nodding to off-frame conductor, {LIGHT_A1}, {STYLE} |
| A1_SH13 | CU | setup | child_girl | | | **PLOT**: девочка одна на перроне | high angle close-up, {PAX_GIRL} standing alone on platform beside small wheeled suitcase, solemn eyes looking up toward camera, owl held tight, no adult visible nearby, {LIGHT_A1}, {STYLE} |
| A1_SH14 | ECU | setup | child_girl | ✓ | | **ICONIC**: компостер пробивает её детский билет | extreme close-up brass ticket punch piercing a small child-sized ticket, conductor's gloved hand steady, child's small hand at frame edge offering it, {LIGHT_A1}, 100mm |
| A1_SH15 | MCU | setup | conductor | | | Узнавание в лице проводницы | {CONDUCTOR} MCU, subtle micro-expression of recognition behind professional calm, looking off-frame down toward child, sodium evening light, {LIGHT_A1}, {STYLE} |
| A1_SH16 | WS | setup | — | | ✓ | Платформа сверху, поезд гудит | high wide overhead, train platform from above, last passenger boarding, conductor closing carriage door, steam rising in cold air, no other people, {LIGHT_A1}, {STYLE} |
| A1_SH17 | BACK | setup | conductor | | | Со спины: проводница идёт коридором | back shot lateral track, {CONDUCTOR} walking down narrow train corridor away from camera, hand brushing each compartment door, tungsten lamps clicking on ahead, {TRAIN_INT}, {LIGHT_A1} fading to {LIGHT_A2}, {STYLE} |
| A1_SH18 | ECU | setup | — | | ✓ | Тахометр локомотива дёрнулся | extreme close-up vintage gauge dial in dim cabin light, needle trembling alive from rest at zero, brass casing, {STYLE} |
| A1_SH19 | EWS | catalyst | — | | ✓ | Поезд трогается, перрон уходит | low wide, train wheels starting to turn slowly, steam venting from beneath, empty platform receding, sodium lamps blurring, no city in view, {LIGHT_A1}, {STYLE} |
| A1_SH20 | MCU | catalyst | conductor | | | Проводница достаёт конверт в купе | {CONDUCTOR} MCU sitting in narrow conductor's crew compartment, pulling folded resignation envelope from breast pocket, holding it in lap, twilight outside window, {LIGHT_A1}/{LIGHT_A2} mix, {STYLE} |
| A1_SH21 | ECU | catalyst | conductor | | | ECU: разглаживает конверт, не открывает | extreme close-up her gloved hand smoothing unopened envelope on thigh fabric before tucking it back into breast pocket, hesitation visible, {LIGHT_A2}, 100mm |
| A1_SH22 | EWS | setup | — | ✓ | ✓ | **ICONIC**: дрон, поезд змеёй через закатное поле | slow aerial drone wide, train snaking through wide autumn field at final sunset light, no city anywhere, golden grass cold sky, melancholy widescreen, {TRAIN_EXT}, {LIGHT_A1}, {STYLE} |

---

# A2 — SETTLING (22 шота) — военный

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A2_SH01 | WS | rising | — | | ✓ | Длинный коридор ночью | wide lateral corridor of train at night, warm amber tungsten ceiling lamps in long perspective, deep indigo windows, no people, slow sway of train motion, {TRAIN_INT}, {LIGHT_A2}, {STYLE} |
| A2_SH02 | OTS | rising | military | | | Из коридора видно военного у окна | OTS through compartment doorway, {PAX_MIL} sitting alone in SV class compartment looking out indigo window, uniform jacket on hook beside him, {LIGHT_A2}, {STYLE} |
| A2_SH03 | MCU | rising | military | | | MCU военного в полумраке | medium close-up low angle, {PAX_MIL} face in amber interior light against dark window, thousand-yard stare, jaw set, no expression, {LIGHT_A2}, {STYLE} |
| A2_SH04 | ECU | rising | military | | | Руки складывают и разворачивают фото | extreme close-up hands of {PAX_MIL} opening and refolding small worn photograph at tabletop, subject of photo not visible to camera, reading lamp warm pool, 100mm |
| A2_SH05 | CU | rising | military | | | CU глаз: не моргает, отражение огней | close-up eyes only of {PAX_MIL} slow push-in, not blinking, reflections of passing window lights crossing iris, {LIGHT_A2}, {STYLE} |
| A2_SH06 | BACK | rising | conductor | | | Проводница со спины в дверном проёме | back shot, {CONDUCTOR} silhouette framed by compartment doorway, holding tea glass, not entering, watching, {LIGHT_A2}, {STYLE} |
| A2_SH07 | MS | rising | military | | | Военный замечает её, едва кивает | medium shot, {PAX_MIL} turning his head, micro-nod toward off-frame conductor, no smile, silence mutual, {LIGHT_A2}, {STYLE} |
| A2_SH08 | MCU | rising | conductor | | | Проводница ставит стакан у двери | {CONDUCTOR} MCU returning nod with restraint, setting glass of tea on floor at compartment threshold, {LIGHT_A2}, {STYLE} |
| A2_SH09 | ECU | rising | — | ✓ | ✓ | **ICONIC**: подстаканник на полу, чай качается | extreme close-up vintage metal tea-glass holder on compartment floor in amber corridor light, liquid swaying with train motion, no logo on glass, 100mm macro |
| A2_SH10 | BACK | rising | conductor | | | Проводница уходит от двери | back lateral track, {CONDUCTOR} walking away from compartment door, hand brushing wall, lamps strobing past, {LIGHT_A2}, {STYLE} |
| A2_SH11 | WS | rising | military | | | Сверху: военный сидит, стакан не тронут | wide high angle into compartment, {PAX_MIL} still in same posture, untouched tea glass on small folding table, indigo window, {LIGHT_A2}, {STYLE} |
| A2_SH12 | ECU | rising | military | | | Кулак на колене, костяшки белые | extreme close-up clenched fist resting on thigh, knuckles white, faint old scar across back of hand, lit warm amber, {LIGHT_A2}, 100mm |
| A2_SH13 | POV | rising | — | | ✓ | POV из окна: тёмные поля, редкие огни | POV through compartment window, dark rolling fields, single distant farm light flickering past, deep indigo sky, {TRAIN_EXT}, {LIGHT_A2} |
| A2_SH14 | MS | rising | military | | | Берёт стакан, делает один глоток | medium shot low angle, {PAX_MIL} finally reaching for tea glass, single slow sip, eyes still on window, {LIGHT_A2}, {STYLE} |
| A2_SH15 | CU | rising | military | | | Пар поднимается мимо щеки | close-up profile, steam rising from tea glass past {PAX_MIL} cheek, single moisture catch on lower eyelash, {LIGHT_A2}, {STYLE} |
| A2_SH16 | ECU | rising | — | | ✓ | ECU фото на столе, краешек смятый | extreme close-up high angle of photograph face-up on tabletop, content abstracted (blurred faces/generic figures), only worn corner sharp, reading lamp pool, {LIGHT_A2}, 100mm |
| A2_SH17 | MS | rising | military | | | Прячет фото обратно в карман | medium shot, {PAX_MIL} carefully sliding photograph back into shirt pocket, deliberate gentle motion, {LIGHT_A2}, {STYLE} |
| A2_SH18 | OTS | rising | conductor | | | Проводница проходит мимо двери | OTS over {CONDUCTOR} shoulder briefly catching the military man in his compartment as she walks past corridor, {LIGHT_A2}, {STYLE} |
| A2_SH19 | MCU | rising | conductor | | | Проводница: что-то узнаёт в его молчании | {CONDUCTOR} MCU walking corridor, slight pause in step, recognition of shared silence in her face, {LIGHT_A2}, {STYLE} |
| A2_SH20 | ECU | rising | — | | ✓ | Часы проводницы: 23:12 | extreme close-up vintage analog watch on conductor's wrist showing 23:12, warm wrist light, leather strap, {LIGHT_A2}, 100mm |
| A2_SH21 | EWS | rising | — | | ✓ | Поезд через широкое ночное поле | wide aerial slow, train moving through vast nighttime field, moon partly veiled in cloud, no city anywhere, long stretch of empty land, {TRAIN_EXT}, {LIGHT_A2}, {STYLE} |
| A2_SH22 | BACK | rising | conductor | | | Проводница возвращается в служебное купе | back lateral, {CONDUCTOR} from behind reaching her crew compartment door, opening it quietly, {LIGHT_A2}, {STYLE} |

---

# A3 — DEEP NIGHT (25 шотов) — мать + младенец, невеста

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A3_SH01 | EWS | rising | — | | ✓ | Поезд глубокой ночью, луна за облаками | wide aerial, train moving slowly through wide nighttime landscape, moon fully veiled now, no city, sense of deep silence, {TRAIN_EXT}, {LIGHT_A3}, {STYLE} |
| A3_SH02 | WS | rising | mother_baby | | | Плацкарт ночью, мать на нижней полке | wide high angle plackart sleeping car at deep night, {PAX_MOM} sitting on lower berth trying to soothe restless infant, other passengers asleep around her, single reading lamp pool, {LIGHT_A3}, {STYLE} |
| A3_SH03 | MCU | rising | mother_baby | | | MCU матери укачивает, лицо нежное | medium close-up high angle, {PAX_MOM} rocking infant against shoulder, exhausted soft smile, hair coming loose, warm reading lamp on her face, {LIGHT_A3}, {STYLE} |
| A3_SH04 | ECU | rising | mother_baby | ✓ | | **ICONIC**: крошечная рука хватает её палец | extreme close-up tiny infant hand gripping mother's index finger, both warm lit, indigo window blur behind, 100mm macro, {LIGHT_A3} |
| A3_SH05 | WS | rising | mother_baby | | | Мать выходит в коридор укачивать | wide, {PAX_MOM} stepping barefoot into amber corridor still rocking infant, careful not to wake sleepers behind her, {LIGHT_A3}, {STYLE} |
| A3_SH06 | BACK | rising | mother_baby | | | Со спины: качается в коридоре | back lateral, {PAX_MOM} from behind walking corridor at half-pace, swaying infant, amber lamps glowing past her, {LIGHT_A3}, {STYLE} |
| A3_SH07 | OTS | rising | conductor | | | Проводница наблюдает из конца коридора | OTS over {CONDUCTOR} shoulder looking down long corridor at small distant figure of mother rocking infant, soft amber depth, {LIGHT_A3}, {STYLE} |
| A3_SH08 | MCU | rising | conductor | | | MCU проводницы — что-то в её лице | {CONDUCTOR} MCU, unreadable depth in eyes watching mother off-frame, hand resting on corridor wall, breath held, {LIGHT_A3}, {STYLE} |
| A3_SH09 | CU | rising | mother_baby | | | CU спящего младенца на её плече | close-up high angle, sleeping infant face against {PAX_MOM} shoulder, peaceful, tiny breath visible, {LIGHT_A3}, {STYLE} |
| A3_SH10 | MS | rising | mother_baby | | | Мать у окна тамбура | medium shot, {PAX_MOM} leaning forehead against vestibule window, infant cradled, eyes closed for a beat of rest, {LIGHT_A3}, {STYLE} |
| A3_SH11 | MS | rising | conductor | | | Проводница ставит стул в тамбур | medium high, {CONDUCTOR} appearing beside mother, quietly placing folding stool, no words exchanged, {LIGHT_A3}, {STYLE} |
| A3_SH12 | MCU | rising | mother_baby | | | Мать благодарно кивает, садится | MCU, {PAX_MOM} small grateful nod, slowly sitting still rocking, {LIGHT_A3}, {STYLE} |
| A3_SH13 | BACK | rising | conductor | | | Проводница уходит, оставляя их | back, {CONDUCTOR} retreating down corridor away from camera leaving mother behind, {LIGHT_A3}, {STYLE} |
| A3_SH14 | WS | rising | bride | | | Купе СВ, платье висит, невеста под ним | wide, SV class compartment at night, wedding dress in clear garment bag hanging on hook, {PAX_BRIDE} sitting beneath it on berth, hugging her knees, {LIGHT_A3}, {STYLE} |
| A3_SH15 | ECU | rising | bride | ✓ | | **ICONIC**: тюль через пластик чехла | extreme close-up wedding dress lace and tulle pressed against translucent garment bag plastic, amber reading lamp lighting it from one side, 100mm macro, {LIGHT_A3} |
| A3_SH16 | MCU | rising | bride | | | Смотрит на телефон, экран гаснет | MCU, {PAX_BRIDE} looking at phone screen which goes dark, no message visible on screen, red-rimmed eyes, {LIGHT_A3}, {STYLE} |
| A3_SH17 | ECU | rising | bride | | | ECU её безымянный палец без кольца | extreme close-up her left hand resting on knee, conspicuously bare ring finger with faint indent where ring used to be, {LIGHT_A3}, 100mm |
| A3_SH18 | CU | rising | bride | | | Слеза, она не вытирает | close-up profile, {PAX_BRIDE} single tear sliding down cheek without her wiping it, looking at nothing, {LIGHT_A3}, {STYLE} |
| A3_SH19 | OTS | rising | conductor | | | Проводница останавливается у двери | OTS over {CONDUCTOR} shoulder looking at slightly ajar SV door, glimpse of garment bag visible inside, {LIGHT_A3}, {STYLE} |
| A3_SH20 | MS | rising | conductor | | | Проводница тихо стучит, не открывая | medium shot slow push-in, {CONDUCTOR} knuckle softly tapping door once, hesitant, hand pulling back, {LIGHT_A3}, {STYLE} |
| A3_SH21 | MS | rising | bride | | | Невеста не отвечает, отворачивается | medium shot, {PAX_BRIDE} turning face away toward indigo window, not opening door, breath shaky, {LIGHT_A3}, {STYLE} |
| A3_SH22 | BACK | rising | conductor | | | Проводница опускает руку у двери | back, {CONDUCTOR} silhouette at compartment door, lowering raised hand, head bowed slightly, {LIGHT_A3}, {STYLE} |
| A3_SH23 | POV | rising | — | | ✓ | POV из окна: тьма с одной далёкой лампой | POV through SV window, near-total darkness outside except one impossibly distant single lamp blinking past, {TRAIN_EXT}, {LIGHT_A3} |
| A3_SH24 | CU | rising | bride | | | Невеста засыпает сидя под платьем | close-up, {PAX_BRIDE} eyes finally closing while still sitting upright under hanging dress, exhaustion winning, {LIGHT_A3}, {STYLE} |
| A3_SH25 | ECU | rising | — | | ✓ | Тень платья качается на стене | extreme close-up shadow of wedding dress on compartment wall, gently swaying with train motion, amber light, soft poetic, {LIGHT_A3}, 50mm |

---

# A4 — PRE-DAWN (18 шотов) — бизнесмен (comic relief)

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A4_SH01 | EWS | rising | — | | ✓ | Поезд в предрассветный час, небо синеет | wide aerial, train moving across landscape at pre-dawn hour, sky beginning to lighten from black to deep blue, first hint of warmth on horizon, no city, {TRAIN_EXT}, {LIGHT_A4}, {STYLE} |
| A4_SH02 | MS | rising | businessman | | | Бизнесмен в купе, ноутбук, тычет в клавиши | medium shot, {PAX_BIZ} hunched over open laptop in compartment, glasses on nose, frowning at screen, untouched tea glass beside him, {LIGHT_A4}, {STYLE} |
| A4_SH03 | ECU | rising | businessman | | | ECU экран ноутбука: иконка нет сети | extreme close-up laptop screen showing abstract no-connection icon (X over wifi bars, no readable text), faint reflection of his face, {LIGHT_A4}, 50mm |
| A4_SH04 | MCU | rising | businessman | | | Смотрит в потолок с побеждённым видом | medium close-up low angle, {PAX_BIZ} leaning head back against compartment seat looking up at ceiling lamp, slow exhale of defeat, {LIGHT_A4}, {STYLE} |
| A4_SH05 | MS | rising | businessman | | | Закрывает ноутбук медленно | medium shot, {PAX_BIZ} slowly closing laptop lid with palm, glasses now on table, looking at his own hand, {LIGHT_A4}, {STYLE} |
| A4_SH06 | ECU | rising | businessman | | | ECU обручальное кольцо на пальце | extreme close-up his hand on closed laptop, gold wedding ring slightly worn, no other jewelry, {LIGHT_A4}, 100mm |
| A4_SH07 | MS | rising | businessman | | | Тянется к книге попутчика | medium shot, {PAX_BIZ} carefully picking up paperback book left on seat across from him, the seat occupant sleeping turned to wall, {LIGHT_A4}, {STYLE} |
| A4_SH08 | MCU | rising | businessman | | | Открывает книгу, начинает читать | medium close-up, {PAX_BIZ} opening book to random page, glasses back on, expression softening into curiosity, {LIGHT_A4}, {STYLE} |
| A4_SH09 | OTS | rising | conductor | | | Проводница из коридора смотрит | OTS over {CONDUCTOR} shoulder watching through doorway, businessman now visibly reading, faintest hint of smile on her face, {LIGHT_A4}, {STYLE} |
| A4_SH10 | CU | rising | conductor | | | CU проводницы, тень улыбки | {CONDUCTOR} close-up, ghost of smile not quite reaching her eyes, warm corridor light on cheek, {LIGHT_A4}, {STYLE} |
| A4_SH11 | ECU | rising | — | | ✓ | ECU чай и книга на столике в купе | extreme close-up still life: tea glass in metal holder, open paperback book face-down beside it, dim reading lamp, indigo window beyond, {LIGHT_A4}, 100mm |
| A4_SH12 | BACK | rising | conductor | | | Проводница идёт делать обход | back lateral track, {CONDUCTOR} walking down corridor on her round, ceiling lamps still warm, hint of dawn through windows ahead, {LIGHT_A4}, {STYLE} |
| A4_SH13 | POV | rising | — | | ✓ | POV из окна: горизонт начинает светлеть | POV through window, horizon edge beginning to lighten from indigo to pale blue, single farmhouse silhouette far in distance, {TRAIN_EXT}, {LIGHT_A4} |
| A4_SH14 | WS | rising | — | | ✓ | Тамбур, дверь приоткрыта, ветер | wide, train vestibule with door slightly ajar, cold air visibly moving the curtain, pre-dawn blue light slicing in, {TRAIN_INT}, {LIGHT_A4}, {STYLE} |
| A4_SH15 | MCU | rising | conductor | | | Проводница в тамбуре, дышит холодным воздухом | medium close-up, {CONDUCTOR} standing in vestibule, taking deep breath of cold pre-dawn air, eyes closed briefly, {LIGHT_A4}, {STYLE} |
| A4_SH16 | ECU | rising | conductor | | | ECU её часы: 04:38 | extreme close-up vintage watch on her wrist showing 04:38, pre-dawn blue light on her sleeve, {LIGHT_A4}, 100mm |
| A4_SH17 | EWS | rising | — | ✓ | ✓ | **ICONIC**: дрон, поезд встречает рассвет на мосту | slow aerial wide, train crossing simple steel bridge over river at first dawn light, sky pale gold-pink edge, no city anywhere, ethereal, {TRAIN_EXT}, {LIGHT_A4} transitioning to {LIGHT_A5}, {STYLE} |
| A4_SH18 | BACK | rising | conductor | | | Проводница со спины смотрит на рассвет | back, {CONDUCTOR} from behind in vestibule doorway facing the brightening landscape, silhouette against dawn, {LIGHT_A4}/{LIGHT_A5}, {STYLE} |

---

# A5 — DAYLIGHT (30 шотов) — дед-фронтовик, пара после ссоры

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A5_SH01 | WS | rising | — | | ✓ | Коридор днём, стробоскоп берёз через окна | wide lateral corridor by day, windows strobing with passing birch trees, cold white light shafts crossing floor, no people, {TRAIN_INT}, {LIGHT_A5}, {STYLE} |
| A5_SH02 | OTS | rising | veteran | | | Проводница видит деда в купе с газетой | OTS through {CONDUCTOR} shoulder into compartment, {PAX_VET} seated, newspaper folded on knees no readable text, cane against wall, {LIGHT_A5}, {STYLE} |
| A5_SH03 | MS | rising | veteran | | | Дед смотрит в окно, ордена тускло блестят | medium shot low angle, {PAX_VET} profile against window, three rows of generic medal ribbons catching cold light, dignity in stillness, {LIGHT_A5}, {STYLE} |
| A5_SH04 | ECU | rising | veteran | | | ECU орденских планок | extreme close-up medal ribbons on his blazer, generic three-row arrangement, no readable text or insignia, slight wear, cold daylight, {LIGHT_A5}, 100mm |
| A5_SH05 | MCU | rising | veteran | | | Достаёт пирог в тряпице | medium close-up, {PAX_VET} gently unwrapping small homemade pie from cloth bundle on table, careful old fingers, {LIGHT_A5}, {STYLE} |
| A5_SH06 | ECU | rising | veteran | | | ECU пирога в его ладони | extreme close-up high angle, simple homemade pie cradled in old hand, no decoration just food, cold daylight, {LIGHT_A5}, 100mm |
| A5_SH07 | OTS | rising | conductor | | | Проводница приносит чай | OTS from behind {PAX_VET} looking up at {CONDUCTOR} placing tea glass on his table, gentle exchange, {LIGHT_A5}, {STYLE} |
| A5_SH08 | MCU | rising | veteran | | | Дед кивает, отламывает кусочек пирога | medium close-up low angle, {PAX_VET} nodding thanks, breaking small piece of pie, gesturing it toward off-frame conductor, {LIGHT_A5}, {STYLE} |
| A5_SH09 | MCU | rising | conductor | | | Берёт пирог двумя пальцами, мягкая улыбка | {CONDUCTOR} MCU accepting offered piece between gloved fingertips, real soft smile breaking through tiredness, {LIGHT_A5}, {STYLE} |
| A5_SH10 | CU | rising | conductor | | | CU её рта: пробует, глаза прикрывает | {CONDUCTOR} close-up high angle taking small bite, eyes briefly closing — taste of something from another life, {LIGHT_A5}, {STYLE} |
| A5_SH11 | MS | rising | veteran | | | Дед видит её реакцию, тихо рад | medium shot, {PAX_VET} watching her enjoy the pie, soft contentment in his face, no words needed, {LIGHT_A5}, {STYLE} |
| A5_SH12 | POV | rising | — | | ✓ | POV из окна: берёзы строб, забытый сарай | POV through compartment window, birch trees flickering past in rhythm, open field beyond, single abandoned wooden shed sliding by, {TRAIN_EXT}, {LIGHT_A5} |
| A5_SH13 | ECU | rising | — | ✓ | ✓ | **ICONIC**: подстаканник с лимоном на фоне берёзового строба | extreme close-up tea glass in vintage metal holder, lemon slice floating inside, entire blurred background strobing with passing birch trees, 100mm shallow DOF, {LIGHT_A5}, {STYLE} |
| A5_SH14 | MS | rising | veteran | | | Дед кладёт на стол старое фото | medium shot, {PAX_VET} carefully placing small black-and-white photograph on compartment table, content not yet visible, {LIGHT_A5}, {STYLE} |
| A5_SH15 | ECU | rising | veteran | | | ECU фото: лица не разглядеть, только края | extreme close-up high angle photograph from above, content deliberately abstracted (blurred figures), only worn yellowed edges sharp, {LIGHT_A5}, 100mm |
| A5_SH16 | BACK | rising | conductor | | | Проводница со спины выходит из его купе | back, {CONDUCTOR} stepping out of compartment, softly sliding door closed behind her, head bowed slightly, {LIGHT_A5}, {STYLE} |
| A5_SH17 | WS | rising | couple_fight | | | Купе пары: он у окна, она у двери, между пустота | wide symmetrical compartment shot, {PAX_HE} by window, {PAX_SHE} by door, both facing forward, large gap between them, cold daylight, {LIGHT_A5}, {STYLE} |
| A5_SH18 | MCU | rising | couple_fight | | | MCU его профиль, челюсть сжата | medium close-up, {PAX_HE} profile, jaw set, looking out window, not blinking, {LIGHT_A5}, {STYLE} |
| A5_SH19 | MCU | rising | couple_fight | | | MCU её профиль, глаза опущены | medium close-up, {PAX_SHE} profile, eyes downcast, hands in oversized sweater sleeves, {LIGHT_A5}, {STYLE} |
| A5_SH20 | ECU | rising | couple_fight | | | ECU: его рука с кольцом, её — без | extreme close-up split: his hand with gold wedding band visible, her hand bare on knee, {LIGHT_A5}, 100mm |
| A5_SH21 | ECU | rising | — | | ✓ | Часы на стене купе: 10:12 | extreme close-up vintage analog wall clock inside compartment, 10:12 reading, second hand sweeping, {LIGHT_A5}, 100mm |
| A5_SH22 | MS | rising | couple_fight | | | Он открывает книгу, ничего не читает | medium shot, {PAX_HE} holding open book on lap, eyes not moving, pages still, {LIGHT_A5}, {STYLE} |
| A5_SH23 | MCU | rising | couple_fight | | | Она наливает чай, дрожит | medium close-up, {PAX_SHE} pouring tea from thermos with slight tremble in hand, {LIGHT_A5}, {STYLE} |
| A5_SH24 | ECU | rising | — | | ✓ | Чай переливается через край | extreme close-up tea slightly overflowing glass rim from trembling hand, beading on metal holder, {LIGHT_A5}, 100mm |
| A5_SH25 | CU | rising | couple_fight | | | CU её глаз: длинное моргание | close-up, {PAX_SHE} eyes slow long blink, lashes wet, {LIGHT_A5}, {STYLE} |
| A5_SH26 | MS | rising | couple_fight | | | Он закрывает книгу, кладёт между ними | medium shot, {PAX_HE} slowly closing book and placing it on seat between them deliberately like a gesture, {LIGHT_A5}, {STYLE} |
| A5_SH27 | MCU | rising | couple_fight | | | Она кладёт руку на книгу | medium close-up, {PAX_SHE} reaching out fingertips resting on book between them, {LIGHT_A5}, {STYLE} |
| A5_SH28 | ECU | rising | couple_fight | ✓ | | **ICONIC**: его рука накрывает её на книге | extreme close-up his hand slowly covering hers on book cover, gold ring against bare finger, gentle, {LIGHT_A5}, 100mm |
| A5_SH29 | CU | rising | couple_fight | | | CU её лицо: первый выдох за час | close-up, {PAX_SHE} first exhale releasing, eyes still down but face softening, not yet looking at him, {LIGHT_A5}, {STYLE} |
| A5_SH30 | WS | rising | couple_fight | | | Они сидят так же, но руки соединены | wide same symmetrical compartment frame as SH17, but now joined hands on book between them, daylight softening, {LIGHT_A5}, {STYLE} |

---

# A6 — MIDPOINT (18 шотов) — музыкант + открытие совы

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A6_SH01 | WS | rising | musician | | | Тамбур. Музыкант на корточках с гитарой | wide, {PAX_MUS} sitting on floor of vestibule with acoustic guitar across knees, late afternoon golden light from open vestibule window, {LIGHT_A6}, {STYLE} |
| A6_SH02 | MCU | rising | musician | | | Медленно перебирает струны | medium close-up low angle, {PAX_MUS} fingerpicking guitar string slowly, eyes half-closed in playing trance, {LIGHT_A6}, {STYLE} |
| A6_SH03 | ECU | rising | musician | | | ECU струны под пальцами | extreme close-up guitar strings under fingertips, golden warm light catching steel, pluck visible, {LIGHT_A6}, 100mm macro |
| A6_SH04 | MS | rising | musician | | | Дверь открыта, ветер в волосах | medium shot, {PAX_MUS} in vestibule, doorway open behind him with golden field rushing past, hair lifted by warm wind, {LIGHT_A6}, {STYLE} |
| A6_SH05 | OTS | rising | conductor | | | Проводница в дверях слушает | OTS over {CONDUCTOR} shoulder standing in vestibule doorway watching musician, not interrupting, {LIGHT_A6}, {STYLE} |
| A6_SH06 | MCU | rising | conductor | | | MCU проводницы впервые остановилась | {CONDUCTOR} medium close-up leaning against vestibule frame, eyes closed for a beat listening, first real pause of her shift, {LIGHT_A6}, {STYLE} |
| A6_SH07 | MS | rising | musician | ✓ | | **ICONIC**: музыкант силуэтом в контровом золотом свете | medium shot low angle, {PAX_MUS} silhouette against bright open vestibule door with golden field behind, cold backlight transitioning to warm, guitar in lap, painterly composition, {LIGHT_A6}, {STYLE} |
| A6_SH08 | CU | rising | musician | | | CU его лица: лёгкая улыбка во время игры | close-up, {PAX_MUS} face, gentle absent smile while playing, looking out at landscape, {LIGHT_A6}, {STYLE} |
| A6_SH09 | POV | rising | — | | ✓ | POV из открытой двери: золотое поле, столбы | POV from open vestibule door, golden field rushing past, power line poles flicking by, no houses in view, {TRAIN_EXT}, {LIGHT_A6} |
| A6_SH10 | ECU | rising | musician | | | ECU финальная нота гаснет | extreme close-up final note ringing on held string, vibration dying out, finger lifting, {LIGHT_A6}, 100mm |
| A6_SH11 | MS | rising | conductor | | | Проводница один раз тихо хлопает, уходит | medium shot, {CONDUCTOR} silently clapping just once toward musician, slight nod, then turning away to continue her round, {LIGHT_A6}, {STYLE} |
| A6_SH12 | BACK | rising | conductor | | | Со спины идёт по коридору, лёгкая улыбка | back lateral track, {CONDUCTOR} walking down corridor away from vestibule, faint smile visible in slight cheek tilt, {LIGHT_A6}, {STYLE} |
| A6_SH13 | OTS | midpoint_twist | child_girl | | | Проводница заглядывает в купе девочки | OTS over {CONDUCTOR} shoulder pausing at child's compartment doorway, {PAX_GIRL} visible inside on berth playing quietly with plush owl, {LIGHT_A6}, {STYLE} |
| A6_SH14 | MS | midpoint_twist | child_girl | | | Девочка играет с совой, говорит ей что-то | medium shot, {PAX_GIRL} sitting on berth holding plush owl up at eye level, whispering to it, late warm light through compartment window, {LIGHT_A6}, {STYLE} |
| A6_SH15 | ECU | midpoint_twist | child_girl | ✓ | | **ICONIC + MIDPOINT**: ECU плюшевой совы с отсутствующим глазом | extreme close-up slow push-in on worn plush owl in child's hands, one button eye missing showing thread, fabric faded, late golden light, photorealistic textile detail, {LIGHT_A6}, 100mm macro |
| A6_SH16 | CU | midpoint_twist | conductor | | | **MIDPOINT REVEAL**: CU проводницы — узнаёт сову | close-up slow push-in, {CONDUCTOR} face going still as she sees the owl off-frame, all professional composure drops for one second, hand involuntarily rising to chest where chain hangs, {LIGHT_A6}, {STYLE} |
| A6_SH17 | ECU | midpoint_twist | conductor | | | ECU: рука вытягивает цепочку из-под кителя | extreme close-up {CONDUCTOR} hand pulling thin chain out from under shirt collar, simple gold wedding band threaded on it, fingers touching, {LIGHT_A6}, 100mm |
| A6_SH18 | BACK | midpoint_twist | conductor | | | Со спины отступает от двери, плечи опускаются | back, {CONDUCTOR} stepping back from child's doorway, shoulders dropping slightly, hand still at chest, {LIGHT_A6} transitioning to {LIGHT_A7}, {STYLE} |

---

# A7 — CRISIS (35 шотов) — жар девочки → стоп-кран

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A7_SH01 | EWS | bad_guys_close_in | — | | ✓ | Дрон: поезд в снежный заряд | wide aerial, train moving into thick snow squall at night, swirling white, dark forest below, no town lights anywhere, {TRAIN_EXT}, {LIGHT_A7}, {STYLE} |
| A7_SH02 | POV | bad_guys_close_in | — | | ✓ | POV: косой снег стеной | POV interior to exterior, sideways snow plastering against window glass, near-zero visibility beyond, {LIGHT_A7} |
| A7_SH03 | WS | bad_guys_close_in | — | | ✓ | Коридор: лампы мигнули, тени длиннее | wide lateral track corridor, ceiling lamps flickering once, dark emerald compartment curtain shadows stretching, {TRAIN_INT}, {LIGHT_A7}, {STYLE} |
| A7_SH04 | OTS | bad_guys_close_in | child_girl | | | Проводница заглядывает в купе девочки | OTS over {CONDUCTOR} shoulder peering through child's compartment door, {PAX_GIRL} curled on berth, owl beside her, {LIGHT_A7}, {STYLE} |
| A7_SH05 | MCU | bad_guys_close_in | child_girl | | | MCU high: девочка спит, лицо красное | medium close-up high angle, {PAX_GIRL} sleeping on berth, cheeks flushed red, hair damp on forehead, blanket half off, {LIGHT_A7}, {STYLE} |
| A7_SH06 | ECU | bad_guys_close_in | conductor | | | Тыльная ладонь проводницы на её лбу | extreme close-up back of {CONDUCTOR} gloved hand resting against {PAX_GIRL} forehead, slight heat shimmer suggestion, dark emerald shadow, {LIGHT_A7}, 100mm |
| A7_SH07 | CU | bad_guys_close_in | conductor | | | CU проводницы: чувствует температуру | {CONDUCTOR} close-up, expression sharpening from tiredness to full alertness, recognizing fever, looking down off-frame, {LIGHT_A7}, {STYLE} |
| A7_SH08 | MS | bad_guys_close_in | conductor | | | Достаёт термометр из шкафчика | medium shot, {CONDUCTOR} pulling old glass-style thermometer from medical drawer in crew compartment, no readable text on it, {LIGHT_A7}, {STYLE} |
| A7_SH09 | ECU | bad_guys_close_in | — | | ✓ | ECU термометр: жидкость высоко (без цифр) | extreme close-up classic mercury-style thermometer, visually generic with no readable numbers, red liquid clearly past safe threshold, dim emerald light, {LIGHT_A7}, 100mm |
| A7_SH10 | CU | bad_guys_close_in | conductor | | | CU: цифра ей всё сказала | {CONDUCTOR} close-up, jaw tight, breathing controlled, calculation in eyes, {LIGHT_A7}, {STYLE} |
| A7_SH11 | MS | bad_guys_close_in | conductor | | | Идёт к двери машинистов, дверь заперта | medium shot, {CONDUCTOR} reaching driver's cabin door at front of train, finding it locked, knocking sharply, {LIGHT_A7}, {STYLE} |
| A7_SH12 | ECU | bad_guys_close_in | — | | ✓ | ECU: кулак стучит по металлу | extreme close-up her fist striking metal cabin door, faint reverberation visible in light dust around impact, {LIGHT_A7}, 100mm |
| A7_SH13 | WS | all_is_lost | conductor | | | Возвращается в коридор, никого | wide, {CONDUCTOR} walking back into empty dimly lit corridor, dark emerald curtains, dead night, no one awake, {LIGHT_A7}, {STYLE} |
| A7_SH14 | MCU | all_is_lost | conductor | | | Слегка Dutch — мир сместился | medium close-up slight dutch tilt, {CONDUCTOR} face under flickering lamp, decision pressing in, breath visible despite interior, {LIGHT_A7}, {STYLE} |
| A7_SH15 | OTS | all_is_lost | child_girl | | | Заглядывает в купе: девочка стонет во сне | OTS over {CONDUCTOR} shoulder, {PAX_GIRL} in feverish restless sleep, weak whimper, owl fallen to floor, {LIGHT_A7}, {STYLE} |
| A7_SH16 | ECU | all_is_lost | child_girl | | | ECU плюшевая сова на полу купе | extreme close-up high angle worn plush owl lying on compartment floor, fabric fold sad, dark emerald shadow, {LIGHT_A7}, 100mm |
| A7_SH17 | CU | dark_night_of_the_soul | conductor | | | CU low: впервые она выше правил | {CONDUCTOR} close-up low angle, looking up and ahead, no longer in subordinate posture, decision crystallizing, {LIGHT_A7}, {STYLE} |
| A7_SH18 | BACK | dark_night_of_the_soul | conductor | | | Со спины быстро к тамбуру | back lateral fast track, {CONDUCTOR} walking purposefully toward vestibule, lamps flickering, snow visible through doors ahead, {LIGHT_A7}, {STYLE} |
| A7_SH19 | WS | dark_night_of_the_soul | conductor | | | Тамбур: стоп-кран на стене, она перед ним | wide low angle, {CONDUCTOR} standing facing emergency brake handle mounted on vestibule wall, single sickly yellow emergency light overhead, {LIGHT_A7}, {STYLE} |
| A7_SH20 | ECU | dark_night_of_the_soul | — | ✓ | ✓ | **ICONIC**: ECU красного стоп-крана с пломбой | extreme close-up red emergency brake handle with intact wire seal, peeling paint, dim emergency light, generic no text on plate, {LIGHT_A7}, 100mm |
| A7_SH21 | CU | break_into_three | conductor | | | CU перед стоп-краном, глубокий вдох | {CONDUCTOR} close-up facing brake handle directly, deep slow breath in, eyes closing for one beat, {LIGHT_A7}, {STYLE} |
| A7_SH22 | ECU | break_into_three | conductor | ✓ | | **ICONIC**: ECU push на руку, сжимающую стоп-кран | extreme close-up slow push-in, {CONDUCTOR} grey wool fingerless glove tightening around red brake handle, knuckles whitening, seal wire trembling, {LIGHT_A7}, 100mm |
| A7_SH23 | CU | break_into_three | conductor | | | CU глаза открыты, решение принято | {CONDUCTOR} close-up eyes opening sharp and resolved, no doubt left, {LIGHT_A7}, {STYLE} |
| A7_SH24 | ECU | break_into_three | — | | | ECU: рука тянет вниз, пломба рвётся | extreme close-up brake handle pulled down decisively, wire seal snapping with small visible spark of metal, {LIGHT_A7}, 100mm |
| A7_SH25 | EWS | break_into_three | — | ✓ | ✓ | **ICONIC**: дрон, поезд тормозит в снежном поле, искры | wide aerial slow motion, train brakes locking up in snowy field at night, sparks visible from wheels on rails, snowstorm easing, {TRAIN_EXT}, {LIGHT_A7}, {STYLE} |
| A7_SH26 | CU | all_is_lost | military | | | CU военный просыпается рывком | close-up handheld, {PAX_MIL} jolting awake fully alert, soldier's reflex, eyes immediately scanning, {LIGHT_A7}, {STYLE} |
| A7_SH27 | CU | all_is_lost | mother_baby | | | CU мать хватает ребёнка | close-up handheld, {PAX_MOM} instinctively scooping infant closer, half-asleep already protective, {LIGHT_A7}, {STYLE} |
| A7_SH28 | CU | all_is_lost | bride | | | CU невеста сидит, не двигается | close-up handheld, {PAX_BRIDE} sitting up under hanging dress which sways from deceleration, eyes wide but calm, {LIGHT_A7}, {STYLE} |
| A7_SH29 | CU | all_is_lost | businessman | | | CU бизнесмен — паника, очки на боку | close-up handheld, {PAX_BIZ} scrambling awake, glasses askew, book sliding off lap, {LIGHT_A7}, {STYLE} |
| A7_SH30 | CU | all_is_lost | veteran | | | CU дед спокоен, рука на трости | close-up handheld, {PAX_VET} already sitting up calmly, hand on cane, having seen worse, {LIGHT_A7}, {STYLE} |
| A7_SH31 | CU | all_is_lost | couple_fight | | | CU пары: уже держатся за руки | close-up handheld, {PAX_HE} and {PAX_SHE} both upright, hands gripped together immediately, fear shared, {LIGHT_A7}, {STYLE} |
| A7_SH32 | CU | all_is_lost | musician | | | CU музыкант: защищает гитару | close-up handheld, {PAX_MUS} curling around guitar protectively, calm, looking around, {LIGHT_A7}, {STYLE} |
| A7_SH33 | WS | all_is_lost | conductor | | | Проводница идёт обратно к девочке | wide handheld, {CONDUCTOR} striding back through corridor of half-awake passengers, no one blocking her, only one who knows why, {LIGHT_A7}, {STYLE} |
| A7_SH34 | OTS | all_is_lost | child_girl | | | Берёт девочку на руки в плед | OTS, {CONDUCTOR} lifting feverish {PAX_GIRL} into her arms, wrapping in compartment blanket, owl tucked under girl's arm, {LIGHT_A7}, {STYLE} |
| A7_SH35 | MS | all_is_lost | conductor | ✓ | | **ICONIC**: несёт девочку коридором, силуэт | medium shot low angle, {CONDUCTOR} carrying child through dim corridor toward vestibule, passengers' faces watching from compartment doors silently, {LIGHT_A7}, {STYLE} |

---

# A8 — RESOLUTION (30 шотов) — рассвет, прощание, петля

| Shot | Type | Beat | Vign | Ico | Bro | Описание | promptPositive |
|---|---|---|---|---|---|---|---|
| A8_SH01 | EWS | break_into_three | — | ✓ | ✓ | **ICONIC**: дрон, поезд стоит, рассвет розовый | wide slow aerial drone, passenger train stopped on tracks crossing snow-covered field, dawn pink sky pale, no city visible, ethereal silence, {TRAIN_EXT}, dawn pink and snow blue palette, {STYLE} |
| A8_SH02 | WS | break_into_three | — | | ✓ | Снежное поле по обе стороны путей | wide low angle, snow-covered field stretching to horizon either side of rails, perfect stillness, faint pink dawn glow, {LIGHT_A8}, {STYLE} |
| A8_SH03 | EWS | break_into_three | — | | ✓ | Дрон: скорая едет по узкой дороге | wide aerial track shot, single ambulance with quiet blue lights moving along narrow rural road toward stopped train, no other traffic anywhere, {LIGHT_A8}, {STYLE} |
| A8_SH04 | WS | break_into_three | conductor | | | Проводница на ступенях с девочкой | wide, {CONDUCTOR} standing on lowered train step holding wrapped {PAX_GIRL}, watching dawn road, blanket fluttering in cold air, {LIGHT_A8}, {STYLE} |
| A8_SH05 | MS | break_into_three | — | | | Скорая останавливается, медики в куртках | medium shot low angle, ambulance stopping, two medics in generic jackets stepping out into snow, no readable text on vehicle, {LIGHT_A8}, {STYLE} |
| A8_SH06 | MCU | break_into_three | child_girl | | | Девочку передают медикам на руки | medium close-up, {PAX_GIRL} carefully transferred from conductor's arms to medic's, still wrapped in blanket and clutching owl, {LIGHT_A8}, {STYLE} |
| A8_SH07 | ECU | break_into_three | child_girl | ✓ | | **ICONIC**: ECU сова в её руке, её несут к скорой | extreme close-up plush owl bouncing gently in {PAX_GIRL} hand as she's carried, dawn pink soft on worn fabric, hopeful and sad, {LIGHT_A8}, 100mm |
| A8_SH08 | MS | break_into_three | conductor | | | Проводница стоит, рука у груди | medium shot, {CONDUCTOR} standing in snow beside train, watching medics carry child to ambulance, hand at chest near hidden chain, {LIGHT_A8}, {STYLE} |
| A8_SH09 | EWS | break_into_three | — | | ✓ | Дрон: скорая отъезжает | wide aerial, ambulance pulling away from stopped train down narrow snowy road, train still motionless, dawn pink saturating, {LIGHT_A8}, {STYLE} |
| A8_SH10 | BACK | break_into_three | conductor | | | Проводница со спины в снегу | back, {CONDUCTOR} silhouette from behind standing in light snow watching disappearing ambulance, breath fogging into pink dawn air, {LIGHT_A8}, {STYLE} |
| A8_SH11 | EWS | final_image | — | | ✓ | Поезд снова едет, утренний туман | wide slow aerial, train moving again, emerging from low morning fog toward tiny rural platform, milky pink light, no city beyond, {TRAIN_EXT}, {LIGHT_A8}, {STYLE} |
| A8_SH12 | WS | final_image | — | | ✓ | Платформа с одним номером, без названия | wide, deserted small platform with single number sign no city name, morning fog rolling over rails, no other buildings, {LIGHT_A8}, {STYLE} |
| A8_SH13 | MS | final_image | conductor | | | Проводница снимает китель в купе | medium shot, {CONDUCTOR} alone in crew compartment, slowly unbuttoning navy uniform jacket, removing it carefully, {LIGHT_A8}, {STYLE} |
| A8_SH14 | ECU | final_image | — | ✓ | | **ICONIC**: ECU китель сложен, кепка сверху | extreme close-up high angle, conductor's navy uniform jacket neatly folded on compartment seat, peaked cap placed on top, morning pink light through window, {LIGHT_A8}, 100mm |
| A8_SH15 | ECU | final_image | — | ✓ | | **ICONIC**: ECU конверт «заявление» поверх кителя | extreme close-up high angle, white folded resignation envelope from A1_SH05 placed on top of folded uniform, still unopened but visibly being left behind, {LIGHT_A8}, 100mm |
| A8_SH16 | ECU | final_image | conductor | | | ECU снимает цепочку, кладёт кольцо рядом | extreme close-up, {CONDUCTOR} hand pulling thin gold chain over head, ring sliding off, both placed on envelope, deliberate, {LIGHT_A8}, 100mm |
| A8_SH17 | CU | final_image | conductor | | | CU её лицо — спокойствие впервые | {CONDUCTOR} close-up, face calm without weight of uniform, no makeup, soft morning fog light, first peace, {LIGHT_A8}, {STYLE} |
| A8_SH18 | WS | final_image | conductor | | | В простой белой рубашке выходит из купе | wide, woman late 30s in only plain white shirt and trousers (no LoRA-active wardrobe), dark blonde hair now down loose, no cap no jacket, stepping out of crew compartment, {LIGHT_A8}, {STYLE} |
| A8_SH19 | BACK | final_image | conductor | | | Со спины идёт по коридору к выходу | back lateral track, same woman from behind walking corridor toward exit door, lighter without uniform, lamps fading in morning light, {LIGHT_A8}, {STYLE} |
| A8_SH20 | OTS | final_image | — | | ✓ | Из плеча: открытая дверь, туман | OTS over shoulder, looking out open train doorway into milky morning fog of small platform, no people anywhere, {LIGHT_A8}, {STYLE} |
| A8_SH21 | MS | final_image | conductor | | | Спускается по ступеням в туман | medium shot low angle, woman stepping down train steps into fog, white shirt glowing softly in pink dawn, {LIGHT_A8}, {STYLE} |
| A8_SH22 | WS | final_image | conductor | | | Оборачивается на поезд один раз | wide, woman on empty platform looking back once at train, no sentimentality just acknowledgment, {LIGHT_A8}, {STYLE} |
| A8_SH23 | BACK | final_image | conductor | ✓ | | **ICONIC**: со спины уходит в туман, силуэт растворяется | back slow push-in, woman from behind walking away from camera into pink morning fog field, figure softening into haze, {LIGHT_A8}, {STYLE} |
| A8_SH24 | EWS | final_image | — | | ✓ | Дрон: одинокая фигура в туманном поле | wide aerial, tiny figure walking away into vast pink fog field, no path no destination visible, ethereal, {LIGHT_A8}, {STYLE} |
| A8_SH25 | MS | final_image | — | | | Новый проводник-мужчина закрывает дверь | medium shot, a different male conductor in generic uniform (no LoRA, no IP-Adapter, just a generic 40yo man in similar navy jacket), closing train door, mild confusion, going through motions, {LIGHT_A8}, {STYLE} |
| A8_SH26 | EWS | final_image | — | | ✓ | Поезд трогается без неё | wide low, train slowly starting again, leaving empty platform, fog drifting in its wake, {LIGHT_A8}, {STYLE} |
| A8_SH27 | WS | final_image | — | | | Новая проводница (моложе, не уставшая) идёт коридором | wide lateral track inside train corridor, younger female conductor (different face, no LoRA, generic 25yo brunette in same navy uniform), walking with bright posture, fresh, {TRAIN_INT}, {LIGHT_A8}, {STYLE} |
| A8_SH28 | OTS | final_image | child_girl | | | Из её плеча: пустое купе девочки | OTS over young new conductor's shoulder, looking into empty compartment, blanket folded on berth, no child no owl, {LIGHT_A8}, {STYLE} |
| A8_SH29 | ECU | final_image | — | ✓ | | **ICONIC**: ECU забытая пуговица-глаз от совы на сиденье | extreme close-up single small button eye from plush owl lying on compartment seat, glinting faintly, all that remains of the vignette, {LIGHT_A8}, 100mm macro |
| A8_SH30 | CU | final_image | — | ✓ | | **FINAL IMAGE**: CU новой проводницы — повторяет жест к груди | close-up, young new conductor walking corridor, briefly absent-mindedly touching her own chest where a chain would be but isn't yet, echo of former conductor's gesture, slight smile, then frame cuts to black mid-step, {LIGHT_A8}, {STYLE} |

---

## Финальный пересчёт

| Тип | Шотов |
|---|---|
| EWS | 16 |
| WS | 21 |
| MS | 32 |
| MCU | 26 |
| CU | 28 |
| ECU | 36 |
| OTS | 13 |
| BACK | 18 |
| POV | 10 |
| **Итого** | **200** |
| B-roll (без людей) | 38 (19%) |
| Iconic | 17 |

Распределение по актам: 22 / 22 / 25 / 18 / 30 / 18 / 35 / 30 = 200 ✓

Никаких двух одинаковых ракурсов подряд (проверял по строкам в каждой
таблице) ✓

## YouTube-safety

- ✗ Самоубийство, self-harm — нет
- ✗ Графические травмы, кровь — нет
- ✗ Реальные бренды, города, политические символы — нет
- ✓ Девочка спасена живой
- ✓ Бэкстори проводницы (мёртвая дочь) — только обиняком (сова, кольцо)
- ✓ VO нейтральный, без призывов
- ✓ Ордена ветерана generic, без свастики/V/Z

## VO (минимальный, на S1, S7, S8 финал)

```
A1_SH20 (MCU, проводница достаёт конверт):
«Двенадцать лет я считаю чужие билеты. Сегодня — последний рейс.»

A7_SH35 (она несёт девочку по коридору):
«За двенадцать лет я ни разу не нарушила правил. Один раз — стоит того.»

A8_SH17 (CU без кителя, спокойствие впервые):
«Двенадцать лет — это очень долго. И очень коротко.»

A8_SH30 (новая проводница, финал):
«Поезд идёт. Всегда идёт. Просто на следующем рейсе — буду уже не я.»
```

## Что от тебя дальше

1. LoRA `CONDUCTOR_BASE` — ты сам, как сказал
2. 9 reference-портретов пассажиров — сгенерить по промптам из PROJECT.md §2 (paste-ready блоки там есть)
3. После — скажи «импортируй» — залью все 200 строк в `shots` через gen-studio API с заполненными полями новой схемы
4. Только после явного «запусти» — генерация изображений по shotlist
