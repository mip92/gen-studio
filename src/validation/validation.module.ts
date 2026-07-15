import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageValidationService } from './image-validation.service';
import { AnchorValidationService } from './anchor-validation.service';

@Module({
  imports:   [PrismaModule],
  providers: [ImageValidationService, AnchorValidationService],
  exports:   [ImageValidationService, AnchorValidationService],
})
export class ValidationModule {}
