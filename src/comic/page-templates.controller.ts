import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { PageTemplateRegistryService } from './page-template-registry.service';
import { ComicPlanService } from './comic-plan.service';

// Pre-rendered gallery PNGs (a spread with the template on BOTH pages, colored
// placeholder panels numbered in camera reading order). Files are named
// `NN_<templateId>.png`; regenerate with the preview script when templates
// change (see data/comic_template_previews/README or the registry docstring).
const PREVIEWS_DIR = join(process.cwd(), 'data', 'comic_template_previews');

/**
 * Read-only registry endpoints. The UI renders shape badges and template
 * previews from these — it deliberately has NO mirrored copy of the data
 * (unlike the desk-props DESK_SLOTS/DESK_ITEMS hand-mirror).
 */
@Controller('comic')
export class PageTemplatesController {
  constructor(
    private readonly registry: PageTemplateRegistryService,
    private readonly plan: ComicPlanService,
  ) {}

  @Get('page-shapes')
  shapes() {
    return this.registry.getShapes();
  }

  @Get('page-templates')
  templates() {
    return this.registry.getTemplates();
  }

  /** Plan integrity readiness for a project (by id). Legacy projects: {templateMode:false, ready:true}. */
  @Get('plan-readiness/:projectId')
  planReadiness(@Param('projectId') projectId: string) {
    return this.plan.check(projectId);
  }

  /** Page-by-page layout plan (the «Вёрстка» tab). Legacy projects: virtual one-frame pages. */
  @Get('plan/:projectId')
  getPlan(@Param('projectId') projectId: string) {
    return this.plan.plan(projectId);
  }

  /** Append a plan page. The first page switches the project into template mode. */
  @Post('plan/:projectId/pages')
  addPage(@Param('projectId') projectId: string, @Body() body: { templateId?: string }) {
    return this.plan.addPage(projectId, String(body?.templateId ?? ''));
  }

  /** Delete a plan page (unassigns its shots, closes the pageIndex gap). */
  @Delete('plan/:projectId/pages/:pageId')
  deletePage(@Param('projectId') projectId: string, @Param('pageId') pageId: string) {
    return this.plan.deletePage(projectId, pageId);
  }

  /** Stream the gallery preview PNG of one template (books-with-numbered-panels look). */
  @Get('page-templates/:id/preview')
  preview(@Param('id') id: string, @Res() res: Response) {
    // resolve `NN_<id>.png` without trusting the client with a path
    if (!this.registry.getTemplate(id)) {
      throw new NotFoundException(`unknown template "${id}"`);
    }
    if (!existsSync(PREVIEWS_DIR)) {
      throw new NotFoundException(`previews dir missing: ${PREVIEWS_DIR}`);
    }
    const file = readdirSync(PREVIEWS_DIR).find((f) => f.endsWith(`_${id}.png`));
    if (!file) throw new NotFoundException(`no preview for "${id}" — regenerate the gallery PNGs`);
    const p = join(PREVIEWS_DIR, file);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', statSync(p).size);
    res.setHeader('Cache-Control', 'private, max-age=300');
    createReadStream(p).pipe(res);
  }
}
