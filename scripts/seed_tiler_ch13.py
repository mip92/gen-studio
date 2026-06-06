# -*- coding: utf-8 -*-
"""Seed CH13 — «Португальские мастера» (the name theft; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold opulent marble light, bitter dramatic irony, glossy brochure sheen"

SHOTS = [
    ("CH13_SH01", None, "marble",
     "medium shot of a glossy luxury project brochure lying open on a marble ledge in the grand hall, no people",
     "MS", "high", "static", "object_day", True, False,
     "однажды я увидел их буклет, оставленный на подоконнике."),
    ("CH13_SH02", None, "marble",
     "extreme close-up of a brochure line reading hand-laid by elite portuguese masters, 450 euro per square metre",
     "ECU", "top_down", "push_in", "object_day", False, True,
     "ручная работа португальских мастеров, четыреста пятьдесят евро за метр."),
    ("CH13_SH03", "BAKHTI", "marble",
     "medium close-up of the master staring at the brochure, a slow sting of understanding crossing his face",
     "MCU", "eye", "static", "object_day", False, False,
     "я ещё не всё понял, но укололо."),
    ("CH13_SH04", None, "marble",
     "extreme close-up of a brochure photo of a smiling fake european craftsman labelled with a foreign name, no real person",
     "ECU", "eye", "static", "object_day", False, False,
     "и фото какого-то жоао, которого никогда не было."),
    ("CH13_SH05", None, "marble",
     "wide shot of the security curator walking a suited guest across the gleaming floor the master laid that morning",
     "WS", "eye", "pan", "object_day", False, False,
     "куратор водил гостя по полу, что я выложил на рассвете."),
    ("CH13_SH06", ("KURATOR", "BAKHTI"), "marble",
     "the curator on the left gesturing proudly at the floor, Bakhti on the right in the background with a grout bucket, head down",
     "MS", "eye", "static", "object_day", False, True,
     "это португальцы, говорил он, лучшие в европе, эксклюзив."),
    ("CH13_SH07", "BAKHTI", "marble",
     "medium shot of the master three metres away with his grout bucket, eyes lowered, saying nothing",
     "MS", "eye", "static", "object_day", False, False,
     "я стоял в трёх метрах с ведром затирки и молчал."),
    ("CH13_SH08", "BAKHTI", "marble",
     "extreme close-up of the master's calloused hands working grout into a seam",
     "ECU", "top_down", "static", "object_day", False, False,
     "я и был тот португалец."),
    ("CH13_SH09", "BAKHTI", "marble",
     "close-up of the master's bitter swallowing face",
     "CU", "eye", "static", "object_day", False, False,
     "и узбек, и никто, всё сразу."),
    ("CH13_SH10", None, "marble",
     "wide shot of the vast gilded hall, beautiful and lying, no people",
     "WS", "low", "static", "object_day", True, False,
     "деда звали мастером всего самарканда."),
    ("CH13_SH11", "BAKHTI", "marble",
     "medium close-up of the master looking down at his own hands, then at the floor",
     "MCU", "eye", "static", "object_day", False, True,
     "а меня переписали в жоао и продали втридорога."),
    ("CH13_SH12", None, "marble",
     "close-up of the glossy brochure beside the real flawless marble seam, no people",
     "CU", "high", "static", "object_day", True, False, ""),
]

if __name__ == "__main__":
    seed_act(13, "object_marble_cold", MOOD, "static", "CH13 Portuguese", SHOTS)
