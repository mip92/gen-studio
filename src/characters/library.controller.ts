import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('page')
  @ApiOperation({ summary: 'Paginated library list ({ rows, total }) for the infinite-scroll grid' })
  listPage(@Query('skip') skip?: string, @Query('take') take?: string) {
    const s = Math.max(0, parseInt(skip ?? '0', 10) || 0);
    const t = Math.min(100, Math.max(1, parseInt(take ?? '24', 10) || 24));
    return this.charactersService.listLibraryPage(s, t);
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Library lookup by character id (returns profiles + attached projects)' })
  findOne(@Param('characterId') characterId: string) {
    return this.charactersService.findOneById(characterId);
  }
}
