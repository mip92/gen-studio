import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PageTemplateRegistryService } from './page-template-registry.service';
import { PageTemplatesController } from './page-templates.controller';
import { ComicPlanService } from './comic-plan.service';

/**
 * Comic template-layout mode: the shapes/templates registry (single source of
 * truth shared with the python scripts), its read-only endpoints and the plan
 * integrity gate. Exported so render services (scenes/videos) resolve per-shot
 * render sizes and the exports flow validates layout plans.
 */
@Module({
  imports: [PrismaModule],
  providers: [PageTemplateRegistryService, ComicPlanService],
  controllers: [PageTemplatesController],
  exports: [PageTemplateRegistryService, ComicPlanService],
})
export class ComicModule {}
