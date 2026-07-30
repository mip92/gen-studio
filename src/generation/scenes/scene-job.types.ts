/** A single character participating in a scene. */
export interface SceneParticipant {
  /** Trigger token baked into the LoRA captions during training. */
  triggerToken:  string;
  /** Human-readable display name of the character. */
  displayName:   string;
  /** Absolute path to the LoRA .safetensors file. */
  loraPath:      string;
  /** Per-character description (e.g. "young male courier in jacket") — appended after trigger. */
  characterPrompt: string;
  /** LoRA strength (0..1.5). Default 1.0 single-char, ~0.7 multi-char. */
  loraStrength?: number;
}

/** Common params for any scene strategy. */
export interface SceneJobParams {
  participants:    SceneParticipant[];
  /** Description of what's happening in the scene. */
  scenePrompt:     string;
  /** Location.description, kept OUT of scenePrompt on the Qwen path so it can
   *  carry its own word budget (see QWEN_WORD_BUDGET in qwen/qwen-prompt.ts).
   *  The CLIP strategies still receive the location appended into scenePrompt by
   *  the service, exactly as before — nothing about them changes. */
  locationPrompt?: string;
  /** Short label for the object reference staged as the LAST entry of
   *  `anchorImagePaths` (a prop with an installed anchor PNG). Present only when
   *  that image was actually attached, so the strategy can bind it to its own
   *  `Picture N` line. See Prop.anchorPath / props.controller. */
  objectReferenceLabel?: string;
  /** Negative prompt — appended to the strategy's defaults. */
  negativeExtra?:  string;
  width:           number;
  height:          number;
  seed:            number;
  steps?:          number;
  cfg?:            number;
  /** Flux only: FluxGuidance value (the distilled-guidance knob; cfg stays 1.0
   *  on Flux). Ignored by SDXL strategies. Default ~3.5 when unset. */
  guidance?:       number;
  /** How many images to generate in a single ComfyUI run (batch_size on EmptyLatentImage). */
  batchSize?:      number;
  filenamePrefix:  string;

  // ── Flux Redux identity (graphic_novel_flux only) ─────────────────────────
  /** ComfyUI-input-relative filename of the staged anchor PNG. When set, the
   *  Flux comic single-character strategy injects the Redux nodes and feeds this
   *  image as the identity reference. Absent → text-only identity (promptBase).
   *  The service only sets this when the anchor PNG AND the Redux model files
   *  are present on disk, so the strategy can trust it. */
  referenceImagePath?: string;
  /** Redux style-model filename (models/style_models/). */
  reduxStyleModel?:    string;
  /** Redux CLIP-Vision filename (models/clip_vision/). */
  reduxClipVision?:    string;
  /** StyleModelApply strength (0..1, identity influence). Default ~0.8. */
  reduxStrength?:      number;

  // ── Qwen-Image-Edit-2511 multi-anchor identity ─────────────────────────────
  /** ComfyUI-input-relative filenames of the staged participant anchor PNGs,
   *  parallel to `participants` (Picture 1 = participants[0]), max 3. Set by
   *  scene-render.service ONLY when every required anchor + the Qwen model
   *  files are present on disk, so strategies can trust it — the realcomic_qwen
   *  strategies and the dual-character Qwen overlay read it. */
  anchorImagePaths?:   string[];
  /**
   * Per-project override of the Qwen appearance channel
   * (`project.settings.qwenReferenceLatents`). Absent → each strategy's own
   * default: OFF for realcomic_qwen scenes (style is carried by the RealComic
   * LoRA, so the anchors are needed for identity only and the pixel channel
   * only pastes the character sheet into the frame), ON for the dual-character
   * overlay (there the anchors ARE the style carrier). See
   * QwenGraphSpec.referenceLatents for the mechanism.
   */
  qwenReferenceLatents?: boolean;
  /** Style LoRA for the Qwen graph (RealComic by default; overridable via
   *  project.settings.styleLora — the same convention node "2" uses on the
   *  legacy cartoon graphs). Absent on the dual-character overlay, where the
   *  style is carried by the anchor reference images. */
  qwenStyleLora?:      { name: string; strengthModel?: number };
}
