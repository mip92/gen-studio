# -*- coding: utf-8 -*-
"""Seed fortune BGM narrative_blocks (one per act). One-shot. ACE-Step neon-noir/tarot tags."""
import json, psycopg2
PFX="7e5d0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — мёртвый неон",
 "dark neon-noir ambient, very slow 50 bpm, no beat, a low synth drone under a faint buzzing neon hum, sparse detuned Rhodes, distant rain, cold mysterious dread, A minor, wet reverb, instrumental, no vocals"),
"act01_fool":("Дурак — детство",
 "warm nostalgic neo-noir folk, gentle 72 bpm, soft brushed drums, mellow Wurlitzer, fingerpicked nylon guitar, a faint music box, candlelit childhood wonder with a mystic edge, G major, tape-warm analog, instrumental, no vocals"),
"act02_magician":("Маг — первый обман",
 "sultry trip-hop noir, 90 bpm, dusty boom-bap drums, deep upright bass, smoky Rhodes, a hint of theremin, seductive dangerous awakening, D minor, vinyl crackle, instrumental, no vocals"),
"act03_priestess":("Жрица — двусмысленность",
 "mysterious downtempo, 84 bpm, soft electronic kick, hand percussion, hypnotic kalimba, swelling pad, oracular incense haze and uncertain wonder, E minor, deep reverb, instrumental, no vocals"),
"act04_lovers":("Влюблённые — он",
 "warm romantic neon synth-pop, 96 bpm, gentle drum machine, glossy Rhodes, soft analog bass, a tender arpeggio, hopeful fragile love, A major, lush chorus, instrumental, no vocals"),
"act05_wheel":("Колесо Фортуны — салон",
 "glamorous nu-disco noir, 112 bpm, four-on-the-floor kick, slap bass, glossy synth stabs, shimmering hi-hats, decadent neon success with a hollow core, A minor, polished club production, instrumental, no vocals"),
"act06_devil":("Дьявол — снятие порчи",
 "sinister industrial trip-hop, 88 bpm, heavy distorted kick, metallic percussion, detuned synth bass, eerie choir pad, predatory greed and dread, C minor, dark reverb, instrumental, no vocals"),
"act07_justice":("Справедливость — цена",
 "cold cinematic noir, slow 66 bpm, sparse timpani hits, low strings, a single cold piano, ticking-clock percussion, guilt and reckoning, D minor, sterile hall, instrumental, no vocals"),
"act08_tower":("Башня — крах",
 "tense electronic post-rock, building 100 bpm, driving toms, distorted bass, tremolo synth, sharp stabs dropping to sudden silence, collapse and loss, B minor, stormy reverb, instrumental, no vocals"),
"act09_moon":("Луна — паранойя",
 "paranoid dark ambient downtempo, slow 70 bpm, sparse glitch percussion, detuned music box, low drone, uneasy high harmonics, isolation and dread, F sharp minor, cold cavernous reverb, instrumental, no vocals"),
"act10_death":("Смерть — утрата",
 "neoclassical mourning ambient, very slow 52 bpm, no drums, solo cello, sparse piano, a faint distant neon hum, profound grief and stillness, C minor, intimate close-mic, instrumental, no vocals"),
"act11_hermit":("Отшельник — старость",
 "lonely ambient noir, very slow 58 bpm, brushed rim clicks, a single reverbed electric guitar, low drone, faint buzzing dying neon, hollow weary solitude, A minor, vast empty reverb, instrumental, no vocals"),
"act12_world":("Финал — переворот, кода",
 "elegiac cinematic ambient, slow 56 bpm, soft swelling strings, glassy piano, a faint neon hum fading to silence, bittersweet resignation and quiet revelation, A minor resolving to open, vast fading reverb, instrumental, no vocals"),
}
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
cur.execute('DELETE FROM narrative_blocks WHERE "projectId"=%s',(PROJ,))
cur.execute('SELECT id,"sceneKey","sortOrder" FROM scenes WHERE "projectId"=%s ORDER BY "sortOrder"',(PROJ,))
for n,(sid,key,order) in enumerate(cur.fetchall()):
    c2=cx.cursor(); c2.execute('SELECT id,"narrationText" FROM shots WHERE "sceneId"=%s ORDER BY "shotCode"',(sid,))
    rows=c2.fetchall(); ids=[r[0] for r in rows]
    words=sum(len((r[1] or '').split()) for r in rows)
    target=int(round(words/140.0*60+len(rows)*0.5))
    title,mood=MOODS[key]
    cur.execute('''INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt")
        VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,'pending',now(),now())''',
        (PFX+"0000000000f%x"%(n+1),PROJ,"bgm_"+key,title,order,mood,json.dumps(ids),target))
    print("  %-16s shots=%2d target=%ds"%(key,len(ids),target))
cx.commit(); print("OK fortune bgm blocks")
