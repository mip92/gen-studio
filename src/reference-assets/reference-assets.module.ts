import { Module } from '@nestjs/common';
import { ReferenceAssetsController } from './reference-assets.controller';
import { ReferenceAssetsService } from './reference-assets.service';

@Module({
  controllers: [ReferenceAssetsController],
  providers: [ReferenceAssetsService]
})
export class ReferenceAssetsModule {}
