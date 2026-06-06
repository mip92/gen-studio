# -*- coding: utf-8 -*-
"""Seed CH24 — Дорога через ничто (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "blistering bleached steppe sun, delirium and endurance, heat haze"

SHOTS = [
    ("CH24_SH01", None, "steppe",
     "extreme wide shot of a tiny lone figure crossing cracked sun-baked earth, shimmering heat haze, no other people",
     "EWS", "high", "static", "steppe_day", True, True,
     "я шёл день, потом ещё один."),
    ("CH24_SH02", "BAKHTI", "steppe",
     "extreme close-up of cracked sunburnt lips and a swollen tongue, parched",
     "ECU", "eye", "static", "steppe_day", False, False,
     "пить хотелось так, что язык не помещался во рту."),
    ("CH24_SH03", "BAKHTI", "steppe",
     "medium shot of the master staggering forward, one hand shielding his eyes from the sun",
     "MS", "eye", "static", "steppe_day", False, False,
     "солнце било в темя, как молотом."),
    ("CH24_SH04", "BAKHTI", "steppe",
     "medium close-up of the master mumbling to no one, delirious, half-smiling at ghosts",
     "MCU", "eye", "static", "steppe_day", False, False,
     "я говорил с отцом, с азизом, будто они шли рядом."),
    ("CH24_SH05", "BAKHTI", "steppe",
     "extreme close-up of the turquoise shard pressed to his chest as he walks",
     "ECU", "eye", "static", "steppe_day", False, False,
     "осколок грел ладонь, держи, говорил я себе, держи."),
    ("CH24_SH06", None, "steppe",
     "wide shot of the cold steppe at night, a small huddled figure shivering under stars, no other people",
     "WS", "high", "static", "steppe_night", True, False,
     "ночью я дрожал от холода, а днём горел."),
    ("CH24_SH07", "BAKHTI", "steppe",
     "the master crawling forward on hands and knees across the dust",
     "MS", "low", "static", "steppe_day", False, False,
     "под конец я уже не шёл, а полз."),
    ("CH24_SH08", None, "steppe",
     "extreme wide shot of the endless flat horizon, empty, no people",
     "EWS", "eye", "static", "steppe_day", True, False, ""),
    ("CH24_SH09", "BAKHTI", "steppe",
     "medium close-up of the master lifting his head, eyes catching something far ahead",
     "MCU", "low", "static", "steppe_day", False, False,
     "и на третий день впереди блеснула трасса."),
    ("CH24_SH10", None, "highway",
     "wide shot of a thin grey highway line across the empty flatland, telegraph poles, no people",
     "WS", "eye", "push_in", "highway_dusk", True, False,
     "тонкая серая нитка, а на ней, может, спасение."),
    ("CH24_SH11", "BAKHTI", "highway",
     "the master stumbling the last metres toward the roadside, legs giving out",
     "MS", "eye", "static", "highway_dusk", False, False,
     "последние силы я бросил на эти метры."),
    ("CH24_SH12", "BAKHTI", "highway",
     "close-up of the master's cracked face turned to the road, waiting",
     "CU", "eye", "static", "highway_dusk", False, False,
     "и сел у обочины ждать."),
]

if __name__ == "__main__":
    seed_act(24, "steppe_bleached", MOOD, "static", "CH24 Road", SHOTS)
