# -*- coding: utf-8 -*-
"""shuttle A8 kiosk + A9 store + A10 mend + A11 coda. Adds LENA_YOUNG (22) profile.
PYTHONIOENCODING=utf-8 python scripts/_seed_shuttle_A8A11.py"""
import psycopg2
from _shuttle_engine import seed_act, PFX, PROJ

def add_profiles():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    cur.execute('SELECT 1 FROM character_profiles WHERE "profileCode"=%s AND "characterId" IN (SELECT id FROM characters WHERE "projectId"=%s)',("LENA_YOUNG",PROJ))
    if not cur.fetchone():
        cur.execute('SELECT id FROM characters WHERE "projectId"=%s AND code=%s',(PROJ,"LENA"))
        cid=cur.fetchone()[0]
        cur.execute('INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,0,%s,%s,true,now())',
                    (PFX+"0000000000d0a",cid,"LENA_YOUNG","adult 22",
                     "a bright collected young woman of twenty-two, dark-brown hair in a neat ponytail, a university jacket over a plain top, attentive capable eyes, a red scarf loose at her throat as her constant identity anchor","shlyoung"))
    cx.commit(); cur.close(); cx.close()

P_KIOSK="settled-trade palette, kiosk lamp amber against bus-stop winter blue, small warm plenty"
P_STORE="earned-respect palette, washed shop daylight over ordered racks, one hard cold conversation in it"
P_MEND="mending palette, graduation spring light and shop lamp gold, warmth returning by degrees"
P_CODA="keepsake palette, modern warm spot light over plaid and amber, the circle closing kindly"

KIOSK=[
 ("A8_SH01",None,"kiosk_hers","a wide establishing view of a packed trade kiosk by a bus stop, barred window glowing in winter dusk","WS","eye","push_in","evening",True,False,
  "в двухтысячном ты покупаешь ларёк у остановки, и автобусы в Стамбул остаются другим."),
 ("A8_SH02","VERA_MID","kiosk_hers","a medium shot of the grey-streaked woman inside the kiosk with a thermos, heater glowing by the stool","MS","eye","static","day",False,False,
  "теперь твой день начинается в семь у обогревателя, и это почти курорт после трассы."),
 ("A8_SH03",None,None,"an extreme close-up insert of price tags in immaculate drafting handwriting pinned to jackets","ECU","eye","static","day",True,False,
  "ценники ты пишешь тем же чертёжным почерком, и покупатели говорят, что у тебя красиво."),
 ("A8_SH04",None,"city_90s","a wide view of the bus stop crowd browsing the kiosk window on a grey morning","WS","eye","static","day",True,False,
  "ларёк у остановки кормит весь район рабочей одеждой, куртками и школьной формой."),
 ("A8_SH05","GRAN_SH","kiosk_hers","a medium shot of the grandmother passing lunch containers through the kiosk door, staying to fuss","MS","eye","static","day",False,False,
  "мать приносит тебе обеды в судочках и остаётся поворчать, что мало ешь."),
 ("A8_SH06","VERA_MID","kiosk_hers","a close-up of the woman's warm tired smile over a steaming lunch container","CU","eye","push_in","day",False,False,
  "вы теперь видитесь каждый день, и это лучшее, что купил тебе ларёк."),
 ("A8_SH07","LENA_TEEN","kiosk_hers","a medium close-up of a guarded fourteen-year-old at the kiosk window after school, earbud in one ear","MCU","eye","static","day",False,False,
  "Лена заходит после школы всё реже, ей четырнадцать, и у неё своя жизнь, закрытая."),
 ("A8_SH08",None,None,"an extreme close-up insert of the plaid bag being pushed up onto a mezzanine shelf at home","ECU","low","static","evening",True,False,
  "клетчатую сумку ты убираешь дома на антресоль, но выбрасывать её не даёшь никому."),
 ("A8_SH09",None,"flat_home","a wide view of the Sunday table set for three, cutlery loud in a polite quiet","WS","eye","static","evening",True,False,
  "по воскресеньям вы ужинаете втроём, и за столом теперь разговаривают в основном приборы."),
 ("A8_SH10","VERA_MID","flat_home","a medium close-up of the woman watching her daughter's closed door down the hallway","MCU","eye","push_in","evening",False,False,
  "ты замечаешь, что дочь выросла в твоё отсутствие, и не знаешь, куда это записать."),
]

STORE=[
 ("A9_SH01",None,"store_hers","a wide establishing view of a small clothing store in a former grocery, clean racks, big washed windows","WS","eye","push_in","day",True,False,
  "в две тысячи третьем ты открываешь магазин «Вера» в бывшем гастрономе, с примерочной и кассой."),
 ("A9_SH02","VERA_MID","store_hers","a medium shot of the owner behind a proper counter, two aproned figures working the racks behind","MS","eye","static","day",False,False,
  "у тебя две продавщицы, санкнижка и вывеска с твоим именем, заработанным по буквам."),
 ("A9_SH03",None,None,"an extreme close-up insert of a shop sign lettering sketch with careful measured strokes","ECU","top","static","day",True,False,
  "буквы на вывеске ты выбирала дольше, чем когда-то шрифт для дипломного чертежа."),
 ("A9_SH04","LENA_TEEN","store_hers","a medium close-up of a lean seventeen-year-old in a studded denim jacket waiting by the shop door","MCU","eye","static","day",False,False,
  "Лене семнадцать, она приходит в магазин, как в чужое место, и ждёт у дверей."),
 ("A9_SH05","LENA_TEEN","store_hers","a close-up of the girl's tired defiant face saying something quiet and terrible","CU","eye","push_in","day",False,True,
  "однажды она говорит тихо и страшно: ты меня на сумки променяла, мама."),
 ("A9_SH06","VERA_MID","store_hers","a medium close-up of the mother taking the sentence standing, hands flat on the counter","MCU","eye","static","day",False,True,
  "ты молчишь, потому что ответить нечем: половина этого — правда, а вторая половина — тоже."),
 ("A9_SH07",None,"store_hers","a wide view of the closed evening shop, one lamp over the counter, racks in ordered shadow","WS","eye","static","night",True,False,
  "в тот вечер ты сидишь в закрытом магазине среди курток, которые всё это оплатили."),
 ("A9_SH08","OBJ:bag",None,"an extreme close-up macro insert of the plaid bag on a shelf above an office door, lamp low on it","ECU","low","static","night",True,False,
  "клетчатая сумка стоит на полке над дверью кабинета, и сегодня смотреть на неё тяжело."),
 ("A9_SH09","VERA_MID","store_hers","a medium shot of the woman dialing at the dark counter, back straight, receiver pressed close","MS","eye","static","night",False,False,
  "ты звонишь дочери первой, впервые за годы, и говоришь: прости, я не умела иначе."),
 ("A9_SH10","LENA_TEEN","flat_home","a close-up of the girl listening with the phone at her ear, defiance loosening by a degree","CU","eye","push_in","night",False,False,
  "Лена молчит в трубку долго, потом отвечает: я знаю, мам, я просто устала ждать."),
]

MEND=[
 ("A10_SH01",None,"city_90s","a wide establishing view of a university facade in spring, graduates in gowns clustering on the steps","WS","eye","push_in","day",True,False,
  "университет Лена оканчивает без единого хвоста, и оплачен он от первой до последней сессии сумками."),
 ("A10_SH02","LENA_YOUNG","city_90s","a medium close-up of a ponytailed graduate waving from the steps, red scarf loose over the gown","MCU","eye","static","day",False,False,
  "на вручении она машет тебе со ступеней, и ты хлопаешь за двоих, как когда-то бабушка."),
 ("A10_SH03",None,None,"an extreme close-up insert of a diploma open on a table, a red scarf laid beside it","ECU","top","static","day",True,False,
  "в её дипломе написано «экономист», и вы обе знаете, из чего он сделан."),
 ("A10_SH04",None,"store_hers","a wide view of the December shop in full rush, a queue at the counter, coats moving between racks","WS","eye","static","day",True,False,
  "в декабре перед праздниками в магазине запара, и одна продавщица сваливается с гриппом."),
 ("A10_SH05","LENA_YOUNG","store_hers","a medium shot of the young woman shedding her coat and stepping behind the counter unasked","MS","eye","static","day",False,True,
  "Лена молча снимает пальто, встаёт за прилавок и работает смену, как будто всегда умела."),
 ("A10_SH06","VERA_MID","store_hers","a close-up of the mother watching from the stockroom doorway, keeping very still","CU","eye","push_in","day",False,False,
  "ты смотришь из подсобки, как она пересчитывает сдачу дважды, твоим точным движением."),
 ("A10_SH07","VERA_MID","store_hers","a medium shot of mother and a young woman with tea among the racks after closing, coats on hangers around","MS","eye","static","night",False,False,
  "после смены вы пьёте чай среди вешалок, и разговор впервые за годы не кончается."),
 ("A10_SH08",None,None,"an extreme close-up insert of two tea cups on a shop counter beside the oilcloth notebook","ECU","top","static","night",True,True,
  "ты говоришь ей своё главное: оборот — это всё, — и она смеётся: знаю, мам, с детства."),
 ("A10_SH09",None,"courtyard","a wide view of the courtyard bench in soft autumn light, a knitted shawl folded over its back","WS","eye","static","day",True,False,
  "бабушка доживает до правнуков, до магазина и до мира в семье, и уходит тихо, во сне."),
 ("A10_SH10","VERA_MID","store_hers","a medium close-up of the woman placing a wooden comb into the till drawer beside a taped first note","MCU","eye","static","day",False,False,
  "её деревянный гребень ты кладёшь в кассу магазина, на счастье, рядом с первой выручкой."),
]

CODA=[
 ("A11_SH01",None,"new_flat","a wide view of the modern hallway again, the woman of forty on the floor with the plaid bag and her phone","WS","eye","push_in","evening",True,False,
  "и вот две тысячи двадцать шестой: твоя дочь сидит на полу новой квартиры с сумкой."),
 ("A11_SH02","LENA_ADULT","new_flat","a medium close-up of the woman listening on the phone, a warm unhurried smile arriving","MCU","eye","static","evening",False,False,
  "ты досказываешь историю, и Лена молчит в трубку тепло, совсем не так, как в семнадцать."),
 ("A11_SH03","LENA_ADULT","new_flat","a close-up of fingers tracing four patches on plaid fabric like lines of text","CU","top","push_in","evening",False,True,
  "она проводит пальцем по четырём заплаткам, как по строчкам, и говорит: теперь я поняла."),
 ("A11_SH04","VERA_OLD","flat_home","a medium close-up of the silver-haired woman with her tea, answering gently","MCU","eye","static","evening",False,False,
  "ты отвечаешь ей то, что ответила бы бабушка: главное, что поняла не поздно."),
 ("A11_SH05",None,"new_flat","a wide view of the hallway with the stepladder set under the open mezzanine, the bag waiting at its foot","WS","eye","static","evening",True,False,
  "сумку Лена не выбрасывает и не сдаёт в музей: она ставит её на свои антресоли."),
 ("A11_SH06","OBJ:bag",None,"an extreme close-up macro insert of the plaid bag settled on a mezzanine shelf, the Turkish tag hanging off the handle","ECU","eye","push_in","evening",True,True,
  "клетчатая сумка занимает своё место над новой жизнью, и турецкая бирка свисает с ручки."),
 ("A11_SH07","LENA_ADULT","new_flat","a medium shot of the woman closing the mezzanine doors softly and resting a palm on them","MS","low","static","evening",False,False,
  "антресоль закрывается мягко, и где-то в ней теперь живут двенадцать лет твоих дорог."),
 ("A11_SH08","VERA_OLD","flat_home","a close-up of the silver-haired woman looking to the viewer over her cup, amber clip in lamplight","CU","eye","push_in","night",False,False,
  "подпишись, если у твоей семьи тоже была такая сумка, а я знаю, что была."),
 ("A11_SH09",None,"new_flat","a wide view of the warm evening hallway, boxes settling into a home, one red scarf on the coat rack","WS","eye","pull_out","night",True,False,
  "эта история вымышлена, совпадения случайны, а клетчатые сумки и мамы — настоящие, берегите их."),
]

if __name__=="__main__":
    add_profiles()
    seed_act("kiosk",P_KIOSK,KIOSK)
    seed_act("store",P_STORE,STORE)
    seed_act("mend",P_MEND,MEND)
    seed_act("coda",P_CODA,CODA)
