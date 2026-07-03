# -*- coding: utf-8 -*-
"""kept_woman A0 cold_open + A1 origin. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_kept_woman_A0A1.py"""
from _kept_woman_engine import seed_act

P_COLD="cold hollow palette, muted grey-blue and washed beige, thin flat overcast daylight, long still shadows"
P_ORIGIN="cold glamorous night palette, deep blacks with warm gold restaurant light and cool city blue, high contrast"

# (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
COLD=[
 ("A0_SH01","VIKA_OLD","rented_studio","a tired elegant woman of forty-three sitting alone on a narrow bed in a cramped rented studio, a long rail of dozens of expensive designer handbags lining the wall behind her","WS","eye","push_in","day",False,False,
  "тебе сорок три, ты сидишь в съёмной студии одна, а вдоль стены висят десятки дорогих сумок, которые больше некому показать."),
 ("A0_SH02","VIKA_OLD","rented_studio","a medium close-up of the forty-three-year-old woman holding a brand-new luxury handbag on her lap and a small pair of scissors, her face tired and blank","MCU","eye","static","day",False,False,
  "в руках у тебя новая сумка и маленькие ножницы, ты купила её сама себе, потому что больше некому."),
 ("A0_SH03",None,None,"an extreme close-up macro insert of small scissors held to a plastic price tag hanging by a ribbon on a brand-new luxury handbag, the tag and scissors filling the frame in crisp sharp focus, the background thrown far out of focus, shallow depth of field, one soft focused light","ECU","over","push_in","day",True,True,
  "ты подносишь ножницы к пластиковой бирке, и это единственное, что ты умеешь делать по-настоящему хорошо."),
 ("A0_SH04","VIKA_OLD","rented_studio","a close-up of the woman's tired face as a cut price tag falls away, the new handbag settling on her lap","CU","eye","static","day",False,False,
  "бирка падает на пол, сумка ложится тебе на колени, а показать её по-прежнему некому."),
 ("A0_SH05","VIKA_OLD","rented_studio","a medium shot of the elegant woman sitting among the wall of expensive handbags in the cheap little studio","MS","eye","pull_out","day",False,False,
  "двадцать четыре года назад ты приехала в этот город с одной сумкой, а теперь у тебя их двадцать восемь."),
 ("A0_SH06","VIKA_OLD","rented_studio","a wide shot of the small woman dwarfed in the cramped rented room, standing by the single window over a grey courtyard","WS","high","static","day",False,False,
  "за окном чужой двор и серые дома, и ни одного человека, который поднялся бы сюда ради тебя."),
 ("A0_SH07",None,None,"an extreme close-up macro insert of a woman's bare ankle wearing a delicate thin gold chain, the ankle and fine chain filling the frame in sharp focus, the background thrown far out of focus, shallow depth of field, one warm focused light","ECU","eye","push_in","day",True,True,
  "на голой щиколотке у тебя тонкая золотая цепочка, первый подарок, который ты не снимала двадцать четыре года."),
 ("A0_SH08","VIKA_OLD","rented_studio","a medium close-up of the woman looking down at her own ankle, one hand resting near it, a distant expression","MCU","high","static","day",False,False,
  "ты смотришь на неё и не можешь вспомнить лица того, кто её застегнул, только щелчок замка в машине."),
 ("A0_SH09","VIKA_OLD","rented_studio","a close-up of the woman turning her head toward the window as if listening to a sound from below","CU","eye","static","day",False,False,
  "где-то внизу у подъезда щёлкает замок чужой машины, и ты по привычке ждёшь, что это за тобой."),
 ("A0_SH10","VIKA_OLD","rented_studio","a medium shot of the woman standing at the window in a good but last-season dress, looking down at the courtyard","MS","over","static","day",False,False,
  "но машина трогается и уезжает, и ты стоишь у окна в платье прошлого сезона, никому не нужная."),
 ("A0_SH11",None,"rented_studio","a wide view from a high window down onto a grey inner courtyard of apartment blocks at midday, an empty parking bay where a car has just pulled away, bare and still","WS","high","pan_left","day",True,False,
  "двор внизу пустеет, и ты вдруг замечаешь, что так же по одному уходили все, кто у тебя был."),
 ("A0_SH12",None,None,"an extreme close-up macro insert of a small cut-off plastic price tag lying on the floor beside the corner of an expensive handbag, filling the frame in sharp focus, background out of focus, shallow depth of field","ECU","top","static","day",True,False,
  "срезанная бирка лежит на полу рядом с сумкой, и это всё, что осталось от сегодняшнего дня."),
 ("A0_SH13","VIKA_OLD","rented_studio","a medium close-up of the forty-three-year-old woman turning to face the viewer, tired honey-blonde hair with visible roots, a direct quiet gaze","MCU","eye","push_in","day",False,False,
  "если хочешь понять, как красивая девочка в девятнадцать превращается в это, останься со мной до конца."),
 ("A0_SH14","VIKA_OLD","rented_studio","a close-up of the woman's face looking directly at the viewer, calm and worn, a wall of handbags blurred behind her","CU","eye","push_in","day",False,True,
  "подпишись, и я расскажу тебе всё с самого начала, пока у тебя ещё есть время свернуть."),
]

ORIGIN=[
 ("A1_SH01","VIKA_YOUNG","bus_station","a beautiful provincial girl of nineteen in a cheap thin floral dress stepping down from an intercity coach onto a cracked platform, holding a single cheap bag","WS","low","push_in","day",False,False,
  "двадцать четыре года назад тебе девятнадцать, ты выходишь из автобуса в большом городе с одной сумкой и ничем больше."),
 ("A1_SH02",None,"bus_station","a medium view of a rusted bus-station timetable board and chipped plastic seats on a cracked concrete platform, grey and empty under overcast light","MS","eye","pan_right","day",True,False,
  "в посёлке остались мать, серые дома и одна дорога, и ты поклялась себе, что не вернёшься туда."),
 ("A1_SH03","VIKA_YOUNG","bus_station","a medium close-up of the nineteen-year-old girl's hopeful face looking up at the big city beyond the station, honey-blonde hair loose","MCU","low","static","day",False,False,
  "у тебя нет ни денег, ни профессии, ни связей, только лицо и тело, и ты знаешь, что они красивые."),
 ("A1_SH04",None,None,"a wide establishing view of a vast glittering big-city avenue at dusk, tall glass towers and streams of traffic light, cold and overwhelming","WS","low","tilt_up","dusk",True,False,
  "город огромный, холодный и дорогой, и очень быстро тебе становится ясно, что здесь всё продаётся и всё покупается."),
 ("A1_SH05","VIKA_YOUNG","luxury_restaurant","a wide shot of the nineteen-year-old girl in a plain cheap dress standing at the entrance of an opulent candlelit restaurant, out of place among the glow","WS","eye","push_in","night",False,False,
  "подруга приводит тебя в ресторан, где одна тарелка стоит больше, чем мать зарабатывает за целый месяц."),
 ("A1_SH06","VIKA_YOUNG","luxury_restaurant","a medium shot of the girl sitting stiffly at a white-clothed restaurant table, nervous, surrounded by crystal and low golden light","MS","eye","static","night",False,False,
  "ты сидишь в дешёвом платье среди чужого блеска и боишься взять со стола не ту вилку."),
 ("A1_SH07","ARTUR_BASE","luxury_restaurant","a medium close-up of a confident silver-haired man of fifty-two across the table, a heavy gold signet ring on his hand, quietly appraising the girl","MCU","over","static","night",False,False,
  "за столом напротив мужчина лет пятидесяти, седой, с тяжёлым золотым перстнем, и он смотрит на тебя как на витрину."),
 ("A1_SH08","VIKA_YOUNG","luxury_restaurant","a close-up of the nineteen-year-old girl meeting the man's gaze across the table, something calculating waking in her eyes","CU","eye","push_in","night",False,False,
  "ты выдерживаешь его взгляд, и что-то внутри тебя уже считает этого мужчину как возможность."),
 ("A1_SH09",None,None,"an extreme close-up macro insert of a heavy gold signet ring on a man's hand beside a crystal wine glass on a white tablecloth, the ring and glass filling the frame in sharp focus, background out of focus, shallow depth of field","ECU","over","static","night",True,False,
  "его рука с перстнем подвигает к тебе бокал, и ты берёшь его, будто соглашаешься на что-то большее."),
 ("A1_SH10","ARTUR_BASE","luxury_restaurant","a medium shot of the silver-haired man leaning in and speaking to the girl across the candlelit table, self-assured and calm","MS","over","static","night",False,False,
  "он говорит, что такой красоте не место в бедности, и что он легко может это исправить."),
 ("A1_SH11",None,"luxury_restaurant","a wide interior view of an opulent restaurant at night, white-clothed tables, a long marble bar and tall dark windows reflecting candle flames","WS","eye","pan_left","night",True,False,
  "ты не спрашиваешь, женат ли он, потому что уже решила, что ответ тебе совсем не важен."),
 ("A1_SH12","ARTUR_BASE","luxury_restaurant","a medium close-up of the silver-haired man taking a small jewellery box from his jacket at the restaurant table, a young woman's hands visible across from him","MCU","eye","static","night",False,False,
  "после ужина он достаёт из кармана маленькую бархатную коробочку и просит тебя вытянуть ногу."),
 ("A1_SH13",None,None,"an extreme close-up macro insert of a man's hands fastening a delicate thin gold chain around a young woman's bare ankle, the ankle and chain filling the frame in sharp focus, background thrown out of focus, shallow depth of field","ECU","eye","push_in","night",True,True,
  "он застёгивает на твоей щиколотке тонкую золотую цепочку, и металл ложится на кожу прохладным и чужим."),
 ("A1_SH14","VIKA_YOUNG","luxury_restaurant","a close-up of the nineteen-year-old girl looking down at the new gold chain on her ankle, wonder and calculation mixed on her face","CU","high","static","night",False,False,
  "ты смотришь на цепочку и решаешь, что это подарок, а не поводок, и в этом твоя первая ошибка."),
 ("A1_SH15","VIKA_YOUNG","luxury_restaurant","a medium shot of the young woman in a cheap dress being guided toward a restaurant exit, a silver-haired man's hand at her waist","MS","eye","track","night",False,False,
  "он ведёт тебя к выходу, придерживая за талию, и швейцар молча открывает перед вами тяжёлую дверь."),
 ("A1_SH16",None,None,"a wide night view of a sleek dark luxury car waiting at the kerb outside a glowing restaurant entrance, wet asphalt reflecting golden light","WS","low","static","night",True,False,
  "у входа ждёт тёмная дорогая машина, и ты садишься в неё, ещё не зная, что это очень надолго."),
 ("A1_SH17",None,"car_interior_lux","an extreme close-up macro insert of a chrome car-door lock latch dropping shut inside a dark luxury car, filling the frame in sharp focus, ambient dashboard glow, shallow depth of field","INSERT","eye","static","night",True,True,
  "дверь закрывается, и ты впервые слышишь этот щелчок замка, тихий звук, который останется с тобой на всю жизнь."),
 ("A1_SH18","VIKA_YOUNG","car_interior_lux","a medium close-up of the nineteen-year-old girl sitting on dark leather in the moving car, city lights sliding across her face, a small satisfied look","MCU","eye","static","night",False,False,
  "за стеклом плывут огни чужого города, ты сидишь на кожаном сиденье и впервые чувствуешь себя выигравшей."),
 ("A1_SH19","VIKA_YOUNG","penthouse_apartment","a wide shot of the young girl stepping into a vast high-floor apartment, the glittering night city far below the floor-to-ceiling windows","WS","low","push_in","night",False,False,
  "он привозит тебя в квартиру под самой крышей, откуда огромный ночной город лежит далеко внизу."),
 ("A1_SH20","VIKA_YOUNG","penthouse_apartment","a medium shot of the girl standing small in a huge cold expensive apartment that has almost nothing personal in it","MS","high","static","night",False,False,
  "квартира огромная, дорогая и холодная, и в ней почти нет вещей, будто здесь никто по-настоящему не живёт."),
 ("A1_SH21",None,"penthouse_apartment","a wide view of a floor-to-ceiling apartment window at night looking out over a glittering city skyline, sheer curtains, cold and beautiful","WS","eye","push_in","night",True,False,
  "ты стоишь у стеклянной стены, смотришь на огни и решаешь, что бедной ты не будешь больше никогда."),
 ("A1_SH22","VIKA_YOUNG","penthouse_apartment","a close-up of the nineteen-year-old girl's face against the night window, hopeful and certain, the gold chain just visible at her ankle","CU","low","push_in","night",False,True,
  "тебе девятнадцать, на щиколотке чужое золото, и ты уверена, что это только начало красивой жизни."),
]

if __name__=="__main__":
    seed_act("cold_open", P_COLD, COLD, render_mode="animated")
    seed_act("origin",    P_ORIGIN, ORIGIN, render_mode="animated")
