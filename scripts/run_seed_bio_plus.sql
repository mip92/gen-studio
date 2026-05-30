-- bio_plus — full seed runner. Executes all 9 seed files in order.
-- Run with: psql -h localhost -U gen_studio -d gen_studio -v ON_ERROR_STOP=1 -f run_seed_bio_plus.sql
-- (PGPASSWORD=gen_studio in env)
--
-- Each included file wraps its own BEGIN/COMMIT. If any file fails, run is aborted.

\echo === bio_plus seed: setup (project, scenes, characters, profiles, cold open) ===
\i seed_bio_plus.sql

\echo === bio_plus seed: A1 «Истоки» (22 shots) ===
\i seed_bio_plus_shots_a1.sql

\echo === bio_plus seed: A2 «Вход» (28 shots) ===
\i seed_bio_plus_shots_a2.sql

\echo === bio_plus seed: A3 «Подъём» (30 shots) ===
\i seed_bio_plus_shots_a3.sql

\echo === bio_plus seed: A4 «Сектантское ускорение» (28 shots) ===
\i seed_bio_plus_shots_a4.sql

\echo === bio_plus seed: A5 «Точка невозврата» (25 shots) ===
\i seed_bio_plus_shots_a5.sql

\echo === bio_plus seed: A6 «Катастрофа» (20 shots) ===
\i seed_bio_plus_shots_a6.sql

\echo === bio_plus seed: A7 «Послесловие» (25 shots) ===
\i seed_bio_plus_shots_a7.sql

\echo === bio_plus seed: CODA «Та самая аптека» (10 shots) ===
\i seed_bio_plus_shots_coda.sql

\echo
\echo === Seed complete. Verifying counts: ===

SELECT 'project' AS entity, COUNT(*)::text AS count FROM projects WHERE slug = 'bio_plus'
UNION ALL SELECT 'scenes', COUNT(*)::text FROM scenes s JOIN projects p ON s."projectId" = p.id WHERE p.slug = 'bio_plus'
UNION ALL SELECT 'characters', COUNT(*)::text FROM characters c JOIN projects p ON c."projectId" = p.id WHERE p.slug = 'bio_plus'
UNION ALL SELECT 'character_profiles', COUNT(*)::text FROM character_profiles cp JOIN characters c ON cp."characterId" = c.id JOIN projects p ON c."projectId" = p.id WHERE p.slug = 'bio_plus'
UNION ALL SELECT 'shots', COUNT(*)::text FROM shots sh JOIN projects p ON sh."projectId" = p.id WHERE p.slug = 'bio_plus'
UNION ALL SELECT 'shots iconic', COUNT(*)::text FROM shots sh JOIN projects p ON sh."projectId" = p.id WHERE p.slug = 'bio_plus' AND sh."isIconic" = TRUE
UNION ALL SELECT 'shots broll', COUNT(*)::text FROM shots sh JOIN projects p ON sh."projectId" = p.id WHERE p.slug = 'bio_plus' AND sh."isBroll" = TRUE;

\echo
\echo === Expected: project=1, scenes=9, characters=8, character_profiles=8, shots=200, iconic≈29, broll≈45 ===
\echo === NEXT: run scripts/resolve_bio_plus_placeholders.sql to substitute {TOKEN}s in promptFields ===
