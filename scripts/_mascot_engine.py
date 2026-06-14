# -*- coding: utf-8 -*-
"""Shot engine for mascot. One-shot creation helper.
Signature: face hidden till end; grinning mascot exterior vs weary inner voice.
§5.3a baked: env (no participant) shots -> renderMode='static' ALWAYS (no Wan i2v anime).
char shots -> render_mode arg ('animated' for early acts, 'static' later).
MASCOT is an anchored participant in mascot shots (IP-Adapter consistency).
seed_act(scene_key, palette, shots, render_mode='static', id_region='0')
  shots tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
  ch: None=env | profileCode (MASCOT / MAN / MAN_KID / WIFE / KID / MANAGER ...)
"""
import json, psycopg2
PFX="7e5e0000-0000-4000-8000-"; PROJ=PFX+"000000000001"

STYLE=("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
 "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
 "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, ")
TECH=("hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows, ")
ENV_MOT=("only ambient environmental motion, slow drifting heat-haze and dust, gently shifting light and shadow, faint wind, "
 "an empty still scene, the cell-shaded illustration barely coming to life, hand-drawn animation cadence")
ENV_MNEG=("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, anime girl, "
 "manga character, chibi, extra humans appearing, cars, vehicles, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MOT=("subtle natural motion of only the figure already present in the frame, small breathing and quiet micro-movements "
 "continuing the moment, no new people entering, no extra figures appearing, the cell-shaded illustration in motion, hand-drawn animation cadence")
CHAR_MNEG=("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
 "chibi, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping")
MOVES={"static":"locked static, no camera motion","push_in":"slow push-in","pull_out":"slow pull-out","pan_left":"slow pan left","pan_right":"slow pan right","track":"slow tracking","tilt_up":"slow tilt up","tilt_down":"slow tilt down","handheld":"subtle handheld"}
ANG={"eye":"eye-level","low":"low","high":"high","over":"over-the-shoulder","pov":"POV","top":"top-down","dutch":"dutch"}
SCALE={"EWS":"W","WS":"W","MS":"M","MCU":"M","OTS":"M","BACK":"M","POV":"M","CU":"C","ECU":"C","INSERT":"C"}
_NEG=("no people","no person","no figures","no faces","no one","without people","nobody")

def _cam(st,ang,mv): return "%s, %s angle, %s camera, 16:9"%(st,ANG[ang],MOVES[mv])

def seed_act(scene_key, palette, shots, render_mode="static", id_region="0"):
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    cur.execute('SELECT id,"sortOrder" FROM scenes WHERE "projectId"=%s AND "sceneKey"=%s',(PROJ,scene_key))
    row=cur.fetchone()
    if not row: raise SystemExit("no scene "+scene_key)
    scene_id,act_idx=row
    cur.execute('SELECT cp."profileCode",cp.id,c.id FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id WHERE c.id IN (SELECT "characterId" FROM project_characters WHERE "projectId"=%s)',(PROJ,))
    prof={pc:(pid,cid) for pc,pid,cid in cur.fetchall()}
    cur.execute('SELECT slug,id FROM locations WHERE "projectId"=%s',(PROJ,)); locs=dict(cur.fetchall())
    codes=[s[0] for s in shots]
    cur.execute('SELECT id FROM shots WHERE "projectId"=%s AND "shotCode"=ANY(%s)',(PROJ,codes)); old=[r[0] for r in cur.fetchall()]
    if old:
        cur.execute('DELETE FROM shot_participants WHERE "shotId"=ANY(%s)',(old,)); cur.execute('DELETE FROM shots WHERE id=ANY(%s)',(old,))
    seq,scales=[],[]
    for idx,(code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr) in enumerate(shots):
        low=subj.lower()
        for n in _NEG:
            if n in low: raise SystemExit("NEGATION in %s: %s"%(code,n))
        sid=PFX+"%02x%02x%s0000000"%(act_idx,idx,id_region)
        positive=STYLE+subj+", "+palette+", "+TECH+_cam(st,ang,mv)
        is_char=ch is not None
        route="mascot_character_ip" if is_char else "mascot_environment"
        ref=prof[ch][0] if is_char else None
        loc_id=locs.get(loc) if loc else None
        if loc and not loc_id: raise SystemExit("unknown location %s on %s"%(loc,code))
        rm = render_mode if is_char else "static"   # §5.3a: env shots never i2v
        pf={"positive":positive,"positivePrompt":positive,"narrationRu":narr,
            "motionPrompt":CHAR_MOT if is_char else ENV_MOT,"motionNegative":CHAR_MNEG if is_char else ENV_MNEG}
        cur.execute('''INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId","narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic","renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())''',
            (sid,PROJ,scene_id,code,json.dumps(pf,ensure_ascii=False),route,ref,loc_id,narr,st,ang,mv,tod,scene_key,broll,iconic,rm))
        if is_char:
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1]+"1",sid,prof[ch][1],ch,prof[ch][0]))
        seq.append((code,SCALE.get(st,"M"),narr)); scales.append(SCALE.get(st,"M"))
    runs=[seq[i][0] for i in range(2,len(seq)) if scales[i]==scales[i-1]==scales[i-2]]
    short=[(c,len(n.split())) for c,_,n in seq if n and len(n.split())<12]
    cx.commit(); cur.close(); cx.close()
    print("  %-16s shots=%2d scale3run=%s short=%s"%(scene_key,len(shots),(",".join(runs) if runs else "0"),(",".join("%s:%d"%(c,w) for c,w in short) if short else "0")))
