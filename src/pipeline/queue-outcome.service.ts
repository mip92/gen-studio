import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { Outcome, OutcomeReason } from './queue-entry.types';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

/** Types whose output competes to be "the one that shipped". */
const ARTIFACT_TYPES = ['scene', 'video', 'video_post', 'tts', 'bgm', 'anchor', 'prop_anchor'] as const;

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
      case 'anchor':      return this.anchorVerdict(e, ctx);
      case 'prop_anchor': return this.propAnchorVerdict(e, ctx);
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
   * Anchor portraits: the anchor-validation verdict is exact when it exists.
   * Most anchors, though, are approved BY HAND (select/upload — the QC pass is
   * being redesigned), which records nothing per candidate: batches share one
   * accumulating candidates dir, so a manual pick can't be attributed to the
   * job that rendered it. The decision itself IS recoverable from disk — the
   * installed `<profileCode>_anchor.png` — so once it exists the work stops
   * being "unresolved" (that bucket was 2.3 h of long-approved anchors on
   * station, user 2026-08-07): the newest completed batch is billed as the one
   * that delivered, older batches as superseded, and an installed anchor that
   * matches NO candidate (hand-uploaded file) supersedes every batch.
   */
  private anchorVerdict(e: any, ctx: Context): Verdict | null {
    if (!e.profileId || !ctx.profiles.has(e.profileId)) return null;
    const pick = ctx.anchorPickByProfile.get(e.profileId);
    if (pick !== undefined) {
      if (pick === null) return REJECTED;           // QC refused every candidate
      if (!e.outputFilename) return UNKNOWN;
      return basename(e.outputFilename) === basename(pick) ? CHOSEN : SUPERSEDED;
    }
    return this.decisionVerdict(e, ctx.anchorDecisionByProfile.get(e.profileId));
  }

  /** Same decision semantics for object anchors; the entry's jobId → prop link
   *  replaces profileId (prop deletion cascades the job away → sealed stands). */
  private propAnchorVerdict(e: any, ctx: Context): Verdict | null {
    const propId = ctx.propIdByJobId.get(e.jobId);
    if (!propId) return null;
    return this.decisionVerdict(e, ctx.propDecisionByProp.get(propId));
  }

  private decisionVerdict(e: any, dec: AnchorDecision | undefined): Verdict {
    if (!dec || dec.state === 'undecided') return UNKNOWN;
    if (dec.state === 'external') return SUPERSEDED;
    return e.id === dec.newestEntryId ? CHOSEN : SUPERSEDED;
  }

  // ── Context loading ───────────────────────────────────────────────────────

  /** Everything the verdicts need, fetched in a handful of queries up front. */
  private async loadContext(entries: any[]): Promise<Context> {
    const shotIds    = ids(entries, 'shotId');
    const sceneIds   = ids(entries, 'sceneId');
    const segmentIds = ids(entries, 'segmentId');
    const profileIds = ids(entries, 'profileId');
    const postJobIds = entries.filter((e) => e.jobType === 'video_post').map((e) => e.jobId);
    const propJobIds = entries.filter((e) => e.jobType === 'prop_anchor').map((e) => e.jobId);

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
        ? this.prisma.characterProfile.findMany({
            where:  { id: { in: profileIds } },
            select: {
              id: true, profileCode: true,
              // Anchor + candidates live under a LINKED project's data dir — a
              // cameo profile's files sit under its HOME project, so scan all.
              character: { select: { projectLinks: { select: { project: { select: { slug: true } } } } } },
            },
          })
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

    // ── Manual anchor decisions (no QC verdict): recovered from disk ─────────
    const md5cache = new Map<string, string>();
    const newestAnchorEntry = this.newestByKey(entries, 'anchor', (e) => e.profileId);

    const anchorDecisionByProfile = new Map<string, AnchorDecision>();
    for (const p of profiles as any[]) {
      if (anchorPickByProfile.has(p.id)) continue;      // QC path already decides
      const slugs = (p.character?.projectLinks ?? [])
        .map((l: any) => l?.project?.slug)
        .filter((s: any): s is string => !!s);
      const installed = slugs
        .map((s: string) => path.join(APP_ROOT, 'data', s, 'reference', `${p.profileCode}_anchor.png`))
        .find((f: string) => existsSync(f)) ?? null;
      const candDirs = slugs.map((s: string) =>
        path.join(APP_ROOT, 'data', s, 'reference', '_candidates', p.profileCode));
      anchorDecisionByProfile.set(
        p.id,
        this.decideFromDisk(installed, candDirs, newestAnchorEntry.get(p.id) ?? null, md5cache),
      );
    }

    // Object anchors: prop link comes through the job row (entry has no propId).
    const propJobs = propJobIds.length
      ? await (this.prisma as any).propAnchorJob.findMany({
          where:  { id: { in: propJobIds } },
          select: { id: true, propId: true,
                    prop: { select: { id: true, code: true, anchorPath: true,
                                      project: { select: { slug: true } } } } },
        })
      : [];
    const propIdByJobId = new Map<string, string>(
      (propJobs as any[]).filter((j) => j.prop).map((j) => [j.id, j.propId]));
    const newestPropEntry = this.newestByKey(entries, 'prop_anchor',
      (e) => propIdByJobId.get(e.jobId) ?? null);

    const propDecisionByProp = new Map<string, AnchorDecision>();
    for (const j of propJobs as any[]) {
      if (!j.prop || propDecisionByProp.has(j.propId)) continue;
      const installed = j.prop.anchorPath
        ? [path.join(APP_ROOT, ...String(j.prop.anchorPath).split('/'))].find((f) => existsSync(f)) ?? null
        : null;
      const dir = path.join(APP_ROOT, 'data', j.prop.project.slug, 'reference', '_candidates', `OBJ_${j.prop.code}`);
      propDecisionByProp.set(
        j.propId,
        this.decideFromDisk(installed, [dir], newestPropEntry.get(j.propId) ?? null, md5cache),
      );
    }

    return {
      shots:    new Map((shots as any[]).map((s) => [s.id, s])),
      scenes:   new Map((scenes as any[]).map((s) => [s.id, s])),
      segments: new Map((segments as any[]).map((s) => [s.id, s])),
      profiles: new Set((profiles as any[]).map((p) => p.id)),
      rejectedCandidatesByShot,
      anchorPickByProfile,
      anchorDecisionByProfile,
      propIdByJobId,
      propDecisionByProp,
      newestPostAttempt: new Map(
        (postAttempts as any[]).map((g) => [g.jobId as string, (g._max?.attemptNumber as number) ?? 1]),
      ),
    };
  }

  /** Newest completed entry id of `type`, keyed by an entry-derived id. */
  private newestByKey(entries: any[], type: string, keyOf: (e: any) => string | null) {
    const newest = new Map<string, { id: string; queuedAt: Date }>();
    for (const e of entries) {
      if (e.jobType !== type) continue;
      const key = keyOf(e);
      if (!key) continue;
      const cur = newest.get(key);
      if (!cur || e.queuedAt > cur.queuedAt) newest.set(key, { id: e.id, queuedAt: e.queuedAt });
    }
    return new Map([...newest.entries()].map(([k, v]) => [k, v.id]));
  }

  /**
   * The manual-pick decision, from the filesystem: no installed anchor → still
   * undecided; installed and byte-identical to some candidate → a render batch
   * won; installed but matching nothing → hand-uploaded, every batch lost.
   */
  private decideFromDisk(
    installed: string | null,
    candDirs: string[],
    newestEntryId: string | null,
    md5cache: Map<string, string>,
  ): AnchorDecision {
    if (!installed || !newestEntryId) return { state: 'undecided' };
    const hash = this.fileMd5(installed, md5cache);
    if (!hash) return { state: 'undecided' };
    for (const dir of candDirs) {
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
        if (this.fileMd5(path.join(dir, f), md5cache) === hash) {
          return { state: 'rendered', newestEntryId };
        }
      }
    }
    return { state: 'external' };
  }

  private fileMd5(file: string, cache: Map<string, string>): string | null {
    const hit = cache.get(file);
    if (hit) return hit;
    try {
      const h = createHash('md5').update(readFileSync(file)).digest('hex');
      cache.set(file, h);
      return h;
    } catch {
      return null;
    }
  }
}

/** How a manually-approved anchor decision reads from disk (see anchorVerdict). */
type AnchorDecision =
  | { state: 'undecided' }
  | { state: 'external' }
  | { state: 'rendered'; newestEntryId: string };

interface Context {
  shots:    Map<string, any>;
  scenes:   Map<string, any>;
  segments: Map<string, any>;
  profiles: Set<string>;
  /** shotId → filenames a QC run scored and refused wholesale. */
  rejectedCandidatesByShot: Map<string, Set<string>>;
  /** profileId → chosen anchor filename, or null when QC refused every candidate. */
  anchorPickByProfile: Map<string, string | null>;
  /** profileId → manual-pick decision recovered from disk (no QC verdict). */
  anchorDecisionByProfile: Map<string, AnchorDecision>;
  /** prop_anchor entry jobId → propId (via PropAnchorJob; gone = prop deleted). */
  propIdByJobId: Map<string, string>;
  /** propId → manual-pick decision recovered from disk. */
  propDecisionByProp: Map<string, AnchorDecision>;
  /** VideoRender.id → highest completed video_post attempt number. */
  newestPostAttempt: Map<string, number>;
}

function ids(entries: any[], key: string): string[] {
  return [...new Set(entries.map((e) => e[key]).filter((x): x is string => !!x))];
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p;
}
