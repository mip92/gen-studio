import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { existsSync, mkdirSync, copyFileSync, renameSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ComfyService } from '../../comfy/comfy.service';
import { QueueLedgerService } from '../../pipeline/queue-ledger.service';
import { readWorkflowJson, describeWorkflowLookup } from '../../comfy/workflow-path';
import { QwenSceneGraphBuilder } from '../scenes/qwen/qwen-scene-graph.builder';
import { composeEndFrameInstruction, REALCOMIC_TRIGGER } from '../scenes/qwen/qwen-prompt';
import { normalizeStyleLora, normalizeSceneSteps } from '../scenes/scene-render.service';
import { PageTemplateRegistryService } from '../../comic/page-template-registry.service';
import { resolveShotRenderSize } from '../../comic/render-size';

/** 'i2v' = one pinned frame; 'flf2v' = first AND last frame pinned. */
type VideoFlow = 'i2v' | 'flf2v';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 4000;

/**
 * The end frame runs on the SAME graph a realcomic scene renders on. There is no
 * `end_frame_qwen_edit_api.json`: the shape it would need — Qwen-Image-Edit-2511,
 * one reference picture, one instruction, one image out — is exactly this file,
 * and a copy would be one more template to keep in step for no behavioural
 * difference. `QwenSceneGraphBuilder` already parameterises every axis that
 * differs (references, LoRA, steps, size).
 */
const WORKFLOW_FILENAME = 'scene_realcomic_qwen_api.json';

/** Candidates per queued job — the same default a scene render uses. */
const DEFAULT_BATCH_SIZE  = 5;

const QWEN_VISUAL_STYLE   = 'realcomic_qwen';
const REALCOMIC_LORA_NAME = process.env.REALCOMIC_LORA ?? 'style\\RealComic_2509_base.safetensors';

/**
 * Produces the LAST frame of a shot's clip for the two-frame (`flf2v`) video
 * flow, by EDITING the shot's own approved still with Qwen-Image-Edit-2511.
 *
 * Why an edit and not a generation: the two frames Wan interpolates between have
 * to be the same person in the same room under the same light. A last frame
 * generated from text is a different face in a similar room, and the clip then
 * spends five seconds morphing one into the other — a worse defect than the
 * drift the two-frame flow exists to remove. 2511 is the only model on disk that
 * edits rather than regenerates, which is why this job type is not styled after
 * the project (a Flux project's end frame is still made here).
 */
@Injectable()
export class EndFrameService implements OnModuleInit, OnModuleDestroy {
  private readonly logger  = new Logger(EndFrameService.name);
  private readonly builder = new QwenSceneGraphBuilder();
  private poller: NodeJS.Timeout | null = null;
  /** Guards against a slow poll overlapping the next tick of its own interval. */
  private polling = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly ledger: QueueLedgerService,
    private readonly comicRegistry: PageTemplateRegistryService,
  ) {}

  onModuleInit() {
    this.poller = setInterval(() => void this.safePoll(), POLL_MS);
  }
  onModuleDestroy() {
    if (this.poller) clearInterval(this.poller);
  }

  /**
   * The flow this shot renders on: its own override, else the act's, else the
   * project's. An end frame only means something on 'flf2v' — on 'i2v' nothing
   * would ever consume it.
   *
   * $queryRaw for the same reason the video service uses it: the inheritance is
   * a chain across three tables that Prisma cannot express in one include.
   */
  private async resolveFlow(shotId: string): Promise<VideoFlow> {
    const rows = await this.prisma.$queryRaw<Array<{ flow: string | null }>>`
      SELECT COALESCE(sh."videoFlow", sc."defaultVideoFlow", p."defaultVideoFlow") AS flow
        FROM shots sh
        JOIN scenes   sc ON sc.id = sh."sceneId"
        JOIN projects p  ON p.id  = sh."projectId"
       WHERE sh.id = ${shotId}
    `;
    return rows[0]?.flow === 'flf2v' ? 'flf2v' : 'i2v';
  }

  private async safePoll(): Promise<void> {
    if (this.polling) return;
    // The delegate is absent until `prisma generate` has run against the schema
    // that introduced end_frame_jobs. Skip quietly instead of throwing into the
    // logger four times a second on a backend restarted before the migration —
    // the feature simply is not live yet, which is not an error worth shouting.
    if (!(this.prisma as any).endFrameJob) return;
    this.polling = true;
    try { await this.pollRunning(); }
    catch (e: any) { this.logger.error(`poll failed: ${e?.message ?? e}`); }
    finally { this.polling = false; }
  }

  // ── Enqueue ────────────────────────────────────────────────────────────────

  /**
   * Queue ONE end-frame render that produces a whole batch of candidates.
   *
   * This mirrors a scene render exactly (`enqueueRender` → one SceneRenderJob
   * with `batchSize ?? 5`): the batch comes from `batch_size` in the graph, so
   * five candidates cost one queue entry and one model load. The first cut of
   * this service queued N separate jobs instead — five rows in the queue, five
   * Qwen loads, for what the sampler does in one pass (user 2026-08-15:
   * «несколько элементов в очереди и каждый делает по одному кадру»).
   */
  async enqueue(shotId: string, input: { instruction?: string; seed?: number; batchSize?: number } = {}) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    if (shot.renderMode === 'static') {
      throw new BadRequestException(
        `Shot ${shot.shotCode} is renderMode='static' — it ships as a still and never becomes a clip, `
        + `so it has no last frame to make.`,
      );
    }
    if (!shot.chosenRender) {
      throw new BadRequestException(
        `Shot ${shot.shotCode} has no chosen render. The end frame is an EDIT of the first frame — `
        + `approve the still first.`,
      );
    }
    // An end frame is ONLY meaningful on the two-frame flow: on 'i2v' nothing
    // downstream would ever read it, so offering to spend a Qwen render on one
    // is offering to waste GPU time (user 2026-08-15: «это должно быть доступно
    // только двухкадровым»).
    const flow = await this.resolveFlow(shotId);
    if (flow !== 'flf2v') {
      throw new BadRequestException(
        `Shot ${shot.shotCode} renders on the one-frame flow (i2v) — a last frame would never be used. `
        + `Switch the shot, its act or the project to «2 кадра» first.`,
      );
    }
    // Per-call override wins over the shot's stored text, mirroring how a video
    // render lets the caller type a motion prompt at queue time.
    const instruction = (input.instruction ?? (shot as any).endFramePrompt ?? '').trim();
    if (!instruction) {
      throw new BadRequestException(
        `Shot ${shot.shotCode} has no endFramePrompt. Describe what is DIFFERENT a few seconds later `
        + `("she is standing, palm flat on the door handle") — not the whole frame again.`,
      );
    }
    const startPath = path.join(
      APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, shot.chosenRender,
    );
    if (!existsSync(startPath)) {
      throw new BadRequestException(`Start frame missing on disk: ${startPath}`);
    }

    // Same default as a scene render: five candidates, because an end frame is
    // picked by eye and the first sample of an edit is rarely the best one.
    const batchSize = Math.max(1, Math.min(8, input.batchSize ?? DEFAULT_BATCH_SIZE));
    const seed      = input.seed ?? Math.floor(Math.random() * 2 ** 32);
    const params    = { seed, batchSize };

    const row = await (this.prisma as any).endFrameJob.create({
      data: {
        shotId:              shot.id,
        sourceImageFilename: shot.chosenRender,
        instruction,
        status:              'pending',
        params,
      },
    });
    await this.ledger.enqueue('end_frame', row.id, {
      workflowFilename: WORKFLOW_FILENAME,
      paramsSnapshot:   params,
    });
    return [row];
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────

  /** Send a pending end-frame job to ComfyUI. Called by the pipeline tick. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await (this.prisma as any).endFrameJob.findUnique({
      where:   { id: jobId },
      include: { shot: { include: { project: true } } },
    });
    if (!job) throw new Error(`EndFrameJob ${jobId} not found`);
    if (job.status !== 'pending') return;

    try {
      const shot    = job.shot;
      const project = shot.project;
      const startPath = path.join(
        APP_ROOT, 'data', project.slug, 'shots', shot.shotCode, job.sourceImageFilename,
      );
      if (!existsSync(startPath)) throw new Error(`Start frame missing on disk: ${startPath}`);

      // Stage the start frame where ComfyUI's LoadImage can reach it. The name
      // carries the job id so two concurrent jobs on the same shot cannot read
      // each other's file.
      const staged = `endframe_${job.id}${path.extname(job.sourceImageFilename) || '.png'}`;
      mkdirSync(COMFY_INPUT, { recursive: true });
      copyFileSync(startPath, path.join(COMFY_INPUT, staged));

      const template = readWorkflowJson(project.slug, WORKFLOW_FILENAME);
      if (!template) {
        throw new Error(`Workflow not found: ${describeWorkflowLookup(project.slug, WORKFLOW_FILENAME)}`);
      }

      // The end frame is rendered at the shot's own base image size, so start and
      // end reach the video graph at identical dimensions. A mismatch would make
      // Wan resolve two different aspect ratios across the clip.
      const size = resolveShotRenderSize(shot.comicPanelShape, 'image_base', 'qwen', this.comicRegistry);

      // Style: only projects whose look is carried by a Qwen LoRA get one. On
      // every other project the style is already IN the reference picture — it is
      // the film's own rendered frame — so adding a foreign style LoRA would
      // repaint the frame instead of continuing it.
      const isQwenProject = project.visualStyle === QWEN_VISUAL_STYLE;
      const settingsLora  = normalizeStyleLora((project as any).settings);
      const styleLora     = isQwenProject
        ? { name: settingsLora?.name ?? REALCOMIC_LORA_NAME, strengthModel: settingsLora?.strengthModel ?? 1.0 }
        : undefined;

      const workflow = this.builder.build(template as any, {
        // cameraMove comes from the SHOT, so the end frame's viewpoint and the
        // clip's own camera clause are derived from one column and cannot
        // contradict each other.
        instruction: composeEndFrameInstruction(job.instruction, {
          styleDirective: isQwenProject ? REALCOMIC_TRIGGER : undefined,
          cameraMove:     shot.cameraMove,
        }),
        width:       size.width,
        height:      size.height,
        // The whole batch comes out of ONE sampler pass, exactly like a scene
        // render — five candidates, one model load, one queue entry.
        batchSize:   Number((job.params as any)?.batchSize ?? DEFAULT_BATCH_SIZE),
        seed:        Number((job.params as any)?.seed ?? 0),
        steps:       normalizeSceneSteps((project as any).settings),
        scheduler:   isQwenProject ? 'sgm_uniform' : undefined,
        filenamePrefix: `endframe_${shot.shotCode}`,
        anchors:     [staged],
        // ON, and this is the one place in the codebase where it is unambiguously
        // right. The paste channel is a problem when the donor is a grey-backdrop
        // studio portrait and the target is a night exterior; here the donor IS
        // the target — same camera, same room, same light, one moment earlier.
        // Off, the edit would come back as a redrawn lookalike and the clip would
        // morph between two versions of the same frame.
        referenceLatents: true,
        styleLora,
      });

      const { promptId } = await this.comfy.queuePrompt(workflow);
      await (this.prisma as any).endFrameJob.update({
        where: { id: job.id },
        data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
      });
      await this.ledger.attachPrompt('end_frame', job.id, promptId);
    } catch (e: any) {
      const why = `end-frame dispatch failed: ${e?.message ?? e}`;
      this.logger.error(`dispatchPending end_frame ${jobId}: ${why}`);
      await (this.prisma as any).endFrameJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: why, completedAt: new Date() },
      });
      await this.ledger.close('end_frame', jobId, { status: 'failed', errorMessage: why });
    }
  }

  // ── Harvest ────────────────────────────────────────────────────────────────

  /**
   * Collect finished end frames: move the images out of ComfyUI's output into
   * the shot's own `endframes/` folder and append them to `Shot.endFrameRenders`.
   *
   * Nothing is auto-chosen and nothing is auto-approved. A rendered candidate is
   * a candidate — the whole reason the approval column exists is that this image
   * decides the last thing the viewer sees.
   */
  async pollRunning(): Promise<void> {
    const running = await (this.prisma as any).endFrameJob.findMany({ where: { status: 'running' } });
    for (const job of running) {
      if (!job.comfyPromptId) continue;
      const h = await this.comfy.getHistory(job.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      const produced: string[] = success
        ? Object.values(h.outputs ?? {}).flatMap((o: any) => (o.images ?? []).map((i: any) => i.filename as string))
        : [];

      let stored: string[] = [];
      if (success && produced.length > 0) {
        // A batch lands as several files under one promptId — every one of them
        // becomes a candidate the user can pick from.
        stored = await this.moveOutputs(job.shotId, produced);
        await this.appendCandidates(job.shotId, stored, job.comfyPromptId, Number((job.params as any)?.seed ?? 0));
      }
      const failure = stored.length > 0
        ? null
        : (success ? 'ComfyUI produced no images' : 'ComfyUI reported non-success status');

      await (this.prisma as any).endFrameJob.update({
        where: { id: job.id },
        data:  {
          status:         failure ? 'failed' : 'completed',
          completedAt:    new Date(),
          errorMessage:   failure,
          outputFilename: stored[0] ?? null,
        },
      });
      await this.ledger.close('end_frame', job.id, {
        status:       failure ? 'failed' : 'completed',
        errorMessage: failure,
        ...(stored[0] ? { outputFilename: stored[0] } : {}),
      });
    }
  }

  /**
   * Move ComfyUI outputs into `data/<slug>/shots/<shotCode>/endframes/`.
   *
   * Colliding names are renumbered rather than overwritten: ComfyUI's per-prefix
   * counter restarts at 00001 whenever its output folder is wiped, so re-running
   * the same shot routinely produces names that already exist here — and one of
   * those may well be the frame the user already approved.
   */
  private async moveOutputs(shotId: string, filenames: string[]): Promise<string[]> {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId }, include: { project: true } });
    if (!shot) return [];
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'endframes');
    mkdirSync(destDir, { recursive: true });

    const out: string[] = [];
    for (const filename of filenames) {
      const src = path.join(COMFY_OUTPUT, filename);
      if (!existsSync(src)) {
        this.logger.warn(`end frame output missing in COMFY_OUTPUT: ${src}`);
        continue;
      }
      const ext  = path.extname(filename) || '.png';
      const base = path.basename(filename, ext);
      let name   = `${base}${ext}`;
      let n      = 1;
      while (existsSync(path.join(destDir, name))) name = `${base}_${n++}${ext}`;
      renameSync(src, path.join(destDir, name));
      out.push(name);
    }
    return out;
  }

  private async appendCandidates(shotId: string, filenames: string[], promptId: string, seed: number): Promise<void> {
    if (filenames.length === 0) return;
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) return;
    const existing = Array.isArray((shot as any).endFrameRenders) ? (shot as any).endFrameRenders as any[] : [];
    const added    = filenames.map((filename) => ({
      filename, promptId, seed, createdAt: new Date().toISOString(),
    }));
    await this.prisma.shot.update({
      where: { id: shotId },
      data:  { endFrameRenders: [...existing, ...added] } as any,
    });
  }

  // ── Pick and approve ───────────────────────────────────────────────────────

  /** Candidates rendered so far, newest last, plus the flow that decides whether
   *  any of this is live for the shot at all. */
  async list(shotId: string) {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return {
      // RESOLVED flow (shot → act → project), not the shot's own column: the UI
      // has to grey the whole page out on a one-frame shot, and the override
      // usually lives a level or two up.
      flow:       await this.resolveFlow(shotId),
      prompt:     (shot as any).endFramePrompt ?? null,
      candidates: Array.isArray((shot as any).endFrameRenders) ? (shot as any).endFrameRenders : [],
      chosen:     (shot as any).chosenEndFrame ?? null,
      approvedAt: (shot as any).endFrameApprovedAt ?? null,
    };
  }

  /**
   * Pick a candidate. Choosing always clears the approval — approving is a
   * statement about ONE image, so a different pick has not been approved yet
   * even when the previous one was.
   */
  async choose(shotId: string, filename: string) {
    const state = await this.list(shotId);
    const known = (state.candidates as any[]).some((c) => c?.filename === filename);
    if (!known) {
      throw new BadRequestException(`"${filename}" is not one of this shot's end-frame candidates`);
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { chosenEndFrame: filename, endFrameApprovedAt: null } as any,
    });
  }

  async approve(shotId: string) {
    const state = await this.list(shotId);
    if (!state.chosen) {
      throw new BadRequestException(`Shot has no chosen end frame to approve`);
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { endFrameApprovedAt: new Date() } as any,
    });
  }

  /**
   * Absolute path of an end-frame image, for the file-serving endpoint. Returns
   * null when the shot or the file is unknown, so the caller can 404.
   */
  async filePath(shotId: string, filename: string): Promise<string | null> {
    // Reject anything that could climb out of the shot's own folder — the
    // filename reaches us straight from the URL.
    if (path.basename(filename) !== filename) return null;
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId }, include: { project: true } });
    if (!shot) return null;
    const full = path.join(
      APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, 'endframes', filename,
    );
    return existsSync(full) ? full : null;
  }
}
