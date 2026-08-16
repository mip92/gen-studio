# -*- coding: utf-8 -*-
"""One-shot creation of `webcam`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_webcam_foundation.py
«ТЫ — Вебкам-модель.» Track B, f5 (female), graphic_novel_cell_shaded (Graphic_Novel_Illustration, neon glow).
Nameless country, no currency. Clean on screen. ~35 min. No cameos."""
import os, datetime, psycopg2
PFX="7e650000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="webcam"
NAME="ТЫ — Вебкам-модель. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated skin, modern brand logos, readable license plates, cyrillic text, readable screen text, national flags, currency symbols, banknotes with denominations, nudity, explicit content, nsfw")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans, nudity, explicit")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting haze. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — 34, лампа гаснет, дочь за стеной + CTA",0,"HERO_OLD"),
 ("origin","Акт 1 — 19: быстрые деньги, первый стрим, лампа, чокер",1,"HERO_YOUNG"),
 ("first_money","Акт 2 — 20: ник Алиса, двойная жизнь, правила Риты",2,"HERO_YOUNG"),
 ("ascent","Акт 3 — 22-25: топ-модель, фанаты, донатор Король",3,"HERO_MID"),
 ("daughter","Акт 4 — 26: рождается Лиза, парень уходит",4,"HERO_MID"),
 ("the_cost","Акт 5 — 27: игра в близость, процент Стаса, не остановиться",5,"HERO_MID"),
 ("donator","Акт 6 — 28: Король звереет, сталкинг",6,"HERO_MID"),
 ("aging","Акт 7 — 30-32: младшие, охваты падают, на большее",7,"HERO_MID"),
 ("podruga","Акт 8 — 32: Рита ломается, зеркало",8,"HERO_MID"),
 ("exposed","Акт 9 — 33: дочь находит стримы, крах двойной жизни",9,"HERO_OLD"),
 ("aftermath","Акт 10 — 34: списана, фанаты ушли, дочь стыдится",10,"HERO_OLD"),
 ("coda","Финал — лампа гаснет, CTA, дисклеймер",11,"HERO_OLD"),
]

CHARS={
 "HERO":"Настя / «Алиса» (ты)",
 "DAU":"Лиза — твоя дочь",
 "MOTHER":"Мать",
 "DONATOR":"«Король» — донатор",
 "PODRUGA":"Рита — коллега",
 "MANAGER":"Стас — менеджер студии",
}

PROFILES={
 "HERO_YOUNG":("HERO","adult 19","webyng","a pretty girl of nineteen with dyed platinum-blonde hair, wide bright eyes, cheap trendy clothes, a small star tattoo behind her right ear as her constant identity anchor"),
 "HERO_MID":("HERO","adult 27","webmid","a polished young woman of twenty-seven with platinum-blonde hair, a camera-ready made-up face, fashionable clothes, a small star tattoo behind her right ear as her constant identity anchor"),
 "HERO_OLD":("HERO","adult 34","webold","a tired woman of thirty-four with platinum-blonde hair showing dark roots, faint fine lines, a made-up but weary face, a small star tattoo behind her right ear as her constant identity anchor"),
 "DAU_CHILD":("DAU","kid 5","dau5","a small brown-haired girl of about five, bright and oblivious, a little dress, a plush toy rabbit clutched to her chest as her constant identity anchor"),
 "DAU_TEEN":("DAU","teen 15","dau15","a guarded brown-haired girl of fifteen, a school hoodie, wary hurt eyes, a worn plush toy rabbit kept near her as her constant identity anchor"),
 "MOTHER_BASE":("MOTHER","adult 58","wmomb","a plain worn woman of fifty-eight, grey hair under a headscarf, reading glasses on a cord, a faded cardigan as her constant identity anchor"),
 "DONATOR_BASE":("DONATOR","adult 50","donb","a lonely balding man in his fifties, thin grey hair, glasses, a rumpled shirt, headphones around his neck in the blue glow of a monitor as his constant identity anchor"),
 "PODRUGA_BASE":("PODRUGA","adult 30","podb","a sharp jaded woman of thirty with a jet-black bob, heavy makeup, a silk robe, a vape pen in her hand as her constant identity anchor"),
 "MANAGER_BASE":("MANAGER","adult 40","manb","a slick businesslike man of forty with dark slicked-back hair, a headset, a fitted shirt, a phone always in his hand as his constant identity anchor"),
}

LOCS={
 "stream_room":("Стрим-комната","a small streaming bedroom lit by a large ring light and coloured LED strips, a bed with a soft backdrop of fabric and fairy lights, a desk with a monitor glowing, a webcam on a tripod, plush toys and cosmetics, saturated magenta and cyan glow, a warm-but-lonely staged intimacy"),
 "poor_flat":("Дешёвая квартира","a cramped cheap student flat, a narrow bed and a second-hand desk, peeling paint, a small window over grey blocks, clothes on a chair, a kettle, dim ordinary light, the thin threadbare feel of getting by on nothing"),
 "own_apartment":("Своя квартира","a nicer modern rented apartment bought with the new money, sleek furniture, soft mood lighting, a large screen, tidy expensive gadgets, tall windows over a lit city, a cool comfortable emptiness with little that is personal"),
 "kitchen_home":("Домашняя кухня","an ordinary home kitchen in daytime, a small table with a child's cup and drawings, a fridge with magnets, a window over a courtyard, a kettle and plain dishes, warm normal domestic light, the real life kept far from the ring light"),
 "mother_home":("Дом матери","a modest older woman's flat, floral wallpaper, a glass cabinet of keepsakes, a covered sofa, framed photos, lace curtains, a television, warm dated domestic light, the settled ordinary world of a mother who knows nothing"),
 "studio_office":("Офис студии","a cam-studio back office, banks of monitors glowing with dashboards and graphs, a mixing desk, ring lights on stands, cables, a swivel chair, cold blue screen light, an atmosphere of a business built on attention and numbers"),
 "city_street_neon":("Неоновая улица","a wet neon city street at night, glowing signs in magenta and cyan reflected in puddles, tall dark buildings, blurred distant lights, a lonely late-hour glow with almost nobody about"),
 "donator_room":("Комната донатора","a lonely man's dim apartment, a single desk with a large monitor casting blue light, an unmade bed, takeaway boxes, a wall oddly bare, headphones and a keyboard, the airless glow of a life lived through a screen"),
 "club_bar":("Бар","a dim stylish late-night bar, neon bottle shelves, a lacquered counter, coloured downlights, low booths, a mirrored wall, a moody after-hours glow of the people who work the night economy"),
 "school_gate":("Школьные ворота","an ordinary school gate and yard in daytime, a low fence, a noticeboard, bare trees, parents' cars at the kerb, plain overcast light, the exposed public world where two lives can collide"),
 "bedroom_dark":("Тёмная спальня","a dark bedroom at night lit only by a phone or a dead monitor, rumpled bedding, clothes on the floor, a mirror catching faint light, heavy shadow, the hollow quiet of the hours after the stream ends"),
 "cafe_public":("Кафе","an ordinary daytime cafe, small tables and a counter, a window onto the street, other patrons blurred, warm neutral light, the public everyday place where a stranger's stare can turn everything cold"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: webcam exists"); return
    with open(os.path.join(ROOT,"scripts","webcam_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Graphic_Novel_Illustration-000007.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/webcam/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","webcam",sub),exist_ok=True)
    cx.commit()
    print("OK webcam scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
