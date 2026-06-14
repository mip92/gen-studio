# -*- coding: utf-8 -*-
"""Redo flat_earth climax IN PLACE (no row deletes — queue-safe).
Replaces the dam ending with the REAL flat-earth edge: ocean off the saucer rim
into the cosmos, Ray steps forward into the stars -> SMASH CUT to the padded cell /
straitjacket reveal. Voice stays triumphant (audio never admits madness); the
cosmic edge IS shown (his hallucination), the reveal is only the cell at the end.

For each changed shot: UPDATE prompt/narration/motion/location in place, CLEAR the
stale render (renderedImages/chosenRender), DELETE its generated files on disk +
video_renders rows. Re-queue is done afterward via the project bulk endpoint.
"""
import os, json, shutil, psycopg2
PFX="7e5c0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTDIR=os.path.join(ROOT,"data","flat_earth","shots")

STYLE=("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
 "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
 "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, ")
TECH=("hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows, ")
ENV_COSMIC_MOT=("the vast ocean sliding slowly over the world's rim, distant stars and nebulae drifting, gold mist rising "
 "from the cosmic abyss, a silent majestic empty cosmic vista, the cell-shaded illustration in slow grand motion, hand-drawn animation cadence")
ENV_CELL_MOT=("the empty white padded room utterly still, only the faintest drift of light and shadow, a silent motionless cell, "
 "the cell-shaded illustration barely moving, hand-drawn animation cadence")
ENV_MNEG=("people, person, man, woman, figures, characters, crowd, anime character, anime girl, manga character, chibi, "
 "extra humans, birds, creatures, boats, ships, photoreal, photograph, 3D render, plastic skin, flicker, warping")
CHAR_MOT=("subtle natural motion of only the figure already present in the frame, small breathing and quiet micro-movements "
 "continuing the moment, no new people entering, no extra figures appearing, the cell-shaded illustration in motion, hand-drawn animation cadence")
CHAR_MNEG=("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, "
 "manga character, chibi, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping")
MOVES={"static":"locked static, no camera motion","push_in":"slow push-in","pull_out":"slow pull-out","pan_left":"slow pan left","pan_right":"slow pan right","track":"slow tracking","tilt_up":"slow tilt up","tilt_down":"slow tilt down"}
ANG={"eye":"eye-level","low":"low","high":"high","over":"over-the-shoulder","top":"top-down"}
SCALE={"EWS":"W","WS":"W","MS":"M","MCU":"M","OTS":"M","CU":"C","ECU":"C","INSERT":"C"}

PAL_APPROACH="ominous cosmic-dusk palette, darkening flat sea and a luminous rim of starlight on the horizon, gold and deep violet, awe and dread"
PAL_EDGE="transcendent cosmic palette, deep starfield blues and violet void, luminous galaxies and nebulae below the world's rim, gold rim-mist, blinding awe"
PAL_CELL="stark clinical white-and-grey palette, flat even institutional light, cold sterile whites with faint grey shadow"

WE="world_edge"; PC="padded_cell"
# (code, ch, loc, palette, subj, st, ang, mv, tod, broll, iconic, narr)
R=[
("A11_SH08",None,WE,PAL_APPROACH,"a vast flat ocean at dusk whose far horizon ends in a luminous glowing line where the water pours off the rim of the world into a faint field of stars","EWS","eye","push_in","dusk",True,True,
 "и там, на самом юге, ровная вода вдруг кончается светящейся чертой, за которой не берег, а сияние."),
("A11_SH09",None,WE,PAL_APPROACH,"a tiny ragged figure walking a dark shore toward a glowing rim on the horizon, faint stars showing in the darkening daytime sky above the edge","WS","low","track","dusk",True,False,
 "ты идёшь к этой черте весь день, и небо над ней темнеет средь бела дня, и в нём проступают звёзды."),
("A11_SH10","RAY",WE,PAL_APPROACH,"close on a gaunt bearded man's awed face lit gold by a distant glow on the horizon, eyes fixed ahead, certain","CU","eye","push_in","dusk",False,False,
 "ты не чувствуешь ни голода, ни ног, ты видишь то, к чему шёл всю жизнь, и оно ближе с каждым шагом."),
("A11_SH11",None,WE,PAL_APPROACH,"the flat sea ahead tilting gently toward a distant rim, a rising golden mist of light where the water meets the edge of the world","MS","eye","static","dusk",True,False,
 "вода впереди будто наклоняется к краю, и над обрывом встаёт золотой туман, как дым из-под двери."),
("A11_SH12",None,WE,PAL_APPROACH,"faint galaxies and nebulae bleeding into a darkening daytime sky above a luminous horizon line over a flat ocean","EWS","high","pan_right","dusk",True,True,
 "днём над краем мира уже горят галактики, бледные, как мел, и ты единственный, кто их видит."),
("A11_SH13",None,WE,PAL_APPROACH,"extreme close on a brass folding ruler held at arm's length against a glowing horizon rim, the line of the world meeting the ruler with no curve","ECU","eye","push_in","dusk",False,True,
 "ты достаёшь дедову линейку и прикладываешь к светящейся кромке, и она ложится ровно, без изгиба."),
("A11_SH14","RAY",WE,PAL_APPROACH,"close on a weathered man's weeping awestruck face, the familiar shiver of vindication, distant cosmic glow on his skin","CU","low","push_in","dusk",False,False,
 "и тот холодок из детства накрывает тебя целиком, ведь вот он, край, ровный, как ты и говорил."),
("A11_SH15",None,WE,PAL_EDGE,"a wall of luminous mist rising from a distant rim where a flat ocean pours over the edge, the air shimmering with starlight","WS","eye","push_in","dawn",True,False,
 "нарастает гул, не штормовой, а ровный и бесконечный, это вода уходит за край без остановки."),
("A11_SH16","RAY",WE,PAL_EDGE,"a small ragged figure walking straight toward a towering wall of glowing mist at the edge of a flat sea, unafraid","MCU","low","track","dawn",False,False,
 "ты идёшь прямо на этот гул, на свет, и тебе совсем не страшно, тебе впервые в жизни легко."),
("A11_SH17",None,WE,PAL_EDGE,"the edge of a flat disc world revealed, a vast ocean curving down over the saucer rim and cascading into an endless starfield below","EWS","eye","pull_out","dawn",True,True,
 "и ты выходишь к нему, к самому краю плоской земли, где океан переливается через кромку в пустоту."),
("A11_SH18",None,WE,PAL_EDGE,"extreme close on ocean water sliding silently over the curved rim of the world into a deep field of stars, slow and bottomless","ECU","eye","push_in","dawn",False,True,
 "вода уходит вниз ровной стеной, беззвучно, в бездну, полную звёзд, без дна и без конца."),
("A11_SH19","RAY",WE,PAL_EDGE,"close on a tiny man's overwhelmed face at the very brink of the world, the cosmos reflected in his wide wet eyes","CU","eye","push_in","dawn",False,False,
 "ты стоишь на самом краю мира, крошечный, и под тобой не бездна тьмы, а целая вселенная."),
("A11_SH20",None,WE,PAL_EDGE,"a pull-back from the world's rim revealing galaxies, nebulae and cold cosmic fire spread out in the void beneath the falling ocean","EWS","high","pull_out","dawn",True,True,
 "под кромкой воды разворачиваются галактики, туманности, холодный огонь, весь космос, о котором тебе врали."),
("A11_SH21","RAY",WE,PAL_EDGE,"a ragged man at the brink of the world spreading his arms wide over the cosmic abyss, laughing and weeping","MCU","low","push_in","dawn",False,False,
 "ты раскидываешь руки над краем, и смеёшься, и плачешь, потому что ты дошёл, ты всё-таки дошёл."),
("A11_SH22",None,WE,PAL_EDGE,"a brass ruler held flat against the glowing cosmic rim where ocean meets stars, the line dead straight","ECU","eye","push_in","dawn",False,True,
 "в последний раз ты прикладываешь линейку к кромке мира, и она ровная, ровно, ровно, до самых звёзд."),
("A11_SH23","RAY",WE,PAL_EDGE,"close on a man's ecstatic certain face whispering to the stars, gold cosmic light on him","CU","eye","static","dawn",False,False,
 "я был прав, шепчешь ты звёздам, всю жизнь, с девяти лет, я знал, и вот оно, у моих ног."),
("A11_SH24",None,WE,PAL_EDGE,"dawn breaking over the edge of the world, golden light pouring into the cosmos alongside the cascading ocean, immense and beautiful","EWS","eye","pan_left","dawn",True,True,
 "над краем встаёт рассвет, и золото льётся в космос вместе с водой, и нет ничего прекраснее."),
("A11_SH25","RAY",WE,PAL_EDGE,"a small ragged figure standing at the very lip of the world, toe-tips over the void, the starfield falling away beneath him","WS","low","static","dawn",False,False,
 "ты подходишь к самому обрыву, носки ботинок над пустотой, над звёздами, и тебе хочется туда."),
("A11_SH26","RAY",WE,PAL_EDGE,"close on a man gazing down into the cosmos below the world's edge, a luminous path of stars seeming to open below","CU","high","push_in","dawn",False,False,
 "там, внизу, среди звёзд, тебе кажется, ты видишь дорогу, ровную, светлую, домой."),
("A11_SH27",None,WE,PAL_EDGE,"the brink of the flat world, a thin edge of rock and water with infinite stars beginning just beyond the toes of a worn boot","ECU","top","static","dawn",False,False,
 "один шаг, думаешь ты, всего один шаг, и я наконец перейду за край этого плоского мира."),
("A11_SH28","RAY",WE,PAL_EDGE,"cosmic wind off the edge of the world lifting a ragged man's coat and grey hair, his face rapt at the brink","MCU","eye","static","dawn",False,False,
 "ветер с края мира треплет твой плащ, и пахнет он не морем, а чем-то ледяным и звёздным."),
("A11_SH29",None,WE,PAL_EDGE,"the luminous rim of the flat earth stretching endlessly left and right in a straight glowing line, embracing the whole disc","EWS","eye","pan_right","dawn",True,True,
 "край тянется вправо и влево без конца, ровной светящейся линией, обнимая всю плоскую землю."),
("A11_SH30","RAY",WE,PAL_EDGE,"close on a weathered hand gripping a brass folding ruler tightly at the edge of the world, cosmic glow around it","CU","over","push_in","dawn",False,False,
 "ты сжимаешь дедову линейку в кулаке, и тебе кажется, что отец стоит сейчас рядом и кивает."),
("A11_SH31",None,WE,PAL_EDGE,"the entire universe of stars and galaxies spread out beneath the rim of a flat ocean world, waiting, immense","EWS","low","push_in","dawn",True,True,
 "вся вселенная лежит под краем, и ждёт тебя, и ты больше не принадлежишь этому берегу."),
("A11_SH32","RAY",WE,PAL_EDGE,"close on a man's transcendent face drawing a deep breath at the brink, the cosmos glowing in front of him","CU","eye","push_in","dawn",False,False,
 "ты делаешь последний вдох на краю мира, и он самый сладкий за всю твою жизнь."),
("A11_SH33","RAY",WE,PAL_EDGE,"a ragged man leaning forward over the edge of the world toward the falling stars, arms loose, eyes shining","MCU","low","push_in","dawn",False,False,
 "ты наклоняешься вперёд, к звёздам, к ровной светлой дороге, что зовёт тебя домой."),
("A11_SH34",None,WE,PAL_EDGE,"a worn boot lifting at the very brink of the world, the toe rising over an abyss full of stars","ECU","low","static","dawn",False,True,
 "и ты поднимаешь ногу над краем плоской земли, чтобы сделать тот самый шаг."),

("A12_SH01","RAY",WE,PAL_EDGE,"a small ragged figure stepping forward off the edge of the flat world into a vast starfield, mid-step over the cosmic void","WS","eye","static","dawn",False,True,
 "ты делаешь тот самый шаг вперёд, за край плоской земли, прямо в звёзды, и мир отпускает тебя."),
("A12_SH02",None,WE,PAL_EDGE,"the cosmos rushing past, galaxies and nebulae streaming as a tiny figure falls forward into an endless field of stars","EWS","eye","push_in","dawn",True,True,
 "и ты летишь, не вниз, а вперёд, сквозь галактики, и впервые в жизни тебе совсем, совсем легко."),
("A12_SH03","RAY",WE,PAL_EDGE,"close on a man's ecstatic peaceful face surrounded by drifting stars, weightless, eyes full of light","CU","eye","push_in","dawn",False,False,
 "вокруг тебя звёзды, и тишина, и ты дома, ты наконец дома, там, где всегда хотел быть."),
("A12_SH04",None,WE,PAL_EDGE,"a field of streaming stars dissolving into pure flat white light, the cosmos giving way to a smooth white wall","ECU","eye","push_in","day",False,False,
 "свет становится всё ярче, всё ровнее, и звёзды сливаются в одну белую гладкую стену."),
("A12_SH05",None,PC,PAL_CELL,"a psychiatric seclusion room with seamless off-white padded walls, harsh even light, a heavy door with a small wired window","WS","eye","push_in","day",True,True,
 "и я перешёл за край, слышишь, я был там, и видел всё своими глазами, до последней звезды."),
("A12_SH06","RAY",PC,PAL_CELL,"a gaunt man with wild greying hair in a canvas straitjacket pressed against a padded wall, an ecstatic transfigured grin, eyes blazing","MS","low","static","day",False,True,
 "пусть они говорят, что я никуда не уходил, что всё это время я был здесь, в этой белой комнате."),
("A12_SH07","RAY",PC,PAL_CELL,"extreme close-up on a strapped man's wild ecstatic face, sweat and rapture, eyes fixed on something far beyond the white wall","ECU","eye","push_in","day",False,False,
 "но я-то знаю, что я дошёл до самого края, и шагнул за него, и земля подо мной была плоской."),
("A12_SH08",None,PC,PAL_CELL,"extreme close on canvas straitjacket buckles cinched tight against off-white padding, scuffed low on the wall","INSERT","top","static","day",False,False,
 "они скрутили моё тело и заперли его тут, но то, что я видел, у меня уже никому не отнять."),
("A12_SH09","HALE",PC,PAL_CELL,"a calm doctor in a white coat with a lanyard badge writing on a clipboard at a small wired observation window, a strapped patient blurred beyond","OTS","over","static","day",False,False,
 "человек в белом халате смотрит на меня в окошко, и пишет в карте длинное умное слово."),
("A12_SH10","RAY",PC,PAL_CELL,"close on the strapped man's serene wild face gazing past the doctor at the blank white padded wall","CU","eye","push_in","day",False,False,
 "а я смотрю сквозь него, на ровную белую стену, и вижу на ней край мира и звёзды за ним."),
("A12_SH11",None,PC,PAL_CELL,"very wide of a bare seclusion room, a small strapped figure sitting upright and radiant against white padding under a caged light","WS","high","static","day",True,False,
 "пусть это будет моей палатой, моим берегом, я не против, ведь я единственный, кто дошёл."),
("A12_SH12","RAY",PC,PAL_CELL,"a strapped man freeing one fingertip just enough to reach the padded wall, intent and serene","MCU","eye","push_in","day",False,False,
 "и каждый день я веду пальцем по мягкой стене одну линию, ровную, как кромка плоской земли."),
("A12_SH13",None,PC,PAL_CELL,"extreme close on a fingertip dragging a single dead-straight horizontal line across seamless white padding","ECU","eye","track","day",False,True,
 "ровную, без единого изгиба, как вода, что падает с края мира в звёзды, я видел это, я там был."),
("A12_SH14","RAY",PC,PAL_CELL,"close on a man's peaceful ecstatic face, eyes closing, the faint shiver of recognition, the straight line on the wall behind","CU","eye","push_in","day",False,True,
 "и тот холодок в последний раз бежит по спине, и я улыбаюсь, потому что я дома, и я был прав."),
("A12_SH15","RAY",PC,PAL_CELL,"a serene man in a straitjacket speaking directly to the viewer, certain and gentle, white walls around him","MCU","eye","push_in","day",False,False,
 "теперь ты знаешь всё, я дошёл до края земли, шагнул в космос, и земля была плоской, как стол."),
("A12_SH16","RAY",PC,PAL_CELL,"a calm strapped man addressing the viewer as an old friend, half-smiling against the padded wall","MCU","eye","static","day",False,False,
 "мне не важно, в какой комнате моё тело, важно, что я видел правду, а ты её ещё не видел."),
("A12_SH17","RAY",PC,PAL_CELL,"close on the man's gentle certain face addressing the viewer directly, warm clear eyes","CU","eye","push_in","day",False,False,
 "останься со мной до конца, подпишись, и береги себя, и не верь, когда говорят, что круглая."),
("A12_SH18","RAY",PC,PAL_CELL,"a serene man giving the viewer one quiet instruction, lifting his chin toward an unseen horizon","MCU","low","static","day",False,False,
 "а если засомневаешься, выйди к любой большой воде, приложи к горизонту линейку, и сам увидишь."),
("A12_SH19",None,PC,PAL_CELL,"a small serene man sitting against a white padded wall in flat even institutional light, at perfect peace","WS","high","pull_out","day",False,True,
 "я сижу в своей белой комнате, спокойный и счастливый, единственный, кто дошёл до края мира."),
("A12_SH20",None,PC,PAL_CELL,"an empty off-white padded wall in flat light, a single faint dead-straight finger-line the only mark on it","EWS","eye","push_in","day",True,True,
 "а где-то там, за стеной, за городом, за полями, океан всё падает с края земли в звёзды."),
("A12_SH21",None,PC,PAL_CELL,"a medium framing of a bare seamless white padded wall section, the faint straight finger-line crossing it","MS","eye","static","day",True,False,
 "эта история вымышлена, и все совпадения с реальными людьми случайны, не повторяй чужих ошибок."),
("A12_SH22",None,PC,PAL_CELL,"a soft off-white field of padded wall fading toward white, the faint straight finger-line dissolving into light","INSERT","eye","push_in","day",True,True,
 "береги себя, слышишь, и иногда всё-таки поглядывай на горизонт, просто на всякий случай."),
("A12_SH23",None,PC,PAL_CELL,"extreme close on a faint patch of white padded wall where a thin pinpoint of light seems to glimmer like a far star","ECU","eye","push_in","night",False,False,
 "иногда ночами белая стена моей палаты светится, как тот край мира, и я знаю, он всё ещё там."),
("A12_SH24","RAY",PC,PAL_CELL,"close on a strapped man asleep and serene against the padded wall, a faint smile on his lips","MCU","high","static","night",False,False,
 "и мне снится, как я иду по ровной светлой дороге среди звёзд, всё дальше, всё ближе к дому."),
("A12_SH25",None,WE,PAL_EDGE,"a dreamlike vista of a flat ocean's edge under a sky of stars, a luminous straight path of starlight leading to the cosmic rim, a serene empty cosmic seascape","EWS","eye","push_in","night",True,True,
 "там нет ни врачей, ни карт, ни глобусов, только ровная вода, и звёзды, и тишина, и покой."),
("A12_SH26","RAY",PC,PAL_CELL,"extreme close on a sleeping man's peaceful face in soft white light, utterly at rest","ECU","eye","push_in","night",False,True,
 "я дошёл, шепчу я во сне, я дошёл, и впервые за всю жизнь мне больше некуда спешить."),
]

def main():
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    # world_edge location
    cur.execute("SELECT id FROM locations WHERE \"projectId\"=%s AND slug='world_edge'",(PROJ,))
    row=cur.fetchone()
    if row: we_id=row[0]
    else:
        we_id=PFX+"000000000e20"
        cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,now(),now())',
            (we_id,PROJ,"world_edge","Край плоской Земли (космос)",
             "the literal edge of a flat disc world, a vast ocean cascading silently over the curved saucer rim of the earth into an infinite field of stars, glowing galaxies and nebulae spread through the cosmic void below the waterline, gold mist rising at the brink where dawn light pours into space, awe-inspiring and impossible, deep cosmic blues and violet shot through with golden rim-light"))
    cur.execute('SELECT slug,id FROM locations WHERE "projectId"=%s',(PROJ,)); locs=dict(cur.fetchall())
    cur.execute('SELECT cp."profileCode",cp.id,c.id FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id WHERE c.id IN (SELECT "characterId" FROM project_characters WHERE "projectId"=%s)',(PROJ,))
    prof={pc:(pid,cid) for pc,pid,cid in cur.fetchall()}

    seq=[]
    for code,ch,loc,pal,subj,st,ang,mv,tod,broll,iconic,narr in R:
        low=subj.lower()
        for neg in ("no people","no person","no figures","no one","without people","nobody"):
            if neg in low: raise SystemExit("NEGATION in %s: %s"%(code,neg))
        cur.execute('SELECT id FROM shots WHERE "projectId"=%s AND "shotCode"=%s',(PROJ,code)); r=cur.fetchone()
        if not r: raise SystemExit("missing shot "+code)
        sid=r[0]
        cam="%s, %s angle, %s camera, 16:9"%(st,ANG[ang],MOVES[mv])
        positive=STYLE+subj+", "+pal+", "+TECH+cam
        is_char=ch is not None
        route="flat_earth_character_ip" if is_char else "flat_earth_environment"
        ref=prof[ch][0] if is_char else None
        if loc==PC: mot=CHAR_MOT if is_char else ENV_CELL_MOT
        else:       mot=CHAR_MOT if is_char else ENV_COSMIC_MOT
        mneg=CHAR_MNEG if is_char else ENV_MNEG
        pf={"positive":positive,"positivePrompt":positive,"narrationRu":narr,"motionPrompt":mot,"motionNegative":mneg}
        cur.execute('''UPDATE shots SET "promptFields"=%s::jsonb,"narrationText"=%s,"workflowRouteKey"=%s,"referenceProfileId"=%s,
            "locationId"=%s,"shotType"=%s,"cameraAngle"=%s,"cameraMove"=%s,"timeOfDay"=%s,"isBroll"=%s,"isIconic"=%s,
            "renderedImages"='[]'::jsonb,"chosenRender"=NULL,"chosenVideoId"=NULL,"updatedAt"=now() WHERE id=%s''',
            (json.dumps(pf,ensure_ascii=False),narr,route,ref,locs[loc],st,ang,mv,tod,broll,iconic,sid))
        cur.execute('DELETE FROM shot_participants WHERE "shotId"=%s',(sid,))
        if is_char:
            cur.execute('INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") VALUES (%s,%s,%s,%s,%s)',
                        (sid[:-1]+"1",sid,prof[ch][1],ch,prof[ch][0]))
        # delete generated artifacts: video rows + disk files
        cur.execute('DELETE FROM video_renders WHERE "shotId"=%s',(sid,))
        d=os.path.join(SHOTDIR,code)
        if os.path.isdir(d): shutil.rmtree(d,ignore_errors=True)
        seq.append((code,SCALE.get(st,"M")))
    cx.commit()
    runs=[seq[i][0] for i in range(2,len(seq)) if seq[i][1]==seq[i-1][1]==seq[i-2][1]]
    print("redone=%d  scale3run=%s  (deleted old renders+dirs, cleared render fields)"%(len(R),(",".join(runs) if runs else "0")))
    cur.close(); cx.close()

if __name__=="__main__": main()
