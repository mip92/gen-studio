# -*- coding: utf-8 -*-
"""Coda (coda) — final tragic image (implied, never shown), then narrator-to-viewer warning, disclaimer, helpline, CTA."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _seed_message_act_engine import seed_act

MOOD = ("final still winter-night kitchen, deep blue-black with a single fading screen glow, utterly hollow and quiet, "
        "then plain dark solemn card frames, grave warning mood")

# Final image (1-6): tragic close, implied only, NO act shown, NO word. Narrator-to-viewer (7-22).
SHOTS = [
 ("CODA_SH01","IRINA","kitchen","medium shot of the hollow woman alone at the dark kitchen table on a winter night, a year later","MS","eye","static","winter_night_2027",False,False,
  "снова зима, снова та самая тёмная кухня, снова три часа ночи, и ты снова совсем одна"),
 ("CODA_SH02",None,"kitchen","extreme close-up of a phone showing eleven missed calls from Даша дочь","ECU","eye","static","winter_night_2027",False,True,
  "на экране телефона одиннадцать пропущенных от даши, она звонила весь вечер, как звонит каждый вечер"),
 ("CODA_SH03","IRINA","kitchen","close-up of the woman looking at her daughter's name, unable to breathe for shame","CU","eye","static","winter_night_2027",False,False,
  "ты смотришь на её имя, на эти одиннадцать звонков, и тебе нечем дышать от стыда и пустоты"),
 ("CODA_SH04","IRINA","kitchen","medium shot of the woman rising and opening the window to the cold night air","MS","eye","static","winter_night_2027",False,False,
  "ты встаёшь и подходишь к окну, открываешь его на проветривание, в комнату входит морозный воздух"),
 ("CODA_SH05",None,"kitchen","wide shot of an open ninth-floor kitchen window at night, thin lace curtain drifting in the cold draft, the sleeping courtyard far below, no people, utterly still","WS","eye","static","winter_night_2027",False,True,
  "девятый этаж, тюль на сквозняке, внизу спящий двор, и очень, очень тихо, и больше ничего"),
 ("CODA_SH06",None,"kitchen","extreme close-up of a phone on the dark table lighting up with a twelfth call from Даша дочь, then slowly dimming to black, no people","ECU","eye","static","winter_night_2027",False,True,
  "а на столе светится телефон, даша дочь, двенадцатый звонок, и экран медленно гаснет"),
 ("CODA_SH07",None,None,"close-up of a dark empty kitchen with a single faint light and an empty chair at the table, no people, solemn quiet","CU","eye","static","",True,False,
  "ты досмотрел до конца, спасибо, а теперь послушай, потому что это может коснуться и тебя"),
 ("CODA_SH08",None,None,"medium shot of a phone glowing in the dark with an open dating chat, no people, symbolic","MS","eye","static","",True,False,
  "каждый день тысячи людей знакомятся в сети с теми, кого никогда не видели вживую"),
 ("CODA_SH09",None,None,"close-up of a phone showing a one-sided chat where a video call never happens, no people","CU","eye","static","",True,False,
  "если человек месяцами не может позвонить по видео, его не существует таким, каким ты его знаешь"),
 ("CODA_SH10",None,None,"close-up of a single repeated profile photo of a man in a hard hat on a screen, no people","MS","eye","static","",True,False,
  "если у него всегда одно и то же фото и тысяча причин не показать лицо вживую, это не любовь, это сценарий"),
 ("CODA_SH11",None,None,"close-up of a money-transfer confirmation glowing on a phone in the dark, no people","CU","eye","static","",True,False,
  "если он просит деньги, на таможню, на билет, на лечение, на залог, любой ценой, это всегда развод"),
 ("CODA_SH12",None,None,"medium shot of a phone with a family contact greyed out and ignored, no people, isolation","MS","eye","static","",True,False,
  "если он ссорит тебя с детьми и друзьями, шепчет что они завидуют твоему счастью, он отрезает тебя от помощи"),
 ("CODA_SH13",None,None,"close-up of a phone screen filling with insistent pressuring messages, no people","CU","eye","static","",True,False,
  "настоящий человек поймёт твоё нет, мошенник будет давить, торопить и вызывать чувство вины"),
 ("CODA_SH14",None,None,"medium shot of a reverse image search running on a phone screen, no people","MS","eye","static","",True,False,
  "не стыдись проверить, загрузи его фото в поиск по картинке, позвони детям, расскажи близким, спроси вслух"),
 ("CODA_SH15",None,None,"close-up of a phone showing a contact simply named Мама, no people","CU","eye","static","",True,False,
  "и если у тебя есть мама, бабушка, тётя, одинокая и счастливая от новой переписки, просто позвони ей"),
 ("CODA_SH16",None,None,"medium shot of two phones side by side suggesting reaching out, no people","MS","eye","static","",True,False,
  "спроси, видела ли она его вживую, слышала ли голос, не просил ли он денег, побудь рядом, не осуждая"),
 ("CODA_SH17","IRINA","kitchen","close-up of the hollow woman's face, everything lost for letters on a screen","CU","eye","static","winter_night_2027",False,False,
  "ирина потеряла кольцо, сбережения, четыре миллиона, и почти потеряла дочь, из-за набора букв на экране"),
 ("CODA_SH18",None,None,"medium shot of an empty chair by a window where someone could have sat in time, no people, what-if","MS","eye","static","",True,False,
  "а ведь её могло не быть в этой истории, если бы кто-то вовремя оказался рядом и задал один вопрос"),
 ("CODA_SH19",None,None,"wide plain dark solemn card frame, no people, no text","WS","eye","static","",True,False,
  "эта история вымышлена, все совпадения с реальными людьми и событиями случайны"),
 ("CODA_SH20",None,None,"plain dark solemn card frame, no people, no text","CU","eye","static","",True,False,
  "но таких историй тысячи, и за каждой настоящая жизнь, не повторяй чужих ошибок"),
 ("CODA_SH21",None,None,"plain dark card frame with a quiet sense of help offered, no people, no text","MS","eye","static","",True,False,
  "если ты или твои близкие столкнулись с этим, не молчи, позвони на телефон доверия сто пятьдесят или в полицию сто два"),
 ("CODA_SH22",None,None,"plain dark end card frame, no people, no text","WS","eye","static","",True,False,
  "подпишись, здесь показывают, как всё заканчивается, и как этого не допустить, береги своих близких"),
]

if __name__ == "__main__":
    seed_act("eb","CODA_grey",MOOD,"010b000000","015b000000","static","coda",SHOTS)
