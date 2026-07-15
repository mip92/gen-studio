# -*- coding: utf-8 -*-
"""Shot engine for sailor_wife («ТЫ — Жена моряка»). cell_shaded (Eldritch_Classic_Comics), warm storybook + sea palette.
Track B (тёплая элегия), 2nd person, f5 (female). Teacher-engine lineage:
  - UNIQUE per-shot motionPrompt: explicit `mot` field wins; otherwise derived from subj + guard tail
  - OBJECTS prop-hero anchors: ch="OBJ:<key>" -> env route, loc=None, anchor + DOF composed in
  - ALL shots animated incl. env/prop (rule 2026-07-10)
  - SELF-REPEAT REPORT (user 2026-07-10): duplicate subjects, repeated VO 4-gram phrases, act-tail fingerprint
seed_act(scene_key, palette, shots, render_mode='animated', id_region='0')
  shots tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr[, mot])
"""
import json, re, psycopg2
PFX="7e6c0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
ROUTE_C="sailor_wife_character_ip"; ROUTE_E="sailor_wife_environment"

STYLE=("cinematic graphic novel illustration, classic illustrated comic book panel, soft cell-shaded coloring, "
 "gentle inked outline with warm variable line weight, tender muted color blocks with light hatching for shadow, "
 "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, warm illustrated storybook aesthetic, ")
TECH=("gentle inked outline on every edge, soft cell-shaded color blocks with light cross-hatching in the shadows, ")

OBJECTS={
 "anchor_pendant":"a small silver anchor pendant on a fine chain, its edges softened by decades of touching",
 "letters_bundle":"a thick bundle of handwritten letters in worn envelopes tied with rough twine, stamps of many distant ports",
 "radiogram":"a telegraph radiogram form with sparse typed capital letters and a purple date stamp",
 "ship_in_bottle":"a small sailing ship inside a glass bottle, rigging made of thread, a tiny paper flag",
 "phone_token":"a worn brass call-office token lying beside a scratched booth ledge",
 "souvenir_shelf":"a long wooden shelf crowded end to end with small souvenirs from many voyages, each one from a different port",
}
OBJ_TAIL=(", the prop fills the frame as the single clear subject in crisp sharp focus, "
 "the surroundings thrown far out of focus, shallow depth of field, one warm focused light")

ENV_GUARD=(", with only ambient environmental motion, drifting sea haze and slow gull shadows, gently shifting light and shadow, "
 "an empty still scene with no people and no figures, the illustration barely coming to life, hand-drawn animation cadence")
CHAR_GUARD=(", subtle natural motion of only the figure already present in the frame, small breathing and quiet micro-movements, "
 "no new people entering, no extra figures appearing, the illustration in motion, hand-drawn animation cadence")
ENV_MNEG=("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, anime girl, "
 "manga character, chibi, extra humans appearing, cars driving, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MNEG=("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
 "chibi, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping")

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
    for idx,s in enumerate(shots):
        if len(s)==11: (code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr),mot=s,None
        else: code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr,mot=s
        low=subj.lower()
        for n in _NEG:
            if n in low: raise SystemExit("NEGATION in %s: %s"%(code,n))
        is_obj=ch is not None and ch.startswith("OBJ:")
        is_char=ch is not None and not is_obj
        if is_char and ch not in prof: raise SystemExit("unknown profile %s on %s"%(ch,code))
        if is_obj:
            key=ch[4:]
            if key not in OBJECTS: raise SystemExit("unknown object %s on %s"%(key,code))
            if loc is not None: raise SystemExit("OBJ shot %s must have loc=None"%code)
            subj=subj+", "+OBJECTS[key]+OBJ_TAIL
        sid=PFX+"%02x%02x%s0000000"%(act_idx,idx,id_region)
        positive=STYLE+subj+", "+palette+", "+TECH+_cam(st,ang,mv)
        route=ROUTE_C if is_char else ROUTE_E
        ref=prof[ch][0] if is_char else None
        loc_id=locs.get(loc) if loc else None
        if loc and not loc_id: raise SystemExit("unknown location %s on %s"%(loc,code))
        pf={"positive":positive,"positivePrompt":positive,"narrationRu":narr,
            "motionPrompt":_motion(subj,is_char,mot),"motionNegative":CHAR_MNEG if is_char else ENV_MNEG}
        cur.execute('''INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId","narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic","renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())''',
            (sid,PROJ,scene_id,code,json.dumps(pf,ensure_ascii=False),route,ref,loc_id,narr,st,ang,mv,tod,scene_key,broll,iconic,render_mode))
        if is_char:
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1]+"1",sid,prof[ch][1],ch,prof[ch][0]))
        seq.append((code,SCALE.get(st,"M"),narr)); scales.append(SCALE.get(st,"M"))
        subjects.append((code,subj[:60].lower())); narrs.append((code,narr))
    runs=[seq[i][0] for i in range(2,len(seq)) if scales[i]==scales[i-1]==scales[i-2]]
    silent=[c for c,_,n in seq if not (n or "").strip()]
    wc=[(c,len(n.split())) for c,_,n in seq if (n or "").strip()]
    short=[(c,w) for c,w in wc if w<12]; long=[(c,w) for c,w in wc if w>20]
    nodot=[c for c,_,n in seq if (n or "").strip() and n.strip()[-1] not in ".!?…"]
    # --- self-repeat report (user 2026-07-10) ---
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
    print("  %-13s shots=%2d scale3run=%s silent=%s short=%s long=%s nodot=%s dupsubj=%s tail=%s"%(scene_key,len(shots),
        (",".join(runs) if runs else "0"),(",".join(silent) if silent else "0"),
        (",".join("%s:%d"%(c,w) for c,w in short) if short else "0"),
        (",".join("%s:%d"%(c,w) for c,w in long) if long else "0"),
        (",".join(nodot) if nodot else "0"),
        (",".join(dup_subj) if dup_subj else "0"),tail))
    for g,cs in rep: print("    REPEAT-4GRAM '%s' in %s"%(g,",".join(cs)))
