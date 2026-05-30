import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Graphic-novel cell-shaded single-character scene render.
 *
 * Identity-stack for cartoon projects: IP-Adapter at low weight (0.4-0.5) on
 * a single anchor reference image + comic-style LoRA on SDXL base. NO character
 * LoRA training (cartoon project loraPipeline='none' per visual_styles registry).
 *
 * Workflow file: scene_single_character_graphic_novel_api.json (TO BE CREATED
 * under data/<project_slug>/comfy/ — copy from
 * scene_single_character_ipadapter_api.json + swap LoRA loader to comic-style
 * LoRA and lower IP-Adapter weight).
 *
 * Style block is prepended automatically by scene-render.service via the
 * visual_styles.styleBlock column.
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

export class SingleCharacterGraphicNovelSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_single_character_graphic_novel';
  readonly description      = 'Single character, graphic-novel cell-shaded, IP-Adapter @ 0.4 + comic style-LoRA';
  readonly filename         = 'scene_single_character_graphic_novel_api.json';
  readonly participantCount = 1;
  readonly visualStyle      = 'graphic_novel_cell_shaded';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    // Positive prompt = global style prefix + participant identity (text-anchor) + scene-specific
    // (Identity is text-only — face-lock comes from IP-Adapter reference image; see APP_ROOT/data/<slug>/reference/<character>_anchor.png attached as input to the IP-Adapter node in the workflow JSON.)
    const participantPrompts = (params.participants ?? []).map((p) => p.characterPrompt).join(', ');
    const positive = [
      STYLE_PREFIX,
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
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
