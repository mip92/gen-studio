# -*- coding: utf-8 -*-
"""
One-shot creation of the `flat_earth` project (NOT a maintained seeder — DB is
source of truth; this file is deleted after the project is verified).
Creates: project row, 14 scenes (acts), cast (6 chars / 8 profiles) + M:N,
18 locations, 2 workflow templates + 2 routes. Copies comfy JSONs from cat_lady.
Idempotent: aborts if the project already exists.
Run:  PYTHONIOENCODING=utf-8 python scripts/_seed_flat_earth_foundation.py
"""
import os, shutil, datetime, psycopg2

PFX  = "7e5c0000-0000-4000-8000-"        # flat_earth id namespace (free: 7e5a=cat_lady, 7e5b=honeywagon)
PROJ = PFX + "000000000001"
SLUG = "flat_earth"
NAME = "ТЫ — Плоскоземельщик. И это вся твоя жизнь."
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # gen-studio/
NOW  = datetime.datetime.utcnow()

# ── style-appropriate project defaults (cloned from cat_lady — graphic_novel) ──
DEF_NEG = ("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, "
    "real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, "
    "blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, "
    "fashion shoot, runway, harsh dramatic shadows, side-lit drama, modern brand logos, readable license plates")
DEF_VNEG = ("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, "
    "bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, "
    "frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, "
    "modern brand logos, anime character appearing, new people entering frame, extra humans")
DEF_MOT = ("subtle camera push-in, gentle breathing motion, natural micro-movements, character quietly continuing the moment, "
    "no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT = ("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, "
    "no dolly, no handheld shake. Every object in frame remains completely stationary. No people walking, no figures moving, "
    "no environmental motion, no wind, no flickering lights. The entire scene is a still illustration come to life with zero motion, freeze frame")

# ── scenes (acts): (sceneKey, title, sortOrder, defaultRefProfileCode) ──
SCENES = [
    ("cold_open",      "Cold open — мягкая палата, «сейчас»",                 0,  "RAY"),
    ("act01_childhood","Акт 1 — 1986, заправка, озеро, школа",                1,  "RAY"),
    ("act02_youth",    "Акт 2 — юность, доказательства, ремонт ТВ",           2,  "RAY_YOUNG"),
    ("act03_linda",    "Акт 3 — Линда, свадьба",                              3,  "RAY_YOUNG"),
    ("act04_movement", "Акт 4 — Эрл и движение",                             4,  "RAY_YOUNG"),
    ("act05_cody",     "Акт 5 — рождение Коди, стены в картах",               5,  "RAY"),
    ("act06_proofs",   "Акт 6 — эксперименты, потеря работы, деньги",         6,  "RAY"),
    ("act07_breaks",   "Акт 7 — стыд Коди, уход Линды",                       7,  "RAY"),
    ("act08_alone",    "Акт 8 — один, предательство Эрла",                    8,  "RAY"),
    ("act09_rush",     "Акт 9 — решение, распродажа, рывок на юг",            9,  "RAY"),
    ("act10_road",     "Акт 10 — дорога, одичание",                          10,  "RAY"),
    ("act11_water",    "Акт 11 — большая вода, дальше на юг, шторм",         11,  "RAY"),
    ("act12_edge",     "Акт 12 — плотина, край мира",                        12,  "RAY"),
    ("act13_after",    "Акт 13 — палата, кода, финал",                       13,  "RAY"),
]

# ── characters: code -> displayName ──
CHARS = {
    "RAY":    "Рэй Доусон",
    "LINDA":  "Линда",
    "CODY":   "Коди",
    "EARL":   "Эрл",
    "HALE":   "Доктор Хейл",
    "FATHER": "Отец",
}
# ── profiles: profileCode -> (charCode, ageLabel, triggerToken, promptBase) ──
PROFILES = {
    "RAY":      ("RAY",   "adult 48", "r4ydaw",
        "a lean restless man in his late forties, wild greying curly hair, weathered tan canvas work jacket, "
        "a brass folding carpenter's ruler tucked in his breast pocket, pale intense eyes, grey stubble"),
    "RAY_YOUNG":("RAY",   "adult 28", "r4yyng",
        "a wiry man in his late twenties, dark curly hair, plain checked work shirt, "
        "a brass folding carpenter's ruler in his breast pocket, eager intense eyes, clean-shaven"),
    "LINDA":    ("LINDA", "adult 44", "l1ndad",
        "a tired warm woman in her forties, dark straight chin-length bob, plain buttoned cardigan, "
        "a thin silver wedding band on her left hand, soft careworn face"),
    "CODY_KID": ("CODY",  "kid 7",    "c0dykid",
        "a small freckled boy about seven, sandy straight hair, striped cotton t-shirt, holding a folded paper boat"),
    "CODY_TEEN":("CODY",  "teen 14",  "c0dytn",
        "a guarded teenage boy about fourteen, sandy straight hair, grey hoodie, arms crossed, wary downcast eyes"),
    "EARL":     ("EARL",  "adult 63", "3arlbut",
        "a bald heavyset man in his sixties, smoked aviator sunglasses always worn, cheap brown blazer, "
        "a round flat-earth disc enamel pin on the left lapel"),
    "HALE":     ("HALE",  "adult 52", "d0chale",
        "a calm clinician in his fifties, clean white coat, neatly combed brown hair, "
        "a laminated photo ID badge on a lanyard, a plain wristwatch"),
    "FATHER":   ("FATHER","adult 42", "f4thrdw",
        "a wiry Southern man in his early forties, faded plaid shirt, mesh trucker cap, stubble, "
        "a cigarette tucked behind one ear, work-roughened hands"),
}

# ── locations: slug -> (RU name, EN description) ──  (no people, no style tokens)
LOCS = {
"gas_station_dickerson": ("Заправка отца (Дикерсон-Пайк, 1986)",
    "a small 1980s American roadside gas station and convenience store on a Tennessee pike, two worn fuel pumps under a "
    "flickering fluorescent canopy, oil-stained concrete forecourt, a glass-door cooler humming inside, a wire rack of "
    "tabloid newspapers and pulp magazines beside the register, a Marlboro wall clock, pegboard hung with fan belts and "
    "air fresheners, cracked linoleum, a hand-lettered price sign, dust and warm evening light through the plate glass"),
"percy_priest_lake": ("Озеро Перси-Прист",
    "a wide flat freshwater reservoir in Tennessee seen from a long wooden fishing jetty, dead-calm water stretching in a "
    "perfectly level line to a low pine-covered far shore, a concrete boat ramp, weathered pilings, reeds at the margin, "
    "pale early light and faint mist lifting off the surface, a ruler-straight horizon dividing water and sky"),
"elementary_classroom": ("Школьный класс (80-е)",
    "a 1980s American elementary classroom, rows of wooden desks with attached chairs, a green chalkboard, a pull-down map "
    "of the world, a cardboard solar-system mobile, a globe on the teacher's desk, linoleum floor, tall windows with "
    "venetian blinds, construction-paper artwork pinned along the wall, warm fluorescent light"),
"dawson_house_living": ("Гостиная Доусонов (стены в картах)",
    "a modest Nashville ranch-house living room, a worn plaid sofa, a boxy CRT television, brown wood paneling progressively "
    "covered with pinned flat-earth maps, azimuthal disc projections, newspaper clippings and red string linking pins on a "
    "corkboard, stacks of pulp magazines on the floor, a single lamp throwing warm cluttered shadows"),
"tv_repair_shop": ("Мастерская ремонта ТВ",
    "a cramped electronics repair shop, shelves stacked with opened CRT television sets, a soldering bench with an iron and "
    "coiled wire, an oscilloscope and multimeters, parts bins, a gooseneck lamp, tangled cables, a grimy front counter, "
    "buzzing fluorescent tubes overhead, a faint haze of solder smoke"),
"movement_backroom": ("Подсобка движения",
    "the back room of a strip-mall storefront set up for a small meeting, a ring of metal folding chairs, a pull-down "
    "projector screen, a coffee urn on a trestle table, cheap wood-veneer paneling, a hand-painted flat-earth disc banner "
    "tacked to the wall, stacked pamphlets, a single overhead fixture, dim and earnest"),
"dawson_kitchen": ("Кухня Доусонов",
    "a small dated American kitchen, a yellow formica table with chrome legs, two vinyl chairs, a window over the sink "
    "looking onto a back yard, an avocado-green refrigerator with children's drawings held by magnets, a wall phone with a "
    "coiled cord, worn linoleum, soft domestic light"),
"cody_bedroom": ("Комната Коди",
    "a boy's small bedroom changing over the years, a single bed with a quilt, model airplanes on a shelf, a window with "
    "thin curtains, a desk with schoolbooks, posters peeling at the corners, the father's pinned maps beginning to creep in "
    "around the door frame, muted afternoon light"),
"greyhound_station": ("Автовокзал Greyhound",
    "a worn American intercity bus terminal at night, a long ticket counter, rows of bolted plastic seats, a backlit "
    "departures board, vending machines, scuffed terminal floor, tall windows showing idling coaches under sodium lamps, "
    "harsh overhead fluorescent light"),
"interstate_south": ("Хайвей I-65 на юг",
    "a long straight interstate highway running dead level to a single vanishing point on the horizon, faded lane lines, "
    "low fields and treelines on either side, a distant overpass, scattered billboards on tall poles, heat shimmer over the "
    "asphalt, a huge flat Southern sky"),
"roadside_motel": ("Придорожный мотель",
    "a cheap single-storey Southern roadside motel, a row of identical doors along a covered walkway, a buzzing neon "
    "vacancy sign, a cracked parking lot with faded stripes, an ice machine, a window AC unit, a vending alcove, dusk light "
    "and moths around the lamps"),
"reservoir_shore_south": ("Берег водохранилища (юг)",
    "the shore of a vast southern reservoir at grey dawn, flat open water reaching a perfectly level horizon, gravel and "
    "mud margin, broken reeds, a half-sunk dead tree, a thin cold mist, distant low hills, an immense pale sky"),
"dam_spillway": ("Плотина — водосброс",
    "a massive concrete hydroelectric dam at dawn, tall spillway gates partly open, a thick sheet of water thundering over "
    "the crest and plunging into a churning basin of golden mist far below, a long pedestrian walkway with a steel railing "
    "along the top, wet concrete, gulls, the first warm light catching the spray"),
"padded_cell": ("Мягкая палата",
    "a psychiatric seclusion room, walls and floor lined with seamless off-white padding, a single heavy door with a small "
    "wired observation window, no furniture, a recessed ceiling light behind a grille casting flat even illumination, faint "
    "scuff marks low on the padding, clinical and silent"),
"rural_gas_south": ("Глухая заправка на юге",
    "a run-down rural Southern gas station far from any town, a single old fuel pump, a sagging clapboard store with a "
    "screen door, a hand-painted sign, weeds through the cracked apron, a chained dog's empty bowl, kudzu on a fence, harsh "
    "midday glare and long shadows"),
"east_nash_street": ("Улица в Восточном Нэшвилле",
    "an ordinary older Nashville residential street, modest clapboard and brick houses with porches, chain-link yards, "
    "power lines overhead, parked pickups, oak trees, a cracked sidewalk, an American flag on one porch, flat warm light"),
"public_library": ("Публичная библиотека",
    "the reference section of a small public library, tall metal stacks of bound volumes, a microfiche reader on a side "
    "desk, long wooden study tables with green-shaded lamps, a card catalog, a globe on a stand, quiet diffuse daylight "
    "through high windows"),
"ridge_overlook": ("Гряда-обзор (B-roll)",
    "a rural Tennessee ridge overlook at dusk, a low guardrail, layered blue hills falling away to a long flat haze on the "
    "horizon, scrubby cedars, a gravel pull-off, telephone wires crossing the foreground, deep gold and violet sky"),
}

TEMPLATES = [  # (idsuffix, templateKey, filePath)
    ("b1", "char_ip_graphic_novel",     "flat_earth/comfy/scene_single_character_graphic_novel_api.json"),
    ("b2", "environment_graphic_novel", "flat_earth/comfy/scene_environment_graphic_novel_api.json"),
]
ROUTES = [("b3", "flat_earth_character_ip"), ("b4", "flat_earth_environment")]

def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cx.autocommit = False
    cur = cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s", (SLUG,))
    if cur.fetchone()[0]:
        print("ABORT: project flat_earth already exists"); return

    script_path = os.path.join(ROOT, "scripts", "flat_earth_scriptText.md")
    with open(script_path, encoding="utf-8") as f:
        script_text = f.read()

    settings = '{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute("""INSERT INTO projects
        (id, slug, name, "targetPlatform", "safetyTier", "ttsEngine", "ttsVoiceRefPath",
         "visualStyle", "exportTiming", settings, "scriptText",
         "defaultNegative", "defaultVideoNegative", "defaultMotionPrompt", "defaultStaticMotionPrompt",
         "createdAt", "updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,
                'graphic_novel_cell_shaded','narration',%s::jsonb,%s,
                %s,%s,%s,%s,%s,%s)""",
        (PROJ, SLUG, NAME, "data/flat_earth/tts/voice_reference.wav", settings, script_text,
         DEF_NEG, DEF_VNEG, DEF_MOT, DEF_SMOT, NOW, NOW))

    for i,(key,title,order,ref) in enumerate(SCENES):
        sid = PFX + "0000000000a%d" % i if i < 10 else PFX + "0000000000a%x" % i
        cur.execute("""INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","defaultReferenceProfileCode","createdAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s)""", (sid, PROJ, key, title, order, ref, NOW))

    char_ids = {}
    for n,(code,disp) in enumerate(CHARS.items(), start=1):
        cid = PFX + "0000000000c%d" % n
        char_ids[code] = cid
        cur.execute("""INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,%s)""",
                    (cid, PROJ, code, disp, NOW))
        cur.execute("""INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)""",
                    (PROJ, cid, NOW))

    for n,(pcode,(ccode,age,trig,base)) in enumerate(PROFILES.items(), start=1):
        pid = PFX + "0000000000d%x" % n
        cur.execute("""INSERT INTO character_profiles
            (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt")
            VALUES (%s,%s,%s,%s,0,%s,%s,true,%s)""", (pid, char_ids[ccode], pcode, age, base, trig, NOW))

    for n,(slug,(name,desc)) in enumerate(LOCS.items(), start=1):
        lid = PFX + "000000000e%02x" % n
        cur.execute("""INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s)""", (lid, PROJ, slug, name, desc, NOW, NOW))

    for suf,key,path in TEMPLATES:
        cur.execute("""INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle","createdAt")
            VALUES (%s,%s,%s,%s,'graphic_novel_cell_shaded',%s)""", (PFX+"0000000000"+suf, PROJ, key, path, NOW))
    for suf,key in ROUTES:
        cur.execute("""INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt")
            VALUES (%s,%s,%s,%s)""", (PFX+"0000000000"+suf, PROJ, key, NOW))

    # filesystem: dirs + copy comfy JSONs from cat_lady
    for sub in ("comfy","reference","tts","shots","scenes","bgm"):
        os.makedirs(os.path.join(ROOT,"data","flat_earth",sub), exist_ok=True)
    src = os.path.join(ROOT,"data","cat_lady","comfy")
    dst = os.path.join(ROOT,"data","flat_earth","comfy")
    copied = []
    for fn in os.listdir(src):
        if fn.endswith(".json"):
            shutil.copyfile(os.path.join(src,fn), os.path.join(dst,fn)); copied.append(fn)

    cx.commit()
    print("OK project=%s scenes=%d chars=%d profiles=%d locs=%d templates=%d routes=%d comfy_copied=%d"
          % (PROJ, len(SCENES), len(CHARS), len(PROFILES), len(LOCS), len(TEMPLATES), len(ROUTES), len(copied)))
    cur.close(); cx.close()

if __name__ == "__main__":
    main()
