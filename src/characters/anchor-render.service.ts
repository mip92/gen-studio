import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { normalizeStyleLora } from '../generation/scenes/scene-render.service';

const APP_ROOT     = process.env.APP_ROOT     ?? 'E:\\ComfyUI\\gen-studio';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

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

const PORTRAIT_COMPOSITION =
  'three-quarter portrait facing camera, head-and-shoulders framing, ' +
  'neutral pale grey backdrop, soft north-window light, anchor reference portrait';

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
    // For now there's only one anchor workflow (graphic_novel). Future styles
    // can register their own gen_anchor_portrait_<style>_api.json files.
    const workflowFilename = 'gen_anchor_portrait_graphic_novel_api.json';
    const workflowPath = path.join(APP_ROOT, 'data', project.slug, 'comfy', workflowFilename);
    if (!existsSync(workflowPath)) {
      await this.failJob(
        jobId,
        `Anchor workflow not found at ${workflowPath}. Copy a template and configure LoRA loader for visualStyle=${visualStyle}.`,
      );
      return;
    }

    const wf = JSON.parse(readFileSync(workflowPath, 'utf-8')) as Record<string, any>;

    // One style LoRA per PROJECT, across the whole pipeline. The anchor workflow
    // bakes Graphic_Novel in its LoraLoader (node 2); if the project picked a
    // different comic LoRA via settings.styleLora (the same override scene-render
    // applies), swap it here too — otherwise the character anchors would be drawn
    // with one comic LoRA while the scenes use another (two LoRAs in one project).
    const styleLora = normalizeStyleLora((project as any).settings);
    const node2 = wf['2']?.inputs;
    if (styleLora && node2) {
      node2.lora_name = styleLora.name;
      if (styleLora.strengthModel !== undefined) node2.strength_model = styleLora.strengthModel;
      if (styleLora.strengthClip  !== undefined) node2.strength_clip  = styleLora.strengthClip;
      this.logger.log(`Anchor ${profile.profileCode}: style LoRA override → ${styleLora.name}`);
    }

    const positive = [STYLE_PREFIX, PORTRAIT_COMPOSITION, profile.promptBase].join(', ');
    const negative = (profile.negative && profile.negative.trim().length > 0)
      ? profile.negative
      : ANCHOR_NEGATIVE;
    if (wf['3']?.inputs) wf['3'].inputs.text = positive;
    if (wf['4']?.inputs) wf['4'].inputs.text = negative;
    if (wf['6']?.inputs) wf['6'].inputs.seed = Math.floor(Math.random() * 2 ** 31);
    if (wf['8']?.inputs) wf['8'].inputs.filename_prefix = `anchor_${profile.profileCode}`;

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
    this.logger.log(`Anchor dispatch: jobId=${jobId} profile=${profile.profileCode} → promptId=${promptId}`);
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

      // Pull the file path + copy into data/<slug>/reference/.
      try {
        const outputs = h.outputs as Record<string, { images?: Array<{ filename: string }> }>;
        const img     = outputs?.['8']?.images?.[0];
        if (!img) {
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
        const srcPath  = path.join(COMFY_OUTPUT, img.filename);
        const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
        const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
        mkdirSync(destDir, { recursive: true });
        if (!existsSync(srcPath)) {
          await this.failJob(j.id, `ComfyUI output not found at ${srcPath}`);
          continue;
        }
        copyFileSync(srcPath, destPath);
        await (this.prisma as any).anchorRenderJob.update({
          where: { id: j.id },
          data:  { status: 'completed', outputPath: destPath, completedAt: new Date() },
        });
        this.logger.log(`Anchor completed: jobId=${j.id} profile=${profile.profileCode} → ${destPath}`);
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
