import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrainingModule } from '../training/training.module';
import { GenerationModule } from '../generation/generation.module';
import { TTSModule } from '../tts/tts.module';
import { EngineModule } from './engine.module';
import { PipelineQueueService } from './pipeline-queue.service';
import { PipelineBootService } from './pipeline-boot.service';
import { PipelineController } from './pipeline.controller';

@Module({
  imports:     [PrismaModule, EngineModule, TrainingModule, GenerationModule, TTSModule],
  controllers: [PipelineController],
  providers:   [PipelineQueueService, PipelineBootService],
})
export class PipelineModule {}
