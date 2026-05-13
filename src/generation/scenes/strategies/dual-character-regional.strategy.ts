import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, bad anatomy, extra fingers, fused fingers, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic skin, oversaturated, hdr, ' +
  // Anti-merge / anti-bleed: discourage face mixing between the two regions
  'merged faces, two-headed, conjoined, hybrid face, half-half face, identity bleed, doubled subject';

/**
 * Dual-character scene render with horizontal regional prompting.
 *
 * Layout (1344×768): left half → character A, right half → character B.
 *
 * Workflow file: scene_dual_character_regional_api.json
 *
 *   1  CheckpointLoaderSimple → SDXL base
 *   2  LoraLoader_A   → MODEL_A,  CLIP_A    (loads LoRA A on top of base)
 *   3  LoraLoader_B   → MODEL_AB, CLIP_B    (loads LoRA B on top of A's MODEL; CLIP from base)
 *   4  CLIPTextEncode → cond_A   using CLIP_A   (character A prompt)
 *   5  CLIPTextEncode → cond_B   using CLIP_B   (character B prompt)
 *   6  CLIPTextEncode → cond_neg using base CLIP (negative)
 *   7  CLIPTextEncode → cond_scene using base CLIP (shared scene description)
 *   8  ConditioningSetArea(cond_A, x=0,   w=672, h=768)   → A locked to LEFT half
 *   9  ConditioningSetArea(cond_B, x=672, w=672, h=768)   → B locked to RIGHT half
 *  10  ConditioningCombine(8, 9)                          → regional combined
 *  11  ConditioningCombine(10, 7)                         → + shared scene context
 *  12  EmptyLatentImage 1344×768
 *  13  KSampler(MODEL_AB, cond_combined, cond_neg)
 *  14  VAEDecode
 *  15  SaveImage
 *
 * Why this works without face-bleed:
 *   - Each LoRA's CLIP is used ONLY for that character's text encode.
 *   - SetArea localizes each conditioning's strength to its half of the latent.
 *   - The KSampler attends to the regional conditioning per spatial position.
 *   - Background/scene cond is shared so both halves agree on environment.
 *   - LoRA strength is reduced to 0.85 (vs 1.0 single-char) — the additive
 *     deltas of two stacked LoRAs would oversaturate at 1.0+1.0=2.0.
 */
export class DualCharacterRegionalSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_dual_character_regional';
  readonly description      = 'Two-character SDXL scene render with horizontal regional prompting (no face bleed)';
  readonly filename         = 'scene_dual_character_regional_api.json';
  readonly participantCount = 2;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    if (params.participants.length !== 2) {
      throw new Error(`DualCharacterRegionalSceneStrategy requires exactly 2 participants, got ${params.participants.length}`);
    }
    const [a, b] = params.participants;
    const wf = structuredClone(template);

    // Both LoRAs reduced to 0.85 to compensate for additive stacking
    const strA = a.loraStrength ?? 0.85;
    const strB = b.loraStrength ?? 0.85;

    // Node 2: LoRA A
    this.set(wf, '2', 'lora_name',      a.loraPath);
    this.set(wf, '2', 'strength_model', strA);
    this.set(wf, '2', 'strength_clip',  1.0);

    // Node 3: LoRA B (chained on A's model, but CLIP from base node 1)
    this.set(wf, '3', 'lora_name',      b.loraPath);
    this.set(wf, '3', 'strength_model', strB);
    this.set(wf, '3', 'strength_clip',  1.0);

    // Per-character prompts: trigger + name + character description
    // Scene-wide context goes into node 7 (shared) so the model agrees on environment.
    const promptFor = (p: typeof a) =>
      [p.triggerToken, p.displayName, p.characterPrompt]
        .filter((s) => s && s.trim().length > 0).join(', ');

    this.set(wf, '4', 'text', promptFor(a));
    this.set(wf, '5', 'text', promptFor(b));

    // Negative
    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '6', 'text', negative);

    // Shared scene context: what's happening, location, lighting
    this.set(wf, '7', 'text', params.scenePrompt && params.scenePrompt.trim()
      ? params.scenePrompt
      : 'two people side by side, cinematic lighting, photorealistic');

    // Latent — always SDXL-native 1344×768 for 2-char regional. Direct 1920×1080
    // would produce doubled subjects per region. FHD upscale for dual regional
    // is a separate TODO (would need post-decode ImageScale).
    const baseW = 1344;
    const baseH = 768;
    const halfWidth = baseW / 2;  // 672
    this.set(wf, '8', 'width',  halfWidth);
    this.set(wf, '8', 'height', baseH);
    this.set(wf, '8', 'x',      0);
    this.set(wf, '9', 'width',  halfWidth);
    this.set(wf, '9', 'height', baseH);
    this.set(wf, '9', 'x',      halfWidth);

    this.set(wf, '12', 'width',      baseW);
    this.set(wf, '12', 'height',     baseH);
    this.set(wf, '12', 'batch_size', params.batchSize ?? 1);

    // Sampler
    this.set(wf, '13', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '13', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '13', 'cfg',   params.cfg);

    // Save
    this.set(wf, '15', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
