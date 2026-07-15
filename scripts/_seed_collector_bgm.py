# -*- coding: utf-8 -*-
"""Seed collector BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals.
PYTHONIOENCODING=utf-8 python scripts/_seed_collector_bgm.py"""
import json, psycopg2
PFX="7e670000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — карточка матери","tense cinematic neo-noir ambient, very slow 54 bpm, no drums, a cold sustained synth drone under sparse felt piano notes, a faint clock-tick pulse, blue night-office dread, D minor, close dry mix with a wide cold tail, instrumental, no vocals"),
"origin":("Акт 1 — 1998, выносят телевизор","worn nineties post-soviet folk lament, slow 62 bpm, no drums, a tired nylon-string guitar and a plain upright piano, a faint radio-static warmth, poverty and family holding on, A minor, small-room close mic, instrumental, no vocals"),
"callcenter":("Акт 2 — 2008, гарнитура","anxious minimal electronica, mid 96 bpm, a dry ticking rim-click pulse, a muted synth bass and short grey arpeggio figures, fluorescent monotony and hunger for bonuses, C minor, flat compressed office air, instrumental, no vocals"),
"talent":("Акт 3 — лучший на этаже","coldly confident minimal techno-noir, steady 104 bpm, a soft four-on-the-floor kick under sidechained pads, a rising two-note synth motif, sharpening ambition with unease beneath, E minor, clean polished mix, instrumental, no vocals"),
"field":("Акт 4 — подъезды и стикеры","brooding urban cinematic, slow 80 bpm, a sparse heavy floor-tom heartbeat, a low cello drone and metallic scraped textures, damp stairwell menace kept polite, F minor, concrete reverb, instrumental, no vocals"),
"career":("Акт 5 — Оля, свадьба, ипотека","warm domestic neoclassical, gentle 72 bpm, no drums, a soft felt piano melody with a warm cello counterline, light acoustic guitar picking, tender settled happiness with a thin false floor, G major leaning minor, warm close-mic living-room air, instrumental, no vocals"),
"no_return":("Акт 6 — Семён Ильич, регламент","funereal dark ambient, very slow 48 bpm, no beat, a deep low drone swelling and receding, one repeating muffled telephone-like bell tone, sparse bowed double bass, guilt settling into procedure, D minor, hollow wide reverb, instrumental, no vocals"),
"empire":("Акт 7 — 40 операторов, развод","glassy corporate dystopia ambient, slow 88 bpm, a faint sequenced pulse like server-room hum, detuned pad layers and a lonely electric piano figure, success hollowing out a home, B minor, wide sterile stereo field, instrumental, no vocals"),
"father":("Акт 8 — похороны отца","neoclassical chamber elegy, very slow 50 bpm, no drums, a solo cello lament over sparse piano chords, a faint cold wind texture, grief managed like a project and failing, C minor, intimate close-mic with long decay, instrumental, no vocals"),
"catastrophe":("Акт 9 — номер матери, записи","suffocating cinematic dread, very slow 46 bpm, no beat, a building low drone with a slow icy piano note repeating, a thin high string harmonic tightening, one muted impact then near-silence, the worst record pressed play, D minor, cavernous cold reverb, instrumental, no vocals"),
"aftermath":("Акт 10 — платёж, цепочка, увольнение","spent dawn ambient, slow 58 bpm, no drums, a bare detuned upright piano and a soft grey pad, distant city-morning air, resignation and one clean decision, F minor easing toward major, dry honest room, instrumental, no vocals"),
"coda":("Финал — новая дверь, глазок","quiet redemption elegy, slow 56 bpm, no drums, a warm felt piano resolving in small steps over a soft cello drone, a faint brass-like warmth far back, love kept behind a locked door, C major with minor shadows, close warm mix fading to silence, instrumental, no vocals"),
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
cx.commit(); print("OK collector bgm"); cur.close(); cx.close()
