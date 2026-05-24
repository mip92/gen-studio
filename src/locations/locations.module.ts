import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationsController } from './locations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LocationsController],
})
export class LocationsModule {}
