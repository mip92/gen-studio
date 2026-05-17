import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetQueueService } from '../generation/dataset-queue.service';
import { SceneRenderService } from '../generation/scenes/scene-render.service';
import { VideoRenderService } from '../generation/videos/video-render.service';
import { TrainingService } from '../training/training.service';
import { TTSService } from '../tts/tts.service';
import { EngineService } from './engine.service';

const POLL_MS = 5_000;

/** A captioning subprocess that hasn't moved this long is presumed hung. */
const CAPTIONING_HANG_THRESHOLD_MS = 15 * 60 * 1000;   // 15 min

/** A kohya training that hasn't written to train.log this long is presumed hung. */
const TRAINING_LOG_STALL_MS = 20 * 60 * 1000;          // 20 min

/**
 * Single orchestrator for ALL GPU-using work. Runs one job at a time across
 * dataset_jobs and training_jobs, with engine arbitration:
 *
 *   - dataset job → needs ComfyUI alive (user runs it manually)
 *   - training job → kohya needs exclusive GPU; pipeline kills ComfyUI first
 *
 * Failure isolation: any failed job is marked `failed` and the queue moves on
 * to the next pending one. Hang detection force-fails jobs whose subprocesses
 * died silently (the FATHER_BASE captioning incident).
 */
@Injectable()
export class PipelineQueueService {
  private readonly logger = new Logger(PipelineQueueService.name);
  private worker?: NodeJS.Timeout;
  private ticking = false;

  constructor(
    private readonly prisma:   PrismaService,
    private readonly datasets: DatasetQueueService,
    private readonly scenes:   SceneRenderService,
    private readonly videos:   VideoRenderService,
    private readonly training: TrainingService,
    private readonly tts:      TTSService,
    private readonly engine:   EngineService,
  ) {}

  start(): void {
    if (this.worker) return;
    this.worker = setInterval(() => this.safeTick(), POLL_MS);
    this.logger.log(`Pipeline queue started (poll ${POLL_MS}ms)`);
  }

  stop(): void {
    if (this.worker) clearInterval(this.worker);
    this.worker = undefined;
  }

  private async safeTick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try { await this.tick(); }
    catch (e: any) { this.logger.error(`tick error: ${e?.stack ?? e?.message ?? e}`); }
    finally { this.ticking = false; }
  }

  private async tick(): Promise<void> {
    // ── 1. Housekeeping ────────────────────────────────────────────────────
    await this.datasets.promoteBlocked();
    await this.datasets.pollRunning();
    await this.scenes.pollRunning();
    await this.detectHungJobs();

    // ── 1b. TTS lane (parallel to GPU lane) ────────────────────────────────
    // Silero runs on CPU only — it doesn't fight ComfyUI or kohya for the GPU,
    // so it dispatches independently of the GPU-serialisation gate below. We
    // still keep "one TTS at a time" so two python processes don't race over
    // the torch.hub cache directory.
    await this.dispatchTTSIfFree();

    // ── 2. Anything still running? ─────────────────────────────────────────
    const trainingActive = await this.prisma.trainingJob.count({
      where: { status: { in: ['preparing', 'captioning', 'training'] } },
    });
    const datasetActive = await this.prisma.datasetJob.count({
      where: { status: 'running' },
    });
    const sceneActive = await this.prisma.sceneRenderJob.count({
      where: { status: 'running' },
    });
    const videoActive = await this.prisma.videoRender.count({
      where: { OR: [{ status: 'running' }, { upscaleStatus: 'running' }] },
    });
    if (trainingActive > 0 || datasetActive > 0 || sceneActive > 0 || videoActive > 0) return;

    // ── 3. Pick oldest pending across all queues ───────────────────────────
    const [nextTraining, nextDataset, nextScene, nextVideo, nextUpscale] = await Promise.all([
      this.prisma.trainingJob.findFirst({ where: { status: 'pending' }, orderBy: { queuedAt: 'asc' } }),
      this.datasets.findNextPending(),
      this.scenes.findNextPending(),
      this.videos.findNextPending(),
      this.videos.findNextPendingUpscale(),
    ]);

    type Pick = { type: 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale'; id: string; ts: number };
    const candidates: Pick[] = [];
    if (nextTraining) candidates.push({ type: 'training', id: nextTraining.id, ts: nextTraining.queuedAt.getTime() });
    if (nextDataset)  candidates.push({ type: 'dataset',  id: nextDataset.id,  ts: nextDataset.queuedAt.getTime() });
    if (nextScene)    candidates.push({ type: 'scene',    id: nextScene.id,    ts: nextScene.queuedAt.getTime() });
    if (nextVideo)    candidates.push({ type: 'video',    id: nextVideo.id,    ts: nextVideo.queuedAt.getTime() });
    if (nextUpscale)  candidates.push({
      type: 'video_upscale',
      id:   nextUpscale.id,
      // Upscale FIFO uses upscaleQueuedAt — the row's main `queuedAt` is from
      // the original render and would let stale upscales win every arbitration.
      // Legacy rows (before the upscaleQueuedAt migration) fall back to it.
      ts:   (nextUpscale.upscaleQueuedAt ?? nextUpscale.queuedAt).getTime(),
    });
    if (candidates.length === 0) return;

    candidates.sort((a, b) => a.ts - b.ts);
    const winner = candidates[0];

    if (winner.type === 'training')           await this.dispatchTraining(winner.id);
    else if (winner.type === 'dataset')       await this.dispatchDataset(winner.id);
    else if (winner.type === 'scene')         await this.dispatchScene(winner.id);
    else if (winner.type === 'video')         await this.dispatchVideo(winner.id);
    else                                       await this.dispatchVideoUpscale(winner.id);
  }

  /**
   * Pick up one pending TTS job and run it. Fire-and-forget — the python
   * subprocess can take 5-60 s and we don't want to block GPU dispatch behind
   * it. Concurrency is guarded by `status='running'` rows: if one is already
   * running, the findFirst({status:'pending'}) returns null until it's done.
   */
  private async dispatchTTSIfFree(): Promise<void> {
    const running = await this.prisma.tTSJob.count({ where: { status: 'running' } });
    if (running > 0) return;
    const next = await this.tts.findNextPending();
    if (!next) return;
    this.logger.log(`Dispatching TTS job ${next.id} (CPU, parallel)`);
    void this.tts.dispatchPending(next.id).catch((e) => {
      this.logger.error(`tts dispatchPending ${next.id} threw: ${e?.message ?? e}`);
    });
  }

  private async dispatchVideo(videoId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('video', videoId))) return;
    this.logger.log(`Dispatching video render ${videoId} via ComfyUI`);
    await this.videos.dispatchPending(videoId);
  }

  private async dispatchVideoUpscale(videoId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('video_upscale', videoId))) return;
    this.logger.log(`Dispatching video upscale ${videoId} via ComfyUI`);
    await this.videos.dispatchPendingUpscale(videoId);
  }

  // ── Engine arbitration + dispatch ────────────────────────────────────────

  private async dispatchTraining(jobId: string): Promise<void> {
    this.logger.log(`Dispatching training job ${jobId} — stopping ComfyUI first`);
    try {
      await this.engine.stopComfy();
    } catch (e: any) {
      this.logger.warn(`stopComfy failed (proceeding anyway): ${e.message}`);
    }
    // runPipeline is long-running and self-managing — it updates its own status.
    // We fire-and-forget; the next tick will observe status === 'preparing' and
    // wait for completion.
    void this.training.runPipeline(jobId).catch((e) => {
      this.logger.error(`runPipeline ${jobId} threw: ${e?.message ?? e}`);
    });
  }

  private async dispatchDataset(jobId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('dataset', jobId))) return;
    this.logger.log(`Dispatching dataset job ${jobId} via ComfyUI`);
    await this.datasets.dispatchPending(jobId);
  }

  private async dispatchScene(jobId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('scene', jobId))) return;
    this.logger.log(`Dispatching scene render job ${jobId} via ComfyUI`);
    await this.scenes.dispatchPending(jobId);
  }

  /**
   * Ensure ComfyUI is alive before dispatching a ComfyUI-dependent job. If it's
   * down, auto-start it (cold start ~30-60s, we wait up to 2 min). If the
   * startup fails, mark the calling job as `failed` and return false so the
   * caller skips dispatch — the next pending pickup happens on the next tick.
   */
  private async ensureComfyAlive(
    jobType: 'dataset' | 'scene' | 'video' | 'video_upscale',
    jobId: string,
  ): Promise<boolean> {
    if (await this.engine.isComfyAlive()) return true;
    this.logger.log(`${jobType} job ${jobId} needs ComfyUI — auto-starting…`);
    try {
      await this.engine.startComfy();
      return true;
    } catch (e: any) {
      this.logger.error(`startComfy failed for ${jobType} ${jobId}: ${e.message}`);
      const errMsg = `ComfyUI auto-start failed: ${e.message}`;
      const ts     = new Date();
      if (jobType === 'dataset') {
        await this.prisma.datasetJob.update({
          where: { id: jobId },
          data:  { status: 'failed', errorMessage: errMsg, completedAt: ts },
        });
      } else if (jobType === 'scene') {
        await this.prisma.sceneRenderJob.update({
          where: { id: jobId },
          data:  { status: 'failed', errorMessage: errMsg, completedAt: ts },
        });
      } else if (jobType === 'video') {
        await this.prisma.videoRender.update({
          where: { id: jobId },
          data:  { status: 'failed', errorMessage: errMsg, completedAt: ts },
        });
      } else {
        await this.prisma.videoRender.update({
          where: { id: jobId },
          data:  { upscaleStatus: 'failed', upscaleErrorMessage: errMsg, upscaleCompletedAt: ts },
        });
      }
      return false;
    }
  }

  // ── Hang detection ───────────────────────────────────────────────────────

  /**
   * Mark training jobs whose subprocesses have silently died as `failed`. We
   * detect this by stale activity timestamps:
   *   - captioning: no .txt files written in the dataset folder for 15+ min
   *   - training:   no train.log activity for 20+ min
   * Both are conservative — real Florence-2 / kohya jobs always touch these
   * files within seconds.
   */
  private async detectHungJobs(): Promise<void> {
    const now = Date.now();
    const candidates = await this.prisma.trainingJob.findMany({
      where: { status: { in: ['captioning', 'training'] } },
    });
    for (const job of candidates) {
      const phase = job.status;
      const phaseStartedAt = (job.startedAt ?? job.updatedAt).getTime();

      if (phase === 'captioning') {
        const lastWrite = job.datasetPath
          ? newestImageDirTxtMtime(path.join(job.datasetPath, 'img')) ?? phaseStartedAt
          : phaseStartedAt;
        if (now - lastWrite > CAPTIONING_HANG_THRESHOLD_MS && now - phaseStartedAt > CAPTIONING_HANG_THRESHOLD_MS) {
          await this.failHungJob(job.id, 'captioning hung — no caption file written for 15+ min');
        }
      } else if (phase === 'training') {
        const lastWrite = job.logPath && existsSync(job.logPath)
          ? statSync(job.logPath).mtimeMs
          : phaseStartedAt;
        if (now - lastWrite > TRAINING_LOG_STALL_MS) {
          this.engine.killKohya(job.id);
          await this.failHungJob(job.id, 'training hung — no train.log activity for 20+ min');
        }
      }
    }
  }

  private async failHungJob(jobId: string, reason: string): Promise<void> {
    this.logger.warn(`Hung job ${jobId}: ${reason}`);
    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data:  {
        status:       'failed',
        errorMessage: reason,
        completedAt:  new Date(),
      },
    });
  }
}

/**
 * Walk the dataset's `img/<repeats>_<token>/` subset folders and return the
 * newest .txt mtime (in ms), or null if none.
 */
function newestImageDirTxtMtime(imgDir: string): number | null {
  if (!existsSync(imgDir)) return null;
  let newest: number | null = null;
  for (const entry of readdirSync(imgDir)) {
    const subset = path.join(imgDir, entry);
    if (!statSync(subset).isDirectory()) continue;
    for (const f of readdirSync(subset)) {
      if (!f.endsWith('.txt')) continue;
      const m = statSync(path.join(subset, f)).mtimeMs;
      if (newest === null || m > newest) newest = m;
    }
  }
  return newest;
}
