import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SceneRenderService, RenderShotInput } from './scene-render.service';
import { SceneFactory } from './scene.factory';

// NB: the class/folder is named "scenes" for historical reasons, but everything
// here renders the still image of ONE SHOT (Scene = act in this domain).
@ApiTags('Shot renders')
@Controller('generation/shots')
export class ScenesController {
  constructor(
    private readonly render:  SceneRenderService,
    private readonly scenes:  SceneFactory,
  ) {}

  @Post(':shotId/render')
  @ApiOperation({
    summary: 'Preview-only — assemble the shot render workflow without queuing it',
    description:
      'Returns the assembled prompt JSON for inspection (?dryRun=true required). ' +
      'For real rendering use POST :shotId/enqueue so the pipeline queue sequences ' +
      'against training/dataset jobs and we don\'t kill ComfyUI mid-render.',
  })
  @ApiQuery({ name: 'dryRun', required: true, type: Boolean })
  renderShot(
    @Param('shotId') shotId: string,
    @Query('dryRun') dryRun: string | undefined,
    @Body() body: Omit<RenderShotInput, 'shotId' | 'dryRun'>,
  ) {
    if (dryRun !== 'true') {
      throw new BadRequestException(
        'Direct dispatch is disabled. Use POST :shotId/enqueue to put the render ' +
        'into the pipeline queue, or pass ?dryRun=true to preview the workflow.',
      );
    }
    return this.render.renderShot({ shotId, dryRun: true, ...body });
  }

  @Post(':shotId/enqueue')
  @ApiOperation({
    summary: 'Enqueue a shot image render via the pipeline queue',
    description:
      'Creates a pending SceneRenderJob (historical name — it renders one shot). Pipeline worker dispatches it after any running ' +
      'training/dataset finishes, ensures ComfyUI is alive, polls completion, and appends ' +
      'output filenames to shot.renderedImages.',
  })
  enqueueRender(
    @Param('shotId') shotId: string,
    @Body() body: Omit<RenderShotInput, 'shotId' | 'dryRun'>,
  ) {
    return this.render.enqueueRender({ shotId, ...body });
  }

  @Post('project/:projectId/enqueue-pending')
  @ApiOperation({
    summary: 'Bulk-enqueue every not-yet-rendered, not-queued shot in a project (one click)',
    description:
      'ADDITIVE ONLY — never wipes or re-queues. Skips shots that are already rendered ' +
      '(awaiting approval), approved (chosenRender set), or already have a pending/running job. ' +
      'projectId may be the project UUID or slug. Returns { enqueued }.',
  })
  enqueueProjectPending(@Param('projectId') projectId: string) {
    return this.render.enqueuePendingForProject(projectId);
  }

  @Get('strategies')
  @ApiOperation({ summary: 'List registered shot render strategies (ids are scene_* for historical reasons)' })
  listStrategies() {
    return this.scenes.list();
  }
}
