# -*- coding: utf-8 -*-
"""Seed SCENES (acts) for project `message`. Idempotent: skips if scenes exist."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e550000-0000-4000-8000-000000000001"

# sortOrder, idSuffix, sceneKey, title, actBeat, timeOfDay, paletteKey
SCENES = [
    (0,  "e0", "cold_open",          "Cold open — палец над «Перевести 350 000 ₸»", "setup",      "march_night_2026",      "COLD_OPEN_kitchen_glow"),
    (1,  "e1", "act_01_silence",     "A1 — Тишина (исток одиночества)",             "setup",      "autumn_evening_2025",   "A1_empty_apartment"),
    (2,  "e2", "act_02_acquaintance","A2 — Знакомство (Виктор пишет)",              "rising",     "autumn_night_2025",     "A2_screen_glow"),
    (3,  "e3", "act_03_first_request","A3 — Первая просьба (5 000 ₸)",              "rising",     "winter_evening_2025",   "A3_warm_hope"),
    (4,  "e4", "act_04_first_transfer","A4 — Первый перевод (350 000 ₸)",          "rising",     "winter_night_2025",     "A4_bank_cold"),
    (5,  "e5", "act_05_credit_quarrel","A5 — Кредит и ссора с дочерью",            "rising",     "winter_night_2026",     "A5_kaspi_red"),
    (6,  "e6", "act_06_pawn_mfo",    "A6 — Ломбард и микрозаймы",                   "rising",     "late_winter_day_2026",  "A6_pawn_amber"),
    (7,  "e7", "act_07_debt_pit",    "A7 — Долговая яма, коллекторы",               "rising",     "early_spring_grey_2026","A7_debt_grey"),
    (8,  "e8", "act_08_no_return",   "A8 — Точка невозврата (Даша, реверс-поиск)",  "midpoint",   "spring_day_2026",       "A8_daylight_truth"),
    (9,  "e9", "act_09_catastrophe", "A9 — Катастрофа (последний перевод, тишина)", "climax",     "spring_night_2026",     "A9_silence_dark"),
    (10, "ea", "act_10_aftermath",   "A10 — После (месяцы спустя)",                 "resolution", "summer_overcast_2026",  "A10_hollow_grey"),
    (11, "eb", "coda",               "Кода — четвёртая стена + дисклеймер",         "resolution", "summer_overcast_2026",  "CODA_grey"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM scenes WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: scenes already exist for message — nothing seeded."); return
        for order, suf, key, title, beat, tod, pal in SCENES:
            sid = f"7e550000-0000-4000-8000-0000000000{suf}"
            cur.execute(
                'INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder",'
                '"defaultReferenceProfileCode","actBeat","defaultTimeOfDay","defaultPaletteKey","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (sid, PROJ_ID, key, title, order, "IRINA_BASE", beat, tod, pal),
            )
        conn.commit()
        print(f"OK seeded {len(SCENES)} scenes for message:")
        for order, suf, key, title, beat, *_ in SCENES:
            print(f"  {order:2d} {key:22s} {beat:11s} {title}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e)); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
