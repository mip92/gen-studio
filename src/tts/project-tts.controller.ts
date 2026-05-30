import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { TTS_ENGINES, type TTSEngine } from './tts.service';

const APP_ROOT       = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const MAX_REF_BYTES  = 12 * 1024 * 1024;   // 12 MB — generous for 15s WAV at 48 kHz mono
const ALLOWED_EXT    = new Set(['.wav', '.mp3', '.m4a', '.flac', '.ogg']);
const EXT_BY_MIME: Record<string, string> = {
  'audio/wav':   '.wav',
  'audio/x-wav': '.wav',
  'audio/mpeg':  '.mp3',
  'audio/mp4':   '.m4a',
  'audio/flac':  '.flac',
  'audio/ogg':   '.ogg',
};

/** Slug guard for emotion-ref names. Keeps filesystem paths and `<input
 *  list>` autocomplete clean — only lowercase ASCII letters, digits, and
 *  hyphens. Validated on the way in so a bogus name never reaches disk. */
const EMOTION_NAME_RE = /^[a-z][a-z0-9_-]{0,31}$/;

function projectDataRoot(slug: string): string {
  return path.join(APP_ROOT, 'data', slug, 'tts');
}

function emotionRefDir(slug: string): string {
  return path.join(projectDataRoot(slug), 'emotion_refs');
}

@ApiTags('Project TTS')
@Controller('projects/:projectId/tts')
export class ProjectTTSController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Engine switch ──────────────────────────────────────────────────────

  @Patch('engine')
  @ApiOperation({ summary: 'Switch the project TTS engine (silero | xtts2 | f5)' })
  async setEngine(
    @Param('projectId') projectId: string,
    @Body() body: { engine: TTSEngine },
  ) {
    if (!body?.engine || !(TTS_ENGINES as readonly string[]).includes(body.engine)) {
      throw new BadRequestException(
        `engine must be one of: ${TTS_ENGINES.join(', ')} (got: ${body?.engine})`,
      );
    }
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return this.prisma.project.update({
      where: { id: projectId },
      data:  { ttsEngine: body.engine },
      select: { id: true, slug: true, ttsEngine: true, ttsVoiceRefPath: true },
    });
  }

  // ── Voice reference (1 per project) ────────────────────────────────────

  @Post('voice-reference')
  @ApiOperation({ summary: 'Upload the project voice reference (replaces existing)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVoiceRef(
    @Param('projectId') projectId: string,
    @UploadedFile()     file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException(`Field "file" is required (multipart/form-data)`);
    if (file.size > MAX_REF_BYTES) {
      throw new BadRequestException(`File too large (${file.size} bytes); max ${MAX_REF_BYTES}`);
    }
    const ext = pickAudioExt(file);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const dir = projectDataRoot(project.slug);
    mkdirSync(dir, { recursive: true });

    // One slot per project: wipe any previous voice_reference.* before write.
    for (const f of readdirSync(dir)) {
      if (f.startsWith('voice_reference.')) {
        try { unlinkSync(path.join(dir, f)); } catch { /* best-effort */ }
      }
    }

    const filename     = `voice_reference${ext}`;
    const absolutePath = path.join(dir, filename);
    writeFileSync(absolutePath, file.buffer);

    // Store project-relative path (portable across machines if APP_ROOT shifts).
    const relativePath = path.posix.join('data', project.slug, 'tts', filename);
    await this.prisma.project.update({
      where: { id: projectId },
      data:  { ttsVoiceRefPath: relativePath },
    });
    return { ok: true, path: relativePath, bytes: file.size };
  }

  @Delete('voice-reference')
  @ApiOperation({ summary: 'Remove the project voice reference (file + DB pointer)' })
  async deleteVoiceRef(@Param('projectId') projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.ttsVoiceRefPath) {
      const abs = path.isAbsolute(project.ttsVoiceRefPath)
        ? project.ttsVoiceRefPath
        : path.join(APP_ROOT, project.ttsVoiceRefPath);
      try { unlinkSync(abs); } catch { /* best-effort — file may already be gone */ }
    }
    await this.prisma.project.update({
      where: { id: projectId },
      data:  { ttsVoiceRefPath: null },
    });
    return { ok: true };
  }

  // ── Emotion references (named library) ─────────────────────────────────

  @Get('emotion-refs')
  @ApiOperation({ summary: 'List project emotion references' })
  async listEmotionRefs(@Param('projectId') projectId: string) {
    return this.prisma.projectTTSEmotionRef.findMany({
      where:   { projectId },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, filePath: true, createdAt: true },
    });
  }

  @Post('emotion-refs/:name')
  @ApiOperation({ summary: 'Upload a named emotion reference (replaces same-named existing)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEmotionRef(
    @Param('projectId') projectId: string,
    @Param('name')      rawName: string,
    @UploadedFile()     file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException(`Field "file" is required (multipart/form-data)`);
    if (file.size > MAX_REF_BYTES) {
      throw new BadRequestException(`File too large (${file.size} bytes); max ${MAX_REF_BYTES}`);
    }
    const name = (rawName ?? '').trim().toLowerCase();
    if (!EMOTION_NAME_RE.test(name)) {
      throw new BadRequestException(
        `Emotion ref name must match ${EMOTION_NAME_RE} (lowercase letter, then a-z 0-9 _ -; 1–32 chars)`,
      );
    }
    const ext = pickAudioExt(file);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const dir = emotionRefDir(project.slug);
    mkdirSync(dir, { recursive: true });

    // One slot per name: wipe any previous <name>.* before write.
    for (const f of readdirSync(dir)) {
      if (f.startsWith(`${name}.`)) {
        try { unlinkSync(path.join(dir, f)); } catch { /* best-effort */ }
      }
    }

    const filename     = `${name}${ext}`;
    const absolutePath = path.join(dir, filename);
    writeFileSync(absolutePath, file.buffer);

    const relativePath = path.posix.join('data', project.slug, 'tts', 'emotion_refs', filename);
    return this.prisma.projectTTSEmotionRef.upsert({
      where:  { projectId_name: { projectId, name } },
      create: { projectId, name, filePath: relativePath },
      update: { filePath: relativePath },
      select: { id: true, name: true, filePath: true, createdAt: true },
    });
  }

  @Delete('emotion-refs/:name')
  @ApiOperation({ summary: 'Remove a named emotion reference (file + DB row)' })
  async deleteEmotionRef(
    @Param('projectId') projectId: string,
    @Param('name')      rawName: string,
  ) {
    const name = (rawName ?? '').trim().toLowerCase();
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const refRow = await this.prisma.projectTTSEmotionRef.findUnique({
      where: { projectId_name: { projectId, name } },
    });
    if (!refRow) throw new NotFoundException(`Emotion ref "${name}" not found in project`);

    const abs = path.isAbsolute(refRow.filePath)
      ? refRow.filePath
      : path.join(APP_ROOT, refRow.filePath);
    try { unlinkSync(abs); } catch { /* best-effort */ }
    await this.prisma.projectTTSEmotionRef.delete({ where: { id: refRow.id } });
    return { ok: true };
  }
}

function pickAudioExt(file: Express.Multer.File): string {
  let ext = EXT_BY_MIME[file.mimetype];
  if (!ext) ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new BadRequestException(
      `Unsupported audio type "${file.mimetype}" / "${ext}". Allowed: ${[...ALLOWED_EXT].join(', ')}.`,
    );
  }
  return ext;
}
