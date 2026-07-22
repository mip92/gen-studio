# -*- coding: utf-8 -*-
"""trucker: aftermath (10) + coda (5). Run: PYTHONIOENCODING=utf-8 python scripts/_seed_trucker_A9F.py"""
from _trucker_engine import seed_act

MA="MAX_ADULT"; S="STEP_BASE"

# ── A9 AFTERMATH — семь лет спустя ─────────────────────────────────────────────
PAL_9="washed-out winter palette, pale sun through haze"
AFTER=[
 ("A9_SH01",None,"base_yard",
  "the same freight base seven years on under pale winter haze, newer trailers in the old rows, thin snow lying in the tyre ruts, the container office repainted but the same",
  "EWS","eye","static","day",True,False,
  "проходит семь лет, тебе двадцать девять, и ты грузчик на той же самой базе."),
 ("A9_SH02",MA,"warehouse_ramp",
  "Maksim at twenty-nine in a dark loader's vest wheeling a loaded hand truck up the ramp, the same fingerless gloves on his hands, breath steaming in the cold light",
  "MS","eye","track","day",False,False,
  "за руль тебя после того протокола не берёт никто, и ты давно перестал спрашивать."),
 ("A9_SH03",None,"logist_office",
  "the container office standing open and empty, a bare desk with two dusty phone sockets, venetian blinds hanging crooked, schedules peeled off the walls",
  "WS","eye","push_in","day",False,False,
  "аркадий уволился через месяц после суда и растворился в городе вместе со своей тетрадью."),
 ("A9_SH04",S,"impound",
  "Stepanych in a watchman's padded coat and the same tweed cap sitting on a stool by the impound gate booth, looking through the mesh at the rusting truck inside",
  "MCU","eye","push_in","dusk",False,True,
  "степаныч два года сторожил штрафстоянку, где за сеткой тихо ржавела его собственная фура."),
 ("A9_SH05",None,"impound",
  "the impound lot at dusk, the watchman's booth with a single window gone dark, snow settling on the cab roofs of the seized trucks",
  "EWS","high","static","dusk",True,False,
  "его сердце остановилось во сне, тихо и буднично, как глушат двигатель на ночной стоянке."),
 ("A9_SH06",None,"cemetery_hill",
  "the small hillside cemetery above the ring road in daylight, wind bending the wild grass between painted fences, tiny trucks moving on the highway far below",
  "WS","high","static","day",False,True,
  "хоронят его на холме над окружной, откуда видно, как внизу идут по трассе фуры."),
 ("A9_SH07",MA,"cemetery_hill",
  "Maksim standing at the cemetery gate as an older woman's hands pass him a dented aluminium thermos, his gloved hands closing around it very carefully",
  "MS","eye","static","day",False,False,
  "после похорон его сестра находит тебя и молча отдаёт то, что он просил передать."),
 ("A9_SH08","OBJ:thermos",None,
  "the dented aluminium thermos held in two fingerless-gloved hands against a winter sky, the small enamel cup still tied to the handle with its shoelace",
  "INSERT","low","static","day",False,True,
  "это тот самый мятый термос, и эмалированная кружка всё ещё привязана к ручке шнурком."),
 ("A9_SH09",MA,"truck_cab",
  "Maksim riding as a passenger in a stranger's cab, the thermos held on his knees with both hands, winter fields sliding past the window behind him",
  "MS","eye","static","day",False,False,
  "в чужой кабине, куда тебя пустили пассажиром, ты держишь термос на коленях всю дорогу."),
 ("A9_SH10",MA,"truck_cab",
  "Maksim unscrewing the thermos lid to the familiar click and pouring one single cup, steam rising, his eyes on the road ahead through the windshield",
  "MCU","eye","push_in","day",False,True,
  "ты откручиваешь крышку до знакомого щелчка и наливаешь одну кружку, теперь это твой ритуал.",
  "the young man slowly unscrewing the thermos lid and pouring steaming tea into the single metal cup"),
]

# ── CODA — без морали: образ, дорога, CTA, дисклеймер ──────────────────────────
PAL_F="quiet warm dawn palette"
CODA=[
 ("F_SH01","OBJ:thermos",None,
  "the aluminium thermos standing on an empty passenger seat of a truck cab in low dawn light, the enamel cup hanging on its shoelace, gentle steam from the open lid",
  "INSERT","eye","push_in","dawn",False,True,
  "эмалированная кружка на шнурке пережила твой долг, чужой приговор и своего немногословного хозяина."),
 ("F_SH02",None,"roadside_dawn",
  "the highway shoulder at first light, mist lifting off the fields in flat ribbons, the guard rail running toward a clean pale horizon",
  "EWS","eye","static","dawn",True,False,
  "долг ты в итоге закрыл честно и долго, за три года грузчиком на рампе."),
 ("F_SH03",None,"truck_cab",
  "the quiet empty cab of a long-haul truck at night, dashboard lights still on, both seats empty, rain dots glowing on the windshield",
  "MS","eye","static","night",True,False,
  "эта история вымышлена, все совпадения с людьми и событиями случайны, не повторяй чужих ошибок."),
 ("F_SH04",None,"day_highway",
  "an open sunlit highway rolling over a low hill, poplar shadows barred across the lanes, the sky high and simple",
  "WS","eye","track","day",True,False,
  "если тебе заходят такие истории, подпишись на канал, дальше будут другие жизни, прожитые за тебя."),
 ("F_SH05","OBJ:gloves",None,
  "a pair of worn brown fingerless driving gloves lying folded together on a clean dashboard in warm morning light",
  "INSERT","eye","push_in","morning",False,True,
  "а перчатки отца ты носишь до сих пор, и они наконец стали тебе впору."),
]

if __name__=="__main__":
    seed_act("aftermath",PAL_9,AFTER)
    seed_act("coda",PAL_F,CODA)
