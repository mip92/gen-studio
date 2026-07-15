# -*- coding: utf-8 -*-
"""coffee A6 regulars (24-25) + A7 pandemic (25). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_A6A7.py"""
from _coffee_engine import seed_act

P_REGULARS="lived-in warmth palette, honey wood and copper lamplight, chalk white and cinnamon brown, easy golden"
P_PANDEMIC="quiet-streets palette, soft grey empty city warmed by one amber takeaway window, hopeful through stillness"

REGULARS=[
 ("A6_SH01",None,"korica_cafe","a wide establishing view of the little cafe full at morning, six tables busy, steam and talk in warm light","WS","eye","push_in","day",True,False,
  "к весне зал снова полон по утрам: люди возвращаются туда, где их помнят."),
 ("A6_SH02","ASYA_YOUNG","korica_cafe","a medium shot of the yellow-aproned owner greeting the door with a name and a lifted cup","MS","eye","static","day",False,False,
  "ты встречаешь гостей по именам, и новенькие удивляются, а постоянные уже привыкли."),
 ("A6_SH03",None,None,"an extreme close-up insert of a thick notebook by the till, names and drink orders in neat columns","ECU","top","static","day",True,False,
  "в тетради у кассы записано всё: кто без сахара, кто после ночной, кому двойной."),
 ("A6_SH04",None,"korica_cafe","a medium view of a shaggy dog lapping warm milk from a saucer by the window table, a mail bag on the chair","MS","low","static","day",True,False,
  "пёс почтальона получает своё тёплое молоко в блюдце раньше, чем почтальон свой двойной."),
 ("A6_SH05","OBJ:cup",None,"an extreme close-up macro insert of the bright orange takeaway cup with the cinnamon-stick emblem on its sleeve","ECU","eye","push_in","day",True,False,
  "оранжевый стакан с палочкой корицы на манжете узнают теперь во всём районе."),
 ("A6_SH06",None,"street_corner","a wide view of the morning queue at the takeaway window, orange cups moving off down the pavement","WS","eye","pan_right","day",True,False,
  "по утрам у окна навынос собирается очередь, и оранжевые стаканы расходятся по кварталу."),
 ("A6_SH07","MARK_BASE","korica_cafe","a medium close-up of the grey-moustached barista standing in the doorway, tasting a cup with narrowed eyes","MCU","eye","static","day",False,False,
  "однажды в дверях появляется Марк: он пробует твой фирменный и молчит подозрительно долго."),
 ("A6_SH08","MARK_BASE","korica_cafe","a close-up of the moustached barista's face giving up its sternness to a grin","CU","eye","push_in","day",False,False,
  "через месяц он приносит трудовую и говорит: научи меня твоим солнышкам, начальница."),
 ("A6_SH09","MARK_BASE","korica_cafe","a medium shot of the veteran barista working the steam wand behind the little counter, entirely at home","MS","eye","static","day",False,True,
  "лучший наставник города теперь взбивает молоко за твоей стойкой и ворчит от удовольствия."),
 ("A6_SH10",None,"korica_cafe","a wide view of the cafe in the evening, students arguing over notebooks, a cat asleep on the windowsill","WS","eye","static","evening",True,False,
  "по вечерам за столиками спорят студенты, а у окна дремлет кот, которого никто не заводил."),
 ("A6_SH11",None,None,"an extreme close-up insert of a marmalade cat curled on a warm windowsill beside a chalk sun","ECU","eye","static","evening",True,False,
  "кот пришёл сам после потопа, и Женя провела его по документам как антистресс."),
 ("A6_SH12","ASYA_YOUNG","korica_cafe","a medium shot of the owner reading a fresh newspaper at the counter, guests leaning in around her","MS","eye","static","day",False,False,
  "местная газета печатает про вас заметку с заголовком: кофейня, где вас знают по имени."),
 ("A6_SH13",None,None,"an extreme close-up insert of a newspaper page with a photo of a laughing barista behind a counter","ECU","top","static","day",True,False,
  "на фотографии ты смеёшься за стойкой, и этот номер бабушка хранит под стеклом."),
 ("A6_SH14",None,"rival_cafe","a wide view of the grey chain unit with empty bolted stools and a drooping discount poster","WS","eye","static","day",True,False,
  "за стеной у сетевика тем временем тихо: скидки приедаются быстрее, чем корица."),
 ("A6_SH15","RIVAL_BASE","rival_cafe","a medium close-up of the slick-haired manager at his window, counting the neighbour queue on his fingers","MCU","eye","static","day",False,False,
  "их управляющий стоит у своей витрины и считает твою очередь, загибая пальцы."),
 ("A6_SH16","ASYA_YOUNG","korica_cafe","a close-up of the copper-haired owner waving to him warmly through her big window","CU","eye","push_in","day",False,False,
  "ты машешь ему рукой через стекло, потому что злорадство портит вкус кофе."),
]

PANDEMIC=[
 ("A7_SH01",None,"city_bright","a wide establishing view of the pastel main street standing empty, shutters down, one traffic light blinking","WS","eye","push_in","day",True,False,
  "в год, когда город закрывают на карантин, улицы пустеют за одну неделю."),
 ("A7_SH02","ASYA_YOUNG","korica_cafe","a medium shot of the owner and tables being carried aside, chairs stacked, the counter left ready","MS","eye","static","day",False,False,
  "залы велено закрыть, и вы с Марком выносите столики, оставив только окно навынос."),
 ("A7_SH03",None,None,"an extreme close-up insert of a hand-drawn door sign with a sun and an arrow pointing around the corner","ECU","eye","static","day",True,False,
  "на дверь ты вешаешь табличку с солнышком и стрелкой: окно работает, дом пахнет по-прежнему."),
 ("A7_SH04",None,"street_corner","a wide view of guests spaced out on chalk marks along the pavement, umbrellas up, patient and calm","WS","eye","static","day",True,False,
  "гости стоят на меловой разметке в двух метрах друг от друга, под зонтиками, но стоят."),
 ("A7_SH05","ASYA_YOUNG","street_corner","a medium close-up of the owner in the takeaway window, passing cups out into the grey morning","MCU","eye","static","day",False,False,
  "ты работаешь за всех сразу: варишь, подаёшь в окошко и рисуешь солнышки без выходных."),
 ("A7_SH06","OBJ:cinnamon",None,"an extreme close-up macro insert of the cinnamon jar tipped over a row of foam suns, nearly empty again","ECU","top","static","day",True,False,
  "корица уходит банка за банкой, потому что тёплое сейчас нужнее людям, чем когда-либо."),
 ("A7_SH07","ZHENYA_BASE","korica_cafe","a medium shot of the red-glassed partner at a lamplit table of spreadsheets, looking up with sudden certainty","MS","eye","static","night",False,False,
  "Женя считает по вечерам вслух и однажды поднимает голову: знаешь, а мы выживем."),
 ("A7_SH08",None,"city_bright","a wide view of the residential street at dusk, home windows lit warm down the block, one glowing takeaway corner","WS","eye","tilt_down","evening",True,False,
  "город сидит по домам, и по вечерам в квартале светятся только окна квартир и твоё окошко."),
 ("A7_SH09","MARK_BASE","street_corner","a medium shot of the moustached barista loading boxed cups into a small car at dawn, breath steaming","MS","eye","static","dawn",False,True,
  "каждое утро Марк отвозит сто двадцать стаканов дежурным врачам, бесплатно, от заведения."),
 ("A7_SH10",None,None,"an extreme close-up insert of takeaway cup lids each marked with a small hand-drawn sun","ECU","top","static","dawn",True,False,
  "на каждой крышке вы рисуете маркером по солнышку, чтобы тёплое доезжало до них тёплым."),
 ("A7_SH11","ASYA_YOUNG","street_corner","a medium close-up of the owner receiving a folded paper note back through the takeaway window","MCU","eye","static","day",False,False,
  "однажды в окошко просовывают записку: спасибо за солнышки, держимся, ночная смена терапии."),
 ("A7_SH12","ASYA_YOUNG","korica_cafe","a close-up of the owner taping the little note to the shelf above the espresso machine","CU","eye","push_in","day",False,True,
  "ты приклеиваешь записку над машиной, и с этого дня она — твоя главная награда."),
 ("A7_SH13",None,"street_corner","a wide view of a summer queue at the takeaway window stretching further than ever, bicycles and prams along the kerb","WS","high","static","day",True,False,
  "к лету очередь у окна длиннее прежней, и город помнит, кто был рядом в тишине."),
 ("A7_SH14","ASYA_YOUNG","korica_cafe","a medium shot of the owner setting the six tables back in place, chairs coming down like a fanfare","MS","eye","static","day",False,False,
  "когда залы наконец разрешают открыть, твои шесть столиков занимают за девять минут."),
 ("A7_SH15","ASYA_YOUNG","korica_cafe","a close-up of the owner behind the counter looking over a full room, a slow exhale stirring the foam","CU","eye","push_in","day",False,False,
  "ты стоишь за стойкой, смотришь на полный зал и выдыхаешь так, что дрожит пенка."),
 ("A7_SH16",None,"korica_cafe","a wide view of the golden full cafe at evening, the taped note visible above the machine","WS","eye","pull_out","evening",True,False,
  "карантинный год, которого все боялись, делает маленькую кофейню по-настоящему своей для целого района."),
]

if __name__=="__main__":
    seed_act("regulars",P_REGULARS,REGULARS)
    seed_act("pandemic",P_PANDEMIC,PANDEMIC)
