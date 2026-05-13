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

  /** Inject scene params into a deep-cloned template and return the ready prompt dict. */
  buildPrompt(template: WorkflowTemplate, params: SceneJobParams): WorkflowTemplate;
}
