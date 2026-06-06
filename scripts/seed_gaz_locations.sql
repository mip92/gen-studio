-- Seed: «Газ» LOCATIONS (16 recurring settings). English SDXL prose only — NO
-- style tokens (the GraphicNovel strategy auto-prepends the cell-shaded block).
-- Describe the SPACE: geometry, materials, era cues; end with one atmosphere line.
SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt") VALUES
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'southern_bridge', 'Южный мост (Dienvidu tilts) ночью',
  $d$wide multi-lane cable-stayed road bridge over the Daugava river in Riga at night, long empty asphalt deck with painted lane markings, a tall single white pylon and fanned steel cables, low concrete edge barriers, orange sodium street lamps in a receding row, black river water far below, distant city lights of Riga on both banks, wet glossy tarmac reflecting the lamps, harbour cranes silhouetted downstream, cold January air. atmosphere of a deserted high-speed night straightaway.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'maskavas_intersection', 'Перекрёсток на Маскавас',
  $d$a wide signalised road intersection in the Maskavas forstate district of Riga, four-way crossing with worn asphalt and faded lane paint, a slip-road merging from the right, low Soviet-era brick and panel buildings with small shops at ground level, bare winter trees, traffic lights on steel poles, tram tracks crossing, sodium street lamps, wet black road surface, patches of dirty grey snow at the kerb. atmosphere of a quiet near-empty arterial after midnight.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'bolderaja_yard', 'Двор и гаражи в Болдерае',
  $d$a courtyard between weathered five-storey Khrushchev-era panel apartment blocks in the Bolderaja port district of Riga, a cracked concrete ramp leading down to a row of rusty metal garage boxes, overgrown grass, a beaten-carpet rail, a few parked old cars, birch trees, laundry lines, the tops of harbour cranes visible beyond the rooftops. atmosphere of a warm sleepy working-class summer afternoon.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'pharmacy_maskavas', 'Аптека на Маскавас',
  $d$interior of a small modest neighbourhood pharmacy on Maskavas street in Riga, a white melamine counter with a glass divider, shelves of boxed medicines behind, a green cross sign, worn linoleum floor, a single fluorescent ceiling light, a small queue rail, a window onto the grey street. atmosphere of weary mid-afternoon fluorescent stillness.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'riga_port', 'Рижский порт',
  $d$the Riga freeport waterfront, rows of stacked rusty shipping containers, tall gantry cranes, an oily concrete quay, bollards and thick mooring ropes, a grey cargo-ship hull alongside, the wide flat Daugava estuary, an overcast Baltic sky, gulls. atmosphere of a cold heavy industrial working morning.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'chiekurkalns_garages', 'Гаражи Чиекуркалнса',
  $d$interior of a cramped private car garage in the Chiekurkalns district of Riga, a car raised over an inspection pit, walls hung with tools and worn tyres, a workbench cluttered with engine parts, a portable work lamp on a cable, oil stains on the concrete floor, a kerosene heater, an old wall calendar. atmosphere of an amber oil-smelling evening workshop.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'racer_apartment', 'Твоя квартира',
  $d$interior of a small one-room flat in a Soviet panel block in Riga, a narrow room with a folding sofa-bed, an old wardrobe, a small television, a window onto identical apartment blocks, car magazines stacked on the floor, a shelf with small racing trophies and a bunch of car keys. atmosphere of a tidy spartan young man's flat.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'jurmala_highway', 'Трасса A10 Рига–Юрмала',
  $d$the A10 Riga to Jurmala dual carriageway at night, a long straight asphalt road flanked by dark pine forest, reflective lane markings, an occasional overhead sign gantry, sodium lamps only near the junctions, mostly darkness, a wet road sheen catching distant headlights. atmosphere of a fast empty forest highway at night.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'lidostas_road', 'Дорога у аэропорта',
  $d$a wide empty approach road near Riga airport at night, fresh smooth asphalt, low blue and white aviation lights blinking in the distance, flat open fields, a chain-link perimeter fence, sparse tall lamp posts. atmosphere of a deserted out-of-town night straight.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'liga_apartment', 'Квартира Лиги',
  $d$interior of a cosy renovated flat in a pre-war Riga building, a warm wooden floor, bookshelves, a small kitchen with a kettle, potted plants on a tall windowsill, soft warm lamp light, tall old wooden-framed windows. atmosphere of a warm lived-in homely evening.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'police_room', 'Кабинет полиции',
  $d$a small bare interview room in a Latvian state police station, a grey metal table, two chairs, a closed grey folder on the table, a small barred window, institutional pale-green walls, one fluorescent tube overhead, a plain wall clock. atmosphere of cold institutional fluorescent pressure.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'courtroom', 'Зал суда',
  $d$a modest Latvian courtroom, pale wood wall panelling, rows of bench seating, a raised judge's desk, tall windows with half-closed blinds, a railed defendant's area, a plain floor. atmosphere of solemn quiet daylight gravity.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'jelgava_prison', 'Колония под Елгавой',
  $d$the yard of a strict-regime prison near Jelgava in Latvia, high grey concrete walls topped with coils of razor wire, a watchtower, a long grey barracks block with small barred windows, cracked tarmac, a heavy chain-link gate. atmosphere of bleak grey institutional confinement.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'tire_shop', 'Шиномонтаж',
  $d$interior of a small tyre-fitting workshop on the edge of Riga, a tyre-changing machine and a wheel balancer, stacks of used tyres, a roller shutter half open onto a grey yard, a wall calendar, a kettle on a stool, a cold fluorescent light. atmosphere of a tired low-paid grey working day.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'bmw_interior', 'Салон BMW (за рулём)',
  $d$an interior driver's-eye view from inside an old tuned BMW at night, worn black leather seats, a glowing instrument cluster with tachometer and speedometer needles, a gear lever, the rim of a steering wheel, the windscreen framing wet road and oncoming headlights, faint dashboard glow on the dark interior. atmosphere of a tense low-lit cockpit at speed.$d$, now(), now()),
 (gen_random_uuid(), '6a200000-0000-4000-8000-000000000001', 'cemetery_riga', 'Кладбище',
  $d$a quiet Riga cemetery in overcast weather, rows of modest dark granite headstones, bare trees, gravel paths, low wrought-iron fences around the plots, fallen leaves, a distant chapel. atmosphere of wet still grey mourning.$d$, now(), now())
ON CONFLICT ("projectId", slug) DO NOTHING;

COMMIT;
