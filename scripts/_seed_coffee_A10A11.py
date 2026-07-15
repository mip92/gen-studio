# -*- coding: utf-8 -*-
"""coffee A10 triumph (31) + A11 coda. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_A10A11.py"""
from _coffee_engine import seed_act

P_TRIUMPH="award-evening palette, festive gold and deep warm red over copper, proud and glowing, never pompous"
P_CODA="golden epilogue palette, sunset honey over brass and steam, one small sky-blue accent, tender bright"

TRIUMPH=[
 ("A10_SH01",None,"champ_hall","a wide establishing view of the bright hall dressed for an industry award evening, a stage with a golden cup trophy","WS","eye","push_in","evening",True,False,
  "в тридцать один твою сеть официально называют сетью года, и зал аплодирует стоя."),
 ("A10_SH02","ASYA_ADULT","champ_hall","a medium shot of the copper-haired woman at the stage microphone with a small golden cup trophy","MS","low","static","evening",False,False,
  "со сцены ты благодаришь троих: бабушку, отца с его метром и Марка с его ушами."),
 ("A10_SH03",None,None,"an extreme close-up insert of a small golden cup trophy placed on a shelf one level below a copper cezve","ECU","eye","push_in","day",True,True,
  "статуэтка — золотая чашка, и дома ты ставишь её на полку ниже турки."),
 ("A10_SH04","RIVAL_BASE","hq_loft","a medium shot of the slick-haired manager standing at the loft table, hat metaphorically in hand, eyes down","MS","eye","static","day",False,False,
  "весной в штаб приходит тот самый управляющий сетевика и просит франшизу, глядя в пол."),
 ("A10_SH05","ASYA_ADULT","hq_loft","a close-up of the woman answering him warmly, one finger raised for the single condition","CU","eye","static","day",False,False,
  "ты соглашаешься с одним условием: он лично научится варить в турке и выучит десять имён."),
 ("A10_SH06","RIVAL_BASE","korica_cafe","a medium close-up of the manager in jeans at the counter, tongue-tip focus over a tiny cezve","MCU","eye","static","day",False,False,
  "он приезжает учиться в субботу, в джинсах вместо костюма, и у него дрожит ложечка."),
 ("A10_SH07",None,None,"an extreme close-up insert of a lopsided cinnamon sun on cappuccino foam, a spoon hovering uncertainly above","ECU","top","static","day",True,False,
  "его первое солнышко выходит кривым, как твоё детское меню, и это добрый знак."),
 ("A10_SH08",None,"korica_cafe","a wide view of the first little cafe on its corner, a queue forming before the door sign turns","WS","eye","static","day",True,False,
  "первая «КОРИЦА» стоит на своём углу, как стояла, только очередь теперь начинается до открытия."),
 ("A10_SH09","DAD_OLD","korica_cafe","a medium shot of the grey-templed father on a stepladder hanging a framed piece of cardboard above the till","MS","low","static","day",False,True,
  "отец приносит из кладовки твою картонную кофейню и вешает её меню в рамке над кассой."),
 ("A10_SH10","OBJ:box_cafe",None,"an extreme close-up macro insert of the crooked childhood marker menu behind clean framing glass","ECU","eye","push_in","day",True,False,
  "кривые буквы и какао по две монетки висят теперь над кассой, как главный диплом."),
 ("A10_SH11","GRAN_OLD","korica_cafe","a medium shot of the tiny white-haired great-grandmother at her own window table, a gold-rimmed cup before her","MS","eye","static","day",False,False,
  "бабушке восемьдесят пять, у неё свой столик у окна и своя чашка с золотым ободком."),
 ("A10_SH12","GRAN_OLD","korica_cafe","a close-up of the great-grandmother tasting, narrowing her eyes into the old familiar verdict","CU","eye","push_in","day",False,True,
  "она пробует твой кофе, щурится, как двадцать лет назад, и кивает: домом, всё правильно."),
 ("A10_SH13",None,"new_cafe47","a wide view of the forty-seventh cafe gleaming on its corner, ribbon and balloons ready for morning","WS","eye","pull_out","day",True,False,
  "а этой осенью ты открываешь сорок седьмую точку, ту самую, с которой мы начали."),
]

CODA=[
 ("A11_SH01",None,"new_cafe47","a wide establishing view of the new cafe at golden evening, balloons gone to children, the street quiet and warm","WS","eye","push_in","evening",True,False,
  "вечер открытия сорок седьмой: шары раздарены детям, очередь допита до последнего гостя."),
 ("A11_SH02","ASYA_ADULT","new_cafe47","a medium shot of the yellow-aproned woman taking the closing shift at the takeaway window herself","MS","eye","static","evening",False,False,
  "ты сама встаёшь на закрытие к окошку навынос, потому что это тоже твоё правило."),
 ("A11_SH03","GIRL_KID","street_corner","a medium shot of a small dark-haired girl in a sky-blue jacket on tiptoe at the takeaway window","MS","low","static","evening",False,False,
  "к окошку на цыпочках подходит девочка лет восьми в голубой куртке, с монетками в кулаке."),
 ("A11_SH04",None,None,"an extreme close-up insert of four small coins opened in a child's palm under the window lamp","ECU","top","static","evening",True,False,
  "монеток у неё ровно четыре, и на какао с корицей они, честно говоря, не тянут."),
 ("A11_SH05","ASYA_ADULT","new_cafe47","a medium close-up of the woman smiling through the window and reaching for the copper cezve instead of the machine","MCU","eye","static","evening",False,False,
  "ты говоришь: сегодня какао за счёт заведения, и берёшься за турку, а не за машину."),
 ("A11_SH06","OBJ:cezve",None,"an extreme close-up macro insert of the old copper cezve over a small flame, cocoa rising in it","ECU","eye","push_in","evening",True,True,
  "бабушкина турка, которой полвека, варит какао девочке, которой восемь, и это правильная математика."),
 ("A11_SH07",None,None,"an extreme close-up insert of a cinnamon sun finished on cocoa foam in small mittened hands","ECU","eye","static","evening",True,True,
  "на пенке ты выводишь корицей солнышко, и девочка несёт его двумя руками, как медаль."),
 ("A11_SH08",None,"street_corner","a wide view of the small girl walking away down the golden street, glancing back at the lit sign","WS","eye","static","evening",True,False,
  "она оглядывается на вывеску трижды, и ты знаешь этот взгляд лучше всех на свете."),
 ("A11_SH09","ASYA_ADULT","new_cafe47","a medium close-up of the woman leaning on the takeaway sill, turning warmly toward the viewer","MCU","eye","push_in","evening",False,False,
  "может, лет через двадцать она поставит на полку свою турку, и я приду к ней первой."),
 ("A11_SH10","ASYA_ADULT","new_cafe47","a close-up of the freckled woman's face in the window lamp glow, honest and glad","CU","eye","push_in","night",False,False,
  "подпишись, если эта история согрела: здесь рассказывают и такие, где всё получается."),
 ("A11_SH11",None,"new_cafe47","a wide view of the dark street with one warm lit shelf in the cafe window, the copper cezve glowing behind glass","WS","eye","pull_out","night",True,False,
  "эта история вымышлена, совпадения случайны, а мечты из картонных коробок — нет, берегите их."),
]

if __name__=="__main__":
    seed_act("triumph",P_TRIUMPH,TRIUMPH)
    seed_act("coda",P_CODA,CODA)
