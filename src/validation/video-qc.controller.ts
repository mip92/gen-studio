import { Controller, Get, Param, Post } from '@nestjs/common';
import { VideoQcService } from './video-qc.service';

/**
 * Video QC («Видео QC») HTTP surface — same shape as Image QC / VO QC:
 *
 *   GET  /projects/:idOrSlug/video-qc/readiness    button enablement
 *   POST /projects/:idOrSlug/video-qc/runs         start a run (opt-in click)
 *   GET  /projects/:idOrSlug/video-qc/runs         recent runs
 *   GET  /projects/:idOrSlug/video-qc/runs/latest  progress polling
 *   GET  /projects/:idOrSlug/video-qc/report       manual-review worklist
 *
 * Plus shot-scoped routes for the videos tab:
 *   GET  /shots/:shotId/video-qc/verdicts          badges on takes
 *   POST /shots/:shotId/video-qc/revalidate        spot re-check of one shot
 */
@Controller()
export class VideoQcController {
  constructor(private readonly qc: VideoQcService) {}

  @Get('projects/:idOrSlug/video-qc/readiness')
  readiness(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.readiness(idOrSlug);
  }

  @Post('projects/:idOrSlug/video-qc/runs')
  start(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.enqueue(idOrSlug);
  }

  @Get('projects/:idOrSlug/video-qc/runs')
  runs(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.listRuns(idOrSlug);
  }

  @Get('projects/:idOrSlug/video-qc/runs/latest')
  latest(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.latestRun(idOrSlug);
  }

  @Get('projects/:idOrSlug/video-qc/report')
  report(@Param('idOrSlug') idOrSlug: string) {
    return this.qc.report(idOrSlug);
  }

  @Get('shots/:shotId/video-qc/verdicts')
  shotVerdicts(@Param('shotId') shotId: string) {
    return this.qc.shotVerdicts(shotId);
  }

  @Post('shots/:shotId/video-qc/revalidate')
  revalidate(@Param('shotId') shotId: string) {
    return this.qc.enqueueSpot(shotId);
  }
}
