# -*- coding: utf-8 -*-
"""
Seed FOUNDATION for project `message` (Сообщение. История одной переписки.)
Track B cautionary tale, graphic_novel_cell_shaded, style LoRA = Eldritch Comics.

Creates: project row (+scriptText from file, +settings.styleLora), 3 characters
(IRINA / DASHA / VICTOR), their character_profiles, and project_characters M:N.

Clones the four NOT-NULL default* prompt fields + ttsEngine from the gaz project
(proven cartoon graphic-novel values). Aborts if `message` already exists.

Run:  python gen-studio/scripts/seed_message_foundation.py
"""
import json, os, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")

PROJ_ID = "7e550000-0000-4000-8000-000000000001"
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "message_scriptText.md")
STYLE_LORA = "style\\EldritchComicsXL1.2.safetensors"

# id, code, displayName, profileId, profileCode, ageLabel, triggerToken, promptBase, negative
CHARACTERS = [
    dict(
        cid="7e550000-0000-4000-8000-0000000000c1", code="IRINA", name="Ирина Сергеевна",
        pid="7e550000-0000-4000-8000-0000000000d1", pcode="IRINA_BASE",
        age="adult 48", trig="ir1nawoman",
        base=("a 48-year-old Russian-speaking Kazakhstani woman from Petropavlovsk, "
              "dark ash-brown hair with visible grey streaks pulled into a low loose bun, "
              "tired soft hazel eyes, fine lines around the eyes, pale northern winter complexion, "
              "modest slightly stooped weary posture, wearing a beige knitted cardigan over a grey blouse, "
              "a thin plain gold wedding ring on her left hand as a constant identity anchor, "
              "cell-shaded graphic novel character with hard black ink outline and flat color blocks"),
        neg=("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
             "young woman, blonde hair, heavy makeup, glamour, deformed hands, extra fingers"),
    ),
    dict(
        cid="7e550000-0000-4000-8000-0000000000c2", code="DASHA", name="Даша",
        pid="7e550000-0000-4000-8000-0000000000d2", pcode="DASHA_BASE",
        age="adult 24", trig="d4shawoman",
        base=("a 24-year-old Kazakhstani woman, dyed dark cherry-red chin-length bob, "
              "straight confident posture, clear bright brown eyes, smooth fair skin, slim modern build, "
              "wearing a fitted charcoal turtleneck and a denim jacket, "
              "bright coral over-ear headphones resting around her neck as a constant identity anchor, "
              "cell-shaded graphic novel character with hard black ink outline and flat color blocks"),
        neg=("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
             "older woman, grey hair, blonde hair, deformed hands, extra fingers"),
    ),
    dict(
        cid="7e550000-0000-4000-8000-0000000000c3", code="VICTOR", name="«Виктор» (фото)",
        pid="7e550000-0000-4000-8000-0000000000d3", pcode="VICTOR_BASE",
        age="adult 52", trig="v1ktorman",
        base=("a 52-year-old grey-templed Russian man with a neat short greying beard, "
              "calm reassuring smile, weathered tanned face, broad build, "
              "wearing an orange offshore oil-rig hard hat and a navy work jacket, "
              "standing in front of a blurred offshore sea horizon, "
              "the exact same single stolen profile photograph that never changes pose or background, "
              "cell-shaded graphic novel character with hard black ink outline and flat color blocks"),
        neg=("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
             "young man, clean-shaven, deformed hands, extra fingers"),
    ),
]

def main():
    with open(SCRIPT_PATH, encoding="utf-8") as f:
        script_text = f.read()

    conn = psycopg2.connect(**DSN)
    conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM projects WHERE slug=%s", ("message",))
        if cur.fetchone():
            print("ABORT: project 'message' already exists — nothing seeded.")
            return

        # Clone proven cartoon defaults + tts engine from gaz.
        cur.execute(
            'SELECT "defaultNegative","defaultVideoNegative","defaultMotionPrompt",'
            '"defaultStaticMotionPrompt","ttsEngine" FROM projects WHERE slug=%s', ("gaz",))
        row = cur.fetchone()
        if not row:
            print("ABORT: gaz project not found — cannot clone defaults.")
            return
        d_neg, d_vneg, d_motion, d_static, tts = row

        settings = json.dumps({"styleLora": {"name": STYLE_LORA}})

        cur.execute(
            'INSERT INTO projects '
            '(id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier", '
            ' "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt", '
            ' "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","createdAt","updatedAt") '
            'VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s, now(), now())',
            (PROJ_ID, "message", "Сообщение. История одной переписки.", settings, script_text,
             "youtube", "advertiser_safe",
             d_neg, d_vneg, d_motion, d_static,
             tts, None, "graphic_novel_cell_shaded", "narration"),
        )

        for c in CHARACTERS:
            cur.execute(
                'INSERT INTO characters (id,"projectId",code,"displayName","createdAt") '
                'VALUES (%s,%s,%s,%s, now())',
                (c["cid"], PROJ_ID, c["code"], c["name"]),
            )
            cur.execute(
                'INSERT INTO character_profiles '
                '(id,"characterId","profileCode","ageLabel","targetImages","promptBase",negative,'
                ' "triggerToken","useIpAdapter","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (c["pid"], c["cid"], c["pcode"], c["age"], 0, c["base"], c["neg"], c["trig"], True),
            )
            cur.execute(
                'INSERT INTO project_characters ("projectId","characterId","attachedAt") '
                'VALUES (%s,%s, now())',
                (PROJ_ID, c["cid"]),
            )

        conn.commit()
        print("OK seeded project 'message':")
        print(f"  project    id={PROJ_ID} style=graphic_novel_cell_shaded styleLora={STYLE_LORA}")
        print(f"  scriptText {len(script_text)} chars")
        print(f"  defaults   cloned from gaz (tts={tts})")
        for c in CHARACTERS:
            print(f"  character  {c['code']:7s} profile={c['pcode']:12s} trig={c['trig']}")
    except Exception as e:
        conn.rollback()
        print("ROLLBACK due to error:", repr(e))
        sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
