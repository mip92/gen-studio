# -*- coding: utf-8 -*-
"""One-shot creation of `lottery`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_lottery_foundation.py
«ТЫ — Лотерейный миллионер.» Track B, f5 male «Гонщик», graphic_novel_flux (layoff look: Eldritch on flux)."""
import os, shutil, datetime, psycopg2
PFX="7e690000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="lottery"
NAME="ТЫ — Лотерейный миллионер. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

VOICE_ID="44c4c45f-14aa-40ee-a7a7-0b108f4d59bd"  # «Гонщик» (male)
VOICE_REF="data/_voices/flat_earth/voice_reference.mp3"

SCENES=[
 ("cold_open","Cold open — 2026 (46): проходная, новенький пропуск + CTA",0,"HERO_BACK"),
 ("origin","Акт 1 — 1998 (18): отец, киоск, «с получки — один»",1,"HERO_YOUNG"),
 ("win","Акт 2 — 2022 (42): тираж, звонок, 73 400 000",2,"HERO_WORK"),
 ("fire_bridges","Акт 3 — 2022: увольнение с фейерверком, пентхаус, Cayenne",3,"HERO_RICH"),
 ("vultures","Акт 4 — 2023: родня, брат Витя, список на 87 строк",4,"HERO_RICH"),
 ("partner","Акт 5 — 2023: Аркадий, котлован ТЦ, 28 000 000",5,"HERO_RICH"),
 ("no_return","Акт 6 — 2024: казино, фраза отца нарушена",6,"HERO_RICH"),
 ("collapse","Акт 7 — 2024–2025: Таня уходит, Аркадий испаряется",7,"HERO_RICH"),
 ("bottom","Акт 8 — 2025 (45): приставы, опись, общага",8,"HERO_RICH"),
 ("return","Акт 9 — 2026: проходная, мастер, станок",9,"HERO_BACK"),
 ("rebuild","Акт 10 — 2026: график долга, сын на практике",10,"HERO_BACK"),
 ("coda","Финал — проходная-кольцо, фраза новенькому, CTA",11,"HERO_BACK"),
]

CHARS={
 "HERO":"Ты — лотерейный миллионер",
 "FATHER":"Отец (флешбек 1998)",
 "TANYA":"Таня — жена",
 "SON":"Максим — сын",
 "VITYA":"Витя — старший брат",
 "ARKADIY":"Аркадий — «партнёр»",
 "MASTER":"Мастер цеха",
}

PROFILES={
 "HERO_YOUNG":("HERO","adult 18","lotyng","a lanky earnest young man of eighteen, dark short hair, a cheap sports jacket over a plain tee, attentive grey eyes, standing half a step behind his father as his constant manner"),
 "HERO_WORK":("HERO","adult 42","lotwork","a solid dependable machinist of forty-two, dark hair with first grey at the temples, a clean navy work jacket over a checked shirt, calm capable hands, attentive grey eyes, a plastic factory pass on a lanyard as his constant identity anchor"),
 "HERO_RICH":("HERO","adult 44","lotrich","a broad uneasy man of forty-four in expensive clothes worn like a costume, dark hair with grey temples slicked back, a cashmere coat over a bright shirt, a heavy new wristwatch, attentive grey eyes that do not match the outfit, the workman's posture under cashmere as his constant identity anchor"),
 "HERO_BACK":("HERO","adult 46","lotback","a quiet weathered man of forty-six, dark hair gone half grey, a clean navy work jacket zipped to the chin, calm steady hands, attentive grey eyes with settled peace in them, a brand-new factory pass with a glossy photo as his constant identity anchor"),
 "FATHER_BASE":("FATHER","adult 50","lotdad","a wiry cheerful workman of fifty, an eight-panel flat cap, a grey work coat, a folded newspaper with a lottery results table in his pocket, deep smile lines, the flat cap as his constant identity anchor"),
 "TANYA_BASE":("TANYA","adult 38","lottanya","a warm sensible woman of thirty-eight, dark blond hair in a thick braid over one shoulder, a plain soft cardigan, tired kind eyes, the braid over the shoulder as her constant identity anchor"),
 "SON_TEEN":("SON","kid 15","lotson15","a gangly teenager of fifteen, dark tousled hair, big headphones worn around his neck, a school hoodie, guarded adolescent eyes, the headphones on the neck as his constant identity anchor"),
 "SON_GROWN":("SON","adult 19","lotson19","a serious young man of nineteen, dark short hair, a fresh blue work jacket a size large, careful hands learning their trade, his father's straight-backed stance as his constant identity anchor"),
 "VITYA_BASE":("VITYA","adult 45","lotvitya","a loud fleshy man of forty-five, thinning combed hair, a maroon leather jacket over a tight polo, a gold chain at the collar, a salesman's insistent grin, the maroon jacket as his constant identity anchor"),
 "ARKADIY_BASE":("ARKADIY","adult 50","lotark","a polished silver-haired man of fifty, an impeccable dark suit with a snow-white scarf, a slim leather briefcase, a calm trustworthy smile that costs money, the white scarf as his constant identity anchor"),
 "MASTER_BASE":("MASTER","adult 55","lotmaster","a stocky shop foreman of fifty-five, grey stubble, thick-framed glasses, an oil-darkened flat cap, a worn quilted vest over overalls, the thick glasses as his constant identity anchor"),
}

LOCS={
 "factory_gate":("Проходная завода","a factory entrance checkpoint, a row of steel turnstiles with small indicator lights, a glass guard booth, a wall of worn time-card slots, painted pipes running under the ceiling, morning workers' light through wired glass, the humble ceremonial threshold between the street and the shop floor"),
 "factory_shop":("Цех","a large machine shop, ranks of lathes and milling machines under high sooty windows, chain hoists and yellow safety lines on the concrete floor, coils of bright metal shavings, tool cabinets with dented doors, warm work light over cool industrial shadow, the steady dignified rhythm of skilled manual work"),
 "khrush_kitchen":("Кухня хрущёвки","a small five-storey-flat kitchen, an oilcloth-covered table against the window, a gas stove with a battered kettle, cabinets repainted twice, a radio on the fridge, net curtains over a courtyard view, warm bulb light on worn linoleum, the settled modest comfort of a working family"),
 "kiosk":("Лотерейный киоск","a small street lottery kiosk with a barred window, faded posters of smiling winners and giant sums, stacks of scratch tickets under glass, a hand-written exchange-rate style board of draw dates, a worn coin tray in the window slot, weather-beaten paint, the cheap glitter of sold hope"),
 "penthouse":("Пентхаус","a rented penthouse living room, floor-to-ceiling windows over the night city, a huge white sofa still smelling of the showroom, a marble bar counter with untouched glasses, designer lamps like sculptures, echoing space with too few personal things, expensive emptiness under high ceilings"),
 "car_lux":("Салон Cayenne","the interior of a new luxury SUV, cream leather seats with contrast stitching, a wide glowing dashboard, a panoramic roof, showroom smell still in the cabin, city lights gliding over polished trim, insulated quiet that feels rented even when owned"),
 "restaurant":("Ресторан","a private dining room of an expensive restaurant, a long table under low golden lamps, white cloth crowded with plates and bottles, heavy curtains, a waiter's station glinting with glass, cigar haze in the lamplight, the loud warmth of celebrations that someone else remembers paying for"),
 "pit":("Котлован ТЦ","a stalled construction site, a vast excavated pit with rusting rebar cages and rainwater at the bottom, a tilted tower crane, weathered banners on the fence showing a glossy mall render, weeds through gravel, grey open sky, the monumental stillness of money buried in the ground"),
 "casino":("Казино","a casino floor at night, green felt tables under low cones of light, towers of clay chips, a roulette wheel gleaming brass and ebony, velvet ropes and dark carpet swallowing sound, mirrorless windowless timeless air, the plush hush where hours and sums lose their meaning"),
 "bailiff_office":("Кабинет приставов","a state enforcement office, rows of grey filing cabinets, a desk stacked with numbered case folders, a barred window with dusty blinds, official seals and a wall clock slightly fast, cold fluorescent light, the procedural calm of consequences being processed"),
 "dorm_room":("Комната в общаге","a narrow workers' dormitory room, a steel-frame bed with a thin blanket, a single wardrobe with a loose door, a shared-corridor hum through the wall, a hotplate and one mug on a stool, a window onto a brick wall, bare tidy poverty holding itself with dignity"),
 "city_street":("Улица города","an ordinary regional-city street, low mixed facades with shop signs, a bus stop with a bent schedule board, poplars along cracked pavement, overhead wires against a wide sky, buses and vans in no hurry, the plain persistent life of a town that outlasts anyone's luck"),
 "school_gate_priv":("Ворота частной школы","the gates of a private school, tall wrought iron between brick pillars, a guard booth and an intercom panel, trimmed hedges and a clean drive beyond, polished cars queuing at drop-off, discreet money in every detail, an entrance that measures visitors politely"),
}

TEMPLATES=[("b1","char_ip_flux_comic","lottery/comfy/scene_single_character_flux_comic_api.json"),
           ("b2","environment_flux_comic","lottery/comfy/scene_environment_flux_comic_api.json")]
ROUTES=[("b3","lottery_character_ip"),("b4","lottery_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: lottery exists"); return
    with open(os.path.join(ROOT,"scripts","lottery_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Eldritch_Classic_Comics_1.1.5.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
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
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","lottery",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","layoff","comfy"); dst=os.path.join(ROOT,"data","lottery","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK lottery scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
