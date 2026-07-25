import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { EngineService } from './engine.service';
import { PipelineQueueService } from './pipeline-queue.service';
import { QueueLedgerService } from './queue-ledger.service';
import { QueueSourceService } from './queue-source.service';

/**
 * Runs once at backend startup:
 *   1. Kill any orphaned kohya processes left from a previous backend instance.
 *   2. Resolve jobs that were in flight when the process died, so the single
 *      queue slot is never pinned by a corpse. Without this, the FATHER_BASE
 *      9 May incident repeats: backend restarts mid-captioning, the Python child
 *      dies, the row stays `captioning` forever, the queue blocks.
 *   3. Start the unified pipeline worker.
 *
 * Step 2 is driven by the queue ledger rather than by a hand-written list of
 * tables, so it covers every job type — including TTS, BGM, anchor renders and
 * caption jobs, which previously had no boot recovery at all and could sit at
 * `running` indefinitely after an unlucky restart.
 */
@Injectable()
export class PipelineBootService implements OnModuleInit {
  private readonly logger = new Logger(PipelineBootService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly engine:   EngineService,
    private readonly comfy:    ComfyService,
    private readonly queue:    PipelineQueueService,
    private readonly ledger:   QueueLedgerService,
    private readonly source:   QueueSourceService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.killOrphanedSubprocesses();
    await this.resolveInterruptedJobs();
    this.queue.start();
  }

  private async killOrphanedSubprocesses(): Promise<void> {
    const kohyaPids = this.engine.killAllOrphanedKohya();
    if (kohyaPids.length > 0) {
      this.logger.warn(`Boot: killed ${kohyaPids.length} orphaned kohya process(es)`);
    }
  }

  /**
   * Decide the fate of every job that was mid-flight at shutdown.
   *
   * ComfyUI is a separate process, so a render can genuinely have survived (or
   * even finished) while the backend was down. Anything ComfyUI still knows
   * about is left `running` for the normal pollers to harvest; everything else —
   * in-process work, dead subprocesses, prompts ComfyUI has forgotten — is
   * failed so the queue can move on.
   */
  private async resolveInterruptedJobs(): Promise<void> {
    const reason = 'Backend restarted while job was active — marked failed by boot cleanup';
    const running = await this.ledger.byStatus('running');
    let recovered = 0;
    let failed    = 0;

    for (const e of running) {
      if (await this.survivedInComfy(e.comfyPromptId)) {
        recovered++;
        continue;
      }
      await this.source.fail(e.jobType, e.jobId, reason);
      await this.ledger.close(e.jobType, e.jobId, { status: 'failed', errorMessage: reason });
      failed++;
    }

    if (recovered > 0) this.logger.log(`Boot: ${recovered} job(s) still alive in ComfyUI — left running for the pollers`);
    if (failed    > 0) this.logger.warn(`Boot: failed ${failed} interrupted job(s)`);

    // Legacy safety net: rows that were left `running` by a build that predates
    // the ledger have no queue entry to reconcile, so nothing above would ever
    // free them. Sweep them once here, using the same ComfyUI-survival test.
    await this.sweepLedgerlessRunningRows(reason);
  }

  /** True when ComfyUI still has this prompt queued, running, or finished with outputs. */
  private async survivedInComfy(promptId: string | null): Promise<boolean> {
    if (!promptId) return false;
    const placement = await this.comfy.promptPlacement(promptId).catch(() => 'unknown' as const);
    if (placement === 'running' || placement === 'pending') return true;
    const h = await this.comfy.getHistory(promptId).catch(() => null);
    return !!h?.status?.completed;
  }

  /**
   * One-time bridge for rows that were mid-flight across the cutover to the
   * ledger. Any `running` job row without a live queue entry is unreachable by
   * the reconcile pass, so resolve it here and let the ledger record the outcome.
   */
  private async sweepLedgerlessRunningRows(reason: string): Promise<void> {
    const p = this.prisma as any;
    const scans: Array<[string, string, Record<string, unknown>]> = [
      ['scene',             'sceneRenderJob',      { status: 'running' }],
      ['video',             'videoRender',         { status: 'running' }],
      ['video_post',        'videoRender',         { upscaleStatus: 'running' }],
      ['tts',               'tTSJob',              { status: 'running' }],
      ['bgm',               'audioRenderJob',      { status: 'running' }],
      ['anchor',            'anchorRenderJob',     { status: 'running' }],
      ['validation',        'imageValidationJob',  { status: 'running' }],
      ['anchor_validation', 'anchorValidationJob', { status: 'running' }],
      ['caption',           'captionJob',          { status: 'running' }],
      ['dataset',           'datasetJob',          { status: 'running' }],
      ['training',          'trainingJob',         { status: { in: ['preparing', 'captioning', 'training'] } }],
    ];

    let swept = 0;
    for (const [jobType, delegate, where] of scans) {
      const rows = await p[delegate].findMany({ where }).catch(() => []);
      for (const row of rows) {
        if (await this.ledger.findLive(jobType as any, row.id)) continue;  // handled above
        const promptId = jobType === 'video_post' ? row.upscalePromptId : row.comfyPromptId;
        if (await this.survivedInComfy(promptId ?? null)) continue;
        await this.source.fail(jobType as any, row.id, reason);
        await this.ledger.close(jobType as any, row.id, { status: 'failed', errorMessage: reason });
        swept++;
      }
    }
    if (swept > 0) this.logger.warn(`Boot: resolved ${swept} pre-ledger running row(s)`);
  }
}
