-- ============================================================================
-- «Тот, кого они слушались» (bully) — кадры актов 5–6.
--
-- Same conventions as 03/04. Two deliberate choices in this pair:
--  · Act 5 is the worst thing in the film and contains no violence on screen.
--    The humiliation is entirely verbal and the camera stays on faces, hands
--    and a wall — the project is advertiser_safe and, more to the point, a
--    beating would let the viewer off: what indicts the protagonist is that
--    nothing happened that he could point at.
--  · Narration runs 16–18 words here rather than the ~12 of acts 1–4, which
--    were landing at ~5 s against the ~7 s mean and would have cut the film to
--    about twelve minutes.
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

-- ═══ АКТ 5 — Котельная ═════════════════════════════════════════════════════

('A5_SH01','A5','boiler_backyard',NULL,'EWS','high','push_in',
 'в декабре за котельной минус восемнадцать, и это единственное место во дворе, куда не выходит ни одно окно.',
 'extreme wide establishing shot from a high angle, the blind yard behind a school boiler house, a soot-streaked red brick wall along one side with two lagged pipes on brackets, trodden dirty snow scattered with black cinders, broken pallets stacked at the far end, flat grey afternoon light',
 'a thin drift of snow slides off the top of the lagged pipe and powders down the brick, the place otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'the snow has finished sliding off the pipe and a pale streak of it now lies along the brick below.',
 true, false),

('A5_SH02','A5','boiler_backyard','TOLIK_TEEN','MCU','low','static',
 'толик приходит первым, и трое приходят за ним, потому что он сказал им прийти.',
 'medium close-up from a low angle, Tolik standing in the trodden snow with his weight spread and his shoulders squared to the wall, breath steaming, his coat open over the polished belt buckle, three boys arriving behind him at the frame edge, cold flat light',
 'his breath plumes out and thins while he shifts his weight once onto the other foot, the same figures throughout the shot, hand-drawn animation cadence',
 'the breath plume has dispersed and the three boys behind him have closed up to his shoulder.',
 false, false),

('A5_SH03','A5','boiler_backyard','YURA_TEEN','CU','eye','static',
 'юру ставят к кирпичной стене, и он даже не спрашивает, зачем его сюда привели.',
 'close-up at eye level, Yura standing with his back against the sooty brick and his shoulders pressed flat to it, chin level, his breath steaming past the taped temple of his glasses, frost on the brick beside his head, cold flat light',
 'his breath clouds across the frame and clears, his shoulders staying pressed to the brick, the same single figure throughout the shot, hand-drawn animation cadence',
 'the breath cloud has cleared and his chin has come down a few degrees toward his chest.',
 false, true),

('A5_SH04','A5','boiler_backyard','SLAVA_TEEN','WS','eye','static',
 'ты приходишь последним и встаёшь так, чтобы быть внутри круга, но не в первом ряду.',
 'wide shot at eye level, five boys loosely spaced in the snowy yard between the brick wall and the pallets, Slava standing at the back of the group with his weight even and his hands in his pockets, Yura small against the wall beyond them, grey light',
 'the loose group closes half a step toward the wall while the figure at the back stays exactly where he is, the same figures throughout the shot, hand-drawn animation cadence',
 'the group has closed further toward the wall and the gap between them and the figure at the back has widened.',
 false, true),

('A5_SH05','A5','boiler_backyard','TOLIK_TEEN','OTS','eye','static',
 'толик говорит ему сказать вслух, как его теперь зовут, и ждёт, не повышая голоса.',
 'over-the-shoulder shot at eye level past Tolik, his shoulder and steaming breath filling one side of frame, Yura beyond him with his back to the brick and his chin level, the sooty wall and lagged pipes behind, cold flat light',
 'the near shoulder rises with a breath and settles while the far figure stays against the brick, the same figures throughout the shot, hand-drawn animation cadence',
 'the near shoulder has settled lower and the far figure has lifted his chin a little off his chest.',
 false, false),

('A5_SH06','A5','boiler_backyard','YURA_TEEN','ECU','eye','push_in',
 'он говорит это слово один раз, потом ещё раз, потом сбивается со счёта.',
 'extreme close-up at eye level, Yura''s mouth and jaw with breath steaming out on each word, a fleck of frost caught on the taped temple of his glasses at the frame edge, sooty brick out of focus behind, cold flat light',
 'his lips shape one short word and the breath plumes with it, then he draws in for the next, the same single figure throughout the shot, hand-drawn animation cadence',
 'his lips have closed after another word and a thicker plume of breath hangs in front of his mouth.',
 false, false),

('A5_SH07','A5','boiler_backyard','SLAVA_TEEN','MS','eye','static',
 'ты стоишь и считаешь про себя, и на двенадцатом разе толику это надоедает.',
 'medium shot at eye level, Slava standing apart at the back of the group with his weight even and his shoulders squared, hands deep in his pockets, his eyes on the wall past the others, snow trodden flat around his boots, grey light',
 'his breath plumes twice in the cold while nothing else about him moves, the same single figure throughout the shot, hand-drawn animation cadence',
 'the second breath plume has thinned away and his shoulders have dropped a fraction lower.',
 false, true),

('A5_SH08','A5','boiler_backyard','SLAVA_TEEN','CU','low','static',
 'ты не бьёшь, ты не держишь, ты не говоришь ни одного слова за все эти минуты.',
 'close-up from a low angle, Slava''s face with his chin level and his jaw set, breath steaming past his cheek, his eyes fixed on a point past the group, the grey sky and the top of the brick wall behind him',
 'his eyes stay fixed while a plume of breath crosses the frame and clears, the same single figure throughout the shot, hand-drawn animation cadence',
 'the breath has cleared from the frame and his eyes have moved a few degrees down toward the ground.',
 false, false),

('A5_SH09','A5','boiler_backyard',NULL,'WS','high','pull_out',
 'и всё это можно ровно до тех пор, пока ты стоишь здесь и не уходишь.',
 'wide shot from a high angle over the blind yard, five small figures spread between the brick wall and the stacked pallets with one of them backed against the brick, long trampled tracks in the dirty snow, cinders scattered black across it, flat grey light',
 'the small figures shift their spacing by a step while the trodden tracks and the pallets hold their exact position, hand-drawn animation cadence',
 'two of the small figures have drifted toward the yard entrance and the loose ring has opened on one side.',
 false, false),

('A5_SH10','A5','boiler_backyard','TOLIK_TEEN','MCU','eye','track_lateral',
 'потом им становится холодно, и они уходят все вместе, будто ничего и не было.',
 'medium close-up at eye level, Tolik walking away toward the yard entrance with his torso turned back over his shoulder and his weight forward, his coat pulled closed at last, two boys already ahead of him, brick wall sliding past behind',
 'he turns his head forward again and pulls the coat collar up as he walks, the same figures throughout the shot, hand-drawn animation cadence',
 'his collar is up and his head is fully forward, the two boys ahead of him further away toward the entrance.',
 false, false),

('A5_SH11','A5','boiler_backyard','YURA_TEEN','ECU','eye','static',
 'юра остаётся у стены ещё на минуту и поправляет очки обеими руками, очень аккуратно.',
 'extreme close-up at eye level, Yura''s two hands settling the thin metal glasses back onto his nose, the blue insulating tape on one temple close to camera, his fingers red with cold, sooty brick behind out of focus',
 'both hands press the frames straight and withdraw a few centimetres from his face, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hands have come fully away from his face and hang at the frame edge, the glasses sitting straight.',
 false, true),

('A5_SH12','A5','schoolyard','SLAVA_TEEN','MS','eye','pull_out',
 'домой ты идёшь один, и дорога через двор занимает у тебя вдвое дольше обычного.',
 'medium shot at eye level, Slava walking alone across the emptied school yard with his weight forward and his shoulders rolled up against the cold, hands in his pockets, bare poplars and the pale brick block behind him, blue late-afternoon light',
 'he takes two slow steps and his breath plumes out ahead of him and thins, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has walked two paces further into the empty yard and his breath plume has dispersed ahead of him.',
 false, false),

('A5_SH13','A5','schoolyard','SLAVA_TEEN','CU','high','push_in',
 'в кармане у тебя лежит оргстекло, и всю дорогу ты держишь на нём большой палец.',
 'close-up from a high angle, Slava''s hand inside his open coat pocket with his thumb pressed flat against the small plexiglass block, the copper bracelet at his wrist, dark wool of the pocket lining around it, low blue light',
 'his thumb slides once across the face of the block and presses down again, the rest of the frame holding still, hand-drawn animation cadence',
 'his thumb has come to rest at the far edge of the block and his fingers have closed around it.',
 false, true),

('A5_SH14','A5','schoolyard',NULL,'EWS','low','static',
 'фонарь во дворе загорается в четыре двадцать, и снег под ним делается жёлтым.',
 'extreme wide establishing shot from a low angle, the school yard at dusk with a single yard lamp just lit on its concrete post, a cone of yellow light on the trodden snow beneath it, bare poplar branches against a deep blue sky, the dark school block beyond',
 'the lamp steadies out of its first flicker and the yellow cone on the snow brightens, the place otherwise holding its exact position, hand-drawn animation cadence',
 'the lamp burns steady and the yellow cone on the snow has grown brighter and better defined.',
 true, true),

-- ═══ АКТ 6 — Возврат ═══════════════════════════════════════════════════════
-- Leitmotif recurrence 3 of 5. The one act where he almost turns it around,
-- and the turn costs him nothing at all — which is exactly why it does not hold.

('A6_SH01','A6','classroom','SLAVA_TEEN','MS','eye','static',
 'в феврале ты приходишь в школу за сорок минут до звонка, и в кабинете нет никого.',
 'medium shot at eye level, Slava standing alone between the desk rows in an empty classroom with his weight even and his torso turned to one desk, coat still on and satchel over his shoulder, chairs upturned on the desk tops around him, cold blue pre-dawn light through the tall windows',
 'he sets one upturned chair down onto the floor without a sound and straightens, the same single figure throughout the shot, hand-drawn animation cadence',
 'the chair stands on the floor and he has straightened fully, his hand still resting on its back.',
 false, false),

('A6_SH02','A6','classroom','SLAVA_TEEN','ECU','high','push_in',
 'ты кладёшь брелок в парту юры, под учебники, и закрываешь крышку без стука.',
 'extreme close-up from a high angle, Slava''s hand lowering the small plexiglass block into the open cavity of a school desk, textbooks stacked to one side, the desk lid raised above, the copper bracelet at his wrist, cold blue window light',
 'the block settles onto the wood and his fingers withdraw as the desk lid begins to come down, the rest of the frame holding still, hand-drawn animation cadence',
 'the desk lid is almost closed and only a narrow strip of the block is still visible in the gap.',
 false, true),

('A6_SH03','A6','classroom',NULL,'WS','eye','static',
 'через сорок минут кабинет наполняется, и никто не замечает, что ты пришёл раньше всех.',
 'wide shot at eye level, a classroom filling with pupils pulling chairs down and shaking off coats, satchels landing on desk lids, the black board bare at the front, grey winter light coming up in the tall windows',
 'two more pupils come through the door and swing their satchels onto the desks as chairs come down around the room, hand-drawn animation cadence',
 'the room is noticeably fuller, most chairs are down and three more satchels have landed on the desks.',
 false, false),

('A6_SH04','A6','classroom','YURA_TEEN','MCU','eye','push_in',
 'юра открывает парту на первом уроке и минуту не двигается совсем.',
 'medium close-up at eye level, Yura sitting with his spine straight against the chair back and the desk lid raised in one hand, looking down into the desk cavity, his other hand stopped halfway to it, grey window light across the taped glasses',
 'his raised hand stops entirely and the desk lid tips a few degrees lower in his grip, the same single figure throughout the shot, hand-drawn animation cadence',
 'the desk lid has tipped further down and his stopped hand has finally moved to the edge of the desk.',
 false, true),

('A6_SH05','A6','classroom','YURA_TEEN','CU','low','static',
 'он оборачивается и ищет глазами по рядам, и находит тебя за девять секунд.',
 'close-up from a low angle, Yura turned in his seat with his torso twisted over the chair back and his chin up, scanning along the rows behind him, the taped temple of his glasses catching the light, bent heads out of focus beyond',
 'his eyes travel along the row behind him and stop, his head ceasing to turn, the same single figure throughout the shot, hand-drawn animation cadence',
 'his head has stopped turning and his eyes have settled on one point behind him.',
 false, false),

('A6_SH06','A6','classroom','SLAVA_TEEN','OTS','eye','static',
 'ты отводишь взгляд первым, и это занимает у тебя примерно полсекунды.',
 'over-the-shoulder shot at eye level past Yura''s turned head, Slava at a desk two rows back with his shoulders squared and his eyes already dropping to the open textbook in front of him, other pupils bent to their work around him, flat window light',
 'his eyes drop the rest of the way to the textbook and his hand turns a page, the same figures throughout the shot, hand-drawn animation cadence',
 'the page has been turned flat and his eyes are down on it, his head lowered further than before.',
 false, true),

('A6_SH07','A6','corridor_2f',NULL,'EWS','high','track_lateral',
 'три дня всё почти нормально, и это самые обычные три дня за всю зиму.',
 'extreme wide establishing shot from a high angle down the second-floor corridor at break, pupils moving in both directions in loose streams, satchels on the radiators, weak February daylight through the tall windows onto the parquet',
 'the two streams of pupils flow past each other and thin out toward the stairs at both ends, the corridor otherwise holding its exact position, hand-drawn animation cadence',
 'both streams have thinned considerably and a clear stretch of parquet has opened in the middle of the corridor.',
 true, false),

('A6_SH08','A6','classroom','YURA_TEEN','CU','eye','static',
 'юра снова сидит прямо и отвечает у доски, не глядя себе под ноги.',
 'close-up at eye level, Yura standing at the board with his spine straight and his shoulders level, chin up, speaking toward the class rather than at the floor, chalk held loosely in one hand, the black slate behind him and window light on his cheek',
 'his chin holds level while his free hand opens and closes once at his side, the same single figure throughout the shot, hand-drawn animation cadence',
 'his free hand has settled open at his side and his chin is still level, his shoulders a little further back.',
 false, false),

('A6_SH09','A6','corridor_2f','TOLIK_TEEN','MS','eye','static',
 'на четвёртый день толик спрашивает при всех, не за гербария ли ты теперь.',
 'medium shot at eye level, Tolik standing in the middle of the corridor with his weight forward on one foot and his torso squared to Slava, calling the question across the gap, eleven pupils stopping around them, banded window light on the parquet',
 'he takes one small step forward as he finishes the question and the pupils nearest him stop walking, the same figures throughout the shot, hand-drawn animation cadence',
 'he has completed the step and stands still, and the pupils around him have stopped moving entirely.',
 false, false),

('A6_SH10','A6','corridor_2f',NULL,'WS','high','static',
 'одиннадцать лиц поворачиваются к тебе одновременно, и коридор делается очень тихим.',
 'wide shot from a high angle in the corridor, eleven pupils stopped mid-stride with their heads all turned the same way toward one point off centre, satchels hanging still from their hands, tall windows down one side, flat grey light on the parquet',
 'the turned heads hold their angle while one satchel swings to a stop against a knee, the corridor otherwise holding its exact position, hand-drawn animation cadence',
 'the swinging satchel has come to rest and one more pupil at the back has turned to face the same way.',
 false, true),

('A6_SH11','A6','corridor_2f','SLAVA_TEEN','MCU','low','push_in',
 'ты говоришь, что тебе на него плевать, и говоришь это громче, чем нужно.',
 'medium close-up from a low angle, Slava with his chin up and his shoulders squared, mouth open on a short flat sentence aimed past Tolik at the watching pupils, the copper bracelet at the wrist of the hand hanging at his side, cold corridor light',
 'his mouth closes on the last word and his chin comes down a few degrees, the same single figure throughout the shot, hand-drawn animation cadence',
 'his mouth is closed and his chin has come fully down, his eyes now on the floor between him and the others.',
 false, true),

('A6_SH12','A6','corridor_2f','YURA_TEEN','ECU','eye','static',
 'юра стоит в четырёх метрах и слышит это вместе со всеми остальными.',
 'extreme close-up at eye level, Yura''s face with his chin level and his eyes gone flat and still, the taped temple of his glasses close to camera, a blurred corridor of stopped figures far behind him, cold window light',
 'his eyelids lower once and open, his expression not otherwise changing, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes have opened again and his gaze has moved off to the side, past the camera.',
 false, false),

('A6_SH13','A6','corridor_2f','TOLIK_TEEN','MS','eye','static',
 'толик смеётся первым, и после этого смеяться уже можно всем остальным.',
 'medium shot at eye level, Tolik with his head going back and his weight rocking onto his heels, laughing, three boys beside him just starting to follow, the stopped pupils beyond them beginning to move again, banded corridor light',
 'his head goes back with the laugh and the boys beside him start to move with it, the same figures throughout the shot, hand-drawn animation cadence',
 'his head has come back down and the three boys beside him are now laughing too, the corridor moving again.',
 false, false),

('A6_SH14','A6','corridor_2f','SLAVA_TEEN','CU','eye','static',
 'ты тоже смеёшься, и на этом заканчиваются те три дня, когда всё было почти нормально.',
 'close-up at eye level, Slava laughing with his chin up and his shoulders shaking once, his eyes not moving with the laugh and staying fixed on the floor ahead, the corridor moving out of focus behind him, cold flat light',
 'his shoulders shake once with the laugh and settle, his eyes staying exactly where they are, the same single figure throughout the shot, hand-drawn animation cadence',
 'his shoulders have settled and the laugh has left his mouth, his eyes still fixed on the same point on the floor.',
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
       round(avg(array_length(regexp_split_to_array(trim(sh."narrationText"), '\s+'), 1)), 1) AS avg_words
FROM shots sh
JOIN scenes sc ON sc.id = sh."sceneId"
JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully'
GROUP BY sc."sceneKey", sc."sortOrder" ORDER BY sc."sortOrder";
