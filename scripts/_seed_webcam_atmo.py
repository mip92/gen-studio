# -*- coding: utf-8 -*-
"""webcam atmosphere breathers — SILENT env inserts (no VO) at end of acts A4-A9 (static back-half).
PYTHONIOENCODING=utf-8 python scripts/_seed_webcam_atmo.py ; id_region='a'; scales W,C,M,W,C."""
from _webcam_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up","static"]
ACTS=[
 ("daughter",4,"warmer real-life palette against cold neon, a divided life",[
   ("a wide view of a warm ordinary kitchen by day beside a dark stream corner, two worlds in one home","WS","day"),
   ("an extreme close-up macro insert of a baby monitor beside a ring light on a desk, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a child's plush rabbit and toys on a floor in soft daylight","MS","day"),
   ("a wide view of a neon city night through an apartment window, magenta and cyan glow","WS","night"),
   ("a close-up of a velvet star choker laid beside plain daytime clothes","CU","day")]),
 ("the_cost",5,"draining palette, harsh ring-light white over grey exhaustion",[
   ("a wide view of a cam-studio floor of glowing monitors and ring lights, cold and industrial","WS","night"),
   ("an extreme close-up macro insert of a glowing chat panel of demands, text unreadable, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a mixing desk and cables under blue screen light","MS","night"),
   ("a wide view of a rainy neon street in the small hours, empty and tired","WS","night"),
   ("a close-up of cold uneaten food and pill packets on a night table","CU","night")]),
 ("donator",6,"cold threatening palette, sickly blue monitor glow and creeping shadow",[
   ("a wide view of a lonely man's dim apartment lit blue by a monitor with photos pinned to a wall","WS","night"),
   ("an extreme close-up macro insert of a large tip alert glowing on a screen, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of an apartment door with a new second lock fitted, dim hallway light","MS","day"),
   ("a wide view of a wet neon street at night, long watching shadows","WS","night"),
   ("a close-up of headphones resting on a keyboard in blue monitor glow","CU","night")]),
 ("aging",7,"fading palette, harsh ring light exposing lines, neon dimming into grey",[
   ("a wide view of a cam-studio with very young streamers under ring lights, crowded and cold","WS","day"),
   ("an extreme close-up macro insert of a dashboard graph sliding downward, numbers unreadable, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of beauty serums and small devices on a white surface under a mirror","MS","day"),
   ("a wide view of a neon street whose cold light sharpens rather than flatters","WS","night"),
   ("a close-up of a nearly empty cash jar on a desk","CU","day")]),
 ("podruga",8,"ruined neon palette, dead grey and sickly leftover glow",[
   ("a wide view of a squalid dim flat with drawn curtains and a dusty ring light, burned out","WS","night"),
   ("an extreme close-up macro insert of a vape pen and empty bottles by a dusty ring light, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of an ambulance glow through a grimy window at night","MS","night"),
   ("a wide view of a cold neon street at night, indifferent and empty","WS","night"),
   ("a close-up of a phone screen spreading a shaming post, text unreadable, soft light","CU","day")]),
 ("exposed",9,"cold exposure palette, harsh daylight and clinical screen glow",[
   ("a wide view of an ordinary school gate and yard in flat daytime, exposed and public","WS","day"),
   ("an extreme close-up macro insert of a phone screen showing a paused stream, text unreadable, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a framed family photo turned face-down on a shelf","MS","day"),
   ("a wide view of an ordinary street where strangers turn to stare, cold daylight","WS","day"),
   ("a close-up of a velvet star choker dropped into an open drawer","CU","day")]),
]
if __name__=="__main__":
    for sk,ai,pal,items in ACTS:
        shots=[("A%d_SH5%d"%(ai,i+1), None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
