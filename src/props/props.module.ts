import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EngineModule } from '../pipeline/engine.module';
import { QueueLedgerModule } from '../pipeline/queue-ledger.module';
import { PropsController } from './props.controller';
import { PropAnchorService } from './prop-anchor.service';

@Module({
  imports:     [PrismaModule, EngineModule, QueueLedgerModule],
  controllers: [PropsController],
  providers:   [PropAnchorService],
  // PipelineQueueService drives dispatch/poll for every job type, prop anchors
  // included — it needs this service, so it must be exported.
  exports:     [PropAnchorService],
})
export class PropsModule {}
