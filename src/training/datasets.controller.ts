import {
  BadRequestException, Controller, Delete, Get, NotFoundException, Param, Post, Res,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync,
} from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetService } from './dataset.service';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

const REF_EXT_BY_MIME: Record<string, string> = {
  'image/png':  '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};
const ALLOWED_REF_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_REF_BYTES   = 20 * 1024 * 1024;

@ApiTags('Datasets')
@Controller('datasets')
export class DatasetsController {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly dataset: DatasetService,
  ) {}

  @Get('profiles/:profileId/images')
  @ApiOperation({ summary: 'List dataset images currently in COMFY_OUTPUT for a profile' })
  async listImages(@Param('profileId') profileId: string) {
    const profile = await this.profileOrThrow(profileId);
    const items = this.dataset.listImages(profile.profileCode);
    return {
      profileCode: profile.profileCode,
      count:       items.length,
      images:      items,
    };
  }

  @Delete('profiles/:profileId/images/:filename')
  @ApiOperation({ summary: 'Delete a single dataset image by filename' })
  async deleteImage(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
  ) {
    const profile = await this.profileOrThrow(profileId);
    const ok = this.dataset.deleteImage(profile.profileCode, filename);
    if (!ok) throw new NotFoundException(`Image ${filename} not found or invalid name`);
    return { deleted: filename };
  }

  @Get('profiles/:profileId/images/:filename/raw')
  @ApiOperation({ summary: 'Stream a single dataset image (for thumbnails in UI)' })
  async streamImage(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
    @Res()              res:       Response,
  ) {
    const profile = await this.profileOrThrow(profileId);
    const full = this.dataset.resolveImagePath(profile.profileCode, filename);
    if (!full) throw new NotFoundException(`Image ${filename} not found`);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === '.png'  ? 'image/png'
               : ext === '.webp' ? 'image/webp'
               : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
               : 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=300');
    createReadStream(full).pipe(res);
  }

  // ── Reference image (used by ComfyUI dataset workflow as the LoadImage source) ──

  @Get('profiles/:profileId/reference')
  @ApiOperation({ summary: 'Info about the current reference image (filename, size, exists)' })
  async referenceInfo(@Param('profileId') profileId: string) {
    const profile = await this.profileOrThrow(profileId);
    const found = this.findReference(profile);
    if (!found) {
      return { exists: false, profileCode: profile.profileCode };
    }
    const st = statSync(found.fullPath);
    return {
      exists:      true,
      profileCode: profile.profileCode,
      filename:    found.filename,
      size:        st.size,
      mtime:       st.mtimeMs,
    };
  }

  @Get('profiles/:profileId/reference/raw')
  @ApiOperation({ summary: 'Stream the current reference image' })
  async referenceRaw(@Param('profileId') profileId: string, @Res() res: Response) {
    const profile = await this.profileOrThrow(profileId);
    const found = this.findReference(profile);
    if (!found) throw new NotFoundException(`No reference for ${profile.profileCode}`);
    const ext = path.extname(found.filename).toLowerCase();
    const mime = ext === '.png'  ? 'image/png'
               : ext === '.webp' ? 'image/webp'
               : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    createReadStream(found.fullPath).pipe(res);
  }

  @Post('profiles/:profileId/reference')
  @ApiOperation({ summary: 'Upload a new reference image (replaces existing one)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadReference(
    @Param('profileId') profileId: string,
    @UploadedFile()     file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException(`Field "file" is required (multipart/form-data)`);
    if (file.size > MAX_REF_BYTES) {
      throw new BadRequestException(`File too large (${file.size} bytes); max ${MAX_REF_BYTES}`);
    }

    // Choose extension: prefer mime-derived, fall back to original filename
    let ext = REF_EXT_BY_MIME[file.mimetype];
    if (!ext) ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_REF_EXT.has(ext)) {
      throw new BadRequestException(
        `Unsupported image type "${file.mimetype}" / "${ext}". Allowed: png, jpg, webp.`,
      );
    }
    if (ext === '.jpeg') ext = '.jpg';

    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const refDir  = path.join(
      APP_ROOT, 'data', profile.character.project.slug, 'reference', profile.profileCode,
    );
    mkdirSync(refDir, { recursive: true });

    // Wipe any previous reference.* so only the new one remains
    if (existsSync(refDir)) {
      for (const f of readdirSync(refDir)) {
        if (path.parse(f).name === 'reference' && ALLOWED_REF_EXT.has(path.extname(f).toLowerCase())) {
          unlinkSync(path.join(refDir, f));
        }
      }
    }

    const dest = path.join(refDir, `reference${ext}`);
    writeFileSync(dest, file.buffer);

    return {
      uploaded: true,
      path:     dest,
      size:     file.size,
      mime:     file.mimetype,
    };
  }

  @Delete('profiles/:profileId/reference')
  @ApiOperation({ summary: 'Delete the current reference image' })
  async deleteReference(@Param('profileId') profileId: string) {
    const profile = await this.profileOrThrow(profileId);
    const found = this.findReference(profile);
    if (!found) throw new NotFoundException(`No reference for ${profile.profileCode}`);
    unlinkSync(found.fullPath);
    return { deleted: found.filename };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private findReference(profile: { profileCode: string; characterId: string }) {
    // Synchronously walk reference dirs across projects until we find
    // data/<slug>/reference/<profileCode>/reference.<ext>
    // We can determine the slug via DB but to keep this fast we use the
    // profileCode-folder convention and look across all projects.
    const projectsRoot = path.join(APP_ROOT, 'data');
    if (!existsSync(projectsRoot)) return null;
    for (const slug of readdirSync(projectsRoot)) {
      const dir = path.join(projectsRoot, slug, 'reference', profile.profileCode);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        if (path.parse(f).name === 'reference' && ALLOWED_REF_EXT.has(path.extname(f).toLowerCase())) {
          return { filename: f, fullPath: path.join(dir, f) };
        }
      }
    }
    return null;
  }

  private async profileOrThrow(id: string) {
    const p = await this.prisma.characterProfile.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Profile ${id} not found`);
    return p;
  }
}
