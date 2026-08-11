import { ModelFamily, PageTemplateRegistryService } from './page-template-registry.service';

/**
 * The single place a shot's pixel size is decided, for every pipeline stage.
 *
 * BACKWARD-COMPATIBILITY CONTRACT: a shot without a panel assignment
 * (comicPanelShape = null) resolves to the 'landscape' row of
 * comic_page_shapes.json, whose numbers equal the legacy hardcodes:
 *   image_base  sdxl/qwen 1344x768, flux 1280x720   (scene-render defaults)
 *   wan_i2v     768x432                              (video-render defaults)
 *   smooth_video / still_final 1920x1080             (upscale targets)
 * That equality is enforced by render-size.contract.spec.ts — legacy projects
 * keep rendering bit-identical sizes through this function.
 */
export type RenderStage = 'image_base' | 'wan_i2v' | 'smooth_video' | 'still_final';

export interface RenderSize {
  width: number;
  height: number;
}

export function resolveShotRenderSize(
  shotShape: string | null | undefined,
  stage: RenderStage,
  family: ModelFamily,
  registry: PageTemplateRegistryService,
): RenderSize {
  const shape = registry.getShape(shotShape ?? 'landscape');
  const pick = (wh: [number, number]): RenderSize => ({ width: wh[0], height: wh[1] });
  switch (stage) {
    case 'image_base':
      return pick(shape.gen[family]);
    case 'wan_i2v':
      return pick(shape.wan);
    case 'smooth_video':
      return pick(shape.smooth);
    case 'still_final':
      return pick(shape.still);
  }
}
