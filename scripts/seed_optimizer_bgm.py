# -*- coding: utf-8 -*-
"""optimizer BGM blocks: caption per gen-studio-acestep rules (tempo/key in the
dedicated columns, never in the caption)."""
import json, psycopg2

PFX = "7e740000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — мужчина, который не встаёт", 98, "E minor",
  "coiled procedural tension, a dry clicking rim pulse, muted staccato piano, low synth drone, one thin high string holding, a public scene defused by craft, clean close production, instrumental, no vocals"),
 ("A1", "bgm_origin", "Акт 1 — карточка в ламинате", 84, "F major",
  "bright office-pop minimalism, a light brushed kit, warm electric piano chords, plucked guitar figures, an optimistic young pulse with one cold note underneath, tidy modern production, instrumental, no vocals"),
 ("A2", "bgm_rise", "Акт 2 — козырь консалтинга", 106, "A minor",
  "sleek corporate electronica, a confident mid-tempo four-on-the-floor tick, glassy synth arpeggio, clipped bass, polished ambition with glass surfaces, glossy wide production, instrumental, no vocals"),
 ("A3", "bgm_conveyor", "Акт 3 — конвейер", 92, "D minor",
  "mechanical conveyor minimalism, an insistent woodblock and soft kick pattern, repeating marimba cell, dry cello stabs, the same four phrases said all day long, airless close production, instrumental, no vocals"),
 ("A4", "bgm_crack", "Акт 4 — как вы спите?", 62, "B minor",
  "uneasy nocturne, no drums, sparse felt piano, a low clarinet line surfacing and sinking, a thin high drone, one quiet question refusing to leave, dim intimate production, instrumental, no vocals"),
 ("A5", "bgm_mother", "Акт 5 — коробка матери", 58, "G minor",
  "wounded family lament, no beat, a solo cello carrying the theme, soft accordion breaths, sparse piano intervals, thirty-one years in a printer-paper box, warm room-tone production, instrumental, no vocals"),
 ("A6", "bgm_bank", "Акт 6 — проект на тысячу двести", 112, "C minor",
  "vast cold corporate pulse, a driving muted kick with ticking hats, deep synth bass, icy string ostinato rising by floors, ambition at cathedral scale, wide glassy production, instrumental, no vocals"),
 ("A7", "bgm_bot", "Акт 7 — цифровое расставание", 100, "F# minor",
  "clinical electronic minimalism, a quantised soft click groove, detuned music-box motif, cold pad, a human script read by a machine, sterile digital production, instrumental, no vocals"),
 ("A8", "bgm_core", "Акт 8 — мы — ядро", 68, "Eb major",
  "false-warm chamber pop, a gentle brushed pulse, warm piano chords over an uneasy suspended note, soft strings that never quite resolve, loyalty chosen against the evidence, amber evening production, instrumental, no vocals"),
 ("A9", "bgm_reversal", "Акт 9 — пятница, пятнадцать ноль-ноль", 50, "C minor",
  "held-breath chamber tension, no percussion, one sustained string chord tightening by degrees, low piano notes far apart, a single high harmonic, her own words crossing the table back to her, stark dry production, instrumental, no vocals"),
 ("A10", "bgm_borsch", "Акт 10 — борщ", 60, "A major",
  "quiet homecoming folk, no drums, a nylon-string guitar picked slowly, warm accordion pads, soft double bass, a kitchen where silence is finally allowed, close warm production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — по ту сторону стола", 74, "G major",
  "gentle redemption minimalism, a barely-there brushed pulse, warm felt piano theme, acoustic guitar harmonics, a low warm pad, plain work that helps people, warm analogue production, instrumental, no vocals"),
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
