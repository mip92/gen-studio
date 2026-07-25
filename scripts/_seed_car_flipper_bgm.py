# -*- coding: utf-8 -*-
"""car_flipper — BGM-блоки, по одному на сцену. Прямой SQL, потому что бэкенд
на момент сида не поднят; сегменты добить через POST /bgm/blocks/:id/fill и
пересчитать длину через recompute-target ПОСЛЕ рендера TTS (пока targetSeconds
считается по заглушке 4 с/кадр — реальную длину даёт только озвучка).
Промпты ACE-Step: жанр + темп + ритм + инструменты + настроение + тональность
+ продакшн + instrumental, no vocals.
"""
import psycopg2, datetime, json

PFX = "7e6e0000-0000-4000-8000-"
PROJ = PFX + "000000000001"
NOW = datetime.datetime.now()

BLOCKS = [
 ("cold_open", "Cold open — кювет, маячки",
  "dark ambient cinematic drone, very slow 48 bpm, no beat, a low sustained bass drone with one distant metallic impact, "
  "sparse bowed double bass, faint detuned piano harmonics, cold wet air and blue rotating light, dread and arrival too late, "
  "D minor, wide dry stereo field, instrumental, no vocals"),
 ("garage", "Акт 1 — гараж, первая скрутка",
  "warm lo-fi analogue nostalgia, 82 bpm, loose brushed drums with a lazy backbeat, muted electric guitar with spring reverb, "
  "dusty upright piano, soft tape hiss and radio noise, curious and unhurried adolescence in an oily workshop, "
  "G major, warm saturated tape production, instrumental, no vocals"),
 ("market", "Акт 2 — рынок, первое «как себе брал»",
  "gritty street blues rock, 96 bpm, steady snare-and-hat shuffle, dirty slide electric guitar, walking electric bass, "
  "wheezing harmonica, cold mud and cheap confidence, haggling energy, E minor, raw close-mic room sound, "
  "instrumental, no vocals"),
 ("craft", "Акт 3 — ремесло, большая вода",
  "industrial folk, 88 bpm, hypnotic hammered rhythm of metal on metal as percussion, plucked acoustic guitar ostinato, "
  "low cello drone, distant accordion, craftsmanship curdling into method, dust and solvent, A minor, "
  "dry mid-forward mix, instrumental, no vocals"),
 ("first_return", "Акт 4 — покупатель вернулся",
  "tense minimal thriller score, 100 bpm, dry ticking sixteenth-note pulse, pizzicato strings, single held cello note, "
  "muted low piano stabs, confrontation held at room temperature, cold grey daylight, C minor, tight controlled reverb, "
  "instrumental, no vocals"),
 ("lot", "Акт 5 — своя площадка",
  "bright corporate optimism with a hairline crack, 112 bpm, clean four-on-the-floor kick with rim clicks, "
  "arpeggiated synth plucks, warm electric piano chords, glassy bell accents, polished commercial daylight and quiet unease, "
  "F major drifting to relative minor, glossy modern production, instrumental, no vocals"),
 ("son", "Акт 6 — сын в деле",
  "warm cinematic post-rock, 92 bpm, patient tom-driven groove building slowly, layered clean electric guitars with delay, "
  "sustained synth pad, deep sub bass, paternal pride that is really transmission, amber evening light, "
  "D major with a minor turn, big open stereo production, instrumental, no vocals"),
 ("quit", "Акт 7 — похороны, попытка выйти",
  "neoclassical chamber lament, very slow 54 bpm, no drums, solo cello carrying the line, sparse felt piano, "
  "distant string pad, one struck low bell, grief and a decision unmaking itself, wet autumn stillness, "
  "B minor, intimate close-mic, instrumental, no vocals"),
 ("sale", "Акт 8 — продажа Ане",
  "deceptively warm acoustic score, 76 bpm, soft shaker and brushed snare, nylon-string guitar, mellow rhodes, "
  "quiet sustained strings underneath, late summer sun and a lie told gently, an unresolved note held under the melody, "
  "A major over a wandering bass, soft analogue warmth, instrumental, no vocals"),
 ("crash", "Акт 9 — экспертиза",
  "cold procedural minimalism, 104 bpm, dry mechanical pulse like a metronome, muted marimba ostinato, "
  "low synth drone, sparse detuned piano notes, clinical strip light and evidence written down, no sympathy and no accusation, "
  "F sharp minor, clean clinical mix, instrumental, no vocals"),
 ("verdict", "Акт 10 — суд, срок",
  "slow orchestral collapse, 58 bpm, no percussion, low strings descending step by step, muted brass swell, "
  "single struck piano chord left to decay, institutional green corridors and a number read aloud, "
  "C minor, wide hall reverb, instrumental, no vocals"),
 ("coda", "Финал — мойка, стекло, дисклеймер",
  "hollow ambient epilogue, very slow 46 bpm, no beat, detuned upright piano with the sustain pedal down, "
  "thin high string harmonic, faint water and hiss textures, emptiness after everything is already done, "
  "A minor unresolved, distant washed-out reverb, instrumental, no vocals"),
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
