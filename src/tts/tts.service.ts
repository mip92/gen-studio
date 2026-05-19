import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const APP_ROOT      = process.env.APP_ROOT      ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_DIR     = process.env.KOHYA_DIR     ?? 'E:\\kohya_ss';
// Reuse the kohya venv — it already has torch + soundfile, which is everything
// Silero needs. Override with TTS_PYTHON if a different env is preferred.
const PYTHON_BIN    = process.env.TTS_PYTHON    ?? process.env.PYTHON_BIN
                    ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const TTS_SCRIPT    = path.join(APP_ROOT, 'scripts', 'tts_silero.py');
const SILERO_CACHE  = process.env.SILERO_CACHE_DIR
                    ?? path.join(APP_ROOT, '.silero_cache');

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
const DEFAULT_RATE                    = 1.0;
const MIN_RATE                        = 0.5;
const MAX_RATE                        = 2.0;
/** Extra silence after each sentence — capped at 30s to keep ridiculous values out. */
const MIN_SENTENCE_PAUSE = 0;
const MAX_SENTENCE_PAUSE = 30;

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

    const voice      = input.voice      ?? DEFAULT_VOICE;
    const sampleRate = input.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const rate       = input.rate       ?? DEFAULT_RATE;
    if (!ALLOWED_VOICES.includes(voice)) {
      throw new BadRequestException(`voice must be one of: ${ALLOWED_VOICES.join(', ')}`);
    }
    if (!ALLOWED_SAMPLE_RATES.includes(sampleRate)) {
      throw new BadRequestException(`sampleRate must be one of: ${ALLOWED_SAMPLE_RATES.join(', ')}`);
    }
    if (rate < MIN_RATE || rate > MAX_RATE) {
      throw new BadRequestException(`rate must be in [${MIN_RATE}, ${MAX_RATE}]`);
    }
    const sentencePauseSec = input.sentencePauseSec ?? 0;
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

    const voice      = input.voice      ?? DEFAULT_VOICE;
    const sampleRate = input.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const rate       = input.rate       ?? DEFAULT_RATE;
    if (!ALLOWED_VOICES.includes(voice)) {
      throw new BadRequestException(`voice must be one of: ${ALLOWED_VOICES.join(', ')}`);
    }
    if (!ALLOWED_SAMPLE_RATES.includes(sampleRate)) {
      throw new BadRequestException(`sampleRate must be one of: ${ALLOWED_SAMPLE_RATES.join(', ')}`);
    }
    if (rate < MIN_RATE || rate > MAX_RATE) {
      throw new BadRequestException(`rate must be in [${MIN_RATE}, ${MAX_RATE}]`);
    }
    const sentencePauseSec = input.sentencePauseSec ?? 0;
    if (sentencePauseSec < MIN_SENTENCE_PAUSE || sentencePauseSec > MAX_SENTENCE_PAUSE) {
      throw new BadRequestException(`sentencePauseSec must be in [${MIN_SENTENCE_PAUSE}, ${MAX_SENTENCE_PAUSE}]`);
    }

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

  listForShot(shotId: string) {
    return this.prisma.tTSJob.findMany({
      where:   { shotId },
      orderBy: { queuedAt: 'desc' },
    });
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

    if (!existsSync(PYTHON_BIN)) {
      await this.fail(job.id, `python bin missing: ${PYTHON_BIN} (set TTS_PYTHON env)`);
      return;
    }
    if (!existsSync(TTS_SCRIPT)) {
      await this.fail(job.id, `tts_silero.py missing: ${TTS_SCRIPT}`);
      return;
    }

    // Resolve output dir — scene-level jobs write under data/<slug>/scenes/<sceneKey>/,
    // shot-level jobs under data/<slug>/shots/<shotCode>/.
    let outDir: string;
    if (job.shotId && job.shot) {
      outDir = path.join(APP_ROOT, 'data', job.shot.project.slug, 'shots', job.shot.shotCode);
    } else if (job.sceneId && job.scene) {
      outDir = path.join(APP_ROOT, 'data', job.scene.project.slug, 'scenes', job.scene.sceneKey);
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
    // disk. Earlier we keyed by voice+sr (+model tag), but that caused two
    // separate completed jobs with identical params to share one wav; deleting
    // one then orphaned the other with a missing-file ENOENT on playback.
    // Including a model tag makes the filename self-describing for debugging.
    const modelTag    = job.modelFilename
      ? '_' + path.basename(job.modelFilename).replace(/\.pt$/i, '')
      : '';
    const outFilename = `narration_${job.id}_${job.voice}_${job.sampleRate}${modelTag}.wav`;
    const outPath     = path.join(outDir, outFilename);

    await this.prisma.tTSJob.update({
      where: { id: job.id },
      data:  { status: 'running', startedAt: new Date() },
    });

    const argv = [
      '-X', 'utf8',
      TTS_SCRIPT,
      '--text-file',           textPath,
      '--out',                 outPath,
      '--voice',               job.voice,
      '--sample-rate',         String(job.sampleRate),
      '--rate',                String(job.rate ?? 1.0),
      '--sentence-pause-sec',  String(job.sentencePauseSec ?? 0),
    ];
    // Per-job model override — passed via env so the python script's existing
    // SILERO_MODEL_PATH lookup picks it up without needing extra CLI flags.
    const subEnv: NodeJS.ProcessEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    if (job.modelFilename) {
      subEnv.SILERO_MODEL_PATH = path.join(SILERO_CACHE, job.modelFilename);
    }
    this.logger.log(`Launching silero TTS: ${PYTHON_BIN} ${argv.join(' ')}${job.modelFilename ? ` (model=${job.modelFilename})` : ''}`);

    const proc = spawn(PYTHON_BIN, argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   subEnv,
    });

    let stderrTail = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      // Keep only the last ~4KB so a verbose model-load log doesn't blow up the
      // row's errorMessage on failure.
      stderrTail = (stderrTail + s).slice(-4000);
      this.logger.debug(`silero[${job.id}]: ${s.trimEnd()}`);
    });
    proc.stdout.on('data', (chunk: Buffer) => {
      this.logger.debug(`silero[${job.id}]: ${chunk.toString().trimEnd()}`);
    });

    const exitCode = await new Promise<number>((resolve) => {
      proc.on('error', () => resolve(1));
      proc.on('exit',  (code) => resolve(code ?? 1));
    });

    // Cleanup the staged text file regardless of outcome.
    try { require('fs').unlinkSync(textPath); } catch { /* best-effort */ }

    if (exitCode !== 0 || !existsSync(outPath)) {
      await this.fail(job.id, stderrTail.trim() || `python exited with code ${exitCode}`);
      return;
    }

    await this.prisma.tTSJob.update({
      where: { id: job.id },
      data:  {
        status:         'completed',
        outputFilename: outFilename,
        completedAt:    new Date(),
        errorMessage:   null,
      },
    });
    this.logger.log(`TTS job ${job.id} → ${outPath}`);
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
    const scene = await this.prisma.scene.findUnique({
      where:   { id: sceneId },
      include: { shots: { orderBy: { shotCode: 'asc' } } },
    });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);

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
          rate:             DEFAULT_RATE,
          sentencePauseSec: 0,
          modelFilename:    null,
          status:           'pending',
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
