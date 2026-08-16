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

/**
 * RealComic styling for a YouTube COVER.
 *
 * Identical to REALCOMIC_T2I_STYLE in everything that carries the house look,
 * and deliberately different in one clause: it must not end on "muted cinematic
 * color palette".
 *
 * Measured 2026-08-11. `composeQwenInstruction` puts the style directive LAST,
 * the strongest recency position in the instruction — so a cover was closing
 * with a literal order to drain its colour. A shot render never does: with
 * anchors attached it closes on REALCOMIC_TRIGGER ("changed the image into
 * realcomic style"), where the word "muted" does not appear at all, and its
 * positive ends with three explicit palette terms plus a hard light. That
 * asymmetry — not the sampler — is why the films looked graded and the covers
 * looked grey. A cover competes in a grid of bright thumbnails; it is the ONE
 * frame in the system that needs its contrast pushed, not damped.
 */
export const REALCOMIC_COVER_STYLE =
  'realcomic style, hand-drawn comic illustration with a realistic touch, ' +
  'clean confident linework, painterly shading, rich saturated colour, ' +
  'high-contrast cinematic lighting with deep shadows and a bright light source';

/** Style directive for the dual-character OVERLAY on legacy cartoon styles:
 *  no Qwen style-LoRA there — the project style is carried by the anchor
 *  reference images themselves. */
export const KEEP_REFERENCE_STYLE =
  'keep the exact hand-drawn illustration style, linework and color palette of the reference pictures — no photorealism';

/**
 * Keep-clause for an END FRAME — the last frame of a `flf2v` clip, edited out of
 * the shot's own approved still.
 *
 * This clause is deliberately the OPPOSITE of the two the scene composer uses,
 * and the inversion is the whole point:
 *
 *  - The scene wrapper had to DROP the word `clothing`, because a per-shot
 *    costume in the screenplay kept losing to whatever the anchor was wearing
 *    (§2a of the skill). Here clothing must be pinned: the end frame is the same
 *    person five seconds later, and a changed garment mid-clip is a defect.
 *  - The prop keep-clause had to STOP saying "exactly as in its reference
 *    picture", because read literally that includes the viewpoint, and an
 *    overhead insert came back at the anchor's three-quarter angle. Here that
 *    literal reading is exactly what is wanted — the camera must not move
 *    between the first frame and the last, or Wan spends the clip travelling
 *    between two viewpoints instead of animating one.
 *
 * So the clause names every axis that must NOT move, positively (rule 2: the VL
 * encoder has no negation channel, so "do not move the camera" would move it).
 */
export const END_FRAME_IDENTITY_LOCK =
  'Keep the same place and everything in it, the same light and its direction, and '
  + 'each person\'s face, hair and clothing exactly as in the reference picture.';

/** Added only when the clip's camera is meant to hold still. */
export const END_FRAME_CAMERA_LOCK =
  'Keep the same camera position and framing.';

/**
 * The end frame's camera, phrased as the FINISHED image rather than as an
 * instruction (rule 1), keyed by the same `Shot.cameraMove` vocabulary that
 * produces the clip's own camera clause.
 *
 * This exists because the first version of the keep-clause pinned the camera
 * unconditionally, which contradicted every shot whose clip was told to push in
 * or track — 55 of 140 on `bully`. A pinned end frame plus a moving camera is
 * not "safe", it is two orders that cannot both be obeyed.
 *
 * Qwen-Image-Edit-2511 does novel view synthesis in the base model («generating
 * new viewpoints can now be done directly with the base model» — model card),
 * and its character consistency is what makes that usable here: the edit keeps
 * the same person while moving the viewpoint. Angles are kept SMALL on purpose —
 * Wan has 81 frames to travel the difference, and the further the two frames sit
 * apart the more it invents in between, which is where the warping lives.
 */
export const END_FRAME_CAMERA_MOVE: Record<string, string> = {
  push_in:       'The camera has moved a little closer: the same subject seen larger in the frame, from the same direction.',
  pull_out:      'The camera has moved a little back: the same subject seen smaller with more of the place around it, from the same direction.',
  track:         'The camera has moved a short step alongside: the same subject and the same place seen from a slightly shifted angle.',
  track_lateral: 'The camera has moved a short step sideways: the same subject and the same place seen from a slightly shifted angle.',
  pan_left:      'The camera has turned slightly to the left: the same place seen with the framing shifted a little that way.',
  pan_right:     'The camera has turned slightly to the right: the same place seen with the framing shifted a little that way.',
  pan:           'The camera has turned slightly: the same place seen with the framing shifted a little to one side.',
  tilt_up:       'The camera has tilted a little upward: the same place seen with the framing raised.',
  tilt_down:     'The camera has tilted a little downward: the same place seen with the framing lowered.',
  // Small arcs only. The subject stays the same person in the same place — this
  // is the one edit where 2511's novel-view synthesis is doing the work, and the
  // further it is pushed the more of the room it has to invent.
  arc_left:      'The same subject seen from slightly further to the left, turned a little more toward the camera, standing in the same place.',
  arc_right:     'The same subject seen from slightly further to the right, turned a little more toward the camera, standing in the same place.',
  // handheld / window_pov / static / locked_off deliberately absent — those clips
  // hold their viewpoint, so their end frame gets END_FRAME_CAMERA_LOCK instead.
};

/**
 * Build the Qwen-Image-Edit instruction that turns a shot's approved still into
 * the END frame of its clip.
 *
 * `change` is `Shot.endFramePrompt` — ONLY what is different a few seconds
 * later, written as the finished image rather than as an edit ("she is standing,
 * palm flat on the door handle", never "make her stand up"). Rule 1 of the skill.
 *
 * The style directive is appended for projects whose style is carried by a Qwen
 * LoRA; on every other project the style arrives through the reference picture
 * itself, which is the same image we are editing.
 */
/**
 * Compact addition for the SECOND half of a compound `cameraMove`
 * (`arc_left+push_in`). Appended to the primary viewpoint sentence so the end
 * frame states one combined viewpoint rather than two separate ones.
 */
export const END_FRAME_CAMERA_ALSO: Record<string, string> = {
  push_in:       'and framed a little tighter',
  pull_out:      'and framed a little wider',
  track:         'and shifted a step along',
  track_lateral: 'and shifted a step to the side',
  pan_left:      'and framed a little further left',
  pan_right:     'and framed a little further right',
  tilt_up:       'and framed a little higher',
  tilt_down:     'and framed a little lower',
  arc_left:      'and from slightly further to the left',
  arc_right:     'and from slightly further to the right',
};

/** Resolve one or two `+`-joined moves into a single viewpoint sentence. */
function endFrameCameraFor(move: string): string | undefined {
  const parts = move.split('+').map((m) => m.trim()).filter(Boolean);
  const head  = END_FRAME_CAMERA_MOVE[parts[0] ?? ''];
  if (!head) return undefined;
  const also = parts[1] ? END_FRAME_CAMERA_ALSO[parts[1]] : undefined;
  return also ? `${head.replace(/\.$/, '')}, ${also}.` : head;
}

export function composeEndFrameInstruction(
  change: string,
  opts: { styleDirective?: string; cameraMove?: string | null } = {},
): string {
  const capped = capClauses(change ?? '', QWEN_WORD_BUDGET.endFrame);
  const move   = endFrameCameraFor((opts.cameraMove ?? '').trim());
  const parts = [
    // "A moment later" rather than a number of seconds: the model has no clock,
    // and the phrase is what keeps it editing the same image instead of cutting
    // to a new one.
    capped ? `The same shot a moment later: ${capped}.` : 'The same shot a moment later.',
    // Camera before the identity lock, so the viewpoint is settled before the
    // model is told what must not change.
    move ?? END_FRAME_CAMERA_LOCK,
    END_FRAME_IDENTITY_LOCK,
  ];
  if (opts.styleDirective) parts.push(`${opts.styleDirective}.`);
  return parts.join(' ');
}

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
  /**
   * The CHANGE described by an end frame (`Shot.endFramePrompt`) — what is
   * different five seconds later, and nothing else.
   *
   * Smaller than `scene` on purpose. A scene positive has to build a whole image
   * from an empty latent; an end frame starts from the finished image and only
   * has to name a difference. Everything the author is tempted to restate here —
   * who the person is, where they are, how it is lit — is already coming across
   * the pixel channel, and restating it spends budget arguing with a donor that
   * has already won.
   */
  endFrame: 40,
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
  /**
   * How much of the person is actually in frame, from `Shot.shotType`.
   *
   * 'full' (default) — the face is the point; the composer states each identity
   * and orders face + hair preserved.
   *
   * 'hands-only' (POV) — a first-person frame in which only the character's own
   * hands enter the picture. The composer used to ship the SAME two clauses
   * here: a 35-word identity ("a solid east-european man of forty-four, dark
   * chestnut hair greying at the temples, tired brown eyes…") and "Keep each
   * person's face and hair exactly as in their reference picture" — an explicit
   * order to draw a face into a shot whose whole point is that there is no face
   * in it. With the anchor also attached as pixels, the model did the obvious
   * thing and put the character in the foreground holding his own hands (user
   * 2026-08-13). Identity is dropped and the keep-clause is re-aimed at what IS
   * visible: hands, skin, sleeves.
   *
   * 'back' (BACK) — seen from behind. The face is out, but hair, build and
   * clothing are the whole recognition cue, so the identity line stays and only
   * the keep-clause changes.
   */
  faceVisibility?: 'full' | 'back' | 'hands-only';
  /**
   * Override for QWEN_WORD_BUDGET.scene. The scenes keep the measured 55; a
   * thumbnail is one hero frame whose idea model is asked for 40-90 words of
   * composition, so it passes ~90 — at 55 the cap ate exactly the trailing
   * clauses that matter most on a cover (the palette and the quiet lower third
   * the caption is drawn on).
   */
  sceneBudget?: number;
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
  const faceVisibility = o.faceVisibility ?? 'full';
  // A hands-only frame has no room for a face description, and stating one is
  // what put the whole character in the shot (see QwenInstructionOpts).
  const described = faceVisibility === 'hands-only'
    ? []
    : o.participants.filter((p) => (p.characterPrompt ?? '').trim().length > 0);
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
  const action = capClauses(stripCameraMoveClause(scene), o.sceneBudget ?? QWEN_WORD_BUDGET.scene);
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
    ? faceVisibility === 'hands-only'
      ? `Keep the same hands, skin tone and sleeves as in the reference picture.`
      : faceVisibility === 'back'
        ? `Keep each person's hair, build and clothing as in their reference picture.`
        : `Keep each person's face and hair exactly as in their reference picture.`
    : '';
  // Objects get a WIDER keep than people — for a person only face and hair are
  // the anchor's job (wardrobe belongs to the shot), but a car must come across
  // whole, or it is a different car next shot. What it must NOT include is the
  // donor's viewpoint: `exactly as in its reference picture` was read as "the
  // same picture", and with reference_latents on it returned the anchor at the
  // anchor's angle even where the shot asked for "seen from directly overhead"
  // (user 2026-08-13 «предметы — тупо якоря под теми же углами»). Naming the
  // FEATURES that must match leaves the angle to the shot text, exactly as
  // dropping the word `clothing` freed the pose on the people side.
  const preserveObject = objectLabel
    ? `Keep the shape, colour, material and markings of ${objectLabel} as in its reference picture.`
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
