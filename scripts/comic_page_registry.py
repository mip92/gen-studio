# -*- coding: utf-8 -*-
"""
Registry of comic panel SHAPES and PAGE TEMPLATES (template-layout mode).

Loads and validates the two data files that are the single source of truth
for the whole feature:

    comic_page_shapes.json     — 4 shapes, pixel sizes for every render stage
    comic_page_templates.json  — ~10 named page layouts (slots with rect,
                                 shape and explicit camera reading order)

Rects in a template are normalized to ONE PAGE (0..1 both axes). The page is
the portrait half of the 16:9 sheet, so a page-normalized rect maps to pixels
through the PAGE BOX below — the validator checks that every rect's PIXEL
aspect matches its shape's aspect (contain-fit then fills the rect exactly,
no letterboxing inside the ink frame).

All templates must share the same outer block (width 1.0, height BLOCK_H,
vertically centred): the drawn paper page is derived from the union bbox of
the panels (comic_page_style._page_boxes), so equal bboxes keep the book from
"jumping" between spreads — a hard user requirement.

Read by comic_manifest.py (template mode) and the NestJS registry service.
CLI: python comic_page_registry.py   → validation report, exit 1 on errors.
"""
from __future__ import annotations

import json
import math
import os
from typing import Dict, List, Tuple

_HERE = os.path.dirname(os.path.abspath(__file__))
SHAPES_PATH = os.path.join(_HERE, "comic_page_shapes.json")
TEMPLATES_PATH = os.path.join(_HERE, "comic_page_templates.json")

# ── page geometry ─────────────────────────────────────────────────────────────
# MUST mirror the sheet constants in comic_manifest.py (MARGIN/MARGIN_Y/FOOT/
# SIDE/SPINE). They are duplicated on purpose: comic_manifest keeps its own
# copy on the untouched legacy path; the template path builds its page boxes
# from here. Retune the book => update BOTH files.
MARGIN = 0.015
MARGIN_Y = 0.040
FOOT = 0.090
SIDE = 0.040
SPINE = 0.025

SHEET_W, SHEET_H = 1920.0, 1080.0   # nominal canvas — only the RATIO matters

# Sheet-normalized page boxes (x0, x1); y is shared.
PAGE_Y0, PAGE_Y1 = MARGIN_Y, 1.0 - MARGIN_Y - FOOT
PAGE_BOX_LEFT = (MARGIN + SIDE, 0.5 - SPINE / 2.0)
PAGE_BOX_RIGHT = (0.5 + SPINE / 2.0, 1.0 - MARGIN - SIDE)

# Pixel aspect of a page-normalized unit square: rect_px_aspect = (w/h)*K_PAGE.
_PW = PAGE_BOX_LEFT[1] - PAGE_BOX_LEFT[0]
_PH = PAGE_Y1 - PAGE_Y0
K_PAGE = (_PW * SHEET_W) / (_PH * SHEET_H)

# Standard panel block shared by every template (page-normalized).
BLOCK_H = 0.8
BLOCK_Y0 = (1.0 - BLOCK_H) / 2.0

ASPECT_TOL = 0.02      # rect-vs-shape pixel aspect mismatch tolerance (2%)
STAGE_ASPECT_TOL = 0.02


def load_shapes() -> Dict[str, dict]:
    with open(SHAPES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["shapes"]


def load_templates() -> List[dict]:
    with open(TEMPLATES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["templates"]


def template_by_id(templates: List[dict], template_id: str) -> dict | None:
    for t in templates:
        if t["id"] == template_id:
            return t
    return None


def rect_px_aspect(rect: dict) -> float:
    """Pixel aspect (w/h) of a page-normalized rect on the real sheet."""
    return (rect["w"] / rect["h"]) * K_PAGE


def rect_to_sheet(rect: dict, side: str) -> dict:
    """Map a page-normalized rect to SHEET-normalized coords ('left'|'right')."""
    x0, x1 = PAGE_BOX_LEFT if side == "left" else PAGE_BOX_RIGHT
    pw, ph = x1 - x0, PAGE_Y1 - PAGE_Y0
    return {
        "x": x0 + rect["x"] * pw,
        "y": PAGE_Y0 + rect["y"] * ph,
        "w": rect["w"] * pw,
        "h": rect["h"] * ph,
    }


def slots_in_reading_order(template: dict) -> List[dict]:
    return sorted(template["slots"], key=lambda s: s["order"])


# ── validation ────────────────────────────────────────────────────────────────

def _is_even_pair(v) -> bool:
    return (isinstance(v, list) and len(v) == 2
            and all(isinstance(x, int) and x > 0 and x % 2 == 0 for x in v))


def validate_shapes(shapes: Dict[str, dict]) -> List[str]:
    errs: List[str] = []
    if not shapes:
        return ["shapes: empty"]
    for key, sh in shapes.items():
        a = sh.get("aspect")
        if not isinstance(a, (int, float)) or a <= 0:
            errs.append(f"shape {key}: bad aspect {a!r}")
            continue
        gen = sh.get("gen") or {}
        for fam in ("sdxl", "flux", "qwen"):
            if not _is_even_pair(gen.get(fam)):
                errs.append(f"shape {key}: gen.{fam} must be a pair of positive even ints")
        for stage in ("wan", "smooth", "still"):
            if not _is_even_pair(sh.get(stage)):
                errs.append(f"shape {key}: {stage} must be a pair of positive even ints")
        wan = sh.get("wan")
        if _is_even_pair(wan) and (wan[0] % 16 or wan[1] % 16):
            errs.append(f"shape {key}: wan {wan} must be multiples of 16 (Wan 2.2 latent)")
        for stage, wh in [("gen." + f, gen.get(f)) for f in ("sdxl", "flux", "qwen")] + \
                         [(s, sh.get(s)) for s in ("wan", "smooth", "still")]:
            if _is_even_pair(wh):
                sa = wh[0] / wh[1]
                if abs(sa - a) / a > STAGE_ASPECT_TOL:
                    errs.append(f"shape {key}: {stage} aspect {sa:.4f} deviates >"
                                f"{STAGE_ASPECT_TOL:.0%} from {a:.4f}")
    return errs


def _overlap_area(a: dict, b: dict) -> float:
    ox = max(0.0, min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]))
    oy = max(0.0, min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]))
    return ox * oy


def validate_templates(templates: List[dict], shapes: Dict[str, dict]) -> List[str]:
    errs: List[str] = []
    seen_ids = set()
    for t in templates:
        tid = t.get("id") or "<no id>"
        if tid in seen_ids:
            errs.append(f"template {tid}: duplicate id")
        seen_ids.add(tid)
        slots = t.get("slots") or []
        if not (2 <= len(slots) <= 7):
            errs.append(f"template {tid}: {len(slots)} slots (must be 2..7)")
        orders = sorted(s.get("order", -1) for s in slots)
        if orders != list(range(len(slots))):
            errs.append(f"template {tid}: order fields {orders} are not a dense 0..N-1 permutation")
        slot_ids = sorted(s.get("slot", -1) for s in slots)
        if slot_ids != list(range(len(slots))):
            errs.append(f"template {tid}: slot fields {slot_ids} are not dense 0..N-1")
        for s in slots:
            shape = s.get("shape")
            if shape not in shapes:
                errs.append(f"template {tid} slot {s.get('slot')}: unknown shape {shape!r}")
                continue
            r = s.get("rect") or {}
            if not all(isinstance(r.get(k), (int, float)) for k in ("x", "y", "w", "h")):
                errs.append(f"template {tid} slot {s.get('slot')}: malformed rect {r!r}")
                continue
            if r["w"] <= 0 or r["h"] <= 0 or r["x"] < -1e-6 or r["y"] < -1e-6 \
                    or r["x"] + r["w"] > 1.0 + 1e-6 or r["y"] + r["h"] > 1.0 + 1e-6:
                errs.append(f"template {tid} slot {s['slot']}: rect out of page bounds")
            want = shapes[shape]["aspect"]
            got = rect_px_aspect(r)
            if abs(got - want) / want > ASPECT_TOL:
                errs.append(f"template {tid} slot {s['slot']}: rect pixel aspect {got:.4f} "
                            f"!= shape '{shape}' aspect {want:.4f} (>{ASPECT_TOL:.0%})")
            pf = s.get("panelFrac")
            if pf is not None and not (0.3 <= pf <= 0.95):
                errs.append(f"template {tid} slot {s['slot']}: panelFrac {pf} outside 0.3..0.95")
        # pairwise overlap
        for i in range(len(slots)):
            for j in range(i + 1, len(slots)):
                if _overlap_area(slots[i]["rect"], slots[j]["rect"]) > 1e-4:
                    errs.append(f"template {tid}: slots {slots[i]['slot']} and "
                                f"{slots[j]['slot']} overlap")
        # shared outer block — the book must not "jump" between spreads
        if slots:
            x0 = min(s["rect"]["x"] for s in slots)
            x1 = max(s["rect"]["x"] + s["rect"]["w"] for s in slots)
            y0 = min(s["rect"]["y"] for s in slots)
            y1 = max(s["rect"]["y"] + s["rect"]["h"] for s in slots)
            if x0 > 0.005 or x1 < 0.995:
                errs.append(f"template {tid}: bbox width {x1 - x0:.3f} does not fill the page "
                            f"(x {x0:.3f}..{x1:.3f}; every template needs a full-width row)")
            if abs(y0 - BLOCK_Y0) > 0.012 or abs(y1 - (BLOCK_Y0 + BLOCK_H)) > 0.012:
                errs.append(f"template {tid}: bbox y {y0:.3f}..{y1:.3f} != standard block "
                            f"{BLOCK_Y0:.3f}..{BLOCK_Y0 + BLOCK_H:.3f} (pages would jump)")
    return errs


def validate() -> List[str]:
    try:
        shapes = load_shapes()
    except Exception as e:  # noqa: BLE001
        return [f"cannot load {SHAPES_PATH}: {e}"]
    try:
        templates = load_templates()
    except Exception as e:  # noqa: BLE001
        return [f"cannot load {TEMPLATES_PATH}: {e}"]
    return validate_shapes(shapes) + validate_templates(templates, shapes)


if __name__ == "__main__":
    problems = validate()
    if problems:
        for p in problems:
            print("ERROR:", p)
        raise SystemExit(1)
    shapes = load_shapes()
    templates = load_templates()
    print(f"OK: {len(shapes)} shapes, {len(templates)} templates "
          f"(K_PAGE={K_PAGE:.5f}, block y {BLOCK_Y0:.3f}..{BLOCK_Y0 + BLOCK_H:.3f})")
    for t in templates:
        counts: Dict[str, int] = {}
        for s in t["slots"]:
            counts[s["shape"]] = counts.get(s["shape"], 0) + 1
        mix = ", ".join(f"{v}x{k}" for k, v in sorted(counts.items()))
        print(f"  {t['id']:<20} {len(t['slots'])} panels  ({mix})")
