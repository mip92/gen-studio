import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { QueueLedgerService, QueueEntryRow } from './queue-ledger.service';
import { QueueSourceService } from './queue-source.service';
import { ACTIVE_STATUSES, JobType, TERMINAL_STATUSES, isJobType } from './queue-entry.types';

/** One row of the queue/history as the UI consumes it. */
interface QueueRowDto {
  /** Queue entry id — what the reorder and cancel endpoints take. */
  entryId:       string;
  type:          JobType;
  /** Id of the row in the type-specific table (VideoRender.id, TTSJob.id, …). */
  jobId:         string;
  attemptNumber: number;
  status:        string;
  /** What is being worked on ("SH014B ↑FHD⏩FPS", "🎵 act_03"). */
  label:         string;
  /** Where it sits — scene title, character code, music block. */
  context:       string | null;
  projectSlug:   string | null;
  projectId:     string | null;
  shotId:        string | null;
  profileCode:   string | null;
  /** Batching group (workflow/model identity) this job belongs to. */
  groupKey:      string;
  rank:          number;
  /** 1-based place in the pending queue. Null for anything not pending. */
  position:      number | null;
  /** Priority tier of the owning project (0 = normal). */
  projectTier:   number;
  queuedAt:      Date;
  startedAt:     Date | null;
  completedAt:   Date | null;
  /** Real elapsed time of the attempt, in ms. Null while unfinished. */
  durationMs:    number | null;
  errorMessage:  string | null;
  /** useful | wasted | null (not yet decided). */
  outcome:       string | null;
  outcomeReason: string | null;
  workflowFilename: string | null;
  outputFilename:   string | null;
  isFirstPending: boolean;
  isLastPending:  boolean;
}

const SORTABLE = ['queue', 'queuedAt', 'startedAt', 'completedAt', 'status', 'type', 'project', 'duration'] as const;
type SortField = (typeof SORTABLE)[number];

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  private readonly logger = new Logger(PipelineController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly ledger: QueueLedgerService,
    private readonly source: QueueSourceService,
  ) {}

  /**
   * The unified queue and render history, paginated.
   *
   * One indexed table, one query — the twelve-table merge this used to perform
   * in memory (and the second copy of it that computed pending order) is gone
   * along with the ordering rule it kept getting wrong.
   *
   * Query params (all optional):
   *   - id       → a single entry, by entry id or by job id
   *   - status   → comma-separated status values
   *   - type     → comma-separated job types
   *   - project  → comma-separated project slugs
   *   - finished → 'true' = terminal only, 'false' = pending/running only
   *   - sort     → queue|queuedAt|startedAt|completedAt|status|type|project|duration
   *                ('queue' = what runs when: the running job, then pending in
   *                 dispatch order — project tier, then rank — then history.
   *                 Defaults to ascending, i.e. next-to-run first.)
   *   - order    → 'asc' | 'desc'
   *   - page     → 1-based (default 1)
   *   - limit    → page size, max 200 (default 50)
   */
  @Get('queue')
  @ApiOperation({ summary: 'Unified queue + render history (paginated)' })
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
    const entries = (this.prisma as any).queueEntry;

    // The status filter is kept OUT of `where` on purpose: the queue-ordered view
    // splits rows into a pending block and a history block, and folding a status
    // predicate into that split would silently override whatever the caller asked
    // for. It is applied to each block explicitly below.
    const where: Record<string, unknown> = {};
    if (id)       where.OR = [{ id }, { jobId: id }];
    if (typeQ)    where.jobType = { in: splitCsv(typeQ) };
    if (projectQ) where.projectSlug = { in: splitCsv(projectQ) };

    let statusIn: string[] | null = null;
    if (statusQ)              statusIn = splitCsv(statusQ);
    if (finished === 'true')  statusIn = [...TERMINAL_STATUSES];
    if (finished === 'false') statusIn = [...ACTIVE_STATUSES];

    const wantsPending = !statusIn || statusIn.includes('pending');
    const restStatuses = statusIn ? statusIn.filter((s) => s !== 'pending') : null;
    const wantsRest    = !restStatuses || restStatuses.length > 0;

    /** The full predicate, for the plain column-sorted path. */
    const whereAll = { ...where, ...(statusIn ? { status: { in: statusIn } } : {}) };
    /** Non-pending half of the predicate, for the history block. */
    const whereRest = {
      ...where,
      status: restStatuses ? { in: restStatuses } : { not: 'pending' },
    };

    const sort: SortField = (SORTABLE as readonly string[]).includes(sortQ ?? '')
      ? (sortQ as SortField)
      : 'queue';
    // A date column reads newest-first; queue position reads 1, 2, 3. Respect an
    // explicit order, otherwise pick the one that suits the field.
    const explicitOrder: 'asc' | 'desc' | null =
      orderQ === 'asc' ? 'asc' : orderQ === 'desc' ? 'desc' : null;
    const order: 'asc' | 'desc' = explicitOrder ?? (sort === 'queue' ? 'asc' : 'desc');
    const page  = Math.max(1, parseInt(pageQ ?? '1', 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(limitQ ?? '50', 10) || 50));

    // True dispatch order can't be expressed as a column sort — it depends on the
    // owning project's priority tier — so the ledger produces the pending order
    // and the page is cut from it. Only ids are fetched: the pending queue can be
    // thousands deep and this endpoint is polled every few seconds.
    const pendingIds   = await this.ledger.pendingOrderIds();
    const positions    = new Map(pendingIds.map((id, i) => [id, i + 1]));
    const firstPending = pendingIds[0] ?? null;
    const lastPending  = pendingIds[pendingIds.length - 1] ?? null;

    let rows: QueueEntryRow[];
    let total: number;

    if (sort === 'queue') {
      // Three blocks, in the order the operator actually cares about:
      //   1. what is running now,
      //   2. what is queued, in true dispatch order,
      //   3. what already happened, newest first.
      // Paginating across them never loads all of history, which is tens of
      // thousands of rows and grows for the life of the studio.
      const wantsRunning   = !statusIn || statusIn.includes('running');
      const terminalWanted = statusIn
        ? statusIn.filter((st) => st !== 'pending' && st !== 'running')
        : null;
      const whereTerminal = {
        ...where,
        status: terminalWanted ? { in: terminalWanted } : { notIn: ['pending', 'running'] },
      };
      const wantsTerminal = !terminalWanted || terminalWanted.length > 0;

      const [runningRows, pendingMatches, terminalTotal] = await Promise.all([
        wantsRunning
          ? entries.findMany({ where: { ...where, status: 'running' }, orderBy: { startedAt: 'asc' } })
          : Promise.resolve([]),
        wantsPending
          ? entries.findMany({ where: { ...where, status: 'pending' }, select: { id: true } })
          : Promise.resolve([]),
        wantsTerminal ? entries.count({ where: whereTerminal }) : Promise.resolve(0),
      ]);

      const matched = new Set<string>((pendingMatches as Array<{ id: string }>).map((r) => r.id));
      const orderedPendingIds = pendingIds.filter((pid) => matched.has(pid));
      const queueIds = order === 'asc' ? orderedPendingIds : [...orderedPendingIds].reverse();

      const running = runningRows as QueueEntryRow[];
      total = running.length + queueIds.length + (terminalTotal as number);

      // Walk the blocks, consuming the requested page across their boundaries.
      let skipLeft = (page - 1) * limit;
      let takeLeft = limit;

      const runningTake = Math.min(Math.max(0, running.length - skipLeft), takeLeft);
      const runningSlice = runningTake > 0 ? running.slice(skipLeft, skipLeft + runningTake) : [];
      skipLeft = Math.max(0, skipLeft - running.length);
      takeLeft -= runningSlice.length;

      let pendingSlice: string[] = [];
      if (takeLeft > 0) {
        const pendingTake = Math.min(Math.max(0, queueIds.length - skipLeft), takeLeft);
        if (pendingTake > 0) pendingSlice = queueIds.slice(skipLeft, skipLeft + pendingTake);
        takeLeft -= pendingSlice.length;
      }
      skipLeft = Math.max(0, skipLeft - queueIds.length);

      const [pendingRows, terminalRows] = await Promise.all([
        pendingSlice.length > 0
          ? entries.findMany({ where: { id: { in: pendingSlice } } })
          : Promise.resolve([]),
        takeLeft > 0 && wantsTerminal
          ? entries.findMany({
              where:   whereTerminal,
              // History always reads newest-first here; this view is "what is next,
              // then what just happened".
              orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }, { queuedAt: 'desc' }],
              skip:    skipLeft,
              take:    takeLeft,
            })
          : Promise.resolve([]),
      ]);

      // `IN (…)` does not preserve order — restore the sequence the slice was cut in.
      const byId = new Map<string, QueueEntryRow>((pendingRows as QueueEntryRow[]).map((r) => [r.id, r]));
      rows = [
        ...runningSlice,
        ...pendingSlice.map((pid) => byId.get(pid)).filter((r): r is QueueEntryRow => !!r),
        ...(terminalRows as QueueEntryRow[]),
      ];
    } else {
      [rows, total] = await Promise.all([
        entries.findMany({
          where:   whereAll,
          orderBy: this.orderByFor(sort, order),
          skip:    (page - 1) * limit,
          take:    limit,
        }),
        entries.count({ where: whereAll }),
      ]);
    }

    const tiers = await this.tierMap(rows);
    return {
      rows: rows.map((e) => this.toDto(e, positions, firstPending, lastPending, tiers)),
      total, page, limit, sort, order,
    };
  }

  private orderByFor(sort: SortField, order: 'asc' | 'desc'): Record<string, string>[] {
    switch (sort) {
      case 'status':      return [{ status: order }];
      case 'type':        return [{ jobType: order }];
      case 'project':     return [{ projectSlug: order }];
      case 'duration':    return [{ durationMs: order }];
      case 'startedAt':   return [{ startedAt: order }];
      case 'completedAt': return [{ completedAt: order }];
      default:            return [{ queuedAt: order }];
    }
  }

  private toDto(
    e: QueueEntryRow,
    positions: Map<string, number>,
    firstPending: string | null,
    lastPending: string | null,
    tiers: Map<string, number>,
  ): QueueRowDto {
    return {
      entryId:       e.id,
      type:          e.jobType,
      jobId:         e.jobId,
      attemptNumber: e.attemptNumber,
      status:        e.status,
      label:         e.label,
      context:       e.sceneKey ?? e.characterCode ?? e.blockSlug ?? null,
      projectSlug:   e.projectSlug,
      projectId:     e.projectId,
      shotId:        e.shotId,
      profileCode:   e.profileCode,
      groupKey:      e.groupKey,
      rank:          Number(e.rank),
      position:      positions.get(e.id) ?? null,
      projectTier:   tiers.get(e.projectId ?? '') ?? 0,
      queuedAt:      e.queuedAt,
      startedAt:     e.startedAt,
      completedAt:   e.completedAt,
      // A running job has no duration yet; show the live elapsed time so the UI
      // doesn't have to recompute it from startedAt on every poll.
      durationMs:    e.durationMs ?? (e.status === 'running' && e.startedAt ? Date.now() - e.startedAt.getTime() : null),
      errorMessage:  e.errorMessage,
      outcome:       e.outcome,
      outcomeReason: e.outcomeReason,
      workflowFilename: e.workflowFilename,
      outputFilename:   e.outputFilename,
      isFirstPending: e.id === firstPending,
      isLastPending:  e.id === lastPending,
    };
  }

  private async tierMap(rows: QueueEntryRow[]): Promise<Map<string, number>> {
    const ids = [...new Set(rows.map((r) => r.projectId).filter((x): x is string => !!x))];
    if (ids.length === 0) return new Map();
    const projects = await this.prisma.project.findMany({
      where:  { id: { in: ids } },
      select: { id: true, queuePriorityTier: true } as any,
    });
    return new Map(projects.map((p: any) => [p.id as string, (p.queuePriorityTier as number) ?? 0]));
  }

  // ── Reordering ────────────────────────────────────────────────────────────

  /**
   * Move a pending entry up, down, or to the front of the queue.
   *
   * Position is a rank, not a date: nothing here touches `queuedAt`, which now
   * means only what its name says — when the work was requested.
   */
  @Post('queue/:entryId/move')
  @ApiOperation({ summary: 'Reorder a pending queue entry (up/down/top)' })
  async move(@Param('entryId') entryId: string, @Body() body: { direction: 'up' | 'down' | 'top' }) {
    const direction = body?.direction;
    if (direction !== 'up' && direction !== 'down' && direction !== 'top') {
      throw new BadRequestException(`direction must be 'up', 'down' or 'top'`);
    }
    return this.ledger.move(entryId, direction);
  }

  /**
   * Drop a pending entry immediately before another one — the drag-and-drop
   * endpoint. `beforeEntryId: null` drops it at the end of the queue.
   */
  @Post('queue/:entryId/move-to')
  @ApiOperation({ summary: 'Move a pending entry to an arbitrary position (drag & drop)' })
  async moveTo(@Param('entryId') entryId: string, @Body() body: { beforeEntryId?: string | null }) {
    return this.ledger.moveTo(entryId, body?.beforeEntryId ?? null);
  }

  /**
   * Push a whole film to the front of the queue, or let it back down
   * (`tier: 0`).
   *
   * Sticky by design: this raises the PROJECT's tier rather than rewriting its
   * queue rows, so jobs the project enqueues later are prioritised too — no need
   * to press the button again after adding more shots — and the project's
   * internal order survives untouched.
   */
  @Post('queue/projects/:projectId/prioritize')
  @ApiOperation({ summary: 'Raise or clear a project’s queue priority tier' })
  async prioritizeProject(@Param('projectId') projectId: string, @Body() body?: { tier?: number }) {
    return this.ledger.prioritizeProject(projectId, body?.tier ?? 1);
  }

  /** Re-space pending ranks. Only needed if a drag ever reports no free slot. */
  @Post('queue/renumber')
  @ApiOperation({ summary: 'Re-space pending queue ranks' })
  async renumber() {
    const count = await this.ledger.renumberPending();
    return { renumbered: count };
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  /**
   * Cancel a pending or running job.
   *
   * Generic across every job type now: interrupt (or dequeue) the ComfyUI prompt
   * so the GPU is actually freed, mark the job's own row cancelled, and close the
   * ledger entry — which keeps it forever as a record of time spent.
   */
  @Post('queue/:entryId/cancel')
  @ApiOperation({ summary: 'Cancel a queue entry (pending or running)' })
  async cancel(@Param('entryId') entryId: string) {
    const entry: QueueEntryRow | null = await (this.prisma as any).queueEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException(`Queue entry ${entryId} not found`);
    if (!ACTIVE_STATUSES.includes(entry.status as any)) return { cancelled: false, reason: 'already terminal' };

    if (entry.comfyPromptId) {
      const did = await this.comfy.cancelPrompt(entry.comfyPromptId).catch(() => 'unknown' as const);
      this.logger.log(`cancel ${entry.jobType} ${entry.jobId}: ComfyUI prompt ${entry.comfyPromptId} → ${did}`);
    }
    await this.source.cancel(entry.jobType, entry.jobId, 'Manually cancelled');
    await this.ledger.close(entry.jobType, entry.jobId, { status: 'cancelled', errorMessage: 'Manually cancelled' });
    return { cancelled: true, entryId, type: entry.jobType, jobId: entry.jobId };
  }

  /**
   * Cancel by job type + job id, for callers that hold a job row rather than a
   * queue entry (e.g. a "stop this render" button on a shot page).
   */
  @Post('queue/:type/:jobId/cancel-job')
  @ApiOperation({ summary: 'Cancel by job type + job id' })
  async cancelJob(@Param('type') type: string, @Param('jobId') jobId: string) {
    if (!isJobType(type)) throw new BadRequestException(`Unknown job type: ${type}`);
    const live = await this.ledger.findLive(type, jobId);
    if (!live) return { cancelled: false, reason: 'no live queue entry' };
    return this.cancel(live.id);
  }
}

function splitCsv(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}
