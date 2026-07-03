# -*- coding: utf-8 -*-
"""surrogate atmosphere breathers — SILENT env inserts (no VO) at end of acts A4-A9 (static back-half).
PYTHONIOENCODING=utf-8 python scripts/_seed_surrogate_atmo.py ; id_region='a'; scales W,C,M,W,C."""
from _surrogate_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up","static"]
ACTS=[
 ("husband",4,"souring domestic palette, faded warm browns turning grey and cold, heavy dim light",[
   ("a wide view of a poor flat gone cold and cluttered, unwashed dishes and half-drawn curtains, heavy dim light","WS","day"),
   ("an extreme close-up macro insert of empty bottles and a forgotten cigarette on a kitchen table, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of an empty coat hook and a bare hallway where a man's things used to be, dim light","MS","day"),
   ("a wide view of a grey small-town street with twitching net curtains, an atmosphere of gossip","WS","day"),
   ("a close-up of a child's small red toy car left on a windowsill in weak daylight","CU","day")]),
 ("second",5,"repeating clinical palette, cool clinic whites and washed grey, a weary sense of the same again",[
   ("a wide view of a tidy agency office with a glass desk and stacked contracts, cool and impersonal","WS","day"),
   ("an extreme close-up macro insert of a contract and a pen on a glass desk, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a hushed clinic corridor with empty chairs and closed white doors, cool light","MS","day"),
   ("a wide view of an unchanging grey small-town street under a flat overcast sky","WS","day"),
   ("a close-up of a second half-finished tiny knitted bootie beside a ball of yarn in soft lamplight","CU","night")]),
 ("bond",6,"quiet aching palette, warm lamplight and deep private shadow, tender and heavy",[
   ("a wide view of a poor kitchen at night, a tin box and bills on the table under a single low bulb","WS","night"),
   ("an extreme close-up macro insert of two hospital bracelets and two tiny booties laid on a table, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a shabby courtyard playground with a rusted swing set under overcast light","MS","day"),
   ("a wide view of a poorer emptier grey small-town street with shuttered shops and bare trees","WS","day"),
   ("a close-up of an empty photo frame lying face up on a table in warm lamplight","CU","night")]),
 ("third",7,"hardening palette, cold clinic white and grey with a last flicker of warmth going out",[
   ("a wide view of an agency office window over a wealthy indifferent city, cool daylight","WS","day"),
   ("an extreme close-up macro insert of a bucket catching drips under a water-stained leaking ceiling, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a clinic consultation room with a couch and a monitor, clinical and cold","MS","day"),
   ("a wide view of a sleeping grey small-town street at night, a leaking roofline against the sky","WS","night"),
   ("a close-up of a third tiny knitted bootie beside knitting needles on a night table","CU","night")]),
 ("third_birth",8,"raw broken palette, pale hospital green and cold, the hush after everything breaks",[
   ("a wide view of a tense maternity ward corridor at night, pale green walls and empty gurneys","WS","night"),
   ("an extreme close-up macro insert of a snipped hospital bracelet lying on a white hospital sheet, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a bare recovery room with a drip stand and an empty space where a cradle should be","MS","day"),
   ("a wide view of a grey small-town street at dawn, quiet and unknowing under a pale sky","WS","day"),
   ("a close-up of a tin box holding three hospital bracelets on a kitchen table in low light","CU","night")]),
 ("barren",9,"grief-emptied palette, cold grey-blue and washed white, the flat silence after loss",[
   ("a wide view of a sober doctor's office with scan images on a lightbox, cold even light","WS","day"),
   ("an extreme close-up macro insert of medical scan images clipped to a lightbox, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a small folded unused baby garment in an open drawer, still and sad","MS","day"),
   ("a wide view of a flat grey small-town street drained of colour under an overcast sky","WS","day"),
   ("a close-up of a silent dark mobile phone on a table with no calls, soft light","CU","day")]),
]
if __name__=="__main__":
    for sk,ai,pal,items in ACTS:
        shots=[("A%d_SH5%d"%(ai,i+1), None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
