# -*- coding: utf-8 -*-
"""A9 (act_09_catastrophe) — final 350 000 transfer (the cold-open moment), then he vanishes and the truth lands."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _seed_message_act_engine import seed_act

MOOD = ("cold dead-of-night kitchen blue draining to ashen grey dawn, the warm amber gone entirely, "
        "hollow high-contrast despair, empty desolate mood")

SHOTS = [
 ("A9_SH01","IRINA","kitchen","medium shot of the woman in her best dress waiting by the dark window at 3 am","MS","eye","static","spring_night_2026",False,False,
  "уже ночь, потом три часа, телефон молчит, ты сидишь у окна в лучшем платье и всё ждёшь"),
 ("A9_SH02",None,"kitchen","extreme close-up of the phone, a message that he has been detained at customs","ECU","eye","static","spring_night_2026",False,False,
  "и наконец он пишет, но это не радость, на таможне его задержали, проблема с документами на груз"),
 ("A9_SH03","IRINA","kitchen","medium shot of the woman's heart dropping as she reads about possible arrest","MS","eye","static","spring_night_2026",False,False,
  "у тебя обрывается сердце, он пишет что его могут посадить, что нужен срочный залог, иначе тюрьма"),
 ("A9_SH04",None,"kitchen","extreme close-up of the phone naming the final sum and a dawn deadline","ECU","eye","push_in","spring_night_2026",False,False,
  "триста пятьдесят тысяч тенге, сегодня же, до утра, или его уведут, и вы никогда не увидитесь"),
 ("A9_SH05","IRINA","kitchen","medium shot of the woman with absolutely nothing left to give","MS","eye","static","spring_night_2026",False,False,
  "у тебя нет ничего, ни на счету, ни в долг, ты уже должна всем в этом городе до последнего тенге"),
 ("A9_SH06","IRINA","room","close-up of the woman pacing the empty flat in desperation","CU","eye","static","spring_night_2026",False,False,
  "ты мечешься по пустой квартире, продавать больше нечего, занимать больше совсем не у кого"),
 ("A9_SH07",None,"room","close-up of the phone with Viktor begging that she is his last hope","CU","eye","static","spring_night_2026",False,False,
  "он умоляет, родная, ты моя последняя надежда, только ты можешь меня спасти, только ты одна"),
 ("A9_SH08","IRINA","kitchen","medium shot of the woman taking a loan from a private lender off an ad","MS","eye","static","spring_night_2026",False,False,
  "и ты идёшь на последнее, берёшь займ под конскую ставку у частника по объявлению в интернете"),
 ("A9_SH09",None,"kitchen","extreme close-up of an unknown lender transfer and a receipt she does not even read","ECU","eye","static","spring_night_2026",False,False,
  "незнакомый человек переводит тебе деньги под расписку, и ты даже не читаешь, на что подписалась"),
 ("A9_SH10","IRINA","kitchen","close-up of the woman back at the dark kitchen at 3 am, finger over the confirm button","CU","eye","static","spring_night_2026",False,True,
  "и вот ты снова на тёмной кухне в три часа ночи, палец над кнопкой перевести триста пятьдесят тысяч"),
 ("A9_SH11","IRINA","kitchen","medium shot of the woman, no warmth left under her ribs, only fear and a thin thread of hope","MS","low","static","spring_night_2026",False,False,
  "под рёбрами уже давно не толкает тёплым, есть только страх и тонкая нить надежды, что всё не зря"),
 ("A9_SH12",None,"kitchen","extreme close-up of the phone showing the transfer complete, the last money she never had","ECU","eye","static","spring_night_2026",False,True,
  "ты нажимаешь, перевод выполнен, последние деньги, которых у тебя даже не было, уходят в никуда"),
 ("A9_SH13",None,"kitchen","close-up of the phone with his grateful last words about running to the investigator","CU","eye","static","spring_night_2026",False,False,
  "он пишет, спасибо родная, бегу к следователю, всё решится, и я сразу к тебе, только жди меня"),
 ("A9_SH14","IRINA","kitchen","medium shot of the woman watching the screen until dawn, the typing indicator glowing","MS","eye","static","spring_night_2026",False,False,
  "и ты ждёшь, час, два, до рассвета, глядя на экран, где светится надпись виктор печатает"),
 ("A9_SH15",None,"kitchen","extreme close-up of the typing indicator that flickers and then disappears into silence","ECU","eye","push_in","spring_dawn_2026",False,True,
  "виктор печатает, виктор печатает, а потом и это исчезает, и наступает полная тишина"),
 ("A9_SH16","IRINA","room","close-up of the woman in the grey morning writing to him herself, no reply","CU","eye","static","spring_day_2026",False,False,
  "утро, сообщений нет, ты пишешь сама, виктор ну как ты, ответь, я волнуюсь за тебя так сильно"),
 ("A9_SH17","IRINA","kitchen","medium shot of the woman sending message after message through the day into silence","MS","eye","static","spring_day_2026",False,False,
  "проходит день, ты пишешь снова и снова, одно сообщение, второе, десятое, в ответ молчание"),
 ("A9_SH18",None,"kitchen","extreme close-up of two grey unread ticks on the phone screen","ECU","eye","static","spring_day_2026",False,False,
  "сообщения уходят, но галочки серые, он их даже не открывает, телефон будто выключен совсем"),
 ("A9_SH19","IRINA","room","close-up of the woman calling, only an unreachable tone answering","CU","eye","static","spring_day_2026",False,False,
  "ты звонишь, абонент недоступен, звонишь логисту из порта, и там тот же ответ, недоступен"),
 ("A9_SH20","IRINA","kitchen","medium shot of a cold dread rising in the woman as she opens his profile","MS","eye","static","spring_day_2026",False,False,
  "и холод поднимается от живота к горлу, ты открываешь его страницу, чтобы посмотреть на фото"),
 ("A9_SH21",None,"kitchen","extreme close-up of a deleted-profile screen, no photo, no chat history at all","ECU","eye","push_in","spring_day_2026",False,True,
  "но страницы больше нет, профиль удалён, ни фото, ни переписки в приложении, как будто его стёрли"),
 ("A9_SH22","IRINA","kitchen","close-up of the woman as the whole truth lands at once","CU","eye","static","spring_day_2026",False,False,
  "и тут до тебя доходит всё разом, не было инженера, не было груза, не было самолёта, не было его"),
 ("A9_SH23","IRINA","room","medium shot of the woman sliding down the wall to the floor of the empty flat","MS","high","static","spring_day_2026",False,False,
  "ноги не держат, ты сползаешь по стене на пол пустой квартиры, и не можешь ни кричать ни плакать"),
 ("A9_SH24",None,"kitchen","close-up of a remembered reverse-search screen, the stolen face on hundreds of profiles","CU","eye","static","spring_day_2026",False,False,
  "ты вспоминаешь экран дочери, испанский фотограф, сотни анкет, и теперь ты на одной из них тоже"),
 ("A9_SH25","IRINA","kitchen","medium shot of the woman on the floor counting everything she has lost","MS","eye","static","spring_day_2026",False,False,
  "ты сидишь на полу и считаешь, кольцо, сбережения, телевизор, сервиз, четыре миллиона долгов"),
 ("A9_SH26","IRINA","kitchen","close-up of the woman grasping that she loved letters on a screen","CU","eye","static","spring_day_2026",False,False,
  "полгода ты любила набор букв на экране, голос которого ни разу не слышала, лицо которого украдено"),
 ("A9_SH27","IRINA","room","close-up of the woman reaching for the phone to call her daughter, then freezing","CU","eye","static","spring_evening_2026",False,False,
  "ты тянешься к телефону чтобы позвонить даше, и замираешь, ты ведь прогнала её ради него"),
 ("A9_SH28","IRINA","kitchen","medium shot of the woman lowering the phone without dialing, shame too strong","MS","eye","static","spring_evening_2026",False,False,
  "палец висит над именем дочери, но стыд и ужас сильнее, и ты опускаешь телефон, не набрав номер"),
 ("A9_SH29","IRINA","room","close-up of the woman utterly alone in the empty flat with an unpayable debt","CU","eye","static","spring_evening_2026",False,False,
  "и ты остаёшься совсем одна, в пустой квартире, с долгом который не выплатить и за десять лет"),
 ("A9_SH30","IRINA","kitchen","close-up of the woman at the window as a grey dawn rises and nothing is left inside her","CU","low","static","spring_dawn_2026",False,True,
  "за окном встаёт серое утро над петропавловском, а внутри тебя не осталось уже совсем ничего"),
]

if __name__ == "__main__":
    seed_act("e9","A9_silence_dark",MOOD,"0109000000","0159000000","static","act_09_catastrophe",SHOTS)
