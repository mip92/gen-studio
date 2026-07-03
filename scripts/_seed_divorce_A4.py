# -*- coding: utf-8 -*-
"""divorce act A4 turn (точка невозврата: отмахнулся, она решает развестись). PYTHONIOENCODING=utf-8 python scripts/_seed_divorce_A4.py"""
from _divorce_engine import seed_act
PAL="dim regretful domestic palette, muted teal-grey and faded amber, low lamp light, heavy still shadows"
S=[
 ("A4_SH01",None,"kitchen_mugs","a macro insert of a small sticky note with a phone number stuck to a fridge door, a family therapist's number","INSERT","eye","static","day",True,False,
  "несколько месяцев назад она оставляет на холодильнике записку с номером семейного психолога."),
 ("A4_SH02","ZHENA_BASE","kitchen_mugs","a medium close-up of the woman speaking carefully in the kitchen, a cautious hopeful face","MCU","eye","static","day",False,False,
  "она осторожно предлагает сходить вместе хотя бы один раз, просто попробовать поговорить при ком-то третьем."),
 ("A4_SH03","MUZH_MAIN","kitchen_mugs","a close-up of the man deflecting, glancing at his phone instead of at her","CU","eye","static","day",False,False,
  "ты говоришь, что сейчас совсем не до этого, что на работе завал, и обещаешь себе вернуться к этому потом."),
 ("A4_SH04",None,"living_shared","a macro insert of two weekend travel tickets lying on a table, booked to get away together","INSERT","top","static","day",True,False,
  "на столе лежат два билета на выходные, которые она взяла, чтобы вы куда-нибудь выбрались вдвоём."),
 ("A4_SH05","MUZH_MAIN","living_shared","a medium shot of the man pacing on a long work phone call, the tickets ignored behind him","MS","eye","static","day",False,False,
  "в день поездки ты берёшь рабочий звонок на полтора часа, и вы никуда уже не успеваете."),
 ("A4_SH06","ZHENA_BASE","living_shared","a close-up of the woman quietly tucking the unused tickets away, alone and resigned","CU","eye","static","dusk",False,False,
  "она тихо сдаёт билеты обратно и едет гулять одна, и больше ничего такого не предлагает."),
 ("A4_SH07",None,"bedroom_night","a wide view of the bed at night, the cold empty strip down the middle in low blue light","WS","eye","static","night",True,False,
  "в одну из ночей ты лежишь, глядя на холодную полосу между вами, и тебе вдруг хочется её перейти."),
 ("A4_SH08","MUZH_MAIN","bedroom_night","a medium close-up of the man half-rising on one elbow, beginning to reach across the bed","MCU","eye","static","night",False,False,
  "ты приподнимаешься и почти тянешься через кровать, чтобы просто положить ей руку на плечо."),
 ("A4_SH09","MUZH_MAIN","bedroom_night","an extreme close-up of the man's hand frozen halfway across the sheet, the gold ring catching streetlight","ECU","eye","static","night",False,True,
  "рука застывает на полпути, кольцо ловит свет фонаря, и ты опускаешь её обратно на одеяло."),
 ("A4_SH10","MUZH_MAIN","bedroom_night","a close-up of the man turning away to face the wall, eyes open","CU","eye","static","night",False,False,
  "ты отворачиваешься и говоришь себе, что поговоришь с ней завтра, как говорил уже сотни раз."),
 ("A4_SH11","ZHENA_BASE","kitchen_mugs","a medium shot of the woman seating the man at the kitchen table, calm and composed","MS","eye","static","day",False,False,
  "через пару недель она сажает тебя за кухонный стол и очень спокойно просит уделить ей пять минут."),
 ("A4_SH12","ZHENA_BASE","kitchen_mugs","a close-up of the woman's calm steady face as she says the words, no anger, no tears","CU","eye","push_in","day",False,True,
  "она говорит, что хочет развода, без крика и без слёз, так, будто давно всё для себя решила."),
 ("A4_SH13","MUZH_MAIN","kitchen_mugs","a medium close-up of the man as the words land slowly, understanding dawning on his face","MCU","eye","static","day",False,False,
  "слова доходят до тебя медленно, и только теперь ты понимаешь, что дверь закрылась ещё той ночью."),
 ("A4_SH14",None,"kitchen_mugs","a macro insert of the faded therapist sticky note still on the fridge, the number never called","INSERT","eye","static","day",True,False,
  "на холодильнике всё ещё висит выцветшая записка с номером, по которому ты так и не позвонил."),
 ("A4_SH15","MUZH_MAIN","kitchen_mugs","a close-up of the man opening his mouth to argue and finding nothing real to say","CU","eye","static","day",False,False,
  "ты открываешь рот, чтобы спорить, и не находишь ни одной настоящей причины, чтобы её остановить."),
 ("A4_SH16",None,"living_shared","an extreme wide dusk view of the still apartment, the decision settled into the quiet rooms","EWS","eye","static","dusk",True,True,
  "квартира замирает, решение принято, и в этой тишине впервые за годы вы оба наконец согласны."),
]
if __name__=="__main__": seed_act("turn", PAL, S, render_mode="animated")
