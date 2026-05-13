import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { WorkflowFactory } from './workflows/workflow.factory';
import { ScenesController } from './scenes/scenes.controller';
import { SceneRenderService } from './scenes/scene-render.service';
import { SceneFactory } from './scenes/scene.factory';
import { DatasetQueueController } from './dataset-queue.controller';
import { DatasetQueueService } from './dataset-queue.service';
import { VideosController } from './videos/videos.controller';
import { VideoRenderService } from './videos/video-render.service';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [TrainingModule],
  controllers: [
    GenerationController,
    ScenesController,
    DatasetQueueController,
    VideosController,
  ],
  providers: [
    GenerationService,
    WorkflowFactory,
    SceneRenderService,
    SceneFactory,
    DatasetQueueService,
    VideoRenderService,
  ],
  exports: [DatasetQueueService, SceneRenderService, VideoRenderService],
})
export class GenerationModule {}
