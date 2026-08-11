# -*- coding: utf-8 -*-
"""best_thing BGM blocks (светлая арка; tempo/key in columns, captions clean)."""
import json, psycopg2

PFX = "7e780000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — копейка на миллионах", 102, "G major",
  "brisk ledger minimalism, a light ticking pulse like a calculator tape, plucked strings, bright piano cells, a professional finding the kopeck, crisp clean production, instrumental, no vocals"),
 ("A1", "bgm_wednesdays", "Акт 1 — цветы по средам", 84, "D major",
  "warm domestic folk-pop, a soft brushed kit, nylon guitar, warm piano, a gentle flute line over office windows, family evenings and watered plants, warm analogue production, instrumental, no vocals"),
 ("A2", "bgm_outsource", "Акт 2 — аутсорс", 72, "B minor",
  "cold announcement chamber, no drums, a suspended string pad, sparse piano intervals, a slow clock texture, folders on every seat, dry office production, instrumental, no vocals"),
 ("A3", "bgm_box", "Акт 3 — коробка и ножницы", 64, "E minor",
  "tender farewell nocturne, no beat, felt piano, a warm cello line, soft night-kitchen textures, fear allowed out only at night, intimate close-mic production, instrumental, no vocals"),
 ("A4", "bgm_fork", "Акт 4 — развилка", 80, "A minor",
  "quiet decision music, a heartbeat kick appearing and receding, two alternating motifs piano against guitar, one path warming as the other cools, focused intimate production, instrumental, no vocals"),
 ("A5", "bgm_courses", "Акт 5 — курсы", 96, "F major",
  "bright learning montage, a light shuffling beat, plucked ukulele-like guitar, marimba accents, hands discovering their second craft, fresh green production, instrumental, no vocals"),
 ("A6", "bgm_roza", "Акт 6 — школа Розы", 88, "G minor",
  "strict workshop groove, a dry woodblock and brush pattern, staccato strings, a stern accordion phrase softening by degrees, seven remakes and a nod, disciplined warm production, instrumental, no vocals"),
 ("A7", "bgm_corner", "Акт 7 — угол на рынке", 92, "C major",
  "market-morning folk, a light kit with tambourine, accordion melody, guitar strums, string lights over zinc buckets, first sales and first names, open cheerful production, instrumental, no vocals"),
 ("A8", "bgm_wedding", "Акт 8 — свадьба на девяносто", 76, "D minor",
  "night crisis drive, an urgent muted pulse, low strings sawing, piano octaves against frost, a family van through fog, resolving into a dawn chord, cinematic tense production, instrumental, no vocals"),
 ("A9", "bgm_family", "Акт 9 — семейный подряд", 98, "A major",
  "family-firm momentum, a confident brushed backbeat, warm bass, bright guitar and piano trading phrases, three pairs of hands one business, warm driving production, instrumental, no vocals"),
 ("A10", "bgm_workshop", "Акт 10 — мастерская", 82, "Eb major",
  "warm arrival theme, a gentle steady pulse, felt piano melody, soft strings, a sign lit over a doorway, earned and unhurried, glowing analogue production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — заказ из прошлой жизни", 90, "G major",
  "full-circle celebration, a light joyful kit, piano theme reprised brighter, warm strings and a small bell accent, two worlds greeting each other, festive warm production, instrumental, no vocals"),
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
