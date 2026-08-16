import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readdirSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

// Mirror of scene-render.service.ts — ComfyUI's loras root. Style LoRAs live
// in the `style/` subfolder and are referenced by the workflows as
// "style\\<file>.safetensors" (ComfyUI native backslash path).
const COMFY_LORA_ROOT = process.env.COMFY_LORA_ROOT ?? 'E:\\ComfyUI\\models\\loras';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: QueueLedgerService,
  ) {}

  /**
   * List the comic/graphic-novel style LoRAs available on disk
   * (models/loras/style/*.safetensors). Drives the per-project style-LoRA
   * picker on the settings page. `name` is the exact ComfyUI lora_name to
   * store in project.settings.styleLora; `label` is the human-readable stem.
   */
  listStyleLoras(): Array<{ name: string; label: string }> {
    const dir = path.join(COMFY_LORA_ROOT, 'style');
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.safetensors'))
      .sort((a, b) => a.localeCompare(b))
      .map((f) => ({ name: `style\\${f}`, label: f.replace(/\.safetensors$/i, '') }));
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto) {
    // Schema marks these as NOT NULL; class-validator catches missing/empty
    // fields at the DTO layer. Anything that slips through here is a defensive
    // last line.
    const required = ['defaultNegative', 'defaultVideoNegative', 'defaultMotionPrompt', 'defaultStaticMotionPrompt'] as const;
    for (const k of required) {
      const v = (dto as any)[k];
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new BadRequestException(`Project.${k} is required (non-empty string)`);
      }
    }
    return this.prisma.project.create({
      data: {
        slug:                       dto.slug,
        name:                       dto.name,
        settings:                   (dto.settings ?? {}) as object,
        scriptText:                 dto.scriptText ?? null,
        defaultNegative:            dto.defaultNegative,
        // Cast: new columns aren't in the regenerated Prisma client until
        // restart, but the underlying column exists and accepts the value.
        ...({
          defaultVideoNegative:      dto.defaultVideoNegative,
          defaultMotionPrompt:       dto.defaultMotionPrompt,
          defaultStaticMotionPrompt: dto.defaultStaticMotionPrompt,
          // Visual style — falls back to DB default 'photoreal_cinematic' if omitted.
          ...(dto.visualStyle ? { visualStyle: dto.visualStyle } : {}),
        } as any),
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    // Reject explicit empty strings on the required prompt fields — schema
    // is NOT NULL, but the DB would accept '' which defeats the constraint.
    const requiredIfPresent = ['defaultNegative', 'defaultVideoNegative', 'defaultMotionPrompt', 'defaultStaticMotionPrompt'] as const;
    for (const k of requiredIfPresent) {
      const v = (dto as any)[k];
      if (v !== undefined && (typeof v !== 'string' || v.trim().length === 0)) {
        throw new BadRequestException(`Project.${k} cannot be cleared — it is required content`);
      }
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        slug:                       dto.slug,
        name:                       dto.name,
        settings:                   dto.settings as object | undefined,
        scriptText:                 dto.scriptText,
        defaultNegative:            dto.defaultNegative,
        ...({
          defaultVideoNegative:      (dto as any).defaultVideoNegative,
          defaultMotionPrompt:       (dto as any).defaultMotionPrompt,
          defaultStaticMotionPrompt: (dto as any).defaultStaticMotionPrompt,
          // Allow changing visualStyle post-creation. Affects future renders
          // only (already-rendered shots keep their existing image data).
          ...(dto.visualStyle ? { visualStyle: dto.visualStyle } : {}),
          // Published-video link. Empty string clears it (back to in-production);
          // a non-empty value marks the project DONE (hides /actions gates).
          ...((dto as any).youtubeUrl !== undefined
            ? { youtubeUrl: ((dto as any).youtubeUrl as string).trim() || null }
            : {}),
          // Default i2v flow for the project's shots. Affects FUTURE renders
          // only; acts and shots can still override it.
          ...((dto as any).defaultVideoFlow !== undefined
            ? { defaultVideoFlow: (dto as any).defaultVideoFlow }
            : {}),
          // Video model family. Affects FUTURE renders only — the filename is
          // baked onto each queued clip, so switching never re-patches work
          // already in the queue.
          ...((dto as any).videoEngine !== undefined
            ? { videoEngine: (dto as any).videoEngine }
            : {}),
        } as any),
      },
    });
  }

  /**
   * List available visual styles (registry). Used by UI to populate the
   * project-creation dropdown.
   */
  async listVisualStyles() {
    return this.prisma.$queryRaw<Array<{
      id: string;
      displayName: string;
      identityStack: string;
      loraPipeline: string;
    }>>`
      SELECT id, "displayName", "identityStack", "loraPipeline"
      FROM visual_styles
      ORDER BY "createdAt" ASC
    `;
  }

  /**
   * Delete a project and its whole subtree.
   *
   * Same contract as deleting a scene, one level up: interrupt anything still
   * running for it, then seal its queue entries so the film's spent hours remain
   * on record. Every entry carries the project id in its snapshot, so this covers
   * scenes, shots, music and character work in one call — and the records survive
   * in the ledger, which has no foreign key for the cascade to follow.
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.ledger.cancelAndSealUnder({ projectId: id }, `project ${id} deleted`);
    return this.prisma.project.delete({ where: { id } });
  }
}
