import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * The ONE place that knows the Qwen-Image-Edit-2511 graph shape. Fills the
 * shared template (scene_realcomic_qwen_api.json / gen_anchor_portrait_
 * realcomic_qwen_api.json) and injects the optional style-LoRA and anchor
 * LoadImage nodes — the same programmatic-injection pattern the Flux Redux
 * chain uses (single-character-flux-comic.strategy.ts, nodes 21-25).
 *
 * Node-id contract of the baked JSON (follows the codebase convention where
 * the ids overlap: 3=positive, 4=negative, 5=latent, 6=KSampler, 7=VAEDecode,
 * 8=SaveImage, 10/11=CLIP/VAE loaders):
 *    1  UNETLoader               qwen_image_edit_2511_fp8mixed
 *   13  ModelSamplingAuraFlow    shift 3.1, model ← 1
 *   14  LoraLoaderModelOnly      Lightning 4-step speed LoRA, model ← 13
 *   15  CFGNorm                  model ← 14 (or ← 20 when style LoRA injected)
 *   10  CLIPLoader               qwen_2.5_vl_7b_fp8_scaled, type qwen_image
 *   11  VAELoader                qwen_image_vae
 *    3  TextEncodeQwenImageEditPlus  positive — text field is `prompt`, NOT `text`
 *    4  TextEncodeQwenImageEditPlus  negative (inert at cfg 1.0, wired anyway)
 *    5  EmptySD3LatentImage      fresh canvas — refs enter ONLY via conditioning
 *    6  KSampler                 euler, 4 steps, cfg 1.0, denoise 1.0
 *    7  VAEDecode / 8 SaveImage
 * Injected at build time (ids reserved, never present in the JSON):
 *   20     LoraLoaderModelOnly   style LoRA (RealComic), spliced 14 → 20 → 15
 *   21-23  LoadImage             anchor refs → image1..image3 on nodes 3 AND 4
 */

export interface QwenGraphSpec {
  /** Natural-language edit instruction (see qwen-prompt.ts). */
  instruction: string;
  /** Inert at cfg 1.0 — kept wired for parity / a future cfg-fallback mode. */
  negative?: string;
  width: number;
  height: number;
  batchSize: number;
  seed: number;
  steps?: number;
  /** 'sgm_uniform' for RealComic renders (author recommendation), template
   *  default ('simple') otherwise. */
  scheduler?: string;
  filenamePrefix: string;
  /** ComfyUI-input-relative staged anchor filenames, 0-3, Picture-N order. */
  anchors: string[];
  /** Style LoRA to splice into the model chain; omit for the dual-character
   *  overlay (style is carried by the reference images there). */
  styleLora?: { name: string; strengthModel?: number };
}

export class QwenSceneGraphBuilder {
  build(template: WorkflowTemplate, spec: QwenGraphSpec): WorkflowTemplate {
    const wf = structuredClone(template);
    this.set(wf, '3', 'prompt', spec.instruction);
    this.set(wf, '4', 'prompt', spec.negative ?? '');
    this.set(wf, '5', 'width', spec.width);
    this.set(wf, '5', 'height', spec.height);
    this.set(wf, '5', 'batch_size', spec.batchSize);
    this.set(wf, '6', 'seed', spec.seed);
    if (spec.steps !== undefined) this.set(wf, '6', 'steps', spec.steps);
    if (spec.scheduler) this.set(wf, '6', 'scheduler', spec.scheduler);
    this.set(wf, '8', 'filename_prefix', spec.filenamePrefix);
    this.injectAnchors(wf, spec.anchors);
    this.injectStyleLora(wf, spec.styleLora);
    return wf;
  }

  /** Attach up to 3 anchor references. Each gets a LoadImage node wired into
   *  BOTH encode nodes — the negative branch shares the same references with
   *  an empty prompt, matching the official 2511 reference workflow. */
  private injectAnchors(wf: WorkflowTemplate, anchors: string[]): void {
    anchors.slice(0, 3).forEach((filename, i) => {
      const nodeId = String(21 + i);
      wf[nodeId] = { class_type: 'LoadImage', inputs: { image: filename } };
      for (const enc of ['3', '4']) {
        if (wf[enc]) wf[enc].inputs[`image${i + 1}`] = [nodeId, 0];
      }
    });
  }

  /** Splice the style LoRA between the Lightning LoRA (14) and CFGNorm (15).
   *  Qwen style LoRAs are model-only — the VL text encoder is untouched. */
  private injectStyleLora(wf: WorkflowTemplate, styleLora?: QwenGraphSpec['styleLora']): void {
    if (!styleLora) return;
    wf['20'] = {
      class_type: 'LoraLoaderModelOnly',
      inputs: {
        model:          ['14', 0],
        lora_name:      styleLora.name,
        strength_model: styleLora.strengthModel ?? 1.0,
      },
    };
    if (wf['15']) wf['15'].inputs.model = ['20', 0];
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
