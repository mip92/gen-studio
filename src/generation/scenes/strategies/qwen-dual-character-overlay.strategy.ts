import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';
import { QwenSceneGraphBuilder } from '../qwen/qwen-scene-graph.builder';
import {
  composeQwenInstruction,
  stripBakedStyleBlock,
  KEEP_REFERENCE_STYLE,
} from '../qwen/qwen-prompt';

/**
 * Qwen dual-character OVERLAY for the legacy cartoon styles
 * ('graphic_novel_flux', 'graphic_novel_cell_shaded').
 *
 * The legacy dual strategies carry both identities as TEXT only (promptBase×2,
 * regional conditioning on SDXL) — two faces held together by prompt willpower.
 * When the Qwen-Image-Edit-2511 model files AND both participants' anchor PNGs
 * are present, scene-render.service routes the shot here instead: both anchors
 * attach as image1/image2 and Qwen composes the scene around the two real
 * faces. The project style is carried by the anchor images themselves (they
 * were rendered in-style) plus an explicit keep-style directive — NO Qwen
 * style-LoRA is injected. The shot's baked style block is stripped from the
 * instruction so the text channel doesn't fight the reference channel.
 *
 * Registered with a SYNTHETIC visualStyle ('<host>::qwen_dual_override') the
 * factory's (style, count) auto-picker can never match — reachable only via
 * SceneFactory.get(id) after the service's runtime gating. If any asset is
 * missing the service simply picks the legacy dual strategy: graceful
 * degradation, same contract as the Flux Redux single-character path.
 */
export class QwenDualCharacterOverlayStrategy implements SceneStrategy {
  readonly id: string;
  readonly description: string;
  /** Same shared Qwen graph as the realcomic_qwen strategies. */
  readonly filename = 'scene_realcomic_qwen_api.json';
  readonly participantCount = 2;
  readonly visualStyle: string;

  private readonly builder = new QwenSceneGraphBuilder();

  constructor(hostVisualStyle: 'graphic_novel_flux' | 'graphic_novel_cell_shaded') {
    this.id = `scene_dual_character_qwen_overlay__${hostVisualStyle}`;
    this.description = `Qwen-2511 dual-character overlay for ${hostVisualStyle} — both anchors as references, style carried by the anchors`;
    this.visualStyle = `${hostVisualStyle}::qwen_dual_override`;
  }

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const anchors = (params.anchorImagePaths ?? []).slice(0, 2);
    const instruction = composeQwenInstruction({
      participants:   params.participants ?? [],
      scenePrompt:    stripBakedStyleBlock(params.scenePrompt ?? ''),
      locationPrompt: params.locationPrompt,
      styleDirective: KEEP_REFERENCE_STYLE,
      withReferences: true,
    });

    return this.builder.build(template, {
      instruction,
      negative:       params.negativeExtra ?? '',
      width:          params.width,
      height:         params.height,
      batchSize:      params.batchSize ?? 1,
      seed:           params.seed,
      steps:          params.steps,
      filenamePrefix: params.filenamePrefix,
      anchors,
      // No style LoRA and template-default scheduler: the style comes from
      // the reference images, not from RealComic. For the same reason the
      // appearance channel STAYS on here — unlike the realcomic_qwen strategy,
      // these anchors are the only carrier of the project's art style, and the
      // VL channel alone (384x384 semantics) would not transfer it.
      referenceLatents: params.qwenReferenceLatents ?? true,
    });
  }
}
