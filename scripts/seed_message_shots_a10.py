# -*- coding: utf-8 -*-
"""A10 (act_10_aftermath) — months later, hollowed out, ring gone, police futile, Dasha's calls piling up unanswered."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _seed_message_act_engine import seed_act

MOOD = ("flat overcast summer-to-autumn grey, all warmth gone, hollow muted washed-out low-saturation palette, "
        "numb desolate mood")

SHOTS = [
 ("A10_SH01","IRINA","yard","wide shot of the grey worn woman crossing the summer courtyard like a shadow","WS","eye","static","summer_overcast_2026",False,False,
  "проходит весна, наступает лето, а ты всё та же, серая тень в опустевшей квартире на конституции"),
 ("A10_SH02","IRINA","kitchen","close-up of the hollow woman at the bare kitchen table, no warmth left in her face","CU","eye","static","summer_overcast_2026",False,False,
  "там где раньше под рёбрами толкало тёплым, теперь тихая пустая пропасть, и она не закрывается"),
 ("A10_SH03","IRINA","kitchen","medium shot of the woman dividing her thin salary among collectors and loans","MS","high","static","summer_overcast_2026",False,False,
  "вся твоя зарплата уходит коллекторам и в микрозаймы, тебе оставляют ровно на хлеб и воду"),
 ("A10_SH04","IRINA","street","medium shot of the woman walking to the police station to file a report","MS","eye","static","summer_overcast_2026",False,False,
  "однажды ты находишь силы и идёшь в полицию, написать заявление, рассказать всё как было на самом деле"),
 ("A10_SH05",None,None,"close-up of a tired police investigator at a cluttered desk taking a statement, no warmth","CU","eye","static","summer_overcast_2026",False,False,
  "усталый следователь записывает, кивает, и говорит то, что ты так боялась услышать вслух"),
 ("A10_SH06",None,None,"close-up of the investigator's weary face explaining the case is hopeless","CU","eye","static","summer_overcast_2026",False,False,
  "эти дела почти не раскрываются, деньги давно за границей, через подставные карты, ищите ветра в поле"),
 ("A10_SH07","IRINA","street","medium shot of the woman leaving the station with a useless paper in hand","MS","eye","static","summer_overcast_2026",False,False,
  "ты выходишь из отдела с бумажкой о возбуждении, которая ничего не изменит, и это ты тоже знаешь"),
 ("A10_SH08","IRINA","pawn","medium shot of the woman at the pawnshop counter learning her ring is long sold","MS","eye","static","summer_overcast_2026",False,False,
  "ты приходишь в ломбард выкупить кольцо, но срок прошёл месяц назад, его уже давно продали"),
 ("A10_SH09",None,"pawn","extreme close-up of a glass display of strangers' gold rings, hers nowhere among them, no people","ECU","eye","push_in","summer_overcast_2026",False,True,
  "на витрине под стеклом чужие кольца, а твоего, того самого, больше нигде нет и не будет никогда"),
 ("A10_SH10","IRINA","street","wide shot of the woman walking home past a wedding party at the registry office","WS","eye","static","summer_overcast_2026",False,False,
  "ты идёшь домой по летнему городу, мимо чужих свадеб у загса, мимо чужого смеха и чужого счастья"),
 ("A10_SH11","IRINA","class","medium shot of the diminished woman finishing the school year, quieter than before","MS","eye","static","summer_overcast_2026",False,False,
  "в школе ты доводишь год, тише прежнего, дети выросли, а ты будто постарела сразу на десять лет"),
 ("A10_SH12","IRINA","staff","close-up of the woman lowering her eyes as colleagues fall silent when she enters","CU","eye","static","summer_overcast_2026",False,False,
  "коллеги что-то знают, разговоры стихают когда ты входишь, и ты опускаешь глаза и проходишь мимо"),
 ("A10_SH13","IRINA","kitchen","medium shot of the woman eating bread and tea alone at the bare table","MS","eye","static","summer_overcast_2026",False,False,
  "вечером ты ешь хлеб с чаем за пустым столом, и считаешь дни до зарплаты и до следующего платежа"),
 ("A10_SH14",None,"kitchen","extreme close-up of the phone ringing, the screen showing Даша дочь","ECU","eye","push_in","summer_overcast_2026",False,True,
  "и однажды вечером телефон звонит, на экране даша дочь, она всё-таки звонит тебе первой"),
 ("A10_SH15","IRINA","kitchen","medium shot of the woman staring at the ringing phone, unable to press answer","MS","eye","static","summer_overcast_2026",False,False,
  "и ты смотришь на её имя, и не можешь нажать, потому что не знаешь как посмотреть ей в глаза"),
 ("A10_SH16",None,"kitchen","extreme close-up of the screen showing one missed call from Dasha","ECU","eye","static","summer_overcast_2026",False,False,
  "звонок обрывается, один пропущенный от даши, и ты прижимаешь телефон к груди и беззвучно плачешь"),
 ("A10_SH17","IRINA","room","close-up of the woman as the calls keep coming day after day","CU","eye","static","summer_overcast_2026",False,False,
  "но даша не сдаётся, она звонит ещё, и ещё, через день, через два, она ищет и зовёт тебя"),
 ("A10_SH18","IRINA","kitchen","medium shot of the woman not answering, a wall of shame rising between them","MS","eye","static","summer_overcast_2026",False,False,
  "а ты всё не отвечаешь, стыд встал между вами стеной, и стена эта с каждым днём становится выше"),
 ("A10_SH19",None,"room","close-up of the phone with Dasha's message that she is not angry and loves her","CU","eye","static","autumn_overcast_2026",False,False,
  "она пишет, мам, я не сержусь, я тебя люблю, просто возьми трубку, пожалуйста, ты мне очень нужна"),
 ("A10_SH20","IRINA","room","close-up of the woman rereading the message, her hand freezing over the keys","CU","eye","static","autumn_overcast_2026",False,False,
  "ты перечитываешь это сто раз, и каждый раз рука замирает, и ты так и не отвечаешь своей дочери"),
 ("A10_SH21","IRINA","kitchen","medium shot of the woman as the hollow under her ribs deepens","MS","low","static","autumn_overcast_2026",False,False,
  "пропасть под рёбрами становится всё глубже, и ты уже не помнишь когда в последний раз улыбалась"),
 ("A10_SH22","IRINA","yard","wide shot of yellow leaves falling in the courtyard, the year closing toward winter","WS","eye","static","autumn_overcast_2026",False,False,
  "снова желтеют листья во дворе, год замыкается, скоро опять та зима, с которой всё началось"),
 ("A10_SH23","IRINA","kitchen","medium shot of the woman still paying private debts that barely shrink","MS","eye","static","autumn_overcast_2026",False,False,
  "ты всё ещё платишь по чужим распискам, долг почти не уменьшается, проценты съедают каждый взнос"),
 ("A10_SH24","IRINA","room","close-up of the woman carrying it all in silence, the weight growing heavier","CU","eye","static","autumn_overcast_2026",False,False,
  "ты больше ни с кем не говоришь о том что было, носишь это в себе, и оно становится всё тяжелее"),
 ("A10_SH25",None,"kitchen","extreme close-up of a phone screen with a growing list of missed calls from Dasha","ECU","eye","static","autumn_overcast_2026",False,True,
  "а пропущенных от даши уже не один, их всё больше и больше, и ты не отвечаешь ни на один из них"),
 ("A10_SH26","IRINA","kitchen","medium shot of the woman who has taught herself to feel nothing, slowly fading","MS","eye","static","autumn_overcast_2026",False,False,
  "ты научилась не чувствовать, так легче жить, но это не жизнь, а медленное угасание в полной тишине"),
 ("A10_SH27","IRINA","room","close-up of the woman looking at the white band on her bare ring finger","CU","eye","static","autumn_overcast_2026",False,False,
  "иногда ты смотришь на белую полоску на пальце, единственный след того, во что ты так верила"),
 ("A10_SH28","IRINA","kitchen","close-up of the woman alone at the dark window as another winter approaches","CU","low","static","autumn_overcast_2026",False,True,
  "и так проходит ещё одна осень, и ещё одна зима подступает к окну, а ты всё одна и одна"),
]

if __name__ == "__main__":
    seed_act("ea","A10_hollow_grey",MOOD,"010a000000","015a000000","static","act_10_aftermath",SHOTS)
