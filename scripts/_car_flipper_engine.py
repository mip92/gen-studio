# -*- coding: utf-8 -*-
"""Shot engine for car_flipper («ТЫ — Автоперекуп»). realcomic_qwen scenes + FLUX anchors.

Lineage: _trucker_engine.py, with the changes the Qwen render path needs:

  * EXPLICIT FRAMING CLAUSE per shotType, auto-prepended to every positive.
    Qwen-Image-Edit treats an attached anchor as the image being edited and
    will happily hand back the anchor's waist-up portrait framing with a new
    background pasted behind it. The framing clause states the camera distance
    and WHICH PART OF THE BODY is inside the frame, in plain language, before
    the action — so "wide shot, figure small in frame" can't be read as
    "portrait". Pair with the anti-paste sentences in composeQwenInstruction.
  * `subj` is written as a PRESENT-PARTICIPLE ACTION clause ("VIKTOR crouching
    …, slowly turning a screwdriver …"). It is reused verbatim as the per-shot
    motionPrompt, so a well-written subj IS a well-written motion prompt and
    every shot gets a unique one (§5.3b). Pass `mot` to override.
  * DUAL participants: ch=("A","B") -> two shot_participants rows, order =
    Picture 1 / Picture 2 for the Qwen dual path; write subj as
    "... A on the left ... B on the right ...".
  * OBJECTS prop-hero anchors: ch="OBJ:<key>" -> env route, loc=None.

seed_act(scene_key, palette, shots, render_mode='animated', id_region='0')
  shots tuple: (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr[, mot])
"""
import json, re, psycopg2

PFX = "7e6e0000-0000-4000-8000-"
PROJ = PFX + "000000000001"
ROUTE_C = "car_flipper_character_ip"
ROUTE_E = "car_flipper_environment"

# Style block, stated ENTIRELY in the positive. Qwen's VL encoder has no
# negation channel, so the usual "no photorealism, no anime" tail would push
# the render TOWARDS those; the look is pinned with positive words instead.
STYLE = ("realcomic style, hand-drawn comic illustration with a realistic touch, drawn and inked rather than photographed, "
         "clean confident linework, painterly shading, muted cinematic color palette, 16:9 cinematic composition, ")

# Camera-distance directive per shotType. Stated as plain language because the
# Qwen VL encoder reads sentences, and stated FIRST because this is the single
# instruction that stops an anchor portrait being handed back unchanged.
FRAMING = {
    "EWS":    "an extreme wide establishing shot in which any person is small and distant inside a large visible location",
    "WS":     "a wide shot showing the whole figure from head to feet with the location open around them",
    "MS":     "a medium shot framed from the knees up",
    "MCU":    "a medium close-up framed from the chest up",
    "OTS":    "an over-the-shoulder shot with the near person's shoulder and the back of their head large and dark along one edge of the frame",
    "BACK":   "a shot taken from directly behind the figure so that only the back of the head and the shoulders are visible and the face is hidden",
    "POV":    "a first-person point-of-view shot seen through the character's own eyes, with only their own hands entering the bottom of the frame",
    "CU":     "a close-up in which the face fills most of the frame",
    "ECU":    "an extreme close-up of one small detail filling the whole frame",
    "INSERT": "a tight insert shot of a single object filling the frame",
}

OBJECTS = {
    "odometer":  "a mechanical odometer drum counter pulled out of a car instrument cluster, six white digits on black barrels, its toothed cable socket exposed at the back",
    "driver":    "a cheap flat-blade screwdriver whose handle is wrapped in layers of blue insulating tape, the shaft worn bright at the tip",
    "barsetka":  "a small cracked black leather wrist pouch with a scuffed zip and a short hand strap, its corners rubbed grey and soft with use",
    "contract":  "a two-page carbon-copy vehicle sale form on a clipboard, printed boxes filled in by hand, a fresh ballpoint signature on the lower line",
    "brakeline": "a corroded steel brake line running under a car floor, its rust bloom freshly hidden under a thick grey coat of sprayed underbody sealant",
    "keys":      "a single car key on a split ring with a curling paper price tag tied to it, the tag's handwriting smudged by thumbprints",
    "backpack":  "a small yellow child's rucksack shaped like a bear, one ear frayed, a plastic bottle pocket sagging on the side",
    "putty":     "a wide flexible body-filler spatula lifting a pale grey ridge of polyester putty, tiny bubbles caught in the paste",
    "cluster":   "a car instrument cluster lying face-down on newspaper, its rear casing open, coloured wires and a disconnected speedometer cable fanned out",
    "wreath":    "a small artificial funeral wreath of stiff dark green plastic leaves with a pale ribbon, wired to a low metal fence rail",
}
OBJ_TAIL = (", the object fills the frame as the single clear subject in crisp sharp focus, "
            "the surroundings thrown far out of focus, shallow depth of field, one focused practical light")

ENV_GUARD = (", with only ambient environmental motion, drifting dust and slow shifting light, faint movement of air, "
             "an empty still scene with no people and no figures, the illustration barely coming to life, hand-drawn animation cadence")
CHAR_GUARD = (", subtle natural motion of only the figures already present in the frame, small breathing and quiet micro-movements, "
              "no new people entering, no extra figures appearing, the illustration in motion, hand-drawn animation cadence")
ENV_MNEG = ("people, person, man, woman, human figure, figures, characters, crowd, silhouettes of people, anime character, anime girl, "
            "manga character, chibi, extra humans appearing, new cars appearing, doors opening, photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
CHAR_MNEG = ("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
             "chibi, extra limbs, deformed face, merged faces, face swap, photoreal, photograph, 3D render, plastic skin, flicker, warping")

# Camera stated as prose, not as a trailing tag list ("MS, eye-level angle,
# slow push-in camera, 16:9"): 2511 reads sentences and measurably loses
# composition on long tag stacks.
MOVES = {"static": "the camera locked off and still", "push_in": "the camera slowly pushing in",
         "pull_out": "the camera slowly pulling back", "pan_left": "the camera slowly panning left",
         "pan_right": "the camera slowly panning right", "track": "the camera slowly tracking alongside",
         "tilt_up": "the camera slowly tilting up", "tilt_down": "the camera slowly tilting down",
         "handheld": "a subtle handheld drift"}
ANG = {"eye": "seen at eye level", "low": "seen from a low angle", "high": "seen from a high angle",
       "over": "", "pov": "", "top": "seen from directly overhead", "dutch": "the frame tilted off level"}
SCALE = {"EWS": "W", "WS": "W", "MS": "M", "MCU": "M", "OTS": "M", "BACK": "M", "POV": "M", "CU": "C", "ECU": "C", "INSERT": "C"}

_NEG = ("no people", "no person", "no figures", "no faces", "no one", "without people", "nobody")
_DOF_RE = re.compile(r", the object fills the frame.*$")


def _frame(st, ang):
    """Framing clause + angle, deduped: OTS/POV/BACK already state their angle."""
    a = "" if st in ("OTS", "POV", "BACK") else ANG[ang]
    return FRAMING[st] + (", " + a if a else "")


def _motion(subj, is_char, mot):
    if mot:
        return mot + (CHAR_GUARD if is_char else ENV_GUARD)
    return _DOF_RE.sub("", subj).strip().rstrip(",") + (CHAR_GUARD if is_char else ENV_GUARD)


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
    codes = [s[0] for s in shots]
    cur.execute('SELECT id FROM shots WHERE "projectId"=%s AND "shotCode"=ANY(%s)', (PROJ, codes))
    old = [r[0] for r in cur.fetchall()]
    if old:
        cur.execute('DELETE FROM shot_participants WHERE "shotId"=ANY(%s)', (old,))
        cur.execute('DELETE FROM shots WHERE id=ANY(%s)', (old,))
    seq, scales, subjects, narrs = [], [], [], []
    duals = 0
    for idx, s in enumerate(shots):
        if len(s) == 11:
            (code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr), mot = s, None
        else:
            code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr, mot = s
        low = subj.lower()
        for n in _NEG:
            if n in low:
                raise SystemExit("NEGATION in %s: %s" % (code, n))
        if st not in FRAMING:
            raise SystemExit("unknown shotType %s on %s" % (st, code))
        is_obj = isinstance(ch, str) and ch.startswith("OBJ:")
        chars = list(ch) if isinstance(ch, tuple) else ([ch] if (ch and not is_obj) else [])
        is_char = len(chars) > 0
        for c in chars:
            if c not in prof:
                raise SystemExit("unknown profile %s on %s" % (c, code))
        if is_obj:
            key = ch[4:]
            if key not in OBJECTS:
                raise SystemExit("unknown object %s on %s" % (key, code))
            if loc is not None:
                raise SystemExit("OBJ shot %s must have loc=None" % code)
            subj = subj + ", " + OBJECTS[key] + OBJ_TAIL
        sid = PFX + "%02x%02x%s0000000" % (act_idx, idx, id_region)
        positive = STYLE + _frame(st, ang) + ", " + subj + ", " + palette + ", " + MOVES[mv]
        route = ROUTE_C if is_char else ROUTE_E
        ref = prof[chars[0]][0] if is_char else None
        loc_id = locs.get(loc) if loc else None
        if loc and not loc_id:
            raise SystemExit("unknown location %s on %s" % (loc, code))
        pf = {"positive": positive, "positivePrompt": positive, "narrationRu": narr,
              "motionPrompt": _motion(subj, is_char, mot), "motionNegative": CHAR_MNEG if is_char else ENV_MNEG}
        cur.execute('''INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey","referenceProfileId","locationId","narrationText","shotType","cameraAngle","cameraMove","timeOfDay","paletteKey","isBroll","isIconic","renderMode","updatedAt")
            VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())''',
                    (sid, PROJ, scene_id, code, json.dumps(pf, ensure_ascii=False), route, ref, loc_id, narr, st, ang, mv, tod, scene_key, broll, iconic, render_mode))
        for pi, c in enumerate(chars):
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1] + str(pi + 1), sid, prof[c][1], c, prof[c][0]))
        if len(chars) == 2:
            duals += 1
        seq.append((code, SCALE.get(st, "M"), narr))
        scales.append(SCALE.get(st, "M"))
        subjects.append((code, subj[:60].lower()))
        narrs.append((code, narr))
    runs = [seq[i][0] for i in range(2, len(seq)) if scales[i] == scales[i - 1] == scales[i - 2]]
    silent = [c for c, _, n in seq if not (n or "").strip()]
    wc = [(c, len(n.split())) for c, _, n in seq if (n or "").strip()]
    short = [(c, w) for c, w in wc if w < 12]
    long = [(c, w) for c, w in wc if w > 20]
    nodot = [c for c, _, n in seq if (n or "").strip() and n.strip()[-1] not in ".!?…"]
    seen = {}
    dup_subj = []
    for c, sj in subjects:
        if sj in seen:
            dup_subj.append("%s~%s" % (seen[sj], c))
        else:
            seen[sj] = c
    grams = {}
    for c, n in narrs:
        ws = re.findall(r"[а-яё]+", (n or "").lower())
        for i in range(len(ws) - 3):
            g = " ".join(ws[i:i + 4])
            grams.setdefault(g, set()).add(c)
    rep = [(g, sorted(cs)) for g, cs in grams.items() if len(cs) >= 3]
    tail = "".join(scales[-5:])
    words = sum(w for _, w in wc)
    cx.commit()
    cur.close()
    cx.close()
    print("  %-13s shots=%2d duals=%2d words=%4d scale3run=%s silent=%s short=%s long=%s nodot=%s dupsubj=%s tail=%s" % (
        scene_key, len(shots), duals, words,
        (",".join(runs) if runs else "0"), (",".join(silent) if silent else "0"),
        (",".join("%s:%d" % (c, w) for c, w in short) if short else "0"),
        (",".join("%s:%d" % (c, w) for c, w in long) if long else "0"),
        (",".join(nodot) if nodot else "0"),
        (",".join(dup_subj) if dup_subj else "0"), tail))
    for g, cs in rep:
        print("    REPEAT-4GRAM '%s' in %s" % (g, ",".join(cs)))
