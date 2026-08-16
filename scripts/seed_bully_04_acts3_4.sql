-- ============================================================================
-- «Тот, кого они слушались» (bully) — кадры актов 3–4.
--
-- Same conventions as 03 (see its header). Two things this file also watches:
--  · scale alternation — W = EWS/WS, M = MS/MCU/OTS, C = CU/ECU; never three of
--    one group in a row, so the eye keeps re-framing;
--  · act tails must NOT share a template with each other (§5.1a): act 3 closes
--    on a two-hander at a window, act 4 on an object in a pocket.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'shots' AND column_name = 'endFramePrompt') THEN
    RAISE EXCEPTION 'shots."endFramePrompt" is missing — run `npx prisma migrate deploy` first';
  END IF;
END $$;

CREATE TEMP TABLE _bully_shots (
  code text, act text, loc text, participant text,
  shot_type text, angle text, move text,
  narration text, positive text, motion text, endframe text,
  broll boolean DEFAULT false, iconic boolean DEFAULT false
);

INSERT INTO _bully_shots (code, act, loc, participant, shot_type, angle, move, narration, positive, motion, endframe, broll, iconic) VALUES

-- ═══ АКТ 3 — Прозвище ══════════════════════════════════════════════════════
-- The mechanism of act 2 (approve, don't act) is applied deliberately for the
-- first time. One word, said once, out loud.

('A3_SH01','A3','corridor_2f','SLAVA_TEEN','MS','eye','static',
 'в октябре ты произносишь одно слово на перемене, негромко, но так, чтобы услышали все.',
 'medium shot at eye level, Slava standing with his weight on one hip and his shoulders half-turned to the corridor, saying a single short word toward the window bay where Yura stands, five boys around him already turning their heads, flat autumn light down the parquet',
 'his mouth opens once on the word and closes, and the nearest two heads swing toward him, the same figures throughout the shot, hand-drawn animation cadence',
 'his mouth has closed after the word and four of the five heads have turned fully toward him.',
 false, true),

('A3_SH02','A3','corridor_2f','YURA_TEEN','CU','eye','static',
 'юра слышит его первым и делает вид, что смотрит в окно.',
 'close-up at eye level, Yura seen in profile with his spine straight and his chin level, his eyes fixed on the window glass, the taped temple of his glasses toward camera, cold autumn light flattening one side of his face',
 'his eyes move a few degrees toward the corridor and come straight back to the glass, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes are fixed hard on the glass again and his jaw has tightened.',
 false, false),

('A3_SH03','A3','corridor_2f',NULL,'WS','high','track_lateral',
 'к пятнице так его зовут шестеро, и никто из них не придумал это сам.',
 'wide shot from a high angle down the second-floor corridor, groups of pupils along the tall windows with heads leaning together, one figure in a mustard vest walking alone against the flow, satchels on the radiators, banded light across the parquet',
 'the lone figure walks three paces against the flow while the leaning groups shift and re-form around him, the corridor otherwise holding its exact position, hand-drawn animation cadence',
 'the lone figure has walked several paces further down the corridor and two of the groups have closed the gap behind him.',
 true, false),

('A3_SH04','A3','classroom','TOLIK_TEEN','MCU','low','static',
 'толик пишет это слово мелом на углу доски, пока класс переписывает задачу.',
 'medium close-up from a low angle, Tolik reaching up with his weight on his front foot and his torso stretched, chalking a short word into the corner of the black slate board, his polished belt buckle catching the light, rows of bent heads behind him copying from a textbook',
 'the chalk completes the last letter and lifts away, chalk dust falling from the ledge below, the same single figure throughout the shot, hand-drawn animation cadence',
 'the chalk has been lowered to his side and the finished word stands alone in the corner of the board.',
 false, false),

('A3_SH05','A3','classroom',NULL,'ECU','eye','push_in',
 'слово держится на доске сорок минут, и его никто не стирает.',
 'extreme close-up at eye level, a short chalked word in the corner of a black slate board, the strokes powdery and uneven, older ghost writing half-erased behind it, chalk dust on the wooden ledge beneath, hard side light from the window',
 'chalk dust drifts down off the ledge in a thin trail while the letters stay exactly as written, only air and light in motion, hand-drawn animation cadence',
 'a little more chalk dust has gathered on the ledge and one letter edge has crumbled slightly.',
 true, true),

('A3_SH06','A3','schoolyard',NULL,'WS','low','static',
 'к среде так говорит весь класс, к концу октября вся параллель.',
 'wide shot from a low angle in the school yard, three separate clusters of pupils across the cracked asphalt with heads turned the same way, bare poplars above the fence, the pale brick block behind, low afternoon sun throwing long shadows',
 'the three clusters shift and one boy crosses between them while poplar branches sway once overhead, the place otherwise holding its exact position, hand-drawn animation cadence',
 'the crossing boy has reached the far cluster and the three groups have merged into two.',
 true, false),

('A3_SH07','A3','classroom','NINA','OTS','eye','static',
 'на перекличке нина петровна называет его юрой, и это единственный раз за день.',
 'over-the-shoulder shot at eye level past Nina, her forearm and register in the foreground, the class seen in rows beyond with one hand raised at the back, her small wristwatch worn face-inward on her wrist, chalky morning light through the tall windows',
 'her pen moves down one line of the register and stops, the raised hand at the back lowering, the same figures throughout the shot, hand-drawn animation cadence',
 'her pen has moved two lines further down the register and the raised hand at the back is gone.',
 false, false),

('A3_SH08','A3','classroom','YURA_TEEN','CU','eye','static',
 'он отзывается на своё имя чуть громче, чем нужно, и опускает руку сразу.',
 'close-up at eye level, Yura at his desk with his spine straight against the chair back and his chin level, his hand just coming down from being raised, his lips still parted on the answer, the taped glasses catching a line of window light',
 'his hand comes the rest of the way down onto the desk lid and his lips close, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand rests flat on the desk lid and his mouth is closed, his eyes gone down to the desk.',
 false, false),

('A3_SH09','A3','corridor_2f','SLAVA_TEEN','EWS','high','pull_out',
 'ты считаешь про себя, что имя стирается за девятнадцать дней.',
 'extreme wide establishing shot from a high angle, the full length of the second-floor corridor with pupils in small groups along the windows, Slava alone at the near end with his weight even and his shoulders squared, radiators and satchels down one side, banded daylight',
 'the distant groups drift and re-form along the windows while the near figure stays exactly where he is, hand-drawn animation cadence',
 'the distant groups have moved further down the corridor and the near figure still stands in the same place, now alone in the foreground.',
 false, false),

('A3_SH10','A3','corridor_2f','RITA_TEEN','MS','eye','static',
 'ритка белова подходит к окну и спрашивает, не стыдно ли тебе.',
 'medium shot at eye level, Rita standing square to camera with her weight even and her shoulders set, one hand on the window sill, her two black braids over her shoulders and the red claw clip above one of them, tall corridor window behind throwing cold light around her',
 'her hand tightens once on the painted sill and her chin lifts a few degrees as she speaks, the same single figure throughout the shot, hand-drawn animation cadence',
 'her hand has come off the sill and her chin is fully lifted, her shoulders squarer than before.',
 false, false),

('A3_SH11','A3','corridor_2f','SLAVA_TEEN','CU','low','push_in',
 'ты отвечаешь, что ты его не трогал, и это чистая правда.',
 'close-up from a low angle, Slava with his chin level and his shoulders squared, speaking a short flat answer with his eyes going past her to the window, the copper bracelet visible where his hand rests on the sill, cold window light down one side of his face',
 'his eyes shift from her face to the window glass and stay there as he finishes speaking, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes are fixed on the window glass and his mouth has closed, his face turned a little further from her.',
 false, true),

('A3_SH12','A3','corridor_2f','RITA_TEEN','MCU','eye','static',
 'она не спорит, она просто стоит ещё секунду и уходит первой.',
 'medium close-up at eye level, Rita half-turned away from camera with her weight already on her back foot, still facing him for one more moment, one braid swinging forward off her shoulder, the corridor stretching away behind her in flat daylight',
 'the braid swings forward off her shoulder and settles as she begins to turn away, the same single figure throughout the shot, hand-drawn animation cadence',
 'she has turned fully away and taken the first step down the corridor, the braid settled against her back.',
 false, false),

('A3_SH13','A3','corridor_2f','SLAVA_TEEN','ECU','eye','static',
 'и это первая ложь, которую ты рассказываешь не кому-то, а себе.',
 'extreme close-up at eye level, Slava''s hand left alone on the painted window sill, the copper wire bracelet loose at the wrist, the fingertips pressing white against the paint, cold flat light from the glass above',
 'the fingertips press down harder and the skin under them whitens, the rest of the frame holding still, hand-drawn animation cadence',
 'the fingers have lifted off the sill and the pale pressure marks are still visible on the paint.',
 false, false),

('A3_SH14','A3','corridor_2f',NULL,'WS','eye','static',
 'после звонка коридор пустеет за минуту, и у окна не остаётся никого.',
 'wide shot at eye level down the emptying second-floor corridor, the last two pupils reaching the far stairs, an empty window bay in the middle distance with a radiator beneath it, satchel scuff marks on the parquet, late afternoon light going amber',
 'the last two figures pass out of frame at the far stairs and the corridor is left with only dust turning in the window light, the place holding its exact position, hand-drawn animation cadence',
 'the corridor is completely empty and the amber light has crept further along the parquet.',
 true, false),

-- ═══ АКТ 4 — Портфель ══════════════════════════════════════════════════════
-- The first act where he is not the author of anything and is still the reason
-- it happens. Leitmotif recurrence 2 of 5: the keyring changes hands.

('A4_SH01','A4','corridor_2f',NULL,'WS','eye','push_in',
 'в ноябре портфель юры находят на батарее под окном второго этажа.',
 'wide shot at eye level, a leather school satchel lying across a hot cast-iron radiator beneath a tall corridor window, its flap open and books slumped out of it, a small crowd of pupils standing back from it in a loose half circle, grey November light through the glass',
 'a swollen book cover settles a few millimetres further open on the hot radiator while the half circle of pupils holds its distance, hand-drawn animation cadence',
 'the swollen cover has fallen fully open and two more pupils have joined the half circle.',
 false, true),

('A4_SH02','A4','corridor_2f','YURA_TEEN','MCU','high','static',
 'учебники разбухли по краям, и обложки покоробило волной.',
 'medium close-up from a high angle, Yura crouched over the radiator with his weight on his toes and his back rounded, lifting a warped textbook off the iron by its corner, the cover buckled in a slow wave, the taped glasses slipping down his nose, hard window light',
 'the warped cover flexes open under its own weight as he lifts it and pages fan apart, the same single figure throughout the shot, hand-drawn animation cadence',
 'the book is fully lifted clear of the radiator and hangs open from his hand, the pages fanned.',
 false, false),

('A4_SH03','A4','corridor_2f',NULL,'ECU','eye','static',
 'никто не видел, кто это сделал, и все повторяют это слово в слово.',
 'extreme close-up at eye level, the buckled cover of a school textbook resting on cast-iron radiator ribs, the cardboard swollen and rippled along the edge, damp paper delaminating at one corner, heat shimmer above the iron',
 'a thin curl of heat rises off the iron and the delaminated corner lifts a hair''s width, only air and light in motion, hand-drawn animation cadence',
 'the delaminated corner has curled further up off the cover and the heat shimmer has thickened.',
 true, false),

('A4_SH04','A4','corridor_2f','SLAVA_TEEN','MS','eye','static',
 'ты видел, кто это сделал, ты стоял в трёх метрах и смотрел в окно.',
 'medium shot at eye level, Slava standing at the window three metres from the radiator with his weight even and his torso turned to the glass, his hands in his jacket pockets, the crowd around the satchel out of focus behind him, grey light on his face',
 'his shoulders rise and fall once with a breath while he keeps his back to the crowd, the same single figure throughout the shot, hand-drawn animation cadence',
 'his shoulders have settled and his head has turned a few degrees back toward the crowd behind him.',
 false, true),

('A4_SH05','A4','classroom','NINA','CU','eye','push_in',
 'нина петровна ставит класс и спрашивает сорок минут подряд.',
 'close-up at eye level, Nina standing with her shoulders level and her chin slightly down, looking along the rows without raising her voice, her small wristwatch worn face-inward at her wrist as she folds her hands, the black board out of focus behind her',
 'she turns her wrist a few degrees to read the watch and lets her hands fall back together, the same single figure throughout the shot, hand-drawn animation cadence',
 'her hands have come back together and her eyes have moved further along the rows.',
 false, false),

('A4_SH06','A4','classroom',NULL,'OTS','high','static',
 'двадцать четыре человека стоят и молчат, и это молчание совсем не про страх.',
 'over-the-shoulder shot from a high angle past the teacher, twenty-four pupils standing at their desks in three rows, hands at their sides, all of them looking straight ahead, coats over the chair backs, flat overhead light and grey windows',
 'one pupil in the second row shifts weight from foot to foot and stills again, the rest of the room holding its exact position, hand-drawn animation cadence',
 'the shifting pupil has settled and one more head in the back row has turned a few degrees to the side.',
 false, false),

('A4_SH07','A4','classroom','SLAVA_TEEN','WS','eye','track_lateral',
 'ты стоишь у второго ряда и молчишь вместе со всеми, ровно как все.',
 'wide shot at eye level along the standing rows, Slava at his desk in the second row with his weight even and his shoulders squared to the front, chin level, the pupils on either side of him in the same posture, tall grey windows down one wall',
 'the row breathes and settles by a centimetre without breaking its line, the same figures throughout the shot, hand-drawn animation cadence',
 'the row has settled lower and two pupils further along have let their shoulders drop.',
 false, false),

('A4_SH08','A4','classroom','SLAVA_TEEN','MCU','low','push_in',
 'и в эту минуту до тебя доходит, что они молчат, потому что смотрят на тебя.',
 'medium close-up from a low angle, Slava standing at his desk with his shoulders squared and his chin level, his eyes moving sideways along the row without his head turning, two heads in the row beyond angled toward him, cold window light across his cheek',
 'his eyes travel a few degrees further along the row and come back to the front, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes are back to the front and the corner of his mouth has drawn in slightly.',
 false, true),

('A4_SH09','A4','classroom','TOLIK_TEEN','CU','eye','static',
 'толик стоит через проход и первым делом проверяет, куда смотришь ты.',
 'close-up at eye level, Tolik standing in the next row with his chin up and his shoulders back, his eyes cut sideways across the aisle instead of forward, his polished buckle catching a line of window light at the frame edge',
 'his eyes cut further across the aisle and flick back to the front, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes are forward again and his chin has come down a little.',
 false, false),

('A4_SH10','A4','classroom',NULL,'EWS','high','pull_out',
 'сорок минут кончаются ничем, и всех отпускают по домам.',
 'extreme wide establishing shot from a high angle over the whole classroom, three rows of standing pupils breaking apart at the same moment, chairs scraping out, coats being pulled off the backs, the black board bare at the front, weak grey window light',
 'the standing rows break apart and pupils turn for their coats as chairs slide back from the desks, hand-drawn animation cadence',
 'half the pupils have their coats in their hands and the neat rows have dissolved into a loose crowd.',
 false, false),

('A4_SH11','A4','corridor_2f','TOLIK_TEEN','MS','eye','static',
 'после урока толик догоняет тебя у лестницы и показывает, что достал из портфеля.',
 'medium shot at eye level, Tolik standing close with his weight forward on one foot and his torso turned in toward Slava, one hand cupped at chest height and half open, the emptying corridor behind them, late grey light from the windows',
 'his cupped hand opens the rest of the way and tilts toward the other boy, the same figures throughout the shot, hand-drawn animation cadence',
 'his hand is fully open and tilted, the small object in his palm now plainly visible.',
 false, false),

('A4_SH12','A4','corridor_2f',NULL,'ECU','high','push_in',
 'в ладони у него тот самый брелок с васильком внутри.',
 'extreme close-up from a high angle, a small clear plexiglass block with a dried cornflower sealed inside it lying in an open palm, the plastic scuffed at one corner, the boy''s thumb resting against its edge, cold corridor light through the block',
 'the thumb slides a few millimetres off the block edge and the light through the sealed flower brightens, the rest of the frame holding still, hand-drawn animation cadence',
 'the thumb has come fully off the block and the sealed flower is lit clean through by the corridor light.',
 false, true),

('A4_SH13','A4','corridor_2f','SLAVA_TEEN','MCU','eye','static',
 'ты берёшь его двумя пальцами, и оргстекло оказывается тёплым от чужого кармана.',
 'medium close-up at eye level, Slava taking the small plexiglass block between two fingers with his weight even and his shoulders squared, his other hand still in his pocket, Tolik''s emptied palm at the frame edge, flat corridor light',
 'his two fingers close on the block and lift it clear of the other palm, the same figures throughout the shot, hand-drawn animation cadence',
 'the block is lifted clear and held at chest height between his fingers, the other palm empty below it.',
 false, false),

('A4_SH14','A4','corridor_2f','SLAVA_TEEN','CU','low','static',
 'ты кладёшь его во внутренний карман и ничего никому не говоришь.',
 'close-up from a low angle, Slava''s hand pushing the small plexiglass block down into the inside pocket of his school jacket, the copper bracelet sliding at his wrist, his chin level and his eyes on the corridor ahead rather than on his own hand, dim end-of-day light',
 'the hand pushes the block fully down into the pocket and withdraws, flattening the lapel as it comes, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand is out of the pocket and back at his side, the jacket lying flat with the block hidden inside.',
 false, true);

-- ── Materialise ─────────────────────────────────────────────────────────────
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "locationId",
  "narrationText", "shotType", "cameraAngle", "cameraMove",
  "isBroll", "isIconic", "renderMode", "endFramePrompt", "updatedAt"
)
SELECT
  gen_random_uuid(), p.id, sc.id, t.code,
  jsonb_build_object(
    'positive',       t.positive,
    'motionPrompt',   t.motion,
    'motionNegative', 'extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, extra limbs, deformed face, photoreal, photograph, 3D render, plastic skin, flicker, warping',
    'camera', jsonb_build_object('shotType', t.shot_type, 'angle', t.angle, 'movement', t.move)
  ),
  l.id, t.narration, t.shot_type, t.angle, t.move,
  t.broll, t.iconic, 'animated', t.endframe, now()
FROM _bully_shots t
JOIN projects p  ON p.slug = 'bully'
JOIN scenes   sc ON sc."projectId" = p.id AND sc."sceneKey" = t.act
LEFT JOIN locations l ON l."projectId" = p.id AND l.slug = t.loc
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

INSERT INTO "shot_participants" (id, "shotId", label, "characterId", "profileId")
SELECT gen_random_uuid(), sh.id, 'main', c.id, pr.id
FROM _bully_shots t
JOIN projects p ON p.slug = 'bully'
JOIN shots sh ON sh."projectId" = p.id AND sh."shotCode" = t.code
JOIN character_profiles pr ON pr."profileCode" = t.participant
JOIN characters c ON c.id = pr."characterId" AND c."projectId" = p.id
WHERE t.participant IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "shot_participants" sp WHERE sp."shotId" = sh.id);

DROP TABLE _bully_shots;

SELECT sc."sceneKey", count(*) AS shots,
       sum(array_length(regexp_split_to_array(trim(sh."narrationText"), '\s+'), 1)) AS words,
       count(*) FILTER (WHERE coalesce(sh."endFramePrompt",'') = '') AS missing_endframe
FROM shots sh
JOIN scenes sc ON sc.id = sh."sceneId"
JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully'
GROUP BY sc."sceneKey", sc."sortOrder" ORDER BY sc."sortOrder";
