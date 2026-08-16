-- ============================================================================
-- «Тот, кого они слушались» (bully) — убрать отрицания из positive.
--
-- Skill(gen-studio-qwen2511) rule 2: the 7B VL encoder has no negation channel,
-- so a negated noun is simply a noun handed to the model. Twelve shots slipped
-- through the authoring pass; three of them were the dangerous kind that names
-- the exact object the frame must NOT contain:
--
--   A7_SH16  «no satchel and no books» on an EMPTY desk → draws a satchel
--   A9_SH05  «no flower inside either half»            → draws the flower whose
--                                                        absence is the point
--   A9_SH04  «a bundle of keys with no doors»          → poetic, and «doors» is
--                                                        a drawable noun
--
-- The other nine are abstractions the encoder cannot render either way
-- («without raising her voice»); they are rewritten as visible body facts, which
-- also buys back words against the 55-word budget.
--
-- Idempotent: re-running rewrites the same text.
-- ============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

UPDATE shots sh SET "promptFields" = jsonb_set(sh."promptFields", '{positive}', to_jsonb(v.positive), true)
FROM projects p, (VALUES

 ('A4_SH05', 'close-up at eye level, Nina standing with her shoulders level and her chin slightly down, speaking evenly along the rows, her small wristwatch worn face-inward at her wrist as she folds her hands, the black board out of focus behind her'),

 ('A4_SH08', 'medium close-up from a low angle, Slava standing at his desk with his shoulders squared and his head held straight to the front, his eyes cut sideways along the row, two heads in the row beyond angled toward him, cold window light across his cheek'),

 ('A6_SH14', 'close-up at eye level, Slava laughing with his chin up and his shoulders shaking once, his eyes staying fixed on the floor ahead of him, the corridor moving out of focus behind him, cold flat light'),

 ('A7_SH06', 'close-up at eye level, Slava standing nearest of anyone with his shoulders squared and his chin level, his lips held parted a few millimetres, his eyes on the radiator rather than on either boy, cold window light across half his face'),

 ('A7_SH07', 'medium close-up from a low angle, Slava standing very still among moving pupils, his weight even and his hands loose at his sides, his head held straight down the corridor, blurred figures crossing behind him, flat corridor light'),

 -- The empty desk: state what IS there. The bare lid and the tucked chair carry
 -- «empty» on their own, and neither word can be drawn as an object.
 ('A7_SH16', 'extreme close-up from a high angle, the scarred bare lid of a school desk in the second row, old ink marks and compass scratches in the naked wood, the chair pushed neatly under it, the desk surface clear all the way to its edges, spring light falling across the grain'),

 ('A8_SH11', 'close-up at eye level, Rita speaking with her chin level and her shoulders still, her eyes steady on his, the plastic cup held at her chest, the warm blurred hall behind her'),

 ('A8_SH13', 'medium close-up at eye level, Rita half-turned toward the tall hall window with her weight on one hip, still speaking, one hand held low toward the yard beyond the glass, warm interior light against the blue outside'),

 ('A9_SH04', 'extreme close-up from a high angle into an open workbench drawer, a jumble of kept things on oiled paper: a dead wristwatch, a bundle of unlabelled keys on a wire ring, two photographs face down, a child''s tin badge, hard clamp-lamp light across them'),

 ('A9_SH05', 'extreme close-up from a high angle, two halves of a cracked plexiglass block lying side by side under a dead wristwatch in the drawer, their fracture faces turned up and dulled with thirty years of dust, the sealed cavity inside each half clear and empty, hard lamp light'),

 ('A9_SH06', 'medium close-up at eye level, Slava sitting motionless over the open drawer with his weight settled and his shoulders low, his hands resting on his knees, looking down into it, the clamp lamp burning past his cheek, the dark garage beyond him'),

 ('A9_SH17', 'close-up at eye level, Slava at forty-four seen straight on with his shoulders level and his chin down, his eyes unfocused past the bench in front of him, the clamp-lamp light flat on his face, the dark bench behind him')

) AS v(code, positive)
WHERE p.slug = 'bully' AND sh."projectId" = p.id AND sh."shotCode" = v.code;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT 'negations left in positive (must be 0): ' || count(*)
FROM shots sh JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully' AND sh."promptFields"->>'positive' ~* '\yno |without |not ';

SELECT 'positive over 55 words (must be 0): ' || count(*)
FROM shots sh JOIN projects p ON p.id = sh."projectId"
WHERE p.slug = 'bully'
  AND array_length(regexp_split_to_array(trim(sh."promptFields"->>'positive'), '\s+'), 1) > 55;
