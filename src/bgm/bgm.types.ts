/**
 * Caller-facing inputs for the BGM module. Block + segment + render shapes.
 * All English string content (mood prompts, tags) per the ACE-Step tokenizer
 * constraint — see [[feedback_db_english_only]].
 */

export interface CreateBlockInput {
  projectId:   string;
  /** Stable English slug, e.g. "start", "growth", "burnout". Unique per project. */
  slug:        string;
  /** Human title for UI; Russian is fine here (not sent to ACE). */
  title?:      string;
  sortOrder?:  number;
  /** Default ACE-Step tags inherited by every segment. English, comma-separated. */
  moodPrompt?: string;
  /** Ordered Shot.id array this block covers. Drives targetSeconds. */
  shotIds:     string[];
}

export interface UpdateBlockInput {
  title?:      string | null;
  sortOrder?:  number;
  moodPrompt?: string | null;
  shotIds?:    string[];
  status?:     'filling' | 'filled' | 'manual';
}

export interface CreateSegmentInput {
  blockId:      string;
  /** Override ACE-Step tags for this segment; null falls back to block.moodPrompt. */
  prompt?:      string | null;
  /** Target seconds. ACE-Step v1.5 spans 1.0–1000.0 but practical sweet spot is 30–180. */
  durationSec?: number;
  sortOrder?:   number;
}

export interface StartRenderInput {
  segmentId:    string;
  /** Override the segment's prompt for this one render (A/B tag variants). */
  prompt?:      string;
  /** Override seconds for this one render (rarely needed; usually equals segment.durationSec). */
  durationSec?: number;
  /** Seed for reproducibility. If omitted, generated randomly per job. */
  seed?:        number;
  /** ACE-Step sampler knobs — sensible defaults baked into the workflow. */
  steps?:       number;
  cfg?:         number;
  samplerName?: string;
  scheduler?:   string;
  /** Number of takes to queue with same prompt/duration, different seeds. Default 1, max 4. */
  count?:       number;
}

export interface AudioRenderParams {
  prompt:      string;
  durationSec: number;
  seed:        number;
  steps:       number;
  cfg:         number;
  samplerName: string;
  scheduler:   string;
}

/**
 * Default ACE-Step v1.5 *Turbo* generation params. Critical values:
 *   - steps=8 — turbo checkpoint is distilled for 8-step inference; 50 steps
 *              drives the sampler off-trajectory and produces noise/squeal.
 *   - cfg=1.0 — turbo workflow uses ConditioningZeroOut on negative, so real
 *              CFG isn't applied; cfg>1 with zeroed-out negative also degrades.
 *   - sampler=euler + scheduler=simple — per the official Comfy-Org template.
 *
 * If we ever swap to non-turbo (xl-base / xl-sft), bump steps to 25–50 and
 * cfg to 2–5.
 */
export const DEFAULT_RENDER_PARAMS = {
  steps:       8,
  cfg:         1.0,
  samplerName: 'euler',
  scheduler:   'simple',
  durationSec: 60,
} as const;
