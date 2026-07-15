# -*- coding: utf-8 -*-
"""coffee expansion wave 2 — more interleaved beats, id_region='c'.
Run: PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_expand2.py"""
from _coffee_engine import seed_act

ACTS=[
 ("origin","childhood summer palette, amber kitchen light and green courtyard, copper and cinnamon browns, storybook warm",[
  ("A1_SH02B",None,"gran_kitchen","a wide view of the morning brewing ritual laid out: a water ladle, a blue bean jar, the cezve waiting on its ring","WS","eye","static","day",True,False,
   "варка какао у бабушки — целый обряд: вода из ковшика, зерно из синей банки, тишина."),
  ("A1_SH11B",None,None,"an extreme close-up insert of a child's notebook page with a day plan drawn in coloured pencil","ECU","top","static","evening",True,False,
   "в блокноте ты рисуешь план: утром школа, днём кофейня, вечером считать монетки."),
  ("A1_SH14B",None,"gran_kitchen","a wide view of two figures at the stove, the small one stirring, the older one with hands folded behind her back","WS","eye","static","day",True,False,
   "у плиты вы стоите вдвоём, и бабушка убирает руки за спину: теперь сама."),
  ("A1_SH18B",None,"gran_kitchen","a wide view of the kitchen table with the copper cezve carried across it on a pincushion like a small crown","WS","eye","push_in","evening",True,False,
   "турка переезжает к тебе через стол на подушке для иголок, торжественно, как корона."),
 ]),
 ("barista","busy chain-cafe palette, clean retail whites warmed by espresso browns and steam, brisk and bright",[
  ("A2_SH04B",None,"chain_cafe","a wide view of the coffee bar at peak hour, tickets fluttering, cups sliding down the rail in a steady stream","WS","high","static","day",True,False,
   "в час пик заказы летят один за другим, и стойка гудит, как перрон."),
  ("A2_SH13B",None,"city_bright","a wide view of a tram rolling down the pastel main street, a passenger silhouette guarding a cake box","WS","eye","track","day",True,False,
   "к бабушке ты едешь с пересадкой через весь город, и коробка эклеров доезжает целой."),
  ("A2_SH17B",None,"street_corner","a wide view of the corner in evening rain, the empty unit's arched window catching the streetlight","WS","eye","static","evening",True,False,
   "этот угол ты обходишь даже в дождь, хотя до дома есть путь короче."),
  ("A2_SH21B","ASYA_TEEN","family_flat","a medium close-up of the young woman in bed scrolling foam-art photos on a button phone, grading them","MCU","eye","static","night",False,False,
   "перед сном ты листаешь фотографии узоров и ставишь себе оценки, чаще четвёрки."),
 ]),
 ("championship","competition palette, stage spotlight gold over polished steel, confetti warmth, festive and keen",[
  ("A3_SH05B",None,"champ_hall","a wide view of one stage station under a spotlight, arranged homely with a small jar of cinnamon","WS","eye","static","day",True,False,
   "твоя станция под софитом выглядит как маленькая кухня, и это твоё преимущество."),
  ("A3_SH09B",None,"champ_hall","a wide view of the award moment, camera flashes over the stage, a diploma changing hands","WS","low","static","day",True,False,
   "диплом за второе место тебе вручают под вспышки, и ты улыбаешься по-настоящему."),
  ("A3_SH14B",None,None,"an extreme close-up insert of a notebook title page, block letters underlined twice","ECU","top","static","night",True,False,
   "заголовок ты выводишь большими печатными буквами и подчёркиваешь дважды, как бабушкину главную фразу."),
  ("A3_SH16B",None,None,"an extreme close-up insert of a mittened hand holding a rival cafe's paper cup, two thoughtful sips gone","ECU","eye","static","day",True,False,
   "чужой кофе ты пьёшь как разведчик: два глотка на вкус, остальное на выводы."),
 ]),
 ("opening","fresh-start palette, wet yellow paint and raw wood, copper lamps against dusty golden light, hopeful bright",[
  ("A4_SH05B","ASYA_YOUNG","bank_office","a medium close-up of the young woman leaving the bank straight-backed, joy barely contained at the door","MCU","eye","static","day",False,False,
   "из банка ты выходишь с прямой спиной, а за углом позволяешь себе один подпрыг."),
  ("A4_SH10B",None,None,"an extreme close-up insert of a paint roller loaded with warm yellow, mid-stroke on fresh wall","ECU","eye","static","day",True,False,
   "жёлтый вы выбираете за один вечер: цвет утра, берета и хорошего настроения."),
  ("A4_SH15B",None,None,"an extreme close-up insert of a carved wooden cinnamon stick mounted in the middle of a sign","ECU","eye","push_in","day",True,False,
   "палочку корицы для вывески отец вырезает из дерева, и она переживёт все дожди."),
  ("A4_SH21B","ASYA_YOUNG","korica_cafe","a medium shot of two women dancing a silly victory dance between the tables of the closed cafe","MS","eye","static","night",False,False,
   "закрыв дверь за последним гостем, вы с Женей танцуете между столиками без музыки."),
 ]),
 ("black_streak","candlelit trial palette, deep blue night water and warm candle amber, courage colors over cold, never grim",[
  ("A5_SH07B",None,"korica_cafe","a wide view of the quiet daytime room being put to use: menu drafts on a table, a window frame mid-repaint","WS","eye","pan_left","day",True,False,
   "тихие дни вы тратите с толком: перебираете меню, красите рамы, учите новое."),
  ("A5_SH12B",None,None,"an extreme close-up insert of a small pump rattling beside a pair of rubber boots","ECU","eye","static","day",True,False,
   "насос тарахтит до вечера, и отец даёт ему кличку, как трактору в деревне."),
  ("A5_SH16B",None,"korica_cafe","a wide view of the dark cafe with one lamp burning over the counter, papers spread in its pool of light","WS","eye","static","night",True,False,
   "ты сидишь в зале допоздна, и над стойкой горит одна лампа на весь квартал."),
  ("A5_SH23B","GRAN_BASE","korica_cafe","a medium close-up of the grandmother holding her cup in both hands at the window table, headscarf glowing","MCU","eye","static","evening",False,False,
   "бабушка держит чашку двумя руками и говорит, что трудные зимы делают длинные вёсны."),
 ]),
 ("regulars","lived-in warmth palette, honey wood and copper lamplight, chalk white and cinnamon brown, easy golden",[
  ("A6_SH04B",None,"street_corner","a wide view of the waking block, shop doors opening, a thread of cinnamon steam over the corner","WS","eye","push_in","day",True,False,
   "квартал просыпается под запах твоей корицы, и это лучшая реклама из возможных."),
  ("A6_SH08B",None,"korica_cafe","a wide view of two aproned figures sharing the small counter, trading moves like old partners","WS","eye","static","day",True,False,
   "вы делите стойку на двоих, и опыт с молодостью наконец работают в одну смену."),
  ("A6_SH12B",None,"korica_cafe","a wide view of guests gathered at the till reading a newspaper aloud, laughter around the room","WS","eye","static","day",True,False,
   "заметку читают вслух прямо в зале, и ты прячешься за кофемашину от смущения."),
 ]),
 ("pandemic","quiet-streets palette, soft grey empty city warmed by one amber takeaway window, hopeful through stillness",[
  ("A7_SH07B",None,None,"an extreme close-up insert of a ledger cell with a small plus sign circled twice in pencil","ECU","pov","static","night",True,False,
   "в её таблице впервые за месяц появляется маленький плюс, обведённый в кружок."),
  ("A7_SH13B",None,None,"an extreme close-up insert of a paper closure notice being peeled carefully off glass and folded","ECU","eye","static","day",True,False,
   "объявление о закрытии зала ты снимаешь с двери и не выбрасываешь, а убираешь в архив."),
  ("A7_SH15B","MARK_BASE","korica_cafe","a medium close-up of the moustached barista saying something short and warm across the machine","MCU","eye","static","day",False,False,
   "Марк говорит, что за этот год ты сварила больше, чем он за пять, и не хвастается."),
 ]),
 ("partner","two-points palette, rain-washed bridge blues warmed by skylight gold and fresh wood, adventurous bright",[
  ("A8_SH02B",None,"korica_cafe","a wide view of the lamplit table stacked with a bound eight-page calculation, two cups anchoring its corners","WS","high","static","night",True,False,
   "расчёт у Жени на восемь страниц, и последняя страница называется: почему получится."),
  ("A8_SH09B",None,"second_cafe","a wide view of the second cafe at the end of opening day, display shelves empty, tables full","WS","eye","static","evening",True,False,
   "первый день второй точки заканчивается пустыми витринами и полными столиками, лучший расклад."),
  ("A8_SH11B","ASYA_YOUNG","city_bright","a medium close-up of the young woman on the bridge with a phone to her ear, laughing into the wind","MCU","eye","static","evening",False,False,
   "с моста ты звонишь бабушке доложить, и она требует подробностей про каждую чашку."),
 ]),
 ("franchise","growing-network palette, loft sunlight over bean-sack burlap and map pins, confident amber and green",[
  ("A9_SH02B",None,"hq_loft","a wide view of a loft wall hung with framed photos of cafes, a cardboard box photo first in the row","WS","eye","pan_right","day",True,False,
   "на стене штаба фотографии всех точек, и первой висит картонная, из двора."),
  ("A9_SH07B",None,"hq_loft","a wide view of the negotiation across the long table, folders open, the map of pins behind","WS","eye","static","day",True,False,
   "он листает ваши цифры и хвалит всё, кроме того, из чего эти цифры выросли."),
  ("A9_SH09B",None,"hq_loft","a wide view of the training corner in full steam, pitchers up, patient counting in the air","WS","eye","static","day",True,False,
   "в школе Марка пахнет молоком и терпением, и отчисленных отсюда не бывает."),
 ]),
 ("triumph","award-evening palette, festive gold and deep warm red over copper, proud and glowing, never pompous",[
  ("A10_SH04B",None,"hq_loft","a wide view of the loft table set for a visitor, a thick folder lying unopened between the cups","WS","eye","static","day",True,False,
   "он ждёт отказа и приносит папку оправданий, но папка ему не пригодится."),
  ("A10_SH11B",None,"korica_cafe","a wide view of the room warmly aware of the window table, a young barista being introduced there","WS","eye","static","day",True,False,
   "весь зал знает, кто это за столиком у окна, и новенькие ходят знакомиться."),
  ("A10_SH13B",None,None,"an extreme close-up insert of ceremonial scissors meeting a ribbon, an elderly steady hand on them","ECU","eye","static","day",True,False,
   "ленточку на сорок седьмой ты доверяешь резать бабушке, и рука у неё не дрожит."),
 ]),
 ("coda","golden epilogue palette, sunset honey over brass and steam, one small sky-blue accent, tender bright",[
  ("A11_SH04B",None,"street_corner","a wide view of the takeaway window with the small girl talking earnestly up at it, evening gold around her","WS","eye","static","evening",True,False,
   "она объясняет серьёзно, что копила с понедельника, но какао подорожало на одну монетку."),
  ("A11_SH10B","ASYA_ADULT","new_cafe47","a medium shot of the woman turning off the room lights, leaving one warm lamp over the shelf","MS","eye","static","night",False,False,
   "ты гасишь в зале свет, оставив одну тёплую лампу над полкой с туркой."),
 ]),
]

if __name__=="__main__":
    for sk,pal,shots in ACTS:
        seed_act(sk, pal, shots, id_region="c")
