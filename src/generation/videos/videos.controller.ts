import { Body, Controller, Delete, Get, Param, Post, Res, StreamableFile } from '@nestjs/common';
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

  @Delete('videos/:videoId')
  @ApiOperation({
    summary: 'Hard-delete a video render (DB row + preview mp4 + FHD mp4 + stale COMFY_INPUT copies)',
    description: 'Also clears shot.chosenVideoId if it pointed at this video.',
  })
  remove(@Param('videoId') videoId: string) {
    return this.videos.delete(videoId);
  }

  @Post('videos/:videoId/upscale')
  @ApiOperation({
    summary: 'Queue a 4x-UltraSharp upscale → 1920×1080 of a completed video',
    description: 'Idempotent. The original 832×480 preview stays in place; the FHD output lands at /videos/:id/file-fhd once done.',
  })
  upscale(@Param('videoId') videoId: string) {
    return this.videos.upscale(videoId);
  }

  @Get('videos/:videoId/file-fhd')
  @ApiOperation({ summary: 'Stream the upscaled FHD mp4 (only available once upscaleStatus = completed)' })
  async fileFhd(@Param('videoId') videoId: string, @Res({ passthrough: true }) res: Response) {
    const filePath = await this.videos.upscaledFilePath(videoId);
    res.set({ 'Content-Type': 'video/mp4' });
    return new StreamableFile(createReadStream(filePath));
  }
}
