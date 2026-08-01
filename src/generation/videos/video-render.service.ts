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
import { StartVideoInput } from './video-job.types';
import { stripPromptWeights } from '../scenes/scene-render.service';
import { QueueLedgerService } from '../../pipeline/queue-ledger.service';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 4000;
const WORKFLOW_FILENAME = 'video_wan22_i2v_api.json';
// Alternative "quality" i2v workflow: full Wan2.2 dual-expert, no lightx2v
// speed LoRA, 20 steps @ cfg=4.0 → the negative prompt actually fires.
// MEASURED on 6 208 completed renders (2026-07-30): median 980 s against the
// fast path's 150 s, i.e. **6.5× slower**, not the ~5× this comment used to
// claim. Selected via StartVideoInput.mode='cfg'.
const CFG_WORKFLOW_FILENAME = 'video_wan22_i2v_cfg_api.json';
// «страж» — the fast graph with cfg raised on the HIGH-NOISE sampler only
// (node 14, steps 0→2 @ cfg 2.5); node 15 stays at cfg 1.0. In an A14B MoE the
// high-noise expert decides composition — what exists in the frame and where —
// so this is the one pass on which a negative prompt can stop a figure walking
// into an empty shot, and it is the cheapest place to pay for it: 6 model
// passes instead of 4 (~196 s vs 150 s) against the cfg path's 40 (980 s).
// Byte-identical to the fast default apart from node 14's cfg and node 10's
// fallback negative, so an A/B isolates cfg as the only variable.
const GUARD_WORKFLOW_FILENAME = 'video_wan22_i2v_guard_api.json';
// Allowlist of i2v workflow files the service is permitted to load — guards
// loadTemplate against a row carrying an unexpected workflowFilename value.
// `video_wan22_i2v_distill_api.json` was dropped from this set (and deleted from
// every project) 2026-07-30: it was byte-identical to the fast default, its
// mode was already gone from the API, and 0 of 6 945 render rows ever carried
// the filename. A row with an unknown name falls back to the fast default in
// loadTemplate anyway, so nothing can break by removing it.
const ALLOWED_WORKFLOWS = new Set([WORKFLOW_FILENAME, CFG_WORKFLOW_FILENAME, GUARD_WORKFLOW_FILENAME]);
// One-pass upscale→RIFE graph: a single ComfyUI prompt saves BOTH the FHD clip
// and the FPS-interpolated (smooth) clip — one queue job, models load once,
// nothing to reorder between the two steps, no intermediate mp4 decode. This is
// the ONLY upscale path (the legacy two-step dispatch was removed 2026-07-21);
// every project must carry this file.
const COMBINED_WORKFLOW_FILENAME = 'video_upscale_interp_api.json';
// MUST be a model in ComfyUI's NATIVE format (comfy_extras frame interpolation),
// i.e. from the Comfy-Org/frame_interpolation HF repo (rife_v4.x.safetensors /
// film_net_fp16.safetensors). Fannovel16 custom-node .pth files are NOT
// compatible — the native loader rejects them ("Unrecognized model format").
const INTERP_MODEL_NAME        = process.env.INTERP_MODEL_NAME ?? 'rife_v4.26.safetensors';
const DEFAULT_INTERP_MULTIPLIER = 2;

// Wan-readable phrasing for our own `Shot.cameraMove` vocabulary.
//
// Alibaba's I2V prompt formula is `Motion + Camera movement`, and an i2v model
// given no camera instruction does not hold still — it invents a drift, which at
// 4 steps is where warping and «бред» live. Measured 2026-07-30: only 84 of
// 5 671 animated shots (1.5 %) named a camera anywhere in their motion prompt,
// while `Shot.cameraMove` was populated for 6 205 of 6 425 (96.6 %). So the
// clause is DERIVED from that column at dispatch instead of being re-baked into
// thousands of prompt strings. Authoring rules: Skill(gen-studio-wan22) §4.
const CAMERA_CLAUSE: Record<string, string> = {
  static:        'the camera stays fixed',
  locked_off:    'the camera stays fixed',
  push_in:       'the camera pushes in slowly',
  pull_out:      'the camera pulls back slowly',
  track:         'the camera tracks slowly alongside',
  track_lateral: 'the camera tracks slowly sideways',
  pan:           'the camera pans slowly',
  pan_left:      'the camera pans slowly to the left',
  pan_right:     'the camera pans slowly to the right',
  tilt_up:       'the camera tilts up slowly',
  tilt_down:     'the camera tilts down slowly',
  handheld:      'a faint handheld drift',
  window_pov:    'the camera holds a fixed point of view through the window',
};
/** Does this text already tell the camera what to do? */
const MENTIONS_CAMERA = /camera|handheld|point of view/i;

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
  /** Guards against a slow poll overlapping the next tick of its own interval. */
  private polling = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly ledger: QueueLedgerService,
  ) {}

  onModuleInit() {
    this.poller = setInterval(() => void this.safePoll(), POLL_MS);
    // NOTE: there used to be a boot-time sweep here that hard-deleted every
    // `status='failed'` VideoRender in the database and reset every failed
    // upscale/interp lifecycle to null. It ran on EVERY restart, which is why
    // the video defect rate was unmeasurable: failures were erased before
    // anyone could count them. Failures are now kept — they stay visible in the
    // queue and their real elapsed time is billed to the film's waste total.
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
    // Static shots ship their still PNG only — they are never animated to a
    // Wan i2v clip. Refuse video generation outright so a stray /actions click,
    // Telegram tap, or direct API call can't queue video on a shot the user
    // deliberately marked renderMode='static'. Already-rendered videos are left
    // untouched; this only blocks NEW renders.
    if (shot.renderMode === 'static') {
      throw new BadRequestException(
        `Shot ${shot.shotCode} is renderMode='static' (no-video) — video generation is disabled for it. `
        + `Switch it to 'animated' first if you actually want a clip.`,
      );
    }
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
    const workflowFilename = this.resolveWorkflowFilename(input.mode);

    // Create N pending rows and put each in the queue. Actual ComfyUI dispatch
    // happens in PipelineQueueService.tick(), which serialises every job type
    // through the single GPU slot in queue order.
    const results = [];
    for (let i = 0; i < count; i++) {
      const seed = (i === 0 && input.seed !== undefined)
        ? input.seed
        : Math.floor(Math.random() * 2 ** 32);
      const params = {
        seed,
        width:  input.width  ?? DEFAULT_WIDTH,
        height: input.height ?? DEFAULT_HEIGHT,
        length: input.length ?? DEFAULT_LENGTH,
        fps:    input.fps    ?? DEFAULT_FPS,
      };
      const row = await this.prisma.videoRender.create({
        data: {
          shotId:              shot.id,
          sourceImageFilename: shot.chosenRender!,
          motionPrompt:        input.motionPrompt?.trim() || '',
          status:              'pending',
          workflowFilename:    workflowFilename,
          params,
        },
      });
      await this.ledger.enqueue('video', row.id, { workflowFilename, paramsSnapshot: params });
      results.push(row);
    }
    return results;
  }

  /** Dispatch a pending video render to ComfyUI. Called by the pipeline tick. */
  async dispatchPending(videoId: string): Promise<void> {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new Error(`VideoRender ${videoId} not found`);
    if (v.status !== 'pending') return;

    // Defence in depth: never render video for a renderMode='static' shot, even
    // if a pending row slipped in before the start() guard existed. Mark it
    // 'skipped' (a terminal status the queue never re-selects) so it neither
    // renders nor loops, and NO file is touched — static shots keep their still
    // PNG as the deliverable.
    if (v.shot.renderMode === 'static') {
      const why = "shot is renderMode='static'; video generation disabled";
      this.logger.warn(
        `dispatchPending video ${v.id}: shot ${v.shot.shotCode} is renderMode='static' — skipping (no video for static shots)`,
      );
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  { status: 'skipped', errorMessage: why },
      });
      // 'skipped' burned no GPU time, so it is billed to neither side of the
      // useful/wasted split — but it still has to leave the queue.
      await this.ledger.close('video', v.id, { status: 'skipped', errorMessage: why });
      return;
    }

    const sourcePath = path.join(
      APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode, v.sourceImageFilename,
    );
    if (!existsSync(sourcePath)) {
      // Source image vanished. The row is kept as `failed` (it used to be
      // hard-deleted, which is how failure history disappeared) — it stays out of
      // the shot's clip list but remains in the queue with its reason.
      const why = `Source image missing on disk: ${sourcePath}`;
      this.logger.warn(`dispatchPending video ${v.id}: ${why} — failing the row`);
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  { status: 'failed', errorMessage: why, completedAt: new Date() },
      });
      await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
      return;
    }

    const ext           = path.extname(v.sourceImageFilename) || '.png';
    const inputBasename = `video_${v.id}${ext}`;
    const inputDest     = path.join(COMFY_INPUT, inputBasename);
    mkdirSync(COMFY_INPUT, { recursive: true });
    copyFileSync(sourcePath, inputDest);

    try {
      const params = v.params as { seed: number; width: number; height: number; length: number; fps: number };
      const template = this.loadTemplate(v.shot.project.slug, v.workflowFilename);
      // Resolve motion negative from DB: per-shot override > project default.
      // When both empty, the workflow JSON's hardcoded fallback stays.
      const pf      = (v.shot.promptFields ?? {}) as Record<string, unknown>;
      const project = v.shot.project as any;
      const rawMotionNegative =
        (typeof pf.motionNegative === 'string' && pf.motionNegative.trim().length > 0)
          ? (pf.motionNegative as string)
          : (typeof project.defaultVideoNegative === 'string' && project.defaultVideoNegative.trim().length > 0
              ? project.defaultVideoNegative as string
              : undefined);
      // Strip any weight syntax from BOTH motion prompts before they reach
      // the i2v workflow. Project rule: zero `(token:N)` anywhere.
      const motionPrompt = stripPromptWeights(
        this.composeMotionPrompt(v.motionPrompt, v.shot, project),
        (tok, w) => this.logger.warn(`[${v.shot.shotCode}] stripped motionPrompt weight "(${tok}:${w})"`),
      );
      // Warn-only: surfaces negations-in-the-positive and missing camera clauses
      // in the log. Does not rewrite the prompt and does not block the render.
      this.lintMotionPrompt(v.shot.shotCode, motionPrompt);
      const motionNegative = rawMotionNegative
        ? stripPromptWeights(
            rawMotionNegative,
            (tok, w) => this.logger.warn(`[${v.shot.shotCode}] stripped motionNegative weight "(${tok}:${w})"`),
          )
        : undefined;
      const workflow = this.patch(template, {
        sourceImage:    inputBasename,
        motionPrompt,
        motionNegative,
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
      await this.ledger.attachPrompt('video', v.id, promptId);
    } catch (e: any) {
      const why = `ComfyUI dispatch failed: ${e?.message}`;
      this.logger.error(`dispatchPending video ${v.id}: ${why}`);
      try { unlinkSync(inputDest); } catch { /* best-effort */ }
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  { status: 'failed', errorMessage: why, completedAt: new Date() },
      });
      await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
    }
  }

  /**
   * Clips of a shot, for the shot's video tab.
   *
   * Failed, cancelled and skipped renders are deliberately excluded: they are
   * kept in the database (their time counts towards the film's waste total) and
   * remain visible with their error in the queue, but a shot's clip list should
   * only offer material that can actually be used.
   */
  list(shotId: string) {
    return this.prisma.videoRender.findMany({
      where:   { shotId, status: { notIn: ['failed', 'cancelled', 'skipped'] } },
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
    const base    = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode);
    const preview = path.join(base, 'videos', v.outputFilename);
    if (existsSync(preview)) return preview;
    // The low-res preview was pruned by the tier consolidation (2026-07-22),
    // which keeps only the final smooth clip. Fall back to videos_smooth/ so the
    // base player still plays (shows the finished clip) instead of 404-ing.
    return path.join(base, 'videos_smooth', v.interpFilename ?? v.outputFilename);
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

    // Cancel any in-flight pipeline work for this render BEFORE dropping the row,
    // so we don't (a) leave ComfyUI burning GPU on a now-deleted render or
    // (b) orphan the single queue slot on a running row that never harvests.
    // Each stage's queue "job" lives on this row (base/upscale/interp status +
    // promptId), so removing the row removes the job — we just stop ComfyUI too.
    await this.cancelInflightComfy(v, `video ${v.id} deleted`);

    // Seal the ledger BEFORE the row and files go away. Both lifecycles on this
    // row are separate queue entries, so both have to be finalised: whatever
    // they had already spent is preserved as history, and anything unresolved
    // becomes waste attributed to a hand-deleted artifact.
    await this.ledger.finalizeForDeletion('video',      v.id, `video ${v.id} deleted`);
    await this.ledger.finalizeForDeletion('video_post', v.id, `video ${v.id} deleted`);

    const shotDir = path.join(APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode);
    const toRemove = [
      v.outputFilename   ? path.join(shotDir, 'videos',        v.outputFilename)   : null,
      v.upscaledFilename ? path.join(shotDir, 'videos_fhd',    v.upscaledFilename) : null,
      v.interpFilename   ? path.join(shotDir, 'videos_smooth', v.interpFilename)   : null,
      // Pre-staged copies in COMFY_INPUT — these are short-lived but cleanupInputCopy
      // is best-effort too, so re-try here in case the row dies before completion.
      path.join(COMFY_INPUT, `video_${v.id}${path.extname(v.sourceImageFilename) || '.png'}`),
      path.join(COMFY_INPUT, `upscale_${v.id}.mp4`),
      path.join(COMFY_INPUT, `interp_${v.id}.mp4`),
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

  /**
   * Stop any in-flight ComfyUI work for a render's three stages (base i2v,
   * upscale, interp). For each stage that is `running`/`pending` with a live
   * promptId, ask ComfyUI to interrupt (if running) or dequeue (if pending).
   * Best-effort and idempotent — safe to call on an already-finished render.
   * Used by delete() and the queue cancel endpoint so a cancel/delete actually
   * frees the GPU instead of only flipping a DB status.
   */
  async cancelInflightComfy(
    v: {
      comfyPromptId?:  string | null; status?:        string | null;
      upscalePromptId?: string | null; upscaleStatus?: string | null;
      interpPromptId?:  string | null; interpStatus?:  string | null;
    },
    reason = 'cancelled',
  ): Promise<void> {
    const inflight = (s?: string | null) => s === 'running' || s === 'pending';
    const stages: Array<[string, string | null | undefined, string | null | undefined]> = [
      ['base',    v.status,        v.comfyPromptId],
      ['upscale', v.upscaleStatus, v.upscalePromptId],
      ['interp',  v.interpStatus,  v.interpPromptId],
    ];
    for (const [stage, status, promptId] of stages) {
      if (!inflight(status) || !promptId) continue;
      try {
        const did = await this.comfy.cancelPrompt(promptId);
        this.logger.log(`${reason}: ${stage} prompt ${promptId} → ComfyUI ${did}`);
      } catch (e) {
        this.logger.warn(`${reason}: failed to cancel ${stage} prompt ${promptId}: ${(e as Error).message}`);
      }
    }
  }

  /** Absolute path to the upscaled clip once `upscaleStatus=completed`. */
  async upscaledFilePath(videoId: string): Promise<string> {
    const v = await this.get(videoId);
    if (!v.upscaledFilename) throw new BadRequestException(`Video ${videoId} has no upscaled version yet`);
    const shot = await this.prisma.shot.findUnique({
      where:   { id: v.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot for video ${videoId} not found`);
    const base = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode);
    const fhd  = path.join(base, 'videos_fhd', v.upscaledFilename);
    if (existsSync(fhd)) return fhd;
    // One-pass renders no longer persist a separate FHD intermediate — the FHD
    // SaveVideo branch was removed 2026-07-22. `upscaledFilename` mirrors the
    // smooth file, so fall back to videos_smooth/ for those rows.
    return path.join(base, 'videos_smooth', v.upscaledFilename);
  }

  // ── Workflow loading + patching ────────────────────────────────────────────

  /**
   * Resolve the i2v workflow file — an explicit per-shot choice, never inferred:
   *   'cfg'          → 20 steps @ cfg 4 on both experts, 40 passes = «качество».
   *   'guard'        → cfg 2.5 on the high-noise expert only, 6 passes = «страж».
   *   'fast' / none  → 4-step lightx2v full-distill fp8, cfg=1 on both, 4
   *                    passes, the negative is never evaluated = «быстро»,
   *                    the DEFAULT again since 2026-08-01 (user call).
   *
   * The default was 'guard' for two days (2026-07-30 → 2026-08-01) on the theory
   * that turning the negative on for the two steps where an A14B MoE decides
   * composition would stop figures walking into frames — but that never got a
   * rendered A/B, and it costs +31 % on every clip in the queue. Back to 'fast':
   * at cfg=1 the positive motion prompt is the only live channel, which is what
   * Skill(gen-studio-wan22) is written around. «страж» stays one click away for
   * the shots that actually need it.
   *
   * The fallback matters as much as the select: `POST shots/:id/videos` is the
   * ONLY way a video is ever queued, and every scripted bulk enqueue omits
   * `mode` — so this line is what a mass re-render runs on.
   *
   * There is still NO 'auto' — the old auto INFERRED the slow path from shot
   * properties and silently multiplied render time. This is a fixed default the
   * user chose, overridable per render, not an inference.
   */
  private resolveWorkflowFilename(mode: 'fast' | 'cfg' | 'guard' | undefined): string {
    if (mode === 'cfg')   return CFG_WORKFLOW_FILENAME;
    if (mode === 'guard') return GUARD_WORKFLOW_FILENAME;
    return WORKFLOW_FILENAME;
  }

  private loadTemplate(projectSlug: string, workflowFilename?: string | null): Record<string, any> {
    // Only ever load a known i2v workflow file; fall back to the fast default
    // if the row carries an empty/unrecognised name.
    const filename = workflowFilename && ALLOWED_WORKFLOWS.has(workflowFilename)
      ? workflowFilename
      : WORKFLOW_FILENAME;
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Video workflow not found: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  private patch(template: Record<string, any>, p: {
    sourceImage:    string;
    motionPrompt:   string;
    /** Optional override for node 10 (negative). When undefined, the workflow
     *  JSON's hardcoded fallback stays. Resolved from
     *  `Shot.promptFields.motionNegative || Project.defaultVideoNegative`. */
    motionNegative?: string;
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

    // Positive prompt is on node 9; negative on node 10. Negative only set
    // when the caller provides one (per-shot or per-project DB value) — when
    // undefined the JSON's hardcoded text stays.
    set('9',  'text',   p.motionPrompt);
    if (p.motionNegative !== undefined) set('10', 'text', p.motionNegative);

    // Both KSampler stages need the same seed (14 = high-noise stage, 15 = low-noise).
    set('14', 'noise_seed', p.seed);
    set('15', 'noise_seed', p.seed);

    // Output framerate (CreateVideo) + filename prefix (SaveVideo).
    set('17', 'fps',              p.fps);
    set('18', 'filename_prefix',  p.filenamePrefix);
    return wf;
  }

  /**
   * Resolve the Wan2.2 positive prompt (node 9 of the i2v graph) for this render.
   *
   * The prompt is ONE string and it is the ONLY channel that reaches the model
   * on the default fast path (cfg=1.0 → the negative is mathematically inert),
   * so nothing is concatenated onto it beyond the motion line itself. Alibaba's
   * own I2V formula is `Motion + Camera movement`: the start image already
   * carries entity, scene, framing and style, and re-describing them asks a
   * generative model to re-generate content it was meant to preserve — that is
   * what morphing and identity drift are. Authoring rules: Skill(gen-studio-wan22).
   *
   * `promptFields.narrativeBeat` used to be appended here for every non-static
   * shot. It was removed 2026-07-30: a narrative beat is an abstraction
   * («расплата за жадность», "a wheel in a skid is an abstraction"), and Wan
   * answers an abstraction by inventing motion to fill it. 408 animated shots
   * carried a beat at the time of removal, all of them non-static, i.e. all of
   * them were shipping their beat to the model as a movement instruction.
   *
   * Static-shot escape hatch: if `promptFields.camera.movement` begins with
   * `static` (e.g. `static_locked_off`), the empty-prompt fallback flips to an
   * explicit no-motion line.
   */
  private composeMotionPrompt(
    motion: string,
    shot: { promptFields: any; cameraMove?: string | null; shotCode?: string },
    project?: { defaultMotionPrompt?: string | null; defaultStaticMotionPrompt?: string | null },
  ): string {
    const pf = (shot.promptFields ?? {}) as Record<string, unknown>;
    const cam = (pf.camera as Record<string, unknown> | undefined) ?? {};
    const movement = typeof cam.movement === 'string' ? cam.movement : '';
    const isStatic = /^static/i.test(movement.trim());

    // Hard-coded last-resort fallback used only if BOTH the per-render motion
    // prompt AND the project's default are empty. Project owners should
    // override via `Project.defaultMotionPrompt` /
    // `Project.defaultStaticMotionPrompt` from the UI.
    //
    // Both were rewritten 2026-07-30 into POSITIVE locks. The old static literal
    // was 60 words of negation ("no camera motion, no parallax, no zoom, ... No
    // people walking, no figures moving ...") which, at cfg=1 where the positive
    // is the only live channel, is a list of the things we do not want handed
    // straight to the model — Skill(gen-studio-wan22) §3.
    const HARDCODED_STATIC  = 'the camera stays locked and fixed for the whole shot, every surface and object holding its exact position, the air still and the light steady, a photograph holding its breath';
    const HARDCODED_DEFAULT = 'the camera pushes in slowly, quiet breathing and small natural micro-movements, the rest of the frame holding still';

    const userMotion = motion?.trim() ?? '';
    // Per-shot baked motion-direction override. Wins over project-level
    // static/non-static fallback so shots like "static aerial of moving train"
    // can express "camera locked but subject moves" without abusing the
    // camera.movement field. Per-render `motion` arg still wins over this
    // (the user typed something at queue time).
    const shotMotion = typeof pf.motionPrompt === 'string' ? pf.motionPrompt.trim() : '';
    const projectFallback = isStatic
      ? (project?.defaultStaticMotionPrompt?.trim() || HARDCODED_STATIC)
      : (project?.defaultMotionPrompt?.trim()       || HARDCODED_DEFAULT);
    const motionLine = userMotion || shotMotion || projectFallback;

    // Derive the camera clause from `Shot.cameraMove` when the prompt itself
    // says nothing about the camera. Additive only: a prompt that already names
    // a camera behaviour is left exactly as written, so a hand-authored prompt
    // can never be contradicted by the enum, and a shot with no cameraMove is
    // left alone rather than given an invented default.
    const move  = (shot.cameraMove ?? '').trim();
    const clause = CAMERA_CLAUSE[move];
    if (clause && !MENTIONS_CAMERA.test(motionLine)) {
      return `${motionLine.replace(/[\s,]+$/, '')}, ${clause}`;
    }
    return motionLine;
  }

  /**
   * Warn-only lint on the resolved Wan positive prompt. Never rewrites and never
   * blocks a render — it exists so the two defects that actually produce «бред»
   * are visible in the log instead of only in the output video:
   *
   *  1. a negation in the positive. At cfg=1 the positive is the only live
   *     channel, and diffusion has no operator for "not": `no people` hands the
   *     model the token *people*. Positive locks instead — Skill(gen-studio-wan22) §3.
   *  2. no camera clause at all. An i2v model given no camera instruction does
   *     not hold still, it invents a drift, and at 4 steps that drift is where
   *     warping lives — §4. "the camera stays fixed" counts as an instruction.
   *
   * Also flags prompts long enough to approach the umt5 quality cliff (~320–350
   * tokens; the 512-token cap truncates silently from the tail).
   */
  private lintMotionPrompt(shotCode: string, prompt: string): void {
    const low = prompt.toLowerCase();
    const negations = (low.match(/\bno\s+\w+|\bwithout\s+\w+/g) ?? []).slice(0, 4);
    if (negations.length > 0) {
      this.logger.warn(
        `[${shotCode}] motionPrompt carries negations in the POSITIVE at cfg=1 `
        + `(${negations.join(', ')}) — use positive locks (Skill: gen-studio-wan22 §3)`,
      );
    }
    if (!/camera|handheld|point of view/i.test(prompt)) {
      this.logger.warn(
        `[${shotCode}] motionPrompt names no camera behaviour — Wan will invent one `
        + `(Skill: gen-studio-wan22 §4)`,
      );
    }
    const words = prompt.trim().split(/\s+/).length;
    if (words > 100) {
      this.logger.warn(
        `[${shotCode}] motionPrompt is ${words} words — past the 30–60 word budget and `
        + `approaching the umt5 quality cliff (Skill: gen-studio-wan22 §2)`,
      );
    }
  }

  // ── Upscale on demand ──────────────────────────────────────────────────────

  /**
   * Queue the post pass on a completed video: ONE ComfyUI prompt that upscales
   * to 1920×1080 and interpolates the framerate, saving the finished smooth clip.
   *
   * There is deliberately no separate "interpolate" job. Upscale and RIFE were
   * split into two queue jobs before 2026-07-21, which forced ComfyUI to reload
   * models between them and needed a special-case sticky rule in the dispatcher
   * to claw the time back. One workflow, one job, one queue entry.
   *
   * Idempotent: a no-op while the pass is pending/running, or once it completed —
   * pass `force` to run it again (that is what a re-interpolate request is now).
   */
  async upscale(videoId: string, opts: { force?: boolean } = {}) {
    const v = await this.prisma.videoRender.findUnique({
      where:   { id: videoId },
      include: { shot: { include: { project: true } } },
    });
    if (!v) throw new NotFoundException(`Video ${videoId} not found`);
    if (v.status !== 'completed' || !v.outputFilename) {
      throw new BadRequestException(`Video ${videoId} is not completed yet`);
    }
    if (v.upscaleStatus === 'running' || v.upscaleStatus === 'pending') return v;
    if (v.upscaleStatus === 'completed' && v.upscaledFilename && !opts.force) return v;

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

    // Mark pending, then queue it. `upscaleQueuedAt` is no longer an ordering
    // key — queue position lives on the queue entry's rank — so it now records
    // only what its name says: when the pass was requested.
    const row = await this.prisma.videoRender.update({
      where: { id: v.id },
      data:  {
        upscaleStatus:       'pending',
        upscaleQueuedAt:     new Date(),
        upscaleErrorMessage: null,
        upscaleCompletedAt:  null,
        upscaleStartedAt:    null,
        upscalePromptId:     null,
        // A re-run invalidates the previously produced clip. The row forgets the
        // old attempt, but the queue ledger keeps it as its own history entry, so
        // the time it consumed is still counted.
        ...this.clearedInterpFields(),
      },
    });
    await this.ledger.enqueue('video_post', v.id, {
      workflowFilename: COMBINED_WORKFLOW_FILENAME,
      paramsSnapshot:   { multiplier: v.interpMultiplier ?? DEFAULT_INTERP_MULTIPLIER, source: v.outputFilename },
      // A re-run means an earlier attempt's columns were just wiped from the row.
      historyTruncated: !!opts.force,
    });
    return row;
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
      const why = `Pre-staged mp4 vanished from COMFY_INPUT: ${inputDest}`;
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  { upscaleStatus: 'failed', upscaleErrorMessage: why, upscaleCompletedAt: new Date() },
      });
      await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
      return;
    }

    try {
      // ONE-PASS upscale→RIFE: a single prompt renders both the FHD and the
      // smooth clip. The RIFE stage eats the upscaled frames directly — no
      // re-encode + decode of the intermediate FHD mp4 between the steps. This
      // is the only upscale path; a missing combined workflow is a config error.
      const combined = this.loadCombinedTemplate(v.shot.project.slug);
      if (!combined) {
        const why = `Combined upscale→RIFE workflow missing: data/${v.shot.project.slug}/comfy/${COMBINED_WORKFLOW_FILENAME}`;
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  { upscaleStatus: 'failed', upscaleErrorMessage: why, upscaleCompletedAt: new Date() },
        });
        await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
        try { unlinkSync(inputDest); } catch { /* best-effort */ }
        return;
      }
      const mult   = v.interpMultiplier ?? DEFAULT_INTERP_MULTIPLIER;
      const params = (v.params ?? {}) as { fps?: number };
      const workflow = this.patchCombined(combined, {
        sourceVideo:  inputBasename,
        fhdPrefix:    `video_fhd/${v.shot.shotCode}/${v.id}`,
        smoothPrefix: `video_smooth/${v.shot.shotCode}/${v.id}`,
        multiplier:   mult,
        fps:          (params.fps ?? DEFAULT_FPS) * mult,
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
      await this.ledger.attachPrompt('video_post', v.id, promptId);
    } catch (e: any) {
      const why = `ComfyUI dispatch failed: ${e?.message}`;
      this.logger.error(`dispatchPendingUpscale ${v.id}: ${why} — resetting the stage so the button re-offers it`);
      try { unlinkSync(inputDest); } catch { /* best-effort */ }
      // Close the ledger entry FIRST: it is the permanent record of the failed
      // attempt, and clearing the row's columns below removes the only other
      // trace of it (and would leave the entry with nothing to reconcile against).
      await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
      await this.prisma.videoRender.update({
        where: { id: v.id },
        data:  this.clearedUpscaleFields(),
      });
    }
  }

  /** Combined one-pass upscale→RIFE template, or null when the project doesn't have it (legacy fallback). */
  private loadCombinedTemplate(projectSlug: string): Record<string, any> | null {
    const filePath = path.join(APP_ROOT, 'data', projectSlug, 'comfy', COMBINED_WORKFLOW_FILENAME);
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  private patchCombined(template: Record<string, any>, p: {
    sourceVideo:  string;
    fhdPrefix:    string;
    smoothPrefix: string;
    multiplier:   number;
    fps:          number;
  }): Record<string, any> {
    const wf = structuredClone(template);
    if (wf['1'])  wf['1'].inputs.file             = p.sourceVideo;      // LoadVideo
    if (wf['7'])  wf['7'].inputs.filename_prefix  = p.fhdPrefix;        // SaveVideo (FHD)
    if (wf['8'])  wf['8'].inputs.model_name       = INTERP_MODEL_NAME;  // FrameInterpolationModelLoader
    if (wf['9'])  wf['9'].inputs.multiplier       = p.multiplier;       // FrameInterpolate
    if (wf['10']) wf['10'].inputs.fps             = p.fps;              // CreateVideo (smooth)
    if (wf['11']) wf['11'].inputs.filename_prefix = p.smoothPrefix;     // SaveVideo (smooth)
    return wf;
  }

  // ── FPS interpolation ────────────────────────────────────────────────────────
  //
  // Interpolation is not a job of its own any more. It is the second half of the
  // combined post pass (`video_upscale_interp_api.json`), which upscales and
  // interpolates inside ONE ComfyUI prompt: models load once, there is nothing to
  // order between the halves, and no intermediate mp4 is encoded and decoded.
  //
  // The standalone two-prompt path that used to live here was a rudiment of the
  // pre-2026-07-21 design. It is gone, together with the dispatcher's
  // special-case rule that existed only to stop the pair from thrashing ComfyUI's
  // model cache.

  /**
   * Re-run the post pass for a clip whose smooth output needs regenerating.
   *
   * Kept as the entry point behind `POST /videos/:id/interpolate`, but it no
   * longer queues a separate interpolation: it re-runs the one combined pass,
   * which is the only way the two steps happen at all.
   */
  async interpolate(videoId: string, _multiplier = DEFAULT_INTERP_MULTIPLIER) {
    return this.upscale(videoId, { force: true });
  }


  /** Absolute path to the smoothed mp4 once `interpStatus=completed`. */
  async interpolatedFilePath(videoId: string): Promise<string> {
    const v = await this.get(videoId);
    if (!v.interpFilename) throw new BadRequestException(`Video ${videoId} has no interpolated version yet`);
    const shot = await this.prisma.shot.findUnique({
      where:   { id: v.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot for video ${videoId} not found`);
    return path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'videos_smooth', v.interpFilename);
  }

  // ── Polling ────────────────────────────────────────────────────────────────

  /**
   * One poll at a time. A pass harvests ComfyUI history and moves mp4s, which
   * can easily outlast the 4 s interval; without this guard several passes run
   * concurrently, all see the same finished row, and all harvest it — producing
   * duplicate file moves and duplicate history records.
   */
  private async safePoll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try { await this.poll(); }
    catch (e: any) { this.logger.warn(`poll: ${e?.message ?? e}`); }
    finally { this.polling = false; }
  }

  private async poll(): Promise<void> {
    await this.pollMainRenders();
    await this.pollUpscales();
  }

  /**
   * Watchdog: is a `running` stage's prompt truly LOST — i.e. ComfyUI has no
   * history for it AND it's not in the live queue (running or pending) — past a
   * grace window? This is the orphan case (ComfyUI restarted / dropped the job)
   * that otherwise pins a row at `running` forever and stalls the single queue
   * slot. The caller has already confirmed there's no completed history.
   *
   * Only returns true on a DEFINITIVE 'absent' verdict; a transient ComfyUI
   * outage yields 'unknown' → we wait rather than fail a job that's still alive.
   */
  private async isOrphaned(promptId: string, startedAt: Date | null): Promise<boolean> {
    const GRACE_MS = 120_000; // don't judge a freshly-dispatched prompt (queue/history lag)
    if (startedAt && Date.now() - startedAt.getTime() < GRACE_MS) return false;
    const where = await this.comfy.promptPlacement(promptId).catch(() => 'unknown' as const);
    return where === 'absent';
  }

  private async pollMainRenders(): Promise<void> {
    const running = await this.prisma.videoRender.findMany({ where: { status: 'running' } });
    for (const v of running) {
      if (!v.comfyPromptId) continue;
      const h = await this.comfy.getHistory(v.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) {
        if (await this.isOrphaned(v.comfyPromptId, v.startedAt)) {
          const why = 'ComfyUI lost the prompt (orphaned) — auto-failed by watchdog';
          this.logger.warn(`video ${v.id}: ComfyUI lost prompt ${v.comfyPromptId} (orphaned) — failing to free the slot`);
          this.cleanupInputCopy(v.id, v.sourceImageFilename);
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  { status: 'failed', completedAt: new Date(), errorMessage: why },
          });
          await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
        }
        continue;
      }

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
          await this.ledger.close('video', v.id, { status: 'completed', outputFilename: moved });
        } else {
          // Kept as `failed` instead of hard-deleted: the row is the only trace
          // that this render was attempted at all, and its elapsed time belongs in
          // the film's waste total.
          const why = 'ComfyUI history had no video output';
          this.logger.warn(`video ${v.id}: ${why} — failing the row`);
          this.cleanupInputCopy(v.id, v.sourceImageFilename);
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  { status: 'failed', completedAt: new Date(), errorMessage: why },
          });
          await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
          continue;
        }
      } else {
        const why = `ComfyUI reported non-success status (${h.status.status_str ?? 'unknown'})`;
        this.logger.warn(`video ${v.id}: ${why} — failing the row`);
        this.cleanupInputCopy(v.id, v.sourceImageFilename);
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  { status: 'failed', completedAt: new Date(), errorMessage: why },
        });
        await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
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
      if (!h?.status?.completed) {
        if (await this.isOrphaned(v.upscalePromptId, v.upscaleStartedAt)) {
          const why = 'ComfyUI lost the prompt (orphaned) — auto-failed by watchdog';
          this.logger.warn(`post ${v.id}: ComfyUI lost prompt ${v.upscalePromptId} (orphaned) — failing to free the slot`);
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  { upscaleStatus: 'failed', upscaleCompletedAt: new Date(), upscaleErrorMessage: why },
          });
          await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
        }
        continue;
      }

      const success = h.status.status_str === 'success';
      if (success) {
        // The prompt is the combined one-pass graph (smooth output only — the
        // FHD intermediate SaveVideo was removed 2026-07-22; we no longer write
        // or keep it), OR a legacy single-step upscale (FHD only, still in
        // flight). Route by save subfolder; prefer smooth.
        const outs      = this.allVideoOutputs(h.outputs);
        const smoothOut = outs.find((o) => (o.subfolder ?? '').includes('video_smooth')) ?? null;
        const fhdOut    = outs.find((o) => (o.subfolder ?? '').includes('video_fhd'))
          ?? (smoothOut ? null : outs[0]) ?? null;   // legacy: the sole output is the FHD clip
        const primaryOut = smoothOut ?? fhdOut;
        if (primaryOut) {
          let movedSmooth: string | null = null;
          let movedFhd:    string | null = null;
          try {
            if (smoothOut) {
              movedSmooth = await this.moveOutputToShotDir(v.shotId, smoothOut, 'videos_smooth');
            } else if (fhdOut) {
              movedFhd = await this.moveOutputToShotDir(v.shotId, fhdOut, 'videos_fhd');
            }
          } catch (e: any) {
            this.logger.warn(`move upscaled video ${v.id}: ${e?.message}`);
          }
          if (smoothOut ? !movedSmooth : !movedFhd) {
            // moveOutputToShotDir is retry-idempotent (already-moved files are
            // recognised at dest), so a partial move just finishes next tick.
            this.logger.warn(`upscale ${v.id}: completion seen but file not yet at COMFY_OUTPUT — will retry next tick`);
            continue;
          }
          if (movedSmooth) {
            // One-pass graph: only the smooth clip is persisted. Point BOTH the
            // upscale and interp lifecycle at that single file (the "best from
            // the previous step"), so downstream gates/paths keyed on
            // upscaledFilename still resolve — with no redundant videos_fhd copy.
            await this.prisma.videoRender.update({
              where: { id: v.id },
              data: {
                upscaleStatus:      'completed',
                upscaledFilename:   movedSmooth,
                upscaleCompletedAt: new Date(),
                interpStatus:       'completed',
                interpFilename:     movedSmooth,
                interpPromptId:     v.upscalePromptId,
                interpMultiplier:   v.interpMultiplier ?? DEFAULT_INTERP_MULTIPLIER,
                interpQueuedAt:     v.upscaleStartedAt ?? new Date(),
                interpStartedAt:    v.upscaleStartedAt ?? new Date(),
                interpCompletedAt:  new Date(),
                interpErrorMessage: null,
              },
            });
            await this.ledger.close('video_post', v.id, { status: 'completed', outputFilename: movedSmooth });
          } else {
            // A prompt from before the combined graph existed: it produced only
            // the FHD clip. Record it and stop — the smooth clip now comes from
            // re-running the one combined pass, never from a second job.
            await this.prisma.videoRender.update({
              where: { id: v.id },
              data: {
                upscaleStatus:      'completed',
                upscaledFilename:   movedFhd,
                upscaleCompletedAt: new Date(),
              },
            });
            await this.ledger.close('video_post', v.id, { status: 'completed', outputFilename: movedFhd });
            this.logger.warn(
              `post ${v.id}: legacy FHD-only output — no smooth clip. Re-run the post pass to produce one.`,
            );
          }
        } else {
          // The pass produced nothing. The stage's columns are cleared so the UI
          // re-offers the button, but the attempt itself is preserved in the queue
          // ledger — that is where its elapsed time is billed.
          const why = 'ComfyUI history had no video output';
          this.logger.warn(`post ${v.id}: ${why} — resetting the stage`);
          await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
          await this.prisma.videoRender.update({
            where: { id: v.id },
            data:  this.clearedUpscaleFields(),
          });
        }
      } else {
        const why = `ComfyUI reported non-success status (${h.status.status_str ?? 'unknown'})`;
        this.logger.warn(`post ${v.id}: ${why} — resetting the stage`);
        await this.ledger.close('video_post', v.id, { status: 'failed', errorMessage: why });
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  this.clearedUpscaleFields(),
        });
      }
      this.cleanupUpscaleInputCopy(v.id);
    }
  }

  private clearedUpscaleFields() {
    return {
      upscaleStatus:       null,
      upscaledFilename:    null,
      upscalePromptId:     null,
      upscaleQueuedAt:     null,
      upscaleStartedAt:    null,
      upscaleCompletedAt:  null,
      upscaleErrorMessage: null,
    };
  }

  private clearedInterpFields() {
    return {
      interpStatus:       null,
      interpFilename:     null,
      interpPromptId:     null,
      interpMultiplier:   null,
      interpQueuedAt:     null,
      interpStartedAt:    null,
      interpCompletedAt:  null,
      interpErrorMessage: null,
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

  /** Every video-ish file in a prompt's history outputs — multi-output graphs (combined upscale→RIFE) save more than one. */
  private allVideoOutputs(outputs: Record<string, unknown> | undefined): { filename: string; subfolder?: string }[] {
    if (!outputs) return [];
    const found: { filename: string; subfolder?: string }[] = [];
    for (const o of Object.values(outputs)) {
      const oo = o as any;
      for (const c of [...(oo?.videos ?? []), ...(oo?.gifs ?? []), ...(oo?.images ?? [])]) {
        if (c?.filename && /\.(mp4|webm|mov|gif)$/i.test(c.filename as string)) {
          found.push({ filename: c.filename, subfolder: c.subfolder });
        }
      }
    }
    return found;
  }

  private async moveOutputToShotDir(
    shotId: string,
    out: { filename: string; subfolder?: string },
    destSubdir: 'videos' | 'videos_fhd' | 'videos_smooth' = 'videos',
  ): Promise<string | null> {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: { project: true },
    });
    if (!shot) return null;
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, destSubdir);
    mkdirSync(destDir, { recursive: true });

    const src  = path.join(COMFY_OUTPUT, out.subfolder ?? '', path.basename(out.filename));
    const dest = path.join(destDir, path.basename(out.filename));
    // Retry-idempotent: a multi-output harvest can move file A, then bail on a
    // not-yet-flushed file B and retry the whole set next tick — recognise the
    // already-moved A at its destination instead of reporting it lost.
    if (!existsSync(src)) return existsSync(dest) ? path.basename(dest) : null;
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
