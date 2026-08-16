# -*- coding: utf-8 -*-
"""Foundation seeder for best_thing (№6, светлая). Voice cloned from coffee («Оксана Федорова»)."""
import io, os, psycopg2

PFX = "7e780000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "best_thing"
NAME = "ТЫ — Сокращённая. И это лучшее, что с тобой случилось."

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "best_thing_scriptText.md")

CHARACTERS = [
    ("LIDA",   "Lida"),
    ("SERGEY", "Sergey"),
    ("KOLYA",  "Kolya"),
    ("TOMA",   "Toma"),
    ("ROZA",   "Roza"),
]
PROFILES = [
    ("LIDA", "LIDA_BASE", "43", "lidabase",
     "a warm east-european woman of forty-three, dark chestnut hair with first grey gathered by an amber claw clip, kind steady eyes, capable hands, a soft moss-green cardigan"),
    ("SERGEY", "SERGEY_BASE", "45", "sergeybase",
     "a stocky east-european man of forty-five, a short practical haircut, a broad honest face, a compass keyring fob on his belt loop, a driver's quilted vest over a henley"),
    ("KOLYA", "KOLYA_BASE", "16", "kolyabase",
     "a thin east-european teenage boy of sixteen, an overgrown fringe, headphones around his neck, a phone with a pop-socket in one hand, an oversized hoodie"),
    ("TOMA", "TOMA_BASE", "44", "tomabase",
     "a lively east-european woman of forty-four, a reddish bob, glasses in a bright two-tone frame, a structured blazer over a printed blouse"),
    ("ROZA", "ROZA_BASE", "60", "rozabase",
     "an upright east-european woman of sixty, a silver braid wound around her head, a sharp appraising gaze, a pincushion bracelet on one wrist, a dark green work smock"),
]
PROPS = [
    ("SHEARS", "the brass garden shears",
     "old garden shears with brass rings and darkened blades, the rings polished bright by three generations of hands"),
    ("CALC", "the big-key calculator",
     "an accountant's calculator with oversized keys and a paper tape roll, one casing corner worn to white"),
    ("APRON", "the linen apron",
     "a natural linen work apron with deep pockets, green plant stains along the hem, extended ties finished in knots"),
    ("LEDGER", "the order ledger",
     "a thick order notebook in an oilcloth cover, ribbon bookmarks, columns of dates and sums in an even accountant hand"),
    ("WRAP", "the kraft wrap roll",
     "a roll of kraft paper on a home-made axle bracket, its torn edge straight as a ruler line"),
    ("SIGN", "the workshop sign",
     "a small wooden sign with a flower burned into it in pyrography, a warm bulb in a cage lamp above"),
]
LOCATIONS = [
    ("office_acc", "Расчётный отдел",
     "an accounting office with paired desks, monitors of spreadsheets, binders in labelled rows, a window ledge of office flowers"),
    ("office_meeting", "Переговорка офиса",
     "a corporate meeting room with a long table, a screen, stacked chairs by the wall, blinds striping the light"),
    ("lida_kitchen", "Кухня Лиды",
     "a family kitchen with a round table, a shelf of cookbooks, children's magnets grown old on the fridge, warm curtains"),
    ("lida_hall", "Прихожая Лиды",
     "a flat hallway with a coat rack for three, a mirror, a shoe bench, a shelf with keys and a compass fob"),
    ("roza_salon", "Салон Розы",
     "an old flower salon with a cold display case, zinc buckets of stems, a work table scarred by knives, ribbon spools"),
    ("courses_flor", "Класс флористики",
     "a floristry classroom with steel work tables, buckets of practice greens, aprons on hooks, a wall of ribbon and wire"),
    ("flower_base", "Ночная цветочная база",
     "a night wholesale flower base with pallet rows of boxed blooms, breath fog, forklifts, harsh strip light"),
    ("market_corner", "Угол на рынке",
     "a corner stall in a covered market with a folding table, zinc buckets, a kraft roll bracket, string lights"),
    ("workshop", "Мастерская",
     "a small flower workshop with a workbench, a glass-door cooler of blooms, kraft rolls on the wall, a warm cage lamp"),
    ("wedding_hall", "Банкетный зал",
     "a banquet hall mid-setup with round tables, stacked chairs, a florist's trolley, tall windows in evening light"),
    ("street_market", "Улица у рынка",
     "a street by the covered market with fruit crates, a shawarma kiosk, pigeons, vans unloading at the kerb"),
    ("family_car", "Фургон Серёжи",
     "the cab and cargo bay of a small delivery van, a thermometer taped to the bay wall, moving blankets, flower boxes"),
    ("courtyard_home", "Двор дома",
     "a residential courtyard with a bench by the entrance, a rowan tree, parked cars, a playground fading in the corner"),
]
SCENES = [
    ("A0",  0,  "Копейка на тридцати четырёх миллионах", "cold_open",  "ledger_white_morning", "morning"),
    ("A1",  1,  "Цветы по средам",                       "origin",     "warm_office_day",      "day"),
    ("A2",  2,  "Аутсорс",                               "signs",      "cold_news_grey",       "day"),
    ("A3",  3,  "Коробка и ножницы",                     "layoff",     "farewell_amber",       "day"),
    ("A4",  4,  "Развилка",                              "fork",       "crossroad_dusk",       "evening"),
    ("A5",  5,  "Курсы",                                 "courses",    "green_class_light",    "day"),
    ("A6",  6,  "Школа Розы",                            "school",     "salon_cool_green",     "day"),
    ("A7",  7,  "Угол на рынке",                         "stall",      "market_string_lights", "day"),
    ("A8",  8,  "Свадьба на девяносто",                  "crisis",     "frost_night_blue",     "night"),
    ("A9",  9,  "Семейный подряд",                       "family",     "warm_team_glow",       "day"),
    ("A10", 10, "Мастерская",                            "workshop",   "workshop_warm",        "day"),
    ("A11", 11, "Заказ из прошлой жизни",                "finale",     "full_circle_light",    "day"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()
    cur.execute("SELECT \"ttsVoiceoverId\",\"ttsVoiceRefPath\" FROM projects WHERE slug='coffee'")
    voice_id, voice_ref = cur.fetchone()
    cur.execute('''INSERT INTO projects (id,slug,name,"scriptText","targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","ttsVoiceoverId",settings,"createdAt","updatedAt")
        SELECT %s,%s,%s,%s,"targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine",%s,"visualStyle","exportTiming",%s,settings,now(),now()
        FROM projects WHERE slug='car_flipper' ''',
                (PROJ, SLUG, NAME, script_text, voice_ref, voice_id))
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='project_characters'")
    pc_cols = {r[0] for r in cur.fetchall()}
    for i, (code, disp) in enumerate(CHARACTERS):
        cid = PFX + "0000000c%04x" % i
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,now())',
                    (cid, PROJ, code, disp))
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
    # No workflow templates/routes: those tables were dropped 2026-08-13 and
    # every ComfyUI graph now lives once in data/_templates/comfy/. A project
    # needs no comfy/ dir of its own — the render resolves the shared master.
    cx.commit(); cur.close(); cx.close()
    print("FOUNDATION OK: %s (%s) voice=%s" % (SLUG, PROJ, voice_id))


if __name__ == "__main__":
    main()
