import { Body, Controller, Get, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { VideoRenderService } from './video-render.service';
import { StartVideoInput } from './video-job.types';

@ApiTags('Videos')
@Controller('generation')
export class VideosController {
  constructor(private readonly videos: VideoRenderService) {}

  @Post('shots/:shotId/videos')
  @ApiOperation({
    summary: 'Start a Wan2.2 image-to-video render from the shot\'s chosen render',
    description: 'Requires shot.chosenRender to be set. Queues the i2v workflow with the given motionPrompt and returns the VideoRender row.',
  })
  start(@Param('shotId') shotId: string, @Body() body: Omit<StartVideoInput, 'shotId'>) {
    return this.videos.start({ shotId, ...body });
  }

  @Post('shots/:shotId/videos/auto-prompt')
  @ApiOperation({
    summary: 'Suggest a motion prompt by Florence-2-captioning the chosen render',
    description: 'Slow (~30 s — loads Florence-2 once per call). Returns { caption, motionPrompt } — caller can edit before POSTing /videos.',
  })
  autoPrompt(@Param('shotId') shotId: string) {
    return this.videos.autoMotionPrompt(shotId);
  }

  @Get('shots/:shotId/videos')
  @ApiOperation({ summary: 'List all video renders for a shot' })
  list(@Param('shotId') shotId: string) {
    return this.videos.list(shotId);
  }

  @Get('videos/:videoId')
  @ApiOperation({ summary: 'Get a single video render record (incl. status, output filename)' })
  get(@Param('videoId') videoId: string) {
    return this.videos.get(videoId);
  }

  @Get('videos/:videoId/file')
  @ApiOperation({ summary: 'Stream the rendered mp4' })
  async file(@Param('videoId') videoId: string, @Res({ passthrough: true }) res: Response) {
    const filePath = await this.videos.filePath(videoId);
    res.set({ 'Content-Type': 'video/mp4' });
    return new StreamableFile(createReadStream(filePath));
  }
}
