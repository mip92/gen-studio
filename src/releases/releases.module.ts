import { Module } from '@nestjs/common';
import { ExportsModule } from '../exports/exports.module';
import { PrismaModule } from '../prisma/prisma.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { ReleaseBackfillService } from './release-backfill.service';
import { ReleasesController } from './releases.controller';
import { ReleasesService } from './releases.service';

@Module({
  // ExportsModule: готовность = ровно тот checkReadiness, что открывает кнопку
  // экспорта в CapCut — один источник истины, никаких прокси-метрик.
  imports:     [PrismaModule, YoutubeModule, ExportsModule],
  controllers: [ReleasesController],
  providers:   [ReleasesService, ReleaseBackfillService],
})
export class ReleasesModule {}
