import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Packaging for the MAIN (full) video. */
export interface YoutubeMain {
  title:       string;
  description: string;
  tags:        string[];
  /** Set by the uploader after a successful videos.insert. `url` points at the
   *  video on YouTube even while it's (forced-)private before the audit passes. */
  videoId?:    string;
  url?:        string;
}
/** Packaging for one short. Two descriptions: `descBefore` for while the main
 *  video isn't published yet (teaser, "полная версия скоро"), `descAfter` for
 *  after it's up — the UI substitutes the main-video link into `{{main_url}}`.
 *  `url` is the short's own published YouTube link (empty until posted). */
export interface YoutubeShort {
  title:      string;
  descBefore: string;
  descAfter:  string;
  tags:       string[];
  url:        string;
}
export interface YoutubePackage {
  youtubeUrl: string | null;
  main:       YoutubeMain;
  shorts:     Record<string, YoutubeShort>;
}

const EMPTY_MAIN:  YoutubeMain  = { title: '', description: '', tags: [] };
const emptyShort = (): YoutubeShort => ({ title: '', descBefore: '', descAfter: '', tags: [], url: '' });

/**
 * YouTube publishing metadata (title / description(s) / tags) for a project's
 * main video and its shorts. Stored in `Project.settings.youtube` — a plain
 * jsonb blob, so no schema migration is needed. The shots/shorts themselves and
 * the CapCut export live elsewhere (ExportsService); this owns only the text.
 */
@Injectable()
export class YoutubeService {
  constructor(private readonly prisma: PrismaService) {}

  private async findProject(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return project;
  }

  private readPackage(project: { settings: unknown; youtubeUrl: string | null }): YoutubePackage {
    const settings = (project.settings ?? {}) as { youtube?: Partial<YoutubePackage> };
    const yt = settings.youtube ?? {};
    return {
      youtubeUrl: project.youtubeUrl ?? null,
      main:       { ...EMPTY_MAIN, ...(yt.main ?? {}) },
      shorts:     (yt.shorts as Record<string, YoutubeShort>) ?? {},
    };
  }

  async get(idOrSlug: string): Promise<YoutubePackage> {
    return this.readPackage(await this.findProject(idOrSlug));
  }

  /**
   * Merge-update the packaging. `main` fields are shallow-merged; each entry in
   * `shorts` is shallow-merged into that short's existing record. Only the keys
   * present in the body change.
   */
  async patch(
    idOrSlug: string,
    body: { main?: Partial<YoutubeMain>; shorts?: Record<string, Partial<YoutubeShort>> },
  ): Promise<YoutubePackage> {
    const project  = await this.findProject(idOrSlug);
    const settings = (project.settings ?? {}) as Record<string, unknown> & {
      youtube?: { main?: YoutubeMain; shorts?: Record<string, YoutubeShort> };
    };
    const yt = settings.youtube ?? {};

    if (body.main) {
      yt.main = { ...EMPTY_MAIN, ...(yt.main ?? {}), ...body.main };
    }
    if (body.shorts) {
      yt.shorts = yt.shorts ?? {};
      for (const [slug, val] of Object.entries(body.shorts)) {
        yt.shorts[slug] = { ...emptyShort(), ...(yt.shorts[slug] ?? {}), ...val };
      }
    }
    settings.youtube = yt;

    await this.prisma.project.update({
      where: { id: project.id },
      data:  { settings: settings as object },
    });
    return this.readPackage({ settings, youtubeUrl: project.youtubeUrl });
  }
}
