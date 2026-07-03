# -*- coding: utf-8 -*-
"""Seed donor BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals. Cold clinical register."""
import json, psycopg2
PFX="7e660000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — банка с номерками","cold neoclassical ambient, very slow 50 bpm, no drums, a lone felt piano and a low glassy synth drone, a faint clinical fridge hum, hollow private dread, A minor, sterile close-mic reverb, instrumental, no vocals"),
"origin":("Акт 1 — студентка, объявление, клиника","pinched cool minimal piano, gentle 68 bpm, a plain upright piano and a thin cold pad, a faint tape hiss, weary hope in poverty, D minor, close intimate room, instrumental, no vocals"),
"first_cycle":("Акт 2 — стимуляция, забор, первый номерок","uneasy clinical minimal, slow 62 bpm, sparse piano and a cold sustained string, a faint monitor beep pulse, quiet unease under calm, C minor, clean bright sterile reverb, instrumental, no vocals"),
"easy_money":("Акт 3 — лёгкие деньги, счёт растёт","cool detached electronica, mid 96 bpm, a soft muted four-on-the-floor pulse, glassy synth plucks and a low bass, a false easy confidence, A minor, polished cold production, instrumental, no vocals"),
"limit":("Акт 4 — обход лимита, десятки","hardening cold neoclassical, slow 58 bpm, a bare piano over a low dread drone and a distant train rumble, greed edging out warmth, D minor, wide sterile reverb, instrumental, no vocals"),
"anton":("Акт 5 — Антон, тепло и тайна","tender warm folk with a cold undertow, gentle 72 bpm, soft acoustic guitar and warm piano over a faint uneasy drone, love above a hidden secret, F major shading to minor, close warm room, instrumental, no vocals"),
"trying":("Акт 6 — пытаются завести своего","fragile hopeful chamber, slow 60 bpm, a soft music box and warm strings thinning to a single sustained note, hope going cold, G minor, powdery close reverb, instrumental, no vocals"),
"diagnosis":("Акт 7 — диагноз, Антон уходит","cold cinematic lament, slow 52 bpm, a swelling cello and piano collapsing to one held chord then silence, the moment it breaks, D minor, stark close reverb, instrumental, no vocals"),
"count":("Акт 8 — считает номерки, гул крио","freezing drone ambient, very slow 46 bpm, no beat, a hollow low cryo hum and a single mournful cello line, colourless emptiness, D minor, wide cold reverb, instrumental, no vocals"),
"dna_era":("Акт 9 — ДНК-эра, страх","anxious cold electronica, slow 64 bpm, a ticking muted pulse and glassy digital arpeggios over a low dread bass, mounting exposure and fear, C minor, tense clean production, instrumental, no vocals"),
"dasha":("Акт 10 — Даша находит, её лицо","raw quiet lament, slow 54 bpm, a bare piano and a warm trembling cello over a faint clinical drone, an unbearable tender confrontation, A minor, intimate close-mic, instrumental, no vocals"),
"coda":("Финал — банка, фото, кода","bare piano elegy, very slow 48 bpm, no drums, a single bare piano resolving to an open chord and a fading glassy pad, quiet devastation, C minor to open, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK donor bgm"); cur.close(); cx.close()
