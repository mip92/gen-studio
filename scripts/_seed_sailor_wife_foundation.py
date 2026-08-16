# -*- coding: utf-8 -*-
"""One-shot creation of the `sailor_wife` project. Run: PYTHONIOENCODING=utf-8 python scripts/_seed_sailor_wife_foundation.py
«ТЫ — Жена моряка. И это вся твоя жизнь.» Track B (тёплая элегия), f5 (female), graphic_novel_cell_shaded (Eldritch, как coffee).
Nameless country, no currency. ~35 min. ALL shots animated. No cameos.
"""
import os, datetime, psycopg2
PFX="7e6c0000-0000-4000-8000-"; PROJ=PFX+"000000000001"; SLUG="sailor_wife"
NAME="ТЫ — Жена моряка. И это вся твоя жизнь."
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NOW=datetime.datetime.now()

DEF_NEG=("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, modern brand logos, readable license plates, cyrillic text, national flags, currency symbols, banknotes with denominations, graphic violence, blood, gore, nudity, grim desaturated gloom")
DEF_VNEG=("blurry, low quality, watermark, text overlay, jpeg artifacts, deformed face, deformed hands, extra fingers, bad anatomy, photoreal, photograph, plastic skin, oversmooth, smooth gradient shading, hyperrealistic, motion blur, frame stutter, jitter, warping, melted face, flicker, scene cut, sudden cut, abrupt transition, identity change, modern brand logos, anime character appearing, anime girl, manga character, new people entering frame, extra humans")
DEF_MOT=("subtle camera push-in, gentle breathing motion, natural micro-movements, the figure quietly continuing the moment, no abrupt gestures, sea-air stillness with small life signs, cell-shaded illustration in motion, hand-drawn animation cadence")
DEF_SMOT=("completely static shot, frozen frame, locked-off tripod camera, no camera motion, no parallax, no zoom, no pan, no dolly, no handheld shake. Every object remains stationary. No figures moving, only faint drifting sea haze and gull-light. The entire scene is a still illustration come to life, freeze frame")
VOICE_ID="d63cdb03-20f0-4018-9e01-9ec54b7d4387"  # «Нина» (female, как coffee) — placeholder, уточнить
VOICE_REF="data/_voices/bio_plus/voice_reference.mp3"

SCENES=[
 ("cold_open","Cold open — 2026: туман, гудок, вопрос внучки + CTA",0,"ANNA_OLD"),
 ("dance","Акт 1 — 1978: клуб моряков, курсант, первое ожидание",1,"ANNA_YOUNG"),
 ("vows","Акт 2 — 1980: свадьба за 9 дней до рейса, кулон, три гудка",2,"ANNA_YOUNG"),
 ("letters","Акт 3 — 1982–84: письма, радиограмма, дочь в 8 месяцев",3,"ANNA_YOUNG"),
 ("queen","Акт 4 — 1985–90: ритм пароходства, «живёшь как королева»",4,"ANNA_YOUNG"),
 ("collapse","Акт 5 — 1992–97: чужой флаг, переговорный, 6 минут",5,"ANNA_MID"),
 ("two_contracts","Акт 6 — 1998: «сходи ещё два контракта» (точка невозврата)",6,"ANNA_MID"),
 ("daughter","Акт 7 — 2004: свадьба Оли без отца, танец с фотографией",7,"ANNA_MID"),
 ("storm","Акт 8 — 2008: трое суток без связи, чужой седой человек",8,"ANNA_MID"),
 ("ashore","Акт 9 — 2015: списан на берег, двое чужих в одной квартире",9,"ANNA_OLD"),
 ("learning","Акт 10 — 2016–25: узнавание заново, набережная, внучка",10,"ANNA_OLD"),
 ("coda","Финал — 2026: ответ внучке, два кресла, гудок сидя, CTA, дисклеймер",11,"ANNA_OLD"),
]

CHARS={
 "ANNA":"Анна (ты) — жена моряка",
 "VIKTOR":"Виктор — муж, моряк дальнего плавания",
 "OLYA":"Оля — дочь",
 "ZINA":"Зина — соседка",
 "VNUCHKA":"Внучка",
}

PROFILES={
 "ANNA_YOUNG":("ANNA","adult 20","annayng","a warm-eyed young woman of twenty, dark-chestnut wavy hair to her shoulders, soft brown eyes, a modest bright summer dress of the late seventies, an open hopeful face, a small silver anchor pendant on a fine chain at her throat as her constant identity anchor"),
 "ANNA_MID":("ANNA","adult 44","annamid","a composed patient woman of forty-four, dark-chestnut wavy hair pinned up with the first grey threads, soft brown eyes that check the window out of habit, a neat practical cardigan, the same small silver anchor pendant at her throat as her constant identity anchor"),
 "ANNA_OLD":("ANNA","adult 66","annaold","a gentle upright woman of sixty-six, short silver waves, warm brown eyes in a net of kind lines, a soft knitted shawl-collar cardigan, the same small silver anchor pendant at her throat as her constant identity anchor"),
 "VIKTOR_YOUNG":("VIKTOR","adult 24","viktoryng","a broad-shouldered merchant-navy cadet of twenty-four, fair curly hair, a sun-browned open face, a dark pea coat with cadet stripes, big careful hands, a small swallow tattoo on his left forearm as his constant identity anchor"),
 "VIKTOR_MID":("VIKTOR","adult 48","viktormid","a weathered merchant seaman of forty-eight, fair hair bleached and greying, short salt-and-pepper stubble, deep wind lines around pale grey eyes, a worn dark work sweater, the same swallow tattoo on his left forearm as his constant identity anchor"),
 "VIKTOR_OLD":("VIKTOR","adult 68","viktorold","a heavy-set old seaman of sixty-eight, white short beard and white cropped hair, pale grey eyes gone soft, a thick knitted navy cardigan, hands that no longer hurry, the same swallow tattoo faded on his left forearm as his constant identity anchor"),
 "OLYA_KID":("OLYA","child 7","olyakid","a light-haired girl of seven with her father's fair colouring, a neat braid, curious grey eyes, a little red knitted scarf as her constant identity anchor, no marks on her face"),
 "OLYA_ADULT":("OLYA","adult 30","olyaad","a slender fair-haired woman of thirty, short practical haircut, her father's grey eyes, a thin red scarf worn loosely as her constant identity anchor, a calm decisive manner"),
 "ZINA_BASE":("ZINA","adult 40","zinab","a loud kind-hearted neighbour of forty, hennaed copper-red hair teased high, strong arms, a bright floral housecoat or a heavy winter coat by season, large gold hoop earrings as her constant identity anchor"),
 "VNUCHKA_BASE":("VNUCHKA","child 8","vnuchkab","a small girl of eight with dark curly hair like her grandmother's youth, bright dark eyes, a striped sailor-style shirt she loves, no marks on her face"),
}

LOCS={
 "sailors_club":("Клуб моряков","a port-town seamen's club hall of the late nineteen-seventies, a parquet dance floor under a mirror-ball's slow constellations, a small stage with an accordion and a double bass, paper garlands between columns, sailors' dress uniforms and bright summer dresses mixing, tall windows open to a warm harbour night, an atmosphere of brass-band warmth and beginnings"),
 "port_quay":("Причал","a working port quay, a high dark ship's side towering over the concrete, mooring bollards wrapped in heavy rope, a gangway with a rope rail, cranes drawing slow angles against the sky, gulls riding the wind, oil-rainbow puddles between crates, the huge held breath of departures and returns"),
 "harbor_panorama":("Панорама порта","a wide harbour panorama from the town's high shore, breakwater arms holding a silver stretch of water, cranes and masts in layered silhouette, a small white lighthouse at the pier head, weather moving over the bay in visible curtains, the town's roofs stepping down to the docks, an atmosphere of watched horizons"),
 "anna_window_room_80s":("Комната с окном на порт, 80-е","a modest bright flat room of the nineteen-eighties with one large window overlooking the harbour cranes, lace curtains tied back, a polished sideboard, a sofa with crocheted headrests, a single wooden shelf on the wall holding a few small foreign souvenirs, a radio on a doily, warm homely order kept for someone away, the window the true centre of the room"),
 "anna_window_room_2020s":("Комната с окном на порт, 2020-е","the same flat room four decades on, the same large window on the harbour now double-glazed, the lace replaced by plain warm curtains, two worn armchairs turned toward the window side by side, the wooden shelf now long and crowded end to end with decades of small souvenirs, a folded tartan blanket, soft aged light, an atmosphere of two lives finally in one room"),
 "anna_kitchen":("Кухня Анны","a small port-flat kitchen, an enamel stove and a humming round-shouldered fridge, a table by the wall with an oilcloth of faded shells pattern, a tin of tea and a jar of hard candy, a ship's calendar pinned by the door with days crossed off in pencil, steam on the window against evening blue, an atmosphere of meals kept warm and waiting"),
 "wedding_hall":("Зал бракосочетаний","a modest civil wedding hall of nineteen-eighty, a red carpet runner on parquet, a heavy official desk with a ledger and a globe of flowers, rows of borrowed chairs with ribbon bows, tall windows with sheer curtains, an accordionist waiting in the corner, an atmosphere of brief official festivity and enormous private meaning"),
 "post_office":("Почта / переговорный пункт","a provincial post and call office, a row of numbered wooden telephone booths with glass doors, a high counter with brass scales and telegram forms, a wall clock everyone watches, benches worn smooth by waiting, notice boards of tariffs, the smell of sealing wax and ink, an atmosphere of queued minutes and rationed voices"),
 "ship_bridge":("Мостик судна","the bridge of a working cargo ship, a wide row of slanted windows over a long bow deck and open sea, a helm and engine telegraph, radar hoods glowing green, charts weighted open on the table, mugs in gimbals, the horizon tilting slowly with the swell, an atmosphere of duty and distance"),
 "ship_cabin":("Каюта","a narrow ship's cabin, a bunk with a raised lee-board, a fold-down desk with a writing pad and a family photograph clipped above it, a porthole with a heavy screw rim, an oilskin on a hook swaying with the roll, a small lamp haloing the paper, an atmosphere of letters written between watches"),
 "storm_sea":("Штормовое море","open sea in a full gale, mountainous grey-green swells with torn white crests, spray blown flat off the wave tops, a low black sky dragging squall curtains, no horizon line to hold, the water's indifferent enormous motion, an atmosphere of weather that does not know any names"),
 "seafarers_office":("Контора пароходства","a shipping-line crewing office, a corridor of doors with painted numbers, a hall with a long counter and pigeonhole shelves of contract folders, a wall board of vessel names and sailing dates in movable letters, men with kit bags waiting on benches, an atmosphere of stamped papers deciding years"),
 "doch_wedding_cafe":("Кафе, свадьба Оли","a bright banquet cafe of the mid two-thousands dressed for a wedding, balloon arches and tulle bows on chair backs, a long table with salads and a modest tiered cake, a rented sound system with coloured lights, a framed photograph on a chair of honour at the head table, an atmosphere of joy with one empty place"),
 "promenade":("Набережная","a stone seafront promenade with a painted railing above the harbour water, benches facing the sea, a small white lighthouse at the pier end, gulls hanging still on the wind, old mooring rings in the stone, ships passing close enough to read their draft marks, an atmosphere of unhurried salt air"),
 "courtyard_bench":("Двор, лавочка","the inner courtyard of a port-town apartment block, a bench under an old acacia, laundry lines between poles, bicycles against a fence, a rug-beating frame, gossiping windows open over geraniums, an atmosphere of everyone knowing whose husband is at sea"),
}

    # No comfy/ dir, no copying, no workflow_templates/routes rows: every
    # ComfyUI graph lives once in data/_templates/comfy/ and the render
    # resolves it there (src/comfy/workflow-path.ts). Tables dropped 2026-08-13.

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cx.autocommit=False; cur=cx.cursor()
    cur.execute("SELECT count(*) FROM projects WHERE slug=%s",(SLUG,))
    if cur.fetchone()[0]: print("ABORT: sailor_wife exists"); return
    with open(os.path.join(ROOT,"scripts","sailor_wife_scriptText.md"),encoding="utf-8") as f: script=f.read()
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
    for sub in ("reference","tts","shots","scenes","bgm"): os.makedirs(os.path.join(ROOT,"data","sailor_wife",sub),exist_ok=True)
    cx.commit()
    print("OK sailor_wife scenes=%d chars=%d profiles=%d locs=%d"%(len(SCENES),len(CHARS),len(PROFILES),len(LOCS)))
    cur.close(); cx.close()

if __name__=="__main__": main()
