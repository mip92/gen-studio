import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { DatasetService } from './dataset.service';
import { TrainerService } from './trainer.service';
import { DatasetsController } from './datasets.controller';
import { EngineModule } from '../pipeline/engine.module';

@Module({
  imports:     [EngineModule],
  controllers: [TrainingController, DatasetsController],
  providers:   [TrainingService, DatasetService, TrainerService],
  exports:     [TrainingService, DatasetService],
})
export class TrainingModule {}
