import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import * as path from 'path';
import { ShotsService } from './shots.service';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { SceneRenderService } from '../generation/scenes/scene-render.service';
import { ImageValidationService } from '../validation/image-validation.service';

class ParticipantInput {
  @IsString()
  label!: string;

  @IsOptional() @IsUUID()
  characterId?: string | null;

  @IsOptional() @IsUUID()
  profileId?: string | null;
}

class UpdateShotBody extends UpdateShotDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ParticipantInput)
  participants?: ParticipantInput[];
}

class AnimatedPrefixBody {
  /** How many minutes from the start of the film stay fully animated; the rest
   *  becomes static (Ken-Burns stills). */
  @IsNumber()
  minutes!: number;
}

@ApiTags('Shots')
@Controller('projects/:projectId/shots')
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query('sceneId') sceneId?: string,
  ) {
    return this.shotsService.findAll(projectId, sceneId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shot in a scene of this project' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateShotDto) {
    return this.shotsService.create(projectId, dto);
  }

  @Post('render-mode/animated-prefix')
  @ApiOperation({
    summary: 'Bulk: first N minutes (play order) = animated, the rest = static',
  })
  setAnimatedPrefix(
    @Param('projectId') projectId: string,
    @Body() body: AnimatedPrefixBody,
  ) {
    return this.shotsService.setAnimatedPrefix(projectId, body.minutes);
  }

  @Get(':shotId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('shotId') shotId: string,
  ) {
    return this.shotsService.findOne(projectId, shotId);
  }

  @Delete(':shotId')
  remove(
    @Param('projectId') projectId: string,
    @Param('shotId') shotId: string,
  ) {
    return this.shotsService.remove(projectId, shotId);
  }

  @Get(':shotId/participants')
  findParticipants(
    @Param('projectId') projectId: string,
    @Param('shotId') shotId: string,
  ) {
    return this.shotsService.findParticipants(projectId, shotId);
  }
}

/**
 * Standalone shot endpoints — easier to use from the frontend detail page,
 * which only knows the shotId, not the project context.
 */
@ApiTags('Shots')
@Controller('shots')
export class ShotsStandaloneController {
  constructor(
    private readonly shotsService: ShotsService,
    private readonly sceneRender:  SceneRenderService,
    private readonly validation:   ImageValidationService,
  ) {}

  @Get(':shotId')
  @ApiOperation({ summary: 'Get a shot by id (full participants + scene + project)' })
  findById(@Param('shotId') shotId: string) {
    return this.shotsService.findById(shotId);
  }

  @Patch(':shotId')
  @ApiOperation({ summary: 'Update editable shot fields + participants (full replace)' })
  update(@Param('shotId') shotId: string, @Body() dto: UpdateShotBody) {
    return this.shotsService.update(shotId, dto);
  }

  @Delete(':shotId')
  @ApiOperation({ summary: 'Delete a shot' })
  remove(@Param('shotId') shotId: string) {
    return this.shotsService.removeById(shotId);
  }

  // ── Render variants ──────────────────────────────────────────────────────

  @Post(':shotId/renders')
  @ApiOperation({ summary: 'Record a new rendered candidate for this shot' })
  addRender(
    @Param('shotId') shotId: string,
    @Body() body: { filename: string; promptId?: string; seed?: number; strategyId?: string },
  ) {
    return this.shotsService.addRender(shotId, body);
  }

  @Delete(':shotId/renders/:filename')
  @ApiOperation({ summary: 'Remove a rendered candidate from this shot' })
  removeRender(
    @Param('shotId')   shotId:   string,
    @Param('filename') filename: string,
  ) {
    return this.shotsService.removeRender(shotId, filename);
  }

  @Patch(':shotId/chosen-render')
  @ApiOperation({ summary: 'Pick a candidate as the canonical render (null to clear)' })
  setChosenRender(
    @Param('shotId') shotId: string,
    @Body() body: { filename: string | null },
  ) {
    return this.shotsService.setChosenRender(shotId, body.filename);
  }

  @Post(':shotId/validate')
  @ApiOperation({ summary: 'Queue an image-validation pass: the vision model re-scores the current candidates and picks the best' })
  async validate(@Param('shotId') shotId: string) {
    const job = await this.validation.enqueue(shotId, null);
    // Re-checking invalidates whatever was chosen before (by the AI or by hand):
    // clear it so the shot shows "under review" and the fresh pass decides anew.
    if (job) await this.shotsService.setChosenRender(shotId, null);
    return { queued: !!job, jobId: job?.id ?? null };
  }

  @Post(':shotId/apply-suggested-prompt')
  @ApiOperation({ summary: 'Approve the vision model\'s suggested positive prompt (optionally wipe candidates + re-render)' })
  async applySuggestedPrompt(
    @Param('shotId') shotId: string,
    @Body() body: { prompt: string; rerender?: boolean },
  ) {
    if (!body?.prompt || !body.prompt.trim()) {
      throw new BadRequestException('prompt is required');
    }
    const shot = await this.shotsService.setPositivePrompt(shotId, body.prompt.trim());
    if (body.rerender) {
      // Deliberate rework: wipe the failed candidates and queue a fresh batch
      // with the approved prompt (see feedback: invalidate stale renders).
      await this.sceneRender.enqueueRender({ shotId, replace: true });
    }
    return shot;
  }

  @Patch(':shotId/chosen-video')
  @ApiOperation({ summary: 'Approve a completed video render as canonical (null to clear)' })
  setChosenVideo(
    @Param('shotId') shotId: string,
    @Body() body: { videoId: string | null },
  ) {
    return this.shotsService.setChosenVideo(shotId, body.videoId);
  }

  @Get(':shotId/renders/:filename/raw')
  @ApiOperation({
    summary: 'Stream a rendered image from disk (project-tree first, COMFY_OUTPUT fallback)',
  })
  async streamRender(
    @Param('shotId') shotId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const full = await this.sceneRender.resolveRenderPath(shotId, filename);
    if (!full) throw new NotFoundException(`Render ${filename} not found`);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === '.png'  ? 'image/png'
               : ext === '.webp' ? 'image/webp'
               : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
               : 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', String(statSync(full).size));
    res.setHeader('Cache-Control', 'public, max-age=300');
    createReadStream(full).pipe(res);
  }
}
