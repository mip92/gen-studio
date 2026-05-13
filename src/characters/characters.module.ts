import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { ProfilesController } from './profiles.controller';

@Module({
  controllers: [CharactersController, ProfilesController],
  providers:   [CharactersService],
  exports:     [CharactersService],
})
export class CharactersModule {}
