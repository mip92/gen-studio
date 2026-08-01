# -*- coding: utf-8 -*-
"""Foundation seeder for optimizer. Cameo cross-over: reuses layoff's ELYA
(protagonist) and GEROY (one scene) via project_characters M:N — same faces,
same anchors, no duplicates. Voice = «Вальяжная жозефина» (cloned from beauty)."""
import io, os, psycopg2

PFX = "7e740000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "optimizer"
NAME = "ТЫ — Оптимизатор. И это вся твоя жизнь."

LAYOFF_ELYA = "7e610000-0000-4000-8000-0000000000c02"
LAYOFF_GEROY = "7e610000-0000-4000-8000-0000000000c01"

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "optimizer_scriptText.md")

CHARACTERS = [
    ("KIRILL", "Kirill"),
    ("GALINA", "Galina"),
    ("RITA",   "Rita"),
]
PROFILES = [
    ("KIRILL", "KIRILL_BASE", "48", "kirillbase",
     "a lean silver-haired man of about fifty, steel-grey hair combed straight back, pale appraising eyes behind thin silver-rimmed glasses, a charcoal suit over a fine rollneck, a steel coffee thermo-mug in one hand"),
    ("GALINA", "GALINA_BASE", "58", "galinabase",
     "a sturdy east-european woman of fifty-eight, grey hair in a low bun, a lined kind stern face, a knitted burgundy cardigan, a small enamel veteran badge on her coat lapel"),
    ("RITA", "RITA_BASE", "25", "ritabase",
     "a neat east-european young woman of twenty-five, a dark high ponytail, quick attentive eyes, an oversized checked blazer, bright turquoise manicured nails"),
]
PROPS = [
    ("CARD", "the laminated script card",
     "a white laminated card with a short handwritten list of phrases, rounded corners, a pale coffee ring across one corner"),
    ("TABLET", "the slim tablet",
     "a slim dark tablet in a grey felt sleeve, its screen showing neat table rows, a stylus clipped to the sleeve edge"),
    ("BOXES", "the flat-pack boxes",
     "a strapped bundle of flat unassembled cardboard boxes leaning against a wall, a wholesale label on the top sheet"),
    ("TISSUES", "the tissue box",
     "a plain white cube tissue box with one tissue raised like a sail, its cardboard edges soft with use"),
    ("ORDER", "the dismissal order",
     "a single printed order sheet in a clear plastic file, dense official paragraphs, an empty signature line at the bottom"),
    ("ORCHID", "the white orchid",
     "a potted white orchid with two blooms on a plastic support stick, a glass of water beside the pot"),
]
LOCATIONS = [
    ("consult_office", "Этаж консалтинга",
     "an open glass consultancy floor with long white desks, glass partitions, a wall of framed client logos, a city view in haze"),
    ("elya_cabinet", "Кабинет Эли",
     "a small glass corner office with a tidy white desk, a white orchid on the sill, flat cardboard boxes stacked against one wall"),
    ("client_meeting", "Переговорка клиента",
     "an anonymous client meeting room with an oval table, a water bottle tray, a tissue box, blinds half closed on an office floor"),
    ("client_open", "Опенспейс клиента",
     "a client open-plan office with rows of ordinary desks, personal mugs and photos, a printer corner, strip lighting"),
    ("bank_atrium", "Атриум банка",
     "a glass bank tower atrium with escalators, a turnstile line, a huge abstract mural, polished stone floor"),
    ("bank_open", "Этаж банка",
     "a vast bank office floor with hundreds of identical desks under white light, monitors in even rows, a glass wall of meeting rooms"),
    ("mother_flat", "Кухня матери",
     "an old flat kitchen with a dresser of crystal glasses, a worn oilcloth table, lace curtains, a radio on the fridge"),
    ("mother_plant", "Проходная завода",
     "an old instrument-plant checkpoint with a steel turnstile, a veteran photo board, a glass guard booth, a hanging wall clock"),
    ("parking", "Парковка бизнес-центра",
     "an outdoor business-centre car park at the tower base, ranks of cars, a ticket barrier, thin trees in concrete planters"),
    ("elya_flat", "Квартира Эли",
     "a minimal modern flat with one armchair by a big window, an empty white kitchen island, a city of lights beyond the glass"),
    ("training_hall", "Зал тренингов",
     "a hotel conference hall with rows of chairs, a flipchart, a projection screen, carafes of water on a side table"),
    ("dk_hall", "Зал ДК",
     "an old house-of-culture hall with stucco mouldings, worn red seats, a small stage with a plain table, tall windows"),
    ("lift_lobby", "Лифтовый холл",
     "a business-tower lift lobby with brushed steel doors, a floor indicator strip, one bench, grey stone walls"),
]
SCENES = [
    ("A0",  0,  "Мужчина, который не встаёт",        "cold_open",  "cold_glass_morning",  "morning"),
    ("A1",  1,  "Карточка в ламинате",               "origin",     "warm_recruiter_years", "day"),
    ("A2",  2,  "Козырь консалтинга",                "rise",       "steel_corporate",      "day"),
    ("A3",  3,  "Конвейер",                          "conveyor",   "grey_conveyor",        "day"),
    ("A4",  4,  "Как вы спите?",                     "crack",      "evening_parking",      "evening"),
    ("A5",  5,  "Коробка матери",                    "mother",     "old_flat_warm",        "day"),
    ("A6",  6,  "Проект на тысячу двести",           "peak",       "bank_white",           "day"),
    ("A7",  7,  "Цифровое расставание",              "automation", "screen_blue",          "day"),
    ("A8",  8,  "Мы — ядро",                         "no_return",  "late_office_amber",    "evening"),
    ("A9",  9,  "Пятница, пятнадцать ноль-ноль",     "reversal",   "hard_meeting_white",   "day"),
    ("A10", 10, "Борщ",                              "aftermath",  "night_kitchen_warm",   "night"),
    ("A11", 11, "По ту сторону стола",               "finale",     "pale_dk_daylight",     "day"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()

    cur.execute("SELECT \"ttsVoiceoverId\",\"ttsVoiceRefPath\" FROM projects WHERE slug='beauty'")
    voice_id, voice_ref = cur.fetchone()

    cur.execute('''INSERT INTO projects (id,slug,name,"scriptText","targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","ttsVoiceoverId",settings,"createdAt","updatedAt")
        SELECT %s,%s,%s,%s,"targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine",%s,"visualStyle","exportTiming",%s,settings,now(),now()
        FROM projects WHERE slug='car_flipper' ''',
                (PROJ, SLUG, NAME, script_text, voice_ref, voice_id))
    print("project row cloned from car_flipper, voice=%s" % voice_id)

    # --- cameo: attach layoff's ELYA + GEROY, fix displayNames to latin ------
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='project_characters'")
    pc_cols = {r[0] for r in cur.fetchall()}
    cameo = [(LAYOFF_ELYA, "Elya"), (LAYOFF_GEROY, "the logistics manager")]
    for j, (cid, disp) in enumerate(cameo):
        if "id" in pc_cols:
            cur.execute('INSERT INTO project_characters (id,"projectId","characterId") VALUES (%s,%s,%s)',
                        (PFX + "0000000d00f%01x" % j, PROJ, cid))
        else:
            cur.execute('INSERT INTO project_characters ("projectId","characterId") VALUES (%s,%s)', (PROJ, cid))
        cur.execute('UPDATE characters SET "displayName"=%s WHERE id=%s', (disp, cid))
        print("cameo attached: %s -> displayName %r (rows=%d)" % (cid[-4:], disp, cur.rowcount))

    for i, (code, disp) in enumerate(CHARACTERS):
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,now())',
                    (PFX + "0000000c%04x" % i, PROJ, code, disp))
        if "id" in pc_cols:
            cur.execute('INSERT INTO project_characters (id,"projectId","characterId") VALUES (%s,%s,%s)',
                        (PFX + "0000000d%04x" % i, PROJ, PFX + "0000000c%04x" % i))
        else:
            cur.execute('INSERT INTO project_characters ("projectId","characterId") VALUES (%s,%s)',
                        (PROJ, PFX + "0000000c%04x" % i))
    char_id = {code: PFX + "0000000c%04x" % i for i, (code, _) in enumerate(CHARACTERS)}
    for i, (ccode, pcode, age, trig, base) in enumerate(PROFILES):
        cur.execute('''INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages",
                "promptBase",negative,"triggerToken","useIpAdapter","createdAt")
            VALUES (%s,%s,%s,%s,0,%s,'',%s,false,now())''',
                    (PFX + "0000000f%04x" % i, char_id[ccode], pcode, age, base, trig))
    print("characters new=%d profiles=%d + 2 cameo" % (len(CHARACTERS), len(PROFILES)))

    for i, (code, name, desc) in enumerate(PROPS):
        cur.execute('INSERT INTO props (id,"projectId",code,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                    (PFX + "0000000b%04x" % i, PROJ, code, name, desc))
    for i, (slug, name, desc) in enumerate(LOCATIONS):
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                    (PFX + "00000001%04x" % i, PROJ, slug, name, desc))
    for key, order, title, beat, pal, tod in SCENES:
        cur.execute('''INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","actBeat","defaultPaletteKey","defaultTimeOfDay","createdAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,now())''',
                    (PFX + "0000000a%04x" % order, PROJ, key, title, order, beat, pal, tod))
    print("props=%d locations=%d scenes=%d" % (len(PROPS), len(LOCATIONS), len(SCENES)))

    cur.execute('''INSERT INTO workflow_templates (id,"projectId","templateKey","filePath",description,"visualStyle","createdAt")
        VALUES (%s,%s,'char_realcomic_qwen',%s,'Qwen 2511 realcomic scene (characters)','realcomic_qwen',now()),
               (%s,%s,'environment_realcomic_qwen',%s,'Qwen 2511 realcomic scene (environment)','realcomic_qwen',now())''',
                (PFX + "0000000e0001", PROJ, SLUG + "/comfy/scene_realcomic_qwen_api.json",
                 PFX + "0000000e0002", PROJ, SLUG + "/comfy/scene_realcomic_qwen_api.json"))
    cur.execute('''INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt")
        VALUES (%s,%s,%s,now()),(%s,%s,%s,now())''',
                (PFX + "0000000e0011", PROJ, SLUG + "_character_ip",
                 PFX + "0000000e0012", PROJ, SLUG + "_environment"))
    print("workflow templates+routes seeded")

    cx.commit(); cur.close(); cx.close()
    print("FOUNDATION OK: %s (%s)" % (SLUG, PROJ))


if __name__ == "__main__":
    main()
