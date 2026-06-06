# -*- coding: utf-8 -*-
"""
Seed FOUNDATION for project `tiler` (ТЫ — Плиточник. И это вся твоя жизнь.)
Track B confessional (1st person, NO 4th-wall break), graphic_novel_cell_shaded,
style LoRA = Eldritch Comics.

Creates: project row (+scriptText from file, +settings.styleLora), 10 characters
+ their character_profiles + project_characters M:N.

Clones the four NOT-NULL default* prompt fields from gaz (proven cartoon values);
sets ttsEngine='f5' explicitly. Aborts if `tiler` already exists.

Run:  python gen-studio/scripts/seed_tiler_foundation.py
"""
import json, os, sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")

PROJ_ID = "7e560000-0000-4000-8000-000000000001"
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "tiler_scriptText.md")
STYLE_LORA = "style\\EldritchComicsXL1.2.safetensors"

CARTOON = ("cell-shaded graphic novel character with hard black ink outline and flat color blocks")
NEG_BASE = ("photograph, photorealistic, 3D render, plastic skin, hyperrealistic, real human face, "
            "deformed hands, extra fingers, mutated hands")

# cid suffix c1.., pid suffix d1.., code, name, profileCode, ageLabel, trigger, promptBase, extra-neg
CHARACTERS = [
    dict(cid="c1", pid="d1", code="BAKHTI", name="Бахтиёр (Бахти)", pcode="BAKHTI_BASE",
         age="adult 45", trig="bakht1man",
         base=("a 45-year-old Uzbek master tiler and ceramist from Rishtan, lean wiry weathered build, "
               "short black hair greying at the temples, dark almond eyes, deep sun lines, a short greying stubble, "
               "strong calloused craftsman hands as a constant identity anchor, "
               "wearing a faded grey work jacket over a checked shirt and dusty knee pads, "
               "quiet dignified posture, " + CARTOON),
         neg="young man, blonde hair, woman, clean soft hands"),
    dict(cid="c2", pid="d2", code="OTETS", name="Отец-устоз", pcode="OTETS_BASE",
         age="elderly 70", trig="ustozman",
         base=("a 70-year-old Uzbek master ceramist, white trimmed beard, deeply lined kind face, "
               "a tan embroidered Uzbek skullcap (doppi) as a constant identity anchor, "
               "wearing a long quilted chapan robe over a clay-stained apron, "
               "holding a turquoise-glazed bowl, warm gentle posture, " + CARTOON),
         neg="young man, woman, western clothes"),
    dict(cid="c3", pid="d3", code="NIGORA", name="Нигора (жена)", pcode="NIGORA_BASE",
         age="adult 40", trig="nig0rawoman",
         base=("a 40-year-old Uzbek woman from Rishtan, warm round face, dark hair in a long single braid "
               "under a bright floral headscarf as a constant identity anchor, soft dark eyes, "
               "wearing a colourful traditional atlas-pattern dress, modest patient posture, " + CARTOON),
         neg="man, blonde hair, heavy makeup, glamour, western dress"),
    dict(cid="c4", pid="d4", code="AZIZ", name="Азиз (сын)", pcode="AZIZ_BASE",
         age="teen 17", trig="az1zboy",
         base=("a 17-year-old Uzbek boy, Bakhti's son, short dark hair, bright dark eyes, slim, "
               "wearing a simple modern hoodie, hopeful earnest expression, "
               "(younger child versions described per-shot) " + CARTOON),
         neg="adult man, beard, woman, facial scar"),
    dict(cid="c5", pid="d5", code="GENA", name="Гена (охранник)", pcode="GENA_BASE",
         age="adult 40", trig="gen4guard",
         base=("a 40-year-old heavy-set Russian private security guard, shaved buzz-cut head, thick neck, "
               "hard contemptuous square face, "
               "wearing a black tactical security uniform with a radio earpiece as a constant identity anchor, "
               "intimidating planted stance, " + CARTOON),
         neg="woman, smiling warmly, uzbek man, beard"),
    dict(cid="c6", pid="d6", code="KURATOR", name="Куратор СБ", pcode="KURATOR_BASE",
         age="adult 45", trig="kur4torman",
         base=("a 45-year-old cold Russian security curator, neat slicked-back greying hair, "
               "narrow expressionless face, wearing a sharp dark suit, dark sunglasses and a coiled earpiece "
               "as a constant identity anchor, faceless-bureaucrat menace, " + CARTOON),
         neg="woman, casual clothes, warm smile, uzbek man"),
    dict(cid="c7", pid="d7", code="RUSTAM", name="Рустам (посредник)", pcode="RUSTAM_BASE",
         age="adult 50", trig="rust4mman",
         base=("a 50-year-old stout Central Asian labour broker and brigadier, thick black moustache, "
               "balding, a worn brown leather jacket and a small belt bag (barsetka) as a constant identity anchor, "
               "a phone perpetually at his ear, sly weary expression, " + CARTOON),
         neg="woman, young man, suit, clean-shaven"),
    dict(cid="c8", pid="d8", code="ZAKAZCHIK", name="Заказчик (с Рублёвки)", pcode="ZAKAZCHIK_BASE",
         age="adult 55", trig="zak4zchikman",
         base=("a 55-year-old wealthy Russian client, silver swept-back hair, soft pampered clean-shaven face, "
               "expensive tailored charcoal suit, a gold luxury wristwatch as a constant identity anchor, "
               "cold entitled contemptuous expression, " + CARTOON),
         neg="woman, poor clothes, uzbek man, beard, NOT a head of state, generic businessman"),
    dict(cid="c9", pid="d9", code="SHUKHRAT", name="Шухрат (земляк)", pcode="SHUKHRAT_BASE",
         age="adult 35", trig="shukhr4tman",
         base=("a 35-year-old cheerful Uzbek labourer, wiry, gap-toothed grin, short messy black hair, "
               "wearing paint-and-plaster-stained work clothes and a knitted cap as a constant identity anchor, "
               "lively warm expression, " + CARTOON),
         neg="woman, old man, suit, beard"),
    dict(cid="ca", pid="da", code="DILSHOD", name="Дилшод (молодой земляк)", pcode="DILSHOD_BASE",
         age="young 19", trig="d1lshodboy",
         base=("a 19-year-old thin Uzbek young man on his first labour trip, big frightened dark eyes, "
               "soft unsure face, wearing an oversized hand-me-down jacket and cheap new white sneakers "
               "he saved up for as a constant identity anchor, timid hunched posture, " + CARTOON),
         neg="woman, older man, beard, confident pose"),
]

def main():
    with open(SCRIPT_PATH, encoding="utf-8") as f:
        script_text = f.read()

    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM projects WHERE slug=%s", ("tiler",))
        if cur.fetchone():
            print("ABORT: project 'tiler' already exists — nothing seeded."); return

        cur.execute('SELECT "defaultNegative","defaultVideoNegative","defaultMotionPrompt",'
                    '"defaultStaticMotionPrompt" FROM projects WHERE slug=%s', ("gaz",))
        row = cur.fetchone()
        if not row:
            print("ABORT: gaz project not found — cannot clone defaults."); return
        d_neg, d_vneg, d_motion, d_static = row

        settings = json.dumps({"styleLora": {"name": STYLE_LORA}})
        cur.execute(
            'INSERT INTO projects '
            '(id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier", '
            ' "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt", '
            ' "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","createdAt","updatedAt") '
            'VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s, now(), now())',
            (PROJ_ID, "tiler", "ТЫ — Плиточник. И это вся твоя жизнь.", settings, script_text,
             "youtube", "advertiser_safe",
             d_neg, d_vneg, d_motion, d_static,
             "f5", None, "graphic_novel_cell_shaded", "narration"),
        )

        for c in CHARACTERS:
            cid = f"7e560000-0000-4000-8000-0000000000{c['cid']}"
            pid = f"7e560000-0000-4000-8000-0000000000{c['pid']}"
            neg = NEG_BASE + ", " + c["neg"]
            cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") '
                        'VALUES (%s,%s,%s,%s, now())', (cid, PROJ_ID, c["code"], c["name"]))
            cur.execute('INSERT INTO character_profiles '
                        '(id,"characterId","profileCode","ageLabel","targetImages","promptBase",negative,'
                        ' "triggerToken","useIpAdapter","createdAt") '
                        'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                        (pid, cid, c["pcode"], c["age"], 0, c["base"], neg, c["trig"], True))
            cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") '
                        'VALUES (%s,%s, now())', (PROJ_ID, cid))

        conn.commit()
        print("OK seeded project 'tiler':")
        print(f"  project id={PROJ_ID} style=graphic_novel_cell_shaded styleLora=Eldritch tts=f5 export=narration")
        print(f"  scriptText {len(script_text)} chars; defaults cloned from gaz")
        for c in CHARACTERS:
            print(f"  character {c['code']:10s} profile={c['pcode']:14s} trig={c['trig']}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK due to error:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
