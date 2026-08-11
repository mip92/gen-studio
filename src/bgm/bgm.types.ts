/**
 * Caller-facing inputs for the BGM module. Block + segment + render shapes.
 * All English string content (mood prompts, tags) per the ACE-Step tokenizer
 * constraint — see [[feedback_db_english_only]].
 */

// ── ACE-Step 1.5 metadata conditioning ──────────────────────────────────────
//
// `TextEncodeAceStepAudio1.5` does NOT send the tag string alone. The tokenizer
// (comfy/text_encoders/ace15.py, `_metas_to_cap` / `_metas_to_cot`) renders bpm,
// timesignature, keyscale and duration into the model prompt as a labelled text
// block, and again as a pre-filled `<think>` YAML for the audio-code LM:
//
//   # Caption
//   <tags>
//
//   # Metas
//   - bpm: 120
//   - timesignature: 4
//   - keyscale: A minor
//   - duration: 150 seconds
//
// So a caption reading "very slow 44 bpm" while these say 120 is a literal
// contradiction stated twice with authority to a 0.6B planner — it commits to
// neither and the pulse lands between them. That was the cause of the reported
// «битый ритм»: patch() used to leave all three at the template defaults while
// 369 of 385 seeded captions named a different tempo.
//
// Rule: the metas are the authority, the caption carries no numbers.
// Prompt-writing rules live in Skill(gen-studio-acestep).
//
// ComfyUI exposes no `thinking` / `use_cot_metas` toggle, so the upstream advice
// "let the model infer bpm and key from the caption" is unavailable here — the
// node always passes explicit metas. Getting them right is on us.

/** `bpm` node input bounds (IO.Int min/max in comfy_extras/nodes_ace.py). */
export const ACE_BPM_MIN = 10;
export const ACE_BPM_MAX = 300;

/**
 * `timesignature` combo options — **bare digits**. Guides say "4/4"; the node
 * has no such option and an unknown combo value fails ComfyUI validation, which
 * fails the whole prompt on a single-slot queue.
 */
export const ACE_TIMESIGNATURES = ['2', '3', '4', '6'] as const;
export type AceTimesignature = (typeof ACE_TIMESIGNATURES)[number];

/**
 * `keyscale` combo options, generated exactly as the node does:
 * `[f"{root} {quality}" for quality in [major, minor] for root in [...]]`.
 * Quality is lowercase. "Am" and "A Minor" are NOT valid; "Eb major" is.
 */
export const ACE_KEY_ROOTS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
] as const;
export const ACE_KEYSCALES: readonly string[] = ['major', 'minor'].flatMap(
  (quality) => ACE_KEY_ROOTS.map((root) => `${root} ${quality}`),
);

/**
 * Tempo / key / metre for one act or one tile. Every field is independently
 * nullable: null means "inherit" (segment → block → workflow template default).
 * Nothing is defaulted eagerly, so an act nobody has tuned keeps rendering
 * exactly as before this feature landed.
 */
export interface MusicMetas {
  bpm?:           number | null;
  keyscale?:      string | null;
  timesignature?: string | null;
}

/**
 * Validate + canonicalise caller-supplied metas. Returns only the keys the
 * caller actually sent, so it composes with Prisma's partial-update semantics.
 *
 * Rejects loudly rather than coercing: a wrong `keyscale` reaching ComfyUI is a
 * prompt-level validation error whose message surfaces much later, on a queue
 * that processes one job at a time. Common near-misses are repaired instead of
 * rejected, since they are what a human actually types:
 *   "Am" → "A minor" · "A Minor" → "A minor" · "E flat major" → "Eb major"
 *   "4/4" → "4"
 */
export function normaliseMusicMetas(input: MusicMetas): MusicMetas {
  const out: MusicMetas = {};

  if (input.bpm !== undefined) {
    if (input.bpm === null) out.bpm = null;
    else {
      const n = Math.round(Number(input.bpm));
      if (!Number.isFinite(n) || n < ACE_BPM_MIN || n > ACE_BPM_MAX) {
        throw new Error(`bpm must be an integer in [${ACE_BPM_MIN}, ${ACE_BPM_MAX}] (got: ${JSON.stringify(input.bpm)})`);
      }
      out.bpm = n;
    }
  }

  if (input.timesignature !== undefined) {
    const raw = input.timesignature;
    if (raw === null || raw === '') out.timesignature = null;
    else {
      // "4/4" → "4", "6/8" → "6": the numerator is what the node's combo lists.
      const ts = String(raw).trim().split('/')[0];
      if (!(ACE_TIMESIGNATURES as readonly string[]).includes(ts)) {
        throw new Error(
          `timesignature must be one of ${ACE_TIMESIGNATURES.join(', ')} (got: ${JSON.stringify(raw)})`,
        );
      }
      out.timesignature = ts;
    }
  }

  if (input.keyscale !== undefined) {
    const raw = input.keyscale;
    if (raw === null || raw === '') out.keyscale = null;
    else {
      const canon = canonicaliseKeyscale(String(raw));
      if (!canon) {
        throw new Error(
          `keyscale must be "<root> major|minor" with root in ${ACE_KEY_ROOTS.join(' ')} (got: ${JSON.stringify(raw)})`,
        );
      }
      out.keyscale = canon;
    }
  }

  return out;
}

/** Best-effort repair of a human-typed key into a node-valid combo value. */
function canonicaliseKeyscale(raw: string): string | null {
  let s = raw.trim().replace(/\s+/g, ' ');
  // "E flat major" → "Eb major", "F sharp minor" → "F# minor"
  s = s.replace(/^([A-Ga-g])\s*(flat|b)\b/i,  (_m, r: string) => `${r.toUpperCase()}b`);
  s = s.replace(/^([A-Ga-g])\s*(sharp|#)\b/i, (_m, r: string) => `${r.toUpperCase()}#`);

  const m = /^([A-Ga-g][#b]?)\s*(major|minor|maj|min|m)?$/i.exec(s);
  if (!m) return null;
  // "eb" → "Eb", "c#" → "C#": root letter upper, accidental lower.
  const root    = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const rawQual = (m[2] ?? 'major').toLowerCase();
  // Bare "Am" is minor; bare "A" is major.
  const quality = rawQual === 'min' || rawQual === 'm' || rawQual === 'minor' ? 'minor' : 'major';
  const candidate = `${root} ${quality}`;
  return ACE_KEYSCALES.includes(candidate) ? candidate : null;
}

/**
 * Caption hygiene check for the UI and for authoring scripts: does this prompt
 * still state a tempo, key or metre in its text, where it will fight the metas?
 * Advisory only — never blocks a save, because a caption is hand-written prose
 * and the author may have a reason. See Skill(gen-studio-acestep) §3.
 */
export function captionMetaConflicts(prompt: string | null | undefined): string[] {
  if (!prompt) return [];
  const found: string[] = [];
  const bpm = prompt.match(/\b\d{2,3}\s?bpm\b/i);
  if (bpm) found.push(`tempo in caption ("${bpm[0]}") — move it to the bpm field`);
  // Spelled-out tempi ("forty eight bpm") fight the metas exactly like digits do;
  // the digit-only regex let these slip through the 2026-07 caption sweep.
  const bpmWords = prompt.match(
    /\b(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?\s?bpm\b/i,
  );
  if (bpmWords) found.push(`tempo in caption ("${bpmWords[0]}") — move it to the bpm field`);
  const key = prompt.match(/\b[A-G](?:\s?(?:#|b|sharp|flat))?\s+(?:major|minor)\b/);
  if (key) found.push(`key in caption ("${key[0]}") — move it to the keyscale field`);
  const ts = prompt.match(/\b[2-9]\s?\/\s?[248]\b/);
  if (ts) found.push(`time signature in caption ("${ts[0]}") — move it to the timesignature field`);
  // Not a meta conflict but the top rhythm-breaker on the 8-step turbo: swung /
  // syncopated grooves lose their micro-timing and read as «битый ритм». Ask
  // for a straight pulse instead — see Skill(gen-studio-acestep) §3.
  const swing = prompt.match(/\b(?:swing|swung|shuffle|bossa|syncopat\w*|off-?beat)\b/i);
  if (swing) found.push(`swung/syncopated groove in caption ("${swing[0]}") — turbo can't hold it, use a straight pulse`);
  return found;
}

export interface CreateBlockInput extends MusicMetas {
  projectId:   string;
  /** Stable English slug, e.g. "start", "growth", "burnout". Unique per project. */
  slug:        string;
  /** Human title for UI; Russian is fine here (not sent to ACE). */
  title?:      string;
  sortOrder?:  number;
  /** Default ACE-Step tags inherited by every segment. English, comma-separated.
   *  Carries NO tempo/key/metre — those go in the fields below. */
  moodPrompt?: string;
  /** Ordered Shot.id array this block covers. Drives targetSeconds. */
  shotIds:     string[];
}

export interface UpdateBlockInput extends MusicMetas {
  title?:      string | null;
  sortOrder?:  number;
  moodPrompt?: string | null;
  shotIds?:    string[];
  status?:     'filling' | 'filled' | 'manual';
}

export interface CreateSegmentInput extends MusicMetas {
  blockId:      string;
  /** Override ACE-Step tags for this segment; null falls back to block.moodPrompt. */
  prompt?:      string | null;
  /** Target seconds. ACE-Step v1.5 spans 1.0–1000.0 but practical sweet spot is 30–180. */
  durationSec?: number;
  sortOrder?:   number;
}

/** Partial update of one tile. Each meta: value = set, null = inherit block. */
export interface UpdateSegmentInput extends MusicMetas {
  prompt?:      string | null;
  durationSec?: number;
  sortOrder?:   number;
  spare?:       boolean;
}

export interface StartRenderInput extends MusicMetas {
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
  /** Resolved ACE-Step metas, snapshotted at enqueue (render override → segment
   *  → block). Absent/null = the workflow template's own value is left in place,
   *  which is how every job rendered before this feature behaved (120 / A minor
   *  / 4). Kept in params so an old take stays explainable after the block is
   *  retuned. */
  bpm?:           number | null;
  keyscale?:      string | null;
  timesignature?: string | null;
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
  /** Audio-code LM sampling temperature for TextEncodeAceStepAudio1.5, resolved
   *  by {@link pulseTemperature} from the caption at enqueue. Absent/null on
   *  older rows = the workflow template's own value (0.85) stays in place. */
  temperature?: number | null;
}

/**
 * Audio-code LM temperature by caption content. Captions that ask for a
 * percussive pulse get a more conservative temperature — the 8-step turbo
 * distill loses rhythmic micro-timing first, and a cooler LM keeps the pulse
 * steady. Pure ambient captions (`no percussion`, drones, pads) keep the
 * template default: there is no beat to protect and variety between takes is
 * a plus.
 */
export const TEMPERATURE_AMBIENT    = 0.85;
export const TEMPERATURE_PERCUSSIVE = 0.7;

const PERCUSSION_NEGATED_RE = /\bno\s+(?:busy\s+)?(?:drums?|percussion|beat)\b/gi;
const PERCUSSION_RE =
  /\b(?:drums?|drum\s?kit|snare|kick|percussion|woodblock|hi-?hats?|toms?|rimshot|shakers?|tambourine|cymbals?|rhythm\s?box|beat|groove)\b/i;

export function pulseTemperature(caption: string): number {
  const affirmative = caption.replace(PERCUSSION_NEGATED_RE, '');
  return PERCUSSION_RE.test(affirmative) ? TEMPERATURE_PERCUSSIVE : TEMPERATURE_AMBIENT;
}

/**
 * Lyrics field for every render. ACE-Step was trained with section markers in
 * the lyrics channel; `[instrumental]` is the canonical no-vocals form and is
 * stronger than the empty string the template ships (see
 * Skill(gen-studio-acestep) §4). All our music is instrumental by policy.
 */
export const INSTRUMENTAL_LYRICS = '[instrumental]';

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
 *   - TILE_SECONDS      one track = 120 s. ACE-Step's rhythm stays coherent up
 *                         to ~120 s; 150 s sat on the edge of that window and
 *                         percussive acts audibly drifted in the last third of
 *                         a tile, so tiles now stay inside it. Tiles rendered
 *                         at 150 s remain valid (durationSec is per-segment).
 *   - main tile count   = ceil(actLengthSeconds / TILE_SECONDS), laid
 *                         checkerboard on two lanes (a/b) that overlap by
 *                         CROSSFADE_SECONDS so one track fades out while the
 *                         next fades in.
 *   - SPARE_TRACK_COUNT extra tracks generated on the same act mood prompt and
 *                         dropped raw (no fade, no trim) on their own lanes —
 *                         the editor uses them to trim silence / reshuffle by
 *                         hand. Per user spec: «плюс два запасных трека на акт».
 */
export const TILE_SECONDS       = 120;
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
