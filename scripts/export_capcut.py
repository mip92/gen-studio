"""
Export a gen-studio project to a CapCut / JianYing draft folder.

Reads a manifest JSON from --manifest path (built by the Node backend), writes
the CapCut draft via pyJianYingDraft DIRECTLY into CapCut's drafts directory
(`capcut_drafts_root`), then registers the draft in CapCut's index
(`<capcut_drafts_root>/root_meta_info.json`) and writes a per-draft metadata
file. After this the project shows up in CapCut's launcher without any manual
copy step.

Manifest schema (see ExportsService.buildManifest for the writer):

{
  "project_name":       "night_courier",
  "draft_name":         "night_courier_20260518_2230",     # subfolder name
  "output_root":        "E:/.../data/<slug>/exports/capcut",  # for debug/audit
  "capcut_drafts_root": "C:/Users/<u>/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft",
  "width":              1920,
  "height":             1080,
  "fps":                30,
  "transition_preset":  "default" | "comic",   # shot-boundary transition style
  "background_fill":    "blur" | "color" | "",  # optional; vertical Shorts: fill
                                                #   the canvas behind a 16:9 clip
                                                #   in a 9:16 frame. "" = legacy.
  "scenes": [                      # one entry per ACT (Scene row; real keys look
    {                              #   like "act_01_boarding" / "origin" / "A1")
      "sceneKey":   "act_01_boarding",
      "narration":  { "path": "...wav", "duration_us": 12345678 } | null,
      "shots": [
        # animated shot, legacy clip timing (no kind/source_us):
        { "shotCode": "A1_SH01", "path": "...mp4", "duration_us": 5062500 },
        # animated shot slowed to the VO (narration timing):
        { "shotCode": "A1_SH02", "path": "...mp4", "duration_us": 11000000, "source_us": 5062500 },
        # static shot — still PNG held + Ken Burns:
        { "shotCode": "A1_SH03", "path": "...png", "duration_us": 9000000, "kind": "image" },
        ...
      ]
    }
  ]
}

Output: prints "OK <absolute draft folder>" to stdout on success, errors to
stderr with non-zero exit. The draft folder lives at
`<capcut_drafts_root>/<draft_name>` once we're done.

Note on path conventions: CapCut's own writer uses a mix-format on Windows —
forward slashes for the folder chain, backslash for the final filename
segment (`.../com.lveditor.draft/<draft>\\draft_content.json`), and pure
backslashes for `draft_root_path`. We mirror those formats here so the
launcher accepts the entry.
"""
from __future__ import annotations

import argparse
import json
import random
import shutil
import sys
import time
import uuid
import wave
from pathlib import Path
from typing import Dict, Any, List, Tuple

import pyJianYingDraft as draft


# Safety margin shaved off every probed wav length (microseconds). pyJianYingDraft's
# internal material-duration calc floors differently than our wave.getnframes()
# read — observed up to a 500µs over-report on Silero 48kHz output. We trim 5ms
# (inaudible) so the AudioSegment timerange is always strictly within bounds.
_WAV_TRIM_MARGIN_US = 5_000


def _wav_duration_us(path: str) -> int:
    """Return wav duration in microseconds via stdlib `wave`, minus a small
    safety margin so the value is always strictly less than what
    pyJianYingDraft computes internally. Returns 0 if the file isn't a
    readable PCM wav."""
    try:
        with wave.open(path, 'rb') as w:
            frames = w.getnframes()
            rate   = w.getframerate()
            if rate <= 0 or frames <= 0:
                return 0
            # Floor (not round) — pyJianYingDraft floors too on its side.
            raw_us = (frames * 1_000_000) // rate
            return max(0, raw_us - _WAV_TRIM_MARGIN_US)
    except Exception as e:  # noqa: BLE001
        _log(f'wav probe failed for {path}: {e!r}')
        return 0


def _audio_duration_us(path: str) -> int:
    """Duration of an arbitrary audio file in microseconds. Used for BGM flacs
    from ACE-Step (Silero TTS hits the wav branch above directly). Returns 0
    on failure so the caller can fall back to the manifest's declared duration.
    Order of attempts: stdlib `wave` (cheap, no deps) → `soundfile` (usually
    present in the kohya venv that runs the exporter — Silero uses it too) →
    give up. Never raises."""
    if path.lower().endswith('.wav'):
        return _wav_duration_us(path)
    try:
        import soundfile as sf  # type: ignore
        info = sf.info(path)
        if info.samplerate <= 0 or info.frames <= 0:
            return 0
        raw_us = (info.frames * 1_000_000) // info.samplerate
        return max(0, raw_us - _WAV_TRIM_MARGIN_US)
    except Exception as e:  # noqa: BLE001
        _log(f'audio probe failed for {path}: {e!r}')
        return 0


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


# ── Subtitles from the voiceover text ───────────────────────────────────────
# We know the exact timeline position + length of every voiceover line (it's
# how the narration lane is laid out below), and the line's source text
# (manifest narration.text = TTSJob.text). So we build subtitles straight from
# that text instead of relying on CapCut's auto-recognition, which mangles
# f5/RUAccent output. Two deliverables, both perfectly synced to the audio:
#
#   1. A native CapCut RECOGNISED-SUBTITLE group injected into the draft. This
#      is NOT a plain text track (pyJianYingDraft's TextSegment produces a
#      flag=0 text track that CapCut treats as loose text — you can't batch-
#      style it or apply a subtitle animation template). We instead clone the
#      exact shape CapCut writes for auto-recognised captions, reverse-
#      engineered from a real draft on this machine:
#        • a text track with flag=1              (marks it as a subtitle track)
#        • per cue: a material with type='subtitle', a SHARED group_id, plus
#          language / words / recognize_* scaffolding                (the group)
#        • per cue: a sticker_animation placeholder in material_animations
#          referenced from the segment's extra_material_refs   (the slot CapCut
#          fills when you apply an animation template to the whole group)
#      Result: the captions land in CapCut's subtitle panel and accept a
#      one-click batch animation template, exactly like recognised subtitles —
#      but with our correct text and timing, no speech-to-text.
#   2. A sidecar <draft>.srt next to draft_content.json — a plain file the user
#      can import elsewhere if they'd rather manage captions by hand.
#
# Set manifest["embed_subtitles"]=false to skip the native group (the .srt is
# still written).
_SRT_MAX_CHARS = 84   # ≈ two 42-char lines; longer cues get split by words

# Native subtitle styling / placement. Values mirror CapCut's recognised-
# subtitle defaults read from a real draft: white fill, black stroke, centered,
# parked at transform_y ≈ -0.737 (half-canvas units, negative = lower third).
_SUB_FONT_SIZE      = 5.0     # CapCut's own recognised-caption default size
_SUB_TRANSFORM_Y    = -0.7368493150684934
# VERTICAL (9:16) exports park the captions HIGHER. On a Shorts player the bottom
# strip is covered by YouTube's own chrome — title, channel, description, the
# like/comment/share rail — so a caption in the usual lower third is partly hidden
# (user 2026-07-26). Measured off the short the user re-positioned by hand
# (kept_woman_short_hook): y = -0.404 puts the line at ~70% of frame height,
# 572 px above the bottom of a 1080×1920 frame, clear of the UI.
_SUB_TRANSFORM_Y_VERTICAL = -0.40443173265091104
_SUB_STROKE_WIDTH   = 0.06
_SUB_MAX_LINE_WIDTH = 0.82


def _fmt_srt_ts(us: int) -> str:
    """Microseconds → SRT timestamp 'HH:MM:SS,mmm'."""
    us = max(0, int(us))
    ms_total = us // 1000
    h  = ms_total // 3_600_000
    m  = (ms_total % 3_600_000) // 60_000
    s  = (ms_total % 60_000) // 1000
    ms = ms_total % 1000
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def _split_cue(start_us: int, end_us: int, text: str):
    """Split one voiceover line into readable SRT cues.

    We have no word-level timing, only the whole line's [start, end]. So pack
    words greedily into ≤_SRT_MAX_CHARS chunks and hand each chunk a slice of
    the line's duration proportional to its character length. A short line
    stays a single cue (byte-identical to "one cue per shot")."""
    text = ' '.join(text.split())
    if not text:
        return []
    words = text.split(' ')
    chunks: List[str] = []
    cur = ''
    for w in words:
        if cur and len(cur) + 1 + len(w) > _SRT_MAX_CHARS:
            chunks.append(cur)
            cur = w
        else:
            cur = f'{cur} {w}' if cur else w
    if cur:
        chunks.append(cur)
    if len(chunks) <= 1:
        return [(start_us, end_us, text)]
    total_chars = sum(len(c) for c in chunks) or 1
    span = max(0, end_us - start_us)
    out = []
    t = start_us
    for i, c in enumerate(chunks):
        e = end_us if i == len(chunks) - 1 else t + (span * len(c)) // total_chars
        out.append((t, e, c))
        t = e
    return out


def _write_srt(cues: List[tuple], path: Path) -> int:
    """Write cues [(start_us, end_us, text), ...] to an SRT file. Cues are
    sorted by start; each is split into readable sub-cues first. Returns the
    number of SRT entries written."""
    expanded: List[tuple] = []
    for start_us, end_us, text in sorted(cues, key=lambda c: c[0]):
        expanded.extend(_split_cue(start_us, end_us, text))
    lines: List[str] = []
    for i, (start_us, end_us, text) in enumerate(expanded, 1):
        lines.append(str(i))
        lines.append(f'{_fmt_srt_ts(start_us)} --> {_fmt_srt_ts(end_us)}')
        lines.append(text)
        lines.append('')
    # SRT convention: CRLF line endings, trailing blank line.
    path.write_text('\r\n'.join(lines) + '\r\n', encoding='utf-8')
    return len(expanded)


def _resolve_capcut_font(drafts_root: Path) -> str:
    """Best-effort absolute path to CapCut's bundled system font.

    Recognised-subtitle materials CapCut writes carry a concrete font path
    (…/CapCut/Apps/<ver>/Resources/Font/SystemFont/en.ttf). We mirror that so
    the caption renders identically; the app-version folder changes between
    installs, so glob for the newest one. `drafts_root` is
    …/CapCut/User Data/Projects/com.lveditor.draft — the CapCut root is three
    levels up. Returns '' when nothing is found (CapCut then falls back to its
    default font, which is fine)."""
    try:
        capcut_root = drafts_root.parent.parent.parent      # …/CapCut
        apps = capcut_root / "Apps"
        candidates = sorted(apps.glob("*/Resources/Font/SystemFont/en.ttf"))
        if candidates:
            return str(candidates[-1]).replace("\\", "/")
    except Exception as e:  # noqa: BLE001
        _log(f'font resolve failed: {e!r}')
    return ''


def _subtitle_content(text: str, font_path: str) -> str:
    """The `content` blob of a subtitle material: white fill + black stroke,
    matching CapCut's recognised-caption default. JSON-encoded string (CapCut
    stores `content` as an embedded JSON string, not a nested object)."""
    style = {
        "fill":    {"alpha": 1.0, "content": {"render_type": "solid",
                    "solid": {"alpha": 1.0, "color": [1.0, 1.0, 1.0]}}},
        "strokes": [{"content": {"render_type": "solid",
                    "solid": {"alpha": 1.0, "color": [0.0, 0.0, 0.0]}},
                    "width": _SUB_STROKE_WIDTH, "mode": 0}],
        "range":   [0, len(text)],
        "size":    _SUB_FONT_SIZE,
    }
    if font_path:
        style["font"] = {"id": "", "path": font_path}
    return json.dumps({"text": text, "styles": [style]}, ensure_ascii=False)


def _build_subtitle_words(text: str, dur_us: int) -> Dict[str, Any]:
    """Synthesise a word-level timing map for one cue by splitting on spaces and
    handing each token a share of the cue duration proportional to its length.
    CapCut needs this `words` map for word-by-word subtitle animation templates;
    we have no real word timing, so proportional spacing is the best estimate."""
    toks = text.split(' ')
    total = sum(len(t) for t in toks) or 1
    dur_ms = max(1, dur_us // 1000)
    starts, ends, words = [], [], []
    t = 0
    for i, tok in enumerate(toks):
        e = dur_ms if i == len(toks) - 1 else t + (dur_ms * len(tok)) // total
        starts.append(t); ends.append(e); words.append(tok)
        t = e
    return {"start_time": starts, "end_time": ends, "text": words}


def _build_subtitle_material(mat_id: str, text: str, dur_us: int,
                             group_id: str, font_path: str) -> Dict[str, Any]:
    """One recognised-subtitle text material, cloned from the field set CapCut
    writes for auto-recognition. The fields that make CapCut treat this as a
    caption (not loose text) and group it for batch editing: type='subtitle',
    a shared `group_id`, `language`, `add_type`=1, `recognize_type`=0, and the
    `words` timing map. Styling fields mirror the recognised-caption default."""
    content = _subtitle_content(text, font_path)
    return {
        "id":              mat_id,
        "type":            "subtitle",
        "content":         content,
        "base_content":    content,
        # Recognition scaffolding. task_id/model left blank — we're not backed
        # by a cloud recognition job, but the grouping fields below are what
        # CapCut actually keys the subtitle panel + batch templates off of.
        "recognize_task_id": "",
        "recognize_text":    text,
        "recognize_model":   "",
        "punc_model":        "",
        "recognize_type":    0,
        "add_type":          1,
        "group_id":          group_id,
        "language":          "ru-RU",
        "words":             _build_subtitle_words(text, dur_us),
        "current_words":     {"start_time": [], "end_time": [], "text": []},
        # Styling / layout defaults (match CapCut recognised captions).
        "alignment":         1,
        "typesetting":       0,
        "line_feed":         1,
        "line_spacing":      0.02,
        "letter_spacing":    0.0,
        "line_max_width":    _SUB_MAX_LINE_WIDTH,
        "force_apply_line_max_width": False,
        "text_color":        "#ffffff",
        "text_alpha":        1.0,
        "border_color":      "#000000",
        "border_alpha":      1.0,
        "border_width":      _SUB_STROKE_WIDTH,
        "border_mode":       0,
        "font_size":         _SUB_FONT_SIZE,
        "font_path":         font_path,
        "font_id":           "",
        "font_title":        "none",
        "has_shadow":        False,
        "underline":         False,
        "italic_degree":     0,
        "bold_width":        0.0,
        "check_flag":        15,
        "global_alpha":      1.0,
        "combo_info":            {"text_templates": []},
        "caption_template_info": {"resource_id": "", "third_resource_id": "",
            "resource_name": "", "category_id": "", "category_name": "",
            "effect_id": "", "request_id": "", "path": "", "is_new": False,
            "source_platform": 0},
        "name":              "",
        "fixed_width":       -1.0,
        "fixed_height":      -1.0,
    }


def _build_subtitle_segment(seg_id: str, mat_id: str, anim_id: str,
                            start_us: int, dur_us: int, render_index: int,
                            transform_y: float = _SUB_TRANSFORM_Y) -> Dict[str, Any]:
    """One subtitle segment: links its text material + its sticker_animation
    placeholder (`extra_material_refs`), positions the caption vertically
    (`clip.transform.y` — see the two _SUB_TRANSFORM_Y* constants; vertical
    exports sit higher to clear the Shorts UI), and carries the render-layer
    bookkeeping CapCut expects. Mirrors a real recognised-subtitle segment."""
    return {
        "id":               seg_id,
        "material_id":      mat_id,
        "extra_material_refs": [anim_id],
        "target_timerange": {"start": int(start_us), "duration": int(dur_us)},
        "source_timerange": None,
        "render_timerange": {"start": 0, "duration": 0},
        "render_index":     render_index,
        "track_render_index": 0,
        "track_attribute":  0,
        "clip": {
            "scale":     {"x": 1.0, "y": 1.0},
            "rotation":  0.0,
            "transform": {"x": 0.0, "y": float(transform_y)},
            "flip":      {"vertical": False, "horizontal": False},
            "alpha":     1.0,
        },
        "uniform_scale":    {"on": True, "value": 1.0},
        "speed":            1.0,
        "volume":           1.0,
        "last_nonzero_volume": 1.0,
        "visible":          True,
        "state":            0,
        "desc":             "",
        "group_id":         "",
        "is_placeholder":   False,
        "is_loop":          False,
        "is_tone_modify":   False,
        "reverse":          False,
        "intensifies_audio": False,
        "cartoon":          False,
        "enable_adjust":    False,
        "enable_lut":       False,
        "keyframe_refs":    [],
        "common_keyframes": [],
        "caption_info":     None,
        "template_id":      "",
        "template_scene":   "default",
        "source":           "segmentsourcenormal",
        "responsive_layout": {"enable": False, "target_follow": "",
            "size_layout": 0, "horizontal_pos_layout": 0, "vertical_pos_layout": 0},
    }


def _inject_subtitles(data: Dict[str, Any], cues: List[tuple],
                      drafts_root: Path, group_id: str) -> int:
    """Mutate a loaded draft_content.json dict: add a recognised-subtitle group
    built from `cues`. Splits each cue like the SRT, then appends one subtitle
    material + one sticker_animation placeholder per chunk, and a single flag=1
    text track holding all the segments. Returns the number of cues written."""
    expanded: List[tuple] = []
    for start_us, end_us, text in sorted(cues, key=lambda c: c[0]):
        expanded.extend(_split_cue(start_us, end_us, text))
    if not expanded:
        return 0

    materials = data.setdefault("materials", {})
    texts     = materials.setdefault("texts", [])
    anims     = materials.setdefault("material_animations", [])
    tracks    = data.setdefault("tracks", [])
    font_path = _resolve_capcut_font(drafts_root)

    # Portrait canvas → this is a Short, so lift the captions clear of YouTube's
    # bottom chrome. Keyed off the canvas rather than a flag, so every 9:16 export
    # (shorts today, anything vertical later) gets it without a caller opting in.
    cc = data.get("canvas_config") or {}
    vertical = int(cc.get("height") or 0) > int(cc.get("width") or 0)
    sub_y = _SUB_TRANSFORM_Y_VERTICAL if vertical else _SUB_TRANSFORM_Y

    # render_index must be unique + high; continue above the max already used
    # by video/text segments so we never collide with an existing layer.
    max_ri = 0
    for tr in tracks:
        for s in tr.get("segments", []):
            max_ri = max(max_ri, int(s.get("render_index") or 0))
    ri = max_ri + 1

    segments: List[Dict[str, Any]] = []
    for start_us, end_us, text in expanded:
        dur = max(1, int(end_us) - int(start_us))
        mat_id  = uuid.uuid4().hex
        anim_id = uuid.uuid4().hex
        seg_id  = uuid.uuid4().hex
        texts.append(_build_subtitle_material(mat_id, text, dur, group_id, font_path))
        anims.append({"id": anim_id, "type": "sticker_animation",
                      "animations": [], "multi_language_current": "none"})
        segments.append(_build_subtitle_segment(seg_id, mat_id, anim_id, start_us, dur, ri, sub_y))
        ri += 1

    tracks.append({
        "id":              uuid.uuid4().hex,
        "type":            "text",
        "flag":            1,          # ← marks the track as a subtitle group
        "attribute":       0,
        "name":            "",
        "is_default_name": True,
        "segments":        segments,
    })
    return len(segments)


# ── «видео уже на канале» overlay ───────────────────────────────────────────
# Shorts carry a permanent tilted text badge in the upper-right corner telling
# the viewer the full film is already on the channel. All values below are
# cloned field-for-field from a hand-made draft
# (honeywagon_short_hook_20260710_1647) where the user placed and styled the
# text once in CapCut; every export reproduces that exact material + segment,
# spanning the whole timeline. Gated by manifest["overlay_text"] (set by
# export_shorts.py; absent on full-film exports → no-op). The pink text effect
# must sit in CapCut's local effect cache (it does — the user applied it by
# hand); if the cache entry ever disappears we inject plain white text and log.
# ── channel-badge look pool ───────────────────────────────────────────────────
# The badge used to wear one style for the whole short. It now changes PER SCENE,
# in place, so the corner does not read as a static sticker (user 2026-07-26).
#
# Every id below is verified against this machine: the styles were picked by
# parsing the pink/magenta/violet fills out of `effectStyle.json` in CapCut's
# effect cache, and the animations were harvested from drafts the user actually
# built — that is the only place CapCut records an animation's DIRECTION, and an
# exit animation used as an entrance looks broken. All nine here are `in`.
# Anything missing from the cache is skipped at export time (`_capcut_effect_path`
# returns None), so a stale id degrades to the next combo, never to a broken draft.
_A_BUTTERFLY = ('7546305306863734032', 'Двойник из бабочек',      500_000)
_A_CANDY     = ('7545198366834134288', 'Конфетные пузырьки',      500_000)
_A_ATOM_UNI  = ('7576926250011364625', 'Атомная Вселенная',       500_000)
_A_ATOM_FIRE = ('7566796892605123856', 'Атомное пламя',           500_000)
_A_HEAT      = ('7648860835493727508', 'Бесконечный жар',         500_000)
_A_SPLASH    = ('7563868550243355921', 'Всплеск воды',            266_666)
_A_TYPING    = ('7586920364429593857', 'Диссонансное печатание',  500_000)
_A_SMOKE     = ('7648860705390611720', 'Дымовой рывок',           500_000)
_A_SPARKLE   = ('7648858257955507476', 'Сверкающий поток',        500_000)

# (style_resource_id, style_name, animation)
_OVERLAY_COMBOS: List[Tuple[str, str, Tuple[str, str, int]]] = [
    ('7592575945140309253', '粉色爱心巧克力',                        _A_BUTTERFLY),
    ('7573273105431317813', 'ART Neon EN Pink',                      _A_CANDY),
    ('7592604085279264053', 'розовый #f35592',                       _A_SPARKLE),
    ('7336837895367462150', '紫粉渐变上现蓝光',                       _A_ATOM_UNI),
    ('7516719077642079549', 'пудровый #febbe7',                      _A_SPLASH),
    ('7583659592408747269', 'Pixel Art Text NEON POP',                _A_TYPING),
    ('7660466147334130958', 'розовый #ff66a9',                       _A_CANDY),
    ('7586190165199047954', 'WHITE AND PURPLE',                      _A_SMOKE),
    ('7572048134856019253', 'лиловый #e1a7dc',                       _A_BUTTERFLY),
    ('7545175215735590197', 'ART EN GRAFFITI M9 Purple Text',        _A_ATOM_FIRE),
    ('7594846805288848693', 'магента #ba417b',                       _A_HEAT),
    ('7631934577736453377', 'Dynamic red flower hand-drawn',         _A_SPARKLE),
    ('231309949',           'фиолет #8218fe',                        _A_TYPING),
    ('7651169872193359112', 'Animated Hand-Drawn Texture M6 Love',   _A_SPLASH),
    ('7610225528531930384', 'фиолет #663399',                        _A_SMOKE),
    ('7576180793379228942', 'розовый',                               _A_ATOM_UNI),
    ('7631868553481719053', 'малиновый #ef2a4e',                     _A_CANDY),
    ('7592604085279264053', 'розовый #f35592',                       _A_ATOM_FIRE),
    ('7573273105431317813', 'ART Neon EN Pink',                      _A_HEAT),
    ('7592575945140309253', '粉色爱心巧克力',                        _A_TYPING),
]

_OVERLAY_EFFECT_ID   = '7592575945140309253'   # CapCut text effect «粉色爱心巧克力»
_OVERLAY_EFFECT_NAME = '粉色爱心巧克力'
_OVERLAY_CATEGORY_ID = '2037703895'            # its panel category ("hot")
_OVERLAY_FONT_SIZE   = 15.0
_OVERLAY_SCALE       = 0.7825962403387248
_OVERLAY_ROTATION    = 14.974092236899061      # degrees clockwise
_OVERLAY_TRANSFORM_X = 0.6958637469586375      # half-canvas units → upper-right
_OVERLAY_TRANSFORM_Y = 0.7931506849315069


def _build_overlay_material(mat_id: str, text: str, font_path: str,
                            effect_path) -> Dict[str, Any]:
    """The overlay's text material. Unlike the subtitle materials above this is
    plain type='text' (loose text, no group), white fill + the cached text
    effect; `use_effect_default_color` lets the effect supply its gradient."""
    style: Dict[str, Any] = {
        "fill":  {"content": {"render_type": "solid",
                  "solid": {"color": [1.0, 1.0, 1.0]}}},
        "size":  _OVERLAY_FONT_SIZE,
        "range": [0, len(text)],
    }
    if font_path:
        style["font"] = {"id": "", "path": font_path}
    if effect_path:
        style["effectStyle"] = {"id": _OVERLAY_EFFECT_ID, "path": effect_path}
    content = json.dumps({"text": text, "styles": [style]}, ensure_ascii=False)
    return {
        "id":                mat_id,
        "type":              "text",
        "content":           content,
        "base_content":      "",
        "recognize_task_id": "",
        "recognize_text":    "",
        "recognize_model":   "",
        "punc_model":        "",
        "recognize_type":    0,
        "add_type":          0,
        "group_id":          "",
        "language":          "",
        "words":             {"start_time": [], "end_time": [], "text": []},
        "current_words":     {"start_time": [], "end_time": [], "text": []},
        "alignment":         1,
        "typesetting":       0,
        "line_feed":         1,
        "line_spacing":      0.02,
        "letter_spacing":    0.0,
        "line_max_width":    0.82,
        "force_apply_line_max_width": False,
        "text_color":        "#FFFFFF",
        "text_alpha":        1.0,
        "border_color":      "",
        "border_alpha":      1.0,
        "border_width":      0.08,
        "border_mode":       0,
        "font_size":         _OVERLAY_FONT_SIZE,
        "font_path":         font_path,
        "font_id":           "",
        "font_title":        "none",
        "use_effect_default_color": True,
        "has_shadow":        False,
        "underline":         False,
        "italic_degree":     0,
        "bold_width":        0.0,
        "check_flag":        7,
        "text_size":         30,
        "global_alpha":      1.0,
        "combo_info":            {"text_templates": []},
        "caption_template_info": {"resource_id": "", "third_resource_id": "",
            "resource_name": "", "category_id": "", "category_name": "",
            "effect_id": "", "request_id": "", "path": "", "is_new": False,
            "source_platform": 0},
        "name":              "",
        "style_name":        "",
        "sub_type":          0,
        "layer_weight":      1,
        "initial_scale":     1.0,
        "is_rich_text":      False,
        "fixed_width":       -1.0,
        "fixed_height":      -1.0,
    }


def _pick_overlay_combos(drafts_root: Path, n: int, seed: str
                         ) -> List[Tuple[str, str, Tuple[str, str, int]]]:
    """`n` badge looks, each (style_id, style_name, animation), all verified to be
    in the local effect cache. Deterministic: the same project always draws the
    same sequence, so re-exporting a short does not reshuffle a look the user has
    already approved. Consecutive scenes never repeat a style — the pool is walked
    in a shuffled order and only wraps once exhausted."""
    usable = [c for c in _OVERLAY_COMBOS
              if _capcut_effect_path(str(drafts_root), c[0]) is not None]
    if not usable:
        _log('no badge styles found in the CapCut effect cache — plain white text')
        return []
    missing = len(_OVERLAY_COMBOS) - len(usable)
    if missing:
        _log(f'badge pool: {len(usable)} of {len(_OVERLAY_COMBOS)} looks available '
             f'({missing} not in the effect cache — apply them once in CapCut to enable)')
    rnd = random.Random(f'badge:{seed}')
    out: List[Tuple[str, str, Tuple[str, str, int]]] = []
    while len(out) < n:
        cycle = usable[:]
        rnd.shuffle(cycle)
        if out and len(cycle) > 1 and cycle[0][0] == out[-1][0]:
            cycle.append(cycle.pop(0))          # don't repeat across the wrap
        out.extend(cycle)
    return out[:n]


def _inject_text_overlay(data: Dict[str, Any], text: str,
                         spans: List[Tuple[int, int, str]],
                         drafts_root: Path, seed: str = '') -> None:
    """Mutate a loaded draft_content.json dict: add the channel badge as its own
    text track, parked tilted in the upper-right corner exactly where the user
    placed it by hand.

    `spans` is one (start_us, duration_us, key) per SCENE: the badge is re-emitted
    for each, in the same spot but with a different style + entrance animation from
    `_OVERLAY_COMBOS`, so the corner keeps re-announcing itself instead of sitting
    there as one static sticker. A single span reproduces the old full-length badge.
    """
    spans = [(int(s), int(d), k) for s, d, k in spans if int(d) > 0]
    if not spans:
        return
    materials = data.setdefault("materials", {})
    texts     = materials.setdefault("texts", [])
    anims     = materials.setdefault("material_animations", [])
    effects   = materials.setdefault("effects", [])
    tracks    = data.setdefault("tracks", [])

    font_path = _resolve_capcut_font(drafts_root)
    combos    = _pick_overlay_combos(drafts_root, len(spans), seed or text)

    max_ri = 0
    for tr in tracks:
        for s in tr.get("segments", []):
            max_ri = max(max_ri, int(s.get("render_index") or 0))

    segments: List[Dict[str, Any]] = []
    for i, (start_us, dur_us, _key) in enumerate(spans):
        style_id, style_name, anim = (combos[i] if i < len(combos)
                                      else (None, '', None))
        effect_path = (_capcut_effect_path(str(drafts_root), style_id)
                       if style_id else None)
        if effect_path is None and i == 0:
            _log('badge: no cached style for the first scene — plain white text')
        segments.append(_build_overlay_segment(
            drafts_root, texts, anims, effects, text, font_path,
            style_id, style_name, effect_path, anim,
            start_us, dur_us, max_ri + 1 + i))

    if combos:
        _log('badge looks: ' + ', '.join(
            f'{i + 1}:{c[1]}+{c[2][1]}' for i, c in enumerate(combos[:len(spans)])))
    _append_overlay_track(tracks, segments)


def _build_overlay_segment(drafts_root: Path, texts, anims, effects, text, font_path,
                           style_id, style_name, effect_path, anim,
                           start_us: int, dur_us: int, render_index: int
                           ) -> Dict[str, Any]:
    """One badge segment + the materials it owns (text, animation, text effect)."""
    mat_id  = uuid.uuid4().hex
    anim_id = uuid.uuid4().hex
    texts.append(_build_overlay_material(mat_id, text, font_path, effect_path))

    # entrance animation, clipped so it never outruns a short scene
    animations: List[Dict[str, Any]] = []
    if anim:
        a_id, a_name, a_dur = anim
        a_path = _capcut_effect_path(str(drafts_root), a_id)
        if a_path:
            animations.append({
                "id": a_id, "type": "in", "start": 0,
                "duration": int(min(a_dur, max(1, dur_us))),
                "path": a_path, "platform": "all",
                "resource_id": a_id, "third_resource_id": "0",
                "source_platform": 1, "name": a_name,
                "category_id": "ruchang", "category_name": "Ввод",
                "panel": "", "material_type": "sticker",
                "anim_adjust_params": None, "request_id": "",
            })
    anims.append({"id": anim_id, "type": "sticker_animation",
                  "animations": animations, "multi_language_current": "none"})

    extra_refs = [anim_id]
    if effect_path:
        eff_id = uuid.uuid4().hex
        effects.append({
            "id":                eff_id,
            "type":              "text_effect",
            "effect_id":         style_id,
            "resource_id":       style_id,
            "third_resource_id": "0",
            "name":              style_name or _OVERLAY_EFFECT_NAME,
            "path":              effect_path,
            "source_platform":   1,
            "platform":          "all",
            "category_id":       _OVERLAY_CATEGORY_ID,
            "category_name":     "hot",
            "sub_category_id":   "",
            "sub_category_name": "",
            "value":             1.0,
            "visible":           True,
            "apply_target_type": 0,
            "item_effect_type":  0,
            "adjust_params":     [],
            "time_range":        None,
            "request_id":        "",
        })
        # CapCut's own writer lists the effect ref twice in
        # extra_material_refs; mirror it so the draft matches byte-for-shape.
        extra_refs += [eff_id, eff_id]

    segment = {
        "id":               uuid.uuid4().hex,
        "material_id":      mat_id,
        "extra_material_refs": extra_refs,
        "target_timerange": {"start": int(start_us), "duration": int(dur_us)},
        "source_timerange": None,
        "render_timerange": {"start": 0, "duration": 0},
        "render_index":     int(render_index),
        "track_render_index": 0,
        "track_attribute":  0,
        "clip": {
            "scale":     {"x": _OVERLAY_SCALE, "y": _OVERLAY_SCALE},
            "rotation":  _OVERLAY_ROTATION,
            "transform": {"x": _OVERLAY_TRANSFORM_X, "y": _OVERLAY_TRANSFORM_Y},
            "flip":      {"vertical": False, "horizontal": False},
            "alpha":     1.0,
        },
        "uniform_scale":    {"on": True, "value": 1.0},
        "speed":            1.0,
        "volume":           1.0,
        "last_nonzero_volume": 1.0,
        "visible":          True,
        "state":            0,
        "desc":             "",
        "group_id":         "",
        "is_placeholder":   False,
        "is_loop":          False,
        "is_tone_modify":   False,
        "reverse":          False,
        "intensifies_audio": False,
        "cartoon":          False,
        "enable_adjust":    False,
        "enable_lut":       False,
        "keyframe_refs":    [],
        "common_keyframes": [],
        "caption_info":     None,
        "template_id":      "",
        "template_scene":   "default",
        "source":           "segmentsourcenormal",
        "responsive_layout": {"enable": False, "target_follow": "",
            "size_layout": 0, "horizontal_pos_layout": 0, "vertical_pos_layout": 0},
    }
    return segment


def _append_overlay_track(tracks: List[Dict[str, Any]],
                          segments: List[Dict[str, Any]]) -> None:
    """All badge segments share ONE text track — they never overlap (one per
    scene, back to back), and a single track keeps CapCut's layer list tidy."""
    tracks.append({
        "id":              uuid.uuid4().hex,
        "type":            "text",
        "flag":            0,
        "attribute":       0,
        "name":            "",
        "is_default_name": True,
        "segments":        segments,
    })


def _capcut_effect_path(capcut_drafts_root: str, resource_id: str):
    """Locate the local cache folder of a downloaded CapCut transition effect.

    CapCut stores each effect it has ever applied under
    `<User Data>/Cache/effect/<resource_id>/<md5hash>/`. A transition material
    only RENDERS (and survives final export) when its `path` points at that
    folder — the minimal material pyJianYingDraft writes omits it, which is why
    library-injected transitions showed up in the editor but did nothing.

    `capcut_drafts_root` is `<User Data>/Projects/com.lveditor.draft`, so the
    cache root is two levels up + `Cache/effect`. Returns a forward-slash path
    string, or None when the effect hasn't been downloaded on this machine
    (user must apply it once in CapCut so it lands in the cache)."""
    try:
        user_data = Path(capcut_drafts_root).parent.parent  # …/Projects/… → …/User Data
        eff_dir = user_data / "Cache" / "effect" / str(resource_id)
        if not eff_dir.is_dir():
            return None
        # The effect package is a subfolder named by its md5; skip the *_tmp
        # download-scratch entries CapCut leaves alongside it.
        for child in sorted(eff_dir.iterdir()):
            if child.is_dir() and not child.name.endswith('_tmp'):
                return str(child).replace('\\', '/')
    except Exception as e:  # noqa: BLE001
        _log(f'effect-cache lookup failed for {resource_id}: {e!r}')
    return None


class _RawTransition:
    """A shot-boundary transition written as a raw CapCut material dict.

    Mirrors EXACTLY what CapCut emits when you add a transition by hand
    (verified against a working hand-authored draft): full field set incl.
    `source_platform`, `category_id`, `third_resource_id`, and the on-disk
    `path` to the downloaded effect. Used for modern transitions (e.g.
    «Разрыв с угла», effect_id 7548348919240019261) that aren't in
    pyJianYingDraft's bundled `TransitionType` table at all.

    Duck-types the lib's `Transition`: it exposes `global_id` + `export_json()`,
    so it drops straight into `script.materials.transitions` and is referenced
    from a segment's `extra_material_refs` like any native transition."""

    def __init__(self, name: str, effect_id: str, resource_id: str,
                 path, duration_us: int, is_overlap: bool = True):
        self.global_id   = uuid.uuid4().hex
        self.name        = name
        self.effect_id   = str(effect_id)
        self.resource_id = str(resource_id)
        self.path        = path or ''
        self.duration    = int(duration_us)
        self.is_overlap  = is_overlap

    def export_json(self) -> Dict[str, Any]:
        return {
            "id":                self.global_id,
            "type":              "transition",
            "name":              self.name,
            "effect_id":         self.effect_id,
            "resource_id":       self.resource_id,
            "third_resource_id": "0",
            "source_platform":   1,
            "path":              self.path,
            "duration":          self.duration,
            "is_overlap":        self.is_overlap,
            "platform":          "all",
            "category_id":       "100000",
            "category_name":     "",
            "request_id":        "",
            "is_ai_transition":  False,
            "video_path":        "",
            "task_id":           "",
        }


# ── Ken Burns presets for static (image) shots ─────────────────────────────
# A static shot ships as its still PNG; to keep it alive on the timeline we add
# a slow camera move spanning the whole shot. Presets are cycled by static-shot
# index (same rotation idea as the transition cycle below). All are deliberately
# subtle: ≤12% zoom, ≤6% pan, ≤1.2° tilt. Pan/tilt presets pre-scale the image
# to 1.12 so the move never exposes the frame edge.
# Units (pyJianYingDraft): uniform_scale 1.0 = fit-to-frame; position_x/y are in
# half-canvas units (0.06 ≈ 3% of full width/height); rotation is clockwise deg.
KEN_BURNS_CYCLE = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'tilt', 'pan_up']


def _cover_scale(mat_w: int, mat_h: int, canvas_w: int, canvas_h: int) -> float:
    """Scale (relative to fit-to-frame = 1.0) needed to COVER the canvas with the
    material, cropping the overflow instead of letterboxing. For a 16:9 clip in a
    9:16 canvas this is ~3.16 (fills the height, crops the sides). Computed
    per-material so it's correct for stills of any aspect too. Returns 1.0 on bad
    input (→ plain fit)."""
    if not (mat_w and mat_h and canvas_w and canvas_h):
        return 1.0
    a_m = mat_w / mat_h
    a_c = canvas_w / canvas_h
    return max(a_m / a_c, a_c / a_m)


def _apply_ken_burns(segment: "draft.VideoSegment", duration_us: int, preset: str,
                     base: float = 1.0) -> None:
    """Animate a still-image segment with a slow Ken-Burns move.

    Zoom presets keyframe `uniform_scale` (the lib keeps the uniform flag on, so
    it scales both axes evenly). Pan/tilt presets hold a constant base scale via
    the segment's `clip_settings` (giving margin so the edge never shows) and
    keyframe only the moving property. pyJianYingDraft only does linear
    interpolation, which over a whole shot reads as a smooth slow drift.

    `base` multiplies every scale value — pass the cover scale (>1) for a vertical
    Shorts fill so the still fills the 9:16 frame AND still Ken-Burns on top of it.
    base=1.0 (default) is byte-identical to the old behaviour.
    """
    KP  = draft.KeyframeProperty
    end = max(1, int(duration_us))
    if preset == 'zoom_in':
        segment.add_keyframe(KP.uniform_scale, 0,   base * 1.0)
        segment.add_keyframe(KP.uniform_scale, end, base * 1.12)
    elif preset == 'zoom_out':
        segment.add_keyframe(KP.uniform_scale, 0,   base * 1.12)
        segment.add_keyframe(KP.uniform_scale, end, base * 1.0)
    elif preset == 'pan_left':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = base * 1.12
        segment.add_keyframe(KP.position_x, 0,    0.06)
        segment.add_keyframe(KP.position_x, end, -0.06)
    elif preset == 'pan_right':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = base * 1.12
        segment.add_keyframe(KP.position_x, 0,   -0.06)
        segment.add_keyframe(KP.position_x, end,  0.06)
    elif preset == 'pan_up':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = base * 1.12
        segment.add_keyframe(KP.position_y, 0,   -0.06)
        segment.add_keyframe(KP.position_y, end,  0.06)
    elif preset == 'tilt':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = base * 1.12
        segment.add_keyframe(KP.rotation, 0,   -1.2)
        segment.add_keyframe(KP.rotation, end,  1.2)


def build_draft(manifest: dict) -> Path:
    project   = manifest["project_name"]
    # Where the live CapCut draft goes. Falls back to output_root if the
    # service couldn't resolve LOCALAPPDATA (non-Windows host).
    drafts_root = Path(manifest.get("capcut_drafts_root") or manifest["output_root"])
    drafts_root.mkdir(parents=True, exist_ok=True)
    draft_dir = drafts_root / manifest["draft_name"]
    width     = int(manifest.get("width",  1920))
    height    = int(manifest.get("height", 1080))
    fps       = int(manifest.get("fps",    30))
    # Vertical / YouTube-Shorts export. When the manifest asks for a canvas
    # fill, every video/image segment gets a CapCut background-fill so a 16:9
    # source sits centered in a 9:16 (or any mismatched) canvas over a blurred
    # (or solid) backdrop instead of bare black bars. Absent → empty string →
    # no-op, so legacy 16:9 exports stay byte-identical. Values: "blur" | "color".
    background_fill = str(manifest.get("background_fill") or "").strip().lower()
    # Vertical fit mode. "cover" = enlarge each clip to FILL the 9:16 frame and
    # crop the overflow (content is big, no letterbox) — the default for Shorts.
    # "" / "fit" = contain (letterbox), optionally paired with background_fill.
    fill_mode = str(manifest.get("fill") or "").strip().lower()
    # Optional hard ceiling on the timeline (microseconds). Shorts set it to the
    # total video duration so BGM cues — which otherwise play their full flac —
    # don't extend the project past the last shot. Absent → 0 → no cap.
    max_timeline_us = int(manifest.get("max_timeline_us") or 0)

    # `maintrack_adsorb=False` — we lay clips sequentially with explicit
    # timeranges, so we don't need JianYing's auto-snap behavior.
    script = draft.ScriptFile(width=width, height=height, fps=fps, maintrack_adsorb=False)

    # One video lane + one narration lane. BGM tracks are added later, one
    # per NarrativeBlock, so each block's last cue can play its full overgen
    # tail without colliding with the next block's first cue (which lives on
    # its own lane). Order matters: video first means the video is the
    # "main" track in CapCut's UI (top of the layer stack). Narration is
    # added before BGM so voiceover sits above background music.
    script.add_track(draft.TrackType.video, "main_video")
    script.add_track(draft.TrackType.audio, "narration")

    cursor_video_us = 0
    # (start, duration, sceneKey) per scene — drives the per-scene channel badge.
    scene_spans: List[Tuple[int, int, str]] = []
    # Independent audio cursor — tracks the earliest microsecond at which the
    # next per-shot narration may start without overlapping the previous one
    # on the shared "narration" lane. Per user spec: «вставляй по очереди,
    # привязывай к началу шота если получается». Each narration anchors to
    # its shot's start position when possible; if a previous narration ran
    # past its shot and into this one, the current narration starts right
    # after the previous instead. Sequential, never overlapping.
    cursor_narration_us = 0
    # (start_us, end_us, text) for every voiceover line, in placement order.
    # Written to <draft>.srt after the draft so captions match the audio lane
    # exactly (same start/duration math as the AudioSegments below).
    subtitle_cues: List[tuple] = []
    total_clips     = 0
    total_tts       = 0
    total_bgm       = 0
    # Static (image) shots: counted for the summary, and indexed to cycle the
    # Ken Burns preset list across the whole film (not reset per scene).
    total_static    = 0
    static_index    = 0
    # Every VideoSegment in playback order — used after the loop to attach a
    # transition between consecutive shots. Skipping the very last entry
    # avoids a transition that has no "next" to dissolve into.
    all_video_segments: list = []

    for scene in manifest["scenes"]:
        scene_start_us = cursor_video_us

        any_shot_narration = False

        # ── Video shots (sequential) ───────────────────────────────────────
        for sh in scene["shots"]:
            # CapCut requires forward slashes in material paths — backslash
            # paths are read as "wrong address" and the project refuses to
            # open. CapCut's own writer produces forward-slash paths (see
            # how 0518 / 0516 drafts look on disk), pyJianYingDraft preserves
            # whatever we hand it, so the fix lives here.
            path = sh["path"].replace("\\", "/")
            dur  = int(sh["duration_us"])
            if dur <= 0:
                _log(f'skipping {sh["shotCode"]}: non-positive duration {dur}')
                continue
            # kind defaults to "video" when absent — keeps legacy clip-timed
            # manifests (no `kind` key) on the exact path they used before.
            kind     = sh.get("kind") or "video"
            material = draft.VideoMaterial(path, material_name=sh["shotCode"])

            # Vertical "cover": how much to enlarge this clip so it fills the
            # frame and crops the overflow (1.0 = no enlarge / letterbox path).
            cover = _cover_scale(material.width, material.height, width, height) \
                if fill_mode == "cover" else 1.0

            if kind == "image":
                # Static shot: a still PNG held for `dur`, kept alive by a slow
                # Ken Burns move cycled across the film (built on top of `cover`).
                segment = draft.VideoSegment(
                    material=material,
                    target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                )
                preset = KEN_BURNS_CYCLE[static_index % len(KEN_BURNS_CYCLE)]
                try:
                    _apply_ken_burns(segment, dur, preset, base=cover)
                    _log(f'kenburns {sh["shotCode"]:<14} {preset}'
                         + (f' x{cover:.2f}' if cover != 1.0 else ''))
                except Exception as e:  # noqa: BLE001
                    _log(f'kenburns failed for {sh["shotCode"]} ({preset}): {e!r}')
                static_index += 1
                total_static += 1
            else:
                # Animated shot. `source_us` present → narration timing: fit the
                # clip to the VO hold. window = min(hold, native length):
                #   VO longer than the clip  → window = native → speed < 1 (slow)
                #   VO shorter than the clip → window = hold   → speed = 1 (trim)
                # Clamp the window to the real material length so we never ask
                # pyJianYingDraft for more frames than the file has.
                source_us = int(sh.get("source_us") or 0)
                if source_us > 0:
                    native = material.duration
                    window = min(dur, native)
                    segment = draft.VideoSegment(
                        material=material,
                        target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                        source_timerange=draft.Timerange(start=0, duration=window),
                    )
                    speed = (window / dur) if dur else 1.0
                    if speed < 0.34:
                        _log(f'WARNING {sh["shotCode"]}: slow-mo {speed:.2f}x '
                             f'(VO {dur/1e6:.1f}s on a {native/1e6:.1f}s clip) — '
                             f'consider splitting this shot')
                else:
                    # legacy / native-length path (speed 1.0) — byte-unchanged.
                    # The interpolated mp4 can be a hair shorter than the
                    # manifest's frames/fps math (RIFE 2x yields 2n-1 frames),
                    # so clamp here too: hold the timeline slot but only pull
                    # the frames the file really has (imperceptible slow-down).
                    native = material.duration
                    if native and dur > native:
                        segment = draft.VideoSegment(
                            material=material,
                            target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                            source_timerange=draft.Timerange(start=0, duration=native),
                        )
                    else:
                        segment = draft.VideoSegment(
                            material=material,
                            target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                        )

            if fill_mode == "cover":
                # Enlarge the animated clip to fill the vertical frame, cropping
                # the sides (stills already covered via the Ken-Burns `base`).
                if kind != "image" and cover != 1.0:
                    segment.clip_settings.scale_x = cover
                    segment.clip_settings.scale_y = cover
            else:
                # Letterbox path: fill the empty canvas behind a mismatched-aspect
                # clip. MUST run before add_segment() — that reads background_filling
                # into the draft's canvas list. blur=0.375 is CapCut's 2nd preset.
                if background_fill == "blur":
                    try:
                        segment.add_background_filling("blur", blur=0.375)
                    except Exception as e:  # noqa: BLE001
                        _log(f'background_filling(blur) failed for {sh["shotCode"]}: {e!r}')
                elif background_fill == "color":
                    try:
                        segment.add_background_filling("color", color="#000000FF")
                    except Exception as e:  # noqa: BLE001
                        _log(f'background_filling(color) failed for {sh["shotCode"]}: {e!r}')

            # Clip-carried audio. LTX-2.5 writes sound with the picture and the
            # upscale pass now keeps it, so a video segment plays at volume 1.0 by
            # default — audible under the narration and the ACE-Step score. The
            # per-clip switch (VideoRender.audioMuted) arrives as mute_audio and is
            # applied here rather than by stripping the file, so it is reversible.
            if sh.get("mute_audio"):
                segment.volume = 0.0
                _log(f'{sh["shotCode"]}: clip audio muted (volume=0)')

            script.add_segment(segment, track_name="main_video")
            all_video_segments.append(segment)

            # Per-shot narration: place sequentially on the narration lane.
            # Anchor to shot start when possible; otherwise start after the
            # previous narration finished. This means a long line bleeds past
            # its own shot into the next one's slot, and the next narration
            # then starts after the bleed instead of at its shot's start.
            # That's the user-requested behaviour: «вставляй по очереди».
            #
            # Audio is NEVER truncated to fit the video shot — the full wav
            # plays out. If a narration is shorter than its shot, silence
            # fills the gap until the next shot's narration begins.
            shot_narr = sh.get("narration")
            if shot_narr and shot_narr.get("path"):
                wav_path = shot_narr["path"].replace("\\", "/")
                actual_us = _wav_duration_us(wav_path)
                manifest_us = int(shot_narr.get("duration_us") or 0)
                # Trust the on-disk probe; fall back to the manifest value
                # (which is now TTSJob.durationMs from the Node side, not a
                # text-length guess) only if the probe failed.
                tts_dur = actual_us if actual_us > 0 else manifest_us
                if tts_dur > 0:
                    # Anchor to shot start unless the previous narration
                    # overran into this shot's slot — then continue after it.
                    audio_start_us = max(cursor_narration_us, cursor_video_us)
                    a_mat = draft.AudioMaterial(
                        wav_path,
                        material_name=f'{sh["shotCode"]}_narration',
                    )
                    a_seg = draft.AudioSegment(
                        material=a_mat,
                        target_timerange=draft.Timerange(start=audio_start_us, duration=tts_dur),
                    )
                    script.add_segment(a_seg, track_name="narration")
                    cursor_narration_us = audio_start_us + tts_dur
                    total_tts += 1
                    any_shot_narration = True
                    # Subtitle cue spans exactly the spoken audio for this shot.
                    narr_text = (shot_narr.get("text") or "").strip()
                    if narr_text:
                        subtitle_cues.append((audio_start_us, audio_start_us + tts_dur, narr_text))

            cursor_video_us += dur
            total_clips += 1

        # ── Legacy scene-level narration ───────────────────────────────────
        # Only used if no shot in this scene had its own per-shot wav — that
        # means we're exporting a project still on the old whole-scene flow.
        # Once at least one shot brings its own audio, we trust the per-shot
        # layout to be the intended source of truth and skip the scene-level
        # block to avoid double-narration.
        if not any_shot_narration:
            narr = scene.get("narration")
            if narr and narr.get("path"):
                wav_path  = narr["path"].replace("\\", "/")
                actual_us = _wav_duration_us(wav_path)
                guess_us  = int(narr.get("duration_us") or 0)
                tts_dur   = actual_us if actual_us > 0 else guess_us
                if guess_us > 0:
                    tts_dur = min(tts_dur, guess_us)
                if tts_dur > 0:
                    a_mat = draft.AudioMaterial(
                        wav_path,
                        material_name=f'{scene["sceneKey"]}_narration',
                    )
                    a_seg = draft.AudioSegment(
                        material=a_mat,
                        target_timerange=draft.Timerange(start=scene_start_us, duration=tts_dur),
                    )
                    script.add_segment(a_seg, track_name="narration")
                    total_tts += 1
                    narr_text = (narr.get("text") or "").strip()
                    if narr_text:
                        subtitle_cues.append((scene_start_us, scene_start_us + tts_dur, narr_text))
                else:
                    _log(f'skipping narration for {scene["sceneKey"]}: zero duration')

        # Scene span on the timeline — the channel badge re-styles itself on each
        # of these (see `_inject_text_overlay`).
        if cursor_video_us > scene_start_us:
            scene_spans.append((scene_start_us, cursor_video_us - scene_start_us,
                                str(scene.get("sceneKey") or "")))

    # ── Shot-boundary transitions ──────────────────────────────────────
    # Two presets, chosen by manifest["transition_preset"]:
    #
    #   "default" (legacy): the curated 8 free transitions cycled in rotation
    #       across every shot boundary, via pyJianYingDraft's bundled
    #       `TransitionType` enum. All is_vip=False AND is_overlap=False (this
    #       set was picked after auditioning all 38 free transitions). Keeps
    #       existing exports byte-identical.
    #
    #   "comic": a stylized comic-book look. Each transition is injected as a
    #       RAW CapCut material (see _RawTransition) — NOT through the enum —
    #       because the modern «Разрыв с угла» effect (id 7548348919240019261)
    #       isn't in pyJianYingDraft's bundled table at all, and because only
    #       the full hand-authored material (with the on-disk `path` to the
    #       downloaded effect) actually renders + survives final export. Counts
    #       per transition are exact (the accents get round(n*share), the
    #       dominant tear — listed LAST — soaks the remainder ≈90%), then the
    #       sequence is SHUFFLED so accents land at random boundaries
    #       («в рандомный момент»). The effect resource must have been applied
    #       once in CapCut so it sits in the local effect cache (path lookup);
    #       if it isn't cached we still inject it (logged) but it may need a
    #       manual re-add. All comic transitions are is_overlap=True, so CapCut
    #       offers "create duplicate frames" on open (clips are back-to-back) —
    #       expected; accept it and they render.
    #
    # Transitions are applied to the OUTGOING segment per pyJianYingDraft
    # contract; the very last shot is skipped (no "next" to dissolve into).
    TRANSITION_CYCLE = [
        '闪黑',   # Black Fade   — затухание в чёрный
        '推近',   # Push In      — наезд камеры
        '拉远',   # Pull Out     — отъезд камеры
        '向上',   # Slide Up     — сдвиг вверх
        '向下',   # Slide Down   — сдвиг вниз
        '向左',   # Slide Left   — сдвиг влево
        '向右',   # Slide Right  — сдвиг вправо
        '故障',   # Glitch       — цифровой глитч-срыв
    ]
    # Comic preset, raw CapCut effects: (display name, effect_id, resource_id,
    # duration_us, share). effect_id == resource_id for these newer effects.
    # ORDER MATTERS: the dominant transition must be LAST so it soaks the
    # rounding remainder (→ ≈90%); the fixed-share accents come first. IDs +
    # durations were read straight out of a hand-authored CapCut draft (apply
    # the transition once in CapCut, save, read materials.transitions from
    # draft_content.json). All three are is_overlap=True.
    COMIC_RAW_TRANSITIONS = [
        ('Стикер',        '7530469760765545729', '7530469760765545729', 600_000, 0.05),
        ('Рваный коллаж', '7502327979834461441', '7502327979834461441', 600_000, 0.05),
        ('Разрыв с угла', '7548348919240019261', '7548348919240019261', 600_000, 0.90),  # dominant — keep LAST
    ]
    DEFAULT_TRANSITION_DURATION_US = 600_000   # 0.6s — short enough to stay invisible

    preset = manifest.get('transition_preset') or 'default'
    n_boundaries = max(0, len(all_video_segments) - 1)
    successful_transitions = 0

    if preset == 'comic':
        # Resolve each comic effect's local cache path + build an exact-count,
        # shuffled per-boundary spec list. Each spec: (name, effect_id,
        # resource_id, path).
        specs: List[tuple] = []
        counts: List[tuple] = []
        assigned = 0
        for idx, (name, eff, res, dur_us, share) in enumerate(COMIC_RAW_TRANSITIONS):
            path = _capcut_effect_path(manifest.get('capcut_drafts_root', ''), res)
            if path is None:
                _log(f'comic transition "{name}" (resource {res}) not in CapCut '
                     f'effect cache — injecting without path (may need manual re-add)')
            if idx < len(COMIC_RAW_TRANSITIONS) - 1:
                count = round(n_boundaries * share)
            else:
                count = max(0, n_boundaries - assigned)   # dominant soaks remainder
            assigned += count
            counts.append((name, count))
            specs.extend([(name, eff, res, dur_us, path)] * count)
        random.shuffle(specs)
        _log(f'transition preset=comic boundaries={n_boundaries} counts={counts}')

        for i, seg in enumerate(all_video_segments[:-1]):
            if i >= len(specs):
                break
            name, eff, res, dur_us, path = specs[i]
            rt = _RawTransition(name, eff, res, path, dur_us)
            # Attach manually (we add transitions AFTER all segments are placed):
            # set the segment's transition, link it from extra_material_refs, and
            # register the material so the draft's materials dict resolves it.
            seg.transition = rt
            seg.extra_material_refs.append(rt.global_id)
            script.materials.transitions.append(rt)
            _log(f'transition shot{i:>3}->shot{i+1:<3} {name}')
            successful_transitions += 1
    else:
        plan = [TRANSITION_CYCLE[i % len(TRANSITION_CYCLE)] for i in range(n_boundaries)]
        _log(f'transition preset=default boundaries={n_boundaries}')
        for i, seg in enumerate(all_video_segments[:-1]):
            name = plan[i]
            tt   = getattr(draft.TransitionType, name, None)
            if tt is None:
                _log(f'transition lookup failed for "{name}" — skipping at boundary {i}')
                continue
            try:
                seg.add_transition(tt, duration=DEFAULT_TRANSITION_DURATION_US)
                # pyJianYingDraft only copies a segment's transition into
                # `script.materials.transitions` inside `add_segment()`. We
                # attach AFTER all segments are added, so push it ourselves —
                # otherwise extra_material_refs points to a missing material and
                # CapCut silently drops it.
                if seg.transition is not None and seg.transition not in script.materials:
                    script.materials.transitions.append(seg.transition)
                _log(f'transition shot{i:>3}->shot{i+1:<3} {name}')
                successful_transitions += 1
            except Exception as e:  # noqa: BLE001
                _log(f'add_transition failed at boundary {i} ({name}): {e!r}')
    total_transitions = successful_transitions

    # ── BGM (ACE-Step) ──────────────────────────────────────────────────
    # Per ACT (NarrativeBlock): tiles are laid CHECKERBOARD across two lanes
    # ('a'/'b') on their own tracks `bgm_<block>_<lane>`. We walk the block's
    # tiles in `order` from `block_start_us` and advance the cursor by each
    # tile's REAL flac length minus the crossfade — so neighbours overlap
    # exactly for a crossfade whatever the tile size (legacy short takes AND new
    # 150s tiles lay tight; no baked/mocked step). Each block keeps its own fresh
    # lane pair, so its tails can ring into the next act without colliding. Whole
    # flac plays — no crop. (Per user: «ставь по реальной длине трека».)
    BGM_CROSSFADE_US = 3_000_000   # 3 s
    tracks = list(manifest.get("music_tracks") or [])

    # Group by BLOCK, preserving first-seen order; tiles ordered by `order`.
    by_block: Dict[str, List[Dict[str, Any]]] = {}
    block_order: List[str] = []
    for mt in tracks:
        block = str(mt.get("blockSlug") or mt.get("act") or "default") or "default"
        if block not in by_block:
            by_block[block] = []
            block_order.append(block)
        by_block[block].append(mt)

    for block in block_order:
        tiles = sorted(by_block[block], key=lambda t: int(t.get("order") or 0))
        if not tiles:
            continue
        # Create each lane track once (first-seen lane order = a then b).
        seen_lanes: List[str] = []
        for mt in tiles:
            lane = str(mt.get("lane") or "a")
            if lane not in seen_lanes:
                script.add_track(draft.TrackType.audio, f"bgm_{block}_{lane}")
                seen_lanes.append(lane)
        # Accumulate each tile's position from the act anchor using the REAL
        # on-disk flac length.
        cursor = int(tiles[0].get("block_start_us") or 0)
        for mt in tiles:
            lane       = str(mt.get("lane") or "a")
            track_name = f"bgm_{block}_{lane}"
            wav_path   = mt["path"].replace("\\", "/")
            actual_us  = _audio_duration_us(wav_path)
            if actual_us <= 0:
                actual_us = int(mt.get("render_duration_us") or 0)  # probe failed → fallback
            if actual_us <= 0:
                _log(f'skipping bgm segment {mt.get("segmentId")}: cannot determine duration')
                continue
            start_us = cursor
            bgm_dur  = actual_us
            # Advance the cursor for the NEXT tile (overlap by the crossfade) —
            # do it now so a shorts-clipped/skipped tile still keeps the rhythm.
            cursor += max(1_000_000, actual_us - BGM_CROSSFADE_US)
            # Shorts: never let a tile run past the (short) timeline end.
            if max_timeline_us > 0:
                if start_us >= max_timeline_us:
                    continue
                bgm_dur = min(bgm_dur, max_timeline_us - start_us)
            if bgm_dur <= 0:
                continue
            material = draft.AudioMaterial(
                wav_path,
                material_name=f'bgm_{block}_{lane}_{mt.get("segmentId","")[:8]}',
            )
            # BGM sits under voiceover at 20% gain (≈ -14 dB) — editable per
            # segment in CapCut afterward.
            segment = draft.AudioSegment(
                material=material,
                target_timerange=draft.Timerange(start=start_us, duration=bgm_dur),
                source_timerange=draft.Timerange(start=0, duration=bgm_dur),
                volume=0.2,
            )
            # Crossfade with the neighbour on the other lane (spares included).
            fade = min(BGM_CROSSFADE_US, bgm_dur // 2)
            segment.add_fade(in_duration=fade, out_duration=fade)
            script.add_segment(segment, track_name=track_name)
            total_bgm += 1

    draft_dir.mkdir(parents=True, exist_ok=True)
    # pyJianYingDraft writes draft_content.json directly to the given path.
    out_path = draft_dir / "draft_content.json"
    script.dump(str(out_path))

    # Post-process the draft to match CapCut International expectations:
    #   1. pyJianYingDraft normalises material paths to OS-native separators
    #      on Windows (backslashes). CapCut treats backslash paths as "wrong
    #      address" — it wants forward slashes (see working `0518` draft).
    #   2. pyJianYingDraft tags the file as JianYing 5.9.0 (`app_source: lv`),
    #      but CapCut International (`app_source: cc`) refuses drafts from
    #      a different distribution. We rewrite the platform metadata so the
    #      international client treats the file as its own.
    #   3. Inject the recognised-subtitle group (flag=1 text track + subtitle
    #      materials + animation placeholders) built from the voiceover cues —
    #      done here, on the loaded dict, because these fields live outside
    #      pyJianYingDraft's model. Skipped when embed_subtitles=false.
    embed_subtitles = manifest.get("embed_subtitles", True)
    sub_segments = rewrite_for_capcut_international(
        out_path,
        subtitle_cues if embed_subtitles else None,
        drafts_root,
        overlay_text=str(manifest.get("overlay_text") or ""),
        overlay_dur_us=cursor_video_us,
        overlay_spans=scene_spans,
        overlay_seed=str(manifest.get("project_name") or manifest.get("draft_name") or ""),
    )

    # ── Subtitles sidecar (.srt) ──────────────────────────────────────────
    # Emit <draft>.srt next to draft_content.json. Perfectly synced to the
    # narration lane (same start/duration as the native track above), as a
    # portable fallback the user can import by hand or feed to other tools.
    srt_entries = 0
    if subtitle_cues:
        srt_path = draft_dir / f'{manifest["draft_name"]}.srt'
        try:
            srt_entries = _write_srt(subtitle_cues, srt_path)
            _log(f'wrote {srt_entries} subtitle cue(s) → {srt_path}')
        except Exception as e:  # noqa: BLE001
            _log(f'SRT write failed ({e!r}) — draft is fine, subtitles skipped')
    else:
        _log('no voiceover lines found — no .srt written')

    # Total duration of this draft (used both by root_meta and draft_meta).
    total_us = cursor_video_us
    register_in_capcut(drafts_root, draft_dir, manifest["draft_name"], total_us)

    _log(f'wrote {out_path}')
    _log(f'project={project} clips={total_clips} static={total_static} '
         f'narration_tracks={total_tts} bgm_tracks={total_bgm} '
         f'transitions={total_transitions} subtitles_embedded={sub_segments} '
         f'subtitles_srt={srt_entries} duration_us={total_us}')
    return draft_dir


def rewrite_for_capcut_international(draft_content_path: Path,
                                    subtitle_cues: "List[tuple] | None" = None,
                                    drafts_root: "Path | None" = None,
                                    overlay_text: str = "",
                                    overlay_dur_us: int = 0,
                                    overlay_spans: "List[Tuple[int, int, str]] | None" = None,
                                    overlay_seed: str = "") -> int:
    """Post-process pyJianYingDraft's draft_content.json so CapCut International
    will open it. Patches:

    1. Normalise every string field that contains backslashes to forward slashes
       (CapCut paths are forward-slash on Windows). pyJianYingDraft uses
       os.path-style normalisation which yields backslashes on Windows, and
       CapCut refuses to load those.
    2. Replace the `last_modified_platform` and `platform` blocks with values
       that match a CapCut International project. pyJianYingDraft tags drafts
       as JianYing (`app_source='lv'`, `app_id=3704`, `app_version='5.9.0'`)
       which CapCut International won't load.
    3. When `subtitle_cues` is given, inject a recognised-subtitle group built
       from them (see `_inject_subtitles`). Done here because it operates on the
       loaded dict and uses fields outside pyJianYingDraft's model.
    4. When `overlay_text` is non-empty, inject the full-length channel badge
       («видео уже на канале») in the upper-right corner (see
       `_inject_text_overlay`). Shorts-only — set via manifest["overlay_text"].

    Returns the number of subtitle segments injected (0 if none).
    """
    with open(draft_content_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Inject subtitles BEFORE the slash-normalisation pass so any font path we
    # add gets the same forward-slash treatment as everything else.
    sub_segments = 0
    if subtitle_cues:
        try:
            group_id = f'ru-RU_{int(time.time() * 1000)}'
            sub_segments = _inject_subtitles(data, subtitle_cues,
                                             drafts_root or draft_content_path.parent, group_id)
            _log(f'injected recognised-subtitle group: {sub_segments} cue(s)')
        except Exception as e:  # noqa: BLE001
            _log(f'subtitle injection failed ({e!r}) — draft is fine, '
                 f'falling back to the .srt sidecar')
            sub_segments = 0

    # 1. Backslash → forward slash everywhere (paths can be nested in many
    # places — material list, captions, attachments, fonts). Cheap blanket pass.
    def normalise_slashes(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if isinstance(v, str) and "\\" in v:
                    o[k] = v.replace("\\", "/")
                elif isinstance(v, (dict, list)):
                    normalise_slashes(v)
        elif isinstance(o, list):
            for x in o:
                normalise_slashes(x)
    normalise_slashes(data)

    # Overlay injection runs AFTER the slash pass on purpose: the multi-line
    # badge text is stored as an embedded JSON string, where "\n" is the two
    # characters backslash+n — the blanket pass would mangle it into "/n".
    # Every path the injector writes is already forward-slash.
    if overlay_text and overlay_dur_us > 0:
        try:
            # One badge per scene when spans are known, otherwise the legacy
            # single full-length badge.
            spans = list(overlay_spans or []) or [(0, int(overlay_dur_us), '')]
            _inject_text_overlay(data, overlay_text, spans,
                                 drafts_root or draft_content_path.parent,
                                 overlay_seed)
            _log(f'injected channel overlay: {overlay_text!r} × {len(spans)} scene(s)')
        except Exception as e:  # noqa: BLE001
            _log(f'overlay injection failed ({e!r}) — draft is fine, no overlay')

    # 2. Tag the draft as CapCut International. These values were lifted from
    # a working CapCut-authored draft on the same machine (0518). The
    # app/version pair is what the client cross-checks before opening; the
    # `device_id` / `hard_disk_id` / `mac_address` are best left blank so the
    # current installation's fingerprint applies on first save.
    capcut_platform = {
        "os":           "windows",
        "os_version":   "10.0.19045",
        "app_id":       359289,
        "app_version":  "8.5.0",
        "app_source":   "cc",
        "device_id":    "",
        "hard_disk_id": "",
        "mac_address":  "",
    }
    data["last_modified_platform"] = capcut_platform
    data["platform"]               = capcut_platform
    # `new_version` gates the schema reader. JianYing emits "110.0.0";
    # CapCut International 8.5 writes "167.0.0". Both apparently share the
    # same `version: 360000` schema, so bumping new_version is enough.
    data["new_version"] = "167.0.0"

    with open(draft_content_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    return sub_segments


def _build_root_meta_entry(
    *,
    drafts_root: Path,
    draft_dir:   Path,
    draft_name:  str,
    draft_id:    str,
    total_us:    int,
    now_us:      int,
) -> Dict[str, Any]:
    """One entry of root_meta_info.json::all_draft_store. Paths are formatted
    the way CapCut's own writer does on Windows (forward slashes in the chain,
    backslash before the final filename segment, pure backslashes for
    draft_root_path). On non-Windows, paths are written as-is — CapCut isn't
    installed there anyway, this is just for our local audit copy."""
    fold_fwd = str(draft_dir).replace("\\", "/")
    root_bs  = str(drafts_root).replace("/", "\\")
    return {
        "cloud_draft_cover":                  False,
        "cloud_draft_sync":                   False,
        "draft_cloud_last_action_download":   False,
        "draft_cloud_purchase_info":          "",
        "draft_cloud_template_id":            "",
        "draft_cloud_tutorial_info":          "",
        "draft_cloud_videocut_purchase_info": "",
        "draft_cover":                        fold_fwd + "\\draft_cover.jpg",
        "draft_fold_path":                    fold_fwd,
        "draft_id":                           draft_id,
        "draft_is_ai_shorts":                 False,
        "draft_is_cloud_temp_draft":          False,
        "draft_is_invisible":                 False,
        "draft_is_web_article_video":         False,
        "draft_json_file":                    fold_fwd + "\\draft_content.json",
        "draft_name":                         draft_name,
        "draft_new_version":                  "",
        "draft_root_path":                    root_bs,
        "draft_timeline_materials_size":      0,
        "draft_type":                         "",
        "draft_web_article_video_enter_from": "",
        "streaming_edit_draft_ready":         True,
        "tm_draft_cloud_completed":           "",
        "tm_draft_cloud_entry_id":            -1,
        "tm_draft_cloud_modified":            0,
        "tm_draft_cloud_parent_entry_id":     -1,
        "tm_draft_cloud_space_id":            -1,
        "tm_draft_cloud_user_id":             -1,
        "tm_draft_create":                    now_us,
        "tm_draft_modified":                  now_us,
        "tm_draft_removed":                   0,
        "tm_duration":                        total_us,
    }


def register_in_capcut(
    drafts_root: Path,
    draft_dir:   Path,
    draft_name:  str,
    total_us:    int,
) -> None:
    """Make CapCut see the draft.

    - Inserts/updates an entry in `<drafts_root>/root_meta_info.json` under
      `all_draft_store`. Creates the index file if it doesn't exist yet.
    - Writes a minimal `<draft_dir>/draft_meta_info.json` so the project tile
      in CapCut's launcher has a name + duration. draft_materials is left
      empty — CapCut rebuilds material lists from draft_content.json when the
      project is opened, so the tile works without us pre-listing every mp4.

    Idempotent: re-running on an existing draft_name updates the entry in
    place instead of duplicating it.
    """
    root_meta = drafts_root / "root_meta_info.json"
    if root_meta.exists():
        try:
            root = json.loads(root_meta.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            # Don't blow away a parse-failing file — back it up and start fresh
            # so the user can recover manually.
            backup = root_meta.with_suffix(".json.broken")
            shutil.copyfile(root_meta, backup)
            _log(f'root_meta_info.json could not be parsed ({e!r}); '
                 f'backed up to {backup} and starting a new index')
            root = {"all_draft_store": [], "draft_ids": 0, "root_path": str(drafts_root).replace("\\", "/")}
    else:
        root = {"all_draft_store": [], "draft_ids": 0, "root_path": str(drafts_root).replace("\\", "/")}

    store: List[Dict[str, Any]] = root.setdefault("all_draft_store", [])

    now_us = int(time.time() * 1_000_000)

    # Idempotency: update if a row with this draft_name already exists.
    existing = next((d for d in store if d.get("draft_name") == draft_name), None)
    if existing:
        draft_id = existing.get("draft_id") or str(uuid.uuid4()).upper()
        entry = _build_root_meta_entry(
            drafts_root=drafts_root, draft_dir=draft_dir, draft_name=draft_name,
            draft_id=draft_id, total_us=total_us, now_us=now_us,
        )
        # Preserve original tm_draft_create — only tm_draft_modified should bump.
        entry["tm_draft_create"] = existing.get("tm_draft_create", now_us)
        store[store.index(existing)] = entry
        _log(f'updated root_meta entry for "{draft_name}" (id={draft_id})')
    else:
        draft_id = str(uuid.uuid4()).upper()
        entry = _build_root_meta_entry(
            drafts_root=drafts_root, draft_dir=draft_dir, draft_name=draft_name,
            draft_id=draft_id, total_us=total_us, now_us=now_us,
        )
        store.append(entry)
        root["draft_ids"] = int(root.get("draft_ids", 0)) + 1
        _log(f'registered "{draft_name}" in root_meta (id={draft_id})')

    # Backup-then-write — if anything goes sideways the user can roll back.
    if root_meta.exists():
        shutil.copyfile(root_meta, root_meta.with_suffix(".json.bak"))
    root_meta.write_text(json.dumps(root, ensure_ascii=False), encoding="utf-8")

    # Per-draft metadata. Mirrors the fields CapCut writes when it saves a
    # project itself; we keep draft_materials empty so the launcher still
    # shows a tile (CapCut rebuilds the material list from draft_content.json
    # when the project is opened).
    fold_fwd = str(draft_dir).replace("\\", "/")
    root_bs  = str(drafts_root).replace("/", "\\")
    meta = {
        "cloud_draft_cover":                  False,
        "cloud_draft_sync":                   False,
        "cloud_package_completed_time":       "",
        "draft_cloud_capcut_purchase_info":   "",
        "draft_cloud_last_action_download":   False,
        "draft_cloud_package_type":           "",
        "draft_cloud_purchase_info":          "",
        "draft_cloud_template_id":            "",
        "draft_cloud_tutorial_info":          "",
        "draft_cloud_videocut_purchase_info": "",
        "draft_cover":                        "draft_cover.jpg",
        "draft_deeplink_url":                 "",
        "draft_enterprise_info": {
            "draft_enterprise_extra": "",
            "draft_enterprise_id":    "",
            "draft_enterprise_name":  "",
            "enterprise_material":    [],
        },
        "draft_fold_path":              fold_fwd,
        "draft_id":                     draft_id,
        "draft_is_ae_produce":          False,
        "draft_is_ai_packaging_used":   False,
        "draft_is_ai_shorts":           False,
        "draft_is_ai_translate":        False,
        "draft_is_article_video_draft": False,
        "draft_is_cloud_temp_draft":    False,
        "draft_is_from_deeplink":       "false",
        "draft_is_invisible":           False,
        "draft_is_web_article_video":   False,
        "draft_materials":              [],
        "draft_name":                   draft_name,
        "draft_removable":              True,
        "draft_root_path":              root_bs,
        "draft_timeline_materials_size_": 0,
        "tm_draft_cloud_completed":     "",
        "tm_draft_cloud_modified":      0,
        "tm_draft_create":              now_us,
        "tm_draft_modified":            now_us,
        "tm_draft_removed":             0,
        "tm_duration":                  total_us,
    }
    (draft_dir / "draft_meta_info.json").write_text(
        json.dumps(meta, ensure_ascii=False), encoding="utf-8",
    )


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--manifest', required=True)
    args = p.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        _log(f'manifest missing: {manifest_path}')
        return 2

    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if not manifest.get('scenes'):
        _log('manifest has no scenes')
        return 2

    draft_dir = build_draft(manifest)
    print(f'OK {draft_dir}', flush=True)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        _log(f'fatal: {e!r}')
        sys.exit(1)
