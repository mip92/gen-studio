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
 * Hard limits from the official ACE-Step 1.5 guide (docs/en/Tutorial.md).
 * Not node-enforced — `tags` and `lyrics` are free-text inputs — but stated by
 * upstream as the range the model was trained to read, so a caption past
 * CAPTION_MAX_CHARS is dilution, not extra control.
 */
export const CAPTION_MAX_CHARS = 512;
export const LYRICS_MAX_CHARS  = 4096;

/** Below this a caption is a house-style skeleton rather than a description.
 *  Chosen from the corpus audit (2026-08-20): median 205 chars / 9 ideas, i.e.
 *  the whole corpus sat at ~40% of the caption budget. */
export const CAPTION_THIN_CHARS = 180;
export const CAPTION_MIN_IDEAS  = 6;
export const CAPTION_MAX_IDEAS  = 15;

/** Named instruments a caption must carry. The official guide's "specific beats
 *  vague" in the one form that can be checked mechanically: `grand piano` is
 *  worth more than `piano`, and both beat `cinematic`. Three is the floor
 *  because the audit found a median of exactly 2 — the low end of the old
 *  "2-4" rule had quietly become the house style. */
export const CAPTION_MIN_INSTRUMENTS = 3;

/**
 * Instrument lexicon for the richness check. Deliberately broad and easy to
 * extend: it is a heuristic, and `allowThin` exists for the caption whose
 * instrument genuinely isn't here. Longest spellings first — the first match
 * also becomes the lead instrument of a generated lyrics arc.
 */
const INSTRUMENT_WORDS = [
  'grand piano', 'upright piano', 'felt piano', 'prepared piano', 'electric piano',
  'detuned piano', 'honky-tonk piano', 'piano',
  'solo cello', 'cello', 'violin', 'viola', 'double bass', 'bowed bass', 'contrabass',
  'string quartet', 'strings', 'harp', 'celesta', 'glockenspiel', 'vibraphone',
  'marimba', 'kalimba', 'music box', 'dulcimer', 'zither', 'santur',
  'fingerpicked acoustic guitar', 'acoustic guitar', 'electric guitar', 'nylon guitar',
  'baritone guitar', 'slide guitar', 'guitar', 'banjo', 'mandolin', 'balalaika',
  'upright bass', 'fretless bass', 'sub bass', 'bass',
  'rhodes', 'wurlitzer', 'mellotron', 'harmonium', 'accordion', 'bandoneon',
  'pipe organ', 'hammond organ', 'organ', 'analogue synth', 'analog synth',
  'modular synth', 'synth pad', 'synth', 'string pad', 'pad', 'drone', 'tape loop',
  'flute', 'clarinet', 'bass clarinet', 'oboe', 'bassoon', 'cor anglais',
  'muted trumpet', 'trumpet', 'trombone', 'french horn', 'horn', 'saxophone',
  'duduk', 'erhu', 'koto', 'sitar', 'shakuhachi', 'tin whistle',
  'wordless choir', 'choir', 'timpani', 'gong', 'tubular bells',
  'handbells', 'bells', 'chimes', 'glass harmonica', 'theremin',
] as const;

const INSTRUMENT_RE = new RegExp(
  `\\b(?:${INSTRUMENT_WORDS.map((w) => w.replace(/-/g, '[- ]')).join('|')})\\b`,
  'gi',
);

/** Affirmative percussion carriers plus the phrases that negate them. Shared
 *  by the caption linter and {@link pulseTemperature}. */
const PERCUSSION_NEGATED_RE = /\bno\s+(?:busy\s+)?(?:drums?|percussion|beat)\b/gi;
// Broadened 2026-08-20: the old list held only literal drum names, so a caption
// asking for "soft brushed rhythm" or a "clock-like tick" read as HAVING NO
// percussion — the linter demanded a statement that was already there, and the
// generated lyrics arc opened such an act "ambient" against its own pulse.
// pulseTemperature() reads the same list, so those captions now also get the
// steadier 0.7 they were always meant to have.
const PERCUSSION_RE =
  /\b(?:drums?|drum\s?kit|snare|kick|percussion|woodblock|hi-?hats?|toms?|rimshot|side-?stick|shakers?|tambourine|cymbals?|castanets?|bongos?|congas?|cajon|tabla|frame\s?drum|hand\s?drum|rhythm\s?box|rhythm|backbeat|downbeat|four-on-the-floor|beat|groove|pulse|pulsing|ticking|tick|clicks?|clapping|claps?|brushed|metronome|heartbeat)\b/i;

/** Percussion NEGATION, the non-global twin of PERCUSSION_NEGATED_RE above: a
 *  `g`-flagged regex carries `lastIndex` between `.test()` calls. */
const PERCUSSION_NEGATION_TEST = /\bno\s+(?:busy\s+)?(?:drums?|percussion|beat)\b/i;

/** Concrete production/space words. `"clinical digital production"` satisfies a
 *  naive /production/ check while saying nothing about the space — the audit
 *  found 91% "production coverage" that was largely this formula. */
const PRODUCTION_CONCRETE_RE =
  /\b(?:reverb|close-?mic(?:ed|rophone)?|room|hall|chamber|plate|spring|tape|cassette|vinyl|lo-?fi|analogue|analog|valve|tube|saturation|compressed|compression|dry|damped|muffled|wide|narrow|mono|stereo|field recording|hiss|crackle)\b/i;

const VAGUE_ONLY_RE =
  /\b(?:cinematic|emotional|beautiful|epic|atmospheric|moody|vibe|nice|interesting)\b/gi;

export interface CaptionIssue {
  /** Stable machine code, so the UI can group and the audit can count. */
  code:     string;
  severity: 'error' | 'warn';
  message:  string;
}

export function captionIdeas(prompt: string): string[] {
  return prompt.split(',').map((x) => x.trim()).filter(Boolean);
}

/** Distinct named instruments in a caption, in order of appearance. */
export function captionInstruments(prompt: string): string[] {
  const seen: string[] = [];
  for (const m of prompt.matchAll(INSTRUMENT_RE)) {
    const w = m[0].toLowerCase();
    // "grand piano" and "piano" are one instrument, not two.
    if (!seen.some((s) => s.includes(w) || w.includes(s))) seen.push(w);
  }
  return seen;
}

/** True when the caption STATES the percussion situation either way — a named
 *  carrier or an explicit negation. Silence on the subject is what leaves the
 *  planner free to invent a beat. */
export function statesPercussion(prompt: string): boolean {
  if (PERCUSSION_NEGATION_TEST.test(prompt)) return true;
  return PERCUSSION_RE.test(prompt.replace(PERCUSSION_NEGATED_RE, ''));
}

/**
 * Full caption review. `error` refuses a save, `warn` rides along for the UI.
 *
 * Mechanical faults are unconditional errors — a tempo in the text really does
 * fight the `bpm` meta, 700 characters really is past the documented budget.
 * The richness checks are errors too, but escapable with `allowThin`: they rest
 * on a word lexicon, and a heuristic with no override becomes an unsaveable
 * caption.
 *
 * Until 2026-08-20 this function's ancestor (`captionMetaConflicts`) was called
 * from NOWHERE — the skill documented a linter that never ran, which is how 51
 * blocks kept a key in the caption after the 2026-07 sweep.
 * See Skill(gen-studio-acestep) §3.
 */
export function captionIssues(
  prompt: string | null | undefined,
  opts: { allowThin?: boolean } = {},
): CaptionIssue[] {
  const out: CaptionIssue[] = [];
  if (!prompt || !prompt.trim()) return out;
  const p     = prompt.trim();
  const ideas = captionIdeas(p);
  const err  = (code: string, message: string) => out.push({ code, severity: 'error', message });
  const warn = (code: string, message: string) => out.push({ code, severity: 'warn',  message });

  // ── metas stated twice: the original sin, official DON'T #1 ──────────────
  const bpm = p.match(/\b\d{2,3}\s?bpm\b/i);
  if (bpm) err('meta_bpm', `tempo in caption ("${bpm[0]}") — move it to the bpm field`);
  const bpmWords = p.match(
    /\b(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?\s?bpm\b/i,
  );
  if (bpmWords) err('meta_bpm', `tempo in caption ("${bpmWords[0]}") — move it to the bpm field`);
  const key = p.match(/\b[A-G](?:\s?(?:#|b|sharp|flat))?\s+(?:major|minor)\b/);
  if (key) err('meta_key', `key in caption ("${key[0]}") — move it to the keyscale field`);
  // "minor key" / "in a major key" state the same thing without naming a root.
  const looseKey = p.match(/\b(?:major|minor)\s+key\b|\bin\s+(?:a\s+)?(?:major|minor)\b/i);
  if (looseKey && !key) err('meta_key', `key in caption ("${looseKey[0]}") — move it to the keyscale field`);
  // A bare quality word with no root ("shading minor", "relative major") is not
  // a parameter value and has no `keyscale` form — §2 says drop it and express
  // the colour with harmony words. Advisory: unlike "E minor" it does not state
  // a competing key outright.
  if (!key && !looseKey && /\b(?:major|minor)\b/i.test(p)) {
    warn('loose_key_colour',
      'names a key colour ("major"/"minor") with no root — that has no keyscale value; '
      + 'say it with harmony instead ("unresolved sixth held under the melody")');
  }
  const ts = p.match(/\b[2-9]\s?\/\s?[248]\b/);
  if (ts) err('meta_timesig', `time signature in caption ("${ts[0]}") — move it to the timesignature field`);

  // ── rhythm the 8-step turbo cannot hold ─────────────────────────────────
  // "off the beat" must match as well as "off-beat": baker/bgm_act6 was seeded
  // with "muted snare faltering off the beat" and sailed through, which is the
  // same groove request spelled with spaces. Same for the "behind/ahead of the
  // beat" idioms — they ask the turbo for exactly the micro-timing it drops.
  const swing = p.match(
    /\b(?:swing|swung|shuffle|bossa|syncopat\w*|off[-\s]?(?:the[-\s]+)?beat|(?:behind|ahead\s+of)\s+the\s+beat)\b/i,
  );
  if (swing) err('swung', `swung/syncopated groove ("${swing[0]}") — turbo loses the micro-timing; ask for a straight pulse`);

  // ── budget ──────────────────────────────────────────────────────────────
  if (p.length > CAPTION_MAX_CHARS) {
    err('too_long', `${p.length} chars — the official caption budget is ${CAPTION_MAX_CHARS}; past it the ideas dilute each other`);
  }
  if (ideas.length > CAPTION_MAX_IDEAS) {
    warn('many_ideas', `${ideas.length} comma-separated ideas — past ~${CAPTION_MAX_IDEAS} they compete; sharpen instead of adding`);
  }

  // ── the instrumental guarantee (all our music is instrumental by policy) ──
  if (!/\binstrumental\b|\bno vocals\b/i.test(p)) {
    err('no_instrumental_marker',
      'caption must carry "instrumental, no vocals" — it is what keeps vocals out once the lyrics channel holds a section arc instead of the bare [instrumental] marker');
  }

  // ── richness: the reason this linter exists ─────────────────────────────
  const instruments = captionInstruments(p);
  if (!opts.allowThin) {
    if (instruments.length < CAPTION_MIN_INSTRUMENTS) {
      err('few_instruments',
        `only ${instruments.length} named instrument(s) (${instruments.join(', ') || 'none recognised'}) — `
        + `name at least ${CAPTION_MIN_INSTRUMENTS}, each with an articulation ("bowed cello held long", "felt piano struck slowly"). `
        + 'Pass allowThin if the instrument is outside the lexicon.');
    }
    if (!statesPercussion(p)) {
      err('no_percussion_statement',
        'caption never states the percussion situation — write "no drums" / "no percussion", or name exactly ONE carrier '
        + '("soft brushed snare pulse"). Silence here lets the planner invent a beat.');
    }
    if (p.length < CAPTION_THIN_CHARS || ideas.length < CAPTION_MIN_IDEAS) {
      err('thin',
        `${p.length} chars / ${ideas.length} ideas — thin. The budget is ${CAPTION_MAX_CHARS} chars; `
        + 'spend it on instruments, articulation, production and one concrete mood clause.');
    }
  }

  // ── advisory quality ────────────────────────────────────────────────────
  if (/\bproduction\b/i.test(p) && !PRODUCTION_CONCRETE_RE.test(p)) {
    warn('vague_production',
      'says "production" without naming a space — add the room, the reverb or the medium ("dry close-mic", "warm tape saturation")');
  }
  const vague = [...new Set([...p.matchAll(VAGUE_ONLY_RE)].map((m) => m[0].toLowerCase()))];
  if (vague.length >= 2) {
    warn('vague_words',
      `catch-all adjectives (${vague.join(', ')}) — "specific beats vague"; replace each with an instrument, an articulation or a space`);
  }
  return out;
}

/** Errors only — what a save is refused for. */
export function captionErrors(
  prompt: string | null | undefined,
  opts: { allowThin?: boolean } = {},
): CaptionIssue[] {
  return captionIssues(prompt, opts).filter((i) => i.severity === 'error');
}

export interface CreateBlockInput extends MusicMetas {
  projectId:   string;
  /** Stable English slug, e.g. "start", "growth", "burnout". Unique per project. */
  slug:        string;
  /** Human title for UI; Russian is fine here (not sent to ACE). */
  title?:      string;
  sortOrder?:  number;
  /** Default ACE-Step tags inherited by every segment. English, comma-separated.
   *  Carries NO tempo/key/metre — those go in the fields below. Gated by
   *  {@link captionErrors} on every write path. */
  moodPrompt?: string;
  /** Section markers for the `lyrics` input. Null/absent = generated per tile. */
  lyricsStructure?: string | null;
  /** Accept a caption the richness heuristics reject (instrument outside the
   *  lexicon). Never silences the mechanical checks — a tempo in the text is
   *  refused regardless. */
  allowThin?:  boolean;
  /** Ordered Shot.id array this block covers. Drives targetSeconds. */
  shotIds:     string[];
}

export interface UpdateBlockInput extends MusicMetas {
  title?:      string | null;
  sortOrder?:  number;
  moodPrompt?: string | null;
  lyricsStructure?: string | null;
  allowThin?:  boolean;
  shotIds?:    string[];
  status?:     'filling' | 'filled' | 'manual';
}

export interface CreateSegmentInput extends MusicMetas {
  blockId:      string;
  /** Override ACE-Step tags for this segment; null falls back to block.moodPrompt. */
  prompt?:      string | null;
  /** Override the block's section arc for this tile; null inherits. */
  lyricsStructure?: string | null;
  allowThin?:   boolean;
  /** Target seconds. ACE-Step v1.5 spans 1.0–1000.0 but practical sweet spot is 30–180. */
  durationSec?: number;
  sortOrder?:   number;
}

/** Partial update of one tile. Each meta: value = set, null = inherit block. */
export interface UpdateSegmentInput extends MusicMetas {
  prompt?:      string | null;
  lyricsStructure?: string | null;
  durationSec?: number;
  sortOrder?:   number;
  spare?:       boolean;
  allowThin?:   boolean;
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
  /** Resolved contents of the `lyrics` input — an authored section arc, or one
   *  generated from the caption by {@link buildLyricsArc}. Snapshotted like the
   *  metas so a take stays explainable after the block is re-authored. Absent
   *  on rows from before 2026-08-20 = the bare `[instrumental]` marker. */
  lyrics?:      string | null;
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


export function pulseTemperature(caption: string): number {
  const affirmative = caption.replace(PERCUSSION_NEGATED_RE, '');
  return PERCUSSION_RE.test(affirmative) ? TEMPERATURE_PERCUSSIVE : TEMPERATURE_AMBIENT;
}

/**
 * Lyrics — the channel we left blank for 500 blocks.
 *
 * `[instrumental]` is the canonical no-vocals marker and was, until 2026-08-20,
 * the ENTIRE content of this input on every render ever made: six characters of
 * a 4096-character field. The official guide is blunt about what that field is
 * for — "Lyrics is the music's temporal script, controlling how music unfolds
 * over time" — so a 120 s tile went out with no temporal shape requested at
 * all, and tiles came back as undifferentiated wallpaper.
 *
 * The sanctioned instrumental form is section markers describing the
 * development: `[intro - ambient]` / `[main theme - piano]` / `[outro - fade
 * out]`. Rules that come with it (official DON'Ts + Skill §4):
 *   - one or two words after the dash, never a stack of modifiers;
 *   - a named section must not sit empty — true for VOCAL sections, which is
 *     why an instrumental arc carries no lyric text under its markers;
 *   - sections must not contradict the caption (`[drop]` under `no percussion`).
 * The generated arc satisfies all three by construction: its descriptors are
 * COPIED OUT of the caption rather than invented.
 */
export const INSTRUMENTAL_LYRICS = '[instrumental]';

/** Below this a tile is too short for a three-part arc to mean anything — the
 *  model would spend the whole tile on an intro. Official stable floor is 30 s;
 *  we keep the bare marker up to 45 s. */
export const LYRICS_ARC_MIN_SECONDS = 45;

/**
 * Build the temporal script for one tile from its own caption.
 *
 * Deliberately derivative: the lead instrument and the percussion stance are
 * lifted from the caption, so the arc can never state something the caption
 * denies. When the caption names no recognised instrument the middle section
 * stays bare (`[main theme]`) rather than guessing.
 */
export function buildLyricsArc(caption: string | null | undefined, seconds: number): string {
  if (seconds < LYRICS_ARC_MIN_SECONDS) return INSTRUMENTAL_LYRICS;
  const cap = (caption ?? '').trim();
  if (!cap) return INSTRUMENTAL_LYRICS;

  const lead = captionInstruments(cap)[0] ?? null;
  // An act with no percussion opens ambient; one with a carrier opens on it, so
  // the pulse is established in the intro instead of arriving mid-tile.
  const percussive = !PERCUSSION_NEGATION_TEST.test(cap)
                  && PERCUSSION_RE.test(cap.replace(PERCUSSION_NEGATED_RE, ''));
  const intro = percussive ? '[intro]' : '[intro - ambient]';
  const main  = lead ? `[main theme - ${lead}]` : '[main theme]';
  return [intro, main, '[outro - fade out]'].join('\n');
}

/**
 * The lyrics actually sent for a render: an explicit override wins, otherwise
 * the arc is generated from the caption. `BGM_LYRICS_ARC=0` reverts the whole
 * pipeline to the bare `[instrumental]` of before 2026-08-20 — one env var,
 * because this changes how every new take sounds and a way back should not
 * require a deploy.
 */
export function resolveLyrics(
  override: string | null | undefined,
  caption: string | null | undefined,
  seconds: number,
): string {
  const explicit = (override ?? '').trim();
  if (explicit) return explicit.slice(0, LYRICS_MAX_CHARS);
  if (process.env.BGM_LYRICS_ARC === '0') return INSTRUMENTAL_LYRICS;
  return buildLyricsArc(caption, seconds);
}

/**
 * Validate a hand-authored structure before it is stored. Returns the issues;
 * empty means fine. Mirrors the caption gate's shape so the service can treat
 * both the same way.
 */
export function lyricsIssues(structure: string | null | undefined, caption?: string | null): CaptionIssue[] {
  const out: CaptionIssue[] = [];
  const s = (structure ?? '').trim();
  if (!s) return out;
  if (s.length > LYRICS_MAX_CHARS) {
    out.push({ code: 'lyrics_too_long', severity: 'error',
      message: `${s.length} chars — the lyrics budget is ${LYRICS_MAX_CHARS}` });
  }
  const lines    = s.split('\n').map((l) => l.trim()).filter(Boolean);
  const markers  = lines.filter((l) => /^\[.*\]$/.test(l));
  const freeText = lines.filter((l) => !/^\[.*\]$/.test(l));
  if (freeText.length > 0) {
    // Real lyric text against a "no vocals" caption is the one combination the
    // skill forbids outright: it produces eerie wordless vocalisations.
    out.push({ code: 'lyrics_free_text', severity: 'error',
      message: `line(s) outside a [section] marker (${freeText[0].slice(0, 40)}…) — all our music is instrumental, `
             + 'the lyrics channel may hold section markers only' });
  }
  for (const m of markers) {
    const parts = m.slice(1, -1).split('-').map((x) => x.trim()).filter(Boolean);
    if (parts.length > 3) {
      out.push({ code: 'lyrics_stacked_tags', severity: 'error',
        message: `stacked modifiers in "${m}" — one or two words after the dash, or the model reads the tag as lyrics` });
    }
  }
  if (caption && /\bno\s+(?:drums?|percussion|beat)\b/i.test(caption)) {
    const clash = markers.find((m) => /\b(?:drop|build|breakdown|beat)\b/i.test(m));
    if (clash) {
      out.push({ code: 'lyrics_contradicts_caption', severity: 'error',
        message: `"${clash}" contradicts a caption that says no percussion` });
    }
  }
  return out;
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
