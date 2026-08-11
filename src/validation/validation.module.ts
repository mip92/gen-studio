import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnchorValidationService } from './anchor-validation.service';
import { VoValidationService } from './vo-validation.service';
import { VoValidationController } from './vo-validation.controller';
import { ImageQcService } from './image-qc.service';
import { ImageQcController } from './image-qc.controller';
import { VideoQcService } from './video-qc.service';
import { VideoQcController } from './video-qc.controller';

@Module({
  imports:     [PrismaModule],
  controllers: [VoValidationController, ImageQcController, VideoQcController],
  providers:   [AnchorValidationService, VoValidationService, ImageQcService, VideoQcService],
  exports:     [AnchorValidationService, VoValidationService, ImageQcService, VideoQcService],
})
export class ValidationModule {}
