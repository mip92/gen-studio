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
import { SingleCharacterGraphicNovelSceneStrategy } from './strategies/single-character-graphic-novel.strategy';
import { DualCharacterGraphicNovelSceneStrategy } from './strategies/dual-character-graphic-novel.strategy';
import { EnvironmentGraphicNovelSceneStrategy } from './strategies/environment-graphic-novel.strategy';
import { EnvironmentFluxComicSceneStrategy } from './strategies/environment-flux-comic.strategy';
import { SingleCharacterFluxComicSceneStrategy } from './strategies/single-character-flux-comic.strategy';
import { DualCharacterFluxComicSceneStrategy } from './strategies/dual-character-flux-comic.strategy';
import { QwenRealcomicSceneStrategy } from './strategies/qwen-realcomic-scene.strategy';
import { QwenDualCharacterOverlayStrategy } from './strategies/qwen-dual-character-overlay.strategy';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..', '..');

const DEFAULT_VISUAL_STYLE = 'photoreal_cinematic';

@Injectable()
export class SceneFactory {
  private readonly strategies = new Map<string, SceneStrategy>();

  constructor() {
    // ── PHOTOREAL strategies (visualStyle undefined / 'photoreal_cinematic') ──
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

    // ── GRAPHIC NOVEL CELL-SHADED strategies ──────────────────────────────────
    // For projects with Project.visualStyle = 'graphic_novel_cell_shaded'
    // (e.g. bio_plus). Picked by pickByStyleAndParticipantCount(style, count).
    // NO LoRA face-lock — IP-Adapter at 0.4 weight + comic-style LoRA only.
    this.register(new SingleCharacterGraphicNovelSceneStrategy());
    this.register(new DualCharacterGraphicNovelSceneStrategy());
    this.register(new EnvironmentGraphicNovelSceneStrategy());

    // ── GRAPHIC NOVEL FLUX strategies ─────────────────────────────────────────
    // For projects with Project.visualStyle = 'graphic_novel_flux'. Same comic
    // look as graphic_novel_cell_shaded but on a Flux base + Flux comic style-
    // LoRA (node "2", overridable via settings.styleLora), cfg=1.0 + FluxGuidance.
    // Identity: text-only (promptBase) with OPTIONAL Flux Redux anchor on the
    // single-character strategy when the anchor PNG + Redux models are present.
    this.register(new EnvironmentFluxComicSceneStrategy());
    this.register(new SingleCharacterFluxComicSceneStrategy());
    this.register(new DualCharacterFluxComicSceneStrategy());

    // ── REALCOMIC QWEN strategies (Qwen-Image-Edit-2511 + RealComic LoRA) ────
    // For projects with Project.visualStyle = 'realcomic_qwen'. One class, four
    // participant counts — identity is 0-3 anchor portraits attached as VL
    // image references (image1..image3), style is the RealComic LoRA + trigger.
    for (const n of [0, 1, 2, 3] as const) {
      this.register(new QwenRealcomicSceneStrategy(n));
    }

    // ── QWEN DUAL-CHARACTER OVERLAY for the legacy cartoon styles ────────────
    // Synthetic visualStyle ids ('<host>::qwen_dual_override') are never
    // matched by pickByStyleAndParticipantCount — scene-render.service fetches
    // these via get(id) only when the Qwen models AND both participants'
    // anchors are on disk; otherwise the legacy text-only dual strategies
    // above keep handling the shot unchanged.
    this.register(new QwenDualCharacterOverlayStrategy('graphic_novel_flux'));
    this.register(new QwenDualCharacterOverlayStrategy('graphic_novel_cell_shaded'));

    // PHOTOREAL DualCharacterRegional was a 2-LoRA regional-prompting attempt
    // that produced face-bleed and identity mixing. Replaced by SingleWithBack
    // (one LoRA + second character text-only from behind). The strategy file
    // is kept on disk in case a future LoRA-Hooks revival makes 2-LoRA viable.
    //
    // The CARTOON DualCharacterGraphicNovel (registered above) is a DIFFERENT
    // mechanism: regional TEXT conditioning (ConditioningSetArea), no character
    // LoRA at all — so it does not have the 2-LoRA bleed problem. First version,
    // under test.
  }

  /**
   * Legacy picker (photoreal only). Picks first strategy matching count.
   * Kept for backwards compatibility with callers that haven't been updated
   * to pass visualStyle yet.
   *
   * @deprecated Use pickByStyleAndParticipantCount(style, count) instead.
   */
  pickByParticipantCount(count: number): SceneStrategy {
    return this.pickByStyleAndParticipantCount(DEFAULT_VISUAL_STYLE, count);
  }

  /**
   * Style-aware picker. Picks the first strategy whose visualStyle matches
   * AND participantCount matches. If visualStyle is undefined or empty,
   * falls back to 'photoreal_cinematic'. If no exact style match found,
   * falls back to photoreal (so projects added before this method existed
   * keep working).
   */
  pickByStyleAndParticipantCount(visualStyle: string | null | undefined, count: number): SceneStrategy {
    const style = (visualStyle && visualStyle.trim().length > 0) ? visualStyle : DEFAULT_VISUAL_STYLE;

    // First pass: exact style + count match
    for (const s of this.strategies.values()) {
      if (s.participantCount === count && (s.visualStyle ?? DEFAULT_VISUAL_STYLE) === style) {
        return s;
      }
    }

    // Fallback: any strategy with no explicit visualStyle (treated as photoreal default)
    if (style !== DEFAULT_VISUAL_STYLE) {
      for (const s of this.strategies.values()) {
        if (s.participantCount === count && s.visualStyle === undefined) {
          return s;
        }
      }
    }

    throw new NotFoundException(
      `No scene strategy registered for style="${style}" with ${count} participant(s). ` +
      `Available: ${[...this.strategies.values()].map((s) => `${s.id}(style=${s.visualStyle ?? 'photoreal_cinematic'}, p=${s.participantCount})`).join('; ')}`,
    );
  }

  get(id: string): SceneStrategy {
    const s = this.strategies.get(id);
    if (!s) throw new NotFoundException(`Unknown scene strategy "${id}"`);
    return s;
  }

  list() {
    return [...this.strategies.values()].map(({ id, description, filename, participantCount, visualStyle }) => ({
      id, description, filename, participantCount, visualStyle: visualStyle ?? DEFAULT_VISUAL_STYLE,
    }));
  }

  loadTemplate(strategy: SceneStrategy, projectSlug: string): WorkflowTemplate {
    // Per-project workflow JSON wins; fall back to the shared master template
    // in data/_templates/comfy/ when a project hasn't copied it in yet. This is
    // how a NEW project (e.g. a graphic_novel_flux one) renders out of the box —
    // its comfy/ dir need not be pre-populated for every strategy.
    const perProject = path.join(APP_ROOT, 'data', projectSlug, 'comfy', strategy.filename);
    const shared     = path.join(APP_ROOT, 'data', '_templates', 'comfy', strategy.filename);
    const filePath   = existsSync(perProject) ? perProject : shared;
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Scene workflow not found: ${perProject} (and no shared template at ${shared})`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as WorkflowTemplate;
  }

  private register(s: SceneStrategy): void {
    this.strategies.set(s.id, s);
  }
}
