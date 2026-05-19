import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExportsService } from './exports.service';

@ApiTags('Exports')
@Controller('projects/:idOrSlug/export')
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Get('capcut/readiness')
  @ApiOperation({
    summary: 'Check whether the project is ready to be exported to CapCut',
    description:
      'Returns ready=true only when every shot has chosen+FHD-upscaled video '
      + 'and every scene has an approved TTS job. The breakdown lists offending '
      + 'rows so the UI tooltip can tell the user what is missing.',
  })
  readiness(@Param('idOrSlug') idOrSlug: string) {
    return this.exports.checkReadiness(idOrSlug);
  }

  @Post('capcut')
  @ApiOperation({
    summary: 'Build a CapCut/JianYing draft folder for the project',
    description:
      'Writes data/<slug>/exports/capcut/<slug>_<ts>/draft_content.json. '
      + 'Returns the absolute draft folder path — the user copies this folder '
      + 'into %LOCALAPPDATA%\\CapCut\\User Data\\Projects\\com.lveditor.draft\\ '
      + 'and the project appears in CapCut\'s draft list.',
  })
  exportCapcut(@Param('idOrSlug') idOrSlug: string) {
    return this.exports.exportCapcut(idOrSlug);
  }
}
