# -*- coding: utf-8 -*-
"""Кадры фильма «ТЫ — Эвакуаторщик» (slug: towtruck), 190 кадров под план вёрстки.

Проект посажен 24.08 (проект, персонажи, локации, props, сцены, блоки, 44 страницы
`comic_pages`). Этот файл добавляет ТОЛЬКО кадры — 190 строк `shots` + участников.

Запуск печатает UTF-8 .sql, который применяется через `psql -f`
(кириллица через `psql -c` на Windows ломается):

    python scripts/seed_towtruck_shots.py > scripts/seed_towtruck_02_shots.sql
    psql -U gen_studio -h localhost -d gen_studio -f scripts/seed_towtruck_02_shots.sql

Колонки строки:
    code, page, slot, shape, shotType, angle, move, loc, prof, prop, ru, pos, mot, flags

`prof`  = None → кадр без опознаваемого лица (участник не создаётся, §2d-1);
          "CODE" → один участник; ("A","B") → два.
`prop`  = код props для кадра-предмета; тогда `loc` = None (§17.3, prop-hero).
`flags` = "" | "i" (isIconic) | "b" (isBroll) | "ib".

Позитивы — Qwen-Image-Edit-2511 (`Skill(gen-studio-qwen2511)`): проза ≤55 слов,
вводное слово согласовано с формой панели (§5A.3b), клауза КОРПУСА сразу после
имени (§2b), ни одного отрицания, ни стилевого блока, ни клаузы движения камеры.

Моушен — диалект LTX-2.5 (`Skill(gen-studio-ltx25)`): действие → звук → замок →
`no music`. Камера НЕ пишется руками, она приходит колонкой `cameraMove`.
Речи в звуке нет (§2.2): ни реплик, ни `says`, ни `voices`, ни `chatter`.
"""
import sys

SLUG = "towtruck"
PID = "7e7d0000-0000-4000-8000-000000000001"

NEG_CHAR = ("extra people, additional figures, duplicate person, twin, clone, "
            "background crowd, anime character, anime girl, manga character, "
            "extra limbs, deformed face, photoreal, photograph, 3D render, "
            "plastic skin, flicker, warping, scene cut, identity change")

NEG_ENV = ("people, person, man, woman, human figure, figures, characters, crowd, "
           "silhouettes of people, anime character, manga character, "
           "extra humans appearing, doors opening, photoreal, photograph, "
           "3D render, plastic skin, deformed, flicker, warping, scene cut")

# Позитивные замки (§5.3 — отрицания в моушене запрещены, кроме `no music`).
EMPTY = "the place stays deserted, every surface and object holding its exact position"
ONE = "the same single figure throughout the shot"
TWO = "the same two figures throughout the shot"
BACKGROUND = "the background figures holding their places with only the smallest shifts of weight"
# §4c(b): на кадре, где субъект — руки, замок пустоты спорит с картинкой.
HANDS = "the same hands already in frame throughout the shot, every other surface holding its exact position"
NEG_HANDS = ("extra hands, additional fingers, a second pair of arms, extra limbs, a face appearing, background crowd, anime character, manga character, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping, scene cut")

SHOTS = [

# ══════════════════ АКТ 1 — Эстакада в гололёд (9) ══════════════════
# §4.0b: кадр 1 уже ВНУТРИ аварии; крюк (детское кресло) на 4-м кадре ≈ 17 с;
# хук-строка кадр 5 ≈ 22 с, CTA кадр 6 ≈ 26 с. §4.0c: острота снята, история открыта.
("A1_SH01", 0, 0, "wide", "WS", "eye", "static", "flyover_night", None, None,
 "ночь, гололёд, эстакада, и разбитая машина закрыла собой всю проезжую часть.",
 "wide shot at eye level, a four-lane flyover across its full width at night, a crashed hatchback lying broadside over both lanes with its bumper torn away, a tow truck backed up to it with a yellow steel platform, sodium lamps laying long orange pools on iced black asphalt",
 "loose plastic trim skitters a hand's width across the ice and the amber beacon sweeps the parapet once, wind combing the crash barrier and a distant engine note rising from below the deck, "
 + EMPTY + ", no music", "i"),

("A1_SH02", 0, 1, "wide", "WS", "eye", "push_in", "flyover_night", None, None,
 "следующая пойдёт через минуту, а убирать её здесь больше некому.",
 "wide shot at eye level, the tow truck reversing toward the wrecked hatchback with its yellow platform already tilting back to the road, headlights of the next car rising far down the flyover, grit and broken trim scattered across the ice",
 "the platform tips a few degrees lower and the far headlights grow brighter along the deck, a hydraulic pump droning and salt grit crunching under slow tyres, "
 + EMPTY + ", no music", ""),

("A1_SH03", 1, 0, "tall_page", "FS", "low", "tilt_up", "flyover_night", "VIKTOR_MID", None,
 "ты заводишь трос и поднимаешь борт один, без напарника.",
 "low-angle full-length shot, Viktor braced with his weight on his forward foot and his shoulders squared, both hands feeding the steel cable out toward the wreck, the tilted yellow platform rising past him, an amber beacon flaring above his head",
 "he pays the cable out two arm-lengths and his back foot slides a little on the ice, the ratchet clicking as the drum turns and the cable slapping once on steel, "
 + ONE + ", no music", "i"),

("A1_SH04", 1, 1, "square", "ECU", "eye", "push_in", "flyover_night", None, None,
 "на заднем сиденье пустое детское кресло, ребёнка увезли до тебя.",
 "extreme close-up on the rear bench of the crashed car seen through shattered side glass, an empty child seat strapped in the middle with its harness lying open, one small mitten on the upholstery beside it, cold blue light crossing the seat",
 "the loose harness strap swings a few centimetres and settles against the buckle, glass crumbs ticking as they slide down the door card and wind pressing at the broken window, "
 + EMPTY + ", no music", "i"),

("A1_SH05", 1, 2, "wide", "WS", "eye", "static", "flyover_night", None, None,
 "сейчас я расскажу, как человек, который убирает чужие аварии, устроил свою.",
 "wide shot at eye level, the wrecked hatchback strapped down on the yellow platform across the frame, the flyover parapet and the dark city blocks far below, sodium lamps overhead, the cleared lane already carrying traffic past on the far side",
 "the strapped wreck settles a centimetre on its springs and traffic slides past in the far lane, tyres hissing on wet asphalt and a strap humming in the wind, "
 + EMPTY + ", no music", ""),

("A1_SH06", 2, 0, "landscape", "MS", "eye", "static", "flyover_night", "VIKTOR_MID", None,
 "останься до конца и подпишись, если хочешь увидеть, где я свернул.",
 "medium shot at eye level, Viktor half-turned from the platform with his weight on his back foot, one hand hauling a ratchet strap tight across the wrecked car's wheel, amber light pulsing along the side of his face and his reflective bands",
 "he throws his weight back on the strap and it snaps taut across the tyre, the ratchet handle clacking twice and webbing creaking under load, "
 + ONE + ", no music", ""),

("A1_SH07", 2, 1, "square", "CU", "eye", "static", "flyover_night", "KOSTYA_MID", None,
 "инспектор Костя меряет рулеткой расстояние от машины до столба.",
 "close-up at eye level, Kostya's face half-turned toward the parapet with his chin lowered, the extended blade of a black steel tape measure crossing the lower frame in his own hand, cold blue light along one cheek and his high-visibility collar",
 "the tape blade dips and he lets it run out another span before his thumb stops it, the thin rattle of steel tape and a wind gust across the parapet, "
 + ONE + ", no music", ""),

("A1_SH08", 2, 2, "square", "MCU", "eye", "static", "flyover_night", ("KOSTYA_MID", "VIKTOR_MID"), None,
 "ты хорошо работаешь, говорит он, приезжай завтра, есть разговор.",
 "medium close-up at eye level, Kostya squared to Viktor with his weight even on both feet and one hand resting on his belt, Viktor listening in three-quarter profile with his shoulders low, the loaded platform blurred behind them under amber light",
 "Kostya lifts his hand off the belt and lets it drop again while Viktor's shoulders turn a few degrees toward him, the tape blade snapping back into its case and wind pulling at two jackets, "
 + TWO + ", no music", ""),

("A1_SH09", 2, 3, "square", "ECU", "top_down", "push_in", None, None, "WINCH",
 "храповик лебёдки щёлкает сам по себе, и этот звук ты уже слышал.",
 "extreme close-up from directly above, the drum of a winch with its spring-loaded ratchet pawl resting against the drum teeth, the first metre of cable polished mirror-bright, a shallow dent in the dark green housing, one amber light raking across the oil",
 "the pawl lifts off a tooth and drops back onto the next one twice over, two dry metallic clicks with a long pause between them and wind moving over the drum, "
 + EMPTY + ", no music", "i"),

# ══════════════════ АКТ 2 — Девять лет, храповик во дворе (16) ══════════════════
# Origin. Отец и водитель эвакуатора намеренно без якорей: двор показан
# глазами девятилетнего — взрослые со спины, в профиль и на расстоянии.
("A2_SH01", 3, 0, "narrow", "MS", "eye", "static", "courtyard_old", "VIKTOR_KID", None,
 "тебе девять лет, зимнее утро, и во дворе стоит эвакуатор с жёлтой платформой, которого вчера здесь не было.",
 "medium shot at eye level, Viktor at nine standing on the entrance step with his weight on one foot and his shoulders drawn up, his oversized quilted coat buttoned to the chin, the yellow platform of a tow truck filling the frozen courtyard behind him",
 "his shoulders draw up another centimetre and his head turns slowly to follow something across the yard, a diesel engine idling and a rook calling from a bare poplar, "
 + ONE + ", no music", ""),

("A2_SH02", 3, 1, "narrow", "CU", "eye", "push_in", None, None, "FATHER_SEDAN",
 "платформа наклонена к самому асфальту, трос уже заведён под отцовскую машину, и ты видишь это из подъезда.",
 "close-up low at the front corner of an aubergine sedan, a steel cable hooked under the suspension arm, the repainted right fender a shade off from the door beside it, frozen slush and salt crusted along the wheel arch above",
 "the cable draws tight against the suspension arm and the front of the car lifts a finger's width, the creak of loading steel and a slow ratchet turning somewhere off frame, "
 + EMPTY + ", no music", ""),

("A2_SH03", 3, 2, "narrow", "MCU", "eye", "static", "courtyard_old", None, None,
 "отец выбегает на улицу в куртке нараспашку, но лебёдка работает уже полминуты и останавливать её никто не станет.",
 "medium close-up from behind and slightly to one side, a heavy man in an open brown quilted jacket and a knitted cap coming down the entrance steps, his back and one shoulder filling the frame, the snow-bright courtyard opening beyond him",
 "he takes the last two steps down and his open jacket swings out from his sides, boots hitting frozen concrete and a stairwell door banging shut behind him, "
 + ONE + ", no music", ""),

("A2_SH04", 3, 3, "landscape", "WS", "eye", "static", "courtyard_old", None, None,
 "соседи стоят в окнах на всех этажах и смотрят, но вниз за всю погрузку не выходит никто.",
 "wide shot at eye level, the enclosed courtyard between four-storey panel blocks, the aubergine sedan drawn halfway up a tilted yellow platform, small figures at three lit windows above and one at a balcony rail, grey ridges of ploughed snow along the kerb",
 "the sedan creeps a hand's width further up the ramp and a curtain shifts at one of the windows, a winch motor labouring and tyres scuffing over ribbed steel, "
 + BACKGROUND + ", no music", ""),

("A2_SH05", 3, 4, "landscape", "MS", "eye", "static", "courtyard_old", None, None,
 "водитель заполняет квитанцию, упирая её в предплечье, и ни разу за весь разговор не поднимает глаз.",
 "medium shot at eye level, a tow-truck driver in a padded jacket standing at the cab door writing on a carbon pad braced against his forearm, the man in the brown jacket half a step from him with both arms down, the loaded platform behind them",
 "the driver's pen runs to the end of a line and he turns the pad over without lifting his head, a pen scratching on carbon paper and an engine idling behind, "
 + TWO + ", no music", ""),

("A2_SH06", 4, 0, "landscape", "MS", "eye", "static", "courtyard_old", None, None,
 "отец считает деньги в ладони прямо у бордюра, пересчитывает второй раз, и на месте их всё равно не хватает.",
 "medium shot at eye level, the man in the brown quilted jacket standing at the kerb three-quarters away from camera, his head down over a small fold of notes in his cupped palm, his other hand pushed into the jacket pocket",
 "his thumb turns two notes over in the cupped palm and stops, paper rasping on paper and a bus pulling away past the arch, "
 + ONE + ", no music", ""),

("A2_SH07", 4, 1, "landscape", "WS", "eye", "track", "courtyard_old", None, None,
 "машину увозят в одиннадцать утра, а домой она вернётся только через девятнадцать суток, и то не сама.",
 "wide shot at eye level, the tow truck carrying the aubergine sedan turning out through the courtyard arch, the bare rectangle of dry asphalt it left behind in the middle of the frame, the carpet-beating frame and the bench beside it",
 "the loaded truck clears the arch and the dry rectangle of asphalt opens fully to view, the exhaust note deepening and dropping away under the arch, "
 + EMPTY + ", no music", ""),

("A2_SH08", 4, 2, "tall", "MS", "eye", "static", "courtyard_old", "VIKTOR_KID", None,
 "ты остаёшься один на середине двора в наглухо замотанном шарфе и смотришь, как платформа уходит под арку.",
 "medium shot at eye level, Viktor at nine alone on the cracked asphalt with his weight on both feet and his arms flat at his sides, the knitted scarf wound twice at his neck, the empty archway and grey snow ridges behind him",
 "his head turns a few degrees further after the sound and one boot shifts on the ice, the engine note fading beyond the arch and a rook answering above the roofline, "
 + ONE + ", no music", ""),

("A2_SH09", 4, 3, "square", "ECU", "top_down", "push_in", None, None, "WINCH",
 "храповик на лебёдке щёлкает три раза с длинными паузами между щелчками, и этот звук остаётся с тобой насовсем.",
 "extreme close-up from directly above, the ratchet pawl on a winch drum caught between two teeth, the polished first metre of cable wound tight beneath it, cold flat daylight on oil-darkened steel and the dented drum cover",
 "the pawl rides up over one tooth, then another, then a third and holds, three dry clicks spaced wide apart and cold air moving across the drum, "
 + EMPTY + ", no music", "i"),

("A2_SH10", 4, 4, "square", "MCU", "eye", "static", "courtyard_old", "VIKTOR_KID", None,
 "тебе девять лет, и ты ещё не знаешь, зачем запомнил эти щелчки, а не что-то другое.",
 "medium close-up at eye level, Viktor at nine with his shoulders drawn up and his face turned slightly away from camera, chin lifted, listening rather than looking, the knitted scarf against his jaw, flat winter daylight on the pale block wall behind him",
 "his chin lifts a fraction more and his eyes move off to the side without his head following, cold air moving past and a distant engine dropping away, "
 + ONE + ", no music", ""),

("A2_SH11", 4, 5, "tall", "FS", "eye", "static", "courtyard_old", None, None,
 "отец возвращается во двор пешком через час, садится на лавку у подъезда и до вечера не говорит ни слова.",
 "full-length shot at eye level, the man in the brown quilted jacket walking back across the courtyard toward the entrance with his weight forward and both hands in his pockets, the jacket now buttoned, the bare asphalt rectangle behind him",
 "he takes two more paces toward the entrance and his other foot comes forward, boots on frozen asphalt and a stairwell door on a spring somewhere ahead, "
 + ONE + ", no music", ""),

("A2_SH12", 5, 0, "square", "ECU", "top_down", "static", "flat_kitchen", None, None,
 "за хранение берут двести пятьдесят в сутки, счётчик идёт с первой минуты, и остановить его нельзя.",
 "extreme close-up from directly above, a carbon-copy receipt lying on a laminate kitchen table under warm ceiling light, a daily storage rate written in ballpoint and a purple stamp across the corner, the rim of a chipped mug at the edge of frame",
 "the top sheet of the receipt curls a few millimetres at its corner and settles again, paper crackling faintly and a wall clock ticking through the room, "
 + EMPTY + ", no music", ""),

("A2_SH13", 5, 1, "wide", "WS", "eye", "static", "flat_kitchen", None, None,
 "дома считают деньги всю неделю, раскладывают их на три стопки, и каждый вечер получается меньше, чем нужно.",
 "wide shot at eye level, a kitchen table across the full width of the frame under one warm ceiling fitting, three sorted stacks of small notes with a receipt between them, a boy's folded arms at the near edge and a man's cuff resting at the far edge",
 "a note slides off the top of one stack and lies flat on the laminate, paper settling and a kettle beginning to tick on the ring, "
 + HANDS + ", no music", ""),

("A2_SH14", 5, 2, "tall_page", "FS", "low", "tilt_up", "courtyard_old", "VIKTOR_KID", None,
 "на асфальте держится сухое пятно ровно по размеру машины, и всю неделю через него ходят напрямую.",
 "low-angle full-length shot, Viktor at nine standing alone on the dry rectangle of asphalt where the sedan had been, his weight even and his chin lifted, the four-storey panel block rising away above him with laundry lines and a single yard lamp against grey sky",
 "he shifts his weight from one foot to the other and his chin comes up further, wind pulling at a laundry line above and a bottle rolling somewhere out of frame, "
 + ONE + ", no music", "i"),

("A2_SH15", 6, 0, "wide", "WS", "eye", "static", "impound_lot", None, None,
 "на девятнадцатые сутки за хранение отдают больше, чем отец приносит домой за целый месяц работы.",
 "wide shot at eye level, the impound yard gate across the full width of the frame, a striped boom barrier down over the entry lane, two small figures standing at the wicket window of a single-storey office block, rows of tarpaulined cars stretching behind the chain-link",
 "the boom barrier lifts a few degrees and stops halfway, a motor whining and stopping and wind snapping a loose tarpaulin down the row, "
 + BACKGROUND + ", no music", ""),

("A2_SH16", 6, 1, "wide", "WS", "eye", "push_in", "impound_lot", None, None,
 "отцовский седан ждёт вас в тридцать первом боксе под слоем мокрых листьев, с разряженным аккумулятором.",
 "wide shot at eye level, a numbered bay in the impound yard with the aubergine sedan standing in it under a drift of wet fallen leaves, flaking white paint marking the bay lines, chain-link and barbed wire running across the background",
 "two wet leaves slide down the windscreen and stop against the wiper, leaves rustling on glass and floodlight ballast humming above the row, "
 + EMPTY + ", no music", ""),

# ══════════════════ АКТ 3 — Оплата за штуку (18) ══════════════════
("A3_SH01", 7, 0, "landscape", "MS", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "помощником на чужую машину ты садишься в двадцать шесть, а своя смена появляется в двадцать девять.",
 "medium shot at eye level, Viktor in the cab seat turned three-quarters to camera with one forearm over the wheel, his other hand on the two-way radio bolted under the dash, city light sliding across the windscreen and over his reflective bands",
 "his thumb presses the radio key and releases it and his forearm slides an inch along the wheel rim, a radio squelch burst and the tick of a cooling engine, "
 + ONE + ", no music", ""),

("A3_SH02", 7, 1, "landscape", "WS", "eye", "track", "narrow_street", None, None,
 "ночная смена начинается в десять вечера и заканчивается тогда, когда площадка закрывает ворота, а не когда ты устал.",
 "wide shot at eye level, a one-way street between five-storey buildings at night, a tow truck rolling slowly past a line of cars parked nose-in at the kerb, shop windows glowing at ground level and dark flats above, wet frozen mud along the pavement strip",
 "the truck rolls half a car length further along the kerb and its amber beacon crosses three windscreens in turn, a diesel idle and tyres pressing over frozen mud, "
 + EMPTY + ", no music", ""),

("A3_SH03", 7, 2, "square", "CU", "eye", "static", "narrow_street", None, None,
 "за каждую увезённую машину тебе кладут тысячу двести, и других цифр в этой работе не существует.",
 "close-up at eye level, two gloved hands threading a ratchet strap through the spokes of a front wheel and around the tyre, the wet kerb and a drain grate just behind, amber light pulsing across the rubber and the webbing",
 "the webbing pulls through the wheel and snaps flat against the tyre wall, the ratchet clacking twice and grit shifting under a boot, "
 + HANDS + ", no music", ""),

("A3_SH04", 7, 3, "square", "MCU", "eye", "static", "narrow_street", "VIKTOR_MID", None,
 "восемь машин за ночь дают почти десять тысяч, и никто ни разу не спрашивает, как ты успел столько.",
 "medium close-up at eye level, Viktor standing at the winch control with his shoulders squared and his weight on his forward foot, one hand on the lever and his eyes down on the cable, the yellow platform edge bright at the bottom of the frame",
 "he eases the lever forward and his shoulders drop as the load takes up, the winch motor rising in pitch and the ratchet ticking steadily, "
 + ONE + ", no music", ""),

("A3_SH05", 7, 4, "square", "ECU", "over", "push_in", None, None, "WINCH",
 "храповик щёлкает у тебя под рукой ровно так же, как щёлкал тогда во дворе, только теперь рука твоя.",
 "extreme close-up over the winch head, the ratchet pawl walking across the drum teeth as the cable winds on, the polished first metre disappearing under the wrap, an oil-darkened hand lever at the edge of frame under amber light",
 "the pawl walks over four teeth in a row and the wrapped cable creeps sideways along the drum, four even metallic clicks and steel cable squeaking on steel, "
 + EMPTY + ", no music", ""),

("A3_SH06", 7, 5, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "к трём часам ночи площадка забирает всё, что ты привёз, открывает журнал и считает это уже своим.",
 "wide shot at eye level, the impound yard entry lane under floodlights on tall masts, the striped boom barrier raised, two cars rolling in toward the numbered bays, the single-storey office block with its barred windows lit from inside",
 "a car rolls two lengths further up the entry lane and the boom barrier begins to lower behind it, tyres on wet concrete and a barrier motor whining down, "
 + EMPTY + ", no music", ""),

("A3_SH07", 7, 6, "landscape", "MS", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита сидит в этой диспетчерской пятнадцать лет и знает город лучше любой карты, которая висит у неё на стене.",
 "medium shot at eye level, Rita seated at the joined desks in profile with her spine against the chair back, one hand flat on a hand-written sticker list, the second headset earpiece hanging on its cord at her collarbone, three monitors washing her face pale",
 "she slides the sticker list a hand's width across the desk and her free hand settles on the mouse, a fluorescent tube buzzing overhead and a kettle beginning to hiss, "
 + ONE + ", no music", ""),

("A3_SH08", 8, 0, "landscape", "MS", "eye", "static", "dispatch_room", ("RITA_MID", "VIKTOR_MID"), None,
 "она даёт тебе адрес, ты едешь и забираешь, и лишних вопросов между вами не бывает никогда.",
 "medium shot at eye level, Rita half-turned in her chair holding a torn slip of paper out across the desk, Viktor leaning in from the doorway with his weight on one hip and his hand already reaching, the wall board of numbered key hooks behind them",
 "the slip passes from her fingers to his and her hand returns to the desk, paper rustling and a chair castor rolling on lino, "
 + TWO + ", no music", ""),

("A3_SH09", 8, 1, "landscape", "WS", "eye", "static", "narrow_street", None, None,
 "на этой улице знак висит с прошлого года, его видно с обоих концов, и всё, что ты делаешь, по закону.",
 "wide shot at eye level, the one-way street at night with cars parked nose-in along both kerbs, a weathered parking sign on an old grey post at the near corner, tangled overhead wires against the sky, a dumpster alcove of painted brick",
 "the tangled overhead wires swing a few centimetres and one windscreen fogs a little further, wind moving through wires and a shutter rattling in a shopfront, "
 + EMPTY + ", no music", ""),

("A3_SH10", 8, 2, "narrow", "MS", "eye", "track_lateral", "narrow_street", "VIKTOR_MID", None,
 "ты идёшь вдоль ряда и выбираешь ту машину, что ближе к выезду и цепляется быстрее остальных.",
 "medium shot at eye level, Viktor walking the line of parked cars three-quarters away from camera with his weight forward and one shoulder dropped, a folded strap hooked over that shoulder, wet kerb and shopfront light along his side",
 "he takes two more paces down the line and his other foot comes forward past a wheel arch, boots on wet pavement and a strap buckle knocking against his jacket, "
 + ONE + ", no music", ""),

("A3_SH11", 8, 3, "narrow", "CU", "eye", "static", "narrow_street", None, None,
 "под дворником талон, срок вышел вчера вечером, и дальше решает уже не водитель, а тот, кто приехал первым.",
 "close-up at eye level, a paper parking ticket folded under a wiper blade on a wet windscreen, the printed expiry time smudged by damp, condensation beaded across the glass, shop light broken up in the water",
 "a bead of water runs down the ticket and the wiper blade settles a millimetre lower on the glass, rain ticking on a car roof and a shutter clattering down the street, "
 + EMPTY + ", no music", ""),

("A3_SH12", 8, 4, "narrow", "MCU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "в блокноте у тебя столбик из восьми строчек, и каждая строчка в нём это чья-то одна машина.",
 "medium close-up at eye level, Viktor hunched forward over the wheel with his forearm braced on it, writing a short line in a pocket notebook propped against the rim, the dashcam and the radio glowing beside him in the dark cab",
 "his pen finishes the line and his thumb flicks the notebook shut against his palm, a pen scratching on paper and the notebook cover slapping closed, "
 + ONE + ", no music", ""),

("A3_SH13", 9, 0, "landscape", "WS", "high", "static", "impound_lot", None, None,
 "на площадке триста мест, и к утру занято чуть больше половины, каждое посуточно.",
 "wide shot from a high angle, rows of numbered bays across the impound yard with cars filling the near half and empty flaking white rectangles beyond, floodlight masts throwing overlapping pools, chain-link and barbed wire along the far fence",
 "a loose tarpaulin corner lifts and drops over a bonnet two rows out and the floodlight pools flicker once, canvas snapping and a mast ballast humming, "
 + EMPTY + ", no music", ""),

("A3_SH14", 9, 1, "square", "CU", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита отмечает каждую машину в журнале и считает сутки хранения строго с полуночи, а не с приёмки.",
 "close-up at eye level, Rita's face lowered over a ruled ledger with her chin near her collarbone, her own hand entering a bay number in the last column, the loose headset earpiece swinging at her collar under the flickering tube",
 "her hand finishes the number and moves down one ruled line, a ballpoint pressing on paper and a landline ringing twice somewhere behind, "
 + ONE + ", no music", ""),

("A3_SH15", 9, 2, "square", "MCU", "eye", "static", "dispatch_room", "VIKTOR_MID", None,
 "свои деньги ты забираешь под утро, наличными, в конверте без единой буквы, и нигде за них не подписываешься.",
 "medium close-up at eye level, Viktor standing at the dispatch desk in three-quarter profile with his weight on one hip, taking a plain unmarked envelope in his own hand, the blinds behind him half-closed on the floodlit yard",
 "his fingers close on the envelope and it bends slightly as he draws it toward his chest, paper creasing and the blinds knocking once against the frame, "
 + ONE + ", no music", ""),

("A3_SH16", 9, 3, "square", "ECU", "top_down", "push_in", "dispatch_room", None, None,
 "отмена вызова забирает из смены четыреста, поэтому отменять здесь не любит никто, включая тебя самого.",
 "extreme close-up from directly above, a hand-written shift sheet on the dispatch desk with a row struck through in ballpoint and a deduction written beside it, a chipped mug ring soaked into the paper, harsh tube light on the page",
 "the struck-through row curls at its edge as the page settles and the mug ring darkens a shade, paper shifting on laminate and a fluorescent tube ticking overhead, "
 + EMPTY + ", no music", ""),

("A3_SH17", 10, 0, "wide", "WS", "eye", "track", "flyover_night", None, None,
 "домой ты возвращаешься в семь утра, спишь до трёх дня и выходишь снова, и так шесть дней подряд.",
 "wide shot at eye level, the empty flyover across its full width in grey first light, a tow truck running along it with an empty yellow platform, the city blocks and cranes coming out of the dark below the parapet",
 "the truck covers a length of parapet and the sky behind the cranes lightens a shade, a diesel note running steady and wind across the open deck, "
 + EMPTY + ", no music", ""),

("A3_SH18", 10, 1, "wide", "WS", "eye", "static", "courtyard_old", None, None,
 "в двадцать девять эта работа кажется тебе честной, и другой тебе никто не предлагает.",
 "wide shot at eye level, a residential courtyard at dawn across the full width of the frame, the tow truck parked along the kerb with its platform empty, lit kitchen windows scattered up the panel block, ploughed snow greying at the edges",
 "one kitchen window brightens as a light goes on and a thin line of exhaust drifts from the truck, a distant tram bell and a door closing three floors up, "
 + EMPTY + ", no music", ""),

# ══════════════════ АКТ 4 — Знак, которого вчера не было (18) ══════════════════
("A4_SH01", 11, 0, "square", "MCU", "eye", "static", "narrow_street", ("KOSTYA_MID", "VIKTOR_MID"), None,
 "разговор с тобой начинают прямо на улице у столба, а тебе к этому времени тридцать один.",
 "medium close-up at eye level, Kostya squared to camera with his thumbs hooked in his belt beside the tape measure, Viktor beside him half-turned away with his weight on his back foot, the parked line and a bare grey post behind them under shop light",
 "Kostya's thumb slips off the belt and taps the tape case twice while Viktor's shoulders turn a few degrees away, a plastic case tapped by a fingernail and a shutter grinding down nearby, "
 + TWO + ", no music", ""),

("A4_SH02", 11, 1, "square", "ECU", "top_down", "push_in", "narrow_street", None, None,
 "норматив до знака пятнадцать метров, и чёрная Костина рулетка отмеряет эти метры быстрее, чем ты успеваешь ответить.",
 "extreme close-up from directly above, a black steel tape blade run out flat along wet pavement with its printed markings catching the light, the metre figure clear on the blade, cracked kerb stone and frozen mud at the frame edge",
 "the blade twitches and slides two hand-widths further along the pavement then stops flat, steel tape sliding on stone and a distant car passing, "
 + EMPTY + ", no music", ""),

("A4_SH03", 11, 2, "square", "CU", "eye", "static", "narrow_street", "VIKTOR_MID", None,
 "до ближайшей машины двадцать два метра, а знака на этом сером столбе нет ни одного.",
 "close-up at eye level, Viktor's face turned up and slightly away from camera with his jaw set, looking at the top of a bare grey post out of frame, cold shop light along one side of his face and his reflective collar",
 "his chin comes up another degree and his eyes travel along something vertical out of frame, wind over the street and a tape blade rattling back into its case, "
 + ONE + ", no music", ""),

("A4_SH04", 11, 3, "landscape", "MS", "eye", "static", "narrow_street", "KOSTYA_MID", None,
 "знак можно повесить завтра, говорит Костя, а можно оформить его вчерашним числом, и разница только в бумаге.",
 "medium shot at eye level, Kostya standing at the bare grey post three-quarters to camera with one hand resting flat on it and the tape measure clipped back on his belt, the row of parked cars running away behind him under shopfront light",
 "his palm slides down the post a hand's width and settles again while his other hand comes out of his pocket, a gloved palm dragging on cold steel and wires moving overhead, "
 + ONE + ", no music", ""),

("A4_SH05", 12, 0, "wide", "WS", "eye", "static", "narrow_street", None, None,
 "на этой улице машины ставят двенадцать лет, и столбы здесь давно уже никто внимательно не читает.",
 "wide shot at eye level, the one-way street across its full width in the evening, cars packed nose-in along the kerb from corner to corner, a fresh galvanised post standing brighter than every other post in the row, glowing shopfronts below dark flats",
 "a shop sign flickers once at the far end and the fresh post catches the light along its whole length, a ballast buzzing and a shutter rolling down, "
 + EMPTY + ", no music", ""),

("A4_SH06", 12, 1, "tall", "FS", "low", "tilt_up", "narrow_street", "KOSTYA_MID", None,
 "новый знак вешают в четверг утром, когда во дворах не остаётся никого, кроме монтажников.",
 "low-angle full-length shot, Kostya standing at the foot of the fresh galvanised post with his weight on his forward foot and both arms raised, holding a round parking sign flat against the post above his head, grey morning sky and overhead wires behind him",
 "he lifts the sign the last hand's width up the post and turns it a few degrees to square it, a steel sign face knocking on a post and a van door slamming down the street, "
 + ONE + ", no music", ""),

("A4_SH07", 12, 2, "square", "MCU", "eye", "push_in", "narrow_street", None, None,
 "два хомута, шесть оборотов ключа, и правила на всей улице становятся другими.",
 "medium close-up at head height on the galvanised post, two steel band clamps drawn around it above and below a sign bracket, a gloved hand turning a socket key on the lower clamp, flat morning light on new metal",
 "the socket key turns through two more flats and the lower band bites into the post, a ratchet key clicking round and a band tightening with a dry creak, "
 + HANDS + ", no music", ""),

("A4_SH08", 12, 3, "tall", "FS", "low", "static", "narrow_street", "VIKTOR_MID", None,
 "ты стоишь под ним и считаешь машины, хозяева которых вернутся к ним только завтра вечером.",
 "low-angle full-length shot, Viktor standing beneath the new sign with his weight even and his head tipped back, hands loose at his sides, the post running up past him into grey sky, the parked line stretching away at his feet",
 "his head tips back a little further and one hand rises to shade his eyes for a moment, wind across an open street and a sign face humming faintly on its bracket, "
 + ONE + ", no music", ""),

("A4_SH09", 13, 0, "landscape", "MS", "eye", "static", "tow_cab", ("KOSTYA_MID", "VIKTOR_MID"), None,
 "Костя даёт тебе адрес и время, ты приезжаешь туда на полчаса раньше и ждёшь с выключенными огнями.",
 "medium shot at eye level, Kostya leaning in at the open cab window with his forearms on the sill, Viktor turned toward him in the driver seat with his shoulders squared, a folded slip of paper passing between their hands over the door",
 "the folded slip changes hands and Kostya's forearms lift off the sill, paper creasing and a door skin knocking as he steps back, "
 + TWO + ", no music", ""),

("A4_SH10", 13, 1, "landscape", "WS", "eye", "static", "narrow_street", None, None,
 "под новым знаком к полуночи набирается семь машин, и все семь оставлены здесь по привычке.",
 "wide shot at eye level, the one-way street at midnight with seven cars parked nose-in beneath the new galvanised sign, the sign face catching a street lamp above them, dark flats and one lit stairwell window over the shopfronts",
 "a stairwell window goes dark and one windscreen fogs a shade deeper along the row, a door closing inside a building and wind over parked metal, "
 + EMPTY + ", no music", ""),

("A4_SH11", 13, 2, "square", "MCU", "eye", "static", "narrow_street", "VIKTOR_MID", None,
 "ты работаешь молча и снимаешь их одну за другой, без единой отмены и без единого разговора за ночь.",
 "medium close-up at eye level, Viktor at the winch control with his spine straight and his weight on his back foot, one hand riding the lever and the other flat on the platform rail, amber beacon light crossing his jaw in pulses",
 "his hand rides the lever back and his weight comes onto the forward foot as the load takes up, a winch motor loading and a cable creaking through a fairlead, "
 + ONE + ", no music", ""),

("A4_SH12", 13, 3, "square", "CU", "over", "static", "narrow_street", None, None,
 "ремень, крюк, лебёдка, и на всю работу у тебя уходит четыре минуты вместо семи.",
 "close-up over a front wheel, a steel hook seated on a suspension arm with a ratchet strap already crossing the tyre above it, wet road film on the rubber, an amber beacon reflected in a hub cap",
 "the hook settles deeper onto the arm and the strap above it draws a centimetre tighter, steel seating on steel and webbing creaking under load, "
 + EMPTY + ", no music", ""),

("A4_SH13", 13, 4, "square", "ECU", "top_down", "static", None, None, "WINCH",
 "храповик щёлкает третий раз за эту ночь, и ты его уже совсем не слышишь, как не слышишь свой двигатель.",
 "extreme close-up from directly above, the ratchet pawl locked between two drum teeth with the cable wound tight beneath, the shallow dent in the dark green housing filled with shadow, amber light sweeping across the oiled steel in pulses",
 "the pawl rises off one tooth and drops onto the next and the wound cable shifts a millimetre sideways, one dry click and then a second after a long pause, "
 + EMPTY + ", no music", ""),

("A4_SH14", 13, 5, "landscape", "MS", "eye", "static", "narrow_street", None, None,
 "седьмая машина заходит на платформу в четыре утра, и платят за неё как за первую.",
 "medium shot at eye level, a small saloon riding up the tilted yellow platform on a taut cable with its front wheels already on the ribbed steel, the empty kerb space it left behind at the edge of frame, amber light along the platform rail",
 "the saloon creeps a wheel's width further up the ribbed steel and its rear springs settle, tyres scuffing on ribbed plate and a winch motor labouring, "
 + EMPTY + ", no music", ""),

("A4_SH15", 13, 6, "landscape", "WS", "eye", "pull_out", "narrow_street", None, None,
 "к утру улица пустая от угла до угла, и ни один хозяин ещё даже не проснулся.",
 "wide shot at eye level, the one-way street at first light with the kerb completely clear from corner to corner, seven empty parking spaces marked only by dry patches of asphalt, the new sign bright above them, shutters still down",
 "a scrap of paper turns over twice on the empty kerb and comes to rest against a drain grate, paper scraping on asphalt and a first bird starting above the roofs, "
 + EMPTY + ", no music", ""),

("A4_SH16", 14, 0, "square", "MCU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "в конверте восемь тысяч четыреста, на две тысячи больше самой хорошей обычной ночи без подсказки.",
 "medium close-up at eye level, Viktor in the cab seat hunched forward over his own knees with a thick unmarked envelope held in both hands below the wheel, dawn light coming grey through the streaked windscreen onto his face",
 "his thumb bends the envelope open a centimetre and closes it again and his shoulders drop, paper flexing and a cooling engine ticking under the bonnet, "
 + ONE + ", no music", ""),

("A4_SH17", 14, 1, "wide", "WS", "high", "static", "impound_lot", None, None,
 "семь машин с одной улицы приезжают на площадку в одну ночь и встают в один ряд подряд.",
 "wide shot from a high angle, seven cars standing in a single unbroken row of numbered bays across the impound yard, their bonnets wet with dew, the rest of the row beyond them empty, floodlight pools overlapping on cracked concrete",
 "dew runs off one bonnet in a thin line and a floodlight dims and steadies over the row, water dripping on concrete and a mast ballast humming, "
 + EMPTY + ", no music", ""),

("A4_SH18", 14, 2, "tall_page", "FS", "low", "tilt_up", "narrow_street", None, None,
 "знак висит на столбе третий день, снимать его теперь уже некому, и в бумагах он появился раньше себя.",
 "low-angle full-length shot, the fresh galvanised post rising the whole height of the frame from the kerb with the round parking sign near its top, tangled overhead wires and dark upper flats behind it, the empty street far below at the post's foot",
 "the sign face turns a few degrees on its bracket and settles back, a bracket creaking and wires humming in the wind, "
 + EMPTY + ", no music", "i"),

# ══════════════════ АКТ 5 — Велосипед и стиральная машина (18) ══════════════════
("A5_SH01", 15, 0, "landscape", "MS", "eye", "static", "flat_kitchen", ("VIKTOR_MID", "LENA_MID"), None,
 "утром ты кладёшь деньги на кухонный стол и уходишь спать, не сняв рабочую куртку с отражателями.",
 "medium shot at eye level, Viktor standing at the kitchen table three-quarters away from camera setting a folded stack of notes down on the laminate, Lena at the stove half-turned toward him with the kettle in her hand, morning light through the window over the sink",
 "he lifts his hand away from the notes and turns his shoulders toward the door while she sets the kettle back on the ring, a kettle base knocking on a gas ring and a chair leg scraping tile, "
 + TWO + ", no music", ""),

("A5_SH02", 15, 1, "square", "CU", "eye", "push_in", "flat_kitchen", "LENA_MID", None,
 "Лена пересчитывает их дважды, прячет в жестянку на верхней полке и не задаёт ни одного вопроса.",
 "close-up at eye level, Lena's face lowered over her own hands at the table edge, the flat apartment key on its thin silver chain hanging forward from her throat, folded notes between her fingers, warm morning light across her cheek",
 "her fingers turn the fold over and start through the notes a second time and her chin lowers a fraction, paper counting quickly between fingers and a clock ticking on the wall, "
 + ONE + ", no music", ""),

("A5_SH03", 15, 2, "square", "MCU", "high", "static", "flat_kitchen", "ARTEM_KID", None,
 "Артёму семь, и он с самого утра катает по подоконнику жёлтый игрушечный эвакуатор с облупленной платформой.",
 "medium close-up from a high angle, Artem kneeling up at the window sill with his chest against it and both elbows out, pushing a small yellow toy tow truck along the painted wood, the courtyard out of focus through the glass behind",
 "he pushes the toy a hand's span further along the sill and his chest slides down against the wood, small plastic wheels rolling on paint and a fridge motor starting in the room, "
 + ONE + ", no music", ""),

("A5_SH04", 15, 3, "square", "ECU", "top_down", "push_in", None, None, "TOY_TRUCK",
 "платформа у игрушки стёрта до металла, он возит на ней вообще всё, что находит во дворе.",
 "extreme close-up from directly above, a small die-cast toy tow truck on a painted window sill, the paint worn off the centre of its flatbed down to bare metal, one black plastic wheel splayed outward, a tiny hook on grey thread lying beside it",
 "the tiny hook on its thread swings a centimetre and the splayed wheel rocks once, a thread of thin metal ticking on paint and a window pane resonating faintly, "
 + EMPTY + ", no music", ""),

("A5_SH05", 16, 0, "landscape", "WS", "eye", "static", "courtyard_old", None, None,
 "велосипед выходит в шесть тысяч пятьсот, и ты берёшь его сразу, не сравнивая с другими.",
 "wide shot at eye level, a new child's bicycle standing on its stand on the courtyard asphalt with the price tag still looped on the handlebar, cardboard packing flattened beside it, the panel block and bare poplars behind in flat daylight",
 "the price tag turns twice on its loop and the front wheel drifts a few degrees on the stand, cardboard shifting on asphalt and a spoke ticking round, "
 + EMPTY + ", no music", ""),

("A5_SH06", 16, 1, "landscape", "MS", "eye", "track", "courtyard_old", ("ARTEM_KID", "VIKTOR_MID"), None,
 "в субботу вы учитесь ездить во дворе вокруг лавок, и у него получается с третьего раза.",
 "medium shot at eye level, Artem upright on the new bicycle with both feet on the pedals, Viktor running alongside bent forward with one hand under the saddle, the courtyard asphalt and the carpet-beating frame passing behind them",
 "the boy's near pedal comes round to the top and Viktor's supporting hand lifts a few centimetres clear of the saddle, tyres humming on asphalt and boots striking in a fast rhythm, "
 + TWO + ", no music", ""),

("A5_SH07", 16, 2, "narrow", "MCU", "eye", "static", "courtyard_old", "VIKTOR_MID", None,
 "ты стоишь у подъезда, держишь руки в карманах и первый раз за год никуда не спешишь.",
 "medium close-up at eye level, Viktor standing at the entrance with his shoulders loose and his weight on one hip, both hands pushed into his jacket pockets, watching something small and moving off to the side, flat afternoon light on his face",
 "his shoulders drop another centimetre and his head turns slowly to follow something across the yard, a bicycle passing on asphalt and sparrows in a poplar, "
 + ONE + ", no music", ""),

("A5_SH08", 16, 3, "narrow", "CU", "eye", "static", "pharmacy", "LENA_MID", None,
 "Лена работает в аптеке по двенадцать часов и до этой осени брала ещё и лишние смены по субботам.",
 "close-up at eye level, Lena behind the glass counter with her chin level and her shoulders square, sliding a white box across the worn wooden edge toward someone out of frame, cold even ceiling light on her white tunic and the key at her throat",
 "the box slides the last hand's width across the wooden edge and her fingers lift off it, cardboard sliding on wood and a card terminal beeping once, "
 + ONE + ", no music", ""),

("A5_SH09", 16, 4, "narrow", "MS", "eye", "static", "flat_kitchen", "LENA_MID", None,
 "в ноябре в ванной появляется стиральная машина, и лишние субботние смены у неё сразу заканчиваются.",
 "medium shot at eye level, Lena crouched in front of a new washing machine with her forearms on her knees and her head level with its door, one hand on the drum seal, the plastic wrapping pulled back off the top panel behind her",
 "her hand runs round the drum seal and she rocks back onto her heels, a rubber seal squeaking under a palm and thin plastic film crackling, "
 + ONE + ", no music", ""),

("A5_SH10", 17, 0, "tall", "FS", "eye", "static", "flat_kitchen", "VIKTOR_MID", None,
 "ты говоришь ей, что не воруешь, а работаешь, и она соглашается, глядя на жестянку.",
 "full-length shot at eye level, Viktor standing in the kitchen doorway with his weight on his back foot and one shoulder against the frame, his hands at his sides, the lit table and the dark hallway splitting the frame either side of him",
 "his shoulder presses a little harder into the frame and his weight settles fully onto the back foot, a door frame creaking under weight and a tap running briefly in another room, "
 + ONE + ", no music", ""),

("A5_SH11", 17, 1, "square", "MCU", "eye", "static", "flat_kitchen", "LENA_MID", None,
 "она уходит в комнату, где Артём собирает портфель, и притягивает дверь за собой.",
 "medium close-up at eye level, Lena turned away from the table toward the hallway with her shoulders already leading, one hand on the back of a stool, the warm ceiling light behind her and the corridor dark ahead",
 "her shoulders turn a few degrees further toward the corridor and her hand slides off the stool back, a stool rocking once on tile and slippers on lino, "
 + ONE + ", no music", ""),

("A5_SH12", 17, 2, "tall", "FS", "eye", "static", "flat_kitchen", "LENA_MID", None,
 "с этого вечера деньги в доме не обсуждают больше, ни один вечер до самого конца.",
 "full-length shot at eye level, Lena standing at the kitchen window seen from behind with her weight on both feet and her arms folded low, the courtyard and other lit kitchens beyond the glass, the drying rack of plates beside her",
 "her folded arms drop to her sides and her weight moves onto one foot, a plate settling on a drying rack and a fridge motor cutting out, "
 + ONE + ", no music", ""),

("A5_SH13", 17, 3, "wide", "WS", "eye", "static", "flat_kitchen", None, None,
 "за ужином говорят про школу, про аптеку и про погоду на выходные, и всем этого хватает.",
 "wide shot at eye level, the small kitchen across its full width in the evening, three stools drawn up to the laminate table with plates and a bread board on it, the drying rack and the wall clock, one dim bulb in the ceiling fitting",
 "steam lifts off a plate and drifts across the table and the second hand of the wall clock sweeps on, a clock ticking loudly and cutlery touching a plate, "
 + EMPTY + ", no music", ""),

("A5_SH14", 18, 0, "narrow", "MCU", "high", "static", "flat_kitchen", "ARTEM_KID", None,
 "Артём засыпает с игрушкой в кулаке и не отдаёт её даже во сне, если попробовать вынуть.",
 "medium close-up from a high angle, Artem asleep on his side with his cheek flat on the pillow, the small yellow toy tow truck held in his own fist against his chest, a striped blanket pulled to his shoulder, dim light from a doorway",
 "his fist tightens once on the toy and his shoulder settles deeper into the pillow, slow breathing and a radiator knocking once in the wall, "
 + ONE + ", no music", ""),

("A5_SH15", 18, 1, "narrow", "CU", "eye", "static", "flat_kitchen", "VIKTOR_MID", None,
 "ты смотришь на него пару минут, выходишь в прихожую и начинаешь одеваться на смену.",
 "close-up at eye level, Viktor's face in the doorway light with his head tilted down toward the bed and his jaw loose, the dark room out of focus beyond him, a thin band of hallway light across one cheek",
 "his head tilts a few degrees further down and then straightens and turns away, a floorboard giving under weight and a coat hanger knocking in the hall, "
 + ONE + ", no music", ""),

("A5_SH16", 18, 2, "narrow", "MS", "eye", "static", "flat_kitchen", "VIKTOR_MID", None,
 "смена начинается в десять, идти до площадки ровно двадцать минут, и ты выходишь без запаса.",
 "medium shot at eye level, Viktor standing in the narrow hallway three-quarters to camera pulling the navy work jacket over one shoulder, the orange carabiner already clipped at his left belt loop, coats crowding the wall behind him",
 "the jacket comes up over his second shoulder and he squares it with a short pull at the hem, a zip running up and a carabiner knocking against a belt buckle, "
 + ONE + ", no music", ""),

("A5_SH17", 18, 3, "landscape", "WS", "eye", "static", "courtyard_old", None, None,
 "эвакуатор ждёт тебя во дворе под фонарём, и соседи давно перестали на него оглядываться.",
 "wide shot at eye level, the courtyard at night with the tow truck parked along the kerb under a yard lamp, its yellow platform empty and wet, lit kitchen windows above it, frozen puddles holding the lamp light",
 "the yard lamp flickers once and its reflection breaks and reforms in a frozen puddle, a lamp ballast buzzing and a distant lift motor running, "
 + EMPTY + ", no music", ""),

("A5_SH18", 18, 4, "landscape", "MS", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "ты садишься в кабину, включаешь рацию и слышишь свой адрес самым первым, ещё до общего вызова.",
 "medium shot at eye level, Viktor settling into the driver seat with his spine against the backrest and one hand on the radio under the dash, the windscreen streaked and the courtyard lamp broken up across it, the cab dark around him",
 "his thumb turns the radio dial and the needle of the instrument cluster lifts off its stop, a squelch opening into static and a diesel starter turning over, "
 + ONE + ", no music", ""),

# ══════════════════ АКТ 6 — Медсестра в ночную (18) ══════════════════
# Женщина намеренно без якоря: она чужая, и камера держит её на расстоянии,
# со спины или в проёме. Вес акта несёт лицо Виктора, не её лицо.
("A6_SH01", 19, 0, "tall_page", "FS", "eye", "static", "clinic_entrance", None, None,
 "женщина в зелёной форме выходит из подъезда после полуночи и идёт на ночную смену.",
 "full-length shot at eye level, a woman in a quilted coat over pale green scrubs standing alone in the open doorway of a panel block with a bag on her shoulder, the bare caged bulb above the step, the entrance framing her the full height of the picture",
 "she takes one step down onto the concrete and her bag slides forward on her shoulder, a steel door on a broken closer swinging and a bulb humming in its cage, "
 + ONE + ", no music", "i"),

("A6_SH02", 19, 1, "square", "MCU", "eye", "static", "clinic_entrance", None, None,
 "её машина была у этого бордюра меньше получаса назад, и место на снегу до сих пор сухое.",
 "medium close-up from behind at eye level, the woman's shoulders and the back of her hat filling one side of the frame, her head turned toward an empty parking bay at the kerb beyond her, dented post boxes and bin bags at the wall behind",
 "her shoulders turn a few degrees further toward the empty bay and her bag strap slips down her arm, a canvas strap dragging on a coat and slush shifting underfoot, "
 + ONE + ", no music", ""),

("A6_SH03", 19, 2, "wide", "WS", "eye", "static", "clinic_entrance", None, None,
 "на снегу остаются следы шин и полоса от волочения переднего колеса, которое ты не разблокировал.",
 "wide shot at eye level, the kerb outside the entrance across the full width of the frame, a single empty bay in the slush with two tyre prints and one dragged furrow leading out of it, the caged bulb above the steps at the frame edge",
 "meltwater creeps along the dragged furrow and darkens it a shade further, water running in slush and a car passing on a street beyond, "
 + EMPTY + ", no music", ""),

("A6_SH04", 20, 0, "landscape", "MS", "eye", "track", "narrow_street", None, None,
 "она догоняет тебя на следующем перекрёстке и стучит открытой ладонью по дверце кабины.",
 "medium shot at eye level, the woman running at the side of the moving tow truck with her coat open and her bag swinging behind her, her flat palm against the cab door, the loaded platform running past behind her under amber light",
 "her palm strikes the door skin twice and her other foot comes forward past the step plate, a flat booming knock on a door skin and boots slapping wet asphalt, "
 + ONE + ", no music", ""),

("A6_SH05", 20, 1, "landscape", "MS", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "мать у неё в больнице на другом конце города, а её смена началась в час ночи.",
 "medium shot at eye level, Viktor turned in the driver seat with his shoulder squared to the open window and his forearm on the sill, the woman standing below the door outside with her head tilted up toward him, cab light on both of them",
 "his forearm slides back along the sill and her head tilts a degree further up toward the window, a window glass sliding in its channel and an engine idling under the cab, "
 + TWO + ", no music", ""),

("A6_SH06", 20, 2, "square", "CU", "eye", "static", "tow_cab", None, None,
 "она держится за дверцу обеими руками и не отпускает её почти три минуты, пока ты молчишь.",
 "close-up at eye level, two bare hands gripping the lower edge of an open cab window from outside, the knuckles white against wet painted steel, a hospital lanyard clip caught between the fingers, amber light pulsing across the paint",
 "the knuckles whiten a shade further and the lanyard clip swings against the door, fingernails scraping on paint and metal ticking as it cools, "
 + HANDS + ", no music", ""),

("A6_SH07", 20, 3, "square", "MCU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "ты слушаешь её и одновременно считаешь в голове, сколько прямо сейчас теряешь на отмене вызова.",
 "medium close-up at eye level, Viktor in the driver seat in three-quarter profile with his spine straight against the backrest and his eyes forward through the windscreen rather than down at the window, dash light green along his jaw",
 "his eyes stay forward and his jaw shifts once while his hand turns on the wheel rim, a radio squelch opening and closing and rain starting on the roof, "
 + ONE + ", no music", ""),

("A6_SH08", 20, 4, "square", "ECU", "top_down", "push_in", "tow_cab", None, None,
 "отмена забирает четыреста, а машина на платформе тянет на тысячу двести, и арифметика решает быстрее тебя.",
 "extreme close-up from directly above, a carbon receipt pad on a knee with a bay number and a time already written in ballpoint, a pen lying across the sheet, the pale green cuff of a work glove at the edge of frame",
 "the pen rolls a centimetre across the pad and stops against the binding, a pen rolling on paper and rain drumming harder on a cab roof, "
 + HANDS + ", no music", ""),

("A6_SH09", 20, 5, "landscape", "MS", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "ты поднимаешь стекло и называешь ей адрес площадки так же ровно, как называл его уже сотню раз.",
 "medium shot at eye level, Viktor facing forward in the seat with both hands returned to the wheel and his shoulders square, the window glass risen most of the way with the woman's shape blurred and dark beyond it",
 "the glass rises the last hand's width into the seal and the shape beyond it goes soft, a window motor running and rain hitting new glass, "
 + ONE + ", no music", ""),

("A6_SH10", 20, 6, "landscape", "WS", "eye", "pull_out", "narrow_street", None, None,
 "эвакуатор трогается, и она остаётся стоять на тротуаре с сумкой, прижатой к груди.",
 "wide shot at eye level, the tow truck pulling away up the wet street with the loaded car on its platform, the woman standing still on the pavement behind it holding her bag against her chest, shop shutters down along the row",
 "the truck gains half a length up the street and the standing figure grows smaller behind it, tyres peeling off wet asphalt and rain crossing a street lamp, "
 + ONE + ", no music", ""),

("A6_SH11", 21, 0, "square", "CU", "eye", "static", "tow_cab", None, None,
 "в зеркале она делается всё меньше и меньше, пока не пропадает за поворотом совсем.",
 "close-up at eye level, the cab wing mirror filling the frame with a small figure standing on the pavement reflected in it, rain beads on the mirror glass, the wet street running away out of focus around the housing",
 "the reflected figure slides toward the edge of the mirror glass and passes out of it, rain ticking on a mirror housing and a wiper sweeping once, "
 + EMPTY + ", no music", ""),

("A6_SH12", 21, 1, "square", "MCU", "eye", "push_in", "tow_cab", "VIKTOR_MID", None,
 "ты впервые смотришь на себя её глазами, и по какой-то причине не отводишь от зеркала взгляд.",
 "medium close-up at eye level, Viktor at the wheel with his head half-turned toward the wing mirror and his shoulders still squared forward, street light crossing his face in slow bands through the streaked side glass",
 "his head turns a few degrees further toward the mirror and his shoulders follow late, wipers sweeping in a slow rhythm and rain on a roof panel, "
 + ONE + ", no music", ""),

("A6_SH13", 21, 2, "square", "ECU", "over", "static", "tow_cab", None, None,
 "руки на руле лежат ровно, и до площадки остаётся ещё двадцать минут пути.",
 "extreme close-up over the wheel, two work-gloved hands resting at the ten and two positions on cracked black leather, an orange steel carabiner just visible at a belt loop below the rim, amber instrument light on the glove seams",
 "one glove slides two centimetres round the rim and settles again while the wheel turns slightly, leather creaking under a glove and indicator relay clicking, "
 + HANDS + ", no music", ""),

("A6_SH14", 21, 3, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "её машина встаёт в сто седьмой бокс в час двадцать ночи, и на неё сразу набрасывают тент.",
 "wide shot at eye level, a small car being rolled backward off a lowered yellow platform into a numbered bay under a floodlight mast, the painted bay number clear on wet concrete, rows of tarpaulined cars stretching away behind",
 "the car rolls a wheel's length back off the ribbed steel and settles level on the concrete, tyres coming off ribbed plate and a handbrake ratcheting, "
 + EMPTY + ", no music", ""),

("A6_SH15", 22, 0, "landscape", "MS", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита отмечает время приёмки, ставит подпись и не поднимает головы, пока ты стоишь рядом.",
 "medium shot at eye level, Rita at the desk with her spine straight and her chin down over the ruled ledger, her own pen at a time column, the wall clock and the board of numbered key hooks behind her under the flickering tube",
 "her pen enters a figure and she taps the page flat with two fingers, a pen tip on paper and a fluorescent tube ticking overhead, "
 + ONE + ", no music", ""),

("A6_SH16", 22, 1, "square", "CU", "eye", "static", "dispatch_room", "VIKTOR_MID", None,
 "с этой женщины возьмут двести пятьдесят за первые сутки и столько же за вторые, начавшиеся полтора часа назад.",
 "close-up at eye level, Viktor's face against the half-closed blinds with his chin level and his eyes on the floodlit yard beyond the slats, bands of white yard light and dark shadow crossing his cheek",
 "his eyes travel slowly along something out of frame and one slat of the blind swings a centimetre, blind slats knocking together and a kettle switching itself off, "
 + ONE + ", no music", ""),

("A6_SH17", 22, 2, "square", "MCU", "high", "static", "dispatch_room", "VIKTOR_MID", None,
 "ты смотришь на свои раскрытые руки под лампой и не находишь в них ничего особенного.",
 "medium close-up from a high angle, Viktor seated on the edge of the desk hunched forward with his forearms on his knees, both palms turned up and open in front of him, the lino floor and a chair leg below in the frame",
 "his fingers curl in slowly and open again and his forearms press harder on his knees, a desk edge creaking and a monitor fan running steadily, "
 + ONE + ", no music", ""),

("A6_SH18", 22, 3, "square", "ECU", "eye", "push_in", "dispatch_room", None, None,
 "оранжевый карабин на ремне у тебя с самой первой смены, и снимать его тебе пока незачем.",
 "extreme close-up at eye level, an orange steel carabiner clipped to a left belt loop on dark work trousers, its gate worn silver at the hinge, a navy jacket hem and a reflective band just above it, harsh office light on the paint",
 "the carabiner swings a few degrees on the belt loop and comes to rest against the seam, a gate spring ticking and fabric brushing on metal, "
 + EMPTY + ", no music", ""),

# ══════════════════ АКТ 7 — Вторая машина (20) ══════════════════
("A7_SH01", 23, 0, "wide", "WS", "eye", "static", "impound_lot", None, None,
 "в тридцать два тебе дают вторую машину и водителя, который будет на ней работать в твою смену.",
 "wide shot at eye level, two flatbed tow trucks parked side by side across the full width of the frame inside the impound gate, both yellow platforms empty and wet, floodlight masts above and the office block at the far end",
 "an amber beacon on the second truck turns through one revolution and the platforms glisten as the light crosses them, a beacon motor whirring and wind across open concrete, "
 + EMPTY + ", no music", ""),

("A7_SH02", 23, 1, "tall", "FS", "low", "static", "impound_lot", "VIKTOR_MID", None,
 "ключи от неё лежат у тебя в кармане, и смены на оба борта ты теперь ставишь сам.",
 "low-angle full-length shot, Viktor standing at the side of the second truck with his weight on one hip and his shoulders squared, one hand closed around a set of keys at his chest, the platform rail and floodlight mast rising behind him",
 "his fist opens and closes once on the keys and his weight shifts to the other hip, keys knocking together in a palm and a floodlight ballast humming, "
 + ONE + ", no music", ""),

("A7_SH03", 23, 2, "square", "MCU", "eye", "static", "dispatch_room", "VIKTOR_MID", None,
 "на доске в диспетчерской висят два комплекта ключей, и оба записаны на одну твою фамилию.",
 "medium close-up at eye level, Viktor standing square to the wall board of numbered hooks with his shoulders level, lifting one of two key sets off adjacent hooks, hand-written labels curling beneath them under the flickering tube",
 "the key set comes off its hook and swings once from his fingers while the second set stays still, steel keys ringing on a hook and a paper label rustling, "
 + ONE + ", no music", ""),

("A7_SH04", 23, 3, "tall", "FS", "eye", "static", "impound_lot", None, None,
 "второй водитель на десять лет младше тебя, слушает без вопросов и копирует каждое твоё движение.",
 "full-length shot at eye level, a young driver in an oversized work jacket standing at the platform rail seen from behind with his weight on both feet and his head slightly lowered, the yellow platform edge and floodlit concrete beyond him",
 "his head lowers another degree and one boot turns outward on the concrete, a boot sole grinding grit and a strap buckle knocking on steel, "
 + ONE + ", no music", ""),

("A7_SH05", 24, 0, "landscape", "MS", "eye", "static", "tow_cab", ("KOSTYA_MID", "VIKTOR_MID"), None,
 "Костя приносит теперь не адрес на бумажке, а готовый печатный список улиц на неделю вперёд.",
 "medium shot at eye level, Kostya in the passenger seat turned toward Viktor with a typed sheet held out over the handbrake, Viktor hunched forward over the wheel with his head down at the paper, the dark cab lit only by the instrument cluster",
 "the sheet passes across the handbrake and Viktor's head lowers further toward it, paper unfolding and a handbrake ratchet clicking once, "
 + TWO + ", no music", ""),

("A7_SH06", 24, 1, "landscape", "WS", "eye", "static", "narrow_street", None, None,
 "три улицы получают новые знаки за один четверг, и все три начинают работать в ту же ночь.",
 "wide shot at eye level, a street corner where three roads meet, a fresh galvanised sign post standing at the mouth of each of them brighter than the older posts, parked cars filling every kerb between them under evening light",
 "one shop sign flickers on at the corner and the three new posts catch the light in turn, a ballast striking and a bus pulling away out of frame, "
 + EMPTY + ", no music", ""),

("A7_SH07", 24, 2, "narrow", "MCU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "в блокноте у тебя теперь не столбик, а таблица на семь дней и два борта, с итогом внизу.",
 "medium close-up at eye level, Viktor hunched over the wheel with the pocket notebook flat against the rim, a ruled grid of seven columns filled in ballpoint across the open page, dash light on the paper and on his knuckles",
 "his pen fills the last box in a column and his thumb turns the page over, a pen scratching and a page turning against a steering wheel, "
 + ONE + ", no music", ""),

("A7_SH08", 24, 3, "narrow", "CU", "top_down", "static", "dispatch_room", None, None,
 "с каждых суток хранения тебе идёт процент, и площадка платит его сама, не спрашивая, кто привёз.",
 "close-up from directly above, a printed storage ledger sheet on the dispatch desk with a column of daily rates and a percentage figure circled twice in ballpoint, a plain envelope lying half across the page, tube light on the paper",
 "the circled figure darkens as the pen goes over it again and the envelope slides a centimetre off the page, a ballpoint pressing hard and paper sliding on laminate, "
 + EMPTY + ", no music", ""),

("A7_SH09", 24, 4, "narrow", "MS", "eye", "static", "dispatch_room", "VIKTOR_MID", None,
 "двести пятьдесят в сутки умножаются на триста мест, но эти деньги проходят мимо тебя целиком.",
 "medium shot at eye level, Viktor standing at the dispatch window with his weight on his back foot and one forearm high on the frame, looking down through the half-open blinds at the filled rows of the yard, tube light behind him",
 "his forearm slides higher on the frame and his weight comes forward onto the other foot, a blind cord swinging against glass and a monitor fan running, "
 + ONE + ", no music", ""),

("A7_SH10", 25, 0, "landscape", "WS", "high", "static", "impound_lot", None, None,
 "к декабрю на площадке занято двести восемьдесят мест из трёхсот, и больше туда не влезает.",
 "wide shot from a high angle, the impound yard almost full, bay after bay taken by cars under grey tarpaulins with frost on the folds, a short stretch of empty painted rectangles at the far fence, floodlights washing the whole grid",
 "frost crystals catch and lose the light as a tarpaulin corner lifts and drops two rows out, canvas snapping and wind combing the chain-link, "
 + EMPTY + ", no music", ""),

("A7_SH11", 25, 1, "landscape", "MS", "eye", "static", "dispatch_room", ("RITA_MID", "VIKTOR_MID"), None,
 "Рита заводит вторую тетрадь, первая у неё заканчивается за один календарный месяц.",
 "medium shot at eye level, Rita seated with her spine straight writing the first line in a new ruled notebook, the filled first notebook closed at her elbow, Viktor standing behind her chair with his weight on one hip and his arms down",
 "she draws a ruled line across the fresh page and Viktor leans a few degrees over her shoulder, a pen ruling against a straight edge and a chair back creaking, "
 + TWO + ", no music", ""),

("A7_SH12", 25, 2, "tall", "FS", "eye", "static", "impound_lot", "KOSTYA_MID", None,
 "Костя приезжает на площадку раз в неделю и никогда не выходит из машины дольше пяти минут.",
 "full-length shot at eye level, Kostya standing beside an open car door at the yard gate with his weight on his back foot and one hand still on the door frame, the high-visibility vest over his uniform shirt, tarpaulined rows behind him",
 "his hand slides down the door frame and his weight comes onto the forward foot, a door hinge creaking and gravel turning under a shoe, "
 + ONE + ", no music", ""),

("A7_SH13", 25, 3, "square", "CU", "eye", "static", "impound_lot", None, None,
 "конверт переходит из рук в руки у открытой дверцы под фонарём, и на это никто не смотрит.",
 "close-up at eye level, a plain unmarked envelope passing between two hands over the sill of an open car door, one cuff in a high-visibility sleeve and the other in navy work fabric, floodlight glare on the wet door skin",
 "the envelope leaves one hand fully and the other closes around it and lowers out of frame, paper creasing and a door skin ticking in the cold, "
 + HANDS + ", no music", ""),

("A7_SH14", 25, 4, "square", "MCU", "eye", "static", "impound_lot", "VIKTOR_MID", None,
 "ты перестаёшь считать машины поштучно и начинаешь считать сразу улицами и неделями, как считает Костя.",
 "medium close-up at eye level, Viktor standing at the yard fence in three-quarter profile with his shoulders squared and his chin level, looking along the filled rows rather than at any one car, floodlight hard on one side of his face",
 "his chin turns slowly along the rows and stops, wind pulling at chain-link and a tarpaulin edge flapping down the row, "
 + ONE + ", no music", ""),

("A7_SH15", 25, 5, "tall", "FS", "low", "static", "impound_lot", "VIKTOR_MID", None,
 "в декабре ты работаешь тридцать смен подряд и берёшь один выходной, тридцать первого, на полдня.",
 "low-angle full-length shot, Viktor standing between the two parked trucks with his weight even and his arms hanging, a rolled strap over one shoulder, the two yellow platform edges running away either side of him under floodlight",
 "the rolled strap slides down his shoulder and he catches it against his side, webbing dragging on a jacket and a beacon turning above, "
 + ONE + ", no music", ""),

("A7_SH16", 26, 0, "narrow", "MCU", "eye", "static", "flat_kitchen", "ARTEM_KID", None,
 "Артём привыкает, что ты приходишь домой в тот час, когда он уходит в школу.",
 "medium close-up at eye level, Artem at the kitchen table with his shoulders hunched forward over a bowl and a school backpack already on the stool beside him, the dark window behind him, one dim ceiling bulb overhead",
 "he pushes the bowl a hand's width away and his shoulders come up off the table, a spoon settling in a bowl and a backpack buckle knocking on a stool, "
 + ONE + ", no music", ""),

("A7_SH17", 26, 1, "narrow", "CU", "eye", "static", "flat_kitchen", "LENA_MID", None,
 "Лена перестаёт готовить ужин на троих и с ноября оставляет твою тарелку накрытой в холодильнике.",
 "close-up at eye level, Lena's face lit from below by the open fridge with her chin down, sliding a covered plate onto the middle shelf with her own hand, the key on its silver chain hanging forward from her throat",
 "the plate slides fully onto the shelf and her hand withdraws, a plate grating on a wire shelf and a fridge motor starting up, "
 + ONE + ", no music", ""),

("A7_SH18", 26, 2, "narrow", "MS", "high", "static", "flat_kitchen", "VIKTOR_MID", None,
 "ты спишь по четыре часа в сутки, засыпаешь за столом в куртке и путаешь дни недели.",
 "medium shot from a high angle, Viktor asleep sitting at the kitchen table with his forehead down on his crossed forearms, still in the navy work jacket with the reflective bands, the covered plate untouched beside his elbow",
 "his shoulders rise once with a deep breath and settle lower onto the table, slow breathing and a wall clock ticking loudly in an empty room, "
 + ONE + ", no music", ""),

("A7_SH19", 26, 3, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "утро ты встречаешь на площадке, где машин теперь стоит больше, чем во всём твоём дворе.",
 "wide shot at eye level, the impound yard at first light with frost on every tarpaulin and the rows running to the far fence, the boom barrier down, the office block windows still lit yellow against the grey sky",
 "the sky behind the fence lightens a shade and frost begins to darken along the nearest tarpaulin, a distant tram bell and meltwater starting to drip, "
 + EMPTY + ", no music", ""),

("A7_SH20", 26, 4, "landscape", "MS", "eye", "static", "impound_lot", "VIKTOR_MID", None,
 "в этот год лучше тебя в городе не цепляет никто, и знают об этом четыре человека.",
 "medium shot at eye level, Viktor standing at the raised boom barrier three-quarters to camera with his weight on his forward foot and a folded sheet in his hand, the frosted rows behind him and the office door open at the frame edge",
 "he folds the sheet once more against his palm and his weight comes onto the other foot, paper folding and a barrier motor starting somewhere behind, "
 + ONE + ", no music", ""),

# ══════════════════ АКТ 8 — «Я больше не езжу по подсказкам» (18) ══════════════════
("A8_SH01", 27, 0, "square", "MCU", "eye", "static", "flat_kitchen", "VIKTOR_MID", None,
 "в тридцать три ты просыпаешься в среду и решаешь, что по подсказкам больше не поедешь никогда.",
 "medium close-up at eye level, Viktor sitting on the edge of a stool by the kitchen window with his forearms on his knees and his back rounded, his head up toward the grey glass, the untouched covered plate on the table behind him",
 "his back straightens a few degrees and his head turns from the window into the room, a stool creaking under a shift of weight and a radiator knocking, "
 + ONE + ", no music", ""),

("A8_SH02", 27, 1, "landscape", "WS", "eye", "static", "narrow_street", None, None,
 "в четверг на той улице снова вешают знак, а ты в этот раз не приезжаешь туда.",
 "wide shot at eye level, the one-way street in the morning with a fresh galvanised post newly clamped at the kerb and a round sign on it, the parked line unbroken beneath it, a stepladder folded against the brick alcove",
 "the folded stepladder slides a few centimetres down the brick and catches, aluminium scraping on brick and a van pulling away up the street, "
 + EMPTY + ", no music", ""),

("A8_SH03", 27, 2, "square", "CU", "eye", "static", "tow_cab", None, None,
 "рация называет адрес три раза подряд с интервалом в минуту, и три раза ты не берёшь трубку.",
 "close-up at eye level, a two-way radio bolted under a dashboard with its coiled cord hanging slack and the handset still seated in its clip, the channel light burning steady, dark cab and streaked windscreen behind it",
 "the channel light brightens and dims twice and the coiled cord swings a centimetre, a squelch burst opening and closing and rain on a roof panel, "
 + EMPTY + ", no music", ""),

("A8_SH04", 27, 3, "square", "MCU", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита отдаёт этот адрес второму борту и не говорит тебе про это ни слова ни в тот день, ни позже.",
 "medium close-up at eye level, Rita square to the desk with her chin level, moving one key set from a hook into her other palm, the second hook left empty beside it, the monitors washing her face pale under the flickering tube",
 "the key set drops into her palm and her fingers close over it, keys landing in a palm and an empty hook still swinging on the board, "
 + ONE + ", no music", ""),

("A8_SH05", 28, 0, "landscape", "MS", "eye", "static", "impound_lot", "KOSTYA_MID", None,
 "в пятницу Костя приходит на площадку сам, не звонит заранее и садится к тебе в кабину.",
 "medium shot at eye level, Kostya crossing the yard concrete toward the parked tow truck with his weight forward and a document folder under one arm, the high-visibility vest catching the floodlight, the cab door standing open ahead of him",
 "he takes two more paces toward the open door and shifts the folder to his other arm, shoes on wet concrete and a folder edge slapping a sleeve, "
 + ONE + ", no music", ""),

("A8_SH06", 28, 1, "landscape", "WS", "eye", "static", "tow_cab", ("KOSTYA_MID", "VIKTOR_MID"), None,
 "он кладёт себе на колени папку, открывает её примерно на середине и разворачивает к тебе.",
 "wide shot at eye level, the cab interior across its full width, Kostya in the passenger seat with an open folder flat across his knees and his chin down at it, Viktor behind the wheel turned toward him with his shoulders squared, one dome light above them",
 "he lifts a wad of sheets and lets it fall open lower in the folder while Viktor's shoulders turn a few degrees in, a thick block of paper flopping over and a dome light ballast buzzing, "
 + TWO + ", no music", ""),

("A8_SH07", 28, 2, "square", "ECU", "top_down", "push_in", "tow_cab", None, None,
 "под каждой квитанцией в этой папке стоит твоя подпись, потому что машину принимал на площадке ты.",
 "extreme close-up from directly above, a stack of carbon receipts fanned open on a knee, the same ballpoint signature repeated in the lower right corner of every sheet, bay numbers and dates above them, dome light flat on the paper",
 "the fanned stack spreads two centimetres wider and one sheet slides free onto the seat, paper sliding on paper and a seat vinyl creaking, "
 + HANDS + ", no music", ""),

("A8_SH08", 28, 3, "square", "MCU", "eye", "static", "tow_cab", "KOSTYA_MID", None,
 "Костя листает их спокойно, по одной, и говорит, что за два года ничего не изменилось.",
 "medium close-up at eye level, Kostya in the passenger seat with his spine easy against the backrest and his chin down, turning receipts over one at a time with his own thumb, dome light on the thinning reddish hair combed back",
 "his thumb turns three sheets over in sequence and stops flat on the fourth, paper flicking over in a steady rhythm and a jacket shifting on vinyl, "
 + ONE + ", no music", ""),

("A8_SH09", 28, 4, "square", "CU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "за два года ты принял восемьсот с лишним чужих машин, и каждая записана твоей рукой.",
 "close-up at eye level, Viktor's face in the dome light turned down toward the folder with his jaw set and his eyes low, the streaked side window dark behind his shoulder, reflective bands catching a little of the light",
 "his eyes travel down the page and stop and his jaw sets harder, paper turning beside him and rain starting again on the windscreen, "
 + ONE + ", no music", ""),

("A8_SH10", 28, 5, "landscape", "MS", "eye", "static", "impound_lot", "KOSTYA_MID", None,
 "он выходит, аккуратно закрывает дверцу и уезжает через семь минут после того, как приехал.",
 "medium shot at eye level, Kostya walking away from the closed cab door across the floodlit concrete with his back to camera and the folder under his arm, his car waiting at the gate with its lights on beyond him",
 "he takes two paces further toward the gate and the folder slips lower under his arm, a car door closing behind him and shoes on wet concrete, "
 + ONE + ", no music", ""),

("A8_SH11", 28, 6, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "ты сидишь в кабине до самой темноты, слушаешь дождь по крыше и двигатель так и не заводишь.",
 "wide shot at eye level, the tow truck standing alone on the yard concrete with its cab dark and the platform empty, the floodlights on above it, the filled tarpaulined rows and the fence beyond, a wet reflection under the wheels",
 "the reflection under the wheels breaks and reforms as rain lands in it, rain on a cab roof and a floodlight ballast humming, "
 + EMPTY + ", no music", ""),

("A8_SH12", 29, 0, "square", "MCU", "eye", "static", "dispatch_room", "VIKTOR_MID", None,
 "в понедельник ты приходишь в диспетчерскую, чтобы сказать Рите, что уходишь с обоих бортов.",
 "medium close-up at eye level, Viktor at the dispatch doorway with his shoulders squared and his weight on his back foot, one hand still on the door handle, the lit desks and monitors out of focus beyond him",
 "his hand comes off the handle and his weight moves onto the forward foot, a door handle spring returning and a monitor fan running, "
 + ONE + ", no music", ""),

("A8_SH13", 29, 1, "wide", "WS", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита поднимает голову от журнала, кладёт ладони на стол и молча ждёт, пока ты договоришь.",
 "wide shot at eye level, the dispatch office across its full width, the two joined desks with three monitors and the key board on the wall, Rita seated at the far side with her head lifted from the ledger and her hands flat on the desk",
 "her hands stay flat and her head lifts a fraction further while a monitor tile refreshes, a fluorescent tube ticking and a kettle beginning to hiss, "
 + ONE + ", no music", ""),

("A8_SH14", 29, 2, "tall_page", "FS", "low", "static", "dispatch_room", "VIKTOR_MID", None,
 "ты стоишь в дверях и не заходишь внутрь, заходить туда тебе уже незачем.",
 "low-angle full-length shot, Viktor filling the dispatch doorway from floor to lintel with his weight even and his arms hanging at his sides, the low suspended ceiling and the flickering tube above him, the lit room opening past his shoulder",
 "his weight settles onto one foot and one hand closes slowly at his side, a suspended ceiling tile ticking and a chair castor rolling inside the room, "
 + ONE + ", no music", "i"),

("A8_SH15", 30, 0, "landscape", "MS", "eye", "static", "dispatch_room", "RITA_MID", None,
 "она достаёт вторую тетрадь, открывает её на первой странице и разворачивает буквами к тебе.",
 "medium shot at eye level, Rita half-turned in her chair sliding the second ruled notebook across the desk toward the doorway, her hand flat on its cover, the first filled notebook squared beside her elbow under the tube light",
 "her palm pushes the notebook the last hand's width across the laminate and lifts off the cover, cardboard sliding on laminate and a cover falling open, "
 + ONE + ", no music", ""),

("A8_SH16", 30, 1, "square", "ECU", "top_down", "push_in", "dispatch_room", None, None,
 "на каждой странице стоит фамилия того, кто привёз машину, и фамилия эта на всех страницах твоя.",
 "extreme close-up from directly above, an open ruled notebook page with a column of bay numbers and the same surname entered in ballpoint on every line, the ruled margin and a coffee ring at the corner, tube light flat on the paper",
 "the page lifts a little at its outer edge and settles back flat, paper creaking and a fluorescent tube ticking above, "
 + EMPTY + ", no music", ""),

("A8_SH17", 30, 2, "square", "MCU", "eye", "static", "dispatch_room", "RITA_MID", None,
 "уходить можно, говорит Рита, только обе тетради всё равно останутся в этом шкафу.",
 "medium close-up at eye level, Rita square to camera with her chin level and both hands resting on the closed first notebook, the loose headset earpiece hanging at her collarbone, the key board and blinds behind her",
 "her hands press flat on the cover and one finger taps it twice, a fingertip tapping cardboard and a landline ringing once in the room, "
 + ONE + ", no music", ""),

("A8_SH18", 30, 3, "square", "CU", "eye", "push_in", "dispatch_room", "VIKTOR_MID", None,
 "ты выходишь на улицу, стоишь у ворот минут десять и в тот же вечер выезжаешь на смену.",
 "close-up at eye level, Viktor's face in the doorway light turned back over his shoulder toward the room, his jaw loose and his eyes low, the yard floodlight cold on one cheek and the office warm on the other",
 "his eyes come up level and his head turns away from the room, a door spring stretching and wind arriving through an opened door, "
 + ONE + ", no music", ""),

# ══════════════════ АКТ 9 — Двенадцатая машина (20) ══════════════════
("A9_SH01", 31, 0, "wide", "WS", "eye", "static", "narrow_street", None, None,
 "в ночь на двадцать второе ноября ты снимаешь одиннадцать машин ещё до двух часов, с одной улицы.",
 "wide shot at eye level, a long stretch of kerb across the full width of the frame with eleven empty parking spaces marked by dry patches on wet asphalt, one last car still parked at the far end, the tow truck standing beside it under a street lamp",
 "rain fills two of the dry patches from their edges inward and the beacon crosses the row once, rain on asphalt and a beacon motor turning, "
 + EMPTY + ", no music", ""),

("A9_SH02", 31, 1, "narrow", "MCU", "eye", "static", "tow_cab", "VIKTOR_MID", None,
 "двенадцатая за смену даёт премию сверху, а смена кончается уже через пятьдесят минут.",
 "medium close-up at eye level, Viktor hunched forward over the wheel with the notebook against the rim, eleven ruled lines filled and the twelfth empty beneath them, dash light green on the page and on his jaw",
 "his pen taps the empty twelfth line twice and lifts away, a pen tapping paper and rain building on the roof, "
 + ONE + ", no music", ""),

("A9_SH03", 31, 2, "narrow", "CU", "top_down", "static", "tow_cab", None, None,
 "ремней положено четыре, но два ушли на предыдущую и остались лежать на площадке у ворот.",
 "close-up from directly above into an open side locker, two coiled ratchet straps lying in a bin that has four marked places, the two empty places bare to scratched paint, wet light falling in from outside",
 "one coiled strap slumps sideways into an empty place and the locker lid swings a few centimetres, webbing sliding on painted steel and a hinge creaking, "
 + EMPTY + ", no music", ""),

("A9_SH04", 31, 3, "narrow", "CU", "eye", "push_in", "narrow_street", None, None,
 "пряжка садится не до конца, ты дожимаешь её сверху коленом и слышишь только два щелчка вместо трёх.",
 "close-up at eye level, a ratchet buckle half closed over a taut strap on a car wheel with the handle still standing proud, a knee in dark work trousers pressed against the handle from above, rain beading on the webbing",
 "the handle drops the last few degrees under the knee and the webbing snaps tight against the tyre, a ratchet clacking through two teeth and rain hitting webbing, "
 + HANDS + ", no music", ""),

("A9_SH05", 31, 4, "narrow", "MS", "eye", "static", "narrow_street", "VIKTOR_MID", None,
 "ты ставишь два ремня накрест и говоришь себе, что до площадки отсюда всего восемь минут дороги.",
 "medium shot at eye level, Viktor straightening up from the platform with his weight coming onto his back foot and one hand still on the rail, two straps crossing the loaded car behind him, rain crossing the amber beacon above",
 "he straightens fully and his hand slides along the rail toward the cab, boots turning on wet steel and rain drumming on a car roof, "
 + ONE + ", no music", ""),

("A9_SH06", 32, 0, "tall_page", "FS", "low", "static", "ramp_incline", None, None,
 "на съезде уклон восемь процентов, и на четвёртой секунде подъёма машина начинает идти назад.",
 "low-angle full-length shot straight up the curving concrete ramp, the tow truck climbing away from camera with the loaded car already sliding back over the rear edge of its yellow platform, one strap hanging loose, a single lamp at the crest far above",
 "the car slides another half metre back over the platform edge and the loose strap whips sideways, webbing tearing free with a bang and tyres screaming on ribbed steel, "
 + EMPTY + ", no music", "i"),

("A9_SH07", 32, 1, "square", "CU", "eye", "push_in", "tow_cab", "VIKTOR_MID", None,
 "в зеркале ты видишь, как груз уходит с платформы, и понимаешь: тормозить сейчас уже поздно.",
 "close-up at eye level, Viktor's face turned hard toward the wing mirror with his shoulder coming round after it, his jaw open, the mirror glass beyond him holding a dark shape low and moving away down the ramp",
 "his shoulder swings fully round after his head and his hand leaves the wheel rim, a handbrake lever ratcheting up hard and metal grinding behind the cab, "
 + ONE + ", no music", ""),

("A9_SH08", 32, 2, "wide", "WS", "eye", "static", "ramp_incline", None, None,
 "внизу у шлагбаума стоит парковщик, ему шестьдесят один, и отойти он за эти секунды не успевает.",
 "wide shot at eye level, the foot of the ramp across the full width of the frame with a striped boom barrier and a small attendant hut, an older man in a padded jacket standing beside the barrier arm, the loose car coming down the wet slope toward him",
 "the man's arm comes up and one foot leaves the ground as the shape enters the near edge of the frame, a barrier arm rattling and rubber howling on wet concrete, "
 + ONE + ", no music", ""),

("A9_SH09", 33, 0, "landscape", "MS", "eye", "static", "ramp_incline", "VIKTOR_MID", None,
 "ты выпрыгиваешь из кабины на ходу, оставляешь дверцу открытой и бежишь вниз по мокрому бетону.",
 "medium shot at eye level, Viktor coming out of the open cab door with both boots hitting the ramp and his weight already thrown forward downhill, the door swinging behind him, the lamp at the crest hard above his shoulders",
 "his back foot pushes off the step plate and the cab door swings wide behind him, boots slamming concrete and a door rebounding on its stop, "
 + ONE + ", no music", ""),

("A9_SH10", 33, 1, "landscape", "WS", "eye", "static", "ramp_incline", None, None,
 "машина задевает его правой стороной и прижимает ногу к низкому бетонному бортику у самой будки.",
 "wide shot at eye level, the runaway car stopped at an angle against the low concrete kerb at the foot of the ramp, the older man on the wet ground beside it with one leg trapped between the front fender and the kerb, the barrier arm bent above them",
 "the car settles a few centimetres lower on its springs against the kerb and the bent barrier arm sways, suspension creaking and water running along a gutter, "
 + ONE + ", no music", ""),

("A9_SH11", 33, 2, "tall", "FS", "eye", "static", "ramp_incline", "VIKTOR_MID", None,
 "ты поднимаешь угол домкратом за две минуты, это движение у тебя выучено до костей.",
 "full-length shot at eye level, Viktor crouched low at the front corner of the stopped car with his weight over a bottle jack and his back flat, both hands on the jack handle, the kerb and the trapped man just out of frame below",
 "he drives the jack handle down twice and the car's front corner rises a hand's width, a jack ram clicking under load and water dripping off a wing, "
 + ONE + ", no music", ""),

("A9_SH12", 33, 3, "square", "CU", "top_down", "static", "ramp_incline", None, None,
 "перелом в двух местах, скорая приезжает через девятнадцать минут после звонка, и ты запоминаешь это число.",
 "close-up from directly above, two work-worn hands closing a folded jacket around a padded trouser leg on wet concrete, a torn boot lying beside the kerb, rainwater running past in the gutter, blue light beginning to cross the ground",
 "the folded jacket is drawn tighter and one hand presses it flat against the leg, fabric dragging on wet cloth and a siren arriving from far off, "
 + HANDS + ", no music", ""),

("A9_SH13", 33, 4, "square", "MCU", "eye", "static", "ramp_incline", "VIKTOR_MID", None,
 "синий свет ложится на бетон, а ты стоишь рядом и не можешь вспомнить, где твои перчатки.",
 "medium close-up at eye level, Viktor standing back from the car with his arms hanging and his shoulders squared, both hands bare and wet, blue emergency light sweeping across his face and the concrete behind him",
 "his bare hands turn palm up and close again while the blue light crosses his face twice, a siren cutting out and a radio chirping somewhere behind, "
 + ONE + ", no music", ""),

("A9_SH14", 33, 5, "tall", "FS", "eye", "static", "ramp_incline", "KOSTYA_MID", None,
 "Костя появляется через час, остаётся у своей машины с папкой под рукой и к тебе не подходит.",
 "full-length shot at eye level, Kostya standing at the door of his own car at the top of the ramp with his weight even and his hands at his sides, the high-visibility vest lit by blue light, the wet slope falling away behind him",
 "his weight shifts onto one foot and his hand rises to the door frame and stops there, a car door seal ticking and rain landing on a roof, "
 + ONE + ", no music", ""),

("A9_SH15", 34, 0, "landscape", "MS", "eye", "static", "impound_lot", None, None,
 "утром на площадку приезжают трое, и все трое спрашивают у тебя одно и то же, про ремни.",
 "medium shot at eye level, three men in overcoats standing at the lowered yellow platform in grey morning light, one of them writing on a clipboard, the recovered car behind them on the concrete with its front fender crushed",
 "the man with the clipboard turns a page and the other two shift their stance on the concrete, a page turning under a clip and shoes grinding grit, "
 + BACKGROUND + ", no music", ""),

("A9_SH16", 34, 1, "square", "ECU", "top_down", "push_in", "impound_lot", None, None,
 "на платформе находят два ремня, а в акте пишут, что по инструкции положено было четыре.",
 "extreme close-up from directly above, two ratchet straps lying loose on ribbed yellow steel with their buckles open, a chalk mark drawn around each of them, wet plate and grit between the ribs, flat grey daylight",
 "a strap end lifts in the wind and slaps back onto the ribbed plate inside its chalk mark, webbing hitting steel and wind crossing an open platform, "
 + EMPTY + ", no music", ""),

("A9_SH17", 34, 2, "square", "MCU", "eye", "static", "dispatch_room", "RITA_MID", None,
 "Рита отдаёт им обе тетради в тот же день до обеда и тебе даже не звонит об этом.",
 "medium close-up at eye level, Rita square to the desk holding out both ruled notebooks stacked in her own hands, her chin level and her eyes off to the side, the key board with one empty hook behind her",
 "the stacked notebooks pass out of her hands and her arms lower to the desk, cardboard sliding on cardboard and a chair castor rolling back, "
 + ONE + ", no music", ""),

("A9_SH18", 34, 3, "square", "CU", "eye", "push_in", "dispatch_room", "VIKTOR_MID", None,
 "схема сдаёт тебя первым, потому что подпись под каждой квитанцией в ней стоит только твоя.",
 "close-up at eye level, Viktor's face against the blinds with his chin down and his eyes fixed low, grey daylight through the slats laying flat bands across his cheek and jaw",
 "his eyes come up level and hold and his jaw shifts once, blind slats knocking and a landline ringing twice unanswered, "
 + ONE + ", no music", ""),

("A9_SH19", 35, 0, "wide", "WS", "eye", "static", "impound_lot", None, None,
 "твою машину ставят в тот самый ряд, куда ты возил чужие, и опечатывают дверцу лентой.",
 "wide shot at eye level, the tow truck standing in a numbered bay among the tarpaulined cars across the full width of the frame, a paper seal pasted across its cab door, its yellow platform empty and streaked with rain",
 "the paper seal lifts at one corner and settles back against the door skin, paper snapping in the wind and chain-link ringing down the fence, "
 + EMPTY + ", no music", ""),

("A9_SH20", 35, 1, "wide", "WS", "eye", "static", "narrow_street", None, None,
 "знак с той улицы снимают через неделю, и вопросов о нём не задаёт ни один человек.",
 "wide shot at eye level, the one-way street across its full width with the galvanised post bare again, two bright bolt holes where the sign bracket had been, cars parked nose-in along the kerb from corner to corner",
 "a scrap of packaging blows past the foot of the bare post and catches on a kerb stone, paper scraping asphalt and a shutter rolling up down the street, "
 + EMPTY + ", no music", ""),

# ══════════════════ АКТ 10 — Четыре года (18) ══════════════════
("A10_SH01", 36, 0, "landscape", "MS", "eye", "static", "flat_kitchen", "VIKTOR_LATE", None,
 "прав тебя лишают на три года, и за руль ты не садишься даже во дворе.",
 "medium shot at eye level, Viktor at thirty-eight seated sideways at the kitchen table with his forearms on his knees and his back rounded, the faded grey fleece over a checked shirt, daylight from the window over the sink behind him",
 "his forearms slide apart on his knees and his back straightens a few degrees, a stool creaking and a tap dripping into a sink, "
 + ONE + ", no music", ""),

("A10_SH02", 36, 1, "landscape", "WS", "eye", "static", "courtyard_old", None, None,
 "на работу ты ездишь автобусом и выходишь за остановку до конца, чтобы пройти пешком.",
 "wide shot at eye level, a courtyard bus stop in daylight across the full width of the frame, a dented shelter with a torn timetable, wet asphalt with tyre tracks through it, panel blocks and bare poplars behind",
 "the torn timetable lifts and slaps back against the shelter glass and a puddle ripples, paper snapping on glass and a bus pulling away out of frame, "
 + EMPTY + ", no music", ""),

("A10_SH03", 36, 2, "narrow", "MCU", "eye", "static", "pharmacy", "LENA_MID", None,
 "Лена остаётся с тобой и берёт полторы ставки в той же самой аптеке на углу.",
 "medium close-up at eye level, Lena behind the pharmacy counter with her shoulders square and her chin down, both hands sorting white boxes into a shallow tray, the back-lit shelves even and cold behind her",
 "her hands set two boxes into the tray in sequence and she squares the row with a fingertip, cardboard knocking on cardboard and a ceiling light humming, "
 + ONE + ", no music", ""),

("A10_SH04", 36, 3, "narrow", "CU", "eye", "push_in", "pharmacy", None, None,
 "ключ на её серебряной цепочке за эти годы стирается до белого голого металла на ушке.",
 "close-up at eye level, a flat apartment key hanging on a thin silver chain against a white pharmacy tunic, its bow rubbed through the plating to bright bare metal, the cold even ceiling light flat on the fabric",
 "the key turns a few degrees on its chain and settles back against the tunic, a small chain link ticking and a card reader beeping once, "
 + EMPTY + ", no music", ""),

("A10_SH05", 36, 4, "narrow", "MS", "eye", "static", "courtyard_old", "ARTEM_TEEN", None,
 "Артёму одиннадцать, и вопросов про твою машину и твою смену он больше не задаёт.",
 "medium shot at eye level, Artem at eleven crossing the courtyard three-quarters away from camera with his weight forward and the black backpack on one shoulder, the grey hoodie under it, the entrance and benches behind him",
 "he takes two more paces toward the entrance and hitches the backpack higher on his shoulder, a backpack strap sliding on fabric and shoes on wet asphalt, "
 + ONE + ", no music", ""),

("A10_SH06", 37, 0, "square", "CU", "eye", "static", "courtyard_old", "VIKTOR_LATE", None,
 "игрушечный эвакуатор он отдаёт соседскому мальчику сам и об этом совсем не жалеет.",
 "close-up at eye level, Viktor at thirty-eight watching from the bench with his chin level and his eyes tracking something low and moving away, the heavy tired lines under his grey-green eyes, flat daylight on the grey stubble at his temples",
 "his eyes track slowly to the side and stop and his chin lowers a fraction, sparrows in a poplar and a ball bouncing on asphalt, "
 + ONE + ", no music", ""),

("A10_SH07", 37, 1, "square", "ECU", "top_down", "static", None, None, "TOY_TRUCK",
 "жёлтая платформа у игрушки так и осталась облупленной до металла в самой середине.",
 "extreme close-up from directly above, the small die-cast toy tow truck lying on cracked courtyard asphalt, the bare metal worn through the centre of its yellow flatbed, the splayed black wheel and the grey thread hook beside it",
 "the grey thread hook drags a centimetre across the asphalt and stops against a crack, thread scraping on grit and wind moving over open ground, "
 + EMPTY + ", no music", ""),

("A10_SH08", 37, 2, "square", "MCU", "eye", "static", "flat_kitchen", "VIKTOR_LATE", None,
 "парковщик после двух операций ходит с палкой и получает выплату по решению суда, частями.",
 "medium close-up at eye level, Viktor at the kitchen table with his spine straight and a folded court letter held open in both his own hands, the payment schedule visible on the page, daylight from the window flat on the paper",
 "his thumb runs down the column on the page and stops near the bottom, paper creaking in two hands and a wall clock ticking, "
 + ONE + ", no music", ""),

("A10_SH09", 37, 3, "landscape", "WS", "eye", "static", "courtyard_old", None, None,
 "ты выплачиваешь ему по частям целых четыре года и заканчиваешь только в этом мае.",
 "wide shot at eye level, the courtyard in late spring daylight, the poplars in first leaf over the chipped benches, one unbroken dry rectangle of asphalt at the kerb, laundry moving on a balcony line above",
 "the laundry on the balcony line lifts and falls and new poplar leaves turn over together, fabric snapping above and leaves rustling, "
 + EMPTY + ", no music", ""),

("A10_SH10", 38, 0, "narrow", "MCU", "eye", "static", "impound_lot", "VIKTOR_LATE", None,
 "работу тебе даёт та же самая площадка, только теперь ты на ней уже не за рулём.",
 "medium close-up at eye level, Viktor at thirty-eight standing at the yard gate with his shoulders squared and his weight on his back foot, a laminated pass on a cord at his chest, the striped boom barrier and the rows behind him",
 "the laminated pass swings once against his chest and settles and his weight comes forward, plastic knocking on a jacket zip and a barrier motor starting, "
 + ONE + ", no music", ""),

("A10_SH11", 38, 1, "narrow", "CU", "top_down", "static", "watch_hut", None, None,
 "тебе выдают ключ от сторожки, резиновый фонарь и журнал на триста строк, по строке на бокс.",
 "close-up from directly above, a narrow table by a window holding a single flat key, a rubber torch and a thick ruled ledger opened to a page of three hundred numbered lines, the thermos standing at the table edge",
 "the ledger page lifts at its outer corner and drops back flat beside the torch, paper creaking and an electric heater element ticking, "
 + EMPTY + ", no music", ""),

("A10_SH12", 38, 2, "narrow", "MS", "eye", "static", "watch_hut", "VIKTOR_LATE", None,
 "сторожка два метра на три, и в ней помещаются стол, стул, обогреватель и твоя куртка на гвозде.",
 "medium shot at eye level, Viktor standing inside the one-room watch hut with his shoulders almost touching both chipboard walls and his weight even, the narrow table and heater at his hip, the taped shift schedule behind his head",
 "he turns a few degrees in the narrow space and his shoulder brushes the taped schedule, paper rustling against a wall and a heater fan running, "
 + ONE + ", no music", ""),

("A10_SH13", 38, 3, "landscape", "MS", "eye", "static", "watch_hut", "VIKTOR_LATE", None,
 "смена сторожа двенадцать часов, и платят за неё меньше, чем раньше приносила одна ночь.",
 "medium shot at eye level, Viktor seated at the narrow table in profile with his spine against the chair back, one hand around a thermos cup and the ledger open in front of him, daylight through the single small window",
 "he sets the thermos cup down on the table and his hand moves to the ledger, a cup base knocking wood and a heater element ticking, "
 + ONE + ", no music", ""),

("A10_SH14", 38, 4, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "чужие машины заезжают мимо тебя весь день, и шлагбаум им поднимаешь именно ты.",
 "wide shot at eye level, the yard entry lane in daylight with the boom barrier rising and a car waiting at the line, the numbered bays running away behind it, the watch hut at the frame edge with its window open",
 "the boom barrier rises the last few degrees and the waiting car creeps forward to the line, a barrier motor whining and an engine idling, "
 + EMPTY + ", no music", ""),

("A10_SH15", 39, 0, "landscape", "MS", "eye", "static", "impound_lot", None, None,
 "за рулём эвакуатора теперь тот самый парень, которого ты когда-то сам и научил цеплять.",
 "medium shot at eye level, a flatbed tow truck stopped at the barrier line with a young driver leaning out of the cab window and one forearm on the sill, a loaded car strapped down behind him, daylight flat on the yellow platform",
 "his forearm slides forward on the sill and the loaded car settles once on its straps, a window channel squeaking and webbing creaking, "
 + ONE + ", no music", ""),

("A10_SH16", 39, 1, "square", "MCU", "eye", "static", "impound_lot", None, None,
 "он кивает тебе из кабины и уезжает обратно в город, где всё осталось точно как было.",
 "medium close-up at eye level, the young driver in the cab window with his chin dipping once and his hand lifting off the wheel, the streaked glass half down, the yard fence and the road beyond out of focus behind him",
 "his hand returns to the wheel and the truck begins to draw forward past the frame edge, a gear engaging and tyres turning on wet concrete, "
 + ONE + ", no music", ""),

("A10_SH17", 39, 2, "square", "CU", "eye", "static", "impound_lot", "VIKTOR_LATE", None,
 "ты открываешь шлагбаум и закрываешь его примерно сто раз за одну свою двенадцатичасовую смену.",
 "close-up at eye level, Viktor at thirty-eight in profile at the hut window with his chin level and his eyes following something crossing left to right, daylight hard on the grey at his temples and the tired lines under his eyes",
 "his eyes finish crossing the frame and come back to the near side and his chin lowers, a barrier motor running down and a latch clicking, "
 + ONE + ", no music", ""),

("A10_SH18", 39, 3, "square", "ECU", "top_down", "push_in", "watch_hut", None, None,
 "в журнале ты пишешь номера боксов той же рукой, что подписывала все восемьсот квитанций.",
 "extreme close-up from directly above, a ruled ledger page filling the frame with bay numbers entered in ballpoint down the column, one work-worn hand steadying the page at its edge, daylight from a small window across the paper",
 "the pen finishes a figure and moves down one ruled line and the steadying hand slides a centimetre, a ballpoint pressing on paper and a heater ticking, "
 + HANDS + ", no music", ""),

# ══════════════════ ФИНАЛ — Пустая платформа (17) ══════════════════
("FIN_SH01", 40, 0, "square", "MCU", "eye", "static", "watch_hut", "VIKTOR_LATE", None,
 "ночная смена у сторожа начинается в восемь вечера и заканчивается ровно в восемь утра.",
 "medium close-up at eye level, Viktor seated at the hut table at night with his spine against the chair back and both hands around a thermos cup, the small window black behind him, the heater glowing orange at his hip",
 "steam lifts from the cup and crosses his face and his hands turn the cup a few degrees, a heater element ticking and wind pressing on a chipboard wall, "
 + ONE + ", no music", ""),

("FIN_SH02", 40, 1, "wide", "WS", "high", "static", "impound_lot", None, None,
 "на площадке те же триста мест, и половина из них занята ещё с прошлой осени, без хозяев.",
 "wide shot from a high angle, the impound yard at night across the full width of the frame, half the numbered bays under grey tarpaulins with drifted leaves banked against the wheels, the far half empty painted rectangles, floodlights washing the grid",
 "leaves lift off one tarpaulin and scatter two bays further along the row, dry leaves skittering on concrete and a mast ballast humming, "
 + EMPTY + ", no music", ""),

("FIN_SH03", 40, 2, "tall_page", "FS", "low", "tilt_up", "impound_lot", None, None,
 "у дальнего забора стоит списанный эвакуатор, и лебёдка на нём до сих пор рабочая.",
 "low-angle full-length shot, a scrapped flatbed tow truck standing against the far fence and rising the whole height of the frame, its winch head and drum at the top of the platform, the chain-link and one floodlight mast behind it against the night sky",
 "the loose cable end sways a hand's width below the drum and taps the platform rail, a cable end knocking on steel and wind combing chain-link, "
 + EMPTY + ", no music", "i"),

("FIN_SH04", 41, 0, "landscape", "MS", "eye", "track", "impound_lot", "VIKTOR_LATE", None,
 "ты обходишь ряды дважды за ночь и светишь фонарём под каждый брезент, как написано в инструкции.",
 "medium shot at eye level, Viktor walking the row three-quarters away from camera with his weight forward and a torch held low in one hand, its beam thrown under a tarpaulin edge, the tarpaulined bonnets running away beside him",
 "he takes two more paces down the row and the torch beam sweeps under the next tarpaulin, boots on wet concrete and canvas dragging over a wing mirror, "
 + ONE + ", no music", ""),

("FIN_SH05", 41, 1, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "в тридцать первом боксе сейчас чужая машина, и ты помнишь, чья была тут раньше.",
 "wide shot at eye level, a numbered bay under a floodlight with an unfamiliar estate car standing in it under a half-slipped tarpaulin, the flaking painted number clear on the concrete, the neighbouring bays dark either side",
 "the half-slipped tarpaulin slides another hand's width down the rear window and stops, canvas sliding on glass and water dripping off a bumper, "
 + EMPTY + ", no music", ""),

("FIN_SH06", 41, 2, "square", "CU", "eye", "push_in", "impound_lot", "VIKTOR_LATE", None,
 "в девять лет ты приезжал сюда с отцом на автобусе с пересадкой, за той машиной.",
 "close-up at eye level, Viktor at thirty-eight standing at the bay with his chin level and his eyes low on the painted number, floodlight hard across one side of his face and the tired lines under his eyes",
 "his eyes lift from the ground to the car and stop and his chin comes up level, wind crossing open concrete and a tarpaulin corner flapping, "
 + ONE + ", no music", ""),

("FIN_SH07", 41, 3, "square", "ECU", "eye", "static", "watch_hut", None, None,
 "оранжевый карабин теперь висит на гвозде у двери сторожки и никуда с тобой больше не ездит.",
 "extreme close-up at eye level, an orange steel carabiner hanging from a nail driven into a chipboard wall beside a door frame, its gate worn silver at the hinge, a heavy coat sleeve behind it, warm light from a single bulb",
 "the carabiner turns a few degrees on the nail and comes to rest against the coat sleeve, a gate spring ticking and a door frame creaking in the wind, "
 + EMPTY + ", no music", ""),

("FIN_SH08", 41, 4, "square", "MCU", "eye", "static", "watch_hut", "VIKTOR_LATE", None,
 "ты садишься к окну, наливаешь себе чай из термоса и слушаешь, как работает обогреватель.",
 "medium close-up at eye level, Viktor lowering himself onto the worn cushion of the wooden chair with his forearms coming down on the table, the thermos tipped over the cup in one hand, the black window beside his shoulder",
 "the thermos tips further and the cup fills and his forearms settle flat on the table, liquid pouring into an enamel cup and a chair joint creaking, "
 + ONE + ", no music", ""),

("FIN_SH09", 41, 5, "landscape", "MS", "eye", "static", "watch_hut", None, None,
 "из окна видно ровно один ряд, и ты знаешь в нём каждый номер по памяти.",
 "medium shot at eye level, the small hut window from inside with a single row of tarpaulined cars framed in it end to end, condensation along the bottom of the glass, the ledger and torch on the table below the sill",
 "condensation runs down the inside of the glass in two thin lines and the row beyond blurs a little, water tracking on glass and a heater fan running, "
 + EMPTY + ", no music", ""),

("FIN_SH10", 41, 6, "landscape", "WS", "eye", "static", "impound_lot", None, None,
 "ветер поднимает брезент у дальнего конца ряда и опускает его обратно на крышу.",
 "wide shot at eye level, the floodlit row at night with the tarpaulin on the third car lifted clear of its roof in the wind, the bare wet paint showing beneath it, the rest of the row still under grey canvas",
 "the lifted tarpaulin drops back over the roof and settles into its folds, heavy canvas snapping and then slumping onto metal, "
 + EMPTY + ", no music", ""),

("FIN_SH11", 42, 0, "narrow", "MCU", "eye", "static", "watch_hut", "VIKTOR_LATE", None,
 "в три часа ночи ты выходишь на улицу, услышав через окно очень знакомый звук.",
 "medium close-up at eye level, Viktor in the open hut doorway with his shoulders squared to the night and his head turned toward the far fence, the warm bulb behind him and the cold yard ahead, the heavy coat still on its hook at his shoulder",
 "his head turns a few degrees further toward the fence and his hand comes off the door frame, a door easing on its hinge and wind arriving through an opening, "
 + ONE + ", no music", ""),

("FIN_SH12", 42, 1, "narrow", "CU", "eye", "push_in", None, None, "WINCH",
 "храповик на списанной лебёдке щёлкает от ветра, и щёлкает он ровно так же, как во дворе.",
 "close-up at eye level, the ratchet pawl of a winch drum resting against the drum teeth, the polished first metre of cable slack on the drum, the shallow dent in the dark green housing, cold floodlight raking across the oiled steel",
 "the pawl lifts off one tooth and drops back onto the next, waits, and does it again, two dry clicks with a long pause between them and wind moving over the drum, "
 + EMPTY + ", no music", "i"),

("FIN_SH13", 42, 2, "narrow", "MS", "low", "static", "impound_lot", "VIKTOR_LATE", None,
 "ты стоишь возле пустой платформы и ждёшь, пока храповик замолчит сам.",
 "medium shot from a low angle, Viktor standing at the side of the scrapped truck with his weight even and his arms hanging at his sides, his head tipped back toward the winch head above the platform, floodlight behind his shoulders",
 "his head tips back a little further and his weight settles onto one foot, a ratchet clicking twice above him and wind pulling at a coat hem, "
 + ONE + ", no music", ""),

("FIN_SH14", 42, 3, "landscape", "CU", "eye", "static", "impound_lot", None, None,
 "ты кладёшь ладонь на храповик, придерживаешь его пальцами, а потом всё равно убираешь руку.",
 "close-up at eye level, a work-worn bare hand in a faded grey fleece cuff laid flat over a winch ratchet pawl, holding it down against the drum teeth, floodlight along the knuckles and the oiled steel beneath them",
 "the fingers lift one at a time off the pawl and the hand draws back out of frame, a palm sliding off cold steel and one click arriving after it, "
 + HANDS + ", no music", ""),

("FIN_SH15", 42, 4, "landscape", "MS", "eye", "static", "impound_lot", "VIKTOR_LATE", None,
 "если досмотрел до конца, подпишись и посмотри другие истории на этом канале.",
 "medium shot at eye level, Viktor walking back toward the watch hut three-quarters away from camera with his weight forward and the torch down at his side, the lit hut window ahead of him and the dark rows either side",
 "he takes two more paces toward the hut and the torch beam swings across the concrete ahead, boots on wet concrete and a hut door standing open on its spring, "
 + ONE + ", no music", ""),

("FIN_SH16", 43, 0, "wide", "WS", "eye", "static", "impound_lot", None, None,
 "на пустой платформе под фонарём лежит один прилипший мокрый лист, и больше на ней ничего.",
 "wide shot at eye level, the empty yellow flatbed of the scrapped tow truck running the full width of the frame under a single yard lamp, one wet fallen leaf stuck flat to the ribbed steel, the winch head dark at the far end",
 "the wet leaf lifts at one edge and presses back down onto the ribbed steel, a leaf peeling off wet metal and a ratchet clicking once at the far end, "
 + EMPTY + ", no music", "i"),

("FIN_SH17", 43, 1, "wide", "WS", "eye", "pull_out", "impound_lot", None, None,
 "эта история вымышлена, все совпадения с реальными людьми и событиями случайны.",
 "wide shot at eye level, the scrapped tow truck and its empty platform small under one yard lamp at the far fence, the rows of tarpaulined cars running away either side across the full width, the night sky above the floodlight masts",
 "the yard lamp dims a shade and steadies over the empty platform and leaves move once along the fence line, wind across open concrete and a ratchet clicking twice in the distance, "
 + EMPTY + ", no music", ""),
]


def q(s):
    """SQL-литерал, одинарные кавычки удвоены."""
    return "'" + s.replace("'", "''") + "'"


def emit(rows):
    out = []
    out.append("-- СГЕНЕРИРОВАНО scripts/seed_towtruck_shots.py — не править руками.")
    out.append("BEGIN;")
    out.append("")
    for (code, page, slot, shape, stype, angle, move, loc, prof, prop,
         ru, pos, mot, flags) in rows:
        act = code.split("_")[0]
        profs = () if prof is None else ((prof,) if isinstance(prof, str) else tuple(prof))
        # Негатив выбирается по ЗАМКУ моушена, а не по наличию участника: в кадре
        # бывает человек без якоря (отец, водитель, медсестра) — на такой кадр
        # нельзя вешать «people, person, man, woman», иначе cfg-перерендер начнёт
        # вычищать из картинки того, кто в ней должен быть.
        neg = (NEG_HANDS if HANDS in mot else
               NEG_ENV if EMPTY in mot else NEG_CHAR)
        loc_sql = ("(SELECT l.id FROM locations l WHERE l.\"projectId\" = p.id AND l.slug = %s)" % q(loc)
                   ) if loc else "NULL"
        prop_sql = ("(SELECT pr.id FROM props pr WHERE pr.\"projectId\" = p.id AND pr.code = %s)" % q(prop)
                    ) if prop else "NULL"
        ref_sql = ("(SELECT cp2.id FROM character_profiles cp2 JOIN characters c2 ON c2.id = cp2.\"characterId\" "
                   "WHERE c2.\"projectId\" = p.id AND cp2.\"profileCode\" = %s)" % q(profs[0])
                   ) if profs else "NULL"
        out.append(f"""-- {code}
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "locationId", "propId", "renderMode",
  "comicPageId", "comicPanelShape", "comicSlot", "referenceProfileId",
  "isBroll", "isIconic", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p.id, sc.id, {q(code)},
  jsonb_build_object(
    'positive', {q(pos)},
    'motionPrompt', {q(mot)},
    'motionNegative', {q(neg)},
    'camera', jsonb_build_object('shotType', {q(stype)}, 'angle', {q(angle)}, 'movement', {q(move)})
  ),
  {q(ru)}, {q(stype)}, {q(angle)}, {q(move)},
  {loc_sql}, {prop_sql},
  'animated', cp.id, {q(shape)}, {slot},
  {ref_sql},
  {'true' if 'b' in flags else 'false'}, {'true' if 'i' in flags else 'false'},
  now(), now()
FROM projects p
JOIN scenes sc      ON sc."projectId" = p.id AND sc."sceneKey"  = {q(act)}
JOIN comic_pages cp ON cp."projectId" = p.id AND cp."pageIndex" = {page}
WHERE p.slug = {q(SLUG)};""")
        for pc in profs:
            out.append(f"""INSERT INTO shot_participants (id, "shotId", "characterId", label, "profileId")
SELECT gen_random_uuid()::text, s.id, c.id, {q(pc)}, cp2.id
FROM shots s
JOIN projects p ON p.id = s."projectId"
JOIN character_profiles cp2 ON cp2."profileCode" = {q(pc)}
JOIN characters c ON c.id = cp2."characterId" AND c."projectId" = p.id
WHERE p.slug = {q(SLUG)} AND s."shotCode" = {q(code)};""")
        out.append("")
    out.append("COMMIT;")
    return "\n".join(out)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(emit(SHOTS))
