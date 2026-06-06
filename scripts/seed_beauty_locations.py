# -*- coding: utf-8 -*-
"""Seed LOCATIONS for project `beauty` (EN, no people, no style tokens). Idempotent."""
import sys, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e570000-0000-4000-8000-000000000001"

LOCS = [
 ("f00","old_flat","Старая квартира (завешенные зеркала)",
  "a dim cluttered old apartment of an aging woman, heavy dust-sheets draped over every mirror and the wardrobe glass, faded floral wallpaper, an old vanity table with bottles of dried-up serums and an antique powder compact, a single curtained window with grey daylight, yellowed lace, a covered hallway mirror, the airless still loneliness of someone who can no longer face her own reflection"),
 ("f01","mother_flat","Квартира матери (трюмо, 70-80е)",
  "a tidy Soviet-era apartment of the 1970s, a grand dark-wood vanity dresser with a triple mirror and a velvet stool, neat rows of powder, lipstick and perfume bottles, a crystal chandelier, patterned wallpaper, a lace runner, a framed glamour photo on the wall, warm sepia lamplight, the prim vain elegance of a mother who worships appearances"),
 ("f02","school","Советская школа",
  "a late-Soviet secondary-school corridor and classroom, scuffed parquet, tall windows with white frames, a green chalkboard, rows of wooden desks, a long mirror by the cloakroom where girls primp, pale institutional green walls, soft afternoon light, the charged social air where a pretty girl already rules"),
 ("f03","street_90s","Улица/двор 90-х",
  "a gritty 1990s post-Soviet city street, kiosks and faded shop signs, a battered tonied car, cracked pavement, a crowd in cheap bright fashion, grey panel blocks behind, harsh daylight, the raw hungry energy of the decade where a beautiful face opened doors"),
 ("f04","disco_90s","Кафе/дискотека 90-х",
  "a smoky 1990s nightclub and cafe, mirrored disco ball scattering coloured light, neon signage, cheap velvet booths, a bar with imported bottles, cigarette haze, a dance floor, glossy reflective surfaces everywhere, the gaudy glamour of the era, decadent and electric"),
 ("f05","wedding","Свадебный зал",
  "a 1990s wedding banquet hall, long tables with white cloths and champagne, balloons and tulle, a parquet dance floor, warm chandelier light, a tiered cake, ribbons on chairs, celebratory and bright, the triumphant warmth of a wedding day"),
 ("f06","family_flat","Семейная квартира",
  "a modest comfortable family apartment of the 2000s, a sofa with cushions, a glass cabinet, family photos on the wall, a kitchen doorway, a child's toys in a corner, warm domestic lamplight, the lived-in everyday warmth that slowly cools"),
 ("f07","maternity","Роддом",
  "a clean clinical maternity ward, a metal bed with white linens, a swaddled newborn in a bassinet, pale tiled walls, a window with soft daylight, an IV stand, the tender exhausted hush of new motherhood"),
 ("f08","bathroom","Ванная (зеркало)",
  "a small home bathroom, a wide mirror over the sink under a bright cold bulb, jars of creams and a magnifying mirror on the shelf, white tiles, a towel, harsh unflattering light, the private cruel honesty of a face examined too closely"),
 ("f09","clinic","Клиника красоты (кабинет Алины)",
  "a sleek modern cosmetology clinic room, a reclining treatment chair, a tray of filler syringes and vials, a large ring-lit mirror, glossy white surfaces, soft track lighting, before-and-after posters, antiseptic and immaculate, the seductive cold promise of youth for sale"),
 ("f0a","restaurant","Ресторан",
  "an upscale restaurant interior at night, white-clothed tables, candlelight and wine glasses, dark polished wood, a large gilt mirror on the wall, soft jazz ambiance, elegant and cold, the stage where a marriage quietly ends"),
 ("f0b","mfo","Офис микрозаймов",
  "a cheap microloan office in a shopping arcade, a plastic counter and card terminal, bright backlit signage promising fast cash, hard plastic chairs, laminated interest sheets on the glass, harsh fluorescent light, the airless predatory brightness of borrowing against vanity"),
 ("f0c","operating","Операционная / палата",
  "a cosmetic-surgery operating room and recovery, a steel table under a bright surgical lamp, monitors and trays of instruments, then a recovery bed with a face wrapped in white bandages and an ice pack, sterile pale-blue tiles, the cold antiseptic dread of going under the knife"),
 ("f0d","daughter_flat","Квартира дочери",
  "a small modern minimalist apartment of a young woman, plants on the sill, books, a laptop, simple unfussy furniture, bare honest daylight from a wide window, no mirrors fussed over, the calm grounded warmth of a life lived outside the cult of looks"),
 ("f0e","park","Парк / окно (сезоны)",
  "a quiet city park bench by a window of changing seasons, bare or blossoming or yellowing trees marking the passing years, a grey pond, empty paths, soft natural light, atmospheric and still, a marker of time sliding by, no people"),
 ("f0f","cafe","Кафе",
  "an ordinary modern cafe, small tables, a counter with pastries, large windows, a phone lying on a table showing an unflattering candid photo, warm neutral light, the casual public place where an illusion shatters"),
 ("f10","cosmetics_shop","Магазин косметики / витрина",
  "a bright cosmetics store and lit display window, shelves of creams, serums and anti-age products, glossy ads of flawless young faces, mirrors, polished counters, seductive retail lighting, the relentless marketed promise of staying young, no people"),
 ("f11","stairwell","Подъезд / прихожая",
  "a Soviet-era apartment block stairwell and a home hallway with a large mirror and a coat rack, a dim flickering bulb, chipped painted walls, a worn doormat, the threshold space where she checks her face before facing the world"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM locations WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: locations already exist for beauty."); return
        for suf, slug, name, desc in LOCS:
            lid = f"7e570000-0000-4000-8000-000000000{suf}"
            cur.execute('INSERT INTO locations (id,"projectId",slug,name,description,"createdAt","updatedAt") '
                        'VALUES (%s,%s,%s,%s,%s, now(), now())', (lid, PROJ_ID, slug, name, desc))
        conn.commit()
        print(f"OK seeded {len(LOCS)} locations for beauty:")
        for _, slug, _, desc in LOCS: print(f"  {slug:16s} {len(desc):4d} chars")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
