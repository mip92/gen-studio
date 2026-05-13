import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, bad anatomy, extra fingers, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic';

/**
 * Single-character scene render.
 *
 * Workflow file: scene_single_character_api.json (8 nodes)
 *   1 CheckpointLoaderSimple → SDXL base
 *   2 LoraLoader              → character LoRA
 *   3 CLIPTextEncode (pos)    → "<trigger>, <displayName>, <characterPrompt>, <scenePrompt>"
 *   4 CLIPTextEncode (neg)    → defaults + negativeExtra
 *   5 EmptyLatentImage        → width × height
 *   6 KSampler                → seed, steps, cfg
 *   7 VAEDecode
 *   8 SaveImage               → filename_prefix
 */
export class SingleCharacterSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_single_character';
  readonly description      = 'Single character SDXL scene render with one LoRA';
  readonly filename         = 'scene_single_character_api.json';
  readonly participantCount = 1;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    if (params.participants.length !== 1) {
      throw new Error(`SingleCharacterSceneStrategy requires exactly 1 participant, got ${params.participants.length}`);
    }
    const p = params.participants[0];
    const wf = structuredClone(template);

    // LoRA
    this.set(wf, '2', 'lora_name',      p.loraPath);
    this.set(wf, '2', 'strength_model', p.loraStrength ?? 1.0);
    this.set(wf, '2', 'strength_clip',  1.0);

    // Positive prompt: trigger first, then name, then character description, then scene.
    const positive = [p.triggerToken, p.displayName, p.characterPrompt, params.scenePrompt]
      .filter((s) => s && s.trim().length > 0)
      .join(', ');
    this.set(wf, '3', 'text', positive);

    // Negative
    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    // Latent dims
    this.set(wf, '5', 'width',      params.width);
    this.set(wf, '5', 'height',     params.height);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    // Sampler
    this.set(wf, '6', 'seed',  params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    // Save
    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
