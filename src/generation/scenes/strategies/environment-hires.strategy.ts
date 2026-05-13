import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic, oversaturated, hdr';

/**
 * Environment scene render at SDXL-native base + hires-fix upscale to Full HD.
 *
 * Pipeline:
 *   1. KSampler base @ 1344×768 (28 steps, denoise=1.0) — clean SDXL output, no doubled subjects
 *   2. LatentUpscale (bislerp) → 1920×1080
 *   3. KSampler refiner @ 1920×1080 (15 steps, denoise=0.4) — adds details, preserves composition
 *   4. VAEDecode → SaveImage
 *
 * Workflow: scene_environment_hires_api.json
 *   1  CheckpointLoader
 *   3  CLIPTextEncode (pos)
 *   4  CLIPTextEncode (neg)
 *   5  EmptyLatentImage (base 1344×768)
 *   6  KSampler base
 *  20  LatentUpscale → final FHD
 *  21  KSampler refiner (denoise 0.4)
 *   7  VAEDecode
 *   8  SaveImage
 */
export class EnvironmentHiresSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment_hires';
  readonly description      = 'Environment-only render at 1344×768 + hires-fix upscale to 1920×1080';
  readonly filename         = 'scene_environment_hires_api.json';
  readonly participantCount = 0;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    // Positive / negative
    this.set(wf, '3', 'text', params.scenePrompt && params.scenePrompt.trim().length > 0
      ? params.scenePrompt
      : 'cinematic establishing shot, photorealistic');
    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    // Base latent — always SDXL-native landscape (overrides any params.width)
    this.set(wf, '5', 'width',      1344);
    this.set(wf, '5', 'height',     768);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    // Base sampler
    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    // Upscale target = params.width × params.height (default 1920×1080 from caller)
    this.set(wf, '20', 'width',  params.width);
    this.set(wf, '20', 'height', params.height);

    // Refiner — same seed (preserves composition), shorter, partial denoise for detail polish
    this.set(wf, '21', 'seed', params.seed);

    // Save
    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
