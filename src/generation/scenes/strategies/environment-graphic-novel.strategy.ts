import { SceneStrategy, hasBakedStyleBlock } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Graphic-novel cell-shaded environment / B-roll scene render.
 *
 * No character, no LoRA face-lock. SDXL base + comic-style LoRA only.
 * Used for establishing shots, atmosphere shots, isolated prop close-ups.
 *
 * Workflow file: scene_environment_graphic_novel_api.json, in the shared master
 * dir data/_templates/comfy/. Edit it there — every project loads that one copy.
 */
const STYLE_PREFIX =
  'cinematic graphic novel illustration, illustrated comic book panel, ' +
  'cell-shaded coloring, hard black ink outline with variable line weight, ' +
  'flat color blocks with subtle hatching for shadow, ' +
  'warm lamp light highlights against deep blue night shadows, ' +
  '16:9 cinematic composition, no photorealism, no 3D render, no plastic skin';

const DEFAULT_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, ' +
  'hyperrealistic, real human face, raytraced, deformed hands, extra fingers, ' +
  'two heads, watermark, text overlay, blurry, low quality, anime, manga, ' +
  'chibi, kawaii, oversaturated color, glamour photography, fashion shoot, ' +
  'harsh dramatic shadows, side-lit drama';

export class EnvironmentGraphicNovelSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_environment_graphic_novel';
  readonly description      = 'Environment / B-roll, graphic-novel cell-shaded, comic style-LoRA only';
  readonly filename         = 'scene_environment_graphic_novel_api.json';
  readonly participantCount = 0;
  readonly visualStyle      = 'graphic_novel_cell_shaded';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    const positive = [
      hasBakedStyleBlock(params.scenePrompt) ? '' : STYLE_PREFIX,
      params.scenePrompt && params.scenePrompt.trim().length > 0 ? params.scenePrompt : 'cinematic graphic novel establishing shot',
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
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
