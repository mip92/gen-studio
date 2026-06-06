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
  "scenes": [
    {
      "sceneKey":   "S01",
      "narration":  { "path": "...wav", "duration_us": 12345678 } | null,
      "shots": [
        # animated shot, legacy clip timing (no kind/source_us):
        { "shotCode": "S01_SH01", "path": "...mp4", "duration_us": 5062500 },
        # animated shot slowed to the VO (narration timing):
        { "shotCode": "S01_SH02", "path": "...mp4", "duration_us": 11000000, "source_us": 5062500 },
        # static shot — still PNG held + Ken Burns:
        { "shotCode": "S01_SH03", "path": "...png", "duration_us": 9000000, "kind": "image" },
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
from typing import Dict, Any, List

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


def _apply_ken_burns(segment: "draft.VideoSegment", duration_us: int, preset: str) -> None:
    """Animate a still-image segment with a slow Ken-Burns move.

    Zoom presets keyframe `uniform_scale` (the lib keeps the uniform flag on, so
    it scales both axes evenly). Pan/tilt presets hold a constant base scale via
    the segment's `clip_settings` (giving margin so the edge never shows) and
    keyframe only the moving property. pyJianYingDraft only does linear
    interpolation, which over a whole shot reads as a smooth slow drift.
    """
    KP  = draft.KeyframeProperty
    end = max(1, int(duration_us))
    if preset == 'zoom_in':
        segment.add_keyframe(KP.uniform_scale, 0,   1.0)
        segment.add_keyframe(KP.uniform_scale, end, 1.12)
    elif preset == 'zoom_out':
        segment.add_keyframe(KP.uniform_scale, 0,   1.12)
        segment.add_keyframe(KP.uniform_scale, end, 1.0)
    elif preset == 'pan_left':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = 1.12
        segment.add_keyframe(KP.position_x, 0,    0.06)
        segment.add_keyframe(KP.position_x, end, -0.06)
    elif preset == 'pan_right':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = 1.12
        segment.add_keyframe(KP.position_x, 0,   -0.06)
        segment.add_keyframe(KP.position_x, end,  0.06)
    elif preset == 'pan_up':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = 1.12
        segment.add_keyframe(KP.position_y, 0,   -0.06)
        segment.add_keyframe(KP.position_y, end,  0.06)
    elif preset == 'tilt':
        segment.clip_settings.scale_x = segment.clip_settings.scale_y = 1.12
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
    # Independent audio cursor — tracks the earliest microsecond at which the
    # next per-shot narration may start without overlapping the previous one
    # on the shared "narration" lane. Per user spec: «вставляй по очереди,
    # привязывай к началу шота если получается». Each narration anchors to
    # its shot's start position when possible; if a previous narration ran
    # past its shot and into this one, the current narration starts right
    # after the previous instead. Sequential, never overlapping.
    cursor_narration_us = 0
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

            if kind == "image":
                # Static shot: a still PNG held for `dur`, kept alive by a slow
                # Ken Burns move cycled across the film.
                segment = draft.VideoSegment(
                    material=material,
                    target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                )
                preset = KEN_BURNS_CYCLE[static_index % len(KEN_BURNS_CYCLE)]
                try:
                    _apply_ken_burns(segment, dur, preset)
                    _log(f'kenburns {sh["shotCode"]:<14} {preset}')
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
                    # legacy / native-length path (speed 1.0) — byte-unchanged
                    segment = draft.VideoSegment(
                        material=material,
                        target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
                    )

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
                else:
                    _log(f'skipping narration for {scene["sceneKey"]}: zero duration')

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
    # One audio lane PER ACT (`bgm_act_<act>`): every cue of an act shares a
    # lane, the next act starts a fresh lane. Within an act-lane, consecutive
    # cues are laid in start order and each is capped at the next cue's start
    # (same lane → would collide). The act's LAST cue plays its full overgen
    # tail — the next act is on a different lane, so the tail can ring out
    # without colliding. (Per user spec: «все треки в каждом акте в одной
    # дорожке, следующий акт — новая дорожка».) Falls back to blockSlug for
    # cues with no resolved act.
    #
    # Two duration fields per entry:
    #   - duration_us         planned slot length on the timeline
    #   - render_duration_us  actual flac length on disk (renderSec from ACE-Step,
    #                         which is duration_us + overgen tail)
    BGM_FADE_IN_US  = 1_000_000   # 1 s in-fade for clean entry
    BGM_FADE_OUT_US = 1_500_000   # 1.5 s out-fade hides the source_timerange cut
    tracks = list(manifest.get("music_tracks") or [])
    # Sort by start_us so "next track" lookup is correct even if blocks were
    # emitted out of timeline order.
    tracks.sort(key=lambda t: int(t.get("start_us") or 0))

    # Group by ACT, preserving sort order within each group. Each act becomes
    # its own audio lane. Cues are already globally sorted by start_us above,
    # so each act-group is in timeline order.
    act_groups: Dict[str, List[Dict[str, Any]]] = {}
    act_order: List[str] = []
    for mt in tracks:
        act = (mt.get("act") or mt.get("blockSlug") or "default") or "default"
        if act not in act_groups:
            act_groups[act] = []
            act_order.append(act)
        act_groups[act].append(mt)

    for act in act_order:
        track_name = f"bgm_act_{act}"
        script.add_track(draft.TrackType.audio, track_name)
        group = act_groups[act]
        for j, mt in enumerate(group):
            wav_path = mt["path"].replace("\\", "/")
            actual_us = _audio_duration_us(wav_path)
            playback_us = int(mt.get("duration_us") or 0)
            render_us   = int(mt.get("render_duration_us") or 0)
            if actual_us <= 0 and playback_us <= 0 and render_us <= 0:
                _log(f'skipping bgm segment {mt.get("segmentId")}: cannot determine duration')
                continue
            flac_us = actual_us if actual_us > 0 else render_us
            start_us = int(mt["start_us"])
            # Within a block: cap by the next cue in the same block (same
            # lane → would collide). For the last cue of a block: play out
            # the full flac (no neighbour on this lane, the next block's
            # first cue is on a different lane).
            if j + 1 < len(group):
                next_start_us = int(group[j + 1].get("start_us") or 0)
                bgm_dur = max(0, next_start_us - start_us)
                if flac_us > 0:
                    bgm_dur = min(bgm_dur, flac_us)
            else:
                bgm_dur = flac_us if flac_us > 0 else playback_us
            if bgm_dur <= 0:
                continue
            material = draft.AudioMaterial(
                wav_path,
                material_name=f'bgm_{act}_{mt.get("blockSlug","")}_{mt.get("segmentId","")[:8]}',
            )
            # BGM sits under voiceover at 20% gain. ACE-Step output is
            # normalised to roughly -6 dBFS RMS so a straight pass would
            # drown narration; 0.2 ≈ -14 dB attenuation puts it where movie
            # cues typically sit behind dialog. Editable per-segment in
            # CapCut afterward.
            segment = draft.AudioSegment(
                material=material,
                target_timerange=draft.Timerange(start=start_us, duration=bgm_dur),
                # source_timerange crops the flac to the playback slot.
                source_timerange=draft.Timerange(start=0, duration=bgm_dur),
                volume=0.2,
            )
            fade_in  = min(BGM_FADE_IN_US,  bgm_dur // 2)
            fade_out = min(BGM_FADE_OUT_US, bgm_dur // 2)
            segment.add_fade(in_duration=fade_in, out_duration=fade_out)
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
    rewrite_for_capcut_international(out_path)

    # Total duration of this draft (used both by root_meta and draft_meta).
    total_us = cursor_video_us
    register_in_capcut(drafts_root, draft_dir, manifest["draft_name"], total_us)

    _log(f'wrote {out_path}')
    _log(f'project={project} clips={total_clips} static={total_static} '
         f'narration_tracks={total_tts} bgm_tracks={total_bgm} '
         f'transitions={total_transitions} duration_us={total_us}')
    return draft_dir


def rewrite_for_capcut_international(draft_content_path: Path) -> None:
    """Post-process pyJianYingDraft's draft_content.json so CapCut International
    will open it. Two patches:

    1. Normalise every string field that contains backslashes to forward slashes
       (CapCut paths are forward-slash on Windows). pyJianYingDraft uses
       os.path-style normalisation which yields backslashes on Windows, and
       CapCut refuses to load those.
    2. Replace the `last_modified_platform` and `platform` blocks with values
       that match a CapCut International project. pyJianYingDraft tags drafts
       as JianYing (`app_source='lv'`, `app_id=3704`, `app_version='5.9.0'`)
       which CapCut International won't load.
    """
    with open(draft_content_path, "r", encoding="utf-8") as f:
        data = json.load(f)

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
