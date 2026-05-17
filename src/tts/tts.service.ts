import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const APP_ROOT      = process.env.APP_ROOT      ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_DIR     = process.env.KOHYA_DIR     ?? 'E:\\kohya_ss';
// Reuse the kohya venv — it already has torch + soundfile, which is everything
// Silero needs. Override with TTS_PYTHON if a different env is preferred.
const PYTHON_BIN    = process.env.TTS_PYTHON    ?? process.env.PYTHON_BIN
                    ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const TTS_SCRIPT    = path.join(APP_ROOT, 'scripts', 'tts_silero.py');

const ALLOWED_VOICES       = ['aidar', 'baya', 'kseniya', 'xenia', 'eugene', 'random'] as const;
const ALLOWED_SAMPLE_RATES = [8000, 24000, 48000] as const;
type Voice      = (typeof ALLOWED_VOICES)[number];
type SampleRate = (typeof ALLOWED_SAMPLE_RATES)[number];

const DEFAULT_VOICE: Voice           = 'eugene';
const DEFAULT_SAMPLE_RATE: SampleRate = 48000;
const DEFAULT_RATE                    = 1.0;
const MIN_RATE                        = 0.5;
const MAX_RATE                        = 2.0;

export interface StartTTSInput {
  sceneId:      string;
  /** If omitted, scene.narrationText is used. */
  text?:        string;
  voice?:       Voice;
  sampleRate?:  SampleRate;
  /** Playback rate. 1.0 = normal, 0.8 = 20% slower, 1.2 = 20% faster. Range [0.5, 2.0]. */
  rate?:        number;
}

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.tTSJob.create({
      data: {
        sceneId: scene.id,
        text,
        voice,
        sampleRate,
        rate,
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
   * is not completed (caller decides what to do).
   */
  async filePath(jobId: string): Promise<string | null> {
    const j = await this.get(jobId);
    if (!j.outputFilename || j.status !== 'completed') return null;
    const scene = await this.prisma.scene.findUnique({
      where:   { id: j.sceneId },
      include: { project: true },
    });
    if (!scene) return null;
    return path.join(
      APP_ROOT, 'data', scene.project.slug, 'scenes', scene.sceneKey, j.outputFilename,
    );
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

    const outFilename = `narration_${job.voice}_${job.sampleRate}.wav`;
    const outPath     = path.join(sceneDir, outFilename);

    await this.prisma.tTSJob.update({
      where: { id: job.id },
      data:  { status: 'running', startedAt: new Date() },
    });

    const argv = [
      '-X', 'utf8',
      TTS_SCRIPT,
      '--text-file',   textPath,
      '--out',         outPath,
      '--voice',       job.voice,
      '--sample-rate', String(job.sampleRate),
      '--rate',        String(job.rate ?? 1.0),
    ];
    this.logger.log(`Launching silero TTS: ${PYTHON_BIN} ${argv.join(' ')}`);

    const proc = spawn(PYTHON_BIN, argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   { ...process.env, PYTHONIOENCODING: 'utf-8' },
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
