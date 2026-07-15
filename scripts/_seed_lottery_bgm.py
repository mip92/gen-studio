# -*- coding: utf-8 -*-
"""Seed lottery BGM narrative_blocks. ACE-Step tags, instrumental no vocals.
PYTHONIOENCODING=utf-8 python scripts/_seed_lottery_bgm.py"""
import json, psycopg2
PFX="7e690000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — проходная","dawn industrial ambient, slow 68 bpm, a soft metallic pulse like distant presses, warm low pads and a lone electric piano figure, settled quiet dignity, E minor, wide cold air with warm center, instrumental, no vocals"),
"origin":("Акт 1 — 1998, отец и киоск","nostalgic post-soviet folk waltz, gentle 76 bpm in three, brushed rhythm, a worn accordion and nylon guitar, warm tape hiss, fatherly tenderness and thin times, A minor, small kitchen room mic, instrumental, no vocals"),
"win":("Акт 2 — шесть чисел","suspenseful domestic build, moderate 88 bpm, a ticking rim pulse growing, plain piano over rising strings, one golden chime at the peak, disbelief turning into vertigo, C minor lifting, close intimate mix, instrumental, no vocals"),
"fire_bridges":("Акт 3 — фейерверк мостов","brash celebratory funk-pop, driving 116 bpm, tight full drums and slap bass, brass stabs and glittering keys, champagne swagger with a hollow underside, F major, big glossy mix, instrumental, no vocals"),
"vultures":("Акт 4 — родня и список","uneasy circling jazz-noir, mid 92 bpm, brushed snare shuffle, a prowling double bass and muted trumpet, doorbell-like vibraphone hits, polite predation, D minor, close smoky room, instrumental, no vocals"),
"partner":("Акт 5 — Аркадий и котлован","confidence-trick lounge, smooth 100 bpm, soft bossa-ish groove, silky rhodes and a persuasive nylon guitar, a thin high string of doubt beneath, charming and false, B flat major over minor shadows, polished warm mix, instrumental, no vocals"),
"no_return":("Акт 6 — казино","hypnotic casino noir, steady 96 bpm, a low four-on-the-floor heartbeat, deep green synth pads, a spinning metallic shimmer like a wheel, brass accents swallowed by carpet, timeless windowless pull, E minor, plush dark mix, instrumental, no vocals"),
"collapse":("Акт 7 — коробки и стекло","emptying cinematic elegy, slow 60 bpm, no drums, a lone cello over sparse piano, packing-tape textures far back, warmth leaving a cold room, C minor, wide echoing space, instrumental, no vocals"),
"bottom":("Акт 8 — опись и общага","bare honest folk, slow 72 bpm, a soft kick heartbeat, plain acoustic guitar and a humble harmonica, poverty with dignity, G minor easing, dry small-room mix, instrumental, no vocals"),
"return":("Акт 9 — брезент со станка","quiet homecoming build, steady 84 bpm, a workshop-tick percussion, warm piano chords and a slowly rising string line, hands remembering their trade, D major from D minor, honest roomy mix, instrumental, no vocals"),
"rebuild":("Акт 10 — две каски","warm mended folk-pop, easy 96 bpm, light brushed drums, acoustic guitar and gentle rhodes, a modest whistling melody, ordinary life earned back, G major, clean warm mix, instrumental, no vocals"),
"coda":("Финал — фраза новенькому","settled dawn anthem, slow 76 bpm, soft full chords on piano and low brass, a machine-hum pad underneath, the circle closed without bitterness, E major with grey edges, wide calm mix fading into shop noise, instrumental, no vocals"),
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
    print("  %-12s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); print("OK lottery bgm"); cur.close(); cx.close()
