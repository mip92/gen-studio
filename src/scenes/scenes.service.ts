import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSceneDto } from './dto/create-scene.dto';

@Injectable()
export class ScenesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectIdOrSlug: string) {
    return this.prisma.scene.findMany({
      where:   { OR: [{ projectId: projectIdOrSlug }, { project: { slug: projectIdOrSlug } }] },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(projectIdOrSlug: string, dto: CreateSceneDto) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    const dup = await this.prisma.scene.findFirst({
      where: { projectId: project.id, sceneKey: dto.sceneKey },
    });
    if (dup) throw new BadRequestException(`Scene key "${dto.sceneKey}" already exists in project`);

    // Auto-assign next sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const max = await this.prisma.scene.findFirst({
        where:   { projectId: project.id },
        orderBy: { sortOrder: 'desc' },
        select:  { sortOrder: true },
      });
      sortOrder = (max?.sortOrder ?? 0) + 1;
    }

    return this.prisma.scene.create({
      data: {
        projectId:                   project.id,
        sceneKey:                    dto.sceneKey,
        title:                       dto.title,
        sortOrder,
        defaultReferenceProfileCode: dto.defaultReferenceProfileCode,
      },
    });
  }

  async findOne(projectIdOrSlug: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({
      where: {
        id: sceneId,
        OR: [{ projectId: projectIdOrSlug }, { project: { slug: projectIdOrSlug } }],
      },
      include: { shots: { orderBy: { shotCode: 'asc' } } },
    });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
    return scene;
  }

  async remove(projectIdOrSlug: string, sceneId: string) {
    await this.findOne(projectIdOrSlug, sceneId);
    return this.prisma.scene.delete({ where: { id: sceneId } });
  }
}
