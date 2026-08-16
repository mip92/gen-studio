import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';
import { QwenSceneGraphBuilder } from '../qwen/qwen-scene-graph.builder';
import {
  composeQwenInstruction,
  hasBakedRealcomicStyle,
  stripBakedRealcomicStyle,
  REALCOMIC_TRIGGER,
  REALCOMIC_T2I_STYLE,
} from '../qwen/qwen-prompt';

/**
 * Native Qwen-Image-Edit-2511 + RealComic render (visualStyle 'realcomic_qwen').
 *
 * ONE parameterized class registered 4× (participantCount 0-3) — the graph is
 * identical for every count, only the number of anchor references differs.
 * Identity: each participant's installed anchor portrait
 * (data/<slug>/reference/<profileCode>_anchor.png) is staged into ComfyUI's
 * input dir by scene-render.service and attached as image1..image3 on the
 * TextEncodeQwenImageEditPlus nodes. Style: RealComic LoRA (node 20, spliced
 * by the builder) + the trigger phrase in the instruction. The service throws
 * BEFORE buildPrompt when the Qwen model files or any participant's anchor is
 * missing — mirroring the photoreal "no trained LoRA" hard-fail, so a
 * half-ready cast never silently renders with inconsistent faces.
 *
 * Shared workflow JSON: scene_realcomic_qwen_api.json (see the builder's
 * header comment for the node-id contract).
 */

const DEFAULT_REALCOMIC_LORA = 'style\\RealComic_2509_base.safetensors';

export class QwenRealcomicSceneStrategy implements SceneStrategy {
  readonly id: string;
  readonly description: string;
  readonly filename = 'scene_realcomic_qwen_api.json';
  readonly participantCount: number;
  readonly visualStyle = 'realcomic_qwen';

  private readonly builder = new QwenSceneGraphBuilder();

  constructor(participantCount: 0 | 1 | 2 | 3) {
    this.participantCount = participantCount;
    this.id = `scene_realcomic_qwen_p${participantCount}`;
    this.description = `Qwen-Image-Edit-2511 + RealComic — ${participantCount} character anchor(s) as image reference(s)`;
  }

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    const anchors = (params.anchorImagePaths ?? []).slice(0, 3);
    // Dedup guard (same rule as hasBakedStyleBlock on the legacy strategies):
    // when the seeder already baked the realcomic style block at the head of
    // the positive, don't stack REALCOMIC_T2I_STYLE on top. The short EDIT
    // trigger sentence is exempt — it's the LoRA's trained instruction.
    const t2iStyle = hasBakedRealcomicStyle(params.scenePrompt) ? '' : REALCOMIC_T2I_STYLE;
    // With anchors attached the style is carried by the RealComic LoRA plus the
    // trigger sentence at the tail, so the seeded style block is CUT off the head
    // of the positive: repeating it in text only pushed the shot's action further
    // from the front (it sat at word ~95 of a 190-word instruction) and dragged
    // in the block's trailing negations, which rule 2 forbids. Text-only renders
    // (environment shots) keep it — there the text IS the only style carrier.
    const scenePrompt = anchors.length > 0
      ? stripBakedRealcomicStyle(params.scenePrompt ?? '')
      : (params.scenePrompt ?? '');
    const instruction = composeQwenInstruction({
      participants:   params.participants ?? [],
      scenePrompt,
      locationPrompt: params.locationPrompt,
      styleDirective: anchors.length > 0 ? REALCOMIC_TRIGGER : t2iStyle,
      withReferences: anchors.length > 0,
      objectReference:  params.objectReferenceLabel ? { label: params.objectReferenceLabel } : undefined,
      faceVisibility:   params.faceVisibility,
    });

    return this.builder.build(template, {
      instruction,
      negative:       params.negativeExtra ?? '',
      width:          params.width,
      height:         params.height,
      batchSize:      params.batchSize ?? 1,
      seed:           params.seed,
      steps:          params.steps,
      // RealComic author recommendation — 'simple' degrades this LoRA.
      scheduler:      'sgm_uniform',
      filenamePrefix: params.filenamePrefix,
      anchors,
      styleLora:      params.qwenStyleLora ?? { name: DEFAULT_REALCOMIC_LORA },
      // Identity via the VL channel only. RealComic already carries the style,
      // so the anchors are wanted for "who is this" — not for their pixels,
      // which is what dropped the studio character sheet into every frame on
      // `trucker`. Overridable per project via settings.qwenReferenceLatents.
      referenceLatents: params.qwenReferenceLatents ?? false,
    });
  }
}
