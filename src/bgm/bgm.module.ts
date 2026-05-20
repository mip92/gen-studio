import { Module } from '@nestjs/common';
import { ComfyModule } from '../comfy/comfy.module';
import { BgmController } from './bgm.controller';
import { BgmService } from './bgm.service';
import { BgmRenderService } from './bgm-render.service';

@Module({
  imports:     [ComfyModule],
  controllers: [BgmController],
  providers:   [BgmService, BgmRenderService],
  exports:     [BgmService, BgmRenderService],
})
export class BgmModule {}
