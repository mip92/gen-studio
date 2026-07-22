import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { probeWavDurationMs } from './wav-duration';

const APP_ROOT      = process.env.APP_ROOT      ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_DIR     = process.env.KOHYA_DIR     ?? 'E:\\kohya_ss';
// Reuse the kohya venv — already has torch + soundfile (for Silero) and the
// CUDA build needed for the voice-clone engines (XTTS-v2, F5). Override with
// TTS_PYTHON if a different env is preferred.
const PYTHON_BIN    = process.env.TTS_PYTHON    ?? process.env.PYTHON_BIN
                    ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const TTS_SCRIPT       = path.join(APP_ROOT, 'scripts', 'tts_silero.py');
const TTS_XTTS2_SCRIPT = path.join(APP_ROOT, 'scripts', 'tts_xtts2.py');
const TTS_F5_SCRIPT    = path.join(APP_ROOT, 'scripts', 'tts_f5.py');
const TTS_QWEN3_SCRIPT = path.join(APP_ROOT, 'scripts', 'tts_qwen3.py');
// Qwen3-TTS needs python 3.12 + a Blackwell-era torch (cu128) — newer than the
// kohya venv the other engines share — so it gets its own venv. Override with
// TTS_QWEN3_PYTHON if a different env is preferred.
const QWEN3_PYTHON_BIN = process.env.TTS_QWEN3_PYTHON
                       ?? path.join(APP_ROOT, '.venv-qwen3', 'Scripts', 'python.exe');
const SILERO_CACHE  = process.env.SILERO_CACHE_DIR
                    ?? path.join(APP_ROOT, '.silero_cache');
// Leading reference-bleed ("понь") trimmer — detects + cuts the artifact, keeps
// a reversible backup. Shares the ffmpeg binary that the F5 worker already ships.
const FFMPEG_BIN           = process.env.FFMPEG_BIN ?? path.join(APP_ROOT, 'bin', 'ffmpeg.exe');
const TRIM_ARTIFACT_SCRIPT = path.join(APP_ROOT, 'scripts', 'trim_lead_artifact.py');
/** data/<slug>/_pon_backup/{shots|scenes}/<code>/<filename> — pristine pre-trim
 *  original. Presence of this file is the "trimmed, can revert" flag. */
function artifactBackupPath(slug: string, kind: 'shots' | 'scenes', code: string, filename: string): string {
  return path.join(APP_ROOT, 'data', slug, '_pon_backup', kind, code, filename);
}

/** Engines the service knows how to dispatch. Source of truth is the
 *  Python worker scripts; this constant exists to validate the
 *  Project.ttsEngine column and the per-job engine snapshot. */
export const TTS_ENGINES = ['silero', 'xtts2', 'f5', 'qwen3'] as const;
export type TTSEngine = (typeof TTS_ENGINES)[number];

/** Emotion labels accepted on the per-job API. IMPORTANT: both voice-clone
 *  engines (xtts2, f5) IGNORE the categorical preset/intensity at inference —
 *  tone comes only from the speaker reference clip. So `emotionPreset` /
 *  `emotionIntensity` are inert traceability metadata; the only knob that
 *  actually changes tone is `emotionRefName`, which swaps the speaker_wav for
 *  one render. Kept as a validated allow-list in case a future engine honours
 *  categorical emotion. */
export const XTTS2_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'fear', 'disgust', 'surprise', 'calm',
] as const;
export type XTTS2Emotion = (typeof XTTS2_EMOTIONS)[number];

/** Resolve the engine for a project. Null/unknown → 'silero' (legacy default
 *  so existing projects keep working without a migration touch). */
function projectEngine(project: { ttsEngine?: string | null }): TTSEngine {
  const e = project.ttsEngine ?? 'silero';
  return (TTS_ENGINES as readonly string[]).includes(e) ? (e as TTSEngine) : 'silero';
}

/** Voices baked into V5 .pt files (V5, V5_4, V5_5 all share this set). */
const VOICES_V5 = ['aidar', 'baya', 'kseniya', 'xenia', 'eugene', 'random'] as const;
/** V3 and V4 add `ruslan`. `random` is also present and generates a new voice each call. */
const VOICES_V3_V4 = [...VOICES_V5, 'ruslan'] as const;
/** Union — accepted at validation time. The Python worker errors out if the
 *  specific model file doesn't actually contain the requested speaker. */
const ALLOWED_VOICES = [...new Set([...VOICES_V5, ...VOICES_V3_V4])] as const;
const ALLOWED_SAMPLE_RATES = [8000, 24000, 48000] as const;
type Voice      = (typeof ALLOWED_VOICES)[number];
type SampleRate = (typeof ALLOWED_SAMPLE_RATES)[number];

const DEFAULT_VOICE: Voice           = 'eugene';
const DEFAULT_SAMPLE_RATE: SampleRate = 48000;
const DEFAULT_RATE                    = 0.85;
const MIN_RATE                        = 0.5;
const MAX_RATE                        = 2.0;
/** Extra silence after each sentence — capped at 30s to keep ridiculous values out. */
const MIN_SENTENCE_PAUSE = 0;
const MAX_SENTENCE_PAUSE = 30;

// Default narration speed is a slowed 0.85 for ALL engines (user request
// 2026-06-18 — "для всех проектов по умолчанию 0.85"). F5-TTS Russian also
// runs sentences together, so f5 additionally gets a 1s pause between
// sentences. These are only DEFAULTS — an explicit per-render
// rate/sentencePauseSec still wins.
const F5_DEFAULT_RATE           = 0.85;
const F5_DEFAULT_SENTENCE_PAUSE = 1.0;

/** Default playback rate when the caller didn't specify one — engine-aware.
 *  qwen3 has no speed knob (the worker ignores rate), so snapshot an honest
 *  1.0 instead of a misleading 0.85 in the job row / UI history. */
function defaultRateFor(engine: TTSEngine): number {
  if (engine === 'qwen3') return 1.0;
  return engine === 'f5' ? F5_DEFAULT_RATE : DEFAULT_RATE;
}
/** Default sentence pause (seconds) when not specified — engine-aware.
 *  qwen3 shares f5's 1s default: with pause=0 it synthesises the whole shot in
 *  one pass and runs sentences together (user feedback 2026-07-16 «одним
 *  забором»); chunked synthesis also resets prosody per sentence. */
function defaultSentencePauseFor(engine: TTSEngine): number {
  return engine === 'f5' || engine === 'qwen3' ? F5_DEFAULT_SENTENCE_PAUSE : 0;
}

export interface StartTTSInput {
  sceneId:      string;
  /** If omitted, scene.narrationText is used. */
  text?:        string;
  voice?:       Voice;
  sampleRate?:  SampleRate;
  /** Playback rate. 1.0 = normal, 0.8 = 20% slower, 1.2 = 20% faster. Range [0.5, 2.0]. */
  rate?:        number;
  /** Basename of the .pt file in .silero_cache/ to use. Omit to auto-pick by
   *  MODEL_FILENAMES precedence. Example: "v3_1_ru.pt" to unlock ruslan/random. */
  modelFilename?: string;
  /** Extra silence (seconds) inserted after every sentence boundary. 0 = off. */
  sentencePauseSec?: number;
  /** Voice-clone (xtts2/f5) only: categorical emotion. Inert metadata today —
   *  see XTTS2_EMOTIONS. Ignored when engine = silero. */
  emotionPreset?:    XTTS2Emotion;
  /** Voice-clone (xtts2/f5) only: strength [0.0, 1.0]. Inert today. Default 0.5. */
  emotionIntensity?: number;
  /** Voice-clone (xtts2/f5) only: name of a project-level emotion ref. This is
   *  the knob that actually changes tone (swaps the speaker clip). */
  emotionRefName?:   string;
}

export interface StartShotTTSInput {
  shotId:       string;
  /** If omitted, shot.narrationText is used. */
  text?:        string;
  voice?:       Voice;
  sampleRate?:  SampleRate;
  rate?:        number;
  modelFilename?: string;
  sentencePauseSec?: number;
  emotionPreset?:    XTTS2Emotion;
  emotionIntensity?: number;
  emotionRefName?:   string;
  /** Jump to the FRONT of the TTS queue instead of the back. Default false =
   *  natural FIFO (end of queue). */
  front?:            boolean;
}

/** Static map of which voices each known Silero version supports. The Python
 *  worker is the source of truth at runtime — this map exists so the UI can
 *  filter the voice dropdown without spawning python just to ask. */
const MODEL_VOICES: Record<string, readonly string[]> = {
  v5_5_ru: VOICES_V5,
  v5_4_ru: VOICES_V5,
  v5_ru:   VOICES_V5,
  v4_ru:   VOICES_V3_V4,
  v3_1_ru: VOICES_V3_V4,
  v3_ru:   VOICES_V3_V4,
};

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scan .silero_cache/ for .pt model files and return them with their voice
   * lists. UI uses this to populate the model dropdown.
   */
  listModels(): Array<{ filename: string; sizeBytes: number; voices: readonly string[] }> {
    if (!existsSync(SILERO_CACHE)) return [];
    const stem = (f: string) => f.replace(/\.pt$/i, '');
    return readdirSync(SILERO_CACHE)
      .filter((f) => f.toLowerCase().endsWith('.pt'))
      .map((f) => {
        const fp = path.join(SILERO_CACHE, f);
        const s  = (() => { try { return statSync(fp); } catch { return null; } })();
        return {
          filename:  f,
          sizeBytes: s?.size ?? 0,
          // Map by stem; unknown filenames default to the V5 voice set (most modern).
          voices:    MODEL_VOICES[stem(f)] ?? VOICES_V5,
        };
      })
      .sort((a, b) => a.filename.localeCompare(b.filename));
  }

  /**
   * Validate + normalize the engine-agnostic job knobs shared by scene and
   * shot TTS (voice / sample rate / rate / sentence pause / silero model file).
   * Throws BadRequestException on any out-of-range value. Used by both
   * `start()` and `startForShot()` so the two paths can never drift.
   */
  private validateCommonInput(input: {
    voice?:            Voice;
    sampleRate?:       SampleRate;
    rate?:             number;
    sentencePauseSec?: number;
    modelFilename?:    string;
  }, engine: TTSEngine): { voice: Voice; sampleRate: SampleRate; rate: number; sentencePauseSec: number; modelFilename: string | null } {
    const voice      = input.voice      ?? DEFAULT_VOICE;
    const sampleRate = input.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const rate       = input.rate       ?? defaultRateFor(engine);
    if (!ALLOWED_VOICES.includes(voice)) {
      throw new BadRequestException(`voice must be one of: ${ALLOWED_VOICES.join(', ')}`);
    }
    if (!ALLOWED_SAMPLE_RATES.includes(sampleRate)) {
      throw new BadRequestException(`sampleRate must be one of: ${ALLOWED_SAMPLE_RATES.join(', ')}`);
    }
    if (rate < MIN_RATE || rate > MAX_RATE) {
      throw new BadRequestException(`rate must be in [${MIN_RATE}, ${MAX_RATE}]`);
    }
    const sentencePauseSec = input.sentencePauseSec ?? defaultSentencePauseFor(engine);
    if (sentencePauseSec < MIN_SENTENCE_PAUSE || sentencePauseSec > MAX_SENTENCE_PAUSE) {
      throw new BadRequestException(`sentencePauseSec must be in [${MIN_SENTENCE_PAUSE}, ${MAX_SENTENCE_PAUSE}]`);
    }
    // Validate modelFilename exists on disk if supplied. Path traversal guard:
    // reject anything that isn't a bare .pt basename in our cache dir.
    let modelFilename: string | null = null;
    if (input.modelFilename) {
      const cleaned = input.modelFilename.trim();
      if (cleaned !== path.basename(cleaned) || !cleaned.toLowerCase().endsWith('.pt')) {
        throw new BadRequestException(`modelFilename must be a bare .pt basename (got: ${cleaned})`);
      }
      const fp = path.join(SILERO_CACHE, cleaned);
      if (!existsSync(fp)) {
        throw new BadRequestException(`Silero model not found in cache: ${cleaned}`);
      }
      modelFilename = cleaned;
    }
    return { voice, sampleRate, rate, sentencePauseSec, modelFilename };
  }

  /**
   * Resolve engine-specific columns for a new TTSJob row. For 'silero' this
   * is a no-op (returns just `engine: 'silero'`). For the voice-clone engines
   * (xtts2 | f5) it requires a project voice reference, validates the emotion
   * params, and looks up `emotionRefName` against the project's ref library,
   * then returns the snapshot columns.
   *
   * Throws BadRequestException for invalid params / missing voice-ref /
   * unknown emotion ref name.
   */
  private async resolveEngineColumns(
    project: { id: string; ttsEngine?: string | null; ttsVoiceRefPath?: string | null },
    input:  { emotionPreset?: string; emotionIntensity?: number; emotionRefName?: string },
  ): Promise<{
    engine:           TTSEngine;
    emotionPreset:    string | null;
    emotionIntensity: number | null;
    emotionRefName:   string | null;
  }> {
    const engine = projectEngine(project);
    if (engine === 'silero') {
      return { engine, emotionPreset: null, emotionIntensity: null, emotionRefName: null };
    }
    // Voice-clone engines (xtts2 | f5) require a project voice reference.
    if (!project.ttsVoiceRefPath) {
      throw new BadRequestException(
        `Project has ttsEngine='${engine}' but no voice reference uploaded. ` +
        `Upload one via POST /projects/${project.id}/tts/voice-reference first.`,
      );
    }
    const preset = (input.emotionPreset ?? 'neutral').toLowerCase();
    if (!(XTTS2_EMOTIONS as readonly string[]).includes(preset)) {
      throw new BadRequestException(
        `emotionPreset must be one of: ${XTTS2_EMOTIONS.join(', ')} (got: ${preset})`,
      );
    }
    const intensity = input.emotionIntensity ?? 0.5;
    if (intensity < 0 || intensity > 1) {
      throw new BadRequestException(`emotionIntensity must be in [0.0, 1.0] (got: ${intensity})`);
    }
    let emotionRefName: string | null = null;
    if (input.emotionRefName) {
      const refRow = await this.prisma.projectTTSEmotionRef.findUnique({
        where: { projectId_name: { projectId: project.id, name: input.emotionRefName } },
      });
      if (!refRow) {
        throw new BadRequestException(
          `Project has no emotion ref named "${input.emotionRefName}". ` +
          `Upload one via POST /projects/${project.id}/tts/emotion-refs/${input.emotionRefName}.`,
        );
      }
      emotionRefName = input.emotionRefName;
    }
    return { engine, emotionPreset: preset, emotionIntensity: intensity, emotionRefName };
  }

  /** Queue a new TTS job. Returns the created row (status='pending'). */
  async start(input: StartTTSInput) {
    const scene = await this.prisma.scene.findUnique({
      where:   { id: input.sceneId },
      include: { project: true },
    });
    if (!scene) throw new NotFoundException(`Scene ${input.sceneId} not found`);

    const text = (input.text ?? scene.narrationText ?? '').trim();
    if (!text) {
      throw new BadRequestException(
        `Scene ${scene.sceneKey} has no narration text. Pass {text} or set Scene.narrationText first.`,
      );
    }

    const { voice, sampleRate, rate, sentencePauseSec, modelFilename } =
      this.validateCommonInput(input, projectEngine(scene.project));
    const engineCols = await this.resolveEngineColumns(scene.project, input);

    return this.prisma.tTSJob.create({
      data: {
        sceneId: scene.id,
        text,
        voice,
        sampleRate,
        rate,
        sentencePauseSec,
        modelFilename,
        status:  'pending',
        ...engineCols,
      },
    });
  }

  /**
   * Queue a TTS job for a single Shot. Mirrors `start()` for scenes — same
   * voice/sr/rate/model/pause knobs, just owned by a Shot instead. The wav
   * lands at data/<slug>/shots/<shotCode>/ on success.
   */
  async startForShot(input: StartShotTTSInput) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: { project: true, scene: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    const text = (input.text ?? shot.narrationText ?? '').trim();
    if (!text) {
      throw new BadRequestException(
        `Shot ${shot.shotCode} has no narration text. Pass {text} or set Shot.narrationText first.`,
      );
    }

    const { voice, sampleRate, rate, sentencePauseSec, modelFilename } =
      this.validateCommonInput(input, projectEngine(shot.project));
    const engineCols = await this.resolveEngineColumns(shot.project, input);

    // Queue placement. Single-slot queue: one job runs at a time and the
    // running job CANNOT be preempted. So "front of queue" = SECOND position —
    // strictly AFTER the currently-running job, BEFORE every pending job:
    //   queuedAt = running.queuedAt + 1ms   (running < this < all pending)
    // If nothing is running, it becomes the next job (1ms-... before the
    // earliest pending). Default front=false keeps natural FIFO (end).
    let queuedAt: Date | undefined;
    if (input.front) {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ running: Date | null; pending: Date | null }>>(
        `SELECT
           (SELECT MAX(q) FROM (
              SELECT MAX("queuedAt") q FROM tts_jobs           WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM video_renders      WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM scene_render_jobs  WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM dataset_jobs       WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM training_jobs      WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM audio_render_jobs  WHERE status='running'
              UNION ALL SELECT MAX("queuedAt") FROM anchor_render_jobs WHERE status='running'
           ) r) AS running,
           (SELECT MIN(q) FROM (
              SELECT MIN("queuedAt") q FROM tts_jobs           WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM video_renders      WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM scene_render_jobs  WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM dataset_jobs       WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM training_jobs      WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM audio_render_jobs  WHERE status='pending'
              UNION ALL SELECT MIN("queuedAt") FROM anchor_render_jobs WHERE status='pending'
           ) p) AS pending`,
      );
      const running = rows?.[0]?.running ? new Date(rows[0].running as unknown as string) : null;
      const pending = rows?.[0]?.pending ? new Date(rows[0].pending as unknown as string) : null;
      if (running) {
        queuedAt = new Date(running.getTime() + 1);          // right behind the running job (2nd)
      } else if (pending) {
        queuedAt = new Date(pending.getTime() - 1000);       // nothing running → run next
      } else {
        queuedAt = new Date();                               // empty queue
      }
    }

    return this.prisma.tTSJob.create({
      data: {
        shotId:  shot.id,
        text,
        voice,
        sampleRate,
        rate,
        sentencePauseSec,
        modelFilename,
        status:  'pending',
        ...(queuedAt ? { queuedAt } : {}),
        ...engineCols,
      },
    });
  }

  findNextPending() {
    return this.prisma.tTSJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  list(sceneId: string) {
    return this.prisma.tTSJob.findMany({
      where:   { sceneId },
      orderBy: { queuedAt: 'desc' },
    });
  }

  async listForShot(shotId: string) {
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId }, include: { project: true },
    });
    const jobs = await this.prisma.tTSJob.findMany({
      where:   { shotId },
      orderBy: { queuedAt: 'desc' },
    });
    if (!shot) return jobs;
    // Annotate each completed job with whether its leading "понь" artifact has
    // been trimmed (a pre-trim backup exists) — drives the trim/revert button.
    return jobs.map((j) => ({
      ...j,
      trimmedArtifact:
        j.status === 'completed' && !!j.outputFilename &&
        existsSync(artifactBackupPath(shot.project.slug, 'shots', shot.shotCode, j.outputFilename)),
    }));
  }

  async get(jobId: string) {
    const j = await this.prisma.tTSJob.findUnique({ where: { id: jobId } });
    if (!j) throw new NotFoundException(`TTS job ${jobId} not found`);
    return j;
  }

  /**
   * Resolve the absolute path of the rendered .wav. Returns null if the job
   * is not completed OR the file has gone missing on disk (e.g. older row
   * pointing at a shared filename that a later cleanup removed). Caller
   * (StreamableFile) interprets null as "no playable audio yet" → 204.
   */
  async filePath(jobId: string): Promise<string | null> {
    const j = await this.get(jobId);
    if (!j.outputFilename || j.status !== 'completed') return null;
    // Resolve owner — exactly one of sceneId/shotId is set per row.
    if (j.shotId) {
      const shot = await this.prisma.shot.findUnique({
        where:   { id: j.shotId },
        include: { project: true },
      });
      if (!shot) return null;
      const fp = path.join(
        APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, j.outputFilename,
      );
      if (!existsSync(fp)) {
        this.logger.warn(`TTS job ${jobId}: shot wav missing on disk (${fp})`);
        return null;
      }
      return fp;
    }
    if (j.sceneId) {
      const scene = await this.prisma.scene.findUnique({
        where:   { id: j.sceneId },
        include: { project: true },
      });
      if (!scene) return null;
      const fp = path.join(
        APP_ROOT, 'data', scene.project.slug, 'scenes', scene.sceneKey, j.outputFilename,
      );
      if (!existsSync(fp)) {
        this.logger.warn(`TTS job ${jobId}: scene wav missing on disk (${fp})`);
        return null;
      }
      return fp;
    }
    this.logger.error(`TTS job ${jobId}: neither sceneId nor shotId set — corrupt row`);
    return null;
  }

  /**
   * Resolve the on-disk wav + its pre-trim backup path for a completed job.
   * Used by the leading-artifact trim/revert actions. Throws if the job has no
   * completed wav or is a corrupt (ownerless) row.
   */
  private async resolveArtifactPaths(
    jobId: string,
  ): Promise<{ jobId: string; wavPath: string; backupPath: string; isApproved: boolean }> {
    const job = await this.prisma.tTSJob.findUnique({
      where:   { id: jobId },
      include: { shot: { include: { project: true } }, scene: { include: { project: true } } },
    });
    if (!job) throw new NotFoundException(`TTS job ${jobId} not found`);
    if (job.status !== 'completed' || !job.outputFilename) {
      throw new BadRequestException(`TTS job ${jobId} has no completed wav to trim`);
    }
    if (job.shotId && job.shot) {
      const { slug } = job.shot.project;
      return {
        jobId: job.id,
        wavPath:    path.join(APP_ROOT, 'data', slug, 'shots', job.shot.shotCode, job.outputFilename),
        backupPath: artifactBackupPath(slug, 'shots', job.shot.shotCode, job.outputFilename),
        isApproved: job.shot.approvedTTSJobId === job.id,
      };
    }
    if (job.sceneId && job.scene) {
      const { slug } = job.scene.project;
      return {
        jobId: job.id,
        wavPath:    path.join(APP_ROOT, 'data', slug, 'scenes', job.scene.sceneKey, job.outputFilename),
        backupPath: artifactBackupPath(slug, 'scenes', job.scene.sceneKey, job.outputFilename),
        isApproved: job.scene.approvedTTSJobId === job.id,
      };
    }
    throw new BadRequestException(`TTS job ${jobId} has no owner — corrupt row`);
  }

  /** Spawn a short-lived helper and capture its stdout/stderr + exit code. */
  private spawnCapture(
    bin: string, argv: string[],
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const proc = spawn(bin, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      proc.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
      proc.stderr.on('data', (c: Buffer) => { stderr = (stderr + c.toString()).slice(-4000); });
      proc.on('error', () => resolve({ code: 1, stdout, stderr }));
      proc.on('exit',  (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
  }

  /**
   * Trim the leading reference-bleed artifact ("понь") off a completed
   * narration wav. Detects the burst→pause→speech structure and cuts at the
   * pause midpoint; a clean render (no artifact) is left untouched. The pristine
   * original is backed up first so {@link revertArtifact} can restore it.
   */
  async trimArtifact(
    jobId: string,
  ): Promise<{ trimmed: boolean; reason?: string; cutMs?: number; durationMs?: number | null }> {
    const { wavPath, backupPath, isApproved } = await this.resolveArtifactPaths(jobId);
    // Only the approved take may be trimmed — never an unapproved/candidate one.
    if (!isApproved) {
      throw new BadRequestException(`TTS job ${jobId} is not the approved take — approve it before trimming «понь»`);
    }
    if (!existsSync(wavPath))               throw new BadRequestException(`narration wav missing on disk: ${wavPath}`);
    if (!existsSync(PYTHON_BIN))            throw new BadRequestException(`python bin missing: ${PYTHON_BIN}`);
    if (!existsSync(TRIM_ARTIFACT_SCRIPT))  throw new BadRequestException(`trim script missing: ${TRIM_ARTIFACT_SCRIPT}`);

    const { code, stdout, stderr } = await this.spawnCapture(PYTHON_BIN, [
      '-X', 'utf8', TRIM_ARTIFACT_SCRIPT,
      '--in', wavPath, '--backup', backupPath, '--ffmpeg', FFMPEG_BIN,
    ]);
    const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() ?? '';
    if (code !== 0) throw new BadRequestException(stderr.trim() || `trim worker exited ${code}`);

    if (line.startsWith('SKIP')) {
      return { trimmed: false, reason: line.slice(4).trim() || 'no «понь» detected' };
    }
    if (line.startsWith('OK')) {
      const cutMs = Number(/cut_ms=(\d+)/.exec(line)?.[1] ?? NaN);
      const durationMs = probeWavDurationMs(wavPath);
      await this.prisma.tTSJob.update({ where: { id: jobId }, data: { durationMs } });
      this.logger.log(`trim artifact ${jobId}: cut ${cutMs}ms → duration ${durationMs ?? '?'}ms`);
      return { trimmed: true, cutMs: Number.isFinite(cutMs) ? cutMs : undefined, durationMs };
    }
    throw new BadRequestException(stderr.trim() || `unexpected trim output: ${line || '(empty)'}`);
  }

  /** Restore a job's narration wav from its pre-trim backup (undo trimArtifact). */
  async revertArtifact(jobId: string): Promise<{ reverted: boolean; durationMs?: number | null }> {
    const { wavPath, backupPath } = await this.resolveArtifactPaths(jobId);
    if (!existsSync(backupPath)) {
      throw new BadRequestException(`nothing to revert — no pre-trim backup for job ${jobId}`);
    }
    const { code, stdout, stderr } = await this.spawnCapture(PYTHON_BIN, [
      '-X', 'utf8', TRIM_ARTIFACT_SCRIPT,
      '--in', wavPath, '--backup', backupPath, '--revert',
    ]);
    const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() ?? '';
    if (code !== 0 || !line.startsWith('REVERTED')) {
      throw new BadRequestException(stderr.trim() || `revert worker exited ${code}`);
    }
    const durationMs = probeWavDurationMs(wavPath);
    await this.prisma.tTSJob.update({ where: { id: jobId }, data: { durationMs } });
    this.logger.log(`revert artifact ${jobId}: restored → duration ${durationMs ?? '?'}ms`);
    return { reverted: true, durationMs };
  }

  /**
   * Run a pending TTS job. Spawns scripts/tts_silero.py and waits for it to
   * exit. The pipeline tick keeps `status='running'` exclusive so we never
   * have two Python subprocesses fighting over the cache dir at once.
   */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.tTSJob.findUnique({
      where:   { id: jobId },
      include: {
        scene: { include: { project: true } },
        shot:  { include: { project: true } },
      },
    });
    if (!job)                       throw new Error(`TTS job ${jobId} not found`);
    if (job.status !== 'pending')   return;

    // Engine snapshot — null/unknown on legacy rows means 'silero'.
    const engine: TTSEngine = (TTS_ENGINES as readonly string[]).includes(job.engine ?? '')
      ? (job.engine as TTSEngine) : 'silero';
    // qwen3 lives in its own venv; every other engine shares the kohya venv.
    const pythonBin = engine === 'qwen3' ? QWEN3_PYTHON_BIN : PYTHON_BIN;
    if (!existsSync(pythonBin)) {
      await this.fail(job.id, `python bin missing: ${pythonBin} (set ${engine === 'qwen3' ? 'TTS_QWEN3_PYTHON' : 'TTS_PYTHON'} env)`);
      return;
    }
    const script = engine === 'f5'    ? TTS_F5_SCRIPT
                 : engine === 'qwen3' ? TTS_QWEN3_SCRIPT
                 : engine === 'xtts2' ? TTS_XTTS2_SCRIPT
                 :                      TTS_SCRIPT;
    if (!existsSync(script)) {
      await this.fail(job.id, `worker script missing: ${script}`);
      return;
    }

    // Resolve output dir — scene-level jobs write under data/<slug>/scenes/<sceneKey>/,
    // shot-level jobs under data/<slug>/shots/<shotCode>/. The owning project
    // is also captured here for engine-specific lookups below.
    let outDir: string;
    let projectRow: { id: string; slug: string; ttsVoiceRefPath?: string | null } | null = null;
    if (job.shotId && job.shot) {
      outDir = path.join(APP_ROOT, 'data', job.shot.project.slug, 'shots', job.shot.shotCode);
      projectRow = job.shot.project;
    } else if (job.sceneId && job.scene) {
      outDir = path.join(APP_ROOT, 'data', job.scene.project.slug, 'scenes', job.scene.sceneKey);
      projectRow = job.scene.project;
    } else {
      await this.fail(job.id, `TTS job ${job.id} has neither shotId nor sceneId resolved`);
      return;
    }
    mkdirSync(outDir, { recursive: true });

    // Stage the narration text as a tmp file so Windows argv length / encoding
    // limits don't bite us on long scripts (paragraph-level scenes can hit
    // 1-2k chars easily).
    const textPath = path.join(outDir, `.tts_${job.id}.txt`);
    writeFileSync(textPath, job.text, { encoding: 'utf-8' });

    // Output filename is keyed by job id so each row owns a distinct wav on
    // disk. Engine tag in the filename is for easier debugging — silero rows
    // include voice/model, xtts2 rows include 'xtts2' + emotion.
    let outFilename: string;
    if (engine === 'silero') {
      const modelTag = job.modelFilename
        ? '_' + path.basename(job.modelFilename).replace(/\.pt$/i, '')
        : '';
      outFilename = `narration_${job.id}_${job.voice}_${job.sampleRate}${modelTag}.wav`;
    } else {
      // Voice-clone engines (xtts2 | f5): tag by engine + emotion.
      const emoTag = job.emotionRefName ? job.emotionRefName : (job.emotionPreset ?? 'neutral');
      outFilename = `narration_${job.id}_${engine}_${emoTag}_${job.sampleRate}.wav`;
    }
    const outPath = path.join(outDir, outFilename);

    await this.prisma.tTSJob.update({
      where: { id: job.id },
      data:  { status: 'running', startedAt: new Date() },
    });

    // Build argv per engine. Silero stays exactly as it was — XTTS-v2 swaps
    // --voice for --voice-ref (from project.ttsVoiceRefPath) plus optional
    // --emotion-ref (a project-level named clip). Same Python bin + stdout
    // `OK <path>` contract applies.
    const subEnv: NodeJS.ProcessEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    let argv: string[];
    if (engine !== 'silero') {
      // Voice-clone path shared by xtts2 + f5 — same argv, only the worker
      // script differs (resolved above). f5 accepts and ignores the emotion
      // preset/intensity flags, and honours --emotion-ref as a speaker swap.
      if (!projectRow?.ttsVoiceRefPath) {
        await this.fail(job.id, `project ${projectRow?.slug ?? '?'} has no voice reference uploaded`);
        return;
      }
      const voiceRef = path.isAbsolute(projectRow.ttsVoiceRefPath)
        ? projectRow.ttsVoiceRefPath
        : path.join(APP_ROOT, projectRow.ttsVoiceRefPath);
      if (!existsSync(voiceRef)) {
        await this.fail(job.id, `voice reference file missing on disk: ${voiceRef}`);
        return;
      }
      argv = [
        '-X', 'utf8',
        script,
        '--text-file',         textPath,
        '--out',               outPath,
        '--voice-ref',         voiceRef,
        '--sample-rate',       String(job.sampleRate),
        // XTTS-v2 has no categorical emotion — we pass the preset along
        // for traceability; the worker logs it and ignores it.
        '--emotion-preset',    job.emotionPreset ?? 'neutral',
        '--emotion-intensity', String(job.emotionIntensity ?? 0.5),
      ];
      // f5 honours the silero-style speed knob; qwen3 has no speed knob but
      // shares f5's sentence-pause behaviour. xtts2 defines neither flag.
      if (engine === 'f5') {
        argv.push('--speed', String(job.rate ?? 1.0));
      }
      if ((engine === 'f5' || engine === 'qwen3') && (job.sentencePauseSec ?? 0) > 0) {
        argv.push('--sentence-pause-sec', String(job.sentencePauseSec));
      }
      if (job.emotionRefName) {
        const refRow = await this.prisma.projectTTSEmotionRef.findUnique({
          where: { projectId_name: { projectId: projectRow.id, name: job.emotionRefName } },
        });
        if (!refRow) {
          await this.fail(job.id, `emotion ref "${job.emotionRefName}" not found in project`);
          return;
        }
        const refPath = path.isAbsolute(refRow.filePath)
          ? refRow.filePath
          : path.join(APP_ROOT, refRow.filePath);
        if (!existsSync(refPath)) {
          await this.fail(job.id, `emotion ref file missing on disk: ${refPath}`);
          return;
        }
        argv.push('--emotion-ref', refPath);
      }
      this.logger.log(`Launching ${engine} TTS: ${pythonBin} ${argv.join(' ')}`);
    } else {
      argv = [
        '-X', 'utf8',
        TTS_SCRIPT,
        '--text-file',           textPath,
        '--out',                 outPath,
        '--voice',               job.voice,
        '--sample-rate',         String(job.sampleRate),
        '--rate',                String(job.rate ?? 1.0),
        '--sentence-pause-sec',  String(job.sentencePauseSec ?? 0),
      ];
      if (job.modelFilename) {
        subEnv.SILERO_MODEL_PATH = path.join(SILERO_CACHE, job.modelFilename);
      }
      this.logger.log(`Launching silero TTS: ${pythonBin} ${argv.join(' ')}${job.modelFilename ? ` (model=${job.modelFilename})` : ''}`);
    }

    const proc = spawn(pythonBin, argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   subEnv,
    });

    let stderrTail = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      // Keep only the last ~4KB so a verbose model-load log doesn't blow up the
      // row's errorMessage on failure.
      stderrTail = (stderrTail + s).slice(-4000);
      this.logger.debug(`${engine}[${job.id}]: ${s.trimEnd()}`);
    });
    proc.stdout.on('data', (chunk: Buffer) => {
      this.logger.debug(`${engine}[${job.id}]: ${chunk.toString().trimEnd()}`);
    });

    const exitCode = await new Promise<number>((resolve) => {
      proc.on('error', () => resolve(1));
      proc.on('exit',  (code) => resolve(code ?? 1));
    });

    // Cleanup the staged text file regardless of outcome.
    try { unlinkSync(textPath); } catch { /* best-effort */ }

    if (exitCode !== 0 || !existsSync(outPath)) {
      await this.fail(job.id, stderrTail.trim() || `python exited with code ${exitCode}`);
      return;
    }

    // Probe the wav header once now so the UI doesn't fall back to the
    // text-length heuristic. Null if the probe fails — caller backfills lazily.
    const durationMs = probeWavDurationMs(outPath);
    await this.prisma.tTSJob.update({
      where: { id: job.id },
      data:  {
        status:         'completed',
        outputFilename: outFilename,
        durationMs,
        completedAt:    new Date(),
        errorMessage:   null,
      },
    });
    this.logger.log(`TTS job ${job.id} → ${outPath}${durationMs ? ` (${durationMs}ms)` : ''}`);
  }

  private async fail(jobId: string, message: string): Promise<void> {
    this.logger.warn(`TTS job ${jobId} failed: ${message}`);
    await this.prisma.tTSJob.update({
      where: { id: jobId },
      data:  {
        status:       'failed',
        errorMessage: message,
        completedAt:  new Date(),
      },
    });
  }

  /**
   * Hard-delete a TTS job: removes the DB row + the rendered .wav on disk +
   * clears scene.approvedTTSJobId if it pointed here. Refuses to delete a
   * `running` row so we don't orphan a live Python subprocess.
   */
  async delete(jobId: string): Promise<{ deleted: true; id: string }> {
    const job = await this.prisma.tTSJob.findUnique({
      where:   { id: jobId },
      include: {
        scene: { include: { project: true } },
        shot:  { include: { project: true } },
      },
    });
    if (!job) throw new NotFoundException(`TTS job ${jobId} not found`);
    if (job.status === 'running') {
      throw new BadRequestException(
        `TTS job ${jobId} is running — cancel it via /pipeline/queue first, then delete.`,
      );
    }

    if (job.outputFilename) {
      // Owner-scoped wav lookup. Skip unlink if another row in the same owner
      // shares the basename (legacy rows pre-job-id-in-filename could collide).
      let sharers = 0;
      let filePath: string | null = null;
      if (job.shotId && job.shot) {
        sharers = await this.prisma.tTSJob.count({
          where: { id: { not: job.id }, shotId: job.shotId, outputFilename: job.outputFilename },
        });
        filePath = path.join(APP_ROOT, 'data', job.shot.project.slug, 'shots', job.shot.shotCode, job.outputFilename);
      } else if (job.sceneId && job.scene) {
        sharers = await this.prisma.tTSJob.count({
          where: { id: { not: job.id }, sceneId: job.sceneId, outputFilename: job.outputFilename },
        });
        filePath = path.join(APP_ROOT, 'data', job.scene.project.slug, 'scenes', job.scene.sceneKey, job.outputFilename);
      }
      if (filePath && sharers === 0 && existsSync(filePath)) {
        try { unlinkSync(filePath); }
        catch (e: any) { this.logger.warn(`delete tts ${jobId}: failed to unlink ${filePath}: ${e?.message}`); }
      } else if (sharers > 0) {
        this.logger.log(`delete tts ${jobId}: keeping ${job.outputFilename} (shared with ${sharers} other row(s))`);
      }
    }

    // Clear owner's approvedTTSJobId if it pointed at this row.
    const ops: any[] = [this.prisma.tTSJob.delete({ where: { id: job.id } })];
    if (job.sceneId) {
      ops.unshift(this.prisma.scene.updateMany({
        where: { id: job.sceneId, approvedTTSJobId: job.id },
        data:  { approvedTTSJobId: null },
      }));
    }
    if (job.shotId) {
      ops.unshift(this.prisma.shot.updateMany({
        where: { id: job.shotId, approvedTTSJobId: job.id },
        data:  { approvedTTSJobId: null },
      }));
    }
    await this.prisma.$transaction(ops);

    return { deleted: true, id: job.id };
  }

  /**
   * Bulk-delete every non-running TTS job for a scene whose status matches
   * one of the given statuses (default: failed + cancelled). Used by the
   * modal's "очистить упавшие" action.
   */
  async purgeForScene(
    sceneId: string,
    statuses: Array<'pending' | 'running' | 'completed' | 'failed' | 'cancelled'> = ['failed', 'cancelled'],
  ): Promise<{ deleted: number }> {
    const scene = await this.prisma.scene.findUnique({ where: { id: sceneId }, include: { project: true } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
    const targets = await this.prisma.tTSJob.findMany({
      where: { sceneId, status: { in: statuses.filter((s) => s !== 'running') } },
    });
    for (const t of targets) {
      if (t.outputFilename) {
        const filePath = path.join(
          APP_ROOT, 'data', scene.project.slug, 'scenes', scene.sceneKey, t.outputFilename,
        );
        if (existsSync(filePath)) {
          try { unlinkSync(filePath); }
          catch (e: any) { this.logger.warn(`purge tts ${t.id}: failed to unlink ${filePath}: ${e?.message}`); }
        }
      }
    }
    await this.prisma.$transaction([
      this.prisma.scene.updateMany({
        where: { id: sceneId, approvedTTSJobId: { in: targets.map((t) => t.id) } },
        data:  { approvedTTSJobId: null },
      }),
      this.prisma.tTSJob.deleteMany({
        where: { id: { in: targets.map((t) => t.id) } },
      }),
    ]);
    return { deleted: targets.length };
  }

  /**
   * Approve a TTS job as the chosen narration for its scene. Idempotent —
   * approving the same job twice is a no-op. Passing `null` clears approval.
   * Only `completed` jobs can be approved; rejecting anything else avoids
   * shipping a half-rendered or failed take.
   */
  async approve(jobId: string | null, sceneId: string) {
    if (jobId === null) {
      return this.prisma.scene.update({
        where: { id: sceneId },
        data:  { approvedTTSJobId: null },
      });
    }
    const job = await this.prisma.tTSJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`TTS job ${jobId} not found`);
    if (job.sceneId !== sceneId) {
      throw new BadRequestException(`TTS job ${jobId} belongs to a different scene`);
    }
    if (job.status !== 'completed') {
      throw new BadRequestException(`Only completed jobs can be approved (got: ${job.status})`);
    }
    return this.prisma.scene.update({
      where: { id: sceneId },
      data:  { approvedTTSJobId: jobId },
    });
  }

  /**
   * Update scene narration fields — text + optional script-line refs (which
   * lines in <slug>_script.md this scene covers). All fields independent: pass
   * only what you want to change.
   */
  async setNarrationText(sceneId: string, body: {
    text?:            string;
    scriptStartLine?: number | null;
    scriptEndLine?:   number | null;
  }) {
    const scene = await this.prisma.scene.findUnique({ where: { id: sceneId } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
    return this.prisma.scene.update({
      where: { id: sceneId },
      data: {
        ...(body.text !== undefined            ? { narrationText:   body.text }            : {}),
        ...(body.scriptStartLine !== undefined ? { scriptStartLine: body.scriptStartLine } : {}),
        ...(body.scriptEndLine   !== undefined ? { scriptEndLine:   body.scriptEndLine }   : {}),
      },
    });
  }

  /**
   * Queue TTS for every shot in a scene that has narrationText and either
   * (mode='missing') no approved completed job, or (mode='all') any state.
   * Used by the scenes-page "🎙 в очередь" button — one HTTP call per scene
   * instead of N HTTP calls per shot.
   */
  async queueAllForScene(
    sceneId: string,
    opts: { mode?: 'missing' | 'all'; voice?: Voice } = {},
  ): Promise<{ queued: number; skipped: number; total: number }> {
    const mode  = opts.mode  ?? 'missing';
    const voice = opts.voice ?? DEFAULT_VOICE;
    if (!ALLOWED_VOICES.includes(voice)) {
      throw new BadRequestException(`voice must be one of: ${ALLOWED_VOICES.join(', ')}`);
    }
    const scene = await this.prisma.scene.findUnique({
      where:   { id: sceneId },
      include: { project: true, shots: { orderBy: { shotCode: 'asc' } } },
    });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);

    // Resolve the project engine ONCE (same project for every shot). Without
    // this, bulk-queued rows get engine=null and dispatch as silero — so a
    // project on xtts2/f5 would silently get the wrong voice. Throws here if a
    // voice-clone engine is selected with no voice reference uploaded.
    const engineCols = await this.resolveEngineColumns(scene.project, {});

    let queued  = 0;
    let skipped = 0;
    for (const shot of scene.shots) {
      const text = (shot.narrationText ?? '').trim();
      if (!text) { skipped++; continue; }

      if (mode === 'missing' && shot.approvedTTSJobId) {
        // Confirm the approval still points at a completed job before skipping.
        const job = await this.prisma.tTSJob.findUnique({ where: { id: shot.approvedTTSJobId } });
        if (job?.status === 'completed') { skipped++; continue; }
      }

      await this.prisma.tTSJob.create({
        data: {
          shotId:           shot.id,
          text,
          voice,
          sampleRate:       DEFAULT_SAMPLE_RATE,
          rate:             defaultRateFor(engineCols.engine),
          sentencePauseSec: defaultSentencePauseFor(engineCols.engine),
          modelFilename:    null,
          status:           'pending',
          ...engineCols,
        },
      });
      queued++;
    }
    return { queued, skipped, total: scene.shots.length };
  }

  /**
   * Lightweight per-scene summary of shot-level TTS state. Used by the
   * scenes-list page to show live progress without round-tripping every shot.
   *
   * Counts are shot-bucketed (not job-bucketed) so they add up cleanly:
   *   - approved          : shot has approvedTTSJobId pointing at a completed job
   *   - waitingApprove    : ≥1 completed unapproved job AND no approval AND no in-flight
   *   - inFlight          : ≥1 pending|running job (shot is currently being voiced)
   *   - needsQueueing     : narrationText is set AND no completed/pending/running jobs
   *   approved + waitingApprove + inFlight + needsQueueing ≤ total.
   * Plus job-level pending/running counts for the scene-header "⚙/⏳" badges.
   */
  async sceneShotTtsSummary(sceneId: string): Promise<{
    total:           number;
    withText:        number;
    approved:        number;
    waitingApprove:  number;
    inFlight:        number;
    needsQueueing:   number;
    pendingJobs:     number;
    runningJobs:     number;
    failedJobs:      number;
  }> {
    const shots = await this.prisma.shot.findMany({
      where:   { sceneId },
      include: { ttsJobs: true },
    });
    let withText = 0, approved = 0, waitingApprove = 0, inFlight = 0, needsQueueing = 0;
    let pendingJobs = 0, runningJobs = 0, failedJobs = 0;
    for (const s of shots) {
      const hasText = (s.narrationText ?? '').trim().length > 0;
      if (hasText) withText++;

      let shotInFlight    = false;
      let shotHasCompleted = false;
      for (const j of s.ttsJobs) {
        if (j.status === 'pending')   { pendingJobs++;   shotInFlight = true; }
        else if (j.status === 'running'){ runningJobs++; shotInFlight = true; }
        else if (j.status === 'failed') { failedJobs++; }
        else if (j.status === 'completed') { shotHasCompleted = true; }
      }

      const approvedJob = s.approvedTTSJobId
        ? s.ttsJobs.find((t) => t.id === s.approvedTTSJobId && t.status === 'completed')
        : null;

      if (approvedJob) {
        approved++;
      } else if (shotInFlight) {
        inFlight++;
      } else if (shotHasCompleted) {
        waitingApprove++;
      } else if (hasText) {
        needsQueueing++;
      }
    }
    return {
      total: shots.length,
      withText,
      approved,
      waitingApprove,
      inFlight,
      needsQueueing,
      pendingJobs,
      runningJobs,
      failedJobs,
    };
  }

  /**
   * Bulk-approve every shot in a scene that has at least one completed but
   * unapproved TTSJob — picks the most recent completed wav per shot. Skips
   * shots that are already approved or have no completed wav. Returns the
   * count of newly-approved shots.
   */
  async approveAllCompletedForScene(sceneId: string): Promise<{ approved: number; skipped: number; total: number }> {
    const shots = await this.prisma.shot.findMany({
      where:   { sceneId },
      include: { ttsJobs: { orderBy: { queuedAt: 'desc' } } },
    });
    let approved = 0;
    let skipped  = 0;
    for (const s of shots) {
      // Already approved → skip.
      if (s.approvedTTSJobId) {
        const cur = s.ttsJobs.find((j) => j.id === s.approvedTTSJobId);
        if (cur?.status === 'completed') { skipped++; continue; }
      }
      const latestCompleted = s.ttsJobs.find((j) => j.status === 'completed');
      if (!latestCompleted) { skipped++; continue; }
      await this.prisma.shot.update({
        where: { id: s.id },
        data:  { approvedTTSJobId: latestCompleted.id },
      });
      approved++;
    }
    return { approved, skipped, total: shots.length };
  }

  /** Update per-shot narration text. Parallel of `setNarrationText` for shots. */
  async setShotNarrationText(shotId: string, body: { text?: string }) {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  body.text !== undefined ? { narrationText: body.text } : {},
    });
  }

  /**
   * Approve a TTSJob as the chosen narration for its Shot. Mirrors `approve()`
   * for scenes. Null clears approval.
   */
  async approveForShot(jobId: string | null, shotId: string) {
    if (jobId === null) {
      return this.prisma.shot.update({
        where: { id: shotId },
        data:  { approvedTTSJobId: null },
      });
    }
    const job = await this.prisma.tTSJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`TTS job ${jobId} not found`);
    if (job.shotId !== shotId) {
      throw new BadRequestException(`TTS job ${jobId} belongs to a different shot`);
    }
    if (job.status !== 'completed') {
      throw new BadRequestException(`Only completed jobs can be approved (got: ${job.status})`);
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { approvedTTSJobId: jobId },
    });
  }
}
