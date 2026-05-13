import { SceneStrategy } from '../scene-strategy';
import { SceneJobParams } from '../scene-job.types';
import { WorkflowTemplate } from '../../workflows/workflow.types';

const DEFAULT_NEGATIVE =
  'blurry, lowres, deformed, bad anatomy, extra fingers, watermark, text, signature, ' +
  'cartoon, anime, 3d render, second face visible, two faces, both faces visible, ' +
  'identity blend, doubled subject';

/**
 * Two-character scene where ONE LoRA is loaded (the lead participant) and the
 * second character is described in text only, framed from behind / facing
 * away so the model never tries to synthesize their face.
 *
 * Stacking two LoRAs (the previous DualCharacterRegional approach) produces
 * face-bleed and identity mixing even with regional conditioning — both LoRAs
 * stay globally attached to the model and the additive deltas leak across the
 * region boundary.
 *
 * This strategy reuses the single-character workflow (1 LoRA, 1 KSampler).
 * The second character is text-only.
 */
export class SingleWithBackCharacterSceneStrategy implements SceneStrategy {
  readonly id               = 'scene_single_with_back_character';
  readonly description      = 'Two-char scene: lead via LoRA, second character text-only from behind (no second LoRA)';
  readonly filename         = 'scene_single_character_api.json';
  readonly participantCount = 2;

  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate {
    if (params.participants.length !== 2) {
      throw new Error(`SingleWithBackCharacter requires 2 participants, got ${params.participants.length}`);
    }
    const [lead, extra] = params.participants;
    const wf = structuredClone(template);

    // LoRA — lead's only.
    this.set(wf, '2', 'lora_name',      lead.loraPath);
    this.set(wf, '2', 'strength_model', lead.loraStrength ?? 1.0);
    this.set(wf, '2', 'strength_clip',  1.0);

    // Positive: lead (trigger + name + character description), then the second
    // character text-only, locked to from-behind framing so SDXL never tries to
    // generate their face. Scene context last.
    const leadDesc = [lead.triggerToken, lead.displayName, lead.characterPrompt]
      .filter((s) => s && s.trim().length > 0).join(', ');
    const extraDesc = [
      `with ${extra.displayName} in the background`,
      'back-turned to camera, facing away, head and face not visible, viewed from behind',
      extra.characterPrompt,
    ].filter((s) => s && s.trim().length > 0).join(', ');
    const positive = [leadDesc, extraDesc, params.scenePrompt]
      .filter((s) => s && s.trim().length > 0).join(', ');
    this.set(wf, '3', 'text', positive);

    // Negative
    const negative = params.negativeExtra
      ? `${DEFAULT_NEGATIVE}, ${params.negativeExtra}`
      : DEFAULT_NEGATIVE;
    this.set(wf, '4', 'text', negative);

    // Latent dims
    this.set(wf, '5', 'width',      params.width);
    this.set(wf, '5', 'height',     params.height);
    this.set(wf, '5', 'batch_size', params.batchSize ?? 1);

    // Sampler
    this.set(wf, '6', 'seed', params.seed);
    if (params.steps !== undefined) this.set(wf, '6', 'steps', params.steps);
    if (params.cfg   !== undefined) this.set(wf, '6', 'cfg',   params.cfg);

    // Save
    this.set(wf, '8', 'filename_prefix', params.filenamePrefix);

    return wf;
  }

  private set(wf: WorkflowTemplate, nodeId: string, input: string, value: unknown): void {
    if (wf[nodeId]) wf[nodeId].inputs[input] = value;
  }
}
