# -*- coding: utf-8 -*-
"""
Foundation seeder for project «ТЫ — Маляр» (slug: painter).
One-shot creation (aborts if slug exists). Mirrors the fortune setup:
graphic_novel_cell_shaded + EldritchComicsXL1.2 + f5 (female) + exportTiming=narration.
Creates: project row, 8 character profiles (3 heroine age-bands + 6 secondary),
project_characters M:N, 11 scenes, 38 locations, 2 workflow templates + 2 routes.
Shots and BGM are seeded separately.
Run:  PYTHONIOENCODING=utf-8 python seed_painter_foundation.py
"""
import uuid
import psycopg2

SLUG = "painter"

conn = psycopg2.connect(host="localhost", dbname="gen_studio",
                        user="gen_studio", password="gen_studio")
conn.set_client_encoding("UTF8")
cur = conn.cursor()

cur.execute("SELECT id FROM projects WHERE slug=%s", (SLUG,))
if cur.fetchone():
    print(f"ABORT: project '{SLUG}' already exists. Nothing changed.")
    cur.close(); conn.close(); raise SystemExit(0)

pid = str(uuid.uuid4())

COMMON_NEG = ("photorealistic, photograph, 3D render, plastic skin, smooth gradient shading, "
              "hyperrealistic, real human face, anime, manga, chibi, deformed, extra limbs, "
              "text, watermark, signature")

DEFAULT_NEG = ("photorealistic, photograph, 3D render, plastic skin, smooth gradient shading, "
               "real human face, hyperrealistic, anime, manga, chibi, deformed, extra limbs, "
               "text, watermark, signature, blurry")
DEFAULT_VIDEO_NEG = ("people, person, extra figures, additional figures, crowd, anime character, "
                     "manga character, extra humans appearing, cars, vehicles, doors opening, "
                     "photoreal, photograph, 3D render, plastic skin, deformed, flicker, warping")
DEFAULT_MOTION = ("subtle natural motion of only the figure already present, small breathing and "
                  "quiet micro-movements continuing the moment, no new people entering, the "
                  "cell-shaded illustration in motion, hand-drawn animation cadence")
DEFAULT_STATIC_MOTION = ("a still cell-shaded illustration, only the faintest drift of light and "
                         "dust, no people entering, no new figures, almost a freeze frame, "
                         "hand-drawn animation cadence")

NAME = "ТЫ — Маляр. И это вся твоя жизнь."
SETTINGS = '{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'

cur.execute("""
INSERT INTO projects
  (id, slug, name, settings, "scriptText", "targetPlatform", "safetyTier",
   "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt", "defaultStaticMotionPrompt",
   "ttsEngine", "visualStyle", "exportTiming", "updatedAt")
VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())
""", (pid, SLUG, NAME, SETTINGS,
      "See gen-studio/scripts/painter_scriptText.md — synced into scriptText on full seed.",
      "youtube", "advertiser_safe",
      DEFAULT_NEG, DEFAULT_VIDEO_NEG, DEFAULT_MOTION, DEFAULT_STATIC_MOTION,
      "f5", "graphic_novel_cell_shaded", "narration"))

# ── Characters + profiles (useIpAdapter=true for cartoon) ──────────────────────
CHARACTERS = [
  ("HEROINE", "Маляр (ты)", [
     ("HEROINE_CHILD", "kid 9", "nina7painter",
      "a nine-year-old eastern-european girl, dark auburn hair in two messy short braids, fine freckles, serious grey-green eyes, slim small build, a faded hand-me-down sundress, scuffed sandals, a frayed cornflower-blue thread bracelet on her left wrist, a stray smear of bright paint on one cheek, bright curious determined expression",
      "adult proportions, makeup, glamorous, cleavage, facial scars or moles, " + COMMON_NEG),
     ("HEROINE_YOUNG", "young 21", "ninayoung",
      "a young eastern-european woman around twenty, dark auburn hair worn long and loose or in a low ponytail, grey-green eyes, light freckles, slim youthful build, casual late-1990s student clothes or a paint-smudged apron, a frayed cornflower-blue thread bracelet on her left wrist, an eager hopeful open expression",
      "child proportions, heavy makeup, glamour model, " + COMMON_NEG),
     ("HEROINE_ADULT", "adult 27", "ninapainter",
      "a woman in her mid-twenties, dark auburn shoulder-length hair loosely tied back with stray strands, grey-green eyes, faint freckles, slim build, plain modest clothes or grey work overalls, paint flecks on her hands and forearms, a frayed cornflower-blue thread bracelet on her left wrist, a tired watchful face",
      "child proportions, heavy makeup, glamour model, " + COMMON_NEG),
  ]),
  ("FOREWOMAN", "Старшая мастерица", [
     ("FOREWOMAN", "adult 52", "meisterin",
      "a heavyset stern german forewoman in her early fifties, cropped iron-grey hair, square jaw, hard pale eyes, ruddy weathered face, broad shoulders, a grey municipal work jacket, a steel whistle on a lanyard at her chest, a clipboard in hand, an unsmiling authoritative bearing",
      "young, slim, warm friendly smile, glamorous, " + COMMON_NEG),
  ]),
  ("MOTHER", "Мама", [
     ("MOTHER", "adult 50", "mathomeland",
      "a tired gentle eastern-european woman around fifty, ash-blonde greying hair in a low bun, a soft round lined face, kind worried grey eyes, a faded blue knitted cardigan, a thin worn gold wedding band, a stooped caring posture",
      "young, glamorous, dyed bright hair, heavy makeup, " + COMMON_NEG),
  ]),
  ("FRAU", "Старушка-жилец", [
     ("FRAU_RESIDENT", "old 75", "altefrau",
      "a small stooped german woman in her seventies, thin white hair under a floral headscarf, a deeply kind wrinkled face, pale blue eyes, a plain knitted housecoat, a worn shopping string-bag on her arm, a gentle warm expression",
      "young, tall, glamorous, makeup, " + COMMON_NEG),
  ]),
  ("YARDMAN", "Дворник", [
     ("YARDMAN", "adult 55", "dvornik",
      "a stout grumpy eastern-european caretaker in his fifties, grey stubble, a flat cap, a faded brown work jacket, thick rough hands, holding a worn straw broom, a galvanized whitewash bucket nearby, a permanent scowl",
      "young, slim, smiling, glamorous, female, " + COMMON_NEG),
  ]),
  ("PROFESSOR", "Профессор-нормоконтроль", [
     ("PROFESSOR", "old 60", "normprof",
      "a lean severe academic man in his sixties, balding with grey hair at the sides, thin-rimmed reading glasses low on his nose, a drab grey suit, a red marking pen in hand, a thick grey standards binder under his arm, a disapproving pursed mouth",
      "young, warm, casual clothes, smiling, female, " + COMMON_NEG),
  ]),
  ("FRIEND", "Сокурсник-друг", [
     ("FRIEND_STUDENT", "young 22", "studentfriend",
      "a friendly young man around twenty-two, tousled light-brown hair, an easy warm grin, a worn flannel shirt with rolled sleeves, paint-spattered boots, a roll of tracing paper over one shoulder, a relaxed encouraging posture",
      "older, stern, formal suit, glamorous, female, " + COMMON_NEG),
  ]),
]

for code, disp, profiles in CHARACTERS:
    cid = str(uuid.uuid4())
    cur.execute("""INSERT INTO characters (id,"projectId",code,"displayName")
                   VALUES (%s,%s,%s,%s)""", (cid, pid, code, disp))
    cur.execute("""INSERT INTO project_characters ("projectId","characterId")
                   VALUES (%s,%s)""", (pid, cid))
    for pc, age, trig, base, neg in profiles:
        cur.execute("""INSERT INTO character_profiles
            (id,"characterId","profileCode","ageLabel","triggerToken","promptBase","negative","useIpAdapter","targetImages")
            VALUES (%s,%s,%s,%s,%s,%s,%s,true,0)""",
            (str(uuid.uuid4()), cid, pc, age, trig, base, neg))

# ── Scenes (cold open + A1..A10) ───────────────────────────────────────────────
SCENES = [
  ("cold_open", 0, "HEROINE_ADULT", "Cold open — самостирание вперёд: ты катаешь серым свою роспись, входит мастерица"),
  ("act01_childhood", 1, "HEROINE_CHILD", "A1 Детство — василёк на сером заборе, дворник, рождение лейтмотива"),
  ("act02_institute", 2, "HEROINE_YOUNG", "A2 Институт дизайна — красота против нормы"),
  ("act03_nowork", 3, "HEROINE_YOUNG", "A3 Нет работы дома — отказы, решение уехать в Германию"),
  ("act04_germany", 4, "HEROINE_ADULT", "A4 Отъезд в Германию — лето 2006, ЧМ, языковой барьер"),
  ("act05_graywork", 5, "HEROINE_ADULT", "A5 Серая работа — ГОСТ, мастерица, групповой этап ЧМ"),
  ("act06_revolt", 6, "HEROINE_ADULT", "A6 Тайный бунт — цвет возвращается, плей-офф ЧМ"),
  ("act07_beating", 7, "HEROINE_ADULT", "A7 Разоблачение и избиение — долг 1840 евро, канун финала"),
  ("act08_erasure", 8, "HEROINE_ADULT", "A8 Самостирание — день финала 9 июля"),
  ("act09_aftermath", 9, "HEROINE_ADULT", "A9 Послесловие — выгоревший серый маляр, 2008"),
  ("act10_coda", 10, "HEROINE_ADULT", "A10 Кода — девочка с мелками, финальный василёк"),
]
for key, order, refcode, title in SCENES:
    cur.execute("""INSERT INTO scenes (id,"projectId","sceneKey","sortOrder","defaultReferenceProfileCode",title)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (str(uuid.uuid4()), pid, key, order, refcode, title))

# ── Locations (14 rich + 24 compact) ───────────────────────────────────────────
LOCATIONS = [
 ("treppenhaus_present", "Подъезд (Германия, основной)",
  "A 1970s West-German apartment-block stairwell, a tall narrow shaft with a half-turn concrete staircase and a tubular steel handrail in municipal grey, smooth plaster walls above a darker dado line, speckled grey terrazzo steps worn shiny at the centre, a bank of metal letterbox slots and a posted house-rules board by the entrance, a frosted wire-glass window on each half-landing, a single old radiator low on one wall, a cold ceiling tube light, scuffed skirting marked by decades of moved furniture. Atmosphere of ordinary regulated slightly institutional residential calm."),
 ("stairwell_tiled", "Подъезд кафельный (Altbau)",
  "An ornate pre-war Altbau stairwell, a sweeping wooden staircase curving around an open well with a carved dark-wood banister and turned balusters, walls tiled to shoulder height with patterned glazed ceramic in faded ochre and green, a moulded plaster cornice above, encaustic floor tiles in geometric motifs worn smooth at the treads, tall arched landing windows with leaded panes, an old brass-and-glass pendant lamp, layered overpainting on the upper walls. Atmosphere of faded bourgeois elegance gone shabby with age."),
 ("stairwell_panel", "Подъезд панельный (Plattenbau)",
  "A bare 1970s Plattenbau prefab stairwell, raw board-marked concrete walls and a straight-flight concrete staircase with a plain bent-steel rail, identical landings repeating floor after floor, ribbed grey PVC floor covering, a strip of numbered doorbells and a grimy intercom, a single narrow glass-block window per level, a buzzing fluorescent batten, exposed conduit and a fire-hose reel in a recess. Atmosphere of utilitarian repetition and anonymous mass housing."),
 ("stairwell_stucco", "Подъезд штукатурный",
  "A modest post-war stairwell with rough stucco-rendered walls in a flat institutional tone, a concrete staircase with a simple painted steel handrail, a textured terrazzo floor, a wooden entrance door with a wired-glass pane onto the street, a mailbox bank, a worn doormat, a small landing window with a radiator beneath it, chips and patches of old repainting across the walls. Atmosphere of plain weary much-painted communal space."),
 ("home_courtyard", "Двор детства (родина, 1987)",
  "A late-1980s eastern-bloc residential courtyard ringed by grey prefab panel blocks, a long fence of grey concrete posts and weathered wooden planks, a row of rusty metal garages, dusty cracked asphalt paths, a sandbox and a steel carpet-beating frame, tall poplar trees shedding white summer fluff, washing lines strung between balconies, a few benches by the entrances. Atmosphere of dusty sun-bleached monotonous socialist-era domestic life."),
 ("building_courtyard", "Двор (Германия)",
  "A tidy enclosed German residential courtyard between apartment blocks, neat paved paths and a small mown lawn, a fenced bay of sorted recycling and rubbish bins, a small playground with a slide, trimmed shrubs and a single tree, bicycle racks along one wall, orderly balconies above with the occasional flower box. Atmosphere of clean regulated slightly sterile communal order."),
 ("fanmeile", "Фан-зона ЧМ-2006",
  "A host-city public square turned World Cup fan zone in summer 2006, a giant screen raised on scaffolding above a packed open plaza, national flags strung balcony to balcony and banners with the tournament slogan, beer and bratwurst stalls, bunting and pennants, temporary crowd barriers and lighting rigs, the surrounding facades draped in colour. Atmosphere of mass festive football euphoria and high summer celebration."),
 ("worker_room", "Комната в общежитии (Германия)",
  "A bleak worker-hostel room, small and bare, a narrow iron-framed single bed with thin bedding, a corner washbasin with a small mirror, a single window onto a grey courtyard, flat institutional grey-green walls, a built-in cupboard, a simple ceiling light, a radiator under the sill, a wooden chair and a small table. Atmosphere of spartan transient lonely migrant lodging."),
 ("paint_depot", "Склад краски / база",
  "A municipal paint and works depot yard at the edge of the city, pallets stacked with grey paint buckets, aluminium ladders and scaffolding sections in racks, rolls of dust sheets and coiled hoses, a battered work van by a roller-shutter store, a small site cabin, oil-stained concrete and a chain-link fence. Atmosphere of cold early-morning utilitarian labour."),
 ("forewoman_office", "Каморка мастерицы",
  "A cramped depot site office, a metal desk cluttered with paperwork, clipboards and a rubber stamp, a wall pinned with work rosters and a RAL colour chart, a filing cabinet, a small grimy window, a kettle on a side table, a hard visitor's chair, harsh fluorescent light. Atmosphere of petty bureaucratic authority."),
 ("drafting_studio", "Чертёжная (институт)",
  "A late-1990s design-institute drafting hall, long rows of parallel-rule drafting machines on adjustable boards, tall metal-framed windows down one side, fluorescent tubes overhead, stools and stacks of rolled drawings, reference sheets pinned to the walls, ink bottles and rapidograph pens at the stations. Atmosphere of disciplined studious technical work."),
 ("institute_facade", "Институт дизайна (фасад)",
  "A heavy late-soviet design-institute building, a grey concrete-and-glass modernist facade with a wide stepped entrance and tall mullioned windows, a tram line and wet asphalt out front, bare plane trees, a stone sign panel by the doors, a flagpole, worn steps. Atmosphere of austere institutional academia."),
 ("home_kitchen", "Кухня (родина)",
  "A small modest eastern-european family kitchen, a worn enamel sink under the window, a gas stove and kettle, open shelves of mismatched crockery, an oilcloth-covered table, a cheap wall calendar, a windowsill with a potted plant and a jar of brushes, faded patterned wallpaper, warm dim light. Atmosphere of cramped lived-in tired domestic warmth."),
 ("gray_city", "Серый город (Германия, после ЧМ / сейчас)",
  "An ordinary mid-size German city in plain everyday dress, even rows of grey apartment blocks and stuccoed facades, tram tracks and overhead wires, a bus shelter, zebra crossings and traffic signs, sparse street trees, an overcast flat sky, the festive flags long gone. Atmosphere of grey uniform unremarkable urban routine."),
 # ── compact ──
 ("garages_row", "Ряд гаражей (детство)",
  "A row of rusty metal lock-up garages behind the courtyard, dented roller doors in faded green and grey, oil-stained concrete apron, weeds at the base, a couple of dropped bicycles, dusty summer light. Atmosphere of a scruffy back-courtyard play space."),
 ("school_artroom", "Школьный класс рисования",
  "A plain late-soviet school art classroom, rows of double desks with hinged lids, a green chalkboard, a portrait and an alphabet frieze on the wall, tall windows with thin curtains, jars of brushes and worksheet sheets, cold even daylight. Atmosphere of strict orderly schooling."),
 ("her_room_homeland", "Её комната (родина, эскизы)",
  "A small modest bedroom in a family flat, a narrow bed, a cluttered desk under a window, walls pinned with the girl's colourful sketches now curling and dusty, a wardrobe, faded wallpaper, dim afternoon light. Atmosphere of a young creative's room going quiet and dusty."),
 ("home_bus_station", "Автостанция (родина)",
  "A drab provincial bus station at dawn, a concrete shelter and timetable board, idling long-distance coaches with exhaust haze, cracked asphalt, a few waiting passengers with bags, pale early light. Atmosphere of a cold tired departure."),
 ("home_city_street", "Тусклый город (родина) / коридор контор",
  "A tired post-soviet city in cold autumn, wet grey-brown streets, leafless trees, peeling kiosks and trams, and drab office corridors of small doors with hand-printed signs under fluorescent light. Atmosphere of deflated grey provincial routine."),
 ("studio_waiting_room", "Приёмная дизайн-студии",
  "A cramped design-studio waiting room, dull beige walls, a row of chairs, a frosted office door, a tired pot plant, a low table with magazines, flat office light. Atmosphere of anxious job-seeking waiting."),
 ("employment_office", "Биржа труда",
  "A state employment office under harsh fluorescent tubes, worn linoleum, a numbered ticket queue, scratched-glass clerk windows, notice boards of job slips, institutional green-grey walls. Atmosphere of bureaucratic dead-end waiting."),
 ("model_room", "Макетная (институт)",
  "An institute model-making room, workbenches with cutting mats and scalpels, sheets of foam-core and cardboard, glue and offcuts, half-built architectural maquettes, task lamps, warm bench wood. Atmosphere of hands-on creative craft."),
 ("color_library", "Цех-палитра (институт)",
  "A materials and colour room, shelves and fans of paper colour swatches, pigment tubes and ceramic palettes, reference boards on the walls, a worktop stained with paint, warm focused light. Atmosphere of careful colour study."),
 ("underpass_wall", "Переход (студ-мурал)",
  "A grim grey pedestrian underpass, dim tiled walls and a worn concrete floor, a single flickering tube light, one long wall freshly transformed by a vivid painted meadow, rollers and paint buckets below. Atmosphere of a bleak tunnel brightened by colour."),
 ("crit_room", "Просмотр-зал (институт)",
  "A design crit room, presentation boards pinned in a long row along the wall, a parquet floor, tall windows, a few stools, mostly muted grey-line schemes with one board blazing in colour. Atmosphere of formal academic review."),
 ("dorm_room", "Общага (институт)",
  "A cramped student dormitory room at night, a narrow bed, a desk under a bent lamp, walls papered with colourful sketches and swatch tests, a chipped mug, a radiator, dark beyond the lamp pool. Atmosphere of late-night studious devotion."),
 ("defense_hall", "Зал защиты диплома",
  "A formal diploma-defense hall, a long jury table facing a presentation easel, tall windows, a portrait on the wall, parquet floor, solemn institutional stillness. Atmosphere of austere academic judgement."),
 ("autobahn", "Автобан / салон автобуса",
  "A German autobahn seen from a long-distance coach, green Ausfahrt and Hauptbahnhof signs overhead, fields and wind turbines, cars flying small national flags, and the worn interior of the bus with rows of seats and luggage racks, bright hazy daylight. Atmosphere of a long tiring journey into a foreign country."),
 ("host_city_hauptbahnhof", "Вокзал прибытия (город-хозяин)",
  "A vast modern German central station, a glass-and-steel canopy, departure boards and platforms, trams and a busy forecourt, streams of commuters and football fans, bright steel-grey light. Atmosphere of overwhelming foreign arrival."),
 ("auslanderbehorde", "Ведомство по делам иностранцев",
  "A German foreigners'-registration office, rows of plastic waiting chairs, a digital number display, multilingual notices, clerk desks with forms and stamps, worn linoleum, flat institutional light. Atmosphere of cold impersonal bureaucracy."),
 ("corner_shop", "Лавка на углу",
  "A small German corner shop, a cluttered counter and till, fridges and snack displays, shelves of goods, World Cup snack promos, warm interior light. Atmosphere of an everyday neighbourhood errand."),
 ("brigade_van", "Фургон бригады",
  "The interior of a municipal work van, bench seats of painters in grey overalls, buckets and rollers rattling in the back, tools and dust sheets, cool morning light through the windscreen. Atmosphere of a cramped early-shift commute."),
 ("facade_scaffold", "Фасад в лесах",
  "Scaffolding planks high on a building facade, aluminium poles and boards, rollers and grey paint buckets, a faded old painted advertisement on the wall being covered, the host-city skyline with flags beyond. Atmosphere of exposed working height."),
 ("frau_doorway", "Дверь старушки",
  "An apartment doorway and small hallway, a worn doormat and a potted plant, a name tag by the bell, a coat hook, warm dim hallway light. Atmosphere of a modest private threshold."),
 ("stairwell_entrance_2", "Второй подъезд (вход)",
  "The ground-floor entrance hall of another grey stairwell, a glass entrance door, a bank of mailboxes, a bare concrete floor and plaster walls, a single ceiling light. Atmosphere of another anonymous communal entrance."),
 ("baumarkt", "Строймагазин",
  "A German hardware store aisle, shelves of paint tins and brushes, price labels and fluorescent strip lighting, a basket and a row of colour-sample cards, a checkout beyond. Atmosphere of a plain practical errand."),
 ("signpainting_oddjob", "Рыночная халтура (вывески)",
  "A scruffy market corner, a kiosk board and a fence being hand-lettered, a pot of dull paint and a coarse brush, crates and a tarpaulin, drab overcast light. Atmosphere of low-paid odd-job labour."),
 ("disclaimer_card", "Карточка дисклеймера",
  "A near-black dark grey end card, plain and empty, a single faint hand-painted cornflower watermark low in one corner. Atmosphere of a quiet closing frame."),
]
for slug, name, desc in LOCATIONS:
    cur.execute("""INSERT INTO locations (id,"projectId",slug,name,description,"updatedAt")
                   VALUES (%s,%s,%s,%s,%s, now())""",
                (str(uuid.uuid4()), pid, slug, name, desc))

# ── Workflow templates + routes (mirror fortune) ───────────────────────────────
TEMPLATES = [
  ("char_ip_graphic_novel", f"{SLUG}/comfy/scene_single_character_graphic_novel_api.json", "graphic_novel_cell_shaded"),
  ("environment_graphic_novel", f"{SLUG}/comfy/scene_environment_graphic_novel_api.json", "graphic_novel_cell_shaded"),
]
for key, path, vs in TEMPLATES:
    cur.execute("""INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle")
                   VALUES (%s,%s,%s,%s,%s)""", (str(uuid.uuid4()), pid, key, path, vs))

for routekey in (f"{SLUG}_character_ip", f"{SLUG}_environment"):
    cur.execute("""INSERT INTO workflow_routes (id,"projectId","routeKey")
                   VALUES (%s,%s,%s)""", (str(uuid.uuid4()), pid, routekey))

conn.commit()
print(f"OK: project '{SLUG}' id={pid}")
cur.execute("""SELECT
  (SELECT count(*) FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id WHERE c."projectId"=%s),
  (SELECT count(*) FROM project_characters WHERE "projectId"=%s),
  (SELECT count(*) FROM scenes WHERE "projectId"=%s),
  (SELECT count(*) FROM locations WHERE "projectId"=%s),
  (SELECT count(*) FROM workflow_templates WHERE "projectId"=%s),
  (SELECT count(*) FROM workflow_routes WHERE "projectId"=%s)
""", (pid, pid, pid, pid, pid, pid))
prof, links, sc, loc, tpl, rt = cur.fetchone()
print(f"profiles={prof} project_characters={links} scenes={sc} locations={loc} templates={tpl} routes={rt}")
cur.close(); conn.close()
