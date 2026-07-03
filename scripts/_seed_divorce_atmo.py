# -*- coding: utf-8 -*-
"""divorce atmosphere breathers — silent env inserts (no VO) at the end of acts A0-A6.
PYTHONIOENCODING=utf-8 python scripts/_seed_divorce_atmo.py
id_region='a'; codes A{n}_SH5x sort after each act. coda (A7) left clean for the disclaimer."""
from _divorce_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up","static","pan_right"]
ACTS=[
 ("cold_open","cold quiet domestic palette, muted blue-grey, soft overcast light",[
   ("rain running down a quiet kitchen window in the morning","WS","morning"),
   ("a macro of two mugs on a table, one upright and one overturned","ECU","morning"),
   ("an empty chair across a small kitchen table","MS","morning"),
   ("a still silent apartment hallway in grey morning light","WS","morning"),
   ("a close-up of a wilting potted plant on a windowsill","CU","morning"),
   ("a plain wall clock ticking in a quiet room","MCU","morning")]),
 ("origin","warm hopeful palette, amber and ivory, bright soft daylight",[
   ("scattered paper confetti on a registry-hall floor","WS","day"),
   ("a macro of two gold wedding rings on a velvet cushion","ECU","day"),
   ("tall white net curtains glowing in bright window light","MS","day"),
   ("a modest bouquet of flowers on a ceremonial desk","MCU","day"),
   ("a close-up of two glasses of sparkling wine catching light","CU","day"),
   ("a freshly signed marriage certificate on a desk","MS","day")]),
 ("drift","muted domestic palette, warm cooling toward grey, soft light",[
   ("a child's wooden toys scattered on a living-room rug","WS","day"),
   ("a macro of two mugs in a kitchen sink, unwashed","ECU","day"),
   ("a television glowing alone in a dim living room","MS","dusk"),
   ("a kitchen window showing the same courtyard across seasons","WS","day"),
   ("a close-up of a half-eaten dinner left on a plate","CU","night"),
   ("a worn family sofa with one cushion dented","MCU","day")]),
 ("cracks","cool muted domestic palette, grey-blue and faded warm, low light",[
   ("a folded blanket and a pillow left on a living-room sofa","WS","night"),
   ("a macro of a phone lying face-down on a sofa arm","ECU","night"),
   ("a dark empty apartment hallway at night","MS","night"),
   ("rain streaking a bedroom window in cold blue light","WS","night"),
   ("a close-up of a cold untouched cup of tea","CU","dusk"),
   ("a double bed with a wide cold gap down the middle","MCU","night")]),
 ("turn","dim regretful domestic palette, muted teal-grey and faded amber, low light",[
   ("a sticky note with a phone number alone on a fridge door","WS","day"),
   ("a macro of two unused travel tickets on a table","ECU","day"),
   ("a cold bedroom window with a streetlight glow through curtains","MS","night"),
   ("an untouched second pillow on an empty side of a bed","WS","night"),
   ("a close-up of a kitchen tap dripping in the dark","CU","night"),
   ("a quiet kitchen lit only by the open fridge at night","MCU","night")]),
 ("catastrophe","cold final domestic palette, bleached grey and pale wood, flat light",[
   ("an empty municipal courthouse corridor with wooden benches","WS","day"),
   ("a macro of stacked legal divorce papers and a fountain pen","ECU","day"),
   ("pale clean rectangles on a wall where photographs once hung","MS","day"),
   ("a line of packing tape running across a bare floor","WS","day"),
   ("a close-up of a single house key left on a bare counter","ECU","day"),
   ("a gold ring lying on a table beside an overturned mug","MCU","morning")]),
 ("aftermath","hollow muted domestic palette, desaturated grey-blue and washed beige, tired light",[
   ("a bare rented-flat window without curtains showing other blocks","WS","morning"),
   ("a macro of a single mug alone on a bare kitchenette counter","ECU","morning"),
   ("an empty residential playground under flat grey light","WS","day"),
   ("a dinosaur backpack sitting on an empty car back seat","MCU","day"),
   ("a close-up of an old family photo glowing on a phone screen","CU","night"),
   ("a folding table with one chair in a half-empty rented flat","MS","dusk")]),
]
if __name__=="__main__":
    for ai,(sk,pal,items) in enumerate(ACTS):
        shots=[("A%d_SH5%d"%(ai,i+1), None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
