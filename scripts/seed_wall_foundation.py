# -*- coding: utf-8 -*-
"""
Seed FOUNDATION for project `wall` (ТЫ — нимфоманка. И это вся твоя жизнь.)
Track B, 2nd-person, cradle-to-grave. East Germany / Berlin Wall. Addiction to being desired.
graphic_novel_cell_shaded + Eldritch Comics styleLora (dark noir). ttsEngine f5 (female ref pending).
Heroine has 3 age profiles (YOUNG/MID/OLD); child heroine via env-route. Clones default* from gaz.
Aborts if `wall` exists.

Run: PYTHONIOENCODING=utf-8 python gen-studio/scripts/seed_wall_foundation.py
"""
import json, os, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e580000-0000-4000-8000-000000000001"
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "wall_scriptText.md")
CARTOON = "cell-shaded graphic novel character with hard black ink outline and flat color blocks, dark noir comic shading"
NEG = ("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
       "deformed hands, extra fingers, mutated hands, nudity, explicit content")

# characters: (csuffix, code, displayName, [ (psuffix, profileCode, age, trig, base, extraNeg) ... ])
CHARACTERS = [
    ("c1", "HEROINE", "Героиня (Криста)", [
        ("d1", "HEROINE_YOUNG", "adult 22", "chr1stayoung",
         "a striking 22-year-old East German woman, dark auburn hair to her shoulders, pale grey-green eyes, "
         "sharp captivating features, fair skin, a thin silver chain at her throat as a constant identity anchor, "
         "a knowing restless allure, drab 1970s GDR clothing, " + CARTOON,
         "old woman, wrinkles, grey hair, blonde, man, child"),
        ("d2", "HEROINE_MID", "adult 42", "chr1stamid",
         "a 42-year-old woman, the same dark auburn hair now with a few greys, pale grey eyes, sharper tired "
         "features, faint lines, the same thin silver chain at her throat as a constant identity anchor, "
         "a weary hungry restlessness, plain 1990s clothing, " + CARTOON,
         "young fresh face, blonde, man, child, very old"),
        ("d3", "HEROINE_OLD", "elderly 63", "chr1staold",
         "a gaunt 63-year-old woman, thin grey hair once auburn, pale faded grey eyes, deep lines, hollow lonely "
         "face, the same thin silver chain at her throat as a constant identity anchor, "
         "the worn solitude of a life spent chasing, drab modern clothing, " + CARTOON,
         "young face, auburn hair, blonde, man, child"),
    ]),
    ("c2", "MOTHER", "Мать", [
        ("d4", "MOTHER_BASE", "adult 40", "mutt1woman",
         "a severe cold 1950s East German woman, ash-grey hair in a tight bun, thin pressed lips, a plain grey "
         "housedress and apron as a constant identity anchor, emotionally distant unsmiling face, " + CARTOON,
         "young woman, warm smile, man, glamour, blonde"),
    ]),
    ("c3", "FATHER", "Отец", [
        ("d5", "FATHER_BASE", "adult 38", "vat1man",
         "a gaunt distant 1950s East German working man, dark hair, tired hollow cheeks, a flat worker's cap as a "
         "constant identity anchor, a grey worn jacket, absent cold presence, " + CARTOON,
         "woman, child, smiling warm, blonde, clean-shaven young"),
    ]),
    ("c4", "ANDREAS", "Андреас", [
        ("d6", "ANDREAS_BASE", "adult 28", "andr3asman",
         "a gentle warm-faced East German man of 28, sandy-blond hair, kind eyes behind round wire glasses as a "
         "constant identity anchor, a soft knitted jumper, a draughtsman's quiet sincerity, " + CARTOON,
         "woman, old man, bald, no glasses, dark hair, menacing"),
    ]),
    ("c5", "RIVAL_YOUNG", "Молодая соперница (90е)", [
        ("d7", "RIVAL_YOUNG_BASE", "adult 23", "r1valgirl",
         "a fresh 23-year-old young woman of the 1990s, bright blonde hair, smooth youthful skin, a bold new-era "
         "denim jacket as a constant identity anchor, carefree confident allure, the new generation, " + CARTOON,
         "old woman, auburn hair, man, wrinkles, grey hair"),
    ]),
]

def main():
    with open(SCRIPT_PATH, encoding="utf-8") as f:
        script_text = f.read()
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM projects WHERE slug=%s", ("wall",))
        if cur.fetchone():
            print("ABORT: project 'wall' already exists."); return
        cur.execute('SELECT "defaultNegative","defaultVideoNegative","defaultMotionPrompt",'
                    '"defaultStaticMotionPrompt" FROM projects WHERE slug=%s', ("gaz",))
        row = cur.fetchone()
        if not row:
            print("ABORT: gaz not found for default* clone."); return
        d_neg, d_vneg, d_motion, d_static = row
        # Eldritch Comics dark-noir LoRA (same value as tiler/message)
        settings = json.dumps({"styleLora": {"name": "style\\EldritchComicsXL1.2.safetensors"}})
        cur.execute(
            'INSERT INTO projects (id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier", '
            ' "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt", '
            ' "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","createdAt","updatedAt") '
            'VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s, now(), now())',
            (PROJ_ID, "wall", "ТЫ — нимфоманка. И это вся твоя жизнь.", settings, script_text,
             "youtube", "advertiser_safe", d_neg, d_vneg, d_motion, d_static,
             "f5", None, "graphic_novel_cell_shaded", "narration"))
        nprof = 0
        for csuf, code, name, profiles in CHARACTERS:
            cid = f"7e580000-0000-4000-8000-0000000000{csuf}"
            cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") '
                        'VALUES (%s,%s,%s,%s, now())', (cid, PROJ_ID, code, name))
            cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") '
                        'VALUES (%s,%s, now())', (PROJ_ID, cid))
            for psuf, pcode, age, trig, base, exneg in profiles:
                pid = f"7e580000-0000-4000-8000-0000000000{psuf}"
                cur.execute('INSERT INTO character_profiles '
                    '(id,"characterId","profileCode","ageLabel","targetImages","promptBase",negative,'
                    ' "triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                    (pid, cid, pcode, age, 0, base, NEG + ", " + exneg, trig, True))
                nprof += 1
        conn.commit()
        print("OK seeded project 'wall' (ТЫ — нимфоманка):")
        print(f"  id={PROJ_ID} style=graphic_novel_cell_shaded styleLora=Eldritch tts=f5 export=narration")
        print(f"  scriptText {len(script_text)} chars; {len(CHARACTERS)} characters / {nprof} profiles; defaults cloned from gaz")
        for csuf, code, name, profiles in CHARACTERS:
            print(f"  {code:12} -> {', '.join(p[1] for p in profiles)}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
