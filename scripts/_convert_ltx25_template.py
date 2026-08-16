# -*- coding: utf-8 -*-
"""Перевод шаблонов LTX-2.5 из UI-формата (сабграф) в API-формат.

Штатные `video_ltx2_5_{i2v,flf2v}.json` — это НЕ то, что можно отправить в
`/prompt`. Это UI-граф, где вся работа спрятана в один узел-сабграф с 39–47
внутренними узлами. Скилл предписывал «прогнать через ComfyUI и выгрузить»; тут
то же самое делается программно и, главное, С ПРОВЕРКОЙ — каждый собранный узел
сверяется с `INPUT_TYPES` его класса, поэтому тихая ошибка в проводах падает
здесь, а не через четыре часа на рендере.

Почему это выполнимо: все входы сабграфа, кроме картинок, приходят в узлы, у
которых УЖЕ есть виджет со значением по умолчанию (`PrimitiveInt`,
`PrimitiveStringMultiline`, загрузчики моделей). Обрыв граничной связи не
оставляет дыру — остаётся дефолт. Наружу торчат только IMAGE и один VIDEO.

## Три вида входов, из-за которых первая версия скрипта врала

ComfyUI v3 объявляет часть входов динамически, и в API-формате они выглядят не
так, как в `INPUT_TYPES` (`comfy_api/latest/_io.py`):

* `COMFY_DYNAMICCOMBO_V3` — комбо, выбор в котором ДОБАВЛЯЕТ входы. В графе
  лежит и сам ключ (`resize_type`), и подвходы выбранной ветки под точечными
  именами (`resize_type.width`). В `widgets_values` они идут подряд: сначала
  ключ, потом виджеты выбранной ветки.
* `COMFY_AUTOGROW_V3` — растущий список (`values.a`, `values.b` у
  `ComfyMathExpression`). Сам родитель в граф НЕ попадает, только дети, и все
  они у нас связи, а не виджеты.
* `COMFY_MATCHTYPE_V3` — вход-связь с типом по шаблону (`ComfySwitchNode.on_*`).

Поэтому проверка «закрыт ли обязательный вход» смотрит и на точечных детей, а
проверка виджетов раскрывает выбранную ветку динамического комбо.

## Стабильные идентификаторы

Созданные скриптом узлы получают ФИКСИРОВАННЫЕ id 900/901/902 — их знает
`LtxVideoEngine.patch()`. Аллокация «max+1» связала бы движок с тем, сколько
узлов оказалось в шаблоне сегодня.

    python scripts/_convert_ltx25_template.py

Импортирует ComfyUI ради `NODE_CLASS_MAPPINGS`. Это ТОЛЬКО импорт: сервер не
поднимается, GPU не трогается, но torch грузится минуту-полторы.
"""
import asyncio
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # gen-studio
COMFY = os.path.dirname(ROOT)                                                # ComfyUI
OUT_DIR = os.path.join(ROOT, "data", "_templates", "comfy")

TEMPLATES = os.path.join(
    os.path.dirname(sys.executable), "Lib", "site-packages",
    "comfyui_workflow_templates_json", "templates",
)

# UI-узлы, которым нечего делать в dispatch-графе.
#
# ⚠️ `PreviewAny` выбрасывать ОБЯЗАТЕЛЬНО, и это не косметика. Он выходной узел и
# висит на `ComfySwitchNode`, у которого обе ветки объявлены `lazy`. Пока его нет,
# ветка расширителя промптов не вычисляется вовсе — и `gemma4_e2b_it_bf16` на
# 9.6 ГБ не грузится. Оставленный `PreviewAny` заставит ComfyUI посчитать обе
# ветки и утащить эти 9.6 ГБ в память на каждом клипе, на карте с 16 ГБ.
DROP_TYPES = {"MarkdownNote", "Note", "PreviewAny", "PrimitiveNode", "Reroute"}

# Типы, которые рисуются виджетом и потому лежат в `widgets_values`.
WIDGET_TYPES = {"INT", "FLOAT", "STRING", "BOOLEAN", "COMBO"}
DYNAMIC_COMBO = "COMFY_DYNAMICCOMBO_V3"
# Динамические входы, которых в графе нет под собственным именем.
PARENT_ONLY = {"COMFY_AUTOGROW_V3"}
# Входы-связи с типом по шаблону — виджета не имеют.
LINK_LIKE = {"COMFY_MATCHTYPE_V3", "COMFY_DYNAMICSLOT_V3"}

LOAD_FIRST_ID = "900"
LOAD_LAST_ID  = "901"
SAVE_ID       = "902"

JOBS = [
    # (исходник, имя на выходе, сколько картинок на входе, префикс SaveVideo)
    ("video_ltx2_5_i2v.json",   "video_ltx2_5_i2v_api.json",   1, "video/ltx_i2v"),
    ("video_ltx2_5_flf2v.json", "video_ltx2_5_flf2v_api.json", 2, "video/ltx_flf2v"),
]


def split_entry(entry):
    typ = entry[0] if isinstance(entry, (list, tuple)) else entry
    opts = entry[1] if isinstance(entry, (list, tuple)) and len(entry) > 1 else {}
    return typ, (opts if isinstance(opts, dict) else {})


def assign_widgets(spec, values, inputs, i=0, prefix=""):
    """Разложить `widgets_values` по именам входов. Возвращает новый индекс.

    Три тонкости, каждая из которых по отдельности сдвигает ВСЁ последующее на
    одну позицию и потому ломает граф молча:

    * `control_after_generate` — фронтенд дописывает «fixed»/«randomize» сразу
      после сида, и это лишнее значение в массиве;
    * динамическое комбо занимает свой ключ ПЛЮС виджеты выбранной ветки,
      причём ветка известна только после чтения ключа;
    * ветки описаны вложенным спеком `{"required": …, "optional": …}`, а не
      плоской картой, и сами могут содержать ещё одно динамическое комбо
      (`SaveVideo.codec` → `h264` → `encoding` → `re-encode` → `crf`).

    Отсюда рекурсия и позиционный курсор вместо заранее построенного плана.
    Связь всегда сильнее виджета: если имя уже пришло из провода, значение
    из массива только пропускается.
    """
    for section in ("required", "optional"):
        for name, entry in (spec.get(section) or {}).items():
            if i >= len(values):
                return i
            typ, opts = split_entry(entry)
            dotted = prefix + name
            if isinstance(typ, (list, tuple)) or typ in WIDGET_TYPES:
                if dotted not in inputs:
                    inputs[dotted] = values[i]
                i += 1 + (1 if opts.get("control_after_generate") else 0)
            elif typ == DYNAMIC_COMBO:
                key = values[i]
                if dotted not in inputs:
                    inputs[dotted] = key
                i += 1
                branch = next((o for o in (opts.get("options") or [])
                               if o.get("key") == key), None)
                if branch:
                    i = assign_widgets(branch.get("inputs") or {}, values, inputs,
                                       i, dotted + ".")
    return i


def missing_required(spec, inputs):
    """Обязательные входы, которых нет ни под своим именем, ни точечными детьми."""
    out = []
    for name, entry in (spec.get("required") or {}).items():
        typ, _ = split_entry(entry)
        # typ бывает СПИСКОМ (легаси-комбо перечисляет варианты прямо в типе),
        # а список нехешируем — проверять принадлежность множеству можно только
        # у строковых типов.
        if isinstance(typ, str) and typ in PARENT_ONLY:
            continue                       # в граф попадают только дети
        if name in inputs:
            continue
        if any(k.startswith(name + ".") for k in inputs):
            continue
        out.append(name)
    return out


def convert(src_path, images_in, prefix, mappings):
    graph = json.load(io.open(src_path, encoding="utf-8"))
    sub = graph["definitions"]["subgraphs"][0]
    nodes = {n["id"]: n for n in sub["nodes"]}

    keep = {
        nid: n for nid, n in nodes.items()
        if n["type"] not in DROP_TYPES and n.get("mode", 0) == 0
    }

    link_src = {}
    image_targets = {}   # slot сабграфа -> (target_id, имя входа)
    for l in sub["links"]:
        if l["origin_id"] == -10:
            if l["origin_slot"] < images_in:
                tgt = nodes[l["target_id"]]
                image_targets[l["origin_slot"]] = (
                    l["target_id"], tgt["inputs"][l["target_slot"]]["name"])
            continue                        # прочие граничные входы → дефолт виджета
        if l["target_id"] == -20:
            continue
        link_src[l["id"]] = (l["origin_id"], l["origin_slot"])

    api, problems = {}, []

    for nid, n in keep.items():
        cls = mappings.get(n["type"])
        if cls is None:
            problems.append("%s %s: класс не зарегистрирован" % (nid, n["type"]))
            continue
        spec = cls.INPUT_TYPES()
        inputs = {}
        for slot in n.get("inputs", []):
            lid = slot.get("link")
            if lid is None:
                continue
            src = link_src.get(lid)
            if src is None:
                continue                    # граничная связь
            if src[0] not in keep:
                problems.append("%s %s.%s: источник %s выброшен"
                                % (nid, n["type"], slot["name"], src[0]))
                continue
            inputs[slot["name"]] = [str(src[0]), src[1]]
        assign_widgets(spec, list(n.get("widgets_values") or []), inputs, 0, "")
        api[str(nid)] = {"class_type": n["type"], "inputs": inputs, "_spec": spec}

    # ── границы графа
    for slot, load_id in enumerate((LOAD_FIRST_ID, LOAD_LAST_ID)[:images_in]):
        tgt_id, tgt_name = image_targets[slot]
        api[load_id] = {"class_type": "LoadImage",
                        "inputs": {"image": "input.png"},
                        "_spec": mappings["LoadImage"].INPUT_TYPES()}
        api[str(tgt_id)]["inputs"][tgt_name] = [load_id, 0]

    video_src = next(str(nid) for nid, n in keep.items() if n["type"] == "CreateVideo")
    api[SAVE_ID] = {
        "class_type": "SaveVideo",
        "inputs": {"video": [video_src, 0], "filename_prefix": prefix,
                   "format": "auto", "codec": "auto"},
        "_spec": mappings["SaveVideo"].INPUT_TYPES(),
    }

    # ── проверки ПОСЛЕ того, как границы заведены
    for nid, node in api.items():
        for name in missing_required(node.pop("_spec"), node["inputs"]):
            problems.append("%s %s: не закрыт обязательный вход «%s»"
                            % (nid, node["class_type"], name))
        for name, v in node["inputs"].items():
            if isinstance(v, list) and len(v) == 2 and isinstance(v[0], str) and v[0] not in api:
                problems.append("%s %s.%s: висячая связь на %s"
                                % (nid, node["class_type"], name, v[0]))
    return api, problems


async def main():
    sys.path.insert(0, COMFY)
    os.chdir(COMFY)
    import nodes
    await nodes.init_extra_nodes(init_custom_nodes=False, init_api_nodes=False)
    mappings = nodes.NODE_CLASS_MAPPINGS

    os.makedirs(OUT_DIR, exist_ok=True)
    failed = False
    for src, dst, images_in, prefix in JOBS:
        api, problems = convert(os.path.join(TEMPLATES, src), images_in, prefix, mappings)
        print("%s -> %s: %d узлов" % (src, dst, len(api)))
        for p in problems:
            print("   ПРОБЛЕМА:", p)
            failed = True
        if not problems:
            path = os.path.join(OUT_DIR, dst)
            io.open(path, "w", encoding="utf-8", newline="\n").write(
                json.dumps(api, ensure_ascii=False, indent=2))
            print("   записан:", path)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
