import { SceneStrategy, hasBakedStyleBlock } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Flux comic-style ENVIRONMENT render (0 participants) — txt2img, no character.
 *
 * visualStyle = 'graphic_novel_flux'. The comic look comes from a Flux comic
 * style-LoRA on node "2" (a LoraLoader). The LoRA name is the JSON default
 * unless overridden per-project via `project.settings.styleLora` (applied in
 * scene-render.service, same node "2" mechanism as the SDXL comic styles).
 *
 * Flux requirements: cfg is forced to 1.0 by the KSampler default in the JSON;
 * the distilled-guidance knob lives on the FluxGuidance node "12". We never
 * write cfg here (the caller's cfg is ignored for Flux).
 *
 * Workflow: scene_environment_flux_comic_api.json
 *   1  UNETLoader        (flux base — overridable via settings.fluxBaseModel)
 *  10  DualCLIPLoader    t5xxl + clip_l (type: flux)
 *  11  VAELoader         ae.safetensors
 *   2  LoraLoader        comic style-LoRA (overridable via settings.styleLora)
 *   3  CLIPTextEncode    positive
 *   4  CLIPTextEncode    negative
 *  12  FluxGuidance      guidance (chain 3 → 12 → KSampler.positive)
 *   5  EmptySD3LatentImage
 *   6  KSampler          cfg=1.0
 *   7  VAEDecode
 *   8  SaveImage
 */
const STYLE_PREFIX =
  'modern cinematic graphic-novel illustration, comic book panel, ' +
  'bold confident black ink outlines with clean variable line weight, ' +
  'flat cell-shaded coloring with limited soft gradients, ' +
  'muted desaturated cinematic color palette, dramatic comic lighting, ' +
  '16:9 cinematic composition, no photorealism, no 3D render, no plastic skin';

const DEFAULT_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, ' +
  'watermark, text overlay, blurry, low quality, anime, manga, oversaturated color';

export class EnvironmentFluxComicSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment_flux_comic';
  readonly description      = 'Flux comic-style environment render (no character)';
  readonly filename         = 'scene_environment_flux_comic_api.json';
  readonly participantCount = 0;
  readonly visualStyle      = 'graphic_novel_flux';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    const positive = [
      hasBakedStyleBlock(params.scenePrompt) ? '' : STYLE_PREFIX,
      params.scenePrompt && params.scenePrompt.trim().length > 0 ? params.scenePrompt : '',
    ].filter((s) => s && s.trim().length > 0).join(', ');
    this.set(wf, '3', 'text', positive);

    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    this.set(wf, '5', 'width',      params.width);
    this.set(wf, '5', 'height',     params.height);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    // cfg stays 1.0 for Flux — never written from caller cfg.

    if (params.guidance !== undefined) this.set(wf, '12', 'guidance', params.guidance);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
