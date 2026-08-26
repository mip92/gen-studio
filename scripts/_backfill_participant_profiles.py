# -*- coding: utf-8 -*-
"""Дозаполнить shot_participants.profileId там, где он пуст, а у персонажа
состояние РОВНО ОДНО.

Зачем: инвариант «у своего кадра свой профиль». Пока где-то пусто, движку нужен
фоллбэк `sp.profile ?? sp.character.profiles[0]`, а `profiles` грузится без
orderBy — то есть у персонажа с несколькими состояниями (фингал, двадцать лет
спустя) отрендерится то, которое Postgres вернул первым. Аудит 2026-08-26: во
всей базе 16 таких строк из 7865, все у персонажей с ОДНИМ состоянием, все в двух
опубликованных Track A фильмах.

Поэтому запись не может изменить ни один рендер: назначается ровно тот профиль,
который фоллбэк и так брал, — просто теперь это написано, а не угадывается.
Строки с персонажем, у которого состояний несколько, скрипт НЕ трогает: там
выбор авторский, и его должен сделать человек.

    python scripts/_backfill_participant_profiles.py            # показать
    python scripts/_backfill_participant_profiles.py --apply
"""
import os
import sys

import psycopg2

sys.stdout.reconfigure(encoding="utf-8")
DSN = os.environ.get("DATABASE_URL",
                     "postgresql://gen_studio:gen_studio@localhost:5432/gen_studio")

FIND = """
SELECT p.slug, s."shotCode", c.code, sp.id, one.id AS profile_id, one."profileCode"
FROM shot_participants sp
JOIN shots     s ON s.id = sp."shotId"
JOIN projects  p ON p.id = s."projectId"
JOIN characters c ON c.id = sp."characterId"
JOIN LATERAL (
  SELECT cp.id, cp."profileCode"
  FROM character_profiles cp
  WHERE cp."characterId" = c.id
) one ON TRUE
WHERE sp."profileId" IS NULL
  AND (SELECT count(*) FROM character_profiles cp2 WHERE cp2."characterId" = c.id) = 1
ORDER BY p.slug, s."shotCode";
"""

SKIPPED = """
SELECT p.slug, s."shotCode", c.code,
       (SELECT count(*) FROM character_profiles cp2 WHERE cp2."characterId" = c.id)
FROM shot_participants sp
JOIN shots     s ON s.id = sp."shotId"
JOIN projects  p ON p.id = s."projectId"
JOIN characters c ON c.id = sp."characterId"
WHERE sp."profileId" IS NULL
  AND (SELECT count(*) FROM character_profiles cp2 WHERE cp2."characterId" = c.id) <> 1
ORDER BY p.slug, s."shotCode";
"""


def main():
    apply = "--apply" in sys.argv
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute(FIND)
    rows = cur.fetchall()
    print(f"строк к заполнению: {len(rows)}")
    for slug, code, ch, _pid, _prof_id, prof_code in rows:
        print(f"  {slug:<14} {code:<10} {ch:<12} → {prof_code}")

    cur.execute(SKIPPED)
    skipped = cur.fetchall()
    if skipped:
        print(f"\nНЕ трогаю (у персонажа состояний больше одного — выбор авторский): {len(skipped)}")
        for slug, code, ch, n in skipped:
            print(f"  {slug:<14} {code:<10} {ch:<12} состояний {n}")

    if not apply:
        print("\nсухой прогон, для записи --apply")
        conn.rollback()
        return

    cur.executemany(
        'UPDATE shot_participants SET "profileId" = %s WHERE id = %s AND "profileId" IS NULL',
        [(r[4], r[3]) for r in rows],
    )
    print(f"\nобновлено строк: {cur.rowcount if cur.rowcount >= 0 else len(rows)}")
    conn.commit()

    cur.execute('SELECT count(*) FROM shot_participants WHERE "profileId" IS NULL')
    print(f"осталось без профиля: {cur.fetchone()[0]}")
    conn.close()


if __name__ == "__main__":
    main()
