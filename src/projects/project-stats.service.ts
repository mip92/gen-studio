import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { QueueOutcomeService } from '../pipeline/queue-outcome.service';
import { JobType, SHOT_STAGES } from '../pipeline/queue-entry.types';

/** Time spent, split by whether it ended up in the finished film. */
export interface TimeSplit {
  totalSeconds:      number;
  usefulSeconds:     number;
  wastedSeconds:     number;
  /** Finished work whose fate isn't decided yet (nothing chosen for that shot). */
  unresolvedSeconds: number;
  /** wasted / (useful + wasted), as a percentage. */
  wastePercent:      number | null;
}

/** How many attempts a stage needs on average to yield one usable result. */
export interface StageCost {
  type:              JobType;
  samples:           number;
  avgSeconds:        number | null;
  defectPercent:     number | null;
  /** avgSeconds × 1/(1-defectRate) — expected cost per shipped output. */
  expectedSeconds:   number | null;
  /** True when the numbers come from all projects because this one lacks samples. */
  usedGlobalFallback: boolean;
}

/** Below this many samples, a project borrows the global average. */
const MIN_SAMPLES = 20;

/** Window used to measure real-world throughput for the calendar estimate. */
const THROUGHPUT_WINDOW_DAYS = 7;

/**
 * Reads the queue ledger to answer three questions about a film:
 *   - how much real machine time it has cost so far,
 *   - how much of that was wasted, and on what,
 *   - how much is left — both if it waits its turn and if it goes first.
 *
 * Everything is derived from measured `startedAt`/`completedAt` deltas recorded
 * per attempt. Nothing here is an estimate except the forecast, which is
 * explicit about the averages and defect rates it is built from.
 */
@Injectable()
export class ProjectStatsService {
  private readonly logger = new Logger(ProjectStatsService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly ledger:  QueueLedgerService,
    private readonly outcome: QueueOutcomeService,
  ) {}

  private get entries(): any {
    return (this.prisma as any).queueEntry;
  }

  async forProject(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, slug: true, name: true },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    // Resolve any verdicts that became decidable since the last read (a shot's
    // chosen render can change long after the render finished).
    await this.outcome.classify(project.id).catch((e) =>
      this.logger.warn(`classify(${project.slug}) failed: ${e?.message ?? e}`));

    const rows = await this.entries.findMany({
      where:  { projectId: project.id, status: { in: ['completed', 'failed', 'cancelled'] } },
      select: { jobType: true, status: true, outcome: true, outcomeReason: true, durationMs: true, backfilled: true, historyTruncated: true },
    });

    const spent    = this.split(rows);
    const byType   = this.splitByType(rows);
    const byReason = this.byReason(rows);
    const forecast = await this.forecast(project.id);

    return {
      project: { id: project.id, slug: project.slug, name: project.name },
      spent,
      byType,
      byReason,
      forecast,
      // Historical failures of the base video render were hard-deleted by the old
      // boot sweep, so pre-cutover waste is understated. Surfaced rather than
      // quietly folded in.
      caveats: {
        backfilledEntries:       rows.filter((r: any) => r.backfilled).length,
        truncatedHistoryEntries: rows.filter((r: any) => r.historyTruncated).length,
        note: 'Failed video renders from before the queue ledger were auto-deleted on every restart, so historical waste is a lower bound. Data recorded from the cutover onward is exact.',
      },
    };
  }

  // ── Time accounting ───────────────────────────────────────────────────────

  private split(rows: any[]): TimeSplit {
    let useful = 0, wasted = 0, unresolved = 0;
    for (const r of rows) {
      const sec = (r.durationMs ?? 0) / 1000;
      if (r.outcome === 'useful')      useful += sec;
      else if (r.outcome === 'wasted') wasted += sec;
      else                             unresolved += sec;
    }
    const decided = useful + wasted;
    return {
      totalSeconds:      round(useful + wasted + unresolved),
      usefulSeconds:     round(useful),
      wastedSeconds:     round(wasted),
      unresolvedSeconds: round(unresolved),
      wastePercent:      decided > 0 ? round((wasted / decided) * 100, 1) : null,
    };
  }

  private splitByType(rows: any[]) {
    const byType = new Map<string, any[]>();
    for (const r of rows) {
      const list = byType.get(r.jobType) ?? [];
      list.push(r);
      byType.set(r.jobType, list);
    }
    return [...byType.entries()]
      .map(([type, list]) => {
        const s = this.split(list);
        const finished = list.filter((r) => r.status === 'completed' && r.durationMs != null);
        return {
          type,
          attempts:   list.length,
          ...s,
          avgSeconds: finished.length
            ? round(finished.reduce((a, r) => a + (r.durationMs ?? 0), 0) / finished.length / 1000)
            : null,
        };
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  /** Where the wasted time went: failures, cancellations, re-renders, QC rejects… */
  private byReason(rows: any[]) {
    const acc = new Map<string, { count: number; seconds: number }>();
    for (const r of rows) {
      if (r.outcome !== 'wasted') continue;
      const key = r.outcomeReason ?? 'unknown';
      const cur = acc.get(key) ?? { count: 0, seconds: 0 };
      cur.count   += 1;
      cur.seconds += (r.durationMs ?? 0) / 1000;
      acc.set(key, cur);
    }
    return [...acc.entries()]
      .map(([reason, v]) => ({ reason, count: v.count, seconds: round(v.seconds) }))
      .sort((a, b) => b.seconds - a.seconds);
  }

  // ── Forecast ──────────────────────────────────────────────────────────────

  /**
   * Two answers to "how much longer".
   *
   *   exclusive — this film alone: everything of its own that is queued, plus
   *               every stage its shots have not reached yet.
   *   realistic — the same, plus everything currently ahead of it in the queue,
   *               including other projects' work.
   *
   * Both are inflated by the measured defect rate per stage, because a stage that
   * fails or gets re-rendered a fifth of the time really does cost a fifth more.
   */
  private async forecast(projectId: string) {
    const costs = await this.stageCosts(projectId);
    const cost  = (t: JobType) => costs.find((c) => c.type === t)?.expectedSeconds ?? 0;

    // ── work that is already queued ──────────────────────────────────────────
    const pending = await this.ledger.pendingOrdered();
    const mine    = pending.filter((e) => e.projectId === projectId);
    const firstMineIdx = pending.findIndex((e) => e.projectId === projectId);
    const ahead = firstMineIdx === -1 ? [] : pending.slice(0, firstMineIdx);

    const queuedOwnSeconds = mine.reduce((sum, e) => sum + cost(e.jobType), 0);
    const queueAheadSeconds = ahead.reduce((sum, e) => sum + cost(e.jobType), 0);

    // The running job can't be preempted, so its remainder is owed either way.
    const running = await this.ledger.running();
    const runningRemainder = running
      ? Math.max(0, cost(running.jobType) - (running.startedAt ? (Date.now() - running.startedAt.getTime()) / 1000 : 0))
      : 0;
    const runningIsForeign = !!running && running.projectId !== projectId;

    // ── work that hasn't been queued yet ────────────────────────────────────
    const notQueued = await this.remainingStages(projectId, mine);
    const notQueuedSeconds = SHOT_STAGES.reduce((sum, stage) => sum + notQueued.stages[stage] * cost(stage), 0)
      + notQueued.bgmSegments * cost('bgm');

    const ownRemainingSeconds = queuedOwnSeconds + notQueuedSeconds;
    const exclusiveSeconds = ownRemainingSeconds + (runningIsForeign ? runningRemainder : 0);
    const realisticSeconds = ownRemainingSeconds + queueAheadSeconds + runningRemainder;

    const throughput = await this.throughput();
    return {
      /** GPU-time this film still needs if it goes first. */
      exclusiveSeconds: round(exclusiveSeconds),
      /** GPU-time until it is done if the queue is left as it is. */
      realisticSeconds: round(realisticSeconds),
      breakdown: {
        queuedOwnJobs:      mine.length,
        queuedOwnSeconds:   round(queuedOwnSeconds),
        jobsAheadOfIt:      ahead.length,
        queueAheadSeconds:  round(queueAheadSeconds),
        notQueuedSeconds:   round(notQueuedSeconds),
        notQueuedStages:    notQueued.stages,
        notQueuedBgmSegments: notQueued.bgmSegments,
        runningRemainderSeconds: round(runningRemainder),
      },
      stageCosts: costs,
      /**
       * Calendar estimate from how much work the machine ACTUALLY got through in
       * the last week — it accounts for the hours it was idle, which pure
       * GPU-seconds cannot.
       */
      calendar: throughput.secondsPerDay > 0
        ? {
            secondsOfWorkPerDay: round(throughput.secondsPerDay),
            exclusiveDays: round(exclusiveSeconds / throughput.secondsPerDay, 1),
            realisticDays: round(realisticSeconds / throughput.secondsPerDay, 1),
            basis: `measured over the last ${THROUGHPUT_WINDOW_DAYS} days`,
          }
        : null,
      excludes: ['character assets (anchor renders, dataset builds, LoRA training)'],
    };
  }

  /**
   * Per-stage cost: average duration of a completed attempt, multiplied by the
   * expected number of attempts per usable result.
   *
   * A project's own history is used once it has enough samples to mean anything;
   * before that it borrows the global numbers, since every project runs the same
   * pipeline on the same card.
   */
  private async stageCosts(projectId: string): Promise<StageCost[]> {
    const types: JobType[] = [...SHOT_STAGES, 'bgm'];
    const out: StageCost[] = [];

    for (const type of types) {
      const own    = await this.sampleFor(type, projectId);
      const usable = own.completed >= MIN_SAMPLES ? own : await this.sampleFor(type, null);
      const usedGlobalFallback = usable !== own;

      const avgSeconds = usable.completed > 0 ? usable.totalMs / usable.completed / 1000 : null;
      const decided    = usable.useful + usable.wasted;
      const defectRate = decided > 0 ? usable.wasted / decided : 0;
      // Cap the multiplier: a stage with a near-total defect rate would otherwise
      // produce an infinite forecast, which is less useful than a large one.
      const multiplier = defectRate >= 0.9 ? 10 : 1 / (1 - defectRate);

      out.push({
        type,
        samples:         usable.completed,
        avgSeconds:      avgSeconds === null ? null : round(avgSeconds),
        defectPercent:   decided > 0 ? round(defectRate * 100, 1) : null,
        expectedSeconds: avgSeconds === null ? null : round(avgSeconds * multiplier),
        usedGlobalFallback,
      });
    }
    return out;
  }

  private async sampleFor(type: JobType, projectId: string | null) {
    const rows = await this.entries.findMany({
      where: {
        jobType: type,
        ...(projectId ? { projectId } : {}),
        status:  { in: ['completed', 'failed', 'cancelled'] },
      },
      select: { status: true, outcome: true, durationMs: true },
    });
    let totalMs = 0, completed = 0, useful = 0, wasted = 0;
    for (const r of rows) {
      if (r.status === 'completed' && r.durationMs != null) { totalMs += r.durationMs; completed++; }
      if (r.outcome === 'useful')      useful++;
      else if (r.outcome === 'wasted') wasted++;
    }
    return { totalMs, completed, useful, wasted };
  }

  /**
   * Stages the film still owes that are NOT in the queue yet.
   *
   * This is what makes the forecast honest early on: a project sitting at the
   * scene-generation stage has thousands of seconds of video, post and narration
   * ahead of it that nothing has requested yet, and a queue-only estimate would
   * report it as nearly finished.
   */
  private async remainingStages(projectId: string, queuedOwn: Array<{ jobType: JobType; shotId: string | null }>) {
    const shots = await this.prisma.shot.findMany({
      where:  { projectId },
      select: { id: true, renderMode: true, chosenRender: true, chosenVideoId: true, narrationText: true, approvedTTSJobId: true },
    });

    // Don't double-count: a stage already sitting in the queue is priced there.
    const queuedByShot = new Map<string, Set<JobType>>();
    for (const e of queuedOwn) {
      if (!e.shotId) continue;
      const set = queuedByShot.get(e.shotId) ?? new Set<JobType>();
      set.add(e.jobType);
      queuedByShot.set(e.shotId, set);
    }

    const chosenVideoIds = shots.map((s) => s.chosenVideoId).filter((x): x is string => !!x);
    const postDone = new Set(
      (await this.prisma.videoRender.findMany({
        where:  { id: { in: chosenVideoIds }, upscaleStatus: 'completed' },
        select: { id: true },
      })).map((v) => v.id),
    );

    const stages: Record<string, number> = { scene: 0, video: 0, video_post: 0, tts: 0 };
    for (const s of shots) {
      const queued = queuedByShot.get(s.id) ?? new Set<JobType>();
      const animated = s.renderMode !== 'static';

      if (!s.chosenRender && !queued.has('scene')) stages.scene++;
      if (animated && !s.chosenVideoId && !queued.has('video')) stages.video++;
      // The post pass is owed while the chosen clip has no finished one, and also
      // for a shot whose clip doesn't exist yet — it will need one afterwards.
      if (animated && !queued.has('video_post')) {
        const done = !!s.chosenVideoId && postDone.has(s.chosenVideoId);
        if (!done) stages.video_post++;
      }
      if ((s.narrationText ?? '').trim() && !s.approvedTTSJobId && !queued.has('tts')) stages.tts++;
    }

    // Music: segments still without an approved take (spares are deliberate
    // extras, not gaps) И БЕЗ УЖЕ ИДУЩЕГО рендера.
    //
    // Плитка с pending/running джобом посчитана выше как queuedOwn — без этого
    // условия она попадала В ОБА ведра сразу: её секунды складывались дважды, а
    // овервью писал «музыка: 25, ещё даже не поставлено в очередь», хотя все 25
    // стояли в очереди и /actions правильно не предлагал ничего начинать
    // (user, car_flipper, 2026-08-12). Кадровые стадии так не врали — у них есть
    // queuedByShot; у музыки такой проверки просто не было.
    const bgmSegments = await this.prisma.musicSegment.count({
      where: {
        block:         { projectId },
        approvedJobId: null,
        spare:         false,
        jobs:          { none: { status: { in: ['pending', 'running'] } } },
      } as any,
    });

    return { stages, bgmSegments };
  }

  /**
   * Seconds of work the machine actually completed per day over the recent
   * window — across ALL projects, since they share one GPU. This is what turns
   * GPU-seconds into a date.
   */
  private async throughput(): Promise<{ secondsPerDay: number }> {
    const since = new Date(Date.now() - THROUGHPUT_WINDOW_DAYS * 24 * 3_600_000);
    const agg = await this.entries.aggregate({
      where: { completedAt: { gte: since }, durationMs: { not: null } },
      _sum:  { durationMs: true },
    });
    const totalMs = (agg?._sum?.durationMs as number | null) ?? 0;
    return { secondsPerDay: totalMs / 1000 / THROUGHPUT_WINDOW_DAYS };
  }
}

function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
