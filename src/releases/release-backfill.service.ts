import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeAuthService } from '../youtube/youtube-auth.service';

/**
 * Reconciles `releaseAt` of PUBLISHED projects with the factual publish time
 * from the YouTube Data API. Not a one-off: every future release creates the
 * same drift (the planned slot vs the moment the video actually went live), so
 * this is a standing, idempotent "sync with YouTube" — triggered from the
 * /releases page, with a dryRun preview first.
 *
 * Reads are cheap: videos.list costs 1 quota unit per call of up to 50 ids and
 * does not touch the 6/day upload bottleneck.
 */

export interface BackfillReport {
  updated: { slug: string; videoId: string; publishedAt: string; previous: string | null; scheduled: boolean }[];
  skipped: { slug: string; reason: 'no_video_id' | 'not_found_on_yt' | 'already_exact' | 'not_public_no_schedule' }[];
  errors: string[];
  dryRun: boolean;
}

/** youtu.be/<id>, watch?v=<id>, /shorts/<id>, /live/<id> — everything the
 *  uploader or a hand-pasted URL can produce. */
export function extractVideoId(url: string): string | null {
  return (
    /youtu\.be\/([\w-]{6,})/.exec(url)?.[1] ??
    /[?&]v=([\w-]{6,})/.exec(url)?.[1] ??
    /\/(?:shorts|live)\/([\w-]{6,})/.exec(url)?.[1] ??
    null
  );
}

@Injectable()
export class ReleaseBackfillService {
  private readonly logger = new Logger(ReleaseBackfillService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeAuth: YoutubeAuthService,
  ) {}

  async backfillPublished(dryRun: boolean): Promise<BackfillReport> {
    const client = this.youtubeAuth.getClient();
    if (!client) throw new ConflictException('YouTube не подключён — сначала авторизуйся на /youtube');

    const candidates = (await this.prisma.project.findMany({
      where: { youtubeUrl: { not: null } },
      select: { id: true, slug: true, youtubeUrl: true, releaseAt: true } as any,
    })) as unknown as { id: string; slug: string; youtubeUrl: string; releaseAt: Date | null }[];

    const report: BackfillReport = { updated: [], skipped: [], errors: [], dryRun };
    const usable: { id: string; slug: string; videoId: string; releaseAt: Date | null }[] = [];
    for (const c of candidates) {
      const videoId = extractVideoId(c.youtubeUrl);
      if (!videoId) report.skipped.push({ slug: c.slug, reason: 'no_video_id' });
      else usable.push({ id: c.id, slug: c.slug, videoId, releaseAt: c.releaseAt });
    }

    const youtube = google.youtube({ version: 'v3', auth: client });
    for (let i = 0; i < usable.length; i += 50) {
      const batch = usable.slice(i, i + 50);
      let items;
      try {
        // `status` вместе со snippet: у ОТЛОЖЕННОЙ публикации (private +
        // status.publishAt) правильная дата календаря — будущий publishAt,
        // а не время загрузки из snippet.publishedAt.
        const res = await youtube.videos.list({ id: batch.map((b) => b.videoId), part: ['snippet', 'status'] });
        items = res.data.items ?? [];
      } catch (e) {
        report.errors.push(`videos.list: ${(e as Error).message}`);
        continue;
      }
      const byId = new Map(items.map((v) => [v.id!, v]));
      for (const row of batch) {
        const video = byId.get(row.videoId);
        if (!video) {
          report.skipped.push({ slug: row.slug, reason: 'not_found_on_yt' });
          continue;
        }
        const isPublic = video.status?.privacyStatus === 'public';
        const scheduledAt = video.status?.publishAt ?? null;
        const source = isPublic ? video.snippet?.publishedAt : scheduledAt;
        if (!source) {
          // Приватное/непубличное видео без расписания — даты публикации нет,
          // плановую дату в календаре не трогаем.
          report.skipped.push({ slug: row.slug, reason: 'not_public_no_schedule' });
          continue;
        }
        const target = new Date(source); // Data API returns UTC — stored verbatim
        if (row.releaseAt && Math.abs(row.releaseAt.getTime() - target.getTime()) < 1000) {
          report.skipped.push({ slug: row.slug, reason: 'already_exact' });
          continue;
        }
        if (!dryRun) {
          // Bypasses the PUBLISHED_LOCKED rule by design: the lock protects this
          // value from HAND edits; the backfill IS its owner.
          await this.prisma.project.update({ where: { id: row.id }, data: { releaseAt: target } as any });
        }
        report.updated.push({
          slug: row.slug,
          videoId: row.videoId,
          publishedAt: target.toISOString(),
          previous: row.releaseAt?.toISOString() ?? null,
          scheduled: !isPublic,
        });
      }
    }

    this.logger.log(`backfill${dryRun ? ' (dry-run)' : ''}: ${report.updated.length} updated, ${report.skipped.length} skipped, ${report.errors.length} errors`);
    return report;
  }
}
