-- Enrich «Газ» per-shot positives to bio_plus richness: append per-act PALETTE/mood +
-- a closing TECHNIQUE reminder + a camera shorthand. (Render still appends location.description.)
-- Idempotent: skips shots already carrying the closing technique phrase.
SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
\set tech ', hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows'
BEGIN;

WITH pal(scenekey, tokens) AS (VALUES
 ('cold_open',       'cold sodium-orange and deep blue-black night palette, glossy wet reflections, tense high-contrast mood'),
 ('act_01_origins',  'warm ochre-gold and dusty-rose summer palette, soft nostalgic low-contrast mood'),
 ('act_02_first_car','cold blue-and-amber night palette, oily garage warmth, deep indigo shadows'),
 ('act_03_chat',     'cold blue screen-glow and sodium-orange palette, winter-night blacks, sparse neon accents'),
 ('act_04_trener',   'warm amber and steel-grey palette against cold night blue, hard raking shadows'),
 ('act_05_climb',    'cold neon-blue and sodium palette, deep blacks, hollow desaturated mood'),
 ('act_06_liga',     'warm honey-gold and auburn palette, soft gentle low-contrast warmth'),
 ('act_07_night',    'cold sodium-orange and deep blue-black night palette, glossy wet reflections, blue police strobe, tense high-contrast mood'),
 ('act_08_arrest',   'flat grey and cold fluorescent-green institutional palette, washed desaturated, hard shadows'),
 ('act_09_aftermath','muted overcast-grey desaturated palette, hollow low-contrast mood'),
 ('coda',            'muted neutral-grey desaturated palette, cold low-contrast sombre mood')
)
UPDATE shots s
SET "promptFields" = jsonb_set(
      jsonb_set(s."promptFields", '{positive}',
        to_jsonb( (s."promptFields"->>'positive')
                  || ', ' || pal.tokens
                  || :'tech'
                  || ', ' || s."shotType" || ', ' || COALESCE(s."cameraAngle",'eye') || ' angle, '
                          || COALESCE(s."cameraMove",'static') || ' camera, 16:9')),
      '{positivePrompt}',
        to_jsonb( (s."promptFields"->>'positive')
                  || ', ' || pal.tokens
                  || :'tech'
                  || ', ' || s."shotType" || ', ' || COALESCE(s."cameraAngle",'eye') || ' angle, '
                          || COALESCE(s."cameraMove",'static') || ' camera, 16:9'))
FROM scenes sc, pal
WHERE s."sceneId" = sc.id
  AND sc."sceneKey" = pal.scenekey
  AND s."projectId" = :'pid'
  AND (s."promptFields"->>'positive') NOT LIKE '%cross-hatching in the shadows%';

COMMIT;

\echo '=== preview C_SH13 (was thin) ==='
SELECT "promptFields"->>'positive' FROM shots WHERE "projectId"=:'pid' AND "shotCode"='C_SH13';
\echo '=== lengths now (min/avg/max) vs bio_plus reference ==='
SELECT 'gaz positive chars: min='||min(length("promptFields"->>'positive'))||' avg='||round(avg(length("promptFields"->>'positive')))||' max='||max(length("promptFields"->>'positive')) FROM shots WHERE "projectId"=:'pid';
SELECT 'bio_plus positive chars: avg='||round(avg(length("promptFields"->>'positive'))) FROM shots WHERE "projectId"=(SELECT id FROM projects WHERE slug='bio_plus');
