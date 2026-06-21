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
import { VoiceoversService } from './voiceovers.service';

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

  @Get()
  @ApiOperation({ summary: 'List the shared voiceover library (закадровая озвучка)' })
  list() {
    return this.svc.list();
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

  @Get(':id')
  @ApiOperation({ summary: 'Get one voiceover with the list of projects it is assigned to' })
  get(@Param('id') id: string) {
    return this.svc.getWithProjects(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a voiceover (label, source link, and/or slug → moves its folder)' })
  rename(@Param('id') id: string, @Body() body: { name?: string; slug?: string; sourceUrl?: string | null }) {
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
    res.setHeader('Content-Type', MIME_BY_EXT[v.ext] ?? 'application/octet-stream');
    res.sendFile(abs);
  }
}
