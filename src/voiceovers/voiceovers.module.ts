import { Module } from '@nestjs/common';
import { VoiceoversController } from './voiceovers.controller';
import { VoiceoversService } from './voiceovers.service';

@Module({
  controllers: [VoiceoversController],
  providers:   [VoiceoversService],
  exports:     [VoiceoversService],
})
export class VoiceoversModule {}
