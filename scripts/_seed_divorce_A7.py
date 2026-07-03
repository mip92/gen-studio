# -*- coding: utf-8 -*-
"""divorce act A7 coda (4-я стена, финал, дисклеймер). PYTHONIOENCODING=utf-8 python scripts/_seed_divorce_A7.py"""
from _divorce_engine import seed_act
PAL="quiet resolved domestic palette, soft grey and faint warm dawn, low even light, gentle calm shadows"
S=[
 ("A7_SH01","MUZH_MAIN","rented_flat","a medium close-up of the older man sitting quietly alone in the rented flat","MCU","eye","static","day",False,False,
  "сейчас ты сидишь один в съёмной квартире, постаревший, и у тебя слишком много времени всё это вспоминать."),
 ("A7_SH02","MUZH_MAIN","rented_flat","a close-up of the man looking directly toward the viewer, steady and earnest","CU","eye","push_in","day",False,True,
  "и если ты, кто смотрит это, думаешь, что поговорить можно всегда потом, я хочу, чтобы ты остановился."),
 ("A7_SH03",None,"kitchen_mugs","a wide view of the old kitchen table where two mugs still stand, one of them overturned upside down","WS","eye","static","morning",True,False,
  "на той кухне всё так же стоят две чашки, и одна из них до сих пор перевёрнута вверх дном."),
 ("A7_SH04",None,"kitchen_mugs","a macro insert of a plain gold wedding ring lying on the table beside the overturned mug","INSERT","top","static","morning",True,False,
  "рядом с перевёрнутой чашкой лежит твоё кольцо, и оно теперь просто кусочек холодного металла."),
 ("A7_SH05","MUZH_MAIN","rented_flat","a medium close-up of the man, a hard understanding settling on his face","MCU","eye","static","day",False,False,
  "ты годами думал, что тишина в доме — это покой, а это медленно умирала ваша близость."),
 ("A7_SH06","MUZH_MAIN","rented_flat","a close-up of the man's face heavy with regret","CU","eye","static","day",False,False,
  "каждый отложенный разговор был кирпичом в стене, которую вы вдвоём незаметно выложили между собой."),
 ("A7_SH07","SYN_CHILD","car_curb","a medium shot of the boy in the back seat with his dinosaur backpack, travelling between two homes","MS","eye","static","day",False,False,
  "теперь твой сын возит рюкзак между двумя домами и платит за вашу тишину своим разорванным детством."),
 ("A7_SH08","MUZH_MAIN","rented_flat","a close-up of the man looking toward the viewer with a direct plea","CU","eye","push_in","day",False,False,
  "не говори потом тем, кого любишь, потому что однажды это потом просто не наступает."),
 ("A7_SH09","MUZH_MAIN","rented_flat","a medium close-up of the man asking the viewer a quiet direct question","MCU","eye","static","day",False,False,
  "спроси себя сегодня, когда ты в последний раз по-настоящему разговаривал с человеком рядом."),
 ("A7_SH10","MUZH_MAIN","rented_flat","an extreme close-up of the man's left hand, the pale ring band almost gone but still faintly there","ECU","eye","static","day",False,True,
  "бледная полоса на твоём пальце почти исчезла, но место, где было кольцо, ты будешь помнить всегда."),
 ("A7_SH11",None,"kitchen_mugs","a macro insert of two mugs, one overturned and one empty, with the gold ring lying between them","INSERT","top","static","morning",True,True,
  "две чашки, перевёрнутая и пустая, и кольцо между ними — вот всё, что осталось от двенадцати лет."),
 ("A7_SH12",None,"rented_flat","a wide dusk view of the bare rented flat, warm lit windows of other homes glowing beyond the glass","WS","eye","static","dusk",True,False,
  "за окном горят тёплые чужие окна, где кто-то прямо сейчас откладывает важный разговор на потом."),
 ("A7_SH13","MUZH_MAIN","rented_flat","a medium close-up of the man switching off a lamp with a small new resolve on his face","MCU","eye","static","dusk",False,False,
  "ты выключаешь свет в пустой квартире и впервые обещаешь себе больше никогда не прятаться за этим словом."),
 ("A7_SH14",None,"kitchen_mugs","a macro insert of two mugs and the gold ring on the table in pale dawn light, perfectly still","INSERT","top","static","morning",True,True,
  "на столе в рассветном свете стоят две чашки и лежит кольцо, и эта тишина теперь навсегда твоя."),
 ("A7_SH15",None,"kitchen_mugs","a plain dark graphic-novel end card, a simple solid muted background, an empty quiet final frame","INSERT","eye","static","dusk",True,False,
  "эта история вымышлена, любые совпадения случайны, но если ты узнал в ней себя, не откладывай разговор на потом."),
]
if __name__=="__main__": seed_act("coda", PAL, S, render_mode="static")
