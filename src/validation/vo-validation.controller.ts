import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoValidationService } from './vo-validation.service';
import { voGateBlocksApprove } from './vo-validation-gate';

/**
 * VO validation (audio QC) HTTP surface, project-scoped:
 *
 *   GET   /projects/:idOrSlug/vo-validation/readiness    button enablement
 *   GET   /projects/:idOrSlug/vo-validation/gate         approve-gate state
 *   PATCH /projects/:idOrSlug/vo-validation/gate         {enabled} — opt-in toggle
 *   POST  /projects/:idOrSlug/vo-validation/runs         start a run (opt-in click)
 *   GET   /projects/:idOrSlug/vo-validation/runs         recent runs
 *   GET   /projects/:idOrSlug/vo-validation/runs/latest  progress polling
 *   GET   /projects/:idOrSlug/vo-validation/report       manual-listening worklist
 *
 * Plus one job-scoped route for the trim-invalidation case:
 *   POST  /tts/jobs/:jobId/revalidate                    spot re-check of one wav
 */
@Controller()
export class VoValidationController {
  constructor(
    private readonly vo:     VoValidationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('projects/:idOrSlug/vo-validation/readiness')
  readiness(@Param('idOrSlug') idOrSlug: string) {
    return this.vo.readiness(idOrSlug);
  }

  @Get('projects/:idOrSlug/vo-validation/gate')
  async gate(@Param('idOrSlug') idOrSlug: string) {
    const r = await this.vo.readiness(idOrSlug);
    // blocksApprove folds the flag + "has a completed run" into one boolean the
    // UI can bind directly to the approve buttons' disabled state.
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, select: { id: true },
    });
    return {
      gateEnabled:     r.gateEnabled,
      hasCompletedRun: r.hasCompletedRun,
      blocksApprove:   project ? await voGateBlocksApprove(this.prisma, project.id) : false,
    };
  }

  @Patch('projects/:idOrSlug/vo-validation/gate')
  setGate(@Param('idOrSlug') idOrSlug: string, @Body() body: { enabled?: boolean }) {
    return this.vo.setGateEnabled(idOrSlug, body?.enabled === true);
  }

  @Post('projects/:idOrSlug/vo-validation/runs')
  start(@Param('idOrSlug') idOrSlug: string) {
    return this.vo.enqueue(idOrSlug);
  }

  @Get('projects/:idOrSlug/vo-validation/runs')
  runs(@Param('idOrSlug') idOrSlug: string) {
    return this.vo.listRuns(idOrSlug);
  }

  @Get('projects/:idOrSlug/vo-validation/runs/latest')
  latest(@Param('idOrSlug') idOrSlug: string) {
    return this.vo.latestRun(idOrSlug);
  }

  @Get('projects/:idOrSlug/vo-validation/report')
  report(@Param('idOrSlug') idOrSlug: string) {
    return this.vo.report(idOrSlug);
  }

  @Post('tts/jobs/:jobId/revalidate')
  revalidate(@Param('jobId') jobId: string) {
    return this.vo.enqueueSpot(jobId);
  }
}
