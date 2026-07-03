# -*- coding: utf-8 -*-
"""layoff act A4 turn (точка невозврата: остался из лояльности). PYTHONIOENCODING=utf-8 python scripts/_seed_layoff_A4.py"""
from _layoff_engine import seed_act
PAL="dim regretful palette, muted teal and grey, low lamp light and cold window blue, heavy quiet shadows"
S=[
 ("A4_SH01",None,"your_desk","a macro insert of an old office phone screen showing a missed call and a recruiter's short message","INSERT","top","static","day",True,False,
  "лет пять назад тебе на рабочий телефон звонит рекрутер и зовёт в другую компанию на должность выше."),
 ("A4_SH02","GEROY_MAIN","your_desk","a medium close-up of the man at his desk holding the phone, weighing an offer with a guarded face","MCU","eye","static","day",False,False,
  "ты слушаешь предложение, прикидываешь цифры, а потом говоришь, что подумаешь, и не перезваниваешь."),
 ("A4_SH03","GEROY_MAIN","your_desk","a close-up of the man's face talking himself out of it, a stubborn loyal set to his jaw","CU","eye","static","day",False,False,
  "ты убеждаешь себя, что ты тут нужен и что бросать своих посреди года просто непорядочно."),
 ("A4_SH04","WIFE_BASE","home_kitchen","a medium shot of the auburn-haired wife at the kitchen table speaking carefully, hopeful and cautious","MS","eye","static","night",False,False,
  "жена тогда осторожно говорит, что может стоит рискнуть и попробовать что-то новое, пока не поздно."),
 ("A4_SH05","GEROY_MAIN","home_kitchen","a close-up of the man waving the idea away with a tired dismissive hand","CU","eye","static","night",False,False,
  "ты отмахиваешься и отвечаешь, что в твоём возрасте уже поздно дёргаться и начинать сначала."),
 ("A4_SH06",None,"street_tower","a wide view of a rival office building across the street, one the man has avoided walking past for years","WS","low","static","day",True,False,
  "через дорогу стоит здание той самой компании, куда ты так и не пошёл, и ты обходишь его годами."),
 ("A4_SH07","GEROY_MAIN","open_floor","a medium close-up of the present-day man at his desk, the realisation of lost years on his face","MCU","eye","static","day",False,False,
  "проходит несколько лет, та вакансия давно занята, а ребята, что рискнули тогда, ушли далеко вперёд."),
 ("A4_SH08",None,"your_desk","a macro insert of a dusty recruiter's business card lying forgotten at the back of an open desk drawer","INSERT","top","static","day",True,False,
  "в нижнем ящике стола до сих пор лежит запылённая визитка того рекрутера, которую ты так и не выбросил."),
 ("A4_SH09","GEROY_MAIN","your_desk","a close-up of the man holding the dusty card, a slow bitter understanding in his eyes","CU","eye","push_in","day",False,True,
  "только сейчас ты понимаешь, что дверь, в которую можно было выйти, тихо закрылась ещё тогда."),
 ("A4_SH10",None,"bedroom_night","a wide view of the dim bedroom the night before, an unmade bed, a sleepless cold-blue window","WS","eye","static","night",True,False,
  "в ночь перед той встречей ты лежишь в постели и не можешь уснуть, считая трещины на потолке."),
 ("A4_SH11","GEROY_MAIN","bedroom_night","a medium close-up of the man lying awake in lamp light, staring upward, tense","MCU","eye","static","night",False,False,
  "завтрашняя пустая строка в календаре стоит у тебя перед глазами и не даёт дышать ровно."),
 ("A4_SH12","GEROY_MAIN","bedroom_night","a close-up of the man's worried face as a thought surfaces in the dark","CU","eye","static","night",False,False,
  "ты думаешь, что надо бы обновить резюме, которое ты не открывал почти двадцать лет."),
 ("A4_SH13","GEROY_MAIN","bedroom_night","a medium shot of the man half-reaching for a laptop on the nightstand, then stopping his hand","MS","eye","static","night",False,False,
  "ты тянешься к ноутбуку, но рука останавливается, потому что признать это вслух страшнее, чем не знать."),
 ("A4_SH14","GEROY_MAIN","bedroom_night","an extreme close-up of the access card on the nightstand catching the lamp light beside the man","ECU","eye","static","night",False,True,
  "на тумбочке поблёскивает пропуск, и тебе становится не по себе оттого, что ты не представляешь утра без него."),
 ("A4_SH15","GEROY_MAIN","bedroom_night","a medium close-up of the man closing his eyes, repeating a last reassurance to himself","MCU","eye","static","night",False,False,
  "ты закрываешь глаза и в последний раз повторяешь, что надёжных не трогают, и почти себе веришь."),
 ("A4_SH16",None,"street_tower","an extreme wide view of grey dawn rising over the glass office tower, the day of the meeting beginning","EWS","low","static","morning",True,True,
  "над башней встаёт серый рассвет, начинается тот самый день, и ты едешь туда, как ездил всегда."),
]
if __name__=="__main__": seed_act("turn", PAL, S, render_mode="animated")
