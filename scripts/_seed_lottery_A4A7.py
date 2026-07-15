# -*- coding: utf-8 -*-
"""lottery A4 vultures + A5 partner + A6 no_return + A7 collapse. PYTHONIOENCODING=utf-8 python scripts/_seed_lottery_A4A7.py"""
from _lottery_engine import seed_act

P_VULTURES="pressed-upon palette, doorbell yellow and hallway grey, too many coats in the light, crowded warm-cold"
P_PARTNER="promised-return palette, blueprint blue and banner gloss over raw earth brown, persuasive and hollow"
P_NORETURN="felt-green palette, deep casino green and brass under low cones of light, windowless timeless dark"
P_COLLAPSE="emptying palette, packing-box brown and glass grey, warm things leaving cold rooms"

VULTURES=[
 ("A4_SH01",None,"city_street","a wide view of a residential street with familiar figures loitering by an upscale entrance","WS","eye","push_in","day",True,False,
  "новость расходится за месяц, и у твоего подъезда начинают дежурить знакомые лица."),
 ("A4_SH02","VITYA_BASE","penthouse","a medium close-up of a fleshy maroon-jacketed man of forty-five at the door with a cake box and a wide grin","MCU","eye","static","day",False,False,
  "первым приходит брат Витя в бордовой куртке, с тортом и словами: мы же семья."),
 ("A4_SH03","HERO_RICH","penthouse","a close-up of the host listening across the coffee table, polite and already tired","CU","eye","static","day",False,False,
  "Витя просит четыре миллиона на автомойку, бизнес-план у него на двух листах, устный."),
 ("A4_SH04","VITYA_BASE","penthouse","a medium shot of the maroon-jacketed brother pumping a handshake by the lift doors, cake forgotten","MS","eye","static","day",False,False,
  "ты даёшь, потому что брат, и он уходит быстрее, чем остывает чай."),
 ("A4_SH05",None,None,"an extreme close-up insert of an offered pen lying untouched beside a blank sheet on a coffee table","ECU","top","static","day",True,False,
  "расписку Витя писать обижается: ты что, мне не веришь, я же не чужой."),
 ("A4_SH06",None,"penthouse","a wide view of the living room crowded with visitors on the white sofa, coats over the armrests","WS","eye","pan_left","day",True,False,
  "дальше идут одноклассники, сослуживцы, тренер по боксу и двоюродные, которых ты видишь впервые."),
 ("A4_SH07","HERO_RICH","penthouse","a medium close-up of the man writing names into a small squared notebook at the marble counter","MCU","eye","static","evening",False,False,
  "ты заводишь блокнот и записываешь, кому что обещал, чтобы не обещать дважды."),
 ("A4_SH08","OBJ:list",None,"an extreme close-up macro insert of a squared notebook page dense with numbered names and ticks","ECU","top","push_in","evening",True,True,
  "к весне в блокноте восемьдесят семь строк, и против тридцати уже стоит галочка «дал»."),
 ("A4_SH09","TANYA_BASE","penthouse","a medium shot of the braided woman at the door speaking through a narrow gap, knuckles white on the handle","MS","eye","static","day",False,False,
  "Таня учится говорить «его нет дома» через дверь и ненавидит себя за это."),
 ("A4_SH10",None,"restaurant","a wide view of a loud table of guests raising glasses, the host's seat nearest the bill tray","WS","eye","static","night",True,False,
  "друзья твоей удачи гуляют широко, и счёт всегда как-то оказывается у твоего края стола."),
 ("A4_SH11","HERO_RICH","penthouse","a close-up of the man's face lit by a ringing phone he does not answer","CU","eye","push_in","night",False,False,
  "ты замечаешь, что тебе звонят только с просьбами, и выключаешь телефон на ночь."),
 ("A4_SH12","VITYA_BASE","penthouse","a medium close-up of the maroon-jacketed brother spreading his hands in the doorway, grin thinner","MCU","eye","static","day",False,False,
  "автомойка Вити прогорает за полгода, и он приходит не отдавать, а занимать снова."),
 ("A4_SH13",None,None,"an extreme close-up insert of a notebook line double-ticked with one short word added in pencil","ECU","top","static","day",True,False,
  "напротив его строки ты ставишь вторую галочку и дописываешь рядом короткое слово «всё»."),
 ("A4_SH14",None,"penthouse","a wide view of the quiet living room after a door has closed, two cold cups on the table","WS","eye","static","evening",True,False,
  "после первого твоего «нет» Витя называет тебя зажравшимся, и это только начало."),
 ("A4_SH15","HERO_RICH","penthouse","a medium shot of the man at the glass wall with the notebook, city lights below him","MS","low","static","night",False,True,
  "ты стоишь над городом со списком на восемьдесят семь строк и не находишь в нём друзей."),
 ("A4_SH16",None,None,"an extreme close-up insert of a phone screen with a tall stack of missed-call notifications","ECU","pov","static","night",True,False,
  "в телефоне тридцать шесть пропущенных, и ни одного номера, по которому хочется перезвонить."),
]

PARTNER=[
 ("A5_SH01",None,"restaurant","a wide view of a discreet corner of the restaurant, two men being introduced over small coffees","WS","eye","push_in","evening",True,False,
  "Аркадия тебе представляют в ресторане как человека, который умножает деньги серьёзных людей."),
 ("A5_SH02","ARKADIY_BASE","restaurant","a medium close-up of a silver-haired man of fifty in a snow-white scarf, a calm expensive smile","MCU","eye","static","evening",False,False,
  "ему пятьдесят, у него белоснежный шарф, тихий голос и уверенность дорогого врача."),
 ("A5_SH03",None,None,"an extreme close-up insert of an embossed business card with a single word and a phone number","ECU","top","static","evening",True,False,
  "на визитке одно слово «инвестиции» и телефон, и это выглядит солиднее любого сайта."),
 ("A5_SH04","HERO_RICH","restaurant","a medium shot of the man leaning in over the table, listening to percentages with workman's attention","MS","over","static","evening",False,False,
  "Аркадий предлагает торговый центр: сорок процентов годовых, земля уже наша, осталось построить."),
 ("A5_SH05",None,"pit","a wide view of a fenced site with a glossy mall render on a banner, raw field behind it","WS","eye","pan_right","day",True,False,
  "на площадке висит баннер с зеркальным красавцем-ТЦ, а под баннером пока только трава."),
 ("A5_SH06","HERO_RICH","pit","a close-up of the man squinting at the banner, wanting the picture more than checking it","CU","eye","push_in","day",False,False,
  "ты слесарь, ты не понимаешь в стройке, но сорок процентов понимаешь очень хорошо."),
 ("A5_SH07","ARKADIY_BASE","pit","a medium shot of the white-scarfed man presenting a thick folder on a car bonnet, seals visible","MS","eye","static","day",False,False,
  "документы у Аркадия толстые, печати синие, и знакомый юрист за ужином говорит: вроде чисто."),
 ("A5_SH08",None,None,"an extreme close-up insert of a signature going onto an investment agreement line, a heavy pen","ECU","eye","push_in","day",True,True,
  "ты переводишь двадцать восемь миллионов и получаешь папку, наклейку «инвестор» и рукопожатие."),
 ("A5_SH09",None,"pit","a wide view of early works in the pit, one excavator digging, rebar bundles stacked","WS","high","static","day",True,False,
  "первые месяцы на площадке даже копают, и ты возишь Таню показывать свой котлован."),
 ("A5_SH10","HERO_RICH","pit","a medium close-up of the man at the pit edge, chin up, coat open to the wind","MCU","low","static","day",False,False,
  "ты стоишь на краю будущего атриума и чувствуешь себя не выигравшим, а заработавшим."),
 ("A5_SH11",None,None,"an extreme close-up insert of a glossy monthly report page with a climbing chart","ECU","top","static","day",True,False,
  "раз в месяц приходят отчёты с растущими графиками, напечатанные на очень хорошей бумаге."),
 ("A5_SH12",None,"pit","a wide view of the site in winter, a tilted idle crane over a rain-flooded pit, a guard hut with a dog","WS","eye","static","day",True,False,
  "к зиме на площадке остаются кран, лужа на дне и сторож с собакой."),
 ("A5_SH13","HERO_RICH","penthouse","a medium close-up of the man redialing at the glass wall, jaw tightening with each tone","MCU","eye","static","night",False,False,
  "телефон Аркадия сначала занят, потом недоступен, потом женский голос говорит: он в командировке."),
 ("A5_SH14",None,"pit","a close-up view of the weathered banner, the glossy mall render bleached and peeling at the corner","CU","eye","push_in","day",True,False,
  "баннер с зеркальным ТЦ выцветает за зиму, и красавец на нём становится призраком."),
]

NO_RETURN=[
 ("A6_SH01",None,"casino","a wide establishing view of a casino floor at night, green felt tables under low cones of light","WS","eye","push_in","night",True,False,
  "казино тебе показывает один из «друзей удачи»: расслабься, ты же можешь себе позволить."),
 ("A6_SH02","HERO_RICH","casino","a medium close-up of the man at a roulette table for the first time, chips awkward in a workman's hand","MCU","eye","static","night",False,False,
  "ты заходишь посмеяться, с двадцатью тысячами, и выходишь в четыре утра с минус двухсот."),
 ("A6_SH03","OBJ:chip",None,"an extreme close-up macro insert of a heavy gold-rimmed clay chip on green felt","ECU","top","static","night",True,False,
  "фишка тяжелее монеты и легче денег, и в этом весь фокус этого места."),
 ("A6_SH04","HERO_RICH","casino","a medium shot of the man back at the wheel a week later, coat over the chair, settled in","MS","eye","static","night",False,False,
  "через неделю ты возвращаешься отыграть двести тысяч, потому что это же просто вернуть своё."),
 ("A6_SH05","HERO_RICH","casino","a close-up of the man's eyes in the green table light, counting backwards from even","CU","eye","push_in","night",False,False,
  "слово «отыграть» окажется самым дорогим словом в твоей жизни, дороже слова «инвестиции»."),
 ("A6_SH06",None,"casino","a wide view of the windowless floor, velvet ropes, a wall where a clock should be and is not","WS","eye","pan_left","night",True,False,
  "в зале нет окон и часов, и твои вечера здесь склеиваются в один длинный вечер."),
 ("A6_SH07","HERO_RICH","casino","a medium close-up of the man pausing mid-bet, hand hovering over the felt, hearing a voice only he remembers","MCU","eye","static","night",False,True,
  "где-то на пятом часе игры в голове звучит отец: с получки — один, больше — жадность."),
 ("A6_SH08",None,None,"an extreme close-up insert of a full stack of chips being pushed onto red across the felt","ECU","top","push_in","night",True,True,
  "ты слышишь его голос и всё равно двигаешь на красное всё, что на столе."),
 ("A6_SH09",None,"casino","a wide view of the floor at dawn hour, tables thinning, one figure heading for the doors","WS","eye","static","night",True,False,
  "к лету казино съедает одиннадцать миллионов, и ты начинаешь врать Тане про командировки."),
 ("A6_SH10","TANYA_BASE","penthouse","a medium close-up of the braided woman watching her husband eat, saying nothing, a new kind of quiet","MCU","eye","static","evening",False,False,
  "Таня не устраивает сцен, она просто смотрит, как ты ешь, и молчит новым молчанием."),
 ("A6_SH11",None,None,"an extreme close-up insert of a phone screen with a short declined-payment notification","ECU","pov","static","day",True,False,
  "банк отклоняет твою карту вежливо, одним коротким сообщением, и это происходит с тобой впервые."),
 ("A6_SH12","HERO_RICH","penthouse","a medium shot of the man alone in the dark living room, the gilded frame a pale rectangle above him","MS","low","static","night",False,False,
  "ты сидишь в тёмной гостиной под рамкой с билетом и не можешь на неё смотреть."),
]

COLLAPSE=[
 ("A7_SH01",None,"penthouse","a wide view of the living room filling with packed boxes, gaps on the shelves like missing teeth","WS","eye","push_in","day",True,False,
  "в октябре Таня собирает коробки молча, и Максим помогает ей, не глядя на тебя."),
 ("A7_SH02","TANYA_BASE","penthouse","a medium close-up of the braided woman in the doorway, coat on, saying one calm sentence","MCU","eye","static","day",False,True,
  "она говорит без злости: я выходила за наладчика, а этого человека я не знаю."),
 ("A7_SH03",None,None,"an extreme close-up insert of two key sets laid parallel on a marble counter","ECU","top","static","day",True,False,
  "ключи от пентхауса она кладёт на мраморную стойку, свои и Максима, ровно."),
 ("A7_SH04","HERO_RICH","penthouse","a medium shot of the man alone in two hundred metres of glass and echo, arms hanging","MS","eye","static","evening",False,False,
  "ты остаёшься в двухстах метрах стекла один, и эхо здесь дороже мебели."),
 ("A7_SH05",None,"city_street","a wide view of the winter street outside a courthouse, bare trees and slow traffic","WS","eye","static","day",True,False,
  "аркадиево дело закрывают за отсутствием состава: по бумагам ты сам всё подписал."),
 ("A7_SH06",None,None,"an extreme close-up insert of an official resolution page, one phrase underlined by a reading finger","ECU","pov","static","day",True,False,
  "в постановлении написано «предпринимательский риск», и эти два слова стоят двадцать восемь миллионов."),
 ("A7_SH07","HERO_RICH","city_street","a medium close-up of the man outside a law office, holding an invoice like a diagnosis","MCU","eye","static","day",False,False,
  "юрист разводит руками и выставляет счёт за то, что развёл руками красиво."),
 ("A7_SH08",None,"pit","a wide view of the stalled site under snow, the crane and the flooded pit gone still and white","WS","eye","pan_right","day",True,False,
  "недострой уходит за девять миллионов, треть вложенного, покупателю с очень спокойными глазами."),
 ("A7_SH09","VITYA_BASE","city_street","a medium shot of the maroon-jacketed brother crossing to the far pavement, collar up, eyes forward","MS","eye","track","day",False,False,
  "брат Витя перестаёт брать трубку совсем, а при встрече переходит на другую сторону."),
 ("A7_SH10","HERO_RICH","city_street","a close-up of the man standing in rain under lit windows, hood down, taking it","CU","low","push_in","night",False,True,
  "ты стоишь под его окнами, как когда-то просители под твоими, и уходишь."),
 ("A7_SH11",None,"penthouse","a wide view of the emptied penthouse at dusk, one cardboard box by the lift doors","WS","eye","static","evening",True,False,
  "из пентхауса ты съезжаешь с одной коробкой, и половина её — это рамка с билетом."),
 ("A7_SH12","OBJ:ticket_frame",None,"an extreme close-up macro insert of the gilded frame lying glass-down on folded sweaters in a box","ECU","top","static","evening",True,False,
  "рамка лежит поверх свитеров стеклом вниз, но выбросить её у тебя не поднимается рука."),
]

if __name__=="__main__":
    seed_act("vultures",P_VULTURES,VULTURES)
    seed_act("partner",P_PARTNER,PARTNER)
    seed_act("no_return",P_NORETURN,NO_RETURN)
    seed_act("collapse",P_COLLAPSE,COLLAPSE)
