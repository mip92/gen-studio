# -*- coding: utf-8 -*-
"""One-shot creation of the `divorce` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_divorce_foundation.py
«ТЫ — Разведённый. И это вся твоя жизнь.» Track B, f5, graphic_novel_flux (Flux comic / Comic_Style LoRA).
Nameless city, present day. ~20 min target. No cameos.
"""
import os, shutil, datetime, psycopg2
PFX="7e620000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="divorce"
NAME="ТЫ — Разведённый. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — кухня, снимаешь кольцо, две чашки + CTA",0,"MUZH_MAIN"),
 ("origin","Акт 1 — ЗАГС, кольцо на палец (26)",1,"MUZH_YOUNG"),
 ("drift","Акт 2 — 12 лет: мелкие пропуски, «потом»",2,"MUZH_MAIN"),
 ("cracks","Акт 3 — трещины: молчание, телефон, друг развёлся",3,"MUZH_MAIN"),
 ("turn","Акт 4 — точка невозврата (отмахнулся)",4,"MUZH_MAIN"),
 ("catastrophe","Акт 5 — подача, юрист, суд, делёж",5,"MUZH_MAIN"),
 ("aftermath","Акт 6 — однушка, передача сына, полоса на пальце",6,"MUZH_MAIN"),
 ("coda","Финал — 4-я стена, кода, дисклеймер",7,"MUZH_MAIN"),
]

CHARS={
 "MUZH":"Муж (ты)",
 "ZHENA":"Жена",
 "SYN":"Сын",
 "YURIST":"Юрист (бракоразвод)",
 "DRUG":"Друг (развёлся раньше)",
}

PROFILES={
 "MUZH_YOUNG":("MUZH","adult 26","muzhyng","an in-love young man of twenty-six, short dark-blond hair, light stubble, a warm open face, a simple shirt, a plain gold wedding band on his left ring finger as his constant identity anchor"),
 "MUZH_MAIN":("MUZH","adult 38","muzhmid","a weary man of thirty-eight, the same short dark-blond hair, heavier stubble, tired guarded eyes, a plain knit jumper, a plain gold wedding band on his left ring finger as his constant identity anchor"),
 "ZHENA_BASE":("ZHENA","adult 36","zh3nadiv","a quietly tired woman of thirty-six, jet-black hair in a neat low bun, a composed sad face, a plain blouse, small pearl stud earrings as her constant identity anchor"),
 "SYN_CHILD":("SYN","kid 7","s7nchld","a small fair-haired boy of about seven, light tousled hair, a plain unmarked happy face, a little buttoned coat, a small dinosaur backpack on his shoulders as his constant identity anchor"),
 "YURIST_BASE":("YURIST","adult 50","yur1st","a dry severe lawyer of fifty, balding with grey at the sides, rimless glasses, a grey suit, a black fountain pen held in his hand as his constant identity anchor"),
 "DRUG_BASE":("DRUG","adult 40","drugdiv","a blunt friend of forty, a shaved head and a short dark beard, a casual jacket, a small black e-cigarette in his hand as his constant identity anchor"),
}

LOCS={
 "zags":("ЗАГС","a modest civil registry-office wedding hall, a long ceremonial desk with a folded national-neutral cloth, a small lectern, rows of empty guest chairs, a faded artificial flower arrangement, tall net curtains over bright windows, a worn red carpet runner, an air of slightly dated officialdom"),
 "living_shared":("Общая гостиная","a lived-in family living room, a worn fabric sofa with cushions, a low table, a wall unit with photo frames and books, a television, a child's toys in one corner, a rug, a window with sheer curtains, warm cluttered domestic light, the texture of twelve shared years"),
 "apartment_empty":("Опустевшая квартира","the same living room now half-emptied, pale rectangles on the wall where framed photos hung, dents in the carpet where furniture stood, a few cardboard boxes taped shut, one chair left, bare windows without curtains, cold flat daylight, an atmosphere of a home being subtracted"),
 "kitchen_mugs":("Кухня (две чашки)","a small apartment kitchen, a square table for two by the window, two ceramic mugs on the table, laminate cupboards, a kettle, a calendar on the wall, a drawer slightly open, soft low light, an intimate domestic stillness that now feels too quiet"),
 "lawyer_office":("Кабинет юриста","a formal lawyer's office, a heavy desk with a closed folder and stacked documents, two client chairs, shelves of thick legal volumes, a banker's lamp, framed certificates on the wall, half-closed blinds over a city window, sober cold light"),
 "court_corridor":("Коридор суда","a long municipal courthouse corridor, a row of dark wooden benches against pale institutional walls, tall closed double doors with small case-number plates, a noticeboard, a worn stone floor, high frosted windows, harsh even light, an atmosphere of waiting for a verdict"),
 "playground_handoff":("Детская площадка (передача)","a small residential courtyard playground, a metal swing set and a little slide, a bench, low bushes, the blurred facade of a panel apartment block behind, bare trees, overcast grey light, an atmosphere of a routine weekend exchange point"),
 "rented_flat":("Съёмная однушка","a bare rented one-room flat, a single bed against the wall, a folding table and one chair, a few unpacked boxes, an empty bookshelf, a window without curtains showing other apartment blocks, thin impersonal light, the hollow echo of a place that is not yet home"),
 "car_curb":("Салон машины у подъезда","the interior of a parked car seen from inside, the dashboard and steering wheel, a rear child seat visible, rain beads on the windscreen, the blurred shape of an apartment entrance through the glass, the grey light of a weekend morning, a confined waiting stillness"),
 "bedroom_night":("Спальня ночью","a shared bedroom at night, a double bed, two bedside tables with lamps, one lamp off and one casting a low glow, a wardrobe, a window with the cold blue light of the city, a wide cold gap down the middle of the bed, deep quiet shadow"),
}

TEMPLATES=[("b1","char_ip_flux_comic","divorce/comfy/scene_single_character_flux_comic_api.json"),
           ("b2","environment_flux_comic","divorce/comfy/scene_environment_flux_comic_api.json")]
ROUTES=[("b3","divorce_character_ip"),("b4","divorce_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: divorce exists"); return
    with open(os.path.join(ROOT,"scripts","divorce_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Comic_Style_-_FLUX.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_flux','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/divorce/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
                    (PFX+"0000000000"+suf,PROJ,key,path,'graphic_novel_flux',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","divorce",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","_templates","comfy"); dst=os.path.join(ROOT,"data","divorce","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK divorce scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
