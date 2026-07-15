# -*- coding: utf-8 -*-
"""Seed sailor_wife BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals.
PYTHONIOENCODING=utf-8 python scripts/_seed_sailor_wife_bgm.py"""
import json, psycopg2
PFX="7e6c0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — туман, гудок, вопрос внучки","misty maritime ambient, very slow 56 bpm, no drums, a distant low brass note like a ship's horn under soft string haze, a lone felt piano surfacing and sinking, patient held-breath calm, D minor, wide foggy reverb, instrumental, no vocals"),
"dance":("Акт 1 — 1978, клуб моряков","warm seaside waltz of the seventies, 96 bpm, a brushed 3/4 sway, accordion lead with plucked double bass and soft glockenspiel, first-love brightness with salt air, G major, live small-hall warmth with gentle tape hiss, instrumental, no vocals"),
"vows":("Акт 2 — свадьба, кулон, три гудка","tender ceremonial lyric, 72 bpm, no drums, warm string quartet and a single French horn note recurring like a distant ship's call, young vows and first parting, C major dipping to A minor at the pier, open airy chapel reverb, instrumental, no vocals"),
"letters":("Акт 3 — письма, радиограмма, дочь","delicate correspondence music, 84 bpm, light pizzicato strings like pen strokes, celesta and soft clarinet trading phrases across a gentle space, tenderness across distance, F major, intimate close-room production, instrumental, no vocals"),
"queen":("Акт 4 — ритм 80-х, «королева»","steady domestic groove of the eighties, 92 bpm, a muted rhythm box with a soft radio-pop bassline, warm electric piano and a wistful flute answering, routine with an empty beat left in each bar, B flat major with minor turns, dry homely mix, instrumental, no vocals"),
"collapse":("Акт 5 — развал, чужой флаг, 6 минут","cold dissolving ambient, slow 66 bpm, a sparse muffled pulse like a fax feed, detuned upright piano over a grey synth drone, one warm cello line refusing to disappear, thrift and distance, F minor, concrete-hall reverb with static hiss, instrumental, no vocals"),
"two_contracts":("Акт 6 — «ещё два контракта»","measured decision music, 76 bpm, a ticking pizzicato clock under restrained piano chords, a low string drone gathering beneath, one long suspended silence before a single resolved low note, love doing arithmetic, E minor ending on a bare fifth, dry close-mic tension, instrumental, no vocals"),
"daughter":("Акт 7 — свадьба Оли, танец с фото","bittersweet wedding waltz, 88 bpm, a gentle 3/4 with brushed snare and upright piano, a solo violin dancing its melody alone where a duet should answer, joy around one silence, A minor waltz warming to C major and back, banquet-hall air, instrumental, no vocals"),
"storm":("Акт 8 — трое суток без связи","dark maritime dread, very slow 50 bpm, no beat, a deep rolling drone like heavy swell, storm-bowed low strings and a faint radio-static shimmer, then sudden emptiness where the climax should strike, three days of held breath, C sharp minor, cavernous fading reverb, instrumental, no vocals"),
"ashore":("Акт 9 — списан, двое чужих учатся","awkward warm chamber duet, 80 bpm, no drums, a guitar and a violin starting slightly apart and learning to phrase together bar by bar, humour and tenderness of two strangers who are family, D major with shy stumbles, close living-room recording, instrumental, no vocals"),
"learning":("Акт 10 — набережная, внучка, свет","mellow golden-hour folk, 84 bpm, soft brushed rhythm, warm nylon guitar, accordion returning from act one older and slower, light woodwind like gulls, earned peace by the sea, G major, open seaside air with gentle reverb, instrumental, no vocals"),
"coda":("Финал — гудок сидя, разрешение","quiet resolving elegy, very slow 54 bpm, no drums, the distant horn-note motif from the opening finally answered by a warm major piano chord, strings settling like water after wake, two instruments in unison at last, D minor resolving into D major, close mic opening into wide calm, instrumental, no vocals"),
}
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
cur.execute('DELETE FROM narrative_blocks WHERE "projectId"=%s',(PROJ,))
cur.execute('SELECT id,"sceneKey","sortOrder" FROM scenes WHERE "projectId"=%s ORDER BY "sortOrder"',(PROJ,))
for n,(sid,key,order) in enumerate(cur.fetchall()):
    c2=cx.cursor(); c2.execute('SELECT id,"narrationText" FROM shots WHERE "sceneId"=%s ORDER BY "shotCode"',(sid,))
    rows=c2.fetchall(); ids=[r[0] for r in rows]
    words=sum(len((r[1] or '').split()) for r in rows); target=int(round(words/140.0*60+len(rows)*0.5))
    title,mood=MOODS[key]
    cur.execute('''INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt")
        VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,'pending',now(),now())''',
        (PFX+"0000000000f%x"%(n+1),PROJ,"bgm_"+key,title,order,mood,json.dumps(ids),target))
    print("  %-13s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); cur.close(); cx.close()
