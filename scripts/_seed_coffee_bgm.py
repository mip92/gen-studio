# -*- coding: utf-8 -*-
"""Seed coffee BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals. Bright, warm, never grim.
PYTHONIOENCODING=utf-8 python scripts/_seed_coffee_bgm.py"""
import json, psycopg2
PFX="7e680000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — утро 47-й","sunny acoustic folk-pop, easy 96 bpm, brushed snare and light hand-claps, warm acoustic guitar and bright glockenspiel, a cheerful whistling flute line, opening-morning joy, C major, crisp open-air mix, instrumental, no vocals"),
"origin":("Акт 1 — бабушкина кухня","tender storybook waltz, gentle 72 bpm in three, soft brushed rhythm, music box and warm nylon guitar, a hummable clarinet melody, childhood kitchen warmth, F major, close cosy room reverb, instrumental, no vocals"),
"barista":("Акт 2 — сетевая, 200 стаканов","upbeat cafe swing, brisk 118 bpm, light shuffle drums with brushes, walking upright bass, playful piano comping and a cheeky muted trumpet, apprentice energy, B flat major, vintage warm mono-ish mix, instrumental, no vocals"),
"championship":("Акт 3 — чемпионат, второе место","spirited competition swing-jazz, driving 126 bpm, tight brushed snare, double bass runs, sparkling vibraphone and quick piano riffs, nerves turning to resolve, D minor lifting to F major, lively stage-hall air, instrumental, no vocals"),
"opening":("Акт 4 — кредит и «КОРИЦА»","hopeful building folk, steady 100 bpm, hand percussion and cajon, strummed acoustic guitar layers, warm accordion swells, hammer-and-paint optimism, G major, bright roomy mix, instrumental, no vocals"),
"black_streak":("Акт 5 — аренда, потоп, свечи","brave bittersweet indie-folk, moderate 84 bpm, soft floor-tom heartbeat, fingerpicked guitar and mellow piano, a warm cello undercurrent, hardship met with humour, A minor resolving to C major, candlelit intimate mix, instrumental, no vocals"),
"regulars":("Акт 6 — гости по именам","easy-going bossa cafe groove, relaxed 92 bpm, soft bossa brush pattern, nylon guitar and rhodes piano, light shaker and a lazy flugelhorn, belonging and routine joy, E flat major, warm afternoon mix, instrumental, no vocals"),
"pandemic":("Акт 7 — окно навынос","quiet resilient ambient-folk, slow 76 bpm, muffled soft pulse, felt piano and gentle acoustic guitar, a distant warm harmonica, kindness in empty streets, D major with wistful turns, spacious gentle reverb, instrumental, no vocals"),
"partner":("Акт 8 — Женя и вторая точка","adventurous indie-pop skip, bright 112 bpm, crisp light drums, plucked ukulele and piano octaves, sunny string stabs and bicycle-bell accents, partnership momentum, A major, clean sparkling mix, instrumental, no vocals"),
"franchise":("Акт 9 — франшиза по теплу","confident warm corporate-folk, steady 104 bpm, tight kick and rimshot groove, acoustic guitar and rhodes, rising horn pads, growth without losing soul, F major, polished but organic mix, instrumental, no vocals"),
"triumph":("Акт 10 — сеть года","celebratory soulful anthem, uplifting 108 bpm, full warm drums with tambourine, piano chords and gospel-tinged organ swells, a triumphant but humble trumpet melody, gratitude and pride, C major, big warm live-room mix, instrumental, no vocals"),
"coda":("Финал — девочка у окошка","tender golden lullaby, slow 66 bpm, no drums, music box over soft felt piano and warm cello, a faint reprise of the waltz theme, the circle closing kindly, F major, close warm mix fading to hearth quiet, instrumental, no vocals"),
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
cx.commit(); print("OK coffee bgm"); cur.close(); cx.close()
