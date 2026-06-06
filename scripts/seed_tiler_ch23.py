# -*- coding: utf-8 -*-
"""Seed CH23 — Он жив (left for dead; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "harsh bleached dawn over the steppe, abandoned for dead, dried blood and dust"

SHOTS = [
    ("CH23_SH01", None, "steppe",
     "extreme close-up of a man's eye slowly opening, dried blood and dust on the temple, ants crossing the ground nearby, no gore",
     "ECU", "eye", "static", "steppe_dawn", False, True,
     "я очнулся через часы, а может, через сутки."),
    ("CH23_SH02", "BAKHTI", "steppe",
     "wide shot of the master lying crumpled on the cracked steppe ground at dawn, alone",
     "WS", "high", "static", "steppe_dawn", False, False,
     "голова раскалывалась, кровь на виске засохла коркой."),
    ("CH23_SH03", None, "steppe",
     "extreme wide shot of the empty steppe stretching to the horizon in every direction, no people",
     "EWS", "eye", "static", "steppe_dawn", True, False,
     "вокруг ни машины, ни человека, ни капли воды."),
    ("CH23_SH04", "BAKHTI", "steppe",
     "medium close-up of the master gingerly touching the grazing wound on his head, dazed",
     "MCU", "eye", "static", "steppe_dawn", False, False,
     "пуля прошла вскользь, а меня бросили как мёртвого."),
    ("CH23_SH05", None, "steppe",
     "close-up of empty turned-out pockets, no phone, no documents, no people's faces",
     "CU", "top_down", "static", "steppe_dawn", False, False,
     "ни телефона, ни паспорта, ни денег, ничего."),
    ("CH23_SH06", "BAKHTI", "steppe",
     "the master struggling up onto his hands and knees, then to his feet, swaying",
     "MS", "low", "static", "steppe_dawn", False, False,
     "я поднялся, сам не знаю, какими силами."),
    ("CH23_SH07", "BAKHTI", "steppe",
     "extreme close-up of the turquoise shard still clenched in his dirt-caked fist",
     "ECU", "eye", "static", "steppe_dawn", False, True,
     "только осколок не отняли, он так и был в кулаке."),
    ("CH23_SH08", "BAKHTI", "steppe",
     "the master taking his first unsteady steps across the cracked earth",
     "MS", "eye", "pan", "steppe_day", False, False,
     "и я пошёл, куда глаза глядят."),
    ("CH23_SH09", None, "steppe",
     "extreme wide shot of one tiny staggering figure crossing the vast empty steppe under a huge sky",
     "EWS", "high", "static", "steppe_day", True, True,
     "они меня вычеркнули, даже добивать не стали."),
    ("CH23_SH10", "BAKHTI", "steppe",
     "medium shot of the master trudging away into the heat haze, growing smaller",
     "MS", "eye", "static", "steppe_day", False, False,
     "дешевле пули я для них стоил."),
]

if __name__ == "__main__":
    seed_act(23, "steppe_bleached", MOOD, "static", "CH23 Alive", SHOTS)
