import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';

@Module({
  imports:     [PrismaModule],
  providers:   [ExportsService],
  controllers: [ExportsController],
  exports:     [ExportsService],
})
export class ExportsModule {}
