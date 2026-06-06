# -*- coding: utf-8 -*-
"""Seed CH25 — Спасение, которое хуже (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "dusk roadside relief turning quietly ominous, dim headlights"

SHOTS = [
    ("CH25_SH01", None, "highway",
     "wide shot of a pair of headlights slowing on the dusk highway beside a slumped roadside figure, no clear faces",
     "WS", "eye", "static", "highway_dusk", True, False,
     "к ночи затормозила машина."),
    ("CH25_SH02", "BAKHTI", "highway",
     "the master lifting a trembling hand toward the stopped car, desperate hope",
     "MS", "low", "static", "highway_dusk", False, False,
     "я протянул руку, помогите, ради бога."),
    ("CH25_SH03", None, "highway",
     "medium close-up of a stranger's hand reaching out of the car offering a plastic bottle of water, face unseen",
     "MCU", "eye", "static", "highway_dusk", False, False,
     "дали воды, и я пил, захлёбываясь."),
    ("CH25_SH04", "BAKHTI", "highway",
     "extreme close-up of the master's shaking hands clutching the water bottle to his mouth",
     "ECU", "eye", "static", "highway_dusk", False, False,
     "и плакал, как плакал всю жизнь, от благодарности."),
    ("CH25_SH05", "BAKHTI", "highway",
     "close-up of the master weeping with relief and gratitude, broken",
     "CU", "eye", "static", "highway_dusk", False, True,
     "спасибо, спасибо, твердил я на своём языке."),
    ("CH25_SH06", "BAKHTI", "highway",
     "medium shot of the master being helped into the back of the car, the world blurring",
     "MS", "eye", "static", "highway_dusk", False, False,
     "меня усадили, и я отключился, думал, спасён."),
    ("CH25_SH07", "BAKHTI", "highway",
     "close-up of the master's exhausted eyes slowly closing",
     "CU", "eye", "static", "highway_dusk", False, False,
     "вот дурак, я опять поверил чужим людям."),
    ("CH25_SH08", None, "highway",
     "a slow fade to black frame, faint engine sound implied, no people",
     "ECU", "eye", "static", "highway_dusk", False, False, ""),
]

if __name__ == "__main__":
    seed_act(25, "steppe_bleached", MOOD, "static", "CH25 Pickup", SHOTS)
