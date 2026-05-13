import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, bad anatomy, extra fingers, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic, doubled subject, two-headed, conjoined';

/**
 * Single-character scene render at SDXL-native base + hires-fix upscale to FHD.
 *
 * Workflow: scene_single_character_hires_api.json
 *   1  CheckpointLoader
 *   2  LoraLoader
 *   3  CLIPTextEncode (pos)
 *   4  CLIPTextEncode (neg)
 *   5  EmptyLatentImage (base 1344×768)
 *   6  KSampler base (denoise=1.0)
 *  20  LatentUpscale → FHD
 *  21  KSampler refiner (denoise=0.4)
 *   7  VAEDecode
 *   8  SaveImage
 */
export class SingleCharacterHiresSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_single_character_hires';
  readonly description      = 'Single-character render at 1344×768 + hires-fix upscale to 1920×1080';
  readonly filename         = 'scene_single_character_hires_api.json';
  readonly participantCount = 1;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    if (params.participants.length !== 1) {
      throw new Error(`SingleCharacterHires requires 1 participant, got ${params.participants.length}`);
    }
    const p = params.participants[0];
    const wf = structuredClone(template);

    // LoRA
    this.set(wf, '2', 'lora_name',      p.loraPath);
    this.set(wf, '2', 'strength_model', p.loraStrength ?? 1.0);
    this.set(wf, '2', 'strength_clip',  1.0);

    // Positive: trigger + name + character description + scene prompt
    const positive = [p.triggerToken, p.displayName, p.characterPrompt, params.scenePrompt]
      .filter((s) => s && s.trim().length > 0).join(', ');
    this.set(wf, '3', 'text', positive);
    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    // Base latent — SDXL native
    this.set(wf, '5', 'width',      1344);
    this.set(wf, '5', 'height',     768);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    // Base sampler
    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    // Upscale target
    this.set(wf, '20', 'width',  params.width);
    this.set(wf, '20', 'height', params.height);

    // Refiner — same seed
    this.set(wf, '21', 'seed', params.seed);

    // Save
    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
