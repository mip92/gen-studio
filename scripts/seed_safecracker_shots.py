# -*- coding: utf-8 -*-
"""Кадры фильма «Тот, кто слышит замки» (slug: safecracker).

⚠️ ЭТО ПЕРВИЧНЫЙ СИД, И ОН ПОРОЖДАЕТ ДО-АУДИТНЫЙ ТЕКСТ. Проект после засева не
прошёл `Skill(gen-studio-plot-audit)`: омограф «замок», «сорок», связки-костыли,
отрицания в позитиве Qwen, отсутствие клаузы корпуса в 36 кадрах и четыре дыры в
хронологии. Всё это исправлено в БАЗЕ — она источник истины. При пересеве с нуля
после этого файла обязательно прогнать `scripts/safecracker_audit_fixes/`
по порядку из его README, иначе дефекты вернутся.

Данные держатся таблицей, SQL печатается — руками 128 INSERT'ов не пишут, там
ошибётся кто угодно. Запуск печатает UTF-8 .sql, который применяется через
`psql -f` (кириллица через `psql -c` на Windows ломается).

    python scripts/seed_safecracker_shots.py > scripts/seed_safecracker_02_shots.sql

Колонки строки:
    code, page, slot, shape, shotType, angle, move, loc, prof, ru, pos, mot, end

`prof` = None означает кадр без людей: участник не создаётся, а motionPrompt
получает ПОЗИТИВНЫЙ замок пустоты (`the place stays deserted…`) — отрицания
(«no people») запрещены, на fast-i2v негативная ветка не считается вообще.

Диалект моушен-промптов — LTX, не Wan (`Skill(gen-studio-ltx25)`):
    действие → звук → `no music`
Камера НЕ пишется руками: она приходит колонкой `cameraMove` и превращается в
фразу движком. `no music` обязателен в каждом кадре (§2.4) — саундтрек у нас
всегда внешний, ACE-Step.
"""
import sys

SLUG = "safecracker"

MOTION_NEG = ("extra people, additional figures, duplicate person, twin, clone, "
              "background crowd, anime character, anime girl, manga character, "
              "extra limbs, deformed face, photoreal, photograph, 3D render, "
              "plastic skin, flicker, warping, scene cut, identity change")

# Позитивный замок для кадров без людей (§12.7).
EMPTY_LOCK = "the place stays deserted, every surface and object holding its exact position"
# Позитивный замок для кадров с человеком.
ONE_FIGURE = "the same single figure throughout the shot"

# ─────────────────────────────────────────────────────────────────────────────
# code page slot shape shotType angle move location profile
#   ru / positive / motion / endframe
SHOTS = [

# ═══════════════════════ АКТ 1 — 1994, чужая дверь ═══════════════════════
# §4.0b: кадр 1 уже ВНУТРИ кризиса, хук-строка в кадрах 6–8, ноль атмосферы.
# §4.0c: кризис снимает остроту, но НЕ закрывается — остаётся человек на площадке.
("A1_SH01", 0, 0, "wide", "WS", "eye", "track_lateral", "stairwell_night_94", "VLAD_MID",
 "ты на коленях у чужой двери в три часа ночи, и за этой дверью на плите стоит забытый чайник.",
 "wide shot at eye level, the full width of a night landing, a woman's flat palms pressed against a padded brown door and Vlad's shoulders and bent head low at the lock beneath them, a caged bulb throwing both shadows up the wall",
 "he settles his shoulder lower and his free hand finds the doorframe while she strikes the door twice with the flat of her hand, the flat booming knock and the ring of a small tool set down on concrete, "
 + ONE_FIGURE + ", no music",
 "his head has dropped closer to the lock and her hands have slid down the door, the shadows on the wall now stretched further up."),

("A1_SH02", 0, 1, "narrow", "CU", "eye", "push_in", "stairwell_night_94", "VLAD_MID",
 "у тебя в пальцах медный щуп толщиной в полмиллиметра, ты не смотришь на замок и вообще ни на что не смотришь.",
 "close-up at eye level, Vlad's right hand at the keyhole holding a thin copper probe between two fingertips, his eyes closed and his face turned away from the door toward the empty stairwell",
 "the probe slides a fraction deeper and his jaw sets as he listens, the dry scrape of metal inside the cylinder and a bulb humming above, "
 + ONE_FIGURE + ", no music",
 "the probe has gone slightly deeper and his eyebrows have drawn together, his face still turned away."),

("A1_SH03", 0, 2, "narrow", "MCU", "eye", "static", "stairwell_night_94", "NINA_MID",
 "женщина за твоей спиной третий раз повторяет, что дочери четыре года и что она спит в дальней комнате.",
 "medium close-up at eye level, a dark-haired woman in a coat thrown over a nightdress standing against the opposite door with one hand at her collar, her braid loose over her shoulder",
 "she pushes off the door and takes half a step forward then stops herself, the rustle of a coat and a short indrawn breath, a tap dripping somewhere behind a wall, "
 + ONE_FIGURE + ", no music",
 "she has come half a step nearer and her hand has dropped from her collar to her side."),

("A1_SH04", 0, 3, "narrow", "ECU", "eye", "push_in", "stairwell_night_94", None,
 "четвёртый штифт всегда садится позже остальных, и ты ждёшь именно его, потому что раньше него дверь не откроется.",
 "extreme close-up at eye level, the brass keyhole of a mortice lock filling the frame, the tip of a thin copper probe just inside it, scratched paint and worn metal around the escutcheon",
 "the probe tip rotates a few degrees and stops, a faint metallic click deep inside the cylinder and then a second click a beat later, "
 + EMPTY_LOCK + ", no music",
 "the probe has rotated a little further and now sits still inside the keyhole."),

("A1_SH05", 0, 4, "narrow", "MS", "low", "tilt_up", "stairwell_night_94", "VLAD_MID",
 "ты открываешь её за девяносто секунд, не поднимаясь с колен и ни разу не притронувшись к сверлу.",
 "medium shot from a low angle, Vlad still kneeling as the padded door swings inward past his shoulder, his hand flat on the floor to steady himself, warm light from the flat falling across his face",
 "the door swings inward and he leans back on his heels and stays down at the lock, the heavy sigh of a padded door opening and a gas ring hissing somewhere inside, "
 + ONE_FIGURE + ", no music",
 "the door has opened wider and he has leaned further back on his heels, the light on his face now broader."),

("A1_SH06", 1, 0, "landscape", "MS", "eye", "track", "stairwell_night_94", "NINA_MID",
 "она пробегает мимо тебя так, что задевает плечом, и через секунду ты слышишь, как в кухне закрывают газ.",
 "medium shot at eye level, the woman passing through the open doorway with her coat flaring behind her, the hall beyond lit yellow, Vlad's shoulder blurred at the edge of frame",
 "she passes through the doorway and the coat flares behind her, quick footsteps on lino and the small squeak of a gas tap being turned shut, "
 + ONE_FIGURE + ", no music",
 "she is further into the hall with her back fully turned, the coat settling against her legs."),

("A1_SH07", 1, 1, "landscape", "MS", "eye", "static", "stairwell_night_94", "VLAD_MID",
 "ты сматываешь инструмент в тряпочный свёрток и берёшь с неё пять тысяч купонов, столько же, сколько взял бы днём.",
 "medium shot at eye level, Vlad standing at the landing rail rolling a cloth tool wrap closed against his thigh, a folded note pushed into his breast pocket beside the copper probe",
 "he rolls the cloth wrap closed and taps the pocket flat with two fingers, the soft slap of cloth and the click of the probe against a button, "
 + ONE_FIGURE + ", no music",
 "the wrap is fully rolled and tucked under his arm, his hand lowered from the pocket."),

("A1_SH08", 1, 2, "tall", "FS", "eye", "static", "stairwell_night_94", "GRISHA_MID",
 "на пол-этажа ниже стоит человек, который поднялся сюда не к своей двери.",
 "full-length shot at eye level, a heavy ginger man in a long leather coat standing half a flight below on the concrete steps, one hand on the pipe handrail, his face lifted toward the landing",
 "he lifts his chin a little and his hand slides an inch along the handrail, the faint squeak of a palm on painted steel and cold air moving in the stairwell, "
 + ONE_FIGURE + ", no music",
 "his chin is lifted higher and his hand has slid further along the rail toward the upper step."),

("A1_SH09", 1, 3, "square", "CU", "eye", "push_in", "stairwell_night_94", "GRISHA_MID",
 "он стоит на пол-этажа ниже уже минут десять и смотрит не на дверь.",
 "close-up at eye level, the ginger man's face turned up in the stairwell gloom, pale blue eyes tracking something low and to the side, a broad flat signet ring visible on the hand at the rail",
 "his eyes track slowly downward and to the side and his mouth stays closed, only the hum of the caged bulb and a distant door closing two floors down, "
 + ONE_FIGURE + ", no music",
 "his eyes have finished tracking downward and now hold still, his head tilted a fraction further."),

("A1_SH10", 1, 4, "square", "ECU", "high", "push_in", "stairwell_night_94", "VLAD_MID",
 "он смотрит на твои руки, и это первый человек за восемь лет, который смотрит именно туда.",
 "extreme close-up from a high angle, Vlad's two hands folding the cloth wrap, the narrow scar across his right index knuckle catching the bulb light, the copper probe lying across his palm",
 "the fingers fold the last flap over the probe and press it down, the dry rustle of cloth and a single soft metallic tap, "
 + ONE_FIGURE + ", no music",
 "the flap is folded flat and the probe is hidden, the fingers now resting still on the bundle."),

("A1_SH11", 1, 5, "tall", "FS", "eye", "pull_out", "stairwell_night_94", "GRISHA_MID",
 "он ничего не говорит и уходит вниз, но лестница у вас на весь дом одна.",
 "full-length shot at eye level, the ginger man turning away down the steps, his leather coat swinging wide at the hem, one hand still trailing on the handrail",
 "he turns and starts down the steps with the coat swinging out behind him, unhurried heavy footfalls descending and fading, "
 + ONE_FIGURE + ", no music",
 "he is three steps lower with his back fully turned, the coat hem still swinging."),

("A1_SH12", 2, 0, "tall_page", "FS", "low", "tilt_up", "stairwell_night_94", "VLAD_MID",
 "тебе двадцать восемь, и ты умеешь то, чего в этом городе не умеет почти никто.",
 "full-length shot from a low angle, Vlad standing alone on the landing under the caged bulb with the cloth wrap under his arm, the stairwell rising away above him in shadow",
 "he shifts his weight onto one hip and looks up the stairwell after the sound, the last footsteps fading below and the bulb buzzing steadily, "
 + ONE_FIGURE + ", no music",
 "his head has turned further up the stairwell and his weight has settled fully onto one hip."),

("A1_SH13", 2, 1, "square", "CU", "eye", "static", "stairwell_night_94", "VLAD_MID",
 "сейчас я расскажу, как это умение открыло тебе четыреста чужих дверей и заперло изнутри одну твою.",
 "close-up at eye level, Vlad's face lit from one side by the caged bulb, his jaw tight, his eyes still fixed on the empty stairwell below",
 "his eyes stay fixed downward and he lets out a breath through his nose, the buzz of the bulb and a car passing far outside, "
 + ONE_FIGURE + ", no music",
 "his eyes have lowered slightly and his mouth has closed harder, the breath finished."),

("A1_SH14", 2, 2, "wide", "WS", "eye", "static", "stairwell_night_94", None,
 "если хочешь знать, чем именно ты за это заплатишь, оставайся до конца и подпишись.",
 "wide shot at eye level, the empty landing across its full width, the open flat door spilling warm light onto olive walls, a folded pram against the wall and the caged bulb above",
 "the door drifts a few centimetres on its hinges and the light on the wall narrows, the slow creak of a hinge and a gas ring still hissing inside, "
 + EMPTY_LOCK + ", no music",
 "the door has drifted almost closed and the band of warm light on the wall is much narrower."),

# ═══════════════════════ АКТ 2 — 1979, происхождение ═══════════════════════
("A2_SH01", 3, 0, "landscape", "MS", "eye", "static", "landing_1979", "FITTER_OLD",
 "в семьдесят девятом отец теряет ключи от квартиры, и слесарь из жэка приходит на четвёртый этаж со сверлом.",
 "medium shot at eye level, a stooped grey-haired fitter in a stained brown coat setting a hand drill against a tall wooden door, a tape measure hanging round his neck, wood dust already on the floor",
 "he leans his weight into the drill and it bites into the brass, the rising whine of a drill motor and the rattle of curling swarf falling on concrete, "
 + ONE_FIGURE + ", no music",
 "the drill has sunk further into the lock face and more swarf has gathered at his feet."),

("A2_SH02", 3, 1, "square", "ECU", "eye", "push_in", "landing_1979", None,
 "тебе тринадцать лет, и ты первый раз в жизни видишь, как убивают исправный механизм.",
 "extreme close-up at eye level, the brass lock face of a wooden door with a drill bit tearing a ragged hole through the escutcheon, bright curls of metal peeling out of it",
 "the bit pushes deeper and the ragged hole widens as swarf peels away, the hard grind of steel on brass and a small sharp crack inside the lock, "
 + EMPTY_LOCK + ", no music",
 "the hole is wider and torn open at one edge, a longer curl of metal hanging from it."),

("A2_SH03", 3, 2, "square", "MCU", "eye", "static", "landing_1979", "VLAD_KID",
 "ты стоишь в двух шагах от него, и тебе физически неприятно слышать, как сверло грызёт латунь.",
 "medium close-up at eye level, a thin fair-haired boy of thirteen in a brown school jacket watching from two paces back, his shoulders drawn up and his hands pushed into his pockets",
 "his shoulders draw up a little higher and he turns his face a few degrees away from the noise, the drill grinding on behind him and dust settling in the air, "
 + ONE_FIGURE + ", no music",
 "his face is turned further away and his shoulders have risen closer to his ears."),

("A2_SH04", 3, 3, "square", "INSERT", "top_down", "push_in", "landing_1979", None,
 "сломанный цилиндр слесарь бросает в оцинкованное ведро, и никто из взрослых не смотрит, куда он падает.",
 "insert shot from directly above, a galvanised bucket with a ruined brass cylinder lying on top of rags and broken screws, wood dust drifting down onto it",
 "the cylinder settles a centimetre deeper into the rags as dust drifts down onto it, the dull clank of metal on a galvanised rim, "
 + EMPTY_LOCK + ", no music",
 "the cylinder has settled deeper and is half covered by a fine layer of dust."),

("A2_SH05", 4, 0, "narrow", "MS", "eye", "static", "landing_1979", "VLAD_KID",
 "ты достаёшь его оттуда через сорок минут, когда все уже сидят на кухне и пьют чай.",
 "medium shot at eye level, the boy crouched over a galvanised bucket on an empty landing, one hand reaching in, his school jacket open and his sleeve pushed back",
 "his hand closes on the cylinder and lifts it clear of the rags, the scrape of metal against the bucket rim and voices behind a closed door, "
 + ONE_FIGURE + ", no music",
 "the cylinder is out of the bucket and held against his chest, his other hand steadying it."),

("A2_SH06", 4, 1, "narrow", "CU", "high", "push_in", "vlad_kitchen", "VLAD_KID",
 "дома ты разбираешь его на кухонном столе и раскладываешь шесть латунных штифтов по росту, от короткого к длинному.",
 "close-up from a high angle, the boy's hands on an oilcloth table laying six small brass pins in a row by height, the opened cylinder beside them, a jam jar holding the springs",
 "his fingers set the last pin at the end of the row and square it up with a fingernail, tiny metallic ticks as each pin touches the oilcloth, "
 + ONE_FIGURE + ", no music",
 "the row of six pins is complete and straight, his hand withdrawn to the edge of the table."),

("A2_SH07", 4, 2, "narrow", "MCU", "eye", "static", "vlad_kitchen", "VLAD_KID",
 "четвёртый оказывается длиннее остальных на треть миллиметра, и это ты запоминаешь на всю оставшуюся жизнь.",
 "medium close-up at eye level, the boy holding one brass pin up against the kitchen window light between finger and thumb, his eye narrowed, the other five pins on the cloth below",
 "he turns the pin a slow half-revolution against the window light, a faint click as it touches his thumbnail and a radio murmuring in another room, "
 + ONE_FIGURE + ", no music",
 "the pin has turned a half-revolution and his eye is narrowed further."),

("A2_SH08", 4, 3, "landscape", "MS", "eye", "push_in", "school_workshop_83", "VLAD_KID",
 "в семнадцать лет ты точишь на школьном наждаке медную полоску, пока она не становится тоньше полумиллиметра.",
 "medium shot at eye level, a taller version of the same fair-haired boy at a pedestal grinder in a school metalwork room, a thin strip of copper held to the wheel, sparks arcing down to the floor",
 "he eases the copper strip against the wheel and a fan of sparks arcs down to the concrete, the rising howl of a grinder and the crackle of sparks, "
 + ONE_FIGURE + ", no music",
 "the copper strip is thinner and his hands have moved further along it, the spark fan shorter."),

("A2_SH09", 4, 4, "landscape", "MCU", "eye", "static", "school_workshop_83", "VLAD_KID",
 "ты делаешь её под свои пальцы и под свою руку, и другому человеку она не подойдёт никогда.",
 "medium close-up at eye level, the boy at a scarred workbench testing the finished copper probe against his own fingertip, high wire-glass windows behind him full of chalky light",
 "he rolls the finished probe once between finger and thumb and presses the tip to his fingertip, a small dry squeak of copper on skin and a vice being wound somewhere behind, "
 + ONE_FIGURE + ", no music",
 "the probe has rolled a half turn and now rests flat along his index finger."),

("A2_SH10", 5, 0, "wide", "WS", "eye", "pan_right", "school_workshop_83", None,
 "в этой мастерской восемь верстаков, и ни один из них не научил тебя ничему полезнее.",
 "wide shot at eye level, a school metalwork room across its full width, eight steel benches in two rows with heavy vices, a wall board of tool outlines half of them empty, dust hanging in window light",
 "dust drifts slowly through the shafts of window light above the benches, the low hum of a grinder winding down and a loose window pane ticking, "
 + EMPTY_LOCK + ", no music",
 "the dust has drifted further across the light shafts and settled lower over the benches."),

("A2_SH11", 5, 1, "tall", "FS", "low", "static", "school_workshop_83", "VLAD_KID",
 "ты выходишь из этой мастерской с одной вещью в нагрудном кармане и носишь её следующие сорок три года.",
 "full-length shot from a low angle, the seventeen-year-old standing in the workshop doorway with his jacket on, one hand flat over his breast pocket, the benches receding behind him",
 "his hand presses flat over the breast pocket and stays there as he turns to the door, the click of a light switch and a door beginning to swing, "
 + ONE_FIGURE + ", no music",
 "he has turned further toward the doorway, his hand still flat on the pocket and his shoulder past the frame."),

("A2_SH12", 5, 2, "square", "ECU", "eye", "static", "school_workshop_83", None,
 "медь мягче стали и поэтому чувствует то, чего сталь не чувствует, и в этом весь фокус.",
 "extreme close-up at eye level, the thin copper probe lying alone on a scarred oiled bench top, its ground tip catching a single line of light, brass filings scattered around it",
 "a filing rolls a few millimetres along the bench and stops against the probe, one small metallic tick and the settling creak of a wooden building, "
 + EMPTY_LOCK + ", no music",
 "the filing has come to rest touching the probe, the line of light on the tip slightly narrower."),

("A2_SH13", 5, 3, "tall", "MS", "eye", "push_in", "school_workshop_83", "VLAD_KID",
 "к восемьдесят шестому ты умеешь открывать всё, что в этой стране вешают на жилые двери.",
 "medium shot at eye level, the young man at the workshop bench with a row of six cut-away practice cylinders clamped in the vice, his hand on the last of them",
 "his hand moves steadily from one clamped cylinder to the next along the row, a sequence of small clicks running down the line, "
 + ONE_FIGURE + ", no music",
 "his hand has reached the last cylinder in the row and rests on it, the earlier ones left turned open."),

# ═══════════════════════ АКТ 3 — будка, ремесло, репутация ═══════════════════════
("A3_SH01", 6, 0, "square", "MCU", "eye", "static", "metalremont_booth", "VLAD_MID",
 "с восемьдесят шестого года ты сидишь в будке металлоремонта размером два метра на три.",
 "medium close-up at eye level, Vlad seated behind a scratched wooden counter inside a cramped repair booth, a board of hundreds of key blanks on nails filling the wall behind his shoulder",
 "he turns a key blank over twice in his fingers and sets it down on the counter, the light rattle of blanks knocking on their nails and a fan heater running, "
 + ONE_FIGURE + ", no music",
 "the blank is lying flat on the counter and his hand has moved back to the machine."),

("A3_SH02", 6, 1, "landscape", "MS", "eye", "track_lateral", "metalremont_booth", "VLAD_MID",
 "за день через твою форточку проходит сорок ключей и три человека, потерявших всё сразу.",
 "medium shot at eye level, the hatch window of the booth from inside, a queue of coats and hands visible through the sliding glass, Vlad at the cutting machine with his back half turned to them",
 "he presses the blank against the cutter wheel and sparks jump under his hands, the high whine of the cutting wheel and coins being counted on the outside counter, "
 + ONE_FIGURE + ", no music",
 "the cut blank is further along the wheel and the sparks have thinned, his shoulders lowered."),

("A3_SH03", 6, 2, "square", "CU", "eye", "push_in", "metalremont_booth", "VLAD_MID",
 "ты единственный мастер в районе, кто не берётся за сверло, и за это тебе прощают очередь на сорок минут.",
 "close-up at eye level, Vlad's face lit from one side by a fluorescent tube, reading glasses pushed up on his forehead, his eyes lowered to something out of frame below",
 "his eyes stay lowered and his head tilts a few degrees to one side as he listens, a faint sequence of clicks close to the microphone and the tube buzzing, "
 + ONE_FIGURE + ", no music",
 "his head has tilted a little further and his eyes have closed."),

("A3_SH04", 6, 3, "square", "ECU", "eye", "static", "metalremont_booth", None,
 "у тебя одно правило на все девять лет вперёд: сначала слушать, и только потом трогать.",
 "extreme close-up at eye level, a cut-away practice cylinder standing on a bench under a swan-neck lamp, six brass pins visible through the cutaway, the copper probe lying beside it",
 "one pin drops a millimetre inside the cutaway and the others stay where they are, a single soft click and the hum of a bench lamp, "
 + EMPTY_LOCK + ", no music",
 "the dropped pin has settled fully and a second pin has begun to fall behind it."),

("A3_SH05", 7, 0, "landscape", "MS", "eye", "static", "metalremont_booth", "NINA_MID",
 "в восемьдесят девятом ты женишься на женщине, которая пришла чинить замок от почтового ящика.",
 "medium shot at eye level, the dark-haired woman with the braid standing at the hatch window from outside, a small mailbox lock held out on her open palm, her cardigan buttoned to the throat",
 "she holds the small lock out further on her open palm and her fingers close and open once, the tiny rattle of a mailbox lock and rain starting on the awning above, "
 + ONE_FIGURE + ", no music",
 "the lock is closer to the hatch and her fingers have closed around it again."),

("A3_SH06", 7, 1, "landscape", "MS", "eye", "push_in", "vlad_kitchen", "NINA_MID",
 "в девяностом у вас рождается сын, и ты вешаешь над его кроватью связку старых ключей вместо погремушки.",
 "medium shot at eye level, the woman standing at a kitchen table with a bunch of old keys on a ring in her hand, courtyard trees filling the window behind her",
 "she lifts the ring of keys and lets them turn once on her finger, the bright jangle of old keys and a kettle beginning to tick on the stove, "
 + ONE_FIGURE + ", no music",
 "the keys have finished turning and hang still, her hand lowered a little."),

("A3_SH07", 7, 2, "square", "CU", "high", "static", "vlad_kitchen", None,
 "он засыпает под этот звон, и ты считаешь это хорошей приметой.",
 "close-up from a high angle, a bunch of worn keys on a steel ring hanging from a nail above a child's cot rail, painted wallpaper behind, evening light low across them",
 "the ring of keys swings a few degrees and slows to a stop, a slow diminishing jangle and a child's breathing close by, "
 + EMPTY_LOCK + ", no music",
 "the keys hang nearly still, one key resting against another."),

("A3_SH08", 7, 3, "square", "MCU", "eye", "static", "metalremont_booth", "VLAD_MID",
 "к девяносто третьему деньги в стране меняются трижды, а замки на дверях остаются ровно те же.",
 "medium close-up at eye level, Vlad at the booth counter counting a thick brick of low-denomination notes with a rubber band around it, his expression flat",
 "his thumb riffles through the brick of notes twice and he squares the edge on the counter, the dry flutter of paper and the snap of a rubber band, "
 + ONE_FIGURE + ", no music",
 "the notes are squared into a neat block and his thumb has stopped moving."),

("A3_SH09", 7, 4, "square", "INSERT", "top_down", "push_in", "metalremont_booth", None,
 "за один ключ ты берёшь столько, сколько вчера стоил проезд через весь город, и это никого не смешит.",
 "insert shot from directly above, a scratched wooden counter with three cut keys, a folded devalued banknote and a handwritten price card weighted down by a spring jar",
 "the price card lifts at one corner in the heater draught and settles back down, the small flap of card and a fan heater running steadily, "
 + EMPTY_LOCK + ", no music",
 "the card has settled flat again, one key nudged slightly out of line."),

("A3_SH10", 7, 5, "landscape", "MS", "eye", "track", "market_rows_90s", "VLAD_MID",
 "ты ходишь через рынок домой и видишь, как быстро у людей появляются вещи.",
 "medium shot at eye level, Vlad walking between market rows of converted containers and trestle tables hung with jeans and boxes, traders standing with hands inside their sleeves",
 "he keeps an even pace between the tables and passes two traders, duckboards knocking underfoot and a cassette player playing thinly from a crate, "
 + ONE_FIGURE + ", no music",
 "he is further down the row with his back three-quarters turned, the tables behind him."),

("A3_SH11", 7, 6, "landscape", "MCU", "eye", "static", "market_rows_90s", "VLAD_MID",
 "и как быстро у них появляются двери, которые все эти вещи должны стеречь.",
 "medium close-up at eye level, Vlad stopped in the market aisle looking at a container end fitted with a new steel door and two heavy padlocks, his hand resting on the strap of his bag",
 "his head turns a few degrees to follow the steel door as he passes and his hand tightens on the strap, the clank of a padlock knocked by wind and awnings snapping, "
 + ONE_FIGURE + ", no music",
 "his head has turned further toward the door and his grip on the strap is tighter."),

("A3_SH12", 8, 0, "wide", "WS", "eye", "pan_left", "market_rows_90s", None,
 "в этом городе за три года появляется больше стальных дверей, чем за предыдущие тридцать.",
 "wide shot at eye level, a market row across its full width in flat grey daylight, a line of container ends each fitted with a new steel door and padlocks, muddy duckboards running between them",
 "the awnings lift and drop along the row and a loose sheet of plastic flaps, the snap of canvas and the knock of a padlock against steel, "
 + EMPTY_LOCK + ", no music",
 "the awnings have settled lower and the plastic sheet has folded over on itself."),

("A3_SH13", 8, 1, "wide", "WS", "eye", "push_in", "stairwell_night_94", "GRISHA_MID",
 "а через полгода после той ночи человек с лестницы находит твою будку и становится в очередь.",
 "wide shot at eye level, the full width of the repair booth hatch from the street, the ginger man in the long leather coat standing at the counter with both forearms on it, the queue behind him gone",
 "he sets both forearms on the counter and leans his weight into it, the wooden counter creaking and the sliding glass panel rattling once, "
 + ONE_FIGURE + ", no music",
 "he has leaned further in over the counter and his head is lower, closer to the hatch."),

# ═══════════════════════ АКТ 4 — двести долларов за пятнадцать секунд ═══════════════════════
("A4_SH01", 9, 0, "tall", "FS", "low", "static", "metalremont_booth", "GRISHA_MID",
 "он не просит открыть, он просит посмотреть.",
 "full-length shot from a low angle, the ginger man standing square at the booth hatch in his long leather coat, one hand flat on the counter, the signet ring catching the tube light",
 "he lifts one hand off the counter and turns it palm up, the creak of leather and a light tap of a ring on wood, "
 + ONE_FIGURE + ", no music",
 "his palm is fully turned up and his other hand has come off the counter."),

("A4_SH02", 9, 1, "square", "INSERT", "top_down", "push_in", "metalremont_booth", None,
 "на прилавок ложится фотография железной двери и двести долларов одной бумажкой.",
 "insert shot from directly above, a scratched counter with a colour photograph of a steel personnel door and two padlocks lying on it, a single hundred-dollar note folded under one corner",
 "the photograph slides two centimetres across the counter and stops against the spring jar, the slide of paper on wood and a fan heater running, "
 + EMPTY_LOCK + ", no music",
 "the photograph has come to rest against the jar with the note still trapped under its corner."),

("A4_SH03", 9, 2, "tall", "MS", "eye", "static", "metalremont_booth", "VLAD_MID",
 "ты смотришь на неё пятнадцать секунд и называешь марку, год выпуска и слабое место.",
 "medium shot at eye level, Vlad holding the photograph up close to the fluorescent tube with both hands, his glasses pulled down onto his nose, the blank board behind him",
 "he tilts the photograph twice toward the tube and his lips move silently, the faint crackle of photographic paper and the tube buzzing, "
 + ONE_FIGURE + ", no music",
 "the photograph is tilted flatter to the light and his glasses have slid lower on his nose."),

("A4_SH04", 9, 3, "wide", "WS", "eye", "static", "metalremont_booth", None,
 "ты не притронулся ни к одной чужой двери и заработал столько, сколько в будке зарабатываешь за три месяца.",
 "wide shot at eye level, the interior of the booth across its full width, the counter with the photograph gone and the folded note lying alone on the wood, the hatch glass slid shut",
 "the hatch glass slides the last centimetre closed on its own weight and the note lifts at one corner, the rattle of glass in its runner and the heater fan, "
 + EMPTY_LOCK + ", no music",
 "the hatch is fully closed and the note has settled flat again on the counter."),

("A4_SH05", 10, 0, "landscape", "MS", "eye", "push_in", "vlad_kitchen", "VLAD_MID",
 "дома ты кладёшь эти деньги под клеёнку на кухонном столе и три дня к ним не притрагиваешься.",
 "medium shot at eye level, Vlad standing at the kitchen table lifting the edge of the oilcloth with two fingers, the folded note half slid underneath it, the window dark behind him",
 "he lowers the oilcloth edge flat over the note and smooths it once with his palm, the soft drag of oilcloth and a fridge motor starting up, "
 + ONE_FIGURE + ", no music",
 "the oilcloth is flat and the note is hidden, his palm resting still on the table."),

("A4_SH06", 10, 1, "landscape", "MS", "eye", "static", "vlad_kitchen", "NINA_MID",
 "жена спрашивает, откуда, и ты отвечаешь честно: за консультацию.",
 "medium shot at eye level, the dark-haired woman standing in the kitchen doorway with a towel over her shoulder, looking toward the table, her braid over the other shoulder",
 "she takes the towel off her shoulder and folds it once against her chest and stays in the doorway, the rustle of cloth and a tap running briefly in another room, "
 + ONE_FIGURE + ", no music",
 "the towel is folded smaller against her chest and her head has turned toward the table."),

("A4_SH07", 10, 2, "narrow", "MCU", "eye", "static", "vlad_kitchen", "VLAD_MID",
 "и это чистая правда, потому что ты действительно ничего не открывал и внутрь не заходил.",
 "medium close-up at eye level, Vlad's face at the kitchen table lit low by the overhead bulb, his eyes on the oilcloth in front of him, his hands out of frame",
 "his eyes stay down on the oilcloth and he breathes out slowly through his nose, only the fridge motor and a clock ticking on the wall, "
 + ONE_FIGURE + ", no music",
 "his eyes have lifted slightly toward the window and his mouth has closed harder."),

("A4_SH08", 10, 3, "narrow", "CU", "eye", "push_in", "warehouse_yard", "GRISHA_MID",
 "через месяц он приходит снова, и на этот раз фотографии в руках у него нет.",
 "close-up at eye level, the ginger man's face under a floodlight in a depot yard, the collar of the leather coat up, breath visible, the signet hand raised near his chin",
 "his hand comes up near his chin and one finger points past the camera, breath audible in the cold and a floodlight ballast humming, "
 + ONE_FIGURE + ", no music",
 "his finger has fully extended past the frame edge and his chin has turned to follow it."),

("A4_SH09", 10, 4, "narrow", "FS", "eye", "static", "warehouse_yard", "VLAD_MID",
 "он привозит тебя во двор оптового склада в половине первого ночи и просто стоит рядом.",
 "full-length shot at eye level, Vlad standing alone in the hard cone of a yard floodlight facing a steel personnel door with two padlocks, the corners of the yard completely black",
 "he shifts his weight from one foot to the other and does not step forward, gravel grinding under a boot and a wire fence ringing in the wind, "
 + ONE_FIGURE + ", no music",
 "he has shifted fully onto the other foot and turned a few degrees toward the door."),

("A4_SH10", 11, 0, "landscape", "MS", "eye", "static", "warehouse_yard", "VLAD_MID",
 "ты говоришь ему, что не полезешь, и он соглашается с первого раза.",
 "medium shot at eye level, Vlad turned away from the steel door with one hand raised flat, the ginger man's shoulder at the edge of frame, floodlight from behind them both",
 "he raises one hand flat and holds it there steady at shoulder height, wind moving across an open yard and a distant train coupling, "
 + ONE_FIGURE + ", no music",
 "his raised hand has begun to lower and his shoulders have turned further away from the door."),

("A4_SH11", 11, 1, "square", "MCU", "eye", "static", "warehouse_yard", "GRISHA_MID",
 "он говорит, что ему нужен не взломщик, а человек, который скажет, сколько это займёт по времени.",
 "medium close-up at eye level, the ginger man half-lit by the floodlight, one side of his face in complete shadow, his pale eyes steady and unhurried",
 "the lit side of his face stays still while he speaks and his eyebrows lift once, the ballast hum and a chain knocking against a shutter, "
 + ONE_FIGURE + ", no music",
 "his eyebrows have settled and his head has tilted a few degrees toward the door."),

("A4_SH12", 11, 2, "square", "ECU", "eye", "push_in", "warehouse_yard", None,
 "ты подходишь к двери и кладёшь два пальца на дужку висячего замка.",
 "extreme close-up at eye level, two fingertips resting on the shackle of a heavy padlock hanging from a steel hasp, frost on the metal, hard floodlight from one side",
 "the fingertips press and the padlock rotates a few degrees on the hasp, the scrape of frosted steel and a single dull clank, "
 + EMPTY_LOCK + ", no music",
 "the padlock has rotated further and hangs at a new angle, the fingertips still on the shackle."),

("A4_SH13", 11, 3, "square", "CU", "eye", "static", "warehouse_yard", "VLAD_MID",
 "и говоришь: сорок секунд.",
 "close-up at eye level, Vlad's face turned slightly away from the door with his eyes lowered, the floodlight edge across his cheek, his breath showing in the cold",
 "his eyes stay lowered and he breathes out once, a long visible breath and wind crossing the open yard, "
 + ONE_FIGURE + ", no music",
 "the breath has dispersed and his eyes have closed briefly, his jaw set."),

# ═══════════════════════ АКТ 5 — правило, которое он называет чистотой ═══════════════════════
("A5_SH01", 12, 0, "square", "CU", "eye", "push_in", "warehouse_yard", "VLAD_MID",
 "в феврале девяносто пятого ты впервые открываешь чужое сам.",
 "close-up at eye level, Vlad's hands at a padlock in the floodlight cone, the copper probe held low along his palm, his face out of frame above",
 "the probe enters the padlock body and his wrist turns a few degrees, the fine scrape of copper in a keyway and one sharp click, "
 + ONE_FIGURE + ", no music",
 "the probe has turned further and the padlock shackle has lifted a few millimetres out of its body."),

("A5_SH02", 12, 1, "wide", "WS", "eye", "static", "warehouse_yard", None,
 "сорок секунд ты назвал заранее, а вышло тридцать четыре, и он это тоже засёк.",
 "wide shot at eye level, the depot yard across its full width, the steel personnel door standing ajar with both padlocks hanging open on the hasp, the floodlight cone empty of people",
 "the steel door drifts a hand's width further open on its own weight, the low groan of a steel door and wind across the yard, "
 + EMPTY_LOCK + ", no music",
 "the door has drifted further and a wider band of darkness shows behind it."),

("A5_SH03", 12, 2, "tall_page", "FS", "low", "static", "warehouse_yard", "VLAD_MID",
 "ты не заходишь внутрь ни на шаг, и это становится твоим единственным правилом на девять лет.",
 "full-length shot from a low angle, Vlad standing outside the open steel door with his back to the darkness inside, the tool wrap under his arm, the floodlight above him",
 "he steps back one pace from the open doorway and turns his shoulders away from it, boots on wet concrete and the door still groaning behind him, "
 + ONE_FIGURE + ", no music",
 "he is a full pace further from the door with his shoulders squared away from the opening."),

("A5_SH04", 13, 0, "landscape", "MS", "eye", "track", "stairwell_night_94", "VLAD_MID",
 "в апреле девяносто пятого это уже не склад, а обычная квартира на пятом этаже.",
 "medium shot at eye level, Vlad climbing a night stairwell with the cloth wrap under his arm, olive walls passing beside him, a caged bulb overhead",
 "he climbs two more steps at an even pace and shifts the wrap higher under his arm, unhurried footfalls on concrete and a bulb buzzing above, "
 + ONE_FIGURE + ", no music",
 "he is two steps higher and the wrap is settled further under his arm."),

("A5_SH05", 13, 1, "landscape", "MS", "eye", "static", "stairwell_night_94", "VLAD_MID",
 "ты открываешь дверь, отходишь обратно на площадку и садишься на подоконник у окна.",
 "medium shot at eye level, Vlad seated on a stairwell windowsill with his hands on his knees, an open flat door across the landing behind him, blue-painted window glass at his back",
 "he settles back onto the sill and folds his hands together on his knees, the creak of a windowsill and voices moving inside the flat, "
 + ONE_FIGURE + ", no music",
 "his hands have unfolded and rest flat on his knees, his shoulders lowered against the window."),

("A5_SH06", 13, 2, "tall", "FS", "eye", "static", "stairwell_night_94", "VLAD_MID",
 "внутрь заходят двое чужих людей, а ты стоишь на площадке спиной к двери и считаешь про себя до трёхсот.",
 "full-length shot at eye level, Vlad standing alone on the landing facing away from the open door, his hands in his jacket pockets, the doorway behind him bright",
 "he shifts his weight and turns his face further from the doorway, muffled movement and drawers opening behind him, "
 + ONE_FIGURE + ", no music",
 "his face is turned fully away and his chin has lowered toward his chest."),

("A5_SH07", 13, 3, "square", "CU", "eye", "static", "stairwell_night_94", "VLAD_MID",
 "ты называешь это чистотой: ты не берёшь ничего, что за дверью.",
 "close-up at eye level, Vlad's face in the landing gloom, his eyes fixed on nothing, a muscle working at his jaw",
 "his jaw works once and his eyes hold on nothing, muffled thumps behind him and the bulb buzzing, "
 + ONE_FIGURE + ", no music",
 "his jaw has stilled and his eyes have lowered to the floor."),

("A5_SH08", 13, 4, "square", "ECU", "high", "push_in", "stairwell_night_94", None,
 "за эту ночь тебе платят полторы тысячи долларов, и ты пересчитываешь их прямо на лестнице.",
 "extreme close-up from a high angle, two hands counting a folded stack of dollar notes against a knee, the copper probe lying across the thigh beside them",
 "the thumb riffles the stack once and stops halfway through, the dry flick of banknotes and a door closing two floors below, "
 + EMPTY_LOCK + ", no music",
 "the thumb has stopped and the stack is folded closed around it."),

("A5_SH09", 13, 5, "tall", "FS", "eye", "pull_out", "stairwell_night_94", "VLAD_MID",
 "и всю дорогу домой ты повторяешь себе, что своими руками не вынес оттуда ни одной вещи.",
 "full-length shot at eye level, Vlad walking down the stairwell alone with the wrap under his arm, his other hand on the pipe handrail, landings receding above him",
 "he descends steadily with his hand sliding along the handrail, footfalls echoing down the shaft and a palm squeaking on painted steel, "
 + ONE_FIGURE + ", no music",
 "he is a half flight lower with his hand further along the rail and his head turned down."),

("A5_SH10", 14, 0, "landscape", "MS", "eye", "static", "vlad_kitchen", "NINA_MID",
 "жена перестаёт спрашивать про деньги в мае, и это оказывается хуже, чем если бы она спрашивала.",
 "medium shot at eye level, the dark-haired woman washing a cup at the kitchen sink with her back to the room, the window above the sink showing courtyard dusk",
 "she rinses the cup and sets it upside down on the drainer with her back still to the room, running water shutting off and ceramic touching steel, "
 + ONE_FIGURE + ", no music",
 "the cup is on the drainer and her hands are lowered to the sink edge, her back still turned."),

("A5_SH11", 14, 1, "square", "MCU", "eye", "static", "vlad_kitchen", "VLAD_MID",
 "ты покупаешь ей стиральную машину и не можешь объяснить, почему тебе стыдно.",
 "medium close-up at eye level, Vlad standing in the kitchen doorway looking toward the sink, one hand still on the doorframe, his jacket not yet taken off",
 "his hand slides down the doorframe and stops at shoulder height, the creak of a doorframe and water draining in the sink, "
 + ONE_FIGURE + ", no music",
 "his hand has come off the doorframe and hangs at his side, his shoulders dropped."),

("A5_SH12", 14, 2, "square", "INSERT", "top_down", "push_in", "vlad_kitchen", None,
 "под клеёнкой к июню лежит четыре с половиной тысячи, и клеёнка больше не ложится ровно.",
 "insert shot from directly above, a kitchen table with the oilcloth cover visibly raised in one corner over a thick block of folded notes beneath it, a jam jar of dried flowers beside",
 "the raised corner of the oilcloth settles a few millimetres and stays proud of the table, the faint creak of a table and a fridge motor running, "
 + EMPTY_LOCK + ", no music",
 "the corner has settled slightly but still stands raised, one edge of a note showing beneath."),

("A5_SH13", 14, 3, "square", "CU", "eye", "static", "metalremont_booth", "VLAD_MID",
 "в будке ты сидишь всё те же шесть дней в неделю, потому что иначе это станет заметно соседям.",
 "close-up at eye level, Vlad behind the booth counter under the fluorescent tube cutting a key blank, his expression unchanged from any other day",
 "he holds the blank against the wheel and sparks jump under his hands, the whine of the cutter and the rattle of blanks on their nails, "
 + ONE_FIGURE + ", no music",
 "the blank is cut deeper and the spark stream has thinned, his hands lowered a fraction."),

# ═══════════════════════ АКТ 6 — он показывает сыну, что замок игрушка ═══════════════════════
("A6_SH01", 15, 0, "square", "MCU", "eye", "static", "vlad_kitchen", "SON_KID",
 "в девяносто седьмом сыну семь лет, и он приносит тебе замок от чужого велосипеда.",
 "medium close-up at eye level, a very fair-haired boy of seven in a red tracksuit top holding a small cable lock out in both hands across a kitchen table",
 "he pushes the lock further across the table with both hands and lets go, the small clatter of a cable lock on oilcloth, "
 + ONE_FIGURE + ", no music",
 "the lock has slid to the middle of the table and his hands have withdrawn to the edge."),

("A6_SH02", 15, 1, "square", "CU", "eye", "push_in", "vlad_kitchen", "VLAD_MID",
 "ты должен спросить, чей он.",
 "close-up at eye level, Vlad seated at the kitchen table looking down at the small lock, the overhead bulb bright on his forehead, his hands not yet moving",
 "his eyes stay on the lock and his hand comes up to the table edge and stops, a chair creaking and a clock ticking on the wall, "
 + ONE_FIGURE + ", no music",
 "his hand has come to rest flat beside the lock and his eyes have lifted a fraction."),

("A6_SH03", 15, 2, "square", "ECU", "high", "push_in", "vlad_kitchen", None,
 "ты не спрашиваешь.",
 "extreme close-up from a high angle, a small cable lock lying on a kitchen oilcloth with a thin copper probe already resting against its keyway",
 "the probe slides into the keyway and turns a quarter revolution, the fine scrape of copper and a single click, "
 + EMPTY_LOCK + ", no music",
 "the probe has turned further and the cable has sprung a centimetre free of the body."),

("A6_SH04", 15, 3, "landscape", "MS", "eye", "static", "vlad_kitchen", "SON_KID",
 "он смеётся, когда дужка выскакивает из корпуса, и тут же просит показать ещё раз.",
 "medium shot at eye level, the fair-haired boy leaning right across the kitchen table on his elbows with his face close to the opened lock, laughing",
 "he pushes further onto his elbows and his shoulders shake with laughing, a child laughing and the lock rattling under his arm, "
 + ONE_FIGURE + ", no music",
 "he has come further across the table and one hand has closed around the opened lock."),

("A6_SH05", 16, 0, "narrow", "MCU", "eye", "static", "vlad_kitchen", "VLAD_MID",
 "и ты показываешь, потому что впервые за целый год он смотрит на тебя вот так.",
 "medium close-up at eye level, Vlad half-smiling across the table with the probe held up between two fingers, the kitchen bulb warm on one side of his face",
 "he turns the probe once between his fingers and holds it steady in the light, the small tick of copper on a thumbnail and a child breathing close, "
 + ONE_FIGURE + ", no music",
 "the probe has finished turning and points toward the boy, his smile a little wider."),

("A6_SH06", 16, 1, "narrow", "CU", "eye", "push_in", "vlad_kitchen", "SON_KID",
 "к восьми годам он открывает почтовый ящик соседей за одиннадцать секунд гнутой проволокой.",
 "close-up at eye level, the boy's small hands working a bent wire into a mailbox lock, his fringe hanging over his eyes, the tip of his tongue at the corner of his mouth",
 "the wire twists a quarter turn and his fingers adjust their grip, the tiny scrape of wire in a cheap lock and a stairwell door slamming below, "
 + ONE_FIGURE + ", no music",
 "the wire has turned further and the mailbox flap has sprung open a centimetre."),

("A6_SH07", 16, 2, "narrow", "MCU", "eye", "static", "vlad_kitchen", "NINA_MID",
 "жена говорит, чтобы ты немедленно это прекратил, и за двенадцать лет это единственный раз, когда она повышает голос.",
 "medium close-up at eye level, the dark-haired woman standing rigid in the kitchen doorway with one hand gripping the frame, her braid pulled forward over her shoulder",
 "her grip tightens on the doorframe and her chin comes up, the creak of a doorframe under a hand and a tap dripping, "
 + ONE_FIGURE + ", no music",
 "her chin is higher and her hand has slid down the doorframe, the knuckles pale."),

("A6_SH08", 16, 3, "landscape", "MS", "eye", "static", "vlad_kitchen", "VLAD_MID",
 "ты отвечаешь, что учишь его ремеслу, и сам почти в это веришь.",
 "medium shot at eye level, Vlad seated at the kitchen table with both hands flat on the oilcloth, looking toward the doorway rather than at the boy",
 "his hands press flatter on the oilcloth and his head turns toward the doorway, the creak of a chair and a fridge motor cutting in, "
 + ONE_FIGURE + ", no music",
 "his head has turned fully to the doorway and one hand has lifted off the table."),

("A6_SH09", 16, 4, "landscape", "MS", "eye", "track", "market_rows_90s", "VLAD_MID",
 "к девяносто седьмому тебя знают по имени там, где имя стоит дороже любых денег.",
 "medium shot at eye level, Vlad walking the market row with two traders turning to watch him pass, his tool wrap under his arm, awnings sagging above",
 "he passes between the tables and two traders turn their heads to follow him, duckboards knocking and a cassette player thinning behind, "
 + ONE_FIGURE + ", no music",
 "he is further along the row and both traders have turned fully after him."),

("A6_SH10", 17, 0, "tall_page", "FS", "low", "tilt_up", "market_rows_90s", "VLAD_MID",
 "четыреста дверей за девять лет, и ни из одной ты не вынес ни одной вещи.",
 "full-length shot from a low angle, Vlad standing alone at the end of a market row with containers rising on both sides, his hand flat over his breast pocket",
 "his hand presses flat over the breast pocket and holds there as he looks up the row, wind snapping the awnings and a shutter rolling somewhere, "
 + ONE_FIGURE + ", no music",
 "his hand has lowered from the pocket and his head has turned further up the row."),

("A6_SH11", 17, 1, "square", "CU", "eye", "static", "market_rows_90s", "VLAD_MID",
 "ты считаешь это доказательством того, что ты всё ещё мастер, а не вор.",
 "close-up at eye level, Vlad's face in flat grey market daylight, his eyes level and unhurried, his collar turned up against the cold",
 "his eyes stay level and he breathes out slowly, wind across an open market and canvas snapping, "
 + ONE_FIGURE + ", no music",
 "his eyes have narrowed slightly and his collar has shifted higher against his jaw."),

("A6_SH12", 17, 2, "wide", "WS", "eye", "pan_right", "market_rows_90s", None,
 "разницу между этими двумя словами понимаешь пока только ты.",
 "wide shot at eye level, the market row across its full width in fading light, empty trestle tables with their goods packed away, steel doors closed and padlocked along the containers",
 "a plastic sheet lifts and drops along the empty row and a padlock swings on its hasp, canvas snapping and a padlock knocking on steel, "
 + EMPTY_LOCK + ", no music",
 "the plastic sheet has folded over and the padlock hangs still against the door."),

# ═══════════════════════ АКТ 7 — вывеска, и последний заказ ═══════════════════════
("A7_SH01", 18, 0, "wide", "WS", "eye", "pan_left", "own_shop_98", None,
 "в девяносто восьмом ты выкупаешь помещение на первом этаже и вешаешь над входом вывеску со своей фамилией.",
 "wide shot at eye level, a newly opened locksmith's shop across its full width, a pegboard wall of cylinders and blanks in neat rows, a counter with a hinged flap, fresh paint and a laid floor",
 "the street door stands open and daylight moves across the new floor as a curtain lifts, the creak of a door spring and traffic passing outside, "
 + EMPTY_LOCK + ", no music",
 "the door has swung further open and the band of daylight has crossed further over the floor."),

("A7_SH02", 18, 1, "narrow", "MCU", "eye", "static", "own_shop_98", "VLAD_MID",
 "ты берёшь честные заказы, ставишь людям замки и первый раз за четыре года платишь налоги.",
 "medium close-up at eye level, Vlad behind the new counter writing on a receipt pad with a ballpoint, a receipt spike and a cash box beside his elbow",
 "he tears the receipt off the pad and pushes it onto the spike, the rip of paper and the small punch of a spike, "
 + ONE_FIGURE + ", no music",
 "the receipt is on the spike and his pen is set down flat on the counter."),

("A7_SH03", 18, 2, "narrow", "MS", "eye", "static", "own_shop_98", "NINA_MID",
 "жена приходит посмотреть и стоит на пороге, не заходя внутрь.",
 "medium shot at eye level, the dark-haired woman standing just inside the glazed street door of the shop with her handbag held in both hands, the counter across the room from her",
 "she takes one small step forward and stops with both hands still on the bag, the creak of a door spring and street traffic behind her, "
 + ONE_FIGURE + ", no music",
 "she is one step further inside and her hands have lowered the bag to her waist."),

("A7_SH04", 18, 3, "narrow", "CU", "eye", "push_in", "own_shop_98", "VLAD_MID",
 "ты говоришь ей, что всё закончилось, и в ту минуту это ещё не ложь.",
 "close-up at eye level, Vlad's face across the shop counter looking toward the door, daylight from the street on one side of him, warm bench lamp on the other",
 "his mouth moves once and his eyes stay on the door, only the hum of a bench lamp and traffic outside, "
 + ONE_FIGURE + ", no music",
 "his mouth has closed and his eyes have lowered to the counter in front of him."),

("A7_SH05", 18, 4, "narrow", "MS", "eye", "static", "own_shop_98", "GRISHA_MID",
 "в октябре дверь открывается, и в проёме стоит он.",
 "medium shot at eye level, the ginger man filling the glazed shop doorway in his long leather coat, one hand still on the door handle, daylight behind him",
 "he pushes the door wider with his shoulder and steps one pace into the shop, the door spring stretching and heavy footfalls on a new floor, "
 + ONE_FIGURE + ", no music",
 "he is a full pace inside the shop and the door has swung shut behind his shoulder."),

("A7_SH06", 19, 0, "square", "MCU", "eye", "static", "own_shop_98", "GRISHA_MID",
 "он не говорит ни слова про деньги, он говорит, что этот сейф не открыл ещё ни один человек.",
 "medium close-up at eye level, the ginger man at the shop counter with both palms down on it, leaning in, the pegboard of cylinders behind him out of focus",
 "his palms press flat on the counter and he leans further over it, the creak of a new counter and a ring tapping wood once, "
 + ONE_FIGURE + ", no music",
 "he has leaned in further and his head is lower, both palms still flat."),

("A7_SH07", 19, 1, "landscape", "MS", "eye", "push_in", "own_shop_98", "VLAD_MID",
 "и вот тут ты понимаешь, что тебя купили не деньгами, а обыкновенным интересом.",
 "medium shot at eye level, Vlad behind the counter with his hand resting on the closed cash box, his head turned toward the ginger man at the edge of frame",
 "his hand lifts off the cash box and comes to rest on the counter edge instead, the small knock of a hand on wood and a bench lamp humming, "
 + ONE_FIGURE + ", no music",
 "his hand has moved further along the counter toward the other man and his shoulders have squared."),

("A7_SH08", 19, 2, "square", "ECU", "top_down", "push_in", "own_shop_98", None,
 "он кладёт на прилавок фотографию, и на ней замок, которого ты не видел ни разу.",
 "extreme close-up from directly above, a shop counter with a colour photograph of a tall green strongroom safe with a spoked handwheel and a brass escutcheon, a bench lamp reflected on the print",
 "the photograph slides across the counter and stops squarely under the lamp, the slide of glossy paper on wood, "
 + EMPTY_LOCK + ", no music",
 "the photograph has come to rest under the lamp with the handwheel centred in the light."),

("A7_SH09", 19, 3, "square", "CU", "eye", "static", "own_shop_98", "VLAD_MID",
 "ты смотришь на неё дольше, чем смотрел на любую дверь за все девять лет.",
 "close-up at eye level, Vlad's face lowered over the photograph with his glasses pushed down onto his nose, the bench lamp lighting him from below",
 "his glasses slide a fraction lower and his eyes track slowly across the print, the faint crackle of paper and the lamp humming, "
 + ONE_FIGURE + ", no music",
 "his eyes have stopped moving and his hand has come into frame at the edge of the photograph."),

("A7_SH10", 20, 0, "landscape", "MS", "eye", "static", "own_shop_98", "VLAD_MID",
 "ты говоришь ему нет три раза за один вечер, а на четвёртый спрашиваешь, какого он года выпуска.",
 "medium shot at eye level, Vlad standing behind his counter at closing time with the shop lights off and only the bench lamp on, the photograph still lying in front of him",
 "he stands over the photograph and turns it ninety degrees with one finger, the scuff of paper turning on wood and a fridge unit humming next door, "
 + ONE_FIGURE + ", no music",
 "the photograph is turned and his finger rests on one corner of it, his head lowered further."),

("A7_SH11", 20, 1, "square", "MCU", "eye", "static", "vlad_kitchen", "NINA_MID",
 "дома ты говоришь, что уезжаешь на два дня по работе, и она даже не переспрашивает.",
 "medium close-up at eye level, the dark-haired woman standing at the kitchen table folding a shirt into a canvas bag, her braid over her shoulder, her face lowered",
 "she folds the sleeve across the shirt and presses it flat into the bag, the rustle of cloth and a bag buckle knocking on the table, "
 + ONE_FIGURE + ", no music",
 "the shirt is packed flat and her hands rest on the closed flap of the bag."),

("A7_SH12", 20, 2, "square", "CU", "high", "push_in", "vlad_kitchen", "SON_KID",
 "сын спрашивает, возьмёшь ли ты его с собой, и ты отвечаешь, что в другой раз.",
 "close-up from a high angle, the fair-haired boy looking up from beside the kitchen table with his hands on the edge of it, the scratched plastic watch on his right wrist",
 "he lifts his chin further and his fingers curl over the table edge, a child's voice cut off short and a bag zip closing, "
 + ONE_FIGURE + ", no music",
 "his chin has lowered again and his hands have slipped off the table edge."),

("A7_SH13", 20, 3, "square", "ECU", "eye", "static", "vlad_kitchen", None,
 "ты кладёшь щуп в нагрудный карман так же, как клал его двадцать два года подряд.",
 "extreme close-up at eye level, the thin copper probe being pushed through the buttonhole of a breast pocket, worn canvas and a loose thread beside it",
 "the probe slides through the buttonhole and seats against the fabric, the small dry scrape of copper on canvas, "
 + EMPTY_LOCK + ", no music",
 "the probe is fully seated in the buttonhole and the pocket flap has fallen closed over it."),

# ═══════════════════════ АКТ 8 — четыре часа и бумага внутри ═══════════════════════
("A8_SH01", 21, 0, "landscape", "MS", "eye", "track", "office_safe_room", "VLAD_MID",
 "кабинет на третьем этаже бывшего института, шторы задёрнуты наглухо, горит одна настольная лампа.",
 "medium shot at eye level, Vlad entering a panelled office at night with his tool wrap under his arm, heavy curtains drawn behind a desk, a single table lamp lighting the room",
 "he crosses the carpet and stops with the wrap still under his arm, muffled footfalls on carpet and a radiator ticking as it cools, "
 + ONE_FIGURE + ", no music",
 "he is two paces further into the room with the wrap lowered to his side."),

("A8_SH02", 21, 1, "landscape", "MS", "low", "tilt_up", "office_safe_room", "VLAD_MID",
 "сейф выше тебя на голову и стоит на бетонном постаменте, который заливали специально под него.",
 "medium shot from a low angle, Vlad standing before a tall deep-green strongroom safe on a low plinth, the spoked handwheel level with his chest, brass escutcheon dull in the lamp light",
 "he sets one palm flat on the safe door and leaves it there, the dull flat sound of a hand on thick steel, "
 + ONE_FIGURE + ", no music",
 "his palm has slid down the safe door to the level of the escutcheon."),

("A8_SH03", 21, 2, "square", "ECU", "eye", "push_in", "office_safe_room", None,
 "ты кладёшь ухо на холодную сталь и слышишь, что рядов внутри четыре, а не три.",
 "extreme close-up at eye level, the brass escutcheon and spoked handwheel of an old safe filling the frame, chipped enamel down the closing edge, a copper probe tip entering the keyway",
 "the handwheel turns a few degrees and stops against resistance, a deep muffled click somewhere inside thick steel, "
 + EMPTY_LOCK + ", no music",
 "the handwheel has turned a little further and the probe is deeper in the keyway."),

("A8_SH04", 21, 3, "square", "CU", "eye", "static", "office_safe_room", "VLAD_MID",
 "первый час ты только слушаешь и не поворачиваешь вообще ничего.",
 "close-up at eye level, Vlad's face pressed side-on against the cold safe door with his eyes closed, the table lamp lighting one cheek, the copper probe held at the keyway below",
 "his eyebrows draw together and his head presses a fraction harder against the steel, faint irregular clicks under the surface and a clock ticking across the room, "
 + ONE_FIGURE + ", no music",
 "his eyebrows have relaxed and his head has turned a few degrees along the steel."),

("A8_SH05", 21, 4, "square", "ECU", "high", "push_in", "office_safe_room", None,
 "четвёртый ряд садится позже остальных, ровно как тот штифт из ведра в семьдесят девятом.",
 "extreme close-up from a high angle, two fingertips on the copper probe at the safe keyway, the metal worn bright around the hole, everything beyond in darkness",
 "the fingertips rotate the probe a fraction and hold it there, one late click arriving after three quick ones, "
 + EMPTY_LOCK + ", no music",
 "the probe has rotated further and the fingertips have shifted their grip along it."),

("A8_SH06", 21, 5, "landscape", "MS", "eye", "static", "office_safe_room", "VLAD_MID",
 "ты открываешь его за четыре часа семь минут и садишься прямо на пол рядом с постаментом.",
 "medium shot at eye level, Vlad sitting down on the office carpet with his back against the plinth, the heavy safe door swung open above and behind his shoulder",
 "he lowers himself to the carpet and lets his hands drop onto his knees, the heavy swing of a steel door on its hinges and a long exhale, "
 + ONE_FIGURE + ", no music",
 "he is fully seated with his head tipped back against the plinth and his hands loose on his knees."),

("A8_SH07", 21, 6, "landscape", "MS", "eye", "push_in", "office_safe_room", "VLAD_MID",
 "и первый раз за девять лет тебе хочется посмотреть, что там внутри.",
 "medium shot at eye level, Vlad turned on the carpet to look up into the open mouth of the safe, one hand on the plinth edge, lamp light reaching only the lower shelf",
 "he turns on the carpet and pushes himself up onto one knee with a hand on the plinth, the scuff of cloth on carpet and a knee joint cracking, "
 + ONE_FIGURE + ", no music",
 "he is up on one knee with his head level with the open shelf and both hands on the plinth."),

("A8_SH08", 22, 0, "wide", "WS", "eye", "static", "office_safe_room", None,
 "там нет денег.",
 "wide shot at eye level, the office across its full width, the tall safe standing open with its shelves visible, stacked folders and bound papers inside, the desk and drawn curtains beyond",
 "a curtain moves once in a draught and the open safe door drifts a few centimetres, the creak of a heavy hinge and a radiator ticking, "
 + EMPTY_LOCK + ", no music",
 "the safe door has drifted further open and more of the paper shelves are visible."),

("A8_SH09", 22, 1, "wide", "WS", "eye", "push_in", "office_safe_room", None,
 "там лежат бумаги, и на верхней папке напечатаны фамилии, которые ты знаешь по своему подъезду.",
 "wide shot at eye level, the open safe shelves seen across the room, a topmost folder of typed lists lying open, the table lamp reaching just far enough to light its first page",
 "the top page of the open folder lifts and settles in the draught, the dry flap of paper and a curtain moving on its rail, "
 + EMPTY_LOCK + ", no music",
 "the page has settled flat again and a second page beneath it has lifted slightly."),

("A8_SH10", 23, 0, "wide", "WS", "eye", "static", "warehouse_yard", None,
 "через одиннадцать дней он не приходит за расчётом, и с тех пор его больше никто не видел.",
 "wide shot at eye level, the depot yard across its full width in daylight, the steel personnel door standing padlocked, an empty parking place by the barrier, weeds through the concrete joints",
 "wind crosses the empty yard and the boom barrier arm rocks slightly on its pivot, the creak of a barrier and a wire fence ringing, "
 + EMPTY_LOCK + ", no music",
 "the barrier arm has settled and a plastic bag has blown into the corner of the frame."),

("A8_SH11", 23, 1, "tall", "FS", "eye", "static", "own_shop_98", "VLAD_MID",
 "к тебе приходят другие люди и спрашивают не про сейф, а про то, что ты успел в нём прочитать.",
 "full-length shot at eye level, Vlad standing alone in the middle of his shop with the counter flap raised behind him, the street door dark, his hands empty at his sides",
 "he takes half a step back toward the counter and stops, the creak of a floorboard and the street door rattling in its frame, "
 + ONE_FIGURE + ", no music",
 "he is half a step further back with one hand raised to the counter behind him."),

("A8_SH12", 23, 2, "square", "CU", "eye", "push_in", "own_shop_98", "VLAD_MID",
 "ты говоришь, что ничего не читал, и это второй раз в жизни, когда тебе не верят.",
 "close-up at eye level, Vlad's face in the unlit shop with only street light on it, his eyes fixed level and his jaw locked, the pegboard dark behind him",
 "his jaw locks harder and his eyes stay level and fixed, the door rattling in its frame and a car passing outside, "
 + ONE_FIGURE + ", no music",
 "his eyes have lowered a fraction and his jaw has released, his mouth pressed thin."),

("A8_SH13", 23, 3, "tall", "FS", "low", "pull_out", "own_shop_98", None,
 "мастерскую ты закрываешь в марте девяносто девятого и вывеску со своей фамилией снимаешь сам.",
 "full-length shot from a low angle, the shop interior stripped bare, the pegboard empty of cylinders, a rolled sign leaning against the counter, daylight through unwashed glass",
 "dust drifts across the empty pegboard and the rolled sign slips a few centimetres down the counter, the scrape of a sign on wood and an empty room echoing, "
 + EMPTY_LOCK + ", no music",
 "the sign has slid further down and come to rest against the floor."),

# ═══════════════════════ АКТ 9 — он ставит замки и больше не снимает ═══════════════════════
("A9_SH01", 24, 0, "landscape", "MS", "eye", "static", "stairwell_2026", "VLAD_OLD",
 "с двухтысячного года ты только ставишь замки и не снимаешь больше ни одного.",
 "medium shot at eye level, an older broad-shouldered Vlad in a faded blue workshop coat fitting a new cylinder into a steel door on a landing, a toolbag open at his feet",
 "he drives the cylinder home with the heel of his hand and reaches for a screwdriver, the thud of a palm on steel and a screwdriver ringing in a bag, "
 + ONE_FIGURE + ", no music",
 "the cylinder is seated and the screwdriver is in his hand at the faceplate."),

("A9_SH02", 24, 1, "landscape", "MS", "eye", "track", "stairwell_2026", "VLAD_OLD",
 "люди зовут тебя, потому что ты старый и берёшь дёшево, а вовсе не потому, что ты лучший.",
 "medium shot at eye level, Vlad walking a bright contemporary landing with a toolbag in one hand, three flush steel doors and a new intercom panel beside an old bell push",
 "he carries the bag past the doors with his eyes straight ahead and the bag swings against his leg, a bag knocking on a knee and an LED fitting clicking on, "
 + ONE_FIGURE + ", no music",
 "he is further along the landing with the bag swung forward and his head turned away from the doors."),

("A9_SH03", 24, 2, "tall", "FS", "eye", "static", "own_flat_door", "VLAD_OLD",
 "на своей собственной двери к две тысячи пятнадцатому у тебя стоит семь замков разных лет.",
 "full-length shot at eye level, Vlad standing in a cramped hallway facing the inside of his own steel entrance door, seven separate locks fitted down its closing edge at uneven intervals",
 "he reaches up and turns the topmost lock and then lowers his hand to the next, two heavy bolts throwing one after the other, "
 + ONE_FIGURE + ", no music",
 "his hand is at the second lock down and the top bolt is fully thrown."),

("A9_SH04", 24, 3, "square", "ECU", "eye", "push_in", "own_flat_door", None,
 "самый новый ты поставил в мае, хотя в подъезде за двадцать лет не случилось ни одной кражи.",
 "extreme close-up at eye level, the closing edge of a steel door with three of the seven locks visible, one bright and new, one worn to bare brass, a strip of draught seal between them",
 "a bolt slides across and seats with a solid knock, the heavy metallic thud of a bolt in its keeper, "
 + EMPTY_LOCK + ", no music",
 "the bolt is fully across and a second bolt below it has begun to move."),

("A9_SH05", 24, 4, "square", "MCU", "eye", "static", "own_flat_door", "VLAD_OLD",
 "ты закрываешь их каждый вечер сверху вниз и на слух узнаёшь, если хоть один идёт туго.",
 "medium close-up at eye level, Vlad's face in the dim hallway lit by one ceiling fitting, his head tilted as he works a lock out of frame, reading glasses up on his forehead",
 "his head tilts a few degrees further and his hand pauses mid-turn, one bolt grating instead of clicking cleanly, "
 + ONE_FIGURE + ", no music",
 "his head has straightened and his hand has resumed turning, his mouth pressed thin."),

("A9_SH06", 24, 5, "tall", "FS", "eye", "pull_out", "own_flat_door", "VLAD_OLD",
 "жена уходит от тебя в две тысячи девятом и оставляет свои ключи на тумбочке в прихожей.",
 "full-length shot at eye level, Vlad standing alone in the hallway facing the locked door, a set of keys lying on a low shelf beside him, coats crowded on hooks",
 "he turns from the door and stops with his hand hovering just short of the keys on the shelf, the creak of a floorboard and a clock ticking in another room, "
 + ONE_FIGURE + ", no music",
 "his hand has lowered away from the shelf and he has turned fully toward the hallway."),

("A9_SH07", 25, 0, "square", "MCU", "eye", "static", "stairwell_2026", "SON_ADULT",
 "сын вырастает, и в девятнадцать лет он первый раз открывает чужую дверь.",
 "medium close-up at eye level, a heavy-shouldered fair-haired man in a black quilted jacket standing at a landing door, a scratched steel watch on his right wrist, his face flat and unhurried",
 "his shoulders square toward the door and his weight shifts onto the back foot, the creak of a jacket and a landing sensor light clicking on, "
 + ONE_FIGURE + ", no music",
 "his weight has moved fully onto the back foot and his shoulders have turned further to the door."),

("A9_SH08", 25, 1, "square", "CU", "eye", "push_in", "stairwell_2026", "SON_ADULT",
 "он не слушает механизм, потому что ты научил его только одному: дверь это не преграда.",
 "close-up at eye level, the younger man's face under the hard landing LED, his eyes on the door lock, no tools in his hands, his jaw relaxed",
 "his eyes stay on the lock and he breathes in once through his nose, the hum of an LED fitting and a lift running behind the wall, "
 + ONE_FIGURE + ", no music",
 "his eyes have lifted from the lock to the middle of the door and his chin has dropped slightly."),

("A9_SH09", 25, 2, "square", "ECU", "eye", "static", "stairwell_2026", None,
 "у него нет ни щупа, ни терпения, ни того самого четвёртого штифта.",
 "extreme close-up at eye level, a modern door cylinder in a flush steel door, the escutcheon unmarked, hard even LED light and no shadow anywhere on it",
 "the cylinder sits unmoving and the light on it does not change, only the hum of an LED fitting and a distant lift, "
 + EMPTY_LOCK + ", no music",
 "the cylinder is unchanged and a faint vibration has begun to blur its edge."),

("A9_SH10", 25, 3, "landscape", "MS", "eye", "static", "stairwell_2026", "SON_ADULT",
 "он открывает её ногой за одну секунду и заходит внутрь, ни разу не оглянувшись.",
 "medium shot at eye level, the younger man's boot planted against a steel door beside the lock, the door frame splintering at the strike plate, his body braced back",
 "the door bursts inward off the strike plate and the frame splinters, a single heavy impact and wood cracking, "
 + ONE_FIGURE + ", no music",
 "the door has swung fully inward and his boot has come down onto the threshold."),

("A9_SH11", 26, 0, "wide", "WS", "eye", "static", "stairwell_2026", None,
 "разницу между вами понимаешь только ты, и объяснять её уже некому.",
 "wide shot at eye level, a contemporary landing across its full width, one steel door standing open with a splintered frame, the other doors closed, a bag of rubble against the wall",
 "the broken door rocks once on its hinges and settles against the wall, the knock of steel on plaster and a sensor light clicking off, "
 + EMPTY_LOCK + ", no music",
 "the door has come to rest against the wall and the landing has gone noticeably darker."),

("A9_SH12", 26, 1, "wide", "WS", "eye", "push_in", "own_flat_door", None,
 "твоя дверь в это самое время закрыта на семь замков, и ты сидишь за ней один.",
 "wide shot at eye level, the inside face of the seven-locked steel door across the full width of a cramped hallway, coats crowded on hooks, a dim mirror gone grey at the corners",
 "the coats on the hooks sway slightly and settle, the creak of a coat hook and a clock ticking beyond the frame, "
 + EMPTY_LOCK + ", no music",
 "the coats have settled still and the hallway light has dimmed a fraction."),

# ═══════════════════════ ФИНАЛ — семь ключей на одном кольце ═══════════════════════
("F_SH01", 27, 0, "wide", "WS", "eye", "pan_right", "own_shop_98", None,
 "тебе шестьдесят лет, и ты опять сидишь в мастерской размером два метра на три.",
 "wide shot at eye level, a small workshop room across its full width in evening light, a bench with a vice and trays of pins under a swan-neck lamp, a pegboard half empty above it",
 "the bench lamp flickers once and steadies over the trays of pins, the tick of a lamp ballast and a radiator cooling, "
 + EMPTY_LOCK + ", no music",
 "the lamp burns steadily and the pool of light on the bench has widened slightly."),

("F_SH02", 27, 1, "narrow", "MCU", "eye", "static", "own_shop_98", "VLAD_OLD",
 "руки у тебя всё те же самые, и слышат они ровно так же, как в двадцать восемь.",
 "medium close-up at eye level, Vlad at sixty seated at the workbench with a cut-away cylinder in his fingers, reading glasses down on his nose, the bench lamp warm on his hands",
 "his fingers turn the cylinder a quarter revolution and stop, three quick clicks and then one late one, "
 + ONE_FIGURE + ", no music",
 "the cylinder has turned further and his eyes have lifted from it toward the window."),

("F_SH03", 27, 2, "narrow", "CU", "eye", "push_in", "own_shop_98", "VLAD_OLD",
 "четвёртый штифт до сих пор садится позже всех остальных.",
 "close-up at eye level, Vlad's face at the bench with his eyes closed and his head tilted toward his own hands, the lamp lighting the underside of his jaw",
 "his head tilts a fraction further and his eyebrows lift once, a single late click arriving after the others, "
 + ONE_FIGURE + ", no music",
 "his eyebrows have settled and his eyes have opened, still lowered to his hands."),

("F_SH04", 27, 3, "narrow", "MS", "eye", "static", "own_shop_98", "SON_ADULT",
 "сын заходит в мастерскую в ноябре и просит открыть ему одну дверь.",
 "medium shot at eye level, the thirty-six-year-old standing just inside the workshop door in his black quilted jacket, hands loose at his sides, the bench and lamp across the room",
 "he takes one step in from the doorway and stops with his hands still at his sides, a door spring stretching and a boot scuffing concrete, "
 + ONE_FIGURE + ", no music",
 "he is one step further in and his weight has settled evenly on both feet."),

("F_SH05", 27, 4, "narrow", "CU", "eye", "static", "own_shop_98", "VLAD_OLD",
 "ты можешь отказать ему ровно один раз, и это единственный раз, который у тебя ещё остался.",
 "close-up at eye level, Vlad's face turned from the bench toward the doorway, the lamp lighting one cheek, his glasses pushed up onto his forehead",
 "his head turns fully to the doorway and his hands stop moving on the bench, the workshop going quiet and a radiator ticking, "
 + ONE_FIGURE + ", no music",
 "his head has turned back toward the bench and his eyes have lowered to his hands."),

("F_SH06", 28, 0, "tall", "FS", "eye", "static", "own_shop_98", "VLAD_OLD",
 "ты встаёшь, снимаешь халат и берёшь с полки свёрток, который не разворачивал одиннадцать лет.",
 "full-length shot at eye level, Vlad standing at the bench having taken off the blue workshop coat, a rolled cloth tool wrap in one hand, the coat over the stool behind him",
 "he lifts the rolled wrap off the bench and holds it against his chest, the soft creak of old cloth and a stool leg scraping, "
 + ONE_FIGURE + ", no music",
 "the wrap is held higher against his chest and his other hand has come up to steady it."),

("F_SH07", 28, 1, "square", "ECU", "top_down", "push_in", "own_shop_98", None,
 "внутри лежит та самая медная полоска, которую ты сточил в семнадцать на школьном наждаке.",
 "extreme close-up from directly above, an unrolled cloth tool wrap on a bench with a single thin copper probe lying in its pocket, the cloth stained dark with years of oil",
 "the cloth settles open and the copper probe rolls a few millimetres in its pocket, the soft unrolling of oiled cloth and one small metallic tick, "
 + EMPTY_LOCK + ", no music",
 "the cloth lies fully open and the probe has come to rest against the seam."),

("F_SH08", 28, 2, "tall", "FS", "eye", "static", "own_shop_98", "VLAD_OLD",
 "ты кладёшь её обратно на верстак и говоришь ему, что больше этого не умеешь.",
 "full-length shot at eye level, Vlad standing at the bench setting the copper probe down onto the wood with two fingers, the rolled wrap left open beside it, his son out of frame",
 "he sets the probe down on the bench and lifts his fingers clear of it, a single small tap of copper on wood, "
 + ONE_FIGURE + ", no music",
 "his hand has withdrawn to his side and the probe lies alone in the lamp light."),

("F_SH09", 28, 3, "wide", "WS", "eye", "static", "own_shop_98", None,
 "он не спорит и не уговаривает, он просто уходит, потому что ты ему давно не нужен.",
 "wide shot at eye level, the workshop across its full width with the street door swinging shut, the bench and lamp on one side, no one in the room",
 "the street door swings shut and the pegboard blanks knock once against the wall, a door closing and a spring pulling it tight, "
 + EMPTY_LOCK + ", no music",
 "the door is fully closed and the hanging blanks have stopped swinging."),

("F_SH10", 29, 0, "tall_page", "FS", "low", "tilt_up", "own_flat_door", "VLAD_OLD",
 "вечером ты закрываешь свою дверь сверху вниз, все семь замков, и слушаешь каждый.",
 "full-length shot from a low angle, Vlad at sixty standing before the inside of his own door in the cramped hallway, one hand raised to the topmost of seven locks, coats crowding him from the side",
 "his hand turns the top lock and moves straight down to the next, seven bolts throwing one after another in an uneven rhythm, "
 + ONE_FIGURE + ", no music",
 "his hand has reached the lowest lock and all the bolts above it are thrown."),

("F_SH11", 29, 1, "square", "ECU", "top_down", "push_in", "own_flat_door", None,
 "семь ключей на одном стальном кольце, и все они от одной и той же двери.",
 "extreme close-up from directly above, a steel ring on a hallway shelf carrying seven keys of different ages and makes, one bright and new, one worn to bare brass, the copper probe lying beside them",
 "the ring settles and one key slides across another and stops, a short bright jangle dying away, "
 + EMPTY_LOCK + ", no music",
 "the keys hang still on the ring, the newest one lying flat across the oldest."),

("F_SH12", 29, 2, "wide", "WS", "eye", "static", "own_flat_door", None,
 "эта история вымышлена, все совпадения с реальными людьми случайны, и не повторяй чужих ошибок.",
 "wide shot at eye level, the cramped hallway across its full width, the seven-locked door closed, the coats still, a single dim ceiling fitting, the mirror grey at the corners",
 "the ceiling fitting dims a fraction and the hallway settles into stillness, only the tick of a clock beyond the frame, "
 + EMPTY_LOCK + ", no music",
 "the light has dimmed further and the hallway is almost dark, the door unchanged."),
]


def q(s):
    """SQL-литерал, одинарные кавычки удвоены."""
    return "'" + s.replace("'", "''") + "'"


def emit(rows):
    out = []
    out.append("-- СГЕНЕРИРОВАНО scripts/seed_safecracker_shots.py — не править руками.")
    out.append("BEGIN;")
    out.append("")
    for (code, page, slot, shape, stype, angle, move, loc, prof,
         ru, pos, mot, endf) in rows:
        act = code.split("_")[0]
        prof_sql = q(prof) if prof else "NULL"
        out.append(f"""-- {code}
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "endFramePrompt", "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, {q(code)},
  jsonb_build_object(
    'positive', {q(pos)},
    'motionPrompt', {q(mot)},
    'motionNegative', {q(MOTION_NEG)},
    'camera', jsonb_build_object('shotType', {q(stype)}, 'angle', {q(angle)}, 'movement', {q(move)})
  ),
  {q(ru)}, {q(stype)}, {q(angle)}, {q(move)},
  (SELECT l.id FROM locations l WHERE l."projectId" = p.id AND l.slug = {q(loc)}),
  'animated', cp.id, {q(shape)}, {slot},
  (SELECT pr.id FROM character_profiles pr
     JOIN characters c ON c.id = pr."characterId"
    WHERE c."projectId" = p.id AND pr."profileCode" = {prof_sql}),
  {q(endf)}, false, false, now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = {q(act)}
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = {page}
WHERE p.slug = {q(SLUG)};""")
        if prof:
            out.append(f"""INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, {q(prof)}, pr.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles pr ON pr."profileCode" = {q(prof)}
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE p.slug = {q(SLUG)} AND s."shotCode" = {q(code)};""")
        out.append("")
    out.append("COMMIT;")
    return "\n".join(out)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(emit(SHOTS))
