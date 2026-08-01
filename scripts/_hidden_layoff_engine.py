# -*- coding: utf-8 -*-
"""Shot engine for hidden_layoff («ТЫ — Уволенный, который ходит на работу»).

realcomic_qwen scenes + FLUX comic anchors, config cloned from car_flipper.
Lineage: _car_flipper_engine.py, REWRITTEN for the 2026-07-30 rule set:

  * positive = STYLE + compact framing + subj + palette. NO camera-movement
    clause in the positive (692-shot defect class, qwen2511 skill §2a-1);
    the camera lives in Shot.cameraMove and is derived at dispatch for i2v.
  * word budget guard: framing + subj + palette should stay <= ~55 words
    (composeQwenInstruction drops trailing clauses past the budget).
  * motionPrompt is a MANDATORY per-shot unique MOTION clause (verb phrase
    about change, 8..30 words), never a copy of the scene description, plus
    a POSITIVE lock tail (wan22 skill §3). No negations anywhere, no word
    "camera" (the camera clause is derived from cameraMove at dispatch and
    MENTIONS_CAMERA would suppress the derivation).
  * props are first-class rows: prop="CODE" sets shots.propId.
      - prop-hero: ch=None + prop set + loc=None + st in (INSERT, ECU)
      - prop-in-scene: ch set + prop set + loc allowed (<=2 chars: 3-ref cap)
  * dual participants: ch=("A","B") -> Picture 1 / Picture 2 order.

seed_act(scene_key, palette, shots, render_mode='animated', id_region='0')
  shots tuple (12/13/14 fields):
    (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr, mot
     [, prop [, lock]])
  lock override: 'env' | 'char' | 'crowd' (default derived from ch)
"""
import json, re, psycopg2

PFX = "7e730000-0000-4000-8000-"
PROJ = PFX + "000000000001"
ROUTE_C = "hidden_layoff_character_ip"
ROUTE_E = "hidden_layoff_environment"

STYLE = ("realcomic style, hand-drawn comic illustration with a realistic touch, drawn and inked rather than photographed, "
         "clean confident linework, painterly shading, muted cinematic color palette, 16:9 cinematic composition, ")

FRAMING = {
    "EWS":    "an extreme wide establishing shot",
    "WS":     "a wide shot with the whole figure in frame",
    "MS":     "a medium shot from the knees up",
    "MCU":    "a medium close-up from the chest up",
    "OTS":    "an over-the-shoulder shot past the near person's dark shoulder",
    "BACK":   "a shot from directly behind the figure, the face hidden",
    "POV":    "a first-person point-of-view shot with only the character's own hands entering the frame",
    "CU":     "a close-up on the face",
    "ECU":    "an extreme close-up of one small detail",
    "INSERT": "a tight insert shot of a single object filling the frame",
}
ANG = {"eye": "seen at eye level", "low": "seen from a low angle", "high": "seen from a high angle",
       "over": "", "pov": "", "top": "seen from directly overhead", "dutch": "the frame tilted off level"}
SCALE = {"EWS": "W", "WS": "W", "MS": "M", "MCU": "M", "OTS": "M", "BACK": "M", "POV": "M", "CU": "C", "ECU": "C", "INSERT": "C"}
MOVES = ("static", "push_in", "pull_out", "pan_left", "pan_right", "track", "tilt_up", "tilt_down", "handheld")

LOCK = {
    "env":  (", the place stays deserted, every surface and object holding its exact position, "
             "only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence"),
    "char1": (", the same single figure throughout the shot, breathing and small weight shifts only, "
              "the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence"),
    "char2": (", the same two figures throughout the shot, breathing and small weight shifts only, "
              "the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence"),
    "crowd": (", the same scattered figures throughout the shot, each holding their place with small shifts of weight, "
              "the rest of the frame holding still, the illustration in motion, hand-drawn animation cadence"),
}
ENV_MNEG = ("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, anime girl, "
            "manga character, chibi, extra humans appearing, new cars appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MNEG = ("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
             "chibi, extra limbs, deformed face, merged faces, face swap, photoreal, photograph, 3D render, plastic skin, flicker, warping")

_NEG_RE = re.compile(r"\bno\b|\bwithout\b|\bnobody\b|\bno one\b|\bnever\b|\bnot\b", re.I)
_TRAP_RE = re.compile(r"\bwings?\b|redden|\btongue\b", re.I)


def _wc(s):
    return len(s.split())


def seed_act(scene_key, palette, shots, render_mode="animated", id_region="0"):
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute('SELECT id,"sortOrder" FROM scenes WHERE "projectId"=%s AND "sceneKey"=%s', (PROJ, scene_key))
    row = cur.fetchone()
    if not row:
        raise SystemExit("no scene " + scene_key)
    scene_id, act_idx = row
    cur.execute('SELECT cp."profileCode",cp.id,c.id FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id '
                'WHERE c.id IN (SELECT "characterId" FROM project_characters WHERE "projectId"=%s)', (PROJ,))
    prof = {pc: (pid, cid) for pc, pid, cid in cur.fetchall()}
    cur.execute('SELECT slug,id FROM locations WHERE "projectId"=%s', (PROJ,))
    locs = dict(cur.fetchall())
    cur.execute('SELECT code,id FROM props WHERE "projectId"=%s', (PROJ,))
    props = dict(cur.fetchall())
    codes = [s[0] for s in shots]
    cur.execute('SELECT id FROM shots WHERE "projectId"=%s AND "shotCode"=ANY(%s)', (PROJ, codes))
    old = [r[0] for r in cur.fetchall()]
    if old:
        cur.execute('DELETE FROM shot_participants WHERE "shotId"=ANY(%s)', (old,))
        cur.execute('DELETE FROM shots WHERE id=ANY(%s)', (old,))
    seq, scales, subjects, narrs, mots = [], [], [], [], []
    duals = 0
    for idx, s in enumerate(shots):
        prop_code, lock_key = None, None
        if len(s) == 12:
            code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr, mot = s
        elif len(s) == 13:
            code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr, mot, prop_code = s
        elif len(s) == 14:
            code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr, mot, prop_code, lock_key = s
        else:
            raise SystemExit("bad tuple len %d on %s" % (len(s), s[0]))
        chars = list(ch) if isinstance(ch, tuple) else ([ch] if ch else [])
        is_char = len(chars) > 0
        for c in chars:
            if c not in prof:
                raise SystemExit("unknown profile %s on %s" % (c, code))
        if st not in FRAMING:
            raise SystemExit("unknown shotType %s on %s" % (st, code))
        if mv not in MOVES:
            raise SystemExit("unknown cameraMove %s on %s" % (mv, code))
        if ang not in ANG:
            raise SystemExit("unknown angle %s on %s" % (ang, code))
        # --- validation: negations / traps / budgets -------------------------
        for label, txt in (("subj", subj), ("mot", mot)):
            if _NEG_RE.search(txt):
                raise SystemExit("NEGATION in %s of %s: %r" % (label, code, _NEG_RE.search(txt).group(0)))
            if _TRAP_RE.search(txt):
                raise SystemExit("WORD TRAP in %s of %s: %r" % (label, code, _TRAP_RE.search(txt).group(0)))
        if "camera" in mot.lower():
            raise SystemExit("camera clause in mot of %s (derived from cameraMove at dispatch)" % code)
        if not mot or not (6 <= _wc(mot) <= 32):
            raise SystemExit("mot of %s must be 6..32 words (got %d)" % (code, _wc(mot)))
        # --- prop wiring ------------------------------------------------------
        prop_id = None
        if prop_code:
            if prop_code not in props:
                raise SystemExit("unknown prop %s on %s" % (prop_code, code))
            prop_id = props[prop_code]
            if not is_char:  # prop-hero
                if loc is not None:
                    raise SystemExit("prop-hero %s must have loc=None" % code)
                if st not in ("INSERT", "ECU"):
                    raise SystemExit("prop-hero %s must be INSERT/ECU" % code)
            elif len(chars) > 2:
                raise SystemExit("prop-in-scene %s: max 2 chars (3-reference cap)" % code)
        # --- compose ----------------------------------------------------------
        a = "" if st in ("OTS", "POV", "BACK") else ANG[ang]
        frame = FRAMING[st] + (", " + a if a else "")
        positive = STYLE + frame + ", " + subj + ", " + palette
        budget = _wc(frame) + _wc(subj) + _wc(palette)
        lk = lock_key or ("char2" if len(chars) >= 2 else ("char1" if is_char else "env"))
        if lk == "char" :
            lk = "char2" if len(chars) >= 2 else "char1"
        motion = mot.strip().rstrip(",.") + LOCK[lk]
        mneg = CHAR_MNEG if (is_char or lk in ("char1", "char2", "crowd")) else ENV_MNEG
        route = ROUTE_C if is_char else ROUTE_E
        ref = prof[chars[0]][0] if is_char else None
        loc_id = locs.get(loc) if loc else None
        if loc and not loc_id:
            raise SystemExit("unknown location %s on %s" % (loc, code))
        sid = PFX + "%02x%02x%s0000000" % (act_idx, idx, id_region)
        pf = {"positive": positive, "positivePrompt": positive, "narrationRu": narr,
              "motionPrompt": motion, "motionNegative": mneg}
        cur.execute('''INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId","propId","narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic","renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())''',
                    (sid, PROJ, scene_id, code, json.dumps(pf, ensure_ascii=False), route, ref, loc_id, prop_id, narr, st, ang, mv, tod, scene_key, broll, iconic, render_mode))
        for pi, c in enumerate(chars):
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1] + str(pi + 1), sid, prof[c][1], c, prof[c][0]))
        if len(chars) == 2:
            duals += 1
        seq.append((code, SCALE[st], narr, budget))
        scales.append(SCALE[st])
        subjects.append((code, subj[:60].lower()))
        narrs.append((code, narr))
        mots.append((code, mot[:50].lower()))
    # --- act-level report ------------------------------------------------------
    runs = [seq[i][0] for i in range(2, len(seq)) if scales[i] == scales[i - 1] == scales[i - 2]]
    silent = [c for c, _, n, _ in seq if not (n or "").strip()]
    wc = [(c, len(n.split())) for c, _, n, _ in seq if (n or "").strip()]
    short = [(c, w) for c, w in wc if w < 10]
    over = [(c, b) for c, _, _, b in seq if b > 55]
    nodot = [c for c, _, n, _ in seq if (n or "").strip() and n.strip()[-1] not in ".!?…"]
    multisent = [c for c, _, n, _ in seq if (n or "").strip() and re.search(r"[.!?]\s+[а-яёa-z]", n.strip()[:-1], re.I)]
    forb = [c for c, _, n, _ in seq if re.search(r"\bсорок|\bстоил|понимаешь, что|ловишь себя", (n or "").lower())]
    seen, dup_subj = {}, []
    for c, sj in subjects:
        dup_subj.append("%s~%s" % (seen[sj], c)) if sj in seen else seen.setdefault(sj, c)
    mseen, dup_mot = {}, []
    for c, m in mots:
        dup_mot.append("%s~%s" % (mseen[m], c)) if m in mseen else mseen.setdefault(m, c)
    grams = {}
    for c, n in narrs:
        ws = re.findall(r"[а-яё]+", (n or "").lower())
        for i in range(len(ws) - 3):
            grams.setdefault(" ".join(ws[i:i + 4]), set()).add(c)
    rep = [(g, sorted(cs)) for g, cs in grams.items() if len(cs) >= 3]
    words = sum(w for _, w in wc)
    cx.commit(); cur.close(); cx.close()
    print("  %-4s shots=%2d duals=%d words=%4d scale3run=%s silent=%s short=%s nodot=%s multisent=%s forb=%s over55=%s dupsubj=%s dupmot=%s tail=%s" % (
        scene_key, len(shots), duals, words,
        ",".join(runs) or "0", ",".join(silent) or "0",
        ",".join("%s:%d" % x for x in short) or "0",
        ",".join(nodot) or "0", ",".join(multisent) or "0", ",".join(forb) or "0",
        ",".join("%s:%d" % x for x in over) or "0",
        ",".join(dup_subj) or "0", ",".join(dup_mot) or "0", "".join(scales[-5:])))
    for g, cs in rep:
        print("    REPEAT-4GRAM '%s' in %s" % (g, ",".join(cs)))
