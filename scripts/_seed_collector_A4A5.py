# -*- coding: utf-8 -*-
"""collector A4 field (2013-2015) + A5 career (2016-2018). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_collector_A4A5.py
Also inserts age-correct extra profiles (MOM_LATE 55, DAD_OLD 61) and locations (yard_blocks, cafe)."""
import psycopg2
from _collector_engine import seed_act, PFX, PROJ

EXTRA_LOCS={
 "yard_blocks":("Двор панелек","a worn residential courtyard between tall panel apartment blocks, a cracked asphalt loop with parked aging cars, a metal rug-beating frame, sparse trampled grass, entrances with heavy steel doors and intercom panels, balconies crowded with stored belongings, flat overcast light, the anonymous weariness of a sleeping district"),
 "cafe":("Кафе","a small unpretentious city cafe, wooden tables with paper napkin holders, a chalkboard menu on a brick wall, strings of warm fairy lights, coats hung over chair backs, steam blooming on the window glass against evening blue, the easy warm noise of a family gathering held in a modest place"),
}
EXTRA_PROFILES={
 "MOM_LATE":("MOM","adult 55","colmoml","a worn kind woman in her mid-fifties, dark chestnut hair heavily streaked with grey in a loose low bun, a plain cardigan over a housedress, gentle anxious eyes, reading glasses on a cord at her chest as her constant identity anchor",13),
 "DAD_OLD":("DAD","adult 61","coldado","a stooped balding man of sixty-one, a grey fringe around a bald crown, a stiff new dark blazer over a checkered shirt, an open mild tired face, a leather-strap wristwatch with a cracked strap as his constant identity anchor",14),
}
def add_extras():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    for n,(slug,(name,desc)) in enumerate(EXTRA_LOCS.items(),0x22):
        cur.execute('SELECT 1 FROM locations WHERE "projectId"=%s AND slug=%s',(PROJ,slug))
        if not cur.fetchone():
            cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                        (PFX+"000000000e%02x"%n,PROJ,slug,name,desc))
    for pc,(cc,age,tr,base,n) in EXTRA_PROFILES.items():
        cur.execute('SELECT 1 FROM character_profiles WHERE "profileCode"=%s AND "characterId" IN (SELECT id FROM characters WHERE "projectId"=%s)',(pc,PROJ))
        if not cur.fetchone():
            cur.execute('SELECT id FROM characters WHERE "projectId"=%s AND code=%s',(PROJ,cc)); cid=cur.fetchone()[0]
            cur.execute('INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,0,%s,%s,true,now())',
                        (PFX+"0000000000d%02x"%n,cid,pc,age,base,tr))
    cx.commit(); cur.close(); cx.close()

P_FIELD="door-to-door palette, damp stairwell green-grey and steel, one aggressive yellow accent, hard flat light"
P_CAREER="settled success palette, warm home amber against corporate glass grey, clean and comfortable"

FIELD=[
 ("A4_SH01",None,"yard_blocks","a wide establishing view of a worn courtyard between tall panel blocks, aging parked cars, heavy steel entrance doors","WS","eye","push_in","day",True,False,
  "две тысячи тринадцатый, выездная группа: теперь ты не звонишь из зала, ты приезжаешь сам."),
 ("A4_SH02","HERO_MID","car","a medium shot of a composed man of thirty in a dark suit driving, a thick folder on the passenger seat","MS","eye","static","day",False,False,
  "в служебной машине на пассажирском сиденье лежит папка с адресами, двенадцать выездов на сегодня."),
 ("A4_SH03",None,None,"an extreme close-up insert of an open folder page with an address list, sums and terse pencil notes in the margins","ECU","top","static","day",True,False,
  "напротив каждого адреса сумма и пометки: кто открывает, кто прячется, у кого в семье дети."),
 ("A4_SH04","HERO_MID","stairwell","a medium shot of the suited man climbing a shabby stairwell, polite and unhurried, folder under his arm","MS","low","track","day",False,False,
  "ты поднимаешься по чужим подъездам в костюме и с вежливым лицом, и этого обычно достаточно."),
 ("A4_SH05","OBJ:sticker",None,"an extreme close-up macro insert of a garish yellow debt-notice sticker being smoothed across a door seam by a thumb","ECU","eye","static","day",True,True,
  "на дверь молчащего должника ты клеишь жёлтый стикер с восклицательным знаком, чтобы видели все соседи."),
 ("A4_SH06","HERO_MID","stairwell","a medium close-up of the man speaking calmly and quietly at a closed padded door, lips near the seam","MCU","eye","static","day",False,False,
  "ты говоришь в дверную щель ровно и негромко, так же, как когда-то говорили с твоим отцом."),
 ("A4_SH07","HERO_MID","stairwell","a close-up of the man's ear tilted toward the door, listening, eyes narrowed with focus","CU","eye","push_in","day",False,False,
  "за дверью тихо, но слышно, как скрипнула половица: человек стоит вплотную и слушает тебя."),
 ("A4_SH08",None,"stairwell","a wide view down a stairwell shaft from above, flights of steps around a dim gap, one caged bulb","WS","top","static","day",True,False,
  "ты стоишь по эту сторону двери и ловишь себя на том, что тебе здесь спокойнее."),
 ("A4_SH09",None,None,"an extreme close-up insert of a finger pressing a worn intercom button panel, numbers rubbed blank","ECU","eye","static","day",True,False,
  "если дверь молчит неделю, ты звонишь соседям по домофону и вежливо спрашиваешь про должника."),
 ("A4_SH10","HERO_MID","yard_blocks","a medium shot of the suited man by an entrance door putting a phone away, courtyard behind him","MS","eye","static","day",False,False,
  "после таких звонков соседи здороваются с должником через губу, и это работает лучше любого суда."),
 ("A4_SH11",None,"school_gate","a wide view of a brick school building and its paved yard seen across the street through a wrought-iron fence","WS","eye","pan_right","day",True,False,
  "у одного из должников сын учится в третьем классе школы через дорогу от их дома."),
 ("A4_SH12","HERO_MID","car","a medium close-up of the man in the parked car with a phone to his ear, voice courteous, eyes cold","MCU","eye","static","day",False,True,
  "ты звонишь секретарю школы и просишь передать отцу мальчика, чтобы срочно перезвонил по важному делу."),
 ("A4_SH13","HERO_MID","car","a close-up of the man's face after the call ends, satisfaction he does not name","CU","eye","push_in","day",False,False,
  "вечером этот должник вносит первый платёж за восемь месяцев, двенадцать тысяч одним переводом."),
 ("A4_SH14","HERO_MID","office_porch","a medium shot of the man on the office porch with tea, explaining something easily to the air, palms open","MS","eye","static","day",False,True,
  "себе ты объясняешь это просто: я никого не бью, я только разговариваю с людьми."),
 ("A4_SH15",None,"stairwell","a medium view of a thin apartment door opened on a taut chain, a small paper envelope passed through the gap","MS","eye","static","day",True,False,
  "одна старушка выносит тебе деньги в конверте, завёрнутом в носовой платок, и благодарит за терпение."),
 ("A4_SH16","HERO_MID","stairwell","a close-up of the man holding the small envelope, his eyes fixed away from the door gap","CU","eye","static","day",False,False,
  "ты берёшь конверт и в этот раз не можешь заставить себя посмотреть в дверную щель."),
 ("A4_SH17",None,None,"an extreme close-up insert of a commission sheet with a column of closed cases and a circled total","ECU","top","static","day",True,False,
  "с каждого закрытого дела тебе идёт восемь процентов, и в лучший месяц выходит девяносто четыре тысячи."),
 ("A4_SH18",None,"yard_blocks","a wide view of the sleeping district at dusk, rows of lit windows in panel blocks, one dark entrance","WS","eye","tilt_up","evening",True,False,
  "за два года ты выучил спальные районы по подъездам лучше, чем помнишь свой собственный двор."),
 ("A4_SH19","MOM_LATE","mom_flat","a medium shot of the greying mother at her yellow kitchen table with the phone, tea going cold beside her","MS","eye","static","evening",False,False,
  "мать по телефону спрашивает, когда ты привезёшь показать девушку, а у тебя нет времени."),
 ("A4_SH20","HERO_MID","car","a close-up of the tired man's eyes in the rear-view mirror strip, night road light sliding over them","CU","eye","static","night",False,False,
  "ты возвращаешься по ночам с двенадцати адресов и засыпаешь без снов, как грузчик после смены."),
 ("A4_SH21",None,None,"an extreme close-up insert of a heavy business card with an embossed shield logo held between two fingers","ECU","eye","push_in","day",True,False,
  "в конце две тысячи пятнадцатого тебе передают визитку агентства «Финзащита» и обещают оклад в полтора раза выше."),
 ("A4_SH22","HERO_MID","car","a medium close-up of the man at the wheel studying the business card at a red light, deciding","MCU","eye","static","day",False,False,
  "ты соглашаешься не из-за денег, а из-за слова агентство: оно звучит почти как банк."),
]

CAREER=[
 ("A5_SH01",None,"openspace","a wide establishing view of a modern collections-agency open-plan office in daylight, ranks of desks, glass partitions, a wall dashboard","WS","eye","push_in","day",True,False,
  "«Финзащита» встречает тебя стеклом и опенспейсом на двести столов, здесь взыскание называют работой с клиентами."),
 ("A5_SH02","HERO_MID","openspace","a medium shot of the composed man standing over a block of six operator desks, hands folded, listening to calls","MS","eye","static","day",False,False,
  "тебе дают группу из шести операторов и план, который до тебя здесь не выполнял никто."),
 ("A5_SH03",None,"openspace","a close-up view of a wall-mounted dashboard screen with team bar charts climbing into green","CU","low","static","day",True,False,
  "на настенном экране висят графики отдела, и твоя группа за первый же квартал уходит в зелёное."),
 ("A5_SH04","OLYA_BASE","cafe","a medium close-up of a warm copper-haired woman with thin hoop earrings at a cafe table, laughing at a toast","MCU","eye","static","evening",False,False,
  "на дне рождения однокурсника напротив тебя сажают Олю, рыжую, в тонких серьгах-кольцах."),
 ("A5_SH05","HERO_MID","cafe","a close-up of the man answering a question with a practiced easy face, glass paused mid-air","CU","eye","push_in","evening",False,True,
  "она спрашивает, кем ты работаешь, и ты отвечаешь заготовленным: в банке, в отделе рисков."),
 ("A5_SH06","OLYA_BASE","cafe","a medium shot of the copper-haired woman leaning in across the table, a dark-suited man seen from behind opposite her","MS","over","static","evening",False,False,
  "весь вечер вы разговариваете о чём угодно, кроме работы, и это оказывается легче всего."),
 ("A5_SH07",None,None,"an extreme close-up insert of a phone screen with a new contact being saved, a feminine thumb on the keys","ECU","top","static","evening",True,False,
  "перед уходом она сама забивает свой номер в твой телефон и называет тебя надёжным на вид."),
 ("A5_SH08",None,"car","a wide view through a windshield of a night city sliding past, lights smeared on wet glass","WS","pov","track","night",True,False,
  "ты везёшь её домой через ночной город и впервые за годы никуда не торопишься."),
 ("A5_SH09",None,"cafe","a wide view of the same small cafe dressed for a modest wedding, fairy lights, white ribbons on chair backs","WS","eye","push_in","evening",True,False,
  "летом две тысячи семнадцатого вы расписываетесь и гуляете свадьбу в том же кафе на тридцать человек."),
 ("A5_SH10","MOM_LATE","cafe","a medium close-up of the grey-streaked mother in a new dress, glasses on their cord, her hand on the sleeve of a man's blazer beside her","MCU","eye","static","evening",False,False,
  "мать сидит в новом платье, очки на шнурке, и весь вечер держит отца за рукав."),
 ("A5_SH11","DAD_OLD","cafe","a close-up of the stooped balding father standing with a small glass, saying few words, mild and formal","CU","eye","static","evening",False,True,
  "отец встаёт с рюмкой и говорит всего четыре слова: живите лучше, чем мы."),
 ("A5_SH12","HERO_MID","cafe","a medium shot of the groom looking across the table at his aged parents, jaw set on a promise","MS","eye","push_in","evening",False,False,
  "ты смотришь на своих постаревших родителей и обещаешь себе, что у тебя всё будет иначе."),
 ("A5_SH13",None,"hero_flat","a wide view of a tidy new two-room apartment with cool grey walls and boxed belongings by the window","WS","eye","pan_left","day",True,False,
  "вы берёте двушку в ипотеку, и ты закрываешь её за шесть лет вместо двадцати."),
 ("A5_SH14",None,None,"an extreme close-up insert of a mortgage payment schedule with the last line stamped closed ahead of term","ECU","top","static","day",True,False,
  "в графике платежей последняя строка погашена досрочно, и этот листок ты вешаешь в шкафу изнутри."),
 ("A5_SH15","OLYA_BASE","hero_flat","a medium shot of the copper-haired wife rocking a bundled newborn by the tall window, evening city behind","MS","eye","static","evening",False,False,
  "в декабре рождается дочь, и Оля просит тебя приходить пораньше хотя бы по пятницам."),
 ("A5_SH16","HERO_MID","hero_flat","a close-up of the man carrying the swaddled infant through the dim flat at night, murmuring evenly","CU","eye","push_in","night",False,True,
  "ты носишь дочь по квартире ночами и разговариваешь с ней тем же самым ровным голосом."),
 ("A5_SH17",None,"yard_blocks","a wide view of a grey sedan parked under apartment windows in a courtyard, morning light on clean paintwork","WS","high","static","day",True,False,
  "во дворе под окнами стоит серая Камри, первая машина, купленная без единого кредита."),
 ("A5_SH18","HERO_MID","car","a medium close-up of the man driving in a good suit, a child seat visible behind his shoulder","MCU","eye","static","day",False,False,
  "по утрам ты возишь дочь в ясли мимо района, где когда-то заклеивал двери стикерами."),
 ("A5_SH19","OBJ:lighter",None,"an extreme close-up macro insert of the worn brass lighter lying in a car glovebox among documents","ECU","eye","static","day",True,False,
  "зажигалка теперь лежит в бардачке: на выезды ты больше не ездишь, ты руководишь."),
 ("A5_SH20","OLYA_BASE","hero_flat","a medium shot of the wife at the kitchen island turning from the stove with a light question on her face","MS","eye","static","evening",False,False,
  "Оля иногда спрашивает, что у тебя за клиенты такие, и ты отвечаешь: сложные, но платят."),
 ("A5_SH21","HERO_MID","hero_flat","a close-up of the man's face holding a half-truth comfortably, television light flickering over it","CU","eye","static","evening",False,False,
  "ложь про банк давно обросла деталями: отчёты, риски, комитеты, и ты сам почти веришь."),
 ("A5_SH22",None,"openspace","a wide view of the agency floor at evening, most desks released, the dashboard still glowing green","WS","eye","pull_out","evening",True,False,
  "тебя ставят в пример на планёрках, и к концу восемнадцатого года у тебя лучшие цифры этажа."),
]

if __name__=="__main__":
    add_extras()
    seed_act("field",P_FIELD,FIELD)
    seed_act("career",P_CAREER,CAREER)
