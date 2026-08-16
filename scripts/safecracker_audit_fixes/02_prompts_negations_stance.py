# -*- coding: utf-8 -*-
"""Правки промптов по аудиту gen-studio-plot-audit §4b/§4c.

  §4c(a)  отрицания в позитиве Qwen (7 штук). У VL-энкодера нет канала отрицания,
          «not yet moving» рендерится как ДВИЖЕНИЕ. Переписано утвердительно.
  §4b     клауза разворота корпуса в людных кадрах (36 из 92). Без неё якорь
          подставляет свой корпус, и весь фильм читается одной позой — скилл
          называет это самым заметным дефектом года.
  §4c(b)  три кадра, где в кадре РУКИ, но моушен-промпт держит замок пустоты
          места. Guard спорит с содержимым, i2v морфит пальцы. Заменено на
          формулировку из скилла.

Правки идут через API (fetch → modify → PATCH), а не jsonb-хирургией в SQL.
"""
import json, sys, urllib.request

API = "http://localhost:4000"
PROJ = "3884f4d5-4090-4c93-9518-25dbff658673"

HANDS_GUARD = ("only the hands already in frame move, no new people enter the frame, "
               "the rest of the frame holding still")
EMPTY_LOCK = "the place stays deserted, every surface and object holding its exact position"

# (кадр, что заменить, на что) — в positive
POS = [
# ── §4c(a) отрицания
("F_SH09",  "no one in the room", "the room left to itself"),
("A5_SH02", "the floodlight cone empty of people", "the floodlight cone falling on bare concrete"),
("A5_SH11", "his jacket not yet taken off", "his jacket still on his shoulders"),
("A6_SH02", "his hands not yet moving", "his hands flat and still on the table"),
("A8_SH13", "the pegboard empty of cylinders", "the pegboard stripped to bare hooks"),
("A5_SH07", "his eyes fixed on nothing", "his shoulders set and turned away from the open door, his eyes fixed on the middle distance"),
("A9_SH08", "no tools in his hands", "his hands hanging open and empty"),

# ── §4b разворот корпуса, 36 кадров
("A1_SH11", "the ginger man turning away down the steps",
            "the ginger man turning away down the steps with his shoulders squared to the flight"),
("A1_SH13", "Vlad's face lit from one side by the caged bulb",
            "Vlad's face lit from one side by the caged bulb, his shoulders still hunched from kneeling"),
("A2_SH06", "the boy's hands on an oilcloth table",
            "the boy stooped over an oilcloth table, his hands"),
("A2_SH07", "the boy holding one brass pin up",
            "the boy leaning back from the table holding one brass pin up"),
("A2_SH08", "boy at a pedestal grinder",
            "boy standing square at a pedestal grinder with his weight on his front foot"),
("A2_SH09", "the boy at a scarred workbench testing",
            "the boy stooped over a scarred workbench testing"),
("A2_SH13", "the young man at the workshop bench",
            "the young man standing side-on at the workshop bench"),
("A3_SH03", "Vlad's face lit from one side by a fluorescent tube",
            "Vlad's face lit from one side by a fluorescent tube, his head tilted down toward his own hands"),
("A3_SH08", "Vlad at the booth counter counting",
            "Vlad hunched at the booth counter counting"),
("A3_SH11", "Vlad stopped in the market aisle looking at",
            "Vlad stopped in the market aisle with his torso half-turned toward"),
("A4_SH03", "Vlad holding the photograph up close to the fluorescent tube with both hands",
            "Vlad leaning back from the counter holding the photograph up close to the fluorescent tube with both hands"),
("A4_SH07", "Vlad's face at the kitchen table lit low",
            "Vlad's shoulders slumped over the kitchen table, his face lit low"),
("A4_SH08", "the ginger man's face under a floodlight in a depot yard",
            "the ginger man's face under a floodlight in a depot yard, his shoulders squared to the yard"),
("A4_SH11", "the ginger man half-lit by the floodlight",
            "the ginger man standing four-square and half-lit by the floodlight"),
("A5_SH01", "Vlad's hands at a padlock in the floodlight cone",
            "Vlad's forearms braced against the door and his hands at a padlock in the floodlight cone"),
("A5_SH04", "Vlad climbing a night stairwell",
            "Vlad climbing a night stairwell with his torso turned into the bend of the stair"),
("A5_SH09", "Vlad walking down the stairwell alone",
            "Vlad walking down the stairwell alone with his spine curved forward over the wrap"),
("A5_SH10", "the dark-haired woman washing a cup at the kitchen sink",
            "the dark-haired woman with her shoulders rounded over the kitchen sink washing a cup"),
("A5_SH13", "Vlad behind the booth counter under the fluorescent tube cutting a key blank",
            "Vlad hunched over the machine behind the booth counter cutting a key blank under the fluorescent tube"),
("A6_SH01", "holding a small cable lock out in both hands across a kitchen table",
            "his torso stretched forward across a kitchen table, holding a small cable lock out in both hands"),
("A6_SH05", "Vlad half-smiling across the table with the probe held up between two fingers",
            "Vlad half-smiling with his elbows on the oilcloth and the probe held up between two fingers"),
("A6_SH09", "Vlad walking the market row",
            "Vlad walking the market row with his shoulders angled through the gap"),
("A7_SH02", "Vlad behind the new counter writing on a receipt pad",
            "Vlad stooped over the new counter writing on a receipt pad"),
("A7_SH04", "Vlad's face across the shop counter looking toward the door",
            "Vlad's upper body squared to the doorway across the shop counter, his face turned to it"),
("A7_SH05", "the ginger man filling the glazed shop doorway",
            "the ginger man standing square in the glazed shop doorway and filling it"),
("A7_SH09", "Vlad's face lowered over the photograph",
            "Vlad's shoulders curved over the counter and his face lowered to the photograph"),
("A7_SH12", "the fair-haired boy looking up from beside the kitchen table",
            "the fair-haired boy with his torso pressed to the table edge looking up"),
("A8_SH01", "Vlad entering a panelled office at night",
            "Vlad entering a panelled office at night with his torso turned toward the far corner"),
("A8_SH04", "Vlad's face pressed side-on against the cold safe door",
            "Vlad's shoulder braced on the steel and his face pressed side-on against the cold safe door"),
("A8_SH12", "Vlad's face in the unlit shop",
            "Vlad's shoulders squared and still in the unlit shop, his face"),
("A9_SH02", "Vlad walking a bright contemporary landing with a toolbag in one hand",
            "Vlad walking a bright contemporary landing, his weight pulled to one side by the toolbag in his hand"),
("A9_SH05", "Vlad's face in the dim hallway lit by one ceiling fitting",
            "Vlad's shoulders lifted toward the upper lock in the dim hallway, his face lit by one ceiling fitting"),
("A9_SH08", "the younger man's face under the hard landing LED",
            "the younger man's shoulders squared to the door under the hard landing LED, his face"),
("A9_SH10", "the younger man's boot planted against a steel door beside the lock",
            "the younger man's torso twisted back from the hip and his boot planted against a steel door beside the lock"),
("F_SH03",  "Vlad's face at the bench with his eyes closed",
            "Vlad's shoulders rounded over the bench, his face lowered and his eyes closed"),
]

# кадры-руки: замок пустоты места → замок рук (§4c(b))
HANDS = ["A4_SH12", "A5_SH08", "A8_SH05"]


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

    edits = {}   # code -> promptFields (накапливаем, чтобы кадр PATCH-нулся один раз)
    misses = []

    for code, old, new in POS:
        sh = by_code.get(code)
        if not sh:
            misses.append((code, "нет кадра")); continue
        pf = edits.get(code) or dict(sh["promptFields"])
        if old not in pf["positive"]:
            misses.append((code, "не найдено: " + old[:50])); continue
        pf["positive"] = pf["positive"].replace(old, new, 1)
        edits[code] = pf

    for code in HANDS:
        sh = by_code.get(code)
        if not sh:
            misses.append((code, "нет кадра")); continue
        pf = edits.get(code) or dict(sh["promptFields"])
        if EMPTY_LOCK not in pf["motionPrompt"]:
            misses.append((code, "нет замка пустоты в motionPrompt")); continue
        pf["motionPrompt"] = pf["motionPrompt"].replace(EMPTY_LOCK, HANDS_GUARD, 1)
        pf["motionNegative"] = pf.get("motionNegative", "") + ", morphing hands, extra fingers, extra limbs, faces appearing"
        edits[code] = pf

    ok = 0
    for code, pf in edits.items():
        try:
            req("PATCH", "/shots/%s" % by_code[code]["id"], {"promptFields": pf})
            ok += 1
        except Exception as exc:  # noqa: BLE001
            misses.append((code, "PATCH: " + str(exc)[:120]))
    print("кадров обновлено: %d (правок: %d)" % (ok, len(POS) + len(HANDS)))
    for c, e in misses:
        print("  ПРОБЛЕМА %s: %s" % (c, e))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
