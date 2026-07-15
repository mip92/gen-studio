# -*- coding: utf-8 -*-
"""lottery A8 bottom + A9 return + A10 rebuild + A11 coda. PYTHONIOENCODING=utf-8 python scripts/_seed_lottery_A8A11.py"""
from _lottery_engine import seed_act

P_BOTTOM="stripped-bare palette, dormitory beige and document grey, one warm bulb of dignity"
P_RETURN="homecoming palette, workshop steel and warm sodium, oil-dark browns with steady morning light"
P_REBUILD="mended palette, spring light over machine steel, modest warm colors coming back"
P_CODA="dawn circle palette, cold blue morning breaking into working gold, settled and clear"

BOTTOM=[
 ("A8_SH01",None,"bailiff_office","a wide establishing view of a state enforcement office, grey cabinets, numbered folders, a fast wall clock","WS","eye","push_in","day",True,False,
  "весной тебя ждут приставы: кредиты, взятые «под прибыль ТЦ», дозрели до исполнительных листов."),
 ("A8_SH02","HERO_RICH","bailiff_office","a medium close-up of the man across a stacked desk, coat too good for the chair he sits on","MCU","eye","static","day",False,False,
  "долг после всех продаж — восемь миллионов девятьсот, и эта цифра наконец-то честная."),
 ("A8_SH03",None,None,"an extreme close-up insert of an inventory list, items in a clerk's hand, one line left unticked","ECU","top","static","day",True,False,
  "опись занимает полторы страницы: часы, пальто, кресло, а рамка с билетом приставов не заинтересовала."),
 ("A8_SH04","HERO_RICH","city_street","a medium shot of the man watching the luxury SUV ride a tow truck away down the street","MS","eye","static","day",False,False,
  "кайен уезжает на эвакуаторе за долги, и сосед снимает это на телефон."),
 ("A8_SH05",None,"dorm_room","a wide view of a narrow dormitory room, a steel bed, one wardrobe, a window on brick","WS","eye","static","day",True,False,
  "ты переезжаешь в комнату рабочей общаги: кровать, шкаф, плитка и стена в цветочек."),
 ("A8_SH06",None,None,"an extreme close-up insert of a single mug on a stool beside a hotplate","ECU","eye","static","evening",True,False,
  "из всей посуды у тебя одна кружка, и это почему-то смешно, а не страшно."),
 ("A8_SH07","HERO_RICH","dorm_room","a medium close-up of the man at the dark window in an undershirt, city hum beyond the brick","MCU","eye","static","night",False,False,
  "ночами ты считаешь не потери, а дни: сколько их прошло с последней смены в цеху."),
 ("A8_SH08",None,None,"an extreme close-up insert of an eight-panel flat cap hung on a nail above a steel bed frame","ECU","eye","push_in","night",True,True,
  "отцовскую кепку ты вешаешь на гвоздь над кроватью, и комната сразу становится жилой."),
 ("A8_SH09",None,"city_street","a wide view of the autumn street in walking rhythm, bus stops passing, leaves down the gutters","WS","eye","track","day",True,False,
  "машины нет, и ты заново узнаёшь город пешком, по сорок минут в один конец."),
 ("A8_SH10","HERO_RICH","factory_gate","a medium shot of the man across the road from the factory checkpoint, hands in pockets, watching the shift go in","MS","eye","static","dawn",False,True,
  "однажды ноги сами приводят тебя к заводской проходной, и ты стоишь напротив полчаса."),
]

RETURN=[
 ("A9_SH01",None,"factory_gate","a wide view of the checkpoint on a January morning, breath steam over the queue, sodium light on snow","WS","eye","push_in","dawn",True,False,
  "в январе ты надеваешь чистую куртку и идёшь на завод не мимо, а внутрь."),
 ("A9_SH02","MASTER_BASE","factory_shop","a medium close-up of the thick-spectacled foreman wiping his hands on a rag, recognising a man at the doors","MCU","eye","static","day",False,False,
  "мастер видит тебя от дверей, вытирает руки ветошью и говорит: долго ходишь."),
 ("A9_SH03","HERO_BACK","factory_shop","a close-up of the man swallowing a prepared speech, standing straight and keeping his eyes level","CU","eye","push_in","day",False,False,
  "ты готовил речь три дня, а нужно оказалось только стоять и не отводить глаз."),
 ("A9_SH04","MASTER_BASE","factory_shop","a medium shot of the foreman leading the way down the aisle and pulling a tarpaulin off a lathe like a sail","MS","eye","track","day",False,True,
  "он ведёт тебя через цех к станку, накрытому брезентом, и снимает брезент, как парус."),
 ("A9_SH05",None,None,"an extreme close-up insert of clean oiled machine guideways emerging from under a lifted tarpaulin","ECU","eye","static","day",True,False,
  "станок стоял накрытым четыре года, и смазка на направляющих ещё та, твоя."),
 ("A9_SH06",None,"factory_shop","a wide view of the shop working around one returning man as if nothing happened, hoists and sparks","WS","eye","pan_left","day",True,False,
  "цех делает вид, что ничего не было, и это самая большая доброта в твоей жизни."),
 ("A9_SH07","HERO_BACK","factory_shop","a medium shot of the man at his lathe mid-setup, hands moving on their own memory","MS","eye","static","day",False,False,
  "руки вспоминают всё за смену, будто эти четыре года были обеденным перерывом."),
 ("A9_SH08","OBJ:wrench",None,"an extreme close-up macro insert of the palm-polished adjustable wrench being laid back on a workbench","ECU","top","static","day",True,False,
  "твой разводной ключ лежал у мастера в столе, и он возвращает его без слов."),
 ("A9_SH09","HERO_BACK","factory_shop","a medium close-up of the man reading a payslip by his locker, nodding at the arithmetic","MCU","eye","static","day",False,False,
  "зарплата теперь девяносто пять, из них сорок шесть уходят по графику долга, на шестнадцать лет."),
 ("A9_SH10",None,None,"an extreme close-up insert of a repayment schedule taped inside a locker door, top lines struck through","ECU","pov","static","day",True,False,
  "график погашения висит у тебя в шкафчике, и каждый месяц ты зачёркиваешь строку."),
 ("A9_SH11",None,"factory_gate","a wide view of the evening shift streaming out through the turnstiles under warm lamps","WS","eye","static","evening",True,False,
  "вечером ты выходишь с потоком смены, и охранник кивает уже без вопросов."),
 ("A9_SH12","HERO_BACK","dorm_room","a medium shot of the man asleep before midnight, the flat cap on its nail, a phone face-down on the stool","MS","high","static","night",False,False,
  "в общаге ты засыпаешь до полуночи, и телефон всю ночь лежит экраном вниз."),
]

REBUILD=[
 ("A10_SH01",None,"factory_shop","a wide view of the spring shop with a cluster of young trainees in stiff new jackets by the notice board","WS","eye","push_in","day",True,False,
  "весной в цех приходят практиканты из техникума, и среди них ты видишь Максима."),
 ("A10_SH02","SON_GROWN","factory_shop","a medium close-up of a serious nineteen-year-old in an oversized blue work jacket, straight-backed","MCU","eye","static","day",False,False,
  "ему девятнадцать, спецовка на размер больше, и он выбрал завод сам, тебе назло или в честь."),
 ("A10_SH03","HERO_BACK","factory_shop","a close-up of the father seeing his son across the aisle, holding his face still","CU","eye","push_in","day",False,False,
  "вы не разговаривали полтора года, и первый разговор случается через станок, по делу."),
 ("A10_SH04","SON_GROWN","factory_shop","a medium shot of the young man at the lathe, an older man's hands guiding his from behind the shoulder","MS","over","static","day",False,True,
  "ты показываешь ему настройку, как отец показывал тебе киоск: молча, руками, по пятницам."),
 ("A10_SH05",None,None,"an extreme close-up insert of two pairs of hands on one machine handle, one scarred, one young","ECU","eye","static","day",True,False,
  "у него твои руки, только без шрамов, и это лучшее, что ты видел за годы."),
 ("A10_SH06",None,"khrush_kitchen","a wide view of the old family kitchen set for Saturday soup, three places laid, a cake box on the fridge","WS","eye","static","day",True,False,
  "по субботам Максим зовёт тебя на борщ к матери, и иногда ты доходишь до подъезда."),
 ("A10_SH07","HERO_BACK","city_street","a medium close-up of the man at an entrance door with a cake box, deciding, not ringing yet","MCU","eye","static","day",False,False,
  "пока ты поднимаешься не каждый раз, но торт покупаешь всегда, на всякий случай."),
 ("A10_SH08",None,None,"an extreme close-up insert of a repayment schedule with the eleventh line struck through in pen","ECU","top","static","day",True,False,
  "в графике долга зачёркнута одиннадцатая строка из ста девяноста двух, и ты не торопишься."),
 ("A10_SH09",None,"city_street","a wide view of the summer street in ordinary traffic, kiosks and bus stops in plain light","WS","eye","pan_right","day",True,False,
  "город живёт, как жил до твоего выигрыша, и тебе в нём снова есть место."),
 ("A10_SH10","HERO_BACK","kiosk","a medium shot of the man walking past the lottery kiosk at an even pace, eyes ahead","MS","eye","track","day",False,True,
  "мимо лотерейного киоска ты теперь проходишь ровным шагом, как мимо чужого окна."),
]

CODA=[
 ("A11_SH01",None,"factory_gate","a wide view of the checkpoint at six in the morning, the shift queue at the turnstiles, the frame from the start","WS","eye","push_in","dawn",True,False,
  "шесть утра, проходная, очередь смены — ровно тот кадр, с которого мы начали."),
 ("A11_SH02","HERO_BACK","factory_gate","a medium close-up of the man beside a fidgeting young newcomer clutching a glossy new pass","MCU","eye","static","dawn",False,False,
  "рядом мнётся новенький паренёк с глянцевым пропуском, первый день, глаза как у тебя в восемнадцать."),
 ("A11_SH03","HERO_BACK","factory_gate","a close-up of the older man listening to a whispered question with half a smile","CU","eye","static","dawn",False,False,
  "он узнаёт тебя по заводской легенде и спрашивает шёпотом: а правда, что выиграл."),
 ("A11_SH04","HERO_BACK","factory_gate","a medium shot of the man answering evenly as the turnstile light goes green for him","MS","eye","static","dawn",False,True,
  "правда, отвечаешь ты: семьдесят три миллиона, и повезло мне в том, что это закончилось."),
 ("A11_SH05","OBJ:ticket_frame",None,"an extreme close-up macro insert of the gilded frame face-down under wrenches in a tool drawer","ECU","top","static","day",True,True,
  "рамка с билетом лежит в ящике под ключами, и ты давно не переворачивал её стеклом вверх."),
 ("A11_SH06","HERO_BACK","factory_shop","a medium close-up of the man passing the father's line to the newcomer over a workbench","MCU","eye","push_in","day",False,True,
  "новенькому ты говоришь отцовское: если будешь брать билет — с получки один, больше уже жадность."),
 ("A11_SH07",None,"factory_shop","a wide view of the shop coming alive, machines starting one after another down the aisle","WS","low","static","day",True,False,
  "смена начинается, станки включаются один за другим, и в этом ровном гуле твоя настоящая жизнь."),
 ("A11_SH08","HERO_BACK","factory_shop","a close-up of the man looking straight at the viewer, calm and unhurried, work light on his face","CU","eye","push_in","day",False,False,
  "подпишись, если досмотрел: у меня в запасе ещё много историй про цену везения."),
 ("A11_SH09",None,"factory_gate","a wide view of the checkpoint from outside in full morning, the street going about its day","WS","eye","pull_out","day",True,False,
  "эта история вымышлена, совпадения случайны, а вот налог на выигрыш — настоящий, помни о нём."),
]

if __name__=="__main__":
    seed_act("bottom",P_BOTTOM,BOTTOM)
    seed_act("return",P_RETURN,RETURN)
    seed_act("rebuild",P_REBUILD,REBUILD)
    seed_act("coda",P_CODA,CODA)
