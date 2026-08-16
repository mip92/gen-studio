import { WorkflowTemplate } from '../../workflows/workflow.types';

/**
 * Which model family renders a project's clips.
 *
 * Chosen per PROJECT, like `visualStyle` for stills: one film is shot on one
 * engine, so a single montage never mixes two grains. There is deliberately no
 * per-shot override — that was considered and rejected (user 2026-08-16).
 */
export type VideoEngineId = 'wan' | 'ltx';

/** One pinned frame, or first AND last pinned. */
export type VideoFlow = 'i2v' | 'flf2v';

/**
 * Everything a graph needs to become a dispatchable prompt. Filenames are
 * basenames already staged into COMFY_INPUT — the engine never touches disk.
 */
export interface VideoRenderRequest {
  sourceImage: string;
  /** Basename to pin to the LAST frame. Absent = one-frame flow. */
  endImage?: string;
  motionPrompt: string;
  /** Only set when the caller has one; otherwise the template's own text stays. */
  motionNegative?: string;
  seed: number;
  width: number;
  height: number;
  length: number;
  fps: number;
  filenamePrefix: string;
}

/**
 * A video model family, behind one seam.
 *
 * This mirrors `SceneStrategy` on the stills side: the render service owns the
 * lifecycle (rows, queue entries, staging files, polling) and the engine owns
 * everything model-specific — which workflow file, which node ids, what the
 * native frame size is, how a camera move is phrased for that model's prompt
 * dialect.
 *
 * The seam exists because the graphs are not comparable. Wan's i2v is 18 nodes
 * and one conditioning node that takes both frames; LTX-2.5 is 39 nodes with two
 * `LTXVAddGuide` passes, a separate audio latent branch and a custom sampler.
 * Teaching one `patch()` both shapes would produce a method that is wrong for
 * each in a different way.
 */
export interface VideoEngine {
  readonly id: VideoEngineId;
  /** Shown in the project settings dropdown. */
  readonly displayName: string;

  /**
   * Native render parameters, used when the shot carries no comic panel shape.
   * They differ per engine — this is not a shared constant.
   */
  readonly defaults: { width: number; height: number; length: number; fps: number };

  /** Whether this engine can pin a last frame at all. */
  supportsFlow(flow: VideoFlow): boolean;

  /**
   * Workflow file for a quality mode and a conditioning flow. The engine owns
   * its own allowlist: an unknown mode resolves to the engine's default rather
   * than throwing, so a row carrying a stale mode still renders.
   *
   * `flow` is the EFFECTIVE one — after any degrade to a single frame — because
   * for some engines it selects the file. Wan ignores it (it swaps a node inside
   * whichever file the mode picked); LTX needs it, because its one-frame and
   * two-frame graphs are not the same graph.
   */
  workflowFor(mode?: string | null, flow?: VideoFlow): string;

  /** True when the filename is one this engine knows how to patch. */
  ownsWorkflow(filename: string): boolean;

  /**
   * The camera sentence appended to the motion prompt, in this model's dialect.
   * `move` may be a compound `a+b`. Returns undefined when the engine has
   * nothing to say about that move, and the prompt is left alone.
   */
  cameraClause(move: string): string | undefined;

  /** Fill the template. Must not mutate the argument. */
  patch(template: WorkflowTemplate, req: VideoRenderRequest): WorkflowTemplate;
}
