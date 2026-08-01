import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrainingModule } from '../training/training.module';
import { GenerationModule } from '../generation/generation.module';
import { TTSModule } from '../tts/tts.module';
import { BgmModule } from '../bgm/bgm.module';
import { CharactersModule } from '../characters/characters.module';
import { PropsModule } from '../props/props.module';
import { ValidationModule } from '../validation/validation.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { ThumbnailsModule } from '../thumbnails/thumbnails.module';
import { EngineModule } from './engine.module';
import { QueueLedgerModule } from './queue-ledger.module';
import { PipelineQueueService } from './pipeline-queue.service';
import { PipelineBootService } from './pipeline-boot.service';
import { PipelineController } from './pipeline.controller';

@Module({
  imports:     [PrismaModule, EngineModule, QueueLedgerModule, TrainingModule, GenerationModule, TTSModule, BgmModule, CharactersModule, PropsModule, ValidationModule, YoutubeModule, ThumbnailsModule],
  controllers: [PipelineController],
  providers:   [PipelineQueueService, PipelineBootService],
})
export class PipelineModule {}
