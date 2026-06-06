# -*- coding: utf-8 -*-
"""Seed CH17 — Встреча с заказчиком (Хозяина НЕ показываем; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "tense cold arrival of power, marble glare, the chill of being looked through"

SHOTS = [
    ("CH17_SH01", None, "objext",
     "wide shot of a helicopter landing on the cliff helipad, rotor wash kicking up dust, no clear faces",
     "WS", "low", "static", "object_day", True, False,
     "однажды на объект прилетели большие люди."),
    ("CH17_SH02", None, "objext",
     "wide shot of a cortege of black armoured cars sweeping up to the palace entrance, no clear faces",
     "WS", "eye", "pan", "object_day", True, False,
     "кортеж, охрана, всё забегало, как муравейник."),
    ("CH17_SH03", None, "objext",
     "medium shot of security men hurrying workers out of sight around a corner, no clear faces",
     "MS", "eye", "static", "object_day", False, False,
     "всех рабочих велели убрать с глаз."),
    ("CH17_SH04", "BAKHTI", "marble",
     "the master left behind crouched finishing one last seam in a grand hall, alone",
     "MS", "high", "static", "object_day", False, False,
     "меня оставили доделать один шов в дальнем зале."),
    ("CH17_SH05", None, "marble",
     "wide shot from behind, the backs and shadows of important suited figures and earpiece guards entering, no faces shown",
     "WS", "eye", "static", "object_day", True, False,
     "самого хозяина мы так и не увидели, только спины да охрану."),
    ("CH17_SH06", "ZAKAZCHIK", "marble",
     "a silver-haired client in an expensive suit walking into the hall among the entourage",
     "MS", "low", "static", "object_day", False, False,
     "а потом вошёл он, и сердце у меня ёкнуло."),
    ("CH17_SH07", "BAKHTI", "marble",
     "close-up of the master freezing in recognition, trowel still in hand",
     "CU", "eye", "static", "object_day", False, True,
     "я узнал его, я клал ему хаммам на рублёвке."),
    ("CH17_SH08", ("ZAKAZCHIK", "BAKHTI"), "marble",
     "the client on the left strolling past, Bakhti on the right kneeling at the seam, invisible to him",
     "MS", "eye", "pan", "object_day", False, False,
     "три месяца я был у него в доме, в метре от него."),
    ("CH17_SH09", "ZAKAZCHIK", "marble",
     "medium close-up of the client's gaze sliding over the kneeling worker without a flicker of recognition",
     "MCU", "eye", "static", "object_day", False, True,
     "он скользнул по мне взглядом, как по стеклу."),
    ("CH17_SH10", "ZAKAZCHIK", "marble",
     "extreme close-up of the client's wrist and gold watch as he checks the time, bored",
     "ECU", "eye", "static", "object_day", False, False,
     "те же часы, дороже всей моей жизни."),
    ("CH17_SH11", "BAKHTI", "marble",
     "close-up of the master lowering his eyes back to the seam, working on",
     "CU", "eye", "static", "object_day", False, False,
     "для него я был частью пола, и тогда, и теперь."),
    ("CH17_SH12", None, "marble",
     "wide shot of the emptied hall after the entourage has passed through, no people",
     "WS", "eye", "static", "object_day", True, False, ""),
]

if __name__ == "__main__":
    seed_act(17, "object_marble_cold", MOOD, "static", "CH17 Client-visit", SHOTS)
