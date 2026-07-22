# -*- coding: utf-8 -*-
"""One-shot creation of the `trucker` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_trucker_foundation.py
«ТЫ — Напарник дальнобойщика. И это вся твоя жизнь.» Track B, qwen3 («Кузнецов», male), realcomic_qwen.
Nameless country, no currency. ~15 min test film for the Qwen dual-character mechanic (~55% dual shots).
"""
import os, shutil, datetime, psycopg2
PFX="7e6d0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="trucker"
NAME="ТЫ — Напарник дальнобойщика. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.now()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, merged faces, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic violence, blood, gore, nudity")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, road-weary stillness with small life signs, hand-drawn illustration in motion, painterly animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting road haze and passing headlight glow. The entire scene is a still illustration come to life, freeze frame")
VOICE_ID="d75884ae-d3f3-4c8a-94b6-35236e52a077"  # «Кузнецов» (male) — user pick 2026-07-16
VOICE_REF="data/_voices/voice-2/voice_reference.wav"

SCENES=[
 ("cold_open","Cold open — ночь, весовой пост на 412-м км + CTA",0,"MAX_YOUNG"),
 ("hired","Акт 1 — долг 240 тысяч, база, «посидишь справа»",1,"MAX_YOUNG"),
 ("school_road","Акт 2 — дорога-школа, ритуал термоса, 18 тысяч за рейс",2,"MAX_YOUNG"),
 ("offer","Акт 3 — «одна коробка — сорок тысяч», отказ и согласие",3,"MAX_YOUNG"),
 ("first_box","Акт 4 — первая коробка, конверт, «премия» маме",4,"MAX_YOUNG"),
 ("escalation","Акт 5 — три коробки, сломанный ритуал, 60 килограммов",5,"MAX_YOUNG"),
 ("confront","Акт 6 — ночная стоянка, найденный груз, ультиматум",6,"MAX_YOUNG"),
 ("last_time","Акт 7 — «последний раз», молчаливый рейс",7,"MAX_YOUNG"),
 ("catastrophe","Акт 8 — пост: вскрытие, «груз мой», протокол",8,"MAX_YOUNG"),
 ("aftermath","Акт 9 — семь лет спустя, термос переходит тебе",9,"MAX_ADULT"),
 ("coda","Финал — термос, дорога, CTA, дисклеймер",10,"MAX_ADULT"),
]

CHARS={
 "MAX":"Максим (ты) — напарник",
 "STEPANYCH":"Степаныч — дальнобойщик, наставник",
 "ARKADIY":"Аркадий — логист базы",
 "MOTHER":"Мать Максима",
 "INSPECTOR":"Инспектор весового поста",
}

# NB (2026-07-16): Qwen-Image defaults to east-asian faces — ethnicity MUST be
# in the positive promptBase (negative is inert at cfg 1.0). Synced with DB.
PROFILES={
 "MAX_YOUNG":("MAX","adult 22","maxyng","a lanky young slavic man of twenty-two with fair east-european features, short sandy hair, attentive grey-blue eyes, a worn denim jacket over a plain grey hoodie, his father's brown leather fingerless driving gloves as his constant identity anchor"),
 "MAX_ADULT":("MAX","adult 29","maxad","a lean quiet slavic man of twenty-nine with fair east-european features, the same short sandy hair, tired grey-blue eyes, a dark warehouse loader's vest over a thermal shirt, the same worn brown leather fingerless gloves as his constant identity anchor"),
 "STEP_BASE":("STEPANYCH","adult 58","stepb","a stocky heavy-shouldered slavic truck driver of fifty-eight with a broad weathered east-european face, a thick grey walrus moustache, deep kind creases, a flat grey tweed cap he never takes off as his constant identity anchor, an olive quilted work vest over a checked flannel shirt"),
 "ARK_BASE":("ARKADIY","adult 41","arkb","a sleek thin slavic logistics manager of forty-one with sharp pale east-european features, dark hair slicked straight back, a glossy black puffer coat over an office shirt, a heavy gold signet ring on his little finger as his constant identity anchor, a phone always in his hand"),
 "MOM_BASE":("MOTHER","adult 52","momb","a tired kind-faced slavic woman of fifty-two with soft east-european features, ash-grey hair under a pale cotton headscarf, soft downturned eyes, a hospital-blue knitted cardigan pulled tight, careful worn hands"),
 "INSPECTOR_BASE":("INSPECTOR","adult 45","inspb","a heavy-jawed slavic road inspector of forty-five with a broad east-european face, a grey uniform jacket with reflective piping, a peaked service cap low over unreadable eyes, a neutral officially patient face, a long black torch in his hand as his constant identity anchor"),
}

LOCS={
 "base_yard":("Площадка логистической базы","a gravel yard of a freight logistics base, rows of semi-trailers backed against a long warehouse, tall sodium lights on lattice masts, a dispatcher's hut with a taped-over window, pallets and strapping bands by the fence, tyre ruts full of last night's rain, diesel drums under a tin roof, an atmosphere of early shifts and engine warm-up"),
 "warehouse_ramp":("Склад, рампа","a concrete loading ramp under a corrugated canopy, a half-raised roller door spilling cold fluorescent light, shrink-wrapped pallet stacks with numbered tags, a hand truck against the wall, rubber dock bumpers worn to the cord, chalk tally marks by the door frame, an atmosphere of weighed and counted freight"),
 "truck_cab":("Кабина фуры","the two-seat cab of an old long-haul truck, a big thin-rimmed steering wheel, a dashboard of toggle switches and a taped-over crack, a curtained bunk behind the seats, a cassette slot with a missing button, two cup rests on the engine doghouse, road maps folded behind the sun visor, an atmosphere of a small moving home that smells of diesel and tea"),
 "night_highway":("Трасса, ночь","a two-lane highway at night crossing flat dark fields, the headlight cone carving a pale tunnel, reflective posts flicking past, a distant petrol-station glow low on the horizon, insects streaking through the beam, the broken centre line pulsing, an atmosphere of the world narrowed to lit asphalt"),
 "day_highway":("Трасса, день","an open two-lane highway through flat summer fields, heat shimmer over bleached asphalt, a windbreak of poplars far off, oncoming trucks throwing quick shadows, kilometre posts with peeling paint, wires dipping between poles along the road, an atmosphere of long even hours"),
 "weigh_station":("Весовой пост, 412-й км","a roadside weigh-and-inspection post at the four-hundred-twelfth kilometre, a low booth with a barrier arm and a floodlit concrete apron, the metal strip of axle scales across the lane, a mast of white floodlights washing every shadow flat, cones and a sign board with faded digits, an atmosphere of engines idling and papers checked"),
 "truck_stop":("Ночная стоянка дальнобойщиков","a gravel overnight lot for long-haul trucks off the highway, rows of dark trailers with marker lights dozing, a 24-hour canteen wagon with a string of yellow bulbs, one sodium lamp on a wooden pole, oil drums for rubbish, dew on tarpaulins, an atmosphere of parked engines and short sleep"),
 "mom_kitchen":("Кухня матери","a small flat kitchen with an oilcloth-covered table, a tin box of pill blisters and a stack of payment slips under a fridge magnet, a gas stove with a kettle, thin curtains over a courtyard window, a wall calendar with pencil circles, a folded newspaper, an atmosphere of small sums counted twice"),
 "logist_office":("Каморка логиста","a cramped office inside a container cabin on the base yard, a desk with two phones and a heap of folders, a small key safe on the wall, a window with venetian blinds looking onto the trucks, a space heater glowing orange, printed schedules taped over each other, an atmosphere of quick deals in a small room"),
 "roadside_dawn":("Обочина, рассвет","a highway shoulder at first light, low mist lying over the fields in flat ribbons, a steel guard rail beaded with dew, the asphalt edge crumbling into gravel and dry weeds, a paling sky with one bright planet, far-off headlights still on, an atmosphere of cold clean air before the day's heat"),
 "impound":("Штрафстоянка","a fenced impound lot behind the traffic post, rows of seized trucks and cars with dusty windscreens and paper seals on their doors, weeds growing through the gravel between wheels, a padlocked gate with a warning plate, a bare watchman's booth with a single window, an atmosphere of machines stopped mid-life"),
 "cemetery_hill":("Кладбище на холме","a small hillside cemetery above the ring road, simple painted fences and modest headstones among wild grass, a few old elms bending in the wind, the highway visible far below with tiny moving trucks, plastic wreaths faded by seasons, an atmosphere of wind and distance"),
}

TEMPLATES=[("b1","char_realcomic_qwen","trucker/comfy/scene_realcomic_qwen_api.json"),
           ("b2","environment_realcomic_qwen","trucker/comfy/scene_realcomic_qwen_api.json")]
ROUTES=[("b3","trucker_character_ip"),("b4","trucker_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: trucker exists"); return
    with open(os.path.join(ROOT,"scripts","trucker_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\RealComic_2509_base.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","ttsVoiceoverId","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','qwen3',%s,%s,'realcomic_qwen','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
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
                    (PFX+"0000000000"+suf,PROJ,key,path,'realcomic_qwen',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","trucker",sub),exist_ok=True)
    dst=os.path.join(ROOT,"data","trucker","comfy"); c=0
    # style-agnostic video/upscale/bgm workflows from the newest cell-shaded project
    src=os.path.join(ROOT,"data","coffee","comfy")
    for fn in ("video_wan22_i2v_api.json","video_wan22_i2v_cfg_api.json","video_wan22_i2v_distill_api.json",
               "video_upscale_interp_api.json","video_fps_interp_api.json","bgm_acestep_api.json"):
        p=os.path.join(src,fn)
        if os.path.exists(p): shutil.copyfile(p,os.path.join(dst,fn)); c+=1
    # the Qwen scene + anchor graphs from the shared master templates
    tpl=os.path.join(ROOT,"data","_templates","comfy")
    for fn in ("scene_realcomic_qwen_api.json","gen_anchor_portrait_realcomic_qwen_api.json"):
        shutil.copyfile(os.path.join(tpl,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK trucker scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
