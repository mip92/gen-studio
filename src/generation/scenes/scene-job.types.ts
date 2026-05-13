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
  /** Negative prompt — appended to the strategy's defaults. */
  negativeExtra?:  string;
  width:           number;
  height:          number;
  seed:            number;
  steps?:          number;
  cfg?:            number;
  /** How many images to generate in a single ComfyUI run (batch_size on EmptyLatentImage). */
  batchSize?:      number;
  filenamePrefix:  string;
}
