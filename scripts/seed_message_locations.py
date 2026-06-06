# -*- coding: utf-8 -*-
"""Seed LOCATIONS for project `message` (Petropavlovsk). Idempotent."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e550000-0000-4000-8000-000000000001"

# idSuffix, slug, name(RU), description(EN — space only, NO style tokens)
LOCS = [
    ("f0", "irina_kitchen_night", "Кухня Ирины (Конституции 38, ночь)",
     "a small cramped Soviet-era ninth-floor apartment kitchen in a Petropavlovsk panel block, late at night, a worn laminate table pushed against the wall under a single warm pendant bulb, an old white electric kettle, a sugar tin and two mismatched mugs, a small window above the sink with a thin lace curtain and the cold blue glow of courtyard sodium lamps beyond, yellowed wall tiles with a faded floral border, a wall calendar and a child's old drawing held by a fridge magnet, a phone lying face-up on the table casting a pale screen glow, the quiet stillness of a sleepless apartment with everyone else long gone"),
    ("f1", "irina_room", "Комната Ирины",
     "the living room of a modest Soviet-era Petropavlovsk apartment, a brown folding sofa with a knitted throw, a glass-fronted wall unit crammed with books and dusty crystal glasses, a framed photo of a grown daughter on the shelf, heavy beige curtains half-drawn, a small old television, a faded patterned rug hung on the wall above the sofa in the old Soviet habit, warm dim table-lamp light, the worn comfortable clutter of a woman who has lived here alone for years, a quiet lived-in melancholy"),
    ("f2", "school_russian_class", "Кабинет русского языка",
     "a Kazakhstani secondary-school Russian-language classroom, rows of scuffed two-seat wooden desks, a green chalkboard with neat cursive handwriting, tall windows with institutional white frames and pale winter light, framed portraits of writers along the upper wall, a teacher's desk with a stack of exercise books and a red pen, pale green painted walls, a cast-iron radiator under the window, worn brown linoleum floor, the tired institutional calm of late afternoon after the last bell"),
    ("f3", "school_staffroom", "Учительская",
     "a cramped school staff room, a long table ringed with mismatched chairs, an electric samovar and chipped tea cups, teachers' coats on a row of wall hooks, shelves of bulging folders and a noticeboard layered with schedules, a small window with a dusty potted plant, flat fluorescent ceiling light, scattered papers and a half-drunk cup of tea, ordinary worn workplace warmth with a faint undercurrent of colleagues' gossip"),
    ("f4", "halyk_bank_branch", "Отделение Halyk Bank",
     "the interior of a modern Kazakhstani Halyk Bank branch, a clean teal-and-white service counter with glass partitions, a numbered queue-ticket machine, a row of bolted waiting chairs, a wall screen of currency rates, polished grey tile floor, bright even ceiling light, a young teller in branded uniform behind the glass, the impersonal cool efficiency of a savings withdrawal, a quiet bureaucratic chill"),
    ("f5", "mfo_office", "Офис микрозаймов (МФО)",
     "a small cheap microloan office tucked into a Petropavlovsk shopping arcade, a plastic counter with a single tired clerk and a card terminal, bright backlit signage promising fast cash in minutes, a few hard plastic chairs, laminated interest-rate sheets taped to the glass, harsh white fluorescent light, a worn floor and a security camera in the corner, the airless predatory brightness of a place that lends against desperation"),
    ("f6", "pawnshop", "Ломбард",
     "a small neighbourhood pawnshop, a locked glass display case of gold rings, chains and old watches under a hard strip light, a brass jeweller's scale and a loupe on the counter, a steel grille over a back door, a handwritten price board and a CCTV camera, scuffed painted walls and a single bare bulb, an armoured till, the cold transactional hush of a place where personal things become cash, dim amber light glinting on metal"),
    ("f7", "petropavlovsk_yard", "Двор и панельки (зима)",
     "a courtyard between grey Soviet-era panel apartment blocks in winter Petropavlovsk, dirty trampled snow, bare leafless birches, a rusted playground frame, parked cars under a thin crust of frost, rows of identical balconies with hanging frozen laundry and satellite dishes, a low overcast northern sky, sodium street lamps just flickering on, cold blue dusk, the bleak familiar stillness of a provincial residential block"),
    ("f8", "street_busstop", "Улица и остановка",
     "a wet winter street in provincial Petropavlovsk, a battered metal-and-glass bus shelter with a faded route sticker, a marshrutka minibus pulling up with steamed windows, a slushy pedestrian crossing, a small kiosk selling cigarettes and snacks, low Soviet-era shopfronts with mismatched signage, bare roadside trees, a flat grey sky, a few bundled-up pedestrians, the raw cold ordinariness of a northern town in the off-season"),
    ("f9", "stairwell_entrance", "Подъезд",
     "the entrance stairwell of a Soviet-era panel apartment block, a heavy metal door with an intercom panel, a dim flickering bulb, chipped painted walls covered in scratched notices and graffiti, a row of dented metal mailboxes, a bare concrete staircase with an iron railing, a worn rubber doormat, cold damp air, the claustrophobic grey threshold where unwelcome visitors wait, harsh shadow and stale light"),
    ("fa", "dasha_astana_flat", "Квартира Даши (Астана)",
     "a small modern rented apartment in Astana, clean minimalist furniture, a laptop and a ring-light on a tidy desk, a large window framing the cold glass towers of the capital skyline at dusk, neutral grey walls with a couple of framed prints, warm LED-strip lighting, a coffee mug and a phone on the desk, the crisp impersonal order of a young professional's life far from her mother's old provincial town"),
    ("fb", "astana_airport", "Аэропорт Астаны",
     "the arrivals hall of Astana international airport, a bright modern concourse of glass and steel, a large flight-information board, rows of linked seats, sliding glass doors to a cold tarmac, travellers with rolling luggage, a polished reflective floor, tall windows with grey winter light and parked planes beyond, the vast indifferent transit emptiness of a place where someone is waited for but never comes"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM locations WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: locations already exist for message."); return
        for suf, slug, name, desc in LOCS:
            lid = f"7e550000-0000-4000-8000-0000000000{suf}"
            cur.execute(
                'INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s, now(), now())',
                (lid, PROJ_ID, slug, name, desc),
            )
        conn.commit()
        print(f"OK seeded {len(LOCS)} locations:")
        for _, slug, _, desc in LOCS:
            print(f"  {slug:24s} {len(desc):4d} chars")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
