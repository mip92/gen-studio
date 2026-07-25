# -*- coding: utf-8 -*-
"""car_flipper — атмосферные вставки БЕЗ ОЗВУЧКИ (narr="", user 2026-07-25), по 2 в хвост каждого из восьми средних актов.
Каждому акту своя раскадровка (масштаб + ракурс + движение + предмет наблюдения),
чтобы акты не заканчивались одним и тем же шаблоном (§5.1a).
Коды CHnn_SZ* лексически сортируются после _SH*, id_region='a' — своя зона id.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _car_flipper_engine import seed_act

P1  = "a warm dim palette of tungsten work light, oil-brown shadow and a cold blue strip of daylight at the door"
P2  = "a raw daylight palette of grey overcast, churned brown mud and faded painted metal"
P3  = "a dusty palette of grey primer, white sanding haze and hard yellow lamp light"
P4  = "an overcast palette of flat grey light, cold concrete and dull green painted metal"
P5  = "a bright commercial palette of clean white light, polished car paint and coloured plastic bunting"
P6  = "a warm evening palette of low sun on paintwork, long shadows and amber floodlight"
P7  = "a drained autumn palette of wet grey, dark green and a pale washed-out sky"
P8  = "a soft late-summer palette of warm low sun, dust hanging in the air and pale blue shade"

A1 = [
 ("A1_SZ01", None, "garage_row",
  "a puddle of standing water between two garage boxes carrying a thin rainbow film of spilled oil across its surface",
  "INSERT","top","static","night",True,False,
  ""),
 ("A1_SZ02", None, "garage_row",
  "the flat roofs of a garage cooperative against a darkening sky with bent television aerials and a single lit window in the block behind",
  "EWS","low","tilt_up","dusk",True,False,
  ""),
]

A2 = [
 ("A2_SZ01", None, "market_old",
  "rows of parked cars in steady rain with water running off their roofs and streaming down the windscreens into the mud",
  "WS","high","pan_left","day",True,False,
  ""),
 ("A2_SZ02", None, "market_old",
  "a soaked cardboard price card lying face-up in churned mud with its hand-written numbers running and blurred",
  "ECU","dutch","static","day",True,False,
  ""),
]

A3 = [
 ("A3_SZ01", None, "body_shop",
  "a handprint pressed into thick white sanding dust on a car wing, the ridges of the palm picked out by lamp light",
  "ECU","eye","pull_out","day",True,False,
  ""),
 ("A3_SZ02", None, "dawn_road",
  "a wet country road running between flooded spring fields with standing water reflecting a low grey sky on both sides",
  "WS","low","track","dawn",True,False,
  ""),
]

A4 = [
 ("A4_SZ01", None, "market_old",
  "a car market lying under thick morning fog with only the nearest two rows visible and the rest dissolving into white",
  "WS","dutch","tilt_down","dawn",True,False,
  ""),
 ("A4_SZ02", None, "market_old",
  "a shallow puddle holding the upside-down reflection of a windscreen price card and the dark shape of a car above it",
  "INSERT","eye","static","day",True,False,
  ""),
]

A5 = [
 ("A5_SZ01", None, "dealer_lot",
  "beads of water standing on a freshly waxed bonnet in tight round drops, each one holding a small bright reflection",
  "INSERT","dutch","static","day",True,False,
  ""),
 ("A5_SZ02", None, "dealer_lot",
  "a floodlight mast at night with a dense cloud of insects turning in the cone of light above the parked rows",
  "EWS","low","tilt_down","night",True,False,
  ""),
]

A6 = [
 ("A6_SZ01", None, "dealer_lot",
  "the shadows of bunting triangles crawling slowly across warm asphalt as the sun drops, the paving lines cutting through them",
  "EWS","dutch","pan_left","dusk",True,False,
  ""),
 ("A6_SZ02", None, "office_container",
  "a single key swinging on its numbered hook inside an open cabinet, its paper tag turning slowly on the ring",
  "ECU","top","static","day",True,False,
  ""),
]

A7 = [
 ("A7_SZ01", None, "dealer_lot",
  "wet yellow leaves stuck flat across a car bonnet and windscreen after rain, the wipers left standing up off the glass",
  "ECU","low","push_in","day",True,False,
  ""),
 ("A7_SZ02", None, "dealer_lot",
  "an empty banner frame at a lot entrance with the printed sheet taken out of it, bare metal against a flat grey sky",
  "EWS","eye","pan_right","day",True,False,
  ""),
]

A8 = [
 ("A8_SZ01", None, "roadside_day",
  "pollen and dust turning slowly in a shaft of low sunlight over the warm bonnet of a parked car",
  "INSERT","high","tilt_down","day",True,False,
  ""),
 ("A8_SZ02", None, "dawn_road",
  "a straight road running through cut summer fields towards a low sun with heat still shimmering off the asphalt",
  "WS","eye","pull_out","dusk",True,False,
  ""),
]

if __name__ == "__main__":
    for key, pal, shots in [("garage",P1,A1),("market",P2,A2),("craft",P3,A3),("first_return",P4,A4),
                            ("lot",P5,A5),("son",P6,A6),("quit",P7,A7),("sale",P8,A8)]:
        seed_act(key, pal, shots, id_region="a")
