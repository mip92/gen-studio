# -*- coding: utf-8 -*-
"""Seed CH14 — Отец, смерть по телефону (action-first). Idempotent."""
from _seed_tiler_act_engine import seed_act

MOOD = "cold dark marble hall, private unbearable grief, single lamp, blue night"

SHOTS = [
    ("CH14_SH01", "BAKHTI", "bytovka",
     "medium close-up of the master jolting awake as his phone lights up at night with a call from home",
     "MCU", "eye", "static", "object_night", False, False,
     "ночью раздался звонок из риштана, я понял сразу, беда."),
    ("CH14_SH02", "BAKHTI", "bytovka",
     "close-up of the master's face collapsing as he listens, phone pressed hard to his ear",
     "CU", "eye", "static", "object_night", False, True,
     "отец слёг, говорят, совсем плох, зовёт меня."),
    ("CH14_SH03", "BAKHTI", "bytovka",
     "the master pacing the cramped dark barrack with the phone, gripping his own hair",
     "MS", "eye", "static", "object_night", False, False,
     "я метался, что делать, до риштана тысячи километров."),
    ("CH14_SH04", None, "bytovka",
     "insert close-up of a phone screen showing a weeping wife in a headscarf, no clear face",
     "CU", "eye", "static", "object_night", True, False,
     "приезжай, шептала нигора, он тебя ждёт."),
    ("CH14_SH05", ("BAKHTI", "KURATOR"), "objext",
     "Bakhti on the left pleading with clasped hands, the cold suited curator on the right shaking his head",
     "MS", "eye", "static", "object_night", False, False,
     "я умолял куратора отпустить на похороны."),
    ("CH14_SH06", "KURATOR", "objext",
     "medium close-up of the curator's flat refusal, sunglasses off, eyes empty",
     "MCU", "low", "static", "object_night", False, False,
     "режим, сказал он, уедешь, потеряешь всё, и вышлют."),
    ("CH14_SH07", "BAKHTI", "marble",
     "extreme close-up of the master's hand sliding slowly down a cold marble wall",
     "ECU", "eye", "static", "object_night", False, False,
     "и я остался, потому что без этих денег семье конец."),
    ("CH14_SH08", "BAKHTI", "marble",
     "the master alone at night kneeling and laying marble, shoulders shaking, tears on his face",
     "MS", "high", "static", "object_night", False, True,
     "я хоронил отца по телефону, а сам клал им пол."),
    ("CH14_SH09", None, "marble",
     "extreme close-up of a single tear dropping into wet grey grout between marble tiles",
     "ECU", "top_down", "static", "object_night", False, True,
     "и плакал в раствор, чтобы не увидел снайпер."),
    ("CH14_SH10", "BAKHTI", "marble",
     "extreme close-up of the master clutching the turquoise shard to his lips, whispering a prayer",
     "ECU", "eye", "static", "object_night", False, False,
     "этот осколок теперь всё, что от отца осталось."),
    ("CH14_SH11", None, "rishtan",
     "wide distant shot of a Rishtan funeral procession carrying a shrouded body, imagined and pale, no clear faces",
     "WS", "high", "static", "rishtan_day", True, False,
     "его несли на руках без меня, я даже глаз ему не закрыл."),
    ("CH14_SH12", "BAKHTI", "marble",
     "close-up of the master's hollowed face in the lamp light, emptied out",
     "CU", "eye", "static", "object_night", False, False,
     "что-то во мне в ту ночь погасло насовсем."),
]

if __name__ == "__main__":
    seed_act(14, "object_marble_cold", MOOD, "static", "CH14 Father", SHOTS)
