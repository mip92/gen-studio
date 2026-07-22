import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YoutubeAuthController } from './youtube-auth.controller';
import { YoutubeAuthService } from './youtube-auth.service';
import { YoutubeCaptionsService } from './youtube-captions.service';
import { YoutubeController } from './youtube.controller';
import { YoutubeLaunchController } from './youtube-launch.controller';
import { YoutubeLaunchService } from './youtube-launch.service';
import { YoutubeService } from './youtube.service';
import { YoutubeUploadService } from './youtube-upload.service';

@Module({
  imports:     [PrismaModule],
  providers:   [YoutubeService, YoutubeAuthService, YoutubeUploadService, YoutubeCaptionsService, YoutubeLaunchService],
  controllers: [YoutubeController, YoutubeAuthController, YoutubeLaunchController],
  // YoutubeCaptionsService is consumed by PipelineQueueService (the queue runs
  // the slow whisper transcription in its single slot).
  exports:     [YoutubeCaptionsService],
})
export class YoutubeModule {}
