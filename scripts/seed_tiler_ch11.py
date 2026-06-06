# -*- coding: utf-8 -*-
"""Seed CH11 — Тайная подпись (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold dark marble hall at night, one small secret intimate act, single work lamp"

SHOTS = [
    ("CH11_SH01", "BAKHTI", "marble",
     "wide shot of the master alone in the vast dark marble hall at night, a single work lamp beside him",
     "WS", "high", "static", "object_night", False, False,
     "однажды ночью, когда все ушли, я остался один в зале."),
    ("CH11_SH02", "BAKHTI", "marble",
     "extreme close-up of the master scratching his name into the back of a small turquoise glazed tile with a nail, his father's keepsake shard set aside separately",
     "ECU", "top_down", "static", "object_night", False, True,
     "отцовский осколок я не трогал, его берёг, а взял другую бирюзовую плитку, свою, и нацарапал на ней имя."),
    ("CH11_SH03", "BAKHTI", "marble",
     "the master prying up one edge marble slab from the floor bed, careful and quiet",
     "MS", "eye", "static", "object_night", False, False,
     "поднял одну плиту с краю, где никто не хватится."),
    ("CH11_SH04", "BAKHTI", "marble",
     "extreme close-up of hands pressing the small turquoise tile face-down into the mortar bed beneath the marble",
     "ECU", "top_down", "static", "object_night", False, True,
     "и замуровал её под их мрамором, навсегда."),
    ("CH11_SH05", "BAKHTI", "marble",
     "medium close-up of the master setting the marble slab back down over the hidden tile",
     "MCU", "eye", "static", "object_night", False, False,
     "вернул плиту на место, прижал."),
    ("CH11_SH06", "BAKHTI", "marble",
     "extreme close-up of fingers smoothing the seam shut, the hiding place invisible",
     "ECU", "top_down", "static", "object_night", False, False,
     "загладил шов, теперь не найдёт никто."),
    ("CH11_SH07", "BAKHTI", "marble",
     "the master standing over the spot, looking down, a quiet defiance",
     "MS", "low", "static", "object_night", False, False,
     "они стёрли меня из всех бумаг."),
    ("CH11_SH08", None, "marble",
     "wide shot of the vast finished marble hall, one ordinary slab among thousands holding a secret, no people",
     "WS", "eye", "push_in", "object_night", True, False,
     "но под их полом теперь лежала моя бирюза."),
    ("CH11_SH09", None, "marble",
     "close-up of the seamless polished marble floor stretching away, no people",
     "CU", "low", "pan", "object_night", True, False,
     "они ходят по мне и не знают."),
    ("CH11_SH10", "BAKHTI", "marble",
     "close-up of the master's face in the lamp light, a small private smile",
     "CU", "eye", "static", "object_night", False, True,
     "это и была моя настоящая подпись."),
]

if __name__ == "__main__":
    seed_act(11, "object_marble_cold", MOOD, "static", "CH11 Signature", SHOTS)
