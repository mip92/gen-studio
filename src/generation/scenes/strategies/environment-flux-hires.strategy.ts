import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, watermark, text, signature, ' +
  'cartoon, anime, 3d render, plastic, oversaturated, hdr';

/**
 * Flux UltraReal v4 environment scene at 1280×720 base + hires-fix to 1920×1080.
 *
 * Pipeline:
 *   1. KSampler base @ 1280×720, 25 steps, denoise=1.0
 *   2. LatentUpscale (bislerp) → 1920×1080
 *   3. KSampler refiner @ 1920×1080, 12 steps, denoise=0.4 — adds detail
 *   4. VAEDecode → SaveImage
 *
 * Workflow: scene_environment_flux_hires_api.json
 *   1  UNETLoader
 *  10  DualCLIPLoader
 *  11  VAELoader
 *   3  CLIPTextEncode (pos)
 *   4  CLIPTextEncode (neg)
 *  12  FluxGuidance
 *   5  EmptySD3LatentImage (base 1280×720)
 *   6  KSampler base
 *  20  LatentUpscale → final FHD
 *  21  KSampler refiner (denoise 0.4)
 *   7  VAEDecode
 *   8  SaveImage
 */
export class EnvironmentFluxHiresSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment_flux_hires';
  readonly description      = 'Flux UltraReal v4 render at 1280×720 + hires-fix upscale to 1920×1080';
  readonly filename         = 'scene_environment_flux_hires_api.json';
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

    // Base latent — Flux 16:9 native (overrides any params.width)
    this.set(wf, '5', 'width',      1280);
    this.set(wf, '5', 'height',     720);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);

    // Upscale target — keep template's FHD default unless caller explicitly
    // requested a larger size. scene-render service defaults params.width/height
    // to the SDXL base (1344×768), which would make this upscale a no-op.
    if (params.width  && params.width  > 1280) this.set(wf, '20', 'width',  params.width);
    if (params.height && params.height > 720)  this.set(wf, '20', 'height', params.height);

    // Refiner — same seed (preserves composition), shorter, partial denoise for detail
    this.set(wf, '21', 'seed', params.seed);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
