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
  /**
   * Which i2v workflow to use — explicit per-shot, no 'auto':
   *  - 'fast' (DEFAULT) — lightx2v 4-step full-distill fp8 checkpoints (the
   *    distillation is baked into the weights, not applied as a rank-64 LoRA),
   *    cfg=1.0. Fast (~2-3min). At cfg=1 the negative prompt has ZERO effect
   *    (CFG collapses to the positive); motion is steered by the positive
   *    prompt alone — Skill(gen-studio-wan22). = «быстро».
   *  - 'cfg' — full Wan2.2 dual-expert, no distillation, 20 steps, cfg=4.0. ~5×
   *    slower, but the negative prompt actually fires — pick per shot when
   *    suppressing unwanted motion matters. = «качество».
   *
   * There used to be a third mode, 'distill', described as "full-distill fp8 vs
   * the LoRA approximation". It was removed 2026-07-30: no such distinct
   * checkpoint exists on disk, `video_wan22_i2v_distill_api.json` was
   * byte-identical to the fast default in every project, it was never exposed
   * in the UI, and 0 of 6 577 historical renders used it — 'fast' already IS
   * the full-distill path. Rows carrying the old filename still load, because
   * loadTemplate keeps it in ALLOWED_WORKFLOWS.
   *
   * (Engine family Wan/Flux/SDXL is a per-PROJECT decision via project.visualStyle.)
   */
  mode?:         'fast' | 'cfg';
}

export interface VideoRenderParams {
  motionPrompt: string;
  seed:         number;
  width:        number;
  height:       number;
  length:       number;
  fps:          number;
}
