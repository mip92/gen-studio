# -*- coding: utf-8 -*-
"""Shared engine for seeding one chapter's shots into project `tiler`.
Each chapter script imports seed_act() and passes its constants + SHOTS list.

SHOTS tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr)
  ch:  None = environment route; "CODE" = single character; ("L","R") = dual (p0=LEFT, p1=RIGHT)
  loc: key into LOC or None (no location)
  narr: Russian narrationText; "" = SILENT shot (held pause, drama)  [f5: end real lines with a period]
"""
import json, sys, re
import psycopg2

# Strip CONTENT negations from the per-shot subject — diffusion can't process negation
# and SUMMONS the thing (feedback_no_negations_in_positive / empty_broll_spawns_people).
# Describe only what IS there; exclusions belong in the negative at render time.
# NB: does NOT touch the STYLE block's style-direction negations (no photorealism / 3D / plastic skin).
_NEG_RE = re.compile(r',?\s*no (?:people|clear faces?|faces?|gore|graphic[^,]*)', re.IGNORECASE)

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e560000-0000-4000-8000-000000000001"

# code -> (characterId suffix, profileId suffix)
CHARS = {
    "BAKHTI":   ("c1", "d1"), "OTETS":    ("c2", "d2"), "NIGORA":  ("c3", "d3"),
    "AZIZ":     ("c4", "d4"), "GENA":     ("c5", "d5"), "KURATOR": ("c6", "d6"),
    "RUSTAM":   ("c7", "d7"), "ZAKAZCHIK":("c8", "d8"), "SHUKHRAT":("c9", "d9"),
    "DILSHOD":  ("ca", "da"),
}
def _cid(code): return f"7e560000-0000-4000-8000-0000000000{CHARS[code][0]}"
def _pid(code): return f"7e560000-0000-4000-8000-0000000000{CHARS[code][1]}"

# location key -> location uuid (suffix f00..f0f)
LOC = {k: f"7e560000-0000-4000-8000-000000000{v}" for k, v in {
    "kiln":"f00","rishtan":"f01","samarkand":"f02","mansion":"f03","mstreet":"f04",
    "bytovka":"f05","migra":"f06","objext":"f07","marble":"f08","aqua":"f09",
    "fountain":"f0a","machine":"f0b","party":"f0c","steppe":"f0d","highway":"f0e","house":"f0f",
}.items()}

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

# Per-shot Wan i2v motion. Env shots must NOT inherit the character-assuming default
# (feedback_empty_broll_spawns_people) — otherwise Wan invents figures / anime characters.
AMBIENT_MOTION = ("only ambient environmental motion, slow drifting dust and haze, gently shifting light and "
                  "shadow, faint wind in the scene, an empty scene with no people and no figures, "
                  "the cell-shaded illustration softly coming to life, hand-drawn animation cadence")
CHAR_MOTION    = ("subtle natural motion of only the figure already present in the frame, small breathing and "
                  "quiet micro-movements continuing the moment, no new people entering, no extra figures appearing, "
                  "the cell-shaded illustration in motion, hand-drawn animation cadence")
ENV_MNEG  = ("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, "
             "anime character, anime girl, manga character, extra humans appearing, "
             "photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MNEG = ("extra people, additional figures, duplicate person, twin, clone, background crowd, "
             "anime character, anime girl, manga character, extra limbs, extra arms, deformed face, "
             "photoreal, photograph, 3D render, plastic skin, flicker, warping")

def seed_act(scene_order, palette, mood, render_mode, label, SHOTS, id_region='0'):
    scene_id = f"7e560000-0000-4000-8000-000000000e{scene_order:02x}"
    def positive(subj, st, ang, mv):
        subj = _NEG_RE.sub('', subj).strip().strip(',').strip()
        return f"{STYLE}, {subj}, {mood}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor(); seeded = 0
    try:
        for i, (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ_ID, code))
            if cur.fetchone(): continue
            sid = f"7e560000-0000-4000-8000-{scene_order:02x}{id_region}0000000{i:02x}"
            p = positive(subj, st, ang, mv)
            is_dual = isinstance(ch, (tuple, list))
            codes = list(ch) if is_dual else ([ch] if ch else [])
            route = "tiler_character_ip" if codes else "tiler_environment"
            ref = _pid(codes[0]) if codes else None
            mp, mn = (CHAR_MOTION, CHAR_MNEG) if codes else (AMBIENT_MOTION, ENV_MNEG)
            pf = {"positive": p, "positivePrompt": p, "narrationRu": narr,
                  "motionPrompt": mp, "motionNegative": mn}
            cur.execute('INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid, PROJ_ID, scene_id, code, json.dumps(pf, ensure_ascii=False), route, ref, narr, st, ang, mv,
                 broll, iconic, tod, palette, (LOC[loc] if loc else None), render_mode))
            for j, cc in enumerate(codes):
                lbl = cc + ("-L" if (is_dual and j == 0) else ("-R" if is_dual else ""))
                cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                    (f"7e560000-0000-4000-8000-{scene_order:02x}90000000{(i+j*0x80):02x}", sid, _cid(cc), lbl, _pid(cc)))
            seeded += 1
        conn.commit()
        sc = [("W" if x[4] in ("EWS","WS") else ("M" if x[4] in ("MS","MCU","OTS") else "C")) for x in SHOTS]
        runs = sum(1 for i in range(2, len(sc)) if sc[i] == sc[i-1] == sc[i-2])
        env = sum(1 for x in SHOTS if not x[1])
        silent = sum(1 for x in SHOTS if not x[10].strip())
        words = sum(len(x[10].split()) for x in SHOTS)
        print(f"OK {label}: seeded {seeded}/{len(SHOTS)} | scale:{' '.join(sc)}")
        print(f"   3-runs:{runs} env:{env} silent:{silent} words:{words} (~{words/140*60:.0f}s VO)")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()
