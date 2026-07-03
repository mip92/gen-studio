# -*- coding: utf-8 -*-
"""One-shot creation of the `kept_woman` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_kept_woman_foundation.py
«ТЫ — Содержанка. И это вся твоя жизнь.» Track B, f5 (female), graphic_novel_flux (Comic_Style FLUX).
Nameless country, no currency named. ~35 min target. No cameos.
"""
import os, shutil, datetime, psycopg2
PFX="7e630000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="kept_woman"
NAME="ТЫ — Содержанка. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — студия в 43, стена сумок, режешь бирку + CTA",0,"VIKA_OLD"),
 ("origin","Акт 1 — 19: автобус в город, первый ресторан, цепочка, замок",1,"VIKA_YOUNG"),
 ("lesson","Акт 2 — 20-21: Лера учит правилам, первая квартира",2,"VIKA_YOUNG"),
 ("ascent","Акт 3 — 22-26: пик, сумки, машины, побережье, «разведусь»",3,"VIKA_MID"),
 ("tighten","Акт 4 — 27-29: замена младшей, арифметика возраста, клиника",4,"VIKA_MID"),
 ("mother","Акт 5 — ~32: дом, ложь матери, чужие деньги на мать",5,"VIKA_MID"),
 ("turn","Акт 6 — 33-35: Игорь зовёт в жизнь, Артур женится на молодой",6,"VIKA_MID"),
 ("slide","Акт 7 — 36-39: дешевле места, соперницы, гибель Леры",7,"VIKA_MID"),
 ("eject","Акт 8 — 40-42: последний ушёл к 24-летней, переезд в студию",8,"VIKA_OLD"),
 ("loss","Акт 9 — 43: смерть матери, кладбище, сумки ничего не стоят",9,"VIKA_OLD"),
 ("return","Акт 10 — 43: возврат к cold open, последний щелчок замка",10,"VIKA_OLD"),
 ("coda","Финал — цепочка на щиколотке, CTA, дисклеймер",11,"VIKA_OLD"),
]

CHARS={
 "VIKA":"Вика (ты) — содержанка",
 "ARTUR":"Артур — покровитель",
 "LERA":"Лера — наставница",
 "MAT":"Мать",
 "RIVAL":"Молодая соперница",
 "IGOR":"Игорь — обычный человек",
}

PROFILES={
 "VIKA_YOUNG":("VIKA","adult 19","vikayng","a strikingly beautiful provincial girl of nineteen, long honey-blonde hair, wide hopeful grey-green eyes, delicate features, a cheap thin floral summer dress, a single thin gold chain around her right ankle as her constant identity anchor"),
 "VIKA_MID":("VIKA","adult 32","vikamid","a polished glamorous woman of thirty-two, sleek honey-blonde hair in expensive soft waves, cool guarded grey-green eyes, refined tasteful designer clothing, the same thin gold chain around her right ankle as her constant identity anchor"),
 "VIKA_OLD":("VIKA","adult 43","vikaold","a still-elegant but tired woman of forty-three, honey-blonde hair with visible darker roots, faint fine lines around the eyes, a good but last-season dress, the same thin gold chain around her right ankle as her constant identity anchor"),
 "ARTUR_BASE":("ARTUR","adult 52","arturb","a heavy-set confident wealthy man of fifty-two, silver-grey swept-back hair, a neat close silver beard, an expensive dark tailored suit, a heavy gold signet ring on his right hand and a gold wristwatch as his constant identity anchor"),
 "LERA_MID":("LERA","adult 34","leramid","a glamorous hard-eyed woman of thirty-four, jet-black poker-straight hair, sharp cheekbones, sleek dark clothing, oversized dark sunglasses worn even indoors as her constant identity anchor"),
 "LERA_OLD":("LERA","adult 48","leraold","a ruined once-glamorous woman of forty-eight, thinning dyed jet-black hair with grey showing at the roots, a gaunt tired face, a worn silk robe, the same oversized dark sunglasses pushed up on her head as her constant identity anchor"),
 "MAT_BASE":("MAT","adult 55","matb","a plain worn provincial woman of fifty-five, grey hair in a simple low bun, a faded floral cardigan, work-roughened hands, reading glasses on a beaded cord around her neck as her constant identity anchor"),
 "RIVAL_BASE":("RIVAL","adult 24","rivalb","a fresh radiant young woman of twenty-four, dark auburn hair in loose waves, dewy glowing skin, a bright new fashionable dress, untouched and confident, no ankle chain"),
 "IGOR_BASE":("IGOR","adult 40","igorb","a plain kind ordinary man of forty, thinning short brown hair, simple wire glasses, a modest inexpensive jacket, honest tired eyes, a plain canvas shoulder bag as his constant identity anchor"),
}

LOCS={
 "rented_studio":("Съёмная студия (43)","a small rented studio flat, one cramped room, a narrow single bed, cheap laminate furniture, and wildly out of place against it a long garment rail and stacked boxes crammed with dozens of expensive designer handbags and shoe boxes, a single window over a grey inner courtyard of apartment blocks, a kettle on a tiny counter, thin impersonal daylight, the hollow feel of a beautiful woman's costly things marooned in a poor room"),
 "home_town_kitchen":("Кухня в посёлке","a cramped provincial small-town kitchen, worn patterned linoleum, a small enamel gas stove, floral wallpaper faded and peeling at the seams, a plastic checked tablecloth, a window over a muddy yard and low houses, glass jars of preserves on the sill, a paper wall calendar, warm poor domestic light, the settled routine of a life that never changed"),
 "luxury_restaurant":("Дорогой ресторан","an expensive city restaurant at night, crisp white tablecloths, low golden pendant light, tall dark windows mirroring candle flames, a long backlit marble bar, a single orchid on each table, polished glassware catching light, an atmosphere of hushed money and quiet appraisal"),
 "penthouse_apartment":("Пентхаус","a high-floor modern city apartment, floor-to-ceiling windows over a glittering night skyline, pale marble floors, a low designer sofa, a spotless designer kitchen that is never cooked in, a doorway into a walk-in wardrobe, cold beautiful expensive emptiness with almost nothing personal in it"),
 "car_interior_lux":("Салон дорогой машины","the plush interior of an expensive car at night seen from within, dark quilted leather seats, a soft ambient dashboard glow, city lights sliding across the tinted windscreen, chrome trim, a confined intimate expensive hush where a central-locking latch has just clicked shut"),
 "hotel_seaside":("Отель на побережье","a luxury seaside hotel suite at dusk, a wide open balcony over a darkening sea, white linen and a rumpled bed, an ashtray and two glasses on a low table, sheer curtains lifting in warm salt air, palm-frond shadows on the wall, the borrowed-paradise feel of someone else's holiday"),
 "boutique":("Бутик","a high-end fashion boutique interior, glossy lacquered shelves displaying rows of handbags under narrow spotlights, mirrored columns, a small velvet seating bench, delicate price tags hanging on silk ribbons, a cold perfumed hush and clean bright retail light"),
 "clinic_corridor":("Коридор клиники","a private clinic corridor, pale clean walls, soft recessed lighting, a row of empty upholstered chairs against one wall, a single closed white door, a potted plant, a frosted-glass partition, an antiseptic hushed stillness with no comfort in it"),
 "salon":("Салон красоты","a bright cosmetology treatment room, a reclining white treatment chair, a large round ring-lit mirror, glass shelves of serums and small devices, white clinical surfaces, cold even bright light, an atmosphere of relentless maintenance held up against time"),
 "bar_late":("Ночной бар","a dim late-night city bar, a sticky lacquered counter, coloured glow from bottle shelves, a few empty stools, a cracked leather corner booth, a spill of neon through a rain-streaked window, the tired emptiness of the small hours"),
 "lera_flat_bad":("Разорённая квартира Леры","a run-down small flat with the curtains drawn, an unmade bed, empty bottles and blister packs cluttering a low table, a dusty mirror, dead plants on the sill, a thin grey light struggling through grime on the glass, the airless feel of a life that stopped being kept up"),
 "bus_station":("Автовокзал","a shabby intercity bus station, a cracked concrete platform, a rusted timetable board, a single idling long-distance coach with its luggage bay open, rows of chipped plastic seats, a small closed kiosk, flat overcast light, the threshold feel of one-way departures"),
 "cemetery":("Кладбище","a modest provincial cemetery under bare trees, simple low fenced graves, a fresh earth mound with a plain temporary marker, plastic flowers faded by weather, a wide low grey sky, wet clay paths, a still and colourless grief"),
}

TEMPLATES=[("b1","char_ip_flux_comic","kept_woman/comfy/scene_single_character_flux_comic_api.json"),
           ("b2","environment_flux_comic","kept_woman/comfy/scene_environment_flux_comic_api.json")]
ROUTES=[("b3","kept_woman_character_ip"),("b4","kept_woman_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: kept_woman exists"); return
    with open(os.path.join(ROOT,"scripts","kept_woman_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Comic_Style_-_FLUX.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_flux','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/kept_woman/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","kept_woman",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","_templates","comfy"); dst=os.path.join(ROOT,"data","kept_woman","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK kept_woman scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
