# -*- coding: utf-8 -*-
"""A3 (act_03_first_request) — first small money ask (5 000 tenge) + trust-building return."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _seed_message_act_engine import seed_act

MOOD = ("warm hopeful amber lamplight with soft phone-glow, tender intimate palette with the first faint "
        "cold-blue edge of doubt, low-contrast")

# code, char, loc, subject, shotType, angle, move, time, broll, iconic, narr
SHOTS = [
 ("A3_SH01","IRINA","kitchen","medium shot of the woman waking and reaching for her phone, a soft sleepy smile","MS","high","static","winter_morning_2025",False,False,
  "утро начинается с его доброго утра, ты улыбаешься экрану ещё до того как встала с кровати"),
 ("A3_SH02",None,"kitchen","extreme close-up of a phone screen with a warm good-morning message from Viktor","ECU","eye","static","winter_morning_2025",False,False,
  "доброе утро моя хорошая, пишет он, как спала, что тебе снилось"),
 ("A3_SH03","IRINA","room","medium shot of the woman getting ready for work while texting, the grey morning feeling lighter","MS","eye","static","winter_morning_2025",False,False,
  "ты собираешься на работу под его сообщения, и серое утро кажется светлее"),
 ("A3_SH04",None,"room","close-up of the phone screen full of plans about his arrival and meeting at the airport","CU","eye","static","winter_evening_2025",False,False,
  "вечерами вы строите планы, как он приедет, как ты встретишь его в аэропорту астаны"),
 ("A3_SH05","IRINA","room","medium shot of the woman lying back with the phone, eyes closed, imagining the meeting","MS","eye","static","winter_evening_2025",False,False,
  "ты представляешь его живым, как он обнимет тебя у выхода с рейса"),
 ("A3_SH06","IRINA","room","close-up of the woman's content face on the pillow, phone glow on her cheek","CU","low","static","winter_evening_2025",False,False,
  "и под рёбрами снова толкает тёплым, ты засыпаешь с телефоном на подушке"),
 ("A3_SH07","IRINA","kitchen","medium shot of the woman at the kitchen table sensing something is off in his short reply","MS","eye","static","winter_evening_2025",False,False,
  "однажды вечером он отвечает коротко, что-то не так, ты сразу чувствуешь"),
 ("A3_SH08",None,"kitchen","extreme close-up of a phone screen, Viktor writing that his phone credit ran out on the rig","ECU","eye","static","winter_evening_2025",False,False,
  "на платформе закончились деньги на телефоне, пишет он, в их лавке всё втридорога"),
 ("A3_SH09","IRINA","kitchen","medium shot of the woman reading his hesitant apologetic messages, concern on her face","MS","eye","static","winter_evening_2025",False,False,
  "ему неловко, он долго извиняется, говорит что не привык просить о таком"),
 ("A3_SH10",None,"kitchen","extreme close-up of the phone screen with the request to top up his number for 5000 tenge","ECU","eye","push_in","winter_evening_2025",False,True,
  "пополни мне номер на пять тысяч тенге, я верну сразу как сойду на берег"),
 ("A3_SH11","IRINA","kitchen","close-up of the woman freezing, doing quiet money math behind her eyes","CU","eye","static","winter_evening_2025",False,False,
  "ты замираешь, зарплата учителя сто восемьдесят тысяч, ты считаешь каждую тысячу"),
 ("A3_SH12","IRINA","kitchen","medium shot of the woman opening the Kaspi app and looking at her small balance","MS","high","static","winter_evening_2025",False,False,
  "ты открываешь каспи, смотришь на остаток, пять тысяч это твой обед на две недели"),
 ("A3_SH13",None,"kitchen","close-up of the unchanging photo of the man in the orange hard hat on her phone","CU","eye","static","winter_evening_2025",False,False,
  "потом смотришь на его фото, оранжевая каска, добрые глаза, и стыдишься своих сомнений"),
 ("A3_SH14",None,"kitchen","extreme close-up of the Kaspi top-up screen with his Kazakhstani number and 5000 tenge entered","ECU","eye","static","winter_evening_2025",False,False,
  "ты вводишь его казахстанский номер, пять тысяч тенге, палец дрожит над кнопкой"),
 ("A3_SH15","IRINA","kitchen","medium shot of the woman setting the phone down after sending, a small reassuring smile","MS","eye","static","winter_evening_2025",False,False,
  "ты пополняешь, готово, и сразу пишешь ему, не извиняйся, мне в радость помочь"),
 ("A3_SH16",None,"room","close-up of the phone screen overflowing with his grateful messages","CU","eye","static","winter_evening_2025",False,False,
  "он рассыпается в благодарностях, пишет что не встречал такой женщины"),
 ("A3_SH17","IRINA","room","close-up of the woman's warmed face, feeling needed","CU","eye","static","winter_evening_2025",False,False,
  "и тебе тепло от того что ты кому-то нужна, под рёбрами снова толкает"),
 ("A3_SH18","IRINA","kitchen","medium shot of the woman half-asleep reaching for the phone as Kaspi chimes next morning","MS","high","static","winter_morning_2025",False,False,
  "на следующее утро каспи звякает, ты ещё в полусне тянешься к телефону"),
 ("A3_SH19",None,"kitchen","extreme close-up of a Kaspi notification, plus 5000 tenge received from Viktor","ECU","eye","push_in","winter_morning_2025",False,True,
  "пришло пять тысяч тенге от виктор, он вернул всё до тенге, как обещал"),
 ("A3_SH20","IRINA","kitchen","close-up of the woman exhaling with relief, her last doubts dissolving","CU","eye","static","winter_morning_2025",False,False,
  "и ты выдыхаешь, вот видишь, он настоящий, он держит слово, все твои страхи зря"),
 ("A3_SH21","IRINA","room","medium shot of the woman serene with her phone, the last inner wall coming down","MS","eye","static","winter_evening_2025",False,False,
  "с этого дня ты веришь ему без оглядки, последняя стена внутри падает"),
 ("A3_SH22",None,"kitchen","close-up of the phone screen showing an incoming call from Даша дочь on the weekend","CU","eye","static","winter_day_2025",False,False,
  "в выходные звонит даша, и ты не выдерживаешь, рассказываешь ей про виктора"),
 ("A3_SH23","DASHA","dasha","medium shot of the cherry-red-haired daughter on the phone in Astana, gently wary","MS","eye","static","winter_day_2025",False,False,
  "мам, а ты его хоть раз видела вживую, слышала голос, спрашивает дочь осторожно"),
 ("A3_SH24","IRINA","kitchen","medium shot of the woman deflecting on the phone, a flicker of defensiveness","MS","eye","static","winter_day_2025",False,False,
  "ты отвечаешь что у него вахта и плохая связь, и слышишь как даша замолкает"),
 ("A3_SH25","IRINA","room","close-up of the woman looking hurt and defensive after the call","CU","eye","static","winter_day_2025",False,False,
  "тебе обидно, ты так давно не была счастлива, а дочь будто хочет это отнять"),
 ("A3_SH26",None,"room","close-up of the phone screen with Viktor soothing her about her daughter","CU","eye","static","winter_evening_2025",False,False,
  "виктор пишет, не сердись на дочь, она просто боится тебя потерять"),
 ("A3_SH27","IRINA","room","medium shot of the woman calmed, the phone glow soft on her face","MS","eye","static","winter_evening_2025",False,False,
  "и тебе становится легче, он всегда находит правильные слова, лучше чем кто-либо"),
 ("A3_SH28","IRINA","kitchen","medium shot of the woman writing a tender message at the table, heart fluttering","MS","eye","static","winter_evening_2025",False,False,
  "вечером вы впервые пишете друг другу скучаю, и сердце ёкает как в юности"),
 ("A3_SH29",None,"room","close-up of the phone screen with Viktor declining a parcel, telling her to save her money","CU","eye","static","winter_evening_2025",False,False,
  "ты хочешь послать ему посылку, но он отказывается, побереги деньги, я скоро сам приеду"),
 ("A3_SH30","IRINA","room","close-up of the woman falling asleep certain and hopeful, phone on the pillow","CU","low","static","winter_evening_2025",False,True,
  "и ты засыпаешь уверенная, что эта зима последняя, которую ты проводишь одна"),
]

if __name__ == "__main__":
    seed_act("e3","A3_warm_hope",MOOD,"0103000000","0153000000","animated","act_03_first_request",SHOTS)
