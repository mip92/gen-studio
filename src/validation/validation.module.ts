import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageValidationService } from './image-validation.service';

@Module({
  imports:   [PrismaModule],
  providers: [ImageValidationService],
  exports:   [ImageValidationService],
})
export class ValidationModule {}
