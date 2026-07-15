# -*- coding: utf-8 -*-
"""sailor_wife atmosphere breathers — interleaved inside acts (codes A{n}_SHxxB), 1 per act,
each with a concrete VO beat, subjects unique per act, scales checked vs neighbours. ALL animated.
PYTHONIOENCODING=utf-8 python scripts/_seed_sailor_wife_atmo.py"""
from _sailor_wife_engine import seed_act

ACTS=[
 ("dance","warm late-seventies palette of mirror-ball gold, summer-dress cotton, harbour dusk blue and accordion red",[
  ("A1_SH09B",None,"promenade",
   "moths and midges swirling in the cone of a promenade lamp above the painted railing, the dark water beyond carrying broken reflections",
   "CU","low","static","night",
   "фонари на набережной в июле облеплены мошкарой, и свет их от этого мягкий, как через тюль."),
 ]),
 ("vows","tender ceremony palette of white cotton, red carpet runner, brass horn gold and clear may sky",[
  ("A2_SH19B",None,"post_office",
   "a wall of small numbered parcel lockers at the post office, one door ajar with brown paper showing, a rubber stamp resting on an ink pad at the counter's edge",
   "INSERT","eye","static","day",
   "почта в среду пахнет сургучом и обёрточной бумагой, у ожидания есть свои запахи."),
 ]),
 ("letters","gentle nursery palette of envelope cream, ink blue, swaddle white and lamplit rose",[
  ("A3_SH11B",None,"harbor_panorama",
   "a rain squall crossing the bay in a moving grey curtain while the near water stays sunlit, a small pilot boat running the seam between weathers",
   "EWS","high","static","day",
   "погода над бухтой ходит полосами, и лоцманский катер бегает по шву между дождём и солнцем."),
 ]),
 ("queen","steady eighties palette of parcel paper brown, denim blue, radio-dial green and courtyard acacia shade",[
  ("A4_SH11B",None,"anna_kitchen",
   "a transistor radio on the kitchen shelf with its dial lamp glowing green, a shipping forecast card propped against it, steam from an unseen pot fogging its chrome",
   "MCU","eye","static","evening",
   "прогноз для судов ты слушаешь внимательнее собственного, у вас в доме два климата."),
 ]),
 ("collapse","cold nineties palette of shut-office grey, fax paper white, booth-glass green and worn kit-bag khaki",[
  ("A5_SH19B",None,"port_quay",
   "laid-up ships rafted three deep at a dead berth, rust streaking their sides, a mooring line grown a beard of dried algae, one crane bowed motionless over them",
   "WS","eye","tilt_down","day",
   "у мёртвого причала суда стоят по трое, борт к борту, и швартовы у них обросли бородой."),
 ]),
 ("two_contracts","decision palette of ledger-paper cream, pencil graphite, night-kitchen amber and pier-lamp cold blue",[
  ("A6_SH21B",None,"promenade",
   "october drizzle beading the promenade railing in a perfect line of drops, each drop holding a tiny inverted harbour, the pier lamp cold beyond",
   "ECU","eye","static","morning",
   "октябрьская морось нанизывает на перила бусины, и в каждой висит перевёрнутый порт."),
 ]),
 ("daughter","celebration palette of tulle white, balloon pink, banquet-lamp gold and one empty-chair shadow",[
  ("A7_SH15B",None,"doch_wedding_cafe",
   "the banquet cafe emptied after midnight, streamers settling on abandoned chairs, one balloon drifting at ceiling height, the head-table photograph frame taken home",
   "WS","eye","static","night",
   "после полуночи кафе стихает, шары остаются ночевать под потолком, а рамку забирают домой."),
 ]),
 ("storm","dread palette of gale green-grey, radio-dial red, candle amber and third-day white",[
  ("A8_SH08B",None,"promenade",
   "storm waves bursting against the promenade parapet and falling back, spray reaching over the railing to the closed shutters of the seafront kiosks",
   "MS","eye","static","day",
   "волна перехлёстывает через парапет до самых киосков, и набережную закрывают на замок."),
 ]),
 ("ashore","landing palette of health-form beige, unfamiliar-morning grey, kitchen steam white and armchair moss green",[
  ("A9_SH12B",None,None,
   "a seaman's peaked cap hanging on a hallway hook beside a woman's coat and a small umbrella, morning light from the kitchen doorway touching its worn braid",
   "CU","eye","static","morning",
   "его фуражка теперь висит в прихожей рядом с твоим пальто, круглый год, без расписания."),
 ]),
 ("learning","mellow palette of promenade gold hour, grandchild bright stripes, tea steam white and acacia green",[
  ("A10_SH12B",None,"harbor_panorama",
   "the evening bay crossed by a small white ferry with lit windows, its wake a soft gold zip across calm water, the lighthouse answering with its first turn",
   "EWS","eye","static","evening",
   "вечерний паром до островов расстёгивает бухту золотой молнией ровно в семь пятнадцать."),
 ]),
]

for key,pal,shots in ACTS:
    rows=[(code,None,loc,subj,st,ang,mv,tod,True,False,narr) for code,_ch,loc,subj,st,ang,mv,tod,narr in shots]
    seed_act(key,pal,rows,id_region="a")
