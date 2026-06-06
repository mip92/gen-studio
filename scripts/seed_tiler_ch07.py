# -*- coding: utf-8 -*-
"""Seed CH07 — Сделка: депортация или объект (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold menacing institutional gloom, faceless authority, a trap closing"

SHOTS = [
    ("CH07_SH01", "KURATOR", "migra",
     "a cold suited security curator in dark sunglasses stepping into the holding room, unhurried, an earpiece coiled at his collar",
     "MS", "low", "push_in", "night", False, False,
     "и тут появился человек в костюме, тихий, как стена."),
    ("CH07_SH02", ("KURATOR", "BAKHTI"), "migra",
     "the curator on the left leaning across a metal table, Bakhti on the right listening tensely, a single lamp between them",
     "MS", "eye", "static", "night", False, True,
     "выбор простой, сказал он, депортация или особый объект."),
    ("CH07_SH03", "RUSTAM", "migra",
     "close-up of the moustached broker's evasive face as he translates, looking away, wringing his cap",
     "CU", "eye", "static", "night", False, False,
     "рустам переводил и в глаза не смотрел, сам всё знал."),
    ("CH07_SH04", None, "migra",
     "extreme close-up of a dense non-disclosure document and a pen being slid across a metal table toward a worker's hands",
     "ECU", "top_down", "static", "night", False, True,
     "подписку дали, а прочитать не дали."),
    ("CH07_SH05", "BAKHTI", "migra",
     "the master signing the document with a shaking hand, jaw set, surrendering",
     "MCU", "eye", "static", "night", False, True,
     "я подписал бумагу, которую не мог прочитать."),
    ("CH07_SH06", None, "migra",
     "extreme close-up of a passport and a phone being dropped into a sealed plastic box and a lid closing",
     "ECU", "top_down", "static", "night", False, True,
     "паспорт и телефон забрали, до выезда, сказали."),
    ("CH07_SH07", "BAKHTI", "migra",
     "the master being led out by the elbow toward a dark exit, shoulders hunched",
     "MS", "eye", "pan", "night", False, False,
     "и повели."),
    ("CH07_SH08", None, "objext",
     "wide shot of a bus with fully blacked-out taped windows idling under a floodlight at night, exhaust steaming, no people",
     "WS", "eye", "static", "night", True, False,
     "автобус с заклеенными окнами ждал во дворе."),
    ("CH07_SH09", "BAKHTI", "objext",
     "the master climbing into the dim interior of the blacked-out bus and sitting among silent shapes of other men",
     "MS", "high", "static", "night", False, False,
     "набили нас полный салон, и тронулись в темноту."),
    ("CH07_SH10", "BAKHTI", "objext",
     "extreme close-up of the master's hand resting against a black-taped bus window, a thin sliver of road light at the edge",
     "ECU", "eye", "static", "night", False, False,
     "куда везут, не знал никто из нас."),
    ("CH07_SH11", None, "objext",
     "medium shot of the dark bus interior, silent men's silhouettes, a thin sliver of road light crossing them, no clear faces",
     "MS", "eye", "static", "night", True, False, ""),
    ("CH07_SH12", "BAKHTI", "objext",
     "close-up of the master's face lit by the thin window sliver in the dark bus, eyes open, resigned",
     "CU", "eye", "static", "night", False, True,
     "тогда я понял, я подписал свои руки и свой рот."),
]

if __name__ == "__main__":
    seed_act(7, "object_marble_cold", MOOD, "animated", "CH07 Deal", SHOTS)
