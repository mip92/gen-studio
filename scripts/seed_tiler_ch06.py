# -*- coding: utf-8 -*-
"""Seed CH06 — Облава (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "harsh cold institutional fear, grey-green raid light, claustrophobic dread"

SHOTS = [
    ("CH06_SH01", None, "mstreet",
     "wide B-roll of grey police and migration-service vans pulling up fast outside a Moscow construction site at dawn, flashing lights, no clear faces",
     "WS", "high", "static", "moscow_day", True, False, ""),
    ("CH06_SH02", "BAKHTI", "mansion",
     "the master kneeling at his tilework suddenly freezing and looking up as a commotion erupts, trowel still in hand",
     "MCU", "eye", "static", "moscow_day", False, False,
     "однажды утром на объект нагрянула миграционная служба."),
    ("CH06_SH03", None, "mansion",
     "wide shot of officers in vests storming into a half-built hall, workers scattering, harsh movement, faces in shadow",
     "WS", "low", "pan", "moscow_day", True, False,
     "проверка документов, всех к стене, не двигаться."),
    ("CH06_SH04", "BAKHTI", "mansion",
     "the master fumbling in his jacket for his papers, hands unsteady, an officer looming over him",
     "MS", "eye", "static", "moscow_day", False, False,
     "патент просрочен, посредник не продлил, как обещал."),
    ("CH06_SH05", None, "mansion",
     "extreme close-up of a crumpled migration patent paper in a worker's hand as a gloved officer's hand snatches it",
     "ECU", "top_down", "static", "moscow_day", False, True,
     "одна просроченная бумажка, и ты уже никто."),
    ("CH06_SH06", "BAKHTI", "migra",
     "the master being herded with other detained men down a corridor, hands at his sides, head low",
     "MS", "eye", "pan", "moscow_day", False, False,
     "нас погрузили и повезли в отделение."),
    ("CH06_SH07", None, "migra",
     "wide shot of men crammed behind a holding cage in a bleak migration office, dim and airless, faces obscured",
     "WS", "high", "static", "moscow_day", False, False,
     "согнали в обезьянник, духота, чужие испуганные лица."),
    ("CH06_SH08", "BAKHTI", "migra",
     "the master gripping the bars of the holding cage with both hands, knuckles pale",
     "MCU", "eye", "static", "moscow_day", False, False,
     "я держался за решётку и считал, сколько потеряю."),
    ("CH06_SH09", "BAKHTI", "migra",
     "extreme close-up of the master's tense face pressed near the cage bars, eyes wide with dread",
     "ECU", "eye", "static", "moscow_day", False, True,
     "боялся я не тюрьмы, боялся депортации."),
    ("CH06_SH10", None, "migra",
     "close-up of an official stamp slamming down onto a stack of detainee papers under a desk lamp",
     "CU", "top_down", "static", "moscow_day", False, False,
     "один штамп решал всю мою жизнь."),
    ("CH06_SH11", "BAKHTI", "migra",
     "medium close-up of the master staring at nothing, picturing the ruin of being sent home empty-handed",
     "MCU", "eye", "push_in", "moscow_day", False, False,
     "вышлют, вернусь нищим, и всё зря, годы, дом, долг за дорогу."),
    ("CH06_SH12", None, "migra",
     "wide low B-roll of a barred grey window with cold daylight, the room in shadow, no people",
     "WS", "low", "static", "moscow_day", True, False, ""),
]

if __name__ == "__main__":
    seed_act(6, "raid_cold", MOOD, "animated", "CH06 Raid", SHOTS)
