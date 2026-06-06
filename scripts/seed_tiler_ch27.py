# -*- coding: utf-8 -*-
"""Seed CH27 — Без вести, Риштан (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "warm Rishtan turquoise light haunted by an absence, an empty chair"

SHOTS = [
    ("CH27_SH01", None, "house",
     "wide shot of the finished modest family house in Rishtan, blue gate, young fruit tree, warm hills behind, no people",
     "WS", "eye", "push_in", "rishtan_day", True, False,
     "а дома стоял мой дом, достроенный, как я и обещал."),
    ("CH27_SH02", "NIGORA", "house",
     "the wife standing in the courtyard gazing down the empty road, waiting",
     "MS", "eye", "static", "rishtan_day", False, False,
     "нигора достроила всё на мои старые переводы."),
    ("CH27_SH03", "AZIZ", "house",
     "close-up of the grown teenage son's worried face lit by his phone",
     "CU", "eye", "static", "rishtan_day", False, False,
     "азиз вырос, выучился, всё, как я хотел."),
    ("CH27_SH04", ("NIGORA", "AZIZ"), "house",
     "Nigora on the left and Aziz on the right sitting silent at the table, a heavy unspoken absence between them",
     "MS", "eye", "static", "rishtan_day", False, False,
     "но муж, отец, уехал в россию и пропал."),
    ("CH27_SH05", None, "house",
     "close-up of a phone screen dialing a number that rings out dead, no people",
     "CU", "top_down", "static", "rishtan_day", False, False,
     "они звонили на мёртвые номера, год за годом."),
    ("CH27_SH06", "AZIZ", "house",
     "the son scrolling through migrant chat groups searching for any word of his father",
     "MCU", "eye", "static", "rishtan_day", False, False,
     "азиз искал по чатам, по землякам, по больницам."),
    ("CH27_SH07", None, "house",
     "close-up of an empty chair left at the family table, untouched, no people",
     "CU", "eye", "static", "rishtan_day", False, True,
     "моё место за столом так и стояло пустым."),
    ("CH27_SH08", "NIGORA", "house",
     "the wife crouching by the unfinished little fountain basin in the yard, touching its dry edge",
     "MS", "high", "static", "rishtan_golden", False, False,
     "фонтан, что я хотел выложить, остался голой чашей."),
    ("CH27_SH09", None, "house",
     "close-up of the empty unfinished fountain basin, dry and bare, no people",
     "CU", "high", "static", "rishtan_golden", True, True,
     "никто не знал, что бирюзу для него я уже выбрал."),
    ("CH27_SH10", "NIGORA", "house",
     "close-up of the wife's face turned to the empty road at dusk, hope thinning",
     "CU", "eye", "static", "rishtan_golden", False, False,
     "дом стоит, сын вырос, а меня для них больше нет."),
]

if __name__ == "__main__":
    seed_act(27, "rishtan_turquoise", MOOD, "static", "CH27 Missing", SHOTS)
