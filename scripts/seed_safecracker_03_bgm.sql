-- Музыкальные блоки «Тот, кто слышит замки» — один блок на акт + финал.
--
-- ⛔ bpm / keyscale / timesignature идут ПОЛЯМИ, а не текстом промпта:
-- ACE-Step 1.5 добавляет их к промпту отдельным блоком `# Metas` из входов узла,
-- и цифра, написанная в подписи, спорит с ними — это и есть «битый ритм»
-- (Skill(gen-studio-acestep)). В подписи только жанр, ритм, инструменты,
-- настроение и продакшн.
--
-- Титул блока обязан быть в формате `Акт N — …` / `Финал — …`: экспортёр CapCut
-- печатает голову до тире на каждой дорожке (§4.1).
--
-- Сегменты НЕ создаются здесь: `POST /bgm/blocks/:id/fill` нарежет их сам,
-- посчитав длину по озвучке. Рендерить пачкой нельзя — сначала послушать один
-- тейк на блок.

BEGIN;

INSERT INTO narrative_blocks (
  id, "projectId", slug, title, "sortOrder", "moodPrompt",
  "shotIds", status, bpm, keyscale, timesignature, "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text, p.id, v.slug, v.title, v.so, v.mood,
  COALESCE((
    SELECT jsonb_agg(s.id ORDER BY s."shotCode")
    FROM shots s
    JOIN scenes sc ON sc.id = s."sceneId"
    WHERE s."projectId" = p.id AND sc."sceneKey" = v.act
  ), '[]'::jsonb),
  'auto', v.bpm, v.keyscale, '4', now(), now()
FROM projects p, (VALUES

('bgm_act1', 'Акт 1 — ночь, чужая дверь, чужой взгляд на руки', 1, 'A1',
 'dark ambient cinematic drone, no beat, a low sustained bowed double bass under a single high metallic ring, sparse prepared-piano taps struck once and left to decay, cold suspended dread with something patient behind it, dry close-miked stairwell reverb, instrumental, no vocals',
 46, 'D minor'),

('bgm_act2', 'Акт 2 — 1979, замок сверлят насмерть', 2, 'A2',
 'warm nostalgic acoustic folk, no drums, nylon-string guitar picked slowly, a single glockenspiel line, soft tape-saturated pad underneath, childhood memory that is fond and slightly sour, analogue tape hiss and gentle wow and flutter, instrumental, no vocals',
 68, 'F major'),

('bgm_act3', 'Акт 3 — будка, очередь, четыреста ключей', 3, 'A3',
 'minimal post-rock, brushed snare keeping a patient working pulse, muted electric guitar arpeggio repeating, upright bass walking slowly, warm rhodes chords held long, dignified everyday craft and quiet routine, roomy analogue production, instrumental, no vocals',
 84, 'A minor'),

('bgm_act4', 'Акт 4 — двести долларов за пятнадцать секунд', 4, 'A4',
 'cold electronic thriller score, sparse rimshot pulse, detuned analogue synth bass, a single glassy bell motif repeating, muted low strings swelling underneath, curiosity turning to calculation, wide cold reverb and tape delay, instrumental, no vocals',
 92, 'C minor'),

('bgm_act5', 'Акт 5 — правило, которое он называет чистотой', 5, 'A5',
 'dark tech house, restrained four-on-the-floor kick low in the mix, dry closed hi-hats, a hollow plucked synth figure, sub bass held under everything, disciplined and cold and increasingly mechanical, tight club production with no shine, instrumental, no vocals',
 118, 'G minor'),

('bgm_act6', 'Акт 6 — он показывает сыну, что замок игрушка', 6, 'A6',
 'warm neoclassical chamber, no drums, felt piano played softly in the mid register, a single cello line answering it, warm string pad beneath, tenderness with an unmistakable wrongness underneath, intimate close-mic and room tone, instrumental, no vocals',
 66, 'B flat major'),

('bgm_act7', 'Акт 7 — вывеска, и последний заказ', 7, 'A7',
 'hopeful cinematic build turning cold, soft kick and shaker establishing forward motion, ascending piano figure, warm brass pad rising then thinning out, low drone entering underneath and staying, optimism being quietly undercut, polished but airless production, instrumental, no vocals',
 100, 'E flat major'),

('bgm_act8', 'Акт 8 — четыре часа и бумага внутри', 8, 'A8',
 'inexorable orchestral dread, no melody, one sustained low brass chord holding and reinforcing itself, tremolo double basses, a single struck metal plate ringing out at long intervals, total absence of resolution, cavernous cinematic space, instrumental, no vocals',
 44, 'D minor'),

('bgm_act9', 'Акт 9 — он ставит замки и больше не снимает', 9, 'A9',
 'hollow ambient piano, no drums, detuned upright piano struck slowly with the sustain held, thin bowed string harmonic above it, dead low drone underneath, emptiness after the fact with nothing coming to fill it, dry unglamorous close recording, instrumental, no vocals',
 52, 'A minor'),

('bgm_coda', 'Финал — семь ключей на одном кольце', 10, 'F',
 'sparse neoclassical lament, no percussion, solo cello held long and unhurried, a single felt-piano note repeating at wide intervals, faint low drone fading beneath, quiet finality without consolation, intimate close-mic and slow natural decay, instrumental, no vocals',
 48, 'D minor')

) AS v(slug, title, so, act, mood, bpm, keyscale)
WHERE p.slug = 'safecracker';

COMMIT;

-- Проверка формата титулов (все строки обязаны быть ok = t, §4.1):
--   SELECT "sortOrder", slug, title,
--          title ~ '^(Cold open|Акт [0-9]+|Финал) — .+' AS ok
--   FROM narrative_blocks b JOIN projects p ON p.id = b."projectId"
--   WHERE p.slug = 'safecracker' ORDER BY "sortOrder";
