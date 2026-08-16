# -*- coding: utf-8 -*-
"""Хвост аудита: два кадра без клаузы КОРПУСА (была только голова/вес) и
одна локация на слово выше бюджета."""
import json, sys, urllib.request

API = "http://localhost:4000"
PROJ = "3884f4d5-4090-4c93-9518-25dbff658673"

POS = [
]
OLDPOS = [
 ("A3_SH03", "his head tilted down toward his own hands",
             "his shoulders hunched over the counter and his head tilted down toward his own hands"),
 ("A9_SH02", "his weight pulled to one side by the toolbag in his hand",
             "his spine upright and his weight pulled to one side by the toolbag in his hand"),
]

LOC = [("stairwell_2026",
        "A contemporary landing in a nineties block, flat grey repaint over old texture, "
        "three flush steel doors, a new intercom panel, a cheap LED fitting.")]


def req(method, path, body=None):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method,
                               headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(r, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw.strip() else {}


def main():
    res = req("GET", "/projects/%s/shots?take=400" % PROJ)
    items = res["items"] if isinstance(res, dict) and "items" in res else res
    by_code = {s["shotCode"]: s for s in items}
    for code, old, new in POS:
        sh = by_code[code]
        pf = dict(sh["promptFields"])
        assert old in pf["positive"], code
        pf["positive"] = pf["positive"].replace(old, new, 1)
        req("PATCH", "/shots/%s" % sh["id"], {"promptFields": pf})
        print("кадр", code, "ok")

    locs = req("GET", "/projects/%s/locations" % PROJ)
    by_slug = {l["slug"]: l["id"] for l in locs}
    for slug, descr in LOC:
        assert len(descr.split()) <= 25, len(descr.split())
        req("PATCH", "/locations/%s" % by_slug[slug], {"description": descr})
        print("локация", slug, "->", len(descr.split()), "слов")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
