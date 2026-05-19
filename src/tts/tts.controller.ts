import {
  Body,
  Controller,
  Delete,
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
import { TTSService, StartTTSInput, StartShotTTSInput } from './tts.service';

@ApiTags('TTS')
@Controller('tts')
export class TTSController {
  constructor(private readonly tts: TTSService) {}

  @Post('scenes/:sceneId')
  @ApiOperation({
    summary: 'Queue a Silero TTS render for a scene',
    description:
      'If `text` is omitted, scene.narrationText is used. Pass `modelFilename` '
      + '(e.g. "v3_1_ru.pt") to override the default V5_5 → V5_4 → V5 → V4 → V3 precedence. '
      + 'The job runs on CPU via a Python subprocess and writes '
      + 'data/<slug>/scenes/<sceneKey>/narration_<voice>_<sr>[_<model>].wav.',
  })
  start(
    @Param('sceneId') sceneId: string,
    @Body() body: Omit<StartTTSInput, 'sceneId'>,
  ) {
    return this.tts.start({ sceneId, ...body });
  }

  @Get('models')
  @ApiOperation({
    summary: 'List Silero .pt models available in .silero_cache/',
    description: 'Returns filename, size and known voice list per model. Used '
              + 'by the narration modal to populate the model+voice dropdowns.',
  })
  listModels() {
    return this.tts.listModels();
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

  @Post('jobs/:jobId/approve')
  @ApiOperation({
    summary: 'Mark this TTS job as the approved narration for its owner (scene or shot)',
    description: 'Stores jobId in scene.approvedTTSJobId (legacy whole-scene jobs) '
              + 'or shot.approvedTTSJobId (per-shot jobs). Only completed jobs '
              + 'can be approved. Approving a new job silently replaces any '
              + 'previously approved one.',
  })
  async approve(@Param('jobId') jobId: string) {
    const j = await this.tts.get(jobId);
    if (j.shotId) return this.tts.approveForShot(j.id, j.shotId);
    if (j.sceneId) return this.tts.approve(j.id, j.sceneId);
    throw new Error(`TTS job ${jobId} has no owner — corrupt row`);
  }

  @Post('scenes/:sceneId/approve/clear')
  @ApiOperation({ summary: 'Clear the scene\'s TTS approval (rare — usually you re-approve a different take)' })
  clearApproval(@Param('sceneId') sceneId: string) {
    return this.tts.approve(null, sceneId);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({
    summary: 'Hard-delete a TTS job (DB row + .wav on disk)',
    description: 'Refuses to delete a running job. Clears scene.approvedTTSJobId '
              + 'if it pointed at this job. Idempotent on disk side (best-effort unlink).',
  })
  remove(@Param('jobId') jobId: string) {
    return this.tts.delete(jobId);
  }

  @Delete('scenes/:sceneId/jobs')
  @ApiOperation({
    summary: 'Bulk-purge failed/cancelled TTS jobs for a scene',
    description: 'Default deletes failed + cancelled. Pass ?statuses=failed,completed '
              + 'to widen the scope. Never deletes running jobs even if requested.',
  })
  purge(@Param('sceneId') sceneId: string) {
    return this.tts.purgeForScene(sceneId);
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

  // ── Shot-level TTS (per-shot ~5s voiceover) ──────────────────────────────

  @Post('shots/:shotId')
  @ApiOperation({
    summary: 'Queue a Silero TTS render for a single Shot',
    description: 'If `text` is omitted, shot.narrationText is used. Wav lands at '
              + 'data/<slug>/shots/<shotCode>/narration_<jobId>_<voice>_<sr>.wav.',
  })
  startShot(
    @Param('shotId') shotId: string,
    @Body() body: Omit<StartShotTTSInput, 'shotId'>,
  ) {
    return this.tts.startForShot({ shotId, ...body });
  }

  @Get('shots/:shotId/jobs')
  @ApiOperation({ summary: 'List TTS jobs for a shot (most recent first)' })
  listShotJobs(@Param('shotId') shotId: string) {
    return this.tts.listForShot(shotId);
  }

  @Patch('shots/:shotId/narration')
  @ApiOperation({
    summary: 'Update a Shot\'s narrationText',
    description: '{text: "..."} to set, {text: ""} to clear. Existing TTS jobs '
              + 'are NOT regenerated automatically — re-queue to re-render.',
  })
  setShotNarration(
    @Param('shotId') shotId: string,
    @Body() body: { text?: string },
  ) {
    return this.tts.setShotNarrationText(shotId, body);
  }

  @Post('shots/:shotId/approve/clear')
  @ApiOperation({ summary: 'Clear the shot\'s TTS approval (un-pick the chosen take)' })
  clearShotApproval(@Param('shotId') shotId: string) {
    return this.tts.approveForShot(null, shotId);
  }

  // ── Scene-level bulk actions on shot TTS ─────────────────────────────────

  @Post('scenes/:sceneId/shots/queue-all')
  @ApiOperation({
    summary: 'Queue TTS for every shot in a scene',
    description: 'mode=missing (default): skip shots that already have an approved '
              + 'completed wav. mode=all: re-render everything. Returns counts so '
              + 'the UI can show "queued N, skipped M".',
  })
  queueAllShots(
    @Param('sceneId') sceneId: string,
    @Body() body: { mode?: 'missing' | 'all'; voice?: string } = {},
  ) {
    return this.tts.queueAllForScene(sceneId, body as { mode?: 'missing' | 'all'; voice?: any });
  }

  @Get('scenes/:sceneId/shots/summary')
  @ApiOperation({
    summary: 'Per-scene aggregate of shot-level TTS state',
    description: 'Shot-bucketed counts so the breakdown adds up: approved + '
              + 'waitingApprove + inFlight + needsQueueing ≤ total. Plus '
              + 'job-level pendingJobs / runningJobs / failedJobs.',
  })
  shotsSummary(@Param('sceneId') sceneId: string) {
    return this.tts.sceneShotTtsSummary(sceneId);
  }

  @Post('scenes/:sceneId/shots/approve-all-completed')
  @ApiOperation({
    summary: 'Bulk-approve the most recent completed wav for every shot in the scene',
    description: 'Picks the latest completed TTSJob per shot and writes its id '
              + 'into shot.approvedTTSJobId. Skips shots that are already approved '
              + 'or have no completed wav. Returns {approved, skipped, total}.',
  })
  approveAllCompleted(@Param('sceneId') sceneId: string) {
    return this.tts.approveAllCompletedForScene(sceneId);
  }
}
