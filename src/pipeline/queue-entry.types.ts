/**
 * Shared vocabulary for the unified queue/ledger (`queue_entries`).
 *
 * Every job type in the studio enters the GPU through exactly one path, in one
 * order, and leaves behind exactly one permanent record per attempt. This file
 * is the single place that knows the type list, which engine each type needs,
 * and how types are grouped for batching — the three facts that used to be
 * scattered across PipelineQueueService, PipelineController and TTSService.
 */

/**
 * Every unit of work the pipeline dispatches.
 *
 * `video_post` is the combined one-pass upscale→RIFE job: ONE ComfyUI prompt
 * (`video_upscale_interp_api.json`) saves BOTH the FHD and the smooth clip.
 * There is deliberately no `video_interp` type — splitting the pair into two
 * queue jobs was a rudiment of the pre-2026-07-21 two-step path and was the
 * reason the dispatcher needed a "sticky pair" hack at all.
 */
export type JobType =
  | 'training'
  | 'dataset'
  | 'scene'
  | 'video'
  | 'video_post'
  | 'tts'
  | 'bgm'
  | 'anchor'
  | 'validation'
  | 'anchor_validation'
  | 'caption';

export const JOB_TYPES: readonly JobType[] = [
  'training', 'dataset', 'scene', 'video', 'video_post', 'tts',
  'bgm', 'anchor', 'validation', 'anchor_validation', 'caption',
] as const;

export function isJobType(t: string): t is JobType {
  return (JOB_TYPES as readonly string[]).includes(t);
}

/** Lifecycle of a queue entry. Terminal states are never updated again. */
export type QueueStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped';

export const ACTIVE_STATUSES: readonly QueueStatus[]   = ['pending', 'running'] as const;
export const TERMINAL_STATUSES: readonly QueueStatus[] = ['completed', 'failed', 'cancelled', 'skipped'] as const;

export function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * Which mutually-exclusive engine a job needs. The 16 GB card cannot host two
 * of these at once, which is why the queue is single-slot and why dispatch has
 * to arbitrate before starting work.
 *
 *   comfy      → ComfyUI must be ALIVE (auto-started if down)
 *   ollama     → ComfyUI must be STOPPED (vision model needs the whole card)
 *   whisper    → ComfyUI must be STOPPED (faster-whisper on GPU)
 *   kohya      → ComfyUI must be STOPPED (LoRA training)
 *   standalone → no arbitration at all (TTS python subprocess)
 */
export type EngineClass = 'comfy' | 'ollama' | 'whisper' | 'kohya' | 'standalone';

export const ENGINE_CLASS: Record<JobType, EngineClass> = {
  scene:             'comfy',
  video:             'comfy',
  video_post:        'comfy',
  bgm:               'comfy',
  anchor:            'comfy',
  dataset:           'comfy',
  validation:        'ollama',
  anchor_validation: 'ollama',
  caption:           'whisper',
  training:          'kohya',
  tts:               'standalone',
};

/** True when starting this job requires tearing ComfyUI down first. */
export function needsComfyStopped(engineClass: EngineClass): boolean {
  return engineClass === 'ollama' || engineClass === 'whisper' || engineClass === 'kohya';
}

/**
 * How this attempt's time is accounted against the film.
 *
 *   useful → the output shipped, or the work is necessary infrastructure with
 *            no competing candidate (QC passes, dataset builds, LoRA training)
 *   wasted → time that produced nothing in the final cut
 */
export type Outcome = 'useful' | 'wasted';

/**
 * Why an attempt landed in its bucket. `unknown` is reserved for rows whose
 * linkage genuinely cannot be reconstructed — it is deliberately NOT folded
 * into either bucket, so a partial history never masquerades as a complete one.
 */
export type OutcomeReason =
  | 'chosen'      // useful: this exact artifact is the chosen/approved one
  | 'infra'       // useful: QC / dataset / training / captioning — no rival candidate
  | 'superseded'  // wasted: completed fine, but a different attempt won
  | 'rejected'    // wasted: vision QC refused every candidate from this attempt
  | 'failed'      // wasted: errored out
  | 'cancelled'   // wasted: cancelled by the user
  | 'deleted'     // wasted: the artifact was deleted by hand
  | 'orphaned'    // wasted: its shot/scene/project was deleted before it resolved
  | 'unknown';    // unclassifiable (backfill could not reconstruct the linkage)

/** Reasons that mean "this time counted towards the finished film". */
export const USEFUL_REASONS: readonly OutcomeReason[] = ['chosen', 'infra'] as const;

/**
 * Job types with no competing-candidate concept: they are pipeline overhead
 * that a finished film necessarily paid for, so a completed one is `useful`
 * (only a failure or cancellation is waste).
 */
export const INFRA_JOB_TYPES: readonly JobType[] = [
  'validation', 'anchor_validation', 'caption', 'dataset', 'training',
] as const;

export function isInfraJobType(t: JobType): boolean {
  return (INFRA_JOB_TYPES as readonly string[]).includes(t);
}

/**
 * The production stages a shot must pass through, in order. Used by the
 * forecast to price work that has not been enqueued yet — at the
 * scene-generation stage a shot still owes its video, post and narration.
 */
export const SHOT_STAGES: readonly JobType[] = ['scene', 'video', 'video_post', 'tts'] as const;

/**
 * Batching group for a unit of work: the WORKFLOW/MODEL identity, not the job
 * type. Two entries sharing a group can run back-to-back without ComfyUI
 * unloading and reloading checkpoints (~30 s instead of ~2.5 min), which is why
 * the dispatcher prefers to drain a group before switching.
 *
 * Scene and anchor renders resolve their exact graph per shot deep inside the
 * render strategies — far too expensive to recompute every tick — so the
 * project's visual style stands in for "which checkpoint is loaded". That is the
 * right granularity in practice, since a style pins the model family.
 *
 * Lives here, next to the job-type list, so the live queue and the one-off
 * backfill cannot drift apart on it.
 */
export function groupKeyFor(
  jobType: JobType,
  opts: { visualStyle?: string | null; workflowFilename?: string | null; ttsEngine?: string | null } = {},
): string {
  switch (jobType) {
    case 'video':      return `video:${opts.workflowFilename ?? 'default'}`;
    case 'video_post': return 'video_post';
    case 'scene':      return `scene:${opts.visualStyle ?? 'default'}`;
    case 'anchor':     return `anchor:${opts.visualStyle ?? 'default'}`;
    case 'dataset':    return `dataset:${opts.visualStyle ?? 'default'}`;
    case 'tts':        return `tts:${opts.ttsEngine ?? 'silero'}`;
    case 'bgm':        return 'bgm:acestep';
    case 'validation':
    case 'anchor_validation': return 'ollama:vision';
    case 'caption':    return 'whisper';
    case 'training':   return 'kohya';
  }
}

/** Spacing between adjacent ranks when appending to the back of the queue. */
export const RANK_GAP = 65_536;

/**
 * Below this, a midpoint insertion has exhausted double precision between two
 * neighbours and the pending set must be renumbered before inserting.
 */
export const RANK_MIN_GAP = 1e-6;

/** Ceiling on consecutive same-groupKey dispatches, so batching cannot run forever. */
export const MAX_BATCH_RUN = 20;

/**
 * How long the true head of the queue may be held back by same-groupKey
 * batching before it is forced through regardless. Bounds the cost of the
 * model-reload optimisation for a job the user just moved to the front.
 */
export const BATCH_STARVATION_MS = 15 * 60 * 1000;
