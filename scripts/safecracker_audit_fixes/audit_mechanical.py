# -*- coding: utf-8 -*-
"""§1 механический проход по озвучке + §4c(a) точные совпадения отрицаний.

Пишет в файл: кириллица через stdout на Windows корёжится.
"""
import io, json, os, re, subprocess, sys
from collections import Counter

ROOT = r"W:\Programs\ComfyUI\gen-studio"
OUT = r"C:\Users\mip\.claude\jobs\321f3dfb\tmp\audit_mech.txt"
PID = "3884f4d5-4090-4c93-9518-25dbff658673"


def psql(sql):
    dsn = None
    for line in io.open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore"):
        if line.startswith("DATABASE_URL"):
            dsn = line.split("=", 1)[1].strip().strip('"')
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(\w+)", dsn)
    user, pwd, host, port, db = m.groups()
    env = dict(os.environ); env["PGPASSWORD"] = pwd
    r = subprocess.run(["psql", "-U", user, "-h", host, "-p", port, "-d", db,
                        "-At", "-F", "\t", "-c", sql],
                       capture_output=True, env=env)
    return r.stdout.decode("utf-8", "replace")


def main():
    # порядок ВОСПРОИЗВЕДЕНИЯ: без length(split_part(...)) A10 встал бы перед A2
    rows = [l.split("\t") for l in psql(
        'SELECT s."shotCode", s."narrationText", s."shotType", '
        'coalesce(s."promptFields"->>\'positive\',\'\') '
        'FROM shots s WHERE s."projectId"=\'%s\' '
        "ORDER BY length(split_part(s.\"shotCode\",'_',1)), s.\"shotCode\"" % PID
    ).strip().split("\n")]

    o = []
    o.append("кадров: %d" % len(rows))

    lines = [(r[0], r[1]) for r in rows]
    words_of = lambda t: [w for w in re.findall(r"[а-яёa-z]+", t.lower())]

    # ── повторяющиеся 2/3-граммы из слов >=4 букв
    o.append("\n=== 3-граммы (слова >=4 букв), 3+ повторов ===")
    grams = Counter()
    for code, t in lines:
        ws = [w for w in words_of(t) if len(w) >= 4]
        for n in (2, 3):
            for i in range(len(ws) - n + 1):
                grams[" ".join(ws[i:i + n])] += 1
    hits = [(g, c) for g, c in grams.items() if c >= 3]
    hits.sort(key=lambda x: -x[1])
    for g, c in hits[:25]:
        o.append("  %2d  %s" % (c, g))
    if not hits:
        o.append("  (нет)")

    # ── частота содержательных слов >=6 букв, порог 5% строк
    o.append("\n=== слова >=6 букв чаще чем в 5%% строк (порог %d) ===" % max(2, int(len(lines) * 0.05)))
    wc = Counter()
    for code, t in lines:
        for w in set(w for w in words_of(t) if len(w) >= 6):
            wc[w] += 1
    thr = max(2, int(len(lines) * 0.05))
    for w, c in sorted(wc.items(), key=lambda x: -x[1]):
        if c > thr:
            o.append("  %2d  %s" % (c, w))

    # ── числительные
    o.append("\n=== числительные (порог 8 на фильм) ===")
    NUM = ("один","два","две","три","четыр","пят","шест","сем","восем","девят","десят",
           "одиннад","двенад","тринад","сорок","сто","тысяч","двадцат","тридцат","полтор","девяност")
    nc = Counter()
    for code, t in lines:
        low = t.lower()
        for n in NUM:
            nc[n] += len(re.findall(n, low))
    for n, c in sorted(nc.items(), key=lambda x: -x[1]):
        if c:
            mark = "  ← ВЫШЕ ПОРОГА" if c > 8 else ""
            o.append("  %2d  %s%s" % (c, n, mark))

    # ── прогоны одинакового shotType
    o.append("\n=== прогоны одинакового shotType (3+ подряд) ===")
    run, prev, start = 0, None, None
    found = False
    for r in rows + [("", "", "END", "")]:
        st = r[2]
        if st == prev:
            run += 1
        else:
            if run >= 3:
                o.append("  %s ×%d начиная с %s" % (prev, run, start))
                found = True
            prev, run, start = st, 1, r[0]
    if not found:
        o.append("  (нет)")

    # ── §4c(a) точные совпадения отрицаний в позитиве
    o.append("\n=== §4c(a) какие именно слова-отрицания найдены в positive ===")
    pat = re.compile(r"\b(not|without|never|nothing|avoid)\b|no (people|one|figures)\b|empty of", re.I)
    for code, _t, _st, pos in rows:
        for m in pat.finditer(pos):
            s = max(0, m.start() - 35)
            o.append("  %-9s …%s…" % (code, pos[s:m.end() + 35].replace("\n", " ")))

    # ── §1 межпроектные 3-граммы (канал публикует фильмы подряд)
    o.append("\n=== 3-граммы, общие с другими фильмами канала ===")
    others = [l.split("\t") for l in psql(
        'SELECT p.slug, s."narrationText" FROM shots s JOIN projects p ON p.id=s."projectId" '
        "WHERE s.\"projectId\" <> '%s' AND coalesce(trim(s.\"narrationText\"),'')<>''" % PID
    ).strip().split("\n") if "\t" in l]
    og = set()
    for slug, t in others:
        ws = [w for w in words_of(t) if len(w) >= 4]
        for i in range(len(ws) - 2):
            og.add(" ".join(ws[i:i + 3]))
    mine = set()
    for code, t in lines:
        ws = [w for w in words_of(t) if len(w) >= 4]
        for i in range(len(ws) - 2):
            mine.add(" ".join(ws[i:i + 3]))
    shared = sorted(mine & og)
    o.append("  всего пересечений: %d" % len(shared))
    for g in shared[:30]:
        o.append("    %s" % g)

    io.open(OUT, "w", encoding="utf-8").write("\n".join(o))
    print("written:", OUT)


if __name__ == "__main__":
    main()
