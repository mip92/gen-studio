# -*- coding: utf-8 -*-
"""Seed COLD OPEN (chapter 0, old age) for project `beauty`. 2nd-person. Idempotent."""
from _seed_beauty_act_engine import seed_act

MOOD = "cold grey old-apartment light, dust-sheeted mirrors, hollow lonely melancholy, faded"

SHOTS = [
 ("B_SH01", None, "old_flat",
  "a dim cluttered old apartment, every mirror draped with a white dust-sheet, a curtained grey window, an old vanity with dried-up serum bottles",
  "WS", "high", "push_in", "old_now", True, False, ""),
 ("B_SH02", "HEROINE_OLD", "old_flat",
  "medium close-up of a gaunt 62-year-old woman with a frozen mask-like face sitting by the grey window, unmoving",
  "MCU", "eye", "static", "old_now", False, False,
  "тебе шестьдесят два, и ты не помнишь, когда в последний раз улыбалась по-настоящему."),
 ("B_SH03", None, "old_flat",
  "extreme close-up of old wrinkled hands cradling an antique powder compact, opening its tiny mirror",
  "ECU", "top_down", "static", "old_now", True, False,
  "в руке у тебя мамина пудреница, единственное зеркало, в которое ты ещё смеешь заглянуть."),
 ("B_SH04", None, "old_flat",
  "close-up of a large wall mirror draped under a white sheet, dim light",
  "CU", "eye", "static", "old_now", True, False, ""),
 ("B_SH05", "HEROINE_OLD", "old_flat",
  "the old woman slowly touching her own taut frozen cheek, the face that will not move",
  "MS", "eye", "static", "old_now", False, True,
  "лицо твоё давно не двигается, ни улыбнуться, ни заплакать, ты сама об этом позаботилась."),
 ("B_SH06", None, "old_flat",
  "extreme close-up of a faded framed glamour photograph on the wall of a radiant young beauty of 25",
  "ECU", "eye", "push_in", "old_now", True, True,
  "а вот ты в двадцать пять, первая красавица, на тебя оборачивался весь город."),
 ("B_SH07", "HEROINE_OLD", "old_flat",
  "close-up of the old woman gazing at the faded photo, not recognising herself",
  "CU", "low", "static", "old_now", False, False,
  "куда делась та девочка, спрашиваешь ты у выцветшего снимка, и не узнаёшь себя."),
 ("B_SH08", None, "old_flat",
  "wide shot of the empty silent apartment, all mirrors sheeted, one curtained window",
  "WS", "eye", "static", "old_now", True, False,
  "ты совсем одна, и зеркала в доме завешены простынями, чтобы не встречаться с собой."),
 ("B_SH09", "HEROINE_OLD", "old_flat",
  "medium close-up of the old woman beginning to speak, bitter and tired",
  "MCU", "eye", "push_in", "old_now", False, False,
  "хочешь знать, как ты дошла до завешенных зеркал и пустой квартиры?"),
 ("B_SH10", None, "old_flat",
  "wide shot of the grey curtained window and the dim empty room, dust drifting in the pale light",
  "WS", "eye", "static", "old_now", True, False, ""),
 ("B_SH11", "HEROINE_OLD", "old_flat",
  "close-up of the old woman's frozen face lit cold from the window, a hard swallow",
  "CU", "eye", "static", "old_now", False, True,
  "всё началось с того, что над твоей колыбелью наклонились и сказали, ой, какая красавица."),
 ("B_SH12", None, "old_flat",
  "extreme close-up of the small compact mirror reflecting a sliver of the masklike face",
  "ECU", "top_down", "static", "old_now", True, False, ""),
]

if __name__ == "__main__":
    seed_act(0, "old_grey", MOOD, "animated", "COLD OPEN", SHOTS)
