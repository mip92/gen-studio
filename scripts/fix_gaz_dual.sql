-- «Газ»: convert 6 strong two-person beats to DUAL-character shots (regional text
-- conditioning). SceneFactory.pickByStyleAndParticipantCount picks the dual strategy
-- automatically when a shot has 2 participants (route stays gaz_character_ip, file
-- scene_dual_character_graphic_novel_api.json). participants[0]=LEFT, [1]=RIGHT — the
-- existing participant is LEFT, the added one is RIGHT; scenePrompt says so.
SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
\set sb 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, '
BEGIN;

-- helper to set positive + positivePrompt + shotType in one go
-- A2_SH26  LEFT teen (existing) / RIGHT Vitek (added)
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'night two-shot, the lean dark-haired teenager sitting in his car driver seat on the left, and a jittery young man with spiky bleached-blond hair and a chipped front tooth leaning in at the open window on the right grinning, both faces clearly visible')),'{positivePrompt}',to_jsonb(:'sb'||'night two-shot, the lean dark-haired teenager sitting in his car driver seat on the left, and a jittery young man with spiky bleached-blond hair and a chipped front tooth leaning in at the open window on the right grinning, both faces clearly visible'))
 WHERE "projectId"=:'pid' AND "shotCode"='A2_SH26';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c4','6a200000-0000-4000-8000-0000000000f4','витёк'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A2_SH26';

-- A4_SH05  LEFT Trener (existing) / RIGHT young you (added)
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'a quiet two-shot inside the garage, a bald heavyset mentor with grey stubble pouring tea on the left, and a lean young man with a short dark-brown haircut sitting across the bench on the right, studied in silence')),'{positivePrompt}',to_jsonb(:'sb'||'a quiet two-shot inside the garage, a bald heavyset mentor with grey stubble pouring tea on the left, and a lean young man with a short dark-brown haircut sitting across the bench on the right, studied in silence'))
 WHERE "projectId"=:'pid' AND "shotCode"='A4_SH05';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c1','6a200000-0000-4000-8000-0000000000f7','ты'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A4_SH05';

-- A5_SH32  LEFT Trener (existing) / RIGHT adult you (added)
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'a two-shot at a night meet, a bald heavyset mentor on the left clapping a heavy hand on the shoulder of a lean man with a short dark-brown haircut on the right, rough approval')),'{positivePrompt}',to_jsonb(:'sb'||'a two-shot at a night meet, a bald heavyset mentor on the left clapping a heavy hand on the shoulder of a lean man with a short dark-brown haircut on the right, rough approval'))
 WHERE "projectId"=:'pid' AND "shotCode"='A5_SH32';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c1','6a200000-0000-4000-8000-0000000000f1','ты'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A5_SH32';

-- A6_SH06  LEFT Liga (existing) / RIGHT adult you (added)
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'a tender two-shot on the sandy beach, a young woman with long auburn hair and round glasses reading from a poetry book on the left, and a lean man with a short dark-brown haircut listening with eyes half closed on the right')),'{positivePrompt}',to_jsonb(:'sb'||'a tender two-shot on the sandy beach, a young woman with long auburn hair and round glasses reading from a poetry book on the left, and a lean man with a short dark-brown haircut listening with eyes half closed on the right'))
 WHERE "projectId"=:'pid' AND "shotCode"='A6_SH06';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c1','6a200000-0000-4000-8000-0000000000f1','ты'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A6_SH06';

-- A6_SH09  LEFT adult you (existing) / RIGHT Liga (added)
UPDATE shots SET "shotType"='MS',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'a two-shot at a forest cliff viewpoint, a lean man with a short dark-brown haircut on the left and a young woman with long auburn hair and round glasses on the right standing together at peace, the green river valley behind them')),'{positivePrompt}',to_jsonb(:'sb'||'a two-shot at a forest cliff viewpoint, a lean man with a short dark-brown haircut on the left and a young woman with long auburn hair and round glasses on the right standing together at peace, the green river valley behind them'))
 WHERE "projectId"=:'pid' AND "shotCode"='A6_SH09';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c3','6a200000-0000-4000-8000-0000000000f3','лига'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A6_SH09';

-- A6_SH19  LEFT adult you (existing) / RIGHT Liga (added) — the proposal
UPDATE shots SET "shotType"='MCU',
 "promptFields"=jsonb_set(jsonb_set("promptFields",'{positive}',to_jsonb(:'sb'||'an intimate two-shot in the warm flat, a lean man with a short dark-brown haircut on the left holding the hands of a young woman with long auburn hair and round glasses on the right, the quiet instant of a proposal')),'{positivePrompt}',to_jsonb(:'sb'||'an intimate two-shot in the warm flat, a lean man with a short dark-brown haircut on the left holding the hands of a young woman with long auburn hair and round glasses on the right, the quiet instant of a proposal'))
 WHERE "projectId"=:'pid' AND "shotCode"='A6_SH19';
INSERT INTO shot_participants (id,"shotId","characterId","profileId",label)
 SELECT gen_random_uuid(), id, '6a200000-0000-4000-8000-0000000000c3','6a200000-0000-4000-8000-0000000000f3','лига'
 FROM shots WHERE "projectId"=:'pid' AND "shotCode"='A6_SH19';

COMMIT;

-- verify: these 6 now have 2 participants
SELECT s."shotCode"||' parts='||count(p.id)||' ['||string_agg(p.label, '+' ORDER BY p.id)||']'
FROM shots s JOIN shot_participants p ON p."shotId"=s.id
WHERE s."projectId"=:'pid' AND s."shotCode" IN ('A2_SH26','A4_SH05','A5_SH32','A6_SH06','A6_SH09','A6_SH19')
GROUP BY s."shotCode" ORDER BY s."shotCode";
