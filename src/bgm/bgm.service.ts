import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBlockInput,
  UpdateBlockInput,
  CreateSegmentInput,
  DEFAULT_RENDER_PARAMS,
} from './bgm.types';

/**
 * Default-fallback duration per shot when its chosen video isn't available yet
 * (or never rendered). Matches the Wan2.2 i2v default: 81 frames @ 16 fps.
 */
const DEFAULT_SHOT_SECONDS = 5;

/**
 * NarrativeBlock + MusicSegment CRUD + the fill-block action. Render jobs and
 * ComfyUI dispatch live in {@link BgmRenderService} so this file stays focused
 * on data shape and lifecycle.
 */
@Injectable()
export class BgmService {
  private readonly logger = new Logger(BgmService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Blocks ────────────────────────────────────────────────────────────────

  async createBlock(input: CreateBlockInput) {
    if (!input.slug || !/^[a-z][a-z0-9_-]*$/.test(input.slug)) {
      throw new BadRequestException(
        `Block slug must be lowercase ASCII (got: ${JSON.stringify(input.slug)})`,
      );
    }
    if (!Array.isArray(input.shotIds) || input.shotIds.length === 0) {
      throw new BadRequestException(`Block must cover at least one shot`);
    }
    const project = await this.prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) throw new NotFoundException(`Project ${input.projectId} not found`);

    const targetSeconds = await this.computeTargetSeconds(input.shotIds);
    return this.prisma.narrativeBlock.create({
      data: {
        projectId:  input.projectId,
        slug:       input.slug,
        title:      input.title ?? null,
        sortOrder:  input.sortOrder ?? 0,
        moodPrompt: input.moodPrompt ?? null,
        shotIds:    input.shotIds as any,
        targetSeconds,
        status:     'filling',
      },
    });
  }

  listBlocks(projectId: string) {
    return this.prisma.narrativeBlock.findMany({
      where:   { projectId },
      orderBy: { sortOrder: 'asc' },
      include: { segments: { orderBy: { sortOrder: 'asc' }, include: { jobs: { orderBy: { queuedAt: 'desc' } } } } },
    });
  }

  /** Single segment with its jobs (newest first) + parent block + project slug.
   *  Used by the bot's segment-view to refresh approval state after a tap and
   *  to resolve the on-disk flac path (which lives under <slug>/bgm/<blockSlug>/). */
  async getSegment(segmentId: string) {
    const segment = await this.prisma.musicSegment.findUnique({
      where: { id: segmentId },
      include: {
        block: {
          select: {
            id: true, slug: true, title: true, projectId: true,
            project: { select: { slug: true } },
          },
        },
        jobs: { orderBy: { queuedAt: 'desc' } },
      },
    });
    if (!segment) throw new NotFoundException(`Segment ${segmentId} not found`);
    return segment;
  }

  async getBlock(blockId: string) {
    const block = await this.prisma.narrativeBlock.findUnique({
      where:   { id: blockId },
      include: { segments: { orderBy: { sortOrder: 'asc' }, include: { jobs: { orderBy: { queuedAt: 'desc' } } } } },
    });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    return block;
  }

  async updateBlock(blockId: string, body: UpdateBlockInput) {
    const block = await this.prisma.narrativeBlock.findUnique({ where: { id: blockId } });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);

    const data: Record<string, unknown> = {};
    if (body.title      !== undefined) data.title      = body.title;
    if (body.sortOrder  !== undefined) data.sortOrder  = body.sortOrder;
    if (body.moodPrompt !== undefined) data.moodPrompt = body.moodPrompt;
    if (body.status     !== undefined) data.status     = body.status;
    if (body.shotIds    !== undefined) {
      if (!Array.isArray(body.shotIds) || body.shotIds.length === 0) {
        throw new BadRequestException(`Block must cover at least one shot`);
      }
      data.shotIds       = body.shotIds as any;
      data.targetSeconds = await this.computeTargetSeconds(body.shotIds);
    }
    return this.prisma.narrativeBlock.update({ where: { id: blockId }, data });
  }

  async deleteBlock(blockId: string) {
    const block = await this.prisma.narrativeBlock.findUnique({ where: { id: blockId } });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    await this.prisma.narrativeBlock.delete({ where: { id: blockId } });
    return { deleted: true, id: blockId };
  }

  /**
   * Recompute targetSeconds for a block by re-reading shot durations from each
   * shot's chosen VideoRender (length / fps). Called explicitly from the UI
   * after video re-renders change shot lengths; not automatic because shots
   * change duration rarely and this is the cheapest way to keep targets fresh.
   */
  async recomputeTarget(blockId: string) {
    const block = await this.prisma.narrativeBlock.findUnique({ where: { id: blockId } });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    const shotIds = (block.shotIds as string[]) ?? [];
    const targetSeconds = await this.computeTargetSeconds(shotIds);
    return this.prisma.narrativeBlock.update({
      where: { id: blockId },
      data:  { targetSeconds },
    });
  }

  // ── Segments ──────────────────────────────────────────────────────────────

  async createSegment(input: CreateSegmentInput) {
    const block = await this.prisma.narrativeBlock.findUnique({ where: { id: input.blockId } });
    if (!block) throw new NotFoundException(`Block ${input.blockId} not found`);

    const durationSec = input.durationSec ?? DEFAULT_RENDER_PARAMS.durationSec;
    if (durationSec < 10 || durationSec > 240) {
      throw new BadRequestException(`durationSec must be in [10, 240] (got: ${durationSec})`);
    }
    const sortOrder = input.sortOrder ?? await this.nextSegmentSortOrder(input.blockId);
    return this.prisma.musicSegment.create({
      data: {
        blockId:     input.blockId,
        prompt:      input.prompt ?? null,
        durationSec,
        sortOrder,
      },
    });
  }

  async deleteSegment(segmentId: string) {
    const seg = await this.prisma.musicSegment.findUnique({ where: { id: segmentId } });
    if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`);
    await this.prisma.musicSegment.delete({ where: { id: segmentId } });
    return { deleted: true, id: segmentId };
  }

  /**
   * Approve an AudioRenderJob as the canonical take for its segment. Mirrors
   * the TTSJob.approve / VideoRender.chosenVideoId convention: plain id (no FK),
   * only `completed` jobs eligible, null clears.
   */
  async approveJob(jobId: string | null, segmentId: string) {
    if (jobId === null) {
      return this.prisma.musicSegment.update({
        where: { id: segmentId },
        data:  { approvedJobId: null },
      });
    }
    const job = await this.prisma.audioRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`AudioRenderJob ${jobId} not found`);
    if (job.segmentId !== segmentId) {
      throw new BadRequestException(`AudioRenderJob ${jobId} belongs to a different segment`);
    }
    if (job.status !== 'completed') {
      throw new BadRequestException(`Only completed jobs can be approved (got: ${job.status})`);
    }
    return this.prisma.musicSegment.update({
      where: { id: segmentId },
      data:  { approvedJobId: jobId },
    });
  }

  // ── Fill action ───────────────────────────────────────────────────────────

  /**
   * Auto-fill a block with empty MusicSegment rows until their summed
   * durationSec meets the block's targetSeconds. Does NOT queue any
   * AudioRenderJob — that happens via BgmRenderService.start() per segment.
   * Returns the freshly-created segments (sorted by sortOrder).
   *
   * The default segment length is the block's chunkSeconds (typical 60s).
   * The last segment is shrunk to exactly cover the remainder so the chapter
   * doesn't overflow into the next block.
   *
   * Refuses to run on a block with status='manual' — that mode means the user
   * has taken over segment layout and we don't second-guess them.
   */
  async fillBlock(
    blockId: string,
    opts: { chunkSeconds?: number } = {},
  ): Promise<{ created: number; existing: number; targetSeconds: number; coveredSeconds: number }> {
    const block = await this.prisma.narrativeBlock.findUnique({
      where:   { id: blockId },
      include: { segments: true },
    });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    if (block.status === 'manual') {
      throw new BadRequestException(`Block ${blockId} is in manual mode — fill disabled`);
    }
    const target = block.targetSeconds ?? await this.computeTargetSeconds((block.shotIds as string[]) ?? []);
    const chunk  = opts.chunkSeconds ?? 60;
    if (chunk < 10 || chunk > 240) {
      throw new BadRequestException(`chunkSeconds must be in [10, 240] (got: ${chunk})`);
    }

    let covered = block.segments.reduce((sum, s) => sum + s.durationSec, 0);
    let nextOrder = await this.nextSegmentSortOrder(blockId);
    let created = 0;

    while (covered < target) {
      const remaining = target - covered;
      const seg = Math.min(chunk, Math.max(10, remaining));
      await this.prisma.musicSegment.create({
        data: { blockId, durationSec: seg, sortOrder: nextOrder, prompt: null },
      });
      covered  += seg;
      nextOrder++;
      created++;
      // Safety stop: never make more than 24 segments in one call. Hitting this
      // means targetSeconds is wildly larger than chunk — caller should adjust.
      if (created >= 24) break;
    }

    if (covered >= target) {
      await this.prisma.narrativeBlock.update({
        where: { id: blockId },
        data:  { status: 'filled' },
      });
    }
    return { created, existing: block.segments.length, targetSeconds: target, coveredSeconds: covered };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Sum chosen-video durations for the given shotIds (length / fps), falling
   * back to {@link DEFAULT_SHOT_SECONDS} for shots without a chosen video. The
   * result becomes the block's targetSeconds.
   */
  private async computeTargetSeconds(shotIds: string[]): Promise<number> {
    if (shotIds.length === 0) return 0;
    const shots = await this.prisma.shot.findMany({
      where:   { id: { in: shotIds } },
      include: { videoRenders: true },
    });
    let total = 0;
    for (const id of shotIds) {
      const shot = shots.find((s) => s.id === id);
      if (!shot) { total += DEFAULT_SHOT_SECONDS; continue; }
      const chosen = shot.chosenVideoId
        ? shot.videoRenders.find((v) => v.id === shot.chosenVideoId)
        : null;
      const params = (chosen?.params ?? null) as null | { length?: number; fps?: number };
      const length = params?.length;
      const fps    = params?.fps;
      if (typeof length === 'number' && typeof fps === 'number' && fps > 0) {
        total += Math.round(length / fps);
      } else {
        total += DEFAULT_SHOT_SECONDS;
      }
    }
    return total;
  }

  private async nextSegmentSortOrder(blockId: string): Promise<number> {
    const last = await this.prisma.musicSegment.findFirst({
      where:   { blockId },
      orderBy: { sortOrder: 'desc' },
    });
    return (last?.sortOrder ?? -1) + 1;
  }
}
