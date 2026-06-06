# -*- coding: utf-8 -*-
"""Seed LOCATIONS (20) for project `wall` — East Berlin / GDR, Cold-War noir. Idempotent.
Descriptions English (CLIP). Non-explicit throughout."""
import sys, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e580000-0000-4000-8000-000000000001"

# slug -> (name, description)  ; slug also keys the engine LOC dict (f-region suffix below)
LOCS = [
 ("old_flat", "Старая квартира (объединённый Берлин)",
  "a small dim apartment in reunified Berlin in the present day, faded wallpaper, an old bed with one untouched empty pillow on the far side, a few yellowed photographs, a single curtained window with grey light, worn furniture, the still hollow loneliness of a woman who ended up alone"),
 ("childhood_flat", "Детская квартира (Восточный Берлин 1950е)",
  "a cramped 1950s East Berlin communal apartment, peeling walls, a coal stove, plain heavy furniture, a small framed portrait, a cold orderly kitchen, dim daylight through net curtains, the joyless austerity of an early GDR home with no warmth"),
 ("courtyard", "Двор-колодец (Hinterhof)",
  "a grey Berlin tenement back-courtyard, a Hinterhof, soot-stained brick walls rising on all sides, beaten carpet rails, puddles on cracked cobbles, a single bare tree, washing lines, overcast Cold-War gloom"),
 ("the_wall", "Берлинская стена (полоса смерти)",
  "the Berlin Wall, a tall raw concrete barrier topped with a smooth pipe, a wide raked death strip behind it, a guard watchtower, floodlights and barbed wire, grey sky, the oppressive divided silence of a city cut in two"),
 ("checkpoint", "Пограничный КПП",
  "a stark East German border checkpoint, a striped barrier, a glass guard booth, harsh floodlights, concrete bollards and signage, uniformed silhouettes, the tense controlled threshold between two worlds"),
 ("school", "Школа / FDJ",
  "a late-1960s East German school hall and classroom, blue FDJ youth banners, rows of plain desks, tall windows, a portrait on the wall, scuffed parquet, pale institutional light, the regimented social arena where a striking girl first feels her power"),
 ("factory", "Завод (VEB)",
  "a socialist state factory floor, rows of machines, fluorescent strip lights, concrete pillars, propaganda banners about labour, oil-stained floors, grey overalls on hooks, the drab collective workplace of GDR daily life"),
 ("dormitory", "Рабочее общежитие",
  "a spartan workers' dormitory room in the GDR, a narrow iron bed, a shared sink, a single bulb, cheap curtains, a chair with clothes, thin walls, the transient impersonal space of young workers living close together"),
 ("kneipe", "Пивная (Kneipe)",
  "a smoky low-lit East Berlin pub, a Kneipe, dark wood booths, a beer tap, cigarette haze under a single hanging lamp, mismatched chairs, condensation on the windows, the dim nocturnal haunt where strangers' eyes meet"),
 ("disco", "Дискотека ГДР",
  "a dim GDR youth dancehall, coloured bulbs and a mirror ball scattering weak light, a crowded floor of silhouettes, a cheap sound system, smoke and sweat, the gaudy restless nightlife of the East where the chase plays out"),
 ("her_room", "Её комната (постель)",
  "a modest bedroom with a rumpled bed, a bedside lamp, an ashtray, a window with thin curtains, the far side of the bed always empty and cold, clothes draped on a chair, the intimate lonely stage of a morning after, non-explicit"),
 ("andreas_flat", "Квартира Андреаса",
  "a modest warm GDR bachelor flat, a drafting table with rolled plans, bookshelves, a kettle, a worn but tidy room, soft lamplight, a spare door key left on the table as a quiet token, the only place that ever felt like home"),
 ("street_east", "Улица Восточного Берлина",
  "a grey East Berlin street, Plattenbau panel blocks, a parked Trabant, sparse shop signage, empty wide pavements, tram lines, washed-out Cold-War daylight, the muted public world of the GDR"),
 ("stasi_office", "Кабинет Штази",
  "a cold East German state-security office, a bare desk, a typewriter and a buff personnel file folder, a hard chair under a single lamp, a portrait on the grey wall, net-curtained window, the airless bureaucratic dread of being watched and judged"),
 ("clinic", "Поликлиника ГДР",
  "a sterile GDR state clinic room, pale green tiles, a metal examination couch, an enamel tray, a frosted window, harsh clinical light, a folded paper gown, the cold impersonal hush of an unwanted consequence faced alone, non-explicit"),
 ("wall_fall", "Падение Стены 1989",
  "the Berlin Wall in November 1989, crowds of silhouettes on and around the concrete, hammers and chisels chipping the graffiti-covered slabs, floodlights and flares, jubilant chaos, the historic night a barrier finally breaks open"),
 ("street_west", "Улица Запада / объединённый Берлин 90е",
  "a bright reunified Berlin street in the 1990s, neon shop signs and western advertising, busy traffic, glass storefronts, a flood of colour after grey decades, the dizzying new world of consumer freedom"),
 ("cafe_west", "Кафе/бар объединённого Берлина",
  "a modern reunified Berlin cafe-bar at night, warm hanging lamps, a polished counter with bottles, small tables, a mirror behind the bar, low chatter, the new-era social place where an aging woman keeps chasing fading glances"),
 ("east_side_gallery", "East Side Gallery (обломок Стены)",
  "the East Side Gallery in present-day Berlin, a long surviving stretch of the Wall covered in famous murals, a riverside path, a bench, passers-by, soft daylight, the painted scar of history that outlived the people it divided"),
 ("park", "Берлинский парк (времена года)",
  "a quiet Berlin city park with a bench and a row of trees marking the changing seasons, bare or green or yellow leaves across the years, a grey pond, empty paths, soft natural light, a still atmospheric marker of time sliding by, no people"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM locations WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: locations already exist for wall."); return
        for i, (slug, name, desc) in enumerate(LOCS, start=1):
            lid = f"7e580000-0000-4000-8000-000000000f{i:02x}"
            cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s, now(), now())', (lid, PROJ_ID, slug, name, desc))
        conn.commit()
        print(f"OK seeded {len(LOCS)} locations for wall")
        for i,(slug,name,desc) in enumerate(LOCS,1): print(f"  f{i:02x} {slug:18s} {len(desc)}ch")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
