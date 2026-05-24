import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActionsService, ActionItem } from './actions.service';

@ApiTags('actions')
@Controller('actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  /**
   * Flat list of every "the user must do something" item across the pipeline.
   * Optional ?project=<slug> filters to a single project. UI groups by project
   * and gate; backend stays untyped/unstructured so the consumer can group
   * freely without re-shaping a nested response.
   */
  @Get()
  @ApiOperation({ summary: 'Items waiting for user action across all 8 pipeline gates' })
  async list(@Query('project') projectSlug?: string): Promise<{ items: ActionItem[] }> {
    const items = await this.actions.listActions(projectSlug);
    return { items };
  }
}
