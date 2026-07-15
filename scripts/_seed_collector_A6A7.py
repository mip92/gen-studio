# -*- coding: utf-8 -*-
"""collector A6 no_return (2019) + A7 empire (2020-2022). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_collector_A6A7.py"""
import psycopg2
from _collector_engine import seed_act, PFX, PROJ

EXTRA_LOCS={
 "debtor_hall":("Прихожая должника","a cramped dim apartment hallway of an old man living alone, a corded telephone on a doily-covered shelf, a wooden stool beside it, coats on a row of hooks, a curtained doorway into a single room, a small framed photograph of a couple on the wall, one weak bulb overhead, the still air of a home where the telephone is the only visitor"),
}
def add_locs():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    for n,(slug,(name,desc)) in enumerate(EXTRA_LOCS.items(),0x24):
        cur.execute('SELECT 1 FROM locations WHERE "projectId"=%s AND slug=%s',(PROJ,slug))
        if not cur.fetchone():
            cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                        (PFX+"000000000e%02x"%n,PROJ,slug,name,desc))
    cx.commit(); cur.close(); cx.close()

P_NORETURN="verdict palette, cold document white and steel grey, a dying warm bulb accent, airless and heavy"
P_EMPIRE="glass empire palette, blue dashboard glow and night office black, home amber shrinking to one doorway"

NO_RETURN=[
 ("A6_SH01",None,"openspace","a wide establishing view of the agency floor at morning briefing, operators settling at ranks of desks, the dashboard reset to zero","WS","eye","push_in","day",True,False,
  "в девятнадцатом году агентство выкупает чужой безнадёжный портфель, и трудные дела раздают лучшим."),
 ("A6_SH02","HERO_MID","openspace","a medium shot of the composed manager at his desk opening a thick case folder, operators blurred behind","MS","eye","static","day",False,False,
  "в твоей пачке оказывается дело Семёна Ильича, пятьдесят шесть лет, долг пятьдесят восемь тысяч."),
 ("A6_SH03",None,None,"an extreme close-up insert of a case card with terse handwritten remarks in a margin column","ECU","top","static","day",True,False,
  "в примечаниях написано: занимал на лекарства жене, теперь вдовец, платит по пятьсот в месяц."),
 ("A6_SH04","DEBTOR_BASE","debtor_hall","a medium shot of a stooped mild man of fifty-six in a brown cardigan standing by a corded telephone on a doily-covered shelf","MS","eye","static","day",False,False,
  "Семён Ильич живёт один, носит коричневый кардиган и очки с подклеенной дужкой."),
 ("A6_SH05","DEBTOR_BASE","debtor_hall","a close-up of the old man's gentle frightened face with the receiver pressed to his ear, nodding","CU","eye","push_in","day",False,False,
  "он всегда берёт трубку, извиняется первым и обещает заплатить, как только придёт пенсия."),
 ("A6_SH06","HERO_MID","openspace","a medium close-up of the manager before the wall dashboard, arms crossed, a red shortfall figure reflected in his eyes","MCU","low","static","day",False,False,
  "квартальный план горит на шесть процентов, и ты переводишь долгие дела на интенсивный обзвон."),
 ("A6_SH07",None,None,"an extreme close-up insert of a printed call schedule grid, hour columns filled edge to edge with dial marks","ECU","top","static","day",True,False,
  "интенсив — это шесть звонков в час, с восьми утра до без двадцати полночь."),
 ("A6_SH08",None,"debtor_hall","a wide view of the dim hallway with the telephone ringing on its shelf, the stool empty, evening shadow","WS","eye","static","evening",True,False,
  "телефон в его прихожей звонит шестую неделю подряд, до ста десяти раз в день."),
 ("A6_SH09","DEBTOR_BASE","debtor_hall","a medium shot of the old man sitting on the stool under the telephone shelf at night, hands folded, not reaching up","MS","high","static","night",False,False,
  "Семён Ильич сидит на табурете под полкой и уже не снимает трубку, только считает звонки."),
 ("A6_SH10","DEBTOR_BASE","debtor_hall","a close-up of the old man's tired face, glasses set aside on the shelf, eyes closed under the weak bulb","CU","eye","push_in","night",False,True,
  "во вторник он ложится, не выключив в прихожей свет, и сердце останавливается около полуночи."),
 ("A6_SH11",None,"stairwell","a wide view of a stairwell landing with one apartment door sealed with a paper notice strip, morning light from the window","WS","eye","static","day",True,False,
  "соседи находят его в четверг, когда телефон замолкает и тишина оказывается заметнее звонков."),
 ("A6_SH12","HERO_MID","openspace","a medium close-up of the manager reading a printed report at his desk, jaw tight, floor noise gone around him","MCU","eye","static","day",False,False,
  "дочь Семёна Ильича пишет заявление, и оно ложится к юристам агентства вместе с распечаткой звонков."),
 ("A6_SH13",None,None,"an extreme close-up insert of a legal opinion sheet with a stamp, four short typed lines above a signature","ECU","top","static","day",True,False,
  "через месяц приходит заключение в четыре строки: нарушений действующего порядка не выявлено."),
 ("A6_SH14","HERO_MID","boss_office","a medium shot of the man being shown into a glass-walled office above the floor, a hand gesturing him toward the chair","MS","eye","static","day",False,False,
  "тебя вызывают наверх, и вместо выговора предлагают отдел: сорок операторов и оклад сто восемьдесят."),
 ("A6_SH15","HERO_MID","boss_office","a close-up of the man's controlled face listening to the offer, something moving far behind the eyes","CU","eye","push_in","day",False,False,
  "ты слушаешь про оклад и видишь перед глазами табурет под телефонной полкой."),
 ("A6_SH16","HERO_MID","hero_flat","a medium close-up of the man writing by hand at the night kitchen counter, one lamp, a single short line on paper","MCU","eye","static","night",False,False,
  "ночью на кухне ты пишешь заявление об уходе, коротко, без причин, одной строкой."),
 ("A6_SH17",None,None,"an extreme close-up insert of a folded handwritten resignation letter lying in an office drawer under a stapler","ECU","top","static","day",True,True,
  "утром заявление ложится в ящик рабочего стола, под степлер, и остаётся там лежать."),
 ("A6_SH18","OLYA_BASE","hero_flat","a medium shot of the copper-haired wife by the tall window, a rounded pregnant silhouette against the evening city","MS","eye","static","evening",False,False,
  "Оля ждёт второго, вы смотрите трёшку у парка, и уходить сейчас некуда."),
 ("A6_SH19",None,"openspace","a wide view of the full agency floor in daylight, every desk taken, the dashboard climbing","WS","high","push_in","day",True,False,
  "через три недели ты выходишь из кабинета уже начальником отдела взысканий «Финзащиты»."),
 ("A6_SH20","HERO_MID","boss_office","a medium shot of the new department head at his own desk, a single document squared in front of him","MS","eye","static","day",False,False,
  "первым документом тебе кладут на подпись регламент интенсивного обзвона, оформленный по итогам квартала."),
 ("A6_SH21",None,None,"an extreme close-up insert of a pen setting a clean signature on a regulation title page","ECU","eye","push_in","day",True,True,
  "ты читаешь его дважды, находишь свою фамилию в шапке и ставишь подпись без помарок."),
 ("A6_SH22",None,"openspace","a wide view of the night floor with the late shift row lit, headsets on, the rest of the hall dark","WS","eye","pan_right","night",True,False,
  "с этого дня интенсив становится нормой отдела, и норму эту выполняют уже без тебя."),
 ("A6_SH23","OBJ:script_card",None,"an extreme close-up macro insert of a laminated script card open at a numbered paragraph, one line highlighted in yellow","ECU","top","static","day",True,True,
  "в приложении к регламенту типовой скрипт, и строка четыре точка два в нём твоя: ничего личного — это просто долг."),
 ("A6_SH24","HERO_MID","boss_office","a medium close-up of the man closing his desk drawer flat with one deliberate push, eyes level","MCU","eye","static","day",False,False,
  "заявление так и лежит под степлером, и ты задвигаешь ящик стола до упора."),
]

EMPIRE=[
 ("A7_SH01",None,"openspace","a wide establishing view of the agency floor at full capacity, forty desks under blue dashboard glow","WS","eye","push_in","day",True,False,
  "две тысячи двадцатый: у тебя сорок операторов, и отдел делает четыре тысячи двести звонков в день."),
 ("A7_SH02","HERO_MID","boss_office","a medium shot of the department head between twin monitors, the call floor a blur beyond the glass wall","MS","eye","static","day",False,False,
  "ты больше не слышишь должников, ты видишь их колонками цифр на двух мониторах."),
 ("A7_SH03",None,"boss_office","a close-up view of a monitor with an operator KPI table, red and green cells in tidy ranks","CU","pov","static","day",True,False,
  "у каждого оператора норма: тридцать контактов и шесть обещаний оплаты за смену, ниже — минус премия."),
 ("A7_SH04",None,"hero_flat","a wide view of the tidy apartment turned into a makeshift office, a laptop and headset on the dining table","WS","eye","pan_left","day",True,False,
  "весной двадцатого офис закрывают на карантин, и отдел переезжает в наушники по домам."),
 ("A7_SH05","HERO_MID","hero_flat","a medium shot of the man leading a video briefing from a closed room, headset on, door shut behind him","MS","eye","static","day",False,False,
  "ты ведёшь планёрки из дальней комнаты, прикрыв дверь, и разбираешь записи смен по вечерам."),
 ("A7_SH06","HERO_MID","hero_flat","a close-up of the man demonstrating into the headset microphone, even mouth, cold patient eyes","CU","eye","push_in","day",False,False,
  "разбирая звонок оператора, ты показываешь голосом, как надо: ровно, негромко, с паузами в нужных местах."),
 ("A7_SH07","OLYA_BASE","hero_flat","a medium shot of the copper-haired wife stopped outside a closed door with a cup of tea in both hands","MS","eye","static","day",False,True,
  "Оля приносит тебе чай и останавливается за дверью, потому что слышит, как ты работаешь."),
 ("A7_SH08","OLYA_BASE","hero_flat","a close-up of the wife's face by the door seam, listening, the steam off the cup thinning","CU","eye","push_in","day",False,True,
  "она стоит с чашкой три минуты и уходит на кухню, не постучав."),
 ("A7_SH09",None,"hero_flat","a wide view of the family dinner table in the evening, three places set, a child's drawing pinned to the fridge","WS","eye","static","evening",True,False,
  "за ужином в тот вечер тихо, только дочь рассказывает про садик и просит добавки."),
 ("A7_SH10","OLYA_BASE","hero_flat","a medium close-up of the wife across the dinner table, studying her husband with a new careful distance","MCU","eye","static","evening",False,False,
  "Оля смотрит на тебя через стол так, будто проверяет, тот ли это голос."),
 ("A7_SH11","HERO_MID","hero_flat","a close-up of the man asking something lightly, the practiced home warmth not reaching his eyes","CU","eye","static","evening",False,False,
  "ты спрашиваешь, что случилось, своим домашним голосом, и от этого становится только хуже."),
 ("A7_SH12","OLYA_BASE","hero_flat","a medium shot of the wife at the dark kitchen at night, a dark-shirted man seen from behind in the doorway","MS","eye","static","night",False,True,
  "ночью она спрашивает прямо: банк или коллекторы, и ты отвечаешь честно в первый раз."),
 ("A7_SH13","OLYA_BASE","hero_flat","a close-up of the woman's still face saying something quietly across the dark kitchen","CU","eye","push_in","night",False,False,
  "она молчит, потом говорит: значит, те звонки маме про кредит — это были такие, как ты."),
 ("A7_SH14","HERO_MID","hero_flat","a medium shot of the man making up a couch bed in the living room, precise and silent","MS","high","static","night",False,False,
  "с этой ночи ты спишь в гостиной, и разговоры дома становятся короткими, как смс."),
 ("A7_SH15",None,"yard_blocks","a wide view of the courtyard in thaw, dirty snowbanks shrinking, windows open for the first warm air","WS","eye","tilt_down","day",True,False,
  "карантин заканчивается, офис открывается, но домой возвращаться в прежнее уже не выходит."),
 ("A7_SH16","HERO_MID","boss_office","a medium shot of the man back at his glass office before eight, coat still on, monitors waking","MS","eye","static","day",False,False,
  "ты уходишь в работу глубже: приходишь к восьми, уходишь после полуночного среза статистики."),
 ("A7_SH17",None,None,"an extreme close-up insert of two phones side by side on a desk, the work one lit with alerts, the personal one dark","ECU","top","static","night",True,False,
  "личный телефон лежит рядом с рабочим и за целый день не звонит ни разу."),
 ("A7_SH18","OLYA_BASE","hero_flat","a medium close-up of the wife in a coat by packed suitcases in the hallway, a child's backpack over her shoulder","MCU","eye","static","day",False,False,
  "в марте двадцать второго Оля забирает детей и уезжает к матери, оставив ключи в прихожей."),
 ("A7_SH19",None,None,"an extreme close-up insert of two apartment keys laid parallel on a glove shelf by the door","ECU","top","push_in","day",True,True,
  "два ключа лежат на полке для перчаток так ровно, что видно: их клали спокойно."),
 ("A7_SH20",None,"hero_flat","a wide view of the tidy empty apartment at dusk, one lamp on, the couch bed folded away","WS","eye","static","evening",True,False,
  "в двушке, за которую ты заплатил досрочно, теперь слышно, как гудит холодильник."),
 ("A7_SH21","HERO_MID","car","a medium close-up of the man driving with a nine-year-old's silhouette in the child seat behind his shoulder","MCU","eye","static","day",False,False,
  "дочь ты видишь по субботам, четыре часа: кино, картошка фри и дорога обратно."),
 ("A7_SH22","HERO_MID","car","a close-up of the man's face listening to the back seat, polite hurt held perfectly still","CU","eye","static","day",False,False,
  "она рассказывает тебе про школу вежливо, как рассказывают малознакомому взрослому, и ты это слышишь."),
 ("A7_SH23",None,"openspace","a wide view of the floor with a records banner month on the dashboard, operators standing to applaud toward the glass office","WS","low","static","day",True,False,
  "отдел тем временем ставит рекорд за рекордом, и на этаже твою систему называют образцовой."),
 ("A7_SH24","KRIS_BASE","openspace","a medium close-up of a poised young operator with a sleek jet-black bob and a headset, violet nails on the keys","MCU","eye","static","day",False,False,
  "осенью в отдел приходит Кристина, двадцать лет, чёрное каре, и учит твой скрипт наизусть за неделю."),
 ("A7_SH25","KRIS_BASE","openspace","a close-up of the young operator's focused face mid-call, even lips, eyes steady on the monitor","CU","eye","push_in","day",False,False,
  "через полгода у неё лучшие цифры среди новичков, и ты ставишь её в пример, как когда-то тебя."),
 ("A7_SH26","HERO_MID","boss_office","a medium shot of the department head watching his floor through the glass wall, hands in pockets","MS","eye","static","evening",False,False,
  "ты смотришь на свой зал через стекло и говоришь себе, что всё это ради детей."),
 ("A7_SH27",None,None,"an extreme close-up insert of a small framed photograph of a girl on a desk, turned toward the empty chair","ECU","eye","static","evening",True,False,
  "на рабочем столе стоит фотография дочери, повёрнутая к креслу, а не к посетителям."),
 ("A7_SH28",None,"openspace","a wide view of the night city through the office windows, the dark floor reflected against the glass","WS","eye","pull_out","night",True,False,
  "детям тем временем идут переводы два раза в месяц, ровно по графику, как платежи."),
]

if __name__=="__main__":
    add_locs()
    seed_act("no_return",P_NORETURN,NO_RETURN)
    seed_act("empire",P_EMPIRE,EMPIRE)
