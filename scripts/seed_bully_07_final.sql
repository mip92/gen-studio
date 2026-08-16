-- ============================================================================
-- «Тот, кого они слушались» (bully) — финал (акт 9).
--
-- Leitmotif recurrence 5 of 5, and the reveal it has been holding since act 7:
-- he took the broken keyring off the corridor floor the same day, after everyone
-- had gone, and told nobody. Nothing in acts 7–8 says so.
--
-- Two deliberate refusals in this act:
--  · The coda does NOT moralise. Track B reserves the fourth wall for a direct
--    address, and this project's standing rule is «no moral coda, CTA only», so
--    the last words are a fact about HIM, not an instruction to the viewer.
--  · The balcony door is NOT repaired. He glues an object that has been dead for
--    thirty years and still does not touch the door he lives with — repairing it
--    would be redemption, and he has not earned any.
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

('A9_SH01','A9','garage_workbench',NULL,'EWS','low','static',
 'ты возвращаешься в гараж в час ночи, хотя ехать домой отсюда всего двенадцать минут пешком.',
 'extreme wide establishing shot from a low angle, a row of garage boxes at night with one roller door raised and a rectangle of yellow light spilling out onto the frozen ground, dark blocks of flats far behind, a single yard lamp on a post, deep blue sky',
 'the rectangle of yellow light on the ground widens slightly as the roller door rises the last few centimetres, the place otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'the roller door has stopped fully raised and the rectangle of yellow light lies at its full width on the frozen ground.',
 true, true),

('A9_SH02','A9','garage_workbench','SLAVA_OLD','MS','eye','static',
 'ты не снимаешь куртку и садишься к верстаку прямо так, как приехал со встречи.',
 'medium shot at eye level, Slava in his outdoor coat lowering himself onto a stool at the steel workbench with his weight going back and his forearms coming down onto the steel, the clamp lamp already on above him, tools in rows on the pegboard behind',
 'he settles onto the stool and his forearms come to rest flat on the cold steel, the same single figure throughout the shot, hand-drawn animation cadence',
 'he is fully settled on the stool with both forearms flat on the bench, his shoulders dropped.',
 false, false),

('A9_SH03','A9','garage_workbench','SLAVA_OLD','CU','high','push_in',
 'нижний ящик верстака ты не открывал года четыре, и он идёт туго, как всегда.',
 'close-up from a high angle, Slava''s hand gripping the handle of the bottom drawer of the workbench and pulling, the drawer front scratched and paint-chipped, the darkened copper bracelet at his wrist, hard clamp-lamp light raking across the steel',
 'the drawer jerks open two centimetres against its runners and stops, his hand keeping its grip, the rest of the frame holding still, hand-drawn animation cadence',
 'the drawer has come open a hand''s width and his grip has shifted further down the handle.',
 false, false),

('A9_SH04','A9','garage_workbench',NULL,'ECU','high','static',
 'в нём лежит всё, что за тридцать лет нельзя было ни выбросить, ни куда-то деть.',
 'extreme close-up from a high angle into an open workbench drawer, a jumble of kept things on oiled paper: a dead wristwatch, a bundle of keys with no doors, two photographs face down, a child''s tin badge, hard clamp-lamp light across them',
 'a key in the bundle rocks a few millimetres and settles as the drawer stops moving, the contents otherwise holding their exact position, hand-drawn animation cadence',
 'the rocking key has come to rest against the others and the drawer is completely still.',
 true, false),

('A9_SH05','A9','garage_workbench',NULL,'ECU','high','push_in',
 'брелок лежит там же, под часами, обеими половинками, сколом вверх.',
 'extreme close-up from a high angle, two halves of a cracked plexiglass block lying side by side under a dead wristwatch in the drawer, their fracture faces turned up and dulled with thirty years of dust, no flower inside either half, hard lamp light',
 'a fine film of dust shifts off one fracture face as the drawer settles, the halves otherwise holding their exact position, only air and light in motion, hand-drawn animation cadence',
 'the dust has settled clear of the fracture face and the bright split line beneath it is visible again.',
 false, true),

('A9_SH06','A9','garage_workbench','SLAVA_OLD','MCU','eye','static',
 'ты подобрал его с пола в тот же день, когда все ушли, и никому про это не сказал.',
 'medium close-up at eye level, Slava sitting motionless over the open drawer with his weight settled and his shoulders low, looking down into it without reaching, the clamp lamp burning past his cheek, the dark garage beyond him',
 'his shoulders rise once with a breath and come back down while his hands stay off the drawer, the same single figure throughout the shot, hand-drawn animation cadence',
 'his shoulders have come down lower than before and one hand has moved to the edge of the drawer.',
 false, true),

('A9_SH07','A9','garage_workbench','SLAVA_OLD','CU','high','static',
 'ты вынимаешь обе половинки и кладёшь их на верстак сколом к себе.',
 'close-up from a high angle, Slava''s two hands lifting the halves of the plexiglass block out of the drawer and setting them down on the bare steel bench, fracture faces turned toward him, the copper bracelet dark at his wrist, hard lamp light',
 'his fingers set the second half down and align it with the first, then withdraw, the rest of the frame holding still, hand-drawn animation cadence',
 'both halves lie aligned on the steel with their fracture faces toward him and his hands have withdrawn to the bench edge.',
 false, false),

('A9_SH08','A9','garage_workbench',NULL,'ECU','eye','push_in',
 'скол за тридцать лет забился пылью, но линия на нём осталась такой же ровной.',
 'extreme close-up at eye level, the fracture face of one plexiglass half filling the frame, the break line clean and straight from corner to corner under a grey film of dust, tiny bubbles frozen in the plastic body, hard raking lamp light',
 'the raking lamp light travels a few millimetres along the fracture line as the lamp arm settles, the object otherwise holding its exact position, only light in motion, hand-drawn animation cadence',
 'the band of raking light has moved further along the fracture line and now lights the dust film from the side.',
 true, true),

('A9_SH09','A9','garage_workbench','SLAVA_OLD','WS','eye','static',
 'ты достаёшь клей, ветошь и лампу на струбцине, как достаёшь их для любого заказа.',
 'wide shot at eye level of the whole workbench, Slava seated at it with his weight settled and his torso squared to the steel, laying out a glue tube, a clean rag and repositioning the clamp lamp, tools in rows behind, the dark garage around the pool of light',
 'he swings the clamp lamp a few degrees and the pool of light on the bench shifts with it, the same single figure throughout the shot, hand-drawn animation cadence',
 'the lamp has come to rest at its new angle and the pool of light now falls squarely on the two plastic halves.',
 false, false),

('A9_SH10','A9','garage_workbench',NULL,'ECU','high','static',
 'клей ты выдавливаешь на спичку, потому что из тюбика на такую площадь идёт много.',
 'extreme close-up from a high angle, a bead of clear glue squeezed onto the tip of a wooden match held over the fracture face of a plexiglass half, the tube pinched beside it, dust and metal filings in the bench grain, hard lamp light',
 'the bead of glue swells at the match tip and steadies without falling, the rest of the frame holding still, hand-drawn animation cadence',
 'the bead has been drawn along the fracture line and now lies as a thin wet seam across the plastic.',
 false, false),

('A9_SH11','A9','garage_workbench','SLAVA_OLD','MCU','eye','push_in',
 'ты сводишь половинки на глаз, и они сходятся с первого раза, без подгонки.',
 'medium close-up at eye level, Slava leaning in over the bench with his elbows planted and his shoulders forward, bringing the two plexiglass halves together between his fingertips, his eyes very close to the work, the clamp lamp hard on his hands',
 'the two halves close the last millimetre between his fingertips and meet, his elbows staying planted, the same single figure throughout the shot, hand-drawn animation cadence',
 'the halves are pressed fully together into one block and his fingertips have shifted to hold it from both ends.',
 false, true),

('A9_SH12','A9','garage_workbench','SLAVA_OLD','CU','low','static',
 'руки у тебя не дрожат совсем, и это единственное, что за тридцать лет не поменялось.',
 'close-up from a low angle, Slava''s face lit hard from below by the clamp lamp on the bench, his chin down and his shoulders forward, his eyes steady on the work below the frame, the dark garage ceiling above him',
 'his eyes hold steady on the work and his jaw shifts once as he presses, the same single figure throughout the shot, hand-drawn animation cadence',
 'his jaw has settled and his eyes have not moved, his chin lowered a few degrees further toward the work.',
 false, false),

('A9_SH13','A9','garage_workbench',NULL,'ECU','eye','push_in',
 'шов виден насквозь, тонкой белой линией через всё стекло, и убрать его уже нельзя.',
 'extreme close-up at eye level, the reassembled plexiglass block held together, a fine white glue seam running corner to corner through the clear plastic, the cavity inside empty, dust motes in the lamp beam behind it',
 'the white seam brightens slightly as the glue sets and the light through the block steadies, the object otherwise holding its exact position, only light in motion, hand-drawn animation cadence',
 'the seam has whitened further as the glue sets and the empty cavity behind it is fully lit through.',
 false, true),

('A9_SH14','A9','garage_workbench','SLAVA_OLD','MS','eye','static',
 'василька внутри нет, он рассыпался ещё тогда, на полу, между вторым и третьим уроком.',
 'medium shot at eye level, Slava sitting back from the bench with his weight settled onto the stool and his hands flat on the steel on either side of the small glued block, the clamp lamp above it, the dark garage around the pool of light',
 'his hands stay flat on the steel while his chest rises and falls once, the same single figure throughout the shot, hand-drawn animation cadence',
 'his hands have come off the steel into his lap and his shoulders have dropped, the block left alone in the lamp light.',
 false, false),

('A9_SH15','A9','garage_workbench',NULL,'WS','high','pull_out',
 'ты сидишь так до четырёх утра, и за всё это время не включаешь ни радио, ни телефон.',
 'wide shot from a high angle over the garage box, a single seated figure at a lit workbench in the middle of a large dark space, the roller door still raised on the black yard, tools and shelves lost in shadow beyond the lamp',
 'the seated figure holds its position while a thin draught from the open door moves a rag hanging on the bench edge, hand-drawn animation cadence',
 'the hanging rag has settled still and the figure has not moved at all, the lamp pool unchanged around it.',
 false, true),

('A9_SH16','A9','slava_kitchen','SLAVA_OLD','MS','eye','static',
 'дома ты проходишь мимо балконной двери и в этот раз тоже к ней не подходишь.',
 'medium shot at eye level, Slava crossing the dark kitchen past the balcony door standing ajar with its cardboard wedge, his torso turned away from it and his weight carrying him past, the small glued block held in one hand, first grey daylight in the window',
 'he passes the door without slowing and his hand closes a little tighter around the small block, the same single figure throughout the shot, hand-drawn animation cadence',
 'he has passed the door completely and his hand is closed fully around the block at his side.',
 false, true),

('A9_SH17','A9','garage_workbench','SLAVA_OLD','CU','eye','static',
 'ты думаешь, что ты ничего не делал, и ты действительно ничего не делал.',
 'close-up at eye level, Slava at forty-four seen straight on with his shoulders level and his chin down, his eyes not on anything in particular, the clamp-lamp light flat on his face, the dark bench behind him',
 'his eyes lower a few degrees and stay there, nothing else about him moving, the same single figure throughout the shot, hand-drawn animation cadence',
 'his eyes have lowered further and his mouth has settled into a flat line.',
 false, true),

('A9_SH18','A9','school_workshop','SLAVA_TEEN','MCU','eye','static',
 'одиннадцать человек тогда ждали твоего лица, каждый раз только его, и больше ничего.',
 'medium close-up at eye level, Slava at fourteen back in the school workshop, standing at his bench three-quarters to camera with his weight on one hip and his chin level, boys at the benches behind him with their heads turned toward him, dusty window light',
 'the turned heads behind him hold their angle while sawdust drifts through the window beam between them, the same figures throughout the shot, hand-drawn animation cadence',
 'the sawdust has drifted lower through the beam and one more head at the back has turned toward him.',
 false, true),

('A9_SH19','A9','school_workshop','SLAVA_TEEN','CU','low','push_in',
 'и каждый раз ты давал им то лицо, которое стоило тебе дешевле всего.',
 'close-up from a low angle, Slava at fourteen with his chin level and his shoulders squared, giving a small flat nod toward something off frame, his eyes untouched by it, hard workshop light from the caged lamp above',
 'his chin dips once in the small nod and comes back level, his eyes not moving with it, the same single figure throughout the shot, hand-drawn animation cadence',
 'his chin is level again after the nod and his eyes are exactly where they were.',
 false, true),

('A9_SH20','A9','garage_workbench',NULL,'ECU','high','push_in',
 'склеенный брелок лежит на верстаке под лампой, швом поперёк, и внутри у него пусто.',
 'extreme close-up from a high angle, the reassembled plexiglass block alone on the bare steel workbench directly under the clamp lamp, the white glue seam running corner to corner, the sealed cavity inside empty and clear, metal filings around it on the steel',
 'the lamp light steadies on the block and one metal filing beside it settles into the bench grain, the object otherwise holding its exact position, only air and light in motion, hand-drawn animation cadence',
 'the filing has settled into the grain and the lamp light on the block has steadied completely.',
 true, true),

('A9_SH21','A9','garage_workbench',NULL,'WS','eye','static',
 'лампу над верстаком ты не выключаешь, потому что завтра к девяти сюда снова придут люди.',
 'wide shot at eye level of the empty workbench under its burning clamp lamp, the stool pushed in, the small glued block alone in the pool of light, the roller door lowered behind, cold grey morning coming through the door gap',
 'the grey light in the door gap strengthens by a shade while the lamp keeps burning and nothing on the bench moves, hand-drawn animation cadence',
 'the grey light under the door has grown noticeably stronger and the lamp now reads as the weaker of the two lights.',
 true, false),

('A9_SH22','A9','garage_workbench',NULL,'EWS','low','pull_out',
 'эта история вымышлена, все совпадения с реальными людьми и событиями случайны.',
 'extreme wide establishing shot from a low angle, the row of garage boxes at first light with one door still showing a thin line of lamp light beneath it, frozen ruts across the yard, bare trees behind the fence, a pale grey sky going white at the edge',
 'the sky brightens by a shade along its edge while the thin line of lamp light under the door stays exactly as it is, the place holding its exact position, only light in motion, hand-drawn animation cadence',
 'the sky has brightened further and the line of lamp light under the door has become harder to see against it.',
 true, false);

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

-- ── Whole-film report ───────────────────────────────────────────────────────
SELECT sc."sceneKey", count(*) AS shots,
       sum(array_length(regexp_split_to_array(trim(sh."narrationText"), '\s+'), 1)) AS words,
       round(avg(array_length(regexp_split_to_array(trim(sh."narrationText"), '\s+'), 1)), 1) AS avg_words
FROM shots sh
JOIN scenes sc ON sc.id = sh."sceneId"
JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully'
GROUP BY sc."sceneKey", sc."sortOrder" ORDER BY sc."sortOrder";

-- Runtime estimate: RU narration runs ~140 wpm at the measured cautionary pace,
-- plus a ~0.5 s tail per shot.
SELECT count(*) AS shots,
       sum(array_length(regexp_split_to_array(trim("narrationText"), '\s+'), 1)) AS words,
       round((sum(array_length(regexp_split_to_array(trim("narrationText"), '\s+'), 1)) / 140.0)
             + (count(*) * 0.5 / 60.0), 1) AS est_minutes
FROM shots sh JOIN projects p ON p.id = sh."projectId" WHERE p.slug = 'bully';
