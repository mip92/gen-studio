-- Resolve {TOKEN} placeholders in shot promptFields.positive / positiveSdxl /
-- frameDescription so the UI shows ready-to-render English prompts. Original
-- template form is backed up to promptFields.positiveTemplate.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.resolve_ls(s text) RETURNS text AS $$
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  RETURN
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(
                                    replace(
                                      replace(
                                        replace(
                                          replace(
                                            replace(s,
                                              '{CONDUCTOR}',  'CONDUCTOR_BASE, female train conductor 38 to 42, dark blonde low bun under navy peaked cap, grey-green tired eyes, thin scar above left eyebrow, natural skin pores, no makeup, dark navy uniform jacket with one shoulder stripe and brass buttons, white shirt collar, grey fingerless wool gloves'),
                                            '{PAX_MIL}',    '30yo man in plain dark green military shirt without insignia, short buzzcut, hollow cheeks, sharp jawline, brown thousand-yard stare eyes'),
                                          '{PAX_MOM}',    '25yo woman with long dark hair loose, no makeup, cream cardigan, holding sleeping infant against shoulder, gentle exhausted face'),
                                        '{PAX_BRIDE}',  '24yo woman, light brown messy ponytail, no makeup, grey hoodie and joggers, holding white garment bag with wedding dress visible through plastic, red-rimmed eyes'),
                                      '{PAX_BIZ}',    '45yo man, rumpled white dress shirt with loosened dark tie, glasses pushed up on head, salt-pepper receding hair, gold wedding ring, mild defeated expression'),
                                    '{PAX_VET}',    '80yo man in dark wool blazer with three rows of generic medal ribbons no readable insignia, thin white side hair on bald head, deep wrinkles, pale blue eyes, calloused hands on simple wooden cane'),
                                  '{PAX_HE}',     '33yo man, short dark hair and trimmed beard, navy crew neck sweater, set jaw'),
                                '{PAX_SHE}',    '32yo woman with auburn hair in low ponytail, oversized grey turtleneck, red eyes'),
                              '{PAX_MUS}',    '22yo man, messy dark curly hair, denim jacket over white tee, acoustic guitar across knees, gentle absent smile'),
                            '{PAX_GIRL}',   '7yo girl, brown shoulder length hair, light blue cardigan over white tee, holding worn plush owl with one button eye missing, solemn dark eyes, natural child proportions'),
                          '{LIGHT_A1}', 'sodium vapor platform lamps, cool autumn dusk sky, golden hour fading, warm-cool contrast'),
                        '{LIGHT_A2}', 'warm tungsten corridor lamps, deep indigo night windows, soft falloff, sleep silence'),
                      '{LIGHT_A3}', 'late night dim amber, indigo black windows, single reading lamp pools of light'),
                    '{LIGHT_A4}', 'pre-dawn cool blue starting to warm, weary tungsten, first hint of sky'),
                  '{LIGHT_A5}', 'cold daylight through window, intermittent strobing birch shadows, high key overcast'),
                '{LIGHT_A6}', 'late afternoon golden warmth slanting through window, long corridor shadows'),
              '{LIGHT_A7}', 'dark emerald compartment shadows, snow blizzard outside, harsh emergency yellow flashlight'),
            '{LIGHT_A8}', 'milky pink dawn fog, soft diffused omnidirectional light, no harsh shadows, ethereal'),
          '{STYLE}',     'photorealistic cinematic, 35mm full-frame, shallow depth of field, anamorphic widescreen, natural film grain'),
        '{TRAIN_INT}', 'nameless long-distance Eastern European passenger train interior, no logos, no readable text on signs, ambiguous era'),
      '{TRAIN_EXT}', 'nameless rural train route, no city in view, generic post-Soviet landscape, no logos, no text on signs');
END $$ LANGUAGE plpgsql IMMUTABLE;

-- Apply resolution to all 200 shots: rebuild positive, positiveSdxl, frameDescription
-- Keep positiveTemplate (original with {TOKEN}) for future re-resolution if user
-- edits a base prompt block.
UPDATE shots sh
SET "promptFields" =
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          sh."promptFields",
          '{positiveTemplate}', to_jsonb(sh."promptFields"->>'positive')
        ),
        '{positive}',         to_jsonb(pg_temp.resolve_ls(sh."promptFields"->>'positive'))
      ),
      '{positiveSdxl}',       to_jsonb(pg_temp.resolve_ls(sh."promptFields"->>'positiveSdxl'))
    ),
    '{frameDescription}',     to_jsonb(pg_temp.resolve_ls(sh."promptFields"->>'frameDescription'))
  )
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift');

COMMIT;
