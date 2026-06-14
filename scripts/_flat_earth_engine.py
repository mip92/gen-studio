# -*- coding: utf-8 -*-
"""
Shared shot engine for flat_earth (one-shot creation helper; deleted with the
other _*.py once the project is verified). Mirrors cat_lady's promptFields shape.

⚑ PROJECT SIGNATURE: audio ≠ image.
  narr  (narrationText / narrationRu) = the FLAT-EARTH-IS-TRUE voiceover (confident,
        never names the asylum/madness).
  subj  (positive) = the CLINICAL / SOCIAL TRUTH the image shows.
Do NOT make them agree — the gap is the whole film.

seed_act(scene_key, palette, shots, render_mode='static')
  shots = list of tuples (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
    code   shotCode, e.g. 'A1_SH01'
    ch     None=environment route | profileCode str = single character (SingleWithBack)
    loc    location slug | None
    subj   English subject/ACTION (no style tokens, NO negations)
    st     shotType: EWS WS MS MCU OTS CU ECU BACK POV INSERT
    ang    eye low high dutch over pov top worm bird
    mv     static push_in pull_out pan_left pan_right track tilt_up tilt_down handheld orbit
    tod    timeOfDay token
    broll  bool
    iconic bool
    narr   RU narration (f5: terminal . ! ?, lowercase start) — the confident flat voice
"""
import os, sys, psycopg2

PFX  = "7e5c0000-0000-4000-8000-"
PROJ = PFX + "000000000001"

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
    "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
    "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, ")
TECH = ("hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows, ")

ENV_MOT  = ("only ambient environmental motion, slow drifting dust and haze, gently shifting light and shadow, "
    "faint wind in the scene, an empty scene with no people and no figures, the cell-shaded illustration softly "
    "coming to life, hand-drawn animation cadence")
ENV_MNEG = ("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, "
    "anime girl, manga character, extra humans appearing, cars, vehicles, doors opening, photoreal, photograph, 3D render, "
    "plastic skin, deformed, flicker, warping")
CHAR_MOT = ("subtle natural motion of only the figure already present in the frame, small breathing and quiet "
    "micro-movements continuing the moment, no new people entering, no extra figures appearing, the cell-shaded "
    "illustration in motion, hand-drawn animation cadence")
CHAR_MNEG= ("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, "
    "manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping")

MOVES = {"static":"locked static, no camera motion","push_in":"slow push-in","pull_out":"slow pull-out",
    "pan_left":"slow pan left","pan_right":"slow pan right","track":"slow tracking","tilt_up":"slow tilt up",
    "tilt_down":"slow tilt down","handheld":"subtle handheld","orbit":"slow arc"}
ANG = {"eye":"eye-level","low":"low","high":"high","dutch":"dutch","over":"over-the-shoulder","pov":"POV",
    "top":"top-down","worm":"worm's-eye","bird":"bird's-eye"}
SCALE = {"EWS":"W","WS":"W","MS":"M","MCU":"M","OTS":"M","BACK":"M","CU":"C","ECU":"C","POV":"M","INSERT":"C"}
_NEG_RE = ("no people","no person","no figures","no faces","no one","without people","empty of people","nobody")

def _camera(st, ang, mv):
    return "%s, %s angle, %s camera, 16:9" % (st, ANG[ang], MOVES[mv])

def _sanitize(subj):
    low = subj.lower()
    for n in _NEG_RE:
        if n in low:
            raise SystemExit("NEGATION in positive (move to motion/negative): %r in %r" % (n, subj))
    return subj

def seed_act(scene_key, palette, shots, render_mode="static"):
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT id,\"sortOrder\" FROM scenes WHERE \"projectId\"=%s AND \"sceneKey\"=%s", (PROJ, scene_key))
    row = cur.fetchone()
    if not row: raise SystemExit("no scene %s" % scene_key)
    scene_id, act_idx = row
    # profiles + their characterId
    cur.execute("""SELECT cp."profileCode", cp.id, c.id FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id
                   WHERE c.id IN (SELECT "characterId" FROM project_characters WHERE "projectId"=%s)""", (PROJ,))
    prof = {pc:(pid,cid) for pc,pid,cid in cur.fetchall()}
    cur.execute("SELECT slug,id FROM locations WHERE \"projectId\"=%s", (PROJ,))
    locs = dict(cur.fetchall())

    codes = [s[0] for s in shots]
    cur.execute("SELECT id FROM shots WHERE \"projectId\"=%s AND \"shotCode\"=ANY(%s)", (PROJ, codes))
    old = [r[0] for r in cur.fetchall()]
    if old:
        cur.execute("DELETE FROM shot_participants WHERE \"shotId\"=ANY(%s)", (old,))
        cur.execute("DELETE FROM shots WHERE id=ANY(%s)", (old,))

    seq, scales = [], []
    for idx,(code,ch,loc,subj,st,ang,mv,tod,broll,iconic,narr) in enumerate(shots):
        _sanitize(subj)
        sid = PFX + "%02x%02x00000000" % (act_idx, idx)
        positive = STYLE + subj + ", " + palette + ", " + TECH + _camera(st, ang, mv)
        is_char = ch is not None
        route = "flat_earth_character_ip" if is_char else "flat_earth_environment"
        ref_pid = prof[ch][0] if is_char else None
        loc_id = locs.get(loc) if loc else None
        if loc and not loc_id: raise SystemExit("unknown location %s on %s" % (loc, code))
        pf = {
            "positive": positive, "positivePrompt": positive, "narrationRu": narr,
            "motionPrompt": CHAR_MOT if is_char else ENV_MOT,
            "motionNegative": CHAR_MNEG if is_char else ENV_MNEG,
        }
        import json
        cur.execute("""INSERT INTO shots
            (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId",
             "narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic",
             "renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())""",
            (sid, PROJ, scene_id, code, json.dumps(pf, ensure_ascii=False), route, ref_pid, loc_id,
             narr, st, ang, mv, tod, scene_key, broll, iconic, render_mode))
        if is_char:
            cur.execute("""INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId")
                VALUES (%s,%s,%s,%s,%s)""", (sid[:-1]+"1", sid, prof[ch][1], ch, prof[ch][0]))
        seq.append((code, SCALE.get(st,"M"), narr)); scales.append(SCALE.get(st,"M"))

    # reports
    runs = [seq[i][0] for i in range(2,len(seq)) if scales[i]==scales[i-1]==scales[i-2]]
    short = [(c,len(n.split())) for c,_,n in seq if n and len(n.split())<12]
    cx.commit(); cur.close(); cx.close()
    print("  %-16s shots=%2d  scale3run=%s  short(<12w)=%s" % (scene_key, len(shots),
          (",".join(runs) if runs else "0"), (",".join("%s:%d"%(c,w) for c,w in short) if short else "0")))

if __name__ == "__main__":
    print("engine module — import and call seed_act()")
