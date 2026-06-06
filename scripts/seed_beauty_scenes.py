# -*- coding: utf-8 -*-
"""Seed SCENES (30, childhood->old age) for project `beauty`. Idempotent."""
import sys, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e570000-0000-4000-8000-000000000001"

# order, sceneKey, title, actBeat, timeOfDay, paletteKey, defaultRefProfile
SCENES = [
 (0,  "cold_open",         "Cold open — старость, завешенные зеркала", "setup",      "old_now",       "old_grey",      "HEROINE_OLD"),
 (1,  "ch01_birth",        "Роддом и детство — «какая красавица»",     "setup",      "sepia_70s",     "sepia_warm",    "HEROINE_YOUNG"),
 (2,  "ch02_lesson",       "Урок матери — лицо как приданое",          "setup",      "sepia_70s",     "sepia_warm",    "HEROINE_YOUNG"),
 (3,  "ch03_school",       "Школа — первая красавица",                 "setup",      "sepia_80s",     "sepia_warm",    "HEROINE_YOUNG"),
 (4,  "ch04_youth_90s",    "Юность 90-х — красота как валюта",         "rising",     "neon_90s",      "neon_glam",     "HEROINE_YOUNG"),
 (5,  "ch05_first_rival",  "Первая соперница",                         "rising",     "neon_90s",      "neon_glam",     "HEROINE_YOUNG"),
 (6,  "ch06_wedding",      "Свадьба — триумф красоты",                 "rising",     "warm_day",      "warm_wedding",  "HEROINE_YOUNG"),
 (7,  "ch07_young_wife",   "Молодая жена — держишь красотой",          "rising",     "warm_eve",      "warm_home",     "HEROINE_YOUNG"),
 (8,  "ch08_daughter",     "Рождение дочери — первый ужас тела",       "rising",     "warm_day",      "warm_home",     "HEROINE_YOUNG"),
 (9,  "ch09_first_wrinkle","30 — первая морщинка",                     "rising",     "cold_day",      "bathroom_cold", "HEROINE_YOUNG"),
 (10, "ch10_friends_age",  "Подруги стареют — я не буду как они",      "rising",     "muted_day",     "muted_grey",    "HEROINE_YOUNG"),
 (11, "ch11_first_inject", "Первый укол (40) — Алина",                 "rising",     "clinic_day",    "clinic_white",  "HEROINE_MID"),
 (12, "ch12_gaze_returns", "Взгляды вернулись — крючок",               "rising",     "neon_eve",      "neon_glam",     "HEROINE_MID"),
 (13, "ch13_fillers",      "Филлеры — ещё чуть-чуть",                  "rising",     "clinic_day",    "clinic_white",  "HEROINE_MID"),
 (14, "ch14_credit",       "Кредит на себя — первая ложь",             "rising",     "office_day",    "mfo_cold",      "HEROINE_MID"),
 (15, "ch15_daughter_teen","Дочь-подросток — давишь внешностью",       "rising",     "home_eve",      "warm_home",     "HEROINE_MID"),
 (16, "ch16_mask_grows",   "Маска нарастает — зеркало льстит",         "rising",     "mirror_day",    "mirror_cold",   "HEROINE_MID"),
 (17, "ch17_husband_cold", "Муж охладел — колешь ещё",                 "rising",     "home_night",    "home_cold",     "HEROINE_MID"),
 (18, "ch18_surgery",      "Операция — верну его",                     "rising",     "clinic_day",    "operating",     "HEROINE_MID"),
 (19, "ch19_debt",         "Долги и займы",                            "rising",     "office_day",    "mfo_cold",      "HEROINE_MID"),
 (20, "ch20_rival",        "Соперница — он ушёл к молодой",            "midpoint",   "restaurant_eve","neon_cold",     "HEROINE_MID"),
 (21, "ch21_double_down",  "Удвоить ставку — назло",                   "rising",     "clinic_day",    "clinic_white",  "HEROINE_MID"),
 (22, "ch22_catastrophe",  "Катастрофа — лицо застыло",                "climax",     "clinic_night",  "operating",     "HEROINE_OLD"),
 (23, "ch23_daughter_cuts","Дочь рвёт связь",                          "climax",     "home_day",      "home_cold",     "HEROINE_OLD"),
 (24, "ch24_mirrors_lie",  "Зеркала врут — фото без фильтра",          "rising",     "cafe_day",      "cold_day",      "HEROINE_OLD"),
 (25, "ch25_alone",        "Одна — отражение пугает",                  "resolution", "home_night",    "old_grey",      "HEROINE_OLD"),
 (26, "ch26_covered",      "Зеркала под простынёй",                    "resolution", "old_now",       "old_grey",      "HEROINE_OLD"),
 (27, "ch27_old_age",      "Старость — жизнь прошла мимо",             "resolution", "old_now",       "old_grey",      "HEROINE_OLD"),
 (28, "ch28_granddaughter","Внучка — по привычке оценить личико",      "resolution", "home_day",      "warm_home",     "HEROINE_OLD"),
 (29, "ch29_finale",       "Финал — зеркало к стене",                  "resolution", "home_day",      "warm_home",     "HEROINE_OLD"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM scenes WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: scenes already exist for beauty."); return
        for order, key, title, beat, tod, pal, ref in SCENES:
            sid = f"7e570000-0000-4000-8000-000000000e{order:02x}"
            cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder",'
                '"defaultReferenceProfileCode","actBeat","defaultTimeOfDay","defaultPaletteKey","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (sid, PROJ_ID, key, title, order, ref, beat, tod, pal))
        conn.commit()
        print(f"OK seeded {len(SCENES)} scenes for beauty:")
        for order, key, title, beat, _, _, ref in SCENES:
            print(f"  {order:2d} {key:20s} {ref:13s} {title}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
