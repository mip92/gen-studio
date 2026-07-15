# -*- coding: utf-8 -*-
"""coffee A8 partner (26) + A9 franchise (28). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_A8A9.py"""
from _coffee_engine import seed_act

P_PARTNER="two-points palette, rain-washed bridge blues warmed by skylight gold and fresh wood, adventurous bright"
P_FRANCHISE="growing-network palette, loft sunlight over bean-sack burlap and map pins, confident amber and green"

PARTNER=[
 ("A8_SH01",None,"korica_cafe","a wide establishing view of the cafe after closing, two figures over spreadsheets at a lamplit table, chairs up around them","WS","eye","push_in","night",True,False,
  "в двадцать шесть вы с Женей сидите после закрытия над таблицами и одной большой идеей."),
 ("A8_SH02","ZHENYA_BASE","korica_cafe","a medium close-up of the red-glassed partner sliding a calculation sheet across the table, chin up","MCU","eye","static","night",False,False,
  "Женя кладёт на стол расчёт второй точки и говорит: я вхожу долей, если возьмёшь."),
 ("A8_SH03",None,None,"an extreme close-up insert of two hands shaking over a cold cappuccino with a faded foam sun","ECU","eye","static","night",True,True,
  "вы жмёте руки над остывшим капучино, и это лучший договор в твоей жизни."),
 ("A8_SH04",None,"second_cafe","a wide view of a narrow deep cafe unit mid-renovation, a skylight pouring sun onto fresh boards","WS","eye","pan_left","day",True,False,
  "вторая точка встаёт за мостом, в узком зале со световым фонарём в потолке."),
 ("A8_SH05","DAD_BASE","second_cafe","a medium shot of the big father clicking his folding ruler along a fresh wall, nodding to himself","MS","eye","static","day",False,False,
  "отец приезжает со своим метром, щёлкает им по стенам и ворчит одобрительно."),
 ("A8_SH06","OBJ:cezve",None,"an extreme close-up macro insert of a brand-new copper cezve being set on a shelf beside a till","ECU","eye","push_in","day",True,True,
  "для новой точки вы покупаете вторую медную турку и ставите её на полку у кассы."),
 ("A8_SH07","ASYA_YOUNG","second_cafe","a medium close-up of the yellow-aproned owner straightening the new cezve on its shelf like a ceremony","MCU","eye","static","day",False,False,
  "так рождается правило сети, которой ещё нет: в каждой точке живёт своя турка."),
 ("A8_SH08",None,"second_cafe","a wide view of the opening day in the rain, a cheerful queue under umbrellas along the wet pavement","WS","eye","static","day",True,False,
  "в день открытия за мостом идёт дождь, но очередь стоит с зонтами и не расходится."),
 ("A8_SH09","ZHENYA_BASE","second_cafe","a close-up of the partner reading the till roll at night, glasses staying perfectly in place","CU","eye","push_in","night",False,False,
  "Женя смотрит вечером на кассовую ленту и впервые за год не поправляет очки."),
 ("A8_SH10","ASYA_YOUNG","city_bright","a medium shot of the owner cycling over a bridge with a basket, yellow apron strings flying","MS","eye","track","day",False,False,
  "ты мотаешься между двумя точками на велосипеде, и корзинка всегда пахнет корицей."),
 ("A8_SH11",None,None,"an extreme close-up insert of a bicycle bell painted with a tiny sun, a wicker basket behind it","ECU","eye","static","day",True,False,
  "у велосипеда появляется имя, звонок с солнышком и своё место у каждой из дверей."),
 ("A8_SH12",None,"city_bright","a wide view of a small city bridge at golden hour, a cyclist silhouette crossing between two lit corners","WS","low","static","evening",True,False,
  "между твоими кофейнями ровно один мост, и ты переезжаешь его двенадцать раз в день."),
]

FRANCHISE=[
 ("A9_SH01",None,"hq_loft","a wide establishing view of a sunny loft office, a long wooden table, a wall map with pins, sacks of beans in the corner","WS","eye","push_in","day",True,False,
  "в двадцать восемь письма с просьбой о франшизе приходят чаще, чем счета за зерно."),
 ("A9_SH02","ASYA_ADULT","hq_loft","a medium shot of the composed copper-haired woman sorting letters into two small piles at the long table","MS","eye","static","day",False,False,
  "вы с Женей отвечаете на них медленно, потому что выбираете не деньги, а руки."),
 ("A9_SH03","ASYA_ADULT","hq_loft","a close-up of the woman watching a candidate's brewing over a copper cezve, reading the face not the hands","CU","over","static","day",False,True,
  "каждого кандидата ты просишь сварить кофе в турке и смотришь не на технику, а на лицо."),
 ("A9_SH04","ZHENYA_BASE","hq_loft","a medium close-up of the red-glassed partner pressing a new pin into a wall map, satisfied","MCU","eye","static","day",False,False,
  "к осени на карте двенадцать булавок в шести городах, и каждая проверена лично."),
 ("A9_SH05",None,None,"an extreme close-up insert of an open standards book, the first numbered line set in large warm type","ECU","top","static","day",True,True,
  "в книге стандартов сети первый пункт написан бабушкиными словами: кофе должен пахнуть домом."),
 ("A9_SH06",None,"market_beans","a wide view of the roastery stacked with full burlap sacks, the glowing drum turning, toasty air in the light","WS","eye","pan_right","day",True,False,
  "обжарку вы берёте у того же старика, только теперь мешками, и он ворчит гордо."),
 ("A9_SH07","ASYA_ADULT","hq_loft","a medium shot of the woman across the table from a broad suited back, her folded hands calm on the wood","MS","over","static","day",False,False,
  "приезжает большой инвестор и предлагает втрое ускориться, если убрать сантименты: имена, турки, корицу."),
 ("A9_SH08","ASYA_ADULT","hq_loft","a close-up of the woman's friendly immovable face delivering a short answer","CU","eye","push_in","day",False,True,
  "ты отказываешь ему за девять секунд и предлагаешь на прощание капучино с солнышком."),
 ("A9_SH09","MARK_BASE","hq_loft","a medium shot of the grey-moustached trainer at a teaching station, three pitchers lined before unseen students","MS","eye","static","day",False,False,
  "Марк теперь главный по обучению и гоняет новичков за свистящее молоко, как когда-то тебя."),
 ("A9_SH10",None,None,"an extreme close-up insert of a graduation board with rows of small photos and drawn suns beside each","ECU","eye","static","day",True,False,
  "из его школы выходит по десять бариста в месяц, и все умеют слушать пенку."),
 ("A9_SH11",None,"city_bright","a wide view of a pastel street with a new cinnamon-stick sign going up over a fresh corner unit","WS","eye","tilt_up","day",True,False,
  "сеть растёт своим ходом, точка за точкой, и каждая открывается с турки на полке."),
 ("A9_SH12","ASYA_ADULT","hq_loft","a medium close-up of the woman raising a small tasting cup at a table of colleagues, Friday light in the loft","MCU","eye","static","evening",False,False,
  "по пятницам штаб пахнет свежей обжаркой, и любое совещание здесь заканчивается дегустацией."),
]

if __name__=="__main__":
    seed_act("partner",P_PARTNER,PARTNER)
    seed_act("franchise",P_FRANCHISE,FRANCHISE)
