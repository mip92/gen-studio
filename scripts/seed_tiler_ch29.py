# -*- coding: utf-8 -*-
"""Seed CH29 — Финал у печи (diegetic, NO 4th wall; action-first). Idempotent.
The disclaimer is a silent non-diegetic title card added at EXPORT, not a rendered shot."""
from _seed_tiler_act_engine import seed_act

MOOD = "red kiln night, the quiet close of a confession, no address to camera"

SHOTS = [
    ("CH29_SH01", "BAKHTI", "kiln",
     "medium close-up of the master finishing his story by the kiln fire, spent and calm",
     "MCU", "eye", "static", "kiln_night_now", False, False,
     "вот и весь сказ, парень."),
    ("CH29_SH02", "BAKHTI", "kiln",
     "extreme close-up of the master's red clay-stained hands resting still",
     "ECU", "top_down", "static", "kiln_night_now", False, False,
     "сделал бы снова, спросишь, да, дом достроил, сына выучил."),
    ("CH29_SH03", "BAKHTI", "kiln",
     "close-up of the master's firelit face, eyes far away",
     "CU", "eye", "static", "kiln_night_now", False, False,
     "я хотел вернуться и выложить во дворе маленький фонтан, бирюзой, как учил отец."),
    ("CH29_SH04", None, "kiln",
     "wide shot of the dark factory and the glowing kiln, no clear faces",
     "WS", "eye", "static", "kiln_night_now", True, False,
     "чтобы вода текла, как слеза, а не плясала по приказу."),
    ("CH29_SH05", "BAKHTI", "kiln",
     "extreme close-up of the master setting the small turquoise shard on the warm edge of the kiln",
     "ECU", "top_down", "static", "kiln_night_now", False, True,
     "вместо этого вот эта глина."),
    ("CH29_SH06", None, "kiln",
     "medium shot of two seated figures by the kiln fire, the old master and the young newcomer, faces in shadow",
     "MS", "eye", "static", "kiln_night_now", True, False,
     "спи, малой, завтра рано."),
    ("CH29_SH07", "BAKHTI", "kiln",
     "medium close-up of the master leaning toward the unseen boy, quiet and earnest",
     "MCU", "eye", "static", "kiln_night_now", False, False,
     "и слушай, если когда-нибудь выберешься, найди мой узор, звезду."),
    ("CH29_SH08", None, "kiln",
     "extreme close-up of the turquoise shard glowing in the firelight on the kiln edge",
     "ECU", "eye", "static", "kiln_night_now", False, True,
     "она там есть, это всё, что от меня осталось."),
    ("CH29_SH09", None, "kiln",
     "extreme wide shot pulling back from two tiny silhouettes at the glowing kiln, endless stacks of bricks, red gloom",
     "EWS", "high", "pull_out", "kiln_night_now", True, True, ""),
    ("CH29_SH10", None, "kiln",
     "a slow fade to a black frame, the kiln glow dying, no people",
     "ECU", "eye", "static", "kiln_night_now", False, False, ""),
]

if __name__ == "__main__":
    seed_act(29, "kiln_red_now", MOOD, "static", "CH29 Finale", SHOTS)
