import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBlockInput,
  UpdateBlockInput,
  CreateSegmentInput,
  UpdateSegmentInput,
  MusicMetas,
  DEFAULT_RENDER_PARAMS,
  TILE_SECONDS,
  SPARE_TRACK_COUNT,
  normaliseMusicMetas,
} from './bgm.types';
import { shotHoldUs, narrationUsFromTts, narrationUsFromText } from '../exports/shot-timing';

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

  /**
   * Validate ACE-Step metas at the API boundary and surface the failure as a
   * 400 instead of letting an invalid `keyscale` reach ComfyUI — there it is a
   * prompt-validation error that only shows up once the job reaches the head of
   * a single-slot queue, with a message nobody connects back to this edit.
   */
  private metas(input: MusicMetas): MusicMetas {
    try {
      return normaliseMusicMetas(input);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? String(e));
    }
  }

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

    const exportTiming  = project.exportTiming === 'narration' ? 'narration' : 'clip';
    const targetSeconds = await this.computeTargetSeconds(input.shotIds, exportTiming);
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
        ...this.metas(input),
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

    const data: Record<string, unknown> = { ...this.metas(body) };
    if (body.title      !== undefined) data.title      = body.title;
    if (body.sortOrder  !== undefined) data.sortOrder  = body.sortOrder;
    if (body.moodPrompt !== undefined) data.moodPrompt = body.moodPrompt;
    if (body.status     !== undefined) data.status     = body.status;
    if (body.shotIds    !== undefined) {
      if (!Array.isArray(body.shotIds) || body.shotIds.length === 0) {
        throw new BadRequestException(`Block must cover at least one shot`);
      }
      data.shotIds       = body.shotIds as any;
      const exportTiming = await this.resolveExportTiming(block.projectId);
      data.targetSeconds = await this.computeTargetSeconds(body.shotIds, exportTiming);
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
    const exportTiming  = await this.resolveExportTiming(block.projectId);
    const targetSeconds = await this.computeTargetSeconds(shotIds, exportTiming);
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
        ...this.metas(input),
      },
    });
  }

  /**
   * Partial update of one tile — the per-tile prompt override and its metas.
   * There was no such endpoint before, so the UI's segment "сохранить" button
   * could only raise an alert and a per-tile override could not be authored at
   * all (only inline per-render, which vanished with the take).
   *
   * A prompt or meta change makes every already-rendered take under this segment
   * stale; per `feedback-rework-invalidate-stale-renders` the caller should
   * delete those takes. This method does NOT delete them silently — dropping a
   * user-approved flac as a side effect of a text edit is not ours to decide —
   * but it does clear the approval when the prompt changed, so a stale take
   * cannot keep flowing into a CapCut export unnoticed.
   */
  async updateSegment(segmentId: string, body: UpdateSegmentInput) {
    const seg = await this.prisma.musicSegment.findUnique({ where: { id: segmentId } });
    if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`);

    const data: Record<string, unknown> = { ...this.metas(body) };
    if (body.prompt    !== undefined) data.prompt    = body.prompt;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.spare     !== undefined) data.spare     = body.spare;
    if (body.durationSec !== undefined) {
      if (body.durationSec < 10 || body.durationSec > 240) {
        throw new BadRequestException(`durationSec must be in [10, 240] (got: ${body.durationSec})`);
      }
      data.durationSec = body.durationSec;
    }

    const promptChanged = body.prompt !== undefined && (body.prompt ?? null) !== seg.prompt;
    if (promptChanged && seg.approvedJobId) data.approvedJobId = null;

    return this.prisma.musicSegment.update({ where: { id: segmentId }, data });
  }

  async deleteSegment(segmentId: string) {
    const seg = await this.prisma.musicSegment.findUnique({ where: { id: segmentId } });
    if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`);
    await this.prisma.musicSegment.delete({ where: { id: segmentId } });
    return { deleted: true, id: segmentId };
  }

  /**
   * Move one tile up or down within its act. The order being edited is the
   * exporter's placement order — main tiles by sortOrder, then spare tiles by
   * sortOrder (exports.service.ts lays exactly this combined list on the a/b
   * checkerboard). The spare flag belongs to the POSITION, not the tile: a
   * spare moved into the mains zone becomes a main tile and the tile it
   * displaces becomes a spare, so the act's coverage tile count never changes.
   * Takes and approvals travel with the tile — that is the point: when a spare
   * take sounds better than a main one, promote it instead of re-rendering.
   */
  async moveSegment(segmentId: string, direction: 'up' | 'down') {
    if (direction !== 'up' && direction !== 'down') {
      throw new BadRequestException(`direction must be 'up' or 'down' (got: ${String(direction)})`);
    }
    const seg = await this.prisma.musicSegment.findUnique({ where: { id: segmentId } });
    if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`);

    const siblings = await this.prisma.musicSegment.findMany({
      where:   { blockId: seg.blockId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const ordered = [...siblings.filter((s) => !s.spare), ...siblings.filter((s) => s.spare)];
    const from = ordered.findIndex((s) => s.id === segmentId);
    const to   = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= ordered.length) {
      throw new BadRequestException(`Segment is already ${direction === 'up' ? 'first' : 'last'} in its act`);
    }
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

    // Rewrite the whole block in one transaction: sortOrder = combined index,
    // spare = zone. This also normalises legacy blocks whose sortOrders
    // interleave mains and spares — the combined order IS what exports play.
    const mainsCount = siblings.filter((s) => !s.spare).length;
    await this.prisma.$transaction(
      ordered.map((s, i) => this.prisma.musicSegment.update({
        where: { id: s.id },
        data:  { sortOrder: i, spare: i >= mainsCount },
      })),
    );
    return this.getBlock(seg.blockId);
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
   * Auto-fill a block with fixed-length MusicSegment tiles. The act length is
   * (re)computed from voiceover — the same math the CapCut exporter uses — and
   * tiled into `ceil(actLength / TILE_SECONDS)` main tiles of TILE_SECONDS each,
   * plus SPARE_TRACK_COUNT spare tiles on the same act mood prompt. The export
   * lays the main tiles checkerboard on two lanes (overlapping for a crossfade)
   * and drops the spares raw on their own lanes for manual editing. Does NOT
   * queue any AudioRenderJob — that happens via BgmRenderService.start().
   *
   * Idempotent top-up: it only creates the tiles still missing, so re-running
   * after some tiles already exist won't duplicate them. Refuses to run on a
   * block with status='manual' (the user took over segment layout).
   */
  async fillBlock(
    blockId: string,
    _opts: { chunkSeconds?: number } = {},
  ): Promise<{ created: number; existing: number; targetSeconds: number; mainTiles: number; spareTiles: number }> {
    const block = await this.prisma.narrativeBlock.findUnique({
      where:   { id: blockId },
      include: { segments: true },
    });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    if (block.status === 'manual') {
      throw new BadRequestException(`Block ${blockId} is in manual mode — fill disabled`);
    }
    // Always recompute from VO so the tile count tracks the real act length,
    // then persist it so the UI shows a fresh target.
    const exportTiming = await this.resolveExportTiming(block.projectId);
    const target = await this.computeTargetSeconds((block.shotIds as string[]) ?? [], exportTiming);
    await this.prisma.narrativeBlock.update({ where: { id: blockId }, data: { targetSeconds: target } });

    // ceil(actLength / 150), at least one main tile even for a tiny act.
    const wantMain  = Math.max(1, Math.ceil(target / TILE_SECONDS));
    const wantSpare = SPARE_TRACK_COUNT;
    const haveMain  = block.segments.filter((s) => !s.spare).length;
    const haveSpare = block.segments.filter((s) =>  s.spare).length;

    let nextOrder = await this.nextSegmentSortOrder(blockId);
    let created = 0;
    const makeTile = async (spare: boolean) => {
      await this.prisma.musicSegment.create({
        data: { blockId, durationSec: TILE_SECONDS, sortOrder: nextOrder, prompt: null, spare },
      });
      nextOrder++;
      created++;
    };
    for (let i = haveMain;  i < wantMain;  i++) await makeTile(false);
    for (let i = haveSpare; i < wantSpare; i++) await makeTile(true);

    await this.prisma.narrativeBlock.update({
      where: { id: blockId },
      data:  { status: 'filled' },
    });
    return {
      created,
      existing:      block.segments.length,
      targetSeconds: target,
      mainTiles:     Math.max(haveMain, wantMain),
      spareTiles:    Math.max(haveSpare, wantSpare),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Resolve a project's export-timing mode ('narration' | 'clip'). */
  private async resolveExportTiming(projectId: string): Promise<'narration' | 'clip'> {
    const project = await this.prisma.project.findUnique({
      where:  { id: projectId },
      select: { exportTiming: true },
    });
    return project?.exportTiming === 'narration' ? 'narration' : 'clip';
  }

  /**
   * Act length in seconds, summed from each shot's timeline hold via the shared
   * {@link shotHoldUs} — the EXACT math the CapCut exporter uses (VO length +
   * 0.5 s tail, floored, animated clips stretched to fit a longer VO). So the
   * music we tile out equals the real act length on the timeline. Shots not
   * found fall back to {@link DEFAULT_SHOT_SECONDS}.
   */
  private async computeTargetSeconds(
    shotIds: string[],
    exportTiming: 'narration' | 'clip',
  ): Promise<number> {
    if (shotIds.length === 0) return 0;
    const shots = await this.prisma.shot.findMany({
      where:   { id: { in: shotIds } },
      include: { videoRenders: true, ttsJobs: true },
    });
    let totalUs = 0;
    for (const id of shotIds) {
      const shot = shots.find((s) => s.id === id);
      if (!shot) { totalUs += DEFAULT_SHOT_SECONDS * 1_000_000; continue; }

      // Approved take first — that is the real, probed length. Failing that,
      // estimate from the written narration instead of letting the shot fall
      // back to the flat no-VO default: an act whose VO isn't rendered yet would
      // otherwise measure ~4 s per shot and get tiled far too short. The target
      // is recomputed on every fill/recompute, so it sharpens into the exact
      // number as the real takes land.
      const narrationUs =
        narrationUsFromTts(
          (shot as { approvedTTSJobId?: string | null }).approvedTTSJobId ?? null,
          (shot as { ttsJobs?: Array<{ id: string; durationMs: number | null; text: string }> }).ttsJobs ?? [],
        )
        ?? narrationUsFromText((shot as { narrationText?: string | null }).narrationText ?? null);

      // Resolve render mode + native animated-clip length, mirroring the export.
      let kind: 'image' | undefined;
      let sourceUs: number | undefined;
      if ((shot as { renderMode?: string }).renderMode === 'static') {
        kind = 'image';
      } else {
        const chosen = shot.chosenVideoId
          ? shot.videoRenders.find((v) => v.id === shot.chosenVideoId)
          : null;
        const params = (chosen?.params ?? null) as null | { length?: number; fps?: number };
        if (typeof params?.length === 'number' && typeof params?.fps === 'number' && params.fps > 0) {
          sourceUs = Math.round((params.length / params.fps) * 1_000_000);
        }
      }

      totalUs += shotHoldUs({ kind, sourceUs, narrationUs, exportTiming });
    }
    return Math.round(totalUs / 1_000_000);
  }

  private async nextSegmentSortOrder(blockId: string): Promise<number> {
    const last = await this.prisma.musicSegment.findFirst({
      where:   { blockId },
      orderBy: { sortOrder: 'desc' },
    });
    return (last?.sortOrder ?? -1) + 1;
  }
}
