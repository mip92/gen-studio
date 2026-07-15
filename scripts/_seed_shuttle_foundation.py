# -*- coding: utf-8 -*-
"""One-shot creation of `shuttle`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_shuttle_foundation.py
«ТЫ — Челночница.» Track B semi-light, f5 female «Учительница Казахстан», graphic_novel_flux (divorce look: Comic_Style-FLUX)."""
import os, shutil, datetime, psycopg2
PFX="7e6a0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="shuttle"
NAME="ТЫ — Челночница. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

VOICE_ID="0c9a5b9f-56d6-4c4d-823a-ed18536050de"  # «Учительница Казахстан» (female)
VOICE_REF="data/_voices/message/voice_reference.mp3"

SCENES=[
 ("cold_open","Cold open — 2026: антресоли, сумка, звонок + CTA",0,"VERA_OLD"),
 ("nii","Акт 1 — 1994 (34): НИИ, пустая касса, Лене восемь",1,"VERA_YOUNG"),
 ("first_run","Акт 2 — 1994: заём 800, автобус 36ч, Лалели, ×3",2,"VERA_YOUNG"),
 ("market","Акт 3 — 1995–97: место 12, Валя, рэкет",3,"VERA_YOUNG"),
 ("kidok","Акт 4 — 1996: кидок на 2 400 перед НГ",4,"VERA_YOUNG"),
 ("border","Акт 5 — 1997: таможня, пояс",5,"VERA_YOUNG"),
 ("daughter","Акт 6 — 1994–98: Лена и бабушка, концерт без мамы",6,"LENA_KID"),
 ("default98","Акт 7 — 1998 (38): дефолт, оборот, скупка",7,"VERA_MID"),
 ("kiosk","Акт 8 — 2000 (40): ларёк, конец автобусов",8,"VERA_MID"),
 ("store","Акт 9 — 2003 (43/17): магазин «Вера», конфликт",9,"VERA_MID"),
 ("mend","Акт 10 — 2004–2010: прилавок, примирение",10,"VERA_MID"),
 ("coda","Финал — 2026: двое над сумкой, новые антресоли, CTA",11,"VERA_OLD"),
]

CHARS={
 "VERA":"Ты — Вера, челночница",
 "LENA":"Лена — дочь",
 "GRAN":"Мать Веры — бабушка",
 "VALYA":"Валя — товарка по рынку",
 "RACKET":"«Смотрящий» рынка",
}

PROFILES={
 "VERA_YOUNG":("VERA","adult 34","shvyoung","a resolute intelligent woman of thirty-four, ash-blond hair in a practical chin-length cut, a worn engineer's blouse under a knitted vest, tired determined grey eyes, an amber hair clip as her constant identity anchor"),
 "VERA_MID":("VERA","adult 42","shvmid","a hardened capable market woman of forty-two, ash-blond hair with grey strands in the same practical cut, a quilted vest over a warm jumper, chapped strong hands, an amber hair clip as her constant identity anchor"),
 "VERA_OLD":("VERA","adult 66","shvold","a composed silver-haired woman of sixty-six, hair in the same practical chin-length cut, a good simple cardigan, calm certain eyes, a pale worn amber hair clip as her constant identity anchor"),
 "LENA_KID":("LENA","kid 8","shlkid","a thoughtful girl of eight, dark-brown hair in two pigtails, a hand-knitted scarlet scarf, serious watchful eyes, the scarlet scarf as her constant identity anchor"),
 "LENA_TEEN":("LENA","kid 17","shlteen","a guarded lean girl of seventeen, loose dark-brown hair, a studded denim jacket, a red scarf knotted carelessly at her throat, defiant tired eyes, the red scarf as her constant identity anchor"),
 "LENA_ADULT":("LENA","adult 40","shladult","a poised warm woman of forty, dark-brown hair in a low knot, a smart camel coat, an old soft red scarf worn like a keepsake, her mother's certain eyes, the red scarf as her constant identity anchor"),
 "GRAN_SH":("GRAN","adult 58","shgran","a small steady grandmother of fifty-eight, grey hair in a bun held by a wooden comb, round glasses, a felt vest over a flowered dress, patient kind hands, the round glasses as her constant identity anchor"),
 "VALYA_BASE":("VALYA","adult 40","shvalya","a big hearty market woman of forty, henna-red permed hair under a leopard-print headband, a padded coat, fingerless gloves, a laugh that carries across stalls, the leopard headband as her constant identity anchor"),
 "RACKET_BASE":("RACKET","adult 30","shracket","a squat unhurried man of thirty in a dark tracksuit and a leather flat cap, a toothpick in the corner of his mouth, heavy rings on short fingers, the leather cap as his constant identity anchor"),
}

LOCS={
 "nii_hall":("Отдел НИИ","a nineteen-nineties research institute office, rows of drafting tables under dusty tube lights, a dead wall clock, filing cabinets and rolled blueprints, a window taped for winter, potted plants surviving on habit, the stalled quiet of an institution nobody has paid in months"),
 "flat_home":("Их квартира","a small two-room flat of a mother and daughter, a fold-out sofa and a school desk in one room, hand-washed laundry over the bath door, a kitchen shelf of counted jars, a child's drawings over the sideboard, warm thin comfort held together by discipline and love"),
 "bus_int":("Салон автобуса","the interior of a long-haul shuttle bus at night, worn velour seats packed with dozing traders, plaid bags crammed into every rack and aisle gap, a windscreen of dark highway and passing lights, cigarette smoke around the driver, the swaying endurance of a thirty-six hour run"),
 "istanbul":("Лалели, Стамбул","a crowded Istanbul wholesale district street, racks of leather jackets and denim under shop awnings, hand-carts pushed through the crowd, Turkish signage and strings of lamps, steam from tea glasses on crate tables, the loud warm hustle of Laleli working at full pitch"),
 "border":("Таможня","a night border checkpoint for buses, concrete lanes under harsh floodlights, steel inspection tables, a queue of unloaded plaid bags along a wall, officials' silhouettes against fogged glass, cold exhaust and long waiting, the tense arithmetic of crossing"),
 "home_market":("Вещевой рынок","a nineties open-air clothes market, rows of steel-framed stalls hung with jackets and dresses, plaid bags stacked as counters, breath steaming over cash aprons, mud and cardboard underfoot, a radio somewhere, the rough resilient commerce of survival"),
 "courtyard":("Двор","a residential courtyard between panel houses, a swing set and a bench by the entrance, poplar fluff or snow by season, grandmothers on the bench and children around the swings, laundry lines between trees, the watchful communal warmth of a nineties yard"),
 "school_hall":("Школьный зал","a school assembly hall dressed for a children's concert, rows of parents on folding chairs, a small stage with paper snowflakes and a piano, garlands over the curtains, coats piled at the back, the bright anxious ceremony of childhood performances"),
 "kiosk_hers":("Её ларёк","a small trade kiosk of the early two-thousands, a barred display window packed with jackets and jeans, a heater glowing by a stool, price tags in neat handwriting, a cash drawer and a thermos, tidy plenty in two square metres, a business that no longer rides buses"),
 "store_hers":("Магазин «Вера»","a small clothing store in a former grocery, clean racks in ordered rows, a proper counter with a register, a curtained fitting corner, a shelf of plaid-bag keepsakes above the office door, daylight through big washed windows, hard-won respectability that still counts every item"),
 "city_90s":("Улица города","a regional-city street across the nineties and two-thousands, low facades getting new signs year by year, kiosks multiplying and then vanishing, buses and tram wires, puddles and pavement vendors, the same street slowly changing its clothes with the country"),
 "new_flat":("Квартира дочери (2026)","a bright modern apartment hallway with a high built-in mezzanine cupboard, a stepladder under its open doors, moving boxes half unpacked along the wall, warm spot lighting, a coat rack with a soft red scarf, the fresh settled feel of a life that turned out well"),
}

TEMPLATES=[("b1","char_ip_flux_comic","shuttle/comfy/scene_single_character_flux_comic_api.json"),
           ("b2","environment_flux_comic","shuttle/comfy/scene_environment_flux_comic_api.json")]
ROUTES=[("b3","shuttle_character_ip"),("b4","shuttle_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: shuttle exists"); return
    with open(os.path.join(ROOT,"scripts","shuttle_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Comic_Style_-_FLUX.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","ttsVoiceoverId","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,%s,'graphic_novel_flux','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
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
    for suf,key,path in TEMPLATES:
        cur.execute('INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle","createdAt") VALUES (%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000"+suf,PROJ,key,path,'graphic_novel_flux',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","shuttle",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","divorce","comfy"); dst=os.path.join(ROOT,"data","shuttle","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK shuttle scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
