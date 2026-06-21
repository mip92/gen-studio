import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PropsController } from './props.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PropsController],
})
export class PropsModule {}
