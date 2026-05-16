/**
 * Caller-facing input to start a video render. Only `motionPrompt` is required
 * at the model level — everything else has reasonable defaults from the i2v
 * workflow template (640×640, 81 frames @ 16 fps, 4-step Wan2.2 i2v).
 */
export interface StartVideoInput {
  shotId:        string;
  /** Motion description appended to the positive prompt — what the frame should do. */
  motionPrompt?: string;
  /** Seed for the first render. If count > 1, subsequent renders get random seeds. */
  seed?:         number;
  /** Output dims for the i2v latent. Defaults to 832×480 (Wan2.2 native widescreen 480p). */
  width?:        number;
  height?:       number;
  /** Number of frames (Wan2.2 native is 81 → ~5 sec @ 16 fps). */
  length?:       number;
  fps?:          number;
  /** How many renders to queue with the same motion prompt + size, different seeds. Default 1, max 8. */
  count?:        number;
}

export interface VideoRenderParams {
  motionPrompt: string;
  seed:         number;
  width:        number;
  height:       number;
  length:       number;
  fps:          number;
}
