import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Templates ─────────────────────────────────────────────────────────────

  findAllTemplates(projectId: string) {
    return this.prisma.workflowTemplate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneTemplate(projectId: string, templateId: string) {
    const template = await this.prisma.workflowTemplate.findFirst({
      where: { id: templateId, projectId },
    });
    if (!template) throw new NotFoundException(`WorkflowTemplate ${templateId} not found`);
    return template;
  }

  async removeTemplate(projectId: string, templateId: string) {
    await this.findOneTemplate(projectId, templateId);
    return this.prisma.workflowTemplate.delete({ where: { id: templateId } });
  }

  // ── Routes ────────────────────────────────────────────────────────────────

  findAllRoutes(projectId: string) {
    return this.prisma.workflowRoute.findMany({
      where: { projectId },
      include: {
        steps: { include: { workflowTemplate: true }, orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneRoute(projectId: string, routeId: string) {
    const route = await this.prisma.workflowRoute.findFirst({
      where: { id: routeId, projectId },
      include: {
        steps: { include: { workflowTemplate: true }, orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!route) throw new NotFoundException(`WorkflowRoute ${routeId} not found`);
    return route;
  }

  async removeRoute(projectId: string, routeId: string) {
    await this.findOneRoute(projectId, routeId);
    return this.prisma.workflowRoute.delete({ where: { id: routeId } });
  }
}
