# -*- coding: utf-8 -*-
"""One-shot creation of the `cloakroom` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_cloakroom_foundation.py
«ТЫ — Гардеробщик. И это вся твоя жизнь.» Track B, f5, cell-shaded.
Unnamed Central European country, Habsburg-era drama theatre, 1987->2026, currency: crowns.
Cameos: GADALKA (canon from fortune/ZARA — moonstone ring), LIGA (canon from gaz/LIGA — gold ankle chain).
"""
import os, shutil, datetime, psycopg2
PFX="7e5f0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="cloakroom"
NAME="ТЫ — Гардеробщик. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.utcnow()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, modern brand logos, readable license plates, cyrillic text, national flag, coat of arms")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, atmospheric stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting dust. The entire scene is a still illustration come to life, freeze frame")

# (sceneKey, title, sortOrder, defaultReferenceProfileCode)
SCENES=[
 ("cold_open","Cold open — пустой зал ночью, ты на сцене + CTA",0,"CLOAK_OLD"),
 ("origin","Акт 1 — училище, голос, вешалка (1987-89)",1,"CLOAK_YOUNG"),
 ("gallery_a","Акт 2 — Человек с новым пальто + Вдова с двумя номерками",2,"CLOAK_MID"),
 ("gallery_b","Акт 3 — Провинциалка + Критик, который врёт",3,"CLOAK_MID"),
 ("gallery_c","Акт 4 — Отец и дочь раз в год + Нувориш транзита",4,"CLOAK_MID"),
 ("gallery_d","Акт 5 — Две бывшие примы + камео Гадалка",5,"CLOAK_MID"),
 ("gallery_e","Акт 6 — Девушка гонщика + Подросток + Мужчина не в зал",6,"CLOAK_MID"),
 ("turn","Акт 7 — точка невозврата, ложное возвращение голоса",7,"CLOAK_MID"),
 ("catastrophe","Акт 8 — тебя впервые увидели",8,"CLOAK_OLD"),
 ("aftermath","Акт 9 — ты зритель, по ту сторону стойки",9,"CLOAK_OLD"),
 ("coda","Финал — крючок №1, кода, дисклеймер",10,"CLOAK_OLD"),
]

# charCode -> displayName
CHARS={
 "CLOAK":"Гардеробщик (ты)",
 "COATMAN":"Человек с новым пальто",
 "WIDOW":"Вдова с двумя номерками",
 "PROVGIRL":"Провинциалка",
 "CRITIC":"Критик, который врёт",
 "FATHER":"Отец (раз в год)",
 "DAUGHTER":"Дочь (раз в год)",
 "NOUVEAU":"Нувориш транзита",
 "DIVAA":"Бывшая прима А",
 "DIVAB":"Бывшая прима Б",
 "TEEN":"Подросток в наушниках",
 "LOBBY":"Мужчина, не входящий в зал",
 "DIRECTOR":"Старый главреж",
 # CAMEOS are NOT defined here — they reuse EXISTING characters from other projects
 # (gaz/LIGA, fortune/ZARA) attached via project_characters M:N in main(). See CAMEO_CHARS.
}

# profileCode -> (charCode, ageLabel, triggerToken, promptBase EN — identity only, STYLE added by engine)
PROFILES={
 "CLOAK_YOUNG":("CLOAK","adult 24","cl04kyng","a thin hopeful young man of twenty-four, dark hair neatly combed, an expressive actor's face, wearing a maroon cloakroom attendant smock with a hand-sewn dark velvet collar as his constant identity anchor, a brass numbered cloakroom token on a loop of string at his chest"),
 "CLOAK_MID":("CLOAK","adult 43","cl04kmid","a lean man of forty-three, dark hair greying at the temples, a quiet weathered actor's face, wearing the same maroon cloakroom smock with a hand-sewn dark velvet collar as his constant identity anchor, a brass numbered token on a string at his chest"),
 "CLOAK_OLD":("CLOAK","adult 61","cl04kold","a gaunt stooped old man of sixty-one, thin grey hair, deep tired lines, hollow gentle eyes, wearing a worn maroon cloakroom smock with a frayed hand-sewn dark velvet collar as his constant identity anchor, a brass numbered token on a string at his chest"),
 "COATMAN_MID":("COATMAN","adult 42","c0atmanm","a smooth well-groomed man in his early forties, slicked dark hair, a confident charming face, always wearing a brand-new never-worn expensive overcoat as his constant identity anchor, sometimes a price tag still tucked in the sleeve"),
 "COATMAN_OLD":("COATMAN","adult 61","c0atmano","a hollow ageing man of sixty-one, thinning grey hair, a tired diminished face, wearing one old worn camel overcoat, the same coat he wore decades earlier, as his constant identity anchor"),
 "WIDOW_BASE":("WIDOW","adult 60","w1dowcl","a dignified grieving woman of sixty, silver hair in a neat low bun, a pale composed face, dressed in dark wool, always carrying a folded grey man's overcoat over her right arm as her constant identity anchor"),
 "PROVGIRL_YOUNG":("PROVGIRL","adult 22","pr0vgyng","an earnest provincial young woman of twenty-two, mousy brown hair pinned up carefully, an eager hopeful face, wearing a re-tailored turned coat with mismatched re-sewn buttons as her constant identity anchor"),
 "PROVGIRL_RICH":("PROVGIRL","adult 37","pr0vgrch","a polished wealthy woman of thirty-seven, brown hair in an expensive cut, a cool composed face, wearing fine furs, no longer recognising old faces"),
 "CRITIC_BASE":("CRITIC","adult 50","cr1ticcl","a sour fastidious theatre critic of fifty, thinning hair, narrow eyes behind glasses, a perpetual checked woollen scarf he refuses to remove as his constant identity anchor, a small notebook in his hand, the faint smell of cold cigarettes"),
 "FATHER_MID":("FATHER","adult 38","f4thrmid","a gentle careworn father of thirty-eight, short brown hair, a kind tired face, a plain decent coat, the habitual small gesture of buttoning a child's coat as his constant identity anchor"),
 "FATHER_OLD":("FATHER","adult 60","f4throld","a frail bent father of sixty, sparse grey hair, a thin diminished face, leaning slightly, the same gentle eyes"),
 "DGTR_CHILD":("DAUGHTER","kid 7","dg7rchld","a small bright girl of about seven, dark plaited hair, a neat little buttoned coat, wide trusting eyes, a plain unmarked happy face"),
 "DGTR_TEEN":("DAUGHTER","teen 15","dg7rteen","a slim girl of fifteen, dark hair in a ponytail, a self-conscious adolescent face, a simple modest coat"),
 "DGTR_ADULT":("DAUGHTER","adult 30","dg7radlt","a composed young woman of thirty, dark hair, a calm caring face, a plain elegant coat, the same gesture of buttoning a coat now turned toward her old father"),
 "NOUVEAU_BASE":("NOUVEAU","adult 45","n0uveau","a heavyset newly-rich man of forty-five, slicked hair, a florid impatient face, an expensive camel overcoat and a heavy gold signet ring on his right hand as his constant identity anchor"),
 "DIVAA_BASE":("DIVAA","adult 70","d1vaa","a grand former leading actress of seventy, swept-up white hair, theatrical makeup, a fox-fur stole with little glass eyes as her constant identity anchor, jewelled rings"),
 "DIVAB_BASE":("DIVAB","adult 68","d1vab","a former leading actress of sixty-eight, dyed auburn hair set in waves, a powdered proud face, a matching fox-fur stole with glass eyes as her constant identity anchor, long earrings"),
 "TEEN_BOY":("TEEN","teen 14","t33nboy","a sullen boy of fourteen, a grey hoodie under an open coat, in-ear white earphones as his constant identity anchor, a closed bored face"),
 "TEEN_GROWN":("TEEN","adult 20","t33ngrwn","a quiet thoughtful young man of twenty, short hair, an open attentive face, a plain coat, no earphones now"),
 "LOBBY_BASE":("LOBBY","adult 55","l0bbyman","a still watchful man of fifty-five, neat grey hair, a worn dignified overcoat, a quiet unreadable face, a man who checks his coat but never a ticket as his defining trait"),
 "DIRECTOR_BASE":("DIRECTOR","adult 65","d1rector","an old theatre director of sixty-five in 1989, a heavy build, a white goatee, a velvet jacket, half-moon glasses, kind shrewd heavy-lidded eyes"),
}

# CAMEOS — reuse EXISTING characters from other projects (same entity = same face/anchor across films).
# Attached to cloakroom via project_characters M:N; their shots reference the foreign profiles by code.
# gaz/LIGA (LIGA_BASE), fortune/ZARA (ZARA_YOUNG). Hard-coded ids from those projects' namespaces.
CAMEO_CHARS=[
 "6a200000-0000-4000-8000-0000000000c3",  # gaz LIGA  -> used in gallery_e via profile code LIGA_BASE
 "7e5d0000-0000-4000-8000-0000000000c1",  # fortune ZARA -> used in gallery_d via profile code ZARA_YOUNG
]

# slug -> (name RU, description EN ~400-700 char, no people, no style tokens)
LOCS={
 "cloakroom_counter":("Гардеробная стойка","a grand theatre cloakroom counter from the early twentieth century, a long polished dark-wood counter with a worn brass rail, behind it rows and rows of numbered brass hooks climbing the wall, many heavy coats hanging in dense ordered ranks, a small shallow bowl of brass numbered tokens on the counter, a low brass reading lamp, the marble foyer and a sweeping staircase blurred warm beyond, deep ordered shadow, an atmosphere of hushed waiting before a performance"),
 "foyer_marble":("Мраморное фойе","a grand Habsburg-era theatre foyer, a polished pale marble floor with an inlaid pattern, a sweeping double staircase with a gilded balustrade, tall gilt-framed mirrors, three crystal chandeliers, framed playbills on brass stands along the walls, ornate plaster mouldings and a painted coffered ceiling, warm pooled lamplight, an air of faded imperial grandeur"),
 "auditorium":("Зрительный зал на 800","a vast Habsburg-era horseshoe auditorium seating eight hundred, steep tiers of deep red velvet seats, gilded ornamental boxes stacked along the curved walls, a great painted allegorical ceiling around a dark chandelier, a heavy red-gold proscenium framing a dark stage, dim house light, an atmosphere of plush expectant emptiness"),
 "stage_empty":("Сцена (вид на пустой зал)","the bare wooden boards of a theatre stage seen from the stage looking out, a single bare ghost-light bulb on a stand casting a lonely circle, the dark cavern of eight hundred empty velvet seats and gilded boxes rising into blackness beyond, dust drifting in the light, ropes and a dim brick back wall behind, profound echoing emptiness"),
 "backstage_lost":("Бюро находок / закулисье","a dim backstage corridor, a long lost-property rail crowded with unclaimed overcoats of every era, costume racks of old productions behind, a mirror edged with a few dead bulbs, coiled ropes and a fire bucket, bare brick and exposed pipes, a single caged work-light, deep theatrical shadow and the smell of dust and old fabric"),
 "theatre_school":("Театральное училище (1987)","a worn 1980s acting-school rehearsal studio, a long wall of tall mirrors with a wooden ballet barre, scuffed honey-coloured parquet, tall arched windows letting in flat afternoon light, an upright piano in one corner, folding chairs stacked against a wall, a faded rehearsal of chalk marks on the floor, an air of youthful striving"),
 "hospital_throat":("Клиника (операция связок)","a spare late-1980s clinic examination room, a single metal-framed bed, an articulated throat-examination lamp on an arm, pale green tiled walls, a steel instrument trolley, a small high window with frosted glass, cold even clinical light, an atmosphere of sterile dread"),
 "director_office":("Кабинет главрежа","a cluttered old theatre director's office, a heavy dark wooden desk buried in scripts, walls densely hung with framed black-and-white production photographs, a worn green velvet armchair, a brass desk lamp, a tall window looking down onto the stage, shelves of bound playbills, warm dim scholarly light"),
 "dressing_mirror":("Гримёрка","a small theatre dressing room, a mirror framed with a row of warm round bulbs, a cluttered makeup shelf of greasepaint sticks and powder, a single costume on a stand, a worn velvet stool, peeling painted walls covered in pinned notes and old ticket stubs, intimate warm light"),
 "street_cobble":("Площадь у театра (брусчатка)","a cobbled square before the ornate facade of a Central European drama theatre, tall arched lit windows and a columned portico, an advertising column pasted with playbills, old cast-iron gas-style street lamps, bare plane trees, no signage in any readable language, a quiet evening atmosphere that changes with the seasons"),
 "locker_zone":("Зона электронных ячеек","a bank of modern electronic coat lockers newly installed against the old marble wall of the historic foyer, rows of grey metal doors with glowing blue keypads and small digital number displays, a sterile fluorescent strip overhead clashing harshly with the gilded plaster and chandelier above, cold impersonal light, an atmosphere of progress that has erased something"),
}

TEMPLATES=[("b1","char_ip_graphic_novel","cloakroom/comfy/scene_single_character_graphic_novel_api.json"),
           ("b2","environment_graphic_novel","cloakroom/comfy/scene_environment_graphic_novel_api.json")]
ROUTES=[("b3","cloakroom_character_ip"),("b4","cloakroom_environment")]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: cloakroom exists"); return
    with open(os.path.join(ROOT,"scripts","cloakroom_scriptText.md"),encoding="utf-8") as f: script=f.read()
    settings='{"styleLora": {"name": "style\\\\EldritchComicsXL1.2.safetensors"}}'
    cur.execute('''INSERT INTO projects (id,slug,name,"targetPlatform","safetyTier","ttsEngine","ttsVoiceRefPath","visualStyle","exportTiming",settings,"scriptText","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt","createdAt","updatedAt")
        VALUES (%s,%s,%s,'youtube','advertiser_safe','f5',%s,'graphic_novel_cell_shaded','narration',%s::jsonb,%s,%s,%s,%s,%s,%s,%s)''',
        (PROJ,SLUG,NAME,"data/cloakroom/tts/voice_reference.wav",settings,script,DEF_NEG,DEF_VNEG,DEF_MOT,DEF_SMOT,NOW,NOW))
    for i,(k,t,o,r) in enumerate(SCENES):
        cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder","defaultReferenceProfileCode","createdAt") VALUES (%s,%s,%s,%s,%s,%s,%s)',
                    (PFX+"0000000000a%x"%i,PROJ,k,t,o,r,NOW))
    cids={}
    for n,(code,disp) in enumerate(CHARS.items(),1):
        cid=PFX+"0000000000c%02x"%n; cids[code]=cid
        cur.execute('INSERT INTO characters (id,"projectId",code,"displayName","createdAt") VALUES (%s,%s,%s,%s,%s)',(cid,PROJ,code,disp,NOW))
        cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)',(PROJ,cid,NOW))
    # attach cameo characters from other projects (reuse existing entities, no duplicate rows)
    for cam in CAMEO_CHARS:
        cur.execute('SELECT 1 FROM project_characters WHERE "projectId"=%s AND "characterId"=%s',(PROJ,cam))
        if not cur.fetchone():
            cur.execute('INSERT INTO project_characters ("projectId","characterId","attachedAt") VALUES (%s,%s,%s)',(PROJ,cam,NOW))
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
    for sub in ("comfy","reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","cloakroom",sub),exist_ok=True)
    src=os.path.join(ROOT,"data","cat_lady","comfy"); dst=os.path.join(ROOT,"data","cloakroom","comfy"); c=0
    for fn in os.listdir(src):
        if fn.endswith(".json"): shutil.copyfile(os.path.join(src,fn),os.path.join(dst,fn)); c+=1
    cx.commit()
    print("OK cloakroom scenes=%d chars=%d profiles=%d locs=%d comfy=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS),c))
    cur.close(); cx.close()

if __name__=="__main__": main()
