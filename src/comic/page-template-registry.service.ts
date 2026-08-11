import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Comic panel shapes + page templates registry (template-layout mode).
 *
 * Reads the SAME two JSON files that python reads (scripts/comic_page_shapes.json,
 * scripts/comic_page_templates.json) — one physical copy of the data, no mirrors
 * (the desk-props SLOTS/ITEMS hand-mirrored-in-UI pattern is deliberately NOT
 * repeated here; the UI fetches these endpoints instead).
 *
 * The `landscape` shape row equals the legacy hardcoded sizes on every stage,
 * which is what makes "no panel assignment" resolve to today's behaviour —
 * see resolveShotRenderSize() in render-size.ts and its contract test.
 */

export type PanelShapeKey = string; // 'wide' | 'landscape' | 'square' | 'tall'
export type ModelFamily = 'sdxl' | 'flux' | 'qwen';

export interface PanelShape {
  aspect: number;
  gen: Record<ModelFamily, [number, number]>;
  wan: [number, number];
  smooth: [number, number];
  still: [number, number];
}

export interface TemplateSlot {
  slot: number;
  /** Explicit camera reading order — the camera visits slots by this field. */
  order: number;
  shape: PanelShapeKey;
  /** Page-normalized rect (0..1 of ONE page, the portrait half of a spread). */
  rect: { x: number; y: number; w: number; h: number };
  /** Optional per-slot camera zoom fraction override (comic_manifest). */
  panelFrac?: number;
}

export interface PageTemplate {
  id: string;
  name: string;
  slots: TemplateSlot[];
}

const SCRIPTS_DIR = join(process.cwd(), 'scripts');
const SHAPES_PATH = join(SCRIPTS_DIR, 'comic_page_shapes.json');
const TEMPLATES_PATH = join(SCRIPTS_DIR, 'comic_page_templates.json');

interface CacheEntry<T> {
  mtimeMs: number;
  value: T;
}

@Injectable()
export class PageTemplateRegistryService {
  private readonly logger = new Logger(PageTemplateRegistryService.name);
  private shapesCache?: CacheEntry<Record<string, PanelShape>>;
  private templatesCache?: CacheEntry<PageTemplate[]>;

  getShapes(): Record<string, PanelShape> {
    this.shapesCache = this.readCached(SHAPES_PATH, this.shapesCache, (raw) => {
      const shapes = (raw as { shapes?: Record<string, PanelShape> }).shapes;
      if (!shapes || typeof shapes !== 'object' || !shapes['landscape']) {
        throw new Error('comic_page_shapes.json: missing shapes.landscape');
      }
      for (const [key, sh] of Object.entries(shapes)) this.checkShape(key, sh);
      return shapes;
    });
    return this.shapesCache.value;
  }

  getShape(key: string | null | undefined): PanelShape {
    const shapes = this.getShapes();
    const shape = shapes[key ?? 'landscape'];
    if (!shape) {
      throw new Error(`unknown panel shape "${key}" (comic_page_shapes.json)`);
    }
    return shape;
  }

  getTemplates(): PageTemplate[] {
    this.templatesCache = this.readCached(TEMPLATES_PATH, this.templatesCache, (raw) => {
      const templates = (raw as { templates?: PageTemplate[] }).templates;
      if (!Array.isArray(templates) || templates.length === 0) {
        throw new Error('comic_page_templates.json: missing templates[]');
      }
      const shapes = this.getShapes();
      for (const t of templates) this.checkTemplate(t, shapes);
      return templates;
    });
    return this.templatesCache.value;
  }

  getTemplate(id: string): PageTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }

  /** Shape of a given slot in a given template, or undefined if either is unknown. */
  getSlotShape(templateId: string, slot: number): PanelShapeKey | undefined {
    return this.getTemplate(templateId)?.slots.find((s) => s.slot === slot)?.shape;
  }

  // ── internals ──────────────────────────────────────────────────────────────

  /** Re-parse only when the file's mtime changes (registry edits are rare, reads are hot). */
  private readCached<T>(
    path: string,
    cache: CacheEntry<T> | undefined,
    parse: (raw: unknown) => T,
  ): CacheEntry<T> {
    if (!existsSync(path)) {
      throw new Error(`registry file missing: ${path}`);
    }
    const mtimeMs = statSync(path).mtimeMs;
    if (cache && cache.mtimeMs === mtimeMs) return cache;
    const value = parse(JSON.parse(readFileSync(path, 'utf-8')));
    this.logger.log(`loaded ${path}`);
    return { mtimeMs, value };
  }

  private checkShape(key: string, sh: PanelShape): void {
    const pair = (v: unknown): v is [number, number] =>
      Array.isArray(v) && v.length === 2 && v.every((x) => Number.isInteger(x) && x > 0 && x % 2 === 0);
    if (!(sh.aspect > 0)) throw new Error(`shape ${key}: bad aspect`);
    for (const fam of ['sdxl', 'flux', 'qwen'] as const) {
      if (!pair(sh.gen?.[fam])) throw new Error(`shape ${key}: gen.${fam} must be a pair of even ints`);
    }
    for (const stage of ['wan', 'smooth', 'still'] as const) {
      if (!pair(sh[stage])) throw new Error(`shape ${key}: ${stage} must be a pair of even ints`);
    }
    if (sh.wan[0] % 16 || sh.wan[1] % 16) {
      throw new Error(`shape ${key}: wan ${sh.wan} must be multiples of 16`);
    }
  }

  private checkTemplate(t: PageTemplate, shapes: Record<string, PanelShape>): void {
    if (!t.id || !Array.isArray(t.slots) || t.slots.length < 2 || t.slots.length > 7) {
      throw new Error(`template ${t?.id ?? '<no id>'}: 2..7 slots required`);
    }
    const orders = [...t.slots].map((s) => s.order).sort((a, b) => a - b);
    if (!orders.every((o, i) => o === i)) {
      throw new Error(`template ${t.id}: order fields are not a dense 0..N-1 permutation`);
    }
    for (const s of t.slots) {
      if (!shapes[s.shape]) throw new Error(`template ${t.id} slot ${s.slot}: unknown shape "${s.shape}"`);
      const r = s.rect;
      if (!(r && r.w > 0 && r.h > 0 && r.x >= -1e-6 && r.y >= -1e-6 && r.x + r.w <= 1.000001 && r.y + r.h <= 1.000001)) {
        throw new Error(`template ${t.id} slot ${s.slot}: rect out of page bounds`);
      }
    }
  }
}
