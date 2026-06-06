# -*- coding: utf-8 -*-
"""Seed CH18 — Подслушанная сделка (he can't understand; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "low gold terrace light at night, murmured power, fragments not understood"

SHOTS = [
    ("CH18_SH01", None, "fountain",
     "wide night shot of suited guests gathered murmuring around a lit fountain terrace, drinks in hand, no clear faces",
     "WS", "eye", "static", "object_night", True, False,
     "ещё кругом леса и стройка, а они уже съезжались к фонтану по ночам, говорили вполголоса."),
    ("CH18_SH02", "BAKHTI", "fountain",
     "the master sweeping nearby with a broom, head down, ears straining",
     "MS", "eye", "static", "object_night", False, False,
     "я подметал рядом и ловил два слова из десяти."),
    ("CH18_SH03", None, "fountain",
     "over-the-shoulder past the guests at a table of papers, a handshake closing over them, no faces",
     "OTS", "over_shoulder", "static", "object_night", False, False,
     "бумаги, рукопожатия, какой-то завод, какой-то город."),
    ("CH18_SH04", None, "fountain",
     "close-up of documents and a folded wad of cash being slid across the table, no people",
     "CU", "top_down", "static", "object_night", False, False,
     "деньги переходили из руки в руку, не считая."),
    ("CH18_SH05", "BAKHTI", "fountain",
     "close-up of the master's furrowed face, not following the language",
     "CU", "eye", "static", "object_night", False, False,
     "я не понимал слов, русский знал через пень-колоду."),
    ("CH18_SH06", None, "fountain",
     "medium shot of the guests laughing and clinking glasses, deciding something easily, no clear faces",
     "MS", "eye", "static", "object_night", True, False,
     "они смеялись и решали чью-то судьбу между тостами."),
    ("CH18_SH07", "BAKHTI", "fountain",
     "medium close-up of the master glancing sideways, uneasy, sensing the weight of it",
     "MCU", "eye", "static", "object_night", False, False,
     "но нутром чуял, тут ломают что-то большое."),
    ("CH18_SH08", None, "fountain",
     "wide shot of the coloured fountain water rising behind the murmuring figures, no clear faces",
     "WS", "low", "static", "object_night", True, False, ""),
    ("CH18_SH09", "BAKHTI", "bytovka",
     "close-up of the master later lying awake, piecing the fragments together in hindsight",
     "CU", "low", "static", "object_night", False, False,
     "а через год где-то и вправду закрылся завод."),
    ("CH18_SH10", None, "mstreet",
     "wide B-roll of a dead provincial Russian factory, rusted gates, broken windows, no people",
     "WS", "eye", "static", "moscow_grey", True, True,
     "и пацаны оттуда поехали в москву класть кому-то плитку."),
    ("CH18_SH11", "BAKHTI", "bytovka",
     "medium close-up of the master's grim understanding face",
     "MCU", "eye", "static", "object_night", False, False,
     "тот же круг, что закинул сюда и меня."),
    ("CH18_SH12", None, "fountain",
     "close-up of the empty terrace at dawn, abandoned glasses, water still, no people",
     "CU", "eye", "static", "object_day", True, False, ""),
]

if __name__ == "__main__":
    seed_act(18, "object_aqua_glow", MOOD, "static", "CH18 Overheard", SHOTS)
