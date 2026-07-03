# -*- coding: utf-8 -*-
"""donor atmosphere breathers — SILENT env inserts (no VO) at end of static acts A4-A9.
PYTHONIOENCODING=utf-8 python scripts/_seed_donor_atmo.py ; id_region='a'; 4 breathers/act, scales W,C,M,W/C."""
from _donor_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up"]
# each item: (subj, shotType, timeOfDay, loc)
ACTS=[
 ("limit",4,"hardening cold palette, sterile clinic whites and grey travel light, greed edging out warmth",[
   ("a wide view of a clinic waiting corridor in another city, empty chairs and cold recessed light","WS","day","clinic_corridor"),
   ("an extreme close-up macro insert of several plain money envelopes fanned on a table, sharp focus, shallow depth of field","ECU","night",None),
   ("a medium view of a lone station bench on an empty platform under a grey overcast sky","MS","day","city_street"),
   ("a wide view of anonymous city rooftops stretching across several unnamed grey towns","WS","day","city_street")]),
 ("anton",5,"tentative warming palette, a first domestic warmth over a cold hidden secret",[
   ("a wide view of a modest flat looking warm and lived-in, two mugs on a low table","WS","day","nika_flat"),
   ("an extreme close-up macro insert of a chipped blue enamel mug on a windowsill, sharp focus, shallow depth of field","ECU","night",None),
   ("a medium view of a hallway coat rack with a woman's coat and a small brooch on the lapel","MS","day","nika_flat"),
   ("a close-up of a glass jar of paper tabs hidden behind old boxes on a high shelf in soft light","CU","night","nika_flat")]),
 ("trying",6,"fragile hopeful palette, warm light thinning month by month into cold worry",[
   ("a wide view of a wall calendar covered in many circled dates in a modest flat","WS","day","nika_flat"),
   ("an extreme close-up macro insert of a single-line pregnancy test lying on a shelf, sharp focus, shallow depth of field","ECU","day",None),
   ("a medium view of a pair of tiny baby socks waiting on an otherwise empty shelf","MS","day","nika_flat"),
   ("a wide view of a cooling flat at night, two chairs turned away from one another","WS","night","nika_flat")]),
 ("diagnosis",7,"grief-cold palette, sterile clinic light and a home going grey, warmth draining away",[
   ("a wide view of a sober doctor's office with a desk and a cold empty lightbox","WS","day","doctor_office_bad"),
   ("an extreme close-up macro insert of scan images on a lightbox showing an almost empty field, sharp focus, shallow depth of field","ECU","day",None),
   ("a medium view of a box of packed-away baby socks in a dark cupboard","MS","day","nika_flat"),
   ("a close-up of a chipped blue enamel mug left behind on a shelf by the front door","CU","day","front_door")]),
 ("count",8,"cold lonely palette, one bulb over a table against deep shadow, the freezing hum of memory",[
   ("a wide view of a cold cryogenic laboratory with frosted numbered vials in deep blue light","WS","night","cryo_lab"),
   ("an extreme close-up macro insert of a wall of frosted glass vials each marked with a number, sharp focus, shallow depth of field","ECU","night","cryo_lab"),
   ("a medium view of a lonely kitchen with a glass jar of tabs on a lamplit table","MS","night","kitchen_night"),
   ("a wide view of a vast city at night seen through a dark kitchen window","WS","night","kitchen_night")]),
 ("dna_era",9,"grey anxious palette, cold screen-light in a lonely flat, a mounting dread with nowhere to hide",[
   ("a wide view of a dim flat lit only by the cold glow of a screen at night","WS","night","nika_flat"),
   ("an extreme close-up macro insert of an unopened spit-in-a-tube DNA kit lying in a drawer, sharp focus, shallow depth of field","ECU","day",None),
   ("a medium view of an apartment front door seen from inside the dim hallway","MS","day","front_door"),
   ("a wide view of a city crowd of young strangers passing under flat daylight","WS","day","city_street")]),
]
if __name__=="__main__":
    for sk,ai,pal,items in ACTS:
        shots=[("A%d_SH5%d"%(ai,i+1), None, loc, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod,loc) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
