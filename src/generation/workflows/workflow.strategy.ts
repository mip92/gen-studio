import { WorkflowJobParams, WorkflowTemplate } from './workflow.types';

export interface WorkflowStrategy {
  /** Unique identifier — used in project settings to pick the strategy. */
  readonly id: string;

  /** Human-readable description of what this workflow does. */
  readonly description: string;

  /**
   * Filename of the API-format workflow JSON, relative to:
   *   <appRoot>/data/<projectSlug>/comfy/
   */
  readonly filename: string;

  /**
   * Inject job parameters into a deep-cloned copy of the workflow template
   * and return the ready-to-queue prompt dict.
   */
  buildPrompt(template: WorkflowTemplate, params: WorkflowJobParams): WorkflowTemplate;
}
