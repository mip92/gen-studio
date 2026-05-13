import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic, oversaturated, hdr';

/**
 * Flux UltraReal v4 environment scene render — txt2img, no LoRA, no character lock.
 *
 * Quality leap over SDXL lustify path: photoreal Flux fine-tune + FluxGuidance.
 * cfg is forced to 1.0 (Flux requirement); guidance lives on FluxGuidance node 12.
 *
 * Workflow: scene_environment_flux_api.json
 *   1  UNETLoader              ultrarealFineTune_v4_fp8.safetensors
 *  10  DualCLIPLoader          t5xxl_fp8 + clip_l (type: flux)
 *  11  VAELoader               ae.safetensors
 *   3  CLIPTextEncode (pos)
 *   4  CLIPTextEncode (neg)
 *  12  FluxGuidance            guidance 3.5 (chain pos → 12 → KSampler)
 *   5  EmptySD3LatentImage     1280×720 default (16:9 cinematic)
 *   6  KSampler                cfg=1.0, euler/simple, 25 steps
 *   7  VAEDecode
 *   8  SaveImage
 */
export class EnvironmentFluxSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment_flux';
  readonly description      = 'Flux UltraReal v4 prompt-only render — photoreal, no LoRA';
  readonly filename         = 'scene_environment_flux_api.json';
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
    // cfg is hardcoded to 1.0 for Flux; ignore caller cfg.

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
