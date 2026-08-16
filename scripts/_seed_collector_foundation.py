# -*- coding: utf-8 -*-
"""One-shot creation of `collector`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_collector_foundation.py
«ТЫ — Коллектор.» Track B, f5 (male «Говночист»), graphic_novel_cell_shaded (Eldritch_Classic_Comics, surrogate look).
~45 min. No cameos."""
import os, datetime, psycopg2
PFX="7e670000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="collector"
NAME="ТЫ — Коллектор. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic violence, blood, gore, nudity")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

VOICE_ID="afbd4824-bf2b-4311-b1e1-e52eb4ed6ad6"  # «Говночист» (male, honeywagon/cloakroom)
VOICE_REF="data/_voices/honeywagon/voice_reference.mp3"

SCENES=[
 ("cold_open","Cold open — 2026: ночная смена, карточка матери + CTA",0,"HERO_OLD"),
 ("origin","Акт 1 — 1998 (10 лет): выносят телевизор, фраза №1",1,"HERO_KID"),
 ("callcenter","Акт 2 — 2008 (20): кризис, гарнитура, первый звонок",2,"HERO_YOUNG"),
 ("talent","Акт 3 — 2010–2012 (23): лучший на этаже, фраза №2 — твоя",3,"HERO_YOUNG"),
 ("field","Акт 4 — 2013–2015 (25–27): выездная группа, стикеры, школа",4,"HERO_MID"),
 ("career","Акт 5 — 2016–2018 (28–30): «Финзащита», Оля, «банк, отдел рисков»",5,"HERO_MID"),
 ("no_return","Акт 6 — 2019 (31): смерть Семёна Ильича, регламент, фраза №3",6,"HERO_MID"),
 ("empire","Акт 7 — 2020–2022 (32–34): 40 операторов, Оля слышит, развод",7,"HERO_MID"),
 ("father","Акт 8 — 2024 (36): похороны отца, переговорный тон",8,"HERO_OLD"),
 ("catastrophe","Акт 9 — 2026 (38): номер матери в выгрузке, записи, фраза №4",9,"HERO_OLD"),
 ("aftermath","Акт 10 — 2026: платёж, дверь на цепочку, увольнение",10,"HERO_OLD"),
 ("coda","Финал — новая дверь матери, глазок, CTA, дисклеймер",11,"HERO_OLD"),
]

CHARS={
 "HERO":"Ты — коллектор",
 "MOM":"Зинаида Петровна — мать",
 "DAD":"Отец",
 "LEATHER":"Человек в кожанке (1998)",
 "IGOR":"Игорь — тимлид колл-центра",
 "OLYA":"Оля — жена",
 "KRIS":"Кристина — лучший оператор",
 "DEBTOR":"Семён Ильич — должник",
}

PROFILES={
 "HERO_KID":("HERO","kid 10","colkid","a thin watchful boy of ten, dark ash-brown hair in a rough home haircut, an oversized grey knitted sweater with stretched sleeves, guarded serious eyes, a boy who watches adults from doorways as his constant manner"),
 "HERO_YOUNG":("HERO","adult 20","colyng","a lean guarded young man of twenty, dark ash-brown hair cropped short, a cheap grey hoodie over a plain collared shirt, wary intent eyes, a worn brass petrol lighter turned in his fingers as his constant identity anchor"),
 "HERO_MID":("HERO","adult 30","colmid","a composed hard man of thirty, dark ash-brown hair neatly cropped, a dark fitted suit with no tie, a controlled unreadable face, a worn brass petrol lighter turned in his fingers as his constant identity anchor"),
 "HERO_OLD":("HERO","adult 38","colold","a heavy-shouldered weary man of thirty-eight, dark ash-brown hair cropped short with grey at the temples, a dark coat over an office shirt, a hollowed controlled face, a worn brass petrol lighter turned in his fingers as his constant identity anchor"),
 "MOM_MID":("MOM","adult 39","colmomm","a kind worn woman of thirty-nine, dark chestnut hair pinned up loosely, a faded floral housedress under a knitted cardigan, gentle anxious eyes, reading glasses on a cord at her chest as her constant identity anchor"),
 "MOM_OLD":("MOM","adult 67","colmomo","a small grey-haired woman of sixty-seven, thin silver hair in a neat low bun, a knitted beige cardigan, a soft lined patient face, reading glasses on a cord at her chest as her constant identity anchor"),
 "DAD_BASE":("DAD","adult 42","coldad","a broad balding man of forty-two, a worn checkered work shirt with rolled sleeves, heavy tired working hands, an open defeated face, a leather-strap wristwatch with a cracked strap as his constant identity anchor"),
 "LEATHER_BASE":("LEATHER","adult 35","colleather","a heavy-set impassive man of thirty-five in a black leather jacket, short black hair, a thick neck, a flat unhurried stare, a heavy gold signet ring on his right hand as his constant identity anchor"),
 "IGOR_BASE":("IGOR","adult 35","coligor","a brisk wiry team leader of thirty-five, a clean-shaven head, a striped office shirt with rolled sleeves and a loosened tie, a quick salesman grin, a chunky gold-tone digital watch as his constant identity anchor"),
 "OLYA_BASE":("OLYA","adult 26","cololya","a warm pretty woman of twenty-six, long copper-red wavy hair, light freckles, simple tasteful clothes, large thin hoop earrings as her constant identity anchor"),
 "KRIS_BASE":("KRIS","adult 24","colkris","a poised young call-center operator of twenty-four, a sleek jet-black bob, a black headset with a thin microphone boom, neat dark office wear, glossy violet nail polish as her constant identity anchor"),
 "DEBTOR_BASE":("DEBTOR","adult 56","coldebt","a stooped mild man of fifty-six, thinning combed-back grey hair and grey stubble, a shabby brown cardigan over a checked shirt, frightened gentle eyes, thick old-fashioned glasses with a taped hinge as his constant identity anchor"),
}

LOCS={
 "flat_98":("Квартира детства (1998)","a small worn nineteen-nineties flat, faded striped wallpaper, a bulky old tube television in a wooden cabinet corner, a sagging sofa with a crocheted throw, a wall carpet, a low table with folded newspapers, thin curtains over a window onto grey panel blocks, warm dim bulb light, the settled tired coziness of a poor family holding together"),
 "street_90s":("Улица 90-х","a provincial street of the late nineteen-nineties, low panel apartment blocks, a battered metal kiosk with a small barred window, sagging overhead wires, cracked asphalt with puddles, a rusting parked sedan, bare poplar trees, flat grey daylight, an atmosphere of scarcity and waiting"),
 "mom_flat":("Кухня матери","a small aging kitchen warm with yellow lamplight, a plastic-topped table with an oilcloth, a humming old refrigerator with magnets, lace curtains, a cuckoo-style wall clock, a shelf of enamel pots and a tin of tea, a radio on the windowsill, everything clean and mended many times, the deep worn warmth of a mother's home"),
 "mom_stairwell":("Подъезд матери","a dim residential stairwell, chipped pale-green painted walls, a flight of concrete steps with a worn steel handrail, mailboxes with peeling numbers, a single caged bulb, a dark padded apartment door with a round brass peephole and a new steel chain, cold echoing stillness"),
 "callcenter":("Колл-центр (2008)","a cramped low-ceiling call center of the late two-thousands, rows of narrow desks split by grey fabric dividers, bulky monitors and corded headsets, a whiteboard leaderboard with names and sums in marker, harsh fluorescent tubes, coats on chair backs, paper cups, the pressured hum of many voices selling fear"),
 "openspace":("Опенспейс «Финзащиты»","a large modern collections-agency open-plan office at night, long ranks of identical desks with twin monitors glowing blue, ergonomic chairs, glass partitions, a wall-mounted dashboard screen of graphs, ceiling panels dimmed to night mode, one row of desks still lit, the cold institutional quiet of an office that never fully sleeps"),
 "boss_office":("Кабинет начальника","a glass-walled manager's office raised above an open-plan call floor, a wide dark desk with twin monitors and a docked phone, a leather chair, framed corporate certificates, blinds half-closed over the glass wall, the muffled murmur of the floor below, cold status and isolation in one room"),
 "meeting_room":("Переговорка с KPI-доской","a corporate meeting room with a long pale table and black chairs, a wall whiteboard dense with columns of figures and arrows, a flat screen showing a bar chart, glass door to a corridor, cold even panel light, the airless atmosphere of quotas being set"),
 "stairwell":("Подъезд должников","a shabby residential stairwell of a debtor's building, scuffed grey-blue walls with scrawled marks, a battered steel apartment door with a garish yellow notice sticker across the seam, a broken mailbox hanging open, a flickering bulb, a small window onto a courtyard, the tense hush of a door nobody wants to open"),
 "hero_flat":("Его квартира","a tidy modern apartment with cool grey walls, a large leather sofa, a wall-mounted television, a glass coffee table kept empty, built-in white kitchen gleaming and barely used, floor-to-ceiling windows over night city lights, recessed cold-white lighting, expensive order with no warmth in it"),
 "car":("Салон Camry","the interior of a clean dark business sedan, smooth leather seats, a tidy dashboard with a soft-glowing display, a rear-view mirror framing the driver's eyes, city lights sliding across the windshield glass, a suit jacket on the passenger seat, an enclosed hush insulated from the street"),
 "school_gate":("Школьный двор","a school front yard seen from across the street through a wrought-iron fence, a three-story brick school building with tall windows, a paved yard with painted lines, small trees along the fence, empty swings to one side, flat morning light, an ordinary place that should be safe from grown-up business"),
 "cemetery":("Кладбище","a quiet town cemetery among thin birches, rows of modest fenced plots, gravel paths dusted with leaves, an older section with faded plastic wreaths, one plot with fresh dark earth and a temporary metal marker, later a polished dark granite headstone, low grey sky, the flat hush of endings"),
 "mfo_point":("Точка микрозаймов","a small microloan storefront squeezed between shops, a garish glowing sign band, posters with huge percent figures and exclamation marks in the window, a narrow counter behind thick glass, a cheap plastic chair, a wall-mounted rate board, buzzing tube light spilling onto wet pavement, cheerful colors over a cold trap"),
 "workshop_van":("Фургон установщика дверей","the open rear of a small workman's van packed with racked tools, a new steel apartment door in protective film leaning inside, boxes of locks and hinges, a drill case and coiled extension cords, a folded work jacket, daylight falling into the cargo shadow, the plain honest order of manual work"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: collector exists"); return
    with open(os.path.join(ROOT,"scripts","collector_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Eldritch_Classic_Comics_1.1.5.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","ttsVoiceoverId","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,VOICE_REF,VOICE_ID,settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
    for i,(k,t,o,r) in enumerate(SCENES):
        cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","defaultReferenceProfileCode","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000a%x"%i,PROJ,k,t,o,r,NOW))
    cids={}
    for n,(code,disp) in enumerate(CHARS.items(),1):
        cid=PFX+"0000000000c%02x"%n; cids[code]=cid
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,%s)',(cid,PROJ,code,disp,NOW))
        cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)',(PROJ,cid,NOW))
    for n,(pc,(cc,age,tr,base)) in enumerate(PROFILES.items(),1):
        cur.execute('INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,0,%s,%s,true,%s)',
                    (PFX+"0000000000d%02x"%n,cids[cc],pc,age,base,tr,NOW))
    for n,(slug,(name,desc)) in enumerate(LOCS.items(),1):
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX+"000000000e%02x"%n,PROJ,slug,name,desc,NOW,NOW))
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","collector",sub),exist_ok=True)
    cx.commit()
    print("OK collector scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
