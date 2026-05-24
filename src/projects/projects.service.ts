import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto) {
    // Schema marks these as NOT NULL; class-validator catches missing/empty
    // fields at the DTO layer. Anything that slips through here is a defensive
    // last line.
    const required = ['defaultNegative', 'defaultVideoNegative', 'defaultMotionPrompt', 'defaultStaticMotionPrompt'] as const;
    for (const k of required) {
      const v = (dto as any)[k];
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new BadRequestException(`Project.${k} is required (non-empty string)`);
      }
    }
    return this.prisma.project.create({
      data: {
        slug:                       dto.slug,
        name:                       dto.name,
        settings:                   (dto.settings ?? {}) as object,
        scriptText:                 dto.scriptText ?? null,
        defaultNegative:            dto.defaultNegative,
        // Cast: new columns aren't in the regenerated Prisma client until
        // restart, but the underlying column exists and accepts the value.
        ...({
          defaultVideoNegative:      dto.defaultVideoNegative,
          defaultMotionPrompt:       dto.defaultMotionPrompt,
          defaultStaticMotionPrompt: dto.defaultStaticMotionPrompt,
        } as any),
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    // Reject explicit empty strings on the required prompt fields — schema
    // is NOT NULL, but the DB would accept '' which defeats the constraint.
    const requiredIfPresent = ['defaultNegative', 'defaultVideoNegative', 'defaultMotionPrompt', 'defaultStaticMotionPrompt'] as const;
    for (const k of requiredIfPresent) {
      const v = (dto as any)[k];
      if (v !== undefined && (typeof v !== 'string' || v.trim().length === 0)) {
        throw new BadRequestException(`Project.${k} cannot be cleared — it is required content`);
      }
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        slug:                       dto.slug,
        name:                       dto.name,
        settings:                   dto.settings as object | undefined,
        scriptText:                 dto.scriptText,
        defaultNegative:            dto.defaultNegative,
        ...({
          defaultVideoNegative:      (dto as any).defaultVideoNegative,
          defaultMotionPrompt:       (dto as any).defaultMotionPrompt,
          defaultStaticMotionPrompt: (dto as any).defaultStaticMotionPrompt,
        } as any),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
