# -*- coding: utf-8 -*-
"""Seed CH05 — Бригада (warmth before the fall, action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "dim warm bytovka bulb light, close brotherly gloom, weary tenderness"

SHOTS = [
    ("CH05_SH01", None, "bytovka",
     "wide shot of a workers' cabin interior at night, a single bulb over a small gas ring and a battered communal pot, boots and jackets on nails, no clear faces",
     "WS", "eye", "push_in", "moscow_night", True, False,
     "по вечерам мы собирались у казана, земляки."),
    ("CH05_SH02", ("BAKHTI", "SHUKHRAT"), "bytovka",
     "Bakhti on the left and Shukhrat on the right hunched over bowls by the cabin stove, laughing together over food",
     "MS", "eye", "static", "moscow_night", False, False,
     "шухрат травил байки так, что мы забывали про усталость."),
    ("CH05_SH03", "SHUKHRAT", "bytovka",
     "medium close-up of a cheerful gap-toothed laborer in a knitted cap mid-joke, spoon waving, big grin",
     "MCU", "eye", "static", "moscow_night", False, False,
     "вечный балагур, мешок с шутками."),
    ("CH05_SH04", "DILSHOD", "bytovka",
     "close-up of a thin frightened nineteen-year-old's face, hugging his knees on the edge of a bunk, big unsure eyes",
     "CU", "high", "static", "moscow_night", False, False,
     "дилшод приехал первый раз, совсем мальчишка, всего боялся."),
    ("CH05_SH05", ("BAKHTI", "DILSHOD"), "bytovka",
     "Bakhti on the left putting a reassuring hand on Dilshod's shoulder on the right, offering him a bowl of food",
     "MS", "eye", "static", "moscow_night", False, True,
     "я взял его под крыло, держись рядом, научу."),
    ("CH05_SH06", None, "bytovka",
     "extreme close-up of cheap brand-new white sneakers set carefully under a bunk, laces neat",
     "ECU", "top_down", "static", "moscow_night", False, False,
     "он копил на эти кроссовки полгода, берёг их пуще глаза."),
    ("CH05_SH07", None, "bytovka",
     "medium shot of a laborer playing a two-stringed dutar by lamplight, eyes closed, lost in the tune, others listening in shadow",
     "MCU", "eye", "static", "moscow_night", True, False,
     "кто-то брал дутар, и становилось почти как дома."),
    ("CH05_SH08", None, "bytovka",
     "close-up of a wall of family photographs taped above the bunks, curling at the edges",
     "CU", "eye", "pan", "moscow_night", True, False,
     "у каждого над койкой свои, ради кого терпим."),
    ("CH05_SH09", ("BAKHTI", "DILSHOD"), "bytovka",
     "Bakhti on the left holding up his phone showing the brigade to his family, Dilshod on the right leaning in shyly to wave",
     "MS", "eye", "static", "moscow_night", False, False,
     "я показывал своих по видео, дилшод стеснялся махать."),
    ("CH05_SH10", None, "bytovka",
     "wide shot of the dark cabin with the men asleep in stacked bunks, one small light, no clear faces",
     "WS", "high", "static", "moscow_night", True, False, ""),
    ("CH05_SH11", "BAKHTI", "bytovka",
     "close-up of the master lying awake on his bunk, eyes open in the dark, thinking of home",
     "CU", "low", "static", "moscow_night", False, False,
     "я лежал и считал, сколько ещё, чтобы вернуться насовсем."),
    ("CH05_SH12", None, "mstreet",
     "wide B-roll of a cold grey dawn rising over a Moscow construction district, cranes against pale sky, no people",
     "WS", "low", "push_in", "moscow_grey", True, False, ""),
]

if __name__ == "__main__":
    seed_act(5, "bytovka_dim", MOOD, "animated", "CH05 Brigade", SHOTS)
