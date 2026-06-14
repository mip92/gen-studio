# -*- coding: utf-8 -*-
"""Seed mascot BGM narrative_blocks (one per act). ACE-Step tags, instrumental no vocals."""
import json, psycopg2
PFX="7e5e0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — подсобка","melancholy ambient noir, very slow 52 bpm, no drums, a lone reverbed piano note, a low felt-piano drone, a faint music-box echo, hollow weary stillness, A minor, dusty close reverb, instrumental, no vocals"),
"act01_invisible":("Акт 1 — незаметный ребёнок","lonely minimalist piano, very slow 56 bpm, no drums, sparse felt-piano, faint warm tape hiss, childhood loneliness and quiet longing, C minor, intimate close-mic, instrumental, no vocals"),
"act02_first_mask":("Акт 2 — первая маска","bittersweet music-box waltz, gentle 70 bpm, soft brushed rhythm, music box and warm strings, plucked pizzicato, the first taste of being loved, G major, tender, instrumental, no vocals"),
"act03_first_mascot":("Акт 3 — первый маскот","warm hopeful indie-folk, 92 bpm, soft kick and shaker, fingerpicked acoustic guitar, mellow Rhodes, the relief of belonging in disguise, D major, lo-fi warmth, instrumental, no vocals"),
"act04_her":("Акт 4 — она","tender fairground waltz, 84 bpm, gentle calliope and accordion, soft glockenspiel, warm strings, fragile budding love under string lights, A major, dreamy reverb, instrumental, no vocals"),
"act05_family":("Акт 5 — семья","wistful neoclassical, slow 66 bpm, soft brushed drums, warm piano, a lonely cello, domestic warmth thinning into absence, D minor, intimate, instrumental, no vocals"),
"act06_rising":("Акт 6 — восхождение","upbeat brass-band fanfare with a melancholy undertow, 108 bpm, marching snare, bright trumpets, a sad low cello beneath, public cheer over private fatigue, B flat major, instrumental, no vocals"),
"act07_dream":("Акт 7 — мечта","soaring cinematic build, 90 bpm, swelling strings, hopeful piano, a rising heartbeat kick, the dream of a lifetime arriving, C major, wide hall reverb, instrumental, no vocals"),
"act08_worldcup":("Акт 8 — ЧМ-2026","epic stadium orchestral anthem, 100 bpm, huge cinematic drums and timpani, full brass and strings, a global choir-like swell, dazzling triumphant spectacle, D major, vast stadium reverb, instrumental, no vocals"),
"act09_heat":("Акт 9 — жара","oppressive cinematic tension, slow 60 bpm, a relentless low pulse, shimmering heat-haze synth, a distant muffled crowd roar, suffocating dread under the spectacle, F sharp minor, hot reverb, instrumental, no vocals"),
"act10_peak":("Акт 10 — финал, обморок","tragic orchestral climax, 80 bpm, huge drums and brass swelling then dropping to a cold clinical drone, glassy piano, glory and collapse at once, D minor over a bright pedal, vast then sterile reverb, instrumental, no vocals"),
"act11_after":("Акт 11 — после","hollow neoclassical lament, very slow 50 bpm, no drums, sparse detuned piano, a faint cello, a faint music-box echo of past cheer, discarded and forgotten, A minor, cold museum reverb, instrumental, no vocals"),
"act12_finale":("Финал — снимает голову","intimate piano elegy, very slow 52 bpm, no drums, a single bare piano, a faint warm string pad fading, quiet devastation and bare honesty, C minor resolving to open, close intimate mic fading to silence, instrumental, no vocals"),
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
    print("  %-16s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); print("OK mascot bgm")
