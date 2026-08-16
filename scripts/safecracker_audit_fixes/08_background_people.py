# -*- coding: utf-8 -*-
"""Люди на фоне двигаются минимально (правило пользователя 2026-08-16).

В `safecracker` четыре кадра, где в рамке есть люди КРОМЕ участника, и у всех
четырёх стоял замок `the same single figure throughout the shot`. Это не просто
«не тот замок» — это guard, который спорит с собственной картинкой: кадр
показывает очередь, а промпт утверждает, что фигура одна. i2v отвечает на это
тем, что фон плавит или стирает. Тот же класс, что кадры-руки с замком пустоты
места (§4c(b) аудита).

Замена — позитивная, без отрицаний: фон ДЕРЖИТ место, а не «не двигается».

A6_SH09 — отдельный случай. Там поворот голов торговцев это сюжетный бит
(«тебя зовут по имени там, где имя дороже денег»), и глушить его нельзя.
Поворот головы и есть минимальное движение — он оставлен, но явно ограничен
головой, а корпус прибит.

A3_SH13 попал в выборку по слову «queue», хотя очереди в кадре нет: там
написано «the queue behind him gone». Отсутствие, названное через исчезновение,
Qwen читает как присутствие — переписано на то, что в кадре ЕСТЬ.
"""
import json, sys, urllib.request

API = "http://localhost:4000"
PROJ = "3884f4d5-4090-4c93-9518-25dbff658673"

SINGLE = "the same single figure throughout the shot"

MOTION = {
 "A3_SH02": (SINGLE,
             "the queue behind the glass holding its place with only the smallest shifts of weight"),
 "A3_SH10": (SINGLE,
             "he is the only one who moves, the traders holding their places with only the smallest shifts"),
 "A6_SH09": (SINGLE,
             "the traders turning only their heads while their bodies hold still, the rest of the row keeping its place"),
}

POSITIVE = {
 # «gone» — отсутствие через исчезновение; названо то, что в кадре есть
 "A3_SH13": ("the queue behind him gone", "bare wet asphalt behind him"),
 # у A6_SH09 поворот в позитиве тоже сузим до головы
 "A6_SH09": ("with two traders turning to watch him pass",
             "with two traders turning their heads to watch him pass"),
}

ENDFRAME = {
 "A6_SH09": ("both traders have turned fully after him",
             "both traders have turned their heads after him, their bodies unchanged"),
}


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

    edits, misses = {}, []

    def patch_field(code, field, old, new, container):
        sh = by_code.get(code)
        if not sh:
            misses.append((code, "нет кадра")); return
        pf = edits.get(code, {}).get("promptFields") or dict(sh["promptFields"])
        endf = edits.get(code, {}).get("endFramePrompt", sh.get("endFramePrompt"))
        if container == "endFramePrompt":
            if not endf or old not in endf:
                misses.append((code, "endFrame: не найдено " + old[:45])); return
            endf = endf.replace(old, new, 1)
        else:
            if old not in (pf.get(field) or ""):
                misses.append((code, "%s: не найдено %s" % (field, old[:45]))); return
            pf[field] = pf[field].replace(old, new, 1)
        edits[code] = {"promptFields": pf, "endFramePrompt": endf}

    for code, (old, new) in MOTION.items():
        patch_field(code, "motionPrompt", old, new, "promptFields")
    for code, (old, new) in POSITIVE.items():
        patch_field(code, "positive", old, new, "promptFields")
    for code, (old, new) in ENDFRAME.items():
        patch_field(code, None, old, new, "endFramePrompt")

    for code, payload in edits.items():
        body = {"promptFields": payload["promptFields"]}
        if payload.get("endFramePrompt") is not None:
            body["endFramePrompt"] = payload["endFramePrompt"]
        req("PATCH", "/shots/%s" % by_code[code]["id"], body)
        print("кадр", code, "обновлён")
    for c, e in misses:
        print("  ПРОБЛЕМА %s: %s" % (c, e))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
