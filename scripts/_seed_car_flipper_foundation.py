# -*- coding: utf-8 -*-
"""One-shot creation of the `car_flipper` project.
Run: PYTHONIOENCODING=utf-8 python scripts/_seed_car_flipper_foundation.py

«ТЫ — Автоперекуп. И это вся твоя жизнь.» Track B, f5 («агента Смита», male).
Scenes render on Qwen-Image-Edit-2511 + RealComic (visualStyle=realcomic_qwen);
character ANCHORS render on Flux (settings.anchorPipeline='flux_comic' +
settings.anchorStyleLora) — settings.styleLora stays the Qwen scene LoRA.
Nameless country, no currency names. ~330 shots ≈ 38 min.
"""
import os, shutil, datetime, psycopg2

PFX = "7e6e0000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "car_flipper"
NAME = "ТЫ — Автоперекуп. И это вся твоя жизнь."
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOW = datetime.datetime.now()

DEF_NEG = ("photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, raytraced, "
           "deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, "
           "anime, manga, chibi, kawaii, big shiny eyes, oversaturated color, modern brand logos, readable license plates, "
           "cyrillic text, national flags, currency symbols, banknotes with denominations, graphic violence, blood, gore, "
           "injured bodies, corpse, nudity, character reference sheet, plain studio backdrop, portrait crop")
DEF_VNEG = ("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, "
            "photoreal, photograph, plastic skin, oversmooth, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, "
            "flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, "
            "manga character, new people entering frame, extra humans, crash impact, vehicle collision")
DEF_MOT = ("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, "
           "no abrupt gestures, workshop stillness with small life signs, hand-drawn illustration in motion, painterly animation cadence")
DEF_SMOT = ("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, "
            "no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust in the light. "
            "The entire scene is a still illustration come to life, freeze frame")

VOICE_ID = "802b3d77-eedc-4d66-b93e-cba2d37d361f"   # «агента Смита» (male)
VOICE_REF = "data/_voices/voice-3/voice_reference.wav"

SCENES = [
    ("cold_open",    "Cold open — ночь, кювет, подклеенное зеркало + CTA",            0, "VIK_OLD"),
    ("garage",       "Акт 1 — 17 лет, гараж №14, двести двадцать в восемьдесят девять", 1, "VIK_TEEN"),
    ("market",       "Акт 2 — 19–22, свой ряд, первое «как себе брал», Лена",          2, "VIK_TEEN"),
    ("craft",        "Акт 3 — 24–27, шпатлёвка и большая вода, рождается Денис",       3, "VIK_ADULT"),
    ("first_return", "Акт 4 — 29, покупатель вернулся, Лена смотрит",                  4, "VIK_ADULT"),
    ("lot",          "Акт 5 — 31–34, своя площадка, проверка, оформление на Лену",     5, "VIK_ADULT"),
    ("son",          "Акт 6 — 38–41, Денис в деле, площадка на сына",                  6, "VIK_ADULT"),
    ("quit",         "Акт 7 — 44, похороны Гены, три месяца честно, возврат",          7, "VIK_OLD"),
    ("sale",         "Акт 8 — 45, Аня с семьёй, жёлтый рюкзак, подпись Дениса",        8, "VIK_OLD"),
    ("crash",        "Акт 9 — пять недель спустя, экспертиза, лонжерон и трубки",      9, "VIK_OLD"),
    ("verdict",      "Акт 10 — 46, суд, срок, площадка за долги",                     10, "VIK_OLD"),
    ("coda",         "Финал — 47, мойка, свидание, «как себе брал», дисклеймер",      11, "VIK_OLD"),
]

# displayName goes STRAIGHT into the Qwen instruction ("Picture 1 is <displayName>
# — <promptBase>"), so it is kept as a bare Latin given name: a Cyrillic label
# with a parenthetical role ("Виктор (ты) — автоперекуп") reads to the VL encoder
# as extra description and fights the promptBase. Russian names live in scriptText.
CHARS = {
    "VIKTOR": "Viktor",
    "GENA":   "Gena",
    "LENA":   "Lena",
    "DENIS":  "Denis",
    "ANYA":   "Anya",
    "IGOR":   "Igor",
}

# NB: Qwen-Image defaults to east-asian faces — ethnicity MUST live in the
# POSITIVE promptBase (the negative is inert at cfg 1.0). Every base below
# names slavic / east-european features explicitly.
PROFILES = {
    "VIK_TEEN":   ("VIKTOR", "teen 17",  "vikteen",
                   "a thin seventeen-year-old slavic boy with fair east-european features, dark ash-brown hair cut short and badly, "
                   "watchful grey eyes, a sharp unfinished jaw, an oversized quilted work jacket with grease at the cuffs, "
                   "his father's cracked black leather wrist pouch worn a size too big on his forearm as his constant identity anchor"),
    "VIK_YOUNG":  ("VIKTOR", "adult 23", "vikyng",
                   "a lean slavic man of twenty-three with fair east-european features, dark ash-brown hair cut short, alert grey eyes, "
                   "a sharp clean-shaven jaw, a black leather jacket one size too big over a plain polo shirt, "
                   "the same cracked black leather wrist pouch on a short strap around his forearm as his constant identity anchor"),
    "VIK_MID":    ("VIKTOR", "adult 41", "vikmid",
                   "a thickset slavic man of forty-one with fair east-european features, dark ash-brown hair going grey at the temples and kept short, "
                   "heavy calm grey eyes, a soft-jawed clean-shaven face, a quilted dark blue gilet over a checked shirt, "
                   "the same cracked black leather wrist pouch, its leather split at one corner, around his wrist as his constant identity anchor"),
    "VIK_ADULT":  ("VIKTOR", "adult 31", "vikad",
                   "a solid slavic man of thirty-one with fair east-european features, the same dark ash-brown hair kept short, "
                   "heavy calm grey eyes, a broad shaved jaw, a worn black leather jacket over a plain dark jumper, "
                   "the same cracked black leather wrist pouch on a short strap around his wrist as his constant identity anchor"),
    "VIK_OLD":    ("VIKTOR", "adult 47", "vikold",
                   "a heavy tired slavic man of forty-seven with fair east-european features, grey bristle cropped close to the skull, "
                   "deep folds beside the mouth, tired grey eyes with loose lower lids, a grey padded work jacket, "
                   "the same black leather wrist pouch rubbed pale grey at the corners as his constant identity anchor"),
    "GENA_BASE":  ("GENA", "adult 58", "genab",
                   "a stocky balding slavic market trader of about sixty with a broad weathered east-european face, a thin ring of grey hair, "
                   "a grey flat eight-panel cap pushed back, a heavy sheepskin-collared coat, small amused eyes in a net of creases, "
                   "an unlit cigarette tucked behind his right ear as his constant identity anchor"),
    "LENA_YOUNG": ("LENA", "adult 22", "lenayng",
                   "a slight slavic woman of twenty-two with fair east-european features, coppery red hair in a blunt chin-length bob, "
                   "pale freckled skin, direct green eyes, a light belted spring coat, "
                   "a flat oval locket on a thin chain at her throat as her constant identity anchor"),
    "LENA_ADULT": ("LENA", "adult 44", "lenaad",
                   "a slavic woman of forty-four with fair east-european features, coppery red hair gone half grey and cropped short, "
                   "a lined freckled face, steady tired green eyes, a dark green knitted cardigan, "
                   "the same flat oval locket on a thin chain at her throat as her constant identity anchor"),
    "DEN_KID":    ("DENIS", "child 9",  "denkid",
                   "a wiry nine-year-old slavic boy with fair east-european features, straw-blond hair with a stubborn cowlick, "
                   "round grey-green eyes, a gap between his front teeth, a puffer gilet over a striped jumper, "
                   "a small red baseball cap worn backwards as his constant identity anchor"),
    "DEN_ADULT":  ("DENIS", "adult 22", "denad",
                   "a broad-shouldered slavic young man of twenty-two with fair east-european features, straw-blond hair cut short, "
                   "calm grey-green eyes, a black canvas work jacket with a folded collar, "
                   "the same red baseball cap, faded and salt-stained, worn backwards as his constant identity anchor"),
    "ANYA_BASE":  ("ANYA", "adult 27", "anyab",
                   "a small slavic woman of twenty-seven with fair east-european features, straight black hair pulled into a high ponytail, "
                   "a round open face, dark attentive eyes, a pale denim jacket over a striped top, "
                   "a small yellow bear-shaped child's rucksack carried in one hand as her constant identity anchor"),
    "IGOR_BASE":  ("IGOR", "adult 50", "igorb",
                   "a dry precise slavic man of fifty with narrow east-european features, silver hair combed straight back, "
                   "a long clean-shaven face, a faded blue technician's coat over a checked shirt, "
                   "narrow reading glasses hanging on a black cord against his chest as his constant identity anchor"),
}

LOCS = {
    "garage_row": ("Гаражный кооператив, бокс №14",
                   "a row of private concrete garage boxes behind a housing estate, corrugated steel up-and-over doors painted in mismatched greens and browns, "
                   "one door open on a deep oily bay with a work light on a hook, a home-welded inspection pit under steel planks, shelves of oil bottles and jam jars of bolts, "
                   "a wall of pinned-up carburettor diagrams gone brown, worn tyres stacked outside against the wall, cracked asphalt with dark oil stains between the boxes, "
                   "an atmosphere of cold hands, radio hiss and other people's cars"),
    "market_old": ("Авторынок ранних лет",
                   "an open-air used-car market on a rutted gravel field, long rows of cars parked nose-out with hand-written cardboard price cards under the wipers, "
                   "sellers' folding stools and thermoses between bumpers, a chain-link perimeter hung with faded triangular bunting, "
                   "a low breeze-block cashier's hut with a queue, puddles skinned with rainbow oil, loudspeaker horns on a leaning pole, "
                   "an atmosphere of haggling breath in cold air and engines started for show"),
    "dealer_lot": ("Своя площадка",
                   "a small commercial used-car lot on a suburban road, two neat rows of polished cars on paving slabs, a strip of coloured plastic bunting on wires overhead, "
                   "a tall printed banner frame by the entrance, floodlights on short masts, a swept tarmac apron with painted parking lines, "
                   "a low hedge and a sliding gate on rollers, a rubber mat at the office door, "
                   "an atmosphere of everything arranged to look reassuring"),
    "office_container": ("Вагончик-офис",
                         "a cramped office inside a site container cabin, a laminate desk with a monitor and a stack of carbon-copy forms, a key cabinet with numbered hooks on the wall, "
                         "a venetian blind over a window looking onto the parked cars, a small electric heater glowing orange under the desk, a wall calendar with pencil circles, "
                         "a kettle and two mismatched mugs on a filing cabinet, an atmosphere of quick paperwork and short conversations"),
    "body_shop":  ("Покрасочный бокс",
                   "a hired body-repair bay with plastic sheeting taped over the doorway, a car shell in grey primer on axle stands, an air compressor throbbing in the corner, "
                   "sanding dust hanging in the beam of a portable lamp, tins of filler and sealant crowding a trestle table, coiled air lines on hooks, "
                   "masking paper crumpled on the floor, an atmosphere of dust, solvent and work that must not be seen"),
    "flat_kitchen": ("Кухня",
                     "a small flat kitchen with an oilcloth-covered table under a low pendant lamp, a gas stove with a dented kettle, a fridge with a child's drawing under a magnet, "
                     "a narrow window over the sink looking into a courtyard, a shelf of tins and a jar of pens, a radiator with a towel across it, "
                     "an atmosphere of late suppers and money counted at the table"),
    "flat_room":  ("Комната",
                   "a modest living room in a panel flat, a folding sofa with a patterned throw, a glass-fronted wall unit with cups and photographs, a rug worn pale down the middle, "
                   "heavy curtains half drawn over a balcony door, a television on a low stand, a child's toy box in the corner, "
                   "an atmosphere of rooms furnished slowly over years"),
    "night_crash_site": ("Место аварии, ночь",
                         "a stretch of two-lane highway at night closed by cones and a flashing beacon, a steel guard rail bent open where a vehicle left the road, "
                         "a shallow grass ditch below the embankment with deep gouges through the turf, wet asphalt throwing back blue and orange light, "
                         "a scatter of glass and plastic trim swept into a heap, a service vehicle parked across the lane with its lamps on, "
                         "an atmosphere of cold air, radio chatter and everything already over"),
    "roadside_day": ("Обочина, тест-драйв",
                     "a wide gravel lay-by beside a suburban road, a low kerb and a strip of dry grass, a bus stop shelter further along with peeling paint, "
                     "poplars in a windbreak behind a wire fence, kilometre markers and a leaning road sign, an open flat horizon of fields beyond, "
                     "an atmosphere of a short drive and a decision about to be made"),
    "expert_bay": ("Бокс автотехнической экспертизы",
                   "an official vehicle-examination bay with white-painted brick walls and bright shadowless strip lighting, a two-post lift with a damaged car raised to chest height, "
                   "a trolley of measuring tools and a camera on a tripod, numbered evidence markers on the floor, a steel bench with parts laid out on paper, "
                   "a clipboard hanging on a nail by the door, an atmosphere of everything being written down"),
    "court_corridor": ("Коридор суда",
                       "a long institutional corridor with pale green walls and a worn linoleum floor, rows of wooden benches against one side, tall doors with small numbered plates, "
                       "a barred window at the far end throwing a grid of light onto the floor, a noticeboard with pinned printed sheets, a radiator under the window, "
                       "an atmosphere of waiting on hard seats"),
    "courtroom":  ("Зал суда",
                   "a small plain courtroom with pale wood panelling, a raised bench with three empty chairs, a low railed enclosure to one side, rows of spectator benches, "
                   "tall windows with half-closed blinds, a table with stacked case folders, a wall clock above the door, "
                   "an atmosphere of a room where sentences are read quietly"),
    "prison_visit": ("Комната свиданий",
                     "a bare visiting room with a long partition of scratched glass in a steel frame, low stools bolted to the floor on both sides, a handset on a short armoured cord, "
                     "pale institutional paint to shoulder height and grey above, a caged ceiling light, a numbered plate screwed above each booth, "
                     "an atmosphere of short measured time"),
    "car_wash":   ("Мойка",
                   "a two-bay hand car wash under a corrugated canopy, wet concrete with a floor drain and dark run-off, coiled pressure hoses on wall reels, "
                   "buckets and long-handled brushes in a rack, a foam of suds sliding across the slope, a strip of grimy plastic curtain in the doorway, "
                   "a price board with sliding plastic digits, an atmosphere of cold water and other people's cars again"),
    "cemetery":   ("Кладбище на склоне",
                   "a small hillside cemetery above a ring road, painted metal fences around modest graves, wild grass between the plots, a few bent elms, "
                   "artificial wreaths faded by seasons, a narrow gravel path with puddles, the road visible far below with slow moving traffic, "
                   "an atmosphere of wind and distance"),
    "dawn_road":  ("Рассветная трасса",
                   "an empty two-lane road at first light crossing flat open country, low mist lying in ribbons over the fields, a wet black surface with a fading centre line, "
                   "a steel guard rail beaded with dew, telegraph poles stepping away to the horizon, a paling sky with one bright planet, "
                   "an atmosphere of cold clean air before the day"),
    "flood_yard": ("Затопленная стоянка",
                   "a flooded parking area after high water, cars standing in brown water to the door handles, a tide line of silt and straw across every panel, "
                   "debris and plastic bottles caught against the wheels, a partly submerged kerb and a drowned hedge, an overcast flat sky, "
                   "an atmosphere of ruined machinery waiting to be bought cheap"),
}

TEMPLATES = [("b1", "char_realcomic_qwen", "car_flipper/comfy/scene_realcomic_qwen_api.json"),
             ("b2", "environment_realcomic_qwen", "car_flipper/comfy/scene_realcomic_qwen_api.json")]
ROUTES = [("b3", "car_flipper_character_ip"), ("b4", "car_flipper_environment")]

SETTINGS = (
    '{"styleLora": {"name": "style\\\\RealComic_2509_base.safetensors"},'
    ' "anchorPipeline": "flux_comic",'
    ' "anchorStyleLora": {"name": "style\\\\Comic_Style_-_FLUX.safetensors", "strengthModel": 0.9, "strengthClip": 0.9},'
    ' "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
)


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cx.autocommit = False
    cur = cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s", (SLUG,))
    if cur.fetchone()[0]:
        print("ABORT: car_flipper exists")
        return
    with open(os.path.join(ROOT, "scripts", "car_flipper_scriptText.md"), encoding="utf-8") as f:
        script = f.read()
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","ttsVoiceoverId","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,%s,'realcomic_qwen','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
                (PROJ, SLUG, NAME, VOICE_REF, VOICE_ID, SETTINGS, script, DEF_NEG, DEF_VNEG, DEF_MOT, DEF_SMOT, NOW, NOW))
    for i, (k, t, o, r) in enumerate(SCENES):
        cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","defaultReferenceProfileCode","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX + "0000000000a%x" % i, PROJ, k, t, o, r, NOW))
    cids = {}
    for n, (code, disp) in enumerate(CHARS.items(), 1):
        cid = PFX + "0000000000c%02x" % n
        cids[code] = cid
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,%s)', (cid, PROJ, code, disp, NOW))
        cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)', (PROJ, cid, NOW))
    for n, (pc, (cc, age, tr, base)) in enumerate(PROFILES.items(), 1):
        cur.execute('INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,0,%s,%s,true,%s)',
                    (PFX + "0000000000d%02x" % n, cids[cc], pc, age, base, tr, NOW))
    for n, (slug, (name, desc)) in enumerate(LOCS.items(), 1):
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX + "000000000e%02x" % n, PROJ, slug, name, desc, NOW, NOW))
    for suf, key, path in TEMPLATES:
        cur.execute('INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle","createdAt") VALUES (%s,%s,%s,%s,%s,%s)',
                    (PFX + "0000000000" + suf, PROJ, key, path, 'realcomic_qwen', NOW))
    for suf, key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)', (PFX + "0000000000" + suf, PROJ, key, NOW))
    for sub in ("comfy", "reference", "tts", "shots", "scenes", "bgm"):
        os.makedirs(os.path.join(ROOT, "data", SLUG, sub), exist_ok=True)
    dst = os.path.join(ROOT, "data", SLUG, "comfy")
    c = 0
    src = os.path.join(ROOT, "data", "trucker", "comfy")
    # distill / fps_interp dropped 2026-07-30: the first was byte-identical to
    # the fast default and never loaded, the second was superseded by the
    # one-pass video_upscale_interp_api.json.
    for fn in ("video_wan22_i2v_api.json", "video_wan22_i2v_cfg_api.json",
               "video_upscale_interp_api.json", "bgm_acestep_api.json"):
        p = os.path.join(src, fn)
        if os.path.exists(p):
            shutil.copyfile(p, os.path.join(dst, fn)); c += 1
    tpl = os.path.join(ROOT, "data", "_templates", "comfy")
    # scene graph = Qwen; anchor graph = FLUX (settings.anchorPipeline='flux_comic')
    for fn in ("scene_realcomic_qwen_api.json", "gen_anchor_portrait_flux_comic_api.json"):
        shutil.copyfile(os.path.join(tpl, fn), os.path.join(dst, fn)); c += 1
    cx.commit()
    print("OK car_flipper scenes=%d chars=%d profiles=%d locs=%d comfy=%d" % (len(SCENES), len(CHARS), len(PROFILES), len(LOCS), c))
    cur.close()
    cx.close()


if __name__ == "__main__":
    main()
