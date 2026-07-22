import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadVideoDto } from './dto/upload-video.dto';
import { YoutubeCaptionsService } from './youtube-captions.service';
import { YoutubeUploadService } from './youtube-upload.service';
import { YoutubeMain, YoutubeService, YoutubeShort } from './youtube.service';

interface PatchYoutubeBody {
  main?:   Partial<YoutubeMain>;
  shorts?: Record<string, Partial<YoutubeShort>>;
}

interface EnqueueCaptionsBody {
  videoId:    string;
  videoPath:  string;
  language?:  string;
}

@ApiTags('YouTube')
@Controller('projects/:idOrSlug/youtube')
export class YoutubeController {
  constructor(
    private readonly youtube:  YoutubeService,
    private readonly upload:   YoutubeUploadService,
    private readonly captions: YoutubeCaptionsService,
  ) {}

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

  @Post('upload')
  @ApiOperation({
    summary: 'Upload the project\'s MAIN video to YouTube',
    description:
      'Runs videos.insert using the stored packaging (title/description/tags) and '
      + 'the mp4 at `videoPath`, optionally setting a thumbnail. Requires the channel '
      + 'to be connected (GET /youtube/oauth/url). NOTE: until the API project passes '
      + 'YouTube\'s compliance audit, Google forces the video to `private` — the '
      + 'response\'s `actualPrivacy` reflects what really happened.',
  })
  uploadMain(@Param('idOrSlug') idOrSlug: string, @Body() dto: UploadVideoDto) {
    // Returns { jobId } immediately; the upload runs in the background (2GB films
    // outlast the HTTP request). Poll GET /youtube/jobs/:jobId for the result.
    return this.upload.beginUpload(idOrSlug, 'main', undefined, dto);
  }

  @Post('shorts/:shortSlug/upload')
  @ApiOperation({
    summary: 'Upload one SHORT to YouTube',
    description:
      'Same as the main upload but reads packaging from settings.youtube.shorts[shortSlug] '
      + '({{main_url}} substituted with the published main-video link) and defaults the '
      + 'playlist to «шорты». A vertical mp4 becomes a Short automatically. Stores the '
      + 'resulting link back into the short\'s `url`.',
  })
  uploadShort(
    @Param('idOrSlug') idOrSlug: string,
    @Param('shortSlug') shortSlug: string,
    @Body() dto: UploadVideoDto,
  ) {
    // Background job like the main upload — returns { jobId }.
    return this.upload.beginUpload(idOrSlug, 'short', shortSlug, dto);
  }

  @Post('captions')
  @ApiOperation({
    summary: 'Enqueue subtitle generation + upload for the MAIN video',
    description:
      'Queues a CaptionJob: PipelineQueueService transcribes `videoPath` with '
      + 'faster-whisper (→ .srt) and captions.insert-s it onto `videoId`. Returns '
      + 'the created job; poll GET captions for status.',
  })
  enqueueCaptions(@Param('idOrSlug') idOrSlug: string, @Body() body: EnqueueCaptionsBody) {
    return this.captions.enqueue(idOrSlug, body.videoId, body.videoPath, body.language ?? 'ru');
  }

  @Get('captions')
  @ApiOperation({ summary: 'Latest caption job for this project (for polling)' })
  latestCaptions(@Param('idOrSlug') idOrSlug: string) {
    return this.captions.latestForProject(idOrSlug);
  }
}
