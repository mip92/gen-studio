# -*- coding: utf-8 -*-
"""Seed ATMOSPHERE / intermediate shots for `tiler` — tile/craft macros + landscapes.
Env route, id_region='a' (no collision with main shots). ShotCodes CHnn_SZ* sort AFTER CHnn_SH*.
Idempotent via shotCode. Run after main chapters."""
from _seed_tiler_act_engine import seed_act

# scene_order: (palette, mood, [ (code, loc, subj, st, ang, mv, tod, narr) ... ])
ATM = {
 0: ("kiln_red_now", "oppressive red kiln glow, heat haze",
     [("C_SZ1","kiln","extreme close-up macro of a raw red clay brick surface, rough grain and grit, no people","ECU","top_down","static","kiln_night_now","")]),
 1: ("rishtan_turquoise", "warm golden Fergana light, soft dust",
     [("CH01_SZ1","rishtan","wide landscape of the green Fergana valley in soft haze beyond the Rishtan rooftops, distant hills, no people","WS","high","pan","rishtan_day","за городком лежала ферганская долина, зелёная, в утренней дымке."),
      ("CH01_SZ2","rishtan","extreme close-up macro of glossy turquoise glaze pooling on a fired ceramic surface, no people","ECU","top_down","static","rishtan_day","")]),
 2: ("rishtan_turquoise", "reverent turquoise heritage glow",
     [("CH02_SZ1","samarkand","wide skyline of the Registan turquoise domes and minarets of Samarkand at dusk, no people","WS","low","static","rishtan_day",""),
      ("CH02_SZ2","samarkand","extreme close-up macro of intricate cobalt and turquoise majolica star mosaic, no people","ECU","eye","push_in","rishtan_day","узор, в котором не повторяется ни одна звезда.")]),
 3: ("moscow_grey_gold", "cold grey Moscow light",
     [("CH03_SZ1","mstreet","wide grey snowy Moscow skyline of towers under a low overcast sky, no people","WS","high","static","moscow_grey",""),
      ("CH03_SZ2","mansion","extreme close-up macro of cold white marble with a grey vein running through it, no people","ECU","top_down","static","moscow_day","белый мрамор с серой жилкой, холодный, как тут всё.")]),
 4: ("moscow_grey_gold", "opulent gold mansion sheen",
     [("CH04_SZ1","mansion","medium shot of a section of gold and blue mosaic wall catching the light, no people","MS","eye","push_in","moscow_day","")]),
 5: ("bytovka_dim", "cold grey construction dawn",
     [("CH05_SZ1","mstreet","extreme close-up macro of frost crystals on a steel scaffolding pipe at cold dawn, no people","ECU","top_down","static","moscow_grey","")]),
 6: ("raid_cold", "harsh grey institutional light",
     [("CH06_SZ1","migra","wide shot of a barred grey window with cold daylight in a bleak office, no people","WS","low","static","moscow_day","")]),
 7: ("object_marble_cold", "dark cold transit night",
     [("CH07_SZ1","objext","wide B-roll of a dark empty night highway seen from a moving vehicle, no people","WS","eye","pan","night","")]),
 8: ("object_marble_cold", "cold sea-cliff fortress haze",
     [("CH08_SZ1","objext","extreme wide landscape of grey waves breaking against the cliff cape below the construction site, sea spray, no people","EWS","high","static","object_day","внизу било серое море о скалы, день и ночь, без жалости."),
      ("CH08_SZ2","marble","extreme close-up macro of the grain of a crated slab of veined Italian marble, no people","ECU","top_down","static","object_day","")]),
 9: ("object_marble_cold", "cold marble dust glare",
     [("CH09_SZ1","marble","extreme close-up macro of fine marble dust hanging and settling in a hard shaft of light, no people","ECU","eye","static","object_day","")]),
 10:("object_marble_cold", "cold marble with proud detail",
     [("CH10_SZ1","marble","wide overhead shot of the finished radiating geometric star marble inlay filling the hall floor, no people","WS","high","push_in","object_day","звезда из камня, мой почерк, хоть и без подписи."),
      ("CH10_SZ2","marble","close-up of crystal chandelier drops scattering refracted light, no people","CU","low","static","object_day","")]),
 11:("object_marble_cold", "cold dark marble, one secret",
     [("CH11_SZ1","marble","medium shot of a single small turquoise tile lying against a vast expanse of cold white marble, no people","MS","high","static","object_night","")]),
 12:("object_marble_cold", "cold night over the barracks",
     [("CH12_SZ1","bytovka","wide B-roll of a cold starless night sky over dark site barracks, no people","WS","high","static","object_night","")]),
 13:("object_marble_cold", "cold opulent marble sheen",
     [("CH13_SZ1","marble","extreme close-up macro of a flawless tight seam between two marble slabs, no people","ECU","top_down","static","object_day","")]),
 14:("object_marble_cold", "cold black sea night",
     [("CH14_SZ1","objext","wide B-roll of the black night sea beyond the dark palace terraces, faint moonlight, no people","WS","eye","static","object_night","")]),
 15:("object_marble_cold", "cold marble, broken detail",
     [("CH15_SZ1","marble","extreme close-up macro of cracked tile shards arranged into a small star on a dark floor, no people","ECU","top_down","static","object_night","")]),
 16:("object_aqua_glow", "eerie coloured fountain glow",
     [("CH16_SZ1","fountain","medium shot of fountain jets lit by shifting coloured light against the night, no people","MS","eye","static","object_night","вода, заточённая в трубы, чтобы плясать по команде."),
      ("CH16_SZ2","fountain","close-up of moonlit sea foam washing over dark rocks below the terrace, no people","CU","low","static","object_night","")]),
 17:("object_marble_cold", "cold cape arrival light",
     [("CH17_SZ1","objext","extreme close-up of a black armoured car's wet wheel and a guard's polished boot on the cape, no people","ECU","eye","static","object_day","")]),
 18:("object_aqua_glow", "low gold terrace night",
     [("CH18_SZ1","fountain","close-up of coloured fountain jets rising and falling against the night, no people","CU","low","static","object_night","")]),
 19:("object_party_dark", "blurred decadent gold gloom",
     [("CH19_SZ1","party","extreme close-up macro of champagne bubbles rising in a crystal glass, no people","ECU","eye","static","object_night","")]),
 20:("object_marble_cold", "cold sky over scaffolding",
     [("CH20_SZ1","objext","wide low-angle of bare scaffolding against a pale indifferent sky, no people","WS","low","static","object_day","")]),
 21:("object_marble_cold", "cold finished opulence at dusk",
     [("CH21_SZ1","objext","extreme wide of the finished palace glowing on the cliff cape above the sea at dusk, no people","EWS","eye","push_in","object_evening","дворец стоял готовый, сияющий, чужой до последнего камня.")]),
 22:("steppe_black", "black steppe night dread",
     [("CH22_SZ1","steppe","extreme wide of a vast black steppe under a cold field of stars, no people","EWS","high","static","steppe_night","")]),
 23:("steppe_bleached", "harsh bleached dawn",
     [("CH23_SZ1","steppe","extreme close-up macro of cracked sun-baked steppe earth, dry and split, no people","ECU","top_down","static","steppe_dawn","")]),
 24:("steppe_bleached", "blistering empty steppe",
     [("CH24_SZ1","steppe","extreme wide of a heat-shimmering empty horizon with a single leaning telephone pole, no people","EWS","eye","static","steppe_day",""),
      ("CH24_SZ2","steppe","extreme close-up macro of dust and a lone dry thistle on baked ground, no people","ECU","top_down","static","steppe_day","")]),
 25:("steppe_bleached", "lonely dusk roadside",
     [("CH25_SZ1","highway","wide B-roll of an empty two-lane highway stretching into a dusty dusk, no people","WS","eye","static","highway_dusk","")]),
 26:("kiln_red_now", "red kiln hell glow",
     [("CH26_SZ1","kiln","medium shot of stacked raw red bricks and a battered wheelbarrow in the kiln yard, no people","MS","eye","static","kiln_day_now","красная глина, теперь мой единственный материал."),
      ("CH26_SZ2","kiln","wide shot of dry barren Dagestan hills beyond the factory wall, no people","WS","low","static","kiln_day_now","")]),
 27:("rishtan_turquoise", "warm haunted home light",
     [("CH27_SZ1","house","wide landscape of the warm Fergana hills behind a quiet Rishtan house, no people","WS","eye","static","rishtan_day",""),
      ("CH27_SZ2","house","extreme close-up macro of a dry empty fountain basin waiting to be tiled, no people","ECU","high","static","rishtan_golden","бирюзу для него я уже выбрал, а выложить так и не успел.")]),
 28:("kiln_red_now", "red kiln gloom",
     [("CH28_SZ1","kiln","wide shot of endless stacks of drying bricks fading into red gloom, no people","WS","high","static","kiln_night_now","")]),
 29:("kiln_red_now", "dying red embers",
     [("CH29_SZ1","kiln","wide shot of the dark factory shed and the dim glowing kiln mouth, no people","WS","eye","static","kiln_night_now",""),
      ("CH29_SZ2","kiln","extreme close-up macro of the small turquoise shard resting on the warm kiln edge, the one cool blue in the red, no people","ECU","top_down","static","kiln_night_now","")]),
}

if __name__ == "__main__":
    total = 0
    for so in sorted(ATM):
        palette, mood, entries = ATM[so]
        rmode = "animated" if so <= 8 else "static"
        SHOTS = [(c, None, loc, subj, st, ang, mv, tod, True, False, narr)
                 for (c, loc, subj, st, ang, mv, tod, narr) in entries]
        seed_act(so, palette, mood, rmode, f"ATM scene {so}", SHOTS, id_region='a')
        total += len(SHOTS)
    print(f"--- atmosphere total: {total} shots ---")
