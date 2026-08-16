-- Приведение к словарным бюджетам Qwen (аудит gen-studio-plot-audit §4b).
--
-- Локации были 87–105 слов, промпт-базы 35–48. Эталон свежего realcomic_qwen
-- проекта (`bully`): локации 24–25, promptBase 33–35 — потому что бюджет кадра
-- 55 слов ОБЩИЙ, и всё, что съела локация, не досталось действию.
--
-- Все UPDATE со скоупом по проекту: коды локаций и профилей повторяются между
-- фильмами, безусловный UPDATE затирает чужое.

BEGIN;

UPDATE locations l SET description = v.descr
FROM projects p, (VALUES
('stairwell_night_94',
 'A late-soviet stairwell at night, olive paint to shoulder height, a caged bulb over worn concrete steps, two padded doors on a narrow landing.'),
('landing_1979',
 'A late-seventies fourth-floor landing in glossy green oil paint, a tall wooden door with a splintered frame, wood dust and metal swarf underfoot.'),
('school_workshop_83',
 'A soviet school metalwork room, eight steel benches with heavy vices, a wall board of tool outlines, high wire-glass windows and suspended chalky dust.'),
('metalremont_booth',
 'A tiny municipal repair booth three paces deep, a hatch window over a scratched counter, hundreds of key blanks on nails, one fluorescent tube.'),
('vlad_kitchen',
 'A five-square-metre panel-block kitchen, faded orange wallpaper, a white enamel gas stove, a square table under the window with an oilcloth cover.'),
('market_rows_90s',
 'A nineties open-air market of converted containers and trestle tables under sagging striped awnings, muddy duckboards between the rows, kerosene heaters underneath.'),
('warehouse_yard',
 'A depot yard behind a grey silicate-brick warehouse, a steel shutter and a padlocked personnel door, stacked pallets, one floodlight and black corners.'),
('office_safe_room',
 'A late-nineties office panelled in dark veneer, heavy drawn curtains, a desk with a green leather inset, a tall green strongroom safe on a plinth.'),
('own_shop_98',
 'A small locksmith shop with a glazed street door, a pegboard wall of cylinders and blanks, a counter with a hinged flap, fresh paint.'),
('own_flat_door',
 'The inside face of a dark laminated steel entrance door in a cramped hallway, seven mismatched locks down its closing edge, coats crowded beside.'),
('stairwell_2026',
 'A contemporary landing in a nineties block, flat grey repaint over old texture, three flush steel doors, a new intercom panel and a cheap LED fitting.')
) AS v(slug, descr)
WHERE p.slug = 'safecracker' AND l."projectId" = p.id AND l.slug = v.slug;

-- promptBase: порядок из Skill(gen-studio-anchors) §3 — сложение/возраст → волосы
-- → глаза → опознавательный предмет → одежда. У VLAD_MID убран шрам на костяшке:
-- якорь по §3.2 должен быть ОДИН, и это медный щуп; шрам сюжетно ни на что не
-- завязан (проверено по scriptText и озвучке).
UPDATE character_profiles cp SET "promptBase" = v.base
FROM characters c, projects p, (VALUES
('VLAD_KID',
 'a thin east-european boy of thirteen, dark blond hair cut short, grey-green eyes, a thin copper probe through his breast-pocket buttonhole, a brown school jacket over a grey vest'),
('VLAD_MID',
 'a lean east-european man of twenty-eight, dark blond hair to the collar pushed back, grey-green eyes, a thin copper probe in his breast pocket, a dark green canvas work jacket'),
('VLAD_OLD',
 'a broad east-european man of sixty, cropped white hair thinning at the crown, grey-green eyes, a thin copper probe in his breast pocket, a faded blue workshop coat'),
('GRISHA_MID',
 'a heavy east-european man of thirty-five, ginger hair cut very short and receding, pale blue eyes, a broad flat signet ring on his left little finger, a long dark leather coat'),
('NINA_MID',
 'a slight east-european woman of thirty, black hair in a thick single braid, brown eyes, a cream plastic butterfly clip in the braid, a mustard cardigan over a printed dress'),
('SON_KID',
 'a small east-european boy of seven, white-blond hair with a straight fringe, blue eyes, a scratched plastic watch on his right wrist, a red tracksuit top with white stripes'),
('SON_ADULT',
 'a tall heavy-shouldered east-european man of thirty-six, fair hair shaved at the sides, blue eyes, a scratched steel watch on his right wrist, a black quilted jacket'),
('FITTER_OLD',
 'a stooped east-european man of fifty-eight, grey hair combed across a bald crown, deep-set brown eyes, a cloth tape measure round his neck, a stained brown work coat')
) AS v(pcode, base)
WHERE p.slug = 'safecracker' AND c."projectId" = p.id
  AND cp."characterId" = c.id AND cp."profileCode" = v.pcode;

COMMIT;
