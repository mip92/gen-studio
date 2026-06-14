# -*- coding: utf-8 -*-
"""Seed BGM narrative_blocks (one per act). One-shot; not a maintained seeder.
moodPrompts = full ACE-Step tag sets (genre+bpm+rhythm+instruments+mood+key, instrumental no vocals).
Does NOT render — user listens/approves per block later."""
import json, psycopg2
PFX="7e5c0000-0000-4000-8000-"; PROJ=PFX+"000000000001"

MOODS = {  # sceneKey -> (RU title, ACE-Step moodPrompt)
"cold_open":("Cold open — палата",
 "dark ambient cinematic drone, very slow 48 bpm, no beat, a single sustained low synth pad with faint high metallic shimmer, sparse bowed double bass, cold clinical unease and creeping dread, A minor, dry close reverb, instrumental, no vocals"),
"act01_childhood":("Акт 1 — детство, озеро",
 "warm Americana folk, gentle 70 bpm, soft brushed snare and upright bass, fingerpicked acoustic guitar, mellow harmonica, dusty Tennessee porch nostalgia, bittersweet childlike wonder, G major, tape-warm analog, instrumental, no vocals"),
"act02_youth":("Акт 2 — юность",
 "melancholic indie folk-rock, 92 bpm, steady brushed drums, jangly clean electric guitar, warm bass, lonely Rhodes piano, restless searching melancholy and small-town isolation, E minor, lo-fi tape, instrumental, no vocals"),
"act03_linda":("Акт 3 — Линда",
 "tender folk-pop, 84 bpm, soft kick and shaker, fingerpicked acoustic guitar, gentle piano, warm cello pad, fragile budding love and quiet hope, A major, intimate close-mic, instrumental, no vocals"),
"act04_movement":("Акт 4 — движение",
 "hopeful indie-folk with a building gospel undertow, 100 bpm, hand-claps and tambourine, strummed acoustic guitar, hopeful piano, swelling string pad, earnest communal belonging with a hidden hollowness, C major, warm room, instrumental, no vocals"),
"act05_cody":("Акт 5 — Коди",
 "tender neoclassical folk, 76 bpm, soft brushed drums, music box and warm piano, gentle solo cello, fatherly tenderness shading into unease, slowly souring warmth, D major drifting to D minor, intimate, instrumental, no vocals"),
"act06_proofs":("Акт 6 — одержимость",
 "tense minimalist post-rock, 110 bpm, motorik kick and hi-hat, palm-muted tremolo guitar, cold analog arpeggiator, anxious low drone, obsessive sleepless drive, F sharp minor, clinical reverb, instrumental, no vocals"),
"act07_breaks":("Акт 7 — распад семьи",
 "sparse neoclassical lament, very slow 56 bpm, no drums, lone piano with wide spacing, mournful solo cello, faint detuned pad, quiet devastation and loss, C minor, intimate close-mic, instrumental, no vocals"),
"act08_alone":("Акт 8 — один",
 "dark ambient post-rock, slow 60 bpm, sparse floor-tom pulses, lone reverbed electric guitar, low synth drone, hollow loneliness hardening into cold resolve, B minor, vast empty reverb, instrumental, no vocals"),
"act09_rush":("Акт 9 — рывок",
 "driving cinematic post-rock, 116 bpm, insistent kick and tom groove, building tremolo electric guitars, pulsing bass, ascending strings, single-minded departure and grim hope, E minor, wide stereo, instrumental, no vocals"),
"act10_road":("Акт 10 — дорога",
 "lonesome desert Americana, 96 bpm, brushed shuffle drums, baritone twang guitar with spring reverb, lap steel, dusty organ, sunbaked wandering solitude, A minor, wide open reverb, instrumental, no vocals"),
"act11_water":("Акт 11 — большая вода, шторм",
 "cinematic ambient post-rock, slow build from 72 bpm, distant tom swells rising to driving toms, bowed guitar drones, low piano, swelling brass and strings, vast watery awe rising to stormy dread, D minor, huge reverb, instrumental, no vocals"),
"act12_edge":("Акт 12 — край мира",
 "epic cinematic orchestral post-rock, soaring 80 bpm, huge cinematic drums and timpani, full string section, glassy piano, swelling brass, radiant transcendent grief both glorious and devastating, D major over a dark pedal tone, vast hall reverb, instrumental, no vocals"),
"act13_after":("Акт 13 — палата, финал",
 "minimal neoclassical ambient, very slow 50 bpm, no drums, single sparse piano notes, faint high string harmonic, cold clinical stillness, fragile peace and emptiness, A minor, sterile close reverb fading to silence, instrumental, no vocals"),
}

cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
cur.execute("DELETE FROM narrative_blocks WHERE \"projectId\"=%s",(PROJ,))
cur.execute("""SELECT sc.id, sc."sceneKey", sc."sortOrder" FROM scenes sc WHERE sc."projectId"=%s ORDER BY sc."sortOrder" """,(PROJ,))
scenes=cur.fetchall()
n=0
for scene_id, key, order in scenes:
    cur.execute("""SELECT id, "narrationText" FROM shots WHERE "sceneId"=%s ORDER BY "shotCode" """,(scene_id,))
    rows=cur.fetchall()
    ids=[r[0] for r in rows]
    words=sum(len((r[1] or '').split()) for r in rows)
    target=int(round(words/140.0*60 + len(rows)*0.5))
    title,mood=MOODS[key]
    bid=PFX+"0000000000f%x"%(n+1)
    cur.execute("""INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt")
        VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,'pending',now(),now())""",
        (bid,PROJ,"bgm_"+key,title,order,mood,json.dumps(ids),target))
    n+=1
    print("  %-16s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); cur.close(); cx.close()
print("OK %d bgm blocks"%n)
