-- Wan 2.2 i2v motion-prompt audit. READ-ONLY.
--
-- Rules being checked live in Skill(gen-studio-wan22):
--   §2  I2V formula = Motion + Camera movement; 30-60 words; do not re-describe the frame
--   §3  positive locks only — no negations in the positive (cfg=1 makes it the ONLY channel)
--   §4  every prompt names exactly one camera behaviour ("stays fixed" counts)
--   §5  one beat per 81 frames; no narrative abstractions
--
-- Cyrillic through a Windows console gets mangled — redirect to a file and read it:
--   psql -h localhost -U gen_studio -d gen_studio -f scripts\audit_motion_prompts.sql > tmp_motion_audit.out 2>&1
\pset pager off

\echo == 1. CORPUS OVERVIEW: coverage and how much of it is still rewritable ==
-- "frozen" = a completed video exists, so changing the prompt makes that clip
-- stale (feedback-rework-invalidate-stale-renders). Rewrite those only when the
-- shot is deliberately being re-rendered.
SELECT p.slug,
       count(*) FILTER (WHERE s."renderMode" = 'animated')                                   AS animated,
       count(*) FILTER (WHERE s."renderMode" = 'animated'
                          AND nullif(trim(s."promptFields"->>'motionPrompt'),'') IS NULL)    AS no_motion_prompt,
       count(*) FILTER (WHERE s."renderMode" = 'animated'
                          AND NOT EXISTS (SELECT 1 FROM video_renders v
                                          WHERE v."shotId" = s.id AND v.status = 'completed')) AS rewritable,
       count(*) FILTER (WHERE s."renderMode" = 'static')                                     AS static_shots
FROM projects p JOIN shots s ON s."projectId" = p.id
GROUP BY p.slug ORDER BY p.slug;

\echo == 2. NEGATIONS IN THE POSITIVE (should be 0 everywhere) — §3 ==
-- At cfg=1 the negative prompt is inert, so the positive is the only channel
-- that reaches the model; `no people` feeds it the token *people*.
SELECT p.slug,
       count(*) AS animated_with_motion,
       count(*) FILTER (WHERE lower(s."promptFields"->>'motionPrompt') ~ '\mno ')      AS has_no_word,
       count(*) FILTER (WHERE lower(s."promptFields"->>'motionPrompt') ~ '\mwithout ') AS has_without
FROM projects p JOIN shots s ON s."projectId" = p.id
WHERE s."renderMode" = 'animated' AND nullif(trim(s."promptFields"->>'motionPrompt'),'') IS NOT NULL
GROUP BY p.slug
HAVING count(*) FILTER (WHERE lower(s."promptFields"->>'motionPrompt') ~ '\mno |\mwithout ') > 0
ORDER BY 3 DESC;

\echo == 3. CAMERA CLAUSE — §4 ==
-- A missing clause is only a defect when `cameraMove` is ALSO empty: when the
-- column is set, video-render.service.ts derives the clause at dispatch from
-- CAMERA_CLAUSE. Both empty = the model is free to invent a camera move.
SELECT p.slug,
       count(*)                                                                          AS animated_with_motion,
       count(*) FILTER (WHERE lower(s."promptFields"->>'motionPrompt') !~ 'camera|handheld|point of view'
                          AND coalesce(trim(s."cameraMove"),'') = '')                    AS no_camera_at_all,
       count(*) FILTER (WHERE lower(s."promptFields"->>'motionPrompt') !~ 'camera|handheld|point of view'
                          AND coalesce(trim(s."cameraMove"),'') <> '')                   AS camera_derived_from_column
FROM projects p JOIN shots s ON s."projectId" = p.id
WHERE s."renderMode" = 'animated' AND nullif(trim(s."promptFields"->>'motionPrompt'),'') IS NOT NULL
GROUP BY p.slug ORDER BY 3 DESC, p.slug;

\echo == 4. WORD BUDGET — §2 (30-60 words; over 100 approaches the umt5 quality cliff) ==
SELECT p.slug,
       min(w) AS min_words, round(avg(w)) AS avg_words, max(w) AS max_words,
       count(*) FILTER (WHERE w > 100) AS over_100
FROM (
  SELECT s."projectId",
         array_length(regexp_split_to_array(trim(s."promptFields"->>'motionPrompt'), '\s+'), 1) AS w
  FROM shots s
  WHERE s."renderMode" = 'animated' AND nullif(trim(s."promptFields"->>'motionPrompt'),'') IS NOT NULL
) t JOIN projects p ON p.id = t."projectId"
GROUP BY p.slug ORDER BY 4 DESC;

\echo == 5. TEMPLATE REUSE — §5.3b of gen-studio-scenario (distinct should be ~= animated) ==
SELECT p.slug,
       count(*) AS animated_with_motion,
       count(DISTINCT trim(s."promptFields"->>'motionPrompt')) AS distinct_motion
FROM projects p JOIN shots s ON s."projectId" = p.id
WHERE s."renderMode" = 'animated' AND nullif(trim(s."promptFields"->>'motionPrompt'),'') IS NOT NULL
GROUP BY p.slug
HAVING count(DISTINCT trim(s."promptFields"->>'motionPrompt')) < count(*) / 2
ORDER BY 2 DESC;

\echo == 6. TOKEN WEIGHTS (stripped at dispatch, so writing them is a silent no-op) ==
SELECT p.slug, count(*) AS prompts_with_weights
FROM projects p JOIN shots s ON s."projectId" = p.id
WHERE s."renderMode" = 'animated'
  AND (s."promptFields"->>'motionPrompt' ~ '\([^)]+:[0-9.]+\)'
    OR s."promptFields"->>'motionNegative' ~ '\([^)]+:[0-9.]+\)')
GROUP BY p.slug ORDER BY 2 DESC;

\echo == 7. narrativeBeat present (no longer appended to the Wan positive since 2026-07-30) ==
SELECT p.slug, count(*) AS shots_with_beat
FROM projects p JOIN shots s ON s."projectId" = p.id
WHERE s."renderMode" = 'animated' AND nullif(trim(s."promptFields"->>'narrativeBeat'),'') IS NOT NULL
GROUP BY p.slug ORDER BY 2 DESC;

\echo == 8. PROJECT-LEVEL FALLBACKS — do they themselves obey the rules? ==
SELECT slug,
       (lower("defaultMotionPrompt")       ~ '\mno |\mwithout ') AS default_has_negation,
       (lower("defaultStaticMotionPrompt") ~ '\mno |\mwithout ') AS static_default_has_negation,
       array_length(regexp_split_to_array(trim("defaultMotionPrompt"), '\s+'), 1) AS default_words
FROM projects
WHERE lower("defaultMotionPrompt") ~ '\mno |\mwithout '
   OR lower("defaultStaticMotionPrompt") ~ '\mno |\mwithout '
ORDER BY slug;
