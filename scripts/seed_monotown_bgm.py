# -*- coding: utf-8 -*-
"""monotown BGM blocks (tempo/key in columns, captions clean)."""
import json, psycopg2

PFX = "7e790000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — три тонны над людьми", 92, "D minor",
  "industrial crisis tension, a low chain-like percussion pattern, deep brass drone, staccato low piano, one clear whistle-like high accent, a master conducting men, heavy shop reverb, instrumental, no vocals"),
 ("A1", "bgm_horn_town", "Акт 1 — город по гудку", 80, "G major",
  "warm industrial folk anthem, a steady work-march brush pattern, accordion and baritone horn, warm strings, a town breathing by one schedule, brass-band warmth, instrumental, no vocals"),
 ("A2", "bgm_receiver", "Акт 2 — управляющий", 96, "E minor",
  "cold administrative minimalism, a rolling-case click pattern, glassy synth pad, clipped piano chords, a thin descending line, assets counted in square metres, sterile flat production, instrumental, no vocals"),
 ("A3", "bgm_bypass", "Акт 3 — обходные", 68, "B minor",
  "farewell processional, a slow muffled drum, low male-register cello theme, sparse piano, handshakes a second too long, dignified grief production, instrumental, no vocals"),
 ("A4", "bgm_emptying", "Акт 4 — город пустеет", 62, "F# minor",
  "fading town ambient, no beat, a hollow wind texture, detuned music-box motif, sparse guitar harmonics, papered windows and merged classes, thin grey production, instrumental, no vocals"),
 ("A5", "bgm_no_horn", "Акт 5 — гудок отменяют", 56, "C minor",
  "the silence act, almost no instruments, a low held drone where a horn should be, sparse felt piano, one unresolved suspended chord, a town waking raggedly, empty morning production, instrumental, no vocals"),
 ("A6", "bgm_offer", "Акт 6 — предложение области", 72, "Ab major",
  "crossroad chamber warmth, no drums, warm piano against a cold synth pad, a cello weighing two roads, a hand taken across a bench, amber lamp production, instrumental, no vocals"),
 ("A7", "bgm_auction", "Акт 7 — станок с торгов", 84, "G minor",
  "absurd triumphal march in miniature, a dry snare pattern, tuba and accordion carrying a work theme, a lathe riding through town like a prize bull, bittersweet brass production, instrumental, no vocals"),
 ("A8", "bgm_resolve", "Акт 8 — я догашу цех", 60, "D minor",
  "quiet resolve theme, a slow heartbeat pulse, low piano octaves, a rising cello line that stays low, a refusal written in a steady hand, iron and lamplight production, instrumental, no vocals"),
 ("A9", "bgm_last_horn", "Акт 9 — последний гудок", 50, "C minor",
  "elegy for a factory, no percussion, a deep horn-like drone swelling three times and dying, strings holding the silence after, light leaving in bands, cathedral stillness production, instrumental, no vocals"),
 ("A10", "bgm_garages", "Акт 10 — гаражи", 78, "F major",
  "small workshop resurgence, a light metallic tap pattern like tools, acoustic guitar, warm accordion returning, seven names on kraft paper, lantern warm production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — семь тридцать мелом", 88, "C major",
  "earned morning anthem, a confident work-march brush pattern, the accordion theme reprised bright, warm brass and strings, sparks on wet concrete and chalk on steel, open hopeful production, instrumental, no vocals"),
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
