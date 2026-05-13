import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, rmSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetService } from './dataset.service';
import { TrainerService } from './trainer.service';
import { EngineService } from '../pipeline/engine.service';
import { scanLoraVariants, loraOutputDir, loraOutputName } from './lora-variants.util';
import { parseStepSamples, tailFile, readUpTo, decimate, TrainStepSample } from './train-log.util';

const APP_ROOT      = process.env.APP_ROOT      ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_MODELS  = process.env.COMFY_MODELS  ?? 'E:\\ComfyUI\\models';
const DEFAULT_BASE_MODEL = process.env.LORA_BASE_MODEL ?? 'SDXL/lustifySDXLNSFW_ggwpV7.safetensors';

export interface StartTrainingInput {
  profileId:     string;
  triggerToken?: string;     // override profile.triggerToken
  numRepeats?:   number;
  maxSteps?:     number;
  networkDim?:   number;
  baseModel?:    string;     // path relative to COMFY_MODELS/checkpoints, or absolute
}

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly dataset: DatasetService,
    private readonly trainer: TrainerService,
    private readonly engine:  EngineService,
  ) {}

  /**
   * Enqueue a training job. Returns immediately with a `pending` TrainingJob.
   * The pipeline queue (PipelineQueueService) will pick it up, ensure ComfyUI
   * is stopped (kohya cannot share GPU), and run the pipeline serially.
   *
   * If you need to run a job synchronously (rare, e.g. tests), call
   * runPipeline(jobId) directly.
   */
  async start(input: StartTrainingInput) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: input.profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${input.profileId} not found`);

    // Empty string from form input or DB ''  must NOT bypass the fallback,
    // otherwise the kohya subset folder ends up named "10_" (no token) and
    // captioning produces unusable .txt files. Use a strict non-empty test.
    const nonEmpty = (s: string | null | undefined) => (s && s.trim().length > 0) ? s.trim() : null;
    const triggerToken = nonEmpty(input.triggerToken)
      ?? nonEmpty(profile.triggerToken)
      ?? makeTriggerToken(profile.profileCode);

    const baseRel  = input.baseModel ?? DEFAULT_BASE_MODEL;
    const basePath = path.isAbsolute(baseRel) ? baseRel : path.join(COMFY_MODELS, 'checkpoints', baseRel);
    if (!existsSync(basePath)) {
      throw new NotFoundException(`Base model not found: ${basePath}. Download lustifySDXLNSFW or set baseModel.`);
    }

    // Snapshot the inputs so the pipeline can rebuild cfg later without losing
    // overrides across the queue boundary. We piggyback on the existing JSON
    // `progress` field — it's the only Json column we have without a migration.
    const inputSnapshot = {
      kind:       'training-input-v1',
      numRepeats: input.numRepeats ?? 10,
      maxSteps:   input.maxSteps ?? 3000,
      networkDim: input.networkDim ?? 32,
    };

    return this.prisma.trainingJob.create({
      data: {
        profileId:    profile.id,
        status:       'pending',
        baseModel:    basePath,
        triggerToken,
        progress:     inputSnapshot,
      },
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Training job ${id} not found`);
    return job;
  }

  /**
   * Force-cancel a training job. Used when a Florence-2 / kohya subprocess
   * is orphaned (e.g. backend was restarted while training was running) and
   * status stays at "captioning" / "training" forever.
   */
  async cancel(id: string) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Training job ${id} not found`);
    if (['completed','failed','cancelled'].includes(job.status)) return job;
    return this.prisma.trainingJob.update({
      where: { id },
      data:  {
        status:       'cancelled',
        completedAt:  new Date(),
        errorMessage: 'Manually cancelled',
      },
    });
  }

  listJobs(profileId?: string) {
    return this.prisma.trainingJob.findMany({
      where:   profileId ? { profileId } : undefined,
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
  }

  /**
   * Live progress for a training job — parses the kohya train.log tail.
   * Returns {phase, step, totalSteps, percent, avgLoss, eta, elapsed, lastLine}.
   */
  async getProgress(id: string) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Training job ${id} not found`);

    const phase     = job.status;
    const startedAt = job.startedAt?.getTime() ?? null;
    const elapsedMs = startedAt ? Date.now() - startedAt : null;
    const empty = { phase, step: null, totalSteps: null, percent: null, avgLoss: null, eta: null, elapsedMs, lastLine: null };

    if (!job.logPath || !existsSync(job.logPath)) return empty;

    // Tail the last ~16 KB — kohya overwrites the same line via \r so the
    // tail always contains the most recent step in plain text.
    const tail = tailFile(job.logPath, 16 * 1024);
    const samples = parseStepSamples(tail);
    if (samples.length === 0) return empty;
    const last = samples[samples.length - 1];
    return {
      phase,
      step:       last.step,
      totalSteps: last.totalSteps,
      percent:    last.percent,
      avgLoss:    last.avgLoss,
      eta:        last.etaSec != null ? formatHMS(last.etaSec) : null,
      elapsed:    formatHMS(last.elapsedSec),
      elapsedMs,
      lastLine:   `step ${last.step}/${last.totalSteps} loss=${last.avgLoss.toFixed(4)} ${last.secPerIt.toFixed(2)}s/it`,
    };
  }

  /**
   * Full training history — every step sample parsed from the log, decimated
   * to ~maxPoints so the frontend chart stays responsive on long runs.
   */
  async getHistory(id: string, maxPoints = 500): Promise<{
    phase:      string;
    totalSteps: number | null;
    samples:    TrainStepSample[];
  }> {
    const job = await this.prisma.trainingJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Training job ${id} not found`);

    if (!job.logPath || !existsSync(job.logPath)) {
      return { phase: job.status, totalSteps: null, samples: [] };
    }

    // 5 MB cap — a 1500-step run is ~300 KB; this leaves headroom for very
    // long fine-tuning runs without ever loading the whole disk.
    const buf = readUpTo(job.logPath, 5 * 1024 * 1024);
    const all = parseStepSamples(buf);
    const samples = decimate(all, maxPoints);
    return {
      phase:      job.status,
      totalSteps: samples[0]?.totalSteps ?? null,
      samples,
    };
  }

  // ── Background pipeline ─────────────────────────────────────────────────────

  /**
   * Run the full training pipeline (prepare → caption → kohya) for a job that
   * was previously enqueued via start(). Public so PipelineQueueService can
   * dispatch it after engine arbitration.
   *
   * On error, status is set to 'failed' with errorMessage; this method does
   * not re-throw, so callers (the queue worker) can move on.
   */
  async runPipeline(jobId: string): Promise<void> {
    const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Training job ${jobId} not found`);
    if (job.status === 'cancelled') return;

    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: job.profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) {
      await this.update(jobId, { status: 'failed', errorMessage: 'Profile vanished', completedAt: new Date() });
      return;
    }

    // Reconstruct cfg from the snapshot stored at enqueue time, with safe fallbacks.
    const snap = (job.progress ?? {}) as Record<string, unknown>;
    const cfg = {
      triggerToken: job.triggerToken ?? '',
      basePath:     job.baseModel,
      numRepeats:   typeof snap.numRepeats === 'number' ? snap.numRepeats : 10,
      maxSteps:     typeof snap.maxSteps   === 'number' ? snap.maxSteps   : 3000,
      networkDim:   typeof snap.networkDim === 'number' ? snap.networkDim : 32,
    };

    const project = profile.character.project;
    const outputDir = loraOutputDir(project.slug);
    const outputName = loraOutputName(profile.profileCode);

    try {
      await this.update(jobId, { status: 'preparing', startedAt: new Date() });
      const prepared = this.dataset.prepare({
        projectSlug:    project.slug,
        profileCode:    profile.profileCode,
        filenamePrefix: profile.profileCode,
        triggerToken:   cfg.triggerToken,
        numRepeats:     cfg.numRepeats,
      });
      await this.update(jobId, { datasetPath: prepared.rootDir });

      await this.update(jobId, { status: 'captioning' });
      const characterName = (profile.character.displayName ?? '').trim();
      await this.dataset.caption({
        datasetDir:    prepared.imageDir,
        triggerToken:  cfg.triggerToken,
        characterName: characterName || undefined,
        overwrite:     true,
        onLog:         (line) => this.logger.debug(`[caption] ${line}`),
      });

      await this.update(jobId, { status: 'training' });
      const handle = this.trainer.start(
        {
          datasetDir:    prepared.imageDir,
          outputDir,
          outputName,
          baseModelPath: cfg.basePath,
          triggerToken:  cfg.triggerToken,
          numRepeats:    cfg.numRepeats,
          maxTrainSteps: cfg.maxSteps,
          networkDim:    cfg.networkDim,
        },
        { onLog: (line) => this.logger.debug(`[train] ${line}`) },
      );
      this.engine.trackKohya(jobId, handle.pid);
      await this.update(jobId, { configPath: handle.configPath, logPath: handle.logPath });

      try {
        await handle.done;
      } finally {
        this.engine.forgetKohya(jobId);
      }

      // Clean up TensorBoard event logs (we don't read them in the UI; they
      // just clutter the LoRA folder). Best-effort: failure here doesn't fail
      // the training.
      try {
        const tbLogs = path.join(outputDir, 'logs');
        if (existsSync(tbLogs)) rmSync(tbLogs, { recursive: true, force: true });
      } catch { /* ignore */ }

      // Scan output dir for ALL safetensors files matching <outputName>* —
      // captures the final LoRA plus every epoch checkpoint kohya saved
      // (`-000001.safetensors`, `-000002.safetensors`, …) so the user can
      // test intermediate epochs from the UI without losing them.
      const variants = scanLoraVariants(outputDir, outputName);
      await this.prisma.characterProfile.update({
        where: { id: profile.id },
        data:  {
          loraPath:     handle.outputLora,   // active = final by default
          loraVariants: variants as any,
          datasetPath:  prepared.rootDir,
          triggerToken: cfg.triggerToken,
        },
      });
      await this.update(jobId, {
        status:         'completed',
        outputLoraPath: handle.outputLora,
        completedAt:    new Date(),
      });
      this.logger.log(`Training ${jobId} done → ${handle.outputLora}`);
    } catch (err: any) {
      this.logger.error(`Training ${jobId} failed: ${err.message}`);
      this.engine.forgetKohya(jobId);
      await this.update(jobId, {
        status:       'failed',
        errorMessage: err.message,
        completedAt:  new Date(),
      });
    }
  }

  private update(id: string, data: any) {
    return this.prisma.trainingJob.update({ where: { id }, data });
  }
}

/** "courier_28" → "courier28_lora" — kohya tokens prefer no dashes/underscores in middle. */
function makeTriggerToken(profileCode: string): string {
  return profileCode.toLowerCase().replace(/[^a-z0-9]+/g, '') + '_lora';
}

/** Format seconds → "MM:SS" or "HH:MM:SS" depending on duration. */
function formatHMS(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
