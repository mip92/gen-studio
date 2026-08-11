# -*- coding: utf-8 -*-
"""preretire BGM blocks (tempo/key in columns, captions clean)."""
import json, psycopg2

PFX = "7e760000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — двенадцать минут", 100, "E minor",
  "workshop procedural tension, a dry ticking rim pulse over a conveyor-like ostinato, low bass clarinet drone, one bright vibraphone accent, a craftsman solving under the clock, close dry production, instrumental, no vocals"),
 ("A1", "bgm_hands", "Акт 1 — ладонь на станине", 78, "G major",
  "warm industrial folk, a soft brushed shuffle, accordion breaths, fingerpicked acoustic guitar, upright piano, bread warmth and steel routine, warm analogue production, instrumental, no vocals"),
 ("A2", "bgm_sensors", "Акт 2 — датчики вместо ладони", 104, "B minor",
  "cool tech minimalism, a quantised soft click groove, glassy synth arpeggio, clipped electric piano, a thin detuned line under the surface, green dashboards over old machines, sterile digital production, instrumental, no vocals"),
 ("A3", "bgm_agreement", "Акт 3 — по соглашению", 62, "C minor",
  "sparse chamber drama, no drums, low piano chords struck slowly, solo cello long bowed notes, a proud signature in a cold office, dry close-mic production, instrumental, no vocals"),
 ("A4", "bgm_walking", "Акт 4 — пешком по заводам", 96, "D major",
  "confident walking folk-rock, a steady brushed backbeat, strummed acoustic guitar, warm bass, a paper folder against an autumn city, open road production, instrumental, no vocals"),
 ("A5", "bgm_market", "Акт 5 — до тридцати пяти", 74, "F# minor",
  "weary urban lo-fi, a dusty downtempo beat, hazy electric piano, a slow muted trumpet line, vinyl crackle, polite refusals stacking up, saturated lo-fi production, instrumental, no vocals"),
 ("A6", "bgm_courses", "Акт 6 — курсы", 90, "A minor",
  "absurdist classroom minimalism, a dry woodblock pattern, plinking marimba, a polite synth pad, thermoses and slide decks, deadpan clean production, instrumental, no vocals"),
 ("A7", "bgm_pride", "Акт 7 — я сам", 56, "Eb minor",
  "cold november lament, no beat, a bowed double bass drone, sparse felt piano intervals, a distant wind texture, pride keeping a man warm badly, wide grey reverb, instrumental, no vocals"),
 ("A8", "bgm_backdoor", "Акт 8 — через задний двор", 60, "B minor",
  "held-breath chamber tension, no percussion, a single string chord tightening, low piano notes far apart, one high harmonic, a door refused on principle, stark dry production, instrumental, no vocals"),
 ("A9", "bgm_ads", "Акт 9 — две сотки тишины", 70, "G minor",
  "quiet stubborn resurgence, a soft heartbeat kick appearing halfway, felt piano cell, plucked strings gathering, handwritten ads against a winter, intimate warming production, instrumental, no vocals"),
 ("A10", "bgm_mixer", "Акт 10 — тестомес", 86, "F major",
  "warm craftsman folk, a light brushed kit finding its stride, accordion melody, acoustic guitar, oven-glow warmth and steady hands, warm analogue production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — хлеб и щуп", 76, "C major",
  "gentle earned-peace theme, a barely-there brushed pulse, felt piano melody, acoustic guitar harmonics, a low warm pad, bread steam over steel blades, warm analogue production, instrumental, no vocals"),
]

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
cur.execute('SELECT status FROM narrative_blocks LIMIT 1')
status = cur.fetchone()[0]
for i, (scene_key, slug, title, bpm, keyscale, mood) in enumerate(BLOCKS):
    cur.execute('''SELECT sh.id FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
        WHERE sh."projectId"=%s AND sc."sceneKey"=%s ORDER BY sh."shotCode"''', (PROJ, scene_key))
    shot_ids = [r[0] for r in cur.fetchall()]
    if not shot_ids:
        raise SystemExit("no shots for " + scene_key)
    cur.execute('''INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds",
            status,bpm,keyscale,timesignature,"createdAt","updatedAt")
        VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,'4',now(),now())''',
                (PFX + "000000bb%04x" % i, PROJ, slug, title, i, mood, json.dumps(shot_ids), status, bpm, keyscale))
    print("%-14s %-38s shots=%d bpm=%d %s" % (slug, title, len(shot_ids), bpm, keyscale))
cx.commit(); cur.close(); cx.close()
print("BGM OK")
