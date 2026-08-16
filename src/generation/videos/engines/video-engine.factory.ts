import { Injectable, Logger } from '@nestjs/common';
import { VideoEngine, VideoEngineId } from './video-engine';
import { WanVideoEngine } from './wan.engine';
import { LtxVideoEngine } from './ltx.engine';

/**
 * The one place that maps `Project.videoEngine` onto an implementation.
 *
 * Mirrors `SceneFactory` on the stills side. An unknown or empty id resolves to
 * Wan rather than throwing: every project that predates the column has no value,
 * and a film mid-production must keep rendering.
 */
@Injectable()
export class VideoEngineFactory {
  private readonly logger = new Logger(VideoEngineFactory.name);
  private readonly engines = new Map<VideoEngineId, VideoEngine>();

  constructor() {
    this.register(new WanVideoEngine());
    this.register(new LtxVideoEngine());
  }

  private register(engine: VideoEngine): void {
    this.engines.set(engine.id, engine);
  }

  /** Every engine that can actually be selected, for the settings dropdown. */
  list(): Array<{ id: VideoEngineId; displayName: string }> {
    return [...this.engines.values()].map((e) => ({ id: e.id, displayName: e.displayName }));
  }

  get(id?: string | null): VideoEngine {
    const engine = this.engines.get((id ?? '') as VideoEngineId);
    if (engine) return engine;
    if (id) {
      this.logger.warn(`unknown videoEngine "${id}" — falling back to wan`);
    }
    return this.engines.get('wan')!;
  }

  /**
   * Which engine produced a render, from the workflow filename baked onto its
   * row. Used by the dispatcher so an already-queued clip is patched by the
   * engine it was queued for, even if the project has since been switched.
   */
  forWorkflow(filename?: string | null): VideoEngine {
    if (filename) {
      for (const engine of this.engines.values()) {
        if (engine.ownsWorkflow(filename)) return engine;
      }
    }
    return this.engines.get('wan')!;
  }
}
