# -*- coding: utf-8 -*-
"""Проверка графа FLUX.2 [klein] без GPU и без запуска сервера.

Зачем отдельный скрипт: официального шаблона flux2 в этой сборке ComfyUI НЕТ
(в отличие от LTX-2.5, где граф конвертируется из штатного сабграфа), поэтому
граф написан руками — а значит каждое допущение надо подтвердить механически, а
не «на рендере через четыре часа».

Что проверяется:

* класс каждого узла зарегистрирован в этой сборке;
* каждый вход существует в `INPUT_TYPES` своего класса;
* каждый ОБЯЗАТЕЛЬНЫЙ вход присутствует;
* значения комбо входят в допустимый список. Это же и проверка файлов моделей:
  `unet_name`, `clip_name`, `vae_name` ComfyUI собирает комбо-списком с диска,
  так что неверное имя файла падает здесь;
* связи никуда не висят;
* размеры кратны 16 (`EmptyFlux2LatentImage` объявляет step=16).

Проверяется и БАЗОВЫЙ шаблон, и его расширение цепочкой референсов — то, что во
время рендера достраивает движок. Расширение здесь является СПЕЦИФИКАЦИЕЙ для
Flux2ImageEngine.patch(): номера узлов и провода должны совпадать один в один.

    python scripts/_verify_flux2_template.py

Импортирует ComfyUI ради `NODE_CLASS_MAPPINGS` — это только импорт, сервер не
поднимается и GPU не трогается, но torch грузится минуту-полторы.
"""
import asyncio
import copy
import io
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # gen-studio
COMFY = os.path.dirname(ROOT)                                              # ComfyUI
TEMPLATE = os.path.join(ROOT, "data", "_templates", "comfy", "scene_flux2_klein_api.json")

# Номера узлов, на которые смотрит движок. Меняешь здесь — меняй в
# flux2.engine.ts, иначе патч попадёт в пустоту.
POSITIVE_ID = "3"
LATENT_ID   = "5"
SCHED_ID    = "16"
NOISE_ID    = "18"
GUIDER_ID   = "19"
SAVE_ID     = "8"
VAE_ID      = "11"
MAX_REFS    = 3
REF_LOAD_BASE = 21   # 21..23 LoadImage
REF_ENC_BASE  = 24   # 24..26 VAEEncode
REF_SET_BASE  = 27   # 27..29 ReferenceLatent


def expand_references(api, filenames):
    """Достроить цепочку референсов. СПЕЦИФИКАЦИЯ для движка.

    Каждый референс — свой LoadImage → VAEEncode → ReferenceLatent, и
    ReferenceLatent'ы сцепляются последовательно: узел умеет ровно один латент
    за раз («you can chain multiple to set multiple reference images»,
    comfy_extras/nodes_edit_model.py). Хвост цепочки уходит в BasicGuider.
    """
    api = copy.deepcopy(api)
    if not filenames:
        return api
    if len(filenames) > MAX_REFS:
        raise ValueError("референсов больше %d: %d" % (MAX_REFS, len(filenames)))

    prev = api[GUIDER_ID]["inputs"]["conditioning"]          # [POSITIVE_ID, 0]
    for i, name in enumerate(filenames):
        load_id = str(REF_LOAD_BASE + i)
        enc_id  = str(REF_ENC_BASE + i)
        set_id  = str(REF_SET_BASE + i)
        api[load_id] = {"class_type": "LoadImage", "inputs": {"image": name}}
        api[enc_id]  = {"class_type": "VAEEncode",
                        "inputs": {"pixels": [load_id, 0], "vae": [VAE_ID, 0]}}
        api[set_id]  = {"class_type": "ReferenceLatent",
                        "inputs": {"conditioning": prev, "latent": [enc_id, 0]}}
        prev = [set_id, 0]
    api[GUIDER_ID]["inputs"]["conditioning"] = prev
    return api


def split_entry(entry):
    typ = entry[0] if isinstance(entry, (list, tuple)) else entry
    opts = entry[1] if isinstance(entry, (list, tuple)) and len(entry) > 1 else {}
    return typ, (opts if isinstance(opts, dict) else {})


def is_link(v):
    return isinstance(v, list) and len(v) == 2 and isinstance(v[0], str)


def check(api, mappings, label):
    problems = []
    for nid, node in sorted(api.items(), key=lambda kv: int(kv[0])):
        ctype = node.get("class_type")
        cls = mappings.get(ctype)
        if cls is None:
            problems.append("[%s] %s: класс не зарегистрирован в этой сборке" % (nid, ctype))
            continue
        spec = cls.INPUT_TYPES()
        req = spec.get("required") or {}
        opt = spec.get("optional") or {}
        known = dict(req)
        known.update(opt)

        for name in node.get("inputs", {}):
            if name not in known:
                problems.append("[%s] %s: вход «%s» не существует (есть: %s)"
                                % (nid, ctype, name, ", ".join(sorted(known)) or "—"))
        for name in req:
            if name not in node.get("inputs", {}):
                problems.append("[%s] %s: не задан обязательный вход «%s»" % (nid, ctype, name))

        for name, value in node.get("inputs", {}).items():
            if name not in known:
                continue
            typ, _ = split_entry(known[name])
            if is_link(value):
                if value[0] not in api:
                    problems.append("[%s] %s.%s: висячая связь на узел %s"
                                    % (nid, ctype, name, value[0]))
                continue
            if isinstance(typ, (list, tuple)):
                allowed = list(typ)
                if value not in allowed:
                    shown = allowed[:8] + (["…"] if len(allowed) > 8 else [])
                    problems.append("[%s] %s.%s = %r — нет в списке (%d вариантов: %s)"
                                    % (nid, ctype, name, value, len(allowed), ", ".join(map(str, shown))))

        if ctype == "EmptyFlux2LatentImage":
            for dim in ("width", "height"):
                v = node["inputs"].get(dim)
                if isinstance(v, int) and v % 16:
                    problems.append("[%s] %s.%s = %d — не кратно 16" % (nid, ctype, dim, v))

    print("\n=== %s: %d узлов ===" % (label, len(api)))
    if problems:
        for p in problems:
            print("  ✗ " + p)
    else:
        print("  ✓ замечаний нет")
    return problems


def coherence(api):
    """Проверки связности, которых INPUT_TYPES не видит."""
    problems = []
    sched, latent = api[SCHED_ID]["inputs"], api[LATENT_ID]["inputs"]
    if (sched["width"], sched["height"]) != (latent["width"], latent["height"]):
        problems.append("Flux2Scheduler %dx%d не совпадает с латентом %dx%d — "
                        "расписание сигм считается по длине последовательности, "
                        "и рассинхрон тихо портит шумоподавление"
                        % (sched["width"], sched["height"], latent["width"], latent["height"]))
    # guidance-эмбеда у klein нет: FluxGuidance в графе был бы ошибкой
    for nid, node in api.items():
        if node.get("class_type") in ("FluxGuidance", "CFGGuider"):
            problems.append("[%s] %s: klein guidance-distilled (ключей guidance_in в файле "
                            "модели нет) — узлу здесь делать нечего" % (nid, node["class_type"]))
    print("\n=== связность ===")
    for p in problems:
        print("  ✗ " + p)
    if not problems:
        print("  ✓ замечаний нет")
    return problems


async def main():
    sys.path.insert(0, COMFY)
    os.chdir(COMFY)
    import nodes
    await nodes.init_extra_nodes(init_custom_nodes=False, init_api_nodes=False)
    mappings = nodes.NODE_CLASS_MAPPINGS

    base = json.loads(io.open(TEMPLATE, encoding="utf-8").read())
    bad = []
    bad += check(base, mappings, "базовый шаблон (без референсов)")
    bad += coherence(base)
    # Имена берём РЕАЛЬНЫЕ из комбо LoadImage: этот вход — список файлов в
    # ComfyUI/input, и выдуманное имя завалило бы проверку комбо, ничего не
    # сказав о графе. Во время рендера якоря туда стажируются заранее, как на
    # пути Qwen.
    pool = list(mappings["LoadImage"].INPUT_TYPES()["required"]["image"][0])
    for n in (1, 2, 3):
        names = [pool[i % len(pool)] for i in range(n)]
        bad += check(expand_references(base, names), mappings,
                     "расширение: %d референс(ов)" % n)

    print("\n" + ("ПРОВАЛ: %d замечаний" % len(bad) if bad else "ВСЁ ЧИСТО"))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    asyncio.run(main())
