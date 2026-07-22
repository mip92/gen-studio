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

  const refs = o.participants
    .map((p, i) => {
      const desc = (p.characterPrompt ?? '').trim();
      return `Picture ${i + 1} is ${p.displayName}${desc ? ` — ${desc}` : ''}.`;
    })
    .join(' ');
  const names = o.participants.map((p) => p.displayName).join(' and ');
  const placement = scene ? `Draw a new scene with ${names}: ${scene}.` : `Draw a new scene with ${names}.`;
  const identity =
    "Keep each person's face, hairstyle and build exactly as in their reference picture.";
  return [refs, placement, identity, `${o.styleDirective}.`].join(' ');
}
