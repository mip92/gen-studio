-- Remove the "thin scar above left eyebrow" identity anchor from everywhere
-- (CONDUCTOR_BASE profile + all shot prompt fields). Replace it with a more
-- subtle anchor: a small mole at the left jawline (читается как деталь лица,
-- не как травма).
--
-- Old: thin scar above left eyebrow
-- New: small mole at left jawline

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.unscar(s text) RETURNS text AS $$
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  RETURN
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(s,
                  ', thin scar above left eyebrow',  ', small mole at left jawline'),
                'thin scar above left eyebrow, ',    'small mole at left jawline, '),
              'thin scar above left eyebrow',        'small mole at left jawline'),
            ', thin scar above her left eyebrow',    ', small mole at her left jawline'),
          'thin scar above her left eyebrow, ',      'small mole at her left jawline, '),
        'thin scar above her left eyebrow',          'small mole at her left jawline'),
      ', no scar',                                   '');
END $$ LANGUAGE plpgsql IMMUTABLE;

-- 1. CONDUCTOR_BASE profile fields
UPDATE character_profiles cp
SET
  "promptBase"    = pg_temp.unscar(cp."promptBase"),
  "promptAngles"  = pg_temp.unscar(cp."promptAngles"),
  "promptVariety" = pg_temp.unscar(cp."promptVariety"),
  "negative"      = pg_temp.unscar(cp."negative")
FROM characters c, projects p
WHERE cp."characterId" = c.id
  AND c."projectId" = p.id
  AND p.slug = 'last_shift'
  AND cp."profileCode" = 'CONDUCTOR_BASE';

-- 2. Scrub all jsonb prompt fields on shots
UPDATE shots sh
SET "promptFields" =
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            sh."promptFields",
            '{positive}',              to_jsonb(pg_temp.unscar(sh."promptFields"->>'positive'))
          ),
          '{positiveSdxl}',            to_jsonb(pg_temp.unscar(sh."promptFields"->>'positiveSdxl'))
        ),
        '{frameDescription}',          to_jsonb(pg_temp.unscar(sh."promptFields"->>'frameDescription'))
      ),
      '{positiveTemplate}',            to_jsonb(pg_temp.unscar(sh."promptFields"->>'positiveTemplate'))
    ),
    '{positiveCharacterLocks}',        to_jsonb(pg_temp.unscar(sh."promptFields"->>'positiveCharacterLocks'))
  )
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift');

-- 3. Project scriptText (PROJECT.md mirror in DB)
UPDATE projects
SET "scriptText" = pg_temp.unscar("scriptText")
WHERE slug = 'last_shift';

COMMIT;
