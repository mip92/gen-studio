# -*- coding: utf-8 -*-
"""Seed CH28 — Эхо дворца (the listener arrives; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "red kiln glow, a new arrival, the bitter weight of being unknown"

SHOTS = [
    ("CH28_SH01", None, "kiln",
     "wide shot of a battered truck unloading a few exhausted new men into the brick factory yard at dusk, no clear faces",
     "WS", "high", "static", "kiln_night_now", True, False,
     "однажды привезли новых, как когда-то привезли меня."),
    ("CH28_SH02", None, "kiln",
     "medium shot of a frightened young newcomer clutching a cracked phone among the new arrivals, face in shadow",
     "MS", "eye", "static", "kiln_night_now", True, False,
     "среди них был и ты, всё жался к стене, как побитый щенок."),
    ("CH28_SH03", None, "kiln",
     "close-up of the frightened newcomer hugging his knees by the fire, reminding the master of his younger self",
     "CU", "eye", "static", "kiln_night_now", False, False,
     "ты сказал, что и сам клал плитку, дома, у себя, и что-то во мне ёкнуло."),
    ("CH28_SH04", "BAKHTI", "kiln",
     "medium close-up of the master at the clay trough going still, something flickering behind his eyes",
     "MCU", "eye", "static", "kiln_night_now", False, False,
     "я мешал глину и молчал."),
    ("CH28_SH05", "BAKHTI", "kiln",
     "extreme close-up of the master's red clay-caked hands stopping mid-motion",
     "ECU", "top_down", "static", "kiln_night_now", False, False,
     "руки сами замерли."),
    ("CH28_SH06", "BAKHTI", "kiln",
     "close-up of the master's distant firelit face, knowing exactly whose work that is",
     "CU", "low", "static", "kiln_night_now", False, True,
     "потом, говорят, ту аквадискотеку показали на весь мир, скандал, воровство, а про руки, что её выложили, ни слова."),
    ("CH28_SH07", None, "kiln",
     "medium shot of the kiln fire area crackling in the dark, no people",
     "MS", "eye", "static", "kiln_night_now", True, False, ""),
    ("CH28_SH08", "BAKHTI", "kiln",
     "medium close-up of the master, bitter and quiet",
     "MCU", "eye", "static", "kiln_night_now", False, False,
     "а под их мрамором лежит моя бирюза с моим именем."),
    ("CH28_SH09", None, "kiln",
     "wide shot of endless rows of drying bricks fading into red gloom, no people",
     "WS", "high", "static", "kiln_night_now", True, False,
     "они ходят по мне и не знают."),
    ("CH28_SH10", "BAKHTI", "kiln",
     "close-up of the master's hollow firelit eyes",
     "CU", "eye", "static", "kiln_night_now", False, True,
     "и никто никогда не придёт за рабом, что построил дворец."),
]

if __name__ == "__main__":
    seed_act(28, "kiln_red_now", MOOD, "static", "CH28 Echo", SHOTS)
