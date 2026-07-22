import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync, rmSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { normalizeStyleLora } from '../generation/scenes/scene-render.service';
import { QwenSceneGraphBuilder } from '../generation/scenes/qwen/qwen-scene-graph.builder';
import { composeQwenInstruction, REALCOMIC_T2I_STYLE } from '../generation/scenes/qwen/qwen-prompt';
import { AnchorValidationService, anchorCandidateDir } from '../validation/anchor-validation.service';

const APP_ROOT     = process.env.APP_ROOT     ?? 'E:\\ComfyUI\\gen-studio';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

/** How many anchor candidates to render per job so the vision model has a pool
 *  to pick the best clean, on-model, non-anime portrait from (best-of-N). */
const ANCHOR_CANDIDATES = Math.max(1, Number(process.env.ANCHOR_CANDIDATES ?? 4));

/**
 * Anchor portrait rendering for cartoon-style projects (graphic_novel_cell_shaded etc.).
 *
 * Cartoon characters don't have trained LoRAs — identity is locked via IP-Adapter
 * on a single reference image (the "anchor"). This service generates that anchor
 * through the gen-studio queue (NOT a synchronous HTTP block on ComfyUI):
 *
 *   enqueue() inserts an anchor_render_jobs row → PipelineQueueService.tick()
 *   picks it up → dispatchPending() submits to ComfyUI → pollRunning() copies
 *   the output PNG into data/<slug>/reference/<profileCode>_anchor.png.
 *
 * Mirrors the dataset_jobs / scene_render_jobs pattern. Per
 * `feedback_all_gpu_jobs_through_queue` — never spawn GPU work directly in an
 * HTTP handler.
 *
 * Workflow file convention:
 *   data/<projectSlug>/comfy/gen_anchor_portrait_graphic_novel_api.json
 *
 * Identity assets land at:
 *   data/<projectSlug>/reference/<profileCode>_anchor.png
 */

const STYLE_PREFIX =
  'cinematic graphic novel illustration, illustrated comic book panel, ' +
  'cell-shaded coloring, hard black ink outline with variable line weight, ' +
  'flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, ' +
  'no photorealism, no 3D render, no plastic skin';

// Flux comic projects (graphic_novel_flux) need the SAME anti-anime steering the
// scene strategy uses, or Flux turns a young/bright portrait into anime even
// with the comic LoRA at full strength. The load-bearing tokens are
// "muted desaturated cinematic palette" + "semi-realistic ADULT proportions" +
// "western/american comic" — proven to hold western-comic on the flux1-dev base.
const FLUX_COMIC_STYLE =
  'printed western graphic novel panel, american comic book illustration, ' +
  'bold confident heavy black ink outlines with clean variable line weight, ' +
  'flat cell-shaded color blocks with cross-hatching in the shadows, ' +
  'muted desaturated cinematic color palette, grounded semi-realistic adult proportions, ' +
  'mature naturalistic face, gritty inked comic art, ' +
  'no anime, no manga, no chibi, no big shiny eyes, no photorealism, no 3D render';

const PORTRAIT_COMPOSITION =
  'three-quarter portrait facing camera, head-and-shoulders framing, ' +
  'neutral pale grey backdrop, soft north-window light, anchor reference portrait';

// realcomic_qwen: Qwen's VL encoder reads natural language, and the anchor
// must show enough of the body for scene renders to copy the outfit/build —
// not just head-and-shoulders.
const QWEN_PORTRAIT_COMPOSITION =
  'a three-quarter portrait of a single person facing the camera, waist-up framing, ' +
  'neutral pale grey backdrop, soft window light, clean character reference sheet look';

const QWEN_ANCHOR_NEGATIVE =
  'photograph, photorealistic, 3D render, plastic skin, anime, manga, chibi, ' +
  'deformed hands, extra fingers, two heads, multiple people, watermark, text overlay, blurry, low quality';

const ANCHOR_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, ' +
  'hyperrealistic, real human face, raytraced, deformed hands, extra fingers, ' +
  'two heads, watermark, text overlay, blurry, low quality, anime, manga, ' +
  'chibi, kawaii, oversaturated color, glamour photography, fashion shoot, ' +
  'full body, multiple people, group photo, profile only, back view';

@Injectable()
export class AnchorRenderService {
  private readonly logger = new Logger(AnchorRenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly anchorValidation: AnchorValidationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ENQUEUE — called by HTTP handler. Returns immediately.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a pending anchor-render job for this profile. Returns the new job
   * row immediately. PipelineQueueService will pick it up on next tick (5s
   * poll interval) and dispatch via dispatchPending().
   *
   * Idempotent-ish: if there's already a non-final job for this profile,
   * returns that existing row instead of queuing a duplicate.
   */
  async enqueue(profileId: string): Promise<any> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    if (!profile.promptBase || profile.promptBase.trim().length === 0) {
      throw new BadRequestException(
        `Profile ${profile.profileCode} has empty promptBase — fill it before generating anchor`,
      );
    }
    if (!profile.character.projectLinks[0]) {
      throw new BadRequestException(
        `Character ${profile.character.code} is not attached to any project. Attach it first.`,
      );
    }

    // If a pending or running job already exists, return it (don't duplicate).
    const existing = await (this.prisma as any).anchorRenderJob.findFirst({
      where:   { profileId, status: { in: ['pending', 'running'] } },
      orderBy: { queuedAt: 'desc' },
    });
    if (existing) {
      this.logger.log(`Anchor enqueue for ${profile.profileCode}: returning existing ${existing.status} job ${existing.id}`);
      return existing;
    }

    const job = await (this.prisma as any).anchorRenderJob.create({
      data: { profileId, status: 'pending' },
    });
    this.logger.log(`Anchor enqueue: profile=${profile.profileCode} jobId=${job.id}`);
    return job;
  }

  list(profileId?: string) {
    return (this.prisma as any).anchorRenderJob.findMany({
      where:   profileId ? { profileId } : undefined,
      orderBy: { queuedAt: 'desc' },
      take:    50,
    });
  }

  async getJob(jobId: string) {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Anchor job ${jobId} not found`);
    return job;
  }

  async cancel(jobId: string) {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Anchor job ${jobId} not found`);
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') return job;
    return (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'cancelled by user' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC HOUSEKEEPING — called by PipelineQueueService.tick()
  // ─────────────────────────────────────────────────────────────────────────

  /** Returns the oldest pending anchor job (or null). */
  async findNextPending() {
    return (this.prisma as any).anchorRenderJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /** Dispatch a pending job to ComfyUI. Sets status=running and comfyPromptId. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'pending') return;

    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: job.profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) {
      await this.failJob(jobId, `Profile ${job.profileId} no longer exists`);
      return;
    }
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      await this.failJob(jobId, `Character ${profile.character.code} no longer attached to any project`);
      return;
    }

    const visualStyle = (project as any).visualStyle ?? 'photoreal_cinematic';
    // Anchor workflow per visual style. Both share the node layout the patches
    // below target (2=LoraLoader, 3/4=text, 6=KSampler, 8=SaveImage), so the
    // same code drives the SDXL and Flux comic anchor graphs.
    const workflowFilename = visualStyle === 'realcomic_qwen'
      ? 'gen_anchor_portrait_realcomic_qwen_api.json'
      : visualStyle === 'graphic_novel_flux'
        ? 'gen_anchor_portrait_flux_comic_api.json'
        : 'gen_anchor_portrait_graphic_novel_api.json';
    // Per-project workflow wins; fall back to the shared master template so a
    // new project renders anchors without pre-copying its comfy/ dir.
    const perProject   = path.join(APP_ROOT, 'data', project.slug, 'comfy', workflowFilename);
    const shared       = path.join(APP_ROOT, 'data', '_templates', 'comfy', workflowFilename);
    const workflowPath = existsSync(perProject) ? perProject : shared;
    if (!existsSync(workflowPath)) {
      await this.failJob(
        jobId,
        `Anchor workflow not found at ${perProject} (and no shared template at ${shared}). Configure a LoRA loader for visualStyle=${visualStyle}.`,
      );
      return;
    }

    let wf = JSON.parse(readFileSync(workflowPath, 'utf-8')) as Record<string, any>;

    if (visualStyle === 'realcomic_qwen') {
      // Qwen graph: different node layout AND the text input on
      // TextEncodeQwenImageEditPlus is named `prompt`, not `text` — the generic
      // patch block below would silently write a stray `.text` key and leave
      // the real prompt as "PLACEHOLDER" (garbage anchor, no error). Delegate
      // to the shared Qwen builder instead.
      const styleLora = normalizeStyleLora((project as any).settings);
      const instruction = composeQwenInstruction({
        participants:   [],
        scenePrompt:    [QWEN_PORTRAIT_COMPOSITION, profile.promptBase].join(', '),
        styleDirective: REALCOMIC_T2I_STYLE,
        withReferences: false,
      });
      wf = new QwenSceneGraphBuilder().build(wf as any, {
        instruction,
        negative:       (profile.negative && profile.negative.trim().length > 0) ? profile.negative : QWEN_ANCHOR_NEGATIVE,
        width:          832,
        height:         1216,
        batchSize:      ANCHOR_CANDIDATES,
        seed:           Math.floor(Math.random() * 2 ** 31),
        scheduler:      'sgm_uniform',
        filenamePrefix: `anchor_${profile.profileCode}`,
        anchors:        [],
        styleLora: {
          name:           styleLora?.name ?? 'style\\RealComic_2509_base.safetensors',
          strengthModel:  styleLora?.strengthModel ?? 1.0,
        },
      }) as Record<string, any>;
      await this.submitAndMarkRunning(jobId, profile.profileCode, wf);
      return;
    }

    // One style LoRA per PROJECT, across the whole pipeline. The anchor workflow
    // bakes Graphic_Novel in its LoraLoader (node 2); if the project picked a
    // different comic LoRA via settings.styleLora (the same override scene-render
    // applies), swap it here too — otherwise the character anchors would be drawn
    // with one comic LoRA while the scenes use another (two LoRAs in one project).
    const styleLora = normalizeStyleLora((project as any).settings);
    const node2 = wf['2']?.inputs;
    if (styleLora && node2) {
      node2.lora_name = styleLora.name;
      // Default the comic LoRA to full strength. The Flux comic anchor template
      // ships the LoRA DISABLED (strength 0 → neutral, never realism); a project
      // setting its styleLora is what turns it on. Without this default the
      // anchor renders on the bare Flux base + "cell-shaded" text → ANIME.
      node2.strength_model = styleLora.strengthModel ?? 1.0;
      node2.strength_clip  = styleLora.strengthClip  ?? 1.0;
      this.logger.log(`Anchor ${profile.profileCode}: style LoRA override → ${styleLora.name}`);
    }

    // graphic_novel_flux needs the western/realistic anti-anime prefix; the SDXL
    // comic prefix ("cell-shaded …") sends Flux portraits to anime.
    const stylePrefix = visualStyle === 'graphic_novel_flux' ? FLUX_COMIC_STYLE : STYLE_PREFIX;
    const positive = [stylePrefix, PORTRAIT_COMPOSITION, profile.promptBase].join(', ');
    const negative = (profile.negative && profile.negative.trim().length > 0)
      ? profile.negative
      : ANCHOR_NEGATIVE;
    if (wf['3']?.inputs) wf['3'].inputs.text = positive;
    if (wf['4']?.inputs) wf['4'].inputs.text = negative;
    if (wf['6']?.inputs) wf['6'].inputs.seed = Math.floor(Math.random() * 2 ** 31);
    if (wf['8']?.inputs) wf['8'].inputs.filename_prefix = `anchor_${profile.profileCode}`;
    // Best-of-N: render a batch of candidates (node 5 EmptyLatentImage) so the
    // vision validator can pick the best clean, on-model, non-anime portrait.
    if (wf['5']?.inputs) wf['5'].inputs.batch_size = ANCHOR_CANDIDATES;

    await this.submitAndMarkRunning(jobId, profile.profileCode, wf);
  }

  /** Submit the assembled anchor workflow to ComfyUI and mark the job running.
   *  Fails the job (does not throw) when ComfyUI is unreachable. */
  private async submitAndMarkRunning(jobId: string, profileCode: string, wf: Record<string, any>): Promise<void> {
    let promptId: string;
    try {
      ({ promptId } = await this.comfy.queuePrompt(wf));
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const hint = (msg.includes('fetch failed') || msg.includes('ECONNREFUSED'))
        ? 'ComfyUI is not reachable on http://127.0.0.1:8188 — start it and retry. '
        : '';
      await this.failJob(jobId, hint + msg);
      return;
    }

    await (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
    });
    this.logger.log(`Anchor dispatch: jobId=${jobId} profile=${profileCode} → promptId=${promptId}`);
  }

  /** Poll ComfyUI for any running anchor jobs; mark done/failed and copy file. */
  async pollRunning(): Promise<void> {
    const running = await (this.prisma as any).anchorRenderJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h || !h.status?.completed) continue;

      if (h.status.status_str !== 'success') {
        await this.failJob(j.id, `ComfyUI status: ${h.status.status_str}`);
        continue;
      }

      // Copy ALL candidate portraits into the per-profile candidates dir; the
      // anchor-validation job then scores them, rejects anime, and installs the
      // best clean on-model portrait as <profileCode>_anchor.png.
      try {
        const outputs = h.outputs as Record<string, { images?: Array<{ filename: string }> }>;
        const imgs    = (outputs?.['8']?.images ?? []).filter((im) => im?.filename);
        if (imgs.length === 0) {
          await this.failJob(j.id, 'ComfyUI marked success but produced no images');
          continue;
        }
        const profile = await this.prisma.characterProfile.findUnique({
          where:   { id: j.profileId },
          include: { character: { include: { projectLinks: { include: { project: true } } } } },
        });
        const project = profile?.character.projectLinks[0]?.project;
        if (!profile || !project) {
          await this.failJob(j.id, 'Profile or attached project disappeared mid-render');
          continue;
        }
        const candDir = anchorCandidateDir(project.slug, profile.profileCode);
        try { rmSync(candDir, { recursive: true, force: true }); } catch { /* stale candidates */ }
        mkdirSync(candDir, { recursive: true });
        const candidates: string[] = [];
        for (const im of imgs) {
          const src = path.join(COMFY_OUTPUT, im.filename);
          if (!existsSync(src)) continue;
          copyFileSync(src, path.join(candDir, im.filename));
          candidates.push(im.filename);
        }
        if (candidates.length === 0) {
          await this.failJob(j.id, `ComfyUI outputs not found under ${COMFY_OUTPUT}`);
          continue;
        }
        await (this.prisma as any).anchorRenderJob.update({
          where: { id: j.id },
          data:  { status: 'completed', outputPath: candDir, completedAt: new Date() },
        });
        // Queue neural validation (runs later in the single-slot pipeline, ComfyUI
        // off). Best-effort: a failure here must NOT fail the render — the
        // candidates are on disk and can be re-validated manually.
        try {
          await this.anchorValidation.enqueue(profile.id, candidates, profile.promptBase ?? null);
        } catch (e: any) {
          this.logger.warn(`anchor validation enqueue failed for ${profile.profileCode}: ${e?.message ?? e}`);
        }
        this.logger.log(`Anchor render completed: jobId=${j.id} profile=${profile.profileCode} → ${candidates.length} candidate(s), queued validation`);
      } catch (e: any) {
        await this.failJob(j.id, e?.message ?? String(e));
      }
    }
  }

  private async failJob(jobId: string, msg: string) {
    await (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'failed', errorMessage: msg, completedAt: new Date() },
    });
    this.logger.warn(`Anchor failed: jobId=${jobId} — ${msg}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD path (non-queue) — file already exists on user's disk.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Delete the anchor PNG for this profile across ALL attached projects (the
   * same PNG can be re-used across multiple cartoon projects, so we wipe each
   * potential copy). Returns the list of deleted file paths. No-op if nothing
   * exists on disk.
   */
  async deleteAnchor(profileId: string): Promise<string[]> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const deleted: string[] = [];
    for (const link of profile.character.projectLinks) {
      const p = path.join(APP_ROOT, 'data', link.project.slug, 'reference', `${profile.profileCode}_anchor.png`);
      if (existsSync(p)) {
        try {
          unlinkSync(p);
          deleted.push(p);
        } catch (e: any) {
          this.logger.warn(`Failed to delete anchor ${p}: ${e?.message ?? e}`);
        }
      }
    }
    if (deleted.length > 0) {
      this.logger.log(`Deleted anchor PNGs for ${profile.profileCode}: ${deleted.join(', ')}`);
    }
    return deleted;
  }

  async uploadAnchor(profileId: string, buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Empty file buffer');
    }
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      throw new BadRequestException(`Character ${profile.character.code} is not attached to any project. Attach it first.`);
    }
    const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
    const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
    mkdirSync(destDir, { recursive: true });
    writeFileSync(destPath, buffer);
    this.logger.log(`Uploaded anchor for ${profile.profileCode} → ${destPath} (${buffer.length} bytes)`);
    return destPath;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANDIDATE gallery + manual anchor selection.
  //
  // Anchor render produces ANCHOR_CANDIDATES portraits per job (best-of-N);
  // the vision validator installs its pick automatically, but the final say is
  // the user's: the UI lists every candidate with its verdict and lets the
  // user install ANY of them as the anchor. "Which one is currently the
  // anchor" is computed by content hash (the installed anchor.png is a byte
  // copy of one candidate), so no schema change is needed and manual uploads
  // (which match no candidate) simply show no selection highlight.
  // ─────────────────────────────────────────────────────────────────────────

  private async profileWithProject(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      throw new BadRequestException(`Character ${profile.character.code} is not attached to any project. Attach it first.`);
    }
    return { profile, project };
  }

  private md5(file: string): string {
    return createHash('md5').update(readFileSync(file)).digest('hex');
  }

  /**
   * Candidate portraits on disk + the latest validation verdicts, merged per
   * filename. `selected` marks the candidate whose bytes are the currently
   * installed anchor.png; `chosenByAI` marks the validator's own pick.
   */
  async listCandidates(profileId: string) {
    const { profile, project } = await this.profileWithProject(profileId);
    const candDir = anchorCandidateDir(project.slug, profile.profileCode);
    const files = existsSync(candDir)
      ? readdirSync(candDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()
      : [];

    const valJobs = await (this.prisma as any).anchorValidationJob.findMany({
      where:   { profileId },
      orderBy: { queuedAt: 'desc' },
      take:    10,
    });
    const lastCompleted = valJobs.find((v: any) => v.status === 'completed') ?? null;
    const valActive     = valJobs.some((v: any) => v.status === 'pending' || v.status === 'running');
    const verdicts = new Map<string, any>(
      (Array.isArray(lastCompleted?.result) ? lastCompleted.result : []).map((v: any) => [v.filename, v]),
    );

    const anchorPath = await this.getAnchorPath(profileId);
    const anchorHash = anchorPath ? this.md5(anchorPath) : null;

    const candidates = files.map((f) => {
      const full = path.join(candDir, f);
      const st   = statSync(full);
      return {
        filename:   f,
        size:       st.size,
        mtime:      st.mtimeMs,
        verdict:    verdicts.get(f) ?? null,
        chosenByAI: lastCompleted?.chosenFilename === f,
        selected:   anchorHash !== null && this.md5(full) === anchorHash,
      };
    });

    return {
      profileId,
      profileCode:      profile.profileCode,
      anchorExists:     anchorPath !== null,
      /** true when the installed anchor matches none of the candidates (manual upload / older render) */
      anchorIsExternal: anchorPath !== null && candidates.every((c) => !c.selected),
      validationActive: valActive,
      validation: lastCompleted ? {
        jobId:           lastCompleted.id,
        completedAt:     lastCompleted.completedAt,
        chosenFilename:  lastCompleted.chosenFilename ?? null,
        suggestedPrompt: lastCompleted.suggestedPrompt ?? null,
      } : null,
      candidates,
    };
  }

  /** Absolute path of one candidate file, with traversal protection. */
  async getCandidatePath(profileId: string, filename: string): Promise<string> {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('bad filename');
    }
    const { profile, project } = await this.profileWithProject(profileId);
    const full = path.join(anchorCandidateDir(project.slug, profile.profileCode), filename);
    if (!existsSync(full)) throw new NotFoundException(`Candidate ${filename} not found for ${profile.profileCode}`);
    return full;
  }

  /**
   * Manually install one candidate as the profile's anchor.png — the user's
   * override of (or agreement with) the validator's pick.
   */
  async selectCandidate(profileId: string, filename: string): Promise<{ anchorPath: string }> {
    const src = await this.getCandidatePath(profileId, filename);
    const { profile, project } = await this.profileWithProject(profileId);
    const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
    const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(src, destPath);
    this.logger.log(`Anchor manually selected for ${profile.profileCode}: ${filename} → ${destPath}`);
    return { anchorPath: destPath };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUERY helpers used by controllers + style-readiness endpoint.
  // ─────────────────────────────────────────────────────────────────────────

  /** Anchor PNG path on disk, or null if no anchor generated yet. */
  async getAnchorPath(profileId: string): Promise<string | null> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) return null;
    for (const link of profile.character.projectLinks) {
      const p = path.join(APP_ROOT, 'data', link.project.slug, 'reference', `${profile.profileCode}_anchor.png`);
      if (existsSync(p)) return p;
    }
    return null;
  }

  async getStyleReadiness(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const styles = await this.prisma.$queryRaw<Array<{
      id: string; displayName: string; identityStack: string; loraPipeline: string;
    }>>`SELECT id, "displayName", "identityStack", "loraPipeline" FROM visual_styles ORDER BY "createdAt" ASC`;

    const anchorPath = await this.getAnchorPath(profileId);
    const hasLora    = !!profile.loraPath && profile.loraPath.trim().length > 0;

    const readiness: Record<string, {
      ready: boolean; identityStack: string; loraPipeline: string;
      assets: Record<string, string | null>;
    }> = {};
    for (const s of styles) {
      const isLoraStack   = s.identityStack === 'lora_face_lock';
      const isAnchorStack = s.identityStack === 'ip_adapter_only' || s.identityStack === 'ip_adapter_plus_style_lora';
      const ready         = isLoraStack ? hasLora : isAnchorStack ? (anchorPath !== null) : false;
      readiness[s.id] = {
        ready,
        identityStack: s.identityStack,
        loraPipeline:  s.loraPipeline,
        assets: {
          loraPath:   isLoraStack   ? (profile.loraPath ?? null) : null,
          anchorPath: isAnchorStack ? anchorPath               : null,
        },
      };
    }

    return {
      profileId:     profile.id,
      profileCode:   profile.profileCode,
      characterCode: profile.character.code,
      attachedProjects: profile.character.projectLinks.map((l) => ({
        slug:        l.project.slug,
        visualStyle: (l.project as any).visualStyle ?? 'photoreal_cinematic',
      })),
      styles: readiness,
    };
  }
}
