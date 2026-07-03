# -*- coding: utf-8 -*-
"""layoff acts A0 cold_open + A1 origin. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_layoff_A0A1.py"""
from _layoff_engine import seed_act

P_COLD="cold desaturated corporate palette, grey-blue and pale steel tones, harsh even fluorescent light, thin cold shadows"
P_WARM="warm hopeful palette, amber and honey tones, soft morning window light, gentle warm shadows"

# (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
COLD=[
 ("A0_SH01","GEROY_MAIN","glass_meeting","a lone man of forty-four sitting at the pale oval table of a glass-walled meeting room, a closed folder in front of him, his shoulders tense","WS","eye","push_in","day",False,False,
  "ты сидишь в стеклянной переговорке, в которой сам провёл сотни совещаний, и впервые не ты её ведёшь."),
 ("A0_SH02","ELYA_BASE","glass_meeting","a composed young woman with a sleek golden-blonde bob sitting across the table, a slim tablet held flat to her chest, sliding a single sheet of paper forward","MCU","eye","static","day",False,False,
  "напротив сидит эйчар по имени эля, ей двадцать девять, и она пришла в компанию, когда ты отработал уже пятнадцать лет."),
 ("A0_SH03",None,"glass_meeting","a macro insert of a single sheet of paper on the table, one short printed line of text and an empty signature field, a pen lying beside it","INSERT","top","static","day",False,False,
  "на листе всего одна строка и пустое поле для подписи, и ты уже знаешь каждое слово, которое там стоит."),
 ("A0_SH04","GEROY_MAIN","glass_meeting","over the shoulder of the blonde HR woman in the foreground, the tense seated man in soft focus beyond, the glass office behind him","OTS","over","static","day",False,False,
  "ты слышишь знакомые слова про эффективность и реструктуризацию, и очередь наконец дошла до тебя."),
 ("A0_SH05","GEROY_MAIN","glass_meeting","an extreme close-up of the man's hand closing around a plastic employee access card on a blue lanyard at his chest","ECU","eye","push_in","day",False,True,
  "твоя рука сама ложится на пропуск на синем шнурке, будто эта карта ещё что-то решает."),
 ("A0_SH06","ELYA_BASE","glass_meeting","the blonde HR woman waiting in a medium shot, the slim tablet pressed to her chest, a neutral patient corporate face","MS","eye","static","day",False,False,
  "эля прижимает планшет к груди и спокойно ждёт, и в переговорке слышно только гудение кондиционера."),
 ("A0_SH07",None,"open_floor","a wide empty view of the open-plan office floor through glass, long rows of identical desks under cold fluorescent panels","EWS","eye","static","day",True,False,
  "если хочешь понять, как один лист бумаги стирает девятнадцать лет жизни, останься со мной до конца и подпишись."),
 ("A0_SH08","GEROY_MAIN","glass_meeting","a close-up of the forty-four-year-old man's tired face looking down at the paper, the pen near his hand","CU","eye","push_in","day",False,True,
  "тебе сорок четыре, и вся твоя жизнь сейчас умещается между этой ручкой и пустым полем для подписи."),
]

ORIGIN=[
 ("A1_SH01","GEROY_YOUNG","street_tower","a hopeful young man of twenty-four standing on the pavement at the foot of a tall glass office tower, looking up, a plain shirt","WS","low","push_in","morning",False,False,
  "девятнадцать лет назад тебе двадцать четыре, и ты стоишь у этой стеклянной башни, задрав голову, в свой первый рабочий день."),
 ("A1_SH02","GEROY_YOUNG","turnstile_lobby","an extreme close-up of the young man pressing a brand-new plastic access card on a blue lanyard against a glass turnstile reader glowing green","ECU","eye","static","morning",False,True,
  "охранник выдаёт тебе новенький пропуск, ты прикладываешь его к турникету, и звучит первый короткий писк."),
 ("A1_SH03","GEROY_YOUNG","turnstile_lobby","a medium close-up of the young man's face lit with pride as the turnstile lets him through, the lobby warm behind him","MCU","eye","push_in","morning",False,False,
  "загорается зелёный огонёк, турникет пускает тебя внутрь, и тебе кажется, что он впускает тебя в целую жизнь."),
 ("A1_SH04","GEROY_YOUNG","open_floor","a wide shot of the young man being shown an empty desk in a long row of identical desks on the open office floor","WS","high","pan_right","day",False,False,
  "тебе показывают пустой стол в длинном ряду одинаковых столов, и ты твёрдо решаешь стать здесь незаменимым."),
 ("A1_SH05",None,"your_desk","a top-down macro insert of a bare clean new desk surface with an empty white mug and nothing else, no clutter yet","INSERT","top","static","day",True,False,
  "на новом столе пока только чистая столешница и пустая кружка, без единой твоей вещи."),
 ("A1_SH06","GEROY_YOUNG","your_desk","a medium close-up of the young man sitting down at the desk and setting his mug at the edge, hopeful and eager","MCU","eye","static","day",False,False,
  "ты садишься, ставишь кружку на край стола и впервые ощущаешь себя частью чего-то большого и надёжного."),
 ("A1_SH07","GEROY_YOUNG","your_desk","a close-up of the young man touching the access card resting on his chest, a quiet private vow on his face","CU","eye","push_in","day",False,True,
  "ты трогаешь пропуск на груди и обещаешь себе отдать этой компании всё, что у тебя есть."),
 ("A1_SH08",None,"open_floor","a wide establishing view of the vast open office floor, hundreds of identical desks stretching away under the grid ceiling","EWS","eye","static","day",True,False,
  "вокруг тебя сотни таких же столов, и за каждым кто-то когда-то начинал так же, как ты сейчас."),
 ("A1_SH09","GEROY_YOUNG","your_desk","a medium shot of the young man looking up across the office floor from his new desk, certain of his future","MS","low","push_in","day",False,True,
  "ты садишься крепко, будто этот стол выдан тебе навсегда, и в двадцать четыре в это легко верить."),
]

if __name__=="__main__":
    seed_act("cold_open", P_COLD, COLD, render_mode="animated")
    seed_act("origin",    P_WARM, ORIGIN, render_mode="animated")
