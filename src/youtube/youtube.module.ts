import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports:     [PrismaModule],
  providers:   [YoutubeService],
  controllers: [YoutubeController],
})
export class YoutubeModule {}
