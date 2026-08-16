# -*- coding: utf-8 -*-
"""One-shot creation of the `layoff` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_layoff_foundation.py
«ТЫ — Уволенный. И это вся твоя жизнь.» Track B, f5, graphic_novel_flux (Flux comic / Eldritch LoRA).
Nameless big city, present day, currency: rubles. ~20 min target. No cameos.
"""
import os, datetime, psycopg2
PFX="7e610000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="layoff"
NAME="ТЫ — Уволенный. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — стеклянная переговорка + CTA",0,"GEROY_MAIN"),
 ("origin","Акт 1 — первый день, первый писк турникета (24)",1,"GEROY_YOUNG"),
 ("climb","Акт 2 — 19 лет: ты стал должностью",2,"GEROY_MAIN"),
 ("signs","Акт 3 — Палыча убрали, слухи, молодой сменщик",3,"GEROY_MAIN"),
 ("turn","Акт 4 — точка невозврата (остался из лояльности)",4,"GEROY_MAIN"),
 ("catastrophe","Акт 5 — переговорка: карта мертва, коробка",5,"GEROY_MAIN"),
 ("aftermath","Акт 6 — пустые будни, центр занятости, ящик",6,"GEROY_MAIN"),
 ("coda","Финал — 4-я стена, кода, дисклеймер",7,"GEROY_MAIN"),
]

CHARS={
 "GEROY":"Герой (ты)",
 "ELYA":"Эля (HR-оптимизатор)",
 "BOSS":"Босс (рук. отдела)",
 "PALYCH":"Палыч (старший коллега)",
 "WIFE":"Жена",
 "REPL":"Молодой сменщик",
}

PROFILES={
 "GEROY_YOUNG":("GEROY","adult 24","g3royyng","a lean hopeful young man of twenty-four, dark neatly combed hair, bright eager eyes, a plain pressed office shirt, a plastic employee access card on a blue lanyard at his chest as his constant identity anchor"),
 "GEROY_MAIN":("GEROY","adult 44","g3roymid","a tired man of forty-four, dark hair greying at the temples, a worn weary lined face, a grey knit sweater under a plain jacket, a plastic employee access card on a blue lanyard at his chest as his constant identity anchor"),
 "ELYA_BASE":("ELYA","adult 29","3lyahr","a cool composed woman of twenty-nine, sleek golden-blonde bob, a neutral corporate face, a fitted dark blazer, always holding a slim tablet flat against her chest as her constant identity anchor"),
 "BOSS_BASE":("BOSS","adult 52","b0ssdep","a heavyset balding man of fifty-two, rolled-up shirt sleeves, a tired heavy lined face, a chunky old steel wristwatch on his left wrist as his constant identity anchor"),
 "PALYCH_BASE":("PALYCH","adult 58","p4lych","a kindly older man of fifty-eight, a grey moustache, thinning grey hair, a brown cardigan, always carrying a battered steel vacuum thermos as his constant identity anchor"),
 "WIFE_BASE":("WIFE","adult 41","w1felay","a warm worried woman of forty-one, dark auburn shoulder-length hair, a gentle careworn face, a thin silver chain at her neck as her constant identity anchor"),
 "REPL_BASE":("REPL","adult 25","r3plyng","a confident young man of twenty-five, a fashionable undercut haircut, white wireless earbuds in his ears as his constant identity anchor, a casual modern untucked shirt"),
}

LOCS={
 "glass_meeting":("Стеклянная переговорка","a small modern glass-walled corporate meeting room, a pale oval table, four ergonomic chairs, a wall-mounted dark screen, a frosted-glass door, the open-plan office blurred grey beyond the glass, cold even ceiling light, a single closed folder and a pen on the table, an atmosphere of quiet dread"),
 "your_desk":("Твой стол (опенспейс)","a personal cubicle workstation in an open-plan office, a worn office chair, dual monitors, a keyboard, a chipped favourite mug, a small framed family photo, a paper desk calendar, sticky notes on the monitor edge, a grey partition wall, flat fluorescent light, the lived-in clutter of nineteen years at one desk"),
 "turnstile_lobby":("Турникеты в лобби","the ground-floor lobby of a corporate office tower, a row of waist-high glass turnstiles with small card readers glowing faint green, a polished stone floor, a reception desk beyond, tall glass doors to the street, a wall bearing the blurred shapes of a company sign, cold morning light, an atmosphere of routine arrival"),
 "open_floor":("Опенспейс-этаж","a large open-plan office floor, long rows of identical desks with monitors and low partitions, grey carpet tiles, a suspended grid ceiling of fluorescent panels, a small kitchenette corner far off, tall tinted windows along one wall, the flat hum of corporate sameness"),
 "hr_office":("Кабинет HR","a small neutral human-resources office, a clean desk with a closed laptop, two facing chairs, a potted plant, a shelf of identical binders, a framed motivational print on the wall, a window with half-closed blinds, sterile impersonal light"),
 "home_kitchen":("Кухня квартиры","a modest apartment kitchen, a small table for two by the window, laminate cupboards, an electric kettle, two mugs on a rack, a fridge with a few magnets, a drawer left slightly open, soft domestic morning light through a thin curtain, an everyday lived-in warmth"),
 "home_hallway":("Прихожая квартиры","a narrow apartment entry hallway, a low shoe rack, a coat hook with one jacket, a mirror beside the door, a small key bowl on a shelf, slippers on the floor, dim warm light, the quiet of early morning before leaving for work"),
 "street_tower":("Улица у бизнес-башни","a city street at the foot of a tall glass office tower, a wide pavement, a pedestrian crossing, bare trees in metal grates, the blurred shapes of other commuters, a grey overcast sky mirrored in the glass facade, the cold flat light of a working-day morning"),
 "job_center":("Центр занятости","a drab municipal employment office, rows of moulded plastic waiting chairs, a numbered ticket dispenser, a counter with glass partitions, faded informational posters, worn grey linoleum, harsh strip lighting, an atmosphere of stalled time and quiet humiliation"),
 "bedroom_night":("Спальня ночью","a small bedroom at night, an unmade bed, a bedside lamp casting a low pool of warm light, a plain wardrobe, a window with the cold blue glow of the city and the lit windows of a distant office tower, deep restless shadow"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: layoff exists"); return
    with open(os.path.join(ROOT,"scripts","layoff_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Eldritch_Classic_Comics_1.1.5.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_flux','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/layoff/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","layoff",sub),exist_ok=True)
    cx.commit()
    print("OK layoff scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
