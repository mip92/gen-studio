import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExportsService } from './exports.service';

/** Optional POST body for the shorts export — a plan pushed by the caller
 *  (e.g. the future local-LLM curator). Absent → the server reads the
 *  versioned scripts/<slug>_shorts_plan.json instead. */
interface ExportShortsBody {
  shorts?: Array<{ slug: string; title?: string; shots: string[] }>;
  background_fill?: string;
  width?:  number;
  height?: number;
  fps?:    number;
}

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

  @Get('shorts/plan')
  @ApiOperation({
    summary: 'Read the project\'s curated YouTube-Shorts plan',
    description:
      'Returns the shorts defined in scripts/<slug>_shorts_plan.json (slug, '
      + 'title, shot count) so the UI can list them and enable the export '
      + 'button. hasPlan=false when no plan file exists yet.',
  })
  shortsPlan(@Param('idOrSlug') idOrSlug: string) {
    return this.exports.getShortsPlan(idOrSlug);
  }

  @Post('shorts')
  @ApiOperation({
    summary: 'Build vertical (9:16) YouTube-Shorts CapCut drafts for the project',
    description:
      'Assembles 2-3 vertical teaser reels from a hand-picked subset of '
      + 'already-rendered shots — one CapCut draft per short. Uses the POSTed '
      + 'plan body when it carries `shorts`, otherwise the versioned '
      + 'scripts/<slug>_shorts_plan.json. Returns the drafts written into '
      + 'CapCut\'s drafts directory.',
  })
  exportShorts(@Param('idOrSlug') idOrSlug: string, @Body() body?: ExportShortsBody) {
    return this.exports.exportShorts(idOrSlug, body);
  }
}
