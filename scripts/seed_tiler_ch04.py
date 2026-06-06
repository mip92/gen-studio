# -*- coding: utf-8 -*-
"""Seed CH04 — Заказчик (завязка узнавания, action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold opulent mansion light, gold and marble glare, entitled chill"

SHOTS = [
    ("CH04_SH01", None, "mansion",
     "wide shot of a half-finished private hammam steam room clad in intricate mosaic, scaffolding and tile crates, no people",
     "WS", "eye", "push_in", "moscow_day", True, False,
     "три месяца я клал хаммам одному богачу на рублёвке."),
    ("CH04_SH02", "BAKHTI", "mansion",
     "the master crouched low setting tiny mosaic tesserae into a curved hammam wall, tweezers and adhesive, intense focus",
     "MCU", "eye", "static", "moscow_day", False, False,
     "выкладывал по камешку, узор к узору, как учил отец."),
    ("CH04_SH03", "BAKHTI", "mansion",
     "extreme close-up of fingers pressing a single gold-and-blue mosaic tessera into wet adhesive, perfectly aligned",
     "ECU", "top_down", "static", "moscow_day", False, True,
     "каждый камешек ложился точно на своё место."),
    ("CH04_SH04", "ZAKAZCHIK", "mansion",
     "a silver-haired wealthy client in an expensive suit strolling in to inspect the work, hands behind his back, cold appraising look",
     "MS", "low", "static", "moscow_day", False, False,
     "сам хозяин особняка приходил смотреть на работу."),
    ("CH04_SH05", ("BAKHTI", "ZAKAZCHIK"), "mansion",
     "Bakhti on the left kneeling at the tilework, the wealthy client on the right pointing critically at the wall and frowning",
     "MS", "eye", "static", "moscow_day", False, False,
     "тыкал пальцем, переделай тут, мне не нравится."),
    ("CH04_SH06", "ZAKAZCHIK", "mansion",
     "extreme close-up of the client's wrist as he gestures, a heavy gold luxury watch catching the light",
     "ECU", "eye", "static", "moscow_day", False, True,
     "на руке у него часы стоили дороже всего, что я заработаю за жизнь."),
    ("CH04_SH07", "BAKHTI", "mansion",
     "close-up of the master lowering his eyes and nodding silently, returning to the wall",
     "CU", "eye", "static", "moscow_day", False, False,
     "на меня он смотрел сквозь, как сквозь стекло."),
    ("CH04_SH08", ("BAKHTI", "ZAKAZCHIK"), "mansion",
     "Bakhti on the left bent over his work, the client on the right walking past behind him without a glance, on his phone",
     "MS", "eye", "pan", "moscow_day", False, False,
     "я знал его дом до последней плитки, а он не знал моего имени."),
    ("CH04_SH09", None, "mansion",
     "wide shot of the finished gleaming mosaic hammam, flawless and glowing, no people",
     "WS", "eye", "push_in", "moscow_day", True, False,
     "я сделал ему красоту, какой он и не заслужил."),
    ("CH04_SH10", "BAKHTI", "mansion",
     "the master packing his tile tools into a worn bag, the job done, quiet pride and exhaustion",
     "MCU", "high", "static", "moscow_day", False, False,
     "собрал инструмент и пошёл, как всегда."),
    ("CH04_SH11", None, "mansion",
     "close-up of a careless hand tossing a folded stack of cash onto a marble ledge without looking, a tool bag below",
     "CU", "high", "static", "moscow_day", False, False,
     "заплатил не глядя, имени так и не спросил."),
    ("CH04_SH12", "BAKHTI", "mansion",
     "close-up of the master pausing at the door to look back once at the opulent mansion",
     "CU", "eye", "static", "moscow_day", False, True,
     "я запомнил его лицо, а он моё нет, и зря."),
]

if __name__ == "__main__":
    seed_act(4, "moscow_grey_gold", MOOD, "animated", "CH04 Client", SHOTS)
