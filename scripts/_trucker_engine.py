# -*- coding: utf-8 -*-
"""Shot engine for trucker («ТЫ — Напарник дальнобойщика»). realcomic_qwen (Qwen-Image-Edit-2511 + RealComic).
Track B, 2nd person, qwen3 TTS (male, «Кузнецов»). Sailor_wife-engine lineage PLUS:
  - DUAL participants: ch=("PROFILE_A","PROFILE_B") -> two shot_participants rows
    (order = Picture 1 / Picture 2 for the Qwen dual strategy; write subj as
    "... A on the left ... B on the right ..." to match)
  - UNIQUE per-shot motionPrompt (explicit `mot` wins, else derived from subj + guard tail)
  - OBJECTS prop-hero anchors: ch="OBJ:<key>" -> env route, loc=None, anchor + DOF composed in
  - ALL shots animated; SELF-REPEAT REPORT (dup subjects, 4-gram VO repeats, act-tail fingerprint)
seed_act(scene_key, palette, shots, render_mode='animated', id_region='0')
  shots tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr[, mot])
"""
import json, re, psycopg2
PFX="7e6d0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
ROUTE_C="trucker_character_ip"; ROUTE_E="trucker_environment"

STYLE=("realcomic style, hand-drawn comic illustration with a realistic touch, clean confident linework, "
 "painterly shading, muted cinematic color palette, 16:9 cinematic composition, no photorealism, no anime, ")
TECH=("clean confident ink linework, painterly light and shadow, ")

OBJECTS={
 "thermos":"a dented aluminium thermos with a scratched screw-on cup lid and a small enamel cup tied to its handle with a shoelace",
 "box":"a plain brown cardboard box the size of a bread crate, sealed with wide grey tape, its sides bare of any markings or waybill number",
 "waybill":"a scuffed metal clipboard holding a carbon-copy waybill form, columns of typed cargo lines and one purple ink stamp",
 "gloves":"a pair of worn brown leather fingerless driving gloves, stitching gone pale, leather shaped by another man's hands",
}
OBJ_TAIL=(", the prop fills the frame as the single clear subject in crisp sharp focus, "
 "the surroundings thrown far out of focus, shallow depth of field, one focused practical light")

ENV_GUARD=(", with only ambient environmental motion, drifting road dust and slow shifting headlight glow, gently moving light and shadow, "
 "an empty still scene with no people and no figures, the illustration barely coming to life, hand-drawn animation cadence")
CHAR_GUARD=(", subtle natural motion of only the figures already present in the frame, small breathing and quiet micro-movements, "
 "no new people entering, no extra figures appearing, the illustration in motion, hand-drawn animation cadence")
ENV_MNEG=("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, anime girl, "
 "manga character, chibi, extra humans appearing, new cars appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MNEG=("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
 "chibi, extra limbs, deformed face, merged faces, face swap, photoreal, photograph, 3D render, plastic skin, flicker, warping")

MOVES={"static":"locked static, no camera motion","push_in":"slow push-in","pull_out":"slow pull-out","pan_left":"slow pan left","pan_right":"slow pan right","track":"slow tracking","tilt_up":"slow tilt up","tilt_down":"slow tilt down","handheld":"subtle handheld"}
ANG={"eye":"eye-level","low":"low","high":"high","over":"over-the-shoulder","pov":"POV","top":"top-down","dutch":"dutch"}
SCALE={"EWS":"W","WS":"W","MS":"M","MCU":"M","OTS":"M","BACK":"M","POV":"M","CU":"C","ECU":"C","INSERT":"C"}
_NEG=("no people","no person","no figures","no faces","no one","without people","nobody")
_FRAME_RE=re.compile(r"^an? [a-z\- ]*?(?:establishing view|view|shot|close-up|insert) of ")
_DOF_RE=re.compile(r", filling the frame in sharp focus.*$|, the prop fills the frame.*$")

def _cam(st,ang,mv): return "%s, %s angle, %s camera, 16:9"%(st,ANG[ang],MOVES[mv])

def _motion(subj,is_char,mot):
    if mot: return mot+(CHAR_GUARD if is_char else ENV_GUARD)
    action=_DOF_RE.sub("",_FRAME_RE.sub("",subj)).strip().rstrip(",")
    return action+(CHAR_GUARD if is_char else ENV_GUARD)

def seed_act(scene_key, palette, shots, render_mode="animated", id_region="0"):
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
    seq,scales,subjects,narrs=[],[],[],[]
    duals=0
    for idx,s in enumerate(shots):
        if len(s)==11: (code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr),mot=s,None
        else: code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr,mot=s
        low=subj.lower()
        for n in _NEG:
            if n in low: raise SystemExit("NEGATION in %s: %s"%(code,n))
        is_obj=isinstance(ch,str) and ch.startswith("OBJ:")
        chars=list(ch) if isinstance(ch,tuple) else ([ch] if (ch and not is_obj) else [])
        is_char=len(chars)>0
        for c in chars:
            if c not in prof: raise SystemExit("unknown profile %s on %s"%(c,code))
        if is_obj:
            key=ch[4:]
            if key not in OBJECTS: raise SystemExit("unknown object %s on %s"%(key,code))
            if loc is not None: raise SystemExit("OBJ shot %s must have loc=None"%code)
            subj=subj+", "+OBJECTS[key]+OBJ_TAIL
        sid=PFX+"%02x%02x%s0000000"%(act_idx,idx,id_region)
        positive=STYLE+subj+", "+palette+", "+TECH+_cam(st,ang,mv)
        route=ROUTE_C if is_char else ROUTE_E
        ref=prof[chars[0]][0] if is_char else None
        loc_id=locs.get(loc) if loc else None
        if loc and not loc_id: raise SystemExit("unknown location %s on %s"%(loc,code))
        pf={"positive":positive,"positivePrompt":positive,"narrationRu":narr,
            "motionPrompt":_motion(subj,is_char,mot),"motionNegative":CHAR_MNEG if is_char else ENV_MNEG}
        cur.execute('''INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId","narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic","renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())''',
            (sid,PROJ,scene_id,code,json.dumps(pf,ensure_ascii=False),route,ref,loc_id,narr,st,ang,mv,tod,scene_key,broll,iconic,render_mode))
        for pi,c in enumerate(chars):
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1]+str(pi+1),sid,prof[c][1],c,prof[c][0]))
        if len(chars)==2: duals+=1
        seq.append((code,SCALE.get(st,"M"),narr)); scales.append(SCALE.get(st,"M"))
        subjects.append((code,subj[:60].lower())); narrs.append((code,narr))
    runs=[seq[i][0] for i in range(2,len(seq)) if scales[i]==scales[i-1]==scales[i-2]]
    silent=[c for c,_,n in seq if not (n or "").strip()]
    wc=[(c,len(n.split())) for c,_,n in seq if (n or "").strip()]
    short=[(c,w) for c,w in wc if w<12]; long=[(c,w) for c,w in wc if w>20]
    nodot=[c for c,_,n in seq if (n or "").strip() and n.strip()[-1] not in ".!?…"]
    seen={}; dup_subj=[]
    for c,sj in subjects:
        if sj in seen: dup_subj.append("%s~%s"%(seen[sj],c))
        else: seen[sj]=c
    grams={}
    for c,n in narrs:
        ws=re.findall(r"[а-яё]+",(n or "").lower())
        for i in range(len(ws)-3):
            g=" ".join(ws[i:i+4]); grams.setdefault(g,set()).add(c)
    rep=[(g,sorted(cs)) for g,cs in grams.items() if len(cs)>=3]
    tail="".join(scales[-5:])
    cx.commit(); cur.close(); cx.close()
    print("  %-13s shots=%2d duals=%2d scale3run=%s silent=%s short=%s long=%s nodot=%s dupsubj=%s tail=%s"%(scene_key,len(shots),duals,
        (",".join(runs) if runs else "0"),(",".join(silent) if silent else "0"),
        (",".join("%s:%d"%(c,w) for c,w in short) if short else "0"),
        (",".join("%s:%d"%(c,w) for c,w in long) if long else "0"),
        (",".join(nodot) if nodot else "0"),
        (",".join(dup_subj) if dup_subj else "0"),tail))
    for g,cs in rep: print("    REPEAT-4GRAM '%s' in %s"%(g,",".join(cs)))
