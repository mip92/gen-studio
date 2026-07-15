# -*- coding: utf-8 -*-
"""Seed teacher BGM narrative_blocks (one per scene). ACE-Step tags, instrumental no vocals.
PYTHONIOENCODING=utf-8 python scripts/_seed_teacher_bgm.py"""
import json, psycopg2
PFX="7e6b0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — кухня, вопрос мальчика","quiet pensive chamber piece, slow 62 bpm, no drums, a lone felt piano over a hushed string pad, a single distant violin line, held breath and gentle unease, A minor, close intimate room with soft morning air, instrumental, no vocals"),
"chalk":("Акт 1 — 1975, мел, первое имя","warm nostalgic acoustic waltz, gentle 76 bpm, a soft brushed 3/4 sway, tender music box and nylon-string guitar, a faraway glockenspiel like school bells, childhood wonder and coal-stove warmth, C major, tape-warm intimate production, instrumental, no vocals"),
"medal":("Акт 2 — 1985, медаль и выбор","bright hopeful chamber folk with a first crack, 84 bpm, a light train-like brushed rhythm, warm cello and clear piano, a bittersweet viola countermelody entering late, youthful promise shadowed by duty, G major shifting to E minor, open airy room, instrumental, no vocals"),
"first_bell":("Акт 3 — 1990, первый урок, астры","crisp september schoolyard waltz, 92 bpm, light pizzicato strings and a tidy snare brush, bright upright piano and a woodwind flourish, first-day nerves turning to joy, D major, clean bright hall reverb, instrumental, no vocals"),
"sugar":("Акт 4 — 90-е, сахар вместо зарплаты","cold industrial ambient with a stubborn heart, slow 70 bpm, a sparse muffled kick like distant machinery, detuned piano and a thin metallic drone, grey hardship cut by a warm cello phrase that refuses to stop, F minor, concrete-room reverb with tape hiss, instrumental, no vocals"),
"gate":("Акт 5 — 1999, договор ×6, отказ","tense minimal thriller, 80 bpm, a ticking pizzicato pulse like a clock, cold piano chords and a held low string drone, one suspended silence before resolve, temptation weighed and set down, B flat minor resolving to a bare open fifth, dry close production, instrumental, no vocals"),
"red_pen":("Акт 6 — тетради против диссертации","mechanical weary loop music, 74 bpm, a soft repeating rhythm like a pen ticking margins, muted piano ostinato and a tired viola, quiet erosion of a dream under routine, E minor, small lamplit room, instrumental, no vocals"),
"empty_flat":("Акт 7 — 2009, уход Володи","sparse chamber lament, very slow 56 bpm, no drums, a solo cello speaking in long phrases over silent pauses, a bare piano answering late, loneliness arriving in an ordinary kitchen, D minor, close-mic intimate stillness, instrumental, no vocals"),
"tutor":("Акт 8 — 2014, конверт Сани","awkward warm folk-pop, 88 bpm, a gentle acoustic strum with soft rimshot, homely accordion and plain piano, humour and gratitude tangled with quiet shame, F major with minor turns, warm living-room production, instrumental, no vocals"),
"aula":("Акт 9 — защита Кати, дистанционка","solemn distant organ swell into glass emptiness, slow 66 bpm, no drums, a far cathedral organ and warm strings rising to one proud peak, then thinning to a lone glassy synth and room tone, pride handed to another and a world gone quiet, C major dissolving to A minor, vast hall fading to a small kitchen, instrumental, no vocals"),
"last_bell":("Акт 10 — 2024, последний звонок","farewell school waltz cracked with age, 80 bpm, a tender 3/4 with brushed snare, upright piano slightly out of tune, warm strings and a small brass bell motif recurring, celebration laid over loss, B flat major with a weeping minor middle, warm hall with distant applause air, instrumental, no vocals"),
"coda":("Финал — новый мел, тишина","bare piano elegy with music-box echo, very slow 50 bpm, no drums, a single felt piano restating the childhood music-box theme unresolved, a faint high string harmonic fading first, quiet acceptance in winter light, C major left on an open unresolved chord, close mic fading to silence, instrumental, no vocals"),
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
cx.commit(); cur.close(); cx.close()
