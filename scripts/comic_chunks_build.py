"""Render every chunk draft of a `comic_chunks` plan, in ONE process.

The backend spawns this detached and polls the disk for progress, exactly like the
single-draft comic build. Chunks are rendered sequentially because each one is
CPU-bound on PIL sheet rendering — running them in parallel would only trade wall
clock for RAM (each spread sheet is a 7680×4320 image).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from export_comic import build_comic_draft, _log   # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True, help="the *_chunks.json written by comic_chunks.py")
    a = ap.parse_args()

    plan = json.loads(Path(a.plan).read_text(encoding="utf-8"))
    chunks = plan.get("chunks") or []
    if not chunks:
        _log(f"no chunks in {a.plan}")
        return 2

    _log(f'comic chunks: building {len(chunks)} draft(s) for {plan.get("project_name")}')
    for c in chunks:
        mpath = Path(c["manifest"])
        if not mpath.exists():
            _log(f'chunk manifest missing, skipping: {mpath}')
            continue
        _log(f'=== part {c["part"]}/{c["of"]} — spreads {c["spread_from"]}-{c["spread_to"]} '
             f'({c["spreads"]}), expect {c["expected_us"]/1e6:.1f}s')
        build_comic_draft(json.loads(mpath.read_text(encoding="utf-8")))
    _log(f'comic chunks: all {len(chunks)} draft(s) done')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
