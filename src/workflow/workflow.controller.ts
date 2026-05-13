import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';

@ApiTags('Workflow')
@Controller('projects/:projectId')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // ── Templates ─────────────────────────────────────────────────────────────

  @Get('workflow-templates')
  findAllTemplates(@Param('projectId') projectId: string) {
    return this.workflowService.findAllTemplates(projectId);
  }

  @Get('workflow-templates/:templateId')
  findOneTemplate(
    @Param('projectId') projectId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.workflowService.findOneTemplate(projectId, templateId);
  }

  @Delete('workflow-templates/:templateId')
  removeTemplate(
    @Param('projectId') projectId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.workflowService.removeTemplate(projectId, templateId);
  }

  // ── Routes ────────────────────────────────────────────────────────────────

  @Get('workflow-routes')
  findAllRoutes(@Param('projectId') projectId: string) {
    return this.workflowService.findAllRoutes(projectId);
  }

  @Get('workflow-routes/:routeId')
  findOneRoute(
    @Param('projectId') projectId: string,
    @Param('routeId') routeId: string,
  ) {
    return this.workflowService.findOneRoute(projectId, routeId);
  }

  @Delete('workflow-routes/:routeId')
  removeRoute(
    @Param('projectId') projectId: string,
    @Param('routeId') routeId: string,
  ) {
    return this.workflowService.removeRoute(projectId, routeId);
  }
}
