import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly chars: CharactersService) {}

  @Get(':profileId')
  @ApiOperation({ summary: 'Get a character profile by id (with character + project)' })
  findOne(@Param('profileId') profileId: string) {
    return this.chars.findProfileById(profileId);
  }

  @Patch(':profileId')
  @ApiOperation({ summary: 'Update editable profile fields (prompts, age, target, trigger)' })
  update(@Param('profileId') profileId: string, @Body() dto: UpdateProfileDto) {
    return this.chars.updateProfile(profileId, dto as Record<string, unknown>);
  }

  @Get(':profileId/loras')
  @ApiOperation({ summary: 'Rescan + list LoRA variants for this profile (final + epochs)' })
  listLoras(@Param('profileId') profileId: string) {
    return this.chars.listLoras(profileId);
  }

  @Post(':profileId/loras/active')
  @ApiOperation({ summary: 'Mark one LoRA variant as the default (sets profile.loraPath)' })
  setActiveLora(
    @Param('profileId') profileId: string,
    @Body() body: { filename?: string },
  ) {
    if (!body?.filename) throw new BadRequestException('filename is required');
    return this.chars.setActiveLora(profileId, body.filename);
  }

  @Delete(':profileId/loras/:filename')
  @ApiOperation({ summary: 'Delete a LoRA variant (file + DB list); repoints active if needed' })
  deleteLora(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
  ) {
    return this.chars.deleteLora(profileId, filename);
  }
}
