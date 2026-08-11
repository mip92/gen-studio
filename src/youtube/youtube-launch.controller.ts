import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LaunchItem, YoutubeLaunchService } from './youtube-launch.service';

interface PrepareBody {
  items: Array<Pick<LaunchItem, 'key' | 'kind' | 'slug' | 'videoPath' | 'thumbPath'>>;
}

/** «Связка-запуск» stepper: main + all shorts of a project, cross-linked, out
 *  together. See YoutubeLaunchService for the step-by-step flow. */
@ApiTags('YouTube')
@Controller('projects/:idOrSlug/youtube/launch')
export class YoutubeLaunchController {
  constructor(private readonly launch: YoutubeLaunchService) {}

  @Get()
  @ApiOperation({ summary: 'Read launch state (per-item subtitle/upload status + current step)' })
  get(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.get(idOrSlug);
  }

  @Post('prepare')
  @ApiOperation({ summary: 'Batch — save prepared files and transcribe every mp4' })
  prepare(@Param('idOrSlug') idOrSlug: string, @Body() body: PrepareBody) {
    return this.launch.prepare(idOrSlug, body.items);
  }

  @Post('prepare-item')
  @ApiOperation({ summary: 'Per-asset — add/replace ONE item (main or short) + transcribe it' })
  prepareItem(@Param('idOrSlug') idOrSlug: string, @Body() item: PrepareBody['items'][number]) {
    return this.launch.prepareItem(idOrSlug, item);
  }

  @Post('upload-item/:key')
  @ApiOperation({ summary: 'Per-asset — upload ONE item as Unlisted (gated on its subtitles; shorts exempt)' })
  uploadItem(@Param('idOrSlug') idOrSlug: string, @Param('key') key: string) {
    return this.launch.uploadItem(idOrSlug, key);
  }

  @Post('transcribe-item/:key')
  @ApiOperation({
    summary: 'Per-asset — put ONE item on transcription by hand (whisper → .srt)',
    description:
      'The main video is transcribed automatically when its files are prepared. A '
      + 'short is not, because its subtitles are optional — this is how an operator '
      + 'asks for them anyway. The .srt lands next to the mp4 and is attached at '
      + 'upload if it is ready by then.',
  })
  transcribeItem(@Param('idOrSlug') idOrSlug: string, @Param('key') key: string) {
    return this.launch.transcribeItem(idOrSlug, key);
  }

  @Post('thumbnail-manual/:key')
  @ApiOperation({ summary: 'Confirm the cover was set by hand in Studio (covers over the API 2MB cap)' })
  confirmThumbnailManual(@Param('idOrSlug') idOrSlug: string, @Param('key') key: string) {
    return this.launch.confirmThumbnailManual(idOrSlug, key);
  }

  @Post('thumbnail/:key')
  @ApiOperation({ summary: 'Send the cover of an already-uploaded item via API (needs ≤2MB)' })
  retryThumbnail(
    @Param('idOrSlug') idOrSlug: string,
    @Param('key') key: string,
    @Body() body: { thumbPath?: string },
  ) {
    return this.launch.retryThumbnail(idOrSlug, key, body?.thumbPath);
  }

  @Post('remove-item/:key')
  @ApiOperation({ summary: 'Remove ONE item from the bundle' })
  removeItem(@Param('idOrSlug') idOrSlug: string, @Param('key') key: string) {
    return this.launch.removeItem(idOrSlug, key);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Step 3 — upload all as Unlisted (attaching pre-made subtitles)' })
  upload(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.startUpload(idOrSlug);
  }

  @Post('confirm-linked')
  @ApiOperation({ summary: 'Step 4 — confirm the manual Studio linking is done' })
  confirmLinked(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.confirmLinked(idOrSlug);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Step 5 — schedule all (main 16:00, shorts 16:05), gated on subtitles' })
  schedule(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.schedule(idOrSlug);
  }

  @Post('publish-now')
  @ApiOperation({ summary: 'Publish all PUBLIC now instead of scheduling (gated on subtitles)' })
  publishNow(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.publishNow(idOrSlug);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Clear launch state (start over)' })
  reset(@Param('idOrSlug') idOrSlug: string) {
    return this.launch.reset(idOrSlug);
  }
}
