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
  // Qwen-Image-Edit-2511 pass that turns a shot's approved still into its END
  // frame, for the two-frame (flf2v) video flow. Its own type rather than a
  // flavour of 'scene': it edits an existing image instead of generating one,
  // writes to different columns, and a project can want it for some acts only.
  | 'end_frame'
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
  'training', 'dataset', 'scene', 'end_frame', 'video', 'video_post', 'tts',
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
 *   fish       → ComfyUI must be STOPPED (fish-speech api_server, ~9 GB)
 *   standalone → no arbitration at all (small TTS python subprocess)
 */
export type EngineClass = 'comfy' | 'ollama' | 'whisper' | 'kohya' | 'fish' | 'standalone';

export const ENGINE_CLASS: Record<JobType, EngineClass> = {
  scene:             'comfy',
  end_frame:         'comfy',
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
  // Per-JOB in practice: silero/xtts2/f5/qwen3 are modest subprocesses that can
  // share the card with ComfyUI, but fish_s2 cannot — see engineClassFor().
  tts:               'standalone',
};

/**
 * The engine class ONE unit of work needs.
 *
 * Only TTS is polymorphic, and only for fish_s2: that engine does not load a
 * model in-process like the other four — it drives a persistent fish-speech
 * api_server that holds ~9 GB of the 16 GB card. Leaving it in 'standalone'
 * (2026-08-17 → 2026-08-20) meant dispatch never freed the GPU for it, so the
 * model load ran against a ComfyUI that already owned ~10.7 GB: a ~5 min load
 * became 18-110 min, generation crawled at 0.74 tok/s, and every job died on
 * the worker's socket timeout ("inference failed: TimeoutError") or on the
 * health check of a server still stuck loading ("did not come up within 120s").
 * 47 fish jobs failed that way.
 */
export function engineClassFor(
  jobType: JobType,
  opts: { ttsEngine?: string | null } = {},
): EngineClass {
  if (jobType === 'tts' && opts.ttsEngine === 'fish_s2') return 'fish';
  return ENGINE_CLASS[jobType];
}

/**
 * Same decision, made from a stored row instead of the job record.
 *
 * The TTS engine is already in `groupKey` (`tts:<engine>`), so this also
 * upgrades entries written BEFORE the 'fish' class existed — the 447 pending
 * fish rows keep their stale `engineClass: 'standalone'` in the DB, and
 * re-deriving here is what makes them arbitrate correctly anyway.
 */
export function engineClassForEntry(
  row: { jobType: JobType; engineClass: string; groupKey: string },
): EngineClass {
  if (row.jobType === 'tts') {
    return engineClassFor('tts', { ttsEngine: row.groupKey.split(':')[1] ?? null });
  }
  return row.engineClass as EngineClass;
}

/**
 * The RESIDENT GPU services — the ones that keep holding VRAM after the job
 * that needed them is over, so somebody has to switch them off:
 *
 *   comfy  → ComfyUI server (port 8188), stays up between renders by design
 *   ollama → the vision/text model stays resident until unloaded (keep_alive)
 *   fish   → fish-speech api_server, frees itself only after 15 min of idling
 *
 * whisper and kohya are NOT here: they are subprocesses that exit with the job
 * and take their VRAM with them, so there is nothing to release afterwards.
 */
export type GpuService = 'comfy' | 'ollama' | 'fish';

export const GPU_SERVICES: readonly GpuService[] = ['comfy', 'ollama', 'fish'] as const;

/**
 * Which resident service this job class runs ON — the one that must be UP, and
 * the only one allowed to keep the card while the job runs.
 *
 * This is the whole arbitration rule in one function: the system runs exactly
 * one heavy thing at a time, so dispatch releases every service except this
 * one. `null` means the job brings its own process (whisper, kohya) and wants
 * the card empty. It replaces `needsComfyStopped()`, which only ever answered
 * half the question — "must ComfyUI go?" — and so left the other pairings
 * unhandled: an Ollama model stayed resident through a whisper, kohya or fish
 * job, and the fish server stayed resident through everything except a ComfyUI
 * cold start.
 */
export function gpuServiceFor(engineClass: EngineClass): GpuService | null {
  switch (engineClass) {
    case 'comfy':  return 'comfy';
    case 'ollama': return 'ollama';
    case 'fish':   return 'fish';
    // Bring their own GPU process; it exits with the job.
    case 'whisper':
    case 'kohya':  return null;
    // Not a GPU tenant at all — see ENGINE_CLASS.tts.
    case 'standalone': return null;
  }
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
    // Always the Qwen-Image-Edit-2511 chain regardless of the project's visual
    // style — it is the only model on disk that EDITS an image rather than
    // regenerating it, which is the whole point of an end frame. One group, so a
    // batch of end frames drains without reloading the checkpoint between shots.
    case 'end_frame':  return 'end_frame:qwen';
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

