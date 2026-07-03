import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { YoutubeMain, YoutubeService, YoutubeShort } from './youtube.service';

interface PatchYoutubeBody {
  main?:   Partial<YoutubeMain>;
  shorts?: Record<string, Partial<YoutubeShort>>;
}

@ApiTags('YouTube')
@Controller('projects/:idOrSlug/youtube')
export class YoutubeController {
  constructor(private readonly youtube: YoutubeService) {}

  @Get()
  @ApiOperation({
    summary: 'Read the project\'s YouTube packaging (title / description(s) / tags)',
    description:
      'Returns { youtubeUrl, main:{title,description,tags}, shorts:{<slug>:{title,'
      + 'descBefore,descAfter,tags}} } from Project.settings.youtube. Empty defaults '
      + 'when unset.',
  })
  get(@Param('idOrSlug') idOrSlug: string) {
    return this.youtube.get(idOrSlug);
  }

  @Patch()
  @ApiOperation({
    summary: 'Merge-update the YouTube packaging',
    description:
      'Shallow-merges `main` and each `shorts[<slug>]`. Only keys present in the '
      + 'body change; everything else is preserved.',
  })
  patch(@Param('idOrSlug') idOrSlug: string, @Body() body: PatchYoutubeBody) {
    return this.youtube.patch(idOrSlug, body);
  }
}
