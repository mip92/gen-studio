# -*- coding: utf-8 -*-
"""shuttle A0 cold_open + A1 nii + A2 first_run + A3 market. PYTHONIOENCODING=utf-8 python scripts/_seed_shuttle_A0A3.py"""
from _shuttle_engine import seed_act

P_COLD="found-keepsake palette, warm modern spot light over plaid red-white-blue, tender and bright"
P_NII="stalled institute palette, dusty drafting grey and winter window blue, one warm desk lamp of habit"
P_RUN="first-run palette, night highway blues breaking into Laleli lamp gold, nervous and alive"
P_MARKET="market winter palette, steel stall grey and breath steam warmed by jacket leather browns"

COLD=[
 ("A0_SH01",None,"new_flat","a wide establishing view of a bright modern hallway, a stepladder under open mezzanine doors, moving boxes along the wall","WS","eye","push_in","day",True,False,
  "две тысячи двадцать шестой: твоя дочь разбирает антресоли в новой квартире и находит сумку."),
 ("A0_SH02","LENA_ADULT","new_flat","a medium close-up of a poised dark-haired woman of forty on a stepladder, lifting down a plaid bag like an artefact","MCU","low","static","day",False,False,
  "Лене сорок, у неё своя фирма и ипотека, и она держит клетчатую сумку, как находку из раскопок."),
 ("A0_SH03","OBJ:bag",None,"an extreme close-up macro insert of the plaid shuttle bag with four careful patches and a Turkish tag on the handle","ECU","eye","push_in","day",True,True,
  "красно-сине-белая клетка, четыре заплатки, турецкая бирка на ручке — ты узнала бы её на ощупь."),
 ("A0_SH04","LENA_ADULT","new_flat","a medium shot of the woman sitting down on the hallway floor with the bag and her phone","MS","eye","static","day",False,False,
  "она садится прямо на пол в прихожей и набирает твой номер: мам, расскажи про сумку."),
 ("A0_SH05","VERA_OLD","flat_home","a close-up of a silver-haired woman of sixty-six settling with tea and a phone, amber clip catching the lamp","CU","eye","push_in","evening",False,False,
  "тебе шестьдесят шесть, ты завариваешь чай, поудобнее садишься и говоришь: ну слушай, дочь."),
 ("A0_SH06",None,"new_flat","a wide view of the hallway at evening, boxes and the open mezzanine, the bag resting in a spot of light","WS","eye","static","evening",True,False,
  "этот рассказ займёт весь вечер, и он стоит каждого часа, потому что в нём вся жизнь."),
 ("A0_SH07","VERA_OLD","flat_home","a medium close-up of the silver-haired woman turning toward the viewer over her cup","MCU","eye","push_in","evening",False,False,
  "останься с нами до конца, если у тебя тоже была мама, которая уезжала за деньгами."),
 ("A0_SH08","VERA_OLD","flat_home","a close-up of the woman's calm certain eyes, lamp warm on a lined face","CU","eye","push_in","evening",False,False,
  "подпишись, а я начну с девяносто четвёртого, с пустой кассы и полной решимости."),
 ("A0_SH09",None,"city_90s","a wide view of the nineties street mid-change, new signs going up over old facades, kiosks multiplying","WS","eye","pan_right","day",True,False,
  "девяносто четвёртый год: город меняет вывески быстрее, чем успевает платить людям зарплаты."),
]

NII=[
 ("A1_SH01",None,"nii_hall","a wide establishing view of the institute office, drafting tables under dusty tubes, a dead wall clock","WS","eye","push_in","day",True,False,
  "твой НИИ стоит, как стоял, только зарплату в нём не видели уже шесть месяцев."),
 ("A1_SH02","VERA_YOUNG","nii_hall","a medium shot of an ash-blond woman of thirty-four at a drafting table, precise and unneeded","MS","eye","static","day",False,False,
  "тебе тридцать четыре, ты инженер-технолог первой категории, и твоя категория никому не нужна."),
 ("A1_SH03",None,None,"an extreme close-up insert of a payslip with accrued-but-unpaid columns and an apologetic signature","ECU","top","static","day",True,False,
  "в расчётном листке стоят начисления, которых нет, и подпись бухгалтера, которой стыдно."),
 ("A1_SH04","GRAN_SH","flat_home","a medium shot of a round-spectacled grandmother checking a child's homework at the kitchen table","MS","eye","static","evening",False,False,
  "дома мать проверяет у Лены уроки, и на ужин третий день гречка без масла."),
 ("A1_SH05","LENA_KID","flat_home","a close-up of a pigtailed girl of eight drawing a card with coloured pencils, scarlet scarf on the chair","CU","high","static","evening",False,False,
  "Лене восемь, она рисует тебе открытки на каждую зарплату, которую не приносят."),
 ("A1_SH06",None,"city_90s","a wide view of the sprawling clothes market growing along the street below institute windows","WS","high","static","day",True,False,
  "мимо окон института тем временем растёт вещевой рынок, шумный, наглый и очень живой."),
 ("A1_SH07","VERA_YOUNG","nii_hall","a medium close-up of the woman at the taped window, looking down at the market with fear and arithmetic","MCU","eye","push_in","day",False,False,
  "ты смотришь на него из отдела, как смотрят с берега на воду: страшно и надо."),
 ("A1_SH08",None,None,"an extreme close-up insert of a handwritten notice on a lamppost offering bus runs to Istanbul","ECU","eye","static","day",True,False,
  "на столбе у проходной висит объявление: автобус в Стамбул, за товаром, места есть."),
 ("A1_SH09","VERA_YOUNG","flat_home","a medium shot of the woman speaking a decision across the kitchen table, hands folded","MS","eye","static","evening",False,True,
  "вечером ты говоришь матери: я поеду, — и она молчит ровно одну минуту."),
 ("A1_SH10","GRAN_SH","flat_home","a close-up of the grandmother cleaning her round glasses slowly, then setting them back","CU","eye","push_in","evening",False,False,
  "потом снимает очки, протирает их и отвечает: Ленку беру на себя, езжай."),
 ("A1_SH11",None,"flat_home","a wide view of the night kitchen with a sewing machine out, checked shirt fabric under the needle, two women bent over it","WS","eye","static","night",True,True,
  "ночью вы шьёте из отцовской рубашки пояс с карманом на пуговице, вдвоём, молча."),
 ("A1_SH12","OBJ:belt",None,"an extreme close-up macro insert of the homemade cloth money belt, a button pocket over the seam","ECU","top","static","night",True,False,
  "в пояс входит ровно восемьсот долларов, занятых у соседки под честное слово."),
]

FIRST_RUN=[
 ("A2_SH01",None,"bus_int","a wide establishing view of the night bus interior, dozing traders and plaid bags in every rack","WS","eye","push_in","night",True,False,
  "автобус до Стамбула идёт тридцать шесть часов, и спать в нём умеют только опытные."),
 ("A2_SH02","VERA_YOUNG","bus_int","a medium shot of the ash-blond woman upright in her seat, bag gripped between her knees","MS","eye","static","night",False,False,
  "ты едешь первый раз, сжав сумку коленями, и учишься у соседок всему подряд."),
 ("A2_SH03",None,None,"an extreme close-up insert of a notebook page of engineer-neat notes: addresses, prices, Turkish words","ECU","top","static","night",True,False,
  "в тетрадке ты конспектируешь, как инженер: адреса, цены, слова по-турецки, схема рядов."),
 ("A2_SH04",None,"istanbul","a wide view of the Laleli wholesale street at full pitch, racks of leather, hand-carts, strings of lamps","WS","eye","pan_right","day",True,False,
  "Лалели оглушает сразу: ряды кожанок, тележки, чай в стаканчиках и торговля на пальцах."),
 ("A2_SH05","VERA_YOUNG","istanbul","a medium close-up of the woman bargaining with gestures and a calculator over a rack of jackets","MCU","eye","static","day",False,False,
  "ты торгуешься жестами и калькулятором, и инженерная привычка считать спасает лучше языка."),
 ("A2_SH06",None,None,"an extreme close-up insert of leather jackets being folded flat into a plaid bag with practiced economy","ECU","top","static","day",True,False,
  "сорок кожаных курток входят в одну клетчатую сумку, если складывать, как учат соседки."),
 ("A2_SH07","VERA_YOUNG","bus_int","a medium shot of the woman wide awake on the return run, a hand resting on the bag in the aisle","MS","eye","static","night",False,False,
  "обратно ты не спишь вовсе: сумка в проходе, деньги в поясе, сердце в горле."),
 ("A2_SH08","OBJ:belt",None,"an extreme close-up macro insert of the cloth belt's button pocket fastened tight over folded notes","ECU","eye","static","night",True,False,
  "пояс из отцовской рубашки ты не снимаешь двое суток, и пуговица держит, как обещала."),
 ("A2_SH09",None,"home_market","a wide view of the Sunday market, a corner spot by a friendly stall stacked with fresh leather","WS","eye","static","day",True,False,
  "в воскресенье ты встаёшь у знакомой на краю рынка, и к обеду продана половина."),
 ("A2_SH10","VERA_YOUNG","home_market","a medium close-up of the woman counting takings twice into a cash apron, lips moving","MCU","eye","static","evening",False,False,
  "к вечеру партия уходит втрое дороже закупки, и ты пересчитываешь выручку дважды, по ритуалу."),
 ("A2_SH11","OBJ:ledger",None,"an extreme close-up macro insert of the oilcloth notebook opened to its first neat line of figures","ECU","top","static","evening",True,False,
  "в клеёнчатой тетради появляется первая строка оборота, и почерк в ней инженерный, ровный."),
 ("A2_SH12","VERA_YOUNG","flat_home","a medium shot of the woman handing a neighbour a box of chocolates over folded banknotes at the door","MS","eye","static","day",False,False,
  "долг соседке ты возвращаешь через девять дней с коробкой конфет и процентами."),
 ("A2_SH13","VERA_YOUNG","flat_home","a close-up of the tired steady face in kitchen lamplight, a resolution setting in it","CU","eye","push_in","night",False,True,
  "себе ты говоришь фразу, которая станет твоим законом: оборот — это всё, съесть можно потом."),
 ("A2_SH14",None,"flat_home","a wide view of the small kitchen at supper, three plates with chicken, a girl mid-question","WS","eye","pull_out","evening",True,False,
  "на ужин в тот вечер курица, и Лена спрашивает, теперь так будет всегда."),
]

MARKET=[
 ("A3_SH01",None,"home_market","a wide establishing view of the morning market rows, steel stalls hung with jackets, breath steaming","WS","eye","push_in","day",True,False,
  "с весны у тебя своё место на рынке, двенадцатое от входа, счастливое."),
 ("A3_SH02","VALYA_BASE","home_market","a medium close-up of a big henna-red market woman in a leopard headband laughing across the stalls","MCU","eye","static","day",False,False,
  "слева торгует Валя: хна, леопардовый ободок и голос, который слышно у автобусной остановки."),
 ("A3_SH03","VALYA_BASE","home_market","a close-up of the market woman leaning in with practical instruction, breath steaming","CU","eye","static","day",False,False,
  "Валя учит главному: с кем дружить, кому улыбаться и где прятать выручку в мороз."),
 ("A3_SH04","VERA_YOUNG","home_market","a medium shot of the ash-blond woman arranging jackets on her stall with drafting-table precision","MS","eye","static","day",False,False,
  "торговый день — это двенадцать часов на ногах, и ты держишь его, как смену у кульмана."),
 ("A3_SH05",None,None,"an extreme close-up insert of fingerless-gloved hands counting notes over a cash apron in the cold","ECU","top","static","day",True,False,
  "деньги на морозе считают в перчатках без пальцев, и ты осваиваешь это за неделю."),
 ("A3_SH06",None,"home_market","a wide view of the rows going quiet as a leather-capped figure strolls the aisle at dusk","WS","eye","static","evening",True,False,
  "по рядам раз в месяц проходит человек в кожаной кепке, и ряды затихают."),
 ("A3_SH07","RACKET_BASE","home_market","a medium close-up of a squat tracksuited man with a toothpick, unhurried and matter-of-fact","MCU","eye","static","evening",False,False,
  "он называет это «за спокойствие», пятьдесят долларов с места, и спорить здесь не принято."),
 ("A3_SH08",None,None,"an extreme close-up insert of a folded note changing hands over a stall counter edge","ECU","eye","static","evening",True,False,
  "ты платишь, как платят все, и записываешь эти пятьдесят в тетрадь, в графу «погода»."),
 ("A3_SH09","VERA_YOUNG","home_market","a medium close-up of the woman's level unafraid eyes following the leather cap down the row","MCU","eye","static","evening",False,False,
  "торговаться с ним нельзя, а вот считать его в себестоимости — можно, и ты считаешь."),
 ("A3_SH10",None,"bus_int","a wide view of the bus interior settled into routine, bags stacked in a practiced pyramid","WS","eye","static","night",True,False,
  "рейсы становятся ритмом: два в месяц, шестьдесят килограммов, тридцать шесть часов туда-обратно."),
 ("A3_SH11",None,None,"an extreme close-up insert of a pocket calendar with departure days circled in pencil","ECU","top","static","day",True,False,
  "в карманном календарике кружками отмечены дни отъездов, и их в году сорок восемь."),
 ("A3_SH12","VERA_YOUNG","bus_int","a medium shot of the woman asleep sitting up, arms around the plaid bag, highway lights sweeping over","MS","eye","static","night",False,False,
  "спать в автобусе ты научилась на четвёртый месяц, сидя, с сумкой в обнимку."),
]

if __name__=="__main__":
    seed_act("cold_open",P_COLD,COLD)
    seed_act("nii",P_NII,NII)
    seed_act("first_run",P_RUN,FIRST_RUN)
    seed_act("market",P_MARKET,MARKET)
