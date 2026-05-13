import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic, oversaturated, hdr';

/**
 * Environment / no-character scene render.
 *
 * For shots like "wide street establishing", "interior empty kitchen", etc.
 * where the prompt drives the image and no LoRA / character lock is needed.
 *
 * Workflow file: scene_environment_api.json (no LoraLoader nodes)
 *   1 CheckpointLoaderSimple → SDXL base
 *   3 CLIPTextEncode (pos)    → scenePrompt only
 *   4 CLIPTextEncode (neg)    → defaults + negativeExtra
 *   5 EmptyLatentImage        → width × height
 *   6 KSampler                → seed, steps, cfg
 *   7 VAEDecode
 *   8 SaveImage               → filename_prefix
 */
export class EnvironmentSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment';
  readonly description      = 'Prompt-only SDXL render — no LoRA, no character locks';
  readonly filename         = 'scene_environment_api.json';
  readonly participantCount = 0;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    this.set(wf, '3', 'text', params.scenePrompt && params.scenePrompt.trim().length > 0
      ? params.scenePrompt
      : 'cinematic establishing shot, photorealistic');

    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    this.set(wf, '5', 'width',      params.width);
    this.set(wf, '5', 'height',     params.height);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
