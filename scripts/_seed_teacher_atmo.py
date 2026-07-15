# -*- coding: utf-8 -*-
"""teacher atmosphere breathers — interleaved INSIDE acts (codes A{n}_SHxxB sort between plot beats),
max 1-2 per act, each carries a short concrete VO beat (feedback-broll-must-carry-vo).
Scales chosen against real neighbours to avoid 3-runs. All shots animated (user 2026-07-10).
PYTHONIOENCODING=utf-8 python scripts/_seed_teacher_atmo.py"""
from _teacher_engine import seed_act

# (scene_key, palette, [(code, subj, st, ang, mv, tod, narr)])
ACTS=[
 ("chalk","warm seventies palette of honey wood, chalk white, deep blackboard green and stove-fire amber",[
  ("A1_SH11B","fine chalk dust hanging in a slanted morning sunbeam above worn wooden desks, drifting slower than snow, the green board soft beyond",
   "ECU","low","static","morning",
   "меловая пыль висит в солнечном луче над партами и оседает медленнее, чем идёт урок."),
  ("A1_SH24B","the village school playground at recess in deep winter, sled tracks and small boot prints crossing the snow, low sun laying long blue shadows",
   "WS","high","pan_left","day",
   "на перемене двор исписан санками и валенками, как черновик, и до звонка пять минут."),
 ]),
 ("medal","bright late-spring palette of lilac bloom, gold evening lamplight, worn timber grey and exam-paper white",[
  ("A2_SH10B","heavy lilac branches leaning over a leaning plank fence at evening, petals scattered on a puddle mirror holding the pale sky",
   "WS","eye","tilt_up","evening",
   "сирень в этот год цветёт так, будто посёлок провожает тебя всем, чем может."),
  ("A2_SH24B","moths circling a bare bulb above a dormitory-style narrow table, a stamped envelope propped against a cup, night blue in the window",
   "ECU","low","static","night",
   "почта уходит по понедельникам, и мотыльки у лампы знают твоё расписание лучше соседок."),
 ]),
 ("first_bell","crisp september palette of aster purple, fresh chalk white, notebook blue and pale morning sky",[
  ("A3_SH15B","a glass jar of purple asters on a teacher's desk shedding a single petal onto an open class register, morning light along the page",
   "ECU","eye","static","morning",
   "астры на твоём столе стоят до октября, роняя лепестки прямо в классный журнал."),
 ]),
 ("sugar","cold nineties palette of slush grey, tarpaulin stripe blue, dim bulb amber and sugar-sack white",[
  ("A4_SH07B","an enamel kettle boiling on a small gas stove, steam pressing against a dark kitchen window where snow streaks past the glass",
   "ECU","eye","static","night",
   "чайник в эту зиму кипит по три раза за вечер, чай стал едой, а кухня штабом."),
  ("A4_SH27B","the school corridor at dusk with a freshly mopped wet floor shining down its length, a bucket by the wall, radiators ticking under far windows",
   "WS","eye","push_in","evening",
   "школа вечерами стоит вымытая и тихая, и полы в ней блестят, как будто всё в порядке."),
 ]),
 ("gate","polished late-nineties palette of office beige, blind-sliced daylight, cold steel grey and contract-paper white",[
  ("A5_SH11B","wet yellow leaves plastered flat on cracked schoolyard asphalt, rain pooling in the painted line markings, a lost mitten by the steps",
   "ECU","top","static","day",
   "октябрь приклеивает листья к асфальту двора, и они лежат ровно, как обёрточная бумага."),
  ("A5_SH26B","teachers' coats on a staff-room rack in evening light, one kettle steaming on the tray, class registers stacked in a leaning tower",
   "MS","eye","static","evening",
   "в учительской пахнет чаем и мокрыми пальто, и этот запах не меняется ни при каких деньгах."),
 ]),
 ("red_pen","late-evening palette of red ink, green baize, tired lamplight amber and squared-paper grey",[
  ("A6_SH12B","an aloe plant in a tin on the classroom windowsill against frosted glass, winter sun low through the leaves, chalk rail beneath",
   "MCU","eye","static","day",
   "алоэ на подоконнике живёт в классе дольше многих реформ и не боится ни одной."),
  ("A6_SH24B","the institute building dark at night across a snowy square, one late tram crossing with lit windows, wires sketched against the violet sky",
   "WS","eye","static","night",
   "мимо института теперь ходит поздний трамвай, и ты смотришь на тёмные окна с его моста."),
 ]),
 ("empty_flat","drained palette of dusk blue, bare bulb yellow, packed-suitcase brown and empty wall beige",[
  ("A7_SH19B","a telephone on a kitchen stool with its coiled cord still swaying after a call, lamplight warm on the worn dial, dusk in the window",
   "MCU","eye","static","evening",
   "после маминых звонков шнур телефона ещё минуту качается, и квартира кажется обитаемее."),
 ]),
 ("tutor","glossy palette of dark cabinet lacquer, marble white, chandelier gold and notebook pale-green",[
  ("A8_SH14B","first snow settling and melting on the warm black hood of a big SUV outside a new private house, porch light haloing the flakes",
   "MS","high","static","evening",
   "первый снег тает на тёплом капоте саниной машины, у богатых даже снег не задерживается."),
 ]),
 ("aula","formal palette of dark panelling, projector beam blue, brass warm accents and screen-glow grey",[
  ("A9_SH19B","a paper folder of printed assignments left on a doorstep beside a bottle of milk, an empty spring street beyond, one magpie on the fence",
   "INSERT","high","static","day",
   "задания ты оставляешь на пороге рядом с молоком, и сорока проверяет их первой."),
 ]),
 ("last_bell","farewell palette of balloon red, gilt frame gold, thin autumn sun and cardboard-box brown",[
  ("A10_SH20B","a deflating red balloon resting against classroom window glass among crumpled sash ribbons on a desk, late sun through the tall frame",
   "ECU","eye","static","evening",
   "к вечеру шары устают первыми и ложатся на подоконники, как гости после долгого праздника."),
 ]),
]

LOCS={'A1_SH11B': 'classroom_soviet', 'A1_SH24B': 'village_school_yard', 'A2_SH10B': 'village_street', 'A2_SH24B': None, 'A3_SH15B': 'classroom_hers_90s', 'A4_SH07B': 'lida_kitchen', 'A4_SH27B': 'school_corridor', 'A5_SH11B': 'school_yard', 'A5_SH26B': 'teachers_room', 'A6_SH12B': 'classroom_hers_90s', 'A6_SH24B': None, 'A7_SH19B': 'lida_kitchen', 'A8_SH14B': None, 'A9_SH19B': None, 'A10_SH20B': 'classroom_hers_2010s'}
for key,pal,shots in ACTS:
    rows=[(code,None,LOCS[code],subj,st,ang,mv,tod,True,False,narr) for code,subj,st,ang,mv,tod,narr in shots]
    seed_act(key,pal,rows,render_mode="animated",id_region="a")
