# -*- coding: utf-8 -*-
"""Foundation seeder for squeeze_out (№3 of the layoff series)."""
import io, os, psycopg2

PFX = "7e750000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "squeeze_out"
NAME = "ТЫ — Тот, кого выживают. И это вся твоя жизнь."
VOICE = "802b3d77-eedc-4d66-b93e-cba2d37d361f"          # агента Смита (= station)
VOICE_REF = "data/_voices/voice-3/voice_reference.wav"

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "squeeze_out_scriptText.md")

CHARACTERS = [
    ("ANTON",  "Anton"),
    ("MARINA", "Marina"),
    ("TIMA",   "Tima"),
    ("ZHANNA", "Zhanna"),
    ("PASHA",  "Pasha"),
]
PROFILES = [
    ("ANTON", "ANTON_BASE", "38", "antonbase",
     "a wiry east-european man of thirty-eight, short dark blond hair, thoughtful eyes behind heavy horn-rimmed glasses, a navy knitted vest over a checked shirt, a mechanical pencil in the vest pocket"),
    ("MARINA", "MARINA_BASE", "36", "marinabase",
     "a slender east-european woman of thirty-six, a dark pixie cut, a soft tired face, small gold hoop earrings, a plain teal jumper"),
    ("TIMA", "TIMA_BASE", "7", "timabase",
     "a small east-european boy of seven, fair tousled hair, a gap-toothed grin, a small green rubber dinosaur clutched in one fist, a striped long-sleeve shirt"),
    ("ZHANNA", "ZHANNA_BASE", "41", "zhannabase",
     "a sharp-featured east-european woman of forty-one, dark hair in a severe bun, high cheekbones, a dark burgundy suit, a red lacquered pen held like an instrument"),
    ("PASHA", "PASHA_BASE", "42", "pashabase",
     "a sturdy east-european man of forty-two, curly half-grey hair, merry creased eyes, a plaid flannel shirt, a scuffed grey bicycle helmet under one arm"),
]
PROPS = [
    ("CHAIR", "the office chair",
     "an old ergonomic office chair with a seat moulded by years of one back, armrests polished by elbows, a ring of insulating tape on the gas lift"),
    ("MUG", "the engineer mug",
     "a white mug with a faded blue logo and the figures of a past award year, a chip on the handle"),
    ("NOTEBOOK", "the grievance notebook",
     "a squared notebook with dated entries in small dense handwriting, sticky-note bookmarks fanned along its edge"),
    ("DINO", "the toy dinosaur",
     "a small green rubber dinosaur with the paint worn off its crest, standing on splayed legs"),
    ("BLUEPRINT", "the interchange drawing",
     "a large printed sheet of a road interchange with a raised overpass, a project stamp block in the lower corner"),
    ("HELMET", "the bicycle helmet",
     "a scuffed grey bicycle helmet covered in faded stickers, its strap looped through an elastic band"),
]
LOCATIONS = [
    ("bureau_open", "Зал проектного бюро",
     "an engineering bureau hall with rows of wide monitors and drawing tables, tube racks of rolled plans, tall windows"),
    ("bureau_basement", "Подвал сопровождения",
     "a basement office with a low ceiling, pipes overhead, two desks under a barred ground-level window, an old radiator"),
    ("director_office", "Кабинет руководителя",
     "a renovated director office with a glass desk, a wall organiser of coloured folders, a city map with pinned flags"),
    ("server_corner", "Угол у серверной",
     "a desk wedged beside a humming server-room door, cable trays overhead, a fire extinguisher on the wall"),
    ("site_bridge", "Стройплощадка развязки",
     "a road-interchange construction site with a concrete pylon, rebar cages, a crane over the unfinished span, mud tracks"),
    ("home_kitchen", "Кухня дома",
     "a family kitchen with children's drawings magneted to the fridge, a small table by the window, a pot rack"),
    ("home_hall", "Прихожая дома",
     "a flat hallway with a coat rack, a child's scooter against the wall, a mirror with photos tucked into its frame"),
    ("child_room", "Комната сына",
     "a boy's room with a dinosaur poster, a low bed, building blocks on a rug, a desk lamp shaped like a rocket"),
    ("pasha_office", "Бюро Паши",
     "a small open studio office with nine mismatched desks, a bicycle hung on the wall, plans pinned over exposed brick"),
    ("courtyard_bins", "Двор с баками",
     "a back courtyard of an office building with waste containers by a brick wall, puddles, a loading door"),
    ("meeting_bureau", "Переговорка бюро",
     "a bureau meeting room with a long table, a projector screen, framed photos of built bridges on the wall"),
    ("archive_room", "Архив с кальками",
     "a plan archive with steel shelving of tube rolls and flat drawers, a single work lamp over a wide layout table"),
    ("street_bureau", "Улица у бюро",
     "a street by the bureau entrance with a bus lane, an old poplar, a signboard column, granite steps"),
]
SCENES = [
    ("A0",  0,  "Ночь, отметка, семь утра",   "cold_open",  "night_site_blue",    "night"),
    ("A1",  1,  "Кресло под спину",           "origin",     "warm_bureau_day",    "day"),
    ("A2",  2,  "Слияние",                    "signs",      "renovated_white",    "day"),
    ("A3",  3,  "Мы никого не увольняем",     "squeeze1",   "grey_squeeze",       "day"),
    ("A4",  4,  "Блокнот",                    "document",   "cold_evening_desk",  "evening"),
    ("A5",  5,  "Паша уходит сам",            "ally_exit",  "spring_light",       "day"),
    ("A6",  6,  "Подвал",                     "basement",   "basement_dim",       "day"),
    ("A7",  7,  "Чужая фамилия",              "humiliation","hard_autumn",        "day"),
    ("A8",  8,  "Партнёрство",                "no_return",  "late_lamp_amber",    "evening"),
    ("A9",  9,  "Победа",                     "victory",    "flat_winter_white",  "day"),
    ("A10", 10, "Заявление",                  "exit",       "thaw_morning",       "morning"),
    ("A11", 11, "Не партнёром",               "finale",     "clear_january",      "day"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()
    cur.execute('''INSERT INTO projects (id,slug,name,"scriptText","targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming","ttsVoiceoverId",settings,"createdAt","updatedAt")
        SELECT %s,%s,%s,%s,"targetPlatform","safetyTier",
            "defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt",
            "ttsEngine",%s,"visualStyle","exportTiming",%s,settings,now(),now()
        FROM projects WHERE slug='car_flipper' ''',
                (PROJ, SLUG, NAME, script_text, VOICE_REF, VOICE))
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
    cur.execute('''INSERT INTO workflow_templates (id,"projectId","templateKey","filePath",description,"visualStyle","createdAt")
        VALUES (%s,%s,'char_realcomic_qwen',%s,'Qwen 2511 realcomic scene (characters)','realcomic_qwen',now()),
               (%s,%s,'environment_realcomic_qwen',%s,'Qwen 2511 realcomic scene (environment)','realcomic_qwen',now())''',
                (PFX + "0000000e0001", PROJ, SLUG + "/comfy/scene_realcomic_qwen_api.json",
                 PFX + "0000000e0002", PROJ, SLUG + "/comfy/scene_realcomic_qwen_api.json"))
    cur.execute('''INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt")
        VALUES (%s,%s,%s,now()),(%s,%s,%s,now())''',
                (PFX + "0000000e0011", PROJ, SLUG + "_character_ip",
                 PFX + "0000000e0012", PROJ, SLUG + "_environment"))
    cx.commit(); cur.close(); cx.close()
    print("FOUNDATION OK: %s (%s) chars=%d profiles=%d props=%d locs=%d scenes=%d" %
          (SLUG, PROJ, len(CHARACTERS), len(PROFILES), len(PROPS), len(LOCATIONS), len(SCENES)))


if __name__ == "__main__":
    main()
