/**
 * Instruction-prompt composition for Qwen-Image-Edit-2511 renders.
 *
 * Qwen's VL text encoder (TextEncodeQwenImageEditPlus) wants NATURAL-LANGUAGE
 * edit instructions that reference the attached images as "Picture 1/2/3" —
 * not the tag-soup every other strategy in this codebase feeds CLIP. These
 * helpers are the single place that translates our shot data (promptBase,
 * scenePrompt) into that instruction shape, shared by the realcomic_qwen
 * strategies, the dual-character overlay strategies AND the anchor-portrait
 * generator.
 *
 * ─── THE FOUR 2511 RULES THIS FILE ENCODES ─────────────────────────────────
 * Sourced from the official Qwen-Image-Edit-2511 model card, the ComfyUI node
 * implementation (comfy_extras/nodes_qwen.py) and community prompt guides.
 * Full write-up + citations: .claude/skills/gen-studio-qwen2511/.
 *
 * 1. DESCRIBE THE RESULT, NOT THE EDIT. The official multi-image example is one
 *    sentence of finished image: "The magician bear is on the left, the
 *    alchemist bear is on the right, facing each other in the central park
 *    square." Not "take the bear from picture 1 and place it…".
 * 2. NEGATIONS DO NOT WORK. The VL encoder has no negation channel — "do not
 *    copy their pose / their background" reinforces pose and background. State
 *    what you WANT ("medium shot, eye level, standing at the open cab door").
 *    This file used to carry a 2-sentence "ANTI-PASTE" block of exactly such
 *    negations; it was the cause of the pasted-collage look on `trucker`, not
 *    the cure. Do not reintroduce it.
 * 3. SHORT WINS. 1-3 sentences. Structure: subject → environment → detail →
 *    light. Long instruction stacks measurably degrade composition.
 * 4. NATURALNESS COMES FROM ACTION + LIGHT. A named action ("leans on the door
 *    frame and looks down at her") yields a natural pose where positional
 *    description ("is on the left") yields a stiff cut-out. A named light
 *    ("sodium lamps behind them, warm rim light") makes 2511 relight the
 *    subjects into the plate by itself — the relight LoRA is baked into 2511.
 *
 * The OTHER half of the pasted-look fix is not textual: TextEncodeQwenImage-
 * EditPlus feeds each reference through TWO channels — the VL encoder at
 * 384x384 (semantics: who this is, what they wear) and, only when its `vae`
 * input is connected, the VAE at 1024x1024 appended as `reference_latents`
 * (appearance: the actual pixels). `reference_latents` is the paste channel.
 * See QwenGraphSpec.referenceLatents in qwen-scene-graph.builder.ts.
 */

/** RealComic LoRA trigger phrase (Civitai model 1757495, 2509_Base). Phrased
 *  as an EDIT instruction — use it when reference images are attached. */
export const REALCOMIC_TRIGGER = 'changed the image into realcomic style';

/** RealComic styling for pure text-to-image renders (environment shots,
 *  anchor portraits) where there is no input image to "change". */
export const REALCOMIC_T2I_STYLE =
  'realcomic style, hand-drawn comic illustration with a realistic touch, ' +
  'clean confident linework, painterly shading, muted cinematic color palette';

/** Style directive for the dual-character OVERLAY on legacy cartoon styles:
 *  no Qwen style-LoRA there — the project style is carried by the anchor
 *  reference images themselves. */
export const KEEP_REFERENCE_STYLE =
  'keep the exact hand-drawn illustration style, linework and color palette of the reference pictures — no photorealism';

/**
 * The seed engines bake the project style block at the head of every
 * `promptFields.positive`. All legacy cartoon style blocks terminate on
 * "no plastic skin" (the cell-shaded one adds ", painterly comic-book
 * aesthetic"). For Qwen overlay renders that block must be STRIPPED: the
 * style arrives via the reference images, and telling Qwen "comic book
 * panel, cell-shaded…" in text while showing it a different concrete style
 * in the references makes the two channels fight.
 */
const BAKED_STYLE_BLOCK_RE = /no plastic skin(?:,\s*painterly comic-book aesthetic)?\s*,\s*/i;

export function stripBakedStyleBlock(scenePrompt: string): string {
  const m = scenePrompt.match(BAKED_STYLE_BLOCK_RE);
  // Only treat it as a baked LEADING block — a phrase deep inside the prompt
  // is somebody's hand-written text; leaving it is safer than guessing.
  // Cutoff 400: the real seeded blocks end at ~250 (cell-shaded) and ~340
  // (flux comic engines / STYLE_PREFIX) — 300 silently missed the flux ones.
  if (!m || m.index === undefined || m.index > 400) return scenePrompt;
  return scenePrompt.slice(m.index + m[0].length).trim();
}

/**
 * True when the shot's positive already opens with the realcomic_qwen style
 * block (seed engines bake the visual_styles.styleBlock at the head of every
 * positive, same convention as the legacy styles). The native Qwen strategy
 * must then not add REALCOMIC_T2I_STYLE on top — same dedup rule as
 * hasBakedStyleBlock in scene-strategy.ts, adapted to the Qwen wording.
 * The short EDIT trigger sentence (REALCOMIC_TRIGGER) is exempt: it's the
 * LoRA's trained instruction, one clause, not a style block.
 */
export function hasBakedRealcomicStyle(scenePrompt: string | undefined): boolean {
  return /\brealcomic style\b/i.test((scenePrompt ?? '').slice(0, 200));
}

/**
 * ─── WORD BUDGETS (rule 3: short wins) ─────────────────────────────────────
 *
 * The 2511 VL encoder degrades measurably on long instruction stacks, and our
 * fields were written under CLIP-era habits: a 60-word promptBase, a 30-word
 * baked style block, a 60-word Location.description. Composed unchecked they
 * produced a 190-word wall in which the shot's ACTION sat at word ~95 — and the
 * render obeyed the anchor's pose instead of the sentence nobody could find
 * (measured on `caregiver A0_SH19`, 2026-07-27).
 *
 * So every field gets a budget here, and overruns are trimmed on CLAUSE
 * boundaries — whole comma-separated clauses are dropped from the END, never a
 * phrase cut mid-word. Nothing is silently reordered; the author's leading
 * clauses always survive, which is why the authoring rules in the skill say
 * "most important first".
 *
 * These are a SAFETY NET, not a licence to write long: what the budget cuts is
 * simply lost from the render. Field-by-field authoring rules live in
 * .claude/skills/gen-studio-qwen2511/ §3.
 */
export const QWEN_WORD_BUDGET = {
  /** Per participant, after boilerplate stripping. Face + hair + build + the
   *  one signature item — about what the VL channel can actually hold.
   *
   *  35 rather than the ~25 a purpose-written identity needs, because the
   *  promptBases in the DB are still CLIP-era 70-word strings whose signature
   *  prop sits LAST: at 25 words `caregiver/NAD_START` lost the brass pocket
   *  watch that is her whole identity anchor. Rewrite a project's promptBases
   *  front-loaded (see the skill, §3) and they will fit well under this. */
  identity: 35,
  /**
   * The shot itself: camera + who does what with hands and gaze + light.
   *
   * 55, not the 45 this started at — that number was a guess, and the measurement
   * contradicted it. The rewritten positive that finally broke the anchor's pose
   * on `caregiver A0_SH19` (2026-07-27) was **55 words** of exactly this shape,
   * and it read cleanly. Below ~50 the hands/gaze/angle detail that does the work
   * (skill §6.2a-2) does not fit, and the budget starts eating the palette clause
   * that carries a project's colour identity.
   */
  scene:    55,
  /** Location.description — the PLACE, not its prop inventory. */
  location: 25,
} as const;

/** Drop whole trailing comma-clauses until the text fits `maxWords`. The first
 *  clause always survives (hard-truncated by words only if it alone overruns) —
 *  losing the subject entirely would be worse than a long instruction. */
export function capClauses(text: string, maxWords: number): string {
  const clean = (text ?? '').trim().replace(/[.,;\s]+$/, '');
  if (clean.length === 0) return '';
  const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;
  if (countWords(clean) <= maxWords) return clean;

  const clauses = clean.split(/\s*,\s*/).filter((c) => c.length > 0);
  const kept: string[] = [];
  let used = 0;
  for (const clause of clauses) {
    const n = countWords(clause);
    if (kept.length > 0 && used + n > maxWords) break;
    kept.push(clause);
    used += n;
  }
  const out = kept.join(', ');
  if (countWords(out) <= maxWords) return out;
  // Single overlong clause — trim by words as the last resort.
  return out.split(/\s+/).filter(Boolean).slice(0, maxWords).join(' ');
}

/**
 * CLIP-era tails carried by every `promptBase` in the DB. They are addressed to
 * a tag encoder, not to a 7B VL model that reads them as literal prose:
 * "as her constant identity anchor" describes our PIPELINE, and "full colour
 * illustration" is a style tag that fights the style LoRA. Both are pure
 * attention tax inside a 25-word identity budget.
 */
const IDENTITY_BOILERPLATE_RE =
  /,?\s*(?:as (?:his|her|their) constant identity anchor|full colour illustration|full color illustration)\b/gi;

export function stripIdentityBoilerplate(characterPrompt: string): string {
  return (characterPrompt ?? '').replace(IDENTITY_BOILERPLATE_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * A clause describing camera MOVEMENT ("the camera slowly tracking alongside",
 * "the camera locked off and still"). A still frame cannot show motion, so on
 * the image side it is dead weight inside the scene budget — motion belongs to
 * the i2v stage (Shot.promptFields.motionPrompt), which is a different prompt
 * entirely and is not touched here.
 */
const CAMERA_MOVE_CLAUSE_RE = /,?\s*the camera\b[^,]*/gi;

export function stripCameraMoveClause(scenePrompt: string): string {
  return (scenePrompt ?? '').replace(CAMERA_MOVE_CLAUSE_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Cut the seeded realcomic style block off the HEAD of a positive. On the
 * anchored path the style is carried twice already — the RealComic LoRA in the
 * graph and the trigger sentence at the tail — so repeating it in text only
 * pushes the action further from the front. It also drags in the negations the
 * style block ends with ("no photorealism, no anime"), which rule 2 forbids in
 * a Qwen positive.
 *
 * Cuts after the LAST style marker found in the head of the string; the framing
 * clause that follows ("a medium shot framed from the knees up, seen at eye
 * level") is camera, not style, and is deliberately kept — rule 3 wants camera
 * first.
 */
const REALCOMIC_STYLE_MARKERS = [
  'no anime',
  'no photorealism',
  '16:9 cinematic composition',
  'muted cinematic color palette',
];

export function stripBakedRealcomicStyle(scenePrompt: string): string {
  const src = (scenePrompt ?? '').trim();
  if (!hasBakedRealcomicStyle(src)) return src;
  const head = src.slice(0, 400).toLowerCase();
  let cutAt = -1;
  for (const marker of REALCOMIC_STYLE_MARKERS) {
    const at = head.lastIndexOf(marker);
    if (at >= 0) cutAt = Math.max(cutAt, at + marker.length);
  }
  if (cutAt < 0) return src;
  return src.slice(cutAt).replace(/^[\s,.;]+/, '').trim();
}

export interface QwenInstructionParticipant {
  displayName: string;
  characterPrompt: string;
}

export interface QwenInstructionOpts {
  /** Parallel to the attached reference images (Picture 1 = participants[0]). */
  participants: QwenInstructionParticipant[];
  /** Shot scene description (promptFields.positive, style block handling is
   *  the caller's job — see stripBakedStyleBlock). */
  scenePrompt: string;
  /** Location.description, passed SEPARATELY rather than appended to the
   *  positive: it is a shared entity with its own word budget, and appending it
   *  put it inside the scene budget where it was the first thing cut. Composed
   *  after the action — rule 3's order is subject → environment → light. */
  locationPrompt?: string;
  /** Style sentence: REALCOMIC_TRIGGER / REALCOMIC_T2I_STYLE / KEEP_REFERENCE_STYLE. */
  styleDirective: string;
  /** true when anchor images are actually attached as image1..image3. */
  withReferences: boolean;
  /**
   * A NON-person reference attached after the participants — a car, a thermos, a
   * brass bell. Diffusion redraws a described object from scratch every time, so
   * "the same car" across twenty shots is only achievable by showing it the same
   * pixels; this is the object equivalent of a character anchor.
   *
   * It gets its own `Picture N` binding and its own keep-clause. `label` is what
   * the binding calls it — short and concrete ("the cherry-red sedan"), never a
   * whole description, which belongs in the shot text.
   */
  objectReference?: { label: string };
}

export function composeQwenInstruction(o: QwenInstructionOpts): string {
  const scene = (o.scenePrompt ?? '').trim();

  // A prop-hero shot has NO people and one object reference — that is still an
  // edit with an attached picture, not a text-to-image render, so it must not
  // fall into the flat t2i branch below.
  const objectLabel = o.objectReference?.label?.trim();
  if (!o.withReferences || (o.participants.length === 0 && !objectLabel)) {
    // Pure t2i (environment shot / anchor portrait): flat style + scene + place.
    //
    // The scene text is NOT word-capped here: with no references the baked style
    // block at its head is the only thing carrying the project's look, and a
    // 45-word cap would decapitate it. Length is also far less harmful on this
    // path — there is no anchor pose for a long prompt to lose the fight to.
    // The location still travels as its own param (it is no longer appended to
    // the positive for Qwen graphs), so it MUST be re-joined here or environment
    // shots silently lose their location prose entirely.
    return [o.styleDirective, stripCameraMoveClause(scene), capClauses(o.locationPrompt ?? '', QWEN_WORD_BUDGET.location)]
      .filter((s) => s && s.length > 0)
      .join(', ');
  }

  // Rule 1 + 3: bind each attached picture to a name, state each identity once,
  // then ONE sentence of finished image. No meta-instructions, no negations
  // (rule 2) — the paste is fought in the graph, not with "do not copy".
  // The object reference is staged AFTER the people, so its picture index is
  // participants.length + 1 — keep this in step with how scene-render appends it
  // to anchorImagePaths, or the model is told the wrong picture is the car.
  const bindingList = o.participants.map((p, i) => `Picture ${i + 1} is ${p.displayName}.`);
  if (objectLabel) bindingList.push(`Picture ${o.participants.length + 1} is ${objectLabel}.`);
  const bindings = bindingList.join(' ');
  const described = o.participants.filter((p) => (p.characterPrompt ?? '').trim().length > 0);
  const identities = described
    .map((p) => {
      const identity = capClauses(
        stripIdentityBoilerplate(p.characterPrompt),
        QWEN_WORD_BUDGET.identity,
      );
      return identity ? `${p.displayName} is ${sentence(identity)}` : '';
    })
    .filter((s) => s.length > 0)
    .join(' ');
  const names = o.participants.map((p) => p.displayName).join(' and ');
  // The shot's own text IS the target-image description (rule 1). When a shot
  // has no positive at all, fall back to naming the cast — never to "draw a
  // new scene showing…", which is an instruction about the edit, not a result.
  const action = capClauses(stripCameraMoveClause(scene), QWEN_WORD_BUDGET.scene);
  const target = action ? sentence(action) : `${names} together in one scene.`;
  const place = capClauses(o.locationPrompt ?? '', QWEN_WORD_BUDGET.location);
  const where = place ? sentence(place) : '';
  // Rule 2 restated positively: what to PRESERVE, in one clause. NOT clothing —
  // it used to say "face, hair and clothing", which ordered the model to copy
  // the anchor's wardrobe and overrode every per-shot costume the screenplay
  // asked for ("an open coat over her tunic" → the anchor's bare tunic, plus the
  // anchor's pose riding along with it). Wardrobe belongs to the shot text and
  // the identity line; only face and hair are the anchor's job.
  const preserve = o.participants.length > 0
    ? `Keep each person's face and hair exactly as in their reference picture.`
    : '';
  // Objects get the OPPOSITE instruction to people: for a person only face and
  // hair are the anchor's job (wardrobe belongs to the shot), but a car must come
  // across whole — shape, colour, dents — or it is a different car next shot.
  const preserveObject = objectLabel
    ? `Keep ${objectLabel} exactly as in its reference picture, the same shape and colour.`
    : '';
  return [bindings, identities, target, where, preserve, preserveObject, sentence(o.styleDirective)]
    .filter((s) => s.length > 0)
    .join(' ');
}

/** Trim and terminate a clause so the composed instruction reads as prose to
 *  the VL encoder rather than as a run-on tag list. */
function sentence(s: string): string {
  const t = (s ?? '').trim();
  if (t.length === 0) return '';
  return /[.!?]$/.test(t) ? t : `${t}.`;
}
