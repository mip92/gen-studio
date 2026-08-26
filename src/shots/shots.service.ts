import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { narrationUsFromText } from '../exports/shot-timing';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

interface ParticipantInput {
  label:        string;
  characterId?: string | null;
  profileId?:   string | null;
}

/** Full include shape used by mutations so the response matches `findById`. */
export const SHOT_FULL_INCLUDE = {
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
  // defaultVideoFlow is the bottom of the `shot → act → project` flow chain the
  // shot header resolves client-side (VideoFlowToggle, and the gating of the
  // «Посл. кадр» / «Видео» tabs). Omitting it from a MUTATION response made the
  // header fall back to i2v the moment you picked a render, greying out the tab
  // you were standing on — same class of bug as visualStyle above.
  project: { select: { id: true, slug: true, name: true, visualStyle: true, defaultVideoFlow: true } },
  // Used by the Telegram bot's approval flow and the videos tab — full list
  // of completed/in-flight VideoRender rows for this shot. No `orderBy as
  // const` because Prisma's input-types reject it under TypeScript strict.
  videoRenders: {
    select: {
      id: true, status: true, outputFilename: true,
      upscaleStatus: true, upscaledFilename: true,
    },
  },
  // Image-QC verdicts, one per candidate file — the ✓/⚠/✗ badges on the
  // render-picker cards (see ImageQcService).
  imageQcVerdicts: {
    select: {
      filename: true, status: true, issues: true, poseFlags: true,
      factFlags: true, factAnswers: true, peopleExpected: true,
      peopleFound: true, backgroundFaces: true, updatedAt: true,
    },
  },
};

@Injectable()
export class ShotsService {
  private readonly logger = new Logger(ShotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: QueueLedgerService,
  ) {}

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

  /**
   * Renders this shot has in flight, and how many candidate images they will
   * produce when they land.
   *
   * Exists because the render page used to hold "queued" in React state only:
   * navigate away and back and the page looked idle while a job was running, so
   * the user re-queued or assumed nothing had happened («после постановки в
   * очередь должны выделяться заглушки в галерее», 2026-08-16). Queue state has
   * to survive a page load, which means it has to come from the server.
   *
   * `expected` reads the job's own `params.batchSize` — the same number the UI
   * asked for — and falls back to 1 for a job queued without one.
   */
  private async pendingSceneRenders(shotId: string): Promise<{ jobs: number; expected: number }> {
    const jobs = await this.prisma.sceneRenderJob.findMany({
      where:  { shotId, status: { in: ['pending', 'running'] } },
      select: { params: true },
    });
    const expected = jobs.reduce((n, j) => {
      const b = (j.params as { batchSize?: unknown } | null)?.batchSize;
      return n + (typeof b === 'number' && b > 0 ? Math.floor(b) : 1);
    }, 0);
    return { jobs: jobs.length, expected };
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
        // Enough of each clip row for the shot header to answer «есть ли вообще
        // что смотреть» — it gates the «Видео» tab on a two-frame shot whose
        // last frame is not approved yet, and must not hide clips that already
        // exist. Same projection as SHOT_FULL_INCLUDE so both agree.
        videoRenders: {
          select: {
            id: true, status: true, outputFilename: true,
            upscaleStatus: true, upscaledFilename: true,
          },
        },
        // Image-QC verdicts per candidate file (badges on the render picker).
        imageQcVerdicts: {
          select: {
            filename: true, status: true, issues: true, poseFlags: true,
            factFlags: true, factAnswers: true, peopleExpected: true,
            peopleFound: true, backgroundFaces: true, updatedAt: true,
          },
        },
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return { ...shot, pendingRenders: await this.pendingSceneRenders(shotId) };
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

      await tx.shot.update({
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
      });
      // locationId via raw SQL — Prisma client may not have been regenerated
      // yet since the column was added mid-session.
      if ((dto as any).locationId !== undefined) {
        await tx.$queryRaw`UPDATE shots SET "locationId" = ${(dto as any).locationId} WHERE id = ${shotId}`;
      }
      // videoFlow — same raw-SQL reason as locationId.
      if ((dto as any).videoFlow !== undefined) {
        await tx.$queryRaw`UPDATE shots SET "videoFlow" = ${(dto as any).videoFlow} WHERE id = ${shotId}`;
      }
      // endFramePrompt. Rewriting the instruction invalidates the approval and
      // the pick: the frame on disk answers the OLD instruction, so keeping it
      // approved would animate towards an ending the shot no longer asks for.
      // Only fires on an actual change, so re-saving an unchanged shot from the
      // UI never silently drops an approval.
      if ((dto as any).endFramePrompt !== undefined) {
        const next = (dto as any).endFramePrompt;
        await tx.$queryRaw`
          UPDATE shots
             SET "endFramePrompt" = ${next},
                 "chosenEndFrame"     = CASE WHEN "endFramePrompt" IS DISTINCT FROM ${next}
                                             THEN NULL ELSE "chosenEndFrame" END,
                 "endFrameApprovedAt" = CASE WHEN "endFramePrompt" IS DISTINCT FROM ${next}
                                             THEN NULL ELSE "endFrameApprovedAt" END
           WHERE id = ${shotId}`;
      }
      // Read the row back INSIDE the transaction rather than returning the
      // result of `tx.shot.update()`. Everything below that call is written by
      // raw SQL (locationId, videoFlow, endFramePrompt) — the updated object
      // predates those writes, so the PATCH response used to answer with the
      // OLD videoFlow and the caller's optimistic `setShot(response)` snapped
      // the control straight back to the previous value. It also carried no
      // `project` and no participant `profile`, which silently degraded the
      // shot page's breadcrumb to «…» after any inline edit. Same include shape
      // as `findById` so one response type serves both.
      return tx.shot.findUniqueOrThrow({
        where:   { id: shotId },
        include: SHOT_FULL_INCLUDE,
      });
    });
  }

  async remove(projectIdOrSlug: string, shotId: string) {
    await this.findOne(projectIdOrSlug, shotId);
    await this.sealBeforeDelete(shotId);
    return this.prisma.shot.delete({ where: { id: shotId } });
  }

  async removeById(shotId: string) {
    await this.findById(shotId);
    await this.sealBeforeDelete(shotId);
    return this.prisma.shot.delete({ where: { id: shotId } });
  }

  /**
   * Prepare a shot for deletion: stop any work still running for it and turn its
   * open queue entries into permanent records.
   *
   * Both halves used to be missing. Deleting a shot mid-render left ComfyUI
   * burning GPU on a render whose row had already cascade-vanished, and the
   * cascade also erased every trace of the time the shot had consumed — the shot
   * disappeared from the statistics as if it had been free.
   */
  private async sealBeforeDelete(shotId: string): Promise<void> {
    await this.ledger.cancelAndSealUnder({ shotId }, `shot ${shotId} deleted`);
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

    // A verdict is 1:1 to the file's bytes — the file leaving the pool takes
    // its QC verdict with it (same invalidation rule as VO trim/revert).
    await (this.prisma as any).imageQcVerdict
      .deleteMany({ where: { shotId, filename } }).catch(() => {});

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
    // The end frame is an EDIT of the first frame, so a different first frame
    // makes the existing end frame the continuation of an image this shot no
    // longer ships. Both the pick and its approval go — the candidates stay on
    // disk, but nothing pins them to a clip until someone looks again.
    const endFrameReset = (shot as any).chosenEndFrame && filename !== shot.chosenRender
      ? { chosenEndFrame: null, endFrameApprovedAt: null }
      : {};
    return this.prisma.shot.update({
      where: { id: shotId },
      data:  { chosenRender: filename, ...endFrameReset } as any,
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
      const estUs = narrationUsFromText(s.narrationText);
      const sec = ms > 0
        ? ms / 1000
        : (estUs != null ? estUs / 1_000_000 : 6);
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
