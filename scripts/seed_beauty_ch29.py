# -*- coding: utf-8 -*-
"""Seed CH29 — Финал, зеркало к стене (2nd person). Idempotent.
Disclaimer = silent non-diegetic title card added at EXPORT, not a rendered shot."""
from _seed_beauty_act_engine import seed_act
MOOD = "warm gentle light, a first quiet peace, the lesson learned too late but learned"
SHOTS = [
 ("CH29_SH01", "HEROINE_OLD", "old_flat",
  "medium shot of the heroine walking to the last uncovered mirror",
  "MS","eye","static","home_day",False,False,
  "ты подходишь к последнему зеркалу в доме."),
 ("CH29_SH02", "HEROINE_OLD", "old_flat",
  "medium close-up of the heroine herself turning the mirror to face the wall",
  "MCU","eye","static","home_day",False,True,
  "и впервые сама поворачиваешь его к стене."),
 ("CH29_SH03", None, "old_flat",
  "extreme close-up of the mirror now facing the wall, its glass hidden",
  "ECU","eye","static","home_day",True,False,
  "не для других, для себя, чтобы больше не сверяться с ним каждый день."),
 ("CH29_SH04", "HEROINE_OLD", "family",
  "medium shot of the heroine sitting down beside her little granddaughter",
  "MS","eye","static","home_day",False,False,
  "ты садишься к внучке."),
 ("CH29_SH05", "HEROINE_OLD", "family",
  "close-up of the heroine stroking the child's head, not glancing at any reflection",
  "CU","eye","static","home_day",False,True,
  "и просто гладишь её по голове, не глядя ни в какое отражение."),
 ("CH29_SH06", None, "family",
  "medium close-up of an old spotted hand resting gently on a child's hair, the child leaning in",
  "MCU","high","static","home_day",True,False,
  "впервые тебе всё равно, как ты при этом выглядишь."),
 ("CH29_SH07", "HEROINE_OLD", "family",
  "close-up of the heroine's face, a first real peace despite the mask",
  "CU","eye","static","home_day",False,False,
  "красивая, значит счастливая, мне врали всю жизнь."),
 ("CH29_SH08", ("HEROINE_OLD","DAUGHTER"), "family",
  "the heroine on the left with the child, the daughter on the right, a fragile warmth between them",
  "WS","eye","static","home_day",False,True,
  "счастье было не в зеркале, а вот тут, рядом, и я едва его не упустила."),
 ("CH29_SH09", None, "old_flat",
  "extreme close-up of the mother's powder compact closed and put away in a drawer for good",
  "ECU","top_down","static","home_day",True,True,
  "мамину пудреницу ты закрываешь и убираешь в ящик, навсегда."),
 ("CH29_SH10", None, "family",
  "wide B-roll of the warm room, the mirror turned to the wall, the family together",
  "WS","high","static","home_day",True,False,""),
]
if __name__ == "__main__":
    seed_act(29, "warm_home", MOOD, "static", "CH29 Finale", SHOTS)
