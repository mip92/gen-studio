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
  | 'caption'
  | 'thumbnail'
  | 'thumbnail_ideas'
  // Object anchor for a PROP. Separate from 'anchor', which is keyed by
  // CharacterProfile — props are their own entity (user 2026-08-01).
  | 'prop_anchor'
  // Project-wide VO QC batch: ONE run transcribes + analyses every narration
  // wav due for checking (VoValidationRun). Whisper engine class — same GPU
  // arbitration as 'caption'.
  | 'vo_validation'
  // Project-wide image QC batch (ImageQcRun): DWPose/scrfd deterministic gate
  // + targeted Qwen fact-checklist. Replaces the retired per-shot 'validation'
  // LLM-judge flow — that type stays in the vocabulary only so its history
  // rows keep rendering; nothing enqueues it anymore.
  | 'image_qc'
  // Project-wide video QC batch (VideoQcRun): deterministic clip scanner
  // (motion energy, skin-hue drift, closing-frame anatomy) + anchored Qwen-VL
  // check of suspicious frames. Advisory only — never picks or gates a clip.
  | 'video_qc';

export const JOB_TYPES: readonly JobType[] = [
  'training', 'dataset', 'scene', 'video', 'video_post', 'tts',
  'bgm', 'anchor', 'validation', 'anchor_validation', 'caption',
  'thumbnail', 'thumbnail_ideas', 'prop_anchor', 'vo_validation',
  'image_qc', 'video_qc',
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
  prop_anchor:       'comfy',
  thumbnail:         'comfy',
  dataset:           'comfy',
  validation:        'ollama',
  anchor_validation: 'ollama',
  thumbnail_ideas:   'ollama',
  caption:           'whisper',
  vo_validation:     'whisper',
  // Pose worker holds the GPU via onnxruntime-cuda, then the fact stage loads
  // the Ollama vision model — both need the card to themselves.
  image_qc:          'ollama',
  // Same shape: torch-GPU scanner subprocess, then Ollama for flagged moments.
  video_qc:          'ollama',
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
  // Writing cover concepts produces no rival artifact — it is overhead the
  // finished film paid for, like a QC pass.
  'thumbnail_ideas',
  // VO QC pass — same reasoning as 'validation'/'caption'.
  'vo_validation',
  // Image QC pass — same reasoning.
  'image_qc',
  // Video QC pass — same reasoning.
  'video_qc',
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
 * a new entry is filed behind its group's last pending sibling when it is
 * enqueued (`QueueLedgerService.groupedRank`). Nothing reorders at dispatch.
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
    // Same graph as a character anchor, so the same model stays resident.
    case 'prop_anchor': return `anchor:${opts.visualStyle ?? 'default'}`;
    // Its own group, never batched with scenes: the thumbnail graph deliberately
    // drops the Lightning speed LoRA and raises steps/cfg, so it reloads the
    // model chain anyway — and there is at most one of these per project.
    case 'thumbnail':  return 'thumbnail:qwen';
    case 'dataset':    return `dataset:${opts.visualStyle ?? 'default'}`;
    case 'tts':        return `tts:${opts.ttsEngine ?? 'silero'}`;
    case 'bgm':        return 'bgm:acestep';
    case 'validation':
    case 'anchor_validation': return 'ollama:vision';
    // Loads its own (pose) models first, but its Ollama stage uses the same
    // vision model as anchor validation — share the group.
    case 'image_qc':          return 'ollama:vision';
    case 'video_qc':          return 'ollama:vision';
    // Own group: this one loads the 30B, the validators load the 8B, and
    // interleaving them would swap models on every entry.
    case 'thumbnail_ideas':   return 'ollama:ideas';
    case 'caption':    return 'whisper';
    // Same group as 'caption' — both load faster-whisper, so back-to-back
    // entries skip a model reload window.
    case 'vo_validation': return 'whisper';
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

