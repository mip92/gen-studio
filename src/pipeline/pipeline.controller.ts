import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

type JobType = 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale' | 'tts';

interface QueueRow {
  type:          JobType;
  id:            string;
  status:        string;
  /** For training/dataset: the character profile. For scene/video: shotCode. */
  profileCode:   string;
  /** For training/dataset: the character code. For scene/video: scene title or sceneKey. */
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
const ACTIVE_VIDEO    = ['running'];
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
    const profileInclude  = { profile: { include: { character: { include: { project: true } } } } };
    const shotInclude     = { shot: { include: { project: true, scene: true } } };
    const activeStatuses  = ['pending', 'blocked', 'preparing', 'captioning', 'training', 'running'];

    // Fetch ALL non-terminal jobs (small set; never capped). Recent terminals
    // come from a separate query with a small limit (most-recent N by completion).
    const sceneInclude = { scene: { include: { project: true } } };
    const [trA, dsA, scA, vrA, ttsA] = await Promise.all([
      this.prisma.trainingJob.findMany({   where: { status: { in: activeStatuses } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.datasetJob.findMany({    where: { status: { in: activeStatuses } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.sceneRenderJob.findMany({ where: { status: { in: activeStatuses } }, include: shotInclude,   orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({
        where: { OR: [
          { status: { in: ['pending', 'running'] } },
          { upscaleStatus: { in: ['pending', 'running'] } },
        ] },
        include: shotInclude,
        orderBy: { queuedAt: 'asc' },
      }),
      this.prisma.tTSJob.findMany({ where: { status: { in: activeStatuses } }, include: sceneInclude, orderBy: { queuedAt: 'asc' } }),
    ]);

    const [trR, dsR, scR, vrR, ttsR] = await Promise.all([
      this.prisma.trainingJob.findMany({   where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: 50 }),
      this.prisma.datasetJob.findMany({    where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: 50 }),
      this.prisma.sceneRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: shotInclude,   orderBy: { completedAt: 'desc' }, take: 50 }),
      this.prisma.videoRender.findMany({
        where: { OR: [
          { status: { in: TERMINAL } },
          { upscaleStatus: { in: TERMINAL } },
        ] },
        include: shotInclude,
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      this.prisma.tTSJob.findMany({ where: { status: { in: TERMINAL } }, include: sceneInclude, orderBy: { completedAt: 'desc' }, take: 50 }),
    ]);

    // Each VideoRender row contributes up to two queue rows: main render + upscale.
    const videoActive = [
      ...vrA.map((j) => normalizeVideo(j)),
      ...vrA.filter((j) => j.upscaleStatus !== null).map((j) => normalizeVideoUpscale(j)),
    ];
    const videoRecent = [
      ...vrR.filter((j) => TERMINAL.includes(j.status)).map((j) => normalizeVideo(j)),
      ...vrR.filter((j) => j.upscaleStatus !== null && TERMINAL.includes(j.upscaleStatus)).map((j) => normalizeVideoUpscale(j)),
    ];

    const allActive: QueueRow[] = [
      ...trA.map(normalizeTraining),
      ...dsA.map(normalizeDataset),
      ...scA.map(normalizeScene),
      ...videoActive,
      ...ttsA.map(normalizeTTS),
    ];
    const allRecent: QueueRow[] = [
      ...trR.map(normalizeTraining),
      ...dsR.map(normalizeDataset),
      ...scR.map(normalizeScene),
      ...videoRecent,
      ...ttsR.map(normalizeTTS),
    ];

    const active  = allActive.filter((r) => isActive(r));
    const pending = allActive.filter((r) => r.status === 'pending' || r.status === 'blocked')
                             .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
    const recent  = allRecent.filter((r) => TERMINAL.includes(r.status))
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

  /** Cancel a pending or running job (works across all types). */
  @Post('queue/:type/:id/cancel')
  @ApiOperation({ summary: 'Cancel a queue job (pending or running)' })
  async cancel(@Param('type') type: string, @Param('id') id: string) {
    if (type !== 'training' && type !== 'dataset' && type !== 'scene' && type !== 'video' && type !== 'video_upscale') {
      throw new BadRequestException(`type must be 'training', 'dataset', 'scene', 'video' or 'video_upscale'`);
    }
    const job = await this.fetchOne(type, id);
    if (TERMINAL.includes(job.status)) return job;
    const data = { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' };
    if (type === 'training')      return this.prisma.trainingJob.update({ where: { id }, data });
    if (type === 'dataset')       return this.prisma.datasetJob.update({ where: { id }, data });
    if (type === 'scene')         return this.prisma.sceneRenderJob.update({ where: { id }, data });
    if (type === 'video') {
      return this.prisma.videoRender.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
    }
    return this.prisma.videoRender.update({
      where: { id },
      data:  { upscaleStatus: 'cancelled', upscaleCompletedAt: new Date(), upscaleErrorMessage: 'Manually cancelled' },
    });
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
    if (type === 'scene') {
      const j = await this.prisma.sceneRenderJob.findUnique({
        where: { id },
        include: { shot: { include: { project: true, scene: true } } },
      });
      if (!j) throw new NotFoundException(`scene render job ${id} not found`);
      return normalizeScene(j);
    }
    const v = await this.prisma.videoRender.findUnique({
      where: { id },
      include: { shot: { include: { project: true, scene: true } } },
    });
    if (!v) throw new NotFoundException(`video render ${id} not found`);
    return type === 'video' ? normalizeVideo(v) : normalizeVideoUpscale(v);
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
  if (r.type === 'training')                              return ACTIVE_TRAINING.includes(r.status);
  if (r.type === 'dataset')                               return ACTIVE_DATASET.includes(r.status);
  if (r.type === 'scene')                                 return ACTIVE_SCENE.includes(r.status);
  return ACTIVE_VIDEO.includes(r.status);
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

function normalizeVideo(v: any): QueueRow {
  return {
    type:          'video',
    id:            v.id,
    status:        v.status,
    profileCode:   v.shot.shotCode,
    characterCode: v.shot.scene?.title ?? v.shot.scene?.sceneKey ?? '—',
    projectSlug:   v.shot.project.slug,
    triggerToken:  null,
    queuedAt:      v.queuedAt,
    startedAt:     v.startedAt ?? null,
    completedAt:   v.completedAt ?? null,
    errorMessage:  v.errorMessage ?? null,
  };
}

function normalizeVideoUpscale(v: any): QueueRow {
  return {
    type:          'video_upscale',
    id:            v.id,
    status:        v.upscaleStatus,
    profileCode:   `${v.shot.shotCode} ↑FHD`,
    characterCode: v.shot.scene?.title ?? v.shot.scene?.sceneKey ?? '—',
    projectSlug:   v.shot.project.slug,
    triggerToken:  null,
    // The upscale is queued some time after the original render. Use upscaleStartedAt
    // when available (= dispatch time), otherwise fall back to the row's queuedAt.
    queuedAt:      v.upscaleStartedAt ?? v.queuedAt,
    startedAt:     v.upscaleStartedAt ?? null,
    completedAt:   v.upscaleCompletedAt ?? null,
    errorMessage:  v.upscaleErrorMessage ?? null,
  };
}

function normalizeTTS(j: any): QueueRow {
  return {
    type:          'tts',
    id:            j.id,
    status:        j.status,
    profileCode:   `🔊 ${j.voice}`,
    characterCode: j.scene?.title ?? j.scene?.sceneKey ?? '—',
    projectSlug:   j.scene?.project?.slug ?? '—',
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
  };
}
