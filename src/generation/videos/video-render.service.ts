import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  copyFileSync,
  renameSync,
  unlinkSync,
} from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ComfyService } from '../../comfy/comfy.service';
import { StartVideoInput, VideoRenderParams } from './video-job.types';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 4000;
const WORKFLOW_FILENAME = 'video_wan22_i2v_api.json';
const UPSCALE_WORKFLOW_FILENAME = 'video_upscale_4x_api.json';

// Wan2.2 i2v defaults — 768×432 = exact 16:9, both dims divisible by 16.
// Chosen over 832×480 because 832/480 = 1.733 ≠ 1920/1080 = 1.778, which would
// force crop or stretch on FHD upscale. 768×432 upscales to FHD with uniform
// scale factor 0.625, no distortion. Preview-quality; FHD via /upscale endpoint.
const DEFAULT_WIDTH  = 768;
const DEFAULT_HEIGHT = 432;
const DEFAULT_LENGTH = 81;
const DEFAULT_FPS    = 16;

@Injectable()
export class VideoRenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoRenderService.name);
  private poller: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
  ) {}

  onModuleInit() {
    this.poller = setInterval(() => this.poll().catch((e) => this.logger.warn(`poll: ${e?.message}`)), POLL_MS);
    // One-shot sweep of old failed rows from before the auto-delete policy
    // was added. Best-effort — don't crash the module if the DB is busy.
    this.sweepFailedRows().catch((e) => this.logger.warn(`sweepFailedRows: ${e?.message}`));
  }
  onModuleDestroy() {
    if (this.poller) clearInterval(this.poller);
  }

  // ── Start a render ─────────────────────────────────────────────────────────

  async start(input: StartVideoInput) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);
    if (!shot.chosenRender) {
      throw new BadRequestException(
        `Shot ${shot.shotCode} has no chosen render. Approve a render before starting a video.`,
      );
    }

    const sourcePath = path.join(
      APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, shot.chosenRender,
    );
    if (!existsSync(sourcePath)) {
      throw new BadRequestException(`Source image missing on disk: ${sourcePath}`);
    }

    const count = Math.max(1, Math.min(8, input.count ?? 1));

    // Create N pending rows. Actual ComfyUI dispatch happens in PipelineQueueService.tick()
    // which serializes video renders against scene renders, training and dataset jobs.
    const results = [];
    for (let i = 0; i < count; i++) {
      const seed = (i === 0 && input.seed !== undefined)
        ? input.seed
        : Math.floor(Math.random() * 2 ** 32);
      const row = await this.prisma.videoRender.create({
        data: {
          shotId:              shot.id,
          sourceImageFilename: shot.chosenRender!,
          motionPrompt:        input.motionPrompt?.trim() || '',
          status:              'pending',
          workflowFilename:    WORKFLOW_FILENAME,
          params: {
            seed,
            width:  input.width  ?? DEFAULT_WIDTH,
            height: input.height ?? DEFAULT_HEIGHT,
            length: input.length ?? DEFAULT_LENGTH,
            fps:    input.fps    ?? DEFAULT_FPS,
          },
        },
      });
      results.push(row);
    }
    return results;
  }

  /** Find the oldest pending video render — used by PipelineQueueService for arbitration. */
  findNextPending() {
    return this.prisma.videoRender.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /** Dispatch a pending video render to ComfyUI. Called by the pipeline tick. */
  async dispatchPending(videoId: string): Promise<void> {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new Error(`VideoRender ${videoId} not found`);
    if (v.status !== 'pending') return;

    const sourcePath = path.join(
      APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode, v.sourceImageFilename,
    );
    if (!existsSync(sourcePath)) {
      // Source image vanished — no point keeping a doomed row around. The user
      // asked us to drop failed-video records on the floor instead of leaving
      // them in the gallery as error stubs.
      this.logger.warn(`dispatchPending video ${v.id}: source image missing (${sourcePath}) — discarding row`);
      await this.delete(v.id).catch((e) => this.logger.warn(`auto-delete ${v.id}: ${e?.message}`));
      return;
    }

    const ext           = path.extname(v.sourceImageFilename) || '.png';
    const inputBasename = `video_${v.id}${ext}`;
    const inputDest     = path.join(COMFY_INPUT, inputBasename);
    mkdirSync(COMFY_INPUT, { recursive: true });
    copyFileSync(sourcePath, inputDest);

    try {
      const params = v.params as { seed: number; width: number; height: number; length: number; fps: number };
      const template = this.loadTemplate(v.shot.project.slug);
      const workflow = this.patch(template, {
        sourceImage:    inputBasename,
        motionPrompt:   this.composeMotionPrompt(v.motionPrompt, v.shot),
        seed:           params.seed,
        width:          params.width,
        height:         params.height,
        length:         params.length,
        fps:            params.fps,
        filenamePrefix: `video/${v.shot.shotCode}/${v.id}`,
      });
      const { promptId } = await this.comfy.queuePrompt(workflow);
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
      });
    } catch (e: any) {
      this.logger.error(`dispatchPending video ${v.id} failed — discarding row: ${e?.message}`);
      try { unlinkSync(inputDest); } catch { /* best-effort */ }
      await this.delete(v.id).catch((err) => this.logger.warn(`auto-delete ${v.id}: ${err?.message}`));
    }
  }

  list(shotId: string) {
    return this.prisma.videoRender.findMany({
      where:   { shotId },
      orderBy: { queuedAt: 'desc' },
    });
  }

  async get(videoId: string) {
    const v = await this.prisma.videoRender.findUnique({ where: { id: videoId } });
    if (!v) throw new NotFoundException(`Video ${videoId} not found`);
    return v;
  }

  /** Absolute path to the rendered mp4 once `status=completed`. */
  async filePath(videoId: string): Promise<string> {
    const v = await this.get(videoId);
    if (!v.outputFilename) throw new BadRequestException(`Video ${videoId} not finished yet`);
    const shot = await this.prisma.shot.findUnique({
      where:   { id: v.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot for video ${videoId} not found`);
    return path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'videos', v.outputFilename);
  }

  /**
   * Hard-delete a VideoRender: removes the DB row, both mp4s on disk (preview
   * + FHD), any pre-staged COMFY_INPUT copies, and clears shot.chosenVideoId
   * if it pointed at this video. Idempotent on disk side (best-effort unlinks).
   */
  async delete(videoId: string): Promise<{ deleted: true; id: string }> {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new NotFoundException(`Video ${videoId} not found`);

    const shotDir = path.join(APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode);
    const toRemove = [
      v.outputFilename   ? path.join(shotDir, 'videos',     v.outputFilename)   : null,
      v.upscaledFilename ? path.join(shotDir, 'videos_fhd', v.upscaledFilename) : null,
      // Pre-staged copies in COMFY_INPUT — these are short-lived but cleanupInputCopy
      // is best-effort too, so re-try here in case the row dies before completion.
      path.join(COMFY_INPUT, `video_${v.id}${path.extname(v.sourceImageFilename) || '.png'}`),
      path.join(COMFY_INPUT, `upscale_${v.id}.mp4`),
    ].filter((p): p is string => !!p);

    for (const p of toRemove) {
      if (!existsSync(p)) continue;
      try { unlinkSync(p); }
      catch (e: any) { this.logger.warn(`delete video ${v.id}: failed to unlink ${p}: ${e?.message}`); }
    }

    await this.prisma.$transaction([
      // Clear chosenVideoId if it pointed here, so the row delete doesn't leave
      // the shot with a dangling reference.
      this.prisma.shot.updateMany({
        where: { id: v.shotId, chosenVideoId: v.id },
        data:  { chosenVideoId: null },
      }),
      this.prisma.videoRender.delete({ where: { id: v.id } }),
    ]);

    return { deleted: true, id: v.id };
  }

  /** Absolute path to the upscaled FHD mp4 once `upscaleStatus=completed`. */
  async upscaledFilePath(videoId: string): Promise<string> {
    const v = await this.get(videoId);
    if (!v.upscaledFilename) throw new BadRequestException(`Video ${videoId} has no upscaled version yet`);
    const shot = await this.prisma.shot.findUnique({
      where:   { id: v.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot for video ${videoId} not found`);
    return path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'videos_fhd', v.upscaledFilename);
  }

  // ── Workflow loading + patching ────────────────────────────────────────────

  private loadTemplate(projectSlug: string): Record<string, any> {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', WORKFLOW_FILENAME);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Video workflow not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  private patch(template: Record<string, any>, p: {
    sourceImage:    string;
    motionPrompt:   string;
    seed:           number;
    width:          number;
    height:         number;
    length:         number;
    fps:            number;
    filenamePrefix: string;
  }): Record<string, any> {
    const wf = structuredClone(template);
    const set = (id: string, key: string, value: unknown) => {
      if (wf[id]) wf[id].inputs[key] = value;
    };
    // Source image goes through LoadImage (11) → ImageScale (12) → WanImageToVideo (13).
    set('11', 'image',  p.sourceImage);
    set('12', 'width',  p.width);
    set('12', 'height', p.height);
    set('13', 'width',  p.width);
    set('13', 'height', p.height);
    set('13', 'length', p.length);

    // Positive prompt is on node 9.
    set('9',  'text',   p.motionPrompt);

    // Both KSampler stages need the same seed (14 = high-noise stage, 15 = low-noise).
    set('14', 'noise_seed', p.seed);
    set('15', 'noise_seed', p.seed);

    // Output framerate (CreateVideo) + filename prefix (SaveVideo).
    set('17', 'fps',              p.fps);
    set('18', 'filename_prefix',  p.filenamePrefix);
    return wf;
  }

  /**
   * Build the Wan2.2 positive prompt by concatenating the motion description
   * with the shot's scene prompt fields (so Wan has both "what's happening"
   * and "how it should move"). Falls back to a generic motion line if the
   * user left motionPrompt empty.
   */
  private composeMotionPrompt(motion: string, shot: { promptFields: any }): string {
    const pf = (shot.promptFields ?? {}) as Record<string, unknown>;
    const beat = typeof pf.narrativeBeat === 'string' ? pf.narrativeBeat : '';
    const motionLine = motion?.trim() || 'subtle camera push-in, gentle breathing motion, natural micro-movements';
    const parts = [motionLine, beat].filter((s) => s && s.trim().length > 0);
    return parts.join(', ');
  }

  // ── Upscale on demand ──────────────────────────────────────────────────────

  /**
   * Queue a 4x-UltraSharp upscale → 1920×1080 pass on a completed video. The
   * original `outputFilename` (832×480 preview) stays in place; the FHD output
   * lands in `upscaledFilename`. Idempotent: re-calling on a video that already
   * has `upscaleStatus = running` or `completed` is a no-op + returns the row.
   */
  async upscale(videoId: string) {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new NotFoundException(`Video ${videoId} not found`);
    if (v.status !== 'completed' || !v.outputFilename) {
      throw new BadRequestException(`Video ${videoId} is not completed yet`);
    }
    if (v.upscaleStatus === 'running' || v.upscaleStatus === 'pending') return v;
    if (v.upscaleStatus === 'completed' && v.upscaledFilename) return v;

    const srcMp4 = path.join(
      APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode, 'videos', v.outputFilename,
    );
    if (!existsSync(srcMp4)) {
      throw new BadRequestException(`Source mp4 missing on disk: ${srcMp4}`);
    }

    // Copy mp4 into COMFY_INPUT immediately so the source is preserved even if
    // the user deletes the original before the pipeline tick dispatches.
    const inputBasename = `upscale_${v.id}.mp4`;
    const inputDest     = path.join(COMFY_INPUT, inputBasename);
    mkdirSync(COMFY_INPUT, { recursive: true });
    copyFileSync(srcMp4, inputDest);

    // Mark pending — PipelineQueueService.tick() will pick this up and dispatch.
    return this.prisma.videoRender.update({
      where: { id: v.id },
      data:  {
        upscaleStatus:       'pending',
        upscaleErrorMessage: null,
        upscaleCompletedAt:  null,
        upscaleStartedAt:    null,
        upscalePromptId:     null,
      },
    });
  }

  /** Oldest video render with upscaleStatus='pending' — for pipeline arbitration. */
  findNextPendingUpscale() {
    return this.prisma.videoRender.findFirst({
      where:   { upscaleStatus: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /** Dispatch a pending upscale to ComfyUI. Called by the pipeline tick. */
  async dispatchPendingUpscale(videoId: string): Promise<void> {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new Error(`VideoRender ${videoId} not found`);
    if (v.upscaleStatus !== 'pending') return;

    const inputBasename = `upscale_${v.id}.mp4`;
    const inputDest     = path.join(COMFY_INPUT, inputBasename);
    if (!existsSync(inputDest)) {
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  {
          upscaleStatus:       'failed',
          upscaleErrorMessage: `Pre-staged mp4 vanished from COMFY_INPUT: ${inputDest}`,
          upscaleCompletedAt:  new Date(),
        },
      });
      return;
    }

    try {
      const template = this.loadUpscaleTemplate(v.shot.project.slug);
      const workflow = this.patchUpscale(template, {
        sourceVideo:    inputBasename,
        filenamePrefix: `video_fhd/${v.shot.shotCode}/${v.id}`,
      });
      const { promptId } = await this.comfy.queuePrompt(workflow);
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  {
          upscaleStatus:       'running',
          upscalePromptId:     promptId,
          upscaleStartedAt:    new Date(),
          upscaleErrorMessage: null,
        },
      });
    } catch (e: any) {
      this.logger.error(`dispatchPendingUpscale ${v.id} failed — resetting upscale state: ${e?.message}`);
      try { unlinkSync(inputDest); } catch { /* best-effort */ }
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  this.clearedUpscaleFields(),
      });
    }
  }

  private loadUpscaleTemplate(projectSlug: string): Record<string, any> {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', UPSCALE_WORKFLOW_FILENAME);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Upscale workflow not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  private patchUpscale(template: Record<string, any>, p: {
    sourceVideo:    string;
    filenamePrefix: string;
  }): Record<string, any> {
    const wf = structuredClone(template);
    if (wf['1']) wf['1'].inputs.file            = p.sourceVideo;
    if (wf['7']) wf['7'].inputs.filename_prefix = p.filenamePrefix;
    return wf;
  }

  // ── Polling ────────────────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    await this.pollMainRenders();
    await this.pollUpscales();
  }

  private async pollMainRenders(): Promise<void> {
    const running = await this.prisma.videoRender.findMany({ where: { status: 'running' } });
    for (const v of running) {
      if (!v.comfyPromptId) continue;
      const h = await this.comfy.getHistory(v.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      if (success) {
        const outputFile = this.firstVideoOutput(h.outputs);
        if (outputFile) {
          let moved: string | null = null;
          try {
            moved = await this.moveOutputToShotDir(v.shotId, outputFile, 'videos');
          } catch (e: any) {
            this.logger.warn(`move video ${v.id}: ${e?.message}`);
          }
          if (!moved) {
            // File not at expected src path yet (Comfy reports completion before
            // flushing mp4 in some builds). Leave row as `running` so the next
            // tick retries the move.
            this.logger.warn(`video ${v.id}: completion seen but file not yet at COMFY_OUTPUT — will retry next tick`);
            continue;
          }
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data: {
              status:         'completed',
              outputFilename: moved,
              completedAt:    new Date(),
            },
          });
        } else {
          this.logger.warn(`video ${v.id}: ComfyUI history had no video output — discarding row`);
          this.cleanupInputCopy(v.id, v.sourceImageFilename);
          await this.delete(v.id).catch((e) => this.logger.warn(`auto-delete ${v.id}: ${e?.message}`));
          continue;
        }
      } else {
        this.logger.warn(`video ${v.id}: ComfyUI reported non-success status — discarding row`);
        this.cleanupInputCopy(v.id, v.sourceImageFilename);
        await this.delete(v.id).catch((e) => this.logger.warn(`auto-delete ${v.id}: ${e?.message}`));
        continue;
      }
      this.cleanupInputCopy(v.id, v.sourceImageFilename);
    }
  }

  private async pollUpscales(): Promise<void> {
    const running = await this.prisma.videoRender.findMany({ where: { upscaleStatus: 'running' } });
    for (const v of running) {
      if (!v.upscalePromptId) continue;
      const h = await this.comfy.getHistory(v.upscalePromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      if (success) {
        const outputFile = this.firstVideoOutput(h.outputs);
        if (outputFile) {
          let moved: string | null = null;
          try {
            moved = await this.moveOutputToShotDir(v.shotId, outputFile, 'videos_fhd');
          } catch (e: any) {
            this.logger.warn(`move upscaled video ${v.id}: ${e?.message}`);
          }
          if (!moved) {
            this.logger.warn(`upscale ${v.id}: completion seen but file not yet at COMFY_OUTPUT — will retry next tick`);
            continue;
          }
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data: {
              upscaleStatus:      'completed',
              upscaledFilename:   moved,
              upscaleCompletedAt: new Date(),
            },
          });
        } else {
          // Upscale failed — but the underlying video is fine. Clear all upscale
          // fields so the row looks "never upscaled" and the UI re-offers the
          // button. We don't keep failed-upscale stubs around (same policy as
          // failed video renders).
          this.logger.warn(`upscale ${v.id}: ComfyUI history had no video output — resetting upscale state`);
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  this.clearedUpscaleFields(),
          });
        }
      } else {
        this.logger.warn(`upscale ${v.id}: ComfyUI reported non-success status — resetting upscale state`);
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  this.clearedUpscaleFields(),
        });
      }
      this.cleanupUpscaleInputCopy(v.id);
    }
  }

  /**
   * One-shot startup sweep: drop any leftover `status=failed` rows (from before
   * the auto-delete policy) and reset `upscaleStatus=failed` back to null so
   * the UI re-offers the upscale button.
   */
  private async sweepFailedRows(): Promise<void> {
    const failed = await this.prisma.videoRender.findMany({ where: { status: 'failed' } });
    for (const v of failed) {
      await this.delete(v.id).catch((e) => this.logger.warn(`sweep delete ${v.id}: ${e?.message}`));
    }
    if (failed.length > 0) this.logger.log(`sweepFailedRows: deleted ${failed.length} failed video row(s)`);

    const failedUpscales = await this.prisma.videoRender.updateMany({
      where: { upscaleStatus: 'failed' },
      data:  this.clearedUpscaleFields(),
    });
    if (failedUpscales.count > 0) this.logger.log(`sweepFailedRows: reset ${failedUpscales.count} failed upscale state(s)`);
  }

  private clearedUpscaleFields() {
    return {
      upscaleStatus:       null,
      upscaledFilename:    null,
      upscalePromptId:     null,
      upscaleStartedAt:    null,
      upscaleCompletedAt:  null,
      upscaleErrorMessage: null,
    };
  }

  private cleanupUpscaleInputCopy(videoId: string): void {
    const file = path.join(COMFY_INPUT, `upscale_${videoId}.mp4`);
    try { unlinkSync(file); } catch { /* best-effort */ }
  }

  /**
   * ComfyUI's history.outputs is `{ nodeId: { images?: [...], videos?: [...], gifs?: [...] } }`.
   * SaveVideo writes under `videos` in current builds; older releases used `images` (with mp4 extension).
   */
  private firstVideoOutput(outputs: Record<string, unknown> | undefined): { filename: string; subfolder?: string } | null {
    if (!outputs) return null;
    for (const o of Object.values(outputs)) {
      const oo = o as any;
      const candidates = [...(oo?.videos ?? []), ...(oo?.gifs ?? []), ...(oo?.images ?? [])];
      for (const c of candidates) {
        if (c?.filename && /\.(mp4|webm|mov|gif)$/i.test(c.filename as string)) {
          return { filename: c.filename, subfolder: c.subfolder };
        }
      }
    }
    return null;
  }

  private async moveOutputToShotDir(
    shotId: string,
    out: { filename: string; subfolder?: string },
    destSubdir: 'videos' | 'videos_fhd' = 'videos',
  ): Promise<string | null> {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: { project: true },
    });
    if (!shot) return null;
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, destSubdir);
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

  private cleanupInputCopy(videoId: string, sourceFilename: string): void {
    const ext  = path.extname(sourceFilename) || '.png';
    const file = path.join(COMFY_INPUT, `video_${videoId}${ext}`);
    try { unlinkSync(file); } catch { /* best-effort */ }
  }
}
