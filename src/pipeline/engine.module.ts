import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';

/**
 * Tiny module exporting only EngineService — broken out from PipelineModule
 * so that TrainingModule can depend on it without creating a cycle (the
 * pipeline queue itself depends on TrainingModule).
 */
@Module({
  providers: [EngineService],
  exports:   [EngineService],
})
export class EngineModule {}
