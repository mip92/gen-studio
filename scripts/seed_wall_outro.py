# -*- coding: utf-8 -*-
"""Seed OUTRO (scene 38) for project `wall`: direct-address coda + subscribe CTA + disclaimer.
Scene row already created by seed_wall_scenes.py. Idempotent."""
from _seed_wall_act_engine import seed_act
MOOD = "quiet sober afterword light, the narrator's calm direct address, the lesson stated plainly"
SHOTS = [
 ("O_SH01", "HEROINE_OLD", "old_flat",
  "medium close-up of the aged heroine looking calmly and directly at the viewer",
  "MCU","eye","push_in","old_now",False,True,
  "если ты сейчас гонишься за тем, чтобы тебя хотели, и путаешь это с любовью, остановись."),
 ("O_SH02", None, "east_side_gallery",
  "close-up of the small key resting on the painted wall, a quiet symbol",
  "CU","eye","static","old_now",True,False,
  "любовь, это не вспышка чужого взгляда, это когда ты впускаешь кого-то за свою стену."),
 ("O_SH03", None, "old_flat",
  "medium of the quiet apartment in a calm closing mood",
  "MS","eye","static","old_now",True,False,
  "если эта история тебя зацепила, подпишись на канал, чтобы не пропустить новые истории."),
 ("O_SH04", None, "old_flat",
  "wide of the still room, a calm final frame",
  "WS","eye","static","old_now",True,False,
  "посмотри другие наши видео вот здесь, на экране, и обязательно поделись этим с близкими."),
 ("O_SH05", None, "the_wall",
  "extreme close-up of bare concrete, a quiet final frame",
  "ECU","eye","static","old_now",True,True,
  "эта история вымышлена, любые совпадения случайны, не строй стен вокруг тех, кто хочет тебя любить."),
]
if __name__ == "__main__":
    seed_act(38, "eldritch_grey", MOOD, "static", "OUTRO", SHOTS)
