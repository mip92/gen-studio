# -*- coding: utf-8 -*-
"""Shared engine for seeding one act's shots into project `message`.
Each act script imports seed_act() and passes its constants + SHOTS list."""
import json, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e550000-0000-4000-8000-000000000001"
CHARS = {"IRINA":("7e550000-0000-4000-8000-0000000000c1","7e550000-0000-4000-8000-0000000000d1"),
         "DASHA":("7e550000-0000-4000-8000-0000000000c2","7e550000-0000-4000-8000-0000000000d2"),
         "VICTOR":("7e550000-0000-4000-8000-0000000000c3","7e550000-0000-4000-8000-0000000000d3")}
LOC = {k:f"7e550000-0000-4000-8000-0000000000{v}" for k,v in {
    "kitchen":"f0","room":"f1","class":"f2","staff":"f3","halyk":"f4","mfo":"f5",
    "pawn":"f6","yard":"f7","street":"f8","stair":"f9","dasha":"fa","airport":"fb"}.items()}
STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

def seed_act(scene_suffix, palette, mood, id_prefix, pp_prefix, render_mode, label, SHOTS):
    scene_id = f"7e550000-0000-4000-8000-0000000000{scene_suffix}"
    def positive(subj, st, ang, mv):
        return f"{STYLE}, {subj}, {mood}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"
    conn = psycopg2.connect(**DSN); conn.autocommit=False; cur=conn.cursor(); seeded=0
    try:
        for i,(code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s',(PROJ_ID,code))
            if cur.fetchone(): continue
            sid=f"7e550000-0000-4000-8000-{id_prefix}{i:02x}"
            p=positive(subj,st,ang,mv); pf={"positive":p,"positivePrompt":p,"narrationRu":narr}
            # ch: None=environment, "CODE"=single character, ("CODE","CODE")=dual (p0=LEFT, p1=RIGHT)
            is_dual = isinstance(ch,(tuple,list))
            codes = list(ch) if is_dual else ([ch] if ch else [])
            route = "message_character_ip" if codes else "message_environment"
            ref   = CHARS[codes[0]][1] if codes else None
            cur.execute('INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid,PROJ_ID,scene_id,code,json.dumps(pf,ensure_ascii=False),route,ref,narr,st,ang,mv,
                 broll,iconic,tod,palette,(LOC[loc] if loc else None),render_mode))
            for j,cc in enumerate(codes):
                lbl = cc + ("-L" if (is_dual and j==0) else ("-R" if is_dual else ""))
                cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                    (f"7e550000-0000-4000-8000-{pp_prefix}{(i+j*0x80):02x}",sid,CHARS[cc][0],lbl,CHARS[cc][1]))
            seeded+=1
        conn.commit()
        sc=[("W" if x[4] in("EWS","WS") else ("M" if x[4] in("MS","MCU","OTS") else "C")) for x in SHOTS]
        runs=sum(1 for i in range(2,len(sc)) if sc[i]==sc[i-1]==sc[i-2])
        env=sum(1 for x in SHOTS if not x[1])
        words=sum(len(x[10].split()) for x in SHOTS)
        print(f"OK {label}: seeded {seeded}/{len(SHOTS)} | scale:{' '.join(sc)}")
        print(f"   3-runs:{runs} env:{env}/{len(SHOTS)} words:{words} (~{words/140*60:.0f}s VO)")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()
