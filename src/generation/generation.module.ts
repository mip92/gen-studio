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
import { EndFramesController } from './endframes/endframes.controller';
import { EndFrameService } from './endframes/end-frame.service';
import { VideoEngineFactory } from './videos/engines/video-engine.factory';
import { TrainingModule } from '../training/training.module';
import { ValidationModule } from '../validation/validation.module';
import { ComicModule } from '../comic/comic.module';

@Module({
  imports: [TrainingModule, ValidationModule, ComicModule],
  controllers: [
    GenerationController,
    ScenesController,
    DatasetQueueController,
    VideosController,
    EndFramesController,
  ],
  providers: [
    GenerationService,
    WorkflowFactory,
    SceneRenderService,
    SceneFactory,
    DatasetQueueService,
    VideoRenderService,
    EndFrameService,
    VideoEngineFactory,
  ],
  exports: [DatasetQueueService, SceneRenderService, VideoRenderService, EndFrameService],
})
export class GenerationModule {}
