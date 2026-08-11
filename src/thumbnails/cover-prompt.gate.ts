/**
 * The art-prompt gate for YouTube covers.
 *
 * WHY THIS FILE EXISTS — measured, 2026-08-11, 40 covers across 6 projects:
 *
 * The idea prompt in thumbnail-render.service.ts already forbids, in plain
 * English, nearly every defect listed below. The model breaks the rules anyway:
 *
 *   profile codes left in the prose        24 of 40   (every project but monotown)
 *   layer/split HEADINGS instead of prose  13 of 40   ("Split frame: left shows…")
 *   negations in the positive               4 of 40
 *   a desaturating word in the positive     5 of 40
 *   an uncountable inventory               22 of 40   ("thirty payment forms")
 *
 * This is the same lesson the caption gate learned (see captionProblem): a rule
 * stated in prose to a 30B is a hope, not a constraint. `refProfileCodes` were
 * validated because a bad code "fails the render minutes later" — but a bad art
 * prompt is the more expensive failure, because it does not fail at all. It
 * renders, at GPU cost, and comes back ugly.
 *
 * Two of those defects are the INSTRUCTION's own fault rather than the model's,
 * and no validator should paper over them — they are fixed at the source:
 *   - "DEPTH IN THREE LAYERS … Name all three" got answered literally, as
 *     labels: `Close layer: … Middle ground: … Background: …`. The model was
 *     complying.
 *   - the composition pattern named "split" got copied into the prose as the
 *     heading `Split frame:`, which invites a literal dividing line.
 *
 * So the pipeline is: sanitize (deterministic, silent, cannot fail) → validate
 * (what a sanitizer must not guess at) → ONE repair re-ask → validate again →
 * drop, loudly. Nothing here talks to the model; the service owns that.
 */

/**
 * Hues that survive being looked at two centimetres wide in a grid of bright
 * competitors. A cover must name at least two so the palette has a fight in it —
 * the scenes' convention (three explicit palette terms in the tail of every one
 * of 346 shot positives) is what makes the films look colour-graded, and the
 * covers had no equivalent contract at all.
 */
const HUES = [
  'orange', 'amber', 'gold', 'golden', 'copper', 'rust', 'ochre', 'brass',
  'red', 'crimson', 'scarlet', 'blood-red', 'magenta', 'pink',
  'yellow', 'lime', 'green', 'emerald', 'jade',
  'cyan', 'teal', 'turquoise', 'blue', 'cobalt', 'indigo', 'azure',
  'violet', 'purple', 'lilac', 'neon',
];

/**
 * A light that MODELS the subject: it has a source, a direction, or both. Flat
 * even daylight is what makes a render look like a snapshot, so a cover prompt
 * that names no light at all is rejected rather than sanitized — inventing the
 * lighting for the operator is a creative decision, not a cleanup.
 */
const LIGHTS = [
  'backlight', 'back light', 'backlit', 'rim light', 'rim-light', 'rimlight',
  'side light', 'sidelight', 'top light', 'underlit', 'lit from below',
  'hard light', 'shaft', 'spotlight', 'silhouette', 'silhouetted',
  'low sun', 'raking', 'sunset', 'sunrise', 'dawn light', 'golden hour',
  'moonlight', 'headlight', 'headlights', 'lamp', 'bulb', 'lantern',
  'window light', 'screen light', 'candle', 'firelight', 'floodlight',
  'streetlight', 'sodium', 'fluorescent', 'strobe', 'torch',
];

/**
 * Words that ORDER the colour out of the frame. They are not descriptions — the
 * VL encoder reads "muted palette" as an instruction and obeys it, which is
 * exactly how the covers came back flat while the films did not.
 *
 * Stripped, not rejected: the concept underneath is usually fine and the word is
 * a reflex. `grey` is handled separately (see stripDesaturation) because a grey
 * OBJECT is legitimate — a grey car is just a car — while "grey light" is a
 * palette instruction.
 */
const DESATURATORS = [
  'desaturated', 'de-saturated', 'muted', 'monochrome', 'monochromatic',
  'washed out', 'washed-out', 'drained', 'faded', 'dull', 'colourless',
  'colorless', 'greyscale', 'grayscale', 'black and white', 'sepia',
];

/**
 * Nouns that carry TYPOGRAPHY. The technical negative already bans lettering,
 * but a positive that asks for a sign or a printed form is louder than a
 * negative that forbids one, and the render splits the difference: garbled
 * glyphs. Five car_flipper covers asked for "payment forms" while their own
 * negative banned "printed words on paper".
 */
const LETTERING = [
  'printed', 'written', 'writing', 'handwriting', 'handwritten', 'inscription',
  'engraved', 'label', 'labels', 'sign', 'signs', 'signage', 'signpost',
  'poster', 'billboard', 'newspaper headline', 'calendar', 'number plate',
  'licence plate', 'license plate', 'price tag', 'nameplate', 'lettering',
];

/** Meta-language: a memo about the picture rather than the picture. */
const META = [
  'split frame', 'split-frame', 'the frame is divided', 'frame divided',
  'diptych', 'left half', 'right half', 'left side shows', 'right side shows',
  'left shows', 'right shows', 'we see', 'the viewer sees', 'the camera sees',
  'depicts', 'depicting', 'the image shows', 'the composition', 'shot shows',
  'this cover', 'the cover shows', 'thumbnail shows',
];

/**
 * Layer labels. The three-layer craft rule is right — a flat single plane is the
 * commonest reason a render looks cheap — but it must be woven into the prose,
 * not answered as a form. Stripping the label keeps the layer content, which is
 * the part worth keeping.
 */
const LAYER_LABELS = [
  'close layer', 'closest layer', 'front layer', 'foreground layer',
  'foreground', 'middle ground', 'middleground', 'mid-ground', 'midground',
  'middle layer', 'background layer', 'background', 'far background',
  'behind that', 'in the back',
];

/** Number words a diffusion model cannot deliver as a count. */
const BIG_COUNTS = [
  'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty',
  'ninety', 'hundred', 'thousand', 'dozen', 'dozens',
];

/** Durations — a number in front of these measures time, not objects. */
const TIME_UNITS = [
  'years', 'year', 'months', 'month', 'weeks', 'week', 'days', 'day',
  'hours', 'hour', 'minutes', 'minute', 'seconds', 'second',
  'decades', 'decade', 'winters', 'summers', 'springs', 'autumns',
];

/** A profile code: SCREAMING_SNAKE with at least one underscore. */
const CODE_RE = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;

const WORD_MIN = 35;
const WORD_MAX = 95;

export interface CoverPromptFields {
  /** The concept prose, as the model wrote it. */
  prompt: string;
  /** 2-3 saturated hues that fight each other. Required — see HUES. */
  palette?: string;
  /** Source + direction. Required — see LIGHTS. */
  light?: string;
  /** The one object the concept is built on; used for batch-level diversity. */
  motif?: string;
  /**
   * Which moment of the film this concept is taken from. Checked for uniqueness
   * across the batch, because the surest way to get six variations of one image
   * is to draw all six from one scene — which is what happened while the idea
   * model was only being shown the finale.
   */
  moment?: string;
}

export interface SanitizeResult {
  prompt: string;
  /** What was changed, in Russian, for the operator-facing log. */
  fixes: string[];
}

function words(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

function hasAny(haystack: string, needles: string[]): string | null {
  const low = haystack.toLowerCase();
  for (const n of needles) {
    // Word-boundary match so "signage" does not fire on "design" and "lamp"
    // does not fire on "lamppost-shaped".
    if (new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(low)) return n;
  }
  return null;
}

function countAny(haystack: string, needles: string[]): number {
  const low = haystack.toLowerCase();
  let n = 0;
  for (const needle of needles) {
    if (new RegExp(`(^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(low)) n += 1;
  }
  return n;
}

/** Remove a leading "Label:" from a clause, keeping the clause itself. */
function stripLayerLabels(text: string, fixes: string[]): string {
  let out = text;
  for (const label of LAYER_LABELS) {
    // Only as a LABEL — followed by a colon, or by "is/shows/holds". Bare
    // "foreground" inside prose ("steam in the foreground") is good writing and
    // stays.
    const re = new RegExp(`(^|[.;:,]\\s*)${label}\\s*(?::|\\s+(?:is|shows|holds|has)\\b)\\s*`, 'gi');
    if (re.test(out)) {
      out = out.replace(re, '$1');
      fixes.push(`убрана служебная метка плана «${label}»`);
    }
  }
  return out;
}

/** Drop meta-language, keeping whatever the sentence was actually about. */
function stripMeta(text: string, fixes: string[]): string {
  let out = text;
  const swaps: Array<[RegExp, string, string]> = [
    [/\bsplit[- ]frame\s*:?\s*/gi,                 '',      'split frame'],
    [/\bthe frame is divided (?:in ?to|into)\s*/gi, '',      'the frame is divided'],
    [/\b(?:on the )?left (?:half|side)\s*(?:shows|,)?\s*/gi,  'on one side, ', 'left half'],
    [/\b(?:on the )?right (?:half|side)\s*(?:shows|,)?\s*/gi, 'on the other side, ', 'right half'],
    [/\bleft shows\s*/gi,                          'on one side, ',      'left shows'],
    [/\bright shows\s*/gi,                         'on the other side, ', 'right shows'],
    [/\bwe see\s*/gi,                              '',      'we see'],
    [/\bthe viewer sees\s*/gi,                     '',      'the viewer sees'],
    [/\b(?:the image|the composition|the cover|this cover|the thumbnail)\s+shows\s*/gi, '', 'X shows'],
    [/\bdepict(?:s|ing)\s*/gi,                     '',      'depicts'],
  ];
  for (const [re, to, label] of swaps) {
    if (re.test(out)) {
      out = out.replace(re, to);
      fixes.push(`убран мета-оборот «${label}»`);
    }
  }
  return out;
}

/**
 * Strip the palette-draining words. `grey`/`gray` only when they modify light,
 * air or the palette itself — a grey object keeps its colour, because that is a
 * fact about the object and not an order about the image.
 */
function stripDesaturation(text: string, fixes: string[]): string {
  let out = text;
  for (const w of DESATURATORS) {
    const re = new RegExp(`(^|[^a-z])${w.replace(/ /g, '\\s+')}(?=[^a-z]|$)`, 'gi');
    if (re.test(out)) {
      out = out.replace(re, '$1');
      fixes.push(`убрано обесцвечивающее слово «${w}»`);
    }
  }
  const greyed = /\b(?:grey|gray)(?:ish)?\s+(sky|skies|light|lighting|haze|mist|fog|air|day|daylight|palette|tone|tones|cast|wash|world|everything)\b/gi;
  if (greyed.test(out)) {
    out = out.replace(greyed, '$1');
    fixes.push('снято «grey» с описания света/палитры');
  }
  return out;
}

/** Remove profile codes and the brackets that usually hold them. */
function stripCodes(text: string, fixes: string[]): string {
  let out = text.replace(/\s*[([]\s*([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\s*[)\]]/g, (_m, code) => {
    fixes.push(`убран код профиля «${code}» из текста`);
    return '';
  });
  out = out.replace(CODE_RE, (code) => {
    fixes.push(`убран код профиля «${code}» из текста`);
    return '';
  });
  return out;
}

/** Collapse the punctuation damage the strippers leave behind. */
function tidy(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([,;:])\s*([,.;:])/g, '$1')
    .replace(/(^|[.;]\s*),\s*/g, '$1')
    .replace(/'s\b\s*,/g, "'s")
    .replace(/\s*,\s*$/g, '')
    .replace(/\.\s*\./g, '.')
    // An em-dash glued to a word is how the model chains clauses; it survives
    // the strippers as "arm—stack", which reads as one token.
    .replace(/\s*—\s*/g, ', ')
    .trim();
}

/**
 * Restore sentence capitals. A stripped label usually sat at the head of its
 * sentence, so removing it leaves "…paper. stack of forms rests…" — which reads
 * as damaged text to a VL encoder that is otherwise given clean prose.
 */
function recapitalize(text: string): string {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_m, lead, ch) => `${lead}${ch.toUpperCase()}`);
}

/**
 * An age is not an inventory. "a boy of sixteen", "a man of forty-four" and
 * "sixty-eight years old" all name a person, and the model draws a person, not
 * sixty-eight of anything — so the count check must not fire on them.
 */
function isAgeContext(text: string, index: number, token: string): boolean {
  const before = text.slice(Math.max(0, index - 30), index).toLowerCase();
  const after = text.slice(index + token.length, index + token.length + 16).toLowerCase();
  // "of" alone is NOT an age marker — "a stack of thirty forms" is exactly the
  // inventory this check exists for. It only reads as an age when a person is
  // the thing being aged.
  return /\b(?:boy|girl|man|woman|lad|kid|child|teenager|youth|person|figure)\s+of\s*$/.test(before)
      || /\b(?:aged|about|around|nearly|barely|turned|he is|she is|in his|in her)\s*$/.test(before)
      || /^\s*(?:-|\s)?year[s]?[- ]old\b/.test(after);
}

/**
 * Deterministic cleanup. Never fails, never asks the model anything, and only
 * removes text — it does not invent light, colour or composition, because those
 * are the parts a human would want to see and approve.
 */
export function sanitizeCoverPrompt(prompt: string): SanitizeResult {
  const fixes: string[] = [];
  let out = String(prompt ?? '');
  out = stripCodes(out, fixes);
  out = stripMeta(out, fixes);
  out = stripLayerLabels(out, fixes);
  out = stripDesaturation(out, fixes);
  out = recapitalize(tidy(out));
  return { prompt: out, fixes: [...new Set(fixes)] };
}

/**
 * A number word only counts as an INVENTORY when something plural follows it
 * within a couple of words ("thirty payment forms", "dozens of souvenirs").
 * Ages and bare figures of speech are left alone — see isAgeContext.
 */
function findCount(text: string): string | null {
  const low = text.toLowerCase();
  for (const c of BIG_COUNTS) {
    const re = new RegExp(`(^|[^a-z])(${c})(?=[^a-z]|$)`, 'g');
    for (let m = re.exec(low); m; m = re.exec(low)) {
      const at = m.index + m[1].length;
      if (isAgeContext(low, at, c)) continue;
      const tail = low.slice(at + c.length, at + c.length + 40).split(/[\s,;.]+/).filter(Boolean).slice(0, 3);
      // "forty years later" is a time span, not an inventory — nothing is drawn
      // forty times. Same for the other duration units.
      if (TIME_UNITS.includes(tail[0] ?? '')) continue;
      // A plural noun in the wake of the number is what makes it a count.
      if (tail.some((w) => w.length > 3 && w.endsWith('s') && !w.endsWith('ss'))) return c;
    }
  }
  return null;
}

/**
 * What a sanitizer must NOT fix silently, because fixing it means inventing
 * picture content: missing colour, missing light, negations, uncountable
 * inventories, requested lettering, wrong length.
 *
 * @returns [] when the prompt is usable, else one line per problem, phrased so
 *          it can be handed straight back to the model as a repair order.
 */
export function coverPromptProblems(f: CoverPromptFields): string[] {
  const problems: string[] = [];
  const prompt = String(f.prompt ?? '').trim();
  if (!prompt) return ['prompt is empty'];

  const n = words(prompt).length;
  if (n < WORD_MIN) problems.push(`the prompt is ${n} words, too thin to compose a frame — write ${WORD_MIN}-${WORD_MAX}`);
  if (n > WORD_MAX) problems.push(`the prompt is ${n} words, over the ${WORD_MAX}-word budget — the tail gets cut before it reaches the model`);

  // Colour and light are checked over prompt + the dedicated fields together:
  // either place is a legitimate home for them, and the composer joins both.
  const colourScope = `${prompt} ${f.palette ?? ''}`;
  const hueCount = countAny(colourScope, HUES);
  if (hueCount === 0) {
    problems.push('no colour at all is named — name two or three saturated hues that fight each other (sodium orange against night blue, red against wet green)');
  } else if (hueCount === 1) {
    problems.push('only one hue is named — a cover needs a colour CONFLICT, so name a second saturated hue that opposes the first');
  }

  const lightScope = `${prompt} ${f.light ?? ''}`;
  if (!hasAny(lightScope, LIGHTS)) {
    problems.push('no light source or direction is named — name one (a single overhead bulb, low sun raking across, a screen lighting the face from below); flat even daylight is what makes a frame look dead');
  }

  // Negations: unfixable by machine, because the sentence usually has no
  // positive alternative to fall back on. Rule 2 of the Qwen prompting rules.
  const neg = /\b(?:no|not|without|never|nothing|nobody|none|missing|absent|instead of|rather than|empty (?:chair|seat|space) where)\b/i.exec(prompt);
  if (neg) {
    problems.push(`the phrase "${neg[0]}" is a negation or an absence — a diffusion model cannot draw what is not there; name the visible thing instead`);
  }

  const meta = hasAny(prompt, META);
  if (meta) problems.push(`"${meta}" is a memo about the picture, not the picture — write the finished frame itself`);

  const label = hasAny(prompt, LAYER_LABELS.filter((l) => l !== 'foreground' && l !== 'background'));
  if (label) problems.push(`"${label}" reads as a layer label — weave the three depths into one flowing sentence instead of listing them`);

  const digits = /\b\d{2,}\b/g;
  for (let m = digits.exec(prompt); m; m = digits.exec(prompt)) {
    if (isAgeContext(prompt, m.index, m[0])) continue;
    problems.push(`the number ${m[0]} is written out — a drawn digit comes back as a garbled glyph; show the quantity as something visibly large instead (a thick fan, a full shelf, an overflowing box)`);
    break;
  }

  const big = findCount(prompt);
  if (big) problems.push(`"${big}" is a count nobody can draw or read at thumbnail size — replace it with a quantity the eye grasps at a glance (a thick stack, a wall of them, a heap)`);

  const letters = hasAny(prompt, LETTERING);
  if (letters) problems.push(`"${letters}" carries typography, and the technical negative bans lettering — the render splits the difference and draws garbled glyphs; use the object without its writing (a blank form, a bare metal plate)`);

  const code = CODE_RE.exec(prompt);
  if (code) problems.push(`"${code[0]}" is a profile code and gets DRAWN as letters — call the person by what they are ("the older man", "the boy")`);

  const desat = hasAny(prompt, DESATURATORS);
  if (desat) problems.push(`"${desat}" is an order to drain the colour out, and it is why earlier covers came back flat — delete it and let the drama come from the subject and the light`);

  return problems;
}

/**
 * Batch-level diversity, checked mechanically rather than asked for politely.
 *
 * Measured on the car_flipper set of 2026-08-10: `steam rises` appeared in 6 of
 * 6 concepts, `thirty payment forms` in 5 of 6, `cracked wrist pouch` in 3. The
 * instruction said "DIVERSITY IS THE POINT" and the model still shipped one idea
 * six times, because nothing checked.
 *
 * @returns per-index problem lines (empty array where the concept is fine)
 */
export function batchDiversityProblems(items: CoverPromptFields[]): string[][] {
  const out: string[][] = items.map(() => []);

  const firstSeen = (key: keyof CoverPromptFields, complain: (v: string, at: number) => string) => {
    const seen = new Map<string, number>();
    items.forEach((f, i) => {
      const v = String(f[key] ?? '').trim().toLowerCase();
      if (!v) return;
      const at = seen.get(v);
      if (at !== undefined) out[i].push(complain(v, at));
      else seen.set(v, i);
    });
  };

  firstSeen('motif', (v, at) =>
    `the motif "${v}" is already the subject of concept ${at + 1} — build this one on a different object from the story`);
  firstSeen('moment', (v, at) =>
    `concept ${at + 1} is already set at "${v}" — take this one from a different moment of the film, so the set spans the whole arc instead of one scene`);

  // Phrase-level repetition: any 3-word run that shows up in more than half the
  // set is the model looping, not a house style.
  const runs = new Map<string, number[]>();
  items.forEach((f, i) => {
    const w = words(String(f.prompt ?? '').toLowerCase().replace(/[^a-z\s]/g, ' '));
    const local = new Set<string>();
    for (let k = 0; k + 2 < w.length; k++) {
      const run = `${w[k]} ${w[k + 1]} ${w[k + 2]}`;
      if (run.length < 12) continue;
      local.add(run);
    }
    for (const run of local) {
      if (!runs.has(run)) runs.set(run, []);
      runs.get(run)!.push(i);
    }
  });
  const threshold = Math.max(2, Math.ceil(items.length / 2));
  for (const [run, idxs] of runs) {
    if (idxs.length < threshold) continue;
    // Report it on every copy but the first — the first one keeps the phrase.
    for (const i of idxs.slice(1)) {
      out[i].push(`the phrase "${run}" appears in ${idxs.length} of ${items.length} concepts — this set is one idea repeated; give this concept its own object, time of day and palette`);
    }
  }

  return out;
}

/**
 * Join the concept prose with its light and palette so the palette lands in the
 * TAIL, which is where every one of the films' 346-shot positives puts it and
 * where the covers previously had nothing at all.
 */
export function composeCoverPrompt(f: CoverPromptFields): string {
  const parts = [String(f.prompt ?? '').trim().replace(/\.$/, '')];
  const light = (f.light ?? '').trim().replace(/\.$/, '');
  const palette = (f.palette ?? '').trim().replace(/\.$/, '');
  // Only append what the prose does not already carry, or the instruction ends
  // up saying the same thing twice and spends budget doing it.
  if (light && !hasAny(parts[0], LIGHTS)) parts.push(light);
  if (palette) {
    const already = countAny(parts[0], HUES);
    if (already < 2) parts.push(palette);
  }
  return parts.filter(Boolean).join(', ');
}
