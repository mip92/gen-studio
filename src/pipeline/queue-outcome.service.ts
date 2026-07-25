import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Outcome, OutcomeReason } from './queue-entry.types';

/** Types whose output competes to be "the one that shipped". */
const ARTIFACT_TYPES = ['scene', 'video', 'video_post', 'tts', 'bgm', 'anchor'] as const;

/**
 * Reasons that can still change. Everything else is sealed forever:
 * a failure, a cancellation, a hand-deleted artifact and work orphaned by a
 * container delete are all facts about the past that later edits cannot undo.
 */
const MUTABLE_REASONS = ['chosen', 'superseded', 'rejected'] as const;

interface Verdict {
  outcome: Outcome | null;
  reason:  OutcomeReason | null;
}

const CHOSEN:     Verdict = { outcome: 'useful', reason: 'chosen' };
const SUPERSEDED: Verdict = { outcome: 'wasted', reason: 'superseded' };
const REJECTED:   Verdict = { outcome: 'wasted', reason: 'rejected' };
const UNKNOWN:    Verdict = { outcome: null,     reason: 'unknown' };

/**
 * Decides which of the film's spent hours actually made the final cut.
 *
 * The rule the owner asked for: everything done for a scene that did not end up
 * in the finished project is waste — failures, cancellations, re-renders that
 * lost to a later pick, candidates the vision QC refused, and artifacts deleted
 * by hand. This service handles the part that cannot be decided when a job
 * finishes, because "did it ship" depends on a choice made later (or changed
 * later): it re-derives the verdict for completed artifact jobs from the current
 * chosen/approved pointers.
 *
 * Two invariants:
 *   - sealed verdicts are never rewritten (see MUTABLE_REASONS);
 *   - entries whose shot/scene/project no longer exists are left exactly as
 *     they were sealed at deletion time — a film that shipped and was later
 *     tidied up must not turn retroactively into waste.
 */
@Injectable()
export class QueueOutcomeService {
  private readonly logger = new Logger(QueueOutcomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get entries(): any {
    return (this.prisma as any).queueEntry;
  }

  /**
   * Re-derive verdicts for one project (or every project when omitted) and
   * persist only the ones that actually changed. Cheap enough to call on every
   * stats read: it touches just the completed artifact entries whose verdict is
   * still allowed to move.
   */
  async classify(projectId?: string): Promise<{ examined: number; updated: number }> {
    const candidates = await this.entries.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        status:  'completed',
        jobType: { in: [...ARTIFACT_TYPES] },
        OR: [
          { outcome: null },
          { outcomeReason: { in: [...MUTABLE_REASONS] } },
        ],
      },
    });
    if (candidates.length === 0) return { examined: 0, updated: 0 };

    const ctx = await this.loadContext(candidates);
    const now = new Date();
    let updated = 0;

    for (const e of candidates) {
      const verdict = this.verdictFor(e, ctx);
      // Container gone → whatever was sealed at deletion time stands.
      if (verdict === null) continue;
      if (e.outcome === verdict.outcome && e.outcomeReason === verdict.reason) continue;
      await this.entries.update({
        where: { id: e.id },
        data:  { outcome: verdict.outcome, outcomeReason: verdict.reason, classifiedAt: now },
      });
      updated++;
    }

    if (updated > 0) {
      this.logger.log(`classify(${projectId ?? 'all'}): ${updated}/${candidates.length} verdict(s) updated`);
    }
    return { examined: candidates.length, updated };
  }

  /**
   * Verdict for a single entry, or null when its container has been deleted and
   * the question is no longer answerable.
   */
  private verdictFor(e: any, ctx: Context): Verdict | null {
    switch (e.jobType) {
      case 'scene':      return this.sceneVerdict(e, ctx);
      case 'video':      return this.videoVerdict(e, ctx);
      case 'video_post': return this.videoPostVerdict(e, ctx);
      case 'tts':        return this.ttsVerdict(e, ctx);
      case 'bgm':        return this.bgmVerdict(e, ctx);
      case 'anchor':     return this.anchorVerdict(e, ctx);
      default:           return null;
    }
  }

  /**
   * A batch of stills is useful when the shot's chosen frame came out of THIS
   * prompt. Granularity is the job, not the individual candidate: a five-image
   * batch that yielded the keeper was not four fifths wasted — it was one render
   * that did its job.
   */
  private sceneVerdict(e: any, ctx: Context): Verdict | null {
    const shot = e.shotId ? ctx.shots.get(e.shotId) : null;
    if (!shot) return null;
    if (!e.comfyPromptId) return UNKNOWN;

    const images = (shot.renderedImages as Array<{ filename?: string; promptId?: string }> | null) ?? [];
    const mine   = images.filter((img) => img?.promptId === e.comfyPromptId).map((img) => img.filename);

    if (shot.chosenRender && mine.includes(shot.chosenRender)) return CHOSEN;

    // Vision QC that refused every candidate it scored: if this attempt's frames
    // were in that scoring set, the rejection is why they went nowhere.
    const rejection = ctx.rejectedCandidatesByShot.get(e.shotId!);
    if (rejection && mine.some((f) => f && rejection.has(f))) return REJECTED;

    // Frames survive on disk but the shot picked another attempt's frame — or
    // the shot has no pick yet while other attempts exist.
    if (shot.chosenRender) return SUPERSEDED;
    // Nothing chosen anywhere yet: still in play, do not bill it either way.
    return mine.length > 0 ? UNKNOWN : SUPERSEDED;
  }

  private videoVerdict(e: any, ctx: Context): Verdict | null {
    const shot = e.shotId ? ctx.shots.get(e.shotId) : null;
    if (!shot) return null;
    if (shot.chosenVideoId === e.jobId) return CHOSEN;
    if (shot.chosenVideoId) return SUPERSEDED;
    return UNKNOWN;
  }

  /**
   * The combined upscale→RIFE pass rides on a video row. It is useful when that
   * video is the chosen one AND this is the newest completed attempt — an
   * earlier pass whose output a re-run replaced was thrown away, chosen parent
   * or not.
   */
  private videoPostVerdict(e: any, ctx: Context): Verdict | null {
    const shot = e.shotId ? ctx.shots.get(e.shotId) : null;
    if (!shot) return null;
    const newest = ctx.newestPostAttempt.get(e.jobId) ?? e.attemptNumber;
    if (e.attemptNumber < newest) return SUPERSEDED;
    if (shot.chosenVideoId === e.jobId) return CHOSEN;
    if (shot.chosenVideoId) return SUPERSEDED;
    return UNKNOWN;
  }

  private ttsVerdict(e: any, ctx: Context): Verdict | null {
    if (e.shotId) {
      const shot = ctx.shots.get(e.shotId);
      if (!shot) return null;
      if (shot.approvedTTSJobId === e.jobId) return CHOSEN;
      return shot.approvedTTSJobId ? SUPERSEDED : UNKNOWN;
    }
    if (e.sceneId) {
      const scene = ctx.scenes.get(e.sceneId);
      if (!scene) return null;
      if (scene.approvedTTSJobId === e.jobId) return CHOSEN;
      return scene.approvedTTSJobId ? SUPERSEDED : UNKNOWN;
    }
    return UNKNOWN;
  }

  /**
   * Spare music tiles are generated on purpose as backup material and are never
   * "approved", so a completed spare is useful by design, not waste.
   */
  private bgmVerdict(e: any, ctx: Context): Verdict | null {
    const segment = e.segmentId ? ctx.segments.get(e.segmentId) : null;
    if (!segment) return null;
    if (segment.spare) return CHOSEN;
    if (segment.approvedJobId === e.jobId) return CHOSEN;
    return segment.approvedJobId ? SUPERSEDED : UNKNOWN;
  }

  /**
   * Anchor portraits are picked by the anchor-validation pass. Without a verdict
   * from it there is no way to tell which candidate became the profile's anchor,
   * so the entry stays unknown rather than being guessed into a bucket.
   */
  private anchorVerdict(e: any, ctx: Context): Verdict | null {
    if (!e.profileId || !ctx.profiles.has(e.profileId)) return null;
    const pick = ctx.anchorPickByProfile.get(e.profileId);
    if (pick === undefined) return UNKNOWN;
    if (pick === null) return REJECTED;             // QC refused every candidate
    if (!e.outputFilename) return UNKNOWN;
    return basename(e.outputFilename) === basename(pick) ? CHOSEN : SUPERSEDED;
  }

  // ── Context loading ───────────────────────────────────────────────────────

  /** Everything the verdicts need, fetched in a handful of queries up front. */
  private async loadContext(entries: any[]): Promise<Context> {
    const shotIds    = ids(entries, 'shotId');
    const sceneIds   = ids(entries, 'sceneId');
    const segmentIds = ids(entries, 'segmentId');
    const profileIds = ids(entries, 'profileId');
    const postJobIds = entries.filter((e) => e.jobType === 'video_post').map((e) => e.jobId);

    const [shots, scenes, segments, profiles, validations, anchorValidations, postAttempts] = await Promise.all([
      shotIds.length
        ? this.prisma.shot.findMany({
            where:  { id: { in: shotIds } },
            select: { id: true, chosenRender: true, chosenVideoId: true, approvedTTSJobId: true, renderedImages: true },
          })
        : [],
      sceneIds.length
        ? this.prisma.scene.findMany({ where: { id: { in: sceneIds } }, select: { id: true, approvedTTSJobId: true } })
        : [],
      segmentIds.length
        ? this.prisma.musicSegment.findMany({
            where:  { id: { in: segmentIds } },
            select: { id: true, approvedJobId: true, spare: true } as any,
          })
        : [],
      profileIds.length
        ? this.prisma.characterProfile.findMany({ where: { id: { in: profileIds } }, select: { id: true } })
        : [],
      // Vision QC runs that refused everything they scored.
      shotIds.length
        ? (this.prisma as any).imageValidationJob.findMany({
            where:  { shotId: { in: shotIds }, status: 'completed', chosenFilename: null },
            select: { shotId: true, candidates: true },
          })
        : [],
      profileIds.length
        ? (this.prisma as any).anchorValidationJob.findMany({
            where:   { profileId: { in: profileIds }, status: 'completed' },
            select:  { profileId: true, chosenFilename: true, completedAt: true },
            orderBy: { completedAt: 'asc' },
          })
        : [],
      postJobIds.length
        ? this.entries.groupBy({
            by:      ['jobId'],
            where:   { jobType: 'video_post', jobId: { in: postJobIds }, status: 'completed' },
            _max:    { attemptNumber: true },
          })
        : [],
    ]);

    const rejectedCandidatesByShot = new Map<string, Set<string>>();
    for (const v of validations as Array<{ shotId: string; candidates: unknown }>) {
      const list = Array.isArray(v.candidates) ? (v.candidates as unknown[]) : [];
      const set  = rejectedCandidatesByShot.get(v.shotId) ?? new Set<string>();
      for (const c of list) {
        const name = typeof c === 'string' ? c : (c as any)?.filename;
        if (typeof name === 'string') set.add(name);
      }
      rejectedCandidatesByShot.set(v.shotId, set);
    }

    // Latest QC verdict per profile wins; `null` means "refused everything".
    const anchorPickByProfile = new Map<string, string | null>();
    for (const av of anchorValidations as Array<{ profileId: string; chosenFilename: string | null }>) {
      anchorPickByProfile.set(av.profileId, av.chosenFilename ?? null);
    }

    return {
      shots:    new Map((shots as any[]).map((s) => [s.id, s])),
      scenes:   new Map((scenes as any[]).map((s) => [s.id, s])),
      segments: new Map((segments as any[]).map((s) => [s.id, s])),
      profiles: new Set((profiles as any[]).map((p) => p.id)),
      rejectedCandidatesByShot,
      anchorPickByProfile,
      newestPostAttempt: new Map(
        (postAttempts as any[]).map((g) => [g.jobId as string, (g._max?.attemptNumber as number) ?? 1]),
      ),
    };
  }
}

interface Context {
  shots:    Map<string, any>;
  scenes:   Map<string, any>;
  segments: Map<string, any>;
  profiles: Set<string>;
  /** shotId → filenames a QC run scored and refused wholesale. */
  rejectedCandidatesByShot: Map<string, Set<string>>;
  /** profileId → chosen anchor filename, or null when QC refused every candidate. */
  anchorPickByProfile: Map<string, string | null>;
  /** VideoRender.id → highest completed video_post attempt number. */
  newestPostAttempt: Map<string, number>;
}

function ids(entries: any[], key: string): string[] {
  return [...new Set(entries.map((e) => e[key]).filter((x): x is string => !!x))];
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p;
}
