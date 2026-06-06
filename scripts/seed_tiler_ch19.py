# -*- coding: utf-8 -*-
"""Seed CH19 — Грязное, намёком (no graphic content; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "blurred golden decadent gloom glimpsed through a door crack, morning-after wreckage"

SHOTS = [
    ("CH19_SH01", None, "party",
     "wide shot of an opulent upper salon at night glimpsed through a doorway, golden light, blurred figures, scaffolding and construction tarps in the adjacent unfinished halls",
     "WS", "eye", "static", "object_night", True, False,
     "объект ещё стоял в лесах, а в бассейнах, что мы выложили, уже гремела их аквадискотека, гуляли так, что стены дрожали."),
    ("CH19_SH02", "BAKHTI", "party",
     "the master passing in a dark corridor, catching a sliver of the party through a cracked door",
     "MS", "eye", "static", "object_night", False, False,
     "я видел в щель, не всё, обрывками."),
    ("CH19_SH03", None, "party",
     "close-up of a table strewn with champagne bottles and crystal glasses, no people",
     "CU", "high", "static", "object_night", True, False,
     "шампанское рекой, дорогое, по бокалам."),
    ("CH19_SH04", None, "party",
     "extreme close-up of a folded banknote and a glass tabletop suggesting hidden vice, deliberately discreet, no faces",
     "ECU", "top_down", "static", "object_night", False, True,
     "когда взрослый мужик сворачивает деньги в трубочку, перевод не нужен."),
    ("CH19_SH05", None, "party",
     "medium shot of women's silhouettes being led into the salon through a far door, discreet, no clear faces",
     "MS", "eye", "static", "object_night", True, False,
     "и когда девочек привозят, как привозят мрамор, тоже."),
    ("CH19_SH06", "BAKHTI", "party",
     "close-up of the master looking away from the door, jaw tight, uneasy",
     "CU", "eye", "static", "object_night", False, False,
     "я отводил глаза, не моё это, не моего ума дело."),
    ("CH19_SH07", None, "party",
     "wide blurred shot of the decadent party in motion, smeared golden light, no clear faces",
     "WS", "low", "static", "object_night", True, False, ""),
    ("CH19_SH08", None, "party",
     "wide morning shot of the wrecked salon, overturned glasses, spilled bottles, grey daylight, no people",
     "WS", "high", "static", "object_day", True, False,
     "а утром всё это убирал я."),
    ("CH19_SH09", "BAKHTI", "party",
     "the master on his knees mopping the marble floor of the wrecked salon",
     "MS", "high", "static", "object_day", False, False,
     "своими золотыми руками я драил чужой разврат."),
    ("CH19_SH10", "BAKHTI", "party",
     "low-angle extreme close-up of the master's hands wiping down a smeared glass table",
     "ECU", "low", "static", "object_day", False, False,
     "оттирал с мрамора то, чего стыдно сказать словами."),
    ("CH19_SH11", "BAKHTI", "party",
     "close-up of the master's tired disgusted face",
     "CU", "eye", "static", "object_day", False, False,
     "и думал, вот, значит, на что уходят те миллиарды."),
    ("CH19_SH12", None, "party",
     "wide shot of the cleaned salon gleaming in cold morning sun, as if nothing happened, no people",
     "WS", "eye", "push_in", "object_day", True, False, ""),
]

if __name__ == "__main__":
    seed_act(19, "object_party_dark", MOOD, "static", "CH19 Debauchery", SHOTS)
