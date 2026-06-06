# -*- coding: utf-8 -*-
"""Seed LOCATIONS for project `tiler`. Idempotent. Descriptions: EN space-only, no people, no style tokens."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e560000-0000-4000-8000-000000000001"

# suffix, slug, name(RU), description(EN)
LOCS = [
    ("f00", "kiln_factory", "Кирпичный завод (Дагестан, «сейчас»)",
     "the interior of a grim illegal brick-making factory in the Dagestan lowlands, rows of raw clay bricks drying on wooden pallets, a huge soot-blackened kiln with a glowing orange mouth radiating heat haze, mounds of red-ochre clay and puddles of grey slurry, a battered wheelbarrow and bent shovels, a low corrugated-iron shed with a single bare bulb and filthy bunk planks, a high blank brick wall topped with wire beyond the yard, everything coated in fine red dust, the choking suffocating heat and hopeless enclosed stillness of a place no one leaves"),
    ("f01", "rishtan_yard", "Двор и мастерская в Риштане",
     "a traditional Uzbek potter's courtyard in Rishtan in the Fergana Valley, a wood-fired ceramic kiln of mud brick, shelves of drying turquoise and cobalt glazed bowls and tiles, a low clay worktable scattered with brushes and pigment jars, a gnarled mulberry tree shading a raised wooden tapchan platform with cushions, whitewashed walls with a carved wooden door, washing on a line, warm dust dancing in low golden afternoon light, the intimate sunbaked calm of a family workshop passed down for generations"),
    ("f02", "samarkand_domes", "Купола Самарканда (флэшбек)",
     "the great turquoise ribbed domes and towering tiled portals of Samarkand at dusk, vast iwan arches faced with intricate cobalt and turquoise majolica mosaic, geometric and floral tilework glowing against a deepening violet sky, the silhouette of minarets, worn brick courtyards below, a hush of ancient grandeur, the proud aching beauty of a craft a thousand years old seen as a memory"),
    ("f03", "moscow_mansion", "Рублёвский особняк (интерьер)",
     "the lavish interior of a brand-new three-storey Rublyovka mansion of the Russian nouveau riche, a sweeping marble staircase with a gilded balustrade, vast empty halls of polished beige and white marble, an unfinished hammam steam room clad in mosaic, oversized chandeliers in dust sheets, floor-to-ceiling windows looking onto a snowy gated estate, cold glossy opulence with no warmth, the echoing emptiness of money without a soul"),
    ("f04", "moscow_street", "Улица Москвы (B-roll, зима)",
     "a grey wet winter Moscow street, dense traffic and slush, towering glossy billboards advertising luxury watches and apartments, dirty snowbanks along the kerb, a crowded metro entrance breathing steam, bare trees and overcast low sky, anonymous concrete and glass, the cold indifferent churn of the capital seen by someone who is only passing through it"),
    ("f05", "bytovka", "Бытовка рабочих",
     "a cramped temporary workers' cabin (bytovka) on a construction site, a metal container room with three tiers of bunk beds and thin stained mattresses, a single bare bulb, a small gas ring with a battered communal kazan pot, work boots and dusty jackets on nails, a calendar and a few family photos taped to the wall, condensation on the small window, the close stale brotherhood of men far from home"),
    ("f06", "migration_office", "Миграционное отделение",
     "a bleak Russian migration police holding room, scuffed institutional walls in pale green, a barred holding cage with a wooden bench crammed against it, a metal desk with a desk lamp and stacks of documents, a wall poster of regulations, flickering fluorescent tubes, a heavy locked door with a small window, cold linoleum, the airless dread of a place where a stamped paper decides a life"),
    ("f07", "object_exterior", "Объект — стройка на мысу",
     "a colossal secret palace construction site on a cliff cape above the Black Sea, sprawling scaffolding clinging to a vast pale stone facade, tower cranes against a hazy sky, a perimeter of high fences, watchtowers and floodlight masts, a helipad cut into the slope, the grey sea and distant mist beyond the headland, stacks of crated Italian marble under tarpaulins, the inhuman fortress scale of a project built like a state secret"),
    ("f08", "object_marble_hall", "Мраморный зал дворца",
     "an immense palace hall under construction, perfectly symmetrical, faced floor to ceiling in veined white and gold Italian marble, towering fluted columns, a coffered gilded ceiling, a sweeping double staircase, crystal chandeliers half-wrapped, a polished mirror-like marble floor laid in an intricate geometric star pattern, scaffolding and dust sheets at the edges, blinding cold luxurious glare, the breathtaking soulless perfection of obscene wealth"),
    ("f09", "object_aquadisco", "Аквадискотека",
     "a vast underground entertainment hall built around a sunken swimming pool, glossy black and gold tiled walls, a mirrored ceiling, a built-in nightclub dance area with coloured programmable lights and a hookah lounge, brass poles and plush low seating around the water, recessed neon strips reflecting in the still pool, an absurd subterranean pleasure cavern, the gaudy decadent hush of a private club waiting for a party"),
    ("f0a", "object_fountain", "Фонтаны и террасы над морем",
     "grand ornamental terraces of the palace overlooking the sea, tiered stone fountains and reflecting pools with carved basins, manicured cypress and marble balustrades, sweeping steps descending toward the cliff edge, jets of water catching the light, the vast blue sea horizon beyond, sun glinting on wet stone, the staged theatrical grandeur of fountains built purely to be admired"),
    ("f0b", "object_machinery", "Машинерия фонтана (нутро)",
     "the hidden underground machine room beneath the palace fountains, a cathedral-like vault of massive steel pipes, valves and humming pumps, control panels with blinking indicators, banks of coloured-light projectors and submerged nozzles, cables snaking across a damp concrete floor, dim utility lighting and dripping condensation, the surprising industrial complexity hidden to make water dance on command"),
    ("f0c", "object_party_hall", "Верхний зал (вечеринка)",
     "an opulent upper salon of the palace at night during a private party, low golden lighting, marble and gilt, a long table with bottles of champagne, crystal glasses and silver, plush sofas, a glass coffee table, heavy velvet drapes half-drawn, scattered remnants of a lavish night, the warm blurred decadent gloom glimpsed through a doorway, the morning-after wreckage of excess"),
    ("f0d", "steppe", "Степь / полупустыня",
     "a vast empty semi-arid steppe at the edge of the desert, cracked sun-baked earth and dry tufted grass to a flat distant horizon, scattered scrub and a lone telephone pole, an enormous indifferent sky bleeding from black night to bleached white day, shimmering heat haze, no shelter and no water anywhere, the crushing isolating emptiness where a человек is a single tiny speck"),
    ("f0e", "highway", "Трасса",
     "a lonely two-lane intercity highway cutting across empty southern Russian flatland, a faded centre line and a battered roadside kilometre marker, dry verge grass, a single set of approaching headlights at dusk, telegraph wires sagging into the distance, a low dusty horizon, the desperate thin hope of a road where one passing car decides everything"),
    ("f0f", "rishtan_house", "Достроенный дом в Риштане",
     "a finished modest new family house in Rishtan built with years of migrant remittances, fresh plastered walls and a tiled blue gate, a small courtyard with a young fruit tree and a half-built little fountain basin, neat brickwork, a satellite dish, the Fergana hills in warm distance, a quiet bittersweet pride hanging over a home built by someone who is not there to live in it"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM locations WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: locations already exist for tiler."); return
        for suf, slug, name, desc in LOCS:
            lid = f"7e560000-0000-4000-8000-000000000{suf}"
            cur.execute(
                'INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s, now(), now())',
                (lid, PROJ_ID, slug, name, desc),
            )
        conn.commit()
        print(f"OK seeded {len(LOCS)} locations for tiler:")
        for _, slug, _, desc in LOCS:
            print(f"  {slug:20s} {len(desc):4d} chars")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
