import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

interface ParticipantInput {
  label:        string;
  characterId?: string | null;
  profileId?:   string | null;
}

/** Full include shape used by mutations so the response matches `findById`. */
const SHOT_FULL_INCLUDE = {
  participants: {
    include: {
      character: { include: { profiles: true } },
      profile:   true,
    },
  },
  scene: true,
} as const;

@Injectable()
export class ShotsService {
  private readonly logger = new Logger(ShotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(projectIdOrSlug: string, sceneId?: string) {
    return this.prisma.shot.findMany({
      where: {
        AND: [
          { OR: [{ projectId: projectIdOrSlug }, { project: { slug: projectIdOrSlug } }] },
          sceneId ? { sceneId } : {},
        ],
      },
      include: { participants: { include: { character: true, profile: true } } },
      orderBy: { shotCode: 'asc' },
    });
  }

  async findOne(projectIdOrSlug: string, shotId: string) {
    const shot = await this.prisma.shot.findFirst({
      where: {
        id: shotId,
        OR: [{ projectId: projectIdOrSlug }, { project: { slug: projectIdOrSlug } }],
      },
      include: {
        participants: { include: { character: true, profile: true } },
        scene:        true,
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return shot;
  }

  /** Standalone lookup (used by frontend detail page). */
  async findById(shotId: string) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: shotId },
      include: {
        participants: {
          include: {
            character: { include: { profiles: true } },
            profile:   true,
          },
        },
        scene:   true,
        project: true,
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return shot;
  }

  async create(projectIdOrSlug: string, dto: CreateShotDto) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    const scene = await this.prisma.scene.findFirst({
      where: { id: dto.sceneId, projectId: project.id },
    });
    if (!scene) throw new BadRequestException(`Scene ${dto.sceneId} not found in project`);

    const dup = await this.prisma.shot.findFirst({
      where: { projectId: project.id, shotCode: dto.shotCode },
    });
    if (dup) throw new BadRequestException(`Shot code "${dto.shotCode}" already exists in project`);

    return this.prisma.shot.create({
      data: {
        projectId:          project.id,
        sceneId:            dto.sceneId,
        shotCode:           dto.shotCode,
        promptFields:       (dto.promptFields ?? {}) as object,
        workflowRouteKey:   dto.workflowRouteKey,
        referenceProfileId: dto.referenceProfileId,
        referenceImagePool: dto.referenceImagePool ? (dto.referenceImagePool as object) : undefined,
      },
      include: { participants: { include: { character: true } } },
    });
  }

  async update(shotId: string, dto: UpdateShotDto & { participants?: ParticipantInput[] }) {
    const shot = await this.findById(shotId);

    if (dto.shotCode && dto.shotCode !== shot.shotCode) {
      const dup = await this.prisma.shot.findFirst({
        where: { projectId: shot.projectId, shotCode: dto.shotCode, NOT: { id: shotId } },
      });
      if (dup) throw new BadRequestException(`Shot code "${dto.shotCode}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.participants !== undefined) {
        await tx.shotParticipant.deleteMany({ where: { shotId } });
        if (dto.participants.length > 0) {
          await tx.shotParticipant.createMany({
            data: dto.participants.map((p) => ({
              shotId,
              label:       p.label,
              characterId: p.characterId ?? null,
              profileId:   p.profileId   ?? null,
            })),
          });
        }
      }

      return tx.shot.update({
        where: { id: shotId },
        data: {
          shotCode:           dto.shotCode,
          sceneId:            dto.sceneId,
          promptFields:       dto.promptFields !== undefined ? (dto.promptFields as object) : undefined,
          workflowRouteKey:   dto.workflowRouteKey,
          referenceProfileId: dto.referenceProfileId,
          referenceImagePool: dto.referenceImagePool !== undefined
            ? (dto.referenceImagePool as object)
            : undefined,
        },
        include: { participants: { include: { character: true } }, scene: true },
      });
    });
  }

  async remove(projectIdOrSlug: string, shotId: string) {
    await this.findOne(projectIdOrSlug, shotId);
    return this.prisma.shot.delete({ where: { id: shotId } });
  }

  async removeById(shotId: string) {
    await this.findById(shotId);
    return this.prisma.shot.delete({ where: { id: shotId } });
  }

  // ── Rendered candidates / variants ──────────────────────────────────────

  async addRender(shotId: string, render: {
    filename:    string;
    promptId?:   string;
    seed?:       number;
    strategyId?: string;
  }) {
    const shot = await this.findById(shotId);
    const list = (shot.renderedImages as Array<Record<string, unknown>> | null) ?? [];
    // Skip duplicate if same filename already recorded
    const duplicate = list.some((r) => r.filename === render.filename);
    const next = duplicate ? list : [...list, { ...render, createdAt: new Date().toISOString() }];
    // Clear in-flight tracking when this prompt's result has been saved.
    const clearActive = render.promptId && shot.activeRenderPromptId === render.promptId;
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  {
        renderedImages: next as object,
        ...(clearActive ? { activeRenderPromptId: null } : {}),
      },
      include: SHOT_FULL_INCLUDE,
    });
  }

  async removeRender(shotId: string, filename: string) {
    const shot = await this.findById(shotId);
    const list = (shot.renderedImages as Array<Record<string, unknown>> | null) ?? [];
    const next = list.filter((r) => r.filename !== filename);
    const chosenStays = shot.chosenRender !== filename;

    // Best-effort delete from disk. The image lives at
    //   data/<slug>/shots/<shotCode>/<filename>
    // Failure to unlink (already gone, permission) must not block the DB delete —
    // the row is the source of truth, and orphan files are recoverable manually.
    const filePath = path.join(
      APP_ROOT, 'data', shot.project!.slug, 'shots', shot.shotCode, filename,
    );
    if (existsSync(filePath)) {
      try { unlinkSync(filePath); }
      catch (e: any) { this.logger.warn(`removeRender: failed to unlink ${filePath}: ${e?.message}`); }
    }

    return this.prisma.shot.update({
      where: { id: shotId },
      data:  {
        renderedImages: next as object,
        chosenRender:   chosenStays ? shot.chosenRender : null,
      },
      include: SHOT_FULL_INCLUDE,
    });
  }

  async setChosenRender(shotId: string, filename: string | null) {
    const shot = await this.findById(shotId);
    if (filename) {
      const list = (shot.renderedImages as Array<Record<string, unknown>> | null) ?? [];
      if (!list.some((r) => r.filename === filename)) {
        throw new BadRequestException(`Filename "${filename}" is not among rendered candidates`);
      }
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { chosenRender: filename },
      include: SHOT_FULL_INCLUDE,
    });
  }

  async setChosenVideo(shotId: string, videoId: string | null) {
    await this.findById(shotId);
    if (videoId) {
      const v = await this.prisma.videoRender.findUnique({ where: { id: videoId } });
      if (!v || v.shotId !== shotId) {
        throw new BadRequestException(`Video "${videoId}" does not belong to shot ${shotId}`);
      }
      if (v.status !== 'completed' || !v.outputFilename) {
        throw new BadRequestException(`Video "${videoId}" is not completed yet`);
      }
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { chosenVideoId: videoId },
      include: SHOT_FULL_INCLUDE,
    });
  }

  async findParticipants(projectIdOrSlug: string, shotId: string) {
    await this.findOne(projectIdOrSlug, shotId);
    return this.prisma.shotParticipant.findMany({
      where: { shotId },
      include: { character: true },
    });
  }
}
