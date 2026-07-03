# -*- coding: utf-8 -*-
"""kept_woman atmosphere breathers — SILENT env inserts (no VO) at the end of acts A4-A9 (static back-half).
User-requested silent B-roll (nature / atmosphere / objects). Hook acts A0-A3 stay tight; finale A10-A11 stays clean.
PYTHONIOENCODING=utf-8 python scripts/_seed_kept_woman_atmo.py
id_region='a'; codes A{n}_SH5x sort after each act. scales W,C,M,W,C (checked no 3-run at act seam)."""
from _kept_woman_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up","static"]
# (scene_key, act_idx, palette, [(subj, st, tod) x5])
ACTS=[
 ("tighten",4,"cooling anxious palette, desaturated gold turning clinical white and cold blue, harder light",[
   ("a wide view of an empty bright cosmetology salon at dusk, a reclining chair and a dark ring-lit mirror, cold and still","WS","dusk"),
   ("an extreme close-up macro insert of melting ice in an abandoned cocktail glass, condensation running down the sides, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a private clinic waiting corridor with a row of empty chairs and a closed white door, antiseptic and quiet","MS","day"),
   ("a wide view of a cold grey sea under an overcast sky from an empty hotel balcony, still water and a deserted shore","WS","day"),
   ("a close-up of a wilting orchid in a designer vase on a marble counter, petals browning at the edges, soft light","CU","day")]),
 ("mother",5,"warm poor palette, faded floral tones, soft weak provincial daylight, tired warmth",[
   ("a wide view of a muddy small-town yard with low grey houses and bare trees under weak daylight, puddles reflecting the sky","WS","day"),
   ("an extreme close-up macro insert of steam rising from a chipped tea glass on a plastic checked tablecloth, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of faded floral wallpaper peeling at the seams above an old enamel stove in a poor kitchen","MS","day"),
   ("a wide view of an empty rural bus stop on a grey road at the edge of a small town, still and deserted","WS","day"),
   ("a close-up of glass jars of home preserves lined on a windowsill in warm dusty light","CU","day")]),
 ("turn",6,"muted bittersweet palette, warm ordinary daylight against cold restaurant gold",[
   ("a wide view of a plain ordinary city street with a small cheap cafe and bare trees, quiet grey daylight","WS","day"),
   ("an extreme close-up macro insert of a closed plain paper ring box on a cafe table beside a cold cup of coffee, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of an empty candlelit restaurant table set for two with an untouched orchid, golden low light","MS","night"),
   ("a wide view of a formal wedding hall being decorated with white flowers, elegant and deserted","WS","day"),
   ("a close-up of a single wedding invitation card standing on a marble surface in cold light","CU","day")]),
 ("slide",7,"declining palette, cheap neon and sodium orange over grey, tired dim light",[
   ("a wide view of a dim late-night bar with empty stools and a sticky counter under coloured neon, rain on the window","WS","night"),
   ("an extreme close-up macro insert of a half-melted ice cube in a cheap cocktail glass under neon glow, sharp focus, shallow depth of field","ECU","night"),
   ("a medium view of a run-down flat with drawn curtains and a cluttered table of bottles and blister packs, dim grey light","MS","day"),
   ("a wide view of a rainy neon city street in the small hours, reflections in wet asphalt, empty and tired","WS","night"),
   ("a close-up of a pair of oversized dark sunglasses on a dusty table catching a thin sliver of grey light","CU","day")]),
 ("eject",8,"cold subtracting palette, bleached marble white draining to grey, flat hard daylight",[
   ("a wide view of a half-emptied luxury apartment with moving boxes and pale marble floor, cold flat daylight","WS","day"),
   ("an extreme close-up macro insert of a set of keys left on a bare marble counter, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a cramped rented studio wall crammed with designer handbags above a narrow bed, mismatched and stark","MS","day"),
   ("a wide view of a grey inner courtyard of apartment blocks from a small window, an empty parking bay, bare and still","WS","day"),
   ("a close-up of cut-off plastic price tags scattered on a cheap floor beside an expensive shoe, soft light","CU","day")]),
 ("loss",9,"hollow grief palette, wet grey and washed black, cold colourless overcast light",[
   ("a wide view of a bleak provincial cemetery under bare trees, fenced graves and a low grey sky, wet clay paths","WS","day"),
   ("an extreme close-up macro insert of faded plastic flowers on wet dark earth, rain beads on the petals, sharp focus, shallow depth of field","ECU","day"),
   ("a medium view of a fresh grave mound with a plain temporary marker under a colourless sky","MS","day"),
   ("a wide view of an emptying rented studio with bare wall hooks where handbags once hung, grey light","WS","day"),
   ("a close-up of a folded faded floral cardigan and reading glasses on a beaded cord resting on a bed, soft light","CU","day")]),
]
if __name__=="__main__":
    for sk,ai,pal,items in ACTS:
        shots=[("A%d_SH5%d"%(ai,i+1), None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
