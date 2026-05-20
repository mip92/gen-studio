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
  "scenes": [
    {
      "sceneKey":   "S01",
      "narration":  { "path": "...wav", "duration_us": 12345678 } | null,
      "shots": [
        { "shotCode": "S01_SH01", "path": "...mp4", "duration_us": 5062500 },
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

    # One video lane + two audio lanes (narration on top, bgm underneath).
    # Order matters: video first means the video is the "main" track in
    # CapCut's UI (top of the layer stack). Narration is added before bgm so
    # voiceover appears above background music in the audio layer stack.
    script.add_track(draft.TrackType.video, "main_video")
    script.add_track(draft.TrackType.audio, "narration")
    script.add_track(draft.TrackType.audio, "bgm")

    cursor_video_us = 0
    total_clips     = 0
    total_tts       = 0
    total_bgm       = 0
    # Last VideoSegment of each scene — used after the loop to attach a
    # transition between consecutive scenes. Skipping the very last entry
    # avoids a transition that has no "next" to dissolve into.
    last_segment_per_scene: list = []

    for scene in manifest["scenes"]:
        scene_start_us = cursor_video_us
        last_segment_in_scene = None

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
            material = draft.VideoMaterial(path, material_name=sh["shotCode"])
            segment  = draft.VideoSegment(
                material=material,
                target_timerange=draft.Timerange(start=cursor_video_us, duration=dur),
            )
            script.add_segment(segment, track_name="main_video")
            last_segment_in_scene = segment

            # Per-shot narration: lay the wav at this shot's exact timeline
            # position. The Node-side duration_us is a text-length estimate; we
            # probe the real wav here so pyJianYingDraft doesn't complain that
            # our timerange exceeds the material length ("超出了素材时长").
            shot_narr = sh.get("narration")
            if shot_narr and shot_narr.get("path"):
                wav_path = shot_narr["path"].replace("\\", "/")
                actual_us = _wav_duration_us(wav_path)
                guess_us  = int(shot_narr.get("duration_us") or 0)
                # Pick the SHORTER of: actual wav duration, the Node-side guess,
                # and the shot's video duration. Never clip beyond what really
                # exists in the wav file, and never overflow the video slot.
                tts_dur = actual_us if actual_us > 0 else guess_us
                if guess_us > 0:
                    tts_dur = min(tts_dur, guess_us)
                tts_dur = min(tts_dur, dur)
                if tts_dur > 0:
                    a_mat = draft.AudioMaterial(
                        wav_path,
                        material_name=f'{sh["shotCode"]}_narration',
                    )
                    a_seg = draft.AudioSegment(
                        material=a_mat,
                        target_timerange=draft.Timerange(start=cursor_video_us, duration=tts_dur),
                    )
                    script.add_segment(a_seg, track_name="narration")
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

        # Done with this scene — remember its last shot for transition placement.
        if last_segment_in_scene is not None:
            last_segment_per_scene.append(last_segment_in_scene)

    # ── Scene-boundary transitions ──────────────────────────────────────
    # Standard non-flashy transitions between consecutive scenes. Cycled so
    # five scenes don't all use the same crossfade. Applied to the OUTGOING
    # segment per pyJianYingDraft contract; the final scene is skipped (no
    # "next" to dissolve into). Names are Chinese identifiers from
    # `pyJianYingDraft.TransitionType` — looked up via getattr because the
    # enum members aren't valid Python attribute names without it.
    TRANSITION_CYCLE = [
        '叠化',      # cross-dissolve — the editorial workhorse
        '闪白',      # white flash    — quick subtle attention beat
        '闪黑',      # black flash    — quick subtle pause beat
        '雾化',      # haze/blur      — soft scene change
        '泛白',      # whiten         — gentle bloom into next
        '色彩溶解',   # color dissolve — subtle saturated wash
    ]
    TRANSITION_DURATION_US = 600_000   # 0.6s — short enough to stay invisible
    for i, seg in enumerate(last_segment_per_scene[:-1]):
        name = TRANSITION_CYCLE[i % len(TRANSITION_CYCLE)]
        tt   = getattr(draft.TransitionType, name, None)
        if tt is None:
            _log(f'transition lookup failed for "{name}" — skipping at boundary {i}')
            continue
        try:
            seg.add_transition(tt, duration=TRANSITION_DURATION_US)
        except Exception as e:  # noqa: BLE001
            _log(f'add_transition failed at boundary {i} ({name}): {e!r}')
    total_transitions = max(0, len(last_segment_per_scene) - 1)

    # ── BGM (ACE-Step) ──────────────────────────────────────────────────
    # Background music sits on its own audio lane. The Node-side manifest has
    # already filtered to approved AudioRenderJob rows and computed each
    # segment's `start_us` from the project's shot timeline (block start
    # + sum of previous segments).
    #
    # Two duration fields per entry:
    #   - duration_us         playback target on the CapCut timeline (segment slot)
    #   - render_duration_us  actual flac length on disk (renderSec from ACE-Step,
    #                         which is duration_us + overgen tail)
    #
    # We feed the flac into the segment with source_timerange clipped to
    # duration_us so the cut lands inside the overgen tail, then add_fade
    # turns that cut into a soft fade-out — masks ACE-Step's tendency to
    # end a take mid-phrase.
    BGM_FADE_IN_US  = 1_000_000   # 1 s in-fade for clean entry
    BGM_FADE_OUT_US = 1_500_000   # 1.5 s out-fade hides the source_timerange cut
    for mt in manifest.get("music_tracks") or []:
        wav_path = mt["path"].replace("\\", "/")
        actual_us = _audio_duration_us(wav_path)
        playback_us = int(mt.get("duration_us") or 0)
        render_us   = int(mt.get("render_duration_us") or 0)
        if actual_us <= 0 and playback_us <= 0 and render_us <= 0:
            _log(f'skipping bgm segment {mt.get("segmentId")}: cannot determine duration')
            continue
        # Cap playback at whatever's actually on disk — protects against jobs
        # that finished short for any reason (failed mid-render, then retried
        # under a stale params row).
        flac_us = actual_us if actual_us > 0 else render_us
        bgm_dur = playback_us if playback_us > 0 else flac_us
        if flac_us > 0:
            bgm_dur = min(bgm_dur, flac_us)
        if bgm_dur <= 0:
            continue
        material = draft.AudioMaterial(
            wav_path,
            material_name=f'bgm_{mt.get("blockSlug","")}_{mt.get("segmentId","")[:8]}',
        )
        # BGM sits under voiceover at 20% gain. ACE-Step output is normalised
        # to roughly -6 dBFS RMS so a straight pass would drown narration;
        # 0.2 ≈ -14 dB attenuation puts it where movie cues typically sit
        # behind dialog. Editable per-segment in CapCut afterward.
        segment = draft.AudioSegment(
            material=material,
            target_timerange=draft.Timerange(start=int(mt["start_us"]), duration=bgm_dur),
            # source_timerange crops the flac to the playback slot. Without it,
            # pyJianYingDraft would default source = target (same length, no
            # overgen benefit) — we want the overgen tail to be "available
            # material" that source_timerange reaches into when bgm_dur is
            # shorter than flac_us, so the cut sits inside that headroom.
            source_timerange=draft.Timerange(start=0, duration=bgm_dur),
            volume=0.2,
        )
        # Fade clamps at half the segment length so we don't crossfade past
        # the middle of a short cue. Out-fade is the important one — it
        # smooths the source_timerange cut into the next block.
        fade_in  = min(BGM_FADE_IN_US,  bgm_dur // 2)
        fade_out = min(BGM_FADE_OUT_US, bgm_dur // 2)
        segment.add_fade(in_duration=fade_in, out_duration=fade_out)
        script.add_segment(segment, track_name="bgm")
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
    _log(f'project={project} clips={total_clips} narration_tracks={total_tts} '
         f'bgm_tracks={total_bgm} transitions={total_transitions} duration_us={total_us}')
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
