import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharacterLibraryController } from './library.controller';
import { ProfilesController } from './profiles.controller';
import { TrainingModule } from '../training/training.module';

@Module({
  imports:     [TrainingModule],
  controllers: [CharactersController, CharacterLibraryController, ProfilesController],
  providers:   [CharactersService],
  exports:     [CharactersService],
})
export class CharactersModule {}
