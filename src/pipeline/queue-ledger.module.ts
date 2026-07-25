import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueLedgerService } from './queue-ledger.service';
import { QueueOutcomeService } from './queue-outcome.service';
import { QueueSourceService } from './queue-source.service';

/**
 * The queue/ledger, exported globally.
 *
 * Every service that creates or finishes a unit of work has to reach it — the
 * eleven job services, the queue API, the shot/scene/project delete paths and
 * the stats endpoint — so it is `@Global` for the same reason PrismaModule is:
 * it is cross-cutting infrastructure, and threading it through ten `imports`
 * arrays would invite import cycles (PipelineModule already depends on most of
 * those modules, which would then depend back on it).
 *
 * It only depends on Prisma, so it can never be part of a cycle itself.
 */
@Global()
@Module({
  imports:   [PrismaModule],
  providers: [QueueSourceService, QueueLedgerService, QueueOutcomeService],
  exports:   [QueueSourceService, QueueLedgerService, QueueOutcomeService],
})
export class QueueLedgerModule {}
