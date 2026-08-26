import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream, statSync } from 'fs';
import type { Request, Response } from 'express';
import { BgmService } from './bgm.service';
import { BgmRenderService } from './bgm-render.service';
import {
  CreateBlockInput,
  UpdateBlockInput,
  CreateSegmentInput,
  UpdateSegmentInput,
  StartRenderInput,
  ACE_BPM_MIN,
  ACE_BPM_MAX,
  ACE_KEYSCALES,
  ACE_TIMESIGNATURES,
} from './bgm.types';

@ApiTags('BGM')
@Controller('bgm')
export class BgmController {
  constructor(
    private readonly bgm:    BgmService,
    private readonly render: BgmRenderService,
  ) {}

  // ── Reference data ────────────────────────────────────────────────────────

  @Get('meta-options')
  @ApiOperation({
    summary: 'Valid ACE-Step metadata values (bpm bounds, keyscale + timesignature combos)',
    description:
      'Mirrors the combo options of the TextEncodeAceStepAudio1.5 node. Served so the '
      + 'UI selects cannot drift from the node — an unknown combo value fails ComfyUI '
      + 'prompt validation, and the queue is single-slot.',
  })
  metaOptions() {
    return {
      bpm:            { min: ACE_BPM_MIN, max: ACE_BPM_MAX },
      keyscales:      ACE_KEYSCALES,
      timesignatures: ACE_TIMESIGNATURES,
    };
  }

  @Post('lint')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Review a caption (and an optional lyrics arc) without saving it',
    description:
      'The editor calls this while you type, so the warning you see and the 400 you get on save '
      + 'come from the SAME function. The UI used to carry a hand-written twin of the rules that '
      + 'knew 3 of them; two independent copies of a rule set is the drift this endpoint removes. '
      + 'Pure function — nothing is written.',
  })
  lint(@Body() body: { caption?: string; lyrics?: string; allowThin?: boolean }) {
    return this.bgm.lintCaption(body ?? {});
  }

  @Get('audit')
  @ApiOperation({
    summary: 'Audit every act caption / tile override against the ACE-Step rules',
    description:
      'Same function as the write gate (captionIssues), so the report and the refusal can never '
      + 'disagree. Read-only. `projectId` narrows the scan; `includeClean=1` also lists blocks with '
      + 'no findings. `released` marks films already on YouTube — those are frozen, do not edit them.',
  })
  auditCaptions(
    @Query('projectId')    projectId?: string,
    @Query('includeClean') includeClean?: string,
  ) {
    return this.bgm.auditCaptions({
      ...(projectId ? { projectId } : {}),
      includeClean: includeClean === '1' || includeClean === 'true',
    });
  }

  // ── Blocks ────────────────────────────────────────────────────────────────

  @Post('projects/:projectId/blocks')
  @ApiOperation({ summary: 'Create a NarrativeBlock for a project (a music act — mirrors one Scene/act)' })
  createBlock(@Param('projectId') projectId: string, @Body() body: Omit<CreateBlockInput, 'projectId'>) {
    return this.bgm.createBlock({ projectId, ...body });
  }

  @Get('projects/:projectId/blocks')
  @ApiOperation({ summary: 'List blocks for a project with their segments + jobs' })
  listBlocks(@Param('projectId') projectId: string) {
    return this.bgm.listBlocks(projectId);
  }

  @Get('blocks/:blockId')
  @ApiOperation({ summary: 'Get a single block with segments + jobs' })
  getBlock(@Param('blockId') blockId: string) {
    return this.bgm.getBlock(blockId);
  }

  @Patch('blocks/:blockId')
  @ApiOperation({ summary: 'Update block fields (title, sortOrder, moodPrompt, bpm, keyscale, timesignature, shotIds, status)' })
  updateBlock(@Param('blockId') blockId: string, @Body() body: UpdateBlockInput) {
    return this.bgm.updateBlock(blockId, body);
  }

  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'Hard-delete a block (cascades to its segments and audio jobs)' })
  deleteBlock(@Param('blockId') blockId: string) {
    return this.bgm.deleteBlock(blockId);
  }

  @Post('blocks/:blockId/recompute-target')
  @ApiOperation({ summary: 'Recompute the block targetSeconds from its covered shots' })
  recomputeTarget(@Param('blockId') blockId: string) {
    return this.bgm.recomputeTarget(blockId);
  }

  @Post('blocks/:blockId/fill')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Auto-create empty MusicSegment rows to cover the block target duration',
    description:
      'No GPU work happens here — segments are queued via POST /bgm/segments/:id/render afterwards. Refuses if block status is "manual".',
  })
  fillBlock(
    @Param('blockId') blockId: string,
    @Query('chunkSeconds') chunkSeconds?: string,
  ) {
    const chunk = chunkSeconds ? Number(chunkSeconds) : undefined;
    return this.bgm.fillBlock(blockId, chunk !== undefined ? { chunkSeconds: chunk } : {});
  }

  // ── Segments ──────────────────────────────────────────────────────────────

  @Get('segments/:segmentId')
  @ApiOperation({
    summary: 'Get a single MusicSegment with parent block reference + render jobs',
    description: 'Lightweight single-segment view used by the Telegram bot to '
              + 'refresh approval state after a tap. Use /bgm/projects/:id/blocks '
              + 'for the full project tree.',
  })
  getSegment(@Param('segmentId') segmentId: string) {
    return this.bgm.getSegment(segmentId);
  }

  @Post('segments')
  @ApiOperation({ summary: 'Create a single MusicSegment manually under a block' })
  createSegment(@Body() body: CreateSegmentInput) {
    return this.bgm.createSegment(body);
  }

  @Patch('segments/:segmentId')
  @ApiOperation({
    summary: 'Update one tile (prompt override, bpm, keyscale, timesignature, durationSec, spare)',
    description:
      'Each meta is nullable: a value overrides the block, null inherits it. Changing '
      + 'the prompt clears the segment approval, since the approved flac no longer '
      + 'matches what the prompt asks for — delete the stale takes too.',
  })
  updateSegment(@Param('segmentId') segmentId: string, @Body() body: UpdateSegmentInput) {
    return this.bgm.updateSegment(segmentId, body);
  }

  @Delete('segments/:segmentId')
  @ApiOperation({ summary: 'Hard-delete a segment (cascades to its audio jobs)' })
  deleteSegment(@Param('segmentId') segmentId: string) {
    return this.bgm.deleteSegment(segmentId);
  }

  @Post('segments/:segmentId/move')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Move a tile one step up/down within its act (exporter placement order)',
    description:
      'Swaps the tile with its neighbour in the combined main+spare order. The spare flag '
      + 'follows the position — promoting a spare demotes the displaced main tile. Takes and '
      + 'approvals travel with the tile. Returns the refreshed block.',
  })
  moveSegment(@Param('segmentId') segmentId: string, @Body() body: { direction: 'up' | 'down' }) {
    return this.bgm.moveSegment(segmentId, body?.direction);
  }

  @Post('segments/:segmentId/approve/:jobId')
  @ApiOperation({ summary: 'Approve an AudioRenderJob as the canonical take for its segment' })
  approve(@Param('segmentId') segmentId: string, @Param('jobId') jobId: string) {
    return this.bgm.approveJob(jobId, segmentId);
  }

  @Delete('segments/:segmentId/approve')
  @ApiOperation({ summary: 'Clear segment approval (no canonical take)' })
  unapprove(@Param('segmentId') segmentId: string) {
    return this.bgm.approveJob(null, segmentId);
  }

  // ── Render jobs ───────────────────────────────────────────────────────────

  @Post('segments/:segmentId/render')
  @ApiOperation({
    summary: 'Queue one or more ACE-Step AudioRenderJob rows for a segment',
    description:
      'Each row is dispatched by PipelineQueueService.tick() — same single-slot FIFO as image/video/training jobs.',
  })
  startRender(
    @Param('segmentId') segmentId: string,
    @Body() body: Omit<StartRenderInput, 'segmentId'>,
  ) {
    return this.render.start({ segmentId, ...body });
  }

  @Get('segments/:segmentId/jobs')
  @ApiOperation({ summary: 'List audio render jobs for a segment, newest first' })
  listJobs(@Param('segmentId') segmentId: string) {
    return this.render.list(segmentId);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get a single AudioRenderJob (status, params, output filename)' })
  getJob(@Param('jobId') jobId: string) {
    return this.render.get(jobId);
  }

  @Get('jobs/:jobId/file')
  @ApiOperation({ summary: 'Stream the rendered flac with HTTP Range support (200/206/204)' })
  async file(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const fp = await this.render.filePath(jobId);
    if (!fp) { res.status(204).end(); return; }

    const total = statSync(fp).size;
    // Accept-Ranges + Content-Length is what makes <audio controls> show a
    // working seek slider. Without these the browser doesn't know total
    // length, can't request byte ranges, and the timeline scrubber breaks.
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'audio/flac');
    // Disable response compression — gzip on a flac stream wastes CPU and
    // hides Content-Length from intermediaries which can re-break seeking.
    res.setHeader('Cache-Control', 'no-transform');

    const range = req.headers.range;
    if (!range) {
      res.setHeader('Content-Length', String(total));
      createReadStream(fp).pipe(res);
      return;
    }

    // Parse `Range: bytes=START-END` (either end may be empty).
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
    createReadStream(fp, { start, end }).pipe(res);
  }

  @Get('jobs/:jobId/meta')
  @ApiOperation({ summary: 'File size + computed bitrate for the rendered flac' })
  async meta(@Param('jobId') jobId: string) {
    return this.render.meta(jobId);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({ summary: 'Hard-delete an AudioRenderJob (row + flac + clears segment approval)' })
  deleteJob(@Param('jobId') jobId: string) {
    return this.render.delete(jobId);
  }
}
