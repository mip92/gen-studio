# -*- coding: utf-8 -*-
"""Seed CH21 — Обещание большой зарплаты (false hope; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold marble, a false warm glow of hope, evening light"

SHOTS = [
    ("CH21_SH01", None, "marble",
     "wide shot of the finished gleaming palace hall, all marble laid, scaffolding gone, no people",
     "WS", "eye", "push_in", "object_evening", True, False,
     "объект сдавали, мрамор лёг до последней плиты."),
    ("CH21_SH02", "BAKHTI", "marble",
     "medium close-up of the master standing back, surveying his finished work, bone-tired pride",
     "MCU", "eye", "static", "object_evening", False, False,
     "я выложил его весь, своими руками, от и до."),
    ("CH21_SH03", ("KURATOR", "BAKHTI"), "marble",
     "the curator on the left clapping Bakhti on the right on the shoulder, all smiles for once",
     "MS", "eye", "static", "object_evening", False, False,
     "получишь всё разом на выезде, сказал куратор, большой расчёт, заработал."),
    ("CH21_SH04", "BAKHTI", "marble",
     "close-up of the master's face lighting up with hope at the promise",
     "CU", "eye", "static", "object_evening", False, False,
     "та самая сумма, ради которой я терпел всё."),
    ("CH21_SH05", "BAKHTI", "bytovka",
     "medium close-up of the master on a borrowed phone, beaming, telling his family he is coming home",
     "MCU", "eye", "static", "object_evening", False, False,
     "я позвонил домой, возвращаюсь, теперь заживём по-человечески."),
    ("CH21_SH06", None, "bytovka",
     "insert close-up of a phone screen showing the overjoyed wife and the finished house, no clear face",
     "CU", "eye", "static", "object_evening", True, False,
     "нигора плакала от счастья в трубку."),
    ("CH21_SH07", "BAKHTI", "bytovka",
     "the master folding his few things into his bag, counting the days, eager",
     "MS", "high", "static", "object_evening", False, False,
     "я считал часы до дороги домой."),
    ("CH21_SH08", "BAKHTI", "bytovka",
     "extreme close-up of the master carefully wrapping the turquoise shard, ready to take it home at last",
     "ECU", "top_down", "static", "object_evening", False, False,
     "осколок завернул бережно, скоро покажу его дома."),
    ("CH21_SH09", "BAKHTI", "bytovka",
     "close-up of the master's hopeful face in the evening light",
     "CU", "eye", "static", "object_evening", False, True,
     "иншаллах, думал я, всё было не зря."),
    ("CH21_SH10", None, "objext",
     "wide B-roll of a car waiting in the dusk by the site gate, engine running, no people",
     "WS", "eye", "static", "object_evening", True, False, ""),
]

if __name__ == "__main__":
    seed_act(21, "object_marble_cold", MOOD, "static", "CH21 Promise", SHOTS)
