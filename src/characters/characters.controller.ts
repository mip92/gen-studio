import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateProfileDto } from './dto/create-profile.dto';

class CreateCharacterWithProfileBody extends CreateCharacterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile?: CreateProfileDto;
}

@ApiTags('Characters')
@Controller('projects/:projectId/characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  // ── Characters ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List characters in a project (id or slug)' })
  findAll(@Param('projectId') projectId: string) {
    return this.charactersService.findAll(projectId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a character (optionally with first profile)',
    description: 'Body: { code, displayName?, profile?: { profileCode, promptBase, ... } }',
  })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCharacterWithProfileBody,
  ) {
    return this.charactersService.create(projectId, dto);
  }

  @Get(':characterId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.findOne(projectId, characterId);
  }

  @Get(':characterId/usage')
  @ApiOperation({ summary: 'Show how many shots/scenes reference this character (for delete confirmation)' })
  usage(@Param('characterId') characterId: string) {
    return this.charactersService.getUsage(characterId);
  }

  @Delete(':characterId')
  @ApiOperation({ summary: 'Delete character with full cleanup (LoRA, dataset, reference, output images)' })
  remove(
    @Param('projectId') projectId: string,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.remove(projectId, characterId);
  }

  // ── Profiles ─────────────────────────────────────────────────────────────

  @Get(':characterId/profiles')
  findAllProfiles(@Param('characterId') characterId: string) {
    return this.charactersService.findAllProfiles(characterId);
  }

  @Post(':characterId/profiles')
  @ApiOperation({ summary: 'Add a profile to an existing character' })
  addProfile(
    @Param('characterId') characterId: string,
    @Body() dto: CreateProfileDto,
  ) {
    return this.charactersService.addProfile(characterId, dto);
  }

  @Get(':characterId/profiles/:profileId')
  findOneProfile(
    @Param('characterId') characterId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.charactersService.findOneProfile(characterId, profileId);
  }

  @Delete(':characterId/profiles/:profileId')
  removeProfile(
    @Param('characterId') characterId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.charactersService.removeProfile(characterId, profileId);
  }
}
