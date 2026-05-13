import { WorkflowJobParams, WorkflowTemplate } from '../workflow.types';
import { WorkflowStrategy } from '../workflow.strategy';

/**
 * AI Syndicate Dataset Creator v3
 *
 * Three-pass Flux-2-Klein generation followed by Z-Image-Turbo refinement.
 * Produces multi-view character reference images from a single reference photo.
 *
 * Workflow file: ai_syndicate_dataset_creator_v3_api.json
 *
 * Node map (what gets injected and where):
 *   set_positive        → node 333  CLIPTextEncode   .text              (1st pass body gen)
 *   set_negative        → nodes 334, 157, 374, 392, 396  CLIPTextEncode .text
 *                         (one per KSampler — all three passes share the same
 *                          per-profile negative; otherwise 2nd/3rd pass run with
 *                          empty negative)
 *   set_seed            → node 403  KSampler         .seed              (1st pass)
 *                       → node 154  KSampler         .seed              (2nd pass angles)
 *                       → node 390  KSampler         .seed              (3rd pass variety)
 *   set_filename_prefix → node 408  SaveImage        .filename_prefix   (angles pass, KS 154 → VAEDecode 170)
 *   set_load_image      → node 409  LoadImage        .image
 *   set_angles_prompts  → node 152  CR Prompt List   .prepend_text      (always)
 *                       → node 152  CR Prompt List   .multiline_text    (if provided per-profile)
 *                       → node 152  CR Prompt List   .max_rows          (ceil targetImages / 2)
 *   set_variety_prompts → node 385  CR Prompt List   .prepend_text      (always)
 *                       → node 385  CR Prompt List   .multiline_text    (if provided per-profile)
 *                       → node 385  CR Prompt List   .max_rows          (floor targetImages / 2)
 */
export class AiSyndicateV3Strategy implements WorkflowStrategy {
  readonly id          = 'ai_syndicate_dataset_creator_v3';
  readonly description = 'AI Syndicate Dataset Creator v3 — multi-pass Flux-2-Klein + Z-Image-Turbo refiner';
  readonly filename    = 'ai_syndicate_dataset_creator_v3_api.json';

  buildPrompt(template: WorkflowTemplate, params: WorkflowJobParams): WorkflowTemplate {
    const wf = structuredClone(template);

    // ── 1st pass: body generation ────────────────────────────────────────────
    this.set(wf, '333', 'text',            params.positive);
    // Negative is wired to each pass's KSampler via separate CLIPTextEncode nodes
    // (template ships them empty for 2nd/3rd pass); fill all of them so the
    // per-profile negative actually filters every pass, not just pass 1.
    for (const nid of ['334', '157', '374', '392', '396']) {
      this.set(wf, nid, 'text', params.negative);
    }
    this.set(wf, '403', 'seed',            params.seed);

    // ── 2nd pass: angles (CR Prompt List → KSampler 154) ────────────────────
    const anglesRows  = Math.ceil(params.targetImages / 2);
    const varietyRows = Math.floor(params.targetImages / 2);

    if (params.anglesPrompts) {
      this.set(wf, '152', 'prepend_text',   '');
      this.set(wf, '152', 'multiline_text', params.anglesPrompts);
    } else {
      this.set(wf, '152', 'prepend_text',   params.positive);
    }
    this.set(wf, '152', 'max_rows', anglesRows);
    this.set(wf, '154', 'seed',     params.seed);

    // ── 3rd pass: variety (CR Prompt List → KSampler 390) ───────────────────
    if (params.varietyPrompts) {
      this.set(wf, '385', 'prepend_text',   '');
      this.set(wf, '385', 'multiline_text', params.varietyPrompts);
    } else {
      this.set(wf, '385', 'prepend_text',   params.positive);
    }
    this.set(wf, '385', 'max_rows', varietyRows);
    this.set(wf, '390', 'seed',     params.seed);

    // ── Save nodes ───────────────────────────────────────────────────────────
    this.set(wf, '408', 'filename_prefix', params.filenamePrefix);   // angles

    // ── Reference image ──────────────────────────────────────────────────────
    if (params.loadImageFile !== null) {
      this.set(wf, '409', 'image', params.loadImageFile);
    }

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
