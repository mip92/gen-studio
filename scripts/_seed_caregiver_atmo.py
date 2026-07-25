# -*- coding: utf-8 -*-
"""caregiver — атмосферные вставки БЕЗ ОЗВУЧКИ (narr=""), по 2 в хвост каждого
из восьми средних актов. У каждого акта своя раскадровка (масштаб + ракурс +
движение + предмет наблюдения), чтобы акты не заканчивались одинаково (§5.1a).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _caregiver_engine import seed_act

P1 = "a cool early-spring palette of thin daylight, worn green paint and pale scuffed linoleum"
P2 = "a warm domestic palette of amber lamplight, cream knitwear and dark polished wood"
P3 = "a cold clinical palette of blue-white ward light, steel bed frames and pale blue coverlets"
P4 = "a hard urban palette of white phone glare, bleached hair and flat grey street daylight"
P5 = "a muted enclosed palette of dust-coloured drapes, brown varnished furniture and one warm lamp"
P6 = "a night palette of a single low bedside lamp, deep brown shadow and cold blue at the window"
P7 = "a dry official palette of green desk-lamp light, buff paper and dark varnished wood"
P8 = "a pale washed palette of low winter light through net curtains, white linen and thin translucent skin"

A1 = [
 ("A1_SZ01", None, "val_hall",
  "a doormat inside a flat entrance worn through to the backing in one oval patch exactly where feet land",
  "INSERT","top","static","day",True,False,""),
 ("A1_SZ02", None, "courtyard",
  "the facade of an old four-storey block seen from below with four rows of windows, net curtains in most and one open ventilation pane",
  "EWS","low","tilt_up","dusk",True,False,""),
]
A2 = [
 ("A2_SZ01", None, "courtyard",
  "a courtyard in summer seen from above with poplar shade lying in long stripes across the path and both benches empty in the heat",
  "WS","high","pan_left","day",True,False,""),
 ("A2_SZ02", None, "val_room",
  "the face of an old wall clock with a slow second hand and a fine crack running across the glass under one numeral",
  "ECU","dutch","static","day",True,False,""),
]
A3 = [
 ("A3_SZ01", None, "hospital_ward",
  "a drip chamber with a single drop forming and falling, the tube running away out of focus below it",
  "ECU","eye","pull_out","night",True,False,""),
 ("A3_SZ02", None, "clinic_corridor",
  "a hospital corridor at night lit by every third ceiling panel with a floor polisher parked against the wall and closed doors receding",
  "WS","low","track","night",True,False,""),
]
A4 = [
 ("A4_SZ01", None, "bus_stop",
  "a city street in heavy rain seen from a bus shelter with water sheeting off the canopy edge and wet tail lights smeared across the asphalt",
  "WS","dutch","tilt_down","day",True,False,""),
 ("A4_SZ02", None, "val_room",
  "a framed school photograph of a girl standing among other frames on a sideboard, turned slightly away from the front row",
  "INSERT","eye","static","day",True,False,""),
]
A5 = [
 ("A5_SZ01", None, "val_room",
  "a blade of afternoon light between heavy drapes with dust turning slowly inside it above a dark polished sideboard",
  "INSERT","dutch","static","day",True,False,""),
 ("A5_SZ02", None, "courtyard",
  "a courtyard seen straight down from an upper landing window with the path, the two benches and the bin enclosure laid out below",
  "EWS","low","tilt_down","dusk",True,False,""),
]
A6 = [
 ("A6_SZ01", None, "val_room",
  "a bedroom ceiling at night with the bar of light from a courtyard lamp lying across it and the shadow of a window frame stretched over the cornice",
  "EWS","dutch","pan_left","night",True,False,""),
 ("A6_SZ02", None, "val_room",
  "the dial of a small wind-up alarm clock in near darkness with only the hands and the numerals catching a little lamplight",
  "ECU","top","static","night",True,False,""),
]
A7 = [
 ("A7_SZ01", None, "val_kitchen",
  "a kitchen wall calendar with three consecutive dates crossed through in pencil and a fourth ringed and then rubbed out",
  "ECU","low","push_in","day",True,False,""),
 ("A7_SZ02", None, "winter_yard",
  "a snowed street at first light with a cleared strip of pavement, banked snow along the kerb and tyre tracks frozen into the slush",
  "EWS","eye","pan_right","dawn",True,False,""),
]
A8 = [
 ("A8_SZ01", None, "val_room",
  "melting snow on an outside windowsill seen through net curtains, water beading and running down the glass in slow lines",
  "INSERT","high","tilt_down","day",True,False,""),
 ("A8_SZ02", None, "winter_yard",
  "bare poplar branches against a pale March sky with the last snow sliding off them and the roofline of the opposite block below",
  "WS","eye","pull_out","day",True,False,""),
]

if __name__ == "__main__":
    for key, pal, shots in [("hired",P1,A1),("routine",P2,A2),("promise",P3,A3),("daughter",P4,A4),
                            ("deeper",P5,A5),("bell",P6,A6),("papers",P7,A7),("last_winter",P8,A8)]:
        seed_act(key, pal, shots, id_region="a")
