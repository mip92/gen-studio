# -*- coding: utf-8 -*-
"""Foundation seeder for irreplaceable (№5 of the layoff series). Voice cloned from honeywagon («Говночист»)."""
import io, os, psycopg2

PFX = "7e770000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "irreplaceable"
NAME = "ТЫ — Незаменимый. И это вся твоя жизнь."

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_MD = os.path.join(HERE, "irreplaceable_scriptText.md")

CHARACTERS = [
    ("BORIS", "Boris"),
    ("KATYA", "Katya"),
    ("ARTUR", "Artur"),
    ("GENA",  "Gena"),
]
PROFILES = [
    ("BORIS", "BORIS_BASE", "52", "borisbase",
     "a heavy east-european man of fifty-two, a grey-fringed balding head, reading glasses on a neck chain, a flash drive on a knotted cord around his neck, a stretched grey cardigan over a checked shirt"),
    ("KATYA", "KATYA_BASE", "35", "katyabase",
     "a composed east-european woman of thirty-five, dark hair in a loose bun with a pencil pushed through it, attentive hazel eyes, a fitted denim shirt over a white tee"),
    ("ARTUR", "ARTUR_BASE", "38", "arturbase",
     "a trim east-european man of thirty-eight, a close-cropped haircut, round transparent-framed glasses, a plain merino jumper, a sticker-covered laptop under one arm"),
    ("GENA", "GENA_BASE", "49", "genabase",
     "a lean east-european man of forty-nine, a grey-flecked short beard, hair in a small low ponytail, a multitool in a belt pouch, a faded band t-shirt under an open flannel"),
]
PROPS = [
    ("CIPHER", "the cipher notebook",
     "a squared notebook ruled by hand into columns of ciphered lines, its spine reinforced with tape, corners soft with use"),
    ("USB", "the neck flash drive",
     "a flash drive on a braided knotted cord, its cap worn to bare metal, a paper label ring around the stem"),
    ("SERVER", "the old server tower",
     "an old server rack tower with home-made stickers and handwritten cable tags, one fan droning louder than the rest"),
    ("KEYBOARD", "the yellowed keyboard",
     "a yellowed keyboard with keys polished blank, three letters redrawn in nail varnish, a worn wrist mark along the front edge"),
    ("WIKI", "the printed wiki page",
     "a printed wiki page titled as regulation number one, tidy headings and numbered steps, a pin shadow in one corner"),
    ("CACTUS", "the monitor cactus",
     "a small cactus in a tea tin standing on a monitor top, a felt-pen smiley on the tin, gravel around the stem"),
]
LOCATIONS = [
    ("it_room", "Каморка Бориса",
     "a cramped IT room with a server rack, two desks in an L, shelves of boxed backups, a window blocked by a cabinet"),
    ("openspace_trade", "Опенспейс компании",
     "a trading-company open office with rows of desks, monitors with spreadsheet glow, a printer island, glass meeting boxes"),
    ("server_room", "Серверная",
     "a server room with racks in cold aisles, bundled cables, status diodes, a raised floor with lifted tiles"),
    ("warehouse_trade", "Склад компании",
     "a high-rack trade warehouse with pallet lanes, scanners charging in cradles, a mezzanine office with glass"),
    ("cio_office", "Кабинет ИТ-директора",
     "a small modern office with a standing desk, a whiteboard of diagrams, a beanbag no one uses, a city window"),
    ("meeting_it", "Переговорка ИТ",
     "a meeting room with a long table, a wall screen, sticky notes climbing the glass wall, water bottles"),
    ("datacenter", "Холодный ЦОД",
     "a colocation datacenter hall with numbered cages, cold white light, cable trays, a badge reader at every cage"),
    ("boris_flat", "Квартира Бориса",
     "a bachelor flat with book towers, a desk with three monitors, a kettle on a tray, curtains half drawn"),
    ("hr_room", "Переговорка собеседований",
     "a neutral interview room with a round table, two chairs, a water cooler, a motivational poster peeling at one corner"),
    ("new_office", "Офис Кати",
     "a bright modern support-team office with paired desks, a wall of printed regulations, plants along the sill"),
    ("corridor_it", "Коридор у ИТ",
     "an office corridor with a shared printer alcove, cork boards, a fire plan, a window at the far end"),
    ("street_office", "Улица у офиса",
     "a street by an office centre with a coffee kiosk, bike racks, revolving doors, plane trees in grates"),
    ("pelmennaya", "Пельменная",
     "an old-style dumpling café with high round tables, steamed windows, a menu board with plastic letters"),
]
SCENES = [
    ("A0",  0,  "Полчаса в два ночи",          "cold_open",  "night_server_blue",   "night"),
    ("A1",  1,  "Сто двенадцать паролей",      "origin",     "warm_lamp_clutter",   "day"),
    ("A2",  2,  "Аудит",                       "signs",      "clean_audit_white",   "day"),
    ("A3",  3,  "Единая точка отказа",         "war",        "red_flag_grey",       "day"),
    ("A4",  4,  "Восемь миллионов",            "vendor",     "vendor_teal",         "day"),
    ("A5",  5,  "Параллельный запуск",         "parallel",   "dual_screen_glow",    "day"),
    ("A6",  6,  "Гена уходит в облака",        "ally_exit",  "warm_pelmeni_steam",  "evening"),
    ("A7",  7,  "Режим чтения",                "readonly",   "cold_dc_white",       "day"),
    ("A8",  8,  "Завхоз чужой системы",        "no_return",  "amber_offer_light",   "evening"),
    ("A9",  9,  "День выключения",             "shutdown",   "farewell_grey",       "day"),
    ("A10", 10, "Мануал",                      "manual",     "night_desk_lamp",     "night"),
    ("A11", 11, "Регламент №1",                "finale",     "bright_new_office",   "day"),
]


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute("SELECT 1 FROM projects WHERE slug=%s OR id=%s", (SLUG, PROJ))
    if cur.fetchone():
        raise SystemExit("project %s already exists — aborting" % SLUG)
    with io.open(SCRIPT_MD, "r", encoding="utf-8") as f:
        script_text = f.read()
    cur.execute("SELECT \"ttsVoiceoverId\",\"ttsVoiceRefPath\" FROM projects WHERE slug='honeywagon'")
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
