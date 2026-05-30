import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharacterLibraryController } from './library.controller';
import { ProfilesController } from './profiles.controller';
import { AnchorRenderService } from './anchor-render.service';
import { ComfyModule } from '../comfy/comfy.module';
import { TrainingModule } from '../training/training.module';

@Module({
  imports:     [TrainingModule, ComfyModule],
  controllers: [CharactersController, CharacterLibraryController, ProfilesController],
  providers:   [CharactersService, AnchorRenderService],
  exports:     [CharactersService, AnchorRenderService],
})
export class CharactersModule {}
