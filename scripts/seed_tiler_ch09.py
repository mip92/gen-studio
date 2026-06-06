# -*- coding: utf-8 -*-
"""Seed CH09 — Тело мастера (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold marble dust glare, the body grinding down, harsh white site light"

SHOTS = [
    ("CH09_SH01", None, "marble",
     "wide shot of a wet marble cutting station throwing up a fan of slurry and white dust, no clear faces",
     "WS", "eye", "static", "object_day", True, False,
     "мрамор режут мокрой пилой, и пыль стоит стеной."),
    ("CH09_SH02", "BAKHTI", "marble",
     "the master guiding a heavy marble slab through a screaming wet saw, mask on, soaked in dust",
     "MS", "eye", "static", "object_day", False, False,
     "я резал его день за днём, дышал этой пылью."),
    ("CH09_SH03", "BAKHTI", "marble",
     "low-angle extreme close-up of the master's hands steadying a marble slab against the screaming wet blade, slurry spraying",
     "ECU", "low", "static", "object_day", False, False,
     "руки не дрожат, иначе плита треснет, а с тебя вычтут."),
    ("CH09_SH04", "BAKHTI", "marble",
     "the master kneeling for hours laying a marble floor, bent low, methodical",
     "MS", "high", "static", "object_day", False, False,
     "на коленях по двенадцать часов, день за днём."),
    ("CH09_SH05", None, "marble",
     "extreme close-up of worn split knee pads over bruised raw knees on cold marble, no face",
     "ECU", "top_down", "static", "object_day", False, True,
     "колени стирались в кровь, спина не разгибалась."),
    ("CH09_SH06", "BAKHTI", "bytovka",
     "medium close-up of the master pulling off his dust mask and coughing hard, white dust caked in his eyebrows",
     "MCU", "eye", "static", "object_day", False, False,
     "пыль садится в лёгкие и больше не выходит."),
    ("CH09_SH07", None, "marble",
     "close-up of fine marble dust hanging in shafts of hard site light, no people",
     "CU", "eye", "static", "object_day", True, False, ""),
    ("CH09_SH08", "BAKHTI", "bytovka",
     "the master at night slowly straightening his aching back, wincing, hand on his spine",
     "MS", "eye", "static", "object_day", False, False,
     "к ночи я разгибался по частям, как старик."),
    ("CH09_SH09", "BAKHTI", "bytovka",
     "extreme close-up of the master's trembling fingers held up to the light, worn out",
     "ECU", "eye", "static", "object_day", False, False,
     "руки, которыми я кормился, начали меня подводить."),
    ("CH09_SH10", "BAKHTI", "marble",
     "medium close-up of the master's gaunter face reflected in the polished marble floor he is laying",
     "MCU", "high", "static", "object_day", False, True,
     "я оставил там кусок себя, по-настоящему."),
    ("CH09_SH11", None, "marble",
     "wide shot of a vast expanse of finished mirror-polished marble floor, no people",
     "WS", "low", "push_in", "object_day", True, False,
     "а пол блестел, как будто его не трогала ничья боль."),
    ("CH09_SH12", "BAKHTI", "bytovka",
     "close-up of the exhausted master's face as he lies back on his bunk, eyes closing",
     "CU", "eye", "static", "object_day", False, False,
     "и завтра снова с рассветом, к пиле."),
]

if __name__ == "__main__":
    seed_act(9, "object_marble_cold", MOOD, "static", "CH09 Body", SHOTS)
