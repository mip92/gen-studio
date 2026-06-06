# -*- coding: utf-8 -*-
"""Seed BGM NarrativeBlocks for project `beauty` along the emotional arc.
Rich ACE-Step prompts (genre+bpm+rhythm+instruments+mood+key+production, instrumental/no vocals).
shotIds gathered by scene sortOrder ranges. Idempotent (skip existing slug)."""
import sys, json, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PID = "7e570000-0000-4000-8000-000000000001"

# slug, title, (scene_order_min, scene_order_max inclusive), ACE-Step moodPrompt
BLOCKS = [
 ("bgm01_cold_open", "Холодный пролог — пустота",
  (0, 0),
  "melancholic ambient cinematic intro, 58 bpm, slow rubato with no beat, lone felt piano over a sustained low cello drone with faint glassy bell tones like a music box winding down, hollow grieving desolate mood, A minor, wide cathedral reverb and soft tape hiss, bare and intimate, instrumental, no vocals, no drums"),
 ("bgm02_childhood", "Детство — сладкая ложь",
  (1, 3),
  "nostalgic warm music-box lullaby, 72 bpm, gentle 3/4 waltz lilt, celesta and music box with soft pizzicato strings and warm upright piano, innocent tender bittersweet mood, C major, vintage sepia warmth with light vinyl crackle, delicate and cozy, instrumental, no vocals"),
 ("bgm03_youth_glamour", "Юность 90-х и первая соперница",
  (4, 5),
  "retro 90s synth-pop glamour instrumental, 112 bpm, danceable four-on-the-floor with shimmering hi-hats and gated-reverb snare, analog synth pads, funky bass and a bright lead, confident seductive nostalgic mood turning faintly anxious at the edges, F# minor, glossy neon production, instrumental, no vocals"),
 ("bgm04_wedding", "Свадьба и молодая жена — триумф с тревогой",
  (6, 7),
  "lush romantic orchestral waltz, 84 bpm, sweeping 3/4 strings with harp glissando and a solo violin, warm and triumphant slowly blooming into quiet unease, D major drifting toward its relative minor, cinematic widescreen reverb, elegant and bittersweet, instrumental, no vocals"),
 ("bgm05_creeping_fear", "Дочь, первая морщинка, страх старости",
  (8, 10),
  "tense cinematic underscore, 68 bpm, faint ticking-clock pulse, cold sustained strings with a single repeating piano note and a low pulsing synth, creeping dread and quiet panic, B minor, sterile clinical reverb, restrained and unsettling, instrumental, no vocals"),
 ("bgm06_seductive_hook", "Первый укол, взгляды, филлеры — крючок",
  (11, 13),
  "hypnotic dreamy electronic score, 90 bpm, soft pulsing heartbeat synth pulse, warm analog pads with a glassy arpeggio and breathy textures, seductive intoxicating addictive mood over a dark undertone, A major shimmer, lush hazy reverb, narcotic and alluring, instrumental, no vocals"),
 ("bgm07_decay_lies", "Кредиты, маска, охлаждение мужа — распад",
  (14, 17),
  "dark tense cinematic cue, 76 bpm, low irregular pulse, detuned piano with dissonant string clusters, muted ticking and hollow synth drones, deceit decay and growing cold dread, C minor with a microtonal waver, brittle dry production, claustrophobic, instrumental, no vocals"),
 ("bgm08_desperate_spiral", "Операция, долги, соперница — отчаянная спираль",
  (18, 21),
  "driving anxious orchestral spiral, 122 bpm, relentless string ostinato and pounding low percussion, frantic arpeggios building tension with rising risers, desperate obsessive accelerating mood, D minor, aggressive cinematic production, urgent and suffocating, instrumental, no vocals"),
 ("bgm09_tragedy", "Катастрофа и разрыв с дочерью",
  (22, 23),
  "devastating tragic orchestral adagio, 52 bpm, slow heavy strings with a mournful solo cello and a distant piano, shattering grief and irreversible loss, F minor, vast cold reverb with a single fading heartbeat, broken and final, instrumental, no vocals, no drums"),
 ("bgm10_desolation", "Зеркала лгут, одна, завешенные зеркала, старость",
  (24, 27),
  "glacial desolate ambient drone, 50 bpm, no beat, frozen sustained synth pads with faint detuned music-box fragments and distant piano echoes, utterly hollow empty and lonely mood, suspended A minor, immense icy reverb and tape decay, sparse and bleak, instrumental, no vocals, no drums"),
 ("bgm11_fragile_peace", "Внучка и финал — хрупкое искупление",
  (28, 29),
  "tender fragile redemptive piano theme, 66 bpm, gentle rubato, warm felt piano with softly swelling strings and a single returning music-box motif now resolved, fragile hope and hard-won peace, C major emerging from minor, intimate warm reverb, gentle and healing, instrumental, no vocals"),
 ("bgm12_outro", "Аутро — тихое послесловие",
  (30, 30),
  "quiet sober reflective outro, 60 bpm, sparse felt piano with warm low strings and a soft ambient pad, calm honest consoling mood with a faint warning undertone, G major, intimate close reverb, understated and sincere, instrumental, no vocals"),
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
            target = int(round(words/140.0*60 + len(ids)*0.5))  # VO sec + inter-shot tails
            bid = f"7e570000-0000-4000-8000-0000000000b{i:02x}"
            cur.execute('INSERT INTO narrative_blocks (id,"projectId",slug,title,"sortOrder",'
                '"moodPrompt","shotIds","targetSeconds",status,"createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s, now(), now())',
                (bid, PID, slug, title, i, mood, json.dumps(ids), target, "pending"))
            seeded += 1
            print(f"  {slug:24s} scenes {lo:2d}-{hi:2d} | {len(ids):2d} shots | ~{target}s")
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
