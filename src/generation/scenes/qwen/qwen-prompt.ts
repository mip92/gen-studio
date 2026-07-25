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
  /** Style sentence: REALCOMIC_TRIGGER / REALCOMIC_T2I_STYLE / KEEP_REFERENCE_STYLE. */
  styleDirective: string;
  /** true when anchor images are actually attached as image1..image3. */
  withReferences: boolean;
}

export function composeQwenInstruction(o: QwenInstructionOpts): string {
  const scene = (o.scenePrompt ?? '').trim();

  if (!o.withReferences || o.participants.length === 0) {
    // Pure t2i (environment shot / anchor portrait): flat style + scene text.
    return [o.styleDirective, scene].filter((s) => s && s.length > 0).join(', ');
  }

  // Rule 1 + 3: bind each attached picture to a name, state each identity once,
  // then ONE sentence of finished image. No meta-instructions, no negations
  // (rule 2) — the paste is fought in the graph, not with "do not copy".
  const bindings = o.participants
    .map((p, i) => `Picture ${i + 1} is ${p.displayName}.`)
    .join(' ');
  const described = o.participants.filter((p) => (p.characterPrompt ?? '').trim().length > 0);
  const identities = described
    .map((p) => `${p.displayName} is ${sentence(p.characterPrompt)}`)
    .join(' ');
  const names = o.participants.map((p) => p.displayName).join(' and ');
  // The shot's own text IS the target-image description (rule 1). When a shot
  // has no positive at all, fall back to naming the cast — never to "draw a
  // new scene showing…", which is an instruction about the edit, not a result.
  const target = scene ? sentence(scene) : `${names} together in one scene.`;
  // Rule 2 restated positively: what to PRESERVE, in one clause.
  const preserve = `Keep each person's face, hair and clothing exactly as in their reference picture.`;
  return [bindings, identities, target, preserve, sentence(o.styleDirective)]
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
