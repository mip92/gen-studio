# -*- coding: utf-8 -*-
"""One-shot creation of the `announcer` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_announcer_foundation.py
«ТЫ — Диктор на вокзала. И это вся твоя жизнь.» Track B, f5 female, cell-shaded. No cameos.
Unnamed Central European country, grand railway terminus, 1985->2026, currency crowns.
Voice everyone knows, face no one knows; replaced by a synthetic voice built from her own.
"""
import os, shutil, datetime, psycopg2
PFX="7e600000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="announcer"
NAME="ТЫ — Диктор на вокзале. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, modern brand logos, readable license plates, cyrillic text, national flag, coat of arms")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting steam. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — стеклянная будка, объявление, зал внизу + CTA",0,"ANNOUNCER_OLD"),
 ("origin","Акт 1 — мечта о пении, отказ, будка, гонг (1985)",1,"ANNOUNCER_YOUNG"),
 ("gallery_a","Акт 2 — мать у воинских эшелонов + прощающиеся влюблённые",2,"ANNOUNCER_MID"),
 ("gallery_b","Акт 3 — пассажир 7:14 + семья-эмигранты",3,"ANNOUNCER_MID"),
 ("gallery_c","Акт 4 — человек с перронным билетом + беглянка",4,"ANNOUNCER_MID"),
 ("gallery_d","Акт 5 — слепой пассажир + одинокий ночной поезд",5,"ANNOUNCER_MID"),
 ("gallery_e","Акт 6 — ребёнок и «голос-ангел» + начальник вокзала стареет",6,"ANNOUNCER_MID"),
 ("turn","Акт 7 — точка невозврата, шанс спеть на юбилее вокзала",7,"ANNOUNCER_MID"),
 ("catastrophe","Акт 8 — голос записывают для синтеза и заменяют тебя",8,"ANNOUNCER_OLD"),
 ("aftermath","Акт 9 — анонимная пассажирка, твой синтетический голос",9,"ANNOUNCER_OLD"),
 ("coda","Финал — пустая будка, мёртвый микрофон, кода, дисклеймер",10,"ANNOUNCER_OLD"),
]

CHARS={
 "ANNOUNCER":"Диктор (ты)",
 "STATIONMASTER":"Начальник вокзала",
 "SOLMOTHER":"Мать у эшелонов",
 "LOVERA":"Она (прощание на перроне)",
 "LOVERB":"Он (прощание на перроне)",
 "COMMUTER":"Пассажир 7:14",
 "EMFATHER":"Отец-эмигрант",
 "EMCHILD":"Ребёнок-эмигрант",
 "PLATFORM":"Человек с перронным билетом",
 "RUNAWAY":"Беглянка",
 "BLIND":"Слепой пассажир",
 "NIGHT":"Одинокий ночной пассажир",
 "CHILDFAN":"Ребёнок, верящий в голос",
 "RIVAL":"Однокурсница-певица",
}

# profileCode -> (charCode, ageLabel, triggerToken, promptBase EN — identity only)
PROFILES={
 "ANNOUNCER_YOUNG":("ANNOUNCER","adult 24","ann0ncyng","a hopeful young woman of twenty-four, dark hair pinned up neatly, an expressive singer's face, wearing a deep-red silk scarf knotted at her throat to protect her voice as her constant identity anchor, a headset around her neck"),
 "ANNOUNCER_MID":("ANNOUNCER","adult 43","ann0ncmid","a composed woman of forty-three, dark hair greying at the temples in a neat bun, a quiet weathered face, wearing the same deep-red silk throat scarf as her constant identity anchor, a slim microphone headset"),
 "ANNOUNCER_OLD":("ANNOUNCER","adult 61","ann0ncold","a thin tired old woman of sixty-one, grey hair in a loose bun, deep gentle lines, wearing a faded deep-red silk throat scarf as her constant identity anchor, a worn headset"),
 "STATIONMASTER_BASE":("STATIONMASTER","adult 58","st4tmast","a heavyset old stationmaster, grey moustache, a peaked railway cap with a faded badge, a brass whistle on a lanyard at his chest as his constant identity anchor, a long dark uniform coat with tarnished buttons"),
 "SOLMOTHER_BASE":("SOLMOTHER","adult 52","s0lmoth","a careworn woman of fifty in a faded grey headscarf, a thin anxious face, clutching a folded letter and a small photograph of a son to her chest as her constant identity anchor, a plain dark coat"),
 "LOVERA_BASE":("LOVERA","adult 25","l0vera","a young woman of twenty-five, soft waved chestnut hair, a tender face, a bright yellow scarf as her constant identity anchor, a modest belted coat, a paper railway ticket held in her hand"),
 "LOVERB_BASE":("LOVERB","adult 27","l0verb","a young man of twenty-seven, short dark hair, an earnest face, a grey worker's flat cap as his constant identity anchor, a plain jacket, a small travel bag over his shoulder"),
 "COMMUTER_MID":("COMMUTER","adult 45","c0mmut","a tired commuter man of forty-five, thinning hair, glasses, a buttoned grey overcoat, carrying a battered tan leather briefcase and a folded newspaper as his constant identity anchor"),
 "COMMUTER_OLD":("COMMUTER","adult 62","c0mmuto","a stooped retired man of sixty-two, sparse grey hair, the same battered tan briefcase grown shabbier as his constant identity anchor, a worn coat"),
 "EMFATHER_BASE":("EMFATHER","adult 40","emf4th","a weary emigrant father of forty, dark stubble, a heavy overcoat, gripping two cardboard suitcases tied with rope as his constant identity anchor, an exhausted determined face"),
 "EMCHILD_BASE":("EMCHILD","kid 8","emch1ld","a small solemn child of about eight, dark cropped hair, a buttoned coat too big, clutching a single small wooden toy to the chest as a constant identity anchor, wide quiet eyes"),
 "PLATFORM_BASE":("PLATFORM","adult 55","pl4tform","a still dignified man of fifty-five, neat grey hair, a worn overcoat, holding a small platform ticket and a fading bunch of flowers as his constant identity anchor, a quiet waiting face"),
 "RUNAWAY_BASE":("RUNAWAY","teen 15","run4way","a thin runaway girl of fifteen, lank hair under a hood, a single stuffed rucksack on her back and a one-way ticket clutched in her fist as her constant identity anchor, a frightened guarded face"),
 "BLIND_BASE":("BLIND","adult 35","bl1ndp","a calm blind man of thirty-five, dark glasses, a white folding cane held before him as his constant identity anchor, his head tilted up toward the loudspeakers, a serene listening face"),
 "NIGHT_BASE":("NIGHT","adult 50","n1ghtp","a lonely man of fifty who rides the last train nightly, a shapeless coat and a knitted hat, holding a battered metal thermos as his constant identity anchor, a hollow patient face"),
 "CHILDFAN_BASE":("CHILDFAN","kid 7","ch1ldfan","a small bright child of about seven, fair hair, a little coat, gazing upward toward a ceiling loudspeaker with wonder and pointing up as a constant identity anchor, trusting eyes"),
 "RIVAL_BASE":("RIVAL","adult 24","r1valsng","a poised young woman of twenty-four, glossy dark hair, a confident singer's face, a fur stole and a small enamel conservatory pin on her lapel as her constant identity anchor, an elegant dress"),
}

LOCS={
 "announcer_booth":("Будка диктора","a glass announcer's booth high above a great railway concourse, a heavy bakelite microphone on a stand, a worn brass chime button, a panel of labelled switches, a typed schedule sheet under a lamp, a wide window looking down over the marble hall below, intimate dim control-room light, an atmosphere of quiet elevated solitude"),
 "concourse_hall":("Зал вокзала","a vast Habsburg-era railway terminus concourse, a soaring iron-and-glass vaulted roof, a polished marble floor, a huge split-flap departures board on one wall, a giant round station clock, tall arched windows, brass lamps, an atmosphere of echoing monumental transit"),
 "platform_day":("Перрон (день)","a long covered railway platform under a great iron trainshed, a steam-and-diesel locomotive at the edge, painted platform numbers, luggage carts, drifting steam in slatted daylight, worn yellow safety lines, an atmosphere of departure and arrival"),
 "platform_night":("Перрон (ночь)","a deserted railway platform at night, a single pool of lamplight, the dark mouth of the trainshed beyond, a lone bench, cold blue shadow and faint mist, a distant signal light, an atmosphere of last-train loneliness"),
 "departures_board":("Табло отправлений","a huge mechanical split-flap departures board, rows of mechanical letter and number tiles mid-flip, brass framing, destinations and times in neutral lettering, a soft blur of flipping flaps, dim hall light behind, an atmosphere of restless schedule"),
 "station_facade":("Фасад вокзала","the grand facade of a Central European railway terminus across a cobbled square, a tall ornate clock tower, arched portals, gas-style lamps, a tram line, no readable signage, changing weather and seasons, an atmosphere of imperial civic grandeur"),
 "waiting_room":("Зал ожидания","an old railway waiting room, long polished wooden benches, a tall iron stove, frosted globe lamps, a clock on a panelled wall, dark wainscoting and worn tiled floor, an atmosphere of patient stale waiting"),
 "music_school":("Вокальная школа (1985)","a worn 1980s vocal-conservatory rehearsal room, a black upright piano, tall windows with sheer curtains, a music stand, framed faded recital photographs, scuffed parquet, an atmosphere of youthful striving and judgement"),
 "stationmaster_office":("Кабинет начальника вокзала","a cluttered stationmaster's office, a heavy desk buried in timetables and signal logs, a wall of brass clocks set to different cities, framed old railway photographs, a green-shaded lamp, a window onto the platforms, warm dim institutional light"),
 "automation_room":("Аппаратная автоматики","a cold modern automation room newly installed in the old station, grey server racks with blinking blue indicators, a flat speaker monitor, neat cable trunking, a sterile fluorescent strip clashing with an old tiled wall, an atmosphere of progress erasing a human function"),
 "train_interior":("Вагон поезда","the interior of a passenger train carriage, rows of worn upholstered seats, luggage racks above, large windows with landscape sliding past, a ceiling loudspeaker grille, soft daylight, an atmosphere of anonymous transit"),
}

TEMPLATES=[("b1","char_ip_graphic_novel","announcer/comfy/scene_single_character_graphic_novel_api.json"),
           ("b2","environment_graphic_novel","announcer/comfy/scene_environment_graphic_novel_api.json")]
ROUTES=[("b3","announcer_character_ip"),("b4","announcer_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: announcer exists"); return
    with open(os.path.join(ROOT,"scripts","announcer_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/announcer/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","announcer",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","cat_lady","comfy"); dst=os.path.join(ROOT,"data","announcer","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK announcer scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
