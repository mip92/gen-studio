# -*- coding: utf-8 -*-
"""One-shot creation of the `fortune` (гадалка) project. Deleted after verify.
Run: PYTHONIOENCODING=utf-8 python scripts/_seed_fortune_foundation.py"""
import os, shutil, datetime, psycopg2
PFX="7e5d0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="fortune"
NAME="ТЫ — Гадалка. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, modern brand logos, readable license plates")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, character quietly continuing the moment, buzzing neon and drifting candle smoke, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No people walking, no figures moving, only faint neon flicker. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — Отшельник, мёртвый неон, «сейчас»",0,"ZARA_OLD"),
 ("act01_fool","Аркан 0 Дурак — детство, мамин салон",1,"ZARA_KID"),
 ("act02_magician","Аркан I Маг — первый обман",2,"ZARA_YOUNG"),
 ("act03_priestess","Аркан II Жрица — двусмысленность дара",3,"ZARA_YOUNG"),
 ("act04_lovers","Аркан VI Влюблённые — он",4,"ZARA_YOUNG"),
 ("act05_wheel","Аркан X Колесо Фортуны — свой салон",5,"ZARA_YOUNG"),
 ("act06_devil","Аркан XV Дьявол — снятие порчи",6,"ZARA_YOUNG"),
 ("act07_justice","Аркан XI Справедливость — цена",7,"ZARA_YOUNG"),
 ("act08_tower","Аркан XVI Башня — крах семьи",8,"ZARA_YOUNG"),
 ("act09_moon","Аркан XVIII Луна — паранойя",9,"ZARA_YOUNG"),
 ("act10_death","Аркан XIII Смерть — утрата",10,"ZARA_OLD"),
 ("act11_hermit","Аркан IX Отшельник — старость",11,"ZARA_OLD"),
 ("act12_world","Финал — переворот своей карты, кода",12,"ZARA_OLD"),
]
CHARS={"ZARA":"Зара (Дарлин)","MOTHER":"Мадам Роза","DAUGHTER":"Холли","MAN":"Сэм","WIDOW":"Вдова Маргарет"}
PROFILES={
 "ZARA_KID":("ZARA","kid 9","z4rakid","a serious dark-haired girl about nine, long braids, a moonstone ring too big for her finger, a fringed shawl over her shoulders, watchful dark eyes"),
 "ZARA_YOUNG":("ZARA","adult 27","z4ryng","a striking woman in her late twenties, long dark wavy hair, kohl-lined eyes, gold hoop earrings, a moonstone ring on her right hand, layered colourful shawls, a worn tarot deck"),
 "ZARA_OLD":("ZARA","adult 64","z4rold","an old woman in her sixties, grey hair under a patterned headscarf, a moonstone ring on her right hand, layered dark shawls, kohl-smudged tired eyes, a worn tarot deck"),
 "MOTHER":("MOTHER","adult 58","m4droza","a heavyset older woman, large gold hoop earrings, a grey bun, many rings, a fringed shawl, shrewd warm eyes, a tarot deck in her hands"),
 "DAUGHTER":("DAUGHTER","teen 15","h0llyd","a practical teenage girl, light brown hair in a plain ponytail, no jewellery, a school backpack, wary guarded face"),
 "MAN":("MAN","adult 33","s4mman","a gentle man in his thirties, dark curly hair, a soft flannel shirt, kind tired eyes, clean-shaven"),
 "WIDOW":("WIDOW","adult 54","m4rgwid","a pale grieving woman in her fifties, reddish hair pinned back, dressed in black, a silver oval locket at her throat, red-rimmed eyes"),
}
LOCS={
"mother_salon":("Салон матери (детство)","a small 1980s strip-mall fortune-telling parlor, a buzzing neon palm-and-eye sign in the window casting pink and cyan glow, beaded curtains, a round velvet-draped reading table, a crystal ball, dripping candles, tarot cards, worn oriental rug, dim warm clutter"),
"strip_mall_night":("Стрип-молл ночью","an ordinary American strip-mall at night, a row of glowing storefront neon signs, a laundromat and a pawn shop, a wet parking lot mirroring magenta and cyan neon, scattered cars, a flickering streetlamp, a huge dark sky above"),
"zara_salon":("Салон Зары","a fortune-teller's storefront salon, a large bright neon sign reading psychic tarot palm with a glowing hand-and-eye, plate glass hung with stars and moons, beaded curtain doorway, velvet drapes, layered candlelight and neon spilling onto the sidewalk"),
"reading_room":("Комната для гаданий","an intimate reading nook, a round table under a low fringed lamp, a crystal ball catching neon reflections, a spread of tarot cards on velvet, dripping candles, beaded curtains glowing pink and violet behind, incense haze"),
"zara_apartment":("Квартира Зары","a cramped apartment behind the salon, hung with protective charms and evil-eye beads, lit by neon bleed through the blinds and candle flame, cluttered shelves of trinkets, a small altar, warm and superstitious and close"),
"kitchen_charms":("Кухня в оберегах","a small dated kitchen strung with garlic, evil-eye charms and dried herbs, lines of salt along the windowsill, a candle burning on the table, neon glow leaking through a thin curtain, worn linoleum"),
"daughter_room":("Комната Холли","a teenager's plain tidy bedroom rebelling against the mystic clutter outside, bare walls, schoolbooks, a single salt line at the door left by someone else, cold daylight, no charms, deliberately ordinary"),
"widow_house":("Дом вдовы","a modest dim living room of a grieving woman, framed photographs of a dead husband on every surface, drawn curtains, a worn armchair, a clock stopped, faint grey light, heavy stillness"),
"diner_neon":("Неоновая закусочная","a late-night American diner glowing with red and blue neon, chrome stools, a long counter, vinyl booths, rain on the windows reflecting the neon, a jukebox, steam from coffee, almost empty"),
"parking_lot_rain":("Парковка под дождём","a strip-mall parking lot in night rain, every neon sign smeared and doubled in the wet asphalt, puddles glowing magenta and cyan, a lone shopping cart, falling rain streaked by the lights, a vast dark sky"),
"back_alley":("Задний переулок","a wet neon-lit back alley behind the storefronts, a buzzing service light, dumpsters, fire escapes, steam from a grate, pink and green neon reflected in puddles, graffiti, deep shadow"),
"cemetery_day":("Кладбище","a small overcast cemetery, rows of modest headstones, a fresh grave with raw earth, bare trees, wilting flowers, a low iron fence, flat grey daylight, no neon, drained and quiet"),
"bus_stop_neon":("Автобусная остановка","a city bus stop at night under a cold fluorescent shelter, a neon-lit street beyond, a bench, a posted schedule, wet pavement reflecting signs, a backpack-sized world about to leave"),
"pawn_shop":("Ломбард","the interior of a neighbouring pawn shop glowing with a neon open sign, glass cases of rings and watches, guitars on the wall, a barred counter, harsh light mixed with neon, a tired transactional air"),
"salon_dying":("Салон в упадке","the same fortune salon years later, half its neon dead and dark with only some letters lit, dust on the crystal ball, faded drapes, cracked plate glass, cobwebbed stars, a cold abandoned glow"),
"neon_bar":("Неоновый бар","a small dim neon lounge bar at night, glowing bottle shelves, red and blue tube lights, a worn wooden bar, a few empty stools, smoke haze, jukebox glow, intimate and seedy"),
"street_night":("Ночная улица","a quiet neon-soaked city side street at night, glowing shop signs, wet pavement, a flickering streetlamp, power lines, parked cars, reflections smeared along the asphalt, deep blue darkness"),
"salon_storefront_day":("Витрина салона днём","the fortune salon storefront seen by day with the neon switched off, dull grey tubes spelling psychic tarot, dusty window stars, a closed beaded curtain, an empty sunlit sidewalk, ordinary and small"),
}
TEMPLATES=[("b1","char_ip_graphic_novel","fortune/comfy/scene_single_character_graphic_novel_api.json"),
           ("b2","environment_graphic_novel","fortune/comfy/scene_environment_graphic_novel_api.json")]
ROUTES=[("b3","fortune_character_ip"),("b4","fortune_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: fortune exists"); return
    with open(os.path.join(ROOT,"scripts","fortune_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/fortune/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
    for i,(k,t,o,r) in enumerate(SCENES):
        cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","defaultReferenceProfileCode","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000a%x"%i,PROJ,k,t,o,r,NOW))
    cids={}
    for n,(code,disp) in enumerate(CHARS.items(),1):
        cid=PFX+"0000000000c%d"%n; cids[code]=cid
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,%s)',(cid,PROJ,code,disp,NOW))
        cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)',(PROJ,cid,NOW))
    for n,(pc,(cc,age,tr,base)) in enumerate(PROFILES.items(),1):
        cur.execute('INSERT INTO character_profiles (id,"characterId","profileCode","ageLabel","targetImages","promptBase","triggerToken","useIpAdapter","createdAt") VALUES (%s,%s,%s,%s,0,%s,%s,true,%s)',
                    (PFX+"0000000000d%x"%n,cids[cc],pc,age,base,tr,NOW))
    for n,(slug,(name,desc)) in enumerate(LOCS.items(),1):
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX+"000000000e%02x"%n,PROJ,slug,name,desc,NOW,NOW))
    for suf,key,path in TEMPLATES:
        cur.execute('INSERT INTO workflow_templates (id,"projectId","templateKey","filePath","visualStyle","createdAt") VALUES (%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000"+suf,PROJ,key,path,'graphic_novel_cell_shaded',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","fortune",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","cat_lady","comfy"); dst=os.path.join(ROOT,"data","fortune","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK fortune scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
