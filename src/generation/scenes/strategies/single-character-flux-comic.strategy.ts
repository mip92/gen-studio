import { SceneStrategy, hasBakedStyleBlock } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Flux comic-style SINGLE-CHARACTER render (1 participant).
 *
 * visualStyle = 'graphic_novel_flux'. Identity is text-only (profile.promptBase)
 * by default, exactly like the SDXL comic single-character strategy. When the
 * service supplies `params.referenceImagePath` (only set when the character's
 * anchor PNG AND the Flux Redux model files are present on disk), this strategy
 * additionally injects a Flux Redux chain that conditions the generation on the
 * anchor portrait — a Flux-native way to hold the face/look across panels.
 *
 * Base workflow: scene_single_character_flux_comic_api.json
 *   1  UNETLoader        (flux base — overridable via settings.fluxBaseModel)
 *  10  DualCLIPLoader    t5xxl + clip_l (type: flux)
 *  11  VAELoader         ae.safetensors
 *   2  LoraLoader        comic style-LoRA (overridable via settings.styleLora)
 *   3  CLIPTextEncode    positive
 *   4  CLIPTextEncode    negative
 *  12  FluxGuidance      conditioning ← 3 (text-only) or ← 24 (Redux); → KSampler
 *   5  EmptySD3LatentImage
 *   6  KSampler          cfg=1.0
 *   7  VAEDecode
 *   8  SaveImage
 *
 * Redux nodes (added programmatically ONLY when referenceImagePath is set, so
 * the JSON template stays a valid text-only graph that never references a
 * missing model/image):
 *  21  StyleModelLoader     flux1-redux-dev.safetensors
 *  22  CLIPVisionLoader     sigclip_vision_patch14_384.safetensors
 *  23  LoadImage            <anchor PNG staged into ComfyUI input dir>
 *  24  CLIPVisionEncode     image ← 23, clip_vision ← 22
 *  25  StyleModelApply      conditioning ← 3, style_model ← 21, clip_vision_output ← 24
 *  (then node 12.conditioning is rewired from ["3",0] to ["25",0])
 */
const STYLE_PREFIX =
  'modern cinematic graphic-novel illustration, comic book panel, ' +
  'bold confident black ink outlines with clean variable line weight, ' +
  'flat cell-shaded coloring with limited soft gradients, ' +
  'muted desaturated cinematic color palette, semi-realistic proportions, ' +
  'dramatic comic lighting, 16:9 cinematic composition, ' +
  'no photorealism, no 3D render, no plastic skin';

const DEFAULT_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, ' +
  'real human face, deformed hands, extra fingers, two heads, watermark, ' +
  'text overlay, blurry, low quality, anime, manga, oversaturated color';

const DEFAULT_REDUX_STYLE_MODEL = 'flux1-redux-dev.safetensors';
const DEFAULT_REDUX_CLIP_VISION = 'sigclip_vision_patch14_384.safetensors';
const DEFAULT_REDUX_STRENGTH    = 0.8;

export class SingleCharacterFluxComicSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_single_character_flux_comic';
  readonly description      = 'Flux comic-style single character — promptBase + optional Redux anchor';
  readonly filename         = 'scene_single_character_flux_comic_api.json';
  readonly participantCount = 1;
  readonly visualStyle      = 'graphic_novel_flux';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    const participantPrompts = (params.participants ?? []).map((p) => p.characterPrompt).join(', ');
    const positive = [
      hasBakedStyleBlock(params.scenePrompt) ? '' : STYLE_PREFIX,
      participantPrompts,
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
    // cfg stays 1.0 for Flux.

    if (params.guidance !== undefined) this.set(wf, '12', 'guidance', params.guidance);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    // ── Optional Flux Redux identity injection ─────────────────────────────
    if (params.referenceImagePath && params.referenceImagePath.trim().length > 0) {
      this.injectRedux(wf, params);
    }

    return wf;
  }

  /**
   * Add the Redux chain and rewire FluxGuidance to read the Redux-conditioned
   * positive. Mutates `wf` in place. Node ids 21–25 are reserved for Redux and
   * never appear in the text-only template.
   */
  private injectRedux(wf: WorkflowTemplate, params: SceneJobParams): void {
    const styleModel = params.reduxStyleModel ?? DEFAULT_REDUX_STYLE_MODEL;
    const clipVision = params.reduxClipVision ?? DEFAULT_REDUX_CLIP_VISION;
    const strength   = params.reduxStrength   ?? DEFAULT_REDUX_STRENGTH;

    wf['21'] = { class_type: 'StyleModelLoader', inputs: { style_model_name: styleModel } };
    wf['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: clipVision } };
    wf['23'] = { class_type: 'LoadImage', inputs: { image: params.referenceImagePath } };
    wf['24'] = {
      class_type: 'CLIPVisionEncode',
      inputs: { clip_vision: ['22', 0], image: ['23', 0], crop: 'center' },
    };
    wf['25'] = {
      class_type: 'StyleModelApply',
      inputs: {
        conditioning:       ['3', 0],
        style_model:        ['21', 0],
        clip_vision_output: ['24', 0],
        strength,
        strength_type:      'multiply',
      },
    };
    // FluxGuidance now reads the Redux-conditioned positive instead of the raw
    // text conditioning. KSampler.positive still points at FluxGuidance (12).
    if (wf['12']) wf['12'].inputs.conditioning = ['25', 0];
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
