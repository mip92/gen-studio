export type WorkflowTemplate = Record<
  string,
  { class_type: string; inputs: Record<string, unknown> }
>;

/** Parameters the GenerationService provides for every queued job. */
export interface WorkflowJobParams {
  positive:       string;
  negative:       string;
  seed:           number;
  filenamePrefix: string;
  /** Filename already copied into ComfyUI /input — null if no reference image. */
  loadImageFile:  string | null;
  /**
   * Newline-separated list of angle prompts injected into CR Prompt List node 152.
   * Falls back to whatever is already in the template if not provided.
   */
  anglesPrompts?:  string;
  /**
   * Newline-separated list of variety prompts injected into CR Prompt List node 385.
   * Falls back to whatever is already in the template if not provided.
   */
  varietyPrompts?: string;
  /**
   * Total images to generate. Split ~50/50 between angles (node 152) and
   * variety (node 385) passes via max_rows.
   */
  targetImages: number;
}
