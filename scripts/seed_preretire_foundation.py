# -*- coding: utf-8 -*-
"""Foundation seeder for preretire (№4 of the layoff series)."""
import io, os, psycopg2

PFX = "7e760000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "preretire"
NAME = "ТЫ — Предпенсионник. И это вся твоя жизнь."
VOICE = "b92898fe-0884-4fb0-9752-4456909635c6"          # Кубик в Кубе
VOICE_REF = "data/_voices/voice-5/voice_reference.wav"

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "preretire_scriptText.md")

CHARACTERS = [
    ("STEPAN",    "Stepan"),
    ("DENIS",     "Denis"),
    ("MIKHALYCH", "Mikhalych"),
    ("GLEB",      "Gleb"),
    ("ALYONA",    "Alyona"),
]
PROFILES = [
    ("STEPAN", "STEPAN_BASE", "58", "stepanbase",
     "a broad-shouldered east-european man of fifty-eight, a grey crew cut, a clean-shaven weathered face, large capable work-worn hands, a dark navy work jacket, an old quartz watch on a steel bracelet"),
    ("DENIS", "DENIS_BASE", "24", "denisbase",
     "a lanky east-european young man of twenty-four, dark curly hair under a blue cap worn backwards, an eager open face, a trainee badge on a lanyard, a grey work jacket"),
    ("MIKHALYCH", "MIKHALYCH_BASE", "61", "mikhalychbase",
     "a bald east-european man of sixty-one, half-moon reading glasses, a round good-natured face, a bunch of keys on a carabiner at his belt, a quilted waistcoat over a flannel shirt"),
    ("GLEB", "GLEB_BASE", "36", "glebbase",
     "a trim east-european man of thirty-six, a short ginger beard, quick light eyes, a wireless earpiece in one ear, a hoodie under an unstructured blazer"),
    ("ALYONA", "ALYONA_BASE", "33", "alyonabase",
     "a fair east-european woman of thirty-three, blonde hair in a low ponytail, a warm firm face, a chunky hand-knitted scarf, a practical down jacket"),
]
PROPS = [
    ("GAUGE", "the feeler gauge set",
     "a fan of thin steel feeler blades on a rivet, thickness figures stamped on each blade, the handle polished by decades of fingers"),
    ("TOOLBOX", "the steel tool box",
     "a steel cantilever tool box with dented corners, trays unfolding on hinges, tools laid out to fit their own shadows"),
    ("WATCH", "the quartz watch",
     "an old quartz watch on a stretched steel bracelet, the glass finely scratched, the dial plain and legible"),
    ("RESUME", "the thin CV folder",
     "a clear plastic folder holding a single printed CV sheet, one long employment line and a short skills column"),
    ("SMARTPHONE", "the gifted smartphone",
     "a new smartphone with the factory film still on its screen, large-type launcher icons, a plain black case"),
    ("CERTS", "the honour certificates",
     "a stack of honour certificates in thin frames, corners wrapped in newspaper, the top one lettered in gold"),
]
LOCATIONS = [
    ("plant_floor", "Цех фасовки",
     "a bread-plant packing floor with a conveyor of loaves, a film-wrapping machine, steel gantries, flour haze in the light"),
    ("plant_locker", "Раздевалка завода",
     "a plant locker room with tall green lockers, a wooden bench down the middle, a mirror by the door, pipes overhead"),
    ("plant_gate", "Проходная завода",
     "an old plant checkpoint with a steel turnstile, a glass guard booth, an honour board with photos, a wall clock"),
    ("flat_kitchen", "Кухня Степана",
     "a widower's tidy old kitchen, a small table with an oilcloth, one cup rack, a radio on the windowsill, net curtains"),
    ("flat_room", "Комната с грамотами",
     "a modest living room with framed certificates on one wall, a glass-front cabinet, a sofa with a folded blanket"),
    ("courtyard", "Двор с досками объявлений",
     "an apartment-block courtyard with plywood noticeboards by the entrances, benches, poplars, a beaten path in between"),
    ("job_center", "Центр занятости",
     "an employment-centre hall with numbered counters, rows of joined chairs, a ticket terminal, printed posters on the walls"),
    ("courses_class", "Класс переобучения",
     "a rented training classroom with school desks, a projector screen, a flip chart, coats over chair backs"),
    ("guard_booth", "Сторожка стоянки",
     "a parking-lot guard booth with a small heater, a kettle, a barrier lever outside the window, a wall of hooks with keys"),
    ("bakery", "Мини-пекарня",
     "a small artisan bakery backroom with a dough mixer, flour-dusted racks of loaves, a proofing cabinet, warm lamps"),
    ("clinic", "Кабинет в поликлинике",
     "a polyclinic office with a blood-pressure cuff on the desk, a couch with a paper strip, a poster of a heart"),
    ("bus_stop_w", "Зимняя остановка",
     "a winter bus stop with a snow-topped shelter, a frozen route board, footprint-packed snow, grey morning light"),
    ("street_plant", "Улица заводского района",
     "a street in an industrial district with a long plant fence, poplars, a bread kiosk, pipes crossing overhead"),
]
SCENES = [
    ("A0",  0,  "Двенадцать минут",           "cold_open",  "flour_haze_morning",  "morning"),
    ("A1",  1,  "Ладонь на станине",          "origin",     "warm_plant_day",      "day"),
    ("A2",  2,  "Датчики вместо ладони",      "signs",      "cool_digital_white",  "day"),
    ("A3",  3,  "По соглашению",              "firing",     "grey_office_light",   "day"),
    ("A4",  4,  "Пешком по заводам",          "confidence", "clear_autumn",        "day"),
    ("A5",  5,  "До тридцати пяти",           "rejections", "washed_grey_day",     "day"),
    ("A6",  6,  "Курсы",                      "courses",    "fluorescent_class",   "day"),
    ("A7",  7,  "Я сам",                      "pride",      "cold_november",       "day"),
    ("A8",  8,  "Через задний двор",          "no_return",  "dim_lamp_evening",    "evening"),
    ("A9",  9,  "Две сотки тишины",           "bottom",     "deep_winter_blue",    "day"),
    ("A10", 10, "Тестомес",                   "turn",       "warm_bakery_glow",    "morning"),
    ("A11", 11, "Хлеб и щуп",                 "finale",     "bright_winter_warm",  "day"),
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
    # No workflow templates/routes: those tables were dropped 2026-08-13 and
    # every ComfyUI graph now lives once in data/_templates/comfy/. A project
    # needs no comfy/ dir of its own — the render resolves the shared master.
    cx.commit(); cur.close(); cx.close()
    print("FOUNDATION OK: %s (%s) chars=%d profiles=%d props=%d locs=%d scenes=%d" %
          (SLUG, PROJ, len(CHARACTERS), len(PROFILES), len(PROPS), len(LOCATIONS), len(SCENES)))


if __name__ == "__main__":
    main()
