import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, renameSync, copyFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ComfyService, QueuePromptResult } from '../../comfy/comfy.service';
import { ImageValidationService } from '../../validation/image-validation.service';
import { QueueLedgerService } from '../../pipeline/queue-ledger.service';
import { SceneFactory } from './scene.factory';
import { SceneStrategy } from './scene-strategy';
import { SceneJobParams, SceneParticipant } from './scene-job.types';

const APP_ROOT        = process.env.APP_ROOT        ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_OUTPUT    = process.env.COMFY_OUTPUT    ?? 'E:\\ComfyUI\\output';
const COMFY_INPUT     = process.env.COMFY_INPUT     ?? 'E:\\ComfyUI\\input';
const COMFY_LORA_ROOT = process.env.COMFY_LORA_ROOT ?? 'E:\\ComfyUI\\models\\loras';
// models/ root is the parent of models/loras. Used to probe for the Flux Redux
// model files before wiring the Redux identity chain.
const COMFY_MODELS_ROOT = process.env.COMFY_MODELS_ROOT ?? path.dirname(COMFY_LORA_ROOT);
const KOHYA_PYTHON    = process.env.KOHYA_PYTHON    ?? 'E:\\kohya_ss\\venv\\Scripts\\python.exe';
const UPSCALE_SCRIPT  = path.join(APP_ROOT, 'scripts', 'upscale_to_fhd.py');

// Flux Redux identity (graphic_novel_flux). Both files must be present for the
// single-character Flux comic strategy to attach the anchor portrait as a
// reference; otherwise identity falls back to text-only (promptBase).
const FLUX_VISUAL_STYLE      = 'graphic_novel_flux';
const REDUX_STYLE_MODEL_NAME = process.env.FLUX_REDUX_MODEL        ?? 'flux1-redux-dev.safetensors';
const REDUX_CLIP_VISION_NAME = process.env.FLUX_REDUX_CLIP_VISION  ?? 'sigclip_vision_patch14_384.safetensors';

// Qwen-Image-Edit-2511: the native 'realcomic_qwen' style + the dual-character
// overlay for the two legacy cartoon styles (both participants' anchors as
// image references instead of text-only identity).
const QWEN_VISUAL_STYLE         = 'realcomic_qwen';
const CELL_SHADED_VISUAL_STYLE  = 'graphic_novel_cell_shaded';
const QWEN_DUAL_OVERRIDE_STYLES = new Set([FLUX_VISUAL_STYLE, CELL_SHADED_VISUAL_STYLE]);
// The LIVE ComfyUI models root. COMFY_MODELS_ROOT above derives from
// COMFY_LORA_ROOT whose default points at the retired E:\ComfyUI install —
// kept as-is for the (currently dormant) Redux probes; the Qwen files only
// exist in the live install, so probe via COMFY_DIR when it's configured.
const LIVE_MODELS_ROOT = process.env.COMFY_DIR
  ? path.join(process.env.COMFY_DIR, 'models')
  : COMFY_MODELS_ROOT;
const QWEN_UNET_NAME           = process.env.QWEN_UNET           ?? 'qwen_image_edit_2511_fp8mixed.safetensors';
const QWEN_LIGHTNING_LORA_NAME = process.env.QWEN_LIGHTNING_LORA ?? 'qwen\\Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors';
const QWEN_CLIP_NAME           = process.env.QWEN_CLIP           ?? 'qwen_2.5_vl_7b_fp8_scaled.safetensors';
const QWEN_VAE_NAME            = process.env.QWEN_VAE            ?? 'qwen_image_vae.safetensors';
const REALCOMIC_LORA_NAME      = process.env.REALCOMIC_LORA      ?? 'style\\RealComic_2509_base.safetensors';

export interface RenderShotInput {
  shotId:          string;
  /** Override scene description from shot.promptFields if provided. */
  scenePrompt?:    string;
  negativeExtra?:  string;
  width?:          number;
  height?:         number;
  seed?:           number;
  steps?:          number;
  cfg?:            number;
  /** Flux only: FluxGuidance value (cfg stays 1.0 on Flux). Ignored by SDXL. */
  guidance?:       number;
  /** Per-generation visual-style / pipeline override (e.g. 'graphic_novel_flux'
   *  vs 'graphic_novel_cell_shaded'). Resolves the SceneStrategy + workflow JSON.
   *  Once a shot has any render, the pipeline is LOCKED (see enqueueRender): a
   *  request whose visualStyle differs from the pinned one is rejected. Absent
   *  → the shot's pinned style (Shot.workflowRouteKey) or the project default. */
  visualStyle?:    string;
  /** How many images to generate at once (batch_size on EmptyLatentImage). */
  batchSize?:      number;
  loraStrength?:   number;
  /** If true, return the assembled workflow without queuing it. */
  dryRun?:         boolean;
  /** If true, wipe previously-rendered candidates (files + renderedImages +
   *  chosenRender) before queuing — a deliberate "regenerate from scratch".
   *  Default false: renders ACCUMULATE so the "+ ещё 5 вариантов" button adds
   *  to the candidate pool instead of replacing it. */
  replace?:        boolean;
  /** If true, auto-enqueue an image-validation pass (vision QC) after this
   *  batch is harvested. Default false — validation is strictly opt-in via the
   *  checkbox next to the render buttons (user 2026-07-04: no auto-validation). */
  validate?:       boolean;
}

export interface RenderResult {
  shotId:        string;
  shotCode:      string;
  strategyId:    string;
  /** Resolved positive prompt sent to ComfyUI (validation scores against this). */
  positive?:     string;
  participants:  Array<{ profileCode: string; displayName: string; loraPath: string }>;
  job?:          QueuePromptResult;
  workflow?:     Record<string, unknown>;
}

@Injectable()
export class SceneRenderService {
  private readonly logger = new Logger(SceneRenderService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly comfy:   ComfyService,
    private readonly scenes:  SceneFactory,
    private readonly validation: ImageValidationService,
    private readonly ledger: QueueLedgerService,
  ) {}

  // ── Queue-aware API (used by PipelineQueueService) ──────────────────────────

  /** Enqueue a render: creates a `pending` SceneRenderJob; pipeline-tick will dispatch it.
   *
   * Re-render semantics: renders ACCUMULATE. Each enqueue adds a fresh batch of
   * candidates to `Shot.renderedImages` so the "+ ещё 5 вариантов" button does
   * what it says — grows the pool the user picks from (and deletes from
   * manually). Only when `input.replace === true` do we wipe the previous
   * candidates (files + renderedImages + chosenRender) first — a deliberate
   * "regenerate from scratch". In-flight renders (pending/running scene jobs)
   * are never touched; pollRunning still appends their outputs when they finish.
   */
  async enqueueRender(input: RenderShotInput) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    if (input.replace) await this.wipePreviousRenders(shot);

    // Visual style / pipeline is a PER-PROJECT setting (project.visualStyle) —
    // not pinned per shot. A per-generation `input.visualStyle` override (rare)
    // is carried in the job params and applied in renderShot; we do NOT write it
    // to Shot.workflowRouteKey (that column is the workflow ROUTE key, owned by
    // the seeders).

    // Strip non-serialisable / control fields (shotId is on the row itself;
    // dryRun + replace don't belong in the persisted render params).
    const { shotId, dryRun: _dryRun, replace: _replace, ...params } = input;
    const job = await this.prisma.sceneRenderJob.create({
      data: {
        shotId,
        status: 'pending',
        params: params as any,
      },
    });
    await this.ledger.enqueue('scene', job.id, { paramsSnapshot: params });
    return job;
  }

  /**
   * Bulk-enqueue every shot in a project that has NOT been rendered yet and is
   * NOT already queued. ADDITIVE ONLY — never wipes, deletes, or re-queues
   * anything. Skips shots that already have renders (awaiting approval), are
   * approved (chosenRender set), or already have a pending/running job.
   */
  async enqueuePendingForProject(projectOrSlug: string, opts?: { validate?: boolean }) {
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: projectOrSlug }, { slug: projectOrSlug }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectOrSlug} not found`);

    const eligible = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT s.id
      FROM shots s
      JOIN scenes sc ON sc.id = s."sceneId"
      WHERE s."projectId" = ${project.id}
        AND s."chosenRender" IS NULL
        AND (s."renderedImages" IS NULL OR s."renderedImages"::text IN ('[]', 'null'))
        AND NOT EXISTS (
          SELECT 1 FROM scene_render_jobs j
          WHERE j."shotId" = s.id AND j.status IN ('pending', 'running')
        )
      ORDER BY sc."sortOrder", s."shotCode"
    `;
    if (eligible.length === 0) return { enqueued: 0 };
    // One row at a time rather than createMany: every job has to be registered in
    // the queue, and the queue needs each row's id. A createMany here would insert
    // rows the dispatcher cannot see at all — it selects work exclusively from the
    // queue ledger — so the whole batch would sit `pending` forever, silently.
    const params = (opts?.validate === true ? { validate: true } : {}) as any;
    for (const e of eligible) {
      const job = await this.prisma.sceneRenderJob.create({
        data: { shotId: e.id, status: 'pending', params },
      });
      await this.ledger.enqueue('scene', job.id, { paramsSnapshot: params });
    }
    return { enqueued: eligible.length };
  }

  /** Delete previously-rendered files + clear renderedImages/chosenRender for a shot.
   *  Best-effort on files (missing/permission errors are logged, not raised). */
  private async wipePreviousRenders(shot: { id: string; shotCode: string; renderedImages: unknown; project: { slug: string } | null }) {
    const list = (shot.renderedImages as Array<{ filename: string }> | null) ?? [];
    if (list.length === 0) {
      // Nothing recorded — also clear chosenRender defensively in case of drift.
      await this.prisma.shot.update({
        where: { id: shot.id },
        data:  { chosenRender: null },
      });
      return;
    }

    const slug = shot.project?.slug;
    if (slug) {
      const dir = path.join(APP_ROOT, 'data', slug, 'shots', shot.shotCode);
      for (const r of list) {
        const full = path.join(dir, r.filename);
        if (existsSync(full)) {
          try { unlinkSync(full); }
          catch (e: any) { this.logger.warn(`wipePreviousRenders: failed to delete ${full}: ${e?.message}`); }
        }
      }
    }
    await this.prisma.shot.update({
      where: { id: shot.id },
      data:  {
        renderedImages:       [] as any,
        chosenRender:         null,
        // Also clear in-flight tracking — the new job will set this fresh.
        activeRenderPromptId: null,
      },
    });
    this.logger.log(`wipePreviousRenders: shot ${shot.shotCode} cleared ${list.length} previous render(s)`);
  }


  /** Dispatch one pending job: build workflow, submit to ComfyUI, mark running. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.sceneRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Scene render job ${jobId} not found`);
    try {
      const params = (job.params ?? {}) as Record<string, unknown>;
      const result = await this.renderShot({
        shotId: job.shotId,
        ...params,
        dryRun: false,
      });
      if (!result.job) throw new Error('Renderer did not return a ComfyUI prompt_id');
      await this.prisma.sceneRenderJob.update({
        where: { id: jobId },
        data:  {
          status:        'running',
          startedAt:     new Date(),
          comfyPromptId: result.job.promptId,
          // Persist the resolved positive so pollRunning can seed the follow-up
          // image-validation job with what the frame was asked to depict.
          params:        { ...params, _resolvedPositive: result.positive } as any,
        },
      });
      await this.ledger.attachPrompt('scene', jobId, result.job.promptId);
    } catch (e: any) {
      this.logger.error(`Scene dispatch ${jobId} failed: ${e.message}`);
      await this.prisma.sceneRenderJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: e.message, completedAt: new Date() },
      });
      await this.ledger.close('scene', jobId, { status: 'failed', errorMessage: e.message });
    }
  }

  /**
   * Poll ComfyUI for completion of any running scene job; on success, append
   * each output filename to the shot's `renderedImages` array and mark the job
   * `completed`. On failure, mark `failed`.
   */
  async pollRunning(): Promise<void> {
    const running = await this.prisma.sceneRenderJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      const filenames: string[] = success
        ? Object.values(h.outputs ?? {}).flatMap((o: any) => (o.images ?? []).map((i: any) => i.filename as string))
        : [];

      if (success && filenames.length > 0) {
        // Move ComfyUI's outputs into our project tree (data/<slug>/shots/<code>/)
        // so the file layout matches the dataset model — `data/` is the source
        // of truth, COMFY_OUTPUT is just staging. moveOutputsToShotDir may
        // renumber filenames on collision, so we record the post-move names.
        const finalFilenames = await this.moveOutputsToShotDir(j.shotId, filenames);
        await this.appendShotRenders(j.shotId, finalFilenames, j.comfyPromptId);
        // Vision QC is OPT-IN: only when the render was enqueued with
        // `validate: true` (the checkbox next to the render buttons). No
        // unconditional auto-validation (user 2026-07-04).
        if (((j.params ?? {}) as any)?.validate === true) {
          const resolvedPositive = ((j.params ?? {}) as any)?._resolvedPositive ?? null;
          await this.validation.enqueue(j.shotId, resolvedPositive).catch((e: any) =>
            this.logger.warn(`validation enqueue for shot ${j.shotId} failed: ${e?.message ?? e}`));
        }
      }
      const failure = success && filenames.length > 0
        ? null
        : (success ? 'ComfyUI produced no images' : 'ComfyUI reported non-success status');
      await this.prisma.sceneRenderJob.update({
        where: { id: j.id },
        data:  {
          status:       failure ? 'failed' : 'completed',
          completedAt:  new Date(),
          errorMessage: failure,
        },
      });
      await this.ledger.close('scene', j.id, {
        status:       failure ? 'failed' : 'completed',
        errorMessage: failure,
      });
      // Clear in-flight marker on the shot once we've recorded results.
      await this.prisma.shot.update({
        where: { id: j.shotId },
        data:  { activeRenderPromptId: null },
      });
    }
  }

  /**
   * Move freshly-generated ComfyUI outputs from COMFY_OUTPUT into the shot's
   * own folder (data/<slug>/shots/<shotCode>/), upscaling each to fit Full HD
   * (1920×1080) along the way via Lanczos resample. Best-effort: if upscaling
   * fails for any reason, the file falls back to a plain move so the render is
   * never lost.
   *
   * Returns the post-move filenames (basename only). When a destination name
   * already exists — ComfyUI's per-prefix counter resets to 00001 every time
   * its output dir is wiped or it restarts, so re-rendering the same shot
   * routinely produces colliding names — the new file is renumbered into the
   * next free slot rather than dropped, mirroring dataset.prepare().
   */
  private async moveOutputsToShotDir(shotId: string, filenames: string[]): Promise<string[]> {
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    });
    if (!shot) return [];
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode);
    mkdirSync(destDir, { recursive: true });

    // Highest existing NNNNN for this shot's prefix — collisions count up from
    // here so re-runs append rather than overwrite.
    const prefix   = `scene_${shot.shotCode}`;
    const numberRe = new RegExp(`^${escapeRegex(prefix)}_(\\d+)_(\\.[^.]+)$`, 'i');
    let nextN = 0;
    for (const entry of readdirSync(destDir)) {
      const m = entry.match(numberRe);
      if (m) nextN = Math.max(nextN, parseInt(m[1], 10));
    }

    // Build [src, dest] pairs (with renumbered dest on collision) plus a parallel
    // list of final basenames for appendShotRenders.
    const pairs: Array<[string, string]> = [];
    const finalNames: string[] = [];
    for (const filename of filenames) {
      const src = path.join(COMFY_OUTPUT, filename);
      if (!existsSync(src)) continue;
      let destBase = filename;
      let dest = path.join(destDir, destBase);
      while (existsSync(dest)) {
        nextN++;
        const ext = path.extname(filename);
        destBase = `${prefix}_${String(nextN).padStart(5, '0')}_${ext}`;
        dest = path.join(destDir, destBase);
      }
      pairs.push([src, dest]);
      finalNames.push(destBase);
    }
    if (pairs.length === 0) return finalNames;

    // Upscale src → dest in one Python process (Pillow Lanczos to fit FHD).
    const upscaled = await this.runUpscale(pairs);

    // For any file the upscaler skipped/failed on, fall back to a plain move so
    // we still capture the render (just at native bucket size).
    for (const [src, dest] of pairs) {
      if (existsSync(dest)) { safeUnlink(src); continue; }
      if (!existsSync(src)) continue;
      try {
        renameSync(src, dest);
      } catch (e: any) {
        if (e?.code === 'EXDEV') {
          copyFileSync(src, dest);
          safeUnlink(src);
        } else {
          this.logger.warn(`moveOutputsToShotDir fallback: ${path.basename(src)} → ${e?.message ?? e}`);
        }
      }
    }

    // Source cleanup: remove any src whose dest now exists.
    for (const [src, dest] of pairs) {
      if (existsSync(dest) && existsSync(src)) safeUnlink(src);
    }
    if (upscaled > 0) this.logger.log(`Upscaled ${upscaled}/${pairs.length} render(s) to FHD for shot ${shot.shotCode}`);
    return finalNames;
  }

  /**
   * Run scripts/upscale_to_fhd.py with src→dest pairs. Resolves to the count of
   * successfully upscaled files. Returns 0 on any subprocess error — caller
   * falls back to a plain move.
   */
  private runUpscale(pairs: Array<[string, string]>): Promise<number> {
    return new Promise((resolve) => {
      if (!existsSync(KOHYA_PYTHON) || !existsSync(UPSCALE_SCRIPT)) {
        this.logger.warn('runUpscale: python or script missing — skipping');
        return resolve(0);
      }
      const flat: string[] = [UPSCALE_SCRIPT];
      for (const [s, d] of pairs) { flat.push(s); flat.push(d); }
      const proc = spawn(KOHYA_PYTHON, flat, { stdio: ['ignore', 'pipe', 'pipe'] });
      let okCount = 0;
      proc.stdout.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split(/\r?\n/)) {
          if (/^(SCALE|COPY)\s/.test(line)) okCount++;
        }
      });
      proc.stderr.on('data', (chunk: Buffer) => this.logger.warn(`upscale: ${chunk.toString().trimEnd()}`));
      proc.on('error', (e) => { this.logger.warn(`upscale spawn: ${e.message}`); resolve(0); });
      proc.on('exit', () => resolve(okCount));
    });
  }

  /**
   * Resolve the absolute path of a rendered image. Looks first in the shot's
   * own folder (post-move), then in COMFY_OUTPUT (legacy or in-flight). Returns
   * null if not found anywhere.
   */
  async resolveRenderPath(shotId: string, filename: string): Promise<string | null> {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return null;
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    });
    if (!shot) return null;
    const inShot = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, filename);
    if (existsSync(inShot)) return inShot;
    const inOutput = path.join(COMFY_OUTPUT, filename);
    if (existsSync(inOutput)) return inOutput;
    return null;
  }

  /** Append filenames to shot.renderedImages JSON array, deduping by filename. */
  private async appendShotRenders(shotId: string, filenames: string[], promptId: string): Promise<void> {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) return;
    const existing = (shot.renderedImages as Array<{ filename: string }> | null) ?? [];
    const have = new Set(existing.map((r) => r.filename));
    const additions = filenames
      .filter((f) => !have.has(f))
      .map((f) => ({ filename: f, promptId, createdAt: new Date().toISOString() }));
    if (additions.length === 0) return;
    await this.prisma.shot.update({
      where: { id: shotId },
      data:  { renderedImages: [...existing, ...additions] as any },
    });
  }

  /**
   * Stage a character's anchor PNG into ComfyUI's input dir for the Flux Redux
   * identity chain, returning the staged filename (relative to the input dir,
   * as LoadImage expects). Returns undefined — so the caller falls back to
   * text-only identity — when either Redux model file is missing or the anchor
   * PNG can't be found under any of the character's attached project slugs.
   */
  private stageFluxReduxReference(
    shotCode: string,
    anchor: { profileCode: string; slugs: string[] },
  ): string | undefined {
    const styleModel = path.join(COMFY_MODELS_ROOT, 'style_models', REDUX_STYLE_MODEL_NAME);
    const clipVision = path.join(COMFY_MODELS_ROOT, 'clip_vision',  REDUX_CLIP_VISION_NAME);
    if (!existsSync(styleModel) || !existsSync(clipVision)) return undefined;
    if (!anchor.profileCode) return undefined;

    // Resolve the anchor PNG across candidate slugs (current project first, then
    // the character's other attached projects — cameo anchors live elsewhere).
    let anchorPath: string | undefined;
    const seen = new Set<string>();
    for (const slug of anchor.slugs) {
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const p = path.join(APP_ROOT, 'data', slug, 'reference', `${anchor.profileCode}_anchor.png`);
      if (existsSync(p)) { anchorPath = p; break; }
    }
    if (!anchorPath) return undefined;

    const staged = `scene_ref_${shotCode}.png`;
    try {
      mkdirSync(COMFY_INPUT, { recursive: true });
      copyFileSync(anchorPath, path.join(COMFY_INPUT, staged));
    } catch (e: any) {
      this.logger.warn(`[${shotCode}] Redux anchor staging failed: ${e?.message ?? e} — text-only fallback`);
      return undefined;
    }
    this.logger.log(`[${shotCode}] Flux Redux identity → ${path.basename(anchorPath)}`);
    return staged;
  }

  // ── Qwen-Image-Edit-2511 helpers ────────────────────────────────────────────

  /** All four Qwen model files present in the live ComfyUI install. */
  private isQwenBaseReady(): boolean {
    return existsSync(path.join(LIVE_MODELS_ROOT, 'diffusion_models', QWEN_UNET_NAME))
        && existsSync(path.join(LIVE_MODELS_ROOT, 'loras', QWEN_LIGHTNING_LORA_NAME))
        && existsSync(path.join(LIVE_MODELS_ROOT, 'text_encoders', QWEN_CLIP_NAME))
        && existsSync(path.join(LIVE_MODELS_ROOT, 'vae', QWEN_VAE_NAME));
  }

  /** Anchor PNG on disk for one participant, scanned across every project slug
   *  the character is attached to (cameo anchors live under their HOME
   *  project). Same resolution logic stageFluxReduxReference uses. */
  private resolveAnchorPngPath(anchor: { profileCode: string; slugs: string[] }): string | undefined {
    if (!anchor.profileCode) return undefined;
    const seen = new Set<string>();
    for (const slug of anchor.slugs) {
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const p = path.join(APP_ROOT, 'data', slug, 'reference', `${anchor.profileCode}_anchor.png`);
      if (existsSync(p)) return p;
    }
    return undefined;
  }

  /** Stage 0-3 participant anchors into ComfyUI's input dir for the Qwen
   *  image references. Returns staged filenames parallel to `anchors`;
   *  undefined slots = anchor not found / copy failed (caller decides whether
   *  that's a hard error or a fallback). */
  private stageParticipantAnchors(
    shotCode: string,
    anchors: Array<{ profileCode: string; slugs: string[] }>,
  ): Array<string | undefined> {
    return anchors.map((a, i) => {
      const anchorPath = this.resolveAnchorPngPath(a);
      if (!anchorPath) return undefined;
      const staged = `scene_ref_${shotCode}_${i + 1}.png`;
      try {
        mkdirSync(COMFY_INPUT, { recursive: true });
        copyFileSync(anchorPath, path.join(COMFY_INPUT, staged));
      } catch (e: any) {
        this.logger.warn(`[${shotCode}] Qwen anchor staging failed for ${a.profileCode}: ${e?.message ?? e}`);
        return undefined;
      }
      return staged;
    });
  }

  /**
   * Stage a prop's installed anchor PNG into ComfyUI's input dir, same as a
   * character anchor. `Prop.anchorPath` is free-form: an absolute path is used as
   * given, anything else is read relative to APP_ROOT (that is how the install
   * endpoint writes it — `data/<slug>/reference/OBJ_<code>_anchor.png`).
   * Returns undefined when the file is missing, so a prop whose anchor was
   * deleted degrades to text-only instead of failing the render.
   */
  private stagePropAnchor(shotCode: string, anchorPath: string): string | undefined {
    const abs = path.isAbsolute(anchorPath) ? anchorPath : path.join(APP_ROOT, anchorPath);
    if (!existsSync(abs)) {
      this.logger.warn(`[${shotCode}] prop anchor not found on disk: ${abs} — rendering the object from text only`);
      return undefined;
    }
    const staged = `scene_ref_${shotCode}_obj.png`;
    try {
      mkdirSync(COMFY_INPUT, { recursive: true });
      copyFileSync(abs, path.join(COMFY_INPUT, staged));
    } catch (e: any) {
      this.logger.warn(`[${shotCode}] prop anchor staging failed: ${e?.message ?? e}`);
      return undefined;
    }
    return staged;
  }

  // ── Direct render (called by queue worker after engine arbitration) ─────────

  async renderShot(input: RenderShotInput): Promise<RenderResult> {
    // ── 1. Load shot + participants + their character profiles ───────────────
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: {
        project:      true,
        scene:        true,
        participants: {
          include: {
            // projectLinks → the slugs an anchor PNG might live under. A cameo
            // character's anchor is stored under its HOME project's slug, not
            // necessarily the current one, so Redux resolution must scan all
            // attached slugs (see memory: cameo assets scan all projects).
            character: {
              include: {
                profiles:     true,
                projectLinks: { include: { project: { select: { slug: true } } } },
              },
            },
            profile:   true,
          },
        },
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    // Location lookup via $queryRaw — bypasses the need for a Prisma client
    // regeneration when the locations table was added mid-session. Prepends
    // location.description to the positive so a single edit in the location
    // row updates every shot tagged with it.
    // Also LEFT JOIN props: a prop-hero shot (sh."propId" set) makes a story
    // OBJECT the subject. Object anchors live separately from characters (user
    // 2026-06-21 «предметы программа не рисует» — a macro of an object + a
    // 400-700char location description renders "just a room", losing the prop).
    const ctxRows = await this.prisma.$queryRaw<Array<{
      description: string | null;
      propDescription: string | null;
      propName: string | null;
      propCode: string | null;
      propAnchorPath: string | null;
    }>>`
      SELECT l.description AS description,
             p.description AS "propDescription",
             p.name        AS "propName",
             p.code        AS "propCode",
             p."anchorPath" AS "propAnchorPath"
      FROM shots sh
      LEFT JOIN locations l ON sh."locationId" = l.id
      LEFT JOIN props p ON sh."propId" = p.id
      WHERE sh.id = ${input.shotId}
    `;
    const locationDescription = ctxRows[0]?.description ?? null;
    const propDescription = ctxRows[0]?.propDescription ?? null;
    const propName        = ctxRows[0]?.propName ?? null;
    const propCode        = ctxRows[0]?.propCode ?? null;
    const propAnchorPath  = ctxRows[0]?.propAnchorPath ?? null;

    // ── 2. Resolve participant → CharacterProfile ────────────────────────────
    // Photoreal path (Project.visualStyle = 'photoreal_cinematic'): requires
    // trained LoRA per participant — throws if missing.
    // Cartoon path (e.g. 'graphic_novel_cell_shaded' for bio_plus): identity
    // lock is via IP-Adapter at 0.4 weight on a single anchor reference image,
    // no LoRA training required. profile.loraPath stays NULL; profile.useIpAdapter
    // is TRUE; reference image lives at data/<slug>/reference/<profileCode>_anchor.png.
    // Effective visual style = per-generation override (input.visualStyle, from
    // the render job params) → the shot's pinned pipeline (workflowRouteKey, set
    // by enqueueRender) → the project default. This is what makes the per-shot
    // pipeline choice + lock work end-to-end.
    const visualStyle: string = resolveVisualStyle(shot, input.visualStyle);
    const isCartoon = visualStyle !== 'photoreal_cinematic';

    // Anchor info for cartoon participants, parallel to `participants`. Used by
    // the Flux Redux identity path (graphic_novel_flux) to find the anchor PNG.
    const cartoonAnchors: Array<{ profileCode: string; slugs: string[] }> = [];

    const participants: SceneParticipant[] = [];
    for (const sp of shot.participants) {
      if (!sp.character) continue;            // unbound participant slot

      if (isCartoon) {
        // Cartoon path — no LoRA required, identity via anchor reference + text.
        const profile = sp.profile ?? sp.character.profiles[0];
        if (!profile || !profile.triggerToken) {
          throw new BadRequestException(
            `Character "${sp.character.code}" has no profile or trigger token. Cartoon projects still need a CharacterProfile row for promptBase + triggerToken.`,
          );
        }
        participants.push({
          triggerToken:    profile.triggerToken!,
          displayName:     sp.character.displayName ?? sp.character.code,
          loraPath:        '',                              // sentinel — strategy ignores when style=cartoon
          characterPrompt: profile.promptBase ?? '',
          loraStrength:    input.loraStrength,
        });
        cartoonAnchors.push({
          profileCode: (profile as any).profileCode,
          slugs: [
            shot.project.slug,
            ...((sp.character as any).projectLinks ?? []).map((l: any) => l.project?.slug).filter(Boolean),
          ],
        });
        continue;
      }

      // Photoreal path — must have trained LoRA.
      const profile = sp.profile && sp.profile.loraPath && sp.profile.triggerToken
        ? sp.profile
        : sp.character.profiles.find((p) => p.loraPath && p.triggerToken);

      if (!profile) {
        const explicit = sp.profile ? ` (chose ${sp.profile.profileCode}: ${sp.profile.loraPath ? 'LoRA missing trigger' : 'no LoRA trained yet'})` : '';
        throw new BadRequestException(
          `Character "${sp.character.code}" (${sp.character.displayName ?? '?'}) has no trained LoRA${explicit}. ` +
          `Train one via POST /training/profiles/:profileId/start before rendering scenes.`,
        );
      }
      participants.push({
        triggerToken:    profile.triggerToken!,
        displayName:     sp.character.displayName ?? sp.character.code,
        loraPath:        toComfyLoraName(profile.loraPath!),
        characterPrompt: profile.promptBase ?? '',
        loraStrength:    input.loraStrength,
      });
    }

    // 0 participants is fine — uses environment strategy (no LoRA).

    // ── 3. Pick strategy by visual style + participant count ─────────────────
    // realcomic_qwen renders natively on Qwen-Image-Edit-2511 (hard-fails when
    // the model files or a participant's anchor are missing — mirroring the
    // photoreal "no trained LoRA" rule, so a half-ready cast never silently
    // renders with inconsistent faces). The two legacy cartoon styles get a
    // Qwen dual-character OVERLAY (both anchors as image references) when
    // every asset is present, else fall back to their original text-only dual
    // strategies. Overlay strategies are reachable only via get(id) — the
    // factory's (style, count) auto-picker never resolves them.
    let strategy: SceneStrategy;
    let anchorImagePaths: string[] | undefined;
    let objectReferenceLabel: string | undefined;
    let qwenStyleLora: { name: string; strengthModel?: number } | undefined;

    if (visualStyle === QWEN_VISUAL_STYLE) {
      if (!this.isQwenBaseReady()) {
        throw new BadRequestException(
          `Visual style "${QWEN_VISUAL_STYLE}" requires the Qwen-Image-Edit-2511 files under ${LIVE_MODELS_ROOT} ` +
          `(diffusion_models/${QWEN_UNET_NAME}, loras/${QWEN_LIGHTNING_LORA_NAME}, text_encoders/${QWEN_CLIP_NAME}, vae/${QWEN_VAE_NAME}).`,
        );
      }
      const settingsLora = normalizeStyleLora((shot.project as any).settings);
      const loraName = settingsLora?.name ?? REALCOMIC_LORA_NAME;
      if (!existsSync(path.join(LIVE_MODELS_ROOT, 'loras', loraName))) {
        throw new BadRequestException(`Style LoRA "${loraName}" not found under ${LIVE_MODELS_ROOT}\\loras.`);
      }
      qwenStyleLora = {
        name:          loraName,
        strengthModel: input.loraStrength ?? settingsLora?.strengthModel ?? 1.0,
      };
      if (participants.length > 0) {
        const staged  = this.stageParticipantAnchors(shot.shotCode, cartoonAnchors);
        const missing = staged.flatMap((s, i) => (s ? [] : [participants[i]?.displayName ?? cartoonAnchors[i]?.profileCode]));
        if (missing.length > 0) {
          throw new BadRequestException(
            `Shot ${shot.shotCode}: no anchor portrait for ${missing.join(', ')} — ` +
            `realcomic_qwen identity is anchor-based; generate anchors first (POST /profiles/:id/generate-anchor).`,
          );
        }
        anchorImagePaths = staged as string[];
      }
      // Object reference: a prop with an INSTALLED anchor PNG rides along as the
      // last picture, so "the same car" is the same pixels in every shot instead
      // of a fresh invention each render. Capped by the graph's 3-image limit —
      // people always win, and a 3-participant shot simply doesn't get the object
      // (logged, never silently dropped).
      if (propAnchorPath) {
        const already = anchorImagePaths?.length ?? 0;
        if (already >= 3) {
          this.logger.warn(
            `[${shot.shotCode}] prop ${propCode} has an anchor but the shot already carries ${already} ` +
            `character references — Qwen takes 3 images max, object reference skipped`,
          );
        } else {
          const stagedProp = this.stagePropAnchor(shot.shotCode, propAnchorPath);
          if (stagedProp) {
            anchorImagePaths = [...(anchorImagePaths ?? []), stagedProp];
            objectReferenceLabel = (propName ?? propCode ?? 'the object').trim();
            this.logger.log(`[${shot.shotCode}] object reference attached as Picture ${already + 1}: ${objectReferenceLabel}`);
          }
        }
      }
      strategy = this.scenes.pickByStyleAndParticipantCount(visualStyle, participants.length);
    } else if (
      QWEN_DUAL_OVERRIDE_STYLES.has(visualStyle) &&
      participants.length === 2 &&
      this.isQwenBaseReady()
    ) {
      const staged = this.stageParticipantAnchors(shot.shotCode, cartoonAnchors);
      if (staged[0] && staged[1]) {
        strategy = this.scenes.get(`scene_dual_character_qwen_overlay__${visualStyle}`);
        anchorImagePaths = [staged[0], staged[1]];
        this.logger.log(`[${shot.shotCode}] Qwen dual-character overlay engaged (both anchors found)`);
      } else {
        // Missing anchor(s) → legacy text-only dual strategy, unchanged.
        strategy = this.scenes.pickByStyleAndParticipantCount(visualStyle, participants.length);
      }
    } else {
      strategy = this.scenes.pickByStyleAndParticipantCount(visualStyle, participants.length);
    }
    // The Qwen graphs share none of the legacy node ids the post-strategy
    // overrides in 4b/4c patch — those blocks must not touch them.
    const usingQwenGraph = visualStyle === QWEN_VISUAL_STYLE || anchorImagePaths !== undefined;
    const template = this.scenes.loadTemplate(strategy, shot.project.slug);

    // ── 4. Build params ──────────────────────────────────────────────────────
    const pf = (shot.promptFields ?? {}) as Record<string, unknown>;
    // `pf.positive` is canonical — every shot carries a hand-written positive
    // (VO↔image strict match). The old empty-positive composer that assembled
    // structured fields (frameDescription / positiveEnvironment / camera.framing
    // / lightingMood) was dead code — 0 of 7464 shots used it — removed 2026-07-04.
    const userPositive = pf.positive as string | undefined;
    if (!userPositive || userPositive.trim().length === 0) {
      throw new BadRequestException(
        `Shot ${shot.shotCode} has no promptFields.positive — write the positive prompt before rendering`,
      );
    }
    let positive: string = userPositive;

    // Location injection: APPEND the Location.description to the end of the
    // positive. Order matters for CLIP-G conditioning — tokens nearest the
    // start get the strongest weight, so character/face/action tokens stay
    // first and the location prose comes last. Single source of truth for
    // the train_kupe / corridor / vestibule prose; editing the Location row
    // updates every shot tagged with it. Idempotent.
    // A shot tagged with a prop is TWO different pictures depending on whether
    // anyone else is in frame, and until 2026-08-01 both got the same treatment:
    //
    //  - PROP-HERO (no participants) — the object IS the subject. Prepend the
    //    macro + shallow-DOF directive so it dominates, and skip the location:
    //    a rich room description pulls the render back to "just a room" and
    //    buries the prop (user 2026-06-21 «предметы программа не рисует»).
    //
    //  - PROP-IN-SCENE (>=1 participant) — the PERSON is the subject and the
    //    prop is something they hold, wear or stand beside. Here the macro
    //    directive is actively destructive: it orders the model to make the
    //    object fill the frame as the single clear subject, and the `else if`
    //    below then denied the shot its location entirely. Measured on `seller`
    //    2026-08-01: 32 shots carried a person AND a prop, and every one of them
    //    shipped that instruction — which is why a sewing machine came back the
    //    size of the room, a car filled the background, a pallet replaced the
    //    set, and the shots had no place at all behind the figure.
    //    17 of the 19 renders the user rejected were exactly this case.
    const propText   = propDescription?.trim() ?? '';
    const propIsHero = propText.length > 0 && participants.length === 0;

    if (propIsHero) {
      const dof = 'the prop fills the frame as the single clear subject in crisp sharp focus, the surroundings thrown far out of focus into soft neutral shapes, shallow depth of field, one warm focused light on the object';
      const propClause = `macro insert, ${propText}, ${dof}`;
      if (!positive.startsWith(propClause)) {
        positive = positive.trim().length > 0 ? `${propClause}, ${positive}` : propClause;
      }
    } else if (propText.length > 0) {
      // Prop in a peopled scene: name it at its natural size, after the action,
      // and let the location stand. Only the head clause of the description is
      // used — the full prose is 20-30 words written for a macro insert, and on
      // the Qwen path the positive already runs at ~67 words against a 55-word
      // budget whose overflow is trimmed from the TAIL (Skill: gen-studio-qwen2511
      // §2a). Spending the whole overrun on an object the shot merely contains
      // would drop the light and the palette instead.
      const head = propText.split(',')[0].trim().split(/\s+/).slice(0, 12).join(' ');
      if (head.length > 0 && !positive.toLowerCase().includes(head.toLowerCase())) {
        positive = positive.trim().length > 0 ? `${positive}, ${head}` : head;
      }
    }

    // The location applies to every shot except a prop-hero macro.
    if (!propIsHero && locationDescription && locationDescription.trim().length > 0 && !usingQwenGraph) {
      const desc = locationDescription.trim();
      if (!positive.endsWith(desc)) {
        positive = positive.trim().length > 0 ? `${positive}, ${desc}` : desc;
      }
    }
    // On the Qwen path the location travels as its OWN param instead (below):
    // appended here it landed at the tail of the positive, i.e. first in line to
    // be dropped by the scene word budget. Locations are a shared entity — they
    // get their own budget, composed after the action.
    const qwenLocationPrompt = (usingQwenGraph && !propIsHero)
      ? (locationDescription ?? undefined)
      : undefined;

    // Strip any weight syntax from the final positive — project rule: no
    // per-token emphasis anywhere (positive OR negative). Logs each strip so
    // we can trace whoever introduced the weight (user text, location prose,
    // bug, etc.). Safety net only — DB content is also clean by convention.
    positive = stripPromptWeights(positive, (tok, w) => {
      this.logger.warn(`[${shot.shotCode}] stripped positive weight "(${tok}:${w})" — weights banned in prompts`);
    });

    // Negative fallback: per-shot override beats project-wide default. Same
    // logic — one edit in `Project.defaultNegative` updates every shot that
    // hasn't overridden it.
    const shotNegative    = pf.negative as string | undefined;
    const projectDefault  = (shot.project as any)?.defaultNegative as string | undefined;
    const rawNegative     = (shotNegative && shotNegative.trim().length > 0)
      ? shotNegative
      : projectDefault;
    const negative = sanitizeNegative(rawNegative, this.logger, shot.shotCode);

    // Flux Redux identity reference (graphic_novel_flux, single character only).
    // Resolves to a staged input filename when the anchor PNG AND both Redux
    // model files are present; otherwise undefined → strategy stays text-only.
    const referenceImagePath = (visualStyle === FLUX_VISUAL_STYLE && participants.length === 1 && cartoonAnchors[0])
      ? this.stageFluxReduxReference(shot.shotCode, cartoonAnchors[0])
      : undefined;

    const params: SceneJobParams = {
      participants,
      scenePrompt:    input.scenePrompt   ?? positive ?? '',
      locationPrompt: qwenLocationPrompt,
      negativeExtra:  input.negativeExtra ?? negative ?? undefined,
      // SDXL native landscape bucket — 1 megapixel, ~16:9, clean output.
      width:          input.width  ?? 1344,
      height:         input.height ?? 768,
      seed:           input.seed   ?? Math.floor(Math.random() * 2 ** 32),
      steps:          input.steps  ?? normalizeSceneSteps((shot.project as any).settings),
      cfg:            input.cfg,
      guidance:       input.guidance,
      batchSize:      input.batchSize ?? 5,
      filenamePrefix: `scene_${shot.shotCode}`,
      referenceImagePath,
      reduxStyleModel: REDUX_STYLE_MODEL_NAME,
      reduxClipVision: REDUX_CLIP_VISION_NAME,
      anchorImagePaths,
      objectReferenceLabel,
      qwenStyleLora,
      qwenReferenceLatents: normalizeQwenReferenceLatents((shot.project as any).settings),
    };

    const workflow = strategy.buildPrompt(template, params);

    // ── 4b. Per-project style-LoRA override (cartoon only) ───────────────────
    // The graphic-novel workflows bake the comic style-LoRA at node "2"
    // (a LoraLoader, identical node id across the single/dual/environment
    // templates). When `project.settings.styleLora` is set we swap `lora_name`
    // (and optional strengths) at render time, so a project can pick a
    // different comic LoRA without editing the JSON template.
    //
    // Guarded on isCartoon: in the PHOTOREAL workflows node "2" is the CHARACTER
    // LoRA, so we must never touch it there. Absent/null settings → the JSON
    // default LoRA is used unchanged (keeps gaz / bio_plus working as before).
    // Skipped for Qwen graphs: node "2" doesn't exist there and the style LoRA
    // (RealComic) is already applied via params.qwenStyleLora — including the
    // settings.styleLora override and the per-render loraStrength slider.
    if (isCartoon && !usingQwenGraph) {
      const node2 = (workflow as any)['2']?.inputs;
      const styleLora = normalizeStyleLora((shot.project as any).settings);
      if (styleLora && node2) {
        node2.lora_name = styleLora.name;
        // Default to full strength when a project sets a comic LoRA. The Flux
        // comic templates ship the LoRA DISABLED (strength 0 → neutral, never
        // realism); configuring the project's styleLora is what turns it on.
        node2.strength_model = styleLora.strengthModel ?? 1.0;
        node2.strength_clip  = styleLora.strengthClip  ?? 1.0;
        this.logger.log(`[${shot.shotCode}] style LoRA override → ${styleLora.name}`);
      }
      // Per-render style-LoRA strength (UI slider) wins over the settings/JSON
      // default. node "2" is the style LoRA for every cartoon style (SDXL comic
      // AND graphic_novel_flux), so this knob is honoured on both.
      if (node2 && input.loraStrength !== undefined) {
        node2.strength_model = input.loraStrength;
        node2.strength_clip  = input.loraStrength;
      }
    }

    // ── 4c. Per-project Flux base-model override (graphic_novel_flux only) ────
    // The Flux comic templates bake a default UNET at node "1". Because the
    // comic LoRA must match the base it was trained on (usually flux1-dev), a
    // project can pin a neutral base via `project.settings.fluxBaseModel`
    // without editing the JSON. Absent → the JSON default is kept.
    // Skipped for Qwen graphs: node "1" there is the QWEN UNETLoader — writing
    // the project's Flux base into it would corrupt the graph.
    if (visualStyle === FLUX_VISUAL_STYLE && !usingQwenGraph) {
      const fluxBase = normalizeFluxBase((shot.project as any).settings);
      const node1 = (workflow as any)['1']?.inputs;
      if (fluxBase && node1) {
        node1.unet_name = fluxBase;
        this.logger.log(`[${shot.shotCode}] Flux base override → ${fluxBase}`);
      }
    }

    // ── 5. Dry-run or queue ──────────────────────────────────────────────────
    const baseResult = {
      shotId:       shot.id,
      shotCode:     shot.shotCode,
      strategyId:   strategy.id,
      // The resolved positive prompt actually sent to ComfyUI — captured so the
      // image-validation step can score candidates against what was asked for.
      positive:     params.scenePrompt,
      participants: participants.map((p) => ({
        profileCode: p.triggerToken,
        displayName: p.displayName,
        loraPath:    p.loraPath,
      })),
    };

    if (input.dryRun) {
      return { ...baseResult, workflow };
    }

    const job = await this.comfy.queuePrompt(workflow);

    // Track the in-flight prompt on the shot so /scenes can show "rendering" badges.
    await this.prisma.shot.update({
      where: { id: shot.id },
      data:  { activeRenderPromptId: job.promptId },
    });

    return { ...baseResult, job };
  }
}

function safeUnlink(p: string): void {
  try { unlinkSync(p); } catch { /* best-effort */ }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Read `project.settings.styleLora` into a normalized override or null.
 * Accepts either a bare ComfyUI lora_name string (e.g. "style\\X.safetensors")
 * or an object { name, strengthModel?, strengthClip? }. Returns null when
 * absent/blank so the caller falls back to the JSON-baked default LoRA.
 */
export function normalizeStyleLora(
  settings: unknown,
): { name: string; strengthModel?: number; strengthClip?: number } | null {
  return normalizeLoraSetting(settings, 'styleLora');
}

/**
 * Read `project.settings.qwenReferenceLatents` — whether the Qwen encode nodes
 * keep their `vae` wire, i.e. whether references also travel as near-pixel
 * `reference_latents` on top of the 384x384 VL semantics. Returns undefined
 * when unset so each strategy applies its own default (OFF for realcomic_qwen
 * scenes, ON for the dual-character overlay). Exists as a project setting so
 * the paste-vs-style trade-off can be A/B'd on one project without a code
 * change — see QwenGraphSpec.referenceLatents for the full mechanism.
 */
export function normalizeQwenReferenceLatents(settings: unknown): boolean | undefined {
  const v = (settings as { qwenReferenceLatents?: unknown } | null | undefined)?.qwenReferenceLatents;
  return typeof v === 'boolean' ? v : undefined;
}

/**
 * Read `project.settings.sceneSteps` — the project's default sampler step count
 * for scene renders. Undefined → the workflow JSON's own value (4 on the Qwen
 * graph, tuned for the Lightning 4-step LoRA). A per-render `input.steps` still
 * wins over it.
 *
 * Why a project setting: more steps give the sampler room to REDRAW instead of
 * returning the reference, which matters on the anchored Qwen path — and 8 steps
 * simply looked better than 4 on `caregiver` (user, 2026-07-27). Bounded to
 * 1..60: Lightning degrades into burnt colour well before that, and the guard is
 * against a typo'd 800, not against experimentation.
 */
export function normalizeSceneSteps(settings: unknown): number | undefined {
  const v = (settings as { sceneSteps?: unknown } | null | undefined)?.sceneSteps;
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const n = Math.round(v);
  return n >= 1 && n <= 60 ? n : undefined;
}

/**
 * Read `project.settings.anchorStyleLora` — the style LoRA used ONLY by the
 * anchor-portrait graph. Needed when a project renders its SCENES on one base
 * (Qwen-Image-Edit-2511 + RealComic) but its character ANCHORS on another
 * (Flux + a comic LoRA): `styleLora` then holds a Qwen LoRA that would be
 * garbage in the Flux LoraLoader. Same accepted shapes as styleLora.
 */
export function normalizeAnchorStyleLora(
  settings: unknown,
): { name: string; strengthModel?: number; strengthClip?: number } | null {
  return normalizeLoraSetting(settings, 'anchorStyleLora');
}

function normalizeLoraSetting(
  settings: unknown,
  key: 'styleLora' | 'anchorStyleLora',
): { name: string; strengthModel?: number; strengthClip?: number } | null {
  const s = (settings as Record<string, unknown> | null | undefined)?.[key];
  if (!s) return null;
  if (typeof s === 'string') {
    return s.trim().length > 0 ? { name: s.trim() } : null;
  }
  if (typeof s === 'object') {
    const o = s as { name?: unknown; strengthModel?: unknown; strengthClip?: unknown };
    if (typeof o.name === 'string' && o.name.trim().length > 0) {
      return {
        name:          o.name.trim(),
        strengthModel: typeof o.strengthModel === 'number' ? o.strengthModel : undefined,
        strengthClip:  typeof o.strengthClip  === 'number' ? o.strengthClip  : undefined,
      };
    }
  }
  return null;
}

/**
 * Read `project.settings.fluxBaseModel` — the UNET filename used at node "1" of
 * the Flux comic workflows — or null when unset/blank (JSON default is kept).
 * Lets a graphic_novel_flux project pin a base that matches its comic LoRA
 * without editing the workflow JSON.
 */
/**
 * Resolve the effective visual style for a shot: an explicit per-generation
 * override (rare; API power-users) → the project default. The visual style /
 * pipeline is a PER-PROJECT setting (project.visualStyle, changeable on the
 * Settings page) — NOT per shot.
 *
 * NB: do NOT read Shot.workflowRouteKey here — that column holds the workflow
 * ROUTE key (e.g. "<slug>_character_ip" / "<slug>_environment") set by the
 * seeders, not a visual-style id. Treating it as a style breaks SceneFactory.
 */
export function resolveVisualStyle(
  shot: { project?: { visualStyle?: string | null } | null },
  requested?: string | null,
): string {
  const r    = requested && requested.trim().length > 0 ? requested.trim() : undefined;
  const proj = ((shot.project as { visualStyle?: string | null } | null | undefined)?.visualStyle) ?? 'photoreal_cinematic';
  return r ?? proj;
}

export function normalizeFluxBase(settings: unknown): string | null {
  const s = (settings as { fluxBaseModel?: unknown } | null | undefined)?.fluxBaseModel;
  return typeof s === 'string' && s.trim().length > 0 ? s.trim() : null;
}

/**
 * ComfyUI LoraLoader expects paths relative to `models/loras/` with native
 * separators, not absolute paths. We store the absolute path in the DB for
 * portability and convert at render time.
 */
function toComfyLoraName(absolutePath: string): string {
  const rel = path.relative(COMFY_LORA_ROOT, absolutePath);
  return rel.split(/[/\\]/).join(path.sep);
}

// ─── Negative prompt sanitizer ──────────────────────────────────────────────
//
// Past incident: a user/UI saved a 30-token negative full of weighted phrases
// like `(red towel:2.0), (towel:1.8), (motion blur), (out of focus), (smudged)`
// to every shot. Result: SDXL output had plastic skin, HDR oversaturation,
// hyper-sharp grain — a "grubo" look. Even "capped" weights (1.3) caused
// drift on positive-prompt LoRA conditioning. Project rule (2026-05-24):
// zero `(token:N)` syntax anywhere — flat prompts only. The sanitizer below
// strips weights from negatives and removes known-toxic sharpening tokens
// before the negative reaches the strategy / KSampler.
// Tokens that, on the negative side, paradoxically push toward over-sharpening
// and plastic skin in SDXL. Keep this list narrow — only add tokens with
// confirmed visible damage.
const TOXIC_NEGATIVE_TOKENS = [
  'motion blur', 'camera shake', 'out of focus subject', 'out of focus',
  'hazy', 'smudged', 'double exposure', 'ghosting', 'plastic skin',
];

function sanitizeNegative(
  raw: string | undefined,
  logger: Logger,
  shotCode: string,
): string | undefined {
  if (!raw || !raw.trim()) return raw;
  let cleaned = raw;
  const warnings: string[] = [];

  // 1. Strip ALL weight syntax — no (token:N) anywhere. Project rule: prompts
  // stay plain, no per-token emphasis. Past incident: weights >= 1.5 cause
  // plastic-skin/hyper-sharp damage in SDXL even when "capped". User-facing
  // ban introduced 2026-05-24 after suspected face-drift on shots with rich
  // location descriptions. The simpler invariant — zero weights — is easier
  // to enforce and audit than per-engine weight tolerance.
  cleaned = stripPromptWeights(cleaned, (tok, w) => {
    warnings.push(`stripped weight "(${tok}:${w})" — weights banned in prompts`);
  });

  // 2. Strip toxic over-sharpening tokens (whole-word, comma-separated chunks).
  const chunks = cleaned.split(/,\s*/);
  const kept   = chunks.filter((chunk) => {
    const bare = chunk.replace(/^\(/, '').replace(/(:[0-9.]+)?\)$/, '').trim().toLowerCase();
    const toxic = TOXIC_NEGATIVE_TOKENS.some((t) => bare === t);
    if (toxic) warnings.push(`removed toxic over-sharp token "${bare}"`);
    return !toxic;
  });
  cleaned = kept.join(', ');

  if (warnings.length > 0) {
    logger.warn(`[${shotCode}] negative sanitized: ${warnings.join('; ')}`);
  }
  return cleaned;
}

/** Strip any `(token:weight)` syntax from a prompt. Project rule: prompts
 *  stay flat, no per-token emphasis (positive OR negative). The two patterns
 *  we handle: `(red towel:1.8)` → `red towel`, and the rare double-paren
 *  shortcut `((token))` → `token`. Called from positive + negative paths. */
export function stripPromptWeights(
  raw: string,
  onStrip?: (token: string, weight: string) => void,
): string {
  // Drop the `:weight` part inside parens; keep the bare token.
  let cleaned = raw.replace(/\(([^():]+):([0-9]+(?:\.[0-9]+)?)\)/g, (_, token, w) => {
    onStrip?.(String(token).trim(), String(w));
    return String(token).trim();
  });
  // Collapse `((token))` / `(token)` to bare token — these are emphasis shortcuts.
  cleaned = cleaned.replace(/\(+\s*([^()]+?)\s*\)+/g, (_, token) => String(token).trim());
  return cleaned;
}
