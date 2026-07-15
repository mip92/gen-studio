# -*- coding: utf-8 -*-
"""collector A10 aftermath + A11 coda (2026). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_collector_A10A11.py"""
from _collector_engine import seed_act

P_AFTERMATH="settling palette, washed morning grey and paper white, the office blue draining out of the world"
P_CODA="quiet epilogue palette, warm kitchen amber behind a cool stairwell grey, brass and steel accents"

AFTERMATH=[
 ("A10_SH01","HERO_OLD","boss_office","a medium shot of the department head at his desk at nine sharp, banking app open, entering a payment with steady hands","MS","eye","static","day",False,False,
  "в девять ноль три ты гасишь мамин долг со своего счёта: сто двенадцать тысяч триста четырнадцать."),
 ("A10_SH02",None,None,"an extreme close-up insert of a payment confirmation screen, a green check mark over a long sum","ECU","pov","static","day",True,False,
  "платёж проходит за восемь секунд, и строка в базе перекрашивается из красного в серый."),
 ("A10_SH03",None,"openspace","a wide view of the morning floor filling up, operators hanging coats, monitors waking one by one","WS","eye","pan_right","day",True,False,
  "по внутренним правилам сотрудникам нельзя касаться дел родственников, но тебе уже всё равно."),
 ("A10_SH04","KRIS_BASE","boss_office","a medium close-up of the young operator leaning in at the office door with a tablet, a light work question on her face","MCU","eye","static","day",False,False,
  "Кристина заглядывает спросить про закрытое дело, и ты отвечаешь: оператор сработал по регламенту."),
 ("A10_SH05","HERO_OLD","boss_office","a close-up of the man alone after the door shuts, eyes on a laminated script card on his desk","CU","eye","push_in","day",False,False,
  "она уходит довольная, а ты смотришь на свой скрипт и не можешь найти в нём ошибку."),
 ("A10_SH06","HERO_OLD","car","a medium shot of the man driving out of the city in daylight, coat on the passenger seat, face set","MS","eye","static","day",False,False,
  "после обеда ты едешь двести километров до дома с одной заготовленной фразой."),
 ("A10_SH07",None,"mom_stairwell","a wide view of the dim stairwell landing, mailboxes with peeling numbers, a new intercom panel by the entrance door","WS","eye","static","day",True,False,
  "подъезд у матери всё тот же: побелка, запах супа, гнутые почтовые ящики, только домофон новый."),
 ("A10_SH08",None,None,"an extreme close-up insert of a man's finger pressing a worn doorbell button beside a padded door","ECU","eye","static","day",True,False,
  "ты звонишь в дверь, и за ней долго тихо, хотя ты слышишь радио на кухне."),
 ("A10_SH09","MOM_OLD","mom_stairwell","a medium shot of the padded door opened to the width of a taut steel chain, the small grey-haired woman behind the gap","MS","eye","static","day",False,True,
  "дверь открывается на ширину цепочки, и мать смотрит на тебя через щель, не снимая её."),
 ("A10_SH10","MOM_OLD","mom_stairwell","a close-up of the mother's eyes in the door gap, reading her son's face without a word","CU","eye","push_in","day",False,False,
  "она уже получила смс, что долг закрыт, и уже поняла, откуда ты всё знаешь."),
 ("A10_SH11","HERO_OLD","mom_stairwell","a medium shot of the tall man on the landing speaking plainly at the chained door, hands open at his sides","MS","eye","static","day",False,True,
  "ты говоришь всё сам, стоя на лестничной клетке: где работаешь, кем, и с какого года."),
 ("A10_SH12","HERO_OLD","mom_stairwell","a close-up of the man's face saying one hard word evenly, holding his mother's gaze","CU","eye","static","day",False,False,
  "слово коллектор ты произносишь вслух матери в первый раз за восемнадцать лет."),
 ("A10_SH13","MOM_OLD","mom_stairwell","a medium close-up of the mother listening in the door gap, her look old and level and familiar","MCU","eye","push_in","day",False,True,
  "мать слушает молча, и смотрит на тебя так, как отец смотрел на тех, в кожанках."),
 ("A10_SH14",None,None,"an extreme close-up insert of a taut steel door chain easing as the door closes softly into its frame","ECU","eye","static","day",True,False,
  "потом говорит: спасибо, что заплатил, — и дверь закрывается мягко, без хлопка."),
 ("A10_SH15",None,"mom_stairwell","a wide view of the landing with the man standing alone before the closed padded door, stair light thin","WS","high","static","day",True,False,
  "ты стоишь перед её дверью минут десять, и радио на кухне так и играет."),
 ("A10_SH16","HERO_OLD","boss_office","a medium shot of the man at his desk with the drawer open, lifting a yellowed folded letter from under a stapler","MS","eye","static","day",False,True,
  "в понедельник ты достаёшь из-под степлера заявление семилетней давности и ставишь свежую дату."),
 ("A10_SH17",None,None,"an extreme close-up insert of a handwritten one-line letter, a pen adding a new date beside a faded one","ECU","top","static","day",True,False,
  "одна строка, написанная ещё до пандемии, наконец дожидается своей подписи и сегодняшней даты."),
 ("A10_SH18","HERO_OLD","openspace","a medium shot of the man walking the length of the call floor with a small cardboard box, unnoticed","MS","eye","track","day",False,False,
  "ты проходишь через зал с картонной коробкой, и сорок гарнитур продолжают говорить, не заметив."),
 ("A10_SH19",None,"openspace","a wide view of the floor working on under the green dashboard, the glass office behind it dark and empty","WS","low","static","day",True,False,
  "система, которую ты построил, работает без тебя, в этом и был весь её смысл."),
 ("A10_SH20",None,None,"an extreme close-up insert of a plain classified advertisement circled in pen: door installation crew hiring","ECU","top","static","day",True,False,
  "через месяц тишины ты отвечаешь на объявление: фирме «Двери и замки» нужен установщик."),
 ("A10_SH21","HERO_OLD","workshop_van","a medium shot of the man in a plain work jacket at the open rear of a tool van, checking a boxed lock set","MS","eye","static","day",False,False,
  "тебя берут без вопросов: руки на месте, своя машина, и голос, которому верят."),
 ("A10_SH22",None,"yard_blocks","a wide view of a small workman's van rolling slowly into a panel-block courtyard, morning light","WS","eye","track","day",True,False,
  "теперь ты ездишь по тем же спальным районам, только теперь тебя ждут и открывают сами."),
]

CODA=[
 ("A11_SH01",None,"mom_stairwell","a wide view of the stairwell landing with an old door off its hinges and a new steel door in protective film leaning ready","WS","eye","push_in","day",True,False,
  "в субботу ты приезжаешь к матери не гостем, а мастером, с новой стальной дверью в плёнке."),
 ("A11_SH02","HERO_OLD","mom_stairwell","a medium shot of the man in a work jacket setting the door frame with a drill, focused and unhurried","MS","eye","static","day",False,False,
  "вы почти не разговариваете, ты работаешь, а она смотрит из кухни, не подходя близко."),
 ("A11_SH03",None,None,"an extreme close-up insert of a lock cylinder being seated into fresh-drilled steel, bright metal shavings curling","ECU","eye","static","day",True,False,
  "ты ставишь ей два замка, стальную цепочку и широкий глазок, всё лучшее из каталога."),
 ("A11_SH04","MOM_OLD","mom_flat","a medium close-up of the mother setting a cup of tea on a stool by the doorway, an old enamel mug","MCU","eye","static","day",False,False,
  "в перерыве она выносит чай в отцовской кружке и ставит рядом, не говоря ни слова."),
 ("A11_SH05","OBJ:lighter",None,"an extreme close-up macro insert of the worn brass lighter lying in an open tool box among clean steel bits","ECU","top","static","day",True,False,
  "зажигалка лежит в ящике с инструментом: прикуривать некому, а выбросить ты не смог."),
 ("A11_SH06","HERO_OLD","mom_stairwell","a medium shot of the man swinging the finished steel door slowly on its hinges, testing the soft new action","MS","eye","static","evening",False,False,
  "к вечеру дверь готова, ход мягкий, цепочка держит, глазок берёт всю лестничную клетку."),
 ("A11_SH07","MOM_OLD","mom_stairwell","a close-up of the mother at the new door, one hand resting on the fresh steel lock plate","CU","eye","push_in","evening",False,False,
  "мать провожает тебя до самого порога и говорит негромко: приезжай теперь, хоть иногда."),
 ("A11_SH08",None,"mom_stairwell","a wide view down the stairwell as a man in a work jacket descends a flight, the new door above him","WS","high","static","evening",True,False,
  "ты спускаешься на пролёт и слышишь, как за спиной поворачиваются оба замка и ложится цепочка."),
 ("A11_SH09","OBJ:peephole",None,"an extreme close-up macro insert of a round brass peephole in a new steel door, its lens going briefly dark","ECU","eye","push_in","evening",True,True,
  "в новом широком глазке на секунду темнеет: она смотрит тебе вслед, прежде чем уйти в кухню."),
 ("A11_SH10","HERO_OLD","mom_stairwell","a medium close-up of the man half-turned on the stairs, looking back up at the closed steel door","MCU","low","static","evening",False,True,
  "ты знаешь этот взгляд из тысячи подъездов: так смотрят на тех, кто когда-то стучал."),
 ("A11_SH11","HERO_OLD","mom_stairwell","a close-up of the weary man looking directly at the viewer in the dim stair light, honest and spent","CU","eye","push_in","evening",False,False,
  "подпишись, если досмотрел до конца: таких историй, рассказанных от первого стука, у меня ещё много."),
 ("A11_SH12",None,"mom_stairwell","a wide view of the quiet landing, the new steel door with its brass peephole, warm kitchen light in the gap below it","WS","eye","pull_out","night",True,False,
  "эта история вымышлена, и все совпадения с реальными людьми и событиями случайны, береги своих."),
]

if __name__=="__main__":
    seed_act("aftermath",P_AFTERMATH,AFTERMATH)
    seed_act("coda",P_CODA,CODA)
