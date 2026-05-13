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
import { spawn } from 'child_process';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ComfyService } from '../../comfy/comfy.service';
import { StartVideoInput, VideoRenderParams } from './video-job.types';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const KOHYA_DIR    = process.env.KOHYA_DIR    ?? 'E:\\kohya_ss';
const PYTHON_BIN   = process.env.PYTHON_BIN   ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const FLORENCE_SCRIPT = path.join(APP_ROOT, 'scripts', 'florence2_caption_one.py');
const POLL_MS      = 4000;
const WORKFLOW_FILENAME = 'video_wan22_i2v_api.json';

// Wan2.2 i2v defaults — the 4-step lightx2v setup runs at 640×640 / 81 frames /
// 16 fps. Override via StartVideoInput when the shot needs different framing.
const DEFAULT_WIDTH  = 640;
const DEFAULT_HEIGHT = 640;
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

    // Copy the source image into COMFY_INPUT under a unique name so ComfyUI's
    // LoadImage can pick it up. We use the eventual VideoRender id as the
    // basename so concurrent renders never collide.
    const videoRender = await this.prisma.videoRender.create({
      data: {
        shotId:              shot.id,
        sourceImageFilename: shot.chosenRender,
        motionPrompt:        input.motionPrompt?.trim() || '',
        status:              'pending',
        workflowFilename:    WORKFLOW_FILENAME,
        params:              {
          seed:   input.seed   ?? Math.floor(Math.random() * 2 ** 32),
          width:  input.width  ?? DEFAULT_WIDTH,
          height: input.height ?? DEFAULT_HEIGHT,
          length: input.length ?? DEFAULT_LENGTH,
          fps:    input.fps    ?? DEFAULT_FPS,
        },
      },
    });

    const ext             = path.extname(shot.chosenRender) || '.png';
    const inputBasename   = `video_${videoRender.id}${ext}`;
    const inputDest       = path.join(COMFY_INPUT, inputBasename);
    mkdirSync(COMFY_INPUT, { recursive: true });
    copyFileSync(sourcePath, inputDest);

    try {
      const template = this.loadTemplate(shot.project.slug);
      const params   = videoRender.params as unknown as VideoRenderParams;
      const workflow = this.patch(template, {
        sourceImage:  inputBasename,
        motionPrompt: this.composeMotionPrompt(videoRender.motionPrompt, shot),
        seed:         params.seed,
        width:        params.width,
        height:       params.height,
        length:       params.length,
        fps:          params.fps,
        filenamePrefix: `video/${shot.shotCode}/${videoRender.id}`,
      });

      const { promptId } = await this.comfy.queuePrompt(workflow);
      await this.prisma.videoRender.update({
        where: { id: videoRender.id },
        data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
      });
      return { ...videoRender, status: 'running', comfyPromptId: promptId };
    } catch (e: any) {
      await this.prisma.videoRender.update({
        where: { id: videoRender.id },
        data:  { status: 'failed', errorMessage: e.message, completedAt: new Date() },
      });
      // Clean up the input copy on failure to avoid clutter.
      try { unlinkSync(inputDest); } catch { /* best-effort */ }
      throw e;
    }
  }

  list(shotId: string) {
    return this.prisma.videoRender.findMany({
      where:   { shotId },
      orderBy: { queuedAt: 'desc' },
    });
  }

  /**
   * Generate a suggested motion prompt by Florence-2-captioning the shot's
   * chosen render and appending motion language. Doesn't queue anything —
   * caller can edit the returned text and submit via POST /shots/:id/videos.
   *
   * Spawns scripts/florence2_caption_one.py with the kohya venv Python; the
   * model load takes ~30 sec per call (no caching) so this is a one-shot,
   * intended for the "Auto from Florence-2" UI link.
   */
  async autoMotionPrompt(shotId: string): Promise<{ caption: string; motionPrompt: string }> {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    if (!shot.chosenRender) {
      throw new BadRequestException(`Shot ${shot.shotCode} has no chosen render`);
    }
    const srcPath = path.join(
      APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, shot.chosenRender,
    );
    if (!existsSync(srcPath)) {
      throw new BadRequestException(`Source image missing on disk: ${srcPath}`);
    }
    const caption = await this.runFlorence(srcPath);
    // Motion template — pairs Wan i2v's idea of subtle camera + natural body
    // movement with whatever Florence saw. The user can edit before queueing.
    const motionPrompt =
      `${caption}, subtle camera push-in, natural breathing motion, gentle micro-movements, ambient natural lighting shifts`;
    return { caption, motionPrompt };
  }

  private runFlorence(imagePath: string): Promise<string> {
    if (!existsSync(FLORENCE_SCRIPT)) {
      throw new Error(`Florence-2 script not found: ${FLORENCE_SCRIPT}`);
    }
    return new Promise<string>((resolve, reject) => {
      const proc = spawn(PYTHON_BIN, [FLORENCE_SCRIPT, '--image', imagePath, '--task', 'DETAILED_CAPTION']);
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
      proc.stderr.on('data', (c: Buffer) => {
        const line = c.toString().trimEnd();
        stderr += line + '\n';
        this.logger.log(`florence: ${line}`);
      });
      proc.on('error', (e) => reject(e));
      proc.on('exit', (code) => {
        if (code === 0) resolve(stdout.trim());
        else            reject(new Error(`florence2_caption_one.py exited ${code}: ${stderr.slice(-500)}`));
      });
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

  // ── Polling ────────────────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    const running = await this.prisma.videoRender.findMany({ where: { status: 'running' } });
    for (const v of running) {
      if (!v.comfyPromptId) continue;
      const h = await this.comfy.getHistory(v.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      if (success) {
        const outputFile = this.firstVideoOutput(h.outputs);
        if (outputFile) {
          const moved = await this.moveOutputToShotDir(v.shotId, outputFile).catch((e) => {
            this.logger.warn(`move video ${v.id}: ${e?.message}`);
            return null;
          });
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data: {
              status:         'completed',
              outputFilename: moved ?? path.basename(outputFile.filename),
              completedAt:    new Date(),
            },
          });
        } else {
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  { status: 'failed', errorMessage: 'ComfyUI history had no video output', completedAt: new Date() },
          });
        }
      } else {
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  { status: 'failed', errorMessage: 'ComfyUI reported non-success status', completedAt: new Date() },
        });
      }
      // Clean up the source-image copy in COMFY_INPUT regardless of outcome.
      this.cleanupInputCopy(v.id, v.sourceImageFilename);
    }
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
  ): Promise<string | null> {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: { project: true },
    });
    if (!shot) return null;
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'videos');
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
