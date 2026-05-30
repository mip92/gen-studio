import { Module } from '@nestjs/common';
import { TTSController } from './tts.controller';
import { ProjectTTSController } from './project-tts.controller';
import { TTSService } from './tts.service';

@Module({
  controllers: [TTSController, ProjectTTSController],
  providers:   [TTSService],
  exports:     [TTSService],
})
export class TTSModule {}
