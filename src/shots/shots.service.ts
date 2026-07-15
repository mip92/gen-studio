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
  scene:   true,
  // visualStyle is REQUIRED by the frontend (ShotDetail) to branch cartoon vs
  // photoreal — without it isCartoon defaults false and cartoon shots wrongly
  // demand a LoRA. Mutation responses must carry it just like findById.
  project: { select: { id: true, slug: true, name: true, visualStyle: true } },
  // Used by the Telegram bot's approval flow and the videos tab — full list
  // of completed/in-flight VideoRender rows for this shot. No `orderBy as
  // const` because Prisma's input-types reject it under TypeScript strict.
  videoRenders: {
    select: {
      id: true, status: true, outputFilename: true,
      upscaleStatus: true, upscaledFilename: true,
    },
  },
  // Latest image-validation verdict(s) for the render-picker UI: the vision
  // model's per-candidate scores + issues and which filename it chose. Newest
  // first; the UI reads validationJobs[0].
  validationJobs: {
    select: {
      id: true, status: true, result: true, chosenFilename: true,
      suggestedPrompt: true, suggestedFields: true, judgeReason: true,
      errorMessage: true, completedAt: true,
    },
    orderBy: { queuedAt: 'desc' as const },
    take: 3,
  },
};

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
        project:      { select: { id: true, slug: true, name: true, visualStyle: true } },
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
        // Latest image-validation verdict(s) for the render-picker UI.
        validationJobs: {
          select: {
            id: true, status: true, result: true, chosenFilename: true,
            suggestedPrompt: true, suggestedFields: true, judgeReason: true,
            errorMessage: true, completedAt: true,
          },
          orderBy: { queuedAt: 'desc' as const },
          take: 3,
        },
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

    const created = await this.prisma.shot.create({
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
    // locationId is in the schema but the Prisma client may not have been
    // regenerated yet. Apply via $queryRaw to be safe; UI can also use
    // PATCH /shots/:id/location later.
    if ((dto as any).locationId !== undefined) {
      await this.prisma.$queryRaw`UPDATE shots SET "locationId" = ${(dto as any).locationId} WHERE id = ${created.id}`;
    }
    return created;
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

      const updated = await tx.shot.update({
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
          renderMode:         dto.renderMode,
        },
        include: { participants: { include: { character: true } }, scene: true },
      });
      // locationId via raw SQL — Prisma client may not have been regenerated
      // yet since the column was added mid-session.
      if ((dto as any).locationId !== undefined) {
        await tx.$queryRaw`UPDATE shots SET "locationId" = ${(dto as any).locationId} WHERE id = ${shotId}`;
      }
      return updated;
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

  /** Apply the vision model's structured suggestion — each part into its own
   *  promptFields key (user 2026-07-04: negatives go to negative, positives to
   *  positive). `positive` REPLACES promptFields.positive; `negative` tokens
   *  are APPENDED (deduplicated) to the shot's negative. A shot that had no own
   *  negative starts from the project default — appending to an empty string
   *  would otherwise silently DROP the whole default at render time (renderer
   *  uses pf.negative INSTEAD of the default when non-empty). */
  async applySuggestedFields(shotId: string, fields: { positive?: string | null; negative?: string | null }) {
    const shot = await this.findById(shotId);
    const pf = { ...((shot.promptFields as Record<string, unknown> | null) ?? {}) };
    const positive = fields.positive?.trim();
    const negative = fields.negative?.trim();
    if (positive) pf.positive = positive;
    if (negative) {
      const own  = typeof pf.negative === 'string' && pf.negative.trim() ? pf.negative.trim() : '';
      const base = own || ((shot.project as { defaultNegative?: string } | null)?.defaultNegative ?? '').trim();
      pf.negative = appendNegativeTokens(base, negative);
    }
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { promptFields: pf as object },
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

  /**
   * Bulk-set renderMode: the first `minutes` of the film (in play order) become
   * "animated", the rest "static". This is the long-form production model — only
   * the opening is fully animated, the body ships as Ken-Burns stills.
   *
   * Per-shot screen time is estimated (the timeline isn't rendered yet) with the
   * best signal available: approved TTS duration → narration-text length proxy
   * (~15 chars/sec) → 6 s fallback. The shot that straddles the boundary stays
   * animated; everything after it is static.
   */
  async setAnimatedPrefix(projectIdOrSlug: string, minutes: number) {
    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new BadRequestException(`minutes must be a non-negative number, got ${minutes}`);
    }
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    const budgetSec = minutes * 60;
    const shots = await this.prisma.shot.findMany({
      where:  { projectId: project.id },
      select: { id: true, shotCode: true, narrationText: true, approvedTTSJobId: true,
                scene: { select: { sortOrder: true } } },
    });
    // Play order = scene.sortOrder, then shotCode lexical (matches export).
    shots.sort((a, b) =>
      (a.scene.sortOrder - b.scene.sortOrder) || a.shotCode.localeCompare(b.shotCode));

    // Resolve approved-TTS durations in one query for an accurate estimate.
    const approvedIds = shots.map((s) => s.approvedTTSJobId).filter((x): x is string => !!x);
    const ttsRows = approvedIds.length
      ? await this.prisma.tTSJob.findMany({
          where:  { id: { in: approvedIds } },
          select: { id: true, durationMs: true },
        })
      : [];
    const durById = new Map(ttsRows.map((t) => [t.id, t.durationMs ?? 0]));

    let acc = 0;
    let boundaryShotCode: string | null = null;
    const animated: string[] = [];
    const statics:  string[] = [];
    for (const s of shots) {
      if (acc < budgetSec) {
        animated.push(s.id);
      } else {
        statics.push(s.id);
        if (!boundaryShotCode) boundaryShotCode = s.shotCode;
      }
      const ms = s.approvedTTSJobId ? durById.get(s.approvedTTSJobId) ?? 0 : 0;
      const sec = ms > 0
        ? ms / 1000
        : (s.narrationText ? Math.max(2.5, s.narrationText.length / 15) : 6);
      acc += sec;
    }

    if (animated.length) {
      await this.prisma.shot.updateMany({ where: { id: { in: animated } }, data: { renderMode: 'animated' } });
    }
    if (statics.length) {
      await this.prisma.shot.updateMany({ where: { id: { in: statics } }, data: { renderMode: 'static' } });
    }
    return {
      animatedCount:     animated.length,
      staticCount:       statics.length,
      boundaryShotCode,
      estimatedTotalSec: Math.round(acc),
      budgetSec,
    };
  }

  async findParticipants(projectIdOrSlug: string, shotId: string) {
    await this.findOne(projectIdOrSlug, shotId);
    return this.prisma.shotParticipant.findMany({
      where: { shotId },
      include: { character: true },
    });
  }
}

/** Append comma-separated tokens to a negative prompt, skipping ones already
 *  present (case-insensitive). Keeps the base order; additions go to the end. */
function appendNegativeTokens(base: string, additions: string): string {
  const seen = new Set(base.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean));
  const fresh = additions.split(',').map((t) => t.trim()).filter((t) => t && !seen.has(t.toLowerCase()));
  if (fresh.length === 0) return base;
  return base ? `${base}, ${fresh.join(', ')}` : fresh.join(', ');
}
