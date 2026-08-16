# -*- coding: utf-8 -*-
"""Foundation seeder for monotown (№7, финал серии). Voice cloned from mascot («Гонщик»)."""
import io, os, psycopg2

PFX = "7e790000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "monotown"
NAME = "ТЫ — Последний мастер. И это вся твоя жизнь."

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "monotown_scriptText.md")

CHARACTERS = [
    ("MATVEY",    "Matvey"),
    ("GALYA",     "Galya"),
    ("SANYA",     "Sanya"),
    ("PETROVICH", "Petrovich"),
    ("RECEIVER",  "the receiver"),
]
PROFILES = [
    ("MATVEY", "MATVEY_BASE", "49", "matveybase",
     "a stocky east-european man of forty-nine, grey temples under a grey flat cap, a heavy jaw and calm deep-set eyes, a brass whistle on a braided cord at his neck, a dark work jacket"),
    ("GALYA", "GALYA_BASE", "47", "galyabase",
     "a calm east-european woman of forty-seven, fair hair pinned back, a steady practical face, a small medical watch pinned to her cardigan, a knitted shawl over her shoulders"),
    ("SANYA", "SANYA_BASE", "22", "sanyabase",
     "a tall east-european young man of twenty-two, a close crop, a wind-worn open face, welding goggles pushed up on his forehead, a canvas work jacket"),
    ("PETROVICH", "PETROVICH_BASE", "56", "petrovichbase",
     "a wiry east-european man of fifty-six, grey stubble, sharp humorous eyes, ear-defender headphones around his neck, a machinist apron over a checked shirt"),
    ("RECEIVER", "RECEIVER_BASE", "45", "receiverbase",
     "a smooth east-european man of about forty-five, a neutral corporate face, rimless glasses, a sleek grey suit, a pilot-case briefcase on wheels at his side"),
]
PROPS = [
    ("WHISTLE", "the brass whistle",
     "a brass foreman whistle on a braided cord, one flank rubbed bright by a thumb, the pea rattling dry inside"),
    ("HORN", "the factory horn lever",
     "the factory horn lever in its cabin: a brass handle, a shift-schedule plate, a fixing chain with a worn hook"),
    ("BYPASS", "the clearance sheet",
     "a clearance run-off sheet with department boxes, stamps at odd angles, the foreman signature line last at the bottom"),
    ("LATHE", "the old lathe",
     "an old lathe with a brass year plate, handwheels polished by decades of palms, the bed gleaming under fresh grease"),
    ("BANNER", "the glory banner",
     "a faded red banner reading glory to labour hanging under the shop ceiling, its edges gone to fringe"),
    ("GRINDER", "the angle grinder",
     "an angle grinder with a home-made handle turned from a file, a burred disc, blue insulating tape along the cord"),
]
LOCATIONS = [
    ("shop_floor", "Механический цех",
     "a vast machine shop with rows of lathes and mills, an overhead crane rail, skylights in a sawtooth roof, oil-dark floors"),
    ("plant_yard_m", "Двор завода",
     "a plant yard with rail sidings, stacked steel profiles, a gantry crane, weeds breaking the concrete seams"),
    ("plant_gate_m", "Проходная завода",
     "an old plant checkpoint with a turnstile, a shift board of hanging number tags, a guard window, a mosaic panel over the door"),
    ("horn_room", "Будка гудка",
     "a small machine-room cabin with the horn lever on the wall, gauges, a shift schedule plate, one high window"),
    ("town_square", "Площадь у ДК",
     "a monotown central square with a house of culture, a flowerbed ring, a war memorial, poplars along the perimeter"),
    ("matvey_kitchen", "Кухня Матвея",
     "a five-storey flat kitchen with a corner bench, a radio on the fridge, lace curtains, the plant visible through the window"),
    ("five_story", "Двор пятиэтажек",
     "a courtyard between five-storey blocks with a rug-beating frame, benches, a row of poplars, clotheslines"),
    ("garage_coop", "Гаражный кооператив",
     "a garage cooperative of concrete boxes in rows, sectional doors, a shared water tap, cable spools as tables"),
    ("town_street", "Главная улица",
     "the main street of a monotown with ground-floor shopfronts, half of them papered over, a pharmacy cross glowing"),
    ("bus_station_m", "Автовокзал",
     "a small bus station with two bays, a waiting hall with plastic chairs, a timetable board with missing letters"),
    ("meeting_dk", "Зал ДК",
     "a house-of-culture hall with worn red seats, a stage with a lectern, tall windows, stucco mouldings"),
    ("market_town", "Городской рыночек",
     "a small town market of metal kiosks and trestle tables, tarpaulin awnings, crates of seasonal produce"),
    ("overlook", "Пригорок над заводом",
     "a grassy rise over the town with the plant panorama below, chimneys and sawtooth roofs, a bench of two planks"),
]
SCENES = [
    ("A0",  0,  "Три тонны над людьми",       "cold_open",  "shop_morning_haze",   "morning"),
    ("A1",  1,  "Город по гудку",             "origin",     "warm_plant_town",     "morning"),
    ("A2",  2,  "Управляющий",                "signs",      "receiver_grey",       "day"),
    ("A3",  3,  "Обходные",                   "waves",      "farewell_industrial", "day"),
    ("A4",  4,  "Город пустеет",              "emptying",   "fading_town",         "day"),
    ("A5",  5,  "Гудок отменяют",             "silence1",   "quiet_morning_blue",  "morning"),
    ("A6",  6,  "Предложение области",        "offer",      "crossroad_amber",     "evening"),
    ("A7",  7,  "Станок с торгов",            "auction",    "auction_cold",        "day"),
    ("A8",  8,  "Я догашу цех",               "no_return",  "resolve_lamp",        "evening"),
    ("A9",  9,  "Последний гудок",            "shutdown",   "last_shift_gold",     "day"),
    ("A10", 10, "Гаражи",                     "garages",    "grey_thaw",           "day"),
    ("A11", 11, "Семь тридцать мелом",        "finale",     "spark_morning",       "morning"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()
    cur.execute("SELECT \"ttsVoiceoverId\",\"ttsVoiceRefPath\" FROM projects WHERE slug='mascot'")
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
