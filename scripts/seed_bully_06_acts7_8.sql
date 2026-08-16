-- ============================================================================
-- «Тот, кого они слушались» (bully) — кадры актов 7–8.
--
-- Act 7 is the point of no return and act 8 is the thirty-year jump.
--
-- Runtime arithmetic behind the longer lines here: acts 1–6 came in at ~12.8 RU
-- words per shot ≈ 5.5 s, which projects to a ~12-minute film against a 15-minute
-- brief. Acts 7–9 run 17–21 words (~7–9 s) and carry more shots, which brings the
-- total to ~2100 words ≈ 15 min. The 10–24-word window still holds on every line.
--
-- Continuity check for act 7: the keyring is in YURA's desk, not Slava's pocket —
-- Slava put it back in A6_SH02. Tolik takes it from Yura here.
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

-- ═══ АКТ 7 — Оргстекло ломается ════════════════════════════════════════════
-- Leitmotif recurrence 4 of 5.

('A7_SH01','A7','corridor_2f',NULL,'WS','eye','track_lateral',
 'большая перемена того же дня, коридор второго этажа, и до конца этой перемены остаётся девять минут.',
 'wide shot at eye level down the second-floor corridor at the long break, pupils in loose knots along the tall windows, satchels heaped on the radiators, a stand of pinned notices on the panelled wall, flat February daylight banding the parquet',
 'the knots of pupils shift and re-form along the windows as two figures cross the corridor between them, hand-drawn animation cadence',
 'the two crossing figures have reached the far side and the knots along the windows have closed up behind them.',
 true, false),

('A7_SH02','A7','corridor_2f','YURA_TEEN','MCU','eye','static',
 'юра стоит у подоконника и показывает брелок девочке из параллельного класса, впервые за всю зиму.',
 'medium close-up at eye level, Yura standing square to the window sill with his shoulders level and his chin up, holding the small plexiglass block out flat on his palm toward a girl at the frame edge, cold window light coming through the sealed flower',
 'his palm tilts a few degrees so the light moves through the sealed flower, the same figures throughout the shot, hand-drawn animation cadence',
 'his palm has tilted further and the band of light through the flower now falls across his wrist.',
 false, true),

('A7_SH03','A7','corridor_2f','TOLIK_TEEN','CU','low','push_in',
 'толик забирает его на ходу, даже не остановившись, и это занимает у него меньше секунды.',
 'close-up from a low angle, Tolik''s hand closing over a small plexiglass block in mid-stride, his torso already turning away with the weight going onto his front foot, his polished buckle catching light at the frame edge, corridor windows blurred behind',
 'his fingers close fully over the block and the hand pulls back and away, the same single figure throughout the shot, hand-drawn animation cadence',
 'the closed hand has been pulled fully back to his chest and the block is hidden inside his fist.',
 false, false),

('A7_SH04','A7','corridor_2f','YURA_TEEN','MS','eye','static',
 'юра делает за ним два шага и останавливается, потому что дальше идти уже некуда.',
 'medium shot at eye level, Yura stopped mid-stride with his weight forward on one foot and one hand half raised, looking after the figure walking away from him, pupils turning to watch from the window bay, banded corridor light',
 'his raised hand lowers a few centimetres and his forward foot settles flat, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hand has come fully down to his side and both his feet are flat, his shoulders dropped.',
 false, false),

('A7_SH05','A7','corridor_2f','TOLIK_TEEN','OTS','high','static',
 'толик держит его двумя пальцами над батареей и смотрит не на юру, а на тебя.',
 'over-the-shoulder shot from a high angle past Tolik, the small plexiglass block pinched between two fingers above the ribs of a cast-iron radiator, his face turned away from the block toward someone off frame, the corridor beyond in flat light',
 'the pinched block turns a few degrees between his fingers while his face stays turned away from it, the same figures throughout the shot, hand-drawn animation cadence',
 'the block has turned further between his fingers and his face is angled a little more toward the person off frame.',
 false, true),

('A7_SH06','A7','corridor_2f','SLAVA_TEEN','CU','eye','static',
 'у тебя есть одно слово, и оно у тебя действительно есть, и ты его не произносишь.',
 'close-up at eye level, Slava standing nearest of anyone with his shoulders squared and his chin level, his lips parted a few millimetres and not moving, his eyes on the radiator rather than on either boy, cold window light across half his face',
 'his parted lips close slowly without a word and his jaw sets, the same single figure throughout the shot, hand-drawn animation cadence',
 'his lips are fully closed and his jaw is set hard, his eyes still on the radiator.',
 false, true),

('A7_SH07','A7','corridor_2f','SLAVA_TEEN','MCU','low','static',
 'накануне ты сказал, что тебе плевать, и взять это назад стоило бы дороже.',
 'medium close-up from a low angle, Slava standing very still among moving pupils, his weight even and his hands loose at his sides, his head not turning toward the radiator, blurred figures crossing behind him, flat corridor light',
 'pupils cross the frame behind him while he holds his stance without a movement, the same single figure throughout the shot, hand-drawn animation cadence',
 'the pupils have crossed out of frame behind him and he is standing in exactly the same stance, now alone in the shot.',
 false, false),

('A7_SH08','A7','corridor_2f',NULL,'ECU','eye','push_in',
 'оргстекло лопается по диагонали от угла до угла с очень коротким сухим звуком.',
 'extreme close-up at eye level, a small clear plexiglass block struck against a cast-iron radiator rib, a white crack running corner to corner through the plastic, the dried cornflower inside broken across the stem, hard window light through the fracture',
 'the crack widens a fraction and a chip of plastic separates along its line, the rest of the frame holding still, hand-drawn animation cadence',
 'the crack has opened into a clear split and the two halves of the block have parted a few millimetres.',
 false, true),

('A7_SH09','A7','corridor_2f',NULL,'WS','high','static',
 'двадцать шесть человек в коридоре смотрят на это, и ни один из них не двигается.',
 'wide shot from a high angle over the corridor, twenty-six pupils stopped in place with their heads turned toward one point by the radiator, satchels frozen in their hands, tall windows down one side, flat grey light on the parquet',
 'the stopped figures hold their turn while a single satchel strap swings down and stills, the corridor otherwise holding its exact position, hand-drawn animation cadence',
 'the swinging strap has come to rest and three pupils at the back have turned away toward the stairs.',
 false, false),

('A7_SH10','A7','corridor_2f','YURA_TEEN','MS','high','push_in',
 'юра опускается на колени и собирает с пола сухие лепестки, по одному, не поднимая головы.',
 'medium shot from a high angle, Yura down on both knees on the parquet with his back rounded and his weight forward on his fingertips, picking small dried petals off the floor one at a time, the broken plastic beside his knee, cold light from the window above',
 'his fingertips pick one petal off the parquet and transfer it to his cupped palm, the same single figure throughout the shot, hand-drawn animation cadence',
 'the petal is in his cupped palm and his fingertips have moved to the next one on the floor.',
 false, true),

('A7_SH11','A7','corridor_2f','SLAVA_TEEN','CU','low','static',
 'ты стоишь ближе всех, и от твоего ботинка до его руки примерно сорок сантиметров.',
 'close-up from a low angle, Slava''s boot on the parquet in the foreground with a kneeling boy''s hand reaching for a petal just beyond it, the copper bracelet visible at the wrist above, cold window light across the floorboards between them',
 'the reaching hand closes on a petal and withdraws while the boot does not move at all, the same figures throughout the shot, hand-drawn animation cadence',
 'the hand has withdrawn out of the near frame with the petal and the boot is standing in exactly the same place.',
 false, true),

('A7_SH12','A7','corridor_2f','TOLIK_TEEN','MCU','eye','track_lateral',
 'толик уходит к лестнице, и трое идут за ним, и никто из них не оборачивается.',
 'medium close-up at eye level, Tolik walking away toward the stairs with his torso forward and his hands already in his pockets, three boys falling in behind him, the corridor and windows sliding past, flat grey daylight',
 'he pushes his hands deeper into his pockets as he walks and the three boys close up behind him, the same figures throughout the shot, hand-drawn animation cadence',
 'he has reached the head of the stairs and the three boys are directly at his back, none of them turned round.',
 false, false),

('A7_SH13','A7','corridor_2f',NULL,'ECU','eye','static',
 'на полу под батареей остаётся половина брелка с ровным сколом по всей длине.',
 'extreme close-up at eye level, one half of a cracked plexiglass block lying on the parquet under a cast-iron radiator, the fracture face clean and bright along its whole length, a single dried petal beside it, dust and grit in the floor seam',
 'a draught from the corridor slides the loose petal a centimetre across the boards while the plastic stays where it fell, only air and light in motion, hand-drawn animation cadence',
 'the petal has slid further along the floor seam and come to rest against the edge of the plastic.',
 true, true),

('A7_SH14','A7','corridor_2f','SLAVA_TEEN','MS','eye','pull_out',
 'звонок звенит через две минуты, и ты уходишь на урок вместе со всеми остальными.',
 'medium shot at eye level, Slava turning away down the emptying corridor with his weight going onto his front foot and his shoulders squared, the radiator and the kneeling figure behind him going out of the frame, banded window light on the parquet',
 'he completes the turn and takes the first two steps away, the kneeling figure staying where it is behind him, the same figures throughout the shot, hand-drawn animation cadence',
 'he has walked several paces down the corridor and the kneeling figure behind him is much smaller in the frame.',
 false, false),

('A7_SH15','A7','classroom','NINA','MS','eye','static',
 'восемнадцатого марта нина петровна говорит классу, что соколов переводится в другую школу.',
 'medium shot at eye level, Nina standing beside the empty front desk of the middle row with her shoulders level and her hands folded, addressing the class in an even voice, her small wristwatch worn face-inward, spring light coming through the tall windows',
 'her folded hands come apart and settle again at her waist as she finishes the sentence, the same single figure throughout the shot, hand-drawn animation cadence',
 'her hands have settled back together and her eyes have moved from the class to the empty desk beside her.',
 false, false),

('A7_SH16','A7','classroom',NULL,'ECU','high','push_in',
 'парта во втором ряду стоит пустая до конца года, и на ней никто не пишет.',
 'extreme close-up from a high angle, the scarred lid of an empty school desk in the second row, old ink marks and compass scratches in the wood, the chair pushed neatly under it, no satchel and no books, spring light falling across the grain',
 'a bar of window light creeps a few millimetres across the desk grain as the sun moves, the object otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'the bar of light has crept further across the desk lid and now touches the edge of the old ink marks.',
 true, true),

-- ═══ АКТ 8 — Тридцать лет ══════════════════════════════════════════════════

('A8_SH01','A8','garage_workbench','SLAVA_OLD','MCU','eye','push_in',
 'тебе сорок четыре, ты слесарь в гаражном кооперативе, и руки у тебя ровно те же самые.',
 'medium close-up at eye level, Slava at forty-four standing at a steel workbench with his weight on one hip and his forearms working over a stripped door lock, tools laid in rows on the pegboard behind, a clamp lamp throwing hard light down onto his hands',
 'his fingers seat a small spring into the lock body and press it home, the same single figure throughout the shot, hand-drawn animation cadence',
 'the spring is seated and his fingers have moved to the next part, the lock body turned a quarter round.',
 false, false),

('A8_SH02','A8','garage_workbench',NULL,'ECU','high','static',
 'работа честная, руки помнят, и за тридцать лет ты не испортил ни одного заказа.',
 'extreme close-up from a high angle, a stripped door lock opened out on a steel bench with its parts laid in order on a clean rag, a darkened copper wire bracelet at the wrist of the hand resting beside them, hard clamp-lamp light',
 'one hand rolls a small brass pin a few millimetres along the rag and sets it straight in the row, the rest of the frame holding still, hand-drawn animation cadence',
 'the brass pin lies straight in its place in the row and the hand has withdrawn to the bench edge.',
 false, true),

('A8_SH03','A8','slava_kitchen','SLAVA_OLD','WS','eye','static',
 'жена ушла шесть лет назад, сын звонит два раза в год, и оба раза по делу.',
 'wide shot at eye level, Slava alone at the kitchen table of a small flat with his weight settled and his forearms on the checked oilcloth, one plate and one cup in front of him, the second chair pushed in on the far side, evening lamp light',
 'he turns the cup a quarter round on the oilcloth and lets go of it, the same single figure throughout the shot, hand-drawn animation cadence',
 'the cup has been turned further and stands with its handle away from him, his hand back flat on the oilcloth.',
 false, false),

('A8_SH04','A8','slava_kitchen',NULL,'CU','eye','push_in',
 'ты умеешь всё, кроме одного, и это одно стоит у тебя в квартире третий год.',
 'close-up at eye level, a balcony door standing a few centimetres ajar with its handle down and the frame visibly out of true, a folded strip of cardboard wedged under the bottom rail, a draught moving the curtain edge, cold evening light through the glass',
 'the curtain edge lifts and falls in the draught from the gap while the door stays exactly where it is, only air and light in motion, hand-drawn animation cadence',
 'the curtain edge has settled against the glass and the gap under the door shows a little wider.',
 true, true),

('A8_SH05','A8','slava_kitchen','SLAVA_OLD','MS','eye','static',
 'ты проходишь мимо неё каждый день и каждый день не берёшь с собой инструмент.',
 'medium shot at eye level, Slava crossing the room past the ajar balcony door with his torso turned away from it and his weight already carrying him past, a tool bag on the floor by the wall behind him, low evening lamp light',
 'he passes the door without turning his head and his shoulder clears the frame edge, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has passed the door entirely and only his trailing hand is still in frame beside it.',
 false, true),

('A8_SH06','A8','garage_workbench','SLAVA_OLD','ECU','high','static',
 'в феврале приходит сообщение про встречу выпускников, тридцать лет, актовый зал, суббота.',
 'extreme close-up from a high angle, a phone lying face up on the steel workbench among metal filings, a short message open on the screen, an oily thumbprint across the glass, the clamp lamp reflected in it',
 'the screen dims one step toward sleep while the filings around it hold their exact position, only light in motion, hand-drawn animation cadence',
 'the screen has dimmed further and the reflection of the lamp on it has faded almost out.',
 true, false),

('A8_SH07','A8','school_entrance_2020','SLAVA_OLD','WS','low','static',
 'ты приезжаешь в субботу и стоишь у входа минут пять, прежде чем зайти внутрь.',
 'wide shot from a low angle, Slava standing on the paved approach to the same school block thirty years later with his weight even and his shoulders squared, new plastic windows in the old brick openings, a metal door with a card reader, young lime trees, grey afternoon',
 'he shifts his weight once and stays where he is while a car passes behind him out of frame, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has settled onto the other foot and turned a few degrees toward the door, still standing in the same place.',
 false, true),

-- No participant: Tolik at forty-four has no profile of his own. He gets four
-- shots in the whole third act and never a close-up, so an anchor render plus an
-- approval for him would buy nothing — the shot text carries him instead.
('A8_SH08','A8','reunion_hall',NULL,'MS','eye','track_lateral',
 'толик приезжает на машине, громкий, с фотографиями внуков в телефоне и с той же походкой.',
 'medium shot at eye level, a heavy red-haired man in his forties working the room with his torso turned to the tables and his weight rolling forward, a phone held out to show photographs, folding seats pushed back to the walls, warm evening light through half-lowered blinds',
 'he turns the phone toward another guest and his free hand lands on a shoulder beside him, the same figures throughout the shot, hand-drawn animation cadence',
 'his hand has come off the shoulder and the phone is turned to a different guest further along the table.',
 false, false),

('A8_SH09','A8','reunion_hall','RITA_OLD','MCU','eye','static',
 'ритка белова стала учительницей младших классов, и косы у неё те же, а заколки уже нет.',
 'medium close-up at eye level, Rita at forty-four standing beside the long paper-covered table with her shoulders level and her weight even, a plastic cup held loosely at her waist, her black hair greying at the temples in a short bob, warm hall light',
 'she turns the cup a quarter round in her fingers and lifts it a few centimetres, the same single figure throughout the shot, hand-drawn animation cadence',
 'the cup is raised to her chest and her fingers have settled around it, her shoulders a little more relaxed.',
 false, false),

('A8_SH10','A8','reunion_hall','SLAVA_OLD','OTS','eye','static',
 'ты подходишь к ней в конце вечера и спрашиваешь про юру, стараясь сделать это между делом.',
 'over-the-shoulder shot at eye level past Rita, Slava beyond her with his weight even and his shoulders squared, a plastic cup untouched in his hand, asking a short question with his eyes level on hers, the emptying hall and stacked seats behind him',
 'his cup lowers a few centimetres as he finishes the question and his shoulders stay square, the same figures throughout the shot, hand-drawn animation cadence',
 'his cup has come down to his side and his shoulders have dropped, his eyes still level on hers.',
 false, true),

('A8_SH11','A8','reunion_hall','RITA_OLD','CU','eye','push_in',
 'она отвечает спокойно, что он умер в тридцать один год, сердце, и что это было давно.',
 'close-up at eye level, Rita speaking with her chin level and her shoulders still, her eyes on his without hardening, the plastic cup held at her chest, the warm blurred hall behind her',
 'her chin lowers a few degrees as she finishes and her eyes stay on his, the same single figure throughout the shot, hand-drawn animation cadence',
 'her chin has come fully down and her eyes have moved off his face to the cup in her hand.',
 false, true),

('A8_SH12','A8','reunion_hall','SLAVA_OLD','MS','low','static',
 'ты киваешь ровно так же, как кивал в четырнадцать, и сам это замечаешь.',
 'medium shot from a low angle, Slava standing with his weight even and his shoulders squared, his chin dipping once in a short nod, the cup still at his side, the stacked folding seats and the low stage behind him in warm light',
 'his chin dips once and comes back level, nothing else about him moving, the same single figure throughout the shot, hand-drawn animation cadence',
 'his chin is back level after the nod and his jaw has tightened, his eyes gone past her shoulder.',
 false, true),

('A8_SH13','A8','reunion_hall','RITA_OLD','MCU','eye','static',
 'потом она добавляет, что он приезжал сюда один раз, в двухтысячном, и никому не позвонил.',
 'medium close-up at eye level, Rita half-turned toward the tall hall window with her weight on one hip, still speaking, one hand indicating the yard beyond the glass without raising, warm interior light against the blue outside',
 'her indicating hand lowers to the table edge and rests there as she finishes speaking, the same single figure throughout the shot, hand-drawn animation cadence',
 'her hand is flat on the table edge and she has turned a little further toward the window.',
 false, false),

('A8_SH14','A8','school_entrance_2020',NULL,'EWS','high','static',
 'он стоял у входа минут двадцать, никуда не зашёл и уехал на том же автобусе.',
 'extreme wide establishing shot from a high angle, the empty paved approach to the school block seen from above, the metal door shut, young lime trees along the kerb, painted parking bays, a bus stop shelter at the far edge, flat grey light',
 'a bus pulls in at the far shelter and pulls out again, the approach itself holding its exact position and staying empty, hand-drawn animation cadence',
 'the bus has gone from the shelter and the approach is completely empty, the light a shade greyer.',
 true, true),

('A8_SH15','A8','reunion_hall','SLAVA_OLD','CU','eye','static',
 'ты стоишь с полным стаканом ещё минут десять и не находишь, о чём говорить дальше.',
 'close-up at eye level, Slava with his chin level and his eyes fixed on the middle distance, a full plastic cup held against his chest, warm hall light on one side of his face, blurred guests moving behind him',
 'his fingers tighten once around the cup and loosen, his eyes not moving from the middle distance, the same single figure throughout the shot, hand-drawn animation cadence',
 'his fingers have loosened fully around the cup and his eyes have dropped to the floor in front of him.',
 false, false),

('A8_SH16','A8','reunion_hall','SLAVA_OLD','MS','eye','pull_out',
 'ты уходишь первым и в дверях слышишь, как толик рассказывает про мастерскую и про станок.',
 'medium shot at eye level, Slava walking out through the hall doorway with his weight forward and his shoulders rolled up, the lit room and the loud group at the tables behind him, the dark corridor ahead of him',
 'he steps through the doorway and the lit room narrows behind him as he goes, the same figures throughout the shot, hand-drawn animation cadence',
 'he is fully into the dark corridor and only a narrow strip of the lit hall remains behind him.',
 false, false),

('A8_SH17','A8','school_entrance_2020','SLAVA_OLD','WS','eye','static',
 'на улице ты стоишь у той же стены, где стоял он в двухтысячном, и ничего не чувствуешь.',
 'wide shot at eye level, Slava standing against the brick beside the school entrance at night with his weight even and his hands in his coat pockets, one lamp above the door throwing hard light down, the empty paved approach stretching away',
 'his breath plumes out once into the lamp light and thins away, the same single figure throughout the shot, hand-drawn animation cadence',
 'the breath plume has cleared and he has turned a few degrees away from the wall toward the approach.',
 false, true),

('A8_SH18','A8','school_entrance_2020',NULL,'ECU','low','push_in',
 'фонарь над входом гудит на одной ноте, точно так же, как гудел тогда сверлильный станок.',
 'extreme close-up from a low angle, a single lamp in a wire cage above a school door at night, moths and fine snow turning in its cone of light, the painted metal of the housing scarred and repainted many times, black sky beyond',
 'fine snow turns through the cone of lamp light and one flake crosses the housing, the lamp otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'more snow has drifted into the cone of light and the flake has passed off the far side of the housing.',
 true, true);

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
