import { Module } from '@nestjs/common';
import { ShotsController, ShotsStandaloneController } from './shots.controller';
import { ShotsService } from './shots.service';
import { GenerationModule } from '../generation/generation.module';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports:     [GenerationModule, ValidationModule],
  controllers: [ShotsController, ShotsStandaloneController],
  providers:   [ShotsService],
  exports:     [ShotsService],
})
export class ShotsModule {}
