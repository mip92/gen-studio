import { SceneJobParams } from './scene-job.types';
import { WorkflowTemplate } from '../workflows/workflow.types';

/**
 * True when the shot's positive prompt already opens with its own baked-in
 * style block (every seed engine since gaz writes the full project style as
 * the head of `promptFields.positive`). In that case the strategy must NOT
 * prepend its generic STYLE_PREFIX: the duplication pushed ~60 extra tokens
 * of boilerplate in front of the subject, shoving the subject out of the
 * first CLIP chunk — environment shots rendered generic style filler
 * (night-lamp still lifes, stray people) and ignored the actual subject.
 */
export function hasBakedStyleBlock(scenePrompt: string | undefined): boolean {
  return /\bgraphic[- ]novel illustration\b|\bcomic book panel\b/i.test((scenePrompt ?? '').slice(0, 200));
}

export interface SceneStrategy {
  /** Unique id used by the factory to pick a strategy by participant count. */
  readonly id: string;

  /** Human-readable description. */
  readonly description: string;

  /** API-format workflow JSON filename, relative to <appRoot>/data/<projectSlug>/comfy/. */
  readonly filename: string;

  /** Number of participants this strategy supports (e.g. 1 or 2). */
  readonly participantCount: number;

  /**
   * Visual style this strategy renders. Default 'photoreal_cinematic' for the
   * existing strategies (single-character, environment, environment-flux, etc.).
   * Cartoon/graphic-novel strategies declare 'graphic_novel_cell_shaded'.
   * Factory uses this to pick the right strategy per project.visualStyle.
   *
   * Matches the row id in the visual_styles registry table introduced by
   * migration 20260528_add_visual_style.sql.
   */
  readonly visualStyle?: string;

  /**
   * Comic panel shapes this strategy can render correctly (keys of
   * comic_page_shapes.json). Undefined = no restriction (the graph is fully
   * parameterized by width/height). Declare an explicit list only when the
   * graph has geometric assumptions a foreign aspect would break — e.g. the
   * dual-character regional split is hard-tied to a landscape canvas.
   * Enforced by scene-render.service and by the comic-plan readiness gate.
   */
  readonly supportedShapes?: string[];

  /** Inject scene params into a deep-cloned template and return the ready prompt dict. */
  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate;
}
