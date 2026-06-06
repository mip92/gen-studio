# -*- coding: utf-8 -*-
"""Seed SCENES (39: cold_open + 37 chapters + outro) for project `wall`. Idempotent."""
import sys, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e580000-0000-4000-8000-000000000001"

# order, sceneKey, title, actBeat, timeOfDay, paletteKey, defaultRefProfile
SCENES = [
 (0,  "cold_open",          "Холодный пролог — объединённый Берлин, одна", "setup",      "old_now",   "eldritch_grey", "HEROINE_OLD"),
 (1,  "ch01_birth",         "Рождение — Восточный Берлин 1953",            "setup",      "gdr_day",   "gdr_grey",      "HEROINE_YOUNG"),
 (2,  "ch02_cold_father",   "Холодный отец — тепла нет",                   "setup",      "gdr_eve",   "gdr_grey",      "HEROINE_YOUNG"),
 (3,  "ch03_wall_1961",     "1961 — Стену возводят, отец на той стороне",  "setup",      "gdr_day",   "wall_concrete", "HEROINE_YOUNG"),
 (4,  "ch04_shadow_wall",   "Детство в тени Стены",                        "setup",      "gdr_day",   "wall_concrete", "HEROINE_YOUNG"),
 (5,  "ch05_first_gaze",    "Первый мужской взгляд — тёплая волна",        "rising",     "gdr_day",   "gdr_warm",      "HEROINE_YOUNG"),
 (6,  "ch06_fdj_power",     "Школа и FDJ — власть над парнями",            "rising",     "gdr_day",   "gdr_warm",      "HEROINE_YOUNG"),
 (7,  "ch07_first_time",    "Первый раз — приход",                         "rising",     "night",     "gdr_night",     "HEROINE_YOUNG"),
 (8,  "ch08_chase_begins",  "Юность — погоня начинается",                  "rising",     "night",     "neon_gdr",      "HEROINE_YOUNG"),
 (9,  "ch09_factory",       "Завод и общежитие — много мужчин",            "rising",     "gdr_day",   "gdr_grey",      "HEROINE_YOUNG"),
 (10, "ch10_cant_be_alone", "Не можешь быть одна",                         "rising",     "night",     "gdr_night",     "HEROINE_YOUNG"),
 (11, "ch11_rumors",        "Слухи — репутация в тесном мире ГДР",         "rising",     "gdr_day",   "gdr_grey",      "HEROINE_YOUNG"),
 (12, "ch12_andreas",       "Андреас — он видит тебя настоящую",           "rising",     "gdr_eve",   "gdr_warm",      "HEROINE_YOUNG"),
 (13, "ch13_real_love",     "Настоящая любовь — тепло, не волна",          "rising",     "gdr_eve",   "warm_home",     "HEROINE_YOUNG"),
 (14, "ch14_he_wants_future","Он хочет будущее — замуж, на Запад вместе",  "rising",     "gdr_eve",   "warm_home",     "HEROINE_YOUNG"),
 (15, "ch15_cant_stay",     "Ты не можешь остаться — стена внутри",        "rising",     "night",     "gdr_night",     "HEROINE_YOUNG"),
 (16, "ch16_betrayal",      "Измена — бежишь к новой дозе",                "climax",     "night",     "neon_gdr",      "HEROINE_YOUNG"),
 (17, "ch17_andreas_leaves","Андреас уходит — оставляет ключ",             "climax",     "gdr_eve",   "cold_blue",     "HEROINE_YOUNG"),
 (18, "ch18_justify",       "Оправдание — я свободна",                     "rising",     "gdr_day",   "gdr_grey",      "HEROINE_YOUNG"),
 (19, "ch19_escalation",    "Эскалация — пустее и быстрее",                "rising",     "night",     "neon_gdr",      "HEROINE_YOUNG"),
 (20, "ch20_empty_morning", "Пустое утро — пустая подушка, стыд",          "rising",     "dawn",      "cold_blue",     "HEROINE_YOUNG"),
 (21, "ch21_the_price",     "Цена — последствия, досье Штази",             "rising",     "gdr_day",   "cold_blue",     "HEROINE_YOUNG"),
 (22, "ch22_eighties",      "Восьмидесятые — доза не работает",            "rising",     "night",     "gdr_night",     "HEROINE_YOUNG"),
 (23, "ch23_wall_falls",    "1989 — Стена падает, эйфория",                "midpoint",   "night",     "wall_fall",     "HEROINE_YOUNG"),
 (24, "ch24_freedom_strangers","Свобода = больше чужих, своя стена стоит", "rising",     "night",     "neon_west",     "HEROINE_YOUNG"),
 (25, "ch25_nineties",      "Девяностые — новый мир, но ты стареешь",      "rising",     "day",       "west_day",      "HEROINE_MID"),
 (26, "ch26_first_lines",   "Первые морщины — желание иссякает",           "rising",     "day",       "cold_day",      "HEROINE_MID"),
 (27, "ch27_young_win",     "Молодые побеждают — взгляды уходят",          "rising",     "night",     "neon_west",     "HEROINE_MID"),
 (28, "ch28_discarded",     "Тебя бросают, как бросала ты",                "rising",     "night",     "cold_blue",     "HEROINE_MID"),
 (29, "ch29_alone_berlin",  "Одна в новом Берлине",                        "resolution", "day",       "west_day",      "HEROINE_MID"),
 (30, "ch30_meets_past",    "Встреча с прошлым — Андреас с семьёй",        "resolution", "day",       "west_day",      "HEROINE_MID"),
 (31, "ch31_what_lost",     "Что ты потеряла",                             "resolution", "eve",       "cold_blue",     "HEROINE_MID"),
 (32, "ch32_try_connect",   "Попытка сблизиться — разучилась",             "resolution", "night",     "cold_blue",     "HEROINE_MID"),
 (33, "ch33_old_creeps",    "Старость подступает",                         "resolution", "day",       "eldritch_grey", "HEROINE_OLD"),
 (34, "ch34_empty_flat",    "Пустая квартира — вторая подушка пуста",      "resolution", "day",       "eldritch_grey", "HEROINE_OLD"),
 (35, "ch35_east_side_gallery","East Side Gallery — у обломка Стены",      "resolution", "day",       "wall_fall",     "HEROINE_OLD"),
 (36, "ch36_realization",   "Осознание — гналась за желанной, не любимой", "resolution", "eve",       "eldritch_grey", "HEROINE_OLD"),
 (37, "ch37_finale",        "Финал — ключ Андреаса, поздняя правда",       "resolution", "eve",       "warm_dim",      "HEROINE_OLD"),
 (38, "outro_cta",          "Аутро — кода, подписка, дисклеймер",          "resolution", "old_now",   "eldritch_grey", "HEROINE_OLD"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM scenes WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: scenes already exist for wall."); return
        for order, key, title, beat, tod, pal, ref in SCENES:
            sid = f"7e580000-0000-4000-8000-000000000e{order:02x}"
            cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder",'
                '"defaultReferenceProfileCode","actBeat","defaultTimeOfDay","defaultPaletteKey","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (sid, PROJ_ID, key, title, order, ref, beat, tod, pal))
        conn.commit()
        print(f"OK seeded {len(SCENES)} scenes for wall (cold_open + 37 chapters + outro)")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
