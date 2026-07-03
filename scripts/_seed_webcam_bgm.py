# -*- coding: utf-8 -*-
"""Seed webcam BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e650000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — лампа гаснет","hollow synthwave noir, slow 70 bpm, a faint muffled club pulse under dead-air hiss, cold analog synth pad and a lone piano note, glamorous emptiness and defeat, A minor, dark neon reverb, instrumental, no vocals"),
"origin":("Акт 1 — первый стрим","seductive electropop, 112 bpm, a bright four-on-the-floor kick and glossy synth plucks, shimmering hi-hats, cheap dangerous allure, C minor, glossy neon production, instrumental, no vocals"),
"first_money":("Акт 2 — лёгкие деньги","glossy nu-disco, 116 bpm, pulsing bass and sidechained pads, sparkling arps, fast easy-money euphoria with a hollow edge, A major, wide club reverb, instrumental, no vocals"),
"ascent":("Акт 3 — топ, донатор","peak bright synthpop, 120 bpm, a driving kick, dazzling saw leads and chopped vocal textures, addictive dopamine glow hiding coldness, F sharp minor bright, polished neon, instrumental, no vocals"),
"daughter":("Акт 4 — рождается Лиза","bittersweet ambient synth, 84 bpm, a warm pad and soft piano over a faint pulse, a divided tenderness, D major shifting to minor, intimate reverb, instrumental, no vocals"),
"the_cost":("Акт 5 — оцепенение","numb industrial downtempo, 92 bpm, a cold mechanical pulse and clipped percussion, brittle glassy synth, joyless routine, C minor, sterile bright reverb, instrumental, no vocals"),
"donator":("Акт 6 — Король, сталкинг","menacing dark synth, slow 80 bpm, a low sinister drone and a stalking arpeggio, sickly blue pads, dread and obsession, F sharp minor, cold wide reverb, instrumental, no vocals"),
"aging":("Акт 7 — младшие, спуск","fading tired synthwave, slow 90 bpm, a sluggish sodium pulse and a worn arpeggio, a dusty pad, glamour dimming, B flat minor, smeared neon reverb, instrumental, no vocals"),
"podruga":("Акт 8 — Рита ломается","ruined ambient, slow 66 bpm, a broken detuned synth and a hollow drone, a distant siren-like tone, burnout and collapse, F sharp minor, grey wide reverb, instrumental, no vocals"),
"exposed":("Акт 9 — разоблачение","cold exposure cinematic, slow 60 bpm, a stark piano and a rising cold string, a single hard impact then silence, public shame, D minor, harsh clear reverb, instrumental, no vocals"),
"aftermath":("Акт 10 — списана","burned-out ambient, slow 58 bpm, no beat, a grey synth drone and a faint dead-channel hiss, a lone piano, emptiness after the neon, A minor, wide cold reverb, instrumental, no vocals"),
"coda":("Финал — лампа гаснет, кода","bare synth-piano elegy, very slow 52 bpm, no drums, a single piano resolving to an open chord and a fading analog pad, a last ring-light hum dying, quiet devastation, C minor to open, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK webcam bgm"); cur.close(); cx.close()
