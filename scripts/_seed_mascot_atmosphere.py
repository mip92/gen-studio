# -*- coding: utf-8 -*-
"""mascot atmosphere pass: 4 fresh env B-roll/breather shots per act (id_region='a', codes M#_SZ##).
Fresh sensory beats (heat, foam, sweat, sound, light) — NO plot restatement. All env -> static."""
from _mascot_engine import seed_act
PALS={
 "cold_open":"dim cold back-room palette, cold fluorescent grey-green with one warm patch of light, hushed",
 "act01_invisible":"muted lonely 1980s palette, faded beige and brown, flat domestic light, washed-out and unnoticed",
 "act02_first_mask":"bright primary school-show palette, harsh gymnasium light, paper-decoration colours, cheerful and a little garish",
 "act03_first_mascot":"glossy 1990s mall palette, bright skylight and neon storefronts, balloons, cheerful commercial colour",
 "act04_her":"warm fairground-romance palette, soft string-light gold and dusk violet, tender and a little magical",
 "act05_family":"warm-but-fraying domestic palette, homey amber shading to lonely blue, the warmth thinning",
 "act06_rising":"busy event palette, bright commercial colour and stage light, a cheerful surface over growing fatigue",
 "act07_dream":"charged audition palette, harsh fluorescent with a flare of golden hope, tense and bright",
 "act08_worldcup":"blazing World Cup spectacle palette, brilliant hot sunlight, saturated flags and colour, roaring stadium gold and green",
 "act09_heat":"oppressive heat palette, blinding white sun and deep sweat-shadow, suffocating golden glare, mirage shimmer",
 "act10_peak":"blinding World Cup final palette, white-hot stadium glare against cold medical grey, triumph and collapse",
 "act11_after":"drained aftermath palette, dusty storage greys and a cold museum spotlight, faded and discarded",
 "act12_finale":"dim cold back-room palette, cold fluorescent grey-green with one warm patch of light, hushed final stillness",
}
ATM={
"cold_open":[
 ("M0_SZ01","mascot_backroom","plush fur mascot suits hanging in a row on a rack in a dim back room, sagging on their hangers, dust on the shoulders","WS","eye","pan_right","day",True,"костюмы висят на вешалках рядами, обвиснув, как снятые шкуры, и пахнут поролоном, пылью и старым потом."),
 ("M0_SZ02","mascot_backroom","an electric fan turning slowly in the corner of a dim costume room, ribbons of dust drifting in its weak breeze","INSERT","eye","push_in","day",True,"вентилятор в углу гоняет тёплый воздух по кругу, и в его слабом ветре кружится пыль, и больше не движется ничто."),
 ("M0_SZ03","mascot_backroom","a single fluorescent tube buzzing over a cluttered costume back room, a cold flat pool of light on the concrete","MS","high","static","day",True,"одна лампа гудит под потолком, и в её холодном свете подсобка кажется ещё тише, чем была при живых праздниках."),
 ("M0_SZ04","mascot_backroom","several mascot heads lined on a shelf all grinning identically into the empty room, hollow and cheerful","INSERT","eye","push_in","day",True,"на полке в ряд улыбаются пустые головы, одинаково, в никуда, и за каждой когда-то прятался такой же, как я."),
],
"act01_invisible":[
 ("M1_SZ01","childhood_home","a faded 1980s living room in the late afternoon, an empty worn sofa, a muted television, dust in a slant of light","WS","eye","push_in","day",True,"в доме детства всегда работает телевизор, громче, чем кто-либо здесь говорит с тобой, и ты привыкаешь к этому фону."),
 ("M1_SZ02","childhood_home","a class photograph on a faded wall, the children in neat rows, one small figure half cut off at the very edge","INSERT","top","push_in","day",True,"на стене висит общий снимок класса, и тебя на нём приходится искать, ты с самого края, наполовину за рамкой."),
 ("M1_SZ03","suburban_street","a quiet suburban street at dusk, long shadows, a bicycle dropped on a lawn, the sounds of other children far off","WS","high","pan_left","dusk",True,"с улицы доносится чужой смех, далёкий, как из другого мира, и ты слушаешь его из своего окна, не выходя."),
 ("M1_SZ04","childhood_home","a child's crayon drawing of a smiling figure surrounded by smiling figures, taped low on a bedroom wall","ECU","eye","push_in","night",True,"на стене детской висят твои рисунки, где тебя любят, и это пока единственное место, где тебя кто-то видит."),
],
"act02_first_mask":[
 ("M2_SZ01","school_gym","an empty school stage after a show, paper decorations sagging, folding chairs askew, dust in the stage light","WS","eye","push_in","day",True,"после утренника зал пустеет, бумажные гирлянды обвисают, и на сцене остаётся только запах клея и чужого восторга."),
 ("M2_SZ02","school_gym","a discarded papier-mache animal costume head sitting alone on a folding chair in an emptying gymnasium","INSERT","high","push_in","day",True,"брошенная на стул голова зверя смотрит в пустой зал, и улыбка её не гаснет, даже когда хлопать уже некому."),
 ("M2_SZ03","school_gym","a polished gymnasium floor reflecting harsh overhead lights, scattered confetti, the stage dark beyond","MS","high","static","day",True,"на блестящем полу спортзала валяется конфетти, и эхо аплодисментов ещё будто висит под высоким потолком."),
 ("M2_SZ04","childhood_home","a homemade cardboard mask drying on a desk under a lamp at night, glue and scissors beside it, a boy's project","ECU","top","push_in","night",True,"на столе сохнет самодельная картонная маска, и рядом ножницы и клей, и в этой маске завтра можно будет дышать."),
],
"act03_first_mascot":[
 ("M3_SZ01","mall_atrium","a 1990s mall atrium fountain catching skylight, balloons tied to a small carpeted stage, shoppers blurred far off","EWS","high","push_in","day",True,"фонтан в атриуме ловит свет из стеклянной крыши, к сцене привязаны шары, и где-то далеко гудит торговый центр."),
 ("M3_SZ02","dressing_area","a sweat-soaked plush mascot suit slumped on a stand in a cramped back room, a fan blowing, towels and water bottles","INSERT","eye","push_in","day",True,"мокрый костюм оседает на стойке, как уставший зверь, и от него валит пар, и стоит ряд опустошённых бутылок воды."),
 ("M3_SZ03","mall_atrium","balloons drifting against a bright glass skylight over an empty mall stage after closing, a spotlight still on","WS","low","tilt_up","night",True,"под куполом плывут отвязавшиеся шары, и единственный прожектор всё светит на пустую сцену, где днём была любовь."),
 ("M3_SZ04","fairground","a lit ferris wheel turning slowly against a deep dusk sky over a quieting fairground, string lights swaying","MS","eye","pan_right","dusk",True,"колесо обозрения крутится в сумерках над пустеющей ярмаркой, и гирлянды качаются от тёплого вечернего ветра."),
],
"act04_her":[
 ("M4_SZ01","fairground","a paper flower lying on a fairground bench under string lights at night, slightly crushed, tender and small","ECU","top","push_in","night",True,"на скамейке остаётся бумажный цветок с ярмарки, чуть смятый, и гирлянды роняют на него тёплый дрожащий свет."),
 ("M4_SZ02","diner_neon" if False else "city_summer","a warm lit diner window at night seen from a quiet street, two coffee cups on the booth table inside","WS","eye","push_in","night",True,"в окне ночной закусочной горит тёплый свет, и на столике остывают две чашки кофе, и говорить можно до утра."),
 ("M4_SZ03","fairground","the lit ferris wheel reflected in a puddle on the fairground path at night, doubled and trembling","INSERT","high","static","night",True,"в луже на дорожке дрожит отражение колеса, и кажется, что весь этот свет можно унести домой в кармане."),
 ("M4_SZ04","family_kitchen","morning light filling a small kitchen, two mismatched mugs on the table, an easy unhurried calm","MS","eye","push_in","day",True,"утренний свет заливает кухню, на столе две разные кружки, и впервые в этом доме есть кто-то ещё, кроме тишины."),
],
"act05_family":[
 ("M5_SZ01","family_kitchen","a single cold dinner plate untouched across from an empty chair at a kitchen table at night, a clock ticking","MS","top","push_in","night",True,"на столе стынет нетронутый ужин напротив пустого стула, и часы тикают громче, чем должны в живом доме."),
 ("M5_SZ02","family_kitchen","a fridge covered with a child's crayon drawings, one of a family where the father wears a big animal head","WS","eye","push_in","day",True,"на холодильнике детские рисунки, и на семейном папа в большой звериной голове, потому что другим сын его не видел."),
 ("M5_SZ03","suburban_street","a lit family window seen from a dark street at night, warm and small, one figure leaving with a bag down the path","WS","high","pull_out","night",True,"из тёмной улицы видно тёплое окно, и маленький силуэт уходит от него с сумкой в ночь, опять на смену."),
 ("M5_SZ04","mask_interior","a small photo of a wife and child taped inside a mascot head beside the eye-mesh, edges beginning to curl","ECU","top","static","day",True,"внутри головы у самой сетки приклеено фото двоих, и его края уже начинают коробиться от жары и от пота."),
],
"act06_rising":[
 ("M6_SZ01","mall_atrium","a wall calendar crammed with back-to-back event bookings, circled dates, no empty days left","INSERT","top","push_in","day",True,"календарь забит выступлениями вплотную, кружок на кружке, и пустых дней в нём не осталось совсем, ни одного."),
 ("M6_SZ02","fan_zone","a hot city festival plaza strung with bunting and banners, a big screen, crowds blurred in bright daylight","EWS","high","pan_right","day",True,"над площадью натянуты флажки и баннеры, гремит большой экран, и праздник кипит, не замечая, кто его держит."),
 ("M6_SZ03","dressing_area","a heavy plush suit hung dripping on a stand beside an ice cooler and a row of empty water bottles","INSERT","eye","push_in","day",True,"костюм висит, истекая потом, рядом лёд и шеренга выпитых бутылок, и колени отдыхают на бетоне между выходами."),
 ("M6_SZ04","suburban_street","a teenager's basketball left alone in a suburban driveway at dusk, the hoop still and unused, long shadows","INSERT","high","static","dusk",True,"во дворе валяется брошенный мяч сына, кольцо неподвижно, и ты понимаешь, что играть с ним так и не научился."),
],
"act07_dream":[
 ("M7_SZ01","audition_room","a strip of tape forming an X on a bare casting-room floor under harsh light, a costume rack against the wall","MS","top","push_in","day",True,"крест из скотча на полу кастинг-зала, и на нём решаются судьбы, и ты ждёшь своей минуты под гудящей лампой."),
 ("M7_SZ02","dressing_area","the grand official World Cup eagle costume on a stand under good light, brighter and bigger than any before","INSERT","low","push_in","day",True,"новый костюм орла стоит на стойке, огромный, сияющий, в турнирной джерси, и голова его тяжелее всех, что ты носил."),
 ("M7_SZ03","city_summer","World Cup banners being hoisted onto city lampposts in the summer heat, flags of many nations rising","WS","low","tilt_up","day",True,"над городом поднимают флаги турнира, страну за страной, и лето набирает жар, и сердце колотится перед началом."),
 ("M7_SZ04","stadium_tunnel","a dark concrete stadium tunnel with the blinding bright mouth of the pitch glowing at its far end","INSERT","eye","push_in","day",True,"тёмный тоннель упирается в слепящий свет поля, и за этим светом ждут сто тысяч голосов, и ты идёшь к ним."),
],
"act08_worldcup":[
 ("M8_SZ01","stadium_bowl","a colossal packed World Cup stadium bowl in blazing daylight, a hundred thousand fans, flags filling every tier","EWS","high","pan_right","day",True,"чаша забита под небо, сто тысяч флагов, и над ними дрожит раскалённый воздух, и весь мир смотрит сюда."),
 ("M8_SZ02","stadium_bowl","a night stadium filled with a sea of phone lights swaying in unison, a galaxy of tiny screens","EWS","high","static","night",True,"ночью трибуны качаются морем огоньков, тысячи экранов в такт, и красивее этого ты не видел ничего в жизни."),
 ("M8_SZ03","city_summer","a shop window crowded with plush eagle-mascot toys, the grinning face multiplied a hundred times over","INSERT","eye","pan_left","day",True,"в витрине сотня маленьких плюшевых орлов улыбается одинаково, и ни в одном из них, как и в большом, нет человека."),
 ("M8_SZ04","fan_zone","a giant screen in a packed city fan zone showing the eagle mascot, the plaza roaring at the broadcast","MS","low","static","day",True,"на гигантском экране в фан-зоне крупным планом улыбается орёл, и площадь ревёт ему, картинке, лицу без лица."),
],
"act09_heat":[
 ("M9_SZ01","stadium_parking","a vast stadium parking lot shimmering in brutal midday heat, asphalt rippling like water, the stadium beyond","EWS","high","push_in","day",True,"парковка плавится в полуденном пекле, асфальт течёт миражом, и в поролоновой голове сейчас далеко за пятьдесят."),
 ("M9_SZ02","dressing_area","ice packs, a thermometer reading dangerously high, and a row of half-drunk water bottles on a dressing bench","INSERT","top","push_in","day",True,"на столе лёд, градусник зашкаливает, и недопитые бутылки воды, и всё это не спасает от жары внутри головы."),
 ("M9_SZ03","mask_interior","the wife-and-son photo inside the head badly warped and half-peeled by heat, the foam dark and damp around it","ECU","eye","push_in","day",True,"фото внутри головы совсем покоробилось и отклеивается от жары, и лицо сына на нём расплывается, как в тумане."),
 ("M9_SZ04","city_summer","a host city sweltering after dark, World Cup banners hanging limp in the still hot night air, empty hot streets","EWS","eye","pan_left","night",True,"город не остывает и ночью, флаги висят в горячем неподвижном воздухе, и до финала остаётся всего ничего."),
],
"act10_peak":[
 ("M10_SZ01","stadium_bowl","a World Cup final stadium packed beyond capacity in white-hot daylight, confetti cannons primed, the whole planet watching","EWS","high","push_in","day",True,"финал, чаша забита сверх краёв, заряжены пушки конфетти, и тебя сейчас смотрит больше людей, чем кого-либо на земле."),
 ("M10_SZ02","stadium_bowl","a great mascot head lying tipped over alone in the bright pitch grass, still grinning at the sky","INSERT","low","push_in","day",True,"большая голова орла лежит в траве, откатившись, и улыбается небу, пока её хозяина уносят прочь от камер."),
 ("M10_SZ03","stadium_bowl","confetti and discarded flags scattered across empty stadium seats after the final, the great bowl emptying","WS","high","pan_right","night",True,"после финала на пустых креслах остаётся конфетти и брошенные флаги, и чаша гаснет, и праздник уезжает дальше."),
 ("M10_SZ04","stadium_parking","a vast emptying stadium parking lot the morning after the final, workers, litter, heat already rising again","MS","high","static","day",True,"наутро парковка пустеет, рабочие снимают баннеры, и жара поднимается снова, как будто ничего и не было."),
],
"act11_after":[
 ("M11_SZ01","museum_case","the World Cup eagle costume mounted upright in a glass museum case under warm spotlights, a plaque below","EWS","low","push_in","day",True,"костюм орла стоит под стеклом в музее, подсвеченный, как реликвия, и к нему идут семьями, фотографировать пустоту."),
 ("M11_SZ02","museum_case","an engraved museum plaque naming the mascot and the tournament year, with no performer ever credited","INSERT","top","push_in","day",True,"на табличке имя орла и год турнира, и ни слова о том, кто был внутри, ведь кукле человек ни к чему."),
 ("M11_SZ03","storage_warehouse","long warehouse shelves of retired mascot costumes sealed in clear plastic, dust drifting in a single bulb's light","WS","eye","track","day",True,"на складе рядами лежат списанные костюмы в пыльном пластике, как тела, и каждый когда-то был чьей-то целой жизнью."),
 ("M11_SZ04","family_kitchen","a small plush eagle toy on a shelf in a dim home, its permanent grin catching the lamplight, a relic of a lost summer","ECU","eye","push_in","night",True,"на полке стоит маленький плюшевый орёл, и улыбается той самой улыбкой, что ты носил вместо своего лица сорок лет."),
],
"act12_finale":[
 ("M12_SZ01","mascot_backroom","the old grinning mascot head sitting alone on a folding table under a single warm bulb in a dim back room","MS","eye","push_in","night",True,"голова орла стоит на столе под одинокой лампой, и улыбается в пустоту, как улыбалась всем эти долгие сорок лет."),
 ("M12_SZ02","mask_interior","the dark empty inside of the mascot head, the faded taped photo, the mesh-eye letting in one thin blade of light","INSERT","eye","push_in","night",True,"вот вся изнанка, темнота, духота, выцветшее фото и тонкая полоска света из сетки, мой мир на сорок лет."),
 ("M12_SZ03","mascot_backroom","extreme close on the glassy eye of the grinning mascot head reflecting the dim room and a faint human silhouette","ECU","eye","push_in","night",True,"в стеклянном глазу орла отражается тёмная подсобка и чьё-то тихое лицо, и это единственное зеркало, что у меня есть."),
 ("M12_SZ04","mascot_backroom","a dim back room with a grinning mascot head on a table beside an empty stool under a dying bulb, deep stillness","EWS","eye","pull_out","night",True,"подсобка, стол, голова и пустой стул под гаснущей лампой, и это всё, что остаётся, когда улыбку наконец снимают."),
],
}
for scene,shots in ATM.items():
    rows=[(c,None,loc,subj,st,ang,mv,tod,True,ic,narr) for (c,loc,subj,st,ang,mv,tod,ic,narr) in shots]
    seed_act(scene, PALS[scene], rows, render_mode="static", id_region="a")
