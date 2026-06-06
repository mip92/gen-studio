# -*- coding: utf-8 -*-
"""Seed CH22 — Пустыня, выстрел (no graphic violence; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "black steppe night, headlights and dread, cold and final"

SHOTS = [
    ("CH22_SH01", "BAKHTI", "steppe",
     "the master sitting in the back of a car at night, two silent men in front, uneasy",
     "MS", "eye", "static", "steppe_night", False, False,
     "вместо кассы меня посадили в машину и повезли."),
    ("CH22_SH02", None, "steppe",
     "wide shot of car headlights cutting across an empty black steppe road, no people",
     "WS", "eye", "static", "steppe_night", True, False,
     "ехали долго, не к городу, а в степь, в темноту."),
    ("CH22_SH03", "BAKHTI", "steppe",
     "medium close-up of the master in the back seat, dread rising in his face",
     "MCU", "eye", "static", "steppe_night", False, False,
     "что-то было не так, и я это чуял всем нутром."),
    ("CH22_SH04", None, "steppe",
     "wide shot of the car stopped in the middle of nowhere, doors open, dark figures, no clear faces",
     "WS", "low", "static", "steppe_night", True, False,
     "машина встала посреди ничего."),
    ("CH22_SH05", None, "steppe",
     "medium shot of two men talking low to each other beside the car, faces in shadow",
     "MS", "eye", "static", "steppe_night", False, False,
     "они говорили между собой, я не понимал ни слова."),
    ("CH22_SH06", "BAKHTI", "steppe",
     "close-up of the master's confused frightened face in the dark",
     "CU", "eye", "static", "steppe_night", False, False,
     "только тон, и тон был очень плохой."),
    ("CH22_SH07", None, "steppe",
     "medium shot of two men's silhouettes by the car, one drawing a pistol against the night sky, no gore",
     "MS", "low", "static", "steppe_night", False, True,
     "а потом достали пистолет."),
    ("CH22_SH08", "BAKHTI", "steppe",
     "close-up of the master's face in the instant of understanding",
     "CU", "eye", "static", "steppe_night", False, True,
     "вот это переводить не надо, пистолет понятен на всех языках."),
    ("CH22_SH09", None, "steppe",
     "wide shot of two tiny figures by headlights, one raising a pistol silhouette toward the other, no gore",
     "WS", "low", "static", "steppe_night", False, True,
     ""),
    ("CH22_SH10", "BAKHTI", "steppe",
     "extreme close-up of the master's fist clenching the turquoise shard",
     "ECU", "eye", "static", "steppe_night", False, False,
     "я сжал осколок и успел подумать о сыне."),
    ("CH22_SH11", None, "steppe",
     "wide near-black shot of the steppe, a single faint muzzle flash at the edge of darkness, no gore, no people visible",
     "WS", "eye", "static", "steppe_night", False, True,
     "выстрел."),
    ("CH22_SH12", None, "steppe",
     "a black frame, total darkness",
     "ECU", "eye", "static", "steppe_night", False, False, ""),
]

if __name__ == "__main__":
    seed_act(22, "steppe_black", MOOD, "static", "CH22 Desert", SHOTS)
