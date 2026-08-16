# -*- coding: utf-8 -*-
"""One-shot creation of the `mascot` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_mascot_foundation.py"""
import os, datetime, psycopg2
PFX="7e5e0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="mascot"
NAME="ТЫ — Маскот. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, modern brand logos, readable license plates")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint heat-haze. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — подсобка, «сейчас», голова маскота на столе",0,"MAN_OLD"),
 ("act01_invisible","Акт 1 — незаметный ребёнок",1,"MAN_KID"),
 ("act02_first_mask","Акт 2 — первая маска, его впервые видят",2,"MAN_KID"),
 ("act03_first_mascot","Акт 3 — первый маскот (молл)",3,"MAN_YOUNG"),
 ("act04_her","Акт 4 — она влюбляется в маскота",4,"MAN_YOUNG"),
 ("act05_family","Акт 5 — семья, он всегда в костюме",5,"MAN_YOUNG"),
 ("act06_rising","Акт 6 — восхождение, ребёнок обнимает куклу",6,"MAN"),
 ("act07_dream","Акт 7 — кастинг в маскота ЧМ-2026",7,"MAN"),
 ("act08_worldcup","Акт 8 — ЧМ-2026, спектакль, миллиарды глаз",8,"MASCOT"),
 ("act09_heat","Акт 9 — жара и цена внутри головы",9,"MAN"),
 ("act10_peak","Акт 10 — финал турнира, обморок, подмена",10,"MASCOT"),
 ("act11_after","Акт 11 — после: списали, забыли, старость",11,"MAN_OLD"),
 ("act12_finale","Финал — снимает голову, лицо без улыбки, кода",12,"MAN_OLD"),
]
CHARS={"MASCOT":"Маскот (орёл ЧМ)","MAN":"Человек (ты)","WIFE":"Жена","KID":"Ребёнок","MANAGER":"Менеджер ивентов"}
PROFILES={
 "MASCOT":("MASCOT","costume","m4scot","a large grinning cartoon mascot costume of a golden eagle, an oversized round head with a permanent wide friendly smile and big round eyes, a bright tournament soccer jersey in bold blue and gold, huge soft white-and-gold foam paws, a plush feathered body, a glossy orange beak"),
 "MAN_KID":("MAN","kid 8","m4nkid","a small forgettable shy boy about eight, plain brown hair, oversized hand-me-down clothes, downcast nervous eyes, a quiet unnoticed face"),
 "MAN_YOUNG":("MAN","adult 25","m4nyng","a thin shy young man in his twenties, plain brown hair, a forgettable nervous face, a plain t-shirt, slightly stooped shoulders"),
 "MAN":("MAN","adult 52","m4nmid","a thin balding man in his early fifties, a sweat-soaked undershirt, tired hollow eyes, grey stubble, a gentle worn face that has forgotten how to smile"),
 "MAN_OLD":("MAN","adult 66","m4nold","a frail balding old man in his sixties, a gaunt sunken face, sparse grey hair, stooped, deeply tired quiet eyes"),
 "WIFE":("WIFE","adult 30","w1femsc","a warm woman in her thirties, dark shoulder-length hair, a kind tired face, a plain summer dress"),
 "KID":("KID","kid 7","k1dmsc","a small excited child about seven, sandy hair, holding a small toy, bright trusting eyes"),
 "MANAGER":("MANAGER","adult 45","m4nager","a brisk events manager in his forties, a polo shirt and a lanyard badge, a headset, a clipboard tablet, an impatient face"),
}
LOCS={
"mascot_backroom":("Подсобка костюмов","a dim costume back room, several oversized mascot heads on metal shelves, hanging plush fur suits on a rack, a folding table, an electric fan, scuffed concrete floor, a single fluorescent tube overhead"),
"mask_interior":("Изнанка маски (внутри головы)","the dark cramped inside of a giant foam mascot head, padded foam walls close around, a mesh eye-screen letting in bright slatted light, a small faded photograph taped beside the eye-mesh, sweat-damp foam, claustrophobic"),
"childhood_home":("Дом детства","a modest 1980s American living room, a worn plaid sofa, a small boxy television, faded floral wallpaper, a child's toys in one corner, warm dim afternoon light"),
"school_gym":("Школьный спортзал (утренник)","an American school gymnasium set up for a children's holiday show, a small low stage with a paper backdrop, rows of folding chairs, taped paper decorations, harsh bright overhead lights, a polished wood floor"),
"mall_atrium":("Атриум торгового центра","a 1990s American shopping-mall atrium, a tiled fountain, escalators, glass storefronts, a small carpeted stage for a costumed mascot, balloons, a bright glass skylight above"),
"fairground":("Ярмарка","a county fairground at dusk, a lit ferris wheel, striped game stalls, strings of warm bulbs, sawdust underfoot, a small roped meet-and-greet spot, a soft summer evening glow"),
"family_kitchen":("Кухня семьи","a small American kitchen, a formica table, a fridge covered with children's crayon drawings, a window over the sink, worn linoleum, warm domestic light"),
"suburban_street":("Пригородная улица","an ordinary American suburban street, modest single-storey houses, mown lawns, a cracked driveway, parked sedans, flat bright summer daylight"),
"minor_field":("Поле низшей лиги","a small minor-league ballpark, low metal bleachers, chalk-lined grass, faded advertising boards along the fence, a hot hazy afternoon sky"),
"audition_room":("Кастинг-комната","a bare audition room, a taped X on the floor, a long folding table with empty judges' chairs, a costume rack against the wall, harsh even fluorescent light"),
"stadium_bowl":("Чаша стадиона (ЧМ)","a vast packed World Cup stadium bowl in blazing summer daylight, tens of thousands of seats full of colour and flags, a brilliant green pitch, advertising hoardings, shimmering heat above the stands"),
"stadium_tunnel":("Тоннель стадиона","a concrete stadium players' tunnel, harsh strip lights along the ceiling, sponsor advertising boards on the walls, a bright blinding mouth opening onto the sunlit pitch ahead"),
"fan_zone":("Фан-зона ЧМ","a World Cup fan festival in a hot city plaza, a giant screen, tournament banners, food trucks, bunting and flags overhead, bright midday summer sun, scattered litter"),
"dressing_area":("Гримёрка маскота","a cramped mascot dressing area under the stands, an electric fan, rows of water bottles, the eagle suit on a stand, towels, sweat-stained concrete, hot stale air"),
"city_summer":("Жаркий город (ЧМ)","a hot American host city in high summer, World Cup banners on the lampposts, glass office towers, heat haze rippling off the asphalt, a busy sunlit avenue"),
"museum_case":("Музейная витрина","a glass display case in a sports museum, the eagle mascot costume mounted upright under warm spotlights, a small engraved plaque, a polished reflective floor, hushed gallery light"),
"storage_warehouse":("Склад костюмов","a dim storage warehouse, long rows of metal shelving stacked with retired costumes sealed in clear plastic, dust in the air, a single bare bulb, deep shadow"),
"stadium_parking":("Парковка у стадиона","a vast hot stadium parking lot in summer after a match, shimmering empty asphalt, painted lines, the great stadium rising in the distance, scattered litter, low evening sun"),
}
    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: mascot exists"); return
    with open(os.path.join(ROOT,"scripts","mascot_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/mascot/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","mascot",sub),exist_ok=True)
    cx.commit()
    print("OK mascot scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
