import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { WorkflowFactory } from './workflows/workflow.factory';
import { ScenesController } from './scenes/scenes.controller';
import { SceneRenderService } from './scenes/scene-render.service';
import { SceneFactory } from './scenes/scene.factory';
import { DatasetQueueController } from './dataset-queue.controller';
import { DatasetQueueService } from './dataset-queue.service';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [TrainingModule],
  controllers: [
    GenerationController,
    ScenesController,
    DatasetQueueController,
  ],
  providers: [
    GenerationService,
    WorkflowFactory,
    SceneRenderService,
    SceneFactory,
    DatasetQueueService,
  ],
  exports: [DatasetQueueService, SceneRenderService],
})
export class GenerationModule {}
