# -*- coding: utf-8 -*-
"""caregiver — BGM-блоки, по одному на сцену. Прямой SQL, потому что бэкенд
на момент сида не поднят; сегменты добить через POST /bgm/blocks/:id/fill и
пересчитать длину через recompute-target ПОСЛЕ рендера TTS (пока targetSeconds
считается по заглушке 4 с/кадр — реальную длину даёт только озвучка).
Промпты ACE-Step: жанр + темп + ритм + инструменты + настроение + тональность
+ продакшн + instrumental, no vocals.
"""
import psycopg2, datetime, json

PFX = "7e6f0000-0000-4000-8000-"
PROJ = PFX + "000000000001"
NOW = datetime.datetime.now()

BLOCKS = [
 ("cold_open", "Cold open — девятый день, замок",
  "cold ambient chamber drone, very slow 46 bpm, no beat, one sustained low string note with a slow felt-piano figure over it, "
  "distant room tone, the stillness of an emptied flat, quiet disbelief held very flat, "
  "A minor, dry close reverb, instrumental, no vocals"),
 ("hired", "Акт 1 — сокращение, агентство, первый приход",
  "restrained neoclassical opening, 68 bpm, no drums, solo felt piano stating a plain four-note motif, warm low strings entering underneath, "
  "one soft clarinet line, cautious and ordinary and slightly hopeful, thin spring daylight, "
  "F major, intimate close-mic, instrumental, no vocals"),
 ("routine", "Акт 2 — первый год, тетрадь, колокольчик",
  "warm domestic minimalism, 76 bpm, soft brushed snare pulse, repeating vibraphone ostinato, muted upright piano chords, cello holding long notes, "
  "the comfort of a schedule kept perfectly, amber lamplight, "
  "C major with an unresolved sixth, warm analogue production, instrumental, no vocals"),
 ("promise", "Акт 3 — перелом, больница, обещание",
  "tense clinical strings, slow 60 bpm, no percussion, tremolo violins high and thin, a low cello pedal underneath, single struck piano notes, "
  "night in a ward and a sentence that changes everything, cold blue light, "
  "D minor, wide clean reverb, instrumental, no vocals"),
 ("daughter", "Акт 4 — пропущенный день рождения",
  "bittersweet urban indie score, 90 bpm, dry kick and rim pulse, muted electric guitar arpeggio with tape delay, warm bass, distant synth pad, "
  "a young life going on somewhere else without you, street daylight, "
  "E minor lifting to relative major, modern dry production, instrumental, no vocals"),
 ("deeper", "Акт 5 — переезд в чужую квартиру",
  "slow enveloping ambient folk, 64 bpm, no drums, bowed double bass drone, plucked acoustic guitar harmonics, breathy low flute, faint harmonium, "
  "a life quietly folding itself into one corner of somebody else's room, "
  "G minor, soft close-mic warmth, instrumental, no vocals"),
 ("bell", "Акт 6 — двадцать звонков за ночь",
  "sleepless nocturne, very slow 52 bpm, no beat, a single struck small bell recurring irregularly, detuned celesta, low sustained synth pad, "
  "muffled ticking texture, exhaustion that never resolves into rest, deep brown night, "
  "B flat minor, dark close production, instrumental, no vocals"),
 ("papers", "Акт 7 — «после Нового года»",
  "dry procedural minimalism, 96 bpm, mechanical clock-like woodblock pulse, staccato pizzicato strings, low piano notes on the beat, "
  "a hollow bassoon line, deadlines quietly sliding past one after another, green desk-lamp light, "
  "A minor, tight controlled mix, instrumental, no vocals"),
 ("last_winter", "Акт 8 — последние недели",
  "pale devotional ambient, very slow 44 bpm, no percussion, sustained string pad in high register, sparse felt-piano intervals, "
  "one distant female-toned wordless synth line, tenderness and total exhaustion together, thin winter light, "
  "E flat major shading minor, wide soft reverb, instrumental, no vocals"),
 ("farewell", "Акт 9 — палата, похороны",
  "neoclassical chamber lament, very slow 50 bpm, no drums, solo cello carrying the theme, sparse piano beneath it, a low struck bell twice, "
  "muted string section entering late, grief with the ceremony done properly, grey slush and black coats, "
  "C minor, hall reverb, instrumental, no vocals"),
 ("will", "Акт 10 — завещание и замок",
  "cold flat minimalism, 58 bpm, no beat, a single repeated piano note under a slowly descending low string line, thin metallic resonance, "
  "the sound of a fact that cannot be argued with, bare daylight in an empty room, "
  "F sharp minor, dry unglamorous mix, instrumental, no vocals"),
 ("coda", "Финал — другой колокольчик",
  "quiet circular epilogue, 70 bpm, soft shaker only, music box figure repeating unchanged, warm low strings underneath, one small bell at the very end, "
  "the same beginning starting again somewhere else, soft afternoon light, "
  "C major that never resolves, gentle warm production, instrumental, no vocals"),
]

# Заглушка: у свежего проекта нет ни TTS, ни видеорендеров, поэтому экспортная
# математика даёт NO_VO_US = 4 с на кадр. Пересчитать после озвучки.
STUB_SECONDS_PER_SHOT = 4


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    cur.execute('SELECT count(*) FROM narrative_blocks WHERE "projectId"=%s', (PROJ,))
    if cur.fetchone()[0]:
        print("ABORT: blocks exist")
        return
    total = 0
    for i, (key, title, mood) in enumerate(BLOCKS):
        cur.execute('''SELECT sh.id FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
                       WHERE sh."projectId"=%s AND sc."sceneKey"=%s ORDER BY sh."shotCode"''', (PROJ, key))
        ids = [r[0] for r in cur.fetchall()]
        if not ids:
            raise SystemExit("no shots for scene " + key)
        cur.execute('''INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder","moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt")
                       VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,'filling',%s,%s)''',
                    (PFX + "0000000000b1%x" % i if i < 16 else PFX + "0000000000b2%x" % i,
                     PROJ, key, title, i, mood, json.dumps(ids), len(ids) * STUB_SECONDS_PER_SHOT, NOW, NOW))
        total += len(ids)
        print("  %-13s shots=%3d target~%ds" % (key, len(ids), len(ids) * STUB_SECONDS_PER_SHOT))
    cx.commit()
    print("OK blocks=%d covering %d shots" % (len(BLOCKS), total))
    cur.close()
    cx.close()


if __name__ == "__main__":
    main()
