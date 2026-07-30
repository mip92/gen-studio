import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import * as path from 'path';
import { ThumbnailIdea, ThumbnailRenderService } from './thumbnail-render.service';

/**
 * The thumbnail workshop's HTTP surface.
 *
 * Deliberately additive: POST /ideas can be called over and over to top up the
 * candidate pool, and choosing a winner is a separate, GPU-free call that can be
 * redone as often as the operator wants to reword the hook.
 */
@Controller('projects/:idOrSlug/thumbnail')
export class ThumbnailsController {
  constructor(private readonly thumbnails: ThumbnailRenderService) {}

  /** Everything rendered for this project so far, newest concept first. */
  @Get()
  list(@Param('idOrSlug') idOrSlug: string) {
    return this.thumbnails.list(idOrSlug);
  }

  /**
   * Ask the LOCAL MODEL for cover concepts from the screenplay. Returns them for
   * review WITHOUT queueing — the operator throws away the weak ones first.
   */
  @Post('propose')
  propose(@Param('idOrSlug') idOrSlug: string, @Body() body?: { count?: number }) {
    return this.thumbnails.enqueueIdeaJob(idOrSlug, Math.min(12, Math.max(1, body?.count ?? 6)));
  }

  /** Proposal rounds and their concepts, newest first. */
  @Get('proposals')
  proposals(@Param('idOrSlug') idOrSlug: string) {
    return this.thumbnails.listIdeaJobs(idOrSlug);
  }

  /** Queue a batch of concepts. Call again later to add more. */
  @Post('ideas')
  enqueue(@Param('idOrSlug') idOrSlug: string, @Body() body: { ideas: ThumbnailIdea[] }) {
    return this.thumbnails.enqueueIdeas(idOrSlug, body?.ideas ?? []);
  }

  /** Promote one candidate to the cover and draw the caption on it. */
  @Post('choose')
  choose(@Body() body: { jobId: string; filename: string; captionSpec?: unknown }) {
    return this.thumbnails.choose(body.jobId, body.filename, body.captionSpec);
  }

  /** Drop one proposed concept. Rounds only ever grow otherwise. */
  @Delete('proposals/:jobId/ideas/:index')
  deleteProposedIdea(@Param('jobId') jobId: string, @Param('index') index: string) {
    return this.thumbnails.deleteProposedIdea(jobId, Number(index));
  }

  /** Render more frames for an existing idea, keeping the ones already there. */
  @Post('jobs/:jobId/more')
  addMore(@Param('jobId') jobId: string, @Body() body?: { count?: number }) {
    return this.thumbnails.addMore(jobId, Math.min(8, Math.max(1, body?.count ?? 5)));
  }

  /** Stop an idea that is still queued or rendering. Keeps the row. */
  @Post('jobs/:jobId/cancel')
  cancel(@Param('jobId') jobId: string) {
    return this.thumbnails.cancel(jobId);
  }

  /** Throw the idea away entirely — the prompt and all its frames. */
  @Delete('jobs/:jobId')
  deleteJob(@Param('jobId') jobId: string) {
    return this.thumbnails.deleteJob(jobId);
  }

  /** Throw away a single frame. */
  @Delete('jobs/:jobId/candidates/:filename')
  deleteCandidate(@Param('jobId') jobId: string, @Param('filename') filename: string) {
    return this.thumbnails.deleteCandidate(jobId, filename);
  }

  /** Stream one candidate for the picker's <img src>. */
  @Get('jobs/:jobId/candidates/:filename/raw')
  async candidateRaw(
    @Param('jobId')    jobId:    string,
    @Param('filename') filename: string,
    @Res()             res:      Response,
  ) {
    this.stream(await this.thumbnails.candidatePath(jobId, filename), res);
  }

  /** Stream the finished cover. Not cached — the caption is redrawn in place. */
  @Get('cover/raw')
  async coverRaw(@Param('idOrSlug') idOrSlug: string, @Res() res: Response) {
    const p = await this.thumbnails.coverPath(idOrSlug);
    res.setHeader('Cache-Control', 'no-store');
    this.stream(p, res, false);
  }

  private stream(p: string, res: Response, cache = true): void {
    res.setHeader('Content-Type', path.extname(p).toLowerCase() === '.jpg' ? 'image/jpeg' : 'image/png');
    res.setHeader('Content-Length', statSync(p).size);
    // Candidates are immutable once rendered; the cover is not (recaptioning
    // rewrites the same path), so only candidates get a client cache.
    if (cache) res.setHeader('Cache-Control', 'private, max-age=300');
    createReadStream(p).pipe(res);
  }
}
