# -*- coding: utf-8 -*-
"""divorce acts A0 cold_open + A1 origin. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_divorce_A0A1.py"""
from _divorce_engine import seed_act

P_COLD="cold quiet domestic palette, muted blue-grey morning tones, soft flat overcast light, long still shadows"
P_WARM="warm hopeful palette, amber and ivory tones, soft bright daylight, gentle warm shadows"

# (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
COLD=[
 ("A0_SH01","MUZH_MAIN","kitchen_mugs","a weary man of thirty-eight sitting alone at a small kitchen table, two ceramic mugs in front of him, one of them overturned","WS","eye","push_in","morning",False,False,
  "тебе тридцать восемь, ты сидишь на кухне один, и на столе перед тобой стоят две чашки, как стояли двенадцать лет."),
 ("A0_SH02","MUZH_MAIN","kitchen_mugs","an extreme close-up of the man slowly twisting a plain gold wedding band off his left ring finger","ECU","eye","static","morning",False,True,
  "ты медленно стягиваешь с левой руки обручальное кольцо, и палец под ним кажется чужим и голым."),
 ("A0_SH03",None,"kitchen_mugs","a top-down macro insert of two ceramic mugs on a kitchen table, one upright and one overturned upside down beside it","INSERT","top","static","morning",True,False,
  "на столе две чашки, одна перевёрнута вверх дном, и вторую сегодня уже некому наливать."),
 ("A0_SH04","MUZH_MAIN","kitchen_mugs","a medium close-up of the thirty-eight-year-old man looking down at his bare ring finger, a hollow tired face","MCU","eye","static","morning",False,False,
  "ты смотришь на бледную полоску там, где двенадцать лет было кольцо, и не помнишь, когда вы перестали разговаривать."),
 ("A0_SH05","MUZH_MAIN","kitchen_mugs","an extreme close-up of the man's left hand, a pale untanned band of skin around the bare ring finger","ECU","eye","push_in","morning",False,False,
  "кожа на пальце светлее вокруг, ровная белая полоса, единственный след того, что вы были женаты."),
 ("A0_SH06","MUZH_MAIN","kitchen_mugs","a medium shot of the man sitting still and alone in the quiet kitchen, the empty second chair across from him","MS","eye","static","morning",False,False,
  "не было ни скандала, ни измены, просто однажды между вами стало тихо, и эта тишина осталась насовсем."),
 ("A0_SH07",None,"living_shared","a wide empty view of the lived-in family living room seen through a doorway, a worn sofa and a child's toys in one corner","EWS","eye","static","morning",True,False,
  "если хочешь понять, как любовь уходит без единого крика, останься со мной до конца и подпишись."),
 ("A0_SH08","MUZH_MAIN","kitchen_mugs","a close-up of the man setting the gold ring down on the table beside the overturned mug, his face empty","CU","eye","push_in","morning",False,True,
  "ты кладёшь кольцо на стол рядом с перевёрнутой чашкой, и в этом теперь умещается вся твоя семейная жизнь."),
]

ORIGIN=[
 ("A1_SH01","MUZH_YOUNG","zags","a nervous joyful young groom of twenty-six in a pressed simple suit standing in a civil registry wedding hall","WS","low","push_in","day",False,False,
  "двенадцать лет назад тебе двадцать шесть, и ты стоишь в зале загса в наглаженном костюме, и руки у тебя дрожат."),
 ("A1_SH02","ZHENA_YOUNG","zags","a radiant young bride of twenty-four with jet-black hair pinned up, a white dress, looking ahead with shining eyes","MCU","eye","static","day",False,False,
  "напротив стоит она, двадцать четыре года, чёрные волосы заколоты наверх, и она смотрит на тебя так, будто ты вся её жизнь."),
 ("A1_SH03","MUZH_YOUNG","zags","an extreme close-up of a woman's hands sliding a plain gold wedding band onto a young man's left ring finger","ECU","eye","push_in","day",False,True,
  "она надевает тебе на палец простое золотое кольцо, и металл ещё холодный и непривычно тяжёлый."),
 ("A1_SH04",None,"zags","a top-down macro insert of two gold wedding rings and a marriage certificate lying on the ceremonial desk","INSERT","top","static","day",True,False,
  "на столе лежат два кольца и свидетельство о браке, и чернила на нём ещё не высохли."),
 ("A1_SH05","MUZH_YOUNG","zags","a medium shot of the young groom turning with a wide hopeful smile, speaking his vow in the registry hall","MS","eye","static","day",False,False,
  "ты поворачиваешься к ней и обещаешь вслух быть рядом и в горе, и в радости, и сам себе веришь полностью."),
 ("A1_SH06","ZHENA_YOUNG","zags","a close-up of the young bride laughing through happy tears, her pearl earrings catching the light","CU","eye","static","day",False,False,
  "она смеётся сквозь слёзы, и в этот момент ты не можешь представить ни одной причины, по которой это закончится."),
 ("A1_SH07",None,"zags","a wide establishing view of the modest empty civil registry wedding hall, net curtains and faded artificial flowers","EWS","eye","static","day",True,False,
  "пустой зал загса пахнет пыльными шторами и дешёвыми цветами, и кажется самым важным местом на земле."),
 ("A1_SH08","MUZH_YOUNG","zags","a medium close-up of the young groom of twenty-six, certain and happy, the new ring on his hand","MCU","low","push_in","day",False,False,
  "тебе двадцать шесть, у тебя есть она и кольцо на пальце, и ты твёрдо знаешь, что теперь всё будет хорошо."),
 ("A1_SH09","MUZH_YOUNG","zags","an extreme close-up of the young man admiring the new gold wedding band on his left ring finger","ECU","eye","static","day",False,True,
  "ты разглядываешь новое кольцо на руке и не сомневаешься, что снимешь его только вместе с жизнью."),
]

if __name__=="__main__":
    seed_act("cold_open", P_COLD, COLD, render_mode="animated")
    seed_act("origin",    P_WARM, ORIGIN, render_mode="animated")
