# -*- coding: utf-8 -*-
"""Seed BGM NarrativeBlocks for project `wall` along the emotional arc.
Rich ACE-Step prompts (genre+bpm+rhythm+instruments+mood+key+production, instrumental/no vocals),
Cold-War / Eldritch-noir flavoured. shotIds gathered by scene sortOrder ranges. Idempotent."""
import sys, json, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PID = "7e580000-0000-4000-8000-000000000001"

BLOCKS = [
 ("bgm01_cold_open", "Холодный пролог — одна", (0,0),
  "melancholic ambient cinematic intro, 56 bpm, slow rubato with no beat, lone felt piano over a cold cello drone and a faint distant clock, hollow grieving solitude, A minor, vast cold reverb and tape hiss, bare and bleak, instrumental, no vocals, no drums"),
 ("bgm02_childhood", "Детство в холодном доме", (1,2),
  "austere cold-war chamber piece, 60 bpm, sparse slow strings and a single muted upright piano, a child's loneliness in a loveless home, D minor, dry grey room reverb, restrained and joyless, instrumental, no vocals"),
 ("bgm03_wall_1961", "1961, Стена и разлука", (3,4),
  "ominous cold-war orchestral dread, 64 bpm, low brass swells and a martial snare pulse, scraping cellos, the menace of concrete and barbed wire dividing a city, C minor, harsh industrial reverb, oppressive, instrumental, no vocals"),
 ("bgm04_first_gaze", "Первая тёплая волна", (5,7),
  "a slow sultry retro lounge groove, 92 bpm, brushed drums, warm electric piano and a breathy saxophone line, dawning allure and dangerous sweetness, E minor, smoky reverb, intimate, instrumental, no vocals"),
 ("bgm05_chase", "Погоня, ночи ГДР", (8,11),
  "smoky GDR nightlife groove, 108 bpm, driving bassline, terse funk guitar and analog synth, restless compulsive hunger under neon, F# minor, dim club reverb, propulsive and hollow, instrumental, no vocals"),
 ("bgm06_andreas", "Андреас, настоящее тепло", (12,13),
  "tender warm love theme, 72 bpm, gentle felt piano with a solo cello and soft strings, a rare honest tenderness unlike anything before, C major, warm intimate reverb, hopeful and fragile, instrumental, no vocals"),
 ("bgm07_inner_wall", "Надежда и стена внутри", (14,15),
  "hope and dread entwined, 68 bpm, a warm piano motif shadowed by a low ominous drone and faint ticking, love offered against rising panic, A minor over C major, tense reverb, bittersweet, instrumental, no vocals"),
 ("bgm08_betrayal", "Измена и потеря Андреаса", (16,17),
  "tragic orchestral loss, 54 bpm, mournful strings and a fading solo cello, a single piano note like a door closing, the one real love thrown away, F minor, vast cold reverb, devastating, instrumental, no vocals, no drums"),
 ("bgm09_spiral", "Оправдание и пустая спираль", (18,20),
  "hollow numb spiral, 100 bpm, mechanical four-on-the-floor pulse, cold detuned synth and a repetitive empty riff, pleasure drained to bare habit, G minor, dry claustrophobic production, joyless and driving, instrumental, no vocals"),
 ("bgm10_price", "Цена, Штази, восьмидесятые", (21,22),
  "cold institutional dread, 58 bpm, sparse clinical piano, a low surveillance drone and faint typewriter ticks, consequence and shame faced alone, B minor, sterile reverb, bleak, instrumental, no vocals"),
 ("bgm11_wall_falls", "Стена падает, эйфория и пустота", (23,24),
  "euphoric then hollow, 84 bpm, swelling strings and bright bells rising to a triumphant peak that drains to a single empty piano, history's joy that cannot fill her, D major collapsing to D minor, epic reverb, instrumental, no vocals"),
 ("bgm12_decline", "Девяностые, увядание", (25,28),
  "fading neon decline, 96 bpm, a tired synth-pop pulse losing its sparkle, cold pads and a wistful lead, desirability draining away with age, E minor, glossy cold reverb, melancholic, instrumental, no vocals"),
 ("bgm13_grief", "Одна, что потеряно", (29,32),
  "lonely reflective adagio, 60 bpm, solo piano and warm low strings, the ache of what-if and roads not taken, A minor, intimate reverb, grieving and tender, instrumental, no vocals"),
 ("bgm14_desolation", "Старость, пустая квартира", (33,34),
  "glacial desolate drone, 50 bpm, no beat, frozen sustained pads with faint distant piano and a ticking clock, utter hollow old-age loneliness, suspended D minor, immense icy reverb, sparse, instrumental, no vocals, no drums"),
 ("bgm15_reckoning", "Стена, осознание, финал", (35,37),
  "solemn redemptive reckoning, 64 bpm, felt piano with a returning love motif and soft cello, the hard late truth and a sliver of bitter peace, C minor resolving toward major, warm vast reverb, sombre and calm, instrumental, no vocals"),
 ("bgm16_outro", "Аутро — послесловие", (38,38),
  "quiet sober reflective outro, 60 bpm, sparse felt piano with warm low strings and a soft ambient pad, calm honest consoling mood with a faint warning undertone, G major, intimate close reverb, understated, instrumental, no vocals"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor(); seeded = 0
    try:
        for i, (slug, title, (lo, hi), mood) in enumerate(BLOCKS, start=1):
            cur.execute('SELECT 1 FROM narrative_blocks WHERE "projectId"=%s AND slug=%s', (PID, slug))
            if cur.fetchone(): continue
            cur.execute('''SELECT sh.id, coalesce(sh."narrationText",'')
                FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
                WHERE sh."projectId"=%s AND sc."sortOrder" BETWEEN %s AND %s
                ORDER BY sc."sortOrder", sh."shotCode"''', (PID, lo, hi))
            rows = cur.fetchall()
            ids = [r[0] for r in rows]
            words = sum(len(r[1].split()) for r in rows)
            target = int(round(words/140.0*60 + len(ids)*0.5))
            bid = f"7e580000-0000-4000-8000-0000000000b{i:02x}"
            cur.execute('INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder",'
                '"moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s, now(), now())',
                (bid, PID, slug, title, i, mood, json.dumps(ids), target, "pending"))
            seeded += 1
            print(f"  {slug:20s} scenes {lo:2d}-{hi:2d} | {len(ids):2d} shots | ~{target}s")
        conn.commit()
        cur.execute('SELECT count(*), coalesce(sum("targetSeconds"),0) FROM narrative_blocks WHERE "projectId"=%s',(PID,))
        n, tot = cur.fetchone()
        print(f"OK BGM: seeded {seeded} new | total blocks {n} | total scored ~{tot}s (~{tot/60:.0f} min)")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
