# -*- coding: utf-8 -*-
"""Хвост §1: фразовые тики и прогоны одинакового плана.

«четыре года» ×5 — тик, который Я ЖЕ и завёл, когда чинил хронологию: заменил
пять «девять лет» на пять «четыре года» и получил ту же болезнь с другим числом.
Факт остаётся, формулировка разводится.

«чужой двери» ×3 и «тебе двадцать восемь» (последнее — ещё и общий 3-грамм с
другим фильмом канала) — туда же.

Прогоны плана: MS×3 с A1_SH05 и WS×3 с A8_SH08. Меняется ОДИН кадр в каждом
прогоне, и обязательно в трёх местах сразу — колонка `shotType`,
`promptFields.camera.shotType` и вводное слово `positive`: по колонке считается
чередование масштабов, а вводное слово должно остаться легальным для формы
панели (§5A.3b — на `wide` можно только wide/extreme wide).
"""
import json, sys, urllib.request

API = "http://localhost:4000"
PROJ = "3884f4d5-4090-4c93-9518-25dbff658673"

VO = {
"A1_SH08": "на пол-этажа ниже стоит чужой, которому в этом подъезде делать нечего.",
"A1_SH12": "в свои двадцать восемь ты умеешь то, чего в этом городе не умеет почти никто.",
"A5_SH03": "ты не заходишь внутрь ни на шаг, и такое правило держишь потом до самого конца.",
"A7_SH09": "ты смотришь на неё дольше, чем смотрел на любую чужую дверь за всё это время.",
"A8_SH07": "и первый раз за все эти годы тебе хочется посмотреть, что там внутри.",
"A9_SH07": "сын вырастает, и в тридцать шесть он стоит перед чужим порогом, как когда-то стоял ты.",
}

# кадр -> (новый shotType, старое вводное слово, новое вводное слово)
TYPES = {
"A1_SH07": ("MCU", "medium shot at eye level, Vlad standing at the landing rail",
                   "medium close-up at eye level, Vlad at the landing rail"),
"A8_SH10": ("EWS", "wide shot at eye level, the depot yard across its full width",
                   "extreme wide establishing shot at eye level, the depot yard across its full width"),
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

    for code, text in VO.items():
        assert not text[0].isupper() and text.endswith(".") and text.count(".") == 1, code
        assert len(text.split()) >= 6, code
        req("PATCH", "/tts/shots/%s/narration" % by_code[code]["id"], {"text": text})
    print("озвучка: %d строк" % len(VO))

    for code, (st, old, new) in TYPES.items():
        sh = by_code[code]
        pf = dict(sh["promptFields"])
        assert old in pf["positive"], code
        pf["positive"] = pf["positive"].replace(old, new, 1)
        pf["camera"] = dict(pf.get("camera") or {})
        pf["camera"]["shotType"] = st
        req("PATCH", "/shots/%s" % sh["id"], {"promptFields": pf, "shotType": st})
        print("кадр %s -> %s (колонка + promptFields + вводное слово)" % (code, st))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
