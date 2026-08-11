import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CharactersService } from './characters.service';
import { AnchorRenderService } from './anchor-render.service';
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
  constructor(
    private readonly charactersService: CharactersService,
    private readonly anchor:            AnchorRenderService,
  ) {}

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
  @ApiOperation({ summary: 'Paginated library list ({ rows, total }) for the infinite-scroll grid. Optional ?q= filters by code / displayName (case-insensitive contains) — powers the attach-to-project autocomplete.' })
  listPage(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('q')    q?:    string,
  ) {
    const s = Math.max(0, parseInt(skip ?? '0', 10) || 0);
    const t = Math.min(100, Math.max(1, parseInt(take ?? '24', 10) || 24));
    return this.charactersService.listLibraryPage(s, t, q?.trim() || undefined);
  }

  @Post('link-chains')
  @ApiOperation({
    summary: 'Backfill anchor-inheritance chains for every multi-profile character',
    description: 'Orders each character\'s profiles by ageLabel and points each state at the previous one. '
      + 'Defaults to a DRY RUN — read `results` (and each entry\'s `warnings`: ages guessed from the code, '
      + 'ranges, ties, label-vs-suffix disagreement) before writing. `overwrite: false` (default) fills only '
      + 'empty links. Links ONLY: no anchor is re-rendered or invalidated, and a later base approve queues '
      + 'derived renders solely for descendants that have no anchor yet.',
  })
  linkChains(@Body() body: { dryRun?: boolean; overwrite?: boolean }) {
    return this.anchor.linkAllChains({
      dryRun:    body?.dryRun    !== false,   // dry run unless explicitly disabled
      overwrite: body?.overwrite === true,
    });
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Library lookup by character id (returns profiles + attached projects)' })
  findOne(@Param('characterId') characterId: string) {
    return this.charactersService.findOneById(characterId);
  }

  @Get(':characterId/profile-chain')
  @ApiOperation({ summary: 'Anchor-inheritance chain of a character (same payload as GET /profiles/:id/chain)' })
  chain(@Param('characterId') characterId: string) {
    return this.anchor.chainForCharacter(characterId);
  }
}
