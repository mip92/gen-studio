import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobType } from './queue-entry.types';

/** The live state of the job-table row a queue entry drives. */
export interface SourceState {
  status:         string | null;
  comfyPromptId:  string | null;
  outputFilename: string | null;
  errorMessage:   string | null;
}

/**
 * Which table and which columns each job type keeps its live state in.
 *
 * `video_post` reads the UPSCALE lifecycle of a VideoRender row: the combined
 * one-pass upscale→RIFE prompt closes both the upscale and interp fields, so the
 * upscale columns are the authoritative stage state.
 */
interface SourceColumns {
  delegate:  string;
  status:    string;
  prompt:    string | null;
  output:    string | null;
  error:     string;
  completed: string;
}

const SOURCE: Record<JobType, SourceColumns> = {
  scene:      { delegate: 'sceneRenderJob',      status: 'status',        prompt: 'comfyPromptId',   output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  video:      { delegate: 'videoRender',         status: 'status',        prompt: 'comfyPromptId',   output: 'outputFilename',     error: 'errorMessage',        completed: 'completedAt' },
  video_post: { delegate: 'videoRender',         status: 'upscaleStatus', prompt: 'upscalePromptId', output: 'interpFilename',     error: 'upscaleErrorMessage', completed: 'upscaleCompletedAt' },
  tts:        { delegate: 'tTSJob',              status: 'status',        prompt: null,              output: 'outputFilename',     error: 'errorMessage',        completed: 'completedAt' },
  bgm:        { delegate: 'audioRenderJob',      status: 'status',        prompt: 'comfyPromptId',   output: 'outputFilename',     error: 'errorMessage',        completed: 'completedAt' },
  anchor:     { delegate: 'anchorRenderJob',     status: 'status',        prompt: 'comfyPromptId',   output: 'outputPath',         error: 'errorMessage',        completed: 'completedAt' },
  prop_anchor: { delegate: 'propAnchorJob',     status: 'status',        prompt: 'comfyPromptId',   output: 'outputPath',         error: 'errorMessage',        completed: 'completedAt' },
  thumbnail:  { delegate: 'thumbnailJob',        status: 'status',        prompt: 'comfyPromptId',   output: 'artPath',            error: 'errorMessage',        completed: 'completedAt' },
  thumbnail_ideas: { delegate: 'thumbnailIdeaJob', status: 'status',      prompt: null,              output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  validation: { delegate: 'imageValidationJob',  status: 'status',        prompt: null,              output: 'chosenFilename',     error: 'errorMessage',        completed: 'completedAt' },
  anchor_validation: { delegate: 'anchorValidationJob', status: 'status', prompt: null,              output: 'chosenFilename',     error: 'errorMessage',        completed: 'completedAt' },
  caption:    { delegate: 'captionJob',          status: 'status',        prompt: null,              output: 'srtPath',            error: 'errorMessage',        completed: 'completedAt' },
  vo_validation: { delegate: 'voValidationRun',  status: 'status',        prompt: null,              output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  image_qc:   { delegate: 'imageQcRun',          status: 'status',        prompt: null,              output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  video_qc:   { delegate: 'videoQcRun',          status: 'status',        prompt: null,              output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  dataset:    { delegate: 'datasetJob',          status: 'status',        prompt: 'comfyPromptId',   output: null,                 error: 'errorMessage',        completed: 'completedAt' },
  training:   { delegate: 'trainingJob',         status: 'status',        prompt: null,              output: 'outputLoraPath',     error: 'errorMessage',        completed: 'completedAt' },
};

/**
 * The one place that knows which table, status column and output column each job
 * type lives in.
 *
 * The queue entry owns ordering and history; the per-type job row still owns live
 * ComfyUI state (prompt id, params, produced filenames). This adapter is the seam
 * between them, so the ledger can reconcile itself against reality — and the
 * dispatcher can fail or cancel a job generically — without either of them
 * growing a per-type switch of its own.
 */
@Injectable()
export class QueueSourceService {
  private readonly logger = new Logger(QueueSourceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private delegate(jobType: JobType): any {
    return (this.prisma as any)[SOURCE[jobType].delegate];
  }

  /** Current state of a job stage's row, or null when the row is gone. */
  async state(jobType: JobType, jobId: string): Promise<SourceState | null> {
    const c = SOURCE[jobType];
    const r = await this.delegate(jobType).findUnique({ where: { id: jobId } });
    if (!r) return null;
    return {
      status:         r[c.status] ?? null,
      comfyPromptId:  c.prompt ? r[c.prompt] ?? null : null,
      // The post pass produces two artifacts in one prompt; report the smooth
      // clip, which is the one that ships (the FHD intermediate is not kept).
      outputFilename: c.output ? r[c.output] ?? (jobType === 'video_post' ? r.upscaledFilename ?? null : null) : null,
      errorMessage:   r[c.error] ?? null,
    };
  }

  /**
   * Mark a job stage failed in its own table. Used when the dispatcher itself
   * cannot get the work started (e.g. ComfyUI refuses to come up), where the
   * owning service never gets a chance to record the failure.
   */
  async fail(jobType: JobType, jobId: string, message: string): Promise<void> {
    await this.setTerminal(jobType, jobId, 'failed', message);
  }

  /**
   * Mark a job stage cancelled in its own table, mirroring what the queue's
   * cancel endpoint used to do inline for each job type.
   */
  async cancel(jobType: JobType, jobId: string, message = 'Manually cancelled'): Promise<void> {
    await this.setTerminal(jobType, jobId, 'cancelled', message);
  }

  private async setTerminal(jobType: JobType, jobId: string, status: string, message: string): Promise<void> {
    const c  = SOURCE[jobType];
    const ts = new Date();
    const data: Record<string, unknown> = {
      [c.status]:    status,
      [c.error]:     message,
      [c.completed]: ts,
    };
    // Cancelling the post pass kills the interp half of the same prompt with it.
    if (jobType === 'video_post') {
      data.interpStatus       = status;
      data.interpErrorMessage = message;
      data.interpCompletedAt  = ts;
    }
    try {
      await this.delegate(jobType).update({ where: { id: jobId }, data });
    } catch (e: any) {
      this.logger.warn(`${status} ${jobType}/${jobId}: ${e?.message ?? e}`);
    }
  }
}
