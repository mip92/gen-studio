\pset format unaligned
\pset fieldsep '	'
SELECT (SELECT count(*) FROM shots sh JOIN projects p ON p.id=sh."projectId" WHERE p.slug='bully') AS shots,
       (SELECT count(*) FROM scenes sc JOIN projects p ON p.id=sc."projectId" WHERE p.slug='bully') AS acts,
       (SELECT count(*) FROM locations l JOIN projects p ON p.id=l."projectId" WHERE p.slug='bully') AS locations,
       (SELECT count(*) FROM narrative_blocks b JOIN projects p ON p.id=b."projectId" WHERE p.slug='bully') AS bgm_blocks,
       (SELECT count(*) FROM character_profiles pr JOIN characters c ON c.id=pr."characterId" JOIN projects p ON p.id=c."projectId" WHERE p.slug='bully') AS profiles,
       (SELECT count(*) FROM shot_participants sp JOIN shots sh ON sh.id=sp."shotId" JOIN projects p ON p.id=sh."projectId" WHERE p.slug='bully') AS participants;
