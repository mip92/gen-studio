# -*- coding: utf-8 -*-
"""
Seed FOUNDATION for project `beauty` (ТЫ — Красавица. И это вся твоя жизнь.)
Track B, 2nd-person, cradle-to-grave. graphic_novel_cell_shaded, bio_plus look
(NO styleLora override -> default Graphic_Novel_Illustration LoRA). ttsEngine f5.

Heroine has 3 age profiles (YOUNG/MID/OLD) under ONE character; child via env-route.
Clones default* from gaz. Aborts if `beauty` exists.

Run: PYTHONIOENCODING=utf-8 python gen-studio/scripts/seed_beauty_foundation.py
"""
import json, os, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e570000-0000-4000-8000-000000000001"
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "beauty_scriptText.md")
CARTOON = "cell-shaded graphic novel character with hard black ink outline and flat color blocks"
NEG = ("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
       "deformed hands, extra fingers, mutated hands")

# characters: (csuffix, code, displayName, [ (psuffix, profileCode, age, trig, base, extraNeg) ... ])
CHARACTERS = [
    ("c1", "HEROINE", "Героиня", [
        ("d1", "HEROINE_YOUNG", "adult 25", "her0young",
         "a radiant 25-year-old Russian beauty, wavy chestnut hair, large bright green eyes, flawless fair skin, "
         "a small charming beauty mark above her lip as a constant identity anchor, confident captivating smile, "
         "elegant, the kind of face that turns every head, " + CARTOON,
         "old woman, wrinkles, frozen face, overfilled lips, blonde"),
        ("d2", "HEROINE_MID", "adult 45", "her0mid",
         "a 45-year-old woman with an over-procedured face, the same chestnut hair now dyed, a too-smooth frozen "
         "forehead, over-plumped unnatural lips, puffed sharp cheekbones from fillers, anxious tense expression, "
         "the strained mask of someone fighting age, " + CARTOON,
         "young fresh face, natural face, old wrinkled face, man"),
        ("d3", "HEROINE_OLD", "elderly 62", "her0old",
         "a gaunt 62-year-old woman with a distorted mask-like aged face, taut waxy skin over sunken features, "
         "lips that no longer move naturally, grey roots under thin dyed hair, haunted hollow eyes, "
         "the ruined remains of a once-beautiful face, " + CARTOON,
         "young face, smooth face, fillers, man, child"),
    ]),
    ("c2", "MOTHER", "Мать", [
        ("d4", "MOTHER_BASE", "elderly 60", "m0therwoman",
         "an elegant cold 60-year-old Soviet-era woman, silver-grey coiffed hair, powdered proud face, "
         "a string of pearls, holding an antique powder compact as a constant identity anchor, "
         "vain dignified bearing, " + CARTOON,
         "young woman, man, messy hair, casual clothes"),
    ]),
    ("c3", "HUSBAND", "Муж", [
        ("d5", "HUSBAND_BASE", "adult 40", "mu0husband",
         "a handsome dark-haired Russian man, strong jaw, charming confident manner sliding into smug coldness, "
         "wearing a smart casual shirt, a wristwatch as a constant identity anchor, " + CARTOON,
         "woman, old man, beard, bald"),
    ]),
    ("c4", "DAUGHTER", "Дочь", [
        ("d6", "DAUGHTER_BASE", "adult 22", "d0daughter",
         "a natural unmade-up 22-year-old young woman, light-brown hair in a simple ponytail, warm clear eyes, "
         "fresh bare skin, a plain canvas tote bag as a constant identity anchor, sincere grounded look, " + CARTOON,
         "heavy makeup, fillers, old woman, man, glamour"),
    ]),
    ("c5", "ALINA", "Косметолог Алина", [
        ("d7", "ALINA_BASE", "adult 35", "al1nawoman",
         "a sleek 35-year-old cosmetologist, glossy black bob, a crisp white clinic coat, a sweet predatory smile, "
         "holding a filler syringe as a constant identity anchor, manicured and immaculate, " + CARTOON,
         "man, old woman, messy, casual"),
    ]),
    ("c6", "RIVAL", "Молодая соперница", [
        ("d8", "RIVAL_BASE", "adult 25", "r1valwoman",
         "a 25-year-old bleached-blonde young woman, glossy lips, fresh youthful skin, fashionable tight dress, "
         "carefree confident, the husband's younger new woman, " + CARTOON,
         "old woman, man, chestnut hair, natural plain"),
    ]),
]

def main():
    with open(SCRIPT_PATH, encoding="utf-8") as f:
        script_text = f.read()
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM projects WHERE slug=%s", ("beauty",))
        if cur.fetchone():
            print("ABORT: project 'beauty' already exists."); return
        cur.execute('SELECT "defaultNegative","defaultVideoNegative","defaultMotionPrompt",'
                    '"defaultStaticMotionPrompt" FROM projects WHERE slug=%s', ("gaz",))
        row = cur.fetchone()
        if not row:
            print("ABORT: gaz not found for default* clone."); return
        d_neg, d_vneg, d_motion, d_static = row
        # bio_plus look: NO styleLora override -> default Graphic_Novel_Illustration LoRA
        settings = json.dumps({})
        cur.execute(
            'INSERT INTO projects (id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier", '
            ' "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt", '
            ' "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","createdAt","updatedAt") '
            'VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s, now(), now())',
            (PROJ_ID, "beauty", "ТЫ — Красавица. И это вся твоя жизнь.", settings, script_text,
             "youtube", "advertiser_safe", d_neg, d_vneg, d_motion, d_static,
             "f5", None, "graphic_novel_cell_shaded", "narration"))
        nprof = 0
        for csuf, code, name, profiles in CHARACTERS:
            cid = f"7e570000-0000-4000-8000-0000000000{csuf}"
            cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") '
                        'VALUES (%s,%s,%s,%s, now())', (cid, PROJ_ID, code, name))
            cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") '
                        'VALUES (%s,%s, now())', (PROJ_ID, cid))
            for psuf, pcode, age, trig, base, exneg in profiles:
                pid = f"7e570000-0000-4000-8000-0000000000{psuf}"
                cur.execute('INSERT INTO character_profiles '
                    '(id,"characterId","profileCode","ageLabel","targetImages","promptBase",negative,'
                    ' "triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                    (pid, cid, pcode, age, 0, base, NEG + ", " + exneg, trig, True))
                nprof += 1
        conn.commit()
        print("OK seeded project 'beauty' (ТЫ — Красавица):")
        print(f"  id={PROJ_ID} style=graphic_novel_cell_shaded styleLora=NULL(bio_plus default) tts=f5 export=narration")
        print(f"  scriptText {len(script_text)} chars; {len(CHARACTERS)} characters / {nprof} profiles; defaults cloned from gaz")
        for csuf, code, name, profiles in CHARACTERS:
            print(f"  {code:9} -> {', '.join(p[1] for p in profiles)}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
