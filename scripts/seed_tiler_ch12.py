# -*- coding: utf-8 -*-
"""Seed CH12 — Он РАД (the nerve; action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "warm phone-screen glow against the cold dark barrack, bittersweet tenderness"

SHOTS = [
    ("CH12_SH01", "BAKHTI", "bytovka",
     "medium close-up of the master sitting on his bunk holding up his phone for an allowed weekly video call, eager",
     "MCU", "eye", "static", "object_evening", False, False,
     "раз в неделю давали позвонить домой, я ждал этого всю неделю."),
    ("CH12_SH02", None, "bytovka",
     "insert close-up of a phone screen showing a smiling wife in a headscarf waving, warm, no clear face",
     "CU", "eye", "static", "object_evening", True, False,
     "нигора, родная, как вы там."),
    ("CH12_SH03", "BAKHTI", "bytovka",
     "medium close-up of the master beaming at the phone, the warmest he has looked",
     "MCU", "eye", "static", "object_evening", False, False,
     "нашёл хорошую работу, говорил я, дом достроим, потерпите."),
    ("CH12_SH04", None, "bytovka",
     "insert close-up of a phone screen showing the family house now with a finished roof and new windows, no people",
     "CU", "eye", "static", "object_evening", True, False,
     "на мои деньги уже клали крышу, ставили окна."),
    ("CH12_SH05", None, "bytovka",
     "insert close-up of a phone screen showing a teenage son grown taller, shy wave, no clear face",
     "CU", "eye", "static", "object_evening", True, False,
     "азиз вытянулся, скоро в колледж, иншаллах."),
    ("CH12_SH06", "BAKHTI", "bytovka",
     "medium close-up of the master laughing quietly at something his son said",
     "MCU", "eye", "static", "object_evening", False, False,
     "я смеялся в трубку, как давно не смеялся."),
    ("CH12_SH07", "BAKHTI", "bytovka",
     "extreme close-up of the master holding the turquoise shard up to the phone camera to show them",
     "ECU", "eye", "static", "object_evening", False, False,
     "видите, кусочек дома со мной, скоро вернусь."),
    ("CH12_SH08", "BAKHTI", "bytovka",
     "the master after the call, pressing the dark phone to his chest in the gloom",
     "MS", "eye", "static", "object_evening", False, False,
     "мне платили гроши, сущие гроши."),
    ("CH12_SH09", "BAKHTI", "bytovka",
     "extreme close-up of the master's hands holding a thin small stack of ruble notes",
     "ECU", "top_down", "static", "object_evening", False, False,
     "но для моей семьи это были огромные деньги."),
    ("CH12_SH10", "BAKHTI", "bytovka",
     "the master lying back on his bunk content, a faint smile in the dark",
     "MS", "eye", "static", "object_evening", False, False,
     "я не чувствовал себя обманутым, я чувствовал себя кормильцем."),
    ("CH12_SH11", None, "bytovka",
     "wide shot of the dark barrack, other men asleep, one phone glow fading, no clear faces",
     "WS", "high", "static", "object_evening", True, False, ""),
    ("CH12_SH12", "BAKHTI", "bytovka",
     "close-up of the master's face in the dark, the smile complicated by something he cannot name yet",
     "CU", "eye", "push_in", "object_evening", False, True,
     "понимаешь, что страшнее всего, я был счастлив."),
]

if __name__ == "__main__":
    seed_act(12, "object_marble_cold", MOOD, "static", "CH12 Glad", SHOTS)
