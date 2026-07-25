# -*- coding: utf-8 -*-
"""One-shot creation of the `caregiver` project.
Run: PYTHONIOENCODING=utf-8 python scripts/_seed_caregiver_foundation.py

«ТЫ — Сиделка. И это вся твоя жизнь.» Track B, f5 («Зоя», female).
Scenes on Qwen-Image-Edit-2511 + RealComic (visualStyle=realcomic_qwen);
character ANCHORS on Flux (settings.anchorPipeline='flux_comic').
Nameless country, no currency, no calendar years. ~346 shots ≈ 37 min.
"""
import os, shutil, datetime, psycopg2

PFX = "7e6f0000-0000-4000-8000-"
PROJ = PFX + "000000000001"
SLUG = "caregiver"
NAME = "ТЫ — Сиделка. И это вся твоя жизнь."
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOW = datetime.datetime.now()

DEF_NEG = ("photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, raytraced, "
           "deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, "
           "anime, manga, chibi, kawaii, big shiny eyes, oversaturated color, modern brand logos, cyrillic text, national flags, "
           "currency symbols, banknotes with denominations, graphic violence, blood, gore, corpse, dead body, open coffin, "
           "medical wounds, nudity, character reference sheet, plain studio backdrop, portrait crop")
DEF_VNEG = ("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, "
            "photoreal, photograph, plastic skin, oversmooth, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, "
            "flicker, scene cut, sudden cut, abrupt transition, identity change, anime character appearing, anime girl, manga character, "
            "new people entering frame, extra humans, corpse, dead body")
DEF_MOT = ("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, "
           "no abrupt gestures, sickroom stillness with small life signs, hand-drawn illustration in motion, painterly animation cadence")
DEF_SMOT = ("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, "
            "no handheld shake. Every object remains stationary. No figures moving, only faint dust drifting in the window light. "
            "The entire scene is a still illustration come to life, freeze frame")

VOICE_ID = "1222a8db-a5f6-451a-8968-ee8510d6ebc2"   # «Зоя» (female)
VOICE_REF = "data/_voices/last_shift/voice_reference.mp3"

SCENES = [
    ("cold_open",   "Cold open — девятый день, слесарь меняет замок + CTA",          0, "NAD_END"),
    ("hired",       "Акт 1 — 44 года, сокращение, агентство, первый приход",         1, "NAD_START"),
    ("routine",     "Акт 2 — первый год: тетрадь, семь ячеек, колокольчик",          2, "NAD_START"),
    ("promise",     "Акт 3 — второй год: перелом, ночь в больнице, обещание",        3, "NAD_START"),
    ("daughter",    "Акт 4 — Марине 19, пропущенный день рождения, ссора",           4, "NAD_START"),
    ("deeper",      "Акт 5 — четвёртый год: ты переезжаешь туда совсем",             5, "NAD_MID"),
    ("bell",        "Акт 6 — шестой-седьмой год: двадцать звонков за ночь",          6, "NAD_MID"),
    ("papers",      "Акт 7 — восьмой год: «после Нового года», нотариус не пришёл",  7, "NAD_MID"),
    ("last_winter", "Акт 8 — девятый год: последние недели, чужое имя",              8, "NAD_END"),
    ("farewell",    "Акт 9 — палата, похороны, одиннадцать человек",                 9, "NAD_END"),
    ("will",        "Акт 10 — девятый день: завещание, замок, жестянка",            10, "NAD_END"),
    ("coda",        "Финал — год спустя, другой колокольчик, дисклеймер",           11, "NAD_END"),
]

CHARS = {"NADEZHDA": "Nadezhda", "VALENTINA": "Valentina", "OLEG": "Oleg",
         "MARINA": "Marina", "ZINA": "Zina", "LUDA": "Luda"}

# Ethnicity lives in the POSITIVE promptBase — Qwen defaults to east-asian faces.
PROFILES = {
    "NAD_START": ("NADEZHDA", "adult 44", "nadst",
                  "a solidly built slavic woman of forty-four with fair east-european features, dark ash-brown hair going grey at the "
                  "temples and pulled into a tight low bun, a broad plain face, steady grey eyes, large capable reddened hands, "
                  "a pale grey nursing tunic, a round enamel fob watch pinned above her breast pocket as her constant identity anchor"),
    "NAD_MID":   ("NADEZHDA", "adult 49", "nadmid",
                  "a heavy tired slavic woman of forty-nine with fair east-european features, half-grey hair in the same tight low bun, "
                  "a broad face gone slack under the eyes, patient grey eyes, cracked knuckles, a washed-out grey tunic over a cardigan, "
                  "the same round enamel fob watch pinned above her pocket, its face finely crazed, as her constant identity anchor"),
    "NAD_END":   ("NADEZHDA", "adult 53", "nadend",
                  "a stooped grey-haired slavic woman of fifty-three with fair east-european features, almost entirely grey hair in a low "
                  "loose bun, deep folds from nose to mouth, flat exhausted grey eyes, dry swollen hands, a shapeless grey tunic, "
                  "the same round enamel fob watch pinned above her pocket as her constant identity anchor"),
    "VAL_START": ("VALENTINA", "elderly 79", "valst",
                  "an upright slavic woman of seventy-nine with very fair east-european features, thin white hair set in careful short waves, "
                  "a narrow lined face with sharp pale blue eyes, a cream knitted cardigan buttoned to the throat, a straight guarded posture, "
                  "a thin worn gold wedding band on her finger as her constant identity anchor"),
    "VAL_END":   ("VALENTINA", "elderly 88", "valend",
                  "a very frail slavic woman of eighty-eight with translucent fair skin, sparse white down instead of hair, a shrunken face with "
                  "pale unfocused blue eyes, propped against pillows in a high-buttoned bed jacket, "
                  "the same thin gold wedding band hanging loose on a wasted finger as her constant identity anchor"),
    "OLEG_BASE": ("OLEG", "adult 55", "olegb",
                  "a heavy well-kept slavic man of fifty-five with fair east-european features, iron-grey hair cut short and neat, "
                  "a smooth shaved jowly face, cool light eyes, a dark wool overcoat over a good jumper, "
                  "a wide-braceleted wristwatch he keeps straightening with two fingers as his constant identity anchor"),
    "MAR_YOUNG": ("MARINA", "adult 19", "maryng",
                  "a thin nineteen-year-old slavic girl with fair east-european features, hair bleached to flat platinum and cut short, "
                  "a small sharp face, quick guarded dark eyes, an oversized black hooded sweatshirt, "
                  "large headphones worn permanently around her neck as her constant identity anchor"),
    "MAR_ADULT": ("MARINA", "adult 28", "marad",
                  "a slight slavic woman of twenty-eight with fair east-european features, bleached hair grown out to a dark root and cut "
                  "into a blunt bob, a composed guarded face, dark eyes, a plain grey wool coat, "
                  "the same large headphones around her neck as her constant identity anchor"),
    "ZINA_BASE": ("ZINA", "elderly 70", "zinab",
                  "a broad cheerful slavic woman of seventy with fair east-european features, coppery dyed hair in a tight permanent wave, "
                  "round reddened cheeks, small bright eyes behind glasses on a beaded chain, "
                  "a small-flowered cotton apron she never takes off as her constant identity anchor"),
    "LUDA_BASE": ("LUDA", "adult 47", "ludab",
                  "a wiry olive-skinned slavic woman of forty-seven with dark east-european features, jet-black hair cropped very short, "
                  "a quick lively face with deep laugh lines, dark direct eyes, a bright blue quilted jacket, "
                  "a heavy burgundy canvas shopper bag on one shoulder as her constant identity anchor"),
}

LOCS = {
    "val_room": ("Комната Валентины Степановны",
                 "a small elderly person's bedroom in an old flat, a high iron-framed bed with a white coverlet against the long wall, a bedside cabinet with a "
                 "crocheted doily and a water glass, a dark polished wardrobe with a mirrored door, a wall carpet with a faded geometric pattern above the bed, "
                 "net curtains and heavy dust-coloured drapes over a single window, a folded wheelchair against the skirting, framed photographs crowding a shelf, "
                 "an atmosphere of a room where the same hours repeat"),
    "val_kitchen": ("Кухня в той квартире",
                    "a narrow old flat kitchen with pale green painted walls and a chipped enamel sink, an oilcloth-covered table under a fringed pendant lamp, "
                    "a squat gas stove with a scorched kettle, shelves of mismatched jars and enamel pots, a tin of pills and a cut-glass tumbler on the windowsill, "
                    "a small window over a courtyard with a wire and clothes pegs, an atmosphere of food cooked for one person who eats little"),
    "val_hall": ("Прихожая",
                 "a cramped windowless hallway in an old flat, a coat rack overloaded with outdoor clothes, a shoe box seat with slippers lined up beneath it, "
                 "a dim frosted ceiling light, a wall telephone on a shelf with a notepad beside it, a full-length mirror with a cloudy corner, "
                 "wallpaper worn pale at shoulder height along the passage, an atmosphere of a threshold crossed several thousand times"),
    "stairwell": ("Лестничная площадка",
                  "a concrete stairwell landing in an old apartment block, three padded doors with different upholstery and numbered plates, a window of thick ribbed glass "
                  "on the half-landing, chipped green paint to shoulder height and whitewash above, a metal handrail worn bright, a folded pram under the stairs, "
                  "an atmosphere of a place people only pass through"),
    "courtyard": ("Двор",
                  "an enclosed courtyard between old apartment blocks, a strip of grass with a beaten path across it, two benches by an entrance porch, a rusted carpet-beating "
                  "frame, lines of laundry on a balcony above, poplars grown taller than the roofs, parked cars along a cracked kerb, "
                  "an atmosphere of a place seen from the same window every day"),
    "agency_office": ("Офис агентства по уходу",
                      "a small letting-office style room converted to a care agency, two desks with monitors and stacked printed forms, a laminated price list taped to the wall, "
                      "a row of plastic chairs for waiting, a water cooler with paper cups, a whiteboard ruled into a shift grid, a window blind half down onto the street, "
                      "an atmosphere of arrangements made quickly at a counter"),
    "clinic_corridor": ("Коридор поликлиники",
                        "a long clinic corridor with pale green walls and worn speckled linoleum, a line of joined plastic chairs along one side, numbered consulting-room doors, "
                        "a noticeboard of printed sheets, a radiator under a tall window at the end, a trolley of files parked against the wall, "
                        "an atmosphere of waiting measured in hours"),
    "pharmacy": ("Аптека",
                 "a small neighbourhood pharmacy with a long glass counter over shelved boxes, a lit sign board of handwritten prices, a queue rail, a chair by the door for the "
                 "elderly, ranks of drawers behind the counter with printed labels, a floor of scuffed grey tiles, "
                 "an atmosphere of small precise transactions"),
    "nad_room": ("Твоя комната",
                 "one rented room in a shared flat, a narrow bed made tight with a woollen blanket, a wardrobe with a suitcase on top, a small table with a kettle and a single cup, "
                 "a hotplate on a stool, a window with a plant on the sill and a view of a neighbouring wall, a strip of family photographs tucked into the frame of a mirror, "
                 "an atmosphere of a life kept in one room"),
    "marina_flat": ("Съёмная квартира дочери",
                    "a bare cheaply rented flat belonging to a young person, a mattress on a low frame with a laptop beside it, clothes on an open rail, a folding table with cables and "
                    "cups, unpainted plaster patches on the wall, a window without curtains onto a bright street, a bicycle leaning by the door, "
                    "an atmosphere of somewhere temporary lived in for years"),
    "hospital_ward": ("Больничная палата",
                      "a four-bed hospital ward with high metal beds and pale blue coverlets, an oxygen point and a call button on a cord above each bed, a drip stand, a wipe-clean "
                      "bedside locker with a covered cup, tall windows with slatted blinds, a floor of grey speckled vinyl, a curtain rail with the curtain pushed back, "
                      "an atmosphere of a place where time is kept by rounds"),
    "notary_office": ("Контора нотариуса",
                      "a small notary's office with a heavy desk and a green-shaded lamp, glass-fronted cabinets of bound registers, a stamp press and an ink pad on a felt mat, "
                      "two upright chairs facing the desk, a diploma framed on the wall, a tall window with a half-closed blind, "
                      "an atmosphere of paper that settles things permanently"),
    "cemetery": ("Кладбище",
                 "a flat municipal cemetery in late winter, rows of low painted fences and modest headstones, a gravel path with grey slush along its edges, bare lime trees, "
                 "artificial flowers bleached by weather, a distant chapel roof, an overcast sky pressing low, "
                 "an atmosphere of cold ground and short ceremonies"),
    "winter_yard": ("Двор зимой",
                    "an apartment courtyard under snow, a single trodden path from the porch to the road, snow banked along the kerbs and on the benches, yellow window squares in the "
                    "block opposite, bare poplars against a violet dusk sky, a lamp on a concrete post with snow turning in its cone, "
                    "an atmosphere of a long evening indoors seen from outside"),
    "bus_stop": ("Остановка",
                 "a roadside bus shelter with a scratched plastic canopy and a metal bench, a peeling timetable behind cracked glass, a bin bolted to the post, wet grey asphalt with "
                 "puddles at the kerb, a row of apartment blocks behind a strip of grass, "
                 "an atmosphere of the same twenty minutes every day"),
    "new_flat_room": ("Комната нового подопечного",
                      "another elderly person's bedroom in another old flat, a made bed against the wall, a bedside cabinet with a doily and a glass, a wall clock, a dark sideboard "
                      "with photographs face-out, net curtains over a window with a different view, a walking frame parked by the door, "
                      "an atmosphere of a room that is almost the same room"),
}

TEMPLATES = [("b1", "char_realcomic_qwen", "caregiver/comfy/scene_realcomic_qwen_api.json"),
             ("b2", "environment_realcomic_qwen", "caregiver/comfy/scene_realcomic_qwen_api.json")]
ROUTES = [("b3", "caregiver_character_ip"), ("b4", "caregiver_environment")]

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
        print("ABORT: caregiver exists")
        return
    with open(os.path.join(ROOT, "scripts", "caregiver_scriptText.md"), encoding="utf-8") as f:
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
    src = os.path.join(ROOT, "data", "car_flipper", "comfy")
    for fn in ("video_wan22_i2v_api.json", "video_wan22_i2v_cfg_api.json", "video_wan22_i2v_distill_api.json",
               "video_upscale_interp_api.json", "video_fps_interp_api.json", "bgm_acestep_api.json",
               "scene_realcomic_qwen_api.json", "gen_anchor_portrait_flux_comic_api.json"):
        p = os.path.join(src, fn)
        if os.path.exists(p):
            shutil.copyfile(p, os.path.join(dst, fn)); c += 1
    cx.commit()
    print("OK caregiver scenes=%d chars=%d profiles=%d locs=%d comfy=%d" % (len(SCENES), len(CHARS), len(PROFILES), len(LOCS), c))
    cur.close()
    cx.close()


if __name__ == "__main__":
    main()
