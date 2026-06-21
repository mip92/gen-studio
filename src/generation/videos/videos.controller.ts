import { Body, Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream, statSync } from 'fs';
import type { Request, Response } from 'express';
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
  @ApiOperation({ summary: 'Stream the rendered mp4 with HTTP Range support (200/206/416)' })
  async file(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.videos.filePath(videoId);
    streamMp4WithRange(filePath, req, res);
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
  @ApiOperation({ summary: 'Stream the upscaled FHD mp4 with HTTP Range support (only available once upscaleStatus = completed)' })
  async fileFhd(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.videos.upscaledFilePath(videoId);
    streamMp4WithRange(filePath, req, res);
  }

  @Post('videos/:videoId/interpolate')
  @ApiOperation({
    summary: 'Queue an FPS interpolation (RIFE/FILM → 2× framerate) of the upscaled clip',
    description: 'Mandatory final step. Requires upscaleStatus=completed (operates on the FHD clip). Idempotent. The smoothed mp4 is served at /videos/:id/file-smooth once done. Optional body { multiplier: 2-8 }.',
  })
  interpolate(@Param('videoId') videoId: string, @Body() body: { multiplier?: number } = {}) {
    return this.videos.interpolate(videoId, body?.multiplier);
  }

  @Get('videos/:videoId/file-smooth')
  @ApiOperation({ summary: 'Stream the FPS-interpolated (smoothed) mp4 with HTTP Range support (only once interpStatus = completed)' })
  async fileSmooth(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.videos.interpolatedFilePath(videoId);
    streamMp4WithRange(filePath, req, res);
  }
}

/**
 * Stream an mp4 honouring HTTP Range. Mobile browsers (iOS Safari especially)
 * send `Range: bytes=...` for <video> and refuse to play a plain 200 response
 * with no Accept-Ranges — so we must answer 206 with Content-Range. Mirrors the
 * BGM controller's audio streamer.
 */
function streamMp4WithRange(filePath: string, req: Request, res: Response): void {
  const total = statSync(filePath).size;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'video/mp4');
  // Don't let any intermediary gzip the stream — that hides Content-Length and
  // re-breaks seeking/playback.
  res.setHeader('Cache-Control', 'no-transform');

  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Length', String(total));
    createReadStream(filePath).pipe(res);
    return;
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m) {
    res.setHeader('Content-Range', `bytes */${total}`);
    res.status(416).end();
    return;
  }
  const start = m[1] === '' ? 0 : Number.parseInt(m[1], 10);
  const end   = m[2] === '' ? total - 1 : Math.min(Number.parseInt(m[2], 10), total - 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    res.setHeader('Content-Range', `bytes */${total}`);
    res.status(416).end();
    return;
  }
  res.status(206);
  res.setHeader('Content-Range',  `bytes ${start}-${end}/${total}`);
  res.setHeader('Content-Length', String(end - start + 1));
  createReadStream(filePath, { start, end }).pipe(res);
}
