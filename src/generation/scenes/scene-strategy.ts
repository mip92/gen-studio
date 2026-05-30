import { SceneJobParams } from './scene-job.types';
import { WorkflowTemplate } from '../workflows/workflow.types';

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

  /** Inject scene params into a deep-cloned template and return the ready prompt dict. */
  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate;
}
