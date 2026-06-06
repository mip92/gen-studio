# -*- coding: utf-8 -*-
"""Seed A2 (act_02_acquaintance) shots for `message`. Idempotent per shotCode."""
import sys, json
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID  = "7e550000-0000-4000-8000-000000000001"
SCENE_ID = "7e550000-0000-4000-8000-0000000000e2"   # act_02_acquaintance
PALETTE  = "A2_screen_glow"
ID_PREFIX = "0102000000"; PP_PREFIX = "0152000000"; RENDER_MODE = "animated"

CHARS = {"IRINA":("7e550000-0000-4000-8000-0000000000c1","7e550000-0000-4000-8000-0000000000d1"),
         "DASHA":("7e550000-0000-4000-8000-0000000000c2","7e550000-0000-4000-8000-0000000000d2")}
LOC = {k:f"7e550000-0000-4000-8000-0000000000{v}" for k,v in {
    "kitchen":"f0","room":"f1","class":"f2","staff":"f3","halyk":"f4","mfo":"f5",
    "pawn":"f6","yard":"f7","street":"f8","stair":"f9","dasha":"fa","airport":"fb"}.items()}

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
MOOD = ("warm phone screen-glow against dim evening rooms, hopeful warm amber and soft blue palette, "
        "intimate quiet low-contrast mood")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

def positive(subj, st, ang, mv):
    return f"{STYLE}, {subj}, {MOOD}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"

SHOTS = [
 ("A2_SH01","IRINA","room","medium shot of the woman settling on the sofa in the evening with her phone, an expectant small smile","MS","eye","static","autumn_evening_2025",False,False,
  "к октябрю это уже привычка, каждый вечер ты ждёшь его сообщение как праздник"),
 ("A2_SH02",None,"room","extreme close-up of a phone screen full of warm chat messages from Viktor asking about her day","ECU","eye","static","autumn_evening_2025",False,False,
  "виктор пишет первым, спрашивает как уроки, как твоя спина, запоминает мелочи"),
 ("A2_SH03","IRINA","room","medium shot of the woman smiling at her phone alone in the lamplit room","MS","eye","static","autumn_evening_2025",False,False,
  "и под рёбрами снова тёплый толчок, ты улыбаешься телефону в пустой комнате"),
 ("A2_SH04",None,"room","close-up of the phone screen showing a long heartfelt message from Viktor about losing his wife","CU","eye","static","autumn_evening_2025",False,False,
  "он вдовец, пишет он, жена умерла четыре года назад, растит сына один"),
 ("A2_SH05",None,"room","extreme close-up of the phone screen with a message describing an offshore oil rig and poor connection","ECU","eye","static","autumn_evening_2025",False,False,
  "он инженер на нефтяной платформе, вахта по полгода, северное море, связь плохая"),
 ("A2_SH06","IRINA","kitchen","medium shot of the woman reading her phone at breakfast, smiling, tea going cold beside her","MS","eye","static","autumn_day_2025",False,False,
  "ты читаешь его сообщения за завтраком и улыбаешься, чай остывает"),
 ("A2_SH07","IRINA","class","wide shot of the woman noticeably brighter teaching at the chalkboard, lighter posture","WS","eye","static","autumn_day_2025",False,False,
  "коллеги говорят что ты помолодела, ты отмахиваешься, но это правда"),
 ("A2_SH08","IRINA","staff","medium close-up of the woman quietly telling a colleague about a man, careful and shy","MCU","eye","static","autumn_day_2025",False,False,
  "ты впервые за годы рассказываешь про мужчину, осторожно, чтобы не сглазить"),
 ("A2_SH09",None,"room","close-up of the single unchanging profile photo on the phone, the grey-bearded man in an orange hard hat by the sea","CU","eye","push_in","autumn_evening_2025",False,True,
  "ты подолгу смотришь на единственное фото, оранжевая каска, море, добрые морщинки"),
 ("A2_SH10","IRINA","room","medium shot of the woman typing a brave request on her phone in the dim room","MS","eye","static","autumn_evening_2025",False,False,
  "однажды ты пишешь, давай созвонимся, я хочу услышать твой голос"),
 ("A2_SH11",None,"room","extreme close-up of the phone screen with Viktor's deflecting reply about expensive dropping connection","ECU","eye","static","autumn_evening_2025",False,True,
  "он отвечает не сразу, связь на платформе дорогая и рвётся, давай чуть позже родная"),
 ("A2_SH12","IRINA","room","medium shot of the woman with a faint flicker of unease on the sofa, then softening","MS","eye","static","autumn_evening_2025",False,False,
  "тебе немного странно, но он пишет так тепло, что сомнение тает за минуту"),
 ("A2_SH13",None,"room","close-up of the phone screen with a long tender evening message from Viktor","CU","eye","static","autumn_evening_2025",False,False,
  "вечером приходит длинное сообщение, он пишет что ты вернула ему вкус к жизни"),
 ("A2_SH14","IRINA","room","close-up of the woman's face, warm again, rereading the message before sleep","CU","low","static","autumn_evening_2025",False,False,
  "и снова тёплый толчок под рёбрами, ты перечитываешь это перед сном три раза"),
 ("A2_SH15","IRINA","yard","wide shot of the woman crossing the courtyard as the first snow falls on the grey panel blocks","WS","eye","push_in","late_autumn_day_2025",False,False,
  "проходит октябрь, потом ноябрь, во дворе ложится первый снег"),
 ("A2_SH16",None,"room","close-up of frost spreading on a dark window pane, a single warm light reflected","CU","eye","static","late_autumn_evening_2025",True,False,
  "ты ловишь каждое его слово, дни без сообщений кажутся пустыми"),
 ("A2_SH17","IRINA","kitchen","medium shot of the woman reading at the kitchen table, a soft proud look","MS","eye","static","late_autumn_evening_2025",False,False,
  "он рассказывает про сына, тимура, тринадцать лет, мечтает поступить в мореходку"),
 ("A2_SH18",None,"kitchen","extreme close-up of the phone screen with a message explaining the shy son sends no photo","ECU","eye","static","late_autumn_evening_2025",False,False,
  "он не присылает фото сына, говорит мальчик стесняется, ты понимаешь, ты сама учитель"),
 ("A2_SH19","IRINA","room","close-up of the woman's content face in the no-longer-silent apartment","CU","eye","static","late_autumn_evening_2025",False,False,
  "ты впускаешь его в свою жизнь по сообщению в день, и квартира больше не кажется такой тихой"),
 ("A2_SH20","IRINA","street","medium shot of the woman walking a snowy street smiling at her phone, passers-by glancing","MS","eye","static","late_autumn_day_2025",False,False,
  "ты идёшь по улице и улыбаешься телефону, прохожие оборачиваются, тебе всё равно"),
 ("A2_SH21",None,"room","extreme close-up of the phone screen with Viktor's promise that his contract ends soon and he will come","ECU","eye","push_in","late_autumn_evening_2025",False,True,
  "он пишет, контракт скоро закончится, я приеду к тебе, я устал быть один"),
 ("A2_SH22","IRINA","room","close-up of the woman's hopeful face lit by the phone, daring to believe","CU","eye","static","late_autumn_evening_2025",False,False,
  "и ты начинаешь верить, что в сорок восемь у тебя ещё может быть кто-то рядом"),
 ("A2_SH23","IRINA","kitchen","medium shot of the woman awake at night at the kitchen table scrolling back through the whole chat","MS","high","static","late_autumn_evening_2025",False,False,
  "ночью ты не спишь, перечитываешь переписку с самого первого здравствуйте"),
 ("A2_SH24",None,"room","wide exterior shot of one warm lit window in a dark snowy panel block at night","WS","low","static","late_autumn_evening_2025",True,False,
  "за окном спит петропавловск, а ты засыпаешь счастливой, с телефоном в руке"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit=False
    cur = conn.cursor(); seeded=0
    try:
        for i,(code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s',(PROJ_ID,code))
            if cur.fetchone(): continue
            sid=f"7e550000-0000-4000-8000-{ID_PREFIX}{i:02x}"
            p=positive(subj,st,ang,mv); pf={"positive":p,"positivePrompt":p,"narrationRu":narr}
            route="message_character_ip" if ch else "message_environment"; ref=CHARS[ch][1] if ch else None
            cur.execute('INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid,PROJ_ID,SCENE_ID,code,json.dumps(pf,ensure_ascii=False),route,ref,narr,st,ang,mv,
                 broll,iconic,tod,PALETTE,LOC[loc],RENDER_MODE))
            if ch:
                cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                    (f"7e550000-0000-4000-8000-{PP_PREFIX}{i:02x}",sid,CHARS[ch][0],ch,CHARS[ch][1]))
            seeded+=1
        conn.commit()
        sc=["W" if st in("EWS","WS") else("M" if st in("MS","MCU","OTS") else "C") for *_,st,_,_,_,_,_ in [(s) for s in SHOTS]]
        # recompute scale list cleanly
        sc=[("W" if x[4] in("EWS","WS") else ("M" if x[4] in("MS","MCU","OTS") else "C")) for x in SHOTS]
        runs=sum(1 for i in range(2,len(sc)) if sc[i]==sc[i-1]==sc[i-2])
        env=sum(1 for x in SHOTS if not x[1])
        print(f"OK act_02_acquaintance: seeded {seeded}/{len(SHOTS)} shots")
        print("  scale seq:"," ".join(sc))
        print(f"  3-in-a-row runs: {runs} | env shots: {env}/{len(SHOTS)}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
