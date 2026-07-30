"""Assemble the FINAL `comic_chunks` draft from the rendered chunk mp4s.

The chunks carried the picture only. This builds the draft the user actually works
in: the exported mp4s laid back to back on one video track, and LIVE narration, BGM
and subtitles on top — so cutting music, sizing subtitles and trimming VO is done
once, here, instead of once per chunk.

Timing
------
Audio is placed against MEASURED video, not against the manifest's arithmetic. Each
mp4 is probed for its real duration; if CapCut's encoder hands back a chunk a few
frames off, every later chunk would otherwise drift, and the error would accumulate.
So each chunk gets `delta = measured_start - manifest_start`, and every audio/subtitle
event inside that chunk is shifted by its chunk's delta. Residual error is then
bounded by one chunk's own rounding (sub-frame in practice) instead of growing down
the film.
"""
from __future__ import annotations

import argparse
import json
import sys
from bisect import bisect_right
from pathlib import Path
from typing import Any, Dict, List, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pyJianYingDraft as draft                                   # noqa: E402
from export_capcut import rewrite_for_capcut_international, register_in_capcut  # noqa: E402
from export_comic import _place_bgm, _wav_duration_us, _log       # noqa: E402


def _measure_us(path: str) -> int:
    """Real duration of a rendered mp4, read the same way the comic exporter reads
    clip length — material duration, not a params/fps calculation."""
    return int(getattr(draft.VideoMaterial(path.replace("\\", "/")), "duration", 0) or 0)


def assemble(full_manifest: str, plan_path: str, files: Dict[int, str],
             draft_name: str | None = None) -> Path:
    full = json.loads(Path(full_manifest).read_text(encoding="utf-8"))
    plan = json.loads(Path(plan_path).read_text(encoding="utf-8"))
    chunks = sorted(plan.get("chunks") or [], key=lambda c: int(c["part"]))
    if not chunks:
        raise SystemExit(f"no chunks in {plan_path}")
    missing = [c["part"] for c in chunks if int(c["part"]) not in files]
    if missing:
        raise SystemExit(f"no mp4 given for part(s): {missing}")

    width  = int(full.get("width", 1920))
    height = int(full.get("height", 1080))
    fps    = int(full.get("fps", 30))
    name   = draft_name or f'{plan.get("base_draft_name", "comic")}_final'
    drafts_root = Path(full.get("capcut_drafts_root") or full.get("output_root") or ".")
    drafts_root.mkdir(parents=True, exist_ok=True)
    draft_dir = drafts_root / name

    script = draft.ScriptFile(width=width, height=height, fps=fps, maintrack_adsorb=False)
    script.add_track(draft.TrackType.video, "film")
    script.add_track(draft.TrackType.audio, "narration")

    # ── lay the chunks back to back, measuring as we go ──
    cursor = 0
    starts: List[Tuple[int, int, int]] = []     # (manifest_start, measured_start, part)
    _log(f'{"part":>5} {"file":<44} {"expected":>10} {"measured":>10} {"drift":>9}')
    for c in chunks:
        part = int(c["part"])
        p = str(files[part]).replace("\\", "/")
        if not Path(p).exists():
            raise SystemExit(f"part {part}: file not found: {p}")
        dur = _measure_us(p)
        if dur <= 0:
            raise SystemExit(f"part {part}: could not read duration of {p}")
        seg = draft.VideoSegment(
            draft.VideoMaterial(p, material_name=f'{name}_part{part}'),
            target_timerange=draft.Timerange(start=cursor, duration=dur),
            source_timerange=draft.Timerange(start=0, duration=dur))
        script.add_segment(seg, track_name="film")
        exp = int(c["expected_us"])
        _log(f'{part:>5} {Path(p).name[:44]:<44} {exp/1e6:>9.2f}s {dur/1e6:>9.2f}s '
             f'{(dur-exp)/1e6:>+8.2f}s')
        starts.append((int(c["film_offset_us"]), cursor, part))
        cursor += dur
    timeline_end_us = cursor

    # ── per-chunk correction: manifest time → measured timeline ──
    man_starts = [s[0] for s in starts]

    def shift(t: int) -> int:
        i = max(0, bisect_right(man_starts, int(t)) - 1)
        man0, meas0, _ = starts[i]
        return int(t) - man0 + meas0

    # ── narration + subtitle cues, from the FULL manifest (absolute times) ──
    subtitle_cues: List[Tuple[int, int, str]] = []
    n_vo = 0
    for page in (full.get("pages") or []):
        p_start = int(page.get("page_start_us") or 0)
        for panel in (page.get("panels") or []):
            narr = panel.get("narration")
            if not (narr and narr.get("path")):
                continue
            wav = str(narr["path"]).replace("\\", "/")
            actual = _wav_duration_us(wav)
            dur = actual if actual > 0 else int(narr.get("duration_us") or 0)
            if dur <= 0:
                continue
            start = shift(p_start + int(panel.get("arrival_us") or 0))
            script.add_segment(
                draft.AudioSegment(
                    draft.AudioMaterial(wav, material_name=f'{panel["shotCode"]}_narration'),
                    target_timerange=draft.Timerange(start=start, duration=dur)),
                track_name="narration")
            n_vo += 1
            txt = (narr.get("text") or "").strip()
            if txt:
                subtitle_cues.append((start, start + dur, txt))

    # ── BGM: shift each block by its chunk's delta, then reuse the normal placer ──
    music = []
    for mt in (full.get("music_tracks") or []):
        m2 = dict(mt)
        m2["block_start_us"] = shift(int(mt.get("block_start_us") or 0))
        music.append(m2)
    n_bgm = _place_bgm(script, {"music_tracks": music})

    draft_dir.mkdir(parents=True, exist_ok=True)
    out_path = draft_dir / "draft_content.json"
    script.dump(str(out_path))
    rewrite_for_capcut_international(
        out_path, subtitle_cues if full.get("embed_subtitles", True) else None, drafts_root)
    register_in_capcut(drafts_root, draft_dir, name, timeline_end_us)

    drift = timeline_end_us - int(plan.get("film_duration_us") or timeline_end_us)
    _log(f'comic assemble: {len(chunks)} chunk(s) narration={n_vo} bgm={n_bgm} '
         f'subtitles={len(subtitle_cues)} duration={timeline_end_us/1e6:.1f}s '
         f'(vs manifest {(timeline_end_us-drift)/1e6:.1f}s, drift {drift/1e6:+.2f}s)')
    _log(f'OK {draft_dir}')
    return draft_dir


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True, help="the FULL comic manifest")
    ap.add_argument("--plan", required=True, help="the *_chunks.json plan")
    ap.add_argument("--files", required=True,
                    help='JSON: {"1": "C:/…/part1.mp4", "2": "…"} or a list in part order')
    ap.add_argument("--draft-name", default=None)
    a = ap.parse_args()

    raw: Any = json.loads(a.files)
    files = ({i + 1: p for i, p in enumerate(raw)} if isinstance(raw, list)
             else {int(k): v for k, v in raw.items()})
    assemble(a.manifest, a.plan, files, a.draft_name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
