import { SceneStrategy, hasBakedStyleBlock } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Flux comic-style DUAL-CHARACTER render (2 participants).
 *
 * visualStyle = 'graphic_novel_flux'. Both characters' identities are carried
 * as text (each profile.promptBase) inside one positive prompt — the same
 * text-only approach the SDXL dual graphic-novel strategy uses, minus regional
 * conditioning. Redux is single-reference only, so it is NOT applied here
 * (per-region Redux is a future enhancement); identity stays text-driven.
 *
 * Workflow: scene_dual_character_flux_comic_api.json (same node layout as the
 * single-character Flux comic graph; no Redux nodes).
 */
const STYLE_PREFIX =
  'modern cinematic graphic-novel illustration, comic book panel, ' +
  'bold confident black ink outlines with clean variable line weight, ' +
  'flat cell-shaded coloring with limited soft gradients, ' +
  'muted desaturated cinematic color palette, semi-realistic proportions, ' +
  'dramatic comic lighting, 16:9 cinematic composition, ' +
  'two characters clearly separated in frame, no photorealism, no 3D render, no plastic skin';

const DEFAULT_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, ' +
  'real human face, deformed hands, extra fingers, merged faces, watermark, ' +
  'text overlay, blurry, low quality, anime, manga, oversaturated color';

export class DualCharacterFluxComicSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_dual_character_flux_comic';
  readonly description      = 'Flux comic-style two characters — text-only identity (promptBase x2)';
  readonly filename         = 'scene_dual_character_flux_comic_api.json';
  readonly participantCount = 2;
  readonly visualStyle      = 'graphic_novel_flux';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    const participantPrompts = (params.participants ?? [])
      .map((p) => p.characterPrompt)
      .filter((s) => s && s.trim().length > 0)
      .join('; ');
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

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
