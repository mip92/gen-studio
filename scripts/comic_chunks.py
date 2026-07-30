"""Slice a FULL comic manifest into per-chunk manifests — the `comic_chunks` export.

Why this exists
---------------
The one-draft comic export writes a camera keyframe grid per spread, and a
feature-length film lands at ~215 MB of draft_content.json / 1.3M keyframes, which
CapCut needs minutes to open and often crashes on. The chunked export renders the
picture in several small drafts instead (~35 MB each, an empirically fine size),
each exported to mp4 by hand, and then reassembles ONE light final draft: flat video
plus LIVE narration, music and subtitles. All the hand work — cutting music, sizing
subtitles, trimming VO — happens once, in that final draft.

This script does not touch the full export in any way. A chunk manifest is a pure
DATA transformation of the full one:

  * `pages` sliced to the chunk's spread range;
  * `page_start_us` rebased so the chunk starts at 0 (panel times are already
    page-relative, so nothing else moves);
  * `narration` stripped from every panel, `music_tracks` emptied and
    `embed_subtitles` turned off — the chunks are SILENT video, since audio belongs
    in the final draft where it stays editable;
  * `turn_tail_page` set to the next chunk's first page so the chunk ends on a page
    flip rather than a hard cut (render-only; it never goes on the timeline).

The plan file it writes alongside is what the assembly step reads to place each
exported mp4 back on the film timeline.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
from pathlib import Path
from typing import Any, Dict, List


def _turn_us() -> int:
    """`export_comic.TURN_US`, read without importing the module: export_comic needs
    the kohya venv's pyJianYingDraft, while this script runs on the system python."""
    try:
        src = Path(__file__).with_name("export_comic.py").read_text(encoding="utf-8")
        m = re.search(r"^TURN_US\s*=\s*([0-9_]+)", src, re.M)
        if m:
            return int(m.group(1).replace("_", ""))
    except Exception:  # noqa: BLE001
        pass
    return 700_000


def plan_chunks(n_pages: int, per_chunk: int) -> List[range]:
    """Spread ranges, `per_chunk` each. A trailing remainder of one spread is folded
    into the previous chunk — a one-spread chunk would be its own export cycle for a
    minute of film, which is not worth the click."""
    if per_chunk < 1:
        per_chunk = 1
    bounds = [range(i, min(i + per_chunk, n_pages)) for i in range(0, n_pages, per_chunk)]
    if len(bounds) > 1 and len(bounds[-1]) == 1:
        last = bounds.pop()
        prev = bounds.pop()
        bounds.append(range(prev.start, last.stop))
    return bounds


def build(full_manifest: str, out_dir: str, per_chunk: int) -> Dict[str, Any]:
    full = json.loads(Path(full_manifest).read_text(encoding="utf-8"))
    pages = full.get("pages") or []
    if not pages:
        raise SystemExit(f"no pages in {full_manifest}")

    slug = full.get("project_name") or "project"
    base_name = str(full.get("draft_name") or f"{slug}_comic")
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    turn_us = _turn_us()
    ranges = plan_chunks(len(pages), per_chunk)
    total = len(ranges)

    chunks: List[Dict[str, Any]] = []
    for k, rng in enumerate(ranges, start=1):
        part_pages = copy.deepcopy(pages[rng.start:rng.stop])
        film_offset = int(part_pages[0].get("page_start_us") or 0)
        for pg in part_pages:
            pg["page_start_us"] = int(pg.get("page_start_us") or 0) - film_offset
            for pn in (pg.get("panels") or []):
                pn.pop("narration", None)          # silent: VO lives in the final draft

        draft_name = f"{base_name}_part{k}of{total}"
        m = dict(full)
        m["draft_name"] = draft_name
        m["pages"] = part_pages
        m["pages_dir"] = f'{full.get("output_root", ".")}/{draft_name}/pages'
        m["music_tracks"] = []
        m["embed_subtitles"] = False
        # render-only reference so this chunk ends ON the page flip
        m["turn_tail_page"] = copy.deepcopy(pages[rng.stop]) if rng.stop < len(pages) else None

        span = sum(int(p.get("page_duration_us") or 0) for p in part_pages)
        expected = span + (turn_us if m["turn_tail_page"] else 0)

        mpath = out / f"{draft_name}.json"
        mpath.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
        chunks.append({
            "part": k, "of": total, "draft_name": draft_name,
            "manifest": str(mpath).replace("\\", "/"),
            "spread_from": rng.start, "spread_to": rng.stop - 1, "spreads": len(part_pages),
            "film_offset_us": film_offset, "expected_us": expected,
            "ends_on_turn": bool(m["turn_tail_page"]),
        })

    plan = {
        "project_name": slug, "base_draft_name": base_name,
        "full_manifest": str(Path(full_manifest)).replace("\\", "/"),
        "spreads_total": len(pages), "per_chunk": per_chunk,
        "film_duration_us": max(int(p.get("page_start_us") or 0) + int(p.get("page_duration_us") or 0)
                                for p in pages),
        "chunks": chunks,
    }
    # Stable name: the draft base carries a build timestamp, but the backend and the
    # UI need one predictable path to read the plan back from.
    ppath = out / "comic_chunks_plan.json"
    ppath.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"wrote {total} chunk manifest(s) + plan {ppath}")
    for c in chunks:
        print(f"  part{c['part']}of{c['of']}: spreads {c['spread_from']}-{c['spread_to']} "
              f"({c['spreads']}), starts {c['film_offset_us']/1e6:7.1f}s, "
              f"expect {c['expected_us']/1e6:6.1f}s"
              + ("  +turn" if c["ends_on_turn"] else ""))
    return plan


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True, help="the FULL comic manifest to slice")
    ap.add_argument("--out-dir", required=True, help="where chunk manifests + plan are written")
    ap.add_argument("--per-chunk", type=int, default=4,
                    help="spreads per chunk (default 4 ~= 37 MB of draft, near the "
                         "35 MB size known to open comfortably)")
    a = ap.parse_args()
    build(a.manifest, a.out_dir, a.per_chunk)
