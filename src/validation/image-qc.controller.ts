import { Controller, Get, Param, Post } from '@nestjs/common';
import { ImageQcService } from './image-qc.service';

/**
 * Image QC («Кадры QC») HTTP surface — same shape as VO validation:
 *
 *   GET  /projects/:idOrSlug/image-qc/readiness    button enablement
 *   POST /projects/:idOrSlug/image-qc/runs         start a run (opt-in click)
 *   GET  /projects/:idOrSlug/image-qc/runs         recent runs
 *   GET  /projects/:idOrSlug/image-qc/runs/latest  progress polling
 *   GET  /projects/:idOrSlug/image-qc/report       manual-review worklist
 *
 * Plus shot-scoped routes for the detail page:
 *   GET  /shots/:shotId/image-qc/verdicts          badges on candidate cards
 *   POST /shots/:shotId/image-qc/revalidate        spot re-check of one shot
 */
@Controller()
export class ImageQcController {
  constructor(private readonly qc: ImageQcService) {}

  @Get('projects/:idOrSlug/image-qc/readiness')
  readiness(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.readiness(idOrSlug);
  }

  @Post('projects/:idOrSlug/image-qc/runs')
  start(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.enqueue(idOrSlug);
  }

  @Get('projects/:idOrSlug/image-qc/runs')
  runs(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.listRuns(idOrSlug);
  }

  @Get('projects/:idOrSlug/image-qc/runs/latest')
  latest(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.latestRun(idOrSlug);
  }

  @Get('projects/:idOrSlug/image-qc/report')
  report(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.report(idOrSlug);
  }

  @Get('shots/:shotId/image-qc/verdicts')
  shotVerdicts(@Param('shotId') shotId: string) {
    return this.qc.shotVerdicts(shotId);
  }

  @Post('shots/:shotId/image-qc/revalidate')
  revalidate(@Param('shotId') shotId: string) {
    return this.qc.enqueueSpot(shotId);
  }
}
