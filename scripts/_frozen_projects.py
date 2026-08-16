# -*- coding: utf-8 -*-
"""Какие проекты ЗАМОРОЖЕНЫ — их не правят ни промптами, ни пере-рендером.

Правило пользователя 2026-08-16: «не трогай то что уже готово, то что уже в
ютубе или экспортировано в ютуб». До этого в памяти жил только один признак —
ссылка на YouTube, — и он неполный: фильм успевает стать неприкосновенным
раньше, чем получит ссылку.

Два признака, любой достаточен:

  1. `Project.youtubeUrl` — вышел.
  2. Мастера на диске — `data/<slug>/finish/` или `data/<slug>/final/`. Это
     экспорт, ушедший в монтаж, то самое «экспортировано в ютуб». Файл на диске
     переживает любую колонку и появляется ЗАДОЛГО до ссылки.

⚠️ `Project.releaseAt` признаком НЕ является, хотя соблазн велик. Это слот
релизного календаря, он назначается ЗАРАНЕЕ: у `bully` стоит 2026-10-20, а фильм
в этот момент ещё в работе — пользователь апрувит его рендеры. Если считать
календарь заморозкой, замороженными окажутся 42 проекта из 44, включая тот, над
которым идёт работа прямо сейчас. Дата печатается справочно.

Печатает две таблицы: замороженные (с причиной) и живые. Ничего не меняет —
решение и действие держим раздельно.

    python scripts/_frozen_projects.py
"""
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")


def psql(sql):
    dsn = None
    for line in io.open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore"):
        if line.startswith("DATABASE_URL"):
            dsn = line.split("=", 1)[1].strip().strip('"')
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(\w+)", dsn)
    user, pwd, host, port, db = m.groups()
    env = dict(os.environ)
    env["PGPASSWORD"] = pwd
    r = subprocess.run(["psql", "-U", user, "-h", host, "-p", port, "-d", db,
                        "-At", "-F", "\t", "-c", sql], capture_output=True, env=env)
    return [l.split("\t") for l in r.stdout.decode("utf-8", "replace").strip().split("\n") if l]


def main():
    rows = psql(
        'SELECT slug, coalesce("youtubeUrl",\'\'), coalesce("releaseAt"::text,\'\'), '
        '(SELECT count(*) FROM shots s WHERE s."projectId" = p.id) '
        'FROM projects p ORDER BY slug')

    frozen, live = [], []
    for slug, yt, rel, shots in rows:
        why = []
        if yt:
            why.append("на YouTube")
        for d in ("finish", "final"):
            if os.path.isdir(os.path.join(DATA, slug, d)):
                why.append("мастера в " + d + "/")
        note = ("релиз " + rel[:10]) if rel else ""
        (frozen if why else live).append((slug, shots, ", ".join(why), note))

    print("=== ЗАМОРОЖЕНЫ — не править промпты, не пере-рендеривать (%d) ===" % len(frozen))
    for slug, shots, why, note in frozen:
        print("  %-16s %4s кадров   %-32s %s" % (slug, shots, why, note))
    print()
    print("=== живые (%d) — здесь работать можно ===" % len(live))
    for slug, shots, _why, note in live:
        print("  %-16s %4s кадров   %s" % (slug, shots, note))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
