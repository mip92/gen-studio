# -*- coding: utf-8 -*-
"""Foundation seeder for hidden_layoff. Idempotent: aborts if project exists.

Project row is cloned from car_flipper (user: «делай как в автоперекупе») —
same settings (flux_comic anchors, styleLora 0.5, qwenReferenceLatents true,
sceneSteps 8), same default negatives. Voice = «Нутриолог Приятный» (the voice
of the hit `layoff` film — series continuity).
"""
import io, os, psycopg2

PFX = "7e730000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "hidden_layoff"
NAME = "ТЫ — Уволенный, который ходит на работу. И это вся твоя жизнь."
VOICE = "74174193-1857-439b-a5ff-79065318ce7c"          # Нутриолог Приятный (= layoff)
VOICE_REF = "data/_voices/engineer/voice_reference.mp3"  # = layoff

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "hidden_layoff_scriptText.md")

CHARACTERS = [
    # (code, displayName)
    ("MARK",   "Mark"),
    ("LENA",   "Lena"),
    ("DASHA",  "Dasha"),
    ("VADIM",  "Vadim"),
    ("SEMYON", "Semyon"),
    ("NINA",   "Nina"),
]

PROFILES = [
    # (charCode, profileCode, ageLabel, trigger, promptBase)
    ("MARK", "MARK_YOUNG", "25", "markyng",
     "a lean east-european man of twenty-five, thick dark chestnut hair, bright brown eyes, a narrow dark green striped tie, a boxy cheap grey suit one size too big, a stiff new brown leather briefcase"),
    ("MARK", "MARK_MAIN", "44", "markmain",
     "a solid east-european man of forty-four, dark chestnut hair greying at the temples, tired brown eyes, a narrow dark green striped tie, a well-cut grey suit, a worn brown leather briefcase"),
    ("LENA", "LENA_BASE", "42", "lenabase",
     "a soft-featured east-european woman of forty-two, an ash-blonde bob, calm grey eyes, small pearl stud earrings, a cream knitted cardigan over a plain blouse"),
    ("DASHA", "DASHA_BASE", "15", "dashabase",
     "a slight east-european girl of fifteen, a long auburn braid over one shoulder, lively hazel eyes, a woven fabric bracelet on her wrist, a dark school blazer over a hoodie"),
    ("VADIM", "VADIM_BASE", "33", "vadimbase",
     "a trim east-european man of thirty-three, chestnut hair in a neat side parting, cool grey eyes, a bulky black smartwatch, a slim dark navy suit with an open shirt collar"),
    ("SEMYON", "SEMYON_BASE", "51", "semyonbase",
     "a heavy east-european man of fifty-one, a short grey beard, deep-set pale eyes, a tweed flat cap, a brown corduroy jacket, a small tin box of magnetic pocket chess in one hand"),
    ("NINA", "NINA_BASE", "27", "ninabase",
     "a small east-european woman of twenty-seven, copper curly hair, quick dark eyes behind round thin-rimmed glasses, a black office phone headset around her neck, a mustard cardigan"),
]

PROPS = [
    ("BRIEFCASE", "the brown briefcase",
     "a dark brown leather briefcase with two brass snap locks, scuffed corners worn pale, a soft creased handle, its flap edge polished by years of the same hand"),
    ("SUIT", "the grey suit",
     "a grey wool suit on wooden hangers, freshly pressed, a narrow dark green striped tie draped over the crossbar"),
    ("LUNCHBOX", "the lunch box",
     "a rectangular plastic food container with a lilac lid, a fork strapped to its side with an elastic band, faint scratches of daily use"),
    ("RECORD", "the work record book",
     "a grey-green work record booklet with soft creased corners, a folded agreement sheet tucked between its pages"),
    ("CHESS", "the pocket chess set",
     "a pocket magnetic chess set in a small tin box with chipped paint, tiny flat chessmen on a folding board"),
    ("ENVELOPE", "the money envelope",
     "a white postal envelope thick with banknotes, a pencil column of shrinking numbers written on its face"),
]

LOCATIONS = [
    ("office_openspace", "Опенспейс отдела снабжения",
     "a supply-department open-plan office above a furniture factory, rows of grey desks with monitors, a whiteboard of delivery schedules, tall windows onto the yard"),
    ("meeting_room", "Стеклянная переговорка",
     "a small glass-walled meeting room with a white oval table, ergonomic chairs, a wall screen, open-plan desks blurred beyond the glass"),
    ("office_lobby", "Лобби с турникетами",
     "a factory administration lobby with three steel turnstiles, a reception desk, a wall of framed staff photos, grey stone floor"),
    ("factory_yard", "Двор фабрики с рампой",
     "a furniture-factory yard with a loading ramp, stacked flat-pack panels under film, a parked box truck, puddled asphalt"),
    ("flat_kitchen", "Кухня квартиры",
     "a small flat kitchen with a round table under a fabric-shaded lamp, a drying rack over the sink, magnets on the fridge door"),
    ("flat_hall", "Прихожая с зеркалом",
     "a narrow flat hallway with a tall mirror, a coat rack, a shoe bench, a shelf of keys under the mirror"),
    ("flat_bedroom", "Спальня",
     "a small bedroom with a double bed, a wardrobe with a slightly open door, a bedside lamp, curtains half drawn"),
    ("park_pond", "Парк у пруда",
     "a city park around a still pond, painted benches along a gravel path, old linden trees, a cast-iron litter bin"),
    ("library_hall", "Читальный зал библиотеки",
     "a public library reading hall with long oak tables, green-shaded lamps, tall shelves, a radiator under a high window"),
    ("canteen", "Столовая",
     "a cheap self-service canteen with a tray rail along the counter, plastic tables, a menu board of paper price tags"),
    ("bus_stop", "Остановка на проспекте",
     "a glass-and-steel bus shelter on a wide avenue, a route board, morning traffic beyond, a litter bin chained to the post"),
    ("warehouse", "Склад стройбазы",
     "a builders-supply warehouse with high pallet racks, a yard gate of profiled steel, forklifts between stacks of cement bags"),
    ("atm_vestibule", "Банкоматный тамбур",
     "a small bank vestibule with two ATMs in a glass alcove, harsh ceiling light, a leaflet rack, the night street beyond the glass"),
    ("hr_office", "Переговорная кадрового агентства",
     "a bright coworking meeting room with a lime-green sofa, a low glass table, a water cooler, a floor-to-ceiling window with city haze"),
    ("garage_row", "Гаражи отца",
     "a row of concrete garage boxes behind a housing estate, mismatched steel up-and-over doors, burdock along the wall, cracked asphalt"),
]

SCENES = [
    # (key, sortOrder, title, actBeat, paletteKey, timeOfDay)
    ("A0",  0,  "Две тысячи петель и двадцать минут", "cold_open",  "cold_office_morning", "morning"),
    ("A1",  1,  "Портфель от отца",                   "origin",     "warm_2007",           "day"),
    ("A2",  2,  "Оптимизация контура",                "signs",      "flat_office_white",   "day"),
    ("A3",  3,  "Три оклада и молчание",              "firing",     "cold_meeting_grey",   "day"),
    ("A4",  4,  "Маршрут без работы",                 "ritual",     "pale_april",          "morning"),
    ("A5",  5,  "Слишком дорогой",                    "rejections", "washed_summer",       "day"),
    ("A6",  6,  "Сосед по лавке",                     "mirror",     "july_shade",          "day"),
    ("A7",  7,  "Зарплата из банкомата",              "money",      "amber_august",        "evening"),
    ("A8",  8,  "Оранжевые жилеты",                   "no_return",  "grey_september",      "day"),
    ("A9",  9,  "Телефон на кухонном столе",          "exposure",   "october_low_sun",     "day"),
    ("A10", 10, "Семь месяцев",                       "aftermath",  "dim_kitchen_night",   "night"),
    ("A11", 11, "Клац-клац",                          "finale",     "pale_november",       "day"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()

    # --- project row cloned from car_flipper --------------------------------
    cur.execute('''INSERT INTO projects (id,slug,name,"scriptText","targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","ttsVoiceoverId",settings,"createdAt","updatedAt")
        SELECT %s,%s,%s,%s,"targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine",%s,"visualStyle","exportTiming",%s,settings,now(),now()
        FROM projects WHERE slug='car_flipper' ''',
                (PROJ, SLUG, NAME, script_text, VOICE_REF, VOICE))
    print("project row cloned from car_flipper")

    # --- characters + profiles + M:N ----------------------------------------
    for i, (code, disp) in enumerate(CHARACTERS):
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,now())',
                    (PFX + "0000000c%04x" % i, PROJ, code, disp))
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='project_characters'")
    pc_cols = {r[0] for r in cur.fetchall()}
    for i, (code, _) in enumerate(CHARACTERS):
        cid = PFX + "0000000c%04x" % i
        if "id" in pc_cols:
            cur.execute('INSERT INTO project_characters (id,"projectId","characterId") VALUES (%s,%s,%s)',
                        (PFX + "0000000d%04x" % i, PROJ, cid))
        else:
            cur.execute('INSERT INTO project_characters ("projectId","characterId") VALUES (%s,%s)', (PROJ, cid))
    char_id = {code: PFX + "0000000c%04x" % i for i, (code, _) in enumerate(CHARACTERS)}
    for i, (ccode, pcode, age, trig, base) in enumerate(PROFILES):
        cur.execute('''INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages",
                "promptBase",negative,"triggerToken","useIpAdapter","createdAt")
            VALUES (%s,%s,%s,%s,0,%s,'',%s,false,now())''',
                    (PFX + "0000000f%04x" % i, char_id[ccode], pcode, age, base, trig))
    print("characters=%d profiles=%d (+M:N)" % (len(CHARACTERS), len(PROFILES)))

    # --- props ----------------------------------------------------------------
    for i, (code, name, desc) in enumerate(PROPS):
        cur.execute('INSERT INTO props (id,"projectId",code,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                    (PFX + "0000000b%04x" % i, PROJ, code, name, desc))
    print("props=%d" % len(PROPS))

    # --- locations --------------------------------------------------------------
    for i, (slug, name, desc) in enumerate(LOCATIONS):
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
                    (PFX + "00000001%04x" % i, PROJ, slug, name, desc))
    print("locations=%d" % len(LOCATIONS))

    # --- scenes -------------------------------------------------------------------
    for key, order, title, beat, pal, tod in SCENES:
        cur.execute('''INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","actBeat","defaultPaletteKey","defaultTimeOfDay","createdAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,now())''',
                    (PFX + "0000000a%04x" % order, PROJ, key, title, order, beat, pal, tod))
    print("scenes=%d" % len(SCENES))

    # --- workflow templates + routes ------------------------------------------------
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
