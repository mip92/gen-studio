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
  /**
   * Whether the encode nodes keep their `vae` input — i.e. whether each
   * reference is ALSO appended to the conditioning as a `reference_latents`
   * entry. This is the single biggest lever on how "pasted" the output looks.
   *
   * TextEncodeQwenImageEditPlus runs every attached image through two channels
   * (comfy_extras/nodes_qwen.py): the VL encoder at 384x384 — semantics, "who
   * is this person, what are they wearing" — and, only if `vae` is wired, the
   * VAE at 1024x1024 appended via conditioning_set_values('reference_latents').
   * The latter is APPEARANCE, near-pixel: it is what makes the model reproduce
   * the anchor's waist-up framing, frontal pose and grey backdrop inside what
   * was meant to be a night exterior. Our anchors are deliberately studio
   * character sheets ("clean character reference sheet look", anchor-render.
   * service.ts) — the worst possible donor for a pixel channel, and community
   * guidance is explicit that donors should match the target's viewpoint and
   * light.
   *
   * false → identity travels through the VL channel only: the face is held by
   * semantics + promptBase text, the composition is free. Use it when the
   * STYLE has another carrier (the RealComic LoRA on realcomic_qwen).
   * true  → keep the pixel channel. Required when the references are the only
   * thing carrying the project's art style (the dual-character overlay on the
   * legacy cartoon styles has no Qwen style LoRA at all).
   *
   * Default true = the graph exactly as the JSON ships it.
   */
  referenceLatents?: boolean;
  /** Style LoRA to splice into the model chain; omit for the dual-character
   *  overlay (style is carried by the reference images there). */
  styleLora?: { name: string; strengthModel?: number };
  /** Classifier-free guidance. Template default is 1.0, which is what the
   *  Lightning LoRA requires — and at 1.0 the negative branch is INERT. Raise
   *  it only together with `lightning: false`. */
  cfg?: number;
  /**
   * Keep the Lightning 4-step speed LoRA (node 14) in the model chain.
   *
   * true (default) — what every scene render wants: 4 steps at cfg 1.0, the
   * only way 346 shots per film are affordable.
   * false — drop it and run real steps at real cfg. Costs minutes per image,
   * so it is reserved for one-off hero images (the YouTube thumbnail), where
   * quality is scrutinised up close AND the live negative prompt matters —
   * at cfg 1.0 a negative like "no text, no letters" does literally nothing.
   */
  lightning?: boolean;
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
    if (spec.cfg !== undefined) this.set(wf, '6', 'cfg', spec.cfg);
    if (spec.scheduler) this.set(wf, '6', 'scheduler', spec.scheduler);
    this.set(wf, '8', 'filename_prefix', spec.filenamePrefix);
    this.injectAnchors(wf, spec.anchors);
    this.injectStyleLora(wf, spec.styleLora);
    this.applyLightning(wf, spec.lightning ?? true);
    this.applyReferenceLatents(wf, spec.referenceLatents ?? true);
    return wf;
  }

  /** Remove the Lightning speed LoRA (node 14) from the model chain.
   *
   *  Runs AFTER injectStyleLora, so whatever now consumes node 14 — CFGNorm
   *  (15) on its own, or the style LoRA (20) spliced in front of it — is
   *  repointed at ModelSamplingAuraFlow (13), node 14's own upstream. Found by
   *  scanning inputs rather than by hardcoding the consumer, so the two splice
   *  orders cannot drift apart. */
  private applyLightning(wf: WorkflowTemplate, enabled: boolean): void {
    if (enabled) return;
    for (const node of Object.values(wf as Record<string, any>)) {
      for (const [key, value] of Object.entries(node?.inputs ?? {})) {
        if (Array.isArray(value) && value[0] === '14') node.inputs[key] = ['13', value[1]];
      }
    }
    delete (wf as Record<string, any>)['14'];
  }

  /** Drop the `vae` input from both encode nodes when the appearance channel is
   *  not wanted (see QwenGraphSpec.referenceLatents). The node's `vae` is
   *  OPTIONAL, so omitting the key is a valid graph — with no vae it simply
   *  never builds `ref_latents` and the references act as semantics only.
   *  Node 7 (VAEDecode) keeps its own vae wire; only nodes 3/4 are touched. */
  private applyReferenceLatents(wf: WorkflowTemplate, enabled: boolean): void {
    if (enabled) return;
    for (const enc of ['3', '4']) {
      if (wf[enc]?.inputs) delete wf[enc].inputs.vae;
    }
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
