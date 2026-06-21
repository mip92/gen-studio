import { Module } from '@nestjs/common';
import { TTSController } from './tts.controller';
import { ProjectTTSController } from './project-tts.controller';
import { TTSService } from './tts.service';
import { VoiceoversModule } from '../voiceovers/voiceovers.module';

@Module({
  imports:     [VoiceoversModule],
  controllers: [TTSController, ProjectTTSController],
  providers:   [TTSService],
  exports:     [TTSService],
})
export class TTSModule {}
