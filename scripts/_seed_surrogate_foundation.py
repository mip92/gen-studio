# -*- coding: utf-8 -*-
"""One-shot creation of `surrogate`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_surrogate_foundation.py
«ТЫ — Суррогатная мать.» Track B, f5 (female), graphic_novel_cell_shaded (Eldritch_Classic_Comics).
Nameless country, no currency named. ~35 min. No cameos."""
import os, datetime, psycopg2
PFX="7e640000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="surrogate"
NAME="ТЫ — Суррогатная мать. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic surgery, blood, gore, nudity")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — 46, коробка с браслетами, чужой плач + CTA",0,"HERO_OLD"),
 ("origin","Акт 1 — 28: бедность, операция Мише, объявление, координатор",1,"HERO_YOUNG"),
 ("first_contract","Акт 2 — 28: договор, клиника, беременность",2,"HERO_YOUNG"),
 ("first_birth","Акт 3 — 29: роды, первый браслет, передача, операция Миши",3,"HERO_YOUNG"),
 ("husband","Акт 4 — 29-30: Толя пьёт и уходит",4,"HERO_YOUNG"),
 ("second","Акт 5 — 32: долги, вторая беременность и передача",5,"HERO_MID"),
 ("bond","Акт 6 — 33: тайная арифметика, цена для тела",6,"HERO_MID"),
 ("third","Акт 7 — 35: Инна давит, третий договор",7,"HERO_MID"),
 ("third_birth","Акт 8 — 36: третьи роды, держишь дольше, ломается",8,"HERO_MID"),
 ("barren","Акт 9 — 37: своего уже не выносишь",9,"HERO_MID"),
 ("son","Акт 10 — 46: Миша вырос, узнаёт правду, отдаляется",10,"HERO_OLD"),
 ("coda","Финал — три браслета и пинетки, CTA, дисклеймер",11,"HERO_OLD"),
]

CHARS={
 "HERO":"Оля (ты) — суррогатная мать",
 "SON":"Миша — твой сын",
 "MUZH":"Толя — муж",
 "COORD":"Инна Сергеевна — координатор",
 "RICHW":"Заказчица",
}

PROFILES={
 "HERO_YOUNG":("HERO","adult 28","hero28","a tired kind ordinary woman of twenty-eight, chestnut-brown hair in a plain low ponytail, soft worried eyes, plain cheap clothes, a small plain tin locket on a cord at her throat as her constant identity anchor"),
 "HERO_MID":("HERO","adult 35","hero35","a worn woman of thirty-five, the same chestnut-brown hair in a ponytail now with a few grey strands, a tired gentle lined face, plain modest clothes, a small plain tin locket on a cord at her throat as her constant identity anchor"),
 "HERO_OLD":("HERO","adult 46","hero46","an aged tired woman of forty-six, chestnut-brown hair going grey pulled back, a lined gentle face, plain worn clothes, a small plain tin locket on a cord at her throat as her constant identity anchor"),
 "SON_CHILD":("SON","kid 6","son6","a small fair-haired boy of about six, pale and often unwell, light tousled hair, a plain little knitted jumper, clutching a small red toy car as his constant identity anchor"),
 "SON_ADULT":("SON","adult 22","son22","a lean guarded young man of twenty-two, dark brown hair, a plain jacket, wary tired eyes, a small red toy car kept in his hand as his constant identity anchor"),
 "MUZH_BASE":("MUZH","adult 32","muzhsur","a thin weak-jawed man of thirty-two, short buzz-cut hair, a stubbled uneasy face, a cheap tracksuit jacket, a cigarette tucked behind his ear as his constant identity anchor"),
 "COORD_BASE":("COORD","adult 45","coordb","a sleek businesslike woman of forty-five, a neat silver-blonde bob, a cool professional face, a tidy dark blazer, a lanyard ID card and a tablet held to her chest as her constant identity anchor"),
 "RICHW_BASE":("RICHW","adult 38","richw","an elegant well-off intended mother of thirty-eight, a glossy black chignon, a refined anxious face, expensive soft clothing, a fine pale silk scarf as her constant identity anchor"),
}

LOCS={
 "poor_flat":("Бедная квартира","a small poor rented flat, worn linoleum and faded wallpaper, a sagging sofa, a child's toys in one corner, a low table with unpaid papers, a single window over grey apartment blocks, mismatched cheap furniture, warm but threadbare domestic light, the settled feel of getting by on too little"),
 "clinic_room":("Кабинет клиники","a private fertility clinic consultation room, a clean examination couch under soft light, a desk with a monitor and folders, pale walls with framed medical diagrams, a potted plant, cool clinical brightness softened by warm lamps, an air of quiet expensive procedure"),
 "clinic_corridor":("Коридор клиники","a private clinic corridor, pale clean walls, soft recessed lighting, a row of empty upholstered chairs, closed white doors with small numbers, a frosted-glass partition, an antiseptic hushed stillness"),
 "maternity_ward":("Родильное отделение","a maternity ward corridor and delivery-room doorway, pale green walls, a row of empty gurneys, soft overhead light, a hand-sanitizer stand, a closed swing door with a small round window, the hushed charged air of new births and quick partings"),
 "coordinator_office":("Офис агентства","a tidy surrogacy agency office, a glass-topped desk with a laptop and neat stacked contracts, two client chairs, framed certificates, a shelf of ring binders, a wide window over the city, a cool corporate stillness with soft daylight"),
 "rich_home":("Дом заказчиков","a spacious wealthy family home, a bright nursery half-visible through a doorway with a new white crib, soft expensive furnishings, tall windows and pale drapes, warm well-off light, an atmosphere of comfort waiting to be filled"),
 "hospital_room":("Палата","a plain post-natal hospital room, a single narrow bed with white linen, a bedside cabinet, a window with thin curtains, a jug of water and a paper cup, pale walls, tired recovery light, an empty stillness where a cradle should be"),
 "small_town_street":("Улица посёлка","a poor small-town street of low grey buildings, cracked pavements and bare trees, a shuttered kiosk, overhead wires, puddles reflecting a flat sky, weak provincial daylight, an atmosphere of a place people leave"),
 "kitchen_night":("Кухня ночью","a small poor kitchen at night, a single low bulb over a plastic-topped table, a kettle, chipped mugs, a calendar on the wall, dark windows, a child's drawing taped to a cupboard, deep quiet shadow and one warm pool of light"),
 "playground":("Детская площадка","a shabby residential courtyard playground, a rusted swing set and a small slide, a chipped bench, low bushes, panel apartment blocks behind, patchy grass, soft overcast light, an ordinary tired neighbourhood stillness"),
 "transit_car":("Салон машины","the interior of an ordinary car seen from within, worn cloth seats, a rear child seat, a rear-view mirror, city streets sliding past the windows, flat daylight through the glass, a confined quiet space of leaving and arriving"),
 "doctor_office_bad":("Кабинет врача (диагноз)","a sober doctor's office, a desk with an open folder and scan images clipped to a lightbox, two chairs, pale walls, a small window with half-closed blinds, cold even light, the heavy stillness of bad news about to be spoken"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: surrogate exists"); return
    with open(os.path.join(ROOT,"scripts","surrogate_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Eldritch_Classic_Comics_1.1.5.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/surrogate/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","surrogate",sub),exist_ok=True)
    cx.commit()
    print("OK surrogate scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
