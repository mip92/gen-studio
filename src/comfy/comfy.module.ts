import { Global, Module } from '@nestjs/common';
import { ComfyService } from './comfy.service';

@Global()
@Module({
  providers: [ComfyService],
  exports: [ComfyService],
})
export class ComfyModule {}
