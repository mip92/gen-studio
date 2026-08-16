-- ============================================================================
-- «Тот, кого они слушались» (bully) — акты (scenes) + кадры актов 1–2.
--
-- Conventions enforced here:
--  · narrationText — f5 engine: ONE sentence per shot, lowercase first letter,
--    exactly one terminal period. 10–24 RU words, aiming ~16 (≈7 s).
--  · promptFields.positive — prose for the Qwen 7B VL encoder, ≤55 words,
--    ordered camera → who does what with hands/gaze → light. No negations, no
--    CLIP tag tails, no style block (the RealComic LoRA carries style), no
--    camera-MOVEMENT clause (it is derived from the cameraMove column).
--  · a STANCE clause (torso/weight/orientation) right after the character's
--    name — with qwenReferenceLatents ON an unnamed torso is filled from the
--    anchor and the whole film comes back in one pose.
--  · promptFields.motionPrompt — UNIQUE per shot: <what physically changes in
--    these 5 seconds> + positive lock. Never a re-description of the frame Wan
--    can already see, never a negation.
--  · endFramePrompt — NEW (flf2v). The SAME frame a few seconds later, as a
--    finished image, naming ONLY what changed. Never a new angle, never a new
--    place: the keep-clause pins camera, light, place and wardrobe, so anything
--    that would move the camera turns the clip into a morph between two shots.
--  · every shot renderMode='animated'; videoFlow left NULL so it inherits the
--    project's 'flf2v'.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- Hard dependency: this file writes shots."endFramePrompt", which only exists
-- after the 20260815120000_video_flow_flf2v migration. Fail with a readable
-- message instead of a bare "column does not exist" forty lines down.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'shots' AND column_name = 'endFramePrompt') THEN
    RAISE EXCEPTION 'shots."endFramePrompt" is missing — run `npx prisma migrate deploy` first';
  END IF;
END $$;

-- ── Акты ────────────────────────────────────────────────────────────────────
-- No cold-open act: act 1 IS the opening crisis and it does not close (§4.0c).
INSERT INTO scenes (id, "projectId", "sceneKey", title, "sortOrder")
SELECT gen_random_uuid(), p.id, v.k, v.t, v.o
FROM projects p, (VALUES
  ('A1', 'Акт 1 — Сверло',              1),
  ('A2', 'Акт 2 — Оргстекло',           2),
  ('A3', 'Акт 3 — Прозвище',            3),
  ('A4', 'Акт 4 — Портфель',            4),
  ('A5', 'Акт 5 — Котельная',           5),
  ('A6', 'Акт 6 — Возврат',             6),
  ('A7', 'Акт 7 — Оргстекло ломается',  7),
  ('A8', 'Акт 8 — Тридцать лет',        8),
  ('A9', 'Финал — Ящик',                9)
) AS v(k, t, o)
WHERE p.slug = 'bully'
ON CONFLICT ("projectId", "sceneKey") DO NOTHING;

-- ── Кадры ───────────────────────────────────────────────────────────────────
CREATE TEMP TABLE _bully_shots (
  code text, act text, loc text, participant text,
  shot_type text, angle text, move text,
  narration text, positive text, motion text, endframe text,
  broll boolean DEFAULT false, iconic boolean DEFAULT false
);

INSERT INTO _bully_shots (code, act, loc, participant, shot_type, angle, move, narration, positive, motion, endframe, broll, iconic) VALUES

-- ═══ АКТ 1 — Сверло ════════════════════════════════════════════════════════
-- Frame 1 is the crisis itself: no approach to the machine, no establishing
-- wide. The hook line lands on SH06–SH08. The act does NOT resolve.

('A1_SH01','A1','school_workshop',NULL,'ECU','eye','push_in',
 'сверлильный станок визжит на одной ноте, и в патрон уходит рукав халата, наматываясь виток за витком.',
 'extreme close-up at eye level, the sleeve of a grey work coat winding into the spinning chuck of a drill press, the cloth twisting tight against the steel jaws, curls of pine shavings jumping on the cast-iron table, hard light from a caged lamp above',
 'the sleeve winds one more full turn onto the chuck and the cuff pulls tight, shavings hopping across the cast-iron table, the rest of the frame holding still, hand-drawn animation cadence',
 'the sleeve is wound a full turn further, the cuff now flattened hard against the chuck jaws and the cloth stretched taut.',
 true, false),

('A1_SH02','A1','school_workshop','YURA_TEEN','MCU','low','static',
 'юру тянет к столу за левую руку, и он упирается коленом в станину, не издавая ни звука.',
 'medium close-up from a low angle, Yura braced sideways with his weight on his back foot and his knee jammed against the drill press column, his left arm dragged forward at the wrist, his glasses knocked askew, greenish workshop light across his jaw',
 'his knee slides half a centimetre down the painted column as the pull takes him, his shoulder dropping, breathing and small weight shifts only, the same single figure throughout the shot, hand-drawn animation cadence',
 'his knee has slipped lower down the column and his shoulder is pulled several centimetres closer to the machine, his jaw set harder.',
 false, false),

('A1_SH03','A1','school_workshop','SLAVA_TEEN','WS','eye','track_lateral',
 'ты за третьим верстаком, и между тобой и станком четыре метра крашеного пола.',
 'wide shot at eye level, Slava turning from his bench with his weight already on his front foot and his torso squared to the drill press, a half-finished stool clamped in the vice behind him, eight benches in two rows, sawdust hanging in the window light',
 'he pivots off the bench and takes the first stride, sawdust swirling in the shaft of window light he crosses, the same single figure throughout the shot, the rest of the frame holding still, hand-drawn animation cadence',
 'he is two strides further from his bench and closer to the drill press, his body turned fully toward it, the sawdust disturbed in his wake.',
 false, false),

('A1_SH04','A1','school_workshop','SLAVA_TEEN','ECU','high','push_in',
 'ты бьёшь ладонью по красному грибку, и визг обрывается на середине ноты.',
 'extreme close-up from a high angle, the flat of Slava''s palm striking the red mushroom stop button on the drill press panel, the copper wire bracelet sliding down his wrist with the blow, the panel paint chipped around the button, hard overhead lamp light',
 'his palm slams flat onto the red button and the bracelet jumps on his wrist and settles, the panel shivering once, the rest of the frame holding still, hand-drawn animation cadence',
 'the button is fully depressed under his palm and the copper bracelet has settled against the heel of his hand.',
 false, true),

('A1_SH05','A1','school_workshop','SLAVA_TEEN','MS','eye','static',
 'ты разжимаешь патрон ключом и снимаешь с него ткань в три оборота, не глядя на юру.',
 'medium shot at eye level, Slava leaning in over the drill press with his weight on both feet and his elbows out, turning the chuck key with two hands while he unwinds the grey cloth off the steel, Yura''s arm still held forward beside him, cold light from the tall window',
 'the chuck key turns a quarter turn and the wound cloth loosens and drops one loop free of the steel, the same two figures throughout the shot, hand-drawn animation cadence',
 'the cloth has unwound two more loops and hangs slack from the chuck, the key now lowered in his hand.',
 false, false),

('A1_SH06','A1','school_workshop','YURA_TEEN','CU','eye','static',
 'на предплечье у него багровая полоса от запястья к локтю, и он смотрит в пол.',
 'close-up at eye level, Yura standing straight-backed with his shoulders level and his chin down, a raw band mark running along his bare forearm from wrist to elbow, the torn sleeve pushed up above it, his taped glasses back on straight, flat light from the window',
 'his forearm turns a few degrees as he lowers it out of the light, his chin staying down, the same single figure throughout the shot, hand-drawn animation cadence',
 'his forearm is lowered to his side and out of the direct light, the torn sleeve fallen back down over the mark.',
 false, false),

('A1_SH07','A1','school_workshop','SLAVA_TEEN','MCU','low','pull_out',
 'сейчас я расскажу, как эти руки на тридцать лет станут единственным, что у тебя есть.',
 'medium close-up from a low angle, Slava standing over the stopped drill press with his weight even and his shoulders squared, both hands still open at chest height where the work left them, sawdust settling around him, the caged lamp burning above his head',
 'his open hands lower a few centimetres and his chest falls once as he lets the breath out, dust settling through the lamp beam, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hands have come down to his sides and his shoulders have dropped out of their braced set.',
 false, true),

('A1_SH08','A1','school_workshop','SLAVA_TEEN','CU','eye','push_in',
 'и почему ты до сих пор не можешь этими руками починить дома одну балконную дверь.',
 'close-up at eye level, Slava''s two open hands held in front of him, sawdust caught in the creases of the palms, the copper wire bracelet dark against the wrist, a fresh scrape across one knuckle, warm lamp light raking across the skin',
 'the fingers of both hands curl slowly closed until the palms are hidden, sawdust shifting in the creases, the rest of the frame holding still, hand-drawn animation cadence',
 'both hands are closed into loose fists with the palms hidden and the scraped knuckle turned upward.',
 false, false),

('A1_SH09','A1','school_workshop','KUZMICH','MS','eye','static',
 'кузьмич доходит до станка через полминуты после того, как всё уже кончилось.',
 'medium shot at eye level, Kuzmich crossing the shop floor half-turned from the doorway with his weight on his back foot, the scorched right sleeve of his blue satin coat swinging, boys at the benches turning their heads toward him, dusty window light behind',
 'he takes one heavy stride into the room and the scorched sleeve swings and settles against his side, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has arrived beside the drill press and stopped, the scorched sleeve hanging still at his side.',
 false, false),

('A1_SH10','A1','school_workshop','SLAVA_TEEN','OTS','eye','static',
 'он кладёт тебе руку на плечо и говорит при всех, что руки у тебя взрослые.',
 'over-the-shoulder shot at eye level past Kuzmich, Slava standing three-quarters to camera with his weight settled and his chin level, Kuzmich''s broad hand laid flat on his shoulder, the drill press dark behind them, eleven boys watching from the benches, side light from the window',
 'the broad hand presses down once on the shoulder and stays, the boy''s chin lifting a few degrees, the same two figures throughout the shot, hand-drawn animation cadence',
 'the hand still rests on the shoulder and the boy''s chin has lifted, his face turned a little toward the man.',
 false, false),

('A1_SH11','A1','school_workshop',NULL,'WS','high','static',
 'одиннадцать пацанов слышат это, и каждый из них запоминает, кого именно похвалили.',
 'wide shot from a high angle over the shop, eleven boys at their benches with their heads all turned the same way toward the drill press, tools left down mid-task, shavings across the benches, dust hanging in the beams of the tall windows',
 'a dozen heads hold their turn while shavings settle off a bench edge and dust drifts across the window beams, the room otherwise holding its exact position, hand-drawn animation cadence',
 'two of the boys have turned back to their benches while the rest still watch, and a small pile of shavings has slid off the bench edge.',
 false, false),

('A1_SH12','A1','school_workshop','YURA_TEEN','MS','eye','pull_out',
 'юра собирает портфель до звонка и выходит, прижимая рукав к боку.',
 'medium shot at eye level, Yura walking out along the row of benches with his torso turned away from the room and his weight forward, the torn sleeve pressed flat against his side with the other hand, his bag hanging from one shoulder, the door frame ahead in cold corridor light',
 'he takes two steps toward the door and the loose torn cuff swings against his hip, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has reached the doorway and is half through it, the torn cuff still pressed against his side.',
 false, false),

('A1_SH13','A1','corridor_2f','TOLIK_TEEN','MCU','eye','static',
 'на перемене толик уже показывает, как юра молчал, и трое смеются с первого раза.',
 'medium close-up at eye level, Tolik standing hunched forward with his weight on one hip against the corridor radiator, miming a lowered head and a held arm for three boys, his mirror-polished belt buckle catching the window light, tall corridor windows behind them',
 'he drops his head and hunches his shoulders in the mimicry and comes back up, the same figures throughout the shot, the rest of the frame holding still, hand-drawn animation cadence',
 'he has come back up out of the mimicry with his head raised and his shoulders open, the three boys leaning in closer.',
 false, false),

('A1_SH14','A1','corridor_2f','SLAVA_TEEN','MS','eye','static',
 'ты стоишь в двух шагах, и всё, что ты делаешь в эту минуту, это не мешаешь.',
 'medium shot at eye level, Slava standing apart with his weight even and his shoulders squared toward the group, hands loose at his sides, watching Tolik perform for the three boys, a tall corridor window to his left throwing flat afternoon light across him',
 'he shifts his weight once from one foot to the other and stays where he is, the same figures throughout the shot, hand-drawn animation cadence',
 'he has settled onto the other foot with his head turned a little further toward the group, still standing apart.',
 false, true),

-- ═══ АКТ 2 — Оргстекло ═════════════════════════════════════════════════════
-- The keyring — the film''s leitmotif — is made and shown here for the first
-- time. First recurrence of five.

('A2_SH01','A2','yura_room','YURA_TEEN','CU','high','push_in',
 'через неделю юра четвёртый вечер подряд сидит над куском оргстекла у себя за столом.',
 'close-up from a high angle, Yura hunched forward over his desk with his forearms flat on the wood, holding a small rectangle of clear plexiglass under a folding lamp, a shoebox of offcuts and pressed flowers beside his elbow, warm lamp light through the plastic',
 'he turns the plexiglass a few degrees under the lamp and the light moves through it across his knuckles, the same single figure throughout the shot, hand-drawn animation cadence',
 'the plexiglass has been turned to the other face and the band of lamp light now falls across the back of his hand instead.',
 false, false),

('A2_SH02','A2','yura_room',NULL,'ECU','eye','static',
 'внутри залит засушенный василёк, синий, с обломанным краем лепестка.',
 'extreme close-up at eye level, a dried cornflower sealed inside a block of clear plexiglass forty by twenty-five millimetres, one petal edge broken short, tiny bubbles caught along the flower stem, a folding lamp burning behind it',
 'a single bubble drifts a hair''s width along the sealed stem as the lamp warms the block, the object otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'the bubble has travelled a little further along the sealed stem and the lamp glare has crept across the block face.',
 true, true),

('A2_SH03','A2','school_workshop','YURA_TEEN','MS','eye','static',
 'он приносит его в мастерскую и кладёт кузьмичу на верстак, ничего не объясняя.',
 'medium shot at eye level, Yura standing square to the bench with his weight even and his shoulders low, setting the small plexiglass block down on the scarred wood with two fingers, Kuzmich''s tools laid out beyond it, dusty window light across the bench',
 'his two fingers release the block onto the wood and withdraw a few centimetres, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand has withdrawn to the edge of the bench and the plexiglass block sits alone on the wood.',
 false, false),

('A2_SH04','A2','school_workshop','KUZMICH','CU','low','push_in',
 'кузьмич поднимает его к окну и минуту молчит, поворачивая на свет.',
 'close-up from a low angle, Kuzmich holding the plexiglass block up toward the tall window with his head tilted back and his shoulders squared, his thumb and forefinger at its edges, the scorched blue sleeve filling the lower frame, cold window light through the flower',
 'he rotates the block a quarter turn between his fingers and the light through the flower swings across his face, the same single figure throughout the shot, hand-drawn animation cadence',
 'the block has been rotated further and the patch of coloured light has moved from his cheek onto his forehead.',
 false, false),

('A2_SH05','A2','school_workshop','KUZMICH','WS','eye','track_lateral',
 'потом он показывает его всему классу и говорит, что сам так не умеет.',
 'wide shot at eye level, Kuzmich walking the aisle between the two rows of benches with his torso turned to the boys and the small block held up in his raised hand, eleven boys at their vices turning to follow it, sawdust in the window beams',
 'he carries the raised block two steps down the aisle and the heads at the benches turn to follow it, the same figures throughout the shot, hand-drawn animation cadence',
 'he has moved two benches further along the aisle and the heads that followed him have turned further round.',
 false, false),

('A2_SH06','A2','school_workshop','SLAVA_TEEN','MCU','eye','static',
 'ты стоишь у своего верстака с недоделанной табуреткой, и тебя сегодня хвалят не первым.',
 'medium close-up at eye level, Slava standing at his bench three-quarters away from camera with his weight on one hip, one hand flat on an unfinished stool clamped in the vice, watching the aisle over his shoulder, flat side light from the window',
 'his hand slides a few centimetres along the stool seat and stops, his head staying turned toward the aisle, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand has come off the stool seat and hangs at his side, his head still turned toward the aisle.',
 false, false),

('A2_SH07','A2','school_workshop','TOLIK_TEEN','MS','eye','static',
 'толик говорит вслух то, что ты подумал, и добавляет, что цветочки заливают девочки.',
 'medium shot at eye level, Tolik leaning back against his bench with his weight on his hands behind him and his chin up, calling across the shop toward the aisle, his mirror-polished buckle catching the light, two boys beside him already turning to look',
 'he pushes off the bench edge and comes upright as he finishes speaking, the same figures throughout the shot, hand-drawn animation cadence',
 'he has come fully upright off the bench with his hands at his sides and his chin still raised.',
 false, false),

('A2_SH08','A2','school_workshop',NULL,'WS','high','static',
 'смеются восемь человек, и смех держится ровно столько, сколько нужно, чтобы все услышали.',
 'wide shot from a high angle over the shop floor, eight boys at their benches laughing with their heads back, three others still bent to their work, tools abandoned mid-cut on the wood, sawdust rising through the window beams',
 'the raised heads drop back toward their benches one after another while sawdust drifts down through the window beams, the room otherwise holding its exact position, hand-drawn animation cadence',
 'most of the raised heads have come back down to the benches and only two boys are still turned toward the aisle.',
 false, false),

('A2_SH09','A2','school_workshop','SLAVA_TEEN','CU','eye','push_in',
 'ты не смеёшься, ты киваешь один раз, и этого достаточно.',
 'close-up at eye level, Slava seen three-quarters on with his shoulders level and his chin lowering once in a small nod, his eyes fixed across the room, the copper bracelet visible at the wrist of the hand resting on the bench, warm side light on his cheek',
 'his chin dips once in a short nod and comes back level, his eyes not moving, the same single figure throughout the shot, hand-drawn animation cadence',
 'his chin has come back level after the nod and his mouth has settled into a flat line.',
 false, true),

('A2_SH10','A2','school_workshop','YURA_TEEN','MCU','high','static',
 'юра забирает брелок с верстака и убирает во внутренний карман, не поднимая головы.',
 'medium close-up from a high angle, Yura standing hunched at the end bench with his shoulders rolled forward, sliding the small plexiglass block into the inside pocket of his knitted vest, his taped glasses low on his nose, cold overhead light',
 'the block slides fully into the pocket and his hand comes out and flattens the vest over it, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand has come away from the vest and hangs at his side, the pocket now flat with the block hidden inside.',
 false, false),

('A2_SH11','A2','corridor_2f','SLAVA_TEEN','MS','eye','track_lateral',
 'до конца перемены четверо переспрашивают тебя, правда ли это смешно.',
 'medium shot at eye level, Slava walking down the corridor with his weight forward and his shoulders squared, three boys keeping pace half a step behind him and turning their faces toward his, tall windows throwing bands of light across the parquet',
 'the boys behind him close half a step and their heads turn further toward his face as they walk, the same figures throughout the shot, hand-drawn animation cadence',
 'the three boys have closed to his shoulder and all three faces are now turned fully toward him.',
 false, false),

('A2_SH12','A2','corridor_2f','SLAVA_TEEN','CU','low','static',
 'ты отвечаешь одним словом, и это слово ничего не значит, но его хватает.',
 'close-up from a low angle, Slava with his chin level and his shoulders squared, mouth just closing on a single short word, his eyes going past the boy who asked, flat window light across half his face',
 'his mouth closes on the word and the corner of it settles, his eyes not returning to the boy, the same single figure throughout the shot, hand-drawn animation cadence',
 'his mouth has settled fully closed and his eyes have moved further off, past the boy entirely.',
 false, false),

('A2_SH13','A2','schoolyard',NULL,'EWS','high','pull_out',
 'к вечеру это уже не шутка толика, а общее знание всего класса.',
 'extreme wide establishing shot from a high angle, the school yard at dusk with the pale brick block behind, welded pipe bars and bare poplars, the last groups of pupils crossing the cracked asphalt in twos and threes, long blue shadows',
 'the small figures cross the asphalt and thin out toward the gate while the poplar branches move once in the wind, the place otherwise holding its exact position, hand-drawn animation cadence',
 'most of the small figures have reached the gate and the yard is nearly empty, the shadows lying longer across the asphalt.',
 true, false),

('A2_SH14','A2','slava_kitchen','SLAVA_TEEN','MCU','eye','push_in',
 'дома ты понимаешь простую вещь, что тебе не надо ничего делать самому.',
 'medium close-up at eye level, Slava sitting at the kitchen table with his forearms on the checked oilcloth and his torso squared to it, a plate pushed aside untouched, the courtyard window dark behind him, a single lamp above the table',
 'his fingers spread once flat on the oilcloth and stop, the plate not moving, the same single figure throughout the shot, hand-drawn animation cadence',
 'his fingers have curled back in from flat and his forearms have slid a little further onto the oilcloth.',
 false, false);

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
    -- Generic guard: motionNegative only ever fires on mode='cfg' (at cfg=1.0
    -- the uncond branch is not evaluated at all), so it stays a template while
    -- the POSITIVE motion prompt is what carries per-shot direction.
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

-- One participant per shot (no dual-character strategy on this path); the
-- second person in frame is carried by the shot text alone.
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

-- ── Report ──────────────────────────────────────────────────────────────────
SELECT sc."sceneKey", count(*) AS shots,
       sum(array_length(regexp_split_to_array(trim(sh."narrationText"), '\s+'), 1)) AS words,
       count(*) FILTER (WHERE coalesce(sh."endFramePrompt",'') = '') AS missing_endframe
FROM shots sh
JOIN scenes sc ON sc.id = sh."sceneId"
JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully'
GROUP BY sc."sceneKey", sc."sortOrder" ORDER BY sc."sortOrder";
