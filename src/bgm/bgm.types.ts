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
  /** Nominal tile length in seconds (TILE_SECONDS). The whole flac plays on
   *  the CapCut timeline now — tiles are laid checkerboard on two lanes per
   *  act and overlap by CROSSFADE_SECONDS, so there is no crop-to-slot. */
  durationSec: number;
  /** Actual seconds the ACE-Step pipeline was asked to render. Equals
   *  `durationSec + OVERGEN_SECONDS` (capped at 240). Kept so the export knows
   *  the real flac length when laying the tile at full length. */
  renderSec:   number;
  seed:        number;
  steps:       number;
  cfg:         number;
  samplerName: string;
  scheduler:   string;
}

/**
 * Render exactly what the caller asks for — no auto-padding. Earlier versions
 * added a 10s tail so the CapCut export's source_timerange cut landed inside
 * overgenerated material; the user prefers transparency over that smoothing
 * and asks 50s manually when they want fade-out tail. The export still
 * applies a fade-out on the actual segment end, so cuts stay soft.
 */
export const OVERGEN_SECONDS = 0;
/** Hard ceiling — ACE-Step works up to ~240 s before quality starts to drift. */
export const RENDER_MAX_SECONDS = 240;

/**
 * Music layout per act (= NarrativeBlock). The act is auto-tiled into
 * fixed-length tracks:
 *   - TILE_SECONDS      one track = 150 s (well under RENDER_MAX_SECONDS).
 *   - main tile count   = ceil(actLengthSeconds / TILE_SECONDS), laid
 *                         checkerboard on two lanes (a/b) that overlap by
 *                         CROSSFADE_SECONDS so one track fades out while the
 *                         next fades in.
 *   - SPARE_TRACK_COUNT extra tracks generated on the same act mood prompt and
 *                         dropped raw (no fade, no trim) on their own lanes —
 *                         the editor uses them to trim silence / reshuffle by
 *                         hand. Per user spec: «плюс два запасных трека на акт».
 */
export const TILE_SECONDS       = 150;
export const CROSSFADE_SECONDS   = 3;
export const SPARE_TRACK_COUNT   = 2;

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
  durationSec: TILE_SECONDS,
} as const;
