# -*- coding: utf-8 -*-
"""One-shot creation of the `teacher` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_teacher_foundation.py
«ТЫ — Учительница. И это вся твоя жизнь.» Track B, f5 (female), graphic_novel_flux (Comic_Style FLUX, как kept_woman).
Nameless country, no currency named. ~40 min target. No cameos.
"""
import os, datetime, psycopg2
PFX="7e6b0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="teacher"
NAME="ТЫ — Учительница. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

SCENES=[
 ("cold_open","Cold open — 2026: кухня, чужой мальчик, «а свои дети у вас есть?» + CTA",0,"LIDA_OLD"),
 ("chalk","Акт 1 — 1975: первый класс, Тамара Павловна, мел, имя на доске",1,"LIDA_KID"),
 ("medal","Акт 2 — 1985: медаль, мечта, болезнь матери, кольцо, пединститут",2,"LIDA_YOUNG"),
 ("first_bell","Акт 3 — 1990–93: первый урок, «три года», 5Б, астры",3,"LIDA_YOUNG"),
 ("sugar","Акт 4 — 1994–96: свадьба, невыплаты, мешки сахара, рынок, Саня",4,"LIDA_YOUNG"),
 ("gate","Акт 5 — 1999: гимназия ×6, пальцы в мелу, отказ (точка невозврата)",5,"LIDA_MID"),
 ("red_pen","Акт 6 — 2003–07: аспирантура брошена, 68 тетрадей, «вот доведу», врач",6,"LIDA_MID"),
 ("empty_flat","Акт 7 — 2009: Володя уходит, «руки всегда в мелу»",7,"LIDA_MID"),
 ("tutor","Акт 8 — 2014: Саня-бизнесмен привозит дочь, час = дневная ставка",8,"LIDA_MID"),
 ("aula","Акт 9 — 2018–20: защита Кати, чужая мечта; дистанционка",9,"LIDA_OLD"),
 ("last_bell","Акт 10 — 2024: оптимизация, последний звонок, грамота и чайник",10,"LIDA_OLD"),
 ("coda","Финал — 2026: ответ мальчику, пустой класс, новый мел, CTA, дисклеймер",11,"LIDA_OLD"),
]

CHARS={
 "LIDA":"Лидия (ты) — учительница",
 "TAMARA":"Тамара Павловна — первая учительница",
 "MAMA":"Мать — швея",
 "VOLODYA":"Володя — муж, инженер",
 "SANYA":"Саня — двоечник, потом бизнесмен",
 "KATYA":"Катя — лучшая ученица, потом профессор",
 "PUPIL":"Мальчик-ученик (2026)",
}

PROFILES={
 "LIDA_KID":("LIDA","child 7","lidakid","a thin bright-eyed schoolgirl of seven, chestnut-brown hair in two tight braids with large white ribbon bows, attentive grey eyes, a plain dark school pinafore dress over a white blouse, standing very straight, no marks on her face"),
 "LIDA_YOUNG":("LIDA","adult 22","lidayng","a slender earnest young woman of twenty-two, chestnut-brown hair in a neat low ponytail, clear grey eyes, a modest knee-length wool skirt and simple blouse, an upright posture, a thin silver ring with a small amber stone on her right hand as her constant identity anchor"),
 "LIDA_MID":("LIDA","adult 39","lidamid","a composed tired woman of thirty-nine with a straight teacher's back, chestnut-brown hair in a low bun with the first grey strands at the temple, calm grey eyes with fine lines starting, a neat plain cardigan over a blouse, faint white chalk dust on her fingers, a thin silver ring with a small amber stone on her right hand as her constant identity anchor"),
 "LIDA_OLD":("LIDA","adult 58","lidaold","a thin upright woman of fifty-eight, short silver-streaked chestnut hair pinned back simply, steady grey eyes behind slim reading glasses, a worn but tidy dark cardigan, work-thinned hands, a thin silver ring with a small amber stone on her right hand as her constant identity anchor"),
 "TAMARA_BASE":("TAMARA","adult 55","tamarab","a stately schoolmistress of fifty-five, silver hair in a high firm bun, a strict dark-green skirt suit with a white collar, an upright commanding but kind bearing, pearl clip earrings as her constant identity anchor"),
 "MAMA_BASE":("MAMA","adult 50","mamab","a worn provincial seamstress of fifty, ash-grey hair in a low simple knot, tired kind eyes, sewing glasses pushed up on her forehead, rough needle-pricked hands, a grey downy shawl over her shoulders as her constant identity anchor"),
 "VOLODYA_YOUNG":("VOLODYA","adult 26","volodyay","a lean practical young engineer of twenty-six, short sandy-ginger hair, an open freckled face, a plain grey jacket over a checked shirt, capable hands, a steel chronograph watch on his right wrist as his constant identity anchor"),
 "VOLODYA_MID":("VOLODYA","adult 41","volodyam","a heavier disappointed man of forty-one, short sandy-ginger hair receding at the temples, a tired set jaw, a dark practical jacket, the same steel chronograph watch on his right wrist as his constant identity anchor"),
 "SANYA_KID":("SANYA","teen 13","sanyakid","a stocky impudent schoolboy of thirteen, jet-black hair in a rough crew cut, a crooked grin, an untucked shirt under a worn jacket, a school backpack slung over one shoulder only, no marks on his face"),
 "SANYA_RICH":("SANYA","adult 31","sanyarich","a broad confident self-made man of thirty-one, jet-black hair slicked back with gel, a heavy jaw and easy grin, an expensive black leather jacket over a dark shirt, a thick silver chain around his neck as his constant identity anchor"),
 "KATYA_KID":("KATYA","teen 16","katyakid","a serious slight schoolgirl of sixteen, copper-red hair in a long neat braid, freckles, round thin-rimmed glasses as her constant identity anchor, a dark school dress with a white collar, a book always held to her chest"),
 "KATYA_PROF":("KATYA","adult 37","katyaprof","a poised academic woman of thirty-seven, copper-red hair in a strict short cut with early grey threads, the same round thin-rimmed glasses as her constant identity anchor, a tailored dark-blue suit, a confident quiet bearing"),
 "PUPIL_BASE":("PUPIL","child 10","pupilb","a small fidgety schoolboy of ten, dark-chestnut curly hair, slightly protruding ears, a bright puffy jacket hung on his chair, a squeezed pencil in his fist, no marks on his face"),
}

LOCS={
 "classroom_soviet":("Класс 1975 (Тамарин)","a small-town primary classroom of the mid nineteen-seventies, rows of worn wooden lift-lid desks scarred by decades of pencils, a wide blackboard with a chalk rail and a damp rag, a tall tiled stove in the corner, tall bare windows with deep sills and potted geraniums, portraits in thin frames above the board, dark oiled floorboards, low winter sun laying long warm stripes across the desks, an atmosphere of ink, chalk dust and strict early-morning quiet"),
 "classroom_hers_90s":("Её класс, 90-е","a secondary-school classroom on the edge of a provincial city in the nineteen-nineties, three rows of pale laminate desks with tube-steel legs, a long dark-green chalkboard with a chalk rail, tall wooden-framed windows painted many times over, aloe and violets in tins on the sill, a wall of cabinets with stacked textbooks, a teacher's desk with a class register, worn linoleum the colour of weak tea, flat grey daylight, an atmosphere of chalk dust, damp coats and patient routine"),
 "classroom_hers_2010s":("Её класс, 2010-е","the same secondary-school classroom two decades on, the same three rows of desks now newer laminate, the same long dark-green chalkboard kept in use beside a bolted-on interactive flat panel, white plastic double-glazed windows where wooden frames used to be, the same aloe in a tin on the sill, a projector bracket on the ceiling, cool even LED light mixing with pale daylight, an atmosphere of two eras of school overlapping in one room"),
 "school_corridor":("Школьный коридор","a long school corridor with a worn red-brown painted floor and a scuffed pale wall dado, rows of brown classroom doors with small plaques, a wall of framed class photographs and a faded paper wall newspaper, radiators under tall windows at the far end, a drinking fountain, the hollow echo-prone emptiness of a corridor during lessons, thin daylight pooling on the floor"),
 "teachers_room":("Учительская","a cramped staff room with a long table covered in green baize, stacks of class registers and exercise books, a cabinet of trophies and old banners, a wall timetable board with paper slips, a kettle and mismatched cups on a tray by the window, coats on a rack in the corner, tired chairs, warm low lamplight against grey window light, an atmosphere of strong tea and quiet exhaustion"),
 "assembly_hall":("Актовый зал","a school assembly hall with a low wooden stage and heavy dark-red curtains, rows of folding seats, tall windows with drawn thin curtains, a lectern with a microphone to one side, garlands of paper flowers and balloons along the stage edge, a polished parquet floor, festive strained brightness over an undertone of institutional wear"),
 "school_yard":("Школьный двор","the paved front yard of a provincial school, a three-storey brick school building with wide entrance steps behind, painted line markings on cracked asphalt, young lime trees along a low fence, a flagpole, the open space where September assemblies form up, thin autumn sunlight and long morning shadows, an atmosphere of gathered voices and cut flowers"),
 "lida_kitchen":("Кухня Лиды","a small tidy city-flat kitchen, a compact gas stove and enamel kettle, a small table by the window with an oilcloth in a faded check, open shelves of neat jars, a cutting board worn hollow, school exercise books and a red pen at one end of the table where suppers should be, a window over a courtyard of bare poplars, warm modest lamplight, an atmosphere of order, tea and solitary evenings"),
 "village_kitchen":("Кухня матери в посёлке","a poor village kitchen, a whitewashed stove, a small table under a lace-edged curtain window, an old treadle sewing machine in the corner with a garment folded over it, jars of preserves on shelves, a tin washbasin, herbs drying above the stove, low golden lamplight against blue dusk in the window, an atmosphere of thrift, warmth and worry"),
 "institute_hall":("Аудитория пединститута","a steep tiered lecture hall of a pedagogical institute, long curved wooden benches and fold-down writing boards polished by sleeves, tall windows with dusty shafts of light, a wide triple blackboard on the far wall, a lectern on a low podium, plaster busts on a shelf, the vast hush of a hall built for two hundred voices, chalk motes drifting in the light"),
 "gym_office":("Кабинет директора гимназии","a renovated private-school director's office of the late nineteen-nineties, a wide polished desk with a leather blotter and a heavy pen stand, a new computer monitor angled aside, framed licenses on a freshly painted wall, vertical blinds slicing bright daylight, a rubber plant in a brass pot, two upholstered visitor chairs, an atmosphere of new money, promise and quiet pressure"),
 "market_90s":("Вещевой рынок 90-х","an open-air clothes market of the nineteen-nineties, rows of metal-framed stalls hung with shiny tracksuits and leather jackets under striped tarpaulins, folding tables of boxed goods, checkered shuttle bags stacked as counters, slushy trampled ground, traders in fingerless gloves warming hands on thermos cups, a cold white winter sky, an atmosphere of loud survival and cardboard signs"),
 "sanya_house":("Дом Сани","an expensive open-plan kitchen and dining room in a new private house, glossy dark cabinets and a stone-topped island, a huge television on the wall, oversized leather sofas beyond an archway, marble-look floor tiles, a heavy chandelier, schoolbooks looking small and out of place on the vast dining table, bright even rich light, an atmosphere of new wealth without habits for it"),
 "univer_aula":("Университетская аула","a grand university assembly hall with dark panelled walls and a high coffered ceiling, steep banks of upholstered seats, a long presidium table with green cloth and microphones, a projection screen glowing above, brass sconces, marble steps at the doors, the dense formal hush of an old institution, motes in the projector beam"),
 "street_winter":("Улица у школы, зима","a quiet street outside a provincial school in winter, trodden snow paths between low apartment blocks, bare poplars against a pale mauve dusk, warm yellow windows lighting one by one, a bent streetlamp with a cold halo, footprints and sled tracks, chimney smoke standing straight in still frost, an atmosphere of long walks home and early darkness"),
 "wedding_cafe":("Кафе, свадьба 1994","a small provincial cafe rented for a modest wedding in the nineteen-nineties, pushed-together tables under mismatched cloths, paper garlands and balloons taped to wood-panelled walls, a cassette player on a stool by a tinsel-framed mirror, salads in cut-glass bowls, a single window with net curtains and low afternoon sun, an atmosphere of borrowed festivity and sincere modest joy"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: teacher exists"); return
    with open(os.path.join(ROOT,"scripts","teacher_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\Comic_Style_-_FLUX.safetensors"}, "fluxBaseModel": "flux1-dev-kontext_fp8_scaled.safetensors"}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_flux','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/teacher/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","teacher",sub),exist_ok=True)
    cx.commit()
    print("OK teacher scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
