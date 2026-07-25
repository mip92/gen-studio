/**
 * Backfill `queue_entries` from the eleven job tables.
 *
 * The queue/ledger is both the queue and the render history, so on the day it
 * ships it has to already contain the past — otherwise the film's "time spent"
 * total would start at zero despite tens of thousands of finished renders.
 * Every source row carries real `startedAt`/`completedAt`, so the timings
 * recovered here are measured facts, not estimates.
 *
 * Properties:
 *   - IDEMPOTENT. Skips any (jobType, jobId, attemptNumber) that already exists,
 *     so it is safe to re-run, and safe to interrupt and resume.
 *   - ADDITIVE. Reads the job tables, writes only to queue_entries.
 *   - ORDER-PRESERVING. Pending rows get ranks in exactly their current dispatch
 *     order (the old FIFO timestamps), so the cutover reshuffles nothing.
 *
 * Honest about what it cannot know:
 *   - Failed video renders from before this change are GONE — the old boot sweep
 *     hard-deleted every one of them on every restart. Only the handful caught
 *     between the last restart and now can be recovered, so the historical video
 *     defect rate is a lower bound. Forward data is exact.
 *   - Post-pass (upscale→RIFE) retries overwrote their own columns, so only the
 *     latest attempt per row exists; those entries are flagged historyTruncated.
 *   - `outcome` is left NULL for completed artifact work: whether it shipped is
 *     decided by the current chosen/approved pointers, and QueueOutcomeService
 *     resolves that on the first stats read (one implementation, not two).
 *
 * Run (backend stopped): npx tsx scripts/backfill_queue_entries.ts [--dry-run]
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '../generated/prisma/client';
// Same derivation the live queue uses, so historical rows are grouped the way
// new ones will be.
import { ENGINE_CLASS, JobType, groupKeyFor, isInfraJobType } from '../src/pipeline/queue-entry.types';

const prisma = new PrismaClient();
const DRY = process.argv.includes('--dry-run');

const RANK_GAP = 65_536;

/** A row destined to become a queue entry. */
interface Draft {
  jobType:  JobType;
  jobId:    string;
  status:   string;
  /** The row's original FIFO timestamp — used both for `queuedAt` and for ranking. */
  queuedAt: Date;
  startedAt:   Date | null;
  completedAt: Date | null;
  comfyPromptId:    string | null;
  outputFilename:   string | null;
  workflowFilename: string | null;
  errorMessage:     string | null;
  paramsSnapshot:   unknown;
  groupHint:        string | null;
  historyTruncated: boolean;
  // identity
  projectId?: string | null; sceneId?: string | null; shotId?: string | null;
  profileId?: string | null; segmentId?: string | null;
  labelPrefix: string;
  labelCore:   string;
}

/**
 * Normalise a source status into the ledger's vocabulary.
 *
 * A row that was `running` when the backend stopped becomes `pending`: the work
 * died with the process, so it has to be re-dispatched. If ComfyUI happens to
 * still be holding the prompt, the reconcile pass adopts the row back into
 * `running` on the first tick.
 */
function normaliseStatus(raw: string | null): string {
  if (!raw) return 'pending';
  if (raw === 'running' || raw === 'preparing' || raw === 'captioning' || raw === 'training') return 'pending';
  if (raw === 'blocked') return 'pending';   // gated jobs are re-gated by promoteBlocked()
  return raw;
}

function isTerminal(status: string): boolean {
  return ['completed', 'failed', 'cancelled', 'skipped'].includes(status);
}

async function main() {
  console.log(`Backfilling queue_entries${DRY ? ' (DRY RUN — nothing will be written)' : ''}…`);

  const existing = await (prisma as any).queueEntry.findMany({
    select: { jobType: true, jobId: true, attemptNumber: true },
  });
  const seen = new Set<string>(existing.map((e: any) => `${e.jobType}|${e.jobId}|${e.attemptNumber}`));
  console.log(`  already present: ${existing.length} entr(ies)`);

  const drafts: Draft[] = [];

  // ── scene renders ────────────────────────────────────────────────────────
  for (const r of await prisma.sceneRenderJob.findMany({
    include: { shot: { include: { project: true, scene: true } } },
  })) {
    drafts.push({
      jobType: 'scene', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: r.comfyPromptId, outputFilename: null, workflowFilename: null,
      errorMessage: r.errorMessage, paramsSnapshot: r.params, groupHint: null,
      historyTruncated: false,
      projectId: r.shot?.projectId, sceneId: r.shot?.sceneId, shotId: r.shotId,
      labelPrefix: '', labelCore: r.shot?.shotCode ?? r.shotId,
    });
  }

  // ── video renders: base stage + post stage, two entries on one row ───────
  const videos = await prisma.videoRender.findMany({
    include: { shot: { include: { project: true, scene: true } } },
  });
  for (const r of videos) {
    drafts.push({
      jobType: 'video', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: r.comfyPromptId, outputFilename: r.outputFilename,
      workflowFilename: r.workflowFilename, errorMessage: r.errorMessage,
      paramsSnapshot: r.params, groupHint: r.workflowFilename,
      historyTruncated: false,
      projectId: r.shot?.projectId, sceneId: r.shot?.sceneId, shotId: r.shotId,
      labelPrefix: '', labelCore: r.shot?.shotCode ?? r.shotId,
    });
    // The post pass exists only if it was ever requested. Its own FIFO timestamp
    // is the fallback chain the queue used to read.
    if (r.upscaleStatus) {
      drafts.push({
        jobType: 'video_post', jobId: r.id, status: normaliseStatus(r.upscaleStatus),
        queuedAt: r.upscaleQueuedAt ?? r.upscaleStartedAt ?? r.queuedAt,
        startedAt: r.upscaleStartedAt, completedAt: r.upscaleCompletedAt,
        comfyPromptId: r.upscalePromptId,
        outputFilename: r.interpFilename ?? r.upscaledFilename,
        workflowFilename: 'video_upscale_interp_api.json',
        errorMessage: r.upscaleErrorMessage,
        paramsSnapshot: { multiplier: r.interpMultiplier },
        groupHint: null,
        // Re-runs wiped their own columns long before this ledger existed, so an
        // earlier attempt may have happened and left no trace.
        historyTruncated: true,
        projectId: r.shot?.projectId, sceneId: r.shot?.sceneId, shotId: r.shotId,
        labelPrefix: '', labelCore: `${r.shot?.shotCode ?? r.shotId} ↑FHD⏩FPS`,
      });
    }
  }

  // ── TTS ──────────────────────────────────────────────────────────────────
  for (const r of await prisma.tTSJob.findMany({
    include: { shot: { include: { project: true, scene: true } }, scene: { include: { project: true } } },
  })) {
    const shotLevel = !!r.shot;
    drafts.push({
      jobType: 'tts', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: null, outputFilename: r.outputFilename, workflowFilename: null,
      errorMessage: r.errorMessage,
      paramsSnapshot: { voice: r.voice, engine: r.engine, sampleRate: r.sampleRate, rate: r.rate },
      groupHint: r.engine ?? 'silero', historyTruncated: false,
      projectId: shotLevel ? r.shot!.projectId : r.scene?.projectId,
      sceneId:   shotLevel ? r.shot!.sceneId   : r.sceneId,
      shotId:    r.shotId,
      labelPrefix: '🔊 ',
      labelCore: shotLevel ? (r.shot!.shotCode) : (r.scene?.sceneKey ?? r.voice),
    });
  }

  // ── BGM ──────────────────────────────────────────────────────────────────
  for (const r of await prisma.audioRenderJob.findMany({
    include: { segment: { include: { block: { include: { project: true } } } } },
  })) {
    drafts.push({
      jobType: 'bgm', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: r.comfyPromptId, outputFilename: r.outputFilename,
      workflowFilename: r.workflowFilename, errorMessage: r.errorMessage,
      paramsSnapshot: r.params, groupHint: null, historyTruncated: false,
      projectId: r.segment?.block?.projectId, segmentId: r.segmentId,
      labelPrefix: '🎵 ', labelCore: r.segment?.block?.slug ?? r.segmentId,
    });
  }

  // ── profile-scoped work: anchors, validations, datasets, training ────────
  const profiles = new Map<string, { code: string; charCode: string; projectId: string | null }>();
  for (const p of await prisma.characterProfile.findMany({
    include: {
      character: {
        include: { project: true, projectLinks: { include: { project: { select: { id: true } } } } },
      },
    },
  })) {
    const ch = p.character as any;
    profiles.set(p.id, {
      code:      p.profileCode,
      charCode:  ch?.code ?? '',
      projectId: ch?.project?.id ?? ch?.projectLinks?.[0]?.project?.id ?? null,
    });
  }

  const profileScoped: Array<[JobType, any[], string, (r: any) => string | null]> = [
    ['anchor',            await (prisma as any).anchorRenderJob.findMany(),     '🎭 ',   (r) => r.outputPath ?? null],
    ['anchor_validation', await (prisma as any).anchorValidationJob.findMany(), '🔎🎭 ', (r) => r.chosenFilename ?? null],
    ['dataset',           await prisma.datasetJob.findMany(),                   '',      () => null],
    ['training',          await prisma.trainingJob.findMany(),                  '',      (r) => r.outputLoraPath ?? null],
  ];
  for (const [jobType, rows, labelPrefix, outputOf] of profileScoped) {
    for (const r of rows) {
      const p = profiles.get(r.profileId);
      drafts.push({
        jobType, jobId: r.id, status: normaliseStatus(r.status),
        queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
        comfyPromptId: r.comfyPromptId ?? null, outputFilename: outputOf(r),
        workflowFilename: null, errorMessage: r.errorMessage ?? null,
        paramsSnapshot: r.progress ?? null, groupHint: null, historyTruncated: false,
        projectId: p?.projectId ?? null, profileId: r.profileId,
        labelPrefix, labelCore: p?.code ?? r.profileId,
      });
    }
  }

  // ── image validation ─────────────────────────────────────────────────────
  for (const r of await (prisma as any).imageValidationJob.findMany({
    include: { shot: { include: { project: true, scene: true } } },
  })) {
    drafts.push({
      jobType: 'validation', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: null, outputFilename: r.chosenFilename ?? null,
      workflowFilename: null, errorMessage: r.errorMessage ?? null,
      paramsSnapshot: { candidates: r.candidates }, groupHint: null, historyTruncated: false,
      projectId: r.shot?.projectId, sceneId: r.shot?.sceneId, shotId: r.shotId,
      labelPrefix: '🔎 ', labelCore: r.shot?.shotCode ?? r.shotId,
    });
  }

  // ── captions ─────────────────────────────────────────────────────────────
  for (const r of await (prisma as any).captionJob.findMany()) {
    drafts.push({
      jobType: 'caption', jobId: r.id, status: normaliseStatus(r.status),
      queuedAt: r.queuedAt, startedAt: r.startedAt, completedAt: r.completedAt,
      comfyPromptId: null, outputFilename: r.srtPath ?? null, workflowFilename: null,
      errorMessage: r.errorMessage ?? null,
      paramsSnapshot: { videoId: r.videoId, language: r.language }, groupHint: null,
      historyTruncated: false,
      projectId: r.projectId, labelPrefix: '', labelCore: '💬 субтитры',
    });
  }

  // ── resolve project/scene/shot names for the snapshot ─────────────────────
  const projects = new Map<string, { slug: string; name: string; visualStyle: string }>();
  for (const p of await prisma.project.findMany({ select: { id: true, slug: true, name: true, visualStyle: true } })) {
    projects.set(p.id, { slug: p.slug, name: p.name, visualStyle: p.visualStyle });
  }
  const scenes = new Map<string, string>();
  for (const s of await prisma.scene.findMany({ select: { id: true, sceneKey: true } })) scenes.set(s.id, s.sceneKey);
  const shots = new Map<string, string>();
  for (const s of await prisma.shot.findMany({ select: { id: true, shotCode: true } })) shots.set(s.id, s.shotCode);

  // ── ranking: pending first, in their existing dispatch order ─────────────
  // Terminal rows still get a rank (the column is NOT NULL) but it never
  // influences anything — they are out of the running for the slot.
  const pending  = drafts.filter((d) => d.status === 'pending').sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
  const terminal = drafts.filter((d) => d.status !== 'pending').sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());
  const rankOf = new Map<Draft, number>();
  pending.forEach((d, i) => rankOf.set(d, (i + 1) * RANK_GAP));
  // Park history behind the live queue so an accidental resurrection can never
  // jump the line.
  terminal.forEach((d, i) => rankOf.set(d, (pending.length + i + 1) * RANK_GAP));

  console.log(`  drafted: ${drafts.length} (${pending.length} pending, ${terminal.length} terminal)`);

  let written = 0, skipped = 0;
  const truncatedPost: string[] = [];

  for (const d of [...pending, ...terminal]) {
    const key = `${d.jobType}|${d.jobId}|1`;
    if (seen.has(key)) { skipped++; continue; }

    const project = d.projectId ? projects.get(d.projectId) : undefined;
    const p = d.profileId ? profiles.get(d.profileId) : undefined;
    const terminalNow = isTerminal(d.status);
    const durationMs = d.startedAt && d.completedAt
      ? Math.max(0, d.completedAt.getTime() - d.startedAt.getTime())
      : null;

    // Failures and cancellations are waste on their face. A finished infra job is
    // useful. Everything else stays unresolved for QueueOutcomeService.
    const outcome =
      d.status === 'failed'    ? 'wasted'
      : d.status === 'cancelled' ? 'wasted'
      : d.status === 'completed' && isInfraJobType(d.jobType) ? 'useful'
      : null;
    const outcomeReason =
      d.status === 'failed'    ? 'failed'
      : d.status === 'cancelled' ? 'cancelled'
      : outcome === 'useful'     ? 'infra'
      : null;

    if (d.jobType === 'video_post' && d.historyTruncated) truncatedPost.push(d.jobId);

    if (!DRY) {
      await (prisma as any).queueEntry.create({
        data: {
          jobType: d.jobType, jobId: d.jobId, attemptNumber: 1,
          status: d.status,
          engineClass: ENGINE_CLASS[d.jobType],
          groupKey: groupKeyFor(d.jobType, {
            visualStyle:      project?.visualStyle ?? null,
            workflowFilename: d.groupHint ?? d.workflowFilename,
            ttsEngine:        d.groupHint,
          }),
          rank: rankOf.get(d)!,
          projectId: d.projectId ?? null,
          projectSlug: project?.slug ?? null,
          projectName: project?.name ?? null,
          sceneId: d.sceneId ?? null,
          sceneKey: d.sceneId ? scenes.get(d.sceneId) ?? null : null,
          shotId: d.shotId ?? null,
          shotCode: d.shotId ? shots.get(d.shotId) ?? null : null,
          profileId: d.profileId ?? null,
          profileCode: p?.code ?? null,
          characterCode: p?.charCode ?? null,
          segmentId: d.segmentId ?? null,
          blockSlug: null,
          label: `${d.labelPrefix}${d.labelCore}`,
          workflowFilename: d.workflowFilename,
          comfyPromptId: d.comfyPromptId,
          outputFilename: d.outputFilename,
          paramsSnapshot: (d.paramsSnapshot ?? null) as any,
          outcome, outcomeReason,
          classifiedAt: outcome ? new Date() : null,
          queuedAt: d.queuedAt,
          startedAt: d.startedAt,
          completedAt: terminalNow ? (d.completedAt ?? d.startedAt ?? d.queuedAt) : null,
          durationMs,
          errorMessage: d.errorMessage,
          backfilled: true,
          historyTruncated: d.historyTruncated,
        },
      });
    }
    written++;
  }

  // ── report ───────────────────────────────────────────────────────────────
  const measured = drafts.filter((d) => d.startedAt && d.completedAt);
  const totalMs  = measured.reduce((sum, d) => sum + Math.max(0, d.completedAt!.getTime() - d.startedAt!.getTime()), 0);

  console.log(`\n  written: ${written}, skipped (already present): ${skipped}`);
  console.log(`  measured attempts: ${measured.length}, real elapsed time recovered: ${(totalMs / 3_600_000).toFixed(1)} h`);
  console.log(`  post-pass entries flagged historyTruncated: ${truncatedPost.length}`);
  console.log(
    '\n  CAVEAT: failed video renders from before this change were hard-deleted by the\n' +
    '  old boot sweep, so the historical video defect rate is a LOWER BOUND.\n' +
    '  Forward data is exact.',
  );
  if (DRY) console.log('\n  DRY RUN — nothing was written.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
