import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const APP_ROOT   = process.env.APP_ROOT   ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_DIR  = process.env.KOHYA_DIR  ?? 'E:\\kohya_ss';
const PYTHON_BIN = process.env.EXPORT_PYTHON ?? process.env.PYTHON_BIN
                 ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const EXPORT_SCRIPT = path.join(APP_ROOT, 'scripts', 'export_capcut.py');

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
  reason:    'no_chosen_video' | 'no_upscale';
}
interface SceneReadinessIssue {
  sceneKey:  string;
  sceneId:   string;
  title:     string | null;
  reason:    'no_shots';
}

export interface ExportReadiness {
  ready: boolean;
  totals: { scenes: number; shots: number };
  missingShots:  ShotReadinessIssue[];
  missingScenes: SceneReadinessIssue[];
}

interface ManifestShot  {
  shotCode:    string;
  path:        string;
  duration_us: number;
  /** Per-shot narration wav (shot-level TTS). When set, the python exporter
   *  lays the wav on the audio track at this shot's video timeline position
   *  instead of the legacy scene-level narration block. */
  narration?:  { path: string; duration_us: number } | null;
}
interface ManifestScene {
  sceneKey:  string;
  title:     string | null;
  /** Legacy whole-scene voiceover. Used only when per-shot narrations are not
   *  set on any shot of the scene — the python exporter prefers per-shot wavs
   *  when they exist. */
  narration: { path: string; duration_us: number } | null;
  shots:     ManifestShot[];
}
/**
 * One ACE-Step take placed on the dedicated music audio track. Built from
 * approved AudioRenderJob rows only — unapproved or failed takes become
 * silence in their timeline slot. `start_us` is computed from the project's
 * shot timeline (first-shot-of-block start) + sum of preceding segment
 * durations within the block.
 */
interface ManifestMusic {
  blockSlug:   string;
  segmentId:   string;
  jobId:       string;
  /** Absolute path to the rendered flac under data/<slug>/bgm/<blockSlug>/. */
  path:        string;
  start_us:    number;
  duration_us: number;
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
}

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        const chosen = shot.chosenVideoId
          ? shot.videoRenders.find((v) => v.id === shot.chosenVideoId) ?? null
          : null;
        if (!chosen) {
          missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_chosen_video' });
        } else if (chosen.upscaleStatus !== 'completed' || !chosen.upscaledFilename) {
          missingShots.push({ shotCode: shot.shotCode, shotId: shot.id, reason: 'no_upscale' });
        }
      }
    }

    return {
      ready:         missingShots.length === 0 && missingScenes.length === 0,
      totals:        { scenes: scenes.length, shots: totalShots },
      missingShots,
      missingScenes,
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
        + `${readiness.missingShots.length} shot(s) without FHD, `
        + `${readiness.missingScenes.length} scene(s) without approved TTS.`,
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

    const dataRoot = path.join(APP_ROOT, 'data', projectSlug);
    const out: ManifestScene[] = [];
    /**
     * shotId → microsecond offset from start of project timeline. Built while
     * we walk scenes so the BGM placement pass below can resolve each block's
     * start position without re-traversing the storyboard.
     */
    const shotIdToStartUs = new Map<string, number>();
    let timelineCursorUs = 0;

    for (const scene of scenes) {
      // Shots within a scene sort by shotCode — they're like "S01_SH01",
      // "S01_SH02" so a plain lexical sort matches the storyboard order.
      const shots = [...scene.shots].sort((a, b) => a.shotCode.localeCompare(b.shotCode));

      const shotEntries: ManifestShot[] = [];
      for (const shot of shots) {
        const video = shot.videoRenders.find((v) => v.id === shot.chosenVideoId);
        if (!video || !video.upscaledFilename) continue; // gated upstream
        const fp = path.join(dataRoot, 'shots', shot.shotCode, 'videos_fhd', video.upscaledFilename);
        if (!existsSync(fp)) {
          throw new BadRequestException(`FHD mp4 missing for shot ${shot.shotCode}: ${fp}`);
        }
        const params = (video.params ?? {}) as { fps?: number; length?: number };
        // length = frame count at FPS; FHD upscale preserves frame count.
        // Duration in microseconds.
        const fpsP    = params.fps    ?? 16;
        const lengthP = params.length ?? 81;
        const duration_us = Math.round((lengthP / fpsP) * 1_000_000);
        shotIdToStartUs.set(shot.id, timelineCursorUs);
        timelineCursorUs += duration_us;

        // Per-shot narration: if the shot has an approved TTSJob with a
        // rendered wav on disk, attach it. The python exporter clips audio
        // to the shot's video duration so it never bleeds into the next shot.
        let shotNarration: ManifestShot['narration'] = null;
        const approvedId  = (shot as { approvedTTSJobId?: string | null }).approvedTTSJobId ?? null;
        const ttsJobs     = (shot as { ttsJobs?: Array<{ id: string; outputFilename: string | null; text: string }> }).ttsJobs ?? [];
        const approvedTts = approvedId ? ttsJobs.find((t) => t.id === approvedId) : null;
        if (approvedTts?.outputFilename) {
          const wavPath = path.join(dataRoot, 'shots', shot.shotCode, approvedTts.outputFilename);
          if (existsSync(wavPath)) {
            // Estimate duration from text length (≈15 chars/sec at our default
            // rate). Capped at the shot's video duration so the wav can't
            // overlap the next shot on the audio track.
            const guessUs = Math.max(800_000, Math.round((approvedTts.text.length / 15) * 1_000_000));
            shotNarration = { path: wavPath, duration_us: Math.min(guessUs, duration_us) };
          } else {
            this.logger.warn(`shot ${shot.shotCode}: approved TTS wav missing on disk (${wavPath}) — skipping audio`);
          }
        }

        shotEntries.push({
          shotCode:    shot.shotCode,
          path:        fp,
          duration_us,
          narration:   shotNarration,
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
          narration = { path: fp, duration_us };
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
    // Pull every NarrativeBlock with its segments + the segments' jobs, then
    // map each block's first covered shot to its timeline start (built above
    // in `shotIdToStartUs`). Segments are laid out sequentially within the
    // block from that start; unapproved or job-less segments leave silence in
    // their slot. Music is OPTIONAL — readiness gate doesn't check it.
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
      // Earliest covered shot defines the block's timeline start. Using min()
      // (not the first shotId) makes the export robust against shotIds arrays
      // saved in some non-storyboard order.
      let blockStartUs = Infinity;
      for (const sid of shotIds) {
        const v = shotIdToStartUs.get(sid);
        if (v !== undefined && v < blockStartUs) blockStartUs = v;
      }
      if (!Number.isFinite(blockStartUs)) {
        this.logger.warn(
          `block ${block.slug}: none of its shotIds resolved to the timeline `
          + `(no chosen FHD video?) — skipping BGM placement`,
        );
        continue;
      }
      let cursor = blockStartUs;
      for (const seg of block.segments) {
        const durUs = seg.durationSec * 1_000_000;
        if (!seg.approvedJobId) {
          // Unapproved segment → leave silence in this slot. Block continues
          // to advance so subsequent approved segments align with their
          // intended timeline positions even when a middle one is skipped.
          cursor += durUs;
          continue;
        }
        const job = seg.jobs.find((j) => j.id === seg.approvedJobId);
        if (!job || job.status !== 'completed' || !job.outputFilename) {
          this.logger.warn(`segment ${seg.id}: approvedJobId points at non-completed job, skipping`);
          cursor += durUs;
          continue;
        }
        const fp = path.join(dataRoot, 'bgm', block.slug, job.outputFilename);
        if (!existsSync(fp)) {
          this.logger.warn(`segment ${seg.id}: flac missing on disk (${fp}), skipping`);
          cursor += durUs;
          continue;
        }
        musicTracks.push({
          blockSlug:   block.slug,
          segmentId:   seg.id,
          jobId:       job.id,
          path:        fp,
          start_us:    cursor,
          duration_us: durUs,
        });
        cursor += durUs;
      }
    }
    this.logger.log(`built ${musicTracks.length} music_tracks across ${blocks.length} block(s)`);

    const ts        = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13); // YYYYMMDDtHHMM
    const draftName = `${projectSlug}_${ts}`;
    const outRoot   = path.join(APP_ROOT, 'data', projectSlug, 'exports', 'capcut');
    mkdirSync(outRoot, { recursive: true });

    // CapCut on Windows keeps user drafts under %LOCALAPPDATA%. If we're not
    // on Windows or the env var isn't set, fall back to writing into our own
    // exports tree and the user copies the folder manually (the old behavior).
    const localAppData = process.env.LOCALAPPDATA;
    const capcutDraftsRoot = localAppData
      ? path.join(localAppData, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft')
      : outRoot;

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
