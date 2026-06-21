# -*- coding: utf-8 -*-
"""BGM narrative blocks for «ТЫ — Маляр» — one block per act (cold open + A1..A10).
Full ACE-Step tag prompts (genre+bpm+rhythm+instruments+mood+key+texture, instrumental).
Data only — does NOT render audio (user listens before any bulk render). Idempotent per slug.
Run: PYTHONIOENCODING=utf-8 python seed_painter_bgm.py
"""
import uuid, json, psycopg2

conn = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
conn.set_client_encoding("UTF8")
cur = conn.cursor()
cur.execute("SELECT id FROM projects WHERE slug='painter'")
pid = cur.fetchone()[0]

BLOCKS = [
 ("cold_open","Кибер-холодное вступление",
  "dark ambient cinematic drone, very slow 46 bpm, no beat, a single sustained low tone building dread then one hard muffled impact and empty silence, sparse bowed double bass, distant muffled crowd hum, desolate and ominous, D minor, dry close production, instrumental, no vocals"),
 ("act01_childhood","Детство — тёплая ностальгия",
  "warm nostalgic folk, gentle 76 bpm, soft brushed percussion, acoustic guitar fingerpicking, music box, warm upright piano, light tape hiss, sunlit tender and innocent, C major, lo-fi vintage texture, instrumental, no vocals"),
 ("act02_institute","Институт — надежда",
  "hopeful neoclassical chamber pop, 92 bpm, light kick and soft claps, felt piano, pizzicato strings, clean electric guitar, youthful optimism with a cool institutional edge, G major, polished warm production, instrumental, no vocals"),
 ("act03_nowork","Нет работы — спад",
  "melancholic neoclassical, slow 60 bpm, no drums, sparse solo piano, low cello, faint rain ambience, deflation and quiet disappointment, A minor, intimate close-mic, instrumental, no vocals"),
 ("act04_germany","Германия — чужбина",
  "cold minimal electronic, 84 bpm, sparse muted pulse, distant synth pads, glassy bell tones, lonely and displaced, F minor, spacious reverb, instrumental, no vocals"),
 ("act05_graywork","Серая работа — монотонность",
  "industrial mechanical ambient, repetitive 100 bpm, metallic percussion loop and low motor hum, dry muted bass, monotonous and grinding, E minor, gritty factory texture, instrumental, no vocals"),
 ("act06_revolt","Бунт — цвет возвращается",
  "warm uplifting post-rock, building 110 bpm, soft driving drums, layered chiming guitars, glockenspiel, warm bass, hope and quiet defiance returning, D major, wide cinematic build, instrumental, no vocals"),
 ("act07_beating","Избиение — удар",
  "tense thriller orchestral, 120 bpm rising, agitated tremolo strings and low brass stabs, hard timpani, then a sudden drop to ringing silence, fear and violence, C minor, dynamic cinematic, instrumental, no vocals"),
 ("act08_erasure","Самостирание — горе",
  "mournful chamber lament, very slow 52 bpm, no drums, solo cello, sparse piano, distant muffled stadium roar bleeding in, deep grief and resignation, D minor, intimate close-mic, instrumental, no vocals"),
 ("act09_aftermath","Послесловие — пустота",
  "hollow detuned ambient, very slow 56 bpm, no beat, dishevelled out-of-tune upright piano, cold drone, grey emptiness with no resolution, A minor, dusty lo-fi texture, instrumental, no vocals"),
 ("act10_coda","Кода — горький свет",
  "bittersweet warm neoclassical, slow 64 bpm, soft felt piano, warm sustained strings, faint music-box echo, tender melancholy and faint hope, C major resolving warm, a single held fading tone at the end, instrumental, no vocals"),
]

ins = 0
for order, (skey, title, mood) in enumerate(BLOCKS):
    cur.execute("SELECT 1 FROM narrative_blocks WHERE \"projectId\"=%s AND slug=%s", (pid, skey))
    if cur.fetchone():
        continue
    cur.execute("""SELECT sh.id FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
                   WHERE sh."projectId"=%s AND sc."sceneKey"=%s ORDER BY sh."shotCode" """, (pid, skey))
    shot_ids = [r[0] for r in cur.fetchall()]
    target = len(shot_ids) * 5
    cur.execute("""INSERT INTO narrative_blocks
        (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds","targetSeconds",status,"updatedAt")
        VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,'filling',now())""",
        (str(uuid.uuid4()), pid, skey, title, order, mood, json.dumps(shot_ids), target))
    ins += 1

conn.commit()
cur.execute("""SELECT count(*), coalesce(sum("targetSeconds"),0) FROM narrative_blocks WHERE "projectId"=%s""", (pid,))
cnt, secs = cur.fetchone()
print(f"OK bgm_blocks inserted={ins} total_blocks={cnt} total_targetSeconds={secs} (expect 1050 = 210x5)")
cur.close(); conn.close()
