# -*- coding: utf-8 -*-
"""Seed cloakroom BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e5f0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — пустой зал ночью","melancholy ambient noir, very slow 50 bpm, no drums, a lone reverbed piano note, a low felt-piano drone, distant velvet hush, hollow weary stillness, A minor, dusty empty-theatre reverb, instrumental, no vocals"),
"origin":("Акт 1 — училище, голос, вешалка","bittersweet neoclassical, slow 60 bpm, soft felt piano and a warm cello, faint tape hiss, youthful hope curdling into quiet loss, D minor, intimate close-mic, instrumental, no vocals"),
"gallery_a":("Акт 2 — новое пальто + вдова","wistful chamber waltz, gentle 78 bpm, light brushed rhythm, warm strings and music box, a lonely clarinet, faded romance and quiet grief, G minor, soft ballroom reverb, instrumental, no vocals"),
"gallery_b":("Акт 3 — провинциалка + критик","wry bittersweet salon piece, 88 bpm, plucked pizzicato strings and light piano, a sly muted trumpet, irony over tenderness, B flat major, dry intimate room, instrumental, no vocals"),
"gallery_c":("Акт 4 — отец и дочь + нувориш","tender autumnal neoclassical, slow 64 bpm, warm piano and cello, a soft music box motif, the warmth of small yearly rituals, F major shifting to minor, close warm reverb, instrumental, no vocals"),
"gallery_d":("Акт 5 — две примы + гадалка","faded-gilt salon nocturne, 70 bpm, tarnished celesta and warm strings, a distant solo violin, old glamour dimming, A minor, powdery grand-hall reverb, instrumental, no vocals"),
"gallery_e":("Акт 6 — девушка гонщика + подросток","cold post-communist ambient, slow 66 bpm, sparse glassy synth pads and a low pulse, a mournful cello entering, grief under modern chill, F sharp minor, wide cold reverb, instrumental, no vocals"),
"turn":("Акт 7 — точка невозврата","deceptive hopeful build, 84 bpm, rising warm piano and strings with a hesitant heartbeat kick, false dawn collapsing back to a single low note, C major falling to A minor, swelling then sterile reverb, instrumental, no vocals"),
"catastrophe":("Акт 8 — тебя впервые увидели","tense suspended cinematic, slow 56 bpm, a single sustained string chord building dread, one sharp piano impact then ringing silence, exposure and shame, D minor, stark close reverb, instrumental, no vocals"),
"aftermath":("Акт 9 — по ту сторону стойки","quiet reconciled neoclassical, slow 58 bpm, no drums, a bare warm piano and a soft string pad, bittersweet peace and release, C major, gentle intimate reverb, instrumental, no vocals"),
"coda":("Финал — крючок номер один, кода","intimate piano elegy, very slow 50 bpm, no drums, a single bare piano resolving to an open chord, a faint string pad fading, quiet devastation and bare honesty, C minor to open, close mic fading to silence, instrumental, no vocals"),
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
    print("  %-14s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); print("OK cloakroom bgm")
