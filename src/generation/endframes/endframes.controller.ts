import { Body, Controller, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { EndFrameService } from './end-frame.service';

@ApiTags('End frames')
@Controller('generation')
export class EndFramesController {
  constructor(private readonly endFrames: EndFrameService) {}

  @Post('shots/:shotId/end-frames')
  @ApiOperation({
    summary: 'Render the shot\'s END frame by editing its chosen still with Qwen-Image-Edit-2511',
    description:
      'Only for shots that resolve to the two-frame (flf2v) flow — on i2v nothing would consume '
      + 'the result, so it is refused. Requires shot.chosenRender and a non-empty endFramePrompt '
      + 'describing ONLY what is different a few seconds later. Queues ONE job whose batch produces '
      + 'batchSize candidates (default 5), the same shape as a scene render.',
  })
  enqueue(
    @Param('shotId') shotId: string,
    @Body() body: { instruction?: string; seed?: number; batchSize?: number },
  ) {
    return this.endFrames.enqueue(shotId, body ?? {});
  }

  @Get('shots/:shotId/end-frames')
  @ApiOperation({ summary: 'End-frame candidates, the chosen one and its approval state' })
  list(@Param('shotId') shotId: string) {
    return this.endFrames.list(shotId);
  }

  @Post('shots/:shotId/end-frames/choose')
  @ApiOperation({
    summary: 'Pick a candidate as the shot\'s end frame',
    description: 'Always clears the approval — approval is a statement about one specific image.',
  })
  choose(@Param('shotId') shotId: string, @Body() body: { filename: string }) {
    return this.endFrames.choose(shotId, body?.filename);
  }

  @Post('shots/:shotId/end-frames/approve')
  @ApiOperation({
    summary: 'Approve the chosen end frame for animation',
    description: 'A flf2v shot renders its clip on the one-frame flow until this is set.',
  })
  approve(@Param('shotId') shotId: string) {
    return this.endFrames.approve(shotId);
  }

  @Get('shots/:shotId/end-frames/:filename/file')
  @ApiOperation({ summary: 'Serve an end-frame image' })
  async file(
    @Param('shotId') shotId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const full = await this.endFrames.filePath(shotId, filename);
    if (!full) throw new NotFoundException(`End frame "${filename}" not found for shot ${shotId}`);
    res.type('image/png');
    createReadStream(full).pipe(res);
  }
}
