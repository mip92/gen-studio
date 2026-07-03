# -*- coding: utf-8 -*-
"""layoff act A7 coda (4-я стена, финал, дисклеймер). PYTHONIOENCODING=utf-8 python scripts/_seed_layoff_A7.py"""
from _layoff_engine import seed_act
PAL="quiet resolved palette, soft grey and faint warm dawn, low even light, gentle calm shadows"
S=[
 ("A7_SH01","GEROY_MAIN","home_kitchen","a medium close-up of the older man sitting calmly at his kitchen table, quieter now","MCU","eye","static","day",False,False,
  "сейчас ты сидишь на той же кухне, постаревший, и впервые за годы у тебя есть время просто подумать."),
 ("A7_SH02","GEROY_MAIN","home_kitchen","a close-up of the man looking directly toward the viewer, steady and serious","CU","eye","push_in","day",False,True,
  "и если ты, кто смотрит это, уверен, что на работе ты совершенно незаменим, я хочу, чтобы ты остановился."),
 ("A7_SH03",None,"open_floor","a wide view of the open office floor where the man's old desk is now occupied by someone else's things","WS","eye","static","day",True,False,
  "твой стол на том этаже давно занят другим человеком, и контора не сбилась с ритма ни на день."),
 ("A7_SH04",None,"your_desk","a macro insert of the old desk now holding a stranger's belongings, the chipped mug gone","INSERT","top","static","day",True,False,
  "на твоём бывшем месте стоят чужие вещи, а твою треснувшую кружку кто-то просто выбросил."),
 ("A7_SH05","GEROY_MAIN","street_tower","a medium close-up of the man walking past the glass tower, watching it run on without him","MCU","eye","static","day",False,False,
  "ты проходишь мимо башни и видишь, что она прекрасно работает без тебя, как работала бы без любого."),
 ("A7_SH06","GEROY_MAIN","street_tower","a close-up of the man's face accepting a hard truth","CU","eye","static","day",False,False,
  "тебя забыли за неделю, потому что для системы ты всегда был должностью, а не человеком."),
 ("A7_SH07","WIFE_BASE","home_kitchen","a medium shot of the auburn-haired wife sitting beside the man at the table, a quiet closeness returning","MS","eye","static","day",False,False,
  "рядом с тобой сидит жена, которую ты почти не замечал, пока отдавал всего себя чужой компании."),
 ("A7_SH08","GEROY_MAIN","home_kitchen","a close-up of the man's face as the realisation settles","CU","eye","static","day",False,False,
  "только потеряв пропуск, ты понимаешь, что много лет путал свою работу со своей жизнью."),
 ("A7_SH09","GEROY_MAIN","home_kitchen","a medium close-up of the man looking toward the viewer again, asking a direct question","MCU","eye","push_in","day",False,False,
  "спроси себя сегодня, кто ты без своей должности, без пропуска и без подписи под чужими целями."),
 ("A7_SH10",None,"home_kitchen","a macro insert of the dead access card lying in the kitchen drawer among old receipts","ECU","top","static","day",True,True,
  "твой старый пропуск так и лежит в кухонном ящике среди чеков, мёртвый кусок пластика."),
 ("A7_SH11",None,"turnstile_lobby","a macro insert of a turnstile card reader glowing green as an unseen card taps it","INSERT","eye","static","day",True,False,
  "где-то в этот момент турникет коротко пищит и пускает внутрь кого-то, кто тоже думает, что он навсегда."),
 ("A7_SH12",None,"street_tower","a wide dusk view of the glass tower lit with hundreds of indifferent windows","WS","low","static","dusk",True,False,
  "башня горит окнами в сумерках, ей всё равно, кто сегодня приложил карту, а кто больше никогда не приложит."),
 ("A7_SH13","GEROY_MAIN","home_kitchen","a medium close-up of the man pushing the drawer shut with a small new resolve on his face","MCU","eye","static","day",False,False,
  "ты закрываешь ящик, и впервые решаешь, что завтрашнее утро будет принадлежать тебе, а не им."),
 ("A7_SH14",None,"home_kitchen","a macro insert of a drawer sliding shut over the dead access card, dimming its plastic shine","INSERT","top","static","day",True,True,
  "ящик задвигается, гасит блеск мёртвой карты, и это всё, что осталось от девятнадцати лет верности."),
 ("A7_SH15",None,"home_kitchen","a plain dark graphic-novel end card, a simple solid muted background, an empty quiet final frame","INSERT","eye","static","dusk",True,False,
  "эта история вымышлена, любые совпадения случайны, но если ты узнал в ней себя, не повторяй чужих ошибок."),
]
if __name__=="__main__": seed_act("coda", PAL, S, render_mode="static")
