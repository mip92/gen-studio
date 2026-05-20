import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  copyFileSync,
  unlinkSync,
} from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { StartRenderInput, AudioRenderParams, DEFAULT_RENDER_PARAMS } from './bgm.types';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 4000;
const WORKFLOW_FILENAME = 'bgm_acestep_api.json';

/**
 * AudioRenderJob lifecycle for ACE-Step v1.5 BGM generation. Mirrors
 * VideoRenderService: start() enqueues pending rows, PipelineQueueService.tick()
 * picks the oldest, dispatchPending() loads the workflow template, patches the
 * prompt/duration/seed/sampler knobs, calls ComfyUI /prompt. A poller checks
 * running rows every 4s and moves the produced flac into data/<slug>/bgm/<block>/.
 *
 * Output layout: data/<projectSlug>/bgm/<blockSlug>/<basename>.flac
 *   - One flac per AudioRenderJob, basename keyed by job id so re-runs don't
 *     overwrite earlier takes (mirrors TTSJob naming).
 */
@Injectable()
export class BgmRenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BgmRenderService.name);
  private poller: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
  ) {}

  onModuleInit() {
    this.poller = setInterval(
      () => this.poll().catch((e) => this.logger.warn(`poll: ${e?.message}`)),
      POLL_MS,
    );
  }
  onModuleDestroy() {
    if (this.poller) clearInterval(this.poller);
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  /**
   * Enqueue one or more AudioRenderJob rows for a segment. Actual ComfyUI
   * dispatch happens later in PipelineQueueService.tick() — same single-slot
   * FIFO as video/scene/training/tts.
   *
   * The effective prompt = explicit input.prompt > segment.prompt > block.moodPrompt.
   * Empty resolves to a generic "cinematic, ambient, instrumental" fallback so
   * ACE-Step still gets a usable tag string.
   */
  async start(input: StartRenderInput) {
    const segment = await this.prisma.musicSegment.findUnique({
      where:   { id: input.segmentId },
      include: { block: true },
    });
    if (!segment) throw new NotFoundException(`Segment ${input.segmentId} not found`);

    const promptOverride = input.prompt?.trim();
    const promptResolved = promptOverride
      || segment.prompt?.trim()
      || segment.block.moodPrompt?.trim()
      || 'dark synthwave, industrial soundtrack, sci-fi cinematic, John Carpenter style, Joel Nielsen Black Mesa, analog synthesizers, driving rhythm, instrumental, no vocals';
    const durationSec = input.durationSec ?? segment.durationSec;
    if (durationSec < 10 || durationSec > 240) {
      throw new BadRequestException(`durationSec must be in [10, 240] (got: ${durationSec})`);
    }

    const count = Math.max(1, Math.min(4, input.count ?? 1));
    const results = [];
    for (let i = 0; i < count; i++) {
      const seed = (i === 0 && input.seed !== undefined)
        ? input.seed
        : Math.floor(Math.random() * 2 ** 32);
      const params: AudioRenderParams = {
        prompt:      promptResolved,
        durationSec,
        seed,
        steps:       input.steps       ?? DEFAULT_RENDER_PARAMS.steps,
        cfg:         input.cfg         ?? DEFAULT_RENDER_PARAMS.cfg,
        samplerName: input.samplerName ?? DEFAULT_RENDER_PARAMS.samplerName,
        scheduler:   input.scheduler   ?? DEFAULT_RENDER_PARAMS.scheduler,
      };
      const row = await this.prisma.audioRenderJob.create({
        data: {
          segmentId:        segment.id,
          status:           'pending',
          workflowFilename: WORKFLOW_FILENAME,
          params:           params as any,
        },
      });
      results.push(row);
    }
    return results;
  }

  // ── Pipeline queue hooks ──────────────────────────────────────────────────

  findNextPending() {
    return this.prisma.audioRenderJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /**
   * Dispatch a pending AudioRenderJob to ComfyUI. Called by PipelineQueueService
   * after it has confirmed ComfyUI is alive (auto-start if needed).
   */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.audioRenderJob.findUnique({
      where:   { id: jobId },
      include: { segment: { include: { block: { include: { project: true } } } } },
    });
    if (!job) throw new Error(`AudioRenderJob ${jobId} not found`);
    if (job.status !== 'pending') return;

    try {
      const project = job.segment.block.project;
      const params  = job.params as unknown as AudioRenderParams;
      const template = this.loadTemplate(project.slug, job.workflowFilename);
      const workflow = this.patch(template, {
        prompt:         params.prompt,
        durationSec:    params.durationSec,
        seed:           params.seed,
        steps:          params.steps,
        cfg:            params.cfg,
        samplerName:    params.samplerName,
        scheduler:      params.scheduler,
        filenamePrefix: `bgm/${job.segment.block.slug}/${job.id}`,
      });
      const { promptId } = await this.comfy.queuePrompt(workflow);
      await this.prisma.audioRenderJob.update({
        where: { id: job.id },
        data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
      });
    } catch (e: any) {
      this.logger.error(`dispatchPending audio ${job.id} failed: ${e?.message}`);
      await this.fail(job.id, e?.message ?? String(e));
    }
  }

  // ── Polling ───────────────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    const running = await this.prisma.audioRenderJob.findMany({
      where:   { status: 'running' },
      include: { segment: { include: { block: { include: { project: true } } } } },
    });
    for (const job of running) {
      if (!job.comfyPromptId) continue;
      const h = await this.comfy.getHistory(job.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      if (!success) {
        this.logger.warn(`audio ${job.id}: ComfyUI reported non-success`);
        await this.fail(job.id, `ComfyUI status: ${h.status.status_str}`);
        continue;
      }
      const out = this.firstAudioOutput(h.outputs);
      if (!out) {
        this.logger.warn(`audio ${job.id}: history had no audio output`);
        await this.fail(job.id, 'ComfyUI history had no audio output');
        continue;
      }
      let moved: string | null = null;
      try {
        moved = await this.moveOutputToBlockDir(job.segment.block.project.slug, job.segment.block.slug, out);
      } catch (e: any) {
        this.logger.warn(`move audio ${job.id}: ${e?.message}`);
      }
      if (!moved) {
        this.logger.warn(`audio ${job.id}: file not yet at COMFY_OUTPUT — will retry next tick`);
        continue;
      }
      await this.prisma.audioRenderJob.update({
        where: { id: job.id },
        data:  {
          status:         'completed',
          outputFilename: moved,
          completedAt:    new Date(),
          errorMessage:   null,
        },
      });
    }
  }

  private async fail(jobId: string, message: string): Promise<void> {
    await this.prisma.audioRenderJob.update({
      where: { id: jobId },
      data:  {
        status:       'failed',
        errorMessage: message.slice(0, 4000),
        completedAt:  new Date(),
      },
    });
  }

  // ── Workflow patch ────────────────────────────────────────────────────────

  private loadTemplate(projectSlug: string, filename: string): Record<string, any> {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`BGM workflow not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  /**
   * Patch the ACE-Step v1.5 Turbo text-to-audio workflow with per-job params.
   * Node IDs (must match bgm_acestep_api.json):
   *   1 — CheckpointLoaderSimple        (untouched, model file fixed in template)
   *   8 — ModelSamplingAuraFlow         (untouched, shift=3 is the v1.5 default)
   *   2 — EmptyAceStep1.5LatentAudio    .seconds  ← durationSec
   *   3 — TextEncodeAceStepAudio1.5     .tags     ← prompt (positive)
   *                                     .duration ← durationSec (must match
   *                                                 EmptyAceStep1.5LatentAudio
   *                                                 to avoid latent/cond mismatch)
   *                                     .seed     ← same seed as KSampler so
   *                                                 the LLM that generates
   *                                                 audio codes is deterministic
   *   4 — ConditioningZeroOut           (no inputs to patch; reads from node 3)
   *   5 — KSampler.{seed, steps, cfg, sampler_name, scheduler}
   *   7 — SaveAudio.filename_prefix     ← "bgm/<blockSlug>/<jobId>"
   *
   * Turbo-specific: cfg here is intentionally 1.0 (no CFG); cfg_scale on the
   * TextEncoder is the *audio-code LLM* scale, unrelated to KSampler.cfg.
   */
  private patch(template: Record<string, any>, p: {
    prompt:         string;
    durationSec:    number;
    seed:           number;
    steps:          number;
    cfg:            number;
    samplerName:    string;
    scheduler:      string;
    filenamePrefix: string;
  }): Record<string, any> {
    const wf = structuredClone(template);
    const set = (id: string, key: string, value: unknown) => {
      if (wf[id]) wf[id].inputs[key] = value;
    };
    set('2', 'seconds',         p.durationSec);
    set('3', 'tags',             p.prompt);
    set('3', 'duration',         p.durationSec);
    set('3', 'seed',             p.seed);
    set('5', 'seed',             p.seed);
    set('5', 'steps',            p.steps);
    set('5', 'cfg',              p.cfg);
    set('5', 'sampler_name',     p.samplerName);
    set('5', 'scheduler',        p.scheduler);
    set('7', 'filename_prefix',  p.filenamePrefix);
    return wf;
  }

  // ── Output handling ───────────────────────────────────────────────────────

  /**
   * SaveAudio writes under `outputs.<nodeId>.audio = [{filename, subfolder}, …]`
   * in current ComfyUI builds. Older builds put it under `images`. Match either.
   */
  private firstAudioOutput(outputs: Record<string, unknown> | undefined): { filename: string; subfolder?: string } | null {
    if (!outputs) return null;
    for (const o of Object.values(outputs)) {
      const oo = o as any;
      const candidates = [...(oo?.audio ?? []), ...(oo?.images ?? [])];
      for (const c of candidates) {
        if (c?.filename && /\.(flac|wav|mp3|ogg|opus)$/i.test(c.filename as string)) {
          return { filename: c.filename, subfolder: c.subfolder };
        }
      }
    }
    return null;
  }

  private async moveOutputToBlockDir(
    projectSlug: string,
    blockSlug: string,
    out: { filename: string; subfolder?: string },
  ): Promise<string | null> {
    const destDir = path.join(APP_ROOT, 'data', projectSlug, 'bgm', blockSlug);
    mkdirSync(destDir, { recursive: true });
    const src = path.join(COMFY_OUTPUT, out.subfolder ?? '', path.basename(out.filename));
    if (!existsSync(src)) return null;
    const dest = path.join(destDir, path.basename(out.filename));
    try {
      renameSync(src, dest);
    } catch (e: any) {
      if (e?.code === 'EXDEV') {
        copyFileSync(src, dest);
        try { unlinkSync(src); } catch { /* best-effort */ }
      } else throw e;
    }
    return path.basename(dest);
  }

  // ── Reads + delete ────────────────────────────────────────────────────────

  list(segmentId: string) {
    return this.prisma.audioRenderJob.findMany({
      where:   { segmentId },
      orderBy: { queuedAt: 'desc' },
    });
  }

  async get(jobId: string) {
    const j = await this.prisma.audioRenderJob.findUnique({ where: { id: jobId } });
    if (!j) throw new NotFoundException(`AudioRenderJob ${jobId} not found`);
    return j;
  }

  /**
   * Absolute path to the rendered flac once `status=completed`. Returns null
   * if the file went missing on disk (older row, manual cleanup, etc.) so the
   * controller can answer 204 instead of crashing.
   */
  async filePath(jobId: string): Promise<string | null> {
    const j = await this.prisma.audioRenderJob.findUnique({
      where:   { id: jobId },
      include: { segment: { include: { block: { include: { project: true } } } } },
    });
    if (!j || !j.outputFilename || j.status !== 'completed') return null;
    const fp = path.join(
      APP_ROOT, 'data', j.segment.block.project.slug, 'bgm', j.segment.block.slug, j.outputFilename,
    );
    if (!existsSync(fp)) {
      this.logger.warn(`audio job ${jobId}: flac missing on disk (${fp})`);
      return null;
    }
    return fp;
  }

  async delete(jobId: string): Promise<{ deleted: true; id: string }> {
    const j = await this.prisma.audioRenderJob.findUnique({
      where:   { id: jobId },
      include: { segment: { include: { block: { include: { project: true } } } } },
    });
    if (!j) throw new NotFoundException(`AudioRenderJob ${jobId} not found`);
    if (j.status === 'running') {
      throw new BadRequestException(
        `AudioRenderJob ${jobId} is running — cancel via /pipeline/queue first`,
      );
    }

    if (j.outputFilename) {
      const filePath = path.join(
        APP_ROOT, 'data', j.segment.block.project.slug, 'bgm', j.segment.block.slug, j.outputFilename,
      );
      if (existsSync(filePath)) {
        try { unlinkSync(filePath); }
        catch (e: any) { this.logger.warn(`delete audio ${jobId}: unlink failed: ${e?.message}`); }
      }
    }

    await this.prisma.$transaction([
      this.prisma.musicSegment.updateMany({
        where: { id: j.segmentId, approvedJobId: j.id },
        data:  { approvedJobId: null },
      }),
      this.prisma.audioRenderJob.delete({ where: { id: j.id } }),
    ]);
    return { deleted: true, id: j.id };
  }
}
