import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { ComfyService } from '../comfy/comfy.service';
import { normalizeStyleLora, normalizeAnchorStyleLora } from '../generation/scenes/scene-render.service';
import { normalizeAnchorPipeline, FLUX_COMIC_STYLE, STYLE_PREFIX } from '../characters/anchor-render.service';
import { QwenSceneGraphBuilder } from '../generation/scenes/qwen/qwen-scene-graph.builder';
import { composeQwenInstruction, REALCOMIC_T2I_STYLE } from '../generation/scenes/qwen/qwen-prompt';

const APP_ROOT     = process.env.APP_ROOT     ?? 'E:\\ComfyUI\\gen-studio';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

/** Candidates per job, so there is a pool to pick a clean object study from. */
const PROP_ANCHOR_CANDIDATES = Math.max(1, Number(process.env.PROP_ANCHOR_CANDIDATES ?? 4));

/**
 * Anchor rendering for PROPS — story objects, not people.
 *
 * Deliberately its own service, its own job table and its own composition
 * (user 2026-08-01: «предметы это не люди, они отдельно»). A character anchor is
 * a waist-up three-quarter portrait on a grey backdrop and goes through vision QC
 * that hard-rejects anime faces; none of that means anything for a sewing machine.
 *
 * Why props need an anchor at all: without one the object reaches the model as
 * prose only, and prose does not pin a shape. Measured on `seller` 2026-08-01 —
 * 17 of 19 renders the user rejected carried a prop, and the same sewing machine
 * was a different machine in every shot. With an anchor installed, scene-render
 * attaches it as an extra `Picture N` reference (see stagePropAnchor /
 * SceneJobParams.objectReferenceLabel) so "the same pallet" is the same pixels.
 *
 * `POST /props/:id/anchor/from-render` already covered props that HAVE a solo
 * shot. This service covers the ones that never get one: on `seller`, `CAR` and
 * `MACHINE` appear only in peopled scenes, so there was no frame to promote and
 * no way to give them an anchor at all.
 *
 * Landing path matches the promote-from-render endpoint exactly:
 *   data/<projectSlug>/reference/OBJ_<CODE>_anchor.png
 */

/**
 * Object study, the prop analogue of QWEN_PORTRAIT_COMPOSITION.
 *
 * Two things it must NOT copy from the portrait version: "waist-up framing" and
 * "character reference sheet look" — both push a figure into the frame. And it
 * must say the object stands ALONE, because the RealComic LoRA has a strong prior
 * for people and will otherwise put a hand on the object.
 *
 * "the whole object in frame" is load-bearing: the prop clause in scene-render
 * describes a macro insert, and an anchor cropped like a macro would teach the
 * model the object is always huge — which is the very defect this fixes.
 */
const PROP_ANCHOR_COMPOSITION =
  'a single object study of one object alone, the whole object in frame with a margin around it, '
  + 'three-quarter view at eye level, neutral pale grey background, soft even studio light, no people';

/**
 * Negative for the object study. Unlike the character anchor negative this leads
 * with PEOPLE — the failure mode here is a hand or a figure creeping in beside
 * the object, not an anime face.
 */
const PROP_ANCHOR_NEGATIVE =
  'people, person, hands, fingers, face, figure, mannequin, multiple objects, duplicate object, '
  + 'collage, split panel, photograph, photorealistic, 3D render, plastic, watermark, text overlay, '
  + 'lettering, blurry, low quality, cropped object, cut off edges';

@Injectable()
export class PropAnchorService {
  private readonly logger = new Logger(PropAnchorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly ledger: QueueLedgerService,
  ) {}

  // ── Enqueue / read ─────────────────────────────────────────────────────────

  /**
   * Which engine draws a prop's object study.
   *
   * Highest wins: an explicit per-render pick → `settings.propAnchorPipeline` →
   * `settings.anchorPipeline` (whatever the characters use) → the style default.
   *
   * Props get their OWN setting on purpose. A project can perfectly well want
   * Flux for faces (cleaner, more european portraits — the reason `seller` pins
   * flux_comic) and Qwen+RealComic for objects, because an object study has no
   * face to get wrong and gains from being drawn in exactly the style the scenes
   * will reuse. Falling back to `anchorPipeline` keeps the common case zero-config.
   */
  resolvePipeline(settings: unknown, override?: string | null): 'qwen' | 'flux_comic' | 'sdxl_comic' {
    const wanted = (override ?? '').trim();
    if (wanted === 'qwen' || wanted === 'flux_comic' || wanted === 'sdxl_comic') return wanted;
    const own = (settings as { propAnchorPipeline?: unknown } | null | undefined)?.propAnchorPipeline;
    if (own === 'qwen' || own === 'flux_comic' || own === 'sdxl_comic') return own;
    return (normalizeAnchorPipeline(settings) ?? 'qwen') as 'qwen' | 'flux_comic' | 'sdxl_comic';
  }

  async enqueue(propId: string, pipeline?: string | null) {
    const prop = await this.prisma.prop.findUnique({
      where:   { id: propId },
      include: { project: true },
    });
    if (!prop) throw new NotFoundException(`Prop ${propId} not found`);
    if (!prop.description || prop.description.trim().length === 0) {
      throw new BadRequestException(
        `Prop ${prop.code} has an empty description — an object study is rendered from it, fill it first`,
      );
    }

    const existing = await this.prisma.propAnchorJob.findFirst({
      where:   { propId, status: { in: ['pending', 'running'] } },
      orderBy: { queuedAt: 'desc' },
    });
    if (existing) {
      this.logger.log(`Prop anchor enqueue for ${prop.code}: returning existing ${existing.status} job ${existing.id}`);
      return existing;
    }

    const job = await this.prisma.propAnchorJob.create({
      data: { propId, status: 'pending', pipeline: pipeline?.trim() || null },
    });
    await this.ledger.enqueue('prop_anchor', job.id);
    this.logger.log(`Prop anchor enqueue: prop=${prop.code} jobId=${job.id}`);
    return job;
  }

  list(propId?: string) {
    return this.prisma.propAnchorJob.findMany({
      where:   propId ? { propId } : undefined,
      orderBy: { queuedAt: 'desc' },
      take:    50,
    });
  }

  async cancel(jobId: string) {
    const job = await this.prisma.propAnchorJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Prop anchor job ${jobId} not found`);
    if (['completed', 'failed', 'cancelled'].includes(job.status)) return job;
    await this.ledger.close('prop_anchor', jobId, { status: 'cancelled', errorMessage: 'cancelled by user' });
    return this.prisma.propAnchorJob.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'cancelled by user' },
    });
  }

  /** Candidate PNGs on disk for a prop, newest job first. */
  candidateDir(projectSlug: string, propCode: string): string {
    return path.join(APP_ROOT, 'data', projectSlug, 'reference', '_candidates', `OBJ_${propCode}`);
  }

  // ── Candidates: the same best-of-N gallery characters get ──────────────────

  private md5(file: string): string {
    return createHash('md5').update(readFileSync(file)).digest('hex');
  }

  private async propOr404(propId: string) {
    const prop = await this.prisma.prop.findUnique({
      where:   { id: propId },
      include: { project: true },
    });
    if (!prop?.project) throw new NotFoundException(`Prop ${propId} not found`);
    return prop;
  }

  /** Absolute path of the installed anchor, or null. */
  async anchorPath(propId: string): Promise<string | null> {
    const prop = await this.propOr404(propId);
    if (!prop.anchorPath) return null;
    const abs = path.join(APP_ROOT, ...prop.anchorPath.split('/'));
    return existsSync(abs) ? abs : null;
  }

  /**
   * Every candidate the last object-study render produced, flagged with which
   * one is currently installed (by content hash, so a hand-copied anchor is
   * still recognised). The character panel's `chosenByAI` has no counterpart —
   * there is no vision QC for objects.
   */
  async listCandidates(propId: string) {
    const prop = await this.propOr404(propId);
    const dir  = this.candidateDir(prop.project.slug, prop.code);
    const installed = await this.anchorPath(propId);
    const installedHash = installed ? this.md5(installed) : null;

    const files = existsSync(dir)
      ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort()
      : [];

    return {
      propId,
      propCode:         prop.code,
      anchorExists:     installed !== null,
      /** installed anchor matches no candidate — promoted from a shot render or hand-placed */
      anchorIsExternal: installed !== null && !files.some((f) => this.md5(path.join(dir, f)) === installedHash),
      candidates: files.map((filename) => ({
        filename,
        selected: installedHash !== null && this.md5(path.join(dir, filename)) === installedHash,
      })),
    };
  }

  async candidatePath(propId: string, filename: string): Promise<string> {
    if (!/^[A-Za-z0-9._-]+\.png$/.test(filename)) {
      throw new BadRequestException(`filename must be a plain .png candidate name, got "${filename}"`);
    }
    const prop = await this.propOr404(propId);
    const p = path.join(this.candidateDir(prop.project.slug, prop.code), filename);
    if (!existsSync(p)) throw new NotFoundException(`Candidate not found: ${filename}`);
    return p;
  }

  /** Install one candidate as the anchor — the user's override of the default pick. */
  async selectCandidate(propId: string, filename: string) {
    const src  = await this.candidatePath(propId, filename);
    const prop = await this.propOr404(propId);
    const refDir   = path.join(APP_ROOT, 'data', prop.project.slug, 'reference');
    const destName = `OBJ_${prop.code}_anchor.png`;
    mkdirSync(refDir, { recursive: true });
    copyFileSync(src, path.join(refDir, destName));
    const relPath = ['data', prop.project.slug, 'reference', destName].join('/');
    // Choosing a candidate from the gallery IS the approve — the user looked at
    // the object and picked this render.
    return this.prisma.prop.update({
      where: { id: propId },
      data:  { anchorPath: relPath, anchorApprovedAt: new Date(), updatedAt: new Date() },
    });
  }

  /** Install an anchor from an uploaded file — parity with the character panel,
   *  for when you already have the object shot and would rather not render it. */
  async uploadAnchor(propId: string, buffer: Buffer): Promise<string> {
    const prop = await this.propOr404(propId);
    const refDir   = path.join(APP_ROOT, 'data', prop.project.slug, 'reference');
    const destName = `OBJ_${prop.code}_anchor.png`;
    mkdirSync(refDir, { recursive: true });
    require('fs').writeFileSync(path.join(refDir, destName), buffer);
    const relPath = ['data', prop.project.slug, 'reference', destName].join('/');
    await this.prisma.prop.update({
      where: { id: propId },
      data:  { anchorPath: relPath, anchorApprovedAt: new Date(), updatedAt: new Date() },
    });
    return relPath;
  }

  /**
   * Sign off on the installed object anchor.
   *
   * Needed because a completed render installs its first candidate by itself:
   * without an explicit approval there is no moment at which the user is asked
   * whether that image is actually the object. Scene rendering refuses to run
   * for a shot whose prop anchor is unapproved, and /actions keeps showing
   * `approve_prop_anchor` until this is called.
   */
  async approveAnchor(propId: string) {
    const abs = await this.anchorPath(propId);
    if (!abs) {
      throw new BadRequestException(
        'This prop has no installed anchor — render or upload one before approving.',
      );
    }
    return this.prisma.prop.update({
      where: { id: propId },
      data:  { anchorApprovedAt: new Date(), updatedAt: new Date() },
    });
  }

  /** Drop the anchor — the prop falls back to text-only until regenerated. */
  async deleteAnchor(propId: string) {
    const abs = await this.anchorPath(propId);
    if (abs) { try { unlinkSync(abs); } catch { /* already gone */ } }
    return this.prisma.prop.update({
      where: { id: propId },
      data:  { anchorPath: null, anchorApprovedAt: null, updatedAt: new Date() },
    });
  }

  // ── Queue callbacks ────────────────────────────────────────────────────────

  /** Dispatch a pending job to ComfyUI. Called by PipelineQueueService. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.propAnchorJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'pending') return;

    const prop = await this.prisma.prop.findUnique({
      where:   { id: job.propId },
      include: { project: true },
    });
    if (!prop?.project) {
      await this.failJob(jobId, 'Prop or its project disappeared before dispatch');
      return;
    }
    const project = prop.project;

    // Same engine choice the characters get, with props able to differ — see
    // resolvePipeline. An object study is rendered by whichever graph the project
    // says, because the anchor has to be drawable in a style the scenes reuse.
    const pipeline = this.resolvePipeline((project as any).settings, job.pipeline);
    const workflowFilename = pipeline === 'qwen'
      ? 'gen_anchor_portrait_realcomic_qwen_api.json'
      : pipeline === 'flux_comic'
        ? 'gen_anchor_portrait_flux_comic_api.json'
        : 'gen_anchor_portrait_graphic_novel_api.json';
    const perProject = path.join(APP_ROOT, 'data', project.slug, 'comfy', workflowFilename);
    const shared     = path.join(APP_ROOT, 'data', '_templates', 'comfy', workflowFilename);
    const workflowPath = existsSync(perProject) ? perProject : shared;
    if (!existsSync(workflowPath)) {
      await this.failJob(jobId, `Anchor workflow not found at ${perProject} (and no shared template at ${shared})`);
      return;
    }

    let wf: Record<string, any>;
    try {
      wf = JSON.parse(readFileSync(workflowPath, 'utf-8')) as Record<string, any>;

      if (pipeline === 'qwen') {
        // Qwen's text input is named `prompt`, not `text`, and the graph has a
        // different node layout — the generic patch below would write a stray
        // key and leave the real prompt as PLACEHOLDER. Same trap the character
        // path documents; delegate to the shared builder.
        const styleLora = normalizeStyleLora((project as any).settings);
        const instruction = composeQwenInstruction({
          participants:   [],
          scenePrompt:    [PROP_ANCHOR_COMPOSITION, prop.description.trim()].join(', '),
          styleDirective: REALCOMIC_T2I_STYLE,
          withReferences: false,
        });
        wf = new QwenSceneGraphBuilder().build(wf as any, {
          instruction,
          negative:       PROP_ANCHOR_NEGATIVE,
          // Landscape, unlike the 832x1216 character portrait: an object study
          // has no reason to be tall, and every scene it feeds is 16:9.
          width:          1216,
          height:         832,
          batchSize:      PROP_ANCHOR_CANDIDATES,
          seed:           Math.floor(Math.random() * 2 ** 31),
          scheduler:      'sgm_uniform',
          filenamePrefix: `objanchor_${prop.code}`,
          anchors:        [],
          styleLora: {
            name:          styleLora?.name ?? 'style\\RealComic_2509_base.safetensors',
            strengthModel: styleLora?.strengthModel ?? 1.0,
          },
        } as any) as Record<string, any>;
      } else {
        // Flux / SDXL comic graphs share the node layout: 2=LoraLoader,
        // 3=positive, 4=negative, 5=latent, 6=KSampler, 8=SaveImage.
        //
        // The Flux base needs the western anti-anime prefix; the SDXL comic
        // prefix sends Flux to anime. Same rule as the character anchors.
        const stylePrefix = pipeline === 'flux_comic' ? FLUX_COMIC_STYLE : STYLE_PREFIX;
        const styleLora = normalizeAnchorStyleLora((project as any).settings);
        if (styleLora && wf['2']?.inputs) {
          wf['2'].inputs.lora_name       = styleLora.name;
          wf['2'].inputs.strength_model  = styleLora.strengthModel ?? 1.0;
          wf['2'].inputs.strength_clip   = styleLora.strengthClip  ?? 1.0;
        }
        if (wf['3']?.inputs) wf['3'].inputs.text = [stylePrefix, PROP_ANCHOR_COMPOSITION, prop.description.trim()].join(', ');
        if (wf['4']?.inputs) wf['4'].inputs.text = PROP_ANCHOR_NEGATIVE;
        if (wf['5']?.inputs) {
          // Landscape for objects — the template is a 832x1216 portrait.
          wf['5'].inputs.width      = 1216;
          wf['5'].inputs.height     = 832;
          wf['5'].inputs.batch_size = PROP_ANCHOR_CANDIDATES;
        }
        if (wf['6']?.inputs) wf['6'].inputs.seed = Math.floor(Math.random() * 2 ** 31);
        if (wf['8']?.inputs) wf['8'].inputs.filename_prefix = `objanchor_${prop.code}`;
      }
    } catch (e: any) {
      await this.failJob(jobId, `graph build failed: ${e?.message ?? e}`);
      return;
    }
    this.logger.log(`Prop anchor ${prop.code}: pipeline=${pipeline} workflow=${workflowFilename}`);

    let promptId: string;
    try {
      ({ promptId } = await this.comfy.queuePrompt(wf));
    } catch (e: any) {
      const msg  = e?.message ?? String(e);
      const hint = (msg.includes('fetch failed') || msg.includes('ECONNREFUSED'))
        ? 'ComfyUI is not reachable on http://127.0.0.1:8188 — start it and retry. '
        : '';
      await this.failJob(jobId, hint + msg);
      return;
    }

    await this.prisma.propAnchorJob.update({
      where: { id: jobId },
      data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
    });
    await this.ledger.attachPrompt('prop_anchor', jobId, promptId);
    this.logger.log(`Prop anchor dispatch: jobId=${jobId} prop=${prop.code} → promptId=${promptId}`);
  }

  /**
   * Poll running jobs; copy candidates to disk and install the FIRST one as the
   * anchor so a generated prop is immediately usable. There is deliberately no
   * vision-QC step here — the character pipeline's QC scores faces for anime and
   * identity match, neither of which applies to an object. The user re-picks by
   * hand from the candidates if the first is wrong.
   */
  async pollRunning(): Promise<void> {
    const running = await this.prisma.propAnchorJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h || !h.status?.completed) continue;

      if (h.status.status_str !== 'success') {
        await this.failJob(j.id, `ComfyUI status: ${h.status.status_str}`);
        continue;
      }

      try {
        const outputs = h.outputs as Record<string, { images?: Array<{ filename: string }> }>;
        const imgs = Object.values(outputs ?? {})
          .flatMap((o) => o?.images ?? [])
          .filter((im) => im?.filename);
        if (imgs.length === 0) {
          await this.failJob(j.id, 'ComfyUI marked success but produced no images');
          continue;
        }
        const prop = await this.prisma.prop.findUnique({
          where:   { id: j.propId },
          include: { project: true },
        });
        if (!prop?.project) {
          await this.failJob(j.id, 'Prop or its project disappeared mid-render');
          continue;
        }

        const candDir = this.candidateDir(prop.project.slug, prop.code);
        try { rmSync(candDir, { recursive: true, force: true }); } catch { /* stale candidates */ }
        mkdirSync(candDir, { recursive: true });

        const copied: string[] = [];
        for (const im of imgs) {
          const src = path.join(COMFY_OUTPUT, im.filename);
          if (!existsSync(src)) continue;
          copyFileSync(src, path.join(candDir, im.filename));
          copied.push(im.filename);
        }
        if (copied.length === 0) {
          await this.failJob(j.id, `ComfyUI outputs not found under ${COMFY_OUTPUT}`);
          continue;
        }

        // Install the first candidate. Same destination and the same relative
        // path format as POST /props/:id/anchor/from-render, so the two routes
        // to an anchor are interchangeable downstream.
        const refDir   = path.join(APP_ROOT, 'data', prop.project.slug, 'reference');
        const destName = `OBJ_${prop.code}_anchor.png`;
        mkdirSync(refDir, { recursive: true });
        copyFileSync(path.join(candDir, copied[0]), path.join(refDir, destName));
        const relPath = ['data', prop.project.slug, 'reference', destName].join('/');

        await this.prisma.prop.update({
          where: { id: prop.id },
          // anchorApprovedAt is cleared, never carried over: this image was
          // picked by "first file wins", nobody has looked at it, and if it
          // just overwrote an approved anchor that approval is now stale.
          data:  { anchorPath: relPath, anchorApprovedAt: null, updatedAt: new Date() },
        });
        await this.prisma.propAnchorJob.update({
          where: { id: j.id },
          data:  { status: 'completed', outputPath: candDir, completedAt: new Date() },
        });
        await this.ledger.close('prop_anchor', j.id, { status: 'completed', outputFilename: relPath });
        this.logger.log(
          `Prop anchor completed: jobId=${j.id} prop=${prop.code} → ${copied.length} candidate(s), installed ${destName}`,
        );
      } catch (e: any) {
        await this.failJob(j.id, e?.message ?? String(e));
      }
    }
  }

  private async failJob(jobId: string, msg: string) {
    await this.prisma.propAnchorJob.update({
      where: { id: jobId },
      data:  { status: 'failed', errorMessage: msg, completedAt: new Date() },
    });
    await this.ledger.close('prop_anchor', jobId, { status: 'failed', errorMessage: msg });
    this.logger.warn(`Prop anchor failed: jobId=${jobId} — ${msg}`);
  }
}
