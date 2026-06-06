# -*- coding: utf-8 -*-
"""Shared shot engine for project `beauty`. Multi-age heroine: ch profile-codes map to
the same character (c1) with different profiles (YOUNG/MID/OLD). Sanitizer strips content
negations from positive; per-shot motion fields prevent Wan spawning anime figures.

SHOTS tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
  ch: None=env / "PROFILECODE"=single / ("L","R")=dual ; narr=""=silent ; f5 -> end real lines with .!?
"""
import json, sys, re, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e570000-0000-4000-8000-000000000001"

_NEG_RE = re.compile(r',?\s*no (?:people|clear faces?|faces?|gore|graphic[^,]*)', re.IGNORECASE)

# profile-code -> (characterId suffix, profileId suffix). Heroine = c1 with 3 age profiles.
CHARS = {
 "HEROINE_YOUNG":("c1","d1"), "HEROINE_MID":("c1","d2"), "HEROINE_OLD":("c1","d3"),
 "MOTHER":("c2","d4"), "HUSBAND":("c3","d5"), "DAUGHTER":("c4","d6"),
 "ALINA":("c5","d7"), "RIVAL":("c6","d8"),
}
def _cid(code): return f"7e570000-0000-4000-8000-0000000000{CHARS[code][0]}"
def _pid(code): return f"7e570000-0000-4000-8000-0000000000{CHARS[code][1]}"

LOC = {k: f"7e570000-0000-4000-8000-000000000{v}" for k, v in {
 "old_flat":"f00","mother":"f01","school":"f02","street":"f03","disco":"f04","wedding":"f05",
 "family":"f06","maternity":"f07","bathroom":"f08","clinic":"f09","restaurant":"f0a","mfo":"f0b",
 "operating":"f0c","daughter":"f0d","park":"f0e","cafe":"f0f","shop":"f10","stairwell":"f11",
}.items()}

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

AMBIENT_MOTION = ("only ambient environmental motion, slow drifting dust and shifting light, faint curtain sway, "
                  "an empty scene with no people and no figures, the cell-shaded illustration softly coming to life, hand-drawn animation cadence")
CHAR_MOTION    = ("subtle natural motion of only the figure already present, small breathing and quiet micro-movements, "
                  "no new people entering, no extra figures appearing, cell-shaded illustration in motion, hand-drawn animation cadence")
ENV_MNEG  = ("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, "
             "anime character, anime girl, manga character, extra humans, photoreal, photograph, 3D render, plastic skin, deformed, flicker")
CHAR_MNEG = ("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, "
             "anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker")

def seed_act(scene_order, palette, mood, render_mode, label, SHOTS, id_region='0'):
    scene_id = f"7e570000-0000-4000-8000-000000000e{scene_order:02x}"
    def positive(subj, st, ang, mv):
        subj = _NEG_RE.sub('', subj).strip().strip(',').strip()
        return f"{STYLE}, {subj}, {mood}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor(); seeded = 0
    try:
        for i, (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ_ID, code))
            if cur.fetchone(): continue
            sid = f"7e570000-0000-4000-8000-{scene_order:02x}{id_region}0000000{i:02x}"
            p = positive(subj, st, ang, mv)
            is_dual = isinstance(ch, (tuple, list))
            codes = list(ch) if is_dual else ([ch] if ch else [])
            route = "beauty_character_ip" if codes else "beauty_environment"
            ref = _pid(codes[0]) if codes else None
            mp, mn = (CHAR_MOTION, CHAR_MNEG) if codes else (AMBIENT_MOTION, ENV_MNEG)
            pf = {"positive": p, "positivePrompt": p, "narrationRu": narr, "motionPrompt": mp, "motionNegative": mn}
            cur.execute('INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid, PROJ_ID, scene_id, code, json.dumps(pf, ensure_ascii=False), route, ref, narr, st, ang, mv,
                 broll, iconic, tod, palette, (LOC[loc] if loc else None), render_mode))
            for j, cc in enumerate(codes):
                lbl = cc + ("-L" if (is_dual and j == 0) else ("-R" if is_dual else ""))
                cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                    (f"7e570000-0000-4000-8000-{scene_order:02x}90000000{(i+j*0x80):02x}", sid, _cid(cc), lbl, _pid(cc)))
            seeded += 1
        conn.commit()
        sc = [("W" if x[4] in ("EWS","WS") else ("M" if x[4] in ("MS","MCU","OTS") else "C")) for x in SHOTS]
        runs = sum(1 for i in range(2, len(sc)) if sc[i] == sc[i-1] == sc[i-2])
        env = sum(1 for x in SHOTS if not x[1]); silent = sum(1 for x in SHOTS if not x[10].strip())
        words = sum(len(x[10].split()) for x in SHOTS)
        print(f"OK {label}: seeded {seeded}/{len(SHOTS)} | scale:{' '.join(sc)}")
        print(f"   3-runs:{runs} env:{env} silent:{silent} words:{words} (~{words/140*60:.0f}s VO)")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()
