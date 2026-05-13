import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

type JobType = 'training' | 'dataset' | 'scene';

interface QueueRow {
  type:          JobType;
  id:            string;
  status:        string;
  /** For training/dataset: the character profile. For scene: shotCode. */
  profileCode:   string;
  /** For training/dataset: the character code. For scene: scene title or sceneKey. */
  characterCode: string;
  projectSlug:   string;
  triggerToken:  string | null;
  queuedAt:      Date;
  startedAt:     Date | null;
  completedAt:   Date | null;
  errorMessage:  string | null;
}

const ACTIVE_TRAINING = ['preparing', 'captioning', 'training'];
const ACTIVE_DATASET  = ['running'];
const ACTIVE_SCENE    = ['running'];
const TERMINAL        = ['completed', 'failed', 'cancelled'];

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified queue view for the UI: { active, pending, recent }, all jobs across
   * training and dataset queues normalised to one shape and sorted appropriately.
   */
  @Get('queue')
  @ApiOperation({ summary: 'Unified pipeline queue snapshot (active + pending + recent)' })
  async queue() {
    const [tr, ds, sc] = await Promise.all([
      this.prisma.trainingJob.findMany({
        include: { profile: { include: { character: { include: { project: true } } } } },
        orderBy: { queuedAt: 'asc' },
        take: 200,
      }),
      this.prisma.datasetJob.findMany({
        include: { profile: { include: { character: { include: { project: true } } } } },
        orderBy: { queuedAt: 'asc' },
        take: 200,
      }),
      this.prisma.sceneRenderJob.findMany({
        include: { shot: { include: { project: true, scene: true } } },
        orderBy: { queuedAt: 'asc' },
        take: 200,
      }),
    ]);

    const all: QueueRow[] = [
      ...tr.map((j) => normalizeTraining(j)),
      ...ds.map((j) => normalizeDataset(j)),
      ...sc.map((j) => normalizeScene(j)),
    ];

    const active  = all.filter((r) => isActive(r));
    const pending = all.filter((r) => r.status === 'pending' || r.status === 'blocked')
                      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
    const recent  = all.filter((r) => TERMINAL.includes(r.status))
                      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
                      .slice(0, 50);

    return { active, pending, recent };
  }

  /**
   * Move a pending job up or down within the unified queue. Implementation:
   * swap queuedAt with the adjacent pending job (whatever its type). Idempotent;
   * a no-op if target is already at the edge.
   */
  @Post('queue/:type/:id/move')
  @ApiOperation({ summary: 'Reorder a pending job (up/down)' })
  async move(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    if (type !== 'training' && type !== 'dataset' && type !== 'scene') {
      throw new BadRequestException(`type must be 'training', 'dataset' or 'scene', got: ${type}`);
    }
    const direction = body?.direction;
    if (direction !== 'up' && direction !== 'down') {
      throw new BadRequestException(`direction must be 'up' or 'down'`);
    }

    const target = await this.fetchOne(type, id);
    if (target.status !== 'pending') {
      throw new BadRequestException(`Only 'pending' jobs can be reordered (got: ${target.status})`);
    }

    const all = await this.collectPendingOrdered();
    const idx = all.findIndex((r) => r.type === type && r.id === id);
    if (idx === -1) throw new NotFoundException('Job is not in the pending list');

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) return { moved: false, reason: 'edge' };

    const a = all[idx];
    const b = all[swapIdx];

    // Swap queuedAt timestamps via two Prisma updates inside a transaction.
    await this.prisma.$transaction([
      this.updateQueuedAt(a.type, a.id, b.queuedAt),
      this.updateQueuedAt(b.type, b.id, a.queuedAt),
    ]);
    return { moved: true, swappedWith: { type: b.type, id: b.id } };
  }

  /** Cancel a pending or running job (works across both types). */
  @Post('queue/:type/:id/cancel')
  @ApiOperation({ summary: 'Cancel a queue job (pending or running)' })
  async cancel(@Param('type') type: string, @Param('id') id: string) {
    if (type !== 'training' && type !== 'dataset' && type !== 'scene') {
      throw new BadRequestException(`type must be 'training', 'dataset' or 'scene'`);
    }
    const job = await this.fetchOne(type, id);
    if (TERMINAL.includes(job.status)) return job;
    const data = { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' };
    if (type === 'training') return this.prisma.trainingJob.update({ where: { id }, data });
    if (type === 'dataset')  return this.prisma.datasetJob.update({ where: { id }, data });
    return this.prisma.sceneRenderJob.update({ where: { id }, data });
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async fetchOne(type: JobType, id: string): Promise<QueueRow> {
    if (type === 'training') {
      const j = await this.prisma.trainingJob.findUnique({
        where: { id },
        include: { profile: { include: { character: { include: { project: true } } } } },
      });
      if (!j) throw new NotFoundException(`training job ${id} not found`);
      return normalizeTraining(j);
    }
    if (type === 'dataset') {
      const j = await this.prisma.datasetJob.findUnique({
        where: { id },
        include: { profile: { include: { character: { include: { project: true } } } } },
      });
      if (!j) throw new NotFoundException(`dataset job ${id} not found`);
      return normalizeDataset(j);
    }
    const j = await this.prisma.sceneRenderJob.findUnique({
      where: { id },
      include: { shot: { include: { project: true, scene: true } } },
    });
    if (!j) throw new NotFoundException(`scene render job ${id} not found`);
    return normalizeScene(j);
  }

  private async collectPendingOrdered(): Promise<QueueRow[]> {
    const [tr, ds, sc] = await Promise.all([
      this.prisma.trainingJob.findMany({
        where:   { status: 'pending' },
        include: { profile: { include: { character: { include: { project: true } } } } },
        orderBy: { queuedAt: 'asc' },
      }),
      this.prisma.datasetJob.findMany({
        where:   { status: 'pending' },
        include: { profile: { include: { character: { include: { project: true } } } } },
        orderBy: { queuedAt: 'asc' },
      }),
      this.prisma.sceneRenderJob.findMany({
        where:   { status: 'pending' },
        include: { shot: { include: { project: true, scene: true } } },
        orderBy: { queuedAt: 'asc' },
      }),
    ]);
    return [...tr.map(normalizeTraining), ...ds.map(normalizeDataset), ...sc.map(normalizeScene)]
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
  }

  private updateQueuedAt(type: JobType, id: string, queuedAt: Date) {
    if (type === 'training') return this.prisma.trainingJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'dataset')  return this.prisma.datasetJob.update({ where: { id }, data: { queuedAt } });
    return this.prisma.sceneRenderJob.update({ where: { id }, data: { queuedAt } });
  }
}

function isActive(r: QueueRow): boolean {
  if (r.type === 'training') return ACTIVE_TRAINING.includes(r.status);
  if (r.type === 'dataset')  return ACTIVE_DATASET.includes(r.status);
  return ACTIVE_SCENE.includes(r.status);
}

function normalizeTraining(j: any): QueueRow {
  return {
    type:          'training',
    id:            j.id,
    status:        j.status,
    profileCode:   j.profile.profileCode,
    characterCode: j.profile.character.code,
    projectSlug:   j.profile.character.project.slug,
    triggerToken:  j.triggerToken ?? null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
  };
}

function normalizeDataset(j: any): QueueRow {
  return {
    type:          'dataset',
    id:            j.id,
    status:        j.status,
    profileCode:   j.profile.profileCode,
    characterCode: j.profile.character.code,
    projectSlug:   j.profile.character.project.slug,
    triggerToken:  j.profile.triggerToken ?? null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
  };
}

function normalizeScene(j: any): QueueRow {
  return {
    type:          'scene',
    id:            j.id,
    status:        j.status,
    profileCode:   j.shot.shotCode,
    characterCode: j.shot.scene?.title ?? j.shot.scene?.sceneKey ?? '—',
    projectSlug:   j.shot.project.slug,
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
  };
}
