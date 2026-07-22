import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';

type JobType = 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale' | 'video_interp' | 'tts' | 'bgm' | 'anchor' | 'validation' | 'anchor_validation' | 'caption';

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
  private readonly logger = new Logger(PipelineController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
  ) {}

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

    const [trA, dsA, scA, vrA, ttsA, bgmA, anA, valA, avA, capA] = await Promise.all([
      this.prisma.trainingJob.findMany({    where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.datasetJob.findMany({     where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.sceneRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({
        where: { OR: [
          { status: { in: ACTIVE_STATUSES } },
          { upscaleStatus: { in: ACTIVE_STATUSES } },
          { interpStatus: { in: ACTIVE_STATUSES } },
        ] },
        include: shotInclude,
        orderBy: { queuedAt: 'asc' },
      }),
      this.prisma.tTSJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: ttsInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.audioRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: bgmInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).imageValidationJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: shotInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorValidationJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).captionJob.findMany({ where: { status: { in: ACTIVE_STATUSES } }, orderBy: { queuedAt: 'asc' } }),
    ]);

    const [trR, dsR, scR, vrR, vrUR, vrIR, ttsR, bgmR, anR, valR, avR, capR] = await Promise.all([
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
      this.prisma.videoRender.findMany({ where: { interpStatus: { in: TERMINAL } }, include: shotInclude, orderBy: { interpCompletedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.tTSJob.findMany({ where: { status: { in: TERMINAL } }, include: ttsInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      this.prisma.audioRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: bgmInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      (this.prisma as any).imageValidationJob.findMany({ where: { status: { in: TERMINAL } }, include: shotInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      (this.prisma as any).anchorValidationJob.findMany({ where: { status: { in: TERMINAL } }, include: profileInclude, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
      (this.prisma as any).captionJob.findMany({ where: { status: { in: TERMINAL } }, orderBy: { completedAt: 'desc' }, take: TERMINAL_TAKE }),
    ]);

    // Caption jobs store only projectId (no Prisma relation) — resolve slugs in one query.
    const capProjectIds = [...new Set([...capA, ...capR].map((j: any) => j.projectId).filter(Boolean))];
    const capProjects = capProjectIds.length
      ? await this.prisma.project.findMany({ where: { id: { in: capProjectIds as string[] } }, select: { id: true, slug: true } })
      : [];
    const slugById = new Map<string, string>(capProjects.map((p) => [p.id, p.slug]));

    // Each VideoRender row can contribute up to three queue rows (main + upscale
    // + interp). One-pass upscale→RIFE (the default since 2026-07-15) is a SINGLE
    // ComfyUI prompt that closes both the upscale and interp lifecycles at once —
    // both stages share one promptId. Collapse those two into a single "↑FHD⏩FPS"
    // row so the queue shows one job, not two. Separate interp rows survive only
    // for a standalone re-interpolate (new interpPromptId ≠ upscalePromptId) or a
    // legacy pre-one-pass two-step render.
    const videoActiveRows: QueueRow[] = [
      ...vrA.filter((j) => ACTIVE_STATUSES.includes(j.status)).map(normalizeVideo),
      ...vrA.filter((j) => j.upscaleStatus !== null && ACTIVE_STATUSES.includes(j.upscaleStatus)).map(normalizeVideoUpscale),
      ...vrA.filter((j) => j.interpStatus !== null && ACTIVE_STATUSES.includes(j.interpStatus) && !isOnePassPost(j)).map(normalizeVideoInterp),
    ];
    const videoRecentRows: QueueRow[] = [
      ...vrR.map(normalizeVideo),
      ...vrUR.map((v) => isOnePassPost(v) ? normalizeVideoPost(v) : normalizeVideoUpscale(v)),
      ...vrIR.filter((v) => !isOnePassPost(v)).map(normalizeVideoInterp),
    ];

    const all: QueueRow[] = [
      ...trA.map(normalizeTraining),
      ...dsA.map(normalizeDataset),
      ...scA.map(normalizeScene),
      ...videoActiveRows,
      ...ttsA.map(normalizeTTS),
      ...bgmA.map(normalizeBgm),
      ...anA.map(normalizeAnchor),
      ...valA.map(normalizeValidation),
      ...avA.map(normalizeAnchorValidation),
      ...capA.map((j: any) => normalizeCaption(j, slugById)),
      ...trR.map(normalizeTraining),
      ...dsR.map(normalizeDataset),
      ...scR.map(normalizeScene),
      ...videoRecentRows,
      ...ttsR.map(normalizeTTS),
      ...bgmR.map(normalizeBgm),
      ...anR.map(normalizeAnchor),
      ...valR.map(normalizeValidation),
      ...avR.map(normalizeAnchorValidation),
      ...capR.map((j: any) => normalizeCaption(j, slugById)),
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
  @ApiOperation({ summary: 'Reorder a pending job (up/down/top)' })
  async move(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' | 'top' },
  ) {
    if (!isJobType(type)) {
      throw new BadRequestException(`type must be one of training|dataset|scene|video|video_upscale|video_interp|tts|bgm|anchor|validation, got: ${type}`);
    }
    const direction = body?.direction;
    if (direction !== 'up' && direction !== 'down' && direction !== 'top') {
      throw new BadRequestException(`direction must be 'up', 'down' or 'top'`);
    }

    const target = await this.fetchOne(type, id);
    if (target.status !== 'pending') {
      throw new BadRequestException(`Only 'pending' jobs can be reordered (got: ${target.status})`);
    }

    const all = await this.collectPendingOrdered();
    const idx = all.findIndex((r) => r.type === type && r.id === id);
    if (idx === -1) throw new NotFoundException('Job is not in the pending list');

    // ── Jump to the FRONT of the pending queue ───────────────────────────────
    // Single-slot queue: the running job CANNOT be preempted, so "front" means
    // SECOND position — strictly AFTER the currently-running job(s), BEFORE every
    // pending job. This mirrors TTSService's front-of-queue placement so the two
    // never drift. Already-first rows are a no-op.
    if (direction === 'top') {
      if (idx === 0) return { moved: false, reason: 'edge' };
      const front = await this.frontQueuedAt(type, id);
      await this.updateQueuedAt(type, id, front);
      return { moved: true };
    }

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

  /**
   * Timestamp that places a job at the front of the PENDING queue without ever
   * jumping ahead of a running job. = max(running.queuedAt) + 1ms when anything
   * is running (right behind it), otherwise just before the earliest *other*
   * pending job. Mirrors TTSService.start()'s front placement. `excludeType` /
   * `excludeId` skip the job being moved so it doesn't anchor its own target.
   */
  private async frontQueuedAt(excludeType: JobType, excludeId: string): Promise<Date> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ running: Date | null }>>(
      `SELECT (SELECT MAX(q) FROM (
          SELECT MAX("queuedAt") q FROM tts_jobs           WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM video_renders      WHERE status='running'
          UNION ALL SELECT MAX("upscaleQueuedAt") FROM video_renders WHERE "upscaleStatus"='running'
          UNION ALL SELECT MAX("interpQueuedAt")  FROM video_renders WHERE "interpStatus"='running'
          UNION ALL SELECT MAX("queuedAt") FROM scene_render_jobs  WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM dataset_jobs       WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM training_jobs      WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM audio_render_jobs  WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM anchor_render_jobs WHERE status='running'
          UNION ALL SELECT MAX("queuedAt") FROM image_validation_jobs WHERE status='running'
       ) r) AS running`,
    );
    const running = rows?.[0]?.running ? new Date(rows[0].running as unknown as string) : null;

    const pending = await this.collectPendingOrdered();
    const earliestOther = pending.find((r) => !(r.type === excludeType && r.id === excludeId));
    const minPending = earliestOther ? earliestOther.queuedAt : null;

    if (running && minPending) {
      // Slot just before the earliest pending, but never at/below the running job.
      return new Date(Math.max(minPending.getTime() - 1, running.getTime() + 1));
    }
    if (running)    return new Date(running.getTime() + 1);    // running, but nothing else pending
    if (minPending) return new Date(minPending.getTime() - 1000); // nothing running → run next
    return new Date();                                          // empty queue
  }

  /** Cancel a pending or running job (works across all types). */
  @Post('queue/:type/:id/cancel')
  @ApiOperation({ summary: 'Cancel a queue job (pending or running)' })
  async cancel(@Param('type') type: string, @Param('id') id: string) {
    if (!isJobType(type)) {
      throw new BadRequestException(`type must be one of training|dataset|scene|video|video_upscale|video_interp|tts|bgm|anchor|validation, got: ${type}`);
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
    if (type === 'validation') {
      const j = await (this.prisma as any).imageValidationJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`validation job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return (this.prisma as any).imageValidationJob.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
    }
    if (type === 'anchor_validation') {
      const j = await (this.prisma as any).anchorValidationJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`anchor validation job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return (this.prisma as any).anchorValidationJob.update({
        where: { id },
        data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
      });
    }
    if (type === 'caption') {
      const j = await (this.prisma as any).captionJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`caption job ${id} not found`);
      if (TERMINAL.includes(j.status)) return j;
      return (this.prisma as any).captionJob.update({
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
    // All three video job types live on one videoRender row. Interrupt/dequeue
    // the relevant ComfyUI prompt so cancelling actually frees the GPU, then
    // mark the stage cancelled (which frees the single queue slot).
    if (type === 'video' || type === 'video_interp' || type === 'video_upscale') {
      const vr = await this.prisma.videoRender.findUnique({ where: { id } });
      if (!vr) throw new NotFoundException(`video render ${id} not found`);
      const promptId = type === 'video'        ? vr.comfyPromptId
                     : type === 'video_interp' ? vr.interpPromptId
                     :                           vr.upscalePromptId;
      if (promptId) {
        const did = await this.comfy.cancelPrompt(promptId).catch(() => 'unknown' as const);
        this.logger.log(`cancel ${type} ${id}: ComfyUI prompt ${promptId} → ${did}`);
      }
      if (type === 'video') {
        return this.prisma.videoRender.update({
          where: { id },
          data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'Manually cancelled' },
        });
      }
      if (type === 'video_interp') {
        return this.prisma.videoRender.update({
          where: { id },
          data:  { interpStatus: 'cancelled', interpCompletedAt: new Date(), interpErrorMessage: 'Manually cancelled' },
        });
      }
      return this.prisma.videoRender.update({
        where: { id },
        data:  { upscaleStatus: 'cancelled', upscaleCompletedAt: new Date(), upscaleErrorMessage: 'Manually cancelled' },
      });
    }
    throw new BadRequestException(`Unhandled cancel type: ${type}`);
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
    if (type === 'validation') {
      const j = await (this.prisma as any).imageValidationJob.findUnique({
        where: { id },
        include: { shot: { include: { project: true, scene: true } } },
      });
      if (!j) throw new NotFoundException(`validation job ${id} not found`);
      return normalizeValidation(j);
    }
    if (type === 'anchor_validation') {
      const j = await (this.prisma as any).anchorValidationJob.findUnique({
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
      if (!j) throw new NotFoundException(`anchor validation job ${id} not found`);
      return normalizeAnchorValidation(j);
    }
    if (type === 'caption') {
      const j = await (this.prisma as any).captionJob.findUnique({ where: { id } });
      if (!j) throw new NotFoundException(`caption job ${id} not found`);
      return normalizeCaption(j, new Map());
    }
    const v = await this.prisma.videoRender.findUnique({
      where: { id },
      include: { shot: { include: { project: true, scene: true } } },
    });
    if (!v) throw new NotFoundException(`video render ${id} not found`);
    if (type === 'video')          return normalizeVideo(v);
    if (type === 'video_interp')   return normalizeVideoInterp(v);
    return normalizeVideoUpscale(v);
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
    const [tr, ds, sc, vr, vrU, vrI, tts, bgm, an, val, av, cap] = await Promise.all([
      this.prisma.trainingJob.findMany({    where: { status: 'pending' },        include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.datasetJob.findMany({     where: { status: 'pending' },        include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      this.prisma.sceneRenderJob.findMany({ where: { status: 'pending' },        include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({    where: { status: 'pending' },        include: shotInclude,    orderBy: { queuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({    where: { upscaleStatus: 'pending' }, include: shotInclude,    orderBy: { upscaleQueuedAt: 'asc' } }),
      this.prisma.videoRender.findMany({    where: { interpStatus: 'pending' },  include: shotInclude,    orderBy: { interpQueuedAt: 'asc' } }),
      this.prisma.tTSJob.findMany({         where: { status: 'pending' },        include: ttsInclude,     orderBy: { queuedAt: 'asc' } }),
      this.prisma.audioRenderJob.findMany({ where: { status: 'pending' },        include: bgmInclude,     orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorRenderJob.findMany({ where: { status: 'pending' }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).imageValidationJob.findMany({ where: { status: 'pending' }, include: shotInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).anchorValidationJob.findMany({ where: { status: 'pending' }, include: profileInclude, orderBy: { queuedAt: 'asc' } }),
      (this.prisma as any).captionJob.findMany({ where: { status: 'pending' }, orderBy: { queuedAt: 'asc' } }),
    ]);
    return [
      ...tr.map(normalizeTraining),
      ...ds.map(normalizeDataset),
      ...sc.map(normalizeScene),
      ...vr.map(normalizeVideo),
      ...vrU.map(normalizeVideoUpscale),
      ...vrI.map(normalizeVideoInterp),
      ...tts.map(normalizeTTS),
      ...bgm.map(normalizeBgm),
      ...an.map(normalizeAnchor),
      ...val.map(normalizeValidation),
      ...av.map(normalizeAnchorValidation),
      ...cap.map((j: any) => normalizeCaption(j, new Map())),
    ].sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
  }

  private updateQueuedAt(type: JobType, id: string, queuedAt: Date) {
    if (type === 'training')      return this.prisma.trainingJob.update({    where: { id }, data: { queuedAt } });
    if (type === 'dataset')       return this.prisma.datasetJob.update({     where: { id }, data: { queuedAt } });
    if (type === 'scene')         return this.prisma.sceneRenderJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'video')         return this.prisma.videoRender.update({    where: { id }, data: { queuedAt } });
    // video_upscale / video_interp use their own FIFO fields — see normalizers.
    if (type === 'video_upscale') return this.prisma.videoRender.update({    where: { id }, data: { upscaleQueuedAt: queuedAt } });
    if (type === 'video_interp')  return this.prisma.videoRender.update({    where: { id }, data: { interpQueuedAt: queuedAt } });
    if (type === 'bgm')           return this.prisma.audioRenderJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'anchor')        return (this.prisma as any).anchorRenderJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'validation')    return (this.prisma as any).imageValidationJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'anchor_validation') return (this.prisma as any).anchorValidationJob.update({ where: { id }, data: { queuedAt } });
    if (type === 'caption')       return (this.prisma as any).captionJob.update({ where: { id }, data: { queuedAt } });
    return this.prisma.tTSJob.update({ where: { id }, data: { queuedAt } });
  }
}

function isJobType(t: string): t is JobType {
  return t === 'training' || t === 'dataset' || t === 'scene'
      || t === 'video'    || t === 'video_upscale' || t === 'video_interp' || t === 'tts'
      || t === 'bgm'      || t === 'anchor'  || t === 'validation' || t === 'anchor_validation'
      || t === 'caption';
}

function normalizeCaption(j: any, slugById: Map<string, string>): QueueRow {
  // Subtitle/caption transcription (faster-whisper). Has only projectId + videoPath;
  // 💬 marks it in the queue UI. Slug is resolved from the batch lookup in queue().
  const file = (j.videoPath ?? '').split(/[\\/]/).pop() || '—';
  return {
    type:          'caption',
    id:            j.id,
    status:        j.status,
    profileCode:   `💬 субтитры`,
    characterCode: j.videoId ? `→ ${j.videoId}` : file,
    projectSlug:   slugById.get(j.projectId) ?? '—',
    projectId:     j.projectId ?? null,
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

/**
 * True when the upscale and interp lifecycles were produced by the SAME
 * one-pass ComfyUI prompt (combined upscale→RIFE graph). Both stages then share
 * one promptId. Used to collapse the two queue rows into a single "↑FHD⏩FPS"
 * row. A standalone re-interpolate re-queues interp with its own prompt, so the
 * promptIds diverge and the rows stay separate.
 */
function isOnePassPost(v: any): boolean {
  return !!v.upscalePromptId && v.upscalePromptId === v.interpPromptId;
}

/** Collapsed one-pass upscale→RIFE row: one job that yields BOTH the FHD and the smooth clip. */
function normalizeVideoPost(v: any): QueueRow {
  return {
    ...normalizeVideoUpscale(v),
    profileCode: `${v.shot.shotCode} ↑FHD⏩FPS`,
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

function normalizeVideoInterp(v: any): QueueRow {
  return {
    type:          'video_interp',
    id:            v.id,
    status:        v.interpStatus,
    profileCode:   `${v.shot.shotCode} ⏩FPS`,
    characterCode: v.shot.scene?.title ?? v.shot.scene?.sceneKey ?? '—',
    projectSlug:   v.shot.project.slug,
    projectId:     v.shot.project.id,
    shotId:        v.shot.id,
    triggerToken:  null,
    // Interp FIFO timestamp. Legacy fallback chain mirrors the upscale row.
    queuedAt:      v.interpQueuedAt ?? v.interpStartedAt ?? v.queuedAt,
    startedAt:     v.interpStartedAt ?? null,
    completedAt:   v.interpCompletedAt ?? null,
    errorMessage:  v.interpErrorMessage ?? null,
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

function normalizeAnchorValidation(j: any): QueueRow {
  // Anchor validation (Ollama vision) — scores a profile's anchor candidates,
  // rejects anime, installs the best. Per-profile like the anchor render row;
  // 🔎🎭 marks it in the queue UI.
  return {
    type:          'anchor_validation',
    id:            j.id,
    status:        j.status,
    profileCode:   `🔎🎭 ${j.profile?.profileCode ?? '—'}`,
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

function normalizeValidation(j: any): QueueRow {
  // Image-validation (Ollama vision) — scores a shot's candidates and picks the
  // best. Borrows the shot columns like scene/video rows; 🔎 marks it in the UI.
  return {
    type:          'validation',
    id:            j.id,
    status:        j.status,
    profileCode:   `🔎 ${j.shot?.shotCode ?? '—'}`,
    characterCode: j.shot?.scene?.title ?? j.shot?.scene?.sceneKey ?? '—',
    projectSlug:   j.shot?.project?.slug ?? '—',
    projectId:     j.shot?.project?.id   ?? null,
    shotId:        j.shot?.id ?? null,
    triggerToken:  null,
    queuedAt:      j.queuedAt,
    startedAt:     j.startedAt ?? null,
    completedAt:   j.completedAt ?? null,
    errorMessage:  j.errorMessage ?? null,
    isFirstPending: false,
    isLastPending:  false,
  };
}
