import { BadRequestException, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GenerationService } from './generation.service';

const COMFY_BASE = process.env.COMFY_BASE_URL ?? 'http://127.0.0.1:8188';

@ApiTags('Generation')
@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  /**
   * Direct dataset generation (legacy — bypasses our pipeline queue, dispatches
   * to ComfyUI immediately). Now restricted to ?dryRun=true so it can ONLY
   * preview the assembled workflow JSON; ANY real generation must go through
   * `POST /dataset-queue/profiles/:id/enqueue` so the queue can sequence work
   * properly with training jobs.
   */
  @Post('profiles/:profileId/generate-dataset')
  @ApiOperation({
    summary: 'Preview-only — assemble dataset workflow without queuing it',
    description:
      'Returns the assembled prompt JSON for inspection (?dryRun=true required). ' +
      'For real generation use POST /dataset-queue/profiles/:id/enqueue instead.',
  })
  @ApiQuery({ name: 'dryRun', required: true, type: Boolean })
  generateDataset(
    @Param('profileId') profileId: string,
    @Query('dryRun') dryRun?: string | boolean,
  ) {
    const isDryRun = dryRun === true || dryRun === 'true';
    if (!isDryRun) {
      throw new BadRequestException(
        'Direct dispatch is disabled. Use POST /dataset-queue/profiles/:profileId/enqueue ' +
        'to put the job in the pipeline queue, or pass ?dryRun=true to preview the workflow.',
      );
    }
    return this.generationService.generateCharacterDataset(profileId, true);
  }

  @Get('jobs/:promptId')
  @ApiOperation({ summary: 'Get ComfyUI job status by promptId' })
  async getJobStatus(@Param('promptId') promptId: string, @Res() res: Response) {
    const h = await this.generationService.getJobStatus(promptId);
    // Always send JSON body (Nest's default skips null which produces empty
    // 200 — breaks res.json() on the client).
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(h ? JSON.stringify(h) : 'null');
  }

  @Get('comfy-queue')
  @ApiOperation({ summary: 'ComfyUI live queue (running + pending prompt_ids)' })
  async comfyQueue() {
    const url = `${COMFY_BASE}/queue`;
    // ComfyUI is started on-demand only when there's image work to dispatch.
    // Treat connection errors as "queue is empty" instead of bubbling a 500.
    try {
      const res = await fetch(url);
      if (!res.ok) return { running: [], pending: [] };
      const data = await res.json() as { queue_running?: unknown[][]; queue_pending?: unknown[][] };
      // Each item is [number, prompt_id, prompt_dict, ...]. Extract the IDs only.
      const running = (data.queue_running ?? []).map((it) => it[1] as string).filter(Boolean);
      const pending = (data.queue_pending ?? []).map((it) => it[1] as string).filter(Boolean);
      return { running, pending };
    } catch {
      return { running: [], pending: [] };
    }
  }

  @Get('comfy-image')
  @ApiOperation({ summary: 'Proxy a ComfyUI /view image (avoids browser CORS to ComfyUI)' })
  @ApiQuery({ name: 'filename',  required: true })
  @ApiQuery({ name: 'subfolder', required: false })
  @ApiQuery({ name: 'type',      required: false, description: 'output | input | temp' })
  async comfyImage(
    @Query('filename')  filename:  string,
    @Query('subfolder') subfolder: string = '',
    @Query('type')      type:      string = 'output',
    @Res() res: Response,
  ) {
    const url = `${COMFY_BASE}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).send(`ComfyUI /view returned ${upstream.status}`);
      return;
    }
    const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=300');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  }
}
