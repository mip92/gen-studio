# -*- coding: utf-8 -*-
"""Seed shuttle BGM narrative_blocks. ACE-Step tags, instrumental no vocals.
PYTHONIOENCODING=utf-8 python scripts/_seed_shuttle_bgm.py"""
import json, psycopg2
PFX="7e6a0000-0000-4000-8000-"; PROJ=PFX+"000000000001"
MOODS={
"cold_open":("Cold open — сумка на антресолях","tender keepsake ambient, slow 66 bpm, no drums, warm felt piano over a soft string pad, a faint music-box glint, memory opening like a cupboard, F major, close warm mix, instrumental, no vocals"),
"nii":("Акт 1 — НИИ без зарплаты","stalled institute elegy, slow 70 bpm, no drums, a plain upright piano and a thin cold string, a clock-tick texture, dignity in scarcity, A minor, dry office air, instrumental, no vocals"),
"first_run":("Акт 2 — первый рейс, Лалели","road-and-bazaar folk, moderate 100 bpm, a soft darbuka-like hand rhythm, saz-flavoured plucked strings over acoustic guitar, bus-wheel momentum into market bustle, D minor with bright turns, warm travel mix, instrumental, no vocals"),
"market":("Акт 3 — место 12, Валя","hardy market groove, steady 92 bpm, brushed snare and a walking bass, accordion riffs and a cheeky clarinet, cold hands warm humour, G minor, open-air mix, instrumental, no vocals"),
"kidok":("Акт 4 — кидок","betrayal-and-grit lament, slow 62 bpm, a sparse heartbeat drum, low cello under a worried piano line, then a stubborn rising figure, loss turned into resolve, C minor, close honest mix, instrumental, no vocals"),
"border":("Акт 5 — таможня","checkpoint tension, moderate 84 bpm, a dry ticking pulse and deep drone, icy string harmonics over muffled bass, floodlight suspense easing into dawn release, E minor to E major hint, wide cold reverb, instrumental, no vocals"),
"daughter":("Акт 6 — концерт без мамы","aching lullaby waltz, gentle 72 bpm in three, music box and soft piano, a distant school-piano echo, a child's waiting and a mother's road, A minor tender, small hall air, instrumental, no vocals"),
"default98":("Акт 7 — дефолт","crisis-and-backbone build, steady 88 bpm, a firm kick pulse, low piano ostinato with rising strings, panic around one steady line, D minor resolving upward, controlled powerful mix, instrumental, no vocals"),
"kiosk":("Акт 8 — ларёк","settled small-trade warmth, easy 84 bpm, light brushed drums, acoustic guitar and a friendly accordion, kettle-warm contentment with a thin thread of distance, F major, cosy close mix, instrumental, no vocals"),
"store":("Акт 9 — магазин «Вера»","earned-respect theme with a wound, moderate 80 bpm, soft drums and piano chords, a proud cello line broken by one cold pause, achievement and a daughter's words, B flat major over minor, clean daylight mix, instrumental, no vocals"),
"mend":("Акт 10 — примирение","mending duet, warm 76 bpm, gentle brushes, two intertwining piano voices over warm strings, forgiveness through shared work, G major, intimate shop-light mix, instrumental, no vocals"),
"coda":("Финал — сумка на новые антресоли","circle-closing elegy, slow 64 bpm, no drums, felt piano and warm cello with a faint music-box reprise, love passed like an heirloom, F major fading to hearth quiet, instrumental, no vocals"),
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
cx.commit(); print("OK shuttle bgm"); cur.close(); cx.close()
