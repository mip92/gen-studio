/**
 * Backward-compatibility contract check (no test runner in this repo — run via:
 *     npx tsx src/comic/render-size.contract.ts
 * ). Asserts that a shot WITHOUT a panel assignment (shape=null) resolves, on
 * every pipeline stage, to exactly the sizes that used to be hardcoded before
 * template-layout mode existed. If this script fails, legacy projects would
 * render at different sizes — do not ship.
 */
import { PageTemplateRegistryService } from './page-template-registry.service';
import { resolveShotRenderSize, RenderStage } from './render-size';
import { ModelFamily } from './page-template-registry.service';

const registry = new PageTemplateRegistryService();

const LEGACY: Array<[RenderStage, ModelFamily, number, number, string]> = [
  // scene-render.service.ts input.width ?? 1344 / input.height ?? 768
  ['image_base', 'sdxl', 1344, 768, 'scene-render default (SDXL bucket)'],
  ['image_base', 'qwen', 1344, 768, 'scene-render default (Qwen)'],
  // environment-flux-hires base
  ['image_base', 'flux', 1280, 720, 'flux base'],
  // video-render.service.ts DEFAULT_WIDTH/HEIGHT
  ['wan_i2v', 'sdxl', 768, 432, 'Wan 2.2 default'],
  // video_upscale_interp_api.json node 5
  ['smooth_video', 'sdxl', 1920, 1080, 'upscale+RIFE target'],
  // upscale_to_fhd.py TARGET_W/H
  ['still_final', 'sdxl', 1920, 1080, 'still upscale target'],
];

let failed = 0;
for (const [stage, family, w, h, what] of LEGACY) {
  for (const shape of [null, 'landscape'] as const) {
    const got = resolveShotRenderSize(shape, stage, family, registry);
    if (got.width !== w || got.height !== h) {
      console.error(
        `FAIL: shape=${shape} stage=${stage} family=${family} -> ${got.width}x${got.height}, ` +
          `expected ${w}x${h} (${what})`,
      );
      failed++;
    }
  }
}

// sanity: every declared shape resolves on every stage without throwing
const shapes = registry.getShapes();
const stages: RenderStage[] = ['image_base', 'wan_i2v', 'smooth_video', 'still_final'];
for (const key of Object.keys(shapes)) {
  for (const stage of stages) {
    for (const family of ['sdxl', 'flux', 'qwen'] as ModelFamily[]) {
      resolveShotRenderSize(key, stage, family, registry);
    }
  }
}
// templates load + validate
const templates = registry.getTemplates();

if (failed) {
  console.error(`render-size contract: ${failed} FAILURES`);
  process.exit(1);
}
console.log(
  `render-size contract: OK (${Object.keys(shapes).length} shapes, ${templates.length} templates, legacy sizes intact)`,
);
