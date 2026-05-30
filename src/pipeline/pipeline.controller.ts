import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

type JobType = 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale' | 'tts' | 'bgm' | 'anchor';

interface QueueRow {
  type:          JobType;
  id:            string;
  status:        string;
  /** For training/dataset: the character profile. For scene/video: shotCode. */
  profileCode:   string;
  /** For training/dataset: the character code. For scene/video: scene title or sceneKey. */
  characterCode: string;
  projectSlug:   string;
  /** Canonical project UUID. Frontend Link-builders prefer this over the slug
   *  so the URL never carries a slug that the middleware has to redirect. */
  projectId:     string | null;
  /** Shot UUID — set for scene / video / video_upscale jobs and for shot-level
   *  TTS jobs. Lets the queue UI link straight to /projects/<pid>/shots/<sid>/<tab>
   *  without an extra lookup. Null when the job has no associated shot
   *  (training / dataset / scene-level TTS / bgm). */
  shotId:        string | null;
  triggerToken:  string | null;
  queuedAt:      Date;
  startedAt:     Date | null;
  completedAt:   Date | null;
  errorMessage:  string | null;
  /** True iff this row is the head of the pending FIFO across the whole unified
   *  queue. Computed server-side per request so the client doesn't need to know
   *  about the merge ordering. False for non-pending rows. */
  isFirstPending: boolean;
  /** Mirror of isFirstPending for the tail. */
  isLastPending:  boolean;
}

const ACTIVE_STATUSES = ['pending', 'blocked', 'preparing', 'captioning', 'training', 'running'];
const TERMINAL        = ['completed', 'failed', 'cancelled'];

/** Status buckets used by the unified queue endpoint for the `finished` filter. */
const FINISHED   = TERMINAL;
const UNFINISHED = ACTIVE_STATUSES;

const SORTABLE_FIELDS = ['queuedAt', 'startedAt', 'completedAt', 'status', 'type', 'project'] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified, paginated queue list across every job type (training, dataset,
   * scene, video, video_upscale, tts). The single source of truth for the
   * /queue page and any caller that needs to look up a job by id.
   *
   * Query params (all optional):
   *   - id          → return only the row with this id (1 or 0 results)
   *   - status      → comma-separated list of status values
   *   - type        → comma-separated list of job types
   *   - finished    → 'true' = only terminal, 'false' = only active+pending
   *   - sort        → one of queuedAt|startedAt|completedAt|status|type (default queuedAt)
   *   - order       → 'asc' | 'desc' (default desc)
   *   - page        → 1-based page index (default 1)
   *   - limit       → page size, max 200 (default 50)
   */
  @Get('queue')
  @ApiOperation({ summary: 'Unified paginated queue (active + pending + finished)' })
  async queue(
    @Query('id')       id?:       string,
    @Query('status')   statusQ?:  string,
    @Query('type')     typeQ?:    string,
    @Query('project')  projectQ?: string,
    @Query('finished') finished?: string,
    @Query('sort')     sortQ?:    string,
    @Query('order')    orderQ?:   string,
    @Query('page')     pageQ?:    string,
    @Query('limit')    limitQ?:   string,
  ) {
    // ── 1. Collect rows ────────────────────────────────────────────────────
    // Always fetch every non-terminal row (small set, bounded by GPU throughput)
    // plus a generous slice of the most recent terminal rows so the user can
    // page through history without losing context. Final sort/filter/paginate
    // happens after normalization so the result is one table.
    const TERMINAL_TAKE = 500;
    // Include character.projectLinks too so library characters (Character.projectId = null)
    // still surface a project slug in the queue row — we fall back to the first attached
    // project. Without this the queue endpoint 500s on a library-character job because
    // `character.project` is null. Phase 2 will drop `Character.projectId` entirely.
    const profileInclude = {
      profile: {
        include: {
          character: {
            include: {
              project:      true,
              projectLinks: { include: { project: { select: { id: true, slug: true, name: true } } } },
            },
          },
        },
      },
    };
    const shotInclude    = { shot:    { include: { project: true, scene: true } } };
    const sceneInclude   = { scene:   { include: { project: true } } };
    const ttsInclude     = {
      scene: { include: { project: true } },
      shot:  { include: { project: true, scene: true } },
    };
    // AudioRenderJob → MusicSegment → NarrativeBlock → Project. Resolved at the
    // top of the chain so normalizeBgm can produce projectSlug + block label
    // without N+1 queries.
    const bgmInclude     = { segment: { include: { block: { include: { project: true } } } } };

    const [trA, dsA, scA, vrA, ttsA, bgmA, anA] = await Promise.all([
      this.prisma.trainingJob.findMany({    where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.datasetJob.findMany({     where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.sceneRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({
        where: { OR: [
          { status: { in: ACTIVE_STATUSES } },
          { upscaleStatus: { in: ACTIVE_STATUSES } },
        ] },
        include: shotInclude,
        orderBy: { queuedAt: 'asc' },
      }),
      this.prisma.tTSJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: ttsInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.audioRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: bgmInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
    ]);

    const [trR, dsR, scR, vrR, vrUR, ttsR, bgmR, anR] = await Promise.all([
      this.prisma.trainingJob.findMany({    where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.datasetJob.findMany({     where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.sceneRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: shotInclude,    orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      // Two separate queries for VideoRender: one ordered by `completedAt` for
      // the main render row, one ordered by `upscaleCompletedAt` for the upscale
      // row. A single query with `orderBy completedAt` mis-orders upscales
      // (whose lifecycle uses upscaleCompletedAt) and can drop them off the
      // take-window when the underlying video rendered long ago.
      this.prisma.videoRender.findMany({ where: { status: { in: TERMINAL } }, include: shotInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.videoRender.findMany({ where: { upscaleStatus: { in: TERMINAL } }, include: shotInclude, orderBy: { upscaleCompletedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.tTSJob.findMany({ where: { status: { in: TERMINAL } }, include: ttsInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.audioRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: bgmInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
    ]);

    // Each VideoRender row can contribute two queue rows (main + upscale).
    const videoActiveRows: QueueRow[] = [
      ...vrA.filter((j) => ACTIVE_STATUSES.includes(j.status)).map(normalizeVideo),
      ...vrA.filter((j) => j.upscaleStatus !== null && ACTIVE_STATUSES.includes(j.upscaleStatus)).map(normalizeVideoUpscale),
    ];
    const videoRecentRows: QueueRow[] = [
      ...vrR.map(normalizeVideo),
      ...vrUR.map(normalizeVideoUpscale),
    ];

    const all: QueueRow[] = [
      ...trA.map(normalizeTraining),
      ...dsA.map(normalizeDataset),
      ...scA.map(normalizeScene),
      ...videoActiveRows,
      ...ttsA.map(normalizeTTS),
      ...bgmA.map(normalizeBgm),
      ...anA.map(normalizeAnchor),
      ...trR.map(normalizeTraining),
      ...dsR.map(normalizeDataset),
      ...scR.map(normalizeScene),
      ...videoRecentRows,
      ...ttsR.map(normalizeTTS),
      ...bgmR.map(normalizeBgm),
      ...anR.map(normalizeAnchor),
    ];

    // ── 1b. Pending FIFO position ──────────────────────────────────────────
    // The client can't know "am I first/last among all pending rows across
    // every type?" without re-implementing the merge here. Compute it once and
    // mutate the flags on the pending rows so the UI knows when to disable
    // the ↑ / ↓ buttons.
    const pendingSorted = all
      .filter((r) => r.status === 'pending')
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
    if (pendingSorted.length > 0) {
      pendingSorted[0].isFirstPending = true;
      pendingSorted[pendingSorted.length - 1].isLastPending = true;
    }

    // ── 2. Filter ──────────────────────────────────────────────────────────
    let rows = all;

    if (id) {
      rows = rows.filter((r) => r.id === id);
    }

    if (statusQ) {
      const wanted = new Set(statusQ.split(',').map((s) => s.trim()).filter(Boolean));
      if (wanted.size > 0) rows = rows.filter((r) => wanted.has(r.status));
    }

    if (typeQ) {
      const wanted = new Set(typeQ.split(',').map((s) => s.trim()).filter(Boolean));
      if (wanted.size > 0) rows = rows.filter((r) => wanted.has(r.type));
    }

    if (projectQ) {
      const wanted = new Set(projectQ.split(',').map((s) => s.trim()).filter(Boolean));
      if (wanted.size > 0) rows = rows.filter((r) => wanted.has(r.projectSlug));
    }

    if (finished === 'true') {
      rows = rows.filter((r) => FINISHED.includes(r.status));
    } else if (finished === 'false') {
      rows = rows.filter((r) => UNFINISHED.includes(r.status));
    }

    // ── 3. Sort ────────────────────────────────────────────────────────────
    const sort: SortField = (SORTABLE_FIELDS as readonly string[]).includes(sortQ ?? '')
      ? (sortQ as SortField)
      : 'queuedAt';
    const order: 'asc' | 'desc' = orderQ === 'asc' ? 'asc' : 'desc';
    rows.sort((a, b) => cmp(a, b, sort, order));

    // ── 4. Paginate ────────────────────────────────────────────────────────
    const total = rows.length;
    const page  = Math.max(1, parseInt(pageQ ?? '1',  10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(limitQ ?? '50', 10) || 50));
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit);

    return { rows: slice, total, page, limit, sort, order };
  }

  /**
   * Move a pending job up or down within the unified queue across every job
   * type (training/dataset/scene/video/video_upscale/tts). Implementation:
   * swap the FIFO timestamp with the adjacent pending row. For video_upscale
   * rows the FIFO key is `upscaleQueuedAt`, not the row's main `queuedAt`.
   * Idempotent — a no-op if the target is already at the edge.
   */
  @Post('queue/:type/:id/move')
  @ApiOperation({ summary: 'Reorder a pending job (up/down)' })
  async move(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' },
  ) {
    if (!isJobType(type)) {
      throw new BadRequestException(`type must be one of training|dataset|scene|video|video_upscale|tts|bgm, got: ${type}`);
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
    if (!isJobType(type)) {
      throw new BadRequestException(`type must be one of training|dataset|scene|video|video_upscale|tts|bgm, got: ${type}`);
    }
    if (type === 'tts') {
      const j = await this.prisma.tTSJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`tts job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return this.prisma.tTSJob.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
    }
    if (type === 'bgm') {
      const j = await this.prisma.audioRenderJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`bgm job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return this.prisma.audioRenderJob.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
    }
    if (type === 'anchor') {
      const j = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`anchor job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return (this.prisma as any).anchorRenderJob.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
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
        include: {
          profile: {
            include: {
              character: {
                include: {
                  project:      true,
                  projectLinks: { include: { project: { select: { id: true, slug: true, name: true } } } },
                },
              },
            },
          },
        },
      });
      if (!j) throw new NotFoundException(`training job ${id} not found`);
      return normalizeTraining(j);
    }
    if (type === 'dataset') {
      const j = await this.prisma.datasetJob.findUnique({
        where: { id },
        include: {
          profile: {
            include: {
              character: {
                include: {
                  project:      true,
                  projectLinks: { include: { project: { select: { id: true, slug: true, name: true } } } },
                },
              },
            },
          },
        },
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
    if (type === 'tts') {
      const j = await this.prisma.tTSJob.findUnique({
        where: { id },
        include: {
          scene: { include: { project: true } },
          shot:  { include: { project: true, scene: true } },
        },
      });
      if (!j) throw new NotFoundException(`tts job ${id} not found`);
      return normalizeTTS(j);
    }
    if (type === 'bgm') {
      const j = await this.prisma.audioRenderJob.findUnique({
        where: { id },
        include: { segment: { include: { block: { include: { project: true } } } } },
      });
      if (!j) throw new NotFoundException(`bgm job ${id} not found`);
      return normalizeBgm(j);
    }
    if (type === 'anchor') {
      const j = await (this.prisma as any).anchorRenderJob.findUnique({
        where: { id },
        include: {
          profile: {
            include: {
              character: {
                include: {
                  project:      true,
                  projectLinks: { include: { project: { select: { id: true, slug: true, name: true } } } },
                },
              },
            },
          },
        },
      });
      if (!j) throw new NotFoundException(`anchor job ${id} not found`);
      return normalizeAnchor(j);
    }
    const v = await this.prisma.videoRender.findUnique({
      where: { id },
      include: { shot: { include: { project: true, scene: true } } },
    });
    if (!v) throw new NotFoundException(`video render ${id} not found`);
    return type === 'video' ? normalizeVideo(v) : normalizeVideoUpscale(v);
  }

  private async collectPendingOrdered(): Promise<QueueRow[]> {
    // Include character.projectLinks too so library characters (Character.projectId = null)
    // still surface a project slug in the queue row — we fall back to the first attached
    // project. Without this the queue endpoint 500s on a library-character job because
    // `character.project` is null. Phase 2 will drop `Character.projectId` entirely.
    const profileInclude = {
      profile: {
        include: {
          character: {
            include: {
              project:      true,
              projectLinks: { include: { project: { select: { id: true, slug: true, name: true } } } },
            },
          },
        },
      },
    };
    const shotInclude    = { shot:    { include: { project: true, scene: true } } };
    const ttsInclude     = {
      scene: { include: { project: true } },
      shot:  { include: { project: true, scene: true } },
    };
    const bgmInclude = { segment: { include: { block: { include: { project: true } } } } };
    const [tr, ds, sc, vr, vrU, tts, bgm, an] = await Promise.all([
      this.prisma.trainingJob.findMany({    where: { status: 'pending' },        include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.datasetJob.findMany({     where: { status: 'pending' },        include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.sceneRenderJob.findMany({ where: { status: 'pending' },        include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({    where: { status: 'pending' },        include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({    where: { upscaleStatus: 'pending' }, include: shotInclude,    orderBy: { upscaleQueuedAt: 'asc' } }),
      this.prisma.tTSJob.findMany({         where: { status: 'pending' },        include: ttsInclude,     orderBy: { queuedAt: 'asc' } }),
      this.prisma.audioRenderJob.findMany({ where: { status: 'pending' },        include: bgmInclude,     orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: 'pending' }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
    ]);
    return [
      ...tr.map(normalizeTraining),
      ...ds.map(normalizeDataset),
      ...sc.map(normalizeScene),
      ...vr.map(normalizeVideo),
      ...vrU.map(normalizeVideoUpscale),
      ...tts.map(normalizeTTS),
      ...bgm.map(normalizeBgm),
      ...an.map(normalizeAnchor),
    ].sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
  }

  private updateQueuedAt(type: JobType, id: string, queuedAt: Date) {
    if (type === 'training')      return this.prisma.trainingJob.update({    where: { id }, data: { queuedAt } });
    if (type === 'dataset')       return this.prisma.datasetJob.update({     where: { id }, data: { queuedAt } });
    if (type === 'scene')         return this.prisma.sceneRenderJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'video')         return this.prisma.videoRender.update({    where: { id }, data: { queuedAt } });
    // video_upscale uses its own FIFO field — see normalizeVideoUpscale.
    if (type === 'video_upscale') return this.prisma.videoRender.update({    where: { id }, data: { upscaleQueuedAt: queuedAt } });
    if (type === 'bgm')           return this.prisma.audioRenderJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'anchor')        return (this.prisma as any).anchorRenderJob.update({ where: { id }, data: { queuedAt } });
    return this.prisma.tTSJob.update({ where: { id }, data: { queuedAt } });
  }
}

function isJobType(t: string): t is JobType {
  return t === 'training' || t === 'dataset' || t === 'scene'
      || t === 'video'    || t === 'video_upscale' || t === 'tts'
      || t === 'bgm'      || t === 'anchor';
}

function cmp(a: QueueRow, b: QueueRow, field: SortField, order: 'asc' | 'desc'): number {
  const dir = order === 'asc' ? 1 : -1;
  const av = fieldValue(a, field);
  const bv = fieldValue(b, field);
  if (av === null && bv === null) return 0;
  if (av === null) return  1; // nulls last regardless of dir — better UX in the table
  if (bv === null) return -1;
  if (av < bv) return -1 * dir;
  if (av > bv) return  1 * dir;
  return 0;
}

function fieldValue(r: QueueRow, field: SortField): number | string | null {
  if (field === 'queuedAt')    return r.queuedAt.getTime();
  if (field === 'startedAt')   return r.startedAt   ? r.startedAt.getTime()   : null;
  if (field === 'completedAt') return r.completedAt ? r.completedAt.getTime() : null;
  if (field === 'status')      return r.status;
  if (field === 'project')     return r.projectSlug;
  return r.type;
}

function normalizeTraining(j: any): QueueRow {
  return {
    type:          'training',
    id:            j.id,
    status:        j.status,
    profileCode:   j.profile.profileCode,
    characterCode: j.profile.character.code,
    projectSlug:   j.profile.character.project?.slug ?? j.profile.character.projectLinks?.[0]?.project?.slug ?? null,
    projectId:     j.profile.character.project?.id   ?? j.profile.character.projectLinks?.[0]?.project?.id   ?? null,
    shotId:        null,
    triggerToken:  j.triggerToken ?? null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}

function normalizeDataset(j: any): QueueRow {
  return {
    type:          'dataset',
    id:            j.id,
    status:        j.status,
    profileCode:   j.profile.profileCode,
    characterCode: j.profile.character.code,
    projectSlug:   j.profile.character.project?.slug ?? j.profile.character.projectLinks?.[0]?.project?.slug ?? null,
    projectId:     j.profile.character.project?.id   ?? j.profile.character.projectLinks?.[0]?.project?.id   ?? null,
    shotId:        null,
    triggerToken:  j.profile.triggerToken ?? null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
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
    projectId:     j.shot.project.id,
    shotId:        j.shot.id,
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
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
    projectId:     v.shot.project.id,
    shotId:        v.shot.id,
    triggerToken:  null,
    queuedAt:      v.queuedAt,
    startedAt:     v.startedAt ?? null,
    completedAt:   v.completedAt ?? null,
    errorMessage:  v.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
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
    projectId:     v.shot.project.id,
    shotId:        v.shot.id,
    triggerToken:  null,
    // Upscale FIFO timestamp. Legacy rows (no upscaleQueuedAt yet) fall back
    // to upscaleStartedAt, then to the main render's queuedAt — same precedence
    // the migration used for backfill.
    queuedAt:      v.upscaleQueuedAt ?? v.upscaleStartedAt ?? v.queuedAt,
    startedAt:     v.upscaleStartedAt ?? null,
    completedAt:   v.upscaleCompletedAt ?? null,
    errorMessage:  v.upscaleErrorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}

function normalizeTTS(j: any): QueueRow {
  // TTSJob has either a Shot (per-shot VO) or a Scene (legacy whole-scene VO).
  // Pick the project + label from whichever side is populated; expose shotId
  // when shot-level so the queue UI can deep-link to /shots/<id>/narration.
  const isShotLevel = !!j.shot;
  const project = isShotLevel ? j.shot.project : j.scene?.project;
  const label   = isShotLevel
    ? (j.shot.scene?.title ?? j.shot.scene?.sceneKey ?? j.shot.shotCode)
    : (j.scene?.title ?? j.scene?.sceneKey ?? '—');
  return {
    type:          'tts',
    id:            j.id,
    status:        j.status,
    profileCode:   isShotLevel ? `🔊 ${j.shot.shotCode}` : `🔊 ${j.voice}`,
    characterCode: label,
    projectSlug:   project?.slug ?? '—',
    projectId:     project?.id   ?? null,
    shotId:        isShotLevel ? j.shot.id : null,
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}

function normalizeBgm(j: any): QueueRow {
  // profileCode reuses the "what's being worked on" column to show the block
  // slug, characterCode reuses "context" for the block title — mirrors how
  // scene/video rows borrow these column slots for shot + scene labels.
  return {
    type:          'bgm',
    id:            j.id,
    status:        j.status,
    profileCode:   `🎵 ${j.segment?.block?.slug ?? '—'}`,
    characterCode: j.segment?.block?.title ?? j.segment?.block?.slug ?? '—',
    projectSlug:   j.segment?.block?.project?.slug ?? '—',
    projectId:     j.segment?.block?.project?.id   ?? null,
    shotId:        null,
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}

function normalizeAnchor(j: any): QueueRow {
  // Anchor portrait render — cartoon character identity asset. Uses the same
  // profile/character/project resolution chain as dataset/training jobs since
  // it's a per-profile job. The 🎭 emoji surfaces in the queue UI as a quick
  // visual differentiator from dataset/training rows for the same profile.
  return {
    type:          'anchor',
    id:            j.id,
    status:        j.status,
    profileCode:   `🎭 ${j.profile?.profileCode ?? '—'}`,
    characterCode: j.profile?.character?.code ?? '—',
    projectSlug:   j.profile?.character?.project?.slug ?? j.profile?.character?.projectLinks?.[0]?.project?.slug ?? null,
    projectId:     j.profile?.character?.project?.id   ?? j.profile?.character?.projectLinks?.[0]?.project?.id   ?? null,
    shotId:        null,
    triggerToken:  j.profile?.triggerToken ?? null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}
