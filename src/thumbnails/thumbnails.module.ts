import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComfyModule } from '../comfy/comfy.module';
import { EngineModule } from '../pipeline/engine.module';
import { ThumbnailRenderService } from './thumbnail-render.service';
import { ThumbnailsController } from './thumbnails.controller';

/** YouTube thumbnail workshop: pool of candidate art + the caption overlay pass.
 *  Exports the service so PipelineModule can dispatch/poll its queue entries. */
@Module({
  imports: [PrismaModule, ComfyModule, EngineModule],
  controllers: [ThumbnailsController],
  providers: [ThumbnailRenderService],
  exports: [ThumbnailRenderService],
})
export class ThumbnailsModule {}
