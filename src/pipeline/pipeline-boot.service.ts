import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { EngineService } from './engine.service';
import { PipelineQueueService } from './pipeline-queue.service';

/**
 * Runs once at backend startup:
 *   1. Kill any orphaned kohya processes left from a previous backend instance.
 *   2. Mark zombie jobs (status `running`/`preparing`/`captioning`/`training`)
 *      as `failed` so the queue can move past them. Without this, the FATHER_BASE
 *      9 May incident would repeat: backend restarts mid-captioning, the Python
 *      child dies, the DB row stays at `captioning` forever, queue blocks.
 *   3. Start the unified pipeline worker.
 */
@Injectable()
export class PipelineBootService implements OnModuleInit {
  private readonly logger = new Logger(PipelineBootService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly engine:   EngineService,
    private readonly comfy:    ComfyService,
    private readonly queue:    PipelineQueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.killOrphanedSubprocesses();
    await this.failZombieJobs();
    this.queue.start();
  }

  private async killOrphanedSubprocesses(): Promise<void> {
    const kohyaPids = this.engine.killAllOrphanedKohya();
    if (kohyaPids.length > 0) {
      this.logger.warn(`Boot: killed ${kohyaPids.length} orphaned kohya process(es)`);
    }
  }

  private async failZombieJobs(): Promise<void> {
    const reason = 'Backend restarted while job was active — marked failed by boot cleanup';
    const completedAt = new Date();

    const tr = await this.prisma.trainingJob.updateMany({
      where: { status: { in: ['preparing', 'captioning', 'training'] } },
      data:  { status: 'failed', errorMessage: reason, completedAt },
    });
    if (tr.count > 0) this.logger.warn(`Boot: failed ${tr.count} zombie training job(s)`);

    const ds = await this.prisma.datasetJob.updateMany({
      where: { status: 'running' },
      data:  { status: 'failed', errorMessage: reason, completedAt },
    });
    if (ds.count > 0) this.logger.warn(`Boot: failed ${ds.count} zombie dataset job(s)`);

    // Scene jobs are special: ComfyUI may have actually finished the prompt
    // before we restarted. Don't naively fail them — peek at ComfyUI history;
    // if the prompt completed with outputs, leave the job at 'running' so the
    // pipeline tick's pollRunning() picks it up and moves the files normally.
    // Only fail jobs that ComfyUI never actually produced anything for.
    const sceneRunning = await this.prisma.sceneRenderJob.findMany({ where: { status: 'running' } });
    let sceneRecovered = 0;
    let sceneFailed    = 0;
    for (const j of sceneRunning) {
      let comfyHasOutputs = false;
      if (j.comfyPromptId) {
        const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
        comfyHasOutputs = !!h?.status?.completed && Object.values(h.outputs ?? {}).some((o: any) => (o.images?.length ?? 0) > 0);
      }
      if (comfyHasOutputs) {
        // Leave at 'running' — next tick's pollRunning() will harvest the outputs.
        sceneRecovered++;
      } else {
        await this.prisma.sceneRenderJob.update({
          where: { id: j.id },
          data:  { status: 'failed', errorMessage: reason, completedAt },
        });
        sceneFailed++;
      }
    }
    if (sceneRecovered > 0) this.logger.log(`Boot: ${sceneRecovered} scene job(s) recoverable from ComfyUI history — left running`);
    if (sceneFailed    > 0) this.logger.warn(`Boot: failed ${sceneFailed} zombie scene render job(s)`);
  }
}
