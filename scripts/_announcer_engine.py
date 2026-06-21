# -*- coding: utf-8 -*-
"""Shot engine for announcer («ТЫ — Диктор на вокзале»). Mirrors _cloakroom_engine.
Track B, 2nd person, f5 female. Railway terminus — ENV motion tuned for steam/glass-roof light/split-flap board.
§5.3a baked: env (no participant) shots -> renderMode='static' ALWAYS (no Wan i2v anime).
seed_act(scene_key, palette, shots, render_mode='static', id_region='0')
  shots tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
"""
import json, psycopg2
PFX="7e600000-0000-4000-8000-"; PROJ=PFX+"000000000001"

STYLE=("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
 "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
 "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, ")
TECH=("hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows, ")
ENV_MOT=("only ambient environmental motion, drifting steam and slow dust in shafts of light through a great glass station roof, "
 "the split-flap departures board gently flickering, gently shifting light and shadow, "
 "an empty still concourse with no people and no figures, the cell-shaded illustration barely coming to life, hand-drawn animation cadence")
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

# --- OBJECT ANCHORS (user 2026-06-21: «предметы программа не рисует»). ---
# Props get their own canonical anchor like a character promptBase. A shot whose ch="OBJ:<key>" becomes
# a prop-hero macro: the prop dominates, the heavy location is dropped (loc=None) so the model renders the
# OBJECT, not "just a room". Populate OBJECTS in the batch/foundation. (announcer's were applied via
# _upgrade_announcer_object_anchors.py; this hook is the template for future projects.)
OBJECTS={}
OBJ_DOF=("the prop fills the frame as the single clear subject in crisp sharp focus, "
 "the surroundings thrown far out of focus into soft neutral shapes behind it, shallow depth of field, "
 "one warm focused light on the object")
OBJ_PAL="rich still-life palette, deep shadow and a single warm focused light isolating the object"

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
        for nn in _NEG:
            if nn in low: raise SystemExit("NEGATION in %s: %s"%(code,nn))
        is_obj = isinstance(ch,str) and ch.startswith("OBJ:")
        if is_obj and ch[4:] not in OBJECTS: raise SystemExit("unknown object %s on %s"%(ch,code))
        if (ch is not None) and (not is_obj) and ch not in prof: raise SystemExit("unknown profile %s on %s"%(ch,code))
        sid=PFX+"%02x%02x%s0000000"%(act_idx,idx,id_region)
        if is_obj:  # prop-hero macro: object dominates, location dropped
            positive=STYLE+"macro insert, "+OBJECTS[ch[4:]]+", "+OBJ_DOF+", "+OBJ_PAL+", "+TECH+_cam(st,ang,mv)
        else:
            positive=STYLE+subj+", "+palette+", "+TECH+_cam(st,ang,mv)
        is_char=(ch is not None) and (not is_obj)
        route="announcer_character_ip" if is_char else "announcer_environment"
        ref=prof[ch][0] if is_char else None
        loc_id=None if is_obj else (locs.get(loc) if loc else None)
        if (not is_obj) and loc and not loc_id: raise SystemExit("unknown location %s on %s"%(loc,code))
        rm = render_mode if is_char else "static"
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
    nodot=[c for c,_,n in seq if n and n.strip()[-1] not in ".!?…"]
    cx.commit(); cur.close(); cx.close()
    print("  %-18s shots=%2d scale3run=%s short=%s nodot=%s"%(scene_key,len(shots),(",".join(runs) if runs else "0"),(",".join("%s:%d"%(c,w) for c,w in short) if short else "0"),(",".join(nodot) if nodot else "0")))
