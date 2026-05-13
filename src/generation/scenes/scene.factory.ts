import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { SceneStrategy } from './scene-strategy';
import { WorkflowTemplate } from '../workflows/workflow.types';
import { SingleCharacterSceneStrategy } from './strategies/single-character.strategy';
import { EnvironmentSceneStrategy } from './strategies/environment.strategy';
import { SingleWithBackCharacterSceneStrategy } from './strategies/single-with-back-character.strategy';
import { EnvironmentHiresSceneStrategy } from './strategies/environment-hires.strategy';
import { SingleCharacterHiresSceneStrategy } from './strategies/single-character-hires.strategy';
import { EnvironmentFluxSceneStrategy } from './strategies/environment-flux.strategy';
import { EnvironmentFluxHiresSceneStrategy } from './strategies/environment-flux-hires.strategy';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..', '..');

@Injectable()
export class SceneFactory {
  private readonly strategies = new Map<string, SceneStrategy>();

  constructor() {
    // Default for 0-participant (no-LoRA) shots: Flux UltraReal v4 hires →
    // photoreal 1920×1080. Picked first by pickByParticipantCount(0).
    // For 1+ participants, NON-hires single-pass picks first — the SDXL hires
    // refiner pass re-applies LoRA on FHD latent and over-bakes facial
    // features ("plastic AI skin"). Single-pass + Lanczos resample to FHD
    // gives the natural cinematic look. Hires variants stay registered for
    // explicit picking via get(id).
    this.register(new EnvironmentFluxHiresSceneStrategy());
    this.register(new EnvironmentFluxSceneStrategy());
    this.register(new SingleCharacterSceneStrategy());
    this.register(new SingleWithBackCharacterSceneStrategy());
    this.register(new EnvironmentSceneStrategy());
    this.register(new EnvironmentHiresSceneStrategy());
    this.register(new SingleCharacterHiresSceneStrategy());

    // DualCharacterRegional was a 2-LoRA regional-prompting attempt that
    // produced face-bleed and identity mixing. Replaced by SingleWithBack
    // (one LoRA + second character text-only from behind). The strategy file
    // is kept on disk in case a future LoRA-Hooks revival makes 2-LoRA viable.
  }

  /** Pick a strategy that supports the given participant count. */
  pickByParticipantCount(count: number): SceneStrategy {
    for (const s of this.strategies.values()) {
      if (s.participantCount === count) return s;
    }
    throw new NotFoundException(
      `No scene strategy registered for ${count} participant(s). ` +
      `Available counts: [${[...this.strategies.values()].map((s) => s.participantCount).join(', ')}]`,
    );
  }

  get(id: string): SceneStrategy {
    const s = this.strategies.get(id);
    if (!s) throw new NotFoundException(`Unknown scene strategy "${id}"`);
    return s;
  }

  list() {
    return [...this.strategies.values()].map(({ id, description, filename, participantCount }) => ({
      id, description, filename, participantCount,
    }));
  }

  loadTemplate(strategy: SceneStrategy, projectSlug: string): WorkflowTemplate {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', strategy.filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Scene workflow not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as WorkflowTemplate;
  }

  private register(s: SceneStrategy): void {
    this.strategies.set(s.id, s);
  }
}
