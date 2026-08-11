import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { existsSync } from 'fs';
import * as path from 'path';
import { VoiceoversService } from './voiceovers.service';
import { ARTIFACT_PROFILES } from '../tts/artifact-profiles';

const MIME_BY_EXT: Record<string, string> = {
  '.wav':  'audio/wav',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.flac': 'audio/flac',
  '.ogg':  'audio/ogg',
};

@ApiTags('Voiceovers')
@Controller('voiceovers')
export class VoiceoversController {
  constructor(private readonly svc: VoiceoversService) {}

  /** Send an audio file with the right Content-Type for in-browser playback. */
  private streamAudio(res: Response, absPath: string, ext: string) {
    res.setHeader('Content-Type', MIME_BY_EXT[ext] ?? 'application/octet-stream');
    res.sendFile(absPath);
  }

  @Get()
  @ApiOperation({ summary: 'List the shared voiceover library (закадровая озвучка)' })
  list() {
    return this.svc.list();
  }

  // Declared BEFORE @Get(':id') so "artifact-profiles" is not swallowed as an id.
  @Get('artifact-profiles')
  @ApiOperation({
    summary: 'The leading-bleed («понь» / «ща») profiles a voice can be assigned',
    description: 'Options for Voiceover.artifactProfile. Empty is always allowed and means '
              + 'the voice does not bleed, so trimming is refused for it.',
  })
  artifactProfiles() {
    return ARTIFACT_PROFILES.map((p) => ({ key: p.key, label: p.label, hint: p.hint }));
  }

  @Post()
  @ApiOperation({ summary: 'Add a clip to the library (dedupes identical files by md5)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file:      { type: 'string', format: 'binary' },
        name:      { type: 'string' },
        slug:      { type: 'string' },
        sourceUrl: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name?: string; slug?: string; sourceUrl?: string },
  ) {
    if (!file) throw new BadRequestException('Field "file" is required (multipart/form-data)');
    return this.svc.createFromBuffer(file.buffer, file.originalname, file.mimetype, {
      name:      body?.name,
      slug:      body?.slug,
      sourceUrl: body?.sourceUrl,
    });
  }

  // ── Import + trim (source → staging → trimmed clip). Literal `source/*`
  //    routes are declared before `:id` so they win the match. ───────────────

  @Post('source/youtube')
  @ApiOperation({ summary: 'Fetch a YouTube URL audio track into staging for trimming' })
  youtubeSource(@Body() body: { url?: string }) {
    if (!body?.url) throw new BadRequestException('Field "url" is required');
    return this.svc.createYoutubeSource(body.url);
  }

  @Post('source/upload')
  @ApiOperation({ summary: 'Upload an audio file into staging for trimming' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  uploadSource(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Field "file" is required (multipart/form-data)');
    return this.svc.createUploadSource(file.buffer, file.originalname, file.mimetype);
  }

  @Get('source/:token/raw')
  @ApiOperation({ summary: 'Stream a staged source clip for the waveform editor' })
  sourceRaw(@Param('token') token: string, @Res() res: Response) {
    const { absPath, ext } = this.svc.stagingSource(token);
    this.streamAudio(res, absPath, ext);
  }

  @Post('source/:token/save')
  @ApiOperation({ summary: 'Commit a staged source at [startMs,endMs] into a new library voice' })
  saveSource(
    @Param('token') token: string,
    @Body() body: { name?: string; startMs: number; endMs: number },
  ) {
    return this.svc.saveFromStaging(token, {
      name:    body?.name,
      startMs: body?.startMs,
      endMs:   body?.endMs,
    });
  }

  @Delete('source/:token')
  @ApiOperation({ summary: 'Discard a staged source (cancel the import)' })
  discardSource(@Param('token') token: string) {
    return this.svc.discardStaging(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one voiceover with the list of projects it is assigned to' })
  get(@Param('id') id: string) {
    return this.svc.getWithProjects(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit a voiceover (label, source link, bleed profile, and/or slug → moves its folder)',
    description: 'artifactProfile opts this voice into leading-bleed trimming: "pon" | "sha", '
              + 'or null/"" for a voice that does not bleed (the default — trimming stays off).',
  })
  rename(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; sourceUrl?: string | null; artifactProfile?: string | null },
  ) {
    return this.svc.rename(id, body ?? {});
  }

  @Put(':id/projects')
  @ApiOperation({ summary: 'Set the exact list of projects assigned to this voiceover' })
  setProjects(@Param('id') id: string, @Body() body: { projectIds?: string[] }) {
    return this.svc.setProjects(id, Array.isArray(body?.projectIds) ? body.projectIds : []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a voiceover (refuses while assigned unless force=true)' })
  remove(@Param('id') id: string, @Query('force') force?: string) {
    return this.svc.remove(id, force === 'true');
  }

  @Get(':id/raw')
  @ApiOperation({ summary: 'Stream the voiceover clip for in-browser preview' })
  async raw(@Param('id') id: string, @Res() res: Response) {
    const v   = await this.svc.get(id);
    const abs = this.svc.absPath(v);
    if (!existsSync(abs)) {
      res.status(404).json({ error: `voiceover file missing on disk: ${v.filePath}` });
      return;
    }
    this.streamAudio(res, abs, v.ext);
  }

  @Get(':id/source/raw')
  @ApiOperation({ summary: 'Stream the retained untrimmed source clip (for re-trimming)' })
  async sourceOfVoice(@Param('id') id: string, @Res() res: Response) {
    const v   = await this.svc.get(id);
    const abs = this.svc.sourceAbsPath(v);
    if (!abs || !existsSync(abs)) {
      res.status(404).json({ error: 'no retained source for this voice' });
      return;
    }
    this.streamAudio(res, abs, path.extname(abs).toLowerCase());
  }

  @Patch(':id/trim')
  @ApiOperation({ summary: 'Re-cut an existing voice from its retained source at a new [startMs,endMs]' })
  retrim(@Param('id') id: string, @Body() body: { startMs: number; endMs: number }) {
    return this.svc.retrim(id, body?.startMs, body?.endMs);
  }
}
