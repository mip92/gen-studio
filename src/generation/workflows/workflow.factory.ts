import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowStrategy } from './workflow.strategy';
import { WorkflowTemplate } from './workflow.types';
import { AiSyndicateV3Strategy } from './strategies/ai-syndicate-v3.strategy';
import { describeWorkflowLookup, readWorkflowJson } from '../../comfy/workflow-path';

@Injectable()
export class WorkflowFactory {
  private readonly strategies = new Map<string, WorkflowStrategy>();

  constructor() {
    this.register(new AiSyndicateV3Strategy());
    // Register new workflow strategies here as the project grows:
    // this.register(new InstantIdPortraitStrategy());
    // this.register(new FireRedCharacterSheetStrategy());
  }

  /** Returns the strategy for the given id, or throws if unknown. */
  get(id: string): WorkflowStrategy {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      const known = [...this.strategies.keys()].join(', ');
      throw new NotFoundException(`Unknown workflow strategy "${id}". Known: ${known}`);
    }
    return strategy;
  }

  /** Returns the default strategy (first registered). */
  getDefault(): WorkflowStrategy {
    return this.strategies.values().next().value as WorkflowStrategy;
  }

  /** Lists all registered strategies. */
  list(): Array<{ id: string; description: string; filename: string }> {
    return [...this.strategies.values()].map(({ id, description, filename }) => ({
      id,
      description,
      filename,
    }));
  }

  /**
   * Loads the workflow template JSON for the given strategy and project slug.
   * Per-project copy wins, then the shared master in data/_templates/comfy/.
   */
  loadTemplate(strategy: WorkflowStrategy, projectSlug: string): WorkflowTemplate {
    const template = readWorkflowJson<WorkflowTemplate>(projectSlug, strategy.filename);
    if (!template) {
      throw new NotFoundException(
        `Workflow file not found: ${describeWorkflowLookup(projectSlug, strategy.filename)}`,
      );
    }
    return template;
  }

  private register(strategy: WorkflowStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }
}
