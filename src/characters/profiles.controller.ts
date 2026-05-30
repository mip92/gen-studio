import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import { CharactersService } from './characters.service';
import { AnchorRenderService } from './anchor-render.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly chars:  CharactersService,
    private readonly anchor: AnchorRenderService,
  ) {}

  @Get(':profileId')
  @ApiOperation({ summary: 'Get a character profile by id (with character + project)' })
  findOne(@Param('profileId') profileId: string) {
    return this.chars.findProfileById(profileId);
  }

  @Get(':profileId/summary')
  @ApiOperation({
    summary: 'Per-profile readiness summary (dataset count, LoRA, last jobs, phase)',
    description: 'Project-independent. Drives the persona detail page (/characters/:profileId) without any project context.',
  })
  summary(@Param('profileId') profileId: string) {
    return this.chars.profileSummary(profileId);
  }

  @Patch(':profileId')
  @ApiOperation({ summary: 'Update editable profile fields (prompts, age, target, trigger)' })
  update(@Param('profileId') profileId: string, @Body() dto: UpdateProfileDto) {
    return this.chars.updateProfile(profileId, dto as Record<string, unknown>);
  }

  @Get(':profileId/loras')
  @ApiOperation({ summary: 'Rescan + list LoRA variants for this profile (final + epochs)' })
  listLoras(@Param('profileId') profileId: string) {
    return this.chars.listLoras(profileId);
  }

  @Post(':profileId/loras/active')
  @ApiOperation({ summary: 'Mark one LoRA variant as the default (sets profile.loraPath)' })
  setActiveLora(
    @Param('profileId') profileId: string,
    @Body() body: { filename?: string },
  ) {
    if (!body?.filename) throw new BadRequestException('filename is required');
    return this.chars.setActiveLora(profileId, body.filename);
  }

  @Delete(':profileId/loras/:filename')
  @ApiOperation({ summary: 'Delete a LoRA variant (file + DB list); repoints active if needed' })
  deleteLora(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
  ) {
    return this.chars.deleteLora(profileId, filename);
  }

  // ── Anchor portrait (cartoon-style identity) ───────────────────────────────

  @Post(':profileId/generate-anchor')
  @ApiOperation({
    summary: 'Queue anchor portrait render for a character profile',
    description:
      'Enqueues an anchor-render job (anchor_render_jobs table). PipelineQueueService '
      + 'picks it up on the next tick (5s), auto-starts ComfyUI if not running, '
      + 'submits to the project\'s anchor workflow, polls for completion, and '
      + 'copies the resulting PNG into data/<projectSlug>/reference/<profileCode>_anchor.png. '
      + 'Returns the new job row immediately — UI polls GET /profiles/:id/anchor-jobs '
      + 'or GET /profiles/:id/anchor to learn completion status. Cartoon-style identity '
      + 'pipeline only (graphic_novel_cell_shaded etc.); photoreal projects use character-LoRA.',
  })
  async generateAnchor(@Param('profileId') profileId: string) {
    return this.anchor.enqueue(profileId);
  }

  @Get(':profileId/anchor-jobs')
  @ApiOperation({
    summary: 'List anchor-render jobs for a profile (newest first, 50 max)',
    description: 'UI polls this to learn job status — pending / running / completed / failed.',
  })
  async listAnchorJobs(@Param('profileId') profileId: string) {
    return this.anchor.list(profileId);
  }

  @Get(':profileId/anchor')
  @ApiOperation({
    summary: 'Get anchor portrait path for a profile (if it exists)',
    description: 'Returns null if no anchor has been generated yet. Path is absolute on disk.',
  })
  async getAnchor(@Param('profileId') profileId: string) {
    const p = await this.anchor.getAnchorPath(profileId);
    return { profileId, anchorPath: p, exists: p !== null };
  }

  @Delete(':profileId/anchor')
  @ApiOperation({
    summary: 'Delete the anchor portrait PNG for this profile',
    description:
      'Removes the anchor file from data/<slug>/reference/. Returns the deleted '
      + 'paths. Idempotent — safe to call when no anchor exists (returns empty list).',
  })
  async deleteAnchor(@Param('profileId') profileId: string) {
    const deleted = await this.anchor.deleteAnchor(profileId);
    return { profileId, deleted, count: deleted.length };
  }

  @Get(':profileId/anchor/raw')
  @ApiOperation({
    summary: 'Stream the anchor PNG file (for <img src=...>)',
    description: '200 + image/png stream on success; 404 if no anchor generated yet.',
  })
  async getAnchorRaw(
    @Param('profileId') profileId: string,
    @Res()              res:       Response,
  ) {
    const p = await this.anchor.getAnchorPath(profileId);
    if (!p) throw new NotFoundException(`No anchor for profile ${profileId}`);
    const stat = statSync(p);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', stat.size);
    // Short cache — anchor can be regenerated; UI cache-busts with mtime query.
    res.setHeader('Cache-Control', 'private, max-age=10');
    createReadStream(p).pipe(res);
  }

  @Post(':profileId/upload-anchor')
  @ApiOperation({
    summary: 'Upload an externally-supplied anchor portrait (PNG/JPG) for a profile',
    description:
      'Stores the uploaded file as data/<slug>/reference/<profileCode>_anchor.png, '
      + 'overwriting any existing anchor. Use this when you already have a portrait '
      + '(from a photo shoot, Nano Banana, or any other source) and prefer not to '
      + 'regenerate via ComfyUI. multipart/form-data, field name "file", max 10 MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnchor(
    @Param('profileId') profileId: string,
    @UploadedFile()     file:      Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('field "file" is required (multipart/form-data)');
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) throw new BadRequestException(`file too large (${file.size}); max ${MAX}`);
    const anchorPath = await this.anchor.uploadAnchor(profileId, file.buffer);
    return { profileId, anchorPath, sizeBytes: file.size };
  }

  @Get(':profileId/style-readiness')
  @ApiOperation({
    summary: 'Per-style identity-asset readiness for a profile',
    description:
      'Returns readiness flag + asset paths for EACH registered visual style. '
      + 'Photoreal styles need a trained LoRA (loraPath); cartoon styles need '
      + 'an anchor portrait PNG (anchorPath). UI uses this to badge characters '
      + 'with "photoreal-ready / cartoon-ready / neither" indicators and to '
      + 'route the user to the right generate-button. See docs/VISUAL_STYLE_ARCHITECTURE.md.',
  })
  async styleReadiness(@Param('profileId') profileId: string) {
    return this.anchor.getStyleReadiness(profileId);
  }
}
