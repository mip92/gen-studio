import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComicModule } from '../comic/comic.module';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';

@Module({
  imports:     [PrismaModule, ComicModule],
  providers:   [ExportsService],
  controllers: [ExportsController],
  exports:     [ExportsService],
})
export class ExportsModule {}
