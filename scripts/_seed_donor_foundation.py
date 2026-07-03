# -*- coding: utf-8 -*-
"""One-shot creation of `donor`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_donor_foundation.py
«ТЫ — Донор.» Track B, f5 (female), graphic_novel_cell_shaded (EldritchComicsXL1.2, cool clinical).
Nameless country, no currency named. ~35 min. No cameos."""
import os, shutil, datetime, psycopg2
PFX="7e660000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="donor"
NAME="ТЫ — Донор. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic surgery, blood, gore, nudity, needles in flesh")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — 48, банка с номерками, фото незнакомки + CTA",0,"NIKA_OLD"),
 ("origin","Акт 1 — 21: студентка без денег, объявление, клиника, Марта",1,"NIKA_YOUNG"),
 ("first_cycle","Акт 2 — 21: стимуляция, забор, первая выплата, первый номерок",2,"NIKA_YOUNG"),
 ("easy_money","Акт 3 — 22-24: снова и снова, платят лучше работы, счёт растёт",3,"NIKA_YOUNG"),
 ("limit","Акт 4 — 25: лимит циклов, обход по другим клиникам, десятки",4,"NIKA_MID"),
 ("anton","Акт 5 — 30: Антон, хочет семью, она тайком донорит",5,"NIKA_MID"),
 ("trying","Акт 6 — 31-32: пытаются завести своего, не выходит, страх",6,"NIKA_MID"),
 ("diagnosis","Акт 7 — 33: диагноз, ранний климакс, Антон уходит",7,"NIKA_MID"),
 ("count","Акт 8 — 35: одна, считает номерки, сорок с лишним, гул крио",8,"NIKA_MID"),
 ("dna_era","Акт 9 — 40-46: ДНК-эра, анонимность рушится, страх",9,"NIKA_OLD"),
 ("dasha","Акт 10 — 48: Даша находит её, десятки сиблингов, её лицо",10,"NIKA_OLD"),
 ("coda","Финал — банка, фото Даши, CTA, дисклеймер",11,"NIKA_OLD"),
]

CHARS={
 "NIKA":"Ника (ты) — донор яйцеклеток",
 "DASHA":"Даша — дочь-незнакомка",
 "MARTA":"Марта Львовна — координатор клиники",
 "ANTON":"Антон — её мужчина",
 "VRACH":"Врач-репродуктолог",
}

PROFILES={
 "NIKA_YOUNG":("NIKA","adult 21","nika21","a slight ordinary young woman of twenty-one, ash-blonde hair in a short bob, pale blue eyes, plain cheap student clothes, a small pale-blue enamel forget-me-not brooch pinned at her collar as her constant identity anchor"),
 "NIKA_MID":("NIKA","adult 30","nika30","a composed woman of thirty, the same ash-blonde bob a little longer, pale blue eyes, neat modest clothes, a small pale-blue enamel forget-me-not brooch at her collar as her constant identity anchor"),
 "NIKA_OLD":("NIKA","adult 48","nika48","an aged tired woman of forty-eight, ash-blonde bob going grey, pale blue eyes with fine lines, plain worn clothes, a small pale-blue enamel forget-me-not brooch at her collar as her constant identity anchor"),
 "DASHA_BASE":("DASHA","adult 19","dasha19","a bright searching young woman of nineteen, auburn curly hair to the shoulders, the same pale blue eyes as the heroine, a plain zipped jacket, holding a yellow paper envelope of DNA printouts as her constant identity anchor"),
 "MARTA_BASE":("MARTA","adult 50","martab","a sleek businesslike woman of fifty, a tight steel-grey chignon, a cool composed face, a tidy dark blazer, rimless glasses on a fine beaded chain and a tablet held to her chest as her constant identity anchor"),
 "ANTON_BASE":("ANTON","adult 35","antonb","a warm solid man of thirty-five, dark cropped hair, an open kind stubbled face, a plain knit jumper, a chipped blue enamel camping mug always in his hand as his constant identity anchor"),
 "VRACH_BASE":("VRACH","adult 55","vrachb","a grave doctor of fifty-five, short grey hair and a trimmed grey beard, half-moon reading glasses low on the nose, a white clinical coat as his constant identity anchor"),
}

LOCS={
 "student_dorm":("Комната в общежитии","a cramped shared student dormitory room, two narrow iron beds, a scarred desk under a bare window, cheap shelves of textbooks, a kettle and instant-coffee jars, thin curtains, cracked lino, cold weak daylight, the pinched atmosphere of getting by on nothing"),
 "clinic_consult":("Кабинет клиники","a private fertility clinic consultation room, a clean examination couch under cold recessed light, a desk with a monitor and folders, pale walls with framed anatomical diagrams, a potted plant, sterile clinical brightness with a faint blue cast, an air of expensive quiet procedure"),
 "clinic_procedure":("Процедурная","a clean clinical procedure room, a reclined padded couch under a bright cold overhead lamp, a monitor on a stand, a covered instrument tray, pale tiled walls, a closed door, an antiseptic hush, no medical explicitness, cool sterile blue-white light"),
 "clinic_corridor":("Коридор клиники","a private clinic corridor, pale clean walls, cold recessed lighting, a row of empty upholstered chairs, closed white doors with small numbers, a frosted-glass partition, an antiseptic hushed stillness with a faint blue cast"),
 "cryo_lab":("Крио-хранилище","a cryogenic storage laboratory, tall steel cryo-tanks and a wall of frosted numbered glass vials in cold blue light, wisps of vapour drifting low, a digital temperature readout, stainless surfaces, a deep humming cold, a clinical inhuman stillness"),
 "recruiter_office":("Офис вербовщика","a glossy corporate recruitment office, a wide glass desk with a laptop and neat stacked folders, two client chairs, framed certificates, a shelf of ring binders, a wide window over an indifferent city, cool polished stillness and flat daylight"),
 "nika_flat":("Квартира Ники","a decent modest city flat of her thirties, a small sofa and a low table, a shelf of books, a compact kitchen corner, framed pictures, a window over the city, ordinary settled domestic light with a cool cast, the feel of a normal life being built"),
 "kitchen_night":("Кухня ночью","a small city kitchen at night, a single low bulb over a plain table, a kettle, a few mugs, a calendar on the wall, dark windows, a cool pool of light against deep shadow, a quiet lonely stillness"),
 "city_street":("Городская улица","an anonymous big-city street of plain mid-rise buildings, wet grey pavements, tram wires overhead, a shuttered kiosk, thin traffic, flat overcast daylight, the indifferent atmosphere of a large city where no one is known"),
 "doctor_office_bad":("Кабинет врача (диагноз)","a sober doctor's office, a desk with an open folder and scan images clipped to a cold lightbox, two chairs, pale walls, a small window with half-closed blinds, cold even light, the heavy stillness of bad news about to be spoken"),
 "cafe_meeting":("Кафе","a quiet ordinary city café, small round tables and mismatched chairs, a counter with a coffee machine behind, a large window onto a grey street, muted daylight, half-empty and hushed, the neutral charged air of a meeting between strangers"),
 "front_door":("Дверь квартиры","a plain apartment landing and front door seen from inside the hallway, a coat rack, worn shoes by the mat, a spyhole and a chain latch, dim stairwell light through the open doorway, the tense stillness of an unexpected knock"),
}

TEMPLATES=[("b1","char_ip_graphic_novel","donor/comfy/scene_single_character_graphic_novel_api.json"),
           ("b2","environment_graphic_novel","donor/comfy/scene_environment_graphic_novel_api.json")]
ROUTES=[("b3","donor_character_ip"),("b4","donor_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: donor exists"); return
    with open(os.path.join(ROOT,"scripts","donor_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/donor/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for suf,key,path in TEMPLATES:
        cur.execute('INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle","createdAt") VALUES (%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000"+suf,PROJ,key,path,'graphic_novel_cell_shaded',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","donor",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","cloakroom","comfy"); dst=os.path.join(ROOT,"data","donor","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK donor scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
