# -*- coding: utf-8 -*-
"""One-shot creation of `coffee`. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_foundation.py
«ТЫ — Хозяйка кофейни.» Track B bright, f5 female «Нина», graphic_novel_cell_shaded (Eldritch_Classic_Comics).
Nameless country, money unnamed. ~40 min. No cameos."""
import os, shutil, datetime, psycopg2
PFX="7e680000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="coffee"
NAME="ТЫ — Хозяйка кофейни. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic violence, blood, gore, nudity, grim desaturated gloom")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, warm sunlit stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting steam and dust in sunlight. The entire scene is a still illustration come to life, freeze frame")

VOICE_ID="d63cdb03-20f0-4018-9e01-9ec54b7d4387"  # «Нина» (female, bio_plus)
VOICE_REF="data/_voices/bio_plus/voice_reference.mp3"

SCENES=[
 ("cold_open","Cold open — 31: утро 47-й кофейни + CTA",0,"ASYA_ADULT"),
 ("origin","Акт 1 — 8 лет: бабушка, турка, картонная кофейня",1,"ASYA_KID"),
 ("barista","Акт 2 — 18: сетевая, Марк, 200 стаканов",2,"ASYA_TEEN"),
 ("championship","Акт 3 — 21: чемпионат, второе место, тетрадь",3,"ASYA_TEEN"),
 ("opening","Акт 4 — 23: кредит, ремонт, «КОРИЦА», бабушкин кофе",4,"ASYA_YOUNG"),
 ("black_streak","Акт 5 — 24: аренда вдвое, сетевик, потоп со свечами",5,"ASYA_YOUNG"),
 ("regulars","Акт 6 — 24–25: гости по именам, газета, выправление",6,"ASYA_YOUNG"),
 ("pandemic","Акт 7 — 25: карантин, окно навынос, 120 стаканов врачам",7,"ASYA_YOUNG"),
 ("partner","Акт 8 — 26: Женя-партнёр, вторая точка, турка №2",8,"ASYA_YOUNG"),
 ("franchise","Акт 9 — 28: франшиза, 12 точек, стандарт №1",9,"ASYA_ADULT"),
 ("triumph","Акт 10 — 31: 47 кофеен, премия, вывеска детства",10,"ASYA_ADULT"),
 ("coda","Финал — девочка у окошка, солнышко корицей, CTA",11,"ASYA_ADULT"),
]

CHARS={
 "ASYA":"Ася (ты) — хозяйка кофейни",
 "GRAN":"Бабушка",
 "DAD":"Отец",
 "ZHENYA":"Женя — подруга и партнёр",
 "MARK":"Марк — наставник-бариста",
 "RIVAL":"Управляющий сетевой кофейни",
 "GIRL":"Девочка у окошка",
}

PROFILES={
 "ASYA_KID":("ASYA","kid 8","asyakid","a bright freckled girl of eight, copper-red hair in two short braids, a sunny yellow knitted beret, a gap-toothed eager smile, the yellow beret as her constant identity anchor"),
 "ASYA_TEEN":("ASYA","adult 19","asyateen","a lively freckled young woman of nineteen, copper-red hair in a high ponytail, a barista cap and a dark work apron over a striped tee, quick warm eyes, a thin yellow hairband under the cap as her constant identity anchor"),
 "ASYA_YOUNG":("ASYA","adult 24","asyayng","a determined warm freckled woman of twenty-four, copper-red hair in a loose bun with escaping strands, a bright yellow canvas apron over a linen shirt, cinnamon-dusted hands, the yellow apron as her constant identity anchor"),
 "ASYA_ADULT":("ASYA","adult 31","asyaadult","a radiant composed woman of thirty-one, copper-red hair in a neat low bun, light freckles, a warm camel coat over a bright yellow apron, a small cinnamon-stick pin on the lapel as her constant identity anchor"),
 "GRAN_BASE":("GRAN","adult 62","grancoffee","a warm round grandmother of sixty-two, silver hair under a red polka-dot headscarf, a flowered apron dusted with flour, laughing wrinkled eyes, the red polka-dot headscarf as her constant identity anchor"),
 "GRAN_OLD":("GRAN","adult 85","granold","a tiny bright-eyed great-grandmother of eighty-five, snow-white hair under a red polka-dot headscarf, a knitted shawl over her shoulders, a cane with a polished handle, the red polka-dot headscarf as her constant identity anchor"),
 "DAD_BASE":("DAD","adult 38","dadcoffee","a big gentle sceptical father of thirty-eight, short dark-blond hair, a checked flannel shirt with rolled sleeves, broad carpenter's hands, a folding wooden ruler in his breast pocket as his constant identity anchor"),
 "DAD_OLD":("DAD","adult 60","dadold","a big grey-templed father of sixty, thinning dark-blond hair, the same checked flannel shirt, reading glasses pushed up on his forehead, a folding wooden ruler in his breast pocket as his constant identity anchor"),
 "ZHENYA_BASE":("ZHENYA","adult 27","zhenya","a brisk cheerful woman of twenty-seven, black curly hair in a half-knot, round red-framed glasses, a smart cardigan over a blouse, a tablet hugged to her chest, the round red glasses as her constant identity anchor"),
 "MARK_BASE":("MARK","adult 45","markbar","a calm seasoned barista of forty-five, cropped grey hair and a grey moustache, a dark canvas apron with steel clasps, sure unhurried hands, a coffee-bean tattoo on his forearm as his constant identity anchor"),
 "RIVAL_BASE":("RIVAL","adult 40","rivalmgr","a polished chain-cafe manager of forty, slicked dark hair, a slate-grey suit with a corporate lanyard, a practiced retail smile, a metal name badge as his constant identity anchor"),
 "GIRL_KID":("GIRL","kid 8","girlkid","a small curious girl of eight, dark hair in a high bun with a ribbon, a puffy sky-blue jacket, round pink cheeks, the sky-blue jacket as her constant identity anchor"),
}

LOCS={
 "gran_kitchen":("Бабушкина кухня","a small sunlit grandmother's kitchen, copper pots on open shelves, a tiny cezve on a gas ring, glass jars of coffee beans and cinnamon with paper labels, lace curtains glowing with morning sun, a worn wooden table scrubbed pale, geraniums on the sill, the settled golden warmth of a kitchen where everything smells of home"),
 "yard_home":("Двор детства","a green summer courtyard between low friendly houses, a big cardboard box set up as a play cafe with a cut-out window, chalk drawings on the paving, a rope swing in a tree, laundry lines catching the light, bees over clover, the bright unhurried safety of a childhood yard"),
 "family_flat":("Квартира семьи","a modest warm family flat in the evening, a fabric-shaded lamp over a round table, bookshelves with framed photos, a child's drawings taped to a wardrobe door, tea things left out, soft amber light pooling on the floorboards, the easy comfort of an ordinary loving home"),
 "chain_cafe":("Сетевая кофейня","a busy corporate coffee bar interior, a long clean counter with twin espresso machines, printed menu boards, stacked branded cups, high stools by the window, bright even retail lighting, the brisk efficient rhythm of a place built for speed rather than staying"),
 "champ_hall":("Зал чемпионата","a bright competition hall for baristas, a row of stage workstations with espresso machines and timers, banners overhead, judges' tables with scorecards, an audience on folding chairs, spotlights over polished steel, the festive tension of a craft championship"),
 "empty_unit":("Пустой угловой зал","an empty corner retail unit with a huge arched window, dusty golden light across a bare wooden floor, peeling paint on good high walls, a ladder and paint cans, chalk marks measuring the counter-to-be, motes drifting in the sun, a space that is all promise"),
 "korica_cafe":("Кофейня «КОРИЦА»","a small warm corner cafe with six wooden tables, a big arched window full of daylight, yellow accents and copper lamps, a chalk menu with drawn suns, shelves of glass jars and a copper cezve in the place of honour, cinnamon sticks in a tin by the register, the amber hum of a room that smells of home"),
 "street_corner":("Улица у кофейни","a cheerful street corner outside a small cafe, a takeaway window with a wooden counter, flower planters and a bicycle leaned by the wall, string lights over the pavement, warm brick and painted shutters, morning gold on the cobbles, a corner people cross the street toward"),
 "rival_cafe":("Сетевик за стеной","a sterile chain coffee unit next door, grey plastic panels and harsh white light, discount posters with huge percent signs in the window, identical stools bolted in a row, a self-service counter, the flat convenience of a place with nothing to remember"),
 "bank_office":("Кредитный кабинет","a bright small loan office, a light wooden desk with tidy folders and a green desk plant, a window with thin sunny blinds, two comfortable chairs, a wall calendar with pencil notes, calm daylight, the neutral politeness of a room where futures are weighed"),
 "second_cafe":("Вторая точка","a second small cafe across the bridge, a narrow deep room with a skylight, the same yellow accents and copper lamps in a different geometry, a brick wall with a chalk sun, a bench outside under a young tree, fresh paint and new wood, the careful excitement of a first repetition"),
 "hq_loft":("Штаб сети","a sunny loft headquarters, a long communal wooden table with laptops and cups, a wall map dotted with pins, burlap sacks of coffee beans by a roasting corner, tall industrial windows full of sky, plants in tin cans, the busy warmth of a company that still smells of its product"),
 "new_cafe47":("47-я кофейня","a brand-new corner cafe on opening morning, a ribbon across the door and a cluster of orange balloons, gleaming copper lamps and yellow accents, a queue of cheerful silhouettes stretching down the pavement, steam on the cold morning air, sunlight breaking over the rooftops, the bright pride of a promise kept forty-seven times"),
 "city_bright":("Улицы городка","a cheerful small-city main street, painted facades in warm pastels, a tram line and bicycle racks, striped awnings over shop windows, pigeons and pram wheels on clean cobbles, soft golden hour light, the friendly bustle of a town that knows itself"),
 "market_beans":("Лавка обжарщика","a small coffee roastery shop, burlap sacks of beans open for scooping, brass scales and paper bags, a glowing roaster drum in the corner, shelves of labelled jars, warm toasty air visible in the light shafts, the nutty brown-gold cosiness of the trade at its source"),
}

TEMPLATES=[("b1","char_ip_graphic_novel","coffee/comfy/scene_single_character_graphic_novel_api.json"),
           ("b2","environment_graphic_novel","coffee/comfy/scene_environment_graphic_novel_api.json")]
ROUTES=[("b3","coffee_character_ip"),("b4","coffee_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: coffee exists"); return
    with open(os.path.join(ROOT,"scripts","coffee_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Eldritch_Classic_Comics_1.1.5.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","ttsVoiceoverId","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
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
                    (PFX+"0000000000"+suf,PROJ,key,path,'graphic_novel_cell_shaded',NOW))
    for suf,key in ROUTES:
        cur.execute('INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s,%s)',(PFX+"0000000000"+suf,PROJ,key,NOW))
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","coffee",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","surrogate","comfy"); dst=os.path.join(ROOT,"data","coffee","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK coffee scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
