import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { WorkflowStrategy } from './workflow.strategy';
import { WorkflowTemplate } from './workflow.types';
import { AiSyndicateV3Strategy } from './strategies/ai-syndicate-v3.strategy';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..', '..');

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
   * Loads the workflow template JSON from disk for the given strategy and project slug.
   * Path: <appRoot>/data/<projectSlug>/comfy/<strategy.filename>
   */
  loadTemplate(strategy: WorkflowStrategy, projectSlug: string): WorkflowTemplate {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', strategy.filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Workflow file not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as WorkflowTemplate;
  }

  private register(strategy: WorkflowStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }
}
