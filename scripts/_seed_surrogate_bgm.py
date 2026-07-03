# -*- coding: utf-8 -*-
"""Seed surrogate BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e640000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — коробка с браслетами","melancholy neoclassical ambient, very slow 52 bpm, no drums, a lone felt piano and a low warm cello drone, a distant tape hiss, hollow private grief, A minor, intimate close-mic reverb, instrumental, no vocals"),
"origin":("Акт 1 — бедность, операция Мише","poor tender folk, gentle 66 bpm, soft acoustic guitar and a plain upright piano, faint tape warmth, weary hope in hardship, D minor, close intimate room, instrumental, no vocals"),
"first_contract":("Акт 2 — договор, беременность","uneasy clinical neoclassical, slow 60 bpm, sparse piano and a cold sustained string, a faint clock-tick pulse, quiet dread under calm, C minor, clean bright reverb, instrumental, no vocals"),
"first_birth":("Акт 3 — роды, первый браслет","bittersweet chamber, slow 58 bpm, warm cello and soft piano rising then a single held note, newborn tenderness cut by loss, D minor, close warm reverb, instrumental, no vocals"),
"husband":("Акт 4 — Толя пьёт и уходит","cold souring ambient, slow 64 bpm, a low detuned piano and a grey synth pad, a lonely muted trumpet, resentment and drink, F sharp minor, dry dim room, instrumental, no vocals"),
"second":("Акт 5 — вторая суррогатность","weary repeating neoclassical, slow 60 bpm, a circular piano figure and a tired cello, the sense of the same again, C minor, muted reverb, instrumental, no vocals"),
"bond":("Акт 6 — тайная арифметика","aching lullaby, very slow 54 bpm, a soft music box and warm strings, a mother's tenderness with nowhere to go, G minor, powdery close reverb, instrumental, no vocals"),
"third":("Акт 7 — третий договор","hardening cold neoclassical, slow 56 bpm, a bare piano over a low dread drone, warmth draining out, D minor, sterile wide reverb, instrumental, no vocals"),
"third_birth":("Акт 8 — третьи роды, слом","raw cinematic lament, slow 50 bpm, a swelling cello and piano breaking to one held chord then silence, the moment it all breaks, D minor, stark close reverb, instrumental, no vocals"),
"barren":("Акт 9 — своего уже не выносишь","grief drone ambient, very slow 46 bpm, no beat, a hollow low drone and a single mournful cello line, colourless emptiness, D minor, wide cold reverb, instrumental, no vocals"),
"son":("Акт 10 — Миша узнаёт, отдаляется","quiet estranged neoclassical, slow 58 bpm, a distant piano and a faint string pad, a polite unbridgeable distance, A minor, muffled reverb, instrumental, no vocals"),
"coda":("Финал — три браслета, кода","bare piano elegy, very slow 50 bpm, no drums, a single bare piano resolving to an open chord and a faint fading string pad, quiet devastation, C minor to open, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK surrogate bgm"); cur.close(); cx.close()
