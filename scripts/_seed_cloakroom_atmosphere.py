# -*- coding: utf-8 -*-
"""cloakroom atmosphere breathers: 2 per gallery act (time/season markers across the decades-spanning gallery).
id_region='a' so codes (GA_SZ*) sort to each scene's end and never collide with main shots. All env -> static."""
from _cloakroom_engine import seed_act

PAL_A="warm chandelier-gold arrivals palette, brass and deep red velvet, polished marble, an evening of elegant arrivals"
PAL_B="cool faded-plush palette, dim gold house-light, worn velvet and old paper, a wry chill in the air"
PAL_C="tender amber yearly-ritual palette, warm soft brown and gold, a worn glow of small private occasions"
PAL_D="faded gilt palette, tarnished gold and powder, old perfume and dimming chandeliers, wistful and grand"
PAL_E="cold post-communist palette, blue-grey neon and worn marble, a thin chill, flat modern light creeping into old gilt"

GA_SZ=[
 ("GA_SZ1",None,"street_cobble","the cobbled theatre square in autumn rain, wet stones and bare plane trees, the lit facade beyond","EWS","high","push_in","day",True,False,
  "за окнами театра сменяются сезоны, дожди и снег, а ты всё стоишь за своей стойкой."),
 ("GA_SZ2",None,"cloakroom_counter","a dense wall of many coats grown thicker on the numbered hooks, ordered and quiet","INSERT","eye","push_in","dusk",True,False,
  "стена чужих пальто становится всё гуще, год за годом, и ты знаешь каждое на ней наизусть."),
]
GB_SZ=[
 ("GB_SZ1",None,"foyer_marble","the grand foyer chandeliers dimming after a performance, the marble deserted and still","WS","high","pull_out","night",True,False,
  "люстры в фойе гаснут после спектакля, и театр снова остаётся пустым, как и каждую ночь."),
 ("GB_SZ2",None,"cloakroom_counter","extreme close on rows of brass numbered hooks dulled by years of handling","INSERT","eye","push_in","day",True,False,
  "латунные крючки тускнеют от времени, и ты протираешь их по утрам, один за другим."),
]
GC_SZ=[
 ("GC_SZ1",None,"street_cobble","the cobbled theatre square under fresh snow at night, the facade glowing warm above white stones","EWS","eye","static","night",True,False,
  "снег ложится на брусчатку перед театром, и кажется, что эти зимы повторяются уже без счёта."),
 ("GC_SZ2",None,"auditorium","tiers of empty red velvet seats waiting in the dim house-light before a performance","INSERT","low","push_in","dusk",True,False,
  "восемьсот кресел ждут зрителей каждый вечер, и каждый вечер они приходят, но только не к тебе."),
]
GD_SZ=[
 ("GD_SZ1",None,"stage_empty","the lone ghost-light burning on the empty stage at night, the dark house beyond","WS","eye","static","night",True,False,
  "дежурная лампа горит на сцене всю ночь, и ты один знаешь её ровный неподвижный свет."),
 ("GD_SZ2",None,"backstage_lost","the crowded lost-property rail of unclaimed coats of every era under a caged work-light","INSERT","eye","push_in","night",True,False,
  "вешалка забытых вещей растёт, и каждое ничьё пальто хранит чью-то так и не досказанную историю."),
]
GE_SZ=[
 ("GE_SZ1",None,"street_cobble","the theatre square at dusk with faint modern neon and traffic beyond the old facade","EWS","high","pan_right","dusk",True,False,
  "город за театром меняется, неон и машины, а в фойе всё так же пахнет бархатом и пылью."),
 ("GE_SZ2",None,"cloakroom_counter","the single empty brass hook number one standing bare among hundreds of occupied hooks","INSERT","eye","push_in","night",True,True,
  "крючок номер один всё пустует среди сотен занятых, и ты всё ещё ждёшь там своё имя."),
]

seed_act("gallery_a", PAL_A, GA_SZ, render_mode="static", id_region="a")
seed_act("gallery_b", PAL_B, GB_SZ, render_mode="static", id_region="a")
seed_act("gallery_c", PAL_C, GC_SZ, render_mode="static", id_region="a")
seed_act("gallery_d", PAL_D, GD_SZ, render_mode="static", id_region="a")
seed_act("gallery_e", PAL_E, GE_SZ, render_mode="static", id_region="a")
