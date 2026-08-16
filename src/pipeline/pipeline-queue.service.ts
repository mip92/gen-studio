import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetQueueService } from '../generation/dataset-queue.service';
import { SceneRenderService } from '../generation/scenes/scene-render.service';
import { VideoRenderService } from '../generation/videos/video-render.service';
import { EndFrameService } from '../generation/endframes/end-frame.service';
import { TrainingService } from '../training/training.service';
import { TTSService } from '../tts/tts.service';
import { BgmRenderService } from '../bgm/bgm-render.service';
import { AnchorRenderService } from '../characters/anchor-render.service';
import { PropAnchorService } from '../props/prop-anchor.service';
import { ThumbnailRenderService } from '../thumbnails/thumbnail-render.service';
import { AnchorValidationService } from '../validation/anchor-validation.service';
import { VoValidationService } from '../validation/vo-validation.service';
import { ImageQcService } from '../validation/image-qc.service';
import { VideoQcService } from '../validation/video-qc.service';
import { YoutubeCaptionsService } from '../youtube/youtube-captions.service';
import { EngineService } from './engine.service';
import { QueueLedgerService, QueueEntryRow } from './queue-ledger.service';
import { QueueSourceService } from './queue-source.service';
import { needsComfyStopped } from './queue-entry.types';

const POLL_MS = 5_000;

/** A captioning subprocess that hasn't moved this long is presumed hung. */
const CAPTIONING_HANG_THRESHOLD_MS = 15 * 60 * 1000;   // 15 min

/** A kohya training that hasn't written to train.log this long is presumed hung. */
const TRAINING_LOG_STALL_MS = 20 * 60 * 1000;          // 20 min

/**
 * Single orchestrator for ALL GPU-using work: one job at a time, across every
 * job type, in one order.
 *
 * Ordering and history both live in `queue_entries` (QueueLedgerService). This
 * service no longer merges twelve tables in memory to guess the order, and no
 * longer reorders anything by rewriting timestamps — it asks the ledger which
 * entry is next, claims the slot atomically, arbitrates the engine, and hands
 * the work to the owning service.
 *
 * Order is taken literally: whatever sits at the head of the queue runs next.
 * Checkpoint batching (alternating workflows costs ComfyUI a model reload,
 * ~2.5 min instead of ~30 s) is arranged when work is ENQUEUED — new entries are
 * filed behind their own workflow group — so nothing has to be reordered here,
 * and the queue on screen is the queue that runs.
 *
 * Failure isolation: a failed job is closed as failed and the queue moves on.
 * Hang detection force-fails jobs whose subprocesses died silently, and the
 * ledger reconciles itself against the job tables every tick, so a missed
 * completion costs one tick instead of stalling the line.
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
    private readonly endFrames: EndFrameService,
    private readonly training: TrainingService,
    private readonly tts:      TTSService,
    private readonly bgm:      BgmRenderService,
    private readonly anchors:  AnchorRenderService,
    private readonly propAnchors: PropAnchorService,
    private readonly thumbnails: ThumbnailRenderService,
    private readonly anchorValidation: AnchorValidationService,
    private readonly voValidation: VoValidationService,
    private readonly imageQc: ImageQcService,
    private readonly videoQc: VideoQcService,
    private readonly captions: YoutubeCaptionsService,
    private readonly engine:   EngineService,
    private readonly ledger:   QueueLedgerService,
    private readonly source:   QueueSourceService,
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
    await this.propAnchors.pollRunning();
    await this.thumbnails.pollRunning();
    await this.detectHungJobs();
    // Bring the ledger back in line with the job tables before reading the slot:
    // closes entries whose work already finished, releases dead claims, adopts
    // rows that started outside the queue.
    await this.ledger.reconcileLive();

    // ── 2. Is the single slot free? ────────────────────────────────────────
    // One indexed query, guaranteed by a partial unique index to match at most
    // one row — this replaces the ten separate per-table `count(running)` calls.
    if (await this.ledger.running()) return;

    // ── 3. Who's next? ────────────────────────────────────────────────────
    const winner = await this.ledger.selectNext();
    if (!winner) return;

    // Reserve the slot BEFORE arbitrating engines: starting or stopping ComfyUI
    // can take up to two minutes, and the slot must not look free meanwhile.
    if (!await this.ledger.claim(winner.id)) {
      this.logger.warn(`claim lost for ${winner.jobType}/${winner.jobId} — retrying next tick`);
      return;
    }

    if (!await this.prepareEngine(winner)) return;
    await this.dispatch(winner);
  }

  /**
   * Make the GPU ready for this entry's engine class.
   *
   * ComfyUI jobs need it alive (cold start ~30-60 s, auto-started); the vision
   * model, whisper and kohya need it gone — they cannot share the 16 GB card.
   * One switch on `engineClass` replaces the eight near-identical dispatch
   * wrappers this service used to carry.
   *
   * Returns false when the engine could not be prepared, having already failed
   * the job in both its own table and the ledger — the slot is freed and the
   * queue moves on next tick.
   */
  private async prepareEngine(e: QueueEntryRow): Promise<boolean> {
    const cls = e.engineClass as any;

    if (cls === 'standalone') return true;   // TTS subprocess: no arbitration

    if (needsComfyStopped(cls)) {
      this.logger.log(`Dispatching ${e.jobType} ${e.jobId} (${e.label}) — stopping ComfyUI to free the GPU`);
      try { await this.engine.stopComfy(); }
      catch (err: any) { this.logger.warn(`stopComfy failed (proceeding anyway): ${err.message}`); }

      // An ollama-class job needs the server actually running, not merely the
      // card free. Nothing used to start it, so a down Ollama meant the job
      // reached its `fetch` and died instantly — the whole point of arbitrating
      // engines is defeated if we free the GPU for a service that isn't there.
      // Started here (not at boot) so a run with no vision work never pays for
      // it. Consecutive ollama jobs cost nothing: this is a no-op once alive.
      if (cls === 'ollama') {
        try {
          const { alreadyAlive } = await this.engine.startOllama();
          if (!alreadyAlive) this.logger.log('Ollama was down — started it for this job');
        } catch (err: any) {
          const msg = `Ollama could not be started: ${err.message}`;
          this.logger.error(`${e.jobType} ${e.jobId}: ${msg}`);
          await this.source.fail(e.jobType, e.jobId, msg);
          await this.ledger.close(e.jobType, e.jobId, { status: 'failed', errorMessage: msg });
          return false;
        }
      }
      return true;
    }

    // engineClass === 'comfy'
    if (await this.engine.isComfyAlive()) return true;
    this.logger.log(`${e.jobType} ${e.jobId} needs ComfyUI — auto-starting…`);
    // Free the vision model's VRAM first; ComfyUI and Ollama can't both hold the
    // card. Best-effort, no-op when nothing is loaded.
    await this.engine.unloadOllama();
    try {
      await this.engine.startComfy();
      return true;
    } catch (err: any) {
      const msg = `ComfyUI auto-start failed: ${err.message}`;
      this.logger.error(`startComfy failed for ${e.jobType} ${e.jobId}: ${err.message}`);
      await this.source.fail(e.jobType, e.jobId, msg);
      await this.ledger.close(e.jobType, e.jobId, { status: 'failed', errorMessage: msg });
      return false;
    }
  }

  /**
   * Hand the claimed work to the service that owns it.
   *
   * Long-running, self-managing jobs (training, TTS, the vision passes, caption
   * transcription) are fired and forgotten: they update their own row, and the
   * ledger's reconcile pass closes the entry from that row's terminal state.
   */
  private async dispatch(e: QueueEntryRow): Promise<void> {
    this.logger.log(`Dispatching ${e.jobType} ${e.jobId} — ${e.label} [${e.groupKey}]`);
    try {
      switch (e.jobType) {
        case 'training':
          // runPipeline is long-running and self-managing.
          void this.training.runPipeline(e.jobId).catch((err) =>
            this.logger.error(`runPipeline ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'dataset':    await this.datasets.dispatchPending(e.jobId); return;
        case 'scene':      await this.scenes.dispatchPending(e.jobId);   return;
        // Qwen edit that makes a shot's LAST frame for the two-frame video flow.
        case 'end_frame':  await this.endFrames.dispatchPending(e.jobId); return;
        case 'video':      await this.videos.dispatchPending(e.jobId);   return;
        // ONE queue job for the combined upscale→RIFE pass: a single ComfyUI
        // prompt yields both the FHD and the smooth clip.
        case 'video_post': await this.videos.dispatchPendingUpscale(e.jobId); return;
        case 'bgm':        await this.bgm.dispatchPending(e.jobId);      return;
        case 'anchor':     await this.anchors.dispatchPending(e.jobId);  return;
        // Props are their own entity — own service, own job table (2026-08-01).
        case 'prop_anchor': await this.propAnchors.dispatchPending(e.jobId); return;
        case 'thumbnail':  await this.thumbnails.dispatchPending(e.jobId); return;
        case 'thumbnail_ideas':
          await this.markSourceRunning('thumbnailIdeaJob', e.jobId);
          void this.thumbnails.runIdeaJob(e.jobId).catch((err) =>
            this.logger.error(`thumbnail ideas ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'tts':
          void this.tts.dispatchPending(e.jobId).catch((err) =>
            this.logger.error(`tts dispatchPending ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'validation': {
          // Retired 2026-08-07 (replaced by 'image_qc'). A pending entry can
          // only be a leftover from before the cutover — close it so it never
          // stalls the queue.
          const msg = 'image validation retired — заменена на image_qc';
          await this.prisma.$executeRaw`
            UPDATE image_validation_jobs SET status = 'failed', "errorMessage" = ${msg}, "completedAt" = now()
            WHERE id = ${e.jobId} AND status IN ('pending', 'running')`.catch(() => {});
          await this.ledger.close('validation', e.jobId, { status: 'cancelled', errorMessage: msg });
          return;
        }
        case 'image_qc':
          await this.markSourceRunning('imageQcRun', e.jobId);
          void this.imageQc.run(e.jobId).catch((err) =>
            this.logger.error(`image qc run ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'video_qc':
          await this.markSourceRunning('videoQcRun', e.jobId);
          void this.videoQc.run(e.jobId).catch((err) =>
            this.logger.error(`video qc run ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'anchor_validation':
          await this.markSourceRunning('anchorValidationJob', e.jobId);
          void this.anchorValidation.run(e.jobId).catch((err) =>
            this.logger.error(`anchor validation run ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'caption':
          await this.markSourceRunning('captionJob', e.jobId);
          void this.captions.run(e.jobId).catch((err) =>
            this.logger.error(`caption run ${e.jobId} threw: ${err?.message ?? err}`));
          return;
        case 'vo_validation':
          await this.markSourceRunning('voValidationRun', e.jobId);
          void this.voValidation.run(e.jobId).catch((err) =>
            this.logger.error(`vo validation run ${e.jobId} threw: ${err?.message ?? err}`));
          return;
      }
    } catch (err: any) {
      // The owning service normally records its own failure; this catches the
      // case where dispatch blew up before it could.
      const msg = `dispatch failed: ${err?.message ?? err}`;
      this.logger.error(`${e.jobType} ${e.jobId}: ${msg}`);
      await this.source.fail(e.jobType, e.jobId, msg);
      await this.ledger.close(e.jobType, e.jobId, { status: 'failed', errorMessage: msg });
    }
  }

  /**
   * Mark a fire-and-forget job's own row `running` before launching it, so the
   * row and the claimed queue entry agree immediately (the reconcile pass would
   * otherwise see a running entry over a pending row).
   */
  private async markSourceRunning(delegate: string, jobId: string): Promise<void> {
    await (this.prisma as any)[delegate].update({
      where: { id: jobId },
      data:  { status: 'running', startedAt: new Date() },
    });
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
    await this.ledger.close('training', jobId, { status: 'failed', errorMessage: reason });
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
