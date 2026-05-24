import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, copyFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ComfyService, QueuePromptResult } from '../comfy/comfy.service';
import { WorkflowFactory } from './workflows/workflow.factory';

const APP_ROOT    = process.env.APP_ROOT    ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_INPUT = process.env.COMFY_INPUT ?? 'E:\\ComfyUI\\input';

const DEFAULT_WORKFLOW_ID = 'ai_syndicate_dataset_creator_v3';

interface ProjectSettings {
  workflowId?:   string;
  comfyBaseUrl?: string;
}

export interface DatasetJobEntry extends QueuePromptResult {
  prompt:     string;
  imageCount: number;
}

export interface DatasetGenerationResult {
  profileCode:    string;
  workflowId:     string;
  totalImages:    number;
  referenceImage: string | null;
  jobs:           DatasetJobEntry[];
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly comfy:    ComfyService,
    private readonly workflows: WorkflowFactory,
  ) {}

  async generateCharacterDataset(
    profileId: string,
    dryRun = false,
  ): Promise<DatasetGenerationResult> {
    // ── Load profile → character → project ──────────────────────────────────
    const profile = await this.prisma.characterProfile.findUnique({
      where: { id: profileId },
      include: {
        character: {
          include: {
            project: true,
            // Phase 2: library characters borrow workflow/settings from one of
            // their attached projects.
            projectLinks: { include: { project: true } },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const character = profile.character;
    const project   = character.project;
    // For library chars borrow the first attached project (alphabetical by slug
    // for determinism) — used purely as a source of workflow template + settings.
    const templateProject = project ?? character.projectLinks
      .map((pl) => pl.project)
      .sort((a, b) => a.slug.localeCompare(b.slug))[0];
    if (!templateProject) {
      throw new BadRequestException(
        `Library character ${character.code} has no attached project — attach it to a project ` +
        `before generation so the workflow template can be borrowed.`,
      );
    }
    const settings  = (templateProject.settings ?? {}) as ProjectSettings;

    // ── Select workflow strategy ─────────────────────────────────────────────
    const workflowId = settings.workflowId ?? DEFAULT_WORKFLOW_ID;
    const strategy   = this.workflows.get(workflowId);
    const template   = this.workflows.loadTemplate(strategy, templateProject.slug);

    // ── Resolve reference image ──────────────────────────────────────────────
    // Project-bound: data/<projectSlug>/reference/<profileCode>/reference.<ext>
    // Library:       data/_characters/<charCode>/<profileCode>/reference/reference.<ext>
    // Legacy UUID layout is also checked for project-bound chars (backward compat).
    const refDirNew    = project
      ? path.join(APP_ROOT, 'data', project.slug, 'reference', profile.profileCode)
      : path.join(APP_ROOT, 'data', '_characters', character.code, profile.profileCode, 'reference');
    const refDirLegacy = project
      ? path.join(APP_ROOT, 'projects', project.id, 'characters', character.id, profileId)
      : refDirNew;
    const referenceImage = findReferenceImage(refDirNew) ?? findReferenceImage(refDirLegacy);

    let comfyImageFilename: string | null = null;
    if (referenceImage) {
      const destFilename = `ref_${profile.profileCode}${path.extname(referenceImage)}`;
      copyFileSync(referenceImage, path.join(COMFY_INPUT, destFilename));
      comfyImageFilename = destFilename;
    }

    // ── Build and queue a single job — the workflow handles all views internally ─
    const targetImages   = profile.targetImages ?? 48;
    const positivePrompt = profile.promptBase;
    const negativePrompt = profile.negative ?? '';
    const seed           = Math.floor(Math.random() * 2 ** 32);
    const filenamePrefix = profile.profileCode;
    const jobs: DatasetJobEntry[] = [];

    if (dryRun) {
      jobs.push({ promptId: 'dry-run', number: 0, prompt: positivePrompt, imageCount: targetImages });
    } else {
      const prompt = strategy.buildPrompt(template, {
        positive:       positivePrompt,
        negative:       negativePrompt,
        seed,
        filenamePrefix,
        loadImageFile:  comfyImageFilename,
        anglesPrompts:  (profile as any).promptAngles  ?? undefined,
        varietyPrompts: (profile as any).promptVariety ?? undefined,
        targetImages,
      });

      const result = await this.comfy.queuePrompt(prompt, settings.comfyBaseUrl);
      jobs.push({ ...result, prompt: positivePrompt, imageCount: targetImages });
    }

    return {
      profileCode:    profile.profileCode,
      workflowId,
      totalImages:    targetImages,
      referenceImage: referenceImage ? path.relative(APP_ROOT, referenceImage) : null,
      jobs,
    };
  }

  async getJobStatus(promptId: string) {
    return this.comfy.getHistory(promptId);
  }

  /** Returns all registered workflow strategies. */
  listWorkflows() {
    return this.workflows.list();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function findReferenceImage(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const found = readdirSync(dir).find(
    (f) => path.parse(f).name === 'reference' && IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()),
  );
  return found ? path.join(dir, found) : null;
}
