# -*- coding: utf-8 -*-
"""Seed announcer BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e600000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — будка ночью","melancholy ambient noir, very slow 50 bpm, no drums, a lone reverbed piano note, a low felt-piano drone, a faint station-hall hum, hollow weary stillness, A minor, vast empty-hall reverb, instrumental, no vocals"),
"origin":("Акт 1 — мечта о пении, будка","bittersweet neoclassical, slow 60 bpm, soft felt piano and warm cello, a faint distant operatic warmth, faint tape hiss, youthful hope curdling into quiet loss, D minor, intimate close-mic, instrumental, no vocals"),
"gallery_a":("Акт 2 — мать у эшелонов, прощания","mournful farewell waltz, slow 66 bpm, soft brushed rhythm, warm strings and a lonely solo cello, distant brass like a far train, grief of partings, G minor, soft platform reverb, instrumental, no vocals"),
"gallery_b":("Акт 3 — пассажир 7:14, эмигранты","steady train-rhythm neoclassical, 92 bpm, a soft chugging pulse like wheels on rails, muted piano and pizzicato strings, the ache of routine and leaving, B flat minor, dry rhythmic room, instrumental, no vocals"),
"gallery_c":("Акт 4 — перронный билет, беглянка","tense apprehensive cinematic, slow 64 bpm, a low sustained drone and sparse high piano, a quiet anxious pulse, waiting and a single hard choice, F sharp minor, cold wide reverb, instrumental, no vocals"),
"gallery_d":("Акт 5 — слепой, ночной поезд","tender night ambient, slow 58 bpm, warm pad and a lonely solo violin, a faint music-box, the intimacy of a guiding voice, A minor, deep blue reverb, instrumental, no vocals"),
"gallery_e":("Акт 6 — ребёнок-голос, начальник","bittersweet music-box neoclassical, gentle 72 bpm, glockenspiel and warm strings fading to a thin cold pulse, innocence and warmth thinning out, C major shifting to minor, soft then sterile reverb, instrumental, no vocals"),
"turn":("Акт 7 — юбилей, шанс спеть","deceptive hopeful build, 84 bpm, swelling warm strings and hopeful piano with a hesitant kick, a false gala bloom collapsing back to a single cold note, C major falling to A minor, swelling then sterile reverb, instrumental, no vocals"),
"catastrophe":("Акт 8 — синтез заменяет тебя","cold synthetic dread, slow 56 bpm, a clinical machine pulse and glassy synth, a human cello swallowed by a sterile drone, erasure and the uncanny, D minor over a flat digital pedal, stark cold reverb, instrumental, no vocals"),
"aftermath":("Акт 9 — анонимная пассажирка","quiet reconciled neoclassical, slow 58 bpm, soft chugging train pulse under a bare warm piano, bittersweet release and freedom, C major, gentle intimate reverb, instrumental, no vocals"),
"coda":("Финал — пустая будка, кода","intimate piano elegy, very slow 50 bpm, no drums, a single bare piano and a faint three-note chime motif fading, quiet devastation and bare honesty, C minor resolving to open, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK announcer bgm")
