# -*- coding: utf-8 -*-
"""fortune atmosphere pass: ~5 neon breather/B-roll shots per act (id_region='a', codes F#_SZ##).
Narration = FRESH sensory/time beats (sound, smell, light, weather) — NOT a restatement of body lines.
All env (no participant). Adds runtime via mood, not by slowing TTS."""
from _fortune_engine import seed_act

PALS={
 "cold_open":"dying-neon palette, half-dead magenta and cyan tubes flickering over a cold dark salon, deep violet shadow",
 "act01_fool":"warm childhood neon palette, soft pink and amber neon glow over candlelit clutter, nostalgic dusk tones, gentle haze",
 "act02_magician":"electric young-neon palette, vivid magenta and cyan glow, deep kohl shadows, seductive saturated night colour",
 "act03_priestess":"mysterious deep-neon palette, violet and teal glow with candle gold, incense haze, oracular shadow",
 "act04_lovers":"warm romantic neon palette, soft rose and amber glow, tender candlelight, hopeful warm night colour",
 "act05_wheel":"lavish success neon palette, bright saturated magenta and gold glow, glossy confident night colour",
 "act06_devil":"lurid curse-work neon palette, sickly green and violet glow, oppressive candle red, black-salt shadow",
 "act07_justice":"cold reckoning neon palette, hard white and blue neon against deep shadow, sterile guilty glare",
 "act08_tower":"fracturing storm-neon palette, harsh red and electric blue clashing, lightning-lit, splintered shadow",
 "act09_moon":"paranoid moon-neon palette, cold cyan and sickly green glow, deep blue shadow, uneasy flicker",
 "act10_death":"cold mourning neon palette, desaturated blue and grey with a single cold white neon, candle-cold shadow",
 "act11_hermit":"lonely hermit-neon palette, sparse cold blue and dying amber, mostly darkness with a single weak glow",
 "act12_world":"final dying-neon palette, last guttering magenta letters fading to black, candle-gold sinking into darkness",
}
# (code, loc, subj, st, ang, mv, tod, iconic, narr) — narr is a FRESH sensory beat, no plot restatement
ATM={
"cold_open":[
 ("F0_SZ01","strip_mall_night","a dead neon palm-and-eye sign hanging unlit over an empty wet parking lot at night, rain streaking its cold tubes","EWS","low","static","night",True,"за окном всю ночь моросит, и каждая капля на стекле ловит последний розовый отсвет и тут же гаснет."),
 ("F0_SZ02","salon_dying","melted candle stubs of many years standing in crooked grey towers along the edge of a dim velvet table","INSERT","top","push_in","night",False,"по краю стола выстроились огарки свечей, оплывшие за долгие годы в кривые серые башенки."),
 ("F0_SZ03","reading_room","an old clock on the wall of a dim empty salon, a still beaded curtain, a guttering candle below it, faint violet glow","MS","eye","static","night",False,"в пустом салоне тикают старые часы, и в тишине их ход слышен громче, чем когда тут стояла очередь."),
 ("F0_SZ04","parking_lot_rain","rain puddles on a parking lot at night faintly mirroring a half-dead neon sign, the asphalt slick and dark","WS","high","static","night",False,"мокрый асфальт пахнет пылью и озоном, как пахнет всё, что слишком долго ждало этого дождя."),
 ("F0_SZ05","salon_dying","a worn bald patch on dark velvet at a reading table where countless hands have rested, a low candle beside it","ECU","eye","push_in","night",True,"на бархате стола вытерто светлое пятно, ровно там, где полвека ложились чужие тёплые ладони."),
],
"act01_fool":[
 ("F1_SZ01","strip_mall_night","a buzzing pink palm-and-eye neon sign casting a clean rectangle of glow onto a dusk sidewalk, moths circling","EWS","low","static","dusk",True,"розовый свет вывески ложится на тротуар ровным прямоугольником, и ребёнком ты любишь стоять в нём."),
 ("F1_SZ02","mother_salon","incense smoke and candle haze drifting through warm pink neon in a cluttered little parlor, beaded curtains","INSERT","eye","push_in","dusk",False,"в салоне всегда пахнет воском, ладаном и сладким маминым табаком, и этот запах для тебя значит дом."),
 ("F1_SZ03","strip_mall_night","a row of dark shopfronts at night with only one pink psychic sign still glowing over an empty wet street","MS","eye","pan_right","night",False,"соседний ряд лавок гаснет к восьми, и розовая ладонь остаётся гореть над улицей совсем одна."),
 ("F1_SZ04","mother_salon","a child's view of a mother's ringed hands sweeping worn tarot cards across velvet by candlelight, pink neon haze","WS","high","static","night",False,"карты в маминых руках шуршат, как сухие листья, и ты засыпаешь под этот шорох, как под колыбельную."),
 ("F1_SZ05","mother_salon","rows of dripping candles burning low around a crystal ball, warm flames doubled in the glass, pink neon haze","ECU","eye","push_in","night",True,"к утру свечи догорают до самой скатерти, оставляя на бархате новые тёплые восковые озёрца."),
],
"act02_magician":[
 ("F2_SZ01","strip_mall_night","a bright magenta palm-and-eye neon sign humming over a salon at night, a faint queue of figures at the door","EWS","low","static","night",True,"вывеска снаружи гудит на одной низкой ноте, и эта нота вплетается во все твои бессонные ночи."),
 ("F2_SZ02","reading_room","a fresh tarot deck on velvet under candlelight, crisp unbent corners, magenta neon along its painted edge","INSERT","top","push_in","night",False,"от свежей колоды пахнет типографской краской, и этот запах будет потом всю жизнь означать начало."),
 ("F2_SZ03","back_alley","a wet neon back alley at night, a downpipe dripping, each drop flashing magenta then cyan into a black puddle","WS","high","static","night",False,"в переулке капает с водостока, и каждая капля вспыхивает то розовым, то синим, падая в чёрную лужу."),
 ("F2_SZ04","reading_room","a small hand mirror catching magenta neon, kohl and a young reflection, lipstick on velvet beside it","MCU","eye","push_in","night",False,"ты подкрашиваешь губы перед зеркальцем, и кохль на твоих глазах в неоне кажется почти лиловым."),
 ("F2_SZ05","strip_mall_night","car headlights sweeping past a glowing salon window at night, beams sliding across the ceiling inside","ECU","low","pan_left","night",True,"за окном проезжают редкие машины, и фары их скользят по потолку салона, как чужие беглые судьбы."),
],
"act03_priestess":[
 ("F3_SZ01","reading_room","layered violet incense smoke hanging in the air of a reading room, a neon beam splitting through it into threads","INSERT","eye","push_in","night",True,"фиолетовый дым благовоний висит слоями, и в нём луч вывески дробится на тонкие дрожащие нити."),
 ("F3_SZ02","strip_mall_night","clients waiting under a shop awning at night, the glow of their cigarettes beside a violet psychic neon sign","WS","eye","static","night",False,"клиенты ждут на улице под козырьком, и огоньки их сигарет тлеют в темноте рядом с твоим неоном."),
 ("F3_SZ03","reading_room","a crystal ball cooling on velvet at night, pink and green neon blooms drifting slowly across its curved glass","ECU","top","push_in","night",True,"хрустальный шар к ночи остывает под ладонью, и в его холодном боку плывут розовые и зелёные блики."),
 ("F3_SZ04","back_alley","rain drumming steadily on a tin awning over a neon alley at night, ripples in the lit puddles below","MS","high","static","night",False,"дождь стучит по железному козырьку ровным ритмом, и ты ловишь себя на том, что гадаешь под этот стук."),
 ("F3_SZ05","reading_room","candles burned down to the velvet cloth at dawn, fresh pools of wax cooling on the fabric, faint violet neon","WS","eye","pan_left","dawn",False,"к утру свечи догорают до самой бархатной скатерти, оставляя на ней новые тёплые восковые озёрца."),
],
"act04_lovers":[
 ("F4_SZ01","diner_neon","a red-and-blue neon diner glowing across a wet street at night, steam rising from coffee on the counter","EWS","eye","push_in","night",True,"в закусочной напротив всю ночь горит красно-синяя вывеска, и кофе там пахнет горелым сахаром и домом."),
 ("F4_SZ02","zara_apartment","an apartment window thrown open to the night for once, neon glow and fresh rain-air replacing the incense haze","MS","eye","static","night",False,"впервые за годы окна твоей квартиры открыты настежь, и ночной воздух пахнет дождём, а не ладаном."),
 ("F4_SZ03","kitchen_charms","two coffee cups drying on a rack in a charm-hung kitchen, soft amber neon bleed, a man's jacket on a chair","INSERT","top","push_in","night",False,"две чашки сохнут на сушилке вместо одной, и эта мелочь почему-то перехватывает тебе горло."),
 ("F4_SZ04","parking_lot_rain","warm rose neon from a diner mirrored in calm rain puddles at night, two pairs of footprints crossing them","WS","high","static","night",False,"неон закусочной отражается в лужах тёплым розовым, и вы перешагиваете эти лужи, держась за руки."),
 ("F4_SZ05","salon_storefront_day","a reading table touched by rare daylight, the neon off, tarot cards looking like plain printed paper in the sun","ECU","eye","push_in","day",False,"по утрам солнце впервые достаёт до гадального стола, и при свете дня карты кажутся просто бумагой."),
],
"act05_wheel":[
 ("F5_SZ01","strip_mall_night","a dazzling magenta-and-gold palm-and-eye sign so bright the night looks like day beneath it, moths swarming","EWS","low","tilt_up","night",True,"новая вывеска такая яркая, что под ней по ночам светло, как днём, и мошкара вьётся вокруг неё тучей."),
 ("F5_SZ02","parking_lot_rain","a row of expensive parked cars outside a glowing salon at night, gold neon mirrored in their polished hoods","WS","high","pan_right","night",False,"у входа выстраивается очередь дорогих машин, и их лак отражает золото твоего неона."),
 ("F5_SZ03","zara_salon","banded envelopes of cash stacked on a back-room shelf in gold neon light, a rubber band around each bundle","INSERT","top","push_in","night",False,"касса полнится конвертами, и помощница носит их в заднюю комнату стопками, перетянутыми резинками."),
 ("F5_SZ04","reading_room","perfume bottles and silk shawls cluttering a lavish reading table, gold neon and candle glow over them","MS","eye","static","night",False,"в салоне теперь пахнет дорогими духами клиентов, и этот запах перебивает даже воск и ладан."),
 ("F5_SZ05","parking_lot_rain","golden neon flooding a wet parking lot at night, the whole lot shimmering as if liquid gold were spilled on it","ECU","high","static","night",True,"золотой свет вывески заливает мокрую парковку, и кажется, будто под ногами разлили жидкое золото."),
],
"act06_devil":[
 ("F6_SZ01","reading_room","long shadows thrown across a wall by red candles, the edges tinged poisonous by green-violet neon","INSERT","low","push_in","night",True,"от красных свечей по стенам ходят длинные тени, и зелёный неон делает их по краям ядовитыми."),
 ("F6_SZ02","reading_room","jars of black salt accumulating in a corner of the reading room, a waxy burnt smell implied, sickly green neon","MS","eye","static","night",False,"в углу копится чёрная соль в банках, и пахнет в салоне теперь палёным и сладковато-душным."),
 ("F6_SZ03","strip_mall_night","the same palm-and-eye sign at night, its glow now trembling sickly green in the rain puddles below it","WS","low","static","night",False,"вывеска всё та же, но в дождевых лужах её свет дрожит уже не розовым, а болезненно-зелёным."),
 ("F6_SZ04","back_alley","broken eggshell drying in a back-room sink, a glass of cloudy water left standing on the rim, green neon","INSERT","top","static","night",False,"разбитая скорлупа сохнет в раковине, и вода в стакане так и стоит мутной до самого утра."),
 ("F6_SZ05","widow_house","a dim room emptying of furniture, clean rectangles on the wall where things were sold, a faint green neon edge","WS","eye","push_in","night",True,"в чужих домах гаснут окна, проданные тебе, а твой неон от этого горит только ярче."),
],
"act07_justice":[
 ("F7_SZ01","reading_room","a reading table lit by cold faded white-blue neon, a pair of ringed hands looking bloodless on the velvet","INSERT","top","push_in","night",True,"свет вывески выцвел до бело-синего, и в нём твои руки на бархате кажутся синюшными."),
 ("F7_SZ02","cemetery_day","wind dragging fallen leaves across fresh grave soil under a flat grey sky, no neon anywhere, bare branches","WS","high","static","day",True,"на кладбище ветер гонит палые листья по свежей земле, и ни одна неоновая буква тут не горит."),
 ("F7_SZ03","diner_neon","a rain-dampened newspaper on a cold diner counter, the headline ink bleeding into blue smears, cold neon","INSERT","top","push_in","night",False,"газета на стойке намокла по краю, и буквы заголовка расплылись синими подтёками."),
 ("F7_SZ04","back_alley","a single moth circling a cold service light in a wet alley at night, hitting the glass and falling and rising","MS","eye","static","night",False,"под холодной лампой кружит одинокая мошка, и бьётся о стекло, и падает, и снова взлетает."),
 ("F7_SZ05","parking_lot_rain","cold neon reflections in rain washing dust off dark asphalt at night, the glow icy and flat in the puddles","WS","high","static","night",False,"дождь смывает с асфальта дневную пыль, но отражённый неон в лужах остаётся ледяным."),
],
"act08_tower":[
 ("F8_SZ01","strip_mall_night","a neon sign swaying on its brackets in a rising storm wind, one letter beginning to stutter and choke","EWS","low","static","night",True,"ветер раскачивает вывеску на креплениях, и она поскрипывает, и первая буква начинает захлёбываться."),
 ("F8_SZ02","bus_stop_neon","a cold neon bus shelter at night with a flickering schedule board, the last bus pulling away empty","MS","eye","static","night",False,"на пустой остановке мигает табло, и последний автобус уходит, так и не дождавшись никого."),
 ("F8_SZ03","daughter_room","a bare bedroom wall with a single clean rectangle where a torn-down charm once hung, cold daylight","INSERT","eye","push_in","day",False,"в комнате дочери остаётся только светлый прямоугольник на стене, где висел сорванный оберег."),
 ("F8_SZ04","strip_mall_night","red and blue storm lightning flashing in the salon windows at night, the glass flaring like turned cards","WS","low","static","night",True,"гроза подходит ближе, и в окнах вспыхивают то красные, то синие сполохи, как тревожные карты."),
 ("F8_SZ05","parking_lot_rain","heavy rain shattering a neon reflection in a parking-lot puddle at night, the image breaking and not reforming","WS","high","static","night",False,"дождь хлещет по парковке стеной, и разбитое отражение вывески в лужах не складывается обратно."),
],
"act09_moon":[
 ("F9_SZ01","strip_mall_night","a palm-and-eye sign missing several letters, the rest glowing cold swamp-green over an empty lot at night","EWS","low","static","night",True,"вывеска теряет ещё буквы, и оставшиеся горят холодной зеленью, как гнилушки в ночном лесу."),
 ("F9_SZ02","kitchen_charms","grey caked salt lines ridged along a windowsill, fresh salt poured over the old, cold cyan neon through the curtain","INSERT","top","push_in","night",False,"соль на подоконниках слежалась серыми дорожками, и ты подсыпаешь свежую поверх старой, не убирая."),
 ("F9_SZ03","zara_apartment","a cloth-covered mirror faintly glowing green in a corner at night, the apartment dim and cold with neon bleed","MS","eye","static","night",False,"завешенное простынёй зеркало смутно отсвечивает зелёным в углу, и ты стараешься на него не смотреть."),
 ("F9_SZ04","street_night","a bright new young psychic neon sign glowing across the street at night, its light landing on an old windowsill","WS","eye","pan_right","night",False,"через дорогу разгорается чужая молодая вывеска, и её свет ложится на твой подоконник чужим пятном."),
 ("F9_SZ05","zara_apartment","a silent telephone on a table at night, its dark screen dully mirroring the trembling neon from the street","ECU","top","push_in","night",True,"телефон молчит ночами на столе, и его тёмный экран тускло отражает дрожащий неон с улицы."),
],
"act10_death":[
 ("F10_SZ01","salon_storefront_day","a psychic salon storefront under a low grey morning sky, the neon off and looking absurd in flat daylight","EWS","eye","static","day",True,"над городом висит низкое серое утро, и впервые твоя вывеска кажется нелепой при дневном свете."),
 ("F10_SZ02","cemetery_day","rain-flattened cheap carnations on fresh grave soil under a grey sky, not a trace of neon anywhere, bare trees","WS","high","static","day",True,"на свежей земле дождь прибил казённые гвоздики, и ни единого неонового отсвета тут нет."),
 ("F10_SZ03","reading_room","an untouched tarot deck and cold unlit candles on a dim reading table, dust beginning to settle, faint blue neon","INSERT","top","push_in","night",False,"в салоне стоит запах нежжёных свечей, и колода лежит нетронутой уже третий день."),
 ("F10_SZ04","zara_apartment","a wall dotted with dozens of clean rectangles where charms used to hang, bare nails left, cold neon bleed","MS","eye","pan_left","night",False,"со стен сняты все обереги, и на обоях остались десятки светлых следов, как карта прожитых страхов."),
 ("F10_SZ05","zara_apartment","a stopped wall clock in a dim apartment at night, its hands frozen, only faint neon flicker marking time","ECU","eye","push_in","night",True,"часы на стене встали, и ты их не заводишь, и время отмеряет теперь только гаснущий неон за окном."),
],
"act11_hermit":[
 ("F11_SZ01","salon_storefront_day","dull grey unlit neon tubes by day with dust settled inside them and a dead moth caught in a curve of glass","EWS","eye","static","day",True,"днём в выключенной вывеске видно, как в трубках осела пыль и засохли залетевшие мошки."),
 ("F11_SZ02","salon_dying","thick even dust on a crystal ball, sagging paper stars in a window, a salon quietly decaying, weak neon","INSERT","top","push_in","night",False,"пыль на шаре лежит так ровно, что остаётся след, если провести по нему пальцем."),
 ("F11_SZ03","pawn_shop","a neon-lit pawn-shop window two doors down at night, gold earrings and shawls behind the glass case","WS","eye","static","night",False,"в ломбарде через два дома горит чужой неон, и твои серьги теперь лежат у них за витриной."),
 ("F11_SZ04","street_night","a brash bright young psychic sign humming beside a tired old faded one down the block at night, wet pavement","MS","eye","pan_right","night",False,"молодая вывеска через дорогу гудит бодро и ярко, и рядом с ней твоя кажется совсем тихой и старой."),
 ("F11_SZ05","zara_apartment","two faded photographs propped by a warm table lamp, the lamp's glow soft and human against the dead neon outside","ECU","top","push_in","night",True,"у лампы стоят две выцветшие фотографии, и свет её тёплый, не то что мёртвый неон за окном."),
],
"act12_world":[
 ("F12_SZ01","parking_lot_rain","the very last living neon letters trembling in rain puddles on a deserted parking lot in the quiet night","EWS","high","static","night",True,"тот самый тихий дождь идёт за окном, и в лужах дрожат последние живые буквы вывески."),
 ("F12_SZ02","reading_room","a worn tarot deck mid-shuffle in candlelight, cards clicking softly, the click the only sound in the dark salon","INSERT","top","push_in","night",False,"щелчок карт в тишине звучит, как ход последних часов, и запах воска поднимается, как в детстве."),
 ("F12_SZ03","salon_dying","a dim salon dissolving into shadow, dead neon tubes, a still beaded curtain, one small candle flame on the table","MS","eye","push_in","night",False,"темнота подступает к столу со всех сторон, и держится только маленький дрожащий круг света от свечи."),
 ("F12_SZ04","strip_mall_night","the last neon letter of a palm-and-eye sign winking out into total darkness against the rainy night","WS","low","static","night",True,"снаружи гаснет последняя буква, и розовый отсвет уходит со стен салона медленно, как отлив."),
 ("F12_SZ05","reading_room","a single candle flame reflected in a blank smooth tarot card on velvet, the last light in a darkening room","ECU","eye","push_in","night",True,"огонёк свечи отражается в пустой гладкой карте, и это последний свет, что горит в этой комнате."),
],
}
for scene,shots in ATM.items():
    rows=[(c,None,loc,subj,st,ang,mv,tod,True,ic,narr) for (c,loc,subj,st,ang,mv,tod,ic,narr) in shots]
    seed_act(scene, PALS[scene], rows, render_mode="static", id_region="a")
