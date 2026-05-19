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
    const scene = await this.prisma.scene.findUnique({
      where:   { id: j.sceneId },
      include: { project: true },
    });
    if (!scene) return null;
    const fp = path.join(
      APP_ROOT, 'data', scene.project.slug, 'scenes', scene.sceneKey, j.outputFilename,
    );
    if (!existsSync(fp)) {
      this.logger.warn(`TTS job ${jobId}: outputFilename=${j.outputFilename} but file missing on disk`);
      return null;
    }
    return fp;
  }

  /**
   * Run a pending TTS job. Spawns scripts/tts_silero.py and waits for it to
   * exit. The pipeline tick keeps `status='running'` exclusive so we never
   * have two Python subprocesses fighting over the cache dir at once.
   */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.tTSJob.findUnique({
      where:   { id: jobId },
      include: { scene: { include: { project: true } } },
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

    const sceneDir = path.join(
      APP_ROOT, 'data', job.scene.project.slug, 'scenes', job.scene.sceneKey,
    );
    mkdirSync(sceneDir, { recursive: true });

    // Stage the narration text as a tmp file so Windows argv length / encoding
    // limits don't bite us on long scripts (paragraph-level scenes can hit
    // 1-2k chars easily).
    const textPath = path.join(sceneDir, `.tts_${job.id}.txt`);
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
    const outPath     = path.join(sceneDir, outFilename);

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
      include: { scene: { include: { project: true } } },
    });
    if (!job) throw new NotFoundException(`TTS job ${jobId} not found`);
    if (job.status === 'running') {
      throw new BadRequestException(
        `TTS job ${jobId} is running — cancel it via /pipeline/queue first, then delete.`,
      );
    }

    if (job.outputFilename) {
      // Legacy rows (pre-job-id-in-filename) could share a wav with another
      // completed job for the same voice+sr. Skip the unlink if any other
      // row still references this exact basename in the same scene — losing
      // the file would orphan the other row and break its <audio> player.
      const sharers = await this.prisma.tTSJob.count({
        where: {
          id:             { not: job.id },
          sceneId:        job.sceneId,
          outputFilename: job.outputFilename,
        },
      });
      if (sharers === 0) {
        const filePath = path.join(
          APP_ROOT, 'data', job.scene.project.slug, 'scenes', job.scene.sceneKey, job.outputFilename,
        );
        if (existsSync(filePath)) {
          try { unlinkSync(filePath); }
          catch (e: any) { this.logger.warn(`delete tts ${jobId}: failed to unlink ${filePath}: ${e?.message}`); }
        }
      } else {
        this.logger.log(`delete tts ${jobId}: keeping ${job.outputFilename} (shared with ${sharers} other row(s))`);
      }
    }

    await this.prisma.$transaction([
      this.prisma.scene.updateMany({
        where: { id: job.sceneId, approvedTTSJobId: job.id },
        data:  { approvedTTSJobId: null },
      }),
      this.prisma.tTSJob.delete({ where: { id: job.id } }),
    ]);

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
}
