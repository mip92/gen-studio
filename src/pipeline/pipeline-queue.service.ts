import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetQueueService } from '../generation/dataset-queue.service';
import { SceneRenderService } from '../generation/scenes/scene-render.service';
import { VideoRenderService } from '../generation/videos/video-render.service';
import { TrainingService } from '../training/training.service';
import { TTSService } from '../tts/tts.service';
import { BgmRenderService } from '../bgm/bgm-render.service';
import { AnchorRenderService } from '../characters/anchor-render.service';
import { ImageValidationService } from '../validation/image-validation.service';
import { AnchorValidationService } from '../validation/anchor-validation.service';
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
    private readonly bgm:      BgmRenderService,
    private readonly anchors:  AnchorRenderService,
    private readonly validation: ImageValidationService,
    private readonly anchorValidation: AnchorValidationService,
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
    await this.anchors.pollRunning();
    await this.detectHungJobs();

    // ── 2. Anything still running? ─────────────────────────────────────────
    // TTS is included in the activity check so it participates in the same
    // single-slot serialisation as GPU work — the user's invariant is "all
    // jobs enter and leave the queue through one path, in FIFO order".
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
      where: { OR: [{ status: 'running' }, { upscaleStatus: 'running' }, { interpStatus: 'running' }] },
    });
    const ttsActive = await this.prisma.tTSJob.count({
      where: { status: 'running' },
    });
    const bgmActive = await this.prisma.audioRenderJob.count({
      where: { status: 'running' },
    });
    // Anchor portrait renders share the same single-slot serialisation as
    // every other GPU job. Cast keeps the build green until Prisma client is
    // regenerated to know about anchor_render_jobs.
    const anchorActive = await (this.prisma as any).anchorRenderJob.count({
      where: { status: 'running' },
    });
    // Image-validation (Ollama vision) shares the single GPU slot too — it needs
    // ComfyUI OFF, so it must never run concurrently with a ComfyUI job.
    const validationActive = await (this.prisma as any).imageValidationJob.count({
      where: { status: 'running' },
    });
    // Anchor-validation (Ollama vision) shares the same single GPU slot — same
    // ComfyUI-off arbitration as image-validation.
    const anchorValidationActive = await (this.prisma as any).anchorValidationJob.count({
      where: { status: 'running' },
    });
    if (trainingActive > 0 || datasetActive > 0 || sceneActive > 0 || videoActive > 0 || ttsActive > 0 || bgmActive > 0 || anchorActive > 0 || validationActive > 0 || anchorValidationActive > 0) return;

    // ── 3. Pick oldest pending across all queues ───────────────────────────
    const [nextTraining, nextDataset, nextScene, nextVideo, nextUpscale, nextInterp, nextTTS, nextBgm, nextAnchor, nextValidation, nextAnchorValidation] = await Promise.all([
      this.prisma.trainingJob.findFirst({ where: { status: 'pending' }, orderBy: { queuedAt: 'asc' } }),
      this.datasets.findNextPending(),
      this.scenes.findNextPending(),
      this.videos.findNextPending(),
      this.videos.findNextPendingUpscale(),
      this.videos.findNextPendingInterp(),
      this.tts.findNextPending(),
      this.bgm.findNextPending(),
      this.anchors.findNextPending(),
      this.validation.findNextPending(),
      this.anchorValidation.findNextPending(),
    ]);

    type Pick = { type: 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale' | 'video_interp' | 'tts' | 'bgm' | 'anchor' | 'validation' | 'anchor_validation'; id: string; ts: number };
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
    if (nextInterp)   candidates.push({
      type: 'video_interp',
      id:   nextInterp.id,
      // Interp FIFO uses interpQueuedAt — same rationale as upscaleQueuedAt.
      ts:   (nextInterp.interpQueuedAt ?? nextInterp.queuedAt).getTime(),
    });
    if (nextTTS)      candidates.push({ type: 'tts',      id: nextTTS.id,      ts: nextTTS.queuedAt.getTime() });
    if (nextBgm)      candidates.push({ type: 'bgm',      id: nextBgm.id,      ts: nextBgm.queuedAt.getTime() });
    if (nextAnchor)   candidates.push({ type: 'anchor',   id: nextAnchor.id,   ts: nextAnchor.queuedAt.getTime() });
    if (nextValidation) candidates.push({ type: 'validation', id: nextValidation.id, ts: nextValidation.queuedAt.getTime() });
    if (nextAnchorValidation) candidates.push({ type: 'anchor_validation', id: nextAnchorValidation.id, ts: nextAnchorValidation.queuedAt.getTime() });
    if (candidates.length === 0) return;

    candidates.sort((a, b) => a.ts - b.ts);
    const winner = candidates[0];

    if (winner.type === 'training')           await this.dispatchTraining(winner.id);
    else if (winner.type === 'dataset')       await this.dispatchDataset(winner.id);
    else if (winner.type === 'scene')         await this.dispatchScene(winner.id);
    else if (winner.type === 'video')         await this.dispatchVideo(winner.id);
    else if (winner.type === 'video_upscale') await this.dispatchVideoUpscale(winner.id);
    else if (winner.type === 'video_interp')  await this.dispatchVideoInterp(winner.id);
    else if (winner.type === 'tts')           await this.dispatchTTS(winner.id);
    else if (winner.type === 'bgm')           await this.dispatchBgm(winner.id);
    else if (winner.type === 'anchor')        await this.dispatchAnchor(winner.id);
    else if (winner.type === 'validation')    await this.dispatchValidation(winner.id);
    else                                       await this.dispatchAnchorValidation(winner.id);
  }

  /**
   * Dispatch an anchor-validation job. Same OPPOSITE arbitration as image
   * validation: stop ComfyUI so the whole GPU is free for the Ollama vision
   * model, mark running synchronously so the next tick sees the held slot, then
   * fire the async scoring (which self-updates the row to completed/failed).
   */
  private async dispatchAnchorValidation(jobId: string): Promise<void> {
    this.logger.log(`Dispatching anchor validation ${jobId} — stopping ComfyUI first to free the GPU`);
    try {
      await this.engine.stopComfy();
    } catch (e: any) {
      this.logger.warn(`stopComfy failed (proceeding anyway): ${e.message}`);
    }
    await (this.prisma as any).anchorValidationJob.update({
      where: { id: jobId },
      data:  { status: 'running', startedAt: new Date() },
    });
    void this.anchorValidation.run(jobId).catch((e) => {
      this.logger.error(`anchor validation run ${jobId} threw: ${e?.message ?? e}`);
    });
  }

  /**
   * Dispatch an image-validation job. OPPOSITE arbitration to ComfyUI jobs:
   * stop ComfyUI first so the whole GPU is free for the Ollama vision model
   * (mirrors dispatchTraining). We mark the job `running` synchronously BEFORE
   * firing the async scoring, so the very next tick sees the held slot and
   * doesn't double-dispatch. The scoring self-updates the row to completed/failed.
   */
  private async dispatchValidation(jobId: string): Promise<void> {
    this.logger.log(`Dispatching image validation ${jobId} — stopping ComfyUI first to free the GPU`);
    try {
      await this.engine.stopComfy();
    } catch (e: any) {
      this.logger.warn(`stopComfy failed (proceeding anyway): ${e.message}`);
    }
    await (this.prisma as any).imageValidationJob.update({
      where: { id: jobId },
      data:  { status: 'running', startedAt: new Date() },
    });
    void this.validation.run(jobId).catch((e) => {
      this.logger.error(`validation run ${jobId} threw: ${e?.message ?? e}`);
    });
  }

  /**
   * Dispatch an anchor portrait render. Auto-starts ComfyUI if needed (cold
   * start ~30-60s) — same arbitration as scene/dataset/video/bgm jobs.
   */
  private async dispatchAnchor(jobId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('anchor', jobId))) return;
    this.logger.log(`Dispatching anchor render ${jobId} via ComfyUI`);
    await this.anchors.dispatchPending(jobId);
  }

  /**
   * Dispatch a pending TTS job. Fire-and-forget like training — the python
   * subprocess updates the row's status, and the next tick observes
   * `status='running'` to keep the global serialisation slot held.
   */
  private async dispatchTTS(jobId: string): Promise<void> {
    this.logger.log(`Dispatching TTS job ${jobId}`);
    void this.tts.dispatchPending(jobId).catch((e) => {
      this.logger.error(`tts dispatchPending ${jobId} threw: ${e?.message ?? e}`);
    });
  }

  private async dispatchVideo(videoId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('video', videoId))) return;
    this.logger.log(`Dispatching video render ${videoId} via ComfyUI`);
    await this.videos.dispatchPending(videoId);
  }

  private async dispatchBgm(jobId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('bgm', jobId))) return;
    this.logger.log(`Dispatching BGM (ACE-Step) job ${jobId} via ComfyUI`);
    await this.bgm.dispatchPending(jobId);
  }

  private async dispatchVideoUpscale(videoId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('video_upscale', videoId))) return;
    this.logger.log(`Dispatching video upscale ${videoId} via ComfyUI`);
    await this.videos.dispatchPendingUpscale(videoId);
  }

  private async dispatchVideoInterp(videoId: string): Promise<void> {
    if (!(await this.ensureComfyAlive('video_interp', videoId))) return;
    this.logger.log(`Dispatching video FPS interpolation ${videoId} via ComfyUI`);
    await this.videos.dispatchPendingInterp(videoId);
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
    jobType: 'dataset' | 'scene' | 'video' | 'video_upscale' | 'video_interp' | 'bgm' | 'anchor',
    jobId: string,
  ): Promise<boolean> {
    if (await this.engine.isComfyAlive()) return true;
    this.logger.log(`${jobType} job ${jobId} needs ComfyUI — auto-starting…`);
    // Free the vision model's VRAM first — validation and ComfyUI can't both
    // hold the 16 GB card. Best-effort; no-op if nothing is loaded.
    await this.engine.unloadOllama();
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
      } else if (jobType === 'video_upscale') {
        await this.prisma.videoRender.update({
          where: { id: jobId },
          data:  { upscaleStatus: 'failed', upscaleErrorMessage: errMsg, upscaleCompletedAt: ts },
        });
      } else if (jobType === 'video_interp') {
        await this.prisma.videoRender.update({
          where: { id: jobId },
          data:  { interpStatus: 'failed', interpErrorMessage: errMsg, interpCompletedAt: ts },
        });
      } else if (jobType === 'anchor') {
        await (this.prisma as any).anchorRenderJob.update({
          where: { id: jobId },
          data:  { status: 'failed', errorMessage: errMsg, completedAt: ts },
        });
      } else {
        await this.prisma.audioRenderJob.update({
          where: { id: jobId },
          data:  { status: 'failed', errorMessage: errMsg, completedAt: ts },
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
