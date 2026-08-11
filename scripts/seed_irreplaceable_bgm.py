# -*- coding: utf-8 -*-
"""irreplaceable BGM blocks (tempo/key in columns, captions clean)."""
import json, psycopg2

PFX = "7e770000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — полчаса в два ночи", 98, "A minor",
  "night server-room tension, a dry ticking pulse like fans and relays, low synth drone, staccato piano cells, one bright chime on the save, close humming production, instrumental, no vocals"),
 ("A1", "bgm_empire", "Акт 1 — сто двенадцать паролей", 82, "D major",
  "cosy fortress theme, a soft shuffling beat, warm electric piano, plucked guitar, a music-box motif for the cipher, comfortable power grown quiet, warm dusty production, instrumental, no vocals"),
 ("A2", "bgm_audit", "Акт 2 — аудит", 100, "E minor",
  "polite investigative minimalism, a quantised tick, glassy synth pad, clipped piano chords, a thin rising line beneath the courtesy, sticky notes climbing a glass wall, clean modern production, instrumental, no vocals"),
 ("A3", "bgm_spof", "Акт 3 — единая точка отказа", 66, "C minor",
  "boardroom chamber drama, no drums, low piano chords, solo cello tightening, one red note repeating high, a vote counted in raised sleeves, stark dry production, instrumental, no vocals"),
 ("A4", "bgm_vendor", "Акт 4 — восемь миллионов", 108, "G minor",
  "bright project-team drive with a shadow, a confident four-on-the-floor tick, teal synth arpeggios, clipped bass, gantt-chart momentum against one man's queues, glossy production, instrumental, no vocals"),
 ("A5", "bgm_parallel", "Акт 5 — параллельный запуск", 94, "B minor",
  "two-systems counterpoint, a split rhythm of old shuffle against new grid click, duelling piano and synth motifs, one melody slowly winning, layered clean production, instrumental, no vocals"),
 ("A6", "bgm_gena", "Акт 6 — Гена уходит в облака", 72, "F major",
  "warm farewell folk, no drums, accordion breaths, fingerpicked guitar, a clarinet line like an old joke, dumpling steam on a window, close warm production, instrumental, no vocals"),
 ("A7", "bgm_readonly", "Акт 7 — режим чтения", 54, "Eb minor",
  "cold datacenter ambient, no beat, a deep white-noise drone, sparse detuned piano notes, badge-beep textures far away, a king filing an access request, cavernous cold reverb, instrumental, no vocals"),
 ("A8", "bgm_offer", "Акт 8 — завхоз чужой системы", 64, "Ab major",
  "false-warm evening chamber, no drums, warm piano over one suspended unresolved chord, soft strings circling an open door, dignity priced too high, amber lamp production, instrumental, no vocals"),
 ("A9", "bgm_shutdown", "Акт 9 — день выключения", 50, "D minor",
  "elegy for a machine, no percussion, a single sustained string chord dimming by degrees, low piano notes far apart, a fan note dying into silence, stark farewell production, instrumental, no vocals"),
 ("A10", "bgm_manual", "Акт 10 — мануал", 78, "G major",
  "quiet resurrection theme, a soft heartbeat pulse growing, felt piano cells multiplying like pages, warm strings gathering, knowledge finally flowing outward, warming intimate production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — регламент №1", 84, "C major",
  "bright earned-peace theme, a light brushed pulse, warm piano melody, acoustic guitar harmonics, a low warm pad, a cactus on a new monitor, warm analogue production, instrumental, no vocals"),
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
    print("%-14s %-40s shots=%d bpm=%d %s" % (slug, title, len(shot_ids), bpm, keyscale))
cx.commit(); cur.close(); cx.close()
print("BGM OK")
