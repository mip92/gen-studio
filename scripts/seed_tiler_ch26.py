# -*- coding: utf-8 -*-
"""Seed CH26 — Завод, рабство (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "red kiln-hell glow, choking heat, enslavement, no way out"

SHOTS = [
    ("CH26_SH01", None, "kiln",
     "medium shot of the master coming to on the ground in a hellish orange kiln glow, heat haze, no clear face",
     "MS", "low", "static", "kiln_day_now", False, True,
     "очнулся я не в больнице."),
    ("CH26_SH02", None, "kiln",
     "wide shot of a grim brick-making factory yard with kilns and mounds of red clay, no clear faces",
     "WS", "high", "push_in", "kiln_day_now", True, True,
     "а в дагестане, на кирпичном заводе."),
    ("CH26_SH03", "BAKHTI", "kiln",
     "medium shot of the master sprawled in red clay, dazed and disoriented",
     "MS", "high", "static", "kiln_day_now", False, False,
     "ни документов, ни денег, ни даже имени."),
    ("CH26_SH04", None, "kiln",
     "wide shot of a high blank brick wall topped with wire enclosing the factory yard, no people",
     "WS", "low", "static", "kiln_day_now", True, False,
     "забор, проволока, собаки, не уйти."),
    ("CH26_SH05", "BAKHTI", "kiln",
     "the master being shoved toward a wheelbarrow and made to work, head down",
     "MS", "eye", "static", "kiln_day_now", False, False,
     "работай, сказали, ешь и спи вот тут, и не дёргайся."),
    ("CH26_SH06", "BAKHTI", "kiln",
     "extreme close-up of red clay caking into the master's once-skilled hands",
     "ECU", "top_down", "static", "kiln_day_now", False, True,
     "руки, что клали мрамор, теперь месили глину."),
    ("CH26_SH07", None, "kiln",
     "wide shot of other hollow-eyed enslaved workers hauling bricks in the heat, faces in shadow",
     "WS", "eye", "static", "kiln_day_now", True, False,
     "таких, как я, тут было много, все без вести пропавшие."),
    ("CH26_SH08", "BAKHTI", "kiln",
     "the master carrying a heavy stack of raw bricks, bent under the weight",
     "MS", "low", "static", "kiln_day_now", False, False,
     "за воду и кусок хлеба, без конца и без срока."),
    ("CH26_SH09", None, "kiln",
     "close-up of the kiln's glowing orange mouth radiating waves of heat, no people",
     "CU", "eye", "static", "kiln_day_now", True, False,
     "у этих печей я и грелся, и горел."),
    ("CH26_SH10", "BAKHTI", "kiln",
     "medium close-up of the master cowering as an overseer's shadow falls over him, no graphic violence",
     "MCU", "low", "static", "kiln_day_now", False, False,
     "кто роптал, того били, я научился молчать."),
    ("CH26_SH11", "BAKHTI", "kiln",
     "extreme close-up of the turquoise shard hidden in the master's red-stained fist",
     "ECU", "eye", "static", "kiln_day_now", False, True,
     "осколок я прятал на груди, последнее моё."),
    ("CH26_SH12", "BAKHTI", "kiln",
     "close-up of the master's hollowed face lit red by the kiln",
     "CU", "eye", "static", "kiln_night_now", False, True,
     "я искал кассу, а нашёл печь, теперь ты раб."),
]

if __name__ == "__main__":
    seed_act(26, "kiln_red_now", MOOD, "static", "CH26 Factory", SHOTS)
