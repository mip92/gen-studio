# -*- coding: utf-8 -*-
"""Пред-сидовый аудит таблицы кадров minibus. Ничего не пишет, только считает.

Отличия от towtruck-чекера: движок WAN, а не LTX.
  · `no music` в моушене ЗАПРЕЩЁН (это LTX-only);
  · камера в тексте моушена ЗАПРЕЩЕНА — движок выводит клаузу из `cameraMove`,
    а `MENTIONS_CAMERA` отключает вывод, если камера уже названа руками;
  · замков пять: ENV / CHAR / TWO / CROWD / HANDS.

    python scripts/_check_minibus_shots.py
"""
import io
import json
import os
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seed_minibus_shots import SHOTS  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = json.load(io.open(os.path.join(HERE, "comic_page_templates.json"), encoding="utf-8"))
TPL = {t["id"]: [s["shape"] for s in sorted(t["slots"], key=lambda s: s["order"])]
       for t in TPL["templates"]}

PAGES = ["tall_page_left", "wide_narrows4", "duo_wide",
         "bands_squares_mid", "narrows3_land2", "land_sq_squares", "duo_wide",
         "land2_narrows3", "talls_flank_squares", "wide_top_trio", "tall_page_right",
         "squares_hero_land", "bands_squares_mid", "narrows3_land2", "duo_wide",
         "land_sq_squares", "land2_narrows3", "trio_wide_bottom", "narrows3_land2",
         "tall_page_left", "hero_land_squares", "tall_page_right", "talls_flank_squares",
         "land_sq_squares",
         "sq_land_squares", "land2_narrows3", "wide_narrows4", "land_sq_squares",
         "wide_top_trio", "bands_squares_mid", "narrows3_land2", "land_sq_squares",
         "wide_narrows4", "tall_page_left", "talls_flank_squares", "hero_land_squares",
         "duo_wide",
         "land2_narrows3", "squares_hero_land", "bands_squares_mid", "land_sq_squares",
         "hero_land_squares", "bands_squares_mid", "tall_page_right", "land_sq_squares",
         "duo_wide"]

ACT_TARGET = {"A1": 10, "A2": 18, "A3": 18, "A4": 18, "A5": 18, "A6": 20,
              "A7": 18, "A8": 20, "A9": 20, "A10": 20, "FIN": 20}

OPEN_OK = {
    "wide": ("wide shot", "extreme wide establishing shot"),
    "landscape": None,
    "square": ("close-up", "extreme close-up", "medium close-up", "medium shot"),
    "tall": ("full-length shot", "medium shot", "low-angle full-length shot"),
    "narrow": ("full-length shot", "medium shot", "medium close-up", "close-up"),
    "tall_page": ("full-length shot", "low-angle full-length shot"),
}
OPEN_TYPE = {
    "extreme wide establishing shot": {"EWS"},
    "wide shot": {"WS"},
    "full-length shot": {"FS"},
    "low-angle full-length shot": {"FS"},
    "medium shot": {"MS"},
    "medium close-up": {"MCU"},
    "close-up": {"CU"},
    "extreme close-up": {"ECU"},
}
GROUP = {"EWS": "W", "WS": "W", "MS": "M", "MCU": "M", "OTS": "M",
         "CU": "C", "ECU": "C", "FS": "C", "INSERT": "C", "POV": "C", "BACK": "C"}

LOCS = {"terminus_lot", "minibus_cab", "minibus_salon", "stop_shelter", "factory_gate",
        "flat_kitchen_ol", "grocery_checkout", "garage_pit", "dispatch_booth",
        "medcom_corridor", "crossroads_light"}
PROPS = {"COIN_TIN", "MINIBUS", "TRAVEL_PASS"}
PROFS = {"OLEG_YOUNG", "OLEG_MID", "OLEG_LATE", "ZHANNA_MID", "MILA_TEEN",
         "ARKADY_MID", "ZINA_OLD"}
MOVES = {"static", "locked_off", "push_in", "pull_out", "track", "track_lateral",
         "pan", "pan_left", "pan_right", "tilt_up", "tilt_down", "handheld",
         "window_pov", "arc_left", "arc_right"}
ANGLES = {"eye", "low", "high", "top", "top_down", "over", "pov", "dutch"}

# «стоит» = «находится» ловушкой не является; запрещена ЦЕНОВАЯ форма.
VO_BAN = [r"\bсорок\w*", r"\bстоил\w*", r"\bстоимост\w*", r"понимаешь,? что",
          r"ловишь себя", r", и это\b", r"\+"]
POS_BAN = [r"\bno\b", r"\bnot\b", r"\bwithout\b", r"\bnever\b", r"\bnothing\b",
           r"\bavoid\b", r"the camera", r"masterpiece", r"best quality",
           r"photoreal", r"anime", r"cell-shaded", r"palette of"]
MOT_BAN = [r"\bno\b", r"\bwithout\b", r"\bnever\b",           # §3: только позитивные локи
           r"camera", r"handheld", r"point of view",           # §4: камера идёт колонкой
           r"then we cut", r"next shot", r"meanwhile",
           r"\bsays?\b", r"\bspeak\w*", r"\bmusic\b"]
LOCKS = ("the place stays deserted", "the same single figure",
         "the same two figures", "only the foreground figure moves",
         "the same hands already in frame")

NAMES = {"Олег", "Олега", "Олегу", "Жанна", "Жанне", "Жанну", "Мила", "Миле", "Милу",
         "Аркадий", "Аркадию", "Аркадия", "Зина", "Зину", "Зине", "Зины"}

errs, warns = [], []


def E(code, msg):
    errs.append(f"{code}: {msg}")


def W(code, msg):
    warns.append(f"{code}: {msg}")


seen, by_act = set(), {}
for row in SHOTS:
    (code, page, slot, shape, stype, angle, move, loc, prof, prop,
     ru, pos, mot, flags) = row
    act = code.split("_")[0]
    by_act.setdefault(act, []).append(row)
    if code in seen:
        E(code, "дубль shotCode")
    seen.add(code)

    # ── вёрстка ──
    if not (0 <= page < len(PAGES)):
        E(code, f"страница {page} вне книги")
    else:
        shapes = TPL[PAGES[page]]
        if not (0 <= slot < len(shapes)):
            E(code, f"слот {slot} вне шаблона {PAGES[page]} ({len(shapes)} слотов)")
        elif shapes[slot] != shape:
            E(code, f"форма {shape} != {shapes[slot]} (стр {page} {PAGES[page]} слот {slot})")

    # ── перечисления ──
    if move not in MOVES:
        E(code, f"cameraMove '{move}' нет в карте движка")
    if angle not in ANGLES:
        E(code, f"cameraAngle '{angle}' незнакомый")
    if stype not in GROUP:
        E(code, f"shotType '{stype}' незнакомый")
    if loc is not None and loc not in LOCS:
        E(code, f"локация '{loc}' не существует")
    if prop is not None and prop not in PROPS:
        E(code, f"props '{prop}' не существует")
    if prop is not None and loc is not None:
        E(code, "кадр-предмет обязан идти без локации (§17.3)")
    profs = () if prof is None else ((prof,) if isinstance(prof, str) else tuple(prof))
    for p in profs:
        if p not in PROFS:
            E(code, f"профиль '{p}' не существует")
    if len(profs) > 3:
        E(code, "больше трёх референсов Qwen не берёт")

    # ── VO ──
    if not re.search(r"[.!?]$", ru):
        E(code, "VO без терминального знака (f5 даст придыхание)")
    n = len(ru.split())
    if n < 9:
        E(code, f"VO {n} слов — короче четырёх секунд")
    if n > 24:
        W(code, f"VO {n} слов — длинновато")
    for pat in VO_BAN:
        m = re.search(pat, ru, re.I)
        if m:
            E(code, f"VO запрещённое '{m.group(0)}'")
    if re.search(r"\d", ru):
        E(code, "VO содержит цифру — числа только словами")
    if re.search(r"[A-Za-z]", ru):
        E(code, "VO содержит латиницу")
    first = ru.split()[0].strip("«»,.")
    if first[:1].isupper() and first not in NAMES:
        E(code, f"VO начинается с заглавной '{first}'")
    if ru.count(".") + ru.count("!") + ru.count("?") > 1:
        E(code, "VO больше одного предложения (f5 деградирует)")

    # ── позитив ──
    pw = len(pos.split())
    if pw > 55:
        E(code, f"позитив {pw} слов при бюджете 55 — хвост обрежется")
    if pw < 25:
        W(code, f"позитив {pw} слов — тонковато")
    for pat in POS_BAN:
        m = re.search(pat, pos, re.I)
        if m:
            E(code, f"позитив запрещённое '{m.group(0)}'")
    allowed = OPEN_OK[shape]
    head = pos.split(",")[0].strip().lower()
    opener = None
    for o in sorted(OPEN_TYPE, key=len, reverse=True):
        if head.startswith(o):
            opener = o
            break
    if opener is None:
        E(code, f"вводное слово не распознано: '{head}'")
    else:
        if allowed is not None and opener not in allowed:
            E(code, f"вводное '{opener}' спорит с формой {shape}")
        if stype not in OPEN_TYPE[opener]:
            E(code, f"вводное '{opener}' против shotType '{stype}'")
    # ПОЗИТИВ = СОБЫТИЕ, а не поза. Требуется ОДНО названное действие (правило
    # «один бит на клип» запрещает два одновременных), но на кадре с человеком
    # действие обязано быть ЕГО: ищем действие ПОСЛЕ имени персонажа, иначе
    # получается «человек стоит, а движется фон».
    NOT_ACTION = {"standing", "lying", "sitting", "existing", "waiting", "hanging",
                  "wearing", "facing", "morning", "evening", "insulating", "housing",
                  "ceiling", "building", "railing", "swing", "spring", "string",
                  "during", "nothing", "something", "everything"}
    tail = pos
    if profs:
        for nm in ("Oleg", "Zhanna", "Mila", "Arkady", "Zina"):
            i = pos.find(nm)
            if i >= 0:
                tail = pos[i:]
                break
        else:
            E(code, "в позитиве кадра с участником не назван персонаж")
    acts = [w for w in re.findall(r"\b\w+ing\b", tail.lower()) if w not in NOT_ACTION]
    if not acts:
        E(code, "позитив описывает позу, а не действие"
                + (" субъекта" if profs else ""))

    # ── моушен ──
    if not any(l in mot for l in LOCKS):
        E(code, "моушен без позитивного замка")
    if profs and "the place stays deserted" in mot:
        E(code, "замок пустоты на кадре с участником")
    LIMB = (r"\b(hand|hands|palm|palms|finger|fingers|thumb|forearm|forearms|glove|"
            r"gloved|knuckles|cuff|elbows)\b")
    # «minute hand», «hand-written», «hand lever» — это НЕ конечность в кадре
    pos_limb = re.sub(r"\b(?:minute|second|hour|clock)\s+hands?\b|"
                      r"\bhand[- ](?:written|welded|lever|painted|drawn)\b",
                      "", pos, flags=re.I)
    if (not profs and re.search(LIMB, pos_limb, re.I)
            and "the place stays deserted" in mot):
        E(code, "замок пустоты на кадре, где субъект — руки (§4c(b))")
    for pat in MOT_BAN:
        m = re.search(pat, mot, re.I)
        if m:
            E(code, f"моушен запрещённое '{m.group(0)}' (диалект Wan)")
    mw = len(mot.split())
    if not (30 <= mw <= 70):
        W(code, f"моушен {mw} слов (норма 30–60 с замком)")

# ── количество кадров ──
for act, want in ACT_TARGET.items():
    got = len(by_act.get(act, []))
    if got != want:
        E(act, f"кадров {got}, по плану {want}")
if len(SHOTS) != 200:
    E("ALL", f"всего кадров {len(SHOTS)}, ожидалось 200")

# ── покрытие книги ──
used = {}
for row in SHOTS:
    used.setdefault((row[1], row[2]), []).append(row[0])
for pi, tid in enumerate(PAGES):
    for si in range(len(TPL[tid])):
        who = used.get((pi, si), [])
        if len(who) != 1:
            E(f"page{pi}/slot{si}", f"занят {len(who)} раз ({who})")

# ── чередование масштабов ──
for act, rows in by_act.items():
    g = [GROUP[r[4]] for r in rows]
    for i in range(2, len(g)):
        if g[i] == g[i - 1] == g[i - 2]:
            E(rows[i][0], f"третий кадр группы {g[i]} подряд ({rows[i-2][0]}, {rows[i-1][0]})")

order = list(ACT_TARGET)
flat = [r for a in order for r in by_act.get(a, [])]
g = [GROUP[r[4]] for r in flat]
for i in range(2, len(g)):
    if g[i] == g[i - 1] == g[i - 2]:
        if len({flat[i][0].split("_")[0], flat[i - 1][0].split("_")[0]}) > 1:
            E(flat[i][0], f"шов актов: третий кадр группы {g[i]} подряд")

# ── лексика и самоповторы ──
vo = [r[10] for r in flat]
nv = sum(1 for t in vo if "впервые" in t.lower())
if nv > 3:
    E("ALL", f"«впервые» {nv} раз (норма 3)")
npc = sum(len(re.findall(r"потому,? что", t, re.I)) for t in vo)
if npc > 2:
    E("ALL", f"«потому что» {npc} раз (норма 2)")
if len(set(vo)) != len(vo):
    E("ALL", "дословные дубли строк VO")
poss = [r[11] for r in flat]
if len(set(poss)) != len(poss):
    E("ALL", "дословные дубли позитивов")
mots = [r[12] for r in flat]
if len(set(mots)) != len(mots):
    E("ALL", "дословные дубли моушен-промптов (§5.3b)")

tri = Counter()
for t in vo:
    w = [x for x in re.findall(r"[а-яё]+", t.lower()) if len(x) >= 4]
    for i in range(len(w) - 2):
        tri[" ".join(w[i:i + 3])] += 1
for k, v in tri.most_common(20):
    if v >= 3:
        W("ALL", f"трёхграмма ×{v}: «{k}»")

tot = sum(len(t.split()) for t in vo)
mins = tot / 140 + len(vo) * 0.5 / 60
print(f"кадров: {len(SHOTS)}   слов VO: {tot}   ≈ {mins:.1f} мин")
no_people = sum(1 for r in flat if "the place stays deserted" in r[12])
print(f"кадров без людей: {no_people} ({no_people * 100 // max(1, len(flat))}%)"
      f"   толпа: {sum(1 for r in flat if 'only the foreground figure moves' in r[12])}"
      f"   руки: {sum(1 for r in flat if 'the same hands already in frame' in r[12])}"
      f"   предметов: {sum(1 for r in flat if r[9])}"
      f"   иконических: {sum(1 for r in flat if 'i' in r[13])}")
print("масштабы:", dict(Counter(GROUP[r[4]] for r in flat)))
print("формы:", dict(Counter(r[3] for r in flat)))
print()
if errs:
    print(f"ОШИБКИ ({len(errs)}):")
    for e in errs:
        print("  ✗", e)
else:
    print("ошибок нет")
if warns:
    print(f"\nпредупреждения ({len(warns)}):")
    for w in warns:
        print("  ·", w)
sys.exit(1 if errs else 0)
