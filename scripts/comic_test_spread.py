# -*- coding: utf-8 -*-
"""
TEMPORARY (user 2026-08-01): render ONE spread of the comic export as a plain
PNG — the fully BAKED look (panel stills + marker frames + desk props + page
stacks), i.e. what the camera sees on that spread's wide moments — so the
desk / props / paper styling can be iterated in seconds instead of a full
CapCut draft build. Wired to POST projects/:id/export/comic/test-spread
(exports.service.ts); delete this script together with that endpoint.

    python comic_test_spread.py --manifest m.json --out spread.png
                                [--spread 0] [--supersample 2]

Needs PIL only (the kohya venv python is fine); the manifest must be built
first (comic_manifest.py --pack), so the panel stills already exist on disk.
"""
from __future__ import annotations

import argparse
import json

from comic_pagebuild import render_page


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--spread", type=int, default=0)
    # 2 is plenty for an eyeball check (3840x2160) and renders several times
    # faster than the export's default 4.
    ap.add_argument("--supersample", type=int, default=2)
    args = ap.parse_args()

    with open(args.manifest, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    pages = manifest.get("pages") or []
    if not pages:
        raise SystemExit("manifest has no pages — is the film rendered?")
    idx = max(0, min(args.spread, len(pages) - 1))
    page = pages[idx]
    pidx = int(page.get("pageIndex", idx))

    # same page-stack progress the real export computes for this spread
    page_total = int(manifest.get("page_total") or 0) \
        or (max((int(p.get("pageIndex", 0)) for p in pages), default=0) + 1)
    progress = (pidx / (page_total - 1)) if page_total > 1 else 0.0

    img = render_page(
        width=int(manifest.get("width", 1920)),
        height=int(manifest.get("height", 1080)),
        panels=page.get("panels") or [],
        style_name=str(manifest.get("page_style") or "old_comic"),
        texture_path=manifest.get("texture_path") or None,
        supersample=args.supersample,
        seed=pidx + 1,
        bake_content=True,
        draw_frames=True,
        progress=progress,
        desk_props=manifest.get("desk_props") or None,
        desk_color=manifest.get("desk_color") or None,
    )
    img.save(args.out)
    print(f"wrote {args.out} ({img.width}x{img.height}, spread {pidx})")


if __name__ == "__main__":
    main()
