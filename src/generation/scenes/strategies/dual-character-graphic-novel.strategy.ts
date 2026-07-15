import { SceneStrategy, hasBakedStyleBlock } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Graphic-novel cell-shaded TWO-character scene render — first version.
 *
 * Approach: REGIONAL TEXT CONDITIONING via built-in ComfyUI nodes
 * (ConditioningSetArea + ConditioningCombine). No character LoRA (LoRA bled
 * badly), no IP-Adapter weight tuning. Identity in cartoon is text-based
 * (promptBase), so we simply confine each character's text to its own half of
 * the canvas:
 *   - node 3  = GLOBAL: style prefix + scene/setting/two-shot framing (whole canvas)
 *   - node 9  = character A text  → ConditioningSetArea LEFT  half  (node 11)
 *   - node 10 = character B text  → ConditioningSetArea RIGHT half  (node 12)
 *   - ConditioningCombine(global, A_left) then combine with B_right → KSampler
 *
 * Participant ORDER decides side: participants[0] = LEFT, participants[1] = RIGHT.
 * Write the shot's scene prompt (params.scenePrompt) to match (left woman … /
 * right woman …) so framing and identity regions agree.
 *
 * Workflow file: scene_dual_character_graphic_novel_api.json
 * (1344×768 canvas; halves are 672×768 at x=0 and x=672 — both /8-aligned).
 *
 * This is additive — single-character + photoreal pipelines are untouched.
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
  'harsh dramatic shadows, side-lit drama, ' +
  // anti-bleed: keep the two faces distinct
  'blended faces, merged faces, identical faces, same woman twice, twins, ' +
  'cloned face, conjoined figures, fused bodies';

export class DualCharacterGraphicNovelSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_dual_character_graphic_novel';
  readonly description      = 'Two characters, graphic-novel cell-shaded, regional text conditioning (no LoRA / no IP-Adapter)';
  readonly filename         = 'scene_dual_character_graphic_novel_api.json';
  readonly participantCount = 2;
  readonly visualStyle      = 'graphic_novel_cell_shaded';

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const wf = structuredClone(template);
    const parts = params.participants ?? [];
    const charA = (parts[0]?.characterPrompt ?? '').trim();
    const charB = (parts[1]?.characterPrompt ?? '').trim();

    // Global (whole canvas): style + scene/setting/two-shot framing. No identity.
    const globalPositive = [
      hasBakedStyleBlock(params.scenePrompt) ? '' : STYLE_PREFIX,
      params.scenePrompt && params.scenePrompt.trim().length > 0 ? params.scenePrompt.trim() : 'two women in one frame, medium two-shot, one on the left and one on the right',
    ].filter((s) => s && s.length > 0).join(', ');
    this.set(wf, '3', 'text', globalPositive);

    // Per-region identities (style prefix repeated so each region holds the look).
    this.set(wf, '9',  'text', [STYLE_PREFIX, charA].filter((s) => s && s.length > 0).join(', '));
    this.set(wf, '10', 'text', [STYLE_PREFIX, charB].filter((s) => s && s.length > 0).join(', '));

    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    // Keep the canvas / region split coherent: regions are hard-coded to halves
    // of 1344×768 in the JSON, so force those dimensions regardless of input.
    this.set(wf, '5', 'width',      1344);
    this.set(wf, '5', 'height',     768);
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
