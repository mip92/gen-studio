import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService } from '../comfy/comfy.service';
import { WorkflowFactory } from './workflows/workflow.factory';
import { DatasetService } from '../training/dataset.service';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const POLL_MS      = 5_000;
const IMAGE_EXTS   = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const DEFAULT_WORKFLOW_ID = 'ai_syndicate_dataset_creator_v3';

export interface EnqueueDatasetInput {
  profileId:               string;
  /** Wait until this profile's dataset has at least one image, then dequeue. */
  dependsOnProfileId?:     string;
  /** Pick one image from this profile's existing dataset as ComfyUI reference (chaining). */
  referenceProfileId?:     string;
  /** Specific filename inside referenceProfileId's COMFY_OUTPUT to use. */
  referenceImageFilename?: string;
}

@Injectable()
export class DatasetQueueService {
  private readonly logger = new Logger(DatasetQueueService.name);

  constructor(
    private readonly prisma:    PrismaService,
    private readonly comfy:     ComfyService,
    private readonly workflows: WorkflowFactory,
    private readonly dataset:   DatasetService,
  ) {}

  async enqueue(input: EnqueueDatasetInput) {
    const profile = await this.prisma.characterProfile.findUnique({ where: { id: input.profileId } });
    if (!profile) throw new NotFoundException(`Profile ${input.profileId} not found`);

    if (input.dependsOnProfileId) {
      const dep = await this.prisma.characterProfile.findUnique({ where: { id: input.dependsOnProfileId } });
      if (!dep) throw new BadRequestException(`Dependency profile ${input.dependsOnProfileId} not found`);
    }
    if (input.referenceProfileId) {
      const ref = await this.prisma.characterProfile.findUnique({ where: { id: input.referenceProfileId } });
      if (!ref) throw new BadRequestException(`Reference profile ${input.referenceProfileId} not found`);
    }

    const blocked = !!input.dependsOnProfileId &&
      !(await this.dependencyHasImages(input.dependsOnProfileId));

    return this.prisma.datasetJob.create({
      data: {
        profileId:              profile.id,
        status:                 blocked ? 'blocked' : 'pending',
        dependsOnProfileId:     input.dependsOnProfileId,
        referenceProfileId:     input.referenceProfileId,
        referenceImageFilename: input.referenceImageFilename,
      },
    });
  }

  list(profileId?: string) {
    return this.prisma.datasetJob.findMany({
      where:   profileId ? { profileId } : undefined,
      orderBy: { queuedAt: 'desc' },
      take:    100,
    });
  }

  async cancel(jobId: string) {
    const job = await this.prisma.datasetJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (job.status === 'completed' || job.status === 'failed') return job;
    return this.prisma.datasetJob.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date() },
    });
  }

  // ── Public housekeeping (called by PipelineQueueService) ───────────────────

  /** Move blocked jobs to pending if their dependency now has images on disk. */
  async promoteBlocked(): Promise<void> {
    const blocked = await this.prisma.datasetJob.findMany({ where: { status: 'blocked' } });
    for (const j of blocked) {
      if (j.dependsOnProfileId && await this.dependencyHasImages(j.dependsOnProfileId)) {
        await this.prisma.datasetJob.update({
          where: { id: j.id },
          data:  { status: 'pending' },
        });
      }
    }
  }

  /** Poll ComfyUI for completion of any running dataset job; mark done/failed. */
  async pollRunning(): Promise<void> {
    const running = await this.prisma.datasetJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h) continue;
      if (h.status?.completed) {
        const success = h.status.status_str === 'success';
        if (success) {
          // Move just-generated files from COMFY_OUTPUT into the project's
          // dataset subset folder right away — keeps UI honest (collisions get
          // renumbered into "next available", so a re-generation ADDS to the
          // dataset rather than getting hidden behind same-named older files).
          await this.autoPrepare(j.profileId).catch((e) =>
            this.logger.warn(`auto-prepare after dataset job ${j.id}: ${e.message}`),
          );
        }
        await this.prisma.datasetJob.update({
          where: { id: j.id },
          data:  {
            status:       success ? 'completed' : 'failed',
            completedAt:  new Date(),
            errorMessage: success ? null : 'ComfyUI reported non-success status',
          },
        });
      }
    }
  }

  /**
   * Trigger dataset.prepare() right after a successful generation so freshly
   * produced files leave COMFY_OUTPUT and land in `data/<slug>/datasets/<code>/img/<N>_<token>/`.
   * Idempotent — safe to call repeatedly.
   */
  private async autoPrepare(profileId: string): Promise<void> {
    const profile = await this.prisma.characterProfile.findUnique({
      where: { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) return;
    const triggerToken = (profile.triggerToken && profile.triggerToken.trim().length > 0)
      ? profile.triggerToken.trim()
      : profile.profileCode.toLowerCase().replace(/[^a-z0-9]+/g, '') + '_lora';
    this.dataset.prepare({
      projectSlug:    profile.character.project.slug,
      profileCode:    profile.profileCode,
      filenamePrefix: profile.profileCode,
      triggerToken,
      numRepeats:     10,
    });
  }

  /** Find the oldest pending dataset job, or null. Pipeline orders this against training jobs. */
  async findNextPending() {
    return this.prisma.datasetJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /**
   * Dispatch the given pending job to ComfyUI: builds the workflow, copies
   * the reference image into COMFY_INPUT, queues the prompt, and flips status
   * to `running`. On failure, marks `failed`.
   */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.datasetJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Dataset job ${jobId} not found`);
    try {
      const promptId = await this.dispatch(
        job.id, job.profileId, job.referenceProfileId, job.referenceImageFilename,
      );
      await this.prisma.datasetJob.update({
        where: { id: jobId },
        data:  { status: 'running', startedAt: new Date(), comfyPromptId: promptId },
      });
    } catch (e: any) {
      this.logger.error(`Dispatch failed for job ${jobId}: ${e.message}`);
      await this.prisma.datasetJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: e.message, completedAt: new Date() },
      });
    }
  }

  /**
   * Build the dataset workflow + queue it on ComfyUI. Returns the prompt_id.
   * If referenceProfileId is set, picks one image from that profile's prefix
   * in COMFY_OUTPUT to use as the LoadImage source instead of the profile's own
   * reference.png.
   */
  private async dispatch(
    _jobId:                 string,
    profileId:              string,
    referenceProfileId:     string | null,
    referenceImageFilename: string | null,
  ) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new Error(`Profile ${profileId} disappeared`);

    const project  = profile.character.project;
    const strategy = this.workflows.get(DEFAULT_WORKFLOW_ID);
    const template = this.workflows.loadTemplate(strategy, project.slug);

    let comfyImageFilename: string | null = null;

    if (referenceProfileId) {
      const refProfile = await this.prisma.characterProfile.findUnique({ where: { id: referenceProfileId } });
      if (!refProfile) throw new Error(`Reference profile vanished`);

      let picked: string | null;
      if (referenceImageFilename) {
        // User selected a specific file in the UI — verify it exists and matches the prefix
        if (!referenceImageFilename.startsWith(refProfile.profileCode)) {
          throw new Error(`Selected reference "${referenceImageFilename}" does not match profile "${refProfile.profileCode}"`);
        }
        const candidate = path.join(COMFY_OUTPUT, referenceImageFilename);
        if (!existsSync(candidate)) {
          throw new Error(`Selected reference file no longer exists: ${candidate}`);
        }
        picked = candidate;
      } else {
        picked = pickImageForRef(COMFY_OUTPUT, refProfile.profileCode);
      }

      if (!picked) throw new Error(`No images found in ${COMFY_OUTPUT} matching prefix "${refProfile.profileCode}"`);
      const dest = `ref_chain_${profile.profileCode}${path.extname(picked)}`;
      copyFileSync(picked, path.join(COMFY_INPUT, dest));
      comfyImageFilename = dest;
    } else {
      const refDir = path.join(APP_ROOT, 'data', project.slug, 'reference', profile.profileCode);
      const own = findReferenceImage(refDir);
      if (own) {
        const dest = `ref_${profile.profileCode}${path.extname(own)}`;
        copyFileSync(own, path.join(COMFY_INPUT, dest));
        comfyImageFilename = dest;
      }
    }

    const workflow = strategy.buildPrompt(template, {
      positive:       profile.promptBase,
      negative:       profile.negative ?? '',
      seed:           Math.floor(Math.random() * 2 ** 32),
      filenamePrefix: profile.profileCode,
      loadImageFile:  comfyImageFilename,
      anglesPrompts:  profile.promptAngles  ?? undefined,
      varietyPrompts: profile.promptVariety ?? undefined,
      targetImages:   profile.targetImages ?? 60,
    });

    const result = await this.comfy.queuePrompt(workflow);
    return result.promptId;
  }

  private async dependencyHasImages(depProfileId: string): Promise<boolean> {
    const dep = await this.prisma.characterProfile.findUnique({ where: { id: depProfileId } });
    if (!dep) return false;
    return this.dataset.listImages(dep.profileCode).length > 0;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findReferenceImage(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const found = readdirSync(dir).find(
    (f) => path.parse(f).name === 'reference' && IMAGE_EXTS.has(path.extname(f).toLowerCase()),
  );
  return found ? path.join(dir, found) : null;
}

function pickImageForRef(outputDir: string, prefix: string): string | null {
  if (!existsSync(outputDir)) return null;
  const candidates: string[] = [];
  for (const entry of readdirSync(outputDir)) {
    if (!entry.startsWith(prefix)) continue;
    if (!IMAGE_EXTS.has(path.extname(entry).toLowerCase())) continue;
    const full = path.join(outputDir, entry);
    const st = statSync(full);
    if (!st.isFile() || st.size < 50_000) continue;   // skip tiny/corrupt
    candidates.push(full);
  }
  if (candidates.length === 0) return null;
  // pick the one closest to the middle alphabetically (deterministic, avoids
  // first/last which are often outlier numbered)
  candidates.sort();
  return candidates[Math.floor(candidates.length / 2)];
}
