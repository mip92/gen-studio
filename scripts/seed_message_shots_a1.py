# -*- coding: utf-8 -*-
"""Seed A1 (act_01_silence) shots for `message`. Idempotent per shotCode."""
import sys, json
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID  = "7e550000-0000-4000-8000-000000000001"
SCENE_ID = "7e550000-0000-4000-8000-0000000000e1"   # act_01_silence
PALETTE  = "A1_empty_apartment"
ID_PREFIX = "0101000000"   # shots
PP_PREFIX = "0151000000"   # participants
RENDER_MODE = "animated"

CHARS = {  # code -> (characterId, profileId)
    "IRINA": ("7e550000-0000-4000-8000-0000000000c1", "7e550000-0000-4000-8000-0000000000d1"),
    "DASHA": ("7e550000-0000-4000-8000-0000000000c2", "7e550000-0000-4000-8000-0000000000d2"),
}
LOC = {k: f"7e550000-0000-4000-8000-0000000000{v}" for k, v in {
    "kitchen":"f0","room":"f1","class":"f2","staff":"f3","halyk":"f4","mfo":"f5",
    "pawn":"f6","yard":"f7","street":"f8","stair":"f9","dasha":"fa","airport":"fb"}.items()}

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
MOOD = ("muted autumn-grey and warm dim lamplight palette, quiet lonely low-contrast melancholy, "
        "soft northern overcast light")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

def positive(subj, st, ang, mv):
    return f"{STYLE}, {subj}, {MOOD}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"

# code, char(None/IRINA/DASHA), loc, subject, shotType, angle, move, time, broll, iconic, narr
SHOTS = [
 ("A1_SH01","IRINA","yard","wide shot of a tired 48-year-old woman in a beige coat walking home alone across a grey autumn courtyard between soviet panel blocks, a heavy bag of exercise books on her shoulder","WS","eye","push_in","autumn_evening_2025",False,False,
  "осень, ты возвращаешься из школы пешком через серый двор, сорок восемь лет, сумка с тетрадями оттягивает плечо"),
 ("A1_SH02","IRINA","room","medium shot of the woman stepping into a dark unlit apartment hallway, taking off her coat, the silence of empty rooms ahead","MS","eye","static","autumn_evening_2025",False,False,
  "ты входишь в тёмную квартиру на конституции, и тишина встречает тебя первой, как всегда"),
 ("A1_SH03","IRINA","room","close-up of the woman's tired face in the dim hallway, the quiet weighing on her","CU","eye","static","autumn_evening_2025",False,False,
  "пять лет назад муж ушёл, год назад дочь уехала в астану, и теперь тут только ты"),
 ("A1_SH04",None,"room","wide shot of a modest living room lit by a single table lamp while the rest stays in darkness, a folding sofa and a glass cabinet","WS","eye","static","autumn_evening_2025",True,False,
  "ты включаешь одну лампу, остальная квартира остаётся в темноте, так дешевле и привычнее"),
 ("A1_SH05",None,"room","extreme close-up of a framed photo of a smiling young woman on a shelf, a thin layer of dust on the glass","ECU","eye","push_in","autumn_evening_2025",True,True,
  "на полке фотография даши, она улыбается, она далеко, она звонит всё реже"),
 ("A1_SH06","IRINA","kitchen","medium shot of the woman making tea for one at the kitchen counter, a single mug","MS","high","static","autumn_evening_2025",False,False,
  "ты завариваешь чай на одну кружку, вторая стоит в шкафу просто так"),
 ("A1_SH07",None,"kitchen","close-up of a kitchen table with two chairs, one chair pushed in and clearly unused for a long time","CU","eye","static","autumn_evening_2025",True,False,
  "за столом два стула, один давно никто не отодвигал"),
 ("A1_SH08","IRINA","class","wide shot of the woman at a green chalkboard teaching in a russian-language classroom, rows of pupils' desks","WS","eye","static","autumn_day_2025",False,False,
  "утром ты снова перед классом, тридцать лет ты учишь детей русскому, тебя уважают и не замечают"),
 ("A1_SH09","IRINA","class","medium close-up of the woman grading exercise books at her desk with a red pen, careful and precise","MCU","high","static","autumn_day_2025",False,False,
  "после уроков ты проверяешь тетради красной ручкой, аккуратно, до последней запятой"),
 ("A1_SH10","IRINA","staff","medium shot of the cramped staff room, colleagues chatting over tea while the woman sits slightly apart","MS","eye","static","autumn_day_2025",False,False,
  "в учительской пьют чай и говорят о своих семьях, ты улыбаешься и молчишь"),
 ("A1_SH11","IRINA","staff","close-up of the woman's face holding a polite distant smile among the chatter","CU","eye","static","autumn_day_2025",False,False,
  "тебе нечего добавить, дома тебя никто не ждёт, и ты привыкла так думать"),
 ("A1_SH12","IRINA","kitchen","medium shot of the woman snatching up her ringing phone at the kitchen table in the evening","MS","eye","push_in","autumn_evening_2025",False,False,
  "вечером звонит даша, ты хватаешь телефон на втором гудке"),
 ("A1_SH13",None,"kitchen","extreme close-up of a phone screen showing an incoming call labelled Даша дочь","ECU","eye","static","autumn_evening_2025",True,False,
  "на экране даша дочь, ты так ждёшь этих звонков всю неделю"),
 ("A1_SH14","DASHA","dasha","medium shot of a 24-year-old woman with a cherry-red bob talking quickly into her phone in a modern astana flat, a laptop and ring-light behind her","MS","eye","static","autumn_evening_2025",False,False,
  "у неё работа, дедлайны, своя жизнь в столице, разговор длится четыре минуты"),
 ("A1_SH15","IRINA","kitchen","close-up of the woman lowering the phone, the call already over, alone again","CU","eye","static","autumn_evening_2025",False,False,
  "мам всё нормально я перезвоню, говорит она, и в трубке снова тишина"),
 ("A1_SH16","IRINA","room","wide shot of the woman small on the sofa with her phone, the blue glow of a television in the dark room","WS","high","static","autumn_evening_2025",False,False,
  "ты садишься на диван с телефоном, синий свет телевизора, вечер тянется длинно"),
 ("A1_SH17","IRINA","room","medium shot of the woman scrolling a social feed on her phone on the sofa, blue light on her face","MS","eye","static","autumn_evening_2025",False,False,
  "ты листаешь одноклассники, чужие свадьбы, чужие внуки, чужое счастье в ленте"),
 ("A1_SH18",None,"room","extreme close-up of the phone screen as a new message from a stranger appears, the sender name Viktor and a small profile photo of a man in an orange hard hat","ECU","eye","push_in","autumn_evening_2025",False,True,
  "и тут приходит сообщение от незнакомца, виктор, как прошёл ваш день ирина"),
 ("A1_SH19",None,"room","close-up of the profile photo on the screen, a calm grey-bearded man in an orange offshore oil-rig hard hat against a blurred sea horizon","CU","eye","static","autumn_evening_2025",True,False,
  "на фото мужчина в оранжевой каске на фоне моря, спокойное лицо, седина, добрая улыбка"),
 ("A1_SH20",None,"room","medium close-up of the phone in the woman's hands, a new line of warm text on the screen, her thumb hovering to reply","MCU","eye","static","autumn_evening_2025",False,False,
  "он пишет что увидел твою страницу, что у тебя умные глаза, что редко такие встречает"),
 ("A1_SH21","IRINA","room","close-up of the woman's face by the dark window, a faint warmth softening her tired expression, phone glow on her cheek","CU","low","static","autumn_evening_2025",False,True,
  "и под рёбрами впервые за пять лет толкает тёплым, чуть выше живота, ты и забыла это чувство"),
 ("A1_SH22","IRINA","room","medium shot of the woman carefully typing a first reply on her phone in the dark room, a small unsure smile","MS","eye","static","autumn_evening_2025",False,False,
  "ты перечитываешь сообщение трижды и осторожно отвечаешь, здравствуйте виктор"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor(); seeded = 0
    try:
        for i,(code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s',(PROJ_ID,code))
            if cur.fetchone(): continue
            sid = f"7e550000-0000-4000-8000-{ID_PREFIX}{i:02x}"
            p = positive(subj,st,ang,mv)
            pf = {"positive":p,"positivePrompt":p,"narrationRu":narr}
            route = "message_character_ip" if ch else "message_environment"
            ref = CHARS[ch][1] if ch else None
            cur.execute(
                'INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid,PROJ_ID,SCENE_ID,code,json.dumps(pf,ensure_ascii=False),route,ref,narr,st,ang,mv,
                 broll,iconic,tod,PALETTE,LOC[loc],RENDER_MODE))
            if ch:
                cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                    (f"7e550000-0000-4000-8000-{PP_PREFIX}{i:02x}",sid,CHARS[ch][0],ch,CHARS[ch][1]))
            seeded += 1
        conn.commit()
        print(f"OK act_01_silence: seeded {seeded}/{len(SHOTS)} shots")
        prev=[]
        for code,ch,_,_,st,*_ in SHOTS:
            sc = "W" if st in ("EWS","WS") else ("M" if st in ("MS","MCU","OTS") else "C")
            prev.append(sc)
        print("  scale seq:", " ".join(prev))
        runs=[prev[i] for i in range(2,len(prev)) if prev[i]==prev[i-1]==prev[i-2]]
        print("  3-in-a-row scale runs:", len(runs))
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
