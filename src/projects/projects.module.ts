import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsDashboardController } from './projects-dashboard.controller';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [TrainingModule],
  controllers: [ProjectsController, ProjectsDashboardController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
