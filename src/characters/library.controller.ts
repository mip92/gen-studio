import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateProfileDto } from './dto/create-profile.dto';

class CreateLibraryCharacterBody extends CreateCharacterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile?: CreateProfileDto;
}

@ApiTags('Character Library')
@Controller('library/characters')
export class CharacterLibraryController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: 'List every character in the system with their project attachments' })
  list() {
    return this.charactersService.listLibrary();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a library character (no project binding). Use POST /projects/:id/characters/:cid/attach afterwards to link it to projects.',
  })
  create(@Body() dto: CreateLibraryCharacterBody) {
    return this.charactersService.createLibrary(dto);
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Library lookup by character id (returns profiles + attached projects)' })
  findOne(@Param('characterId') characterId: string) {
    return this.charactersService.findOneById(characterId);
  }
}
