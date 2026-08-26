import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComicPlanService } from '../comic/comic-plan.service';
import { shotHoldUs } from './shot-timing';
import { SPARE_TRACK_COUNT } from '../bgm/bgm.types';

const APP_ROOT   = process.env.APP_ROOT   ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_DIR  = process.env.KOHYA_DIR  ?? 'E:\\kohya_ss';
const PYTHON_BIN = process.env.EXPORT_PYTHON ?? process.env.PYTHON_BIN
                 ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const EXPORT_SCRIPT = path.join(APP_ROOT, 'scripts', 'export_capcut.py');

// ── YouTube-Shorts export ───────────────────────────────────────────────────
// The shorts builder (scripts/export_shorts.py) reads the DB directly via
// psycopg2, so it needs a python that HAS psycopg2 — the backend's pyJianYingDraft
// python (PYTHON_BIN, kohya venv) does NOT. Default to the system `python`
// (Python312 on PATH has psycopg2); export_shorts.py in turn re-spawns
// export_capcut.py with EXPORT_PYTHON. Override with SHORTS_PYTHON if needed.
const SHORTS_SCRIPT = path.join(APP_ROOT, 'scripts', 'export_shorts.py');
const SHORTS_PYTHON = process.env.SHORTS_PYTHON ?? 'python';

// ── Comic export (cinematic page-flythrough) ─────────────────────────────────
// Two-python pipeline like shorts: comic_manifest.py reads the DB (psycopg2) →
// system python; export_comic.py needs pyJianYingDraft → the kohya venv python
// (PYTHON_BIN). The draft is written straight into CapCut's drafts folder
// (manifest.capcut_drafts_root), so it appears in CapCut with no copy step.
const COMIC_MANIFEST_SCRIPT = path.join(APP_ROOT, 'scripts', 'comic_manifest.py');
const COMIC_EXPORT_SCRIPT   = path.join(APP_ROOT, 'scripts', 'export_comic.py');
const COMIC_MANIFEST_PYTHON = process.env.COMIC_PYTHON ?? SHORTS_PYTHON;

// ── Chunked comic export (`comic_chunks`) ────────────────────────────────────
// A feature-length comic draft is ~200 MB of keyframes, which CapCut opens slowly
// and often crashes on. This export renders the picture as several small drafts
// (~35 MB each) that the user exports to mp4 one by one, then assembles ONE light
// final draft: flat video + LIVE narration, music and subtitles, so all the hand
// work happens once. Separate scripts throughout — the single-draft comic export
// above is untouched.
// TEMPORARY (user 2026-08-01): one-spread test render — iterate on the desk /
// props / paper styling without a full draft build. Delete with the script.
const COMIC_TEST_SPREAD_SCRIPT  = path.join(APP_ROOT, 'scripts', 'comic_test_spread.py');

const COMIC_CHUNKS_SCRIPT       = path.join(APP_ROOT, 'scripts', 'comic_chunks.py');
const COMIC_CHUNKS_BUILD_SCRIPT = path.join(APP_ROOT, 'scripts', 'comic_chunks_build.py');
const COMIC_ASSEMBLE_SCRIPT     = path.join(APP_ROOT, 'scripts', 'comic_assemble.py');
/** Spreads per chunk. 4 lands a draft at ~36 MB, next to the size CapCut is known
 *  to open comfortably; the knob exists because spread weight varies by project. */
const COMIC_SPREADS_PER_CHUNK   = 4;

/** One chunk of the film, as planned by comic_chunks.py. */
export interface ComicChunk {
  part: number;
  of: number;
  draft_name: string;
  manifest: string;
  spread_from: number;
  spread_to: number;
  spreads: number;
  /** Where this chunk starts on the FILM timeline (manifest µs) — the anchor the
   *  assembler uses to re-place narration and music after measuring the mp4s. */
  film_offset_us: number;
  expected_us: number;
  ends_on_turn: boolean;
}

export interface ComicChunkPlan {
  project_name: string;
  base_draft_name: string;
  spreads_total: number;
  per_chunk: number;
  film_duration_us: number;
  chunks: ComicChunk[];
}
/** Curated per-project shorts plan lives here (versioned in git). The endpoint
 *  reads it when no plan is POSTed in the request body. */
const shortsPlanPath = (slug: string) =>
  path.join(APP_ROOT, 'scripts', `${slug}_shorts_plan.json`);

/** Shape of scripts/<slug>_shorts_plan.json. Extra keys (top-level _note,
 *  per-short _why) are hand-written commentary — preserved verbatim on writes. */
interface ShortsPlanFile {
  shorts?: Array<{ slug: string; title?: string; shots?: string[] } & Record<string, unknown>>;
  [key: string]: unknown;
}

/** Stable export resolution. CapCut accepts arbitrary sizes; 1080p is what
 *  our FHD upscale produces, so matching it avoids per-clip rescale on import. */
const EXPORT_WIDTH  = 1920;
const EXPORT_HEIGHT = 1080;
/** CapCut works in 30/60 fps. Our i2v renders at 16 fps but the FHD upscale
 *  is normally interpolated to 30; using 30 here matches both. */
const EXPORT_FPS    = 30;

interface ShotReadinessIssue {
  shotCode:  string;
  shotId:    string;
  reason:    'no_chosen_video' | 'no_upscale' | 'no_interp' | 'no_chosen_render';
}
interface SceneReadinessIssue {
  sceneKey:  string;
  sceneId:   string;
  title:     string | null;
  reason:    'no_shots';
}
interface MusicReadinessIssue {
  /** null when the whole project has no NarrativeBlocks at all. */
  blockSlug: string | null;
  /** no_blocks: project has no music blocks; no_tiles: block has no main tiles;
   *  unapproved: block has main tiles still awaiting an approved take. */
  reason:    'no_blocks' | 'no_tiles' | 'unapproved';
  /** For 'unapproved': how many main tiles still lack an approved take. */
  count?:    number;
}

export interface ExportReadiness {
  ready: boolean;
  totals: { scenes: number; shots: number };
  missingShots:  ShotReadinessIssue[];
  missingScenes: SceneReadinessIssue[];
  /** Music is REQUIRED for export: every act (NarrativeBlock) must have all its
   *  main tiles approved. Spare tiles are optional (manual-editing material). */
  missingMusic:  MusicReadinessIssue[];
}

interface ManifestShot  {
  shotCode:    string;
  /** Media on the main video lane: an mp4 (animated shot) or a still PNG
   *  (static shot — see `kind`). */
  path:        string;
  /** Playback length of this shot on the timeline, microseconds. */
  duration_us: number;
  /** Media kind. Omitted (undefined) means "video" — keeps the manifest for
   *  legacy clip-timed projects byte-identical, so their exports never change.
   *  "image" means `path` is a still PNG that the python exporter holds for
   *  `duration_us` and animates with a slow Ken-Burns move. */
  kind?:       'image';
  /** Native source length of the mp4, microseconds. Emitted ONLY when the
   *  exporter must slow the clip to fill the voiceover (exportTiming
   *  "narration"): python sets a source_timerange so pyJianYingDraft computes
   *  speed = source_us / duration_us (< 1.0 → slow-motion). When absent the
   *  python path is unchanged (speed 1.0, clip plays at its native length). */
  source_us?:  number;
  /** Drop this clip's own audio: the python exporter lays the video segment with
   *  volume=0. Emitted ONLY when the clip is muted, so a manifest for a project
   *  that never touched the switch is byte-identical to before. Relevant to LTX
   *  clips, which carry generated sound; Wan clips have no audio to mute. */
  mute_audio?: true;
  /** Per-shot narration wav (shot-level TTS). When set, the python exporter
   *  lays the wav on the audio track at this shot's video timeline position
   *  instead of the legacy scene-level narration block. `text` is the exact
   *  VO line (TTSJob.text) — the exporter emits it as an SRT subtitle cue at
   *  the wav's timeline position, so captions match the spoken audio without
   *  CapCut's error-prone auto-recognition. */
  narration?:  { path: string; duration_us: number; text: string } | null;
}
interface ManifestScene {
  sceneKey:  string;
  title:     string | null;
  /** Legacy whole-scene voiceover. Used only when per-shot narrations are not
   *  set on any shot of the scene — the python exporter prefers per-shot wavs
   *  when they exist. `text` feeds the SRT subtitle export (see ManifestShot). */
  narration: { path: string; duration_us: number; text: string } | null;
  shots:     ManifestShot[];
}
/**
 * One approved ACE-Step take (tile) of an act's music. The python exporter lays
 * an act's tiles CHECKERBOARD across two lanes (a/b): it walks them in `order`
 * from `block_start_us` and advances by each tile's REAL flac length minus the
 * crossfade, so tiles overlap exactly for a crossfade regardless of their size.
 * Positions are computed python-side from the on-disk flac — NOT baked here —
 * so legacy short takes and new 150s tiles both lay tight.
 */
interface ManifestMusic {
  blockSlug:   string;
  /** Act this tile belongs to (shotCode prefix), informational. Grouping/lanes
   *  key on blockSlug so each block keeps its own lane pair. */
  act:         string;
  /** Lane within the act: 'a' or 'b' — tiles alternate across the two for the
   *  crossfade. One CapCut audio track per (block, lane). */
  lane:        string;
  /** Placement order within the block (0-based, over PLACED tiles). */
  order:       number;
  /** Spare surplus tile (informational). Placed identically to main tiles. */
  spare:       boolean;
  segmentId:   string;
  jobId:       string;
  /** Absolute path to the rendered flac under data/<slug>/bgm/<blockSlug>/. */
  path:        string;
  /** Timeline start of this tile's block (act anchor). All tiles of a block
   *  share it; python accumulates each tile's real position from here. */
  block_start_us: number;
  /** Fallback length (µs) if python can't probe the flac header. */
  render_duration_us: number;
}
interface Manifest {
  project_name:        string;
  draft_name:          string;
  /** Where manifest.json + a copy of draft_content.json live for our own
   *  audit/debug. Not the place CapCut reads from. */
  output_root:         string;
  /** CapCut's drafts directory — where the python exporter writes the actual
   *  draft folder (`<capcut_drafts_root>/<draft_name>/draft_content.json`)
   *  and registers it in `root_meta_info.json`. Defaults to
   *  `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft` when the
   *  service can resolve LOCALAPPDATA, otherwise falls back to `output_root`
   *  and the user has to copy the folder themselves. */
  capcut_drafts_root:  string;
  width:               number;
  height:              number;
  fps:                 number;
  scenes:              ManifestScene[];
  /** Approved BGM segments laid out on the project timeline. Empty array if
   *  the project has no NarrativeBlocks, no approved AudioRenderJobs, or all
   *  approved jobs lost their flac on disk — none of these is fatal. */
  music_tracks:        ManifestMusic[];
  /** Shot-boundary transition preset, read from project.settings.transitionPreset.
   *  "default" (legacy) = cycle the curated 8 free non-overlap CapCut transitions
   *  across every boundary in rotation. "comic" = stylized comic look: 漫画撕纸
   *  (Comic Tear) 90% / 便利贴 (Sticker) 5% / 故障拼贴 (Glitch Collage) 5%,
   *  distributed across boundaries at random positions. See export_capcut.py for
   *  the per-preset transition tables. */
  transition_preset:   'default' | 'comic';
}

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  /** Slugs with a comic draft render currently in flight (async build guard). */
  private readonly buildingComic = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly comicPlan: ComicPlanService,
  ) {}

  /** Find a project by slug or id (mirrors ProjectsService pattern). */
  private async findProject(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return project;
  }

  /**
   * Check whether every Shot has a chosen+FHD-upscaled VideoRender and every
   * Scene has an approved TTSJob. Returns a structured breakdown so the UI
   * can list the offending rows in the tooltip.
   */
  async checkReadiness(idOrSlug: string): Promise<ExportReadiness> {
    const project = await this.findProject(idOrSlug);
    const scenes  = await this.prisma.scene.findMany({
      where:   { projectId: project.id },
      include: { shots: { include: { videoRenders: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    const missingShots:  ShotReadinessIssue[] = [];
    const missingScenes: SceneReadinessIssue[] = [];
    let totalShots = 0;

    for (const scene of scenes) {
      // Scene-level "no_approved_tts" gate was removed: per-shot TTS replaces
      // whole-scene narration. A shot with no approved wav simply plays silent
      // video on its timeline slot — that's fine, not a blocker.
      if (scene.shots.length === 0) {
        missingScenes.push({
          sceneKey: scene.sceneKey, sceneId: scene.id, title: scene.title,
          reason: 'no_shots',
        });
      }
      for (const shot of scene.shots) {
        totalShots++;
        // Static shots ship as their still PNG — they need a chosen render but
        // NO video / upscale. Animated shots (default) need a chosen video that
        // has finished its FHD upscale.
        if (shot.renderMode === 'static') {
          if (!shot.chosenRender) {
            missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_chosen_render' });
          }
          continue;
        }
        const chosen = shot.chosenVideoId
          ? shot.videoRenders.find((v) => v.id === shot.chosenVideoId) ?? null
          : null;
        if (!chosen) {
          missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_chosen_video' });
        } else if (chosen.upscaleStatus !== 'completed' || !chosen.upscaledFilename) {
          missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_upscale' });
        } else if (chosen.interpStatus !== 'completed' || !chosen.interpFilename) {
          // Mandatory FPS-interpolation gate — runs after upscale; the smoothed
          // clip is the deliverable. Blocks export until done.
          missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_interp' });
        }
      }
    }

    // ── Music is REQUIRED: every act (NarrativeBlock) must have all its MAIN
    // tiles approved. Spare tiles stay optional. A project with no blocks at
    // all is not exportable (per user spec: «без музыки не давать экспорт»).
    const missingMusic: MusicReadinessIssue[] = [];
    const blocks = await this.prisma.narrativeBlock.findMany({
      where:   { projectId: project.id },
      include: { segments: true },
    });
    if (blocks.length === 0) {
      missingMusic.push({ blockSlug: null, reason: 'no_blocks' });
    } else {
      for (const block of blocks) {
        const mains = block.segments.filter((s) => !(s as { spare?: boolean }).spare);
        if (mains.length === 0) {
          missingMusic.push({ blockSlug: block.slug, reason: 'no_tiles' });
          continue;
        }
        const unapproved = mains.filter((s) => !s.approvedJobId).length;
        if (unapproved > 0) {
          missingMusic.push({ blockSlug: block.slug, reason: 'unapproved', count: unapproved });
        }
      }
    }

    return {
      ready:         missingShots.length === 0 && missingScenes.length === 0 && missingMusic.length === 0,
      totals:        { scenes: scenes.length, shots: totalShots },
      missingShots,
      missingScenes,
      missingMusic,
    };
  }

  /**
   * Build the manifest + spawn the Python exporter. Returns the absolute path
   * to the resulting draft folder. Refuses to run if readiness check fails —
   * the UI is supposed to enforce this too, but we double-check server-side.
   *
   * Output layout (per user spec — "create a folder on disk, in the Comfy area"):
   *
   *   E:/ComfyUI/gen-studio/data/<slug>/exports/capcut/<slug>_<yyyymmdd_hhmm>/
   *     ├─ draft_content.json   ← the JianYing/CapCut draft
   *     └─ manifest.json        ← what we fed the python exporter (for debugging)
   */
  async exportCapcut(idOrSlug: string): Promise<{
    draftPath:  string;
    sceneCount: number;
    shotCount:  number;
  }> {
    const project   = await this.findProject(idOrSlug);
    const readiness = await this.checkReadiness(project.id);
    if (!readiness.ready) {
      throw new BadRequestException(
        `Project ${project.slug} is not ready to export: `
        + `${readiness.missingShots.length} shot(s) not render-ready `
        + `(animated need a chosen video + FHD upscale + FPS interpolation; static need a chosen render), `
        + `${readiness.missingScenes.length} empty act(s), `
        + `${readiness.missingMusic.length} act(s) without approved music.`,
      );
    }

    if (!existsSync(PYTHON_BIN)) {
      throw new BadRequestException(`python bin missing: ${PYTHON_BIN} (set EXPORT_PYTHON env)`);
    }
    if (!existsSync(EXPORT_SCRIPT)) {
      throw new BadRequestException(`export_capcut.py missing: ${EXPORT_SCRIPT}`);
    }

    const manifest = await this.buildManifest(project.id, project.slug);
    if (manifest.scenes.length === 0) {
      throw new BadRequestException(`Project ${project.slug} has no scenes`);
    }

    // Make sure the output dir exists before the python subprocess writes there.
    mkdirSync(path.join(manifest.output_root, manifest.draft_name), { recursive: true });
    const manifestPath = path.join(manifest.output_root, manifest.draft_name, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    this.logger.log(`Spawning CapCut exporter for ${project.slug} → ${manifest.draft_name}`);

    const { code, stderr } = await runPython(PYTHON_BIN, [
      '-X', 'utf8', EXPORT_SCRIPT, '--manifest', manifestPath,
    ]);
    if (code !== 0) {
      throw new BadRequestException(`export_capcut.py exited ${code}: ${stderr.trim().slice(-800)}`);
    }

    // The python script writes the actual draft into capcut_drafts_root —
    // that's the path we hand back to the UI so the user can find/open it
    // directly in CapCut. A debug copy of draft_content.json + manifest.json
    // stays in output_root.
    const draftPath = path.join(manifest.capcut_drafts_root, manifest.draft_name);
    const draftFile = path.join(draftPath, 'draft_content.json');
    if (!existsSync(draftFile)) {
      throw new BadRequestException(`exporter finished cleanly but draft_content.json not found at ${draftFile}`);
    }
    this.logger.log(`CapCut draft ready at ${draftPath}`);

    return {
      draftPath,
      sceneCount: manifest.scenes.length,
      shotCount:  manifest.scenes.reduce((s, sc) => s + sc.shots.length, 0),
    };
  }

  /**
   * Walk the project, resolve every chosen FHD video path + approved TTS path,
   * and emit the manifest that the python script consumes. Throws if any
   * resource is missing on disk — caller has already enforced the readiness
   * gate, so this is a sanity check.
   */
  private async buildManifest(projectId: string, projectSlug: string): Promise<Manifest> {
    const scenes = await this.prisma.scene.findMany({
      where:   { projectId },
      include: {
        shots: {
          include: {
            videoRenders: true,
            // Pull approved shot-level TTS rows so we can attach per-shot wavs.
            ttsJobs:      true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const exportTiming = project?.exportTiming === 'narration' ? 'narration' : 'clip';
    // Transition preset lives in the settings JSON (same place as styleLora) so
    // it needs no schema column. Anything other than the literal "comic" falls
    // back to the legacy rotation, so old projects export byte-identically.
    const settings = (project?.settings ?? null) as unknown as { transitionPreset?: unknown } | null;
    const transitionPreset: 'default' | 'comic' =
      settings?.transitionPreset === 'comic' ? 'comic' : 'default';
    // VO-driven timing constants (TAIL_US / MIN_SHOT_US / NO_VO_US) live in
    // ./shot-timing so the BGM act-length math uses the exact same values.

    const dataRoot = path.join(APP_ROOT, 'data', projectSlug);
    const out: ManifestScene[] = [];
    /**
     * shotId → microsecond offset from start of project timeline. Built while
     * we walk scenes so the BGM placement pass below can resolve each block's
     * start position without re-traversing the storyboard.
     */
    const shotIdToStartUs = new Map<string, number>();
    /** shotId → act key, parsed from the shotCode prefix before "_SH"
     *  ("A1_SH22" → "A1", "C_SH06" → "C", "CD_SH06" → "CD"). Drives per-act
     *  BGM lane grouping in the CapCut exporter. */
    const shotIdToAct = new Map<string, string>();
    const actOf = (shotCode: string): string => {
      const m = /^(.+?)_SH/i.exec(shotCode ?? '');
      return m ? m[1] : (shotCode || 'misc');
    };
    let timelineCursorUs = 0;

    for (const scene of scenes) {
      // Shots within an act sort by shotCode — they're like "A1_SH01",
      // "A1_SH02" so a plain lexical sort matches the storyboard order.
      const shots = [...scene.shots].sort((a, b) => a.shotCode.localeCompare(b.shotCode));

      const shotEntries: ManifestShot[] = [];
      for (const shot of shots) {
        // ── Per-shot narration: resolve once, used for BOTH the audio lane and
        // (in narration timing) the shot's hold duration. We pass the REAL wav
        // duration (from TTSJob.durationMs, populated by TTSService on
        // completion); python places narrations sequentially on the audio lane
        // without truncating audio that runs longer than its shot. Per user
        // spec: «вставляй по очереди, привязывай к началу шота если получается».
        let narrationUs: number | null = null;
        let shotNarration: ManifestShot['narration'] = null;
        const approvedId  = (shot as { approvedTTSJobId?: string | null }).approvedTTSJobId ?? null;
        const ttsJobs     = (shot as { ttsJobs?: Array<{ id: string; outputFilename: string | null; text: string; durationMs: number | null }> }).ttsJobs ?? [];
        const approvedTts = approvedId ? ttsJobs.find((t) => t.id === approvedId) : null;
        if (approvedTts?.outputFilename) {
          const wavPath = path.join(dataRoot, 'shots', shot.shotCode, approvedTts.outputFilename);
          if (existsSync(wavPath)) {
            // Prefer the probed durationMs; fall back to a text-length estimate
            // for legacy rows that pre-date the durationMs column.
            const trueWavUs = approvedTts.durationMs != null && approvedTts.durationMs > 0
              ? approvedTts.durationMs * 1000
              : Math.max(800_000, Math.round((approvedTts.text.length / 15) * 1_000_000));
            narrationUs   = trueWavUs;
            shotNarration = { path: wavPath, duration_us: trueWavUs, text: approvedTts.text };
          } else {
            this.logger.warn(`shot ${shot.shotCode}: approved TTS wav missing on disk (${wavPath}) — skipping audio`);
          }
        }

        // ── Resolve media + native length per render mode ──
        let mediaPath: string;
        let kind: 'image' | undefined;
        let sourceUs: number | undefined;   // native clip length (animated only)
        let muteAudio = false;              // clip carries sound we don't want
        if ((shot as { renderMode?: string }).renderMode === 'static') {
          // Static shot ships its chosen still PNG — no video, no upscale.
          if (!shot.chosenRender) continue; // gated upstream (no_chosen_render)
          mediaPath = path.join(dataRoot, 'shots', shot.shotCode, shot.chosenRender);
          if (!existsSync(mediaPath)) {
            throw new BadRequestException(`Chosen render PNG missing for shot ${shot.shotCode}: ${mediaPath}`);
          }
          kind = 'image';
        } else {
          const video = shot.videoRenders.find((v) => v.id === shot.chosenVideoId);
          if (!video || !video.interpFilename) continue; // gated upstream (needs upscale + interp)
          // The FPS-interpolated (smoothed) clip is the final deliverable — it
          // supersedes the raw FHD upscale. videos_smooth/<file> is FHD too
          // (interpolation only changes framerate, not resolution).
          mediaPath = path.join(dataRoot, 'shots', shot.shotCode, 'videos_smooth', video.interpFilename);
          if (!existsSync(mediaPath)) {
            throw new BadRequestException(`Smoothed (interpolated) mp4 missing for shot ${shot.shotCode}: ${mediaPath}`);
          }
          // length = frame count at FPS; upscale + interpolation both preserve
          // real-time duration (interp adds frames AND raises fps proportionally).
          const params  = (video.params ?? {}) as { fps?: number; length?: number };
          const fpsP    = params.fps    ?? 16;
          const lengthP = params.length ?? 81;
          sourceUs = Math.round((lengthP / fpsP) * 1_000_000);
          // The clip's own audio (LTX writes sound with the picture). Muting is
          // a timeline decision, not a file edit — see setAudioMuted().
          muteAudio = (video as { audioMuted?: boolean }).audioMuted === true;
        }

        // ── Timeline hold duration ──
        // Shared with the BGM act-length math via shotHoldUs (./shot-timing):
        // VO + 0.5s tail, floored to MIN_SHOT in narration mode, and animated
        // clips stretched (never trimmed) to fit a longer VO. Behaviour is
        // identical to the previous inline computation.
        const duration_us = shotHoldUs({ kind, sourceUs, narrationUs, exportTiming });

        shotIdToStartUs.set(shot.id, timelineCursorUs);
        shotIdToAct.set(shot.id, actOf(shot.shotCode));
        timelineCursorUs += duration_us;

        // Emit source_us whenever an animated clip's timeline duration differs
        // from its native length, so python sets a source_timerange and remaps
        // speed: duration > native → slow-mo (the VO-fill floor above, in either
        // timing mode); duration < native → trim (narration timing's shorter-VO
        // case). When they match (clip timing with VO ≤ clip, or no VO) it's
        // omitted and the clip plays at native speed 1.0 — byte-identical to the
        // legacy path, so untouched shots in existing exports don't change.
        const emitSourceUs = kind === undefined
          && sourceUs !== undefined
          && sourceUs !== duration_us;

        shotEntries.push({
          shotCode:  shot.shotCode,
          path:      mediaPath,
          duration_us,
          ...(kind ? { kind } : {}),
          ...(emitSourceUs ? { source_us: sourceUs } : {}),
          ...(muteAudio ? { mute_audio: true as const } : {}),
          narration: shotNarration,
        });
      }

      let narration: ManifestScene['narration'] = null;
      if (scene.approvedTTSJobId) {
        const tts = await this.prisma.tTSJob.findUnique({ where: { id: scene.approvedTTSJobId } });
        if (tts?.outputFilename) {
          const fp = path.join(dataRoot, 'scenes', scene.sceneKey, tts.outputFilename);
          if (!existsSync(fp)) {
            throw new BadRequestException(`Narration wav missing for scene ${scene.sceneKey}: ${fp}`);
          }
          // We don't store wav duration on the job row, so approximate from
          // text length (≈15 chars/sec at our default rate). This is only
          // used to bound the AudioSegment timerange; if the wav is longer
          // it'll be truncated, if shorter it'll play silence at the end.
          // Safer estimate: take 80% of "max plausible" → use shot total
          // duration of the scene as the upper bound, so audio never
          // overshoots the next scene visually.
          const sceneShotsDuration = shotEntries.reduce((s, x) => s + x.duration_us, 0);
          const charBasedGuessUs   = Math.max(1_500_000, Math.round((tts.text.length / 15) * 1_000_000));
          const duration_us = Math.min(charBasedGuessUs, Math.max(sceneShotsDuration, charBasedGuessUs));
          narration = { path: fp, duration_us, text: tts.text };
        }
      }

      out.push({
        sceneKey: scene.sceneKey,
        title:    scene.title,
        narration,
        shots:    shotEntries,
      });
    }

    // ── BGM (ACE-Step) timeline ─────────────────────────────────────────
    // Per act (= NarrativeBlock): fixed 150s tiles auto-cover the act, laid
    // CHECKERBOARD across two main lanes (a/b) that overlap by CROSSFADE_SECONDS
    // so one tile fades out while the next fades in. Plus SPARE_TRACK_COUNT
    // spare tiles dropped raw on their own lanes (spare1/spare2) as manual-edit
    // material. Every act gets its OWN fresh lanes so adjacent acts never
    // collide. Music is REQUIRED — checkReadiness() blocks export without it.
    const blocks = await this.prisma.narrativeBlock.findMany({
      where:   { projectId },
      include: {
        segments: {
          orderBy: { sortOrder: 'asc' },
          include: { jobs: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    const musicTracks: ManifestMusic[] = [];
    for (const block of blocks) {
      const shotIds = ((block.shotIds as unknown) as string[]) ?? [];
      // Earliest covered shot defines the act's timeline start + act key.
      let blockStartUs = Infinity;
      let blockAct: string | null = null;
      for (const sid of shotIds) {
        const v = shotIdToStartUs.get(sid);
        if (v !== undefined && v < blockStartUs) {
          blockStartUs = v;
          blockAct = shotIdToAct.get(sid) ?? null;
        }
      }
      if (!Number.isFinite(blockStartUs)) {
        this.logger.warn(
          `block ${block.slug}: none of its shotIds resolved to the timeline `
          + `(no chosen FHD video?) — skipping BGM placement`,
        );
        continue;
      }
      const act = blockAct ?? block.slug;

      // Resolve a segment's approved take to an on-disk flac, or null (skip).
      const resolveTake = (seg: (typeof block.segments)[number]) => {
        if (!seg.approvedJobId) return null;
        const job = seg.jobs.find((j) => j.id === seg.approvedJobId);
        if (!job || job.status !== 'completed' || !job.outputFilename) {
          this.logger.warn(`segment ${seg.id}: approvedJobId points at non-completed job, skipping`);
          return null;
        }
        const fp = path.join(dataRoot, 'bgm', block.slug, job.outputFilename);
        if (!existsSync(fp)) {
          this.logger.warn(`segment ${seg.id}: flac missing on disk (${fp}), skipping`);
          return null;
        }
        const jobParams = (job.params ?? null) as null | { renderSec?: number };
        return { fp, jobId: job.id, renderSec: jobParams?.renderSec ?? seg.durationSec };
      };

      // ALL tiles of the act — main coverage tiles then the 2 spare surplus
      // tiles — go into ONE checkerboard across the act's two lanes (a/b),
      // alternating by placement order. We emit only the act anchor + order +
      // lane; the python exporter computes each tile's real timeline position
      // from the on-disk flac length so any tile size lays tight (per user:
      // «ставь по реальной длине трека, а не замоканому числу»). Each act uses a
      // fresh lane pair (grouped per block python-side). Skipped (unapproved)
      // tiles don't advance `placed`, so the a/b alternation never desyncs.
      const mains  = block.segments.filter((s) => !(s as { spare?: boolean }).spare);
      const spares = block.segments.filter((s) =>  (s as { spare?: boolean }).spare).slice(0, SPARE_TRACK_COUNT);
      const tiles  = [...mains, ...spares];

      let placed = 0;
      for (const seg of tiles) {
        const take = resolveTake(seg);
        if (!take) continue;
        musicTracks.push({
          blockSlug:          block.slug,
          act,
          lane:               placed % 2 === 0 ? 'a' : 'b',
          order:              placed,
          spare:              !!(seg as { spare?: boolean }).spare,
          segmentId:          seg.id,
          jobId:              take.jobId,
          path:               take.fp,
          block_start_us:     blockStartUs,
          render_duration_us: take.renderSec * 1_000_000,
        });
        placed++;
      }
    }
    // ── Anchor music to the first shot on the timeline ──────────────────
    // Shift the earliest scored act to timeline 0 when the film opens on an
    // un-scored cold-open, so music starts with the very first shot. Only that
    // one act moves (all its tiles share block_start_us); later acts stay put.
    if (musicTracks.length > 0) {
      const earliest = Math.min(...musicTracks.map((mt) => mt.block_start_us));
      if (earliest > 0) {
        for (const mt of musicTracks) {
          if (mt.block_start_us === earliest) mt.block_start_us = 0;
        }
        this.logger.log(`anchoring earliest BGM act from ${earliest}us → 0 so music starts at the first shot`);
      }
    }
    this.logger.log(`built ${musicTracks.length} music_tracks across ${blocks.length} block(s)`);

    const ts        = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13); // YYYYMMDDtHHMM
    const draftName = `${projectSlug}_${ts}`;
    const outRoot   = path.join(APP_ROOT, 'data', projectSlug, 'exports', 'capcut');
    mkdirSync(outRoot, { recursive: true });

    // Where CapCut keeps its drafts. CAPCUT_DRAFTS_ROOT wins, then %LOCALAPPDATA%
    // (a stock Windows install), then our own exports tree on non-Windows hosts,
    // where the user copies the folder manually (the old behavior).
    //
    // Whatever the override holds, it must be the SAME STRING CapCut uses. CapCut
    // matches projects in root_meta_info.json by path, so pointing this at the real
    // location behind a junction — even though it is byte-for-byte the same folder —
    // makes the launcher list every draft twice (user 2026-07-26).
    const localAppData = process.env.LOCALAPPDATA;
    const capcutDraftsRoot =
      process.env.CAPCUT_DRAFTS_ROOT
      ?? (localAppData
        ? path.join(localAppData, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft')
        : outRoot);

    return {
      project_name:       projectSlug,
      draft_name:         draftName,
      output_root:        outRoot,
      capcut_drafts_root: capcutDraftsRoot,
      width:              EXPORT_WIDTH,
      height:             EXPORT_HEIGHT,
      fps:                EXPORT_FPS,
      scenes:             out,
      music_tracks:       musicTracks,
      transition_preset:  transitionPreset,
    };
  }

  // ── YouTube-Shorts export ─────────────────────────────────────────────────

  /**
   * Read the project's curated shorts plan (scripts/<slug>_shorts_plan.json) so
   * the UI can show what's planned and enable/disable the button. Never throws
   * for a missing/invalid plan — returns hasPlan:false.
   */
  async getShortsPlan(idOrSlug: string): Promise<{
    hasPlan: boolean;
    shorts:  Array<{
      slug:    string;
      title:   string;
      shots:   number;
      /** Planned shots in plan order, with the chosen render (when one exists)
       *  so the UI can show real frame thumbnails on the shorts cards. */
      preview: Array<{ shotId: string | null; shotCode: string; image: string | null }>;
    }>;
  }> {
    const project  = await this.findProject(idOrSlug);
    const planPath = shortsPlanPath(project.slug);
    if (!existsSync(planPath)) return { hasPlan: false, shorts: [] };
    try {
      const plan = JSON.parse(readFileSync(planPath, 'utf-8')) as {
        shorts?: Array<{ slug: string; title?: string; shots?: string[] }>;
      };
      const codes = [...new Set((plan.shorts ?? []).flatMap((s) => s.shots ?? []))];
      const rows  = codes.length
        ? await this.prisma.shot.findMany({
            where:  { projectId: project.id, shotCode: { in: codes } },
            select: { id: true, shotCode: true, chosenRender: true },
          })
        : [];
      const byCode = new Map(rows.map((r) => [r.shotCode, r]));
      const shorts = (plan.shorts ?? []).map((s) => ({
        slug:    s.slug,
        title:   s.title ?? s.slug,
        shots:   (s.shots ?? []).length,
        preview: (s.shots ?? []).map((code) => {
          const row = byCode.get(code);
          return { shotId: row?.id ?? null, shotCode: code, image: row?.chosenRender ?? null };
        }),
      }));
      return { hasPlan: shorts.length > 0, shorts };
    } catch (e) {
      this.logger.warn(`shorts plan for ${project.slug} unreadable: ${String(e)}`);
      return { hasPlan: false, shorts: [] };
    }
  }

  /** Read the raw plan file; null when absent, 400 when present but corrupt —
   *  never silently overwrite a hand-curated file we couldn't parse. */
  private readShortsPlanFile(planPath: string): ShortsPlanFile | null {
    if (!existsSync(planPath)) return null;
    try {
      return JSON.parse(readFileSync(planPath, 'utf-8')) as ShortsPlanFile;
    } catch {
      throw new BadRequestException(
        `${path.basename(planPath)} is not valid JSON — fix it by hand before editing the plan via the API`,
      );
    }
  }

  /**
   * Add a short to the versioned plan, or replace the same-slug entry (title
   * and shots are overwritten; hand-written extras like `_why` stay). Creates
   * the plan file with our standard vertical defaults when it doesn't exist.
   */
  async upsertShortPlanEntry(
    idOrSlug: string,
    body: { slug?: string; title?: string; shots?: string[] },
  ) {
    const project = await this.findProject(idOrSlug);
    const slug = (body.slug ?? '').trim();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) {
      throw new BadRequestException('slug: lowercase latin letters/digits/_/-, e.g. "hook"');
    }
    const shots = (body.shots ?? []).map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!shots.length) throw new BadRequestException('shots: at least one shot code required');

    // Catch typos now, not at export time: every planned code must be a real shot.
    const rows = await this.prisma.shot.findMany({
      where:  { projectId: project.id, shotCode: { in: shots } },
      select: { shotCode: true },
    });
    const known   = new Set(rows.map((r) => r.shotCode));
    const unknown = shots.filter((c) => !known.has(c));
    if (unknown.length) {
      throw new BadRequestException(`unknown shot codes: ${unknown.join(', ')}`);
    }

    const planPath = shortsPlanPath(project.slug);
    const plan = this.readShortsPlanFile(planPath) ?? {
      project: project.slug,
      fill:    'cover',
      width:   1080,
      height:  1920,
      fps:     30,
      shorts:  [],
    };
    plan.shorts = plan.shorts ?? [];
    const title    = (body.title ?? '').trim() || slug;
    const existing = plan.shorts.find((s) => s.slug === slug);
    if (existing) {
      existing.title = title;
      existing.shots = shots;
    } else {
      plan.shorts.push({ slug, title, shots });
    }
    writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', 'utf-8');
    return this.getShortsPlan(idOrSlug);
  }

  /** Remove a short from the plan. Also drops its packaging texts from
   *  Project.settings.youtube.shorts so the tab doesn't keep orphan records. */
  async deleteShortPlanEntry(idOrSlug: string, shortSlug: string) {
    const project  = await this.findProject(idOrSlug);
    const planPath = shortsPlanPath(project.slug);
    const plan     = this.readShortsPlanFile(planPath);
    if (!plan || !(plan.shorts ?? []).some((s) => s.slug === shortSlug)) {
      throw new NotFoundException(`short "${shortSlug}" is not in the plan`);
    }
    plan.shorts = (plan.shorts ?? []).filter((s) => s.slug !== shortSlug);
    writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', 'utf-8');

    const settings = (project.settings ?? {}) as Record<string, unknown> & {
      youtube?: { shorts?: Record<string, unknown> };
    };
    if (settings.youtube?.shorts && shortSlug in settings.youtube.shorts) {
      delete settings.youtube.shorts[shortSlug];
      await this.prisma.project.update({
        where: { id: project.id },
        data:  { settings: settings as object },
      });
    }
    return this.getShortsPlan(idOrSlug);
  }

  /**
   * Build the project's YouTube Shorts — vertical 9:16 CapCut drafts, one per
   * short — from a hand-picked subset of already-rendered shots. Spawns
   * scripts/export_shorts.py, which resolves media from the DB and drives the
   * same export_capcut.py machinery as the full film (with a blurred canvas
   * fill so a 16:9 clip sits centered in the 9:16 frame).
   *
   * Plan source: the request body when it carries `shorts` (the future LLM
   * curator posts one), otherwise the versioned scripts/<slug>_shorts_plan.json.
   */
  async exportShorts(
    idOrSlug: string,
    body?: {
      shorts?: Array<{ slug: string; title?: string; shots: string[] }>;
      /** Build ONLY this short (per-short export from the UI). Applies to the
       *  versioned plan file; ignored when an explicit `shorts` array is sent. */
      only?: string;
      fill?: string;
      background_fill?: string;
      width?: number;
      height?: number;
      fps?: number;
    },
  ): Promise<{
    shorts: Array<{ slug?: string; title?: string; draft_name: string; draft_path?: string; shots: number; seconds: number }>;
  }> {
    const project = await this.findProject(idOrSlug);
    if (!existsSync(SHORTS_SCRIPT)) {
      throw new BadRequestException(`export_shorts.py missing: ${SHORTS_SCRIPT}`);
    }

    // Resolve the plan file to feed the script: POSTed body wins, else the
    // versioned per-project plan.
    let planPath: string;
    if (body && Array.isArray(body.shorts) && body.shorts.length > 0) {
      const plan = {
        project:         project.slug,
        // "cover" = enlarge each clip to fill the 9:16 frame (crop sides).
        fill:            body.fill ?? 'cover',
        background_fill: body.background_fill ?? '',
        width:           body.width  ?? 1080,
        height:          body.height ?? 1920,
        fps:             body.fps    ?? 30,
        shorts:          body.shorts,
      };
      const dir = path.join(APP_ROOT, 'data', project.slug, 'exports');
      mkdirSync(dir, { recursive: true });
      planPath = path.join(dir, 'shorts_plan_request.json');
      writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf-8');
    } else {
      planPath = shortsPlanPath(project.slug);
      if (!existsSync(planPath)) {
        throw new BadRequestException(
          `No shorts plan for ${project.slug}. Create scripts/${project.slug}_shorts_plan.json `
          + `(which shots go into each short) or POST a plan body.`,
        );
      }
    }

    // The script writes its result json to --out so we don't parse stdout.
    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports');
    mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'shorts_result.json');

    // Per-short export: --only filters the plan to one short (only meaningful
    // when we didn't already narrow it to a single POSTed short above).
    const onlyArgs = (body?.only && !(body.shorts && body.shorts.length))
      ? ['--only', body.only] : [];

    this.logger.log(
      `Spawning shorts exporter for ${project.slug} (plan ${path.basename(planPath)}`
      + `${body?.only ? `, only=${body.only}` : ''})`,
    );
    const { code, stderr } = await runPython(SHORTS_PYTHON, [
      '-X', 'utf8', SHORTS_SCRIPT, '--plan', planPath, '--out', outPath, ...onlyArgs,
    ]);
    if (code !== 0) {
      throw new BadRequestException(`export_shorts.py exited ${code}: ${stderr.trim().slice(-800)}`);
    }
    if (!existsSync(outPath)) {
      throw new BadRequestException(`shorts exporter finished but wrote no result at ${outPath}`);
    }
    const result = JSON.parse(readFileSync(outPath, 'utf-8')) as {
      shorts?: Array<{ slug?: string; title?: string; draft_name: string; draft_path?: string; shots: number; seconds: number }>;
    };
    this.logger.log(`shorts export for ${project.slug}: ${result.shorts?.length ?? 0} draft(s)`);
    return { shorts: result.shorts ?? [] };
  }

  /**
   * Kick off the CINEMATIC-COMIC CapCut build ASYNCHRONOUSLY: the whole film laid
   * out as comic spreads (2×2 panels/page) with a camera fly-through and a
   * pseudo-3D page turn between spreads. Builds the manifest synchronously (fast),
   * then spawns the SLOW draft render DETACHED and returns immediately with the
   * draft name + total spreads. The UI polls comicStatus() until the draft is
   * written. Returns fast so no HTTP timeout can drop the request.
   *
   * NOTE: build with CapCut CLOSED — an open CapCut rewrites its root_meta on exit
   * and drops a freshly-written draft. The UI warns about this.
   */
  async exportComic(idOrSlug: string): Promise<{
    draft_name: string; spreads: number; status: 'building';
  }> {
    const project = await this.findProject(idOrSlug);
    if (!existsSync(COMIC_MANIFEST_SCRIPT)) {
      throw new BadRequestException(`comic_manifest.py missing: ${COMIC_MANIFEST_SCRIPT}`);
    }
    if (!existsSync(COMIC_EXPORT_SCRIPT)) {
      throw new BadRequestException(`export_comic.py missing: ${COMIC_EXPORT_SCRIPT}`);
    }
    if (!existsSync(PYTHON_BIN)) {
      throw new BadRequestException(`python bin missing: ${PYTHON_BIN} (set EXPORT_PYTHON env)`);
    }
    if (this.buildingComic.has(project.slug)) {
      throw new BadRequestException(
        `Комикс для «${project.slug}» уже собирается — дождитесь завершения (не запускайте повторно).`);
    }
    // Template-layout plan gate: a broken plan dies HERE as a 400 with the full
    // issue list, not inside the detached python build. Legacy projects (no
    // plan) pass through with zero checks.
    await this.comicPlan.assertReady(project.id);

    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic');
    mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, 'comic_manifest.json');

    // 1) manifest — system python (reads the DB via psycopg2). Fast.
    this.logger.log(`Comic export: building manifest for ${project.slug}`);
    const m = await runPython(COMIC_MANIFEST_PYTHON, [
      '-X', 'utf8', COMIC_MANIFEST_SCRIPT, '--slug', project.slug, '--pack', '--out', manifestPath,
    ]);
    if (m.code !== 0) {
      throw new BadRequestException(`comic_manifest.py exited ${m.code}: ${m.stderr.trim().slice(-800)}`);
    }
    if (!existsSync(manifestPath)) {
      throw new BadRequestException(`comic_manifest wrote no manifest at ${manifestPath}`);
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      draft_name?: string; capcut_drafts_root?: string; pages?: unknown[];
    };
    const draftName = manifest.draft_name ?? '';
    const spreads = (manifest.pages ?? []).length;

    // 2) draft — kohya python (pyJianYingDraft). SLOW (renders hi-res sheets + turn
    //    images + extracts stills), so run DETACHED and let the UI poll. Its output
    //    goes to a log file; the running flag clears on exit.
    this.buildingComic.add(project.slug);
    const logPath = path.join(outDir, 'comic_build.log');
    // A real file descriptor, not a WriteStream: createWriteStream opens the file
    // asynchronously, so its `fd` is still null in this tick and spawn rejects it
    // outright ("The argument 'stdio' is invalid"). openSync gives the child
    // something it can inherit immediately.
    const logFd = openSync(logPath, 'w');
    this.logger.log(`Comic export: spawning detached draft build for ${project.slug} (${draftName})`);
    // -u (unbuffered): writing to a file rather than a terminal, python would
    // otherwise hold its output in a buffer for the whole build, leaving this log
    // empty exactly while it is being polled for progress.
    const proc = spawn(PYTHON_BIN, ['-u', '-X', 'utf8', COMIC_EXPORT_SCRIPT, '--manifest', manifestPath], {
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      // Genuinely detached: its own process group, so a backend restart during a
      // build (which can take many minutes) doesn't take the build down with it.
      // Without this the process was only `unref()`-ed, which merely stops it from
      // holding the event loop open — it does not survive the parent.
      detached: true,
    });
    const clear = (code: number | null) => {
      this.buildingComic.delete(project.slug);
      this.logger.log(`Comic build for ${project.slug} finished (exit ${code ?? 'err'})`);
      // The child holds its own duplicate of the descriptor; release ours.
      try { closeSync(logFd); } catch { /* already closed */ }
    };
    proc.on('exit', clear);
    proc.on('error', () => clear(1));
    proc.unref();

    return { draft_name: draftName, spreads, status: 'building' };
  }

  /**
   * TEMPORARY (user 2026-08-01): render ONE spread of the comic as a PNG — the
   * fully baked look (stills + frames + desk props + page stacks) — so the desk
   * styling can be iterated in seconds. Synchronous: a fresh 1-spread manifest
   * (fast) + one sheet render at supersample 2 (tens of seconds at worst).
   * Returns the PNG's absolute path; the UI fetches it via GET
   * comic/test-spread/png. Delete together with comic_test_spread.py.
   */
  async comicTestSpread(idOrSlug: string): Promise<{ png: string; spread: number }> {
    const project = await this.findProject(idOrSlug);
    for (const s of [COMIC_MANIFEST_SCRIPT, COMIC_TEST_SPREAD_SCRIPT]) {
      if (!existsSync(s)) throw new BadRequestException(`script missing: ${s}`);
    }
    if (!existsSync(PYTHON_BIN)) {
      throw new BadRequestException(`python bin missing: ${PYTHON_BIN} (set EXPORT_PYTHON env)`);
    }

    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic');
    mkdirSync(outDir, { recursive: true });
    // own manifest file — comic_manifest.json belongs to the real exports and
    // the chunk status endpoint reads it, so the 1-spread test must not clobber it
    const manifestPath = path.join(outDir, 'comic_test_manifest.json');

    this.logger.log(`Comic test spread: building 1-spread manifest for ${project.slug}`);
    const m = await runPython(COMIC_MANIFEST_PYTHON, [
      '-X', 'utf8', COMIC_MANIFEST_SCRIPT, '--slug', project.slug,
      '--pack', '--max-spreads', '1', '--out', manifestPath,
    ]);
    if (m.code !== 0) {
      throw new BadRequestException(`comic_manifest.py exited ${m.code}: ${m.stderr.trim().slice(-800)}`);
    }

    const png = path.join(outDir, 'comic_test_spread.png');
    this.logger.log(`Comic test spread: rendering for ${project.slug}`);
    const r = await runPython(PYTHON_BIN, [
      '-X', 'utf8', COMIC_TEST_SPREAD_SCRIPT,
      '--manifest', manifestPath, '--out', png, '--supersample', '2',
    ]);
    if (r.code !== 0) {
      throw new BadRequestException(`comic_test_spread.py exited ${r.code}: ${r.stderr.trim().slice(-800)}`);
    }
    if (!existsSync(png)) {
      throw new BadRequestException('comic_test_spread.py wrote no PNG');
    }
    return { png, spread: 0 };
  }

  /** Absolute path of the last test-spread PNG, or null. (TEMPORARY, see above.) */
  async comicTestSpreadPng(idOrSlug: string): Promise<string | null> {
    const project = await this.findProject(idOrSlug);
    const png = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic', 'comic_test_spread.png');
    return existsSync(png) ? png : null;
  }

  /** Desk-prop sprite (scripts/desk_props/<item>.png) for the settings-page
   *  previews. Item keys are validated against the on-disk registry — the same
   *  files comic_desk_props.py composites, so what the picker shows is exactly
   *  what lands on the desk. */
  deskPropSprite(item: string): string {
    if (!/^[a-z_]{1,32}$/.test(item)) {
      throw new BadRequestException(`bad item key: ${item}`);
    }
    const p = path.join(APP_ROOT, 'scripts', 'desk_props', `${item}.png`);
    if (!existsSync(p)) throw new NotFoundException(`no sprite for "${item}"`);
    return p;
  }

  // ── Chunked comic export ───────────────────────────────────────────────────

  /**
   * Start the CHUNKED comic build: slice the film into several small drafts and
   * render them all, detached. Returns the plan immediately so the UI can show the
   * chunk list (and, later, one file field per chunk).
   *
   * Deliberately does NOT reuse exportComic's body: the single-draft export is a
   * finished path and this must not be able to change its behaviour.
   */
  async exportComicChunks(idOrSlug: string, perChunk = COMIC_SPREADS_PER_CHUNK): Promise<{
    chunks: ComicChunk[]; status: 'building';
  }> {
    const project = await this.findProject(idOrSlug);
    for (const s of [COMIC_MANIFEST_SCRIPT, COMIC_CHUNKS_SCRIPT, COMIC_CHUNKS_BUILD_SCRIPT]) {
      if (!existsSync(s)) throw new BadRequestException(`script missing: ${s}`);
    }
    if (!existsSync(PYTHON_BIN)) {
      throw new BadRequestException(`python bin missing: ${PYTHON_BIN} (set EXPORT_PYTHON env)`);
    }
    if (this.buildingComic.has(project.slug)) {
      throw new BadRequestException(
        `Комикс для «${project.slug}» уже собирается — дождитесь завершения.`);
    }
    // Same template-plan gate as the single-draft export (no-op for legacy).
    await this.comicPlan.assertReady(project.id);

    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic');
    mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, 'comic_manifest.json');

    // 1) full manifest — system python (reads the DB via psycopg2). Fast.
    this.logger.log(`Comic chunks: building manifest for ${project.slug}`);
    const m = await runPython(COMIC_MANIFEST_PYTHON, [
      '-X', 'utf8', COMIC_MANIFEST_SCRIPT, '--slug', project.slug, '--pack', '--out', manifestPath,
    ]);
    if (m.code !== 0) {
      throw new BadRequestException(`comic_manifest.py exited ${m.code}: ${m.stderr.trim().slice(-800)}`);
    }

    // 2) slice it — pure data, also system python (no pyJianYingDraft needed).
    const s = await runPython(COMIC_MANIFEST_PYTHON, [
      '-X', 'utf8', COMIC_CHUNKS_SCRIPT, '--manifest', manifestPath,
      '--out-dir', outDir, '--per-chunk', String(perChunk),
    ]);
    if (s.code !== 0) {
      throw new BadRequestException(`comic_chunks.py exited ${s.code}: ${s.stderr.trim().slice(-800)}`);
    }
    const plan = this.readChunkPlan(project.slug);
    if (!plan) throw new BadRequestException('comic_chunks.py wrote no plan');

    // 3) render every chunk draft — kohya python, DETACHED (slow: hi-res sheets).
    this.buildingComic.add(project.slug);
    const logFd = openSync(path.join(outDir, 'comic_build.log'), 'w');
    this.logger.log(`Comic chunks: spawning build of ${plan.chunks.length} draft(s) for ${project.slug}`);
    const proc = spawn(PYTHON_BIN, [
      '-u', '-X', 'utf8', COMIC_CHUNKS_BUILD_SCRIPT,
      '--plan', path.join(outDir, 'comic_chunks_plan.json'),
    ], {
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      detached: true,
    });
    const clear = (code: number | null) => {
      this.buildingComic.delete(project.slug);
      this.logger.log(`Comic chunks build for ${project.slug} finished (exit ${code ?? 'err'})`);
      try { closeSync(logFd); } catch { /* already closed */ }
    };
    proc.on('exit', clear);
    proc.on('error', () => clear(1));
    proc.unref();

    return { chunks: plan.chunks, status: 'building' };
  }

  /** The chunk plan as written by comic_chunks.py, or null when none exists yet. */
  private readChunkPlan(slug: string): ComicChunkPlan | null {
    const p = path.join(APP_ROOT, 'data', slug, 'exports', 'comic', 'comic_chunks_plan.json');
    if (!existsSync(p)) return null;
    try {
      return JSON.parse(readFileSync(p, 'utf-8')) as ComicChunkPlan;
    } catch {
      return null;
    }
  }

  /**
   * Progress of the chunked build: the plan plus, per chunk, whether its draft has
   * been written. That is what drives the file-path form — a chunk is only worth
   * exporting once its draft exists.
   */
  async comicChunksStatus(idOrSlug: string): Promise<{
    chunks: (ComicChunk & { drafted: boolean })[];
    building: boolean; done: boolean; drafted: number; total: number;
  }> {
    const project = await this.findProject(idOrSlug);
    const plan = this.readChunkPlan(project.slug);
    if (!plan) {
      return { chunks: [], building: false, done: false, drafted: 0, total: 0 };
    }
    const manifestPath = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic', 'comic_manifest.json');
    let root = '';
    if (existsSync(manifestPath)) {
      const mf = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { capcut_drafts_root?: string };
      root = mf.capcut_drafts_root ?? '';
    }
    const chunks = plan.chunks.map((c) => ({
      ...c,
      drafted: !!root && existsSync(path.join(root, c.draft_name, 'draft_content.json')),
    }));
    const drafted = chunks.filter((c) => c.drafted).length;
    return {
      chunks, drafted, total: chunks.length,
      building: this.buildingComic.has(project.slug),
      done: chunks.length > 0 && drafted === chunks.length,
    };
  }

  /**
   * Build the FINAL draft from the mp4s the user rendered out of each chunk.
   * Synchronous — it only reads durations and writes JSON, no image rendering.
   */
  async assembleComicChunks(idOrSlug: string, files: { part: number; path: string }[]): Promise<{
    draft_name: string; draft_path: string;
  }> {
    const project = await this.findProject(idOrSlug);
    if (!existsSync(COMIC_ASSEMBLE_SCRIPT)) {
      throw new BadRequestException(`script missing: ${COMIC_ASSEMBLE_SCRIPT}`);
    }
    const plan = this.readChunkPlan(project.slug);
    if (!plan) throw new BadRequestException('нет плана чанков — сначала соберите чанки');

    const byPart = new Map(files.map((f) => [Number(f.part), String(f.path ?? '').trim()]));
    const missing = plan.chunks
      .map((c) => c.part)
      .filter((p) => !byPart.get(p));
    if (missing.length) {
      throw new BadRequestException(`не указан mp4 для части: ${missing.join(', ')}`);
    }
    for (const [part, p] of byPart) {
      if (!existsSync(p)) throw new BadRequestException(`часть ${part}: файл не найден — ${p}`);
    }

    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic');
    const draftName = `${plan.base_draft_name}_final`;
    const payload = JSON.stringify(Object.fromEntries(byPart));
    this.logger.log(`Comic assemble: ${project.slug} → ${draftName} (${byPart.size} parts)`);
    const r = await runPython(PYTHON_BIN, [
      '-u', '-X', 'utf8', COMIC_ASSEMBLE_SCRIPT,
      '--manifest', path.join(outDir, 'comic_manifest.json'),
      '--plan', path.join(outDir, 'comic_chunks_plan.json'),
      '--files', payload, '--draft-name', draftName,
    ]);
    if (r.code !== 0) {
      throw new BadRequestException(`comic_assemble.py exited ${r.code}: ${r.stderr.trim().slice(-800)}`);
    }
    const manifestPath = path.join(outDir, 'comic_manifest.json');
    const mf = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { capcut_drafts_root?: string };
    const draftPath = path.join(mf.capcut_drafts_root ?? outDir, draftName);
    if (!existsSync(path.join(draftPath, 'draft_content.json'))) {
      throw new BadRequestException(`assemble finished but no draft at ${draftPath}`);
    }
    return { draft_name: draftName, draft_path: draftPath };
  }

  /**
   * Poll a comic build: is the draft written yet, and how many spreads are done.
   * `done` flips true once export_comic has written draft_content.json into
   * CapCut's folder. `rendered` counts the spread PNGs already produced.
   *
   * `draftName` is OPTIONAL: with none given, the current build is read from the
   * manifest. That lets a page which did not start the build - a reload, another
   * tab, another machine - still show its progress.
   */
  async comicStatus(idOrSlug: string, draftName?: string): Promise<{
    done: boolean; building: boolean; rendered: number; total: number; draftName: string;
    spreads: number; spreadsTotal: number; turns: number; turnsTotal: number;
    phase: 'spreads' | 'turns' | 'draft' | 'done'; percent: number;
  }> {
    const project = await this.findProject(idOrSlug);
    const outDir = path.join(APP_ROOT, 'data', project.slug, 'exports', 'comic');
    const manifestPath = path.join(outDir, 'comic_manifest.json');
    let root = ''; let total = 0; let outRoot = ''; let manifestDraft = '';
    if (existsSync(manifestPath)) {
      const mf = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
        capcut_drafts_root?: string; output_root?: string; draft_name?: string; pages?: unknown[];
      };
      root = mf.capcut_drafts_root ?? '';
      outRoot = mf.output_root ?? '';
      manifestDraft = mf.draft_name ?? '';
      total = (mf.pages ?? []).length;
    }
    const name = draftName?.trim() || manifestDraft;
    const done = !!name && !!root
      && existsSync(path.join(root, name, 'draft_content.json'));

    // Two rendering phases, both visible on disk. A page turn is counted once its
    // LAST image (turn_back) exists, so a boundary in progress is not counted early.
    let spreads = 0;
    let turns = 0;
    let newestPageAt = 0;
    const pagesDir = outRoot && name ? path.join(outRoot, name, 'pages') : '';
    if (pagesDir && existsSync(pagesDir)) {
      for (const f of readdirSync(pagesDir)) {
        const isSpread = /^spread_\d+\.png$/.test(f);
        const isTurn   = /^turn_back_\d+\.png$/.test(f);
        if (!isSpread && !isTurn && !/^turn_(bg|front)_\d+\.png$/.test(f)) continue;
        if (isSpread) spreads++;
        if (isTurn)   turns++;
        const m = statSync(path.join(pagesDir, f)).mtimeMs;
        if (m > newestPageAt) newestPageAt = m;
      }
    }
    // One boundary between consecutive spreads.
    const turnsTotal = Math.max(0, total - 1);
    const unitsDone  = spreads + turns;
    const unitsTotal = total + turnsTotal;

    // The in-memory flag is lost on a backend restart, so fall back to the files:
    // a build that produced a spread in the last few minutes is still going.
    // Without this the UI reports "not building" for a build that plainly is.
    const recentlyActive = !done && unitsDone > 0 && Date.now() - newestPageAt < 5 * 60_000;
    const building = this.buildingComic.has(project.slug) || recentlyActive;

    const phase: 'spreads' | 'turns' | 'draft' | 'done' =
      done                    ? 'done'
      : spreads < total       ? 'spreads'
      : turns   < turnsTotal  ? 'turns'
      :                         'draft';
    const percent = unitsTotal > 0 ? Math.round((unitsDone / unitsTotal) * 100) : 0;

    return {
      done, building, draftName: name,
      // `rendered`/`total` stay spread-scoped for the caller that polls them.
      rendered: spreads, total,
      spreads, spreadsTotal: total, turns, turnsTotal, phase, percent,
    };
  }

}

function runPython(bin: string, argv: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(bin, argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    let stderr = '';
    proc.stderr.on('data', (b: Buffer) => { stderr += b.toString(); });
    proc.on('error', () => resolve({ code: 1, stderr }));
    proc.on('exit',  (code) => resolve({ code: code ?? 1, stderr }));
  });
}
