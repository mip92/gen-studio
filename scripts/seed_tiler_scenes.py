# -*- coding: utf-8 -*-
"""Seed SCENES (30 chapters) for project `tiler`. Idempotent."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e560000-0000-4000-8000-000000000001"

# sortOrder, sceneKey, title, actBeat, timeOfDay, paletteKey
SCENES = [
    (0,  "cold_open",          "Cold open — кирпичный завод, исповедь",        "setup",      "kiln_night_now",     "kiln_red_now"),
    (1,  "ch01_rishtan_before","Риштан до отъезда",                            "setup",      "rishtan_golden",     "rishtan_turquoise"),
    (2,  "ch02_heritage",      "Наследство мастерской",                        "setup",      "rishtan_day",        "rishtan_turquoise"),
    (3,  "ch03_moscow",        "Москва, рублёвские особняки",                  "rising",     "moscow_grey",        "moscow_grey_gold"),
    (4,  "ch04_client",        "Заказчик (завязка узнавания)",                 "rising",     "moscow_day",         "moscow_grey_gold"),
    (5,  "ch05_brigade",       "Бригада",                                      "rising",     "moscow_night",       "bytovka_dim"),
    (6,  "ch06_raid",          "Облава",                                       "rising",     "moscow_day",         "raid_cold"),
    (7,  "ch07_deal",          "Сделка: депортация или объект",                "rising",     "night",              "object_marble_cold"),
    (8,  "ch08_under_scope",   "Объект под прицелом",                          "rising",     "object_day",         "object_marble_cold"),
    (9,  "ch09_body",          "Тело мастера",                                 "rising",     "object_day",         "object_marble_cold"),
    (10, "ch10_craft",         "Ремесло и гордость",                           "rising",     "object_day",         "object_marble_cold"),
    (11, "ch11_signature",     "Тайная подпись",                               "rising",     "object_night",       "object_marble_cold"),
    (12, "ch12_glad",          "Он рад",                                       "rising",     "object_evening",     "object_marble_cold"),
    (13, "ch13_portuguese",    "«Португальские мастера»",                      "rising",     "object_day",         "object_marble_cold"),
    (14, "ch14_father",        "Отец (смерть по телефону)",                    "midpoint",   "object_night",       "object_marble_cold"),
    (15, "ch15_gena",          "Конфликт с Геной под прицелом",                "rising",     "object_day",         "object_marble_cold"),
    (16, "ch16_fountain",      "Фонтан изнутри",                               "rising",     "object_night",       "object_aqua_glow"),
    (17, "ch17_client_visit",  "Встреча с заказчиком",                         "rising",     "object_day",         "object_marble_cold"),
    (18, "ch18_overheard",     "Подслушанная сделка",                          "rising",     "object_night",       "object_aqua_glow"),
    (19, "ch19_debauchery",    "Грязное (намёком)",                            "rising",     "object_night",       "object_party_dark"),
    (20, "ch20_price",         "Цена человека (Шухрат)",                       "climax",     "object_day",         "object_marble_cold"),
    (21, "ch21_promise",       "Обещание большой зарплаты",                    "rising",     "object_evening",     "object_marble_cold"),
    (22, "ch22_desert",        "Пустыня (выстрел)",                            "climax",     "steppe_night",       "steppe_black"),
    (23, "ch23_alive",         "Он жив",                                       "climax",     "steppe_dawn",        "steppe_bleached"),
    (24, "ch24_road",          "Дорога через ничто",                           "rising",     "steppe_day",         "steppe_bleached"),
    (25, "ch25_pickup",        "«Спасение», которое хуже",                     "rising",     "highway_dusk",       "steppe_bleached"),
    (26, "ch26_factory",       "Завод (рабство)",                              "resolution", "kiln_day_now",       "kiln_red_now"),
    (27, "ch27_missing",       "Без вести (Риштан)",                           "resolution", "rishtan_day",        "rishtan_turquoise"),
    (28, "ch28_echo",          "Эхо дворца",                                   "resolution", "kiln_night_now",     "kiln_red_now"),
    (29, "ch29_finale",        "Финал у печи",                                 "resolution", "kiln_night_now",     "kiln_red_now"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM scenes WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: scenes already exist for tiler."); return
        for order, key, title, beat, tod, pal in SCENES:
            sid = f"7e560000-0000-4000-8000-000000000e{order:02x}"
            cur.execute(
                'INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder",'
                '"defaultReferenceProfileCode","actBeat","defaultTimeOfDay","defaultPaletteKey","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (sid, PROJ_ID, key, title, order, "BAKHTI_BASE", beat, tod, pal),
            )
        conn.commit()
        print(f"OK seeded {len(SCENES)} scenes for tiler:")
        for order, key, title, beat, *_ in SCENES:
            print(f"  {order:2d} {key:20s} {beat:11s} {title}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
