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
import { describeWorkflowLookup, readWorkflowJson } from '../../comfy/workflow-path';
import { StartVideoInput } from './video-job.types';
import { stripPromptWeights } from '../scenes/scene-render.service';
import { QueueLedgerService } from '../../pipeline/queue-ledger.service';
import { PageTemplateRegistryService } from '../../comic/page-template-registry.service';
import { VideoEngineFactory } from './engines/video-engine.factory';
import { VideoFlow } from './engines/video-engine';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 4000;
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
/** Last-resort output framerate for the upscale→RIFE pass. `params.fps` is
 *  always stamped at enqueue, so this only covers a hand-edited row. */
const FALLBACK_FPS = 16;

/** Does this text already tell the camera what to do? */
const MENTIONS_CAMERA = /camera|handheld|point of view/i;

/** Per-shot subfolder holding end-frame candidates, next to the shot's stills. */
const ENDFRAMES_DIR = 'endframes';

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
    private readonly comicRegistry: PageTemplateRegistryService,
    private readonly engines: VideoEngineFactory,
  ) {}

  /**
   * The shot's comic panel shape (template-layout mode), or null on every
   * legacy shot. $queryRaw because the column may predate the generated
   * Prisma client (documented repo pattern).
   */
  private async resolveComicPanelShape(shotId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<Array<{ shape: string | null }>>`
      SELECT "comicPanelShape" AS shape FROM shots WHERE id = ${shotId}
    `;
    const shape = rows[0]?.shape ?? null;
    return shape && shape.trim().length > 0 ? shape : null;
  }

  /**
   * Which conditioning flow this shot renders on, and — when it is `flf2v` —
   * which end frame it is allowed to pin to its last frame.
   *
   * Inheritance is `shot.videoFlow ?? scene.defaultVideoFlow ?? project.defaultVideoFlow`,
   * the same three-level idiom as paletteKey/timeOfDay, so an act can sit on a
   * different flow from its project and a single shot on a different flow from
   * its act. An unrecognised value resolves to 'i2v' rather than throwing — the
   * DB CHECK constraints already refuse to store one, so this only ever fires on
   * a row edited around them.
   *
   * $queryRaw for the same reason `resolveComicPanelShape` uses it: these columns
   * can predate the generated Prisma client on a backend that has not re-run
   * `prisma generate` yet (documented repo pattern).
   */
  private async resolveVideoFlow(shotId: string): Promise<{
    flow:           VideoFlow;
    chosenEndFrame: string | null;
    approvedAt:     Date | null;
  }> {
    const rows = await this.prisma.$queryRaw<Array<{
      flow: string | null; chosenEndFrame: string | null; approvedAt: Date | null;
    }>>`
      SELECT COALESCE(sh."videoFlow", sc."defaultVideoFlow", p."defaultVideoFlow") AS flow,
             sh."chosenEndFrame"     AS "chosenEndFrame",
             sh."endFrameApprovedAt" AS "approvedAt"
        FROM shots sh
        JOIN scenes   sc ON sc.id = sh."sceneId"
        JOIN projects p  ON p.id  = sh."projectId"
       WHERE sh.id = ${shotId}
    `;
    const row  = rows[0];
    const flow: VideoFlow = row?.flow === 'flf2v' ? 'flf2v' : 'i2v';
    return {
      flow,
      chosenEndFrame: row?.chosenEndFrame ?? null,
      approvedAt:     row?.approvedAt ?? null,
    };
  }

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
    // Which model family renders this film. Per project, like `visualStyle` for
    // stills. The chosen workflow filename is BAKED onto every row below, so a
    // clip already in the queue is later patched by the engine it was queued
    // for even if the project has since been switched.
    const engine = this.engines.get((shot.project as any).videoEngine);

    // Conditioning flow: one pinned frame ('i2v') or two ('flf2v'). Resolved
    // from shot → act → project.
    //
    // A flf2v shot whose second frame is not ready DEGRADES to the one-frame
    // flow and renders anyway (user 2026-08-15, chosen over a 400 after the
    // trade-off was put to them): waiting on an end frame must never be able to
    // stall a clip that could have been made.
    //
    // The degrade is recorded rather than silent — `params.flowFallback` carries
    // the reason and the dispatch logs a warning — because the resulting clip is
    // indistinguishable from a deliberate i2v render, and "how much of this
    // project actually rendered on two frames" has to stay answerable with one
    // query instead of by re-reading graphs.
    const { flow, chosenEndFrame, approvedAt } = await this.resolveVideoFlow(shot.id);
    let endImageFilename: string | null = null;
    let flowFallback:     string | null = null;
    if (flow === 'flf2v') {
      const endPath = chosenEndFrame
        ? path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, ENDFRAMES_DIR, chosenEndFrame)
        : null;

      // A CHOSEN but unapproved end frame is the one case that is refused rather
      // than degraded. The degrade exists so that not having got round to a shot
      // never blocks its clip — but a frame already rendered AND picked means the
      // user is mid-flow, and the clip they get back looks exactly like a failed
      // two-frame render while never having been one. That is what happened to
      // A1_SH02 on `bully` (user 2026-08-15: «бред получился полностью, не
      // соответствует финальному кадру»), and nothing on the finished clip says
      // why. Refusing here costs one click; the silent version costs a render
      // plus the time spent blaming the model.
      if (chosenEndFrame && !approvedAt) {
        throw new BadRequestException(
          `Кадр ${shot.shotCode}: последний кадр «${chosenEndFrame}» выбран, но не утверждён. `
          + `Утвердите его на вкладке «Посл. кадр» — или снимите выбор, если он не годится. `
          + `Иначе клип уехал бы по ОДНОМУ кадру и не имел бы к нему никакого отношения.`,
        );
      }

      if (!chosenEndFrame)            flowFallback = 'no_end_frame';
      else if (!existsSync(endPath!)) flowFallback = 'end_frame_missing_on_disk';
      else                            endImageFilename = chosenEndFrame;

      if (flowFallback) {
        this.logger.warn(
          `[${shot.shotCode}] flow=flf2v but ${flowFallback} — rendering on the one-frame i2v flow instead`,
        );
      }
    }

    // The workflow filename is picked AFTER the flow has degraded, not before.
    // For Wan the two are independent — one file, a node swapped inside it — but
    // LTX has a separate graph per flow, and a row baked with the two-frame file
    // while carrying no end image would reach a `LTXVAddGuide` with nothing to
    // guide. Effective flow, therefore: whether an end image actually survived.
    const effectiveFlow: VideoFlow = endImageFilename ? 'flf2v' : 'i2v';
    const workflowFilename = engine.workflowFor(input.mode, effectiveFlow);

    // Comic panel shape (template-layout mode): the shot's Wan render size
    // comes from its shape's `wan` row. The shape is BAKED into
    // VideoRender.params at creation (like TTSJob.engine) so the later
    // upscale+RIFE pass patches its output node from the same decision instead
    // of re-resolving a plan that may have moved on. null shape = legacy path,
    // params identical to before.
    const panelShape = await this.resolveComicPanelShape(shot.id);
    const wanSize = panelShape ? this.comicRegistry.getShape(panelShape).wan : undefined;

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
        // Native size comes from the ENGINE, not from a shared constant: Wan's
        // 768×432 / 81 frames is not LTX's. A comic panel shape still wins.
        width:  input.width  ?? wanSize?.[0] ?? engine.defaults.width,
        height: input.height ?? wanSize?.[1] ?? engine.defaults.height,
        length: input.length ?? engine.defaults.length,
        fps:    input.fps    ?? engine.defaults.fps,
        ...(panelShape ? { panelShape } : {}),
        // Only stamped on two-frame renders, so the params blob of every legacy
        // i2v render stays byte-identical to what it has always been.
        ...(flow === 'flf2v' ? { flow } : {}),
        ...(flowFallback ? { flowFallback } : {}),
      };
      const row = await this.prisma.videoRender.create({
        // `as any`: endImageFilename can predate the generated Prisma client on a
        // backend that has not re-run `prisma generate` yet.
        data: {
          shotId:              shot.id,
          sourceImageFilename: shot.chosenRender!,
          endImageFilename,
          motionPrompt:        input.motionPrompt?.trim() || '',
          status:              'pending',
          workflowFilename:    workflowFilename,
          params,
        } as any,
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

    // Two-frame render: the end frame was chosen, approved and BAKED onto this
    // row at enqueue time, so re-approving a different one since then cannot
    // change what this clip renders. Read from the row, never re-resolved.
    const endImageFilename = (v as any).endImageFilename as string | null | undefined;
    let endBasename: string | undefined;
    let endDest:     string | undefined;
    if (endImageFilename) {
      const endSource = path.join(
        APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode, ENDFRAMES_DIR, endImageFilename,
      );
      if (!existsSync(endSource)) {
        // Same treatment as a missing start frame: keep the row as `failed` with
        // its reason instead of rendering a one-frame clip that would silently
        // pass for a two-frame one.
        const why = `End frame missing on disk: ${endSource}`;
        this.logger.warn(`dispatchPending video ${v.id}: ${why} — failing the row`);
        try { unlinkSync(inputDest); } catch { /* best-effort */ }
        await this.prisma.videoRender.update({
          where: { id: v.id },
          data:  { status: 'failed', errorMessage: why, completedAt: new Date() },
        });
        await this.ledger.close('video', v.id, { status: 'failed', errorMessage: why });
        return;
      }
      endBasename = `video_${v.id}_end${path.extname(endImageFilename) || '.png'}`;
      endDest     = path.join(COMFY_INPUT, endBasename);
      copyFileSync(endSource, endDest);
    }

    try {
      const params = v.params as { seed: number; width: number; height: number; length: number; fps: number };
      // The engine is resolved from the workflow filename BAKED on the row, not
      // from the project's current setting: switching a project's engine must
      // not change how a clip already in the queue is patched.
      const engine   = this.engines.forWorkflow(v.workflowFilename);
      const template = this.loadTemplate(
        engine, v.shot.project.slug, v.workflowFilename, endBasename ? 'flf2v' : 'i2v');
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
        this.composeMotionPrompt(v.motionPrompt, v.shot, project, engine),
        (tok, w) => this.logger.warn(`[${v.shot.shotCode}] stripped motionPrompt weight "(${tok}:${w})"`),
      );
      // Warn-only: surfaces negations-in-the-positive and missing camera clauses
      // in the log. Does not rewrite the prompt and does not block the render.
      this.lintMotionPrompt(
        v.shot.shotCode, motionPrompt,
        typeof pf.positive === 'string' ? pf.positive : undefined);
      const motionNegative = rawMotionNegative
        ? stripPromptWeights(
            rawMotionNegative,
            (tok, w) => this.logger.warn(`[${v.shot.shotCode}] stripped motionNegative weight "(${tok}:${w})"`),
          )
        : undefined;
      const workflow = engine.patch(template as any, {
        sourceImage:    inputBasename,
        endImage:       endBasename,
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
      if (endDest) { try { unlinkSync(endDest); } catch { /* best-effort */ } }
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
  private loadTemplate(
    engine: {
      workflowFor(mode?: string | null, flow?: VideoFlow): string;
      ownsWorkflow(f: string): boolean;
    },
    projectSlug: string,
    workflowFilename?: string | null,
    flow: VideoFlow = 'i2v',
  ): Record<string, any> {
    // Only ever load a file the engine knows how to patch; fall back to its
    // default when the row carries an empty or unrecognised name. The fallback
    // needs the flow too — on an engine with a graph per flow, defaulting blind
    // would hand a two-frame render the one-frame file.
    const filename = workflowFilename && engine.ownsWorkflow(workflowFilename)
      ? workflowFilename
      : engine.workflowFor(null, flow);
    const template = readWorkflowJson(projectSlug, filename);
    if (!template) {
      throw new NotFoundException(
        `Video workflow not found: ${describeWorkflowLookup(projectSlug, filename)}`,
      );
    }
    return template;
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
    // The camera sentence is the engine's dialect, so it is asked for rather
    // than built here. Omitted → no camera clause is appended.
    engine?: { cameraClause(move: string): string | undefined },
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
    const move   = (shot.cameraMove ?? '').trim();
    const clause = engine?.cameraClause(move);
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
  private lintMotionPrompt(shotCode: string, prompt: string, positive?: string): void {
    const low = prompt.toLowerCase();
    // `no music` is the ONE negation the LTX dialect requires rather than
    // tolerates — Lightricks' guide asks for it explicitly whenever an external
    // soundtrack will be laid over the clip, and ours always is (ACE-Step).
    // Without this exemption every LTX shot warns, and a warning that fires on
    // everything is read by nobody.
    const negations = (low.replace(/\bno music\b/g, '')
      .match(/\bno\s+\w+|\bwithout\s+\w+/g) ?? []).slice(0, 4);
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

    // A frame with people BEHIND the subject needs them pinned, and pinned
    // POSITIVELY. Two failures live here and they pull in opposite directions:
    // the single-figure lock («the same single figure throughout the shot») on a
    // frame that visibly holds a queue is a guard fighting its own image, and i2v
    // answers by melting or deleting the crowd; while a frame with people and no
    // lock at all gets a crowd that walks, turns and multiplies.
    //
    // Warn-only, like the rest of this method: it surfaces in the dispatch log
    // rather than blocking a render (user rule 2026-08-16 — background people
    // must move minimally).
    if (positive && /\b(traders?|queue|crowd|people|passers-?by|shoppers|customers|onlookers|bystanders|classmates|colleagues)\b/i.test(positive)) {
      if (/\bthe same single figure\b/i.test(prompt)) {
        this.logger.warn(
          `[${shotCode}] positive shows background people but motionPrompt carries the `
          + `SINGLE-figure lock — the guard fights the frame (Skill: gen-studio-wan22 §5.3a)`,
        );
      // Wide on purpose. The recommended tail is one phrasing among several the
      // corpus actually uses — «holding its place», «keeping its place», «hold
      // still», «barely shift» all pin a crowd, and a narrow matcher would warn
      // on shots that are already correct. A lint nobody trusts gets muted.
      } else if (!/\bbackground figures?\b|\b(hold|keep)(s|ing)?\s+(still|(their|its)\s+places?)\b|\bbarely\s+(move|shift)/i.test(prompt)) {
        this.logger.warn(
          `[${shotCode}] positive shows background people but motionPrompt does not pin them — `
          + `they will walk and multiply (Skill: gen-studio-wan22 §5.3a)`,
        );
      }
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
    // `running` is owned by pollRunning, which scans the row itself and needs no
    // queue entry to find it — leave it alone.
    if (v.upscaleStatus === 'running') return v;
    // `pending`, on the other hand, is dispatched ONLY from the ledger. A pending
    // row with no live entry is therefore unreachable: nothing will ever pick it
    // up, /actions counts it as in-flight and hides the gate, and this method used
    // to return here, so even asking again was a silent no-op. Fall through and
    // re-file it instead. (trucker A9_SH08 sat in that hole from 2026-07-27 until
    // 2026-08-10, invisible in the queue and on /actions alike.)
    if (v.upscaleStatus === 'pending' && await this.ledger.findLive('video_post', v.id)) return v;
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
      const params = (v.params ?? {}) as { fps?: number; panelShape?: string };
      // Comic-panel clip: scale node 5 to the shape's smooth target instead of
      // the template's hardcoded 1920×1080 (crop:"disabled" there would STRETCH
      // a square/tall clip into 16:9). Shape was baked into params at start().
      const smooth = params.panelShape
        ? this.comicRegistry.getShape(params.panelShape).smooth
        : undefined;
      const workflow = this.patchCombined(combined, {
        sourceVideo:  inputBasename,
        fhdPrefix:    `video_fhd/${v.shot.shotCode}/${v.id}`,
        smoothPrefix: `video_smooth/${v.shot.shotCode}/${v.id}`,
        multiplier:   mult,
        fps:          (params.fps ?? FALLBACK_FPS) * mult,
        smoothWidth:  smooth?.[0],
        smoothHeight: smooth?.[1],
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

  /**
   * Combined one-pass upscale→RIFE template. Null only if the graph is missing
   * from both the project dir and data/_templates/comfy/ — the shared master is
   * always shipped, so the null branch is defensive rather than a live path.
   */
  private loadCombinedTemplate(projectSlug: string): Record<string, any> | null {
    return readWorkflowJson(projectSlug, COMBINED_WORKFLOW_FILENAME);
  }

  private patchCombined(template: Record<string, any>, p: {
    sourceVideo:  string;
    fhdPrefix:    string;
    smoothPrefix: string;
    multiplier:   number;
    fps:          number;
    /** Comic-panel target for node 5 (ImageScale). Absent = template default
     *  (1920×1080) — the legacy workflow stays byte-identical. */
    smoothWidth?:  number;
    smoothHeight?: number;
  }): Record<string, any> {
    const wf = structuredClone(template);
    if (wf['1'])  wf['1'].inputs.file             = p.sourceVideo;      // LoadVideo
    if (p.smoothWidth && p.smoothHeight && wf['5']) {                   // ImageScale
      wf['5'].inputs.width  = p.smoothWidth;
      wf['5'].inputs.height = p.smoothHeight;
    }
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
