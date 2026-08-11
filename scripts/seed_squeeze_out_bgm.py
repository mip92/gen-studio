# -*- coding: utf-8 -*-
"""squeeze_out BGM blocks (tempo/key in the columns, captions clean)."""
import json, psycopg2

PFX = "7e750000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — ночь, отметка, семь утра", 96, "D minor",
  "night-shift procedural tension, a dry ticking hi-hat pulse, low piano ostinato, a held cello drone, one bright marimba accent, an engineer solving against the clock, close dry production, instrumental, no vocals"),
 ("A1", "bgm_origin", "Акт 1 — кресло под спину", 80, "C major",
  "warm workshop folk, a soft brushed shuffle, nylon-string guitar, upright piano, a gentle accordion breath, fifteen years of belonging, warm analogue production, instrumental, no vocals"),
 ("A2", "bgm_merger", "Акт 2 — слияние", 102, "G minor",
  "polite corporate unease, a soft quantised tick, glassy synth pad, clipped electric piano chords, a thin rising violin line, fresh paint over old wood, glossy modern production, instrumental, no vocals"),
 ("A3", "bgm_squeeze", "Акт 3 — мы никого не увольняем", 88, "F minor",
  "slow tightening minimalism, a muffled heartbeat kick, repeating piano cell shrinking by a note, dry pizzicato strings, walls moved inward politely, airless close production, instrumental, no vocals"),
 ("A4", "bgm_notebook", "Акт 4 — блокнот", 66, "Eb minor",
  "documentary nocturne, no drums, sparse felt piano, a low bowed double bass, a quiet ticking clock texture, evidence gathered against the quiet, dim intimate production, instrumental, no vocals"),
 ("A5", "bgm_pasha", "Акт 5 — Паша уходит сам", 92, "D major",
  "bittersweet spring folk, a light brushed kit, fingerpicked acoustic guitar, warm clarinet melody, a friend leaving with his head up, open air production, instrumental, no vocals"),
 ("A6", "bgm_basement", "Акт 6 — подвал", 58, "C minor",
  "cold basement ambient, no beat, a deep pipe-like drone, sparse detuned piano notes, a faint radiator tick texture, stubbornness in low light, cavernous damp reverb, instrumental, no vocals"),
 ("A7", "bgm_name", "Акт 7 — чужая фамилия", 72, "B minor",
  "wounded chamber drama, a restrained slow pulse, solo cello carrying anger held in, hard piano chords far apart, a name taken quietly off a drawing, stark dry production, instrumental, no vocals"),
 ("A8", "bgm_partner", "Акт 8 — партнёрство", 64, "Ab major",
  "false-calm evening chamber, no drums, warm piano over one unresolved suspended chord, soft strings circling, a door held open for the last time, amber lamp production, instrumental, no vocals"),
 ("A9", "bgm_victory", "Акт 9 — победа", 76, "A minor",
  "hollow triumph minimalism, a sparse muted pulse, music-box motif over a low drone, thin high strings, applause for the wrong achievement, flat winter production, instrumental, no vocals"),
 ("A10", "bgm_exit", "Акт 10 — заявление", 84, "F major",
  "thaw and release, a soft growing brushed kit, piano theme opening outward, warm acoustic guitar, meltwater and a long exhale, widening warm production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — не партнёром", 78, "G major",
  "quiet earned-peace folk, a gentle brushed pulse, felt piano theme, acoustic guitar harmonics, a low warm pad, honest work among nine desks, warm analogue production, instrumental, no vocals"),
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
    print("%-14s %-42s shots=%d bpm=%d %s" % (slug, title, len(shot_ids), bpm, keyscale))
cx.commit(); cur.close(); cx.close()
print("BGM OK")
