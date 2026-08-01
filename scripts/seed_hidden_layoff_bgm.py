# -*- coding: utf-8 -*-
"""hidden_layoff BGM blocks: one per act, caption per gen-studio-acestep rules
(no bpm number / no key / no time signature in the caption — they live in the
dedicated columns). Titles follow the mandatory «Cold open / Акт N / Финал» format."""
import json, psycopg2

PFX = "7e730000-0000-4000-8000-"
PROJ = PFX + "000000000001"

BLOCKS = [
 ("A0", "bgm_cold_open", "Cold open — авария за двадцать минут", 104, "D minor",
  "tense procedural minimalism, dry ticking rimshot pulse, muted electric piano ostinato, low cello drone, one held high violin harmonic, controlled urgency of a routine emergency, clean dry production, instrumental, no vocals"),
 ("A1", "bgm_origin", "Акт 1 — портфель от отца", 76, "G major",
  "warm nostalgic acoustic, soft brushed snare, nylon-string guitar arpeggios, upright piano, faint tape hiss and a warm pad, first-job pride and family mornings, analogue tape production, instrumental, no vocals"),
 ("A2", "bgm_signs", "Акт 2 — оптимизация контура", 100, "A minor",
  "cool corporate minimalism, soft four-on-the-floor tick, glassy synth pad, clipped electric piano chords, a thin rising string line under the surface, polite unease in a bright office, glossy modern production, instrumental, no vocals"),
 ("A3", "bgm_firing", "Акт 3 — три оклада и молчание", 60, "C minor",
  "sparse chamber drama, no drums, low piano chords struck slowly, solo cello long bowed notes, cold room tone, the quiet of a signature ending nineteen years, dry close-mic production, instrumental, no vocals"),
 ("A4", "bgm_ritual", "Акт 4 — маршрут без работы", 88, "E minor",
  "circling domestic minimalism, soft muted kick pulse, felt piano ostinato, plucked pizzicato strings, a light airy pad, the comfort of a schedule kept perfectly while it means nothing, warm intimate production, instrumental, no vocals"),
 ("A5", "bgm_rejects", "Акт 5 — слишком дорогой", 72, "Bb major",
  "weary summer lo-fi, dusty downtempo beat, hazy electric piano, slow fingerpicked guitar, warm vinyl crackle, heat and polite refusals wearing a man down, saturated lo-fi production, instrumental, no vocals"),
 ("A6", "bgm_mirror", "Акт 6 — сосед по лавке", 66, "G minor",
  "melancholic chamber folk, no drums, a low soft clarinet melody, acoustic guitar picked slowly, double bass long notes, two men filling worktime in a green park, the sadness of recognition, woody warm production, instrumental, no vocals"),
 ("A7", "bgm_money", "Акт 7 — зарплата из банкомата", 96, "F minor",
  "uneasy pulse minimalism, a quiet insistent shaker groove, marimba ostinato, low piano octaves, a thin detuned synth line creeping in, counted banknotes and shrinking pencil numbers, close dry production, instrumental, no vocals"),
 ("A8", "bgm_no_return", "Акт 8 — оранжевые жилеты", 52, "Eb minor",
  "grey autumn ambient drama, no beat, bowed double bass drone, sparse felt piano intervals, a distant rain-wash pad, a door declined out of pride, wide grey reverb, instrumental, no vocals"),
 ("A9", "bgm_exposure", "Акт 9 — телефон и парк", 48, "D minor",
  "held-breath cinematic tension, no percussion, a single sustained string chord swelling by degrees, low piano notes far apart, one high violin harmonic, the moment a seven month lie meets daylight, stark dry production, instrumental, no vocals"),
 ("A10", "bgm_after", "Акт 10 — семь месяцев", 56, "A minor",
  "hollow domestic lament, no drums, a detuned upright piano struck softly, muted cello, a thin cold air pad, polite voices in a night kitchen and a slow thaw at the edge, intimate close-mic production, instrumental, no vocals"),
 ("A11", "bgm_finale", "Финал — клац-клац", 70, "C major",
  "quiet redemption minimalism, brushed percussion barely present, a warm felt piano theme, acoustic guitar harmonics, a low warm pad, honest tiredness under first snow, warm analogue production, instrumental, no vocals"),
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
    print("%-14s %-32s shots=%d bpm=%d %s" % (slug, title, len(shot_ids), bpm, keyscale))
cx.commit(); cur.close(); cx.close()
print("BGM OK")
