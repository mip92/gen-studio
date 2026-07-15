# -*- coding: utf-8 -*-
"""shuttle A4 kidok + A5 border + A6 daughter + A7 default98. PYTHONIOENCODING=utf-8 python scripts/_seed_shuttle_A4A7.py"""
from _shuttle_engine import seed_act

P_KIDOK="pre-holiday betrayal palette, festive Laleli gold cut by shuttered-steel grey, cold inside warm"
P_BORDER="checkpoint palette, floodlight white on concrete blue, breath steam and long shadows, tense"
P_DAUGHTER="waiting-child palette, school-concert warmth and window-lamp amber against highway dark"
P_DEFAULT="crisis palette, exchange-board red on newsprint grey, one steady pencil line through the panic"

KIDOK=[
 ("A4_SH01",None,"istanbul","a wide establishing view of Laleli before the holidays, double crowds, carts stacked high, lamps burning at noon","WS","eye","push_in","day",True,False,
  "перед новым годом Лалели гудит вдвое громче: все берут товар под праздничную торговлю."),
 ("A4_SH02","VERA_YOUNG","istanbul","a medium shot of the ash-blond woman talking terms with a shopkeeper's back at a jacket rack","MS","over","static","day",False,False,
  "твой проверенный поставщик предлагает отдать партию заметно дешевле, если внести предоплату сегодня."),
 ("A4_SH03",None,None,"an extreme close-up insert of folded dollars passing over a crate table beside two tea glasses","ECU","top","static","day",True,False,
  "ты отдаёшь две тысячи четыреста — почти весь оборот — и договариваешься забрать утром."),
 ("A4_SH04",None,"istanbul","a wide view of a shuttered shop unit in the morning row, neighbours busy with their own racks","WS","eye","static","day",True,False,
  "утром его лавка стоит запертой, и соседние торговцы отводят глаза, как заболевшие."),
 ("A4_SH05","VERA_YOUNG","istanbul","a close-up of the woman before the steel shutter, face held very still","CU","eye","push_in","day",False,False,
  "ты стоишь перед железной шторой час, и внутри тебя очень тихо и очень холодно."),
 ("A4_SH06","VERA_YOUNG","bus_int","a medium shot of the woman on the return bus with a folded empty plaid bag on her lap","MS","eye","static","night",False,False,
  "обратно ты едешь с пустой сумкой, и эта пустая сумка тяжелее любой полной."),
 ("A4_SH07",None,"home_market","a wide view of one bare stall in the busy row, a neighbour's goods edging protectively into its space","WS","eye","static","day",True,False,
  "на рынке твоё место стоит пустое неделю, и Валя держит его локтями и характером."),
 ("A4_SH08","VALYA_BASE","home_market","a medium shot of the henna-red woman pushing half her stock across onto the empty stall","MS","eye","static","day",False,True,
  "потом Валя молча делит свою партию пополам и говорит: отдашь с оборота, не кисни."),
 ("A4_SH09",None,None,"an extreme close-up insert of borrowed jackets hung in a neat half-row on a bare stall frame","ECU","eye","static","day",True,False,
  "половина чужих курток спасает твой январь, и ты продаёшь их, как свои."),
 ("A4_SH10","VERA_YOUNG","home_market","a medium close-up of the woman squaring her shoulders behind the stall, cold fury banked into work","MCU","eye","static","day",False,True,
  "ты повторяешь себе своё: оборот — это всё, — и начинаешь копить заново, со злостью."),
 ("A4_SH11","OBJ:ledger",None,"an extreme close-up macro insert of a circled negative line in the oilcloth notebook","ECU","top","static","evening",True,False,
  "в тетради появляется первая минусовая строка, и ты обводишь её, чтобы помнить фамилию."),
 ("A4_SH12",None,"flat_home","a wide view of a modest new year table with a small tree, a girl unwrapping a doll","WS","eye","pull_out","night",True,False,
  "новый год вы встречаете скромно, но с ёлкой, и Лена получает мандарины и куклу."),
]

BORDER=[
 ("A5_SH01",None,"border","a wide establishing view of the night checkpoint, concrete lanes under floodlights, a queue of idling buses","WS","eye","push_in","night",True,False,
  "граница ночью — это бетон, прожекторы и длинная очередь автобусов, гудящих на холостых."),
 ("A5_SH02","VERA_YOUNG","border","a medium shot of the woman in the passport line composing a tired schoolteacher's face","MS","eye","static","night",False,False,
  "на таможне всё решают минуты и лица, и ты учишься делать лицо усталой учительницы."),
 ("A5_SH03",None,None,"an extreme close-up insert of plaid bags unzipped open on steel inspection tables","ECU","top","static","night",True,False,
  "сумки выкладывают на стальные столы, и у половины автобуса «перевес» находится сразу."),
 ("A5_SH04",None,"border","a wide view of confiscated goods stacked by a wall under an official's clipboard silhouette","WS","eye","static","night",True,False,
  "у соседок забирают по полпартии актом с печатью, и слёзы здесь не аргумент."),
 ("A5_SH05","VERA_YOUNG","border","a medium close-up of the woman laying out her goods in perfect order before a fogged glass booth","MCU","eye","static","night",False,True,
  "ты раскладываешь всё сама, ровно, по описи, и инженерная аккуратность обезоруживает лучше взятки."),
 ("A5_SH06","OBJ:belt",None,"an extreme close-up macro insert of the cloth belt flat against fabric, the button pocket closed","ECU","eye","static","night",True,False,
  "пояс с валютой на тебе, под блузкой, и ты дышишь ровно, как учила Валя."),
 ("A5_SH07",None,"border","a wide view of the bus pulling out of the lanes at first grey light, floodlights dimming behind","WS","eye","track","dawn",True,False,
  "к рассвету ваш автобус наконец отпускают, и весь салон выдыхает одним общим выдохом."),
 ("A5_SH08","VERA_YOUNG","bus_int","a medium shot of the woman with her eyes closed and lips counting, hands quiet on the bag","MS","eye","static","dawn",False,False,
  "после каждой границы ты минуту сидишь с закрытыми глазами и считаешь до шестидесяти."),
 ("A5_SH09",None,None,"an extreme close-up insert of a second neat patch on the plaid bag where a strap bit through","ECU","eye","push_in","day",True,False,
  "вторая заплатка на сумке — от таможенной ленты, которой затягивали её слишком усердно."),
 ("A5_SH10",None,"city_90s","a wide view of the home street at dusk, one fourth-floor kitchen window glowing over the yard","WS","low","static","evening",True,False,
  "дом встречает тебя двором и окном на четвёртом этаже, где всегда горит кухня."),
]

DAUGHTER=[
 ("A6_SH01",None,"school_hall","a wide establishing view of the school hall dressed for a winter concert, paper snowflakes, parents on folding chairs","WS","eye","push_in","evening",True,False,
  "в школьном зале декабрьский концерт, и Лена стоит в снежинках во втором ряду."),
 ("A6_SH02","LENA_KID","school_hall","a medium close-up of the pigtailed girl singing while scanning the parent rows seat by seat","MCU","eye","static","evening",False,False,
  "она поёт и смотрит в зал, туда, где сидят родители, и ищет одно лицо."),
 ("A6_SH03","LENA_KID","school_hall","a close-up of the girl's eyes finishing their search and returning to the song","CU","eye","push_in","evening",False,True,
  "твоего лица там нет: ты в эту минуту едешь где-то между двумя границами."),
 ("A6_SH04","GRAN_SH","school_hall","a medium shot of the round-spectacled grandmother clapping for two and raising a small film camera","MS","eye","static","evening",False,False,
  "бабушка хлопает за двоих и снимает концерт на плёночную мыльницу, для тебя."),
 ("A6_SH05",None,"bus_int","a wide view of the night bus swaying down a dark highway, heads nodding over the seats","WS","eye","static","night",True,False,
  "автобус качает тебя по трассе, и ты не знаешь, что пропускаешь именно сейчас."),
 ("A6_SH06",None,None,"an extreme close-up insert of a child's letter in block capitals found among jacket folds","ECU","top","static","day",True,True,
  "письмо, подложенное в сумку ещё зимой: мама, приезжай на ёлку, я ждала."),
 ("A6_SH07","VERA_YOUNG","bus_int","a medium close-up of the woman reading the small letter a third time, then tucking it into her belt","MCU","eye","static","night",False,True,
  "ты читаешь его в автобусе трижды и прячешь в пояс, к самым важным купюрам."),
 ("A6_SH08","VERA_YOUNG","bus_int","a close-up of the woman's set face turned to the dark window, highway lights crossing it","CU","eye","push_in","night",False,False,
  "плакать при товарках не принято, и ты просто долго смотришь в тёмное окно."),
 ("A6_SH09",None,"courtyard","a wide view of the courtyard with a girl and a grandmother walking from school past the swings","WS","eye","pan_left","day",True,False,
  "Лена растёт правильной девочкой при бабушке, и «мама» для неё — человек с сумками по четвергам."),
 ("A6_SH10","LENA_KID","flat_home","a medium shot of the girl doing homework at the window with a view of the bus stop below","MS","eye","static","evening",False,False,
  "по четвергам она делает уроки у окна, откуда видно остановку твоего автобуса."),
 ("A6_SH11",None,None,"an extreme close-up insert of a child's pocket calendar with arrival days circled in coloured pencil","ECU","top","static","evening",True,False,
  "в её календарике кружками отмечены твои приезды, точь-в-точь как у тебя отъезды."),
 ("A6_SH12","VERA_YOUNG","flat_home","a medium shot of the woman kneeling to hug the girl amid opened bags of gifts","MS","eye","static","evening",False,True,
  "ты привозишь ей куртки, кроссовки и жвачки, а нужна ей, честно говоря, только ты."),
]

DEFAULT98=[
 ("A7_SH01",None,"city_90s","a wide establishing view of an August street with queues coiling at exchange booths, board numbers climbing","WS","eye","push_in","day",True,False,
  "август девяносто восьмого: доллар прыгает с шести до двадцати четырёх за три недели."),
 ("A7_SH02","VERA_MID","city_90s","a medium shot of the grey-streaked woman reading an exchange board with a flat professional face","MS","eye","static","day",False,False,
  "у обменников очереди и крик, и цены на рынке переписывают трижды в день."),
 ("A7_SH03",None,None,"an extreme close-up insert of pencilled price tags being erased and rewritten with a draftsman's eraser","ECU","top","static","day",True,False,
  "твои цены написаны карандашом, и ты стираешь их ластиком, как чертёж, без паники."),
 ("A7_SH04","VERA_MID","home_market","a medium close-up of the woman speaking calm sense across the stall to her neighbour","MCU","eye","static","day",False,True,
  "паника — это роскошь, говоришь ты Вале, а у нас оборот, и оборот — это всё."),
 ("A7_SH05",None,"home_market","a wide view of the market with every third stall stripped and dark, tarpaulins flapping","WS","eye","pan_right","day",True,False,
  "половина рядов закрывается за осень: кто в долгах в валюте, тот не выплыл."),
 ("A7_SH06","OBJ:ledger",None,"an extreme close-up macro insert of dense healthy columns in the oilcloth notebook, a ruler underline","ECU","top","static","evening",True,False,
  "твоя тетрадь спасает: долгов в долларах нет, товар оплачен, и это вся твоя подушка."),
 ("A7_SH07","VERA_MID","home_market","a medium shot of the woman buying out boxes from a departing trader, respectful and direct","MS","eye","static","day",False,False,
  "ты скупаешь товар у тех, кто бежит с рынка, за треть цены, с уважением."),
 ("A7_SH08",None,None,"an extreme close-up insert of a handshake over stacked boxes between stalls","ECU","eye","static","day",True,False,
  "с каждым ты честна: цена кризисная, но живая, и люди жмут руку без обиды."),
 ("A7_SH09",None,"home_market","a wide view of three neighbouring stalls under one tidy hand, jackets ranked like a parade","WS","eye","static","day",True,False,
  "к зиме у тебя три места из бывших чужих, и на всех трёх твой порядок."),
 ("A7_SH10","VERA_MID","home_market","a medium close-up of the woman at dusk between her stalls, tired, steady, unfestive","MCU","eye","push_in","evening",False,False,
  "дефолт, который сломал полстраны, делает тебя хозяйкой, и ты не празднуешь, а работаешь."),
]

if __name__=="__main__":
    seed_act("kidok",P_KIDOK,KIDOK)
    seed_act("border",P_BORDER,BORDER)
    seed_act("daughter",P_DAUGHTER,DAUGHTER)
    seed_act("default98",P_DEFAULT,DEFAULT98)
