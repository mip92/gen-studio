import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ENGINE_CLASS,
  JobType,
  Outcome,
  OutcomeReason,
  QueueStatus,
  RANK_GAP,
  RANK_MIN_GAP,
  groupKeyFor,
  isInfraJobType,
  isTerminal,
} from './queue-entry.types';
import { QueueSourceService } from './queue-source.service';
import { ComfyService } from '../comfy/comfy.service';

/** A queue entry as it comes back from the DB (shape mirrors the Prisma model). */
export interface QueueEntryRow {
  id:               string;
  jobType:          JobType;
  jobId:            string;
  attemptNumber:    number;
  status:           QueueStatus;
  engineClass:      string;
  groupKey:         string;
  rank:             number;
  projectId:        string | null;
  projectSlug:      string | null;
  projectName:      string | null;
  sceneId:          string | null;
  sceneKey:         string | null;
  shotId:           string | null;
  shotCode:         string | null;
  profileId:        string | null;
  profileCode:      string | null;
  characterCode:    string | null;
  segmentId:        string | null;
  blockSlug:        string | null;
  label:            string;
  workflowFilename: string | null;
  comfyPromptId:    string | null;
  outputFilename:   string | null;
  paramsSnapshot:   unknown;
  outcome:          Outcome | null;
  outcomeReason:    OutcomeReason | null;
  classifiedAt:     Date | null;
  queuedAt:         Date;
  firstEligibleAt:  Date | null;
  startedAt:        Date | null;
  completedAt:      Date | null;
  durationMs:       number | null;
  errorMessage:     string | null;
  backfilled:       boolean;
  historyTruncated: boolean;
}

/** Extra facts a caller can attach at enqueue time. */
export interface EnqueueOptions {
  /** Workflow file this attempt will use — also feeds the batching groupKey. */
  workflowFilename?: string | null;
  /** Render parameters snapshot, so a deleted render is still reproducible. */
  paramsSnapshot?: unknown;
  /** Jump straight to the front of the pending queue instead of appending. */
  front?: boolean;
  /** Override the derived batching group (rare — normally leave it alone). */
  groupKey?: string;
  /** Earlier attempts on this source row are known to be unrecoverable. */
  historyTruncated?: boolean;
}

/** How a terminal transition is reported to the ledger. */
export interface CloseOptions {
  status:         Extract<QueueStatus, 'completed' | 'failed' | 'cancelled' | 'skipped'>;
  errorMessage?:  string | null;
  outputFilename?: string | null;
  comfyPromptId?: string | null;
}

/** Denormalized identity of a unit of work, resolved once at enqueue time. */
interface SnapshotContext {
  projectId?:     string | null;
  projectSlug?:   string | null;
  projectName?:   string | null;
  visualStyle?:   string | null;
  sceneId?:       string | null;
  sceneKey?:      string | null;
  shotId?:        string | null;
  shotCode?:      string | null;
  profileId?:     string | null;
  profileCode?:   string | null;
  characterCode?: string | null;
  segmentId?:     string | null;
  blockSlug?:     string | null;
  label:          string;
  /** Type-specific detail that shapes the groupKey (engine name, workflow, …). */
  groupHint?:     string | null;
}

/**
 * Owns the unified queue and the render ledger — they are the same rows.
 *
 * Responsibilities:
 *   - enqueue: one entry per attempt, with a denormalized snapshot so the record
 *     outlives the shot/scene/project it belonged to
 *   - order: `rank` (+ the project's priority tier), never a mutated timestamp
 *   - dispatch selection: strictly the head of that order — batching is decided
 *     when work is enqueued, never by reordering at dispatch time
 *   - close: the terminal write, after which a row is history and is not touched
 *   - finalize: turn still-open entries into permanent records BEFORE their
 *     container is cascade-deleted out of existence
 *
 * Everything that used to reimplement queue order (the dispatcher's 12-table
 * merge, the controller's collectPendingOrdered/frontQueuedAt, and TTSService's
 * hand-copied front-of-queue SQL) delegates here instead.
 */
@Injectable()
export class QueueLedgerService {
  private readonly logger = new Logger(QueueLedgerService.name);

  /**
   * A claimed entry whose job row has not started moving within this window is
   * treated as a dispatch that died on the way out, and the slot is handed back.
   * Long enough that a slow in-flight dispatch is never mistaken for a corpse.
   */
  private static readonly DISPATCH_GRACE_MS = 120_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly source: QueueSourceService,
    private readonly comfy:  ComfyService,
  ) {}

  /** Prisma delegate. Cast keeps the build green until `prisma generate` runs. */
  private get entries(): any {
    return (this.prisma as any).queueEntry;
  }

  /**
   * Reconcile the running entry against the job table it drives, so the queue
   * heals itself instead of stalling.
   *
   * Two repairs, both idempotent:
   *   - the job row finished (or was cancelled, or vanished, or had its stage
   *     fields reset) while its entry is still open → close the entry with the
   *     real outcome;
   *   - the entry is `running` while the job row never left `pending` past the
   *     dispatch grace window → the dispatch died, hand the slot back.
   *
   * This is the safety net that makes the single-slot invariant robust to a
   * missed close() anywhere in eleven services: a stuck slot costs one tick,
   * not a stopped production line.
   */
  async reconcileLive(): Promise<void> {
    // Only RUNNING entries are examined. A partial unique index caps that at one
    // row, so this is a constant amount of work per tick regardless of how deep
    // the queue is — the pending set is in the thousands, and probing each of
    // their source rows every five seconds would be thousands of queries a tick.
    //
    // A pending entry whose source row died needs no sweep either: dispatch
    // fails it on the spot, which is the same repair one tick later.
    const running: QueueEntryRow[] = await this.entries.findMany({ where: { status: 'running' } });

    for (const e of running) {
      const src = await this.source.state(e.jobType, e.jobId).catch(() => null);

      if (!src) {
        // The job row is gone (hard-deleted). The work can never resolve, so
        // seal the record rather than leaving the slot pinned.
        this.logger.warn(`reconcile ${e.jobType}/${e.jobId}: job row is gone — sealing entry as orphaned`);
        await this.sealOrphaned(e, 'source row deleted');
        continue;
      }

      if (src.status && isTerminal(src.status)) {
        this.logger.warn(`reconcile ${e.jobType}/${e.jobId}: row is already ${src.status} — closing entry`);
        await this.close(e.jobType, e.jobId, {
          status:         src.status as CloseOptions['status'],
          errorMessage:   src.errorMessage,
          outputFilename: src.outputFilename,
          comfyPromptId:  src.comfyPromptId,
        });
        continue;
      }

      if (src.status === null) {
        // The stage's fields were reset out from under the entry (a re-run wipes
        // the previous attempt's columns). The attempt can never report back, so
        // seal it rather than letting it pin the slot.
        this.logger.warn(`reconcile ${e.jobType}/${e.jobId}: stage state was reset — sealing entry as failed`);
        await this.close(e.jobType, e.jobId, { status: 'failed', errorMessage: 'stage state was reset before completion' });
        continue;
      }

      if (src.status === 'pending') {
        // Claimed, but the owning service never got the work started. Give the
        // slot back once enough time has passed that a slow dispatch is ruled out.
        const startedAgo = e.startedAt ? Date.now() - e.startedAt.getTime() : 0;
        if (startedAgo > QueueLedgerService.DISPATCH_GRACE_MS) {
          this.logger.warn(`reconcile ${e.jobType}/${e.jobId}: claimed but never dispatched — releasing the slot`);
          await this.release(e.id);
        }
      }
    }
  }

  /** Seal an entry whose work can never resolve because its row is gone. */
  private async sealOrphaned(e: QueueEntryRow, reason: string): Promise<void> {
    const now = new Date();
    await this.entries.update({
      where: { id: e.id },
      data:  {
        status:        'cancelled',
        completedAt:   now,
        durationMs:    e.startedAt ? Math.max(0, now.getTime() - e.startedAt.getTime()) : null,
        errorMessage:  reason,
        outcome:       'wasted',
        outcomeReason: 'orphaned',
        classifiedAt:  now,
      },
    });
  }

  // ── Enqueue ───────────────────────────────────────────────────────────────

  /**
   * Register a new attempt at a unit of work and place it in the queue.
   *
   * Idempotent per live job stage: the DB carries a partial unique index on
   * (jobType, jobId) WHERE status IN ('pending','running'), so a double enqueue
   * of the same stage returns the existing live entry instead of creating a
   * competing one.
   *
   * Placement is where batching now happens: the entry lands directly behind the
   * last pending sibling sharing its `groupKey`, so the queue physically comes
   * out grouped by workflow and the dispatcher can stay a dumb "take the head".
   * See `groupedRank`.
   */
  async enqueue(jobType: JobType, jobId: string, opts: EnqueueOptions = {}): Promise<QueueEntryRow> {
    const existing = await this.findLive(jobType, jobId);
    if (existing) return existing;

    const ctx      = await this.resolveContext(jobType, jobId);
    const groupKey = opts.groupKey ?? this.groupKeyFor(jobType, ctx, opts.workflowFilename);
    const rank     = opts.front
      ? await this.frontRank()
      : await this.groupedRank(groupKey, ctx.projectId ?? null);
    const attemptNumber = 1 + await this.entries.count({ where: { jobType, jobId } });

    const created = await this.entries.create({
      data: {
        jobType,
        jobId,
        attemptNumber,
        status:      'pending' as QueueStatus,
        engineClass: ENGINE_CLASS[jobType],
        groupKey,
        rank,
        projectId:     ctx.projectId     ?? null,
        projectSlug:   ctx.projectSlug   ?? null,
        projectName:   ctx.projectName   ?? null,
        sceneId:       ctx.sceneId       ?? null,
        sceneKey:      ctx.sceneKey      ?? null,
        shotId:        ctx.shotId        ?? null,
        shotCode:      ctx.shotCode      ?? null,
        profileId:     ctx.profileId     ?? null,
        profileCode:   ctx.profileCode   ?? null,
        characterCode: ctx.characterCode ?? null,
        segmentId:     ctx.segmentId     ?? null,
        blockSlug:     ctx.blockSlug     ?? null,
        label:         ctx.label,
        workflowFilename: opts.workflowFilename ?? null,
        paramsSnapshot:   (opts.paramsSnapshot ?? null) as any,
        historyTruncated: opts.historyTruncated ?? false,
      },
    });
    return created as QueueEntryRow;
  }

  /** The live (pending or running) entry for a job stage, if there is one. */
  async findLive(jobType: JobType, jobId: string): Promise<QueueEntryRow | null> {
    return this.entries.findFirst({
      where: { jobType, jobId, status: { in: ['pending', 'running'] } },
    });
  }

  // ── Ranking ───────────────────────────────────────────────────────────────

  /** Rank that appends to the very back of the queue. */
  private async tailRank(): Promise<number> {
    const agg = await this.entries.aggregate({
      where: { status: { in: ['pending', 'running'] } },
      _max:  { rank: true },
    });
    const max = agg?._max?.rank;
    return (typeof max === 'number' ? max : 0) + RANK_GAP;
  }

  /**
   * Rank that files a new entry behind the last pending sibling of its own
   * `groupKey` — this is where checkpoint batching is decided now.
   *
   * The dispatcher used to reorder at run time to keep ComfyUI from reloading a
   * model on every job (~2.5 min vs ~30 s), which meant the list on screen was
   * not the order things actually ran in. Doing it here instead keeps that
   * saving while making the queue honest: what you see is what runs, and a job
   * you drag to the top really is next.
   *
   * Scope is the entry's own ordering bucket — the (priority tier,
   * prioritisedAt) pair from `pendingOrdered`'s ORDER BY. Ranks are only
   * comparable inside a bucket, so a prioritised film batches among its own
   * jobs and can never be interleaved with a lower tier by this.
   *
   * Falls back to the very back of the queue when the group has no pending
   * sibling to join.
   */
  private async groupedRank(groupKey: string, projectId: string | null, retried = false): Promise<number> {
    const [slot] = await this.prisma.$queryRawUnsafe<Array<{ prev: number | null; next: number | null }>>(
      `WITH me AS (
         SELECT COALESCE(p."queuePriorityTier", 0)                        AS tier,
                COALESCE(p."queuePrioritizedAt", TIMESTAMP '-infinity')   AS at
           FROM (SELECT 1) one
           LEFT JOIN projects p ON p.id = $1::text
       ),
       bucket AS (
         SELECT e."rank", e."groupKey"
           FROM queue_entries e
           LEFT JOIN projects p2 ON p2.id = e."projectId"
           CROSS JOIN me
          WHERE e.status = 'pending'
            AND COALESCE(p2."queuePriorityTier", 0)                      = me.tier
            AND COALESCE(p2."queuePrioritizedAt", TIMESTAMP '-infinity') = me.at
       ),
       tail_of_group AS (
         SELECT max("rank") AS prev FROM bucket WHERE "groupKey" = $2::text
       )
       SELECT g.prev,
              (SELECT min(b."rank") FROM bucket b WHERE b."rank" > g.prev) AS next
         FROM tail_of_group g`,
      projectId,
      groupKey,
    );

    const prev = slot?.prev === null || slot?.prev === undefined ? null : Number(slot.prev);
    const next = slot?.next === null || slot?.next === undefined ? null : Number(slot.next);

    if (prev === null) return this.tailRank();          // no sibling to join
    if (next === null) return prev + RANK_GAP;          // the group ends the bucket
    if (next - prev > RANK_MIN_GAP) return (prev + next) / 2;

    // The gap between the group and what follows it has been bisected down to
    // nothing. Re-space the pending set and place the entry once more.
    if (retried) throw new BadRequestException('Could not find a free queue slot even after renumbering');
    await this.renumberPending();
    return this.groupedRank(groupKey, projectId, true);
  }

  /**
   * Rank that puts an entry ahead of every other PENDING one.
   *
   * Note there is no "but stay behind the running job" arithmetic here, unlike
   * the timestamp scheme this replaces: a running job has status='running' and
   * so is not part of the pending ordering at all. The single slot is
   * non-preemptible by construction, not by rank juggling.
   */
  async frontRank(): Promise<number> {
    const agg = await this.entries.aggregate({
      where: { status: 'pending' },
      _min:  { rank: true },
    });
    const min = agg?._min?.rank;
    return (typeof min === 'number' ? min : RANK_GAP) - RANK_GAP;
  }

  /**
   * Re-space every pending entry evenly. Called only when a midpoint insertion
   * has run out of double precision between two neighbours — bounded by the
   * pending set, which a single-GPU queue keeps small.
   */
  async renumberPending(): Promise<number> {
    const pending = await this.pendingOrdered();
    if (pending.length === 0) return 0;
    await this.prisma.$transaction(
      pending.map((e, i) =>
        this.entries.update({ where: { id: e.id }, data: { rank: (i + 1) * RANK_GAP } }),
      ),
    );
    this.logger.log(`renumberPending: re-spaced ${pending.length} pending entr(ies)`);
    return pending.length;
  }

  // ── Reading the queue ─────────────────────────────────────────────────────

  /**
   * Every pending entry in true dispatch order: project priority tier first
   * (newest boost wins among equal tiers), then rank.
   *
   * This is THE definition of queue order. The dispatcher and the API both read
   * it from here so they can never disagree — the drift that the old
   * three-copies-of-the-ordering-rule design invited.
   */
  async pendingOrdered(limit?: number): Promise<QueueEntryRow[]> {
    const rows = await this.prisma.$queryRawUnsafe<QueueEntryRow[]>(
      `SELECT e.*
         FROM queue_entries e
         LEFT JOIN projects p ON p.id = e."projectId"
        WHERE e.status = 'pending'
        ORDER BY COALESCE(p."queuePriorityTier", 0) DESC,
                 COALESCE(p."queuePrioritizedAt", TIMESTAMP '-infinity') DESC,
                 e."rank" ASC
        ${limit ? `LIMIT ${Math.max(1, Math.floor(limit))}` : ''}`,
    );
    return rows.map((r) => ({ ...r, rank: Number(r.rank) }));
  }

  /** The single running entry, if the slot is occupied. */
  async running(): Promise<QueueEntryRow | null> {
    return this.entries.findFirst({ where: { status: 'running' } });
  }

  /**
   * Just the ids of pending entries, in dispatch order. The queue list needs
   * positions for the handful of rows on screen, not the payload of every
   * pending row in a queue that can be thousands deep.
   */
  async pendingOrderIds(): Promise<string[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT e.id
         FROM queue_entries e
         LEFT JOIN projects p ON p.id = e."projectId"
        WHERE e.status = 'pending'
        ORDER BY COALESCE(p."queuePriorityTier", 0) DESC,
                 COALESCE(p."queuePrioritizedAt", TIMESTAMP '-infinity') DESC,
                 e."rank" ASC`,
    );
    return rows.map((r) => r.id);
  }

  /** Every entry in a given status. */
  async byStatus(status: QueueStatus): Promise<QueueEntryRow[]> {
    return this.entries.findMany({ where: { status } });
  }

  /** Effective priority tier of an entry's project (0 when it has none). */
  private async tierOf(entry: QueueEntryRow): Promise<number> {
    if (!entry.projectId) return 0;
    const p = await this.prisma.project.findUnique({
      where:  { id: entry.projectId },
      select: { queuePriorityTier: true } as any,
    });
    return ((p as any)?.queuePriorityTier as number | undefined) ?? 0;
  }

  // ── Dispatch selection ────────────────────────────────────────────────────

  /**
   * The entry to dispatch next: the head of the queue, full stop.
   *
   * There is deliberately no cleverness left here. Batching by workflow used to
   * live at this point and let a sibling of the currently-loaded model cut ahead
   * of the head, bounded by a run cap and a starvation clock — which made the
   * displayed order a lie and could hold a just-prioritised job for 15 minutes.
   * Grouping is now done when work is enqueued (`groupedRank`), so the order in
   * the list IS the order of execution.
   */
  async selectNext(): Promise<QueueEntryRow | null> {
    const [head] = await this.pendingOrdered(1);
    return head ?? null;
  }

  /**
   * Take the slot for an entry: pending → running, atomically.
   *
   * The `status: 'pending'` guard makes this a compare-and-swap, so two
   * overlapping ticks can never both dispatch the same work. Returns false when
   * someone else won the race (or the entry was cancelled meanwhile).
   */
  async claim(entryId: string): Promise<boolean> {
    const res = await this.entries.updateMany({
      where: { id: entryId, status: 'pending' },
      data:  { status: 'running', startedAt: new Date() },
    });
    return (res?.count ?? 0) > 0;
  }

  /** Release a claimed slot back to pending (dispatch bailed before starting work). */
  async release(entryId: string): Promise<void> {
    await this.entries.updateMany({
      where: { id: entryId, status: 'running' },
      data:  { status: 'pending', startedAt: null },
    });
  }

  /** Record the ComfyUI prompt id once the work is actually submitted. */
  async attachPrompt(jobType: JobType, jobId: string, comfyPromptId: string): Promise<void> {
    const live = await this.findLive(jobType, jobId);
    if (live) await this.entries.update({ where: { id: live.id }, data: { comfyPromptId } });
  }

  // ── Closing (the terminal, history-making write) ──────────────────────────

  /**
   * Close a job stage's live entry. After this the row is history: nothing in
   * the system updates it again, and no cascade can delete it.
   *
   * If no live entry exists (a job created before this ledger, or an enqueue
   * that was missed), a terminal entry is created retroactively rather than
   * dropping the record — an incomplete history is the one thing this table
   * exists to prevent.
   */
  async close(jobType: JobType, jobId: string, opts: CloseOptions): Promise<void> {
    const live = await this.findLive(jobType, jobId);
    const now  = new Date();
    const { outcome, outcomeReason } = this.outcomeForClose(jobType, opts.status);

    if (!live) {
      // Nothing live. Either this stage was already closed — closing twice is
      // normal, since a poller can overlap itself and harvest the same finished
      // row more than once — or it was never registered at all. Only the second
      // case deserves a record; writing one for the first would duplicate history.
      const alreadyRecorded = await this.entries.findFirst({
        where:  { jobType, jobId, status: opts.status },
        select: { id: true },
      });
      if (alreadyRecorded) return;

      this.logger.warn(`close ${jobType}/${jobId}: no entry at all — recording a terminal one retroactively`);
      const ctx = await this.resolveContext(jobType, jobId).catch(() => ({ label: `${jobType} ${jobId}` } as SnapshotContext));
      await this.entries.create({
        data: {
          jobType, jobId,
          attemptNumber: 1 + await this.entries.count({ where: { jobType, jobId } }),
          status:      opts.status,
          engineClass: ENGINE_CLASS[jobType],
          groupKey:    this.groupKeyFor(jobType, ctx, null),
          rank:        await this.tailRank(),
          projectId:     ctx.projectId     ?? null,
          projectSlug:   ctx.projectSlug   ?? null,
          projectName:   ctx.projectName   ?? null,
          sceneId:       ctx.sceneId       ?? null,
          sceneKey:      ctx.sceneKey      ?? null,
          shotId:        ctx.shotId        ?? null,
          shotCode:      ctx.shotCode      ?? null,
          profileId:     ctx.profileId     ?? null,
          profileCode:   ctx.profileCode   ?? null,
          characterCode: ctx.characterCode ?? null,
          segmentId:     ctx.segmentId     ?? null,
          blockSlug:     ctx.blockSlug     ?? null,
          label:         ctx.label,
          comfyPromptId:  opts.comfyPromptId  ?? null,
          outputFilename: opts.outputFilename ?? null,
          errorMessage:   opts.errorMessage   ?? null,
          completedAt:    now,
          outcome, outcomeReason,
          classifiedAt:   outcome === null && outcomeReason === null ? null : now,
          historyTruncated: true,
        },
      });
      return;
    }

    const durationMs = live.startedAt ? Math.max(0, now.getTime() - live.startedAt.getTime()) : null;
    await this.entries.update({
      where: { id: live.id },
      data:  {
        status:      opts.status,
        completedAt: now,
        durationMs,
        ...(opts.errorMessage   !== undefined ? { errorMessage:   opts.errorMessage   } : {}),
        ...(opts.outputFilename !== undefined ? { outputFilename: opts.outputFilename } : {}),
        ...(opts.comfyPromptId  !== undefined ? { comfyPromptId:  opts.comfyPromptId  } : {}),
        outcome, outcomeReason,
        classifiedAt: outcome === null && outcomeReason === null ? null : now,
      },
    });
  }

  /**
   * Bucket a terminal transition.
   *
   * Failures and cancellations are waste on the spot. A `completed` infra job
   * (QC, dataset, LoRA, captioning) is useful immediately — it has no rival
   * candidate to lose to. A `completed` artifact job is left UNCLASSIFIED,
   * because whether it shipped depends on a choice the user has not necessarily
   * made yet; QueueOutcomeService resolves those later.
   *
   * `skipped` consumed no GPU time (a static shot refusing video), so it is
   * neither useful nor waste — but it is marked classified so the resolver
   * stops looking at it.
   */
  private outcomeForClose(
    jobType: JobType,
    status: CloseOptions['status'],
  ): { outcome: Outcome | null; outcomeReason: OutcomeReason | null } {
    if (status === 'failed')    return { outcome: 'wasted', outcomeReason: 'failed' };
    if (status === 'cancelled') return { outcome: 'wasted', outcomeReason: 'cancelled' };
    if (status === 'skipped')   return { outcome: null,     outcomeReason: 'unknown' };
    if (isInfraJobType(jobType)) return { outcome: 'useful', outcomeReason: 'infra' };
    return { outcome: null, outcomeReason: null };
  }

  // ── Reordering ────────────────────────────────────────────────────────────

  /** Move a pending entry one step up, one step down, or to the front. */
  async move(entryId: string, direction: 'up' | 'down' | 'top'): Promise<{ moved: boolean; reason?: string; swappedWith?: string }> {
    const target = await this.entries.findUnique({ where: { id: entryId } });
    if (!target) throw new NotFoundException(`Queue entry ${entryId} not found`);
    if (target.status !== 'pending') {
      throw new BadRequestException(`Only pending entries can be reordered (got: ${target.status})`);
    }

    const ordered = await this.pendingOrdered();
    const idx = ordered.findIndex((e) => e.id === entryId);
    if (idx === -1) throw new NotFoundException('Entry is not in the pending list');

    if (direction === 'top') {
      if (idx === 0) return { moved: false, reason: 'edge' };
      // Front of the entry's OWN tier — a rank can't outrank a higher tier, so
      // promise only what rank can deliver.
      const tier  = await this.tierOf(ordered[idx]);
      const peers = await this.sameTier(ordered, tier);
      if (peers.length === 0 || peers[0].id === entryId) return { moved: false, reason: 'edge' };
      await this.entries.update({ where: { id: entryId }, data: { rank: peers[0].rank - RANK_GAP } });
      return { moved: true };
    }

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return { moved: false, reason: 'edge' };

    const a = ordered[idx];
    const b = ordered[swapIdx];
    // Neighbours in different tiers are ordered by tier, not rank — swapping
    // ranks would silently do nothing. Say so instead of lying about it.
    if (await this.tierOf(a) !== await this.tierOf(b)) {
      return { moved: false, reason: 'tier-boundary' };
    }
    await this.prisma.$transaction([
      this.entries.update({ where: { id: a.id }, data: { rank: b.rank } }),
      this.entries.update({ where: { id: b.id }, data: { rank: a.rank } }),
    ]);
    return { moved: true, swappedWith: b.id };
  }

  /**
   * Drop a pending entry immediately before another one (drag-and-drop).
   * `beforeEntryId = null` means "drop at the very end".
   */
  async moveTo(entryId: string, beforeEntryId: string | null): Promise<{ moved: boolean; reason?: string }> {
    const target = await this.entries.findUnique({ where: { id: entryId } });
    if (!target) throw new NotFoundException(`Queue entry ${entryId} not found`);
    if (target.status !== 'pending') {
      throw new BadRequestException(`Only pending entries can be reordered (got: ${target.status})`);
    }
    if (beforeEntryId === entryId) return { moved: false, reason: 'noop' };

    const ordered = await this.pendingOrdered();
    const tier    = await this.tierOf(target as QueueEntryRow);
    const peers   = (await this.sameTier(ordered, tier)).filter((e) => e.id !== entryId);

    let prev: QueueEntryRow | null;
    let next: QueueEntryRow | null;
    if (beforeEntryId === null) {
      prev = peers.length ? peers[peers.length - 1] : null;
      next = null;
    } else {
      const at = peers.findIndex((e) => e.id === beforeEntryId);
      // Dropping next to an entry from another tier can't be expressed in rank.
      if (at === -1) return { moved: false, reason: 'tier-boundary' };
      prev = at > 0 ? peers[at - 1] : null;
      next = peers[at];
    }

    const rank = await this.rankBetween(prev?.rank ?? null, next?.rank ?? null, entryId, beforeEntryId);
    await this.entries.update({ where: { id: entryId }, data: { rank } });
    return { moved: true };
  }

  /**
   * A rank strictly between two neighbours. When the gap has been bisected down
   * to nothing, renumber the pending set and try once more — the only path that
   * can exhaust double precision, and it stays bounded because renumbering
   * restores full spacing.
   */
  private async rankBetween(
    prevRank: number | null,
    nextRank: number | null,
    entryId: string,
    beforeEntryId: string | null,
    retried = false,
  ): Promise<number> {
    if (prevRank === null && nextRank === null) return RANK_GAP;
    if (prevRank === null) return nextRank! - RANK_GAP;
    if (nextRank === null) return prevRank + RANK_GAP;
    if (nextRank - prevRank > RANK_MIN_GAP) return (prevRank + nextRank) / 2;

    if (retried) {
      throw new BadRequestException('Could not find a free queue slot even after renumbering');
    }
    await this.renumberPending();
    const ordered = await this.pendingOrdered();
    const peers   = ordered.filter((e) => e.id !== entryId);
    const at      = beforeEntryId ? peers.findIndex((e) => e.id === beforeEntryId) : -1;
    const prev    = at > 0 ? peers[at - 1] : (at === -1 ? peers[peers.length - 1] ?? null : null);
    const next    = at >= 0 ? peers[at] : null;
    return this.rankBetween(prev?.rank ?? null, next?.rank ?? null, entryId, beforeEntryId, true);
  }

  /** Pending entries whose project sits in the given priority tier. */
  private async sameTier(ordered: QueueEntryRow[], tier: number): Promise<QueueEntryRow[]> {
    const tiers = await this.tierMap(ordered);
    return ordered.filter((e) => (tiers.get(e.projectId ?? '') ?? 0) === tier);
  }

  /** projectId → priority tier, in one query for a whole list of entries. */
  private async tierMap(entries: QueueEntryRow[]): Promise<Map<string, number>> {
    const ids = [...new Set(entries.map((e) => e.projectId).filter((x): x is string => !!x))];
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.project.findMany({
      where:  { id: { in: ids } },
      select: { id: true, queuePriorityTier: true } as any,
    });
    return new Map(rows.map((p: any) => [p.id as string, (p.queuePriorityTier as number) ?? 0]));
  }

  /**
   * Push a whole film to the front of the queue, or let it back down.
   *
   * This is one write to the PROJECT, not a bulk rewrite of its queue rows —
   * which is what makes it sticky: every job the project enqueues later
   * inherits the boost automatically, and the project's internal order is
   * preserved because ranks are untouched.
   */
  async prioritizeProject(projectId: string, tier = 1): Promise<{ projectId: string; tier: number }> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    const level = Math.max(0, Math.floor(tier));
    await this.prisma.project.update({
      where: { id: projectId },
      data:  { queuePriorityTier: level, queuePrioritizedAt: level > 0 ? new Date() : null } as any,
    });
    return { projectId, tier: level };
  }

  // ── Finalizing before destruction ─────────────────────────────────────────

  /**
   * Turn every open entry for a job stage into a permanent record, because the
   * thing it belongs to is about to be deleted.
   *
   * Already-terminal entries are left strictly alone: an artifact that shipped
   * and was cleaned up later is not retroactively waste. Only work that never
   * got to resolve is marked `orphaned`.
   */
  async finalizeForDeletion(jobType: JobType, jobId: string, reason: string): Promise<void> {
    const now = new Date();
    const live = await this.entries.findMany({
      where: { jobType, jobId, status: { in: ['pending', 'running'] } },
    });
    for (const e of live as QueueEntryRow[]) {
      await this.entries.update({
        where: { id: e.id },
        data:  {
          status:        'cancelled',
          completedAt:   now,
          durationMs:    e.startedAt ? Math.max(0, now.getTime() - e.startedAt.getTime()) : null,
          errorMessage:  reason,
          outcome:       'wasted',
          outcomeReason: 'orphaned',
          classifiedAt:  now,
        },
      });
    }
    // Completed-but-never-judged attempts: their artifact is going away with the
    // container, so they can no longer have shipped.
    await this.entries.updateMany({
      where: { jobType, jobId, status: 'completed', outcome: null },
      data:  { outcome: 'wasted', outcomeReason: 'deleted', classifiedAt: now },
    });
  }

  /**
   * Same, for every entry belonging to a shot / scene / project that is about to
   * be cascade-deleted. Works off the denormalized ids, so it does not need to
   * enumerate the twelve job tables the cascade will sweep.
   */
  async finalizeUnder(scope: { shotId?: string; sceneId?: string; projectId?: string }, reason: string): Promise<number> {
    const where =
      scope.shotId    ? { shotId: scope.shotId }
      : scope.sceneId ? { sceneId: scope.sceneId }
      : scope.projectId ? { projectId: scope.projectId }
      : null;
    if (!where) return 0;

    const now = new Date();
    const live = await this.entries.findMany({ where: { ...where, status: { in: ['pending', 'running'] } } });
    for (const e of live as QueueEntryRow[]) {
      await this.entries.update({
        where: { id: e.id },
        data:  {
          status:        'cancelled',
          completedAt:   now,
          durationMs:    e.startedAt ? Math.max(0, now.getTime() - e.startedAt.getTime()) : null,
          errorMessage:  reason,
          outcome:       'wasted',
          outcomeReason: 'orphaned',
          classifiedAt:  now,
        },
      });
    }
    const orphanedCompleted = await this.entries.updateMany({
      where: { ...where, status: 'completed', outcome: null },
      data:  { outcome: 'wasted', outcomeReason: 'deleted', classifiedAt: now },
    });
    const touched = (live as QueueEntryRow[]).length + (orphanedCompleted?.count ?? 0);
    if (touched > 0) this.logger.log(`finalizeUnder(${JSON.stringify(where)}): sealed ${touched} entr(ies) — ${reason}`);
    return touched;
  }

  /**
   * Everything a delete path has to do before a cascade removes its rows: stop
   * work that is still running (otherwise ComfyUI keeps rendering for something
   * that no longer exists) and seal the open entries so the time already spent
   * survives. Shared by the shot, scene and project delete paths, which
   * previously each carried their own copy of this loop.
   */
  async cancelAndSealUnder(
    scope: { shotId?: string; sceneId?: string; projectId?: string },
    reason: string,
  ): Promise<void> {
    for (const e of await this.liveUnder(scope)) {
      if (!e.comfyPromptId) continue;
      const did = await this.comfy.cancelPrompt(e.comfyPromptId).catch(() => 'unknown' as const);
      this.logger.log(`${reason}: ${e.jobType} prompt ${e.comfyPromptId} → ComfyUI ${did}`);
    }
    await this.finalizeUnder(scope, reason);
  }

  /** Every still-live entry under a scope. */
  async liveUnder(scope: { shotId?: string; sceneId?: string; projectId?: string }): Promise<QueueEntryRow[]> {
    const where =
      scope.shotId    ? { shotId: scope.shotId }
      : scope.sceneId ? { sceneId: scope.sceneId }
      : scope.projectId ? { projectId: scope.projectId }
      : null;
    if (!where) return [];
    return this.entries.findMany({ where: { ...where, status: { in: ['pending', 'running'] } } });
  }

  // ── Snapshot + grouping resolution ────────────────────────────────────────

  /** Batching group for this entry — see groupKeyFor in queue-entry.types. */
  private groupKeyFor(jobType: JobType, ctx: SnapshotContext, workflowFilename?: string | null): string {
    return groupKeyFor(jobType, {
      visualStyle:      ctx.visualStyle,
      workflowFilename: workflowFilename ?? ctx.groupHint,
      ttsEngine:        ctx.groupHint,
    });
  }

  /**
   * Resolve the denormalized snapshot for a unit of work.
   *
   * This is the ONE place that knows how each job type reaches its project /
   * shot / profile — the join chains that used to live in twelve `normalize*`
   * functions in the queue controller.
   */
  private async resolveContext(jobType: JobType, jobId: string): Promise<SnapshotContext> {
    switch (jobType) {
      case 'scene':      return this.shotContext(await this.sceneJobShot(jobId), '');
      case 'validation': return this.shotContext(await this.validationShot(jobId), '🔎 ');
      case 'video':
      case 'video_post': {
        const v = await this.prisma.videoRender.findUnique({
          where:   { id: jobId },
          include: { shot: { include: { project: true, scene: true } } },
        });
        const ctx = this.shotContext(v?.shot ?? null, '');
        if (jobType === 'video_post') ctx.label = `${ctx.label} ↑FHD⏩FPS`;
        ctx.groupHint = v?.workflowFilename ?? null;
        return ctx;
      }
      case 'tts': {
        const j = await this.prisma.tTSJob.findUnique({
          where:   { id: jobId },
          include: { shot: { include: { project: true, scene: true } }, scene: { include: { project: true } } },
        });
        if (j?.shot) {
          const ctx = this.shotContext(j.shot, '🔊 ');
          ctx.groupHint = j.engine ?? 'silero';
          return ctx;
        }
        const scene = j?.scene ?? null;
        return {
          projectId:   scene?.project?.id   ?? null,
          projectSlug: scene?.project?.slug ?? null,
          projectName: scene?.project?.name ?? null,
          visualStyle: (scene?.project as any)?.visualStyle ?? null,
          sceneId:     scene?.id ?? null,
          sceneKey:    scene?.sceneKey ?? null,
          label:       `🔊 ${scene?.sceneKey ?? j?.voice ?? jobId}`,
          groupHint:   j?.engine ?? 'silero',
        };
      }
      case 'bgm': {
        const j = await this.prisma.audioRenderJob.findUnique({
          where:   { id: jobId },
          include: { segment: { include: { block: { include: { project: true } } } } },
        });
        const block = j?.segment?.block ?? null;
        return {
          projectId:   block?.project?.id   ?? null,
          projectSlug: block?.project?.slug ?? null,
          projectName: block?.project?.name ?? null,
          visualStyle: (block?.project as any)?.visualStyle ?? null,
          segmentId:   j?.segmentId ?? null,
          blockSlug:   block?.slug ?? null,
          label:       `🎵 ${block?.slug ?? jobId}`,
        };
      }
      case 'anchor':            return this.profileContext(await this.profileIdOf('anchorRenderJob', jobId), '🎭 ');
      // Props are a first-class entity, not a character profile - resolve the
      // project through the prop itself.
      case 'prop_anchor': {
        const j = await this.prisma.propAnchorJob.findUnique({
          where:   { id: jobId },
          include: { prop: { include: { project: true } } },
        });
        const project = j?.prop?.project ?? null;
        return {
          projectId:   project?.id   ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       'PROP ' + (j?.prop?.code ?? jobId),
        };
      }
      case 'anchor_validation': return this.profileContext(await this.profileIdOf('anchorValidationJob', jobId), '🔎🎭 ');
      case 'dataset':           return this.profileContext(await this.profileIdOf('datasetJob', jobId), '');
      case 'training':          return this.profileContext(await this.profileIdOf('trainingJob', jobId), '');
      case 'caption': {
        const j = await (this.prisma as any).captionJob.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       '💬 субтитры',
        };
      }
      // Project-scoped like 'caption' — one video-QC batch per project run.
      case 'video_qc': {
        const j = await (this.prisma as any).videoQcRun.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       `🎞✅ проверка видео ×${j?.totalClips ?? '?'}`,
        };
      }
      // Project-scoped like 'caption' — one image-QC batch per project run.
      case 'image_qc': {
        const j = await (this.prisma as any).imageQcRun.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       `🖼✅ проверка кадров ×${j?.totalImages ?? '?'}`,
        };
      }
      // Project-scoped like 'caption' — one VO-QC batch per project run.
      case 'vo_validation': {
        const j = await (this.prisma as any).voValidationRun.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       `🎙✅ проверка озвучки ×${j?.totalJobs ?? '?'}`,
        };
      }
      // Project-scoped like 'caption'; the idea text is the only useful label.
      case 'thumbnail': {
        const j = await (this.prisma as any).thumbnailJob.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       `🖼 ${j?.idea ?? 'обложка'}`,
        };
      }
      case 'thumbnail_ideas': {
        const j = await (this.prisma as any).thumbnailIdeaJob.findUnique({ where: { id: jobId } });
        const project = j?.projectId
          ? await this.prisma.project.findUnique({ where: { id: j.projectId } })
          : null;
        return {
          projectId:   project?.id   ?? j?.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          visualStyle: (project as any)?.visualStyle ?? null,
          label:       `💡 идеи обложки ×${j?.count ?? '?'}`,
        };
      }
    }
  }

  private async sceneJobShot(jobId: string) {
    const j = await this.prisma.sceneRenderJob.findUnique({
      where:   { id: jobId },
      include: { shot: { include: { project: true, scene: true } } },
    });
    return j?.shot ?? null;
  }

  private async validationShot(jobId: string) {
    const j = await (this.prisma as any).imageValidationJob.findUnique({
      where:   { id: jobId },
      include: { shot: { include: { project: true, scene: true } } },
    });
    return j?.shot ?? null;
  }

  private shotContext(shot: any | null, labelPrefix: string): SnapshotContext {
    return {
      projectId:   shot?.project?.id   ?? null,
      projectSlug: shot?.project?.slug ?? null,
      projectName: shot?.project?.name ?? null,
      visualStyle: shot?.project?.visualStyle ?? null,
      sceneId:     shot?.scene?.id ?? shot?.sceneId ?? null,
      sceneKey:    shot?.scene?.sceneKey ?? null,
      shotId:      shot?.id ?? null,
      shotCode:    shot?.shotCode ?? null,
      label:       `${labelPrefix}${shot?.shotCode ?? '—'}`,
    };
  }

  private async profileIdOf(delegate: string, jobId: string): Promise<string | null> {
    const j = await (this.prisma as any)[delegate].findUnique({ where: { id: jobId } });
    return j?.profileId ?? null;
  }

  /**
   * Profile-scoped snapshot. A character may be a library character (no legacy
   * `Character.projectId`), in which case the first linked project stands in —
   * the same fallback the queue controller has always used.
   */
  private async profileContext(profileId: string | null, labelPrefix: string): Promise<SnapshotContext> {
    if (!profileId) return { label: `${labelPrefix}—` };
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: {
        character: {
          include: {
            project:      true,
            projectLinks: { include: { project: { select: { id: true, slug: true, name: true, visualStyle: true } } } },
          },
        },
      },
    });
    const ch      = profile?.character as any;
    const project = ch?.project ?? ch?.projectLinks?.[0]?.project ?? null;
    return {
      projectId:     project?.id   ?? null,
      projectSlug:   project?.slug ?? null,
      projectName:   project?.name ?? null,
      visualStyle:   project?.visualStyle ?? null,
      profileId:     profile?.id ?? profileId,
      profileCode:   profile?.profileCode ?? null,
      characterCode: ch?.code ?? null,
      label:         `${labelPrefix}${profile?.profileCode ?? profileId}`,
    };
  }

  /** Guard used by callers that must not close an already-terminal entry twice. */
  static isTerminalStatus(status: string): boolean {
    return isTerminal(status);
  }
}
