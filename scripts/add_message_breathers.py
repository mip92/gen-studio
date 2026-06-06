# -*- coding: utf-8 -*-
"""Add ~28 SILENT B-roll breather shots to project `message`.

Purpose: dilute the wall-to-wall narration (≈45 min of non-stop voiceover) with
VO-less landscape / houses / perspective / close-up panels so the viewer's ears
rest. Same pattern as bio_plus silent breathers (memory project_bio_plus_breathers).

Each breather:
  - isBroll=True, route=message_environment, NO participant, narrationText=NULL (silent)
  - locationId=NULL (self-contained landscape panel; full scene baked into positive)
  - doubles as a season / time-of-day marker matching its act's palette
  - ANIMATED acts (cold/A1-A3) get per-shot motionPrompt (ambient weather, no people)
    + motionNegative (hard people/animal/vehicle exclusion) so Wan i2v does not
    hallucinate a human into the empty frame (memory feedback_empty_broll_spawns_people)
  - STATIC acts (A4..coda) ship as stills + Ken Burns in CapCut export -> no Wan video,
    so no people-spawn risk; camera.movement='static_locked_off' as belt-and-suspenders.

Idempotent: skips any shotCode that already exists. NOT rendered (no GPU queued).
Run: PYTHONIOENCODING=utf-8 python add_message_breathers.py
"""
import json, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e550000-0000-4000-8000-000000000001"

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

# Project defaultVideoNegative (so per-shot motionNegative keeps the base guards;
# motionNegative REPLACES the project default entirely when set).
BASE_VNEG = ("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, "
             "extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, "
             "hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, "
             "sudden cut, abrupt transition, identity change, modern brand logos")
PEOPLE_NEG = ("people, person, man, woman, human figure, pedestrian, walking figure, silhouette of a person, "
              "crowd, child, any character, face, animal, moving vehicle, car driving")
ANIM_VNEG = PEOPLE_NEG + ", " + BASE_VNEG

# act_key -> (scene_suffix, act_hex for id, render_mode, timeOfDay, paletteKey, mood)
ACTS = {
    "a1":  ("e1", "1", "animated", "autumn_evening_2025",     "A1_empty_apartment", "muted autumn-grey dusk, lonely low-contrast melancholy, soft northern overcast light"),
    "a2":  ("e2", "2", "animated", "autumn_evening_2025",     "A2_screen_glow",     "muted autumn dusk with a faint cold screen-blue undertone, quiet expectant stillness"),
    "a3":  ("e3", "3", "animated", "winter_morning_2025",     "A3_warm_hope",       "pale winter-morning light, a fragile warm hopeful undertone over cold snow, soft low sun"),
    "a4":  ("e4", "4", "static",   "winter_evening_2025",     "A4_bank_cold",       "cold winter-evening blue, sterile institutional chill, low fluorescent undertone"),
    "a5":  ("e5", "5", "static",   "winter_night_2026",       "A5_kaspi_red",       "deep winter-night blue shadows cut by a harsh red notification glow, tense"),
    "a6":  ("e6", "6", "static",   "late_winter_night_2026",  "A6_pawn_amber",      "late-winter night, amber pawnshop-lamp warmth against deep blue dark, uneasy"),
    "a7":  ("e7", "7", "static",   "early_spring_grey_2026",  "A7_debt_grey",       "early-spring grey thaw, dirty melting snow, flat oppressive overcast, hollow"),
    "a8":  ("e8", "8", "static",   "spring_day_2026",         "A8_daylight_truth",  "clear hard spring daylight, cold exposing clarity, no shadows to hide in"),
    "a9":  ("e9", "9", "static",   "spring_night_2026",       "A9_silence_dark",    "spring-night near-black, a single distant light, suffocating silence"),
    "a10": ("ea", "a", "static",   "summer_overcast_2026",    "A10_hollow_grey",    "flat summer overcast, washed-out hollow grey-green, heat-heavy emptiness"),
    "coda":("eb", "b", "static",   "winter_night_2027",       "CODA_grey",          "winter-night desaturated grey-blue, final stillness, cold and quiet"),
}

# (code, act, shotType, angle, move, subject, motionPrompt|None)
# motionPrompt is set ONLY for shots in animated acts (a1-a3); None elsewhere.
BREATHERS = [
    # ---- A1 opener ----
    ("A1_SH00", "a1", "WS", "high", "push_in",
     "wide establishing aerial view over a quiet Petropavlovsk district of grey nine-storey panel apartment blocks at autumn dusk, bare poplar trees lining empty courtyards, the flat steppe horizon far behind, a scatter of warm lit windows in the grey facades",
     "very slow aerial drift over the rooftops, low dusk clouds sliding across the sky, faint haze shifting, a few window lights glowing steady, bare branches barely stirring, only weather and light in motion, cell-shaded illustration in motion, hand-drawn animation cadence"),
    # ---- A2 opener + 1 mid ----
    ("A2_SH00", "a2", "WS", "eye", "push_in",
     "wide view of a row of Soviet-era five-storey panel houses at autumn evening, wet asphalt courtyard reflecting cold bluish window light, a lone leafless tree, old parked cars under a darkening sky",
     "gentle slow push-in across the quiet courtyard, faint cold window light shifting softly, thin drizzle drifting down, a leafless branch swaying slightly, only weather and light moving, cell-shaded illustration in motion, hand-drawn animation cadence"),
    ("A2_SH16A", "a2", "CU", "eye", "push_in",
     "close-up of a dark window pane at night seen from outside, a faint cold blue phone-screen glow leaking through thin curtains, condensation gathering at the glass corners, the empty courtyard reflected in the dark glass",
     "slow push-in toward the window, the faint blue screen glow pulsing very gently behind the curtain, condensation creeping at the glass corners, only light moving, cell-shaded illustration in motion, hand-drawn animation cadence"),
    # ---- A3 opener + 2 mids ----
    ("A3_SH00", "a3", "WS", "high", "push_in",
     "wide winter-morning view of the frozen Ishim river under a pale low sun, snow-covered banks, distant silhouettes of panel blocks across the white floodplain, soft pink-grey sky",
     "very slow aerial drift over the frozen river, pale morning mist sliding low across the snow, soft sun haze brightening, only light and mist moving, cell-shaded illustration in motion, hand-drawn animation cadence"),
    ("A3_SH11A", "a3", "ECU", "eye", "push_in",
     "extreme close-up of delicate ice-feather frost crystals spreading across a window corner, pale warm morning light glowing through them",
     "frost crystals slowly spreading and glinting as pale morning light shifts across the glass, the faintest push-in, only light moving, cell-shaded illustration in motion, hand-drawn animation cadence"),
    ("A3_SH22A", "a3", "WS", "low", "push_in",
     "low-angle wide shot of snow-laden bare birch branches against a pale winter-morning sky, a soft sun behind thin clouds",
     "snow-laden birch branches swaying gently in a faint breeze, a few snow flakes drifting down, thin clouds sliding behind, only weather moving, cell-shaded illustration in motion, hand-drawn animation cadence"),
    # ---- A4 opener + 2 mids ----
    ("A4_SH00", "a4", "WS", "eye", "static",
     "wide view of a Halyk Bank branch facade at cold winter evening, blue-white signage glow on dirty snow, bare trees, an empty cold pavement", None),
    ("A4_SH11A", "a4", "CU", "eye", "static",
     "close-up of frost crystals on a cold blue glass door handle of a bank entrance, a sterile fluorescent reflection in the glass", None),
    ("A4_SH23A", "a4", "WS", "high", "static",
     "high wide view of a winter-evening city avenue, rows of panel blocks under cold blue dusk, sparse car headlights on the snowy road", None),
    # ---- A5 opener + 2 mids ----
    ("A5_SH00", "a5", "WS", "eye", "static",
     "wide night view of a dark Petropavlovsk courtyard in deep winter, snow under a single sodium streetlamp, panel-block facades with a few glowing windows, a harsh red light burning in one of them", None),
    ("A5_SH11A", "a5", "ECU", "eye", "static",
     "extreme close-up of a snow-covered power-line wire at night, a single red light reflection trembling on the ice, deep blue dark behind", None),
    ("A5_SH23A", "a5", "WS", "low", "static",
     "low wide shot of a row of dark nine-storey blocks at winter night, one cold-lit stairwell window column, a red glow leaking from a single flat", None),
    # ---- A6 opener + 2 mids ----
    ("A6_SH00", "a6", "WS", "eye", "static",
     "wide late-winter night view of a small pawnshop storefront, a warm amber lamp over a barred window glowing against deep blue snowdrifts, a narrow empty street", None),
    ("A6_SH11A", "a6", "CU", "eye", "static",
     "close-up of an amber-lit pawnshop window grille at night, frost on the iron bars, blurred warm light within", None),
    ("A6_SH23A", "a6", "WS", "high", "static",
     "high wide view of a sleeping winter-night district, amber and cold-blue window lights scattered across dark panel blocks, deep snow below", None),
    # ---- A7 opener + 2 mids ----
    ("A7_SH00", "a7", "WS", "eye", "static",
     "wide early-spring view of a thawing Petropavlovsk courtyard, dirty melting grey snow, puddles, bare wet poplars, a flat oppressive overcast", None),
    ("A7_SH11A", "a7", "ECU", "low", "static",
     "extreme close-up of a puddle on dirty melting snow reflecting a flat grey overcast sky and a single bare branch", None),
    ("A7_SH23A", "a7", "WS", "eye", "static",
     "wide shot of an empty grey bus stop on a thawing spring street, wet asphalt, slush, leafless trees, low flat clouds", None),
    # ---- A8 opener + 3 mids ----
    ("A8_SH00", "a8", "WS", "high", "static",
     "high wide view of Petropavlovsk under clear hard spring daylight, panel blocks and budding trees, the Ishim river glinting cold and exposed", None),
    ("A8_SH09A", "a8", "WS", "eye", "static",
     "wide view of the Astana airport terminal exterior under a bright spring day, a glass facade reflecting the clear sky, an empty drop-off lane", None),
    ("A8_SH18A", "a8", "CU", "eye", "static",
     "close-up of fresh green poplar buds opening on a wet branch in hard spring light", None),
    ("A8_SH27A", "a8", "WS", "low", "static",
     "low wide shot of a clear spring sky over panel rooftops, TV antennas and tangled wires in harsh bright daylight", None),
    # ---- A9 opener + 2 mids ----
    ("A9_SH00", "a9", "WS", "eye", "static",
     "wide spring-night view of a near-black empty courtyard, a single distant window light, panel-block silhouettes, suffocating silence", None),
    ("A9_SH11A", "a9", "ECU", "eye", "static",
     "extreme close-up of a single lit window high in a dark panel block at spring night, the rest of the facade swallowed in black", None),
    ("A9_SH22A", "a9", "WS", "high", "static",
     "high wide shot of a silent dark district at spring night, scattered cold window lights, empty streets far below", None),
    # ---- A10 opener + 1 mid ----
    ("A10_SH00", "a10", "WS", "high", "static",
     "high wide summer view of Petropavlovsk under a flat heavy overcast, washed-out grey-green panel blocks and dusty courtyards, heat-heavy emptiness", None),
    ("A10_SH16A", "a10", "CU", "eye", "static",
     "close-up of drifting white poplar fluff caught on dry summer grass and cracked asphalt under flat hollow grey light", None),
    # ---- CODA opener ----
    ("CODA_SH00", "coda", "WS", "eye", "static",
     "wide desaturated winter-night view of an empty Petropavlovsk courtyard under faint snowfall, one cold streetlamp, dark panel blocks, final stillness", None),
]


def scale_group(st):
    return "W" if st in ("EWS", "WS") else ("M" if st in ("MS", "MCU", "OTS") else "C")


def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    seeded = 0; skipped = 0
    try:
        for idx, (code, act, st, ang, mv, subj, motion) in enumerate(BREATHERS):
            scene_suffix, act_hex, render_mode, tod, palette, mood = ACTS[act]
            scene_id = f"7e550000-0000-4000-8000-0000000000{scene_suffix}"
            sid = f"7e550000-0000-4000-8000-b{act_hex}0000{idx:06x}"

            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ_ID, code))
            if cur.fetchone():
                skipped += 1; continue

            p = f"{STYLE}, {subj}, {mood}, {TECH}, {st}, {ang} angle, {mv} camera, 16:9"
            pf = {"positive": p, "positivePrompt": p}
            if render_mode == "animated":
                if not motion:
                    raise RuntimeError(f"{code}: animated breather needs a motionPrompt")
                pf["motionPrompt"]  = motion
                pf["motionNegative"] = ANIM_VNEG
            else:
                # static still -> Ken Burns; mark static so a manual video render
                # would also fall back to the no-people static motion prompt.
                pf["camera"] = {"movement": "static_locked_off"}

            cur.execute(
                'INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                '"referenceProfileId","narrationText","shotType","cameraAngle","cameraMove","isBroll","isIconic",'
                '"timeOfDay","paletteKey","locationId","renderMode","narrativeFunction","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,NULL,NULL,%s,%s,%s,TRUE,FALSE,%s,%s,NULL,%s,%s, now(), now())',
                (sid, PROJ_ID, scene_id, code, json.dumps(pf, ensure_ascii=False), "message_environment",
                 st, ang, mv, tod, palette, render_mode, "breather"))
            seeded += 1

        conn.commit()
        by_act = {}
        for code, act, st, *_ in BREATHERS:
            by_act.setdefault(act, []).append(scale_group(st))
        print(f"OK breathers: seeded {seeded} / skipped {skipped} (total {len(BREATHERS)})")
        for act in ACTS:
            if act in by_act:
                print(f"   {act}: {len(by_act[act])} breathers  scales:{' '.join(by_act[act])}  ({ACTS[act][3]})")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii', 'replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()


if __name__ == "__main__":
    main()
