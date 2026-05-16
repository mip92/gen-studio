import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { TTSService, StartTTSInput } from './tts.service';

@ApiTags('TTS')
@Controller('tts')
export class TTSController {
  constructor(private readonly tts: TTSService) {}

  @Post('scenes/:sceneId')
  @ApiOperation({
    summary: 'Queue a Silero V5 ru TTS render for a scene',
    description:
      'If `text` is omitted, scene.narrationText is used. The job runs on CPU '
      + 'via a Python subprocess and writes data/<slug>/scenes/<sceneKey>/narration_<voice>_<sr>.wav.',
  })
  start(
    @Param('sceneId') sceneId: string,
    @Body() body: Omit<StartTTSInput, 'sceneId'>,
  ) {
    return this.tts.start({ sceneId, ...body });
  }

  @Get('scenes/:sceneId/jobs')
  @ApiOperation({ summary: 'List TTS jobs for a scene (most recent first)' })
  list(@Param('sceneId') sceneId: string) {
    return this.tts.list(sceneId);
  }

  @Patch('scenes/:sceneId/narration')
  @ApiOperation({
    summary: 'Update Scene narration fields — text and/or script-line refs',
    description: 'All fields optional. Pass only what you want to change. '
              + 'Use {text: ""} to clear, {scriptStartLine: null} to unlink.',
  })
  setNarration(
    @Param('sceneId') sceneId: string,
    @Body() body: { text?: string; scriptStartLine?: number | null; scriptEndLine?: number | null },
  ) {
    return this.tts.setNarrationText(sceneId, body);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get a single TTS job (status, output filename, error)' })
  get(@Param('jobId') jobId: string) {
    return this.tts.get(jobId);
  }

  @Get('jobs/:jobId/file')
  @ApiOperation({ summary: 'Stream the rendered narration.wav' })
  async file(@Param('jobId') jobId: string, @Res({ passthrough: true }) res: Response) {
    const filePath = await this.tts.filePath(jobId);
    if (!filePath) {
      // 200 with empty body keeps the <audio> tag silent until the job is done;
      // throwing 404 spams the console while UI polls.
      res.status(204);
      return null;
    }
    res.set({ 'Content-Type': 'audio/wav' });
    return new StreamableFile(createReadStream(filePath));
  }
}
