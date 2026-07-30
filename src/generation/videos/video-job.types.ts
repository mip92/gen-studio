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
   *    cfg=1.0. MEASURED median 150 s over 6 156 completed renders. At cfg=1
   *    ComfyUI does not even evaluate the uncond branch (`comfy/samplers.py`:
   *    `if math.isclose(cond_scale, 1.0) … uncond_ = None`), so the negative
   *    prompt has ZERO effect and motion is steered by the positive prompt
   *    alone — Skill(gen-studio-wan22). 4 model passes per clip. = «быстро».
   *  - 'guard' — the fast graph with cfg 2.5 on the HIGH-NOISE sampler only
   *    (node 14, steps 0→2); the low-noise pass stays at cfg 1.0. 6 passes,
   *    est. ~196 s (+31 %). The high-noise expert of an A14B MoE is the one
   *    that decides composition, so this is where a negative prompt can stop a
   *    figure walking into an empty frame — at a sixth of what 'cfg' costs.
   *    Added 2026-07-30, NOT yet validated against a rendered A/B. = «страж».
   *  - 'cfg' — full Wan2.2 dual-expert, no distillation, 20 steps, cfg=4.0 → 40
   *    model passes. MEASURED median 980 s over 52 renders, i.e. **6.5×** the
   *    fast path (this used to claim ~5×). The negative prompt actually fires —
   *    pick per shot when suppressing unwanted content matters. = «качество».
   *
   * There used to be a third mode, 'distill', described as "full-distill fp8 vs
   * the LoRA approximation". It was removed 2026-07-30: no such distinct
   * checkpoint exists on disk, `video_wan22_i2v_distill_api.json` was
   * byte-identical to the fast default in every project, it was never exposed
   * in the UI, and 0 of 6 945 historical renders used it — 'fast' already IS
   * the full-distill path. The JSON itself and its allowlist entry were deleted
   * 2026-07-30; an unknown filename falls back to the fast default anyway.
   *
   * (Engine family Wan/Flux/SDXL is a per-PROJECT decision via project.visualStyle.)
   */
  mode?:         'fast' | 'guard' | 'cfg';
}

export interface VideoRenderParams {
  motionPrompt: string;
  seed:         number;
  width:        number;
  height:       number;
  length:       number;
  fps:          number;
}
