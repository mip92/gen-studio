/**
 * Caller-facing input to start a video render. Only `motionPrompt` is required
 * at the model level — everything else has reasonable defaults from the i2v
 * workflow template (640×640, 81 frames @ 16 fps, 4-step Wan2.2 i2v).
 */
export interface StartVideoInput {
  shotId:        string;
  /** Motion description appended to the positive prompt — what the frame should do. */
  motionPrompt?: string;
  seed?:         number;
  /** Output dims for the i2v latent. Defaults to 640×640 (Wan2.2 native bucket). */
  width?:        number;
  height?:       number;
  /** Number of frames (Wan2.2 native is 81 → ~5 sec @ 16 fps). */
  length?:       number;
  fps?:          number;
}

export interface VideoRenderParams {
  motionPrompt: string;
  seed:         number;
  width:        number;
  height:       number;
  length:       number;
  fps:          number;
}
