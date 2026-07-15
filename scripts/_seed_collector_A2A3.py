# -*- coding: utf-8 -*-
"""collector A2 callcenter (2008) + A3 talent (2010-2012). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_collector_A2A3.py"""
import psycopg2
from _collector_engine import seed_act, PFX, PROJ

EXTRA_LOCS={
 "rented_room":("Съёмная комната (2008)","a narrow rented room of a student in the late two-thousands, a fold-out sofa bed, a desk with a bulky laptop and stacked economics textbooks, a clothes rail in the corner, a window onto a courtyard wall, instant-noodle cups beside an electric kettle, thin daylight, the frugal transit feel of a life not yet started"),
 "office_porch":("Крыльцо офиса","the concrete porch of a plain office building, glass entrance doors with a printed notice taped inside, an ashtray bin to one side, a strip of parking and wet asphalt beyond, city noise held at a distance, flat overcast light, a place for a two-minute escape from the phones"),
}
def add_locs():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    for n,(slug,(name,desc)) in enumerate(EXTRA_LOCS.items(),0x20):
        cur.execute('SELECT 1 FROM locations WHERE "projectId"=%s AND slug=%s',(PROJ,slug))
        if not cur.fetchone():
            cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                        (PFX+"000000000e%02x"%n,PROJ,slug,name,desc))
    cx.commit(); cur.close(); cx.close()

P_CALL="recession palette, drained office greys and fluorescent white with sickly warm accents, cheap and tense"
P_TALENT="ascending cold palette, steel grey and monitor blue gaining polish, small gold accents of first money"

CALLCENTER=[
 ("A2_SH01",None,"street_90s","a wide establishing view of the provincial street ten years on, the same panel blocks with new plastic windows and satellite dishes, slushy spring light","WS","eye","push_in","day",True,False,
  "две тысячи восьмой, тебе двадцать, ты уехал в большой город учиться на экономиста."),
 ("A2_SH02","HERO_YOUNG","rented_room","a medium shot of a lean young man of twenty counting a thin fold of banknotes on a desk beside stacked textbooks","MS","high","static","day",False,False,
  "кризис съедает подработки одну за другой, а за съёмную комнату надо отдавать шесть тысяч каждый месяц."),
 ("A2_SH03","HERO_YOUNG","rented_room","a close-up of the young man's wary face lit by a bulky laptop screen with a job-listings page","CU","eye","push_in","night",False,False,
  "ночью на сайте вакансий ты находишь объявление: специалист по работе с просроченной задолженностью, двадцать пять тысяч плюс бонусы."),
 ("A2_SH04","OBJ:lighter",None,"an extreme close-up macro insert of the worn brass lighter lying on a student desk beside a laptop touchpad","ECU","top","static","night",True,False,
  "отцовская зажигалка, которую ты забрал из серванта, уезжая учиться, лежит рядом с ноутбуком."),
 ("A2_SH05",None,"callcenter","a wide view of a cramped call center floor, rows of grey fabric dividers, bulky monitors, coats on chair backs under fluorescent tubes","WS","eye","pan_right","day",True,False,
  "наутро ты приходишь по адресу и попадаешь не в банк, а в тесный зал на сорок гарнитур."),
 ("A2_SH06","IGOR_BASE","callcenter","a medium close-up of a wiry team leader with a clean-shaven head and a loosened tie, a chunky gold-tone watch, sizing up a newcomer","MCU","eye","static","day",False,False,
  "тебя встречает тимлид Игорь, смотрит секунды три и говорит, что голос у тебя подходящий."),
 ("A2_SH07","OBJ:script_card",None,"an extreme close-up macro insert of a laminated call-script card with dense print and one line highlighted in yellow","ECU","top","static","day",True,False,
  "тебе выдают гарнитуру и ламинированную карточку скрипта, где каждое слово уже написано за тебя."),
 ("A2_SH08","IGOR_BASE","callcenter","a medium shot of the team leader leaning over a cubicle divider, tapping a knuckle on a monitor, coaching","MS","over","static","day",False,False,
  "на тренинге Игорь учит слушать не слова, а страх, потому что платит всегда именно страх."),
 ("A2_SH09","HERO_YOUNG","callcenter","a medium close-up of the young man with a corded headset on, dialing his first number, finger hovering","MCU","eye","push_in","day",False,False,
  "первый твой номер — женщина семидесяти лет, восемнадцать тысяч четыреста долга за кредитный холодильник."),
 ("A2_SH10","HERO_YOUNG","callcenter","a close-up of the young man's face losing its script mid-call, eyes flinching away from the monitor","CU","eye","static","day",False,False,
  "она не спорит и не ругается, она плачет в трубку тихо, как виноватая, и просит прощения."),
 ("A2_SH11",None,"callcenter","a close-up view of a corded headset dropped onto a keyboard beside a laminated script card, an empty chair edge behind","CU","high","static","day",True,False,
  "ты кладёшь гарнитуру на клавиатуру посреди смены и выходишь из зала, не сказав никому."),
 ("A2_SH12","HERO_YOUNG","office_porch","a medium shot of the young man on the concrete office porch, turning the brass lighter over in his fingers, jaw tight","MS","low","static","day",False,False,
  "на крыльце ты крутишь отцовскую зажигалку и говоришь себе, что вернёшься только за трудовой."),
 ("A2_SH13","IGOR_BASE","office_porch","a medium close-up of the shaven-headed team leader stepping out with two paper cups, unhurried and friendly","MCU","eye","static","day",False,False,
  "следом выходит Игорь с двумя стаканами чая и не уговаривает, а просто ждёт рядом."),
 ("A2_SH14",None,"callcenter","a close-up view through glass doors of a whiteboard leaderboard, names and sums in thick marker, one line circled","CU","pov","push_in","day",True,True,
  "через стекло он показывает доску бонусов, где лучший оператор месяца заработал шестьдесят одну тысячу."),
 ("A2_SH15","IGOR_BASE","office_porch","a medium shot of the team leader shrugging with open palms, gold-tone watch catching the light","MS","eye","static","day",False,False,
  "он говорит: не мы им продавали кредиты, мы только напоминаем, и кто-то всё равно напомнит."),
 ("A2_SH16","HERO_YOUNG","office_porch","a close-up of the young man's face over a paper cup, the argument settling in his eyes","CU","eye","push_in","day",False,False,
  "шесть тысяч за комнату, ноль на карте, и ты допиваешь чай и возвращаешься к гарнитуре."),
 ("A2_SH17","HERO_YOUNG","callcenter","a medium close-up of the young man back at the cubicle, headset on, reading the laminated card flat and steady","MCU","eye","static","day",False,False,
  "до конца смены ты читаешь по карточке ровным голосом и стараешься не слушать, что отвечают."),
 ("A2_SH18",None,"callcenter","a wide view of the call floor at evening, half the desks dark, fluorescent tubes buzzing over the rest","WS","eye","tilt_down","evening",True,False,
  "так проходит март, апрель и май: восемь часов в гарнитуре, сто двадцать номеров за смену."),
 ("A2_SH19","HERO_YOUNG","rented_room","a close-up of young hands fanning out a first pay in banknotes over a student desk, counting","CU","top","static","evening",False,False,
  "в конце месяца тебе выдают оклад и премию: двадцать пять тысяч плюс шесть тысяч двести."),
 ("A2_SH20","HERO_YOUNG","rented_room","a medium close-up of the young man on the phone by the window, softened voice, lighter still in his free hand","MCU","eye","static","evening",False,True,
  "пять тысяч ты отправляешь матери и впервые говоришь ей неправду: что подрабатываешь в банке."),
 ("A2_SH21","MOM_LATE","mom_flat","a medium shot of the mother in her yellow-lit kitchen holding the phone with both hands, glasses on their cord, proud","MS","eye","static","evening",False,False,
  "мать переспрашивает про банк дважды и рассказывает соседке в тот же вечер, что сын пробился."),
 ("A2_SH22","OBJ:lighter",None,"an extreme close-up macro insert of the brass lighter spinning between a young man's fingers over a desk edge","ECU","eye","static","day",True,False,
  "зажигалка становится твоим ритуалом: пока она крутится в пальцах, голос в гарнитуре не дрожит."),
 ("A2_SH23","HERO_YOUNG","callcenter","a close-up of the young man mid-call, face smooth and unreadable, eyes fixed on the middle distance","CU","eye","push_in","day",False,False,
  "к осени ты замечаешь, что чужие слёзы в трубке больше не заставляют тебя вздрагивать."),
 ("A2_SH24",None,"callcenter","a wide view of the call floor in morning light, every chair filled, the leaderboard freshly wiped for a new month","WS","high","push_in","day",True,False,
  "кризис гонит в зал новых должников быстрее, чем вы успеваете их обзванивать, и работа только растёт."),
]

TALENT=[
 ("A3_SH01",None,"callcenter","a wide establishing view of the call center floor two years on, tidier desks, flat monitors replacing the bulky ones","WS","eye","push_in","day",True,False,
  "две тысячи десятый, тебе двадцать два, и в этом зале ты уже не новичок, а ставка."),
 ("A3_SH02","HERO_YOUNG","callcenter","a medium close-up of the young man listening into his headset with his eyes closed, completely still","MCU","eye","push_in","day",False,False,
  "ты научился слушать паузы: по дыханию в трубке слышно, где у человека живёт его страх."),
 ("A3_SH03","HERO_YOUNG","callcenter","a close-up of the young man's mouth near the microphone boom, speaking low and even","CU","eye","static","day",False,False,
  "ты был ребёнком за дверью, поэтому знаешь точно: должник боится не суда, а соседей и детей."),
 ("A3_SH04",None,"callcenter","a medium view of a monitor with a call-outcome table, a tall column of green checkmarks down one side","MS","pov","static","day",True,False,
  "у среднего оператора двенадцать обещаний оплаты за смену, у тебя стабильно выходит тридцать одно."),
 ("A3_SH05",None,"callcenter","a close-up view of the whiteboard leaderboard with the top line underlined twice in thick marker","CU","eye","push_in","day",True,True,
  "с февраля твоя фамилия стоит на доске бонусов первой строкой и не опускается ниже полгода."),
 ("A3_SH06","IGOR_BASE","callcenter","a medium shot of the team leader presenting the young man to a huddle of new hires, a proud showman's gesture","MS","eye","static","day",False,False,
  "Игорь приводит к тебе новичков, как на экскурсию, и велит записывать твои паузы в тетрадку."),
 ("A3_SH07","HERO_YOUNG","callcenter","a medium close-up of the young man mid-call taking a slow breath before answering someone shouting, headset tight","MCU","eye","static","day",False,False,
  "в марте трудный должник орёт в трубку минуту без остановки, и ты просто ждёшь тишины."),
 ("A3_SH08","HERO_YOUNG","callcenter","a close-up of the young man's calm face as he finally speaks, flat and unhurried","CU","eye","push_in","day",False,True,
  "потом говоришь ровным голосом, сам того не замечая: ничего личного — это просто долг."),
 ("A3_SH09","OBJ:lighter",None,"an extreme close-up macro insert of the brass lighter stopped flat in an open palm above a desk","ECU","top","static","day",True,False,
  "зажигалка лежит в ладони, и до тебя доходит, чьими словами ты только что говорил."),
 ("A3_SH10","HERO_YOUNG","callcenter","a medium shot of the young man leaning back from the monitor, looking at the headset in his hands","MS","high","static","day",False,False,
  "ты сидишь секунд десять молча, потом надеваешь гарнитуру и набираешь следующий номер по списку."),
 ("A3_SH11",None,"office_porch","a wide view of the office porch in spring rain, the ashtray bin overflowing, glass doors lit from inside","WS","eye","static","day",True,False,
  "об этом вечере ты никому не рассказываешь, ни Игорю, ни матери, ни самому себе."),
 ("A3_SH12","HERO_YOUNG","rented_room","a medium shot of the young man in a fitting new dark suit before a wall mirror covered by a hung sheet, adjusting the collar blind","MS","eye","static","evening",False,False,
  "с премии в сорок процентов ты покупаешь первый костюм и учишься завязывать галстук по видео."),
 ("A3_SH13","HERO_YOUNG","mom_flat","a wide shot of the young man in the yellow kitchen setting a large boxed washing machine by the wall","WS","eye","static","day",False,False,
  "летом ты привозишь матери стиральную машину за двадцать одну тысячу девятьсот девяносто и отмахиваешься от вопросов."),
 ("A3_SH14","MOM_LATE","mom_flat","a medium shot of the mother circling the boxed machine, touching the cardboard, glasses raised to read the label","MS","eye","static","day",False,False,
  "мать гладит коробку, как живность, и опять переспрашивает, не тяжело ли тебе там, в банке."),
 ("A3_SH15","HERO_YOUNG","mom_flat","a close-up of the young man's face over his mother's shoulder, smiling with his mouth only","CU","over","static","day",False,False,
  "ты отвечаешь, что в банке спокойно, бумаги и цифры, и переводишь разговор на её давление."),
 ("A3_SH16",None,"callcenter","a medium view of a cubicle desk with a headset, an energy-drink can and a printout of a monthly plan","MS","top","static","night",True,False,
  "по вечерам зал пустеет, а ты добираешь план: пожилые должники берут трубку даже ночью."),
 ("A3_SH17","HERO_YOUNG","callcenter","a close-up of the young man's eyes over the monitor glow in the darkened office, flat blue light","CU","eye","push_in","night",False,False,
  "ты выучил, что старики платят из стыда, и набираешь их первыми, пока стыд не выветрился."),
 ("A3_SH18",None,"callcenter","a wide view of the empty night call floor, one cubicle lamp on, rows of dark monitors","WS","eye","pan_left","night",True,False,
  "в декабре две тысячи двенадцатого тебя вызывают из зала наверх, и это не выговор."),
 ("A3_SH19","IGOR_BASE","callcenter","a medium close-up of the team leader offering a handshake across a cubicle divider, gold watch flashing","MCU","eye","static","day",False,False,
  "Игорь жмёт руку и говорит, что таких, как ты, забирают в выездную группу, на процент."),
 ("A3_SH20","HERO_YOUNG","callcenter","a medium shot of the young man standing at the cubicle he is leaving, lifting the brass lighter off the desk","MS","eye","static","day",False,False,
  "ты собираешь стол за минуту: карточка скрипта тебе больше не нужна, зажигалку забираешь с собой."),
 ("A3_SH21",None,"callcenter","a close-up view of a laminated script card left behind on an empty desk, corner dog-eared, light dusty","CU","top","pull_out","day",True,False,
  "четыре года ты читал чужие слова по ламинированной карточке, дальше ты будешь писать свои."),
]

if __name__=="__main__":
    add_locs()
    seed_act("callcenter",P_CALL,CALLCENTER)
    seed_act("talent",P_TALENT,TALENT)
