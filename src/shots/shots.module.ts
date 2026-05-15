import { Module } from '@nestjs/common';
import { ShotsController, ShotsStandaloneController } from './shots.controller';
import { ShotsService } from './shots.service';
import { GenerationModule } from '../generation/generation.module';

@Module({
  imports:     [GenerationModule],
  controllers: [ShotsController, ShotsStandaloneController],
  providers:   [ShotsService],
  exports:     [ShotsService],
})
export class ShotsModule {}
