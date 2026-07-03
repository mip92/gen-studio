# -*- coding: utf-8 -*-
"""Seed kept_woman BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e630000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — студия в 43, бирка","melancholy electronic noir, slow 60 bpm, a sparse muted four-on-the-floor pulse fading under a lone felt piano, cold synth pad and a distant vinyl hiss, glamorous emptiness and quiet defeat, A minor, polished but hollow reverb, instrumental, no vocals"),
"origin":("Акт 1 — 19, первый ресторан, цепочка","seductive nocturnal deep house, 110 bpm, soft sidechained bassline and brushed hi-hats, glossy Rhodes chords and a warm saxophone line, dangerous allure and first temptation, D minor, lush wet club reverb, instrumental, no vocals"),
"lesson":("Акт 2 — правила Леры","cool calculating downtempo, 100 bpm, a crisp tight rimshot groove, chrome synth plucks and a sultry muted trumpet, clever detached glamour, C minor, sleek polished production, instrumental, no vocals"),
"ascent":("Акт 3 — пик, море, обещание","opulent glamorous nu-disco, 116 bpm, a pulsing four-on-the-floor kick and shimmering hi-hats, lavish string stabs and glossy synth, decadent luxury with a hollow core, A major turning cold, glittering wide reverb, instrumental, no vocals"),
"tighten":("Акт 4 — арифметика возраста, клиника","anxious cinematic electronica, 92 bpm, a nervous ticking pulse and cold clipped percussion, brittle glassy synth and a tense low drone, beauty curdling into fear, F sharp minor, clinical bright reverb, instrumental, no vocals"),
"mother":("Акт 5 — дом, ложь матери","warm poor folk lament, gentle 68 bpm, soft acoustic guitar and a plain upright piano, a faded music box and tape hiss, tender provincial nostalgia and guilt, G major shifting to minor, close intimate room, instrumental, no vocals"),
"turn":("Акт 6 — Игорь, развод Артура","bittersweet hopeful build, 84 bpm, a hesitant heartbeat kick with warm piano and strings, a false dawn rising then collapsing to one low note, C major falling to A minor, swelling then sterile reverb, instrumental, no vocals"),
"slide":("Акт 7 — спуск, гибель Леры","faded tired synthwave, slow 90 bpm, a sluggish sodium-orange pulse and a cheap neon arpeggio, a worn saxophone and dusty pad, glamour dimming into loneliness, B flat minor, smeared neon reverb, instrumental, no vocals"),
"eject":("Акт 8 — выселение, переезд","cold subtracting ambient, slow 70 bpm, no drums, a single low synth drone and sparse marble-cold piano, hollow emptying and loss of place, D minor, wide sterile reverb, instrumental, no vocals"),
"loss":("Акт 9 — смерть матери, сумки","neoclassical grief lament, very slow 52 bpm, no drums, a solo cello and a bare piano, a mournful distant string pad, deep loss and colourless mourning, D minor, funeral stillness, instrumental, no vocals"),
"return":("Акт 10 — возврат, последний замок","hollow recognition ambient, slow 58 bpm, a faint muffled club pulse buried under grey pads, a single tired piano figure, a whole life seen at once, A minor, muffled distant reverb, instrumental, no vocals"),
"coda":("Финал — цепочка, кода","bare intimate piano elegy, very slow 50 bpm, no drums, a single bare piano resolving to an open chord and a faint gold-tinted string pad fading, quiet devastation, C minor to open, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK kept_woman bgm"); cur.close(); cx.close()
