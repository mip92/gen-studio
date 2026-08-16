\pset format unaligned
\pset fieldsep '	'
SELECT b."sortOrder", b.slug, b.bpm, b.keyscale, b.timesignature,
       (b.title ~ '^(Cold open|Акт [0-9]+|Финал) — .+') AS title_ok,
       (b."moodPrompt" ~ '[0-9]+ ?bpm'
        OR lower(b."moodPrompt") ~ '(major|minor)'
        OR b."moodPrompt" ~ '[0-9]/[0-9]') AS caption_conflict
  FROM narrative_blocks b JOIN projects p ON p.id=b."projectId"
 WHERE p.slug='bully' ORDER BY b."sortOrder";
