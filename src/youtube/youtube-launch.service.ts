import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeCaptionsService } from './youtube-captions.service';
import { YoutubeUploadService } from './youtube-upload.service';

const LANG = 'ru';

/** One video in a launch bundle (the main film or one short). */
export interface LaunchItem {
  key:          string;               // 'main' or the short slug
  kind:         'main' | 'short';
  slug?:        string;               // short slug (kind='short')
  videoPath:    string;
  thumbPath:    string;
  videoId?:     string;               // set after upload
  uploadJobId?: string;               // background upload job (in-memory, lost on restart)
  uploadError?: string | null;        // persisted last upload error (survives restart)
}

interface LaunchState {
  items:           LaunchItem[];
  linkedConfirmed: boolean;
  /** Set once the bundle has been scheduled/published — locks the publish action. */
  published?:      boolean;
  publishMode?:    'scheduled' | 'public';
  mainPublishAt?:  string | null;
  shortsPublishAt?: string | null;
}

export interface LaunchItemView extends LaunchItem {
  transcribeStatus: string | null;    // pending|running|completed|failed|null
  uploaded:         boolean;
  uploadError:      string | null;
}

export interface LaunchView {
  items:           LaunchItemView[];
  linkedConfirmed: boolean;
  allTranscribed:  boolean;
  allUploaded:     boolean;
  /** True when the bundle contains shorts — the linking step only applies then. */
  hasShorts:       boolean;
  /** 1 files · 2 subtitles · 3 upload · 4 link (shorts only) · 5 schedule */
  step:            number;
  /** True once schedule/publishNow ran — the publish action is spent (locks buttons). */
  published:       boolean;
  publishMode:     'scheduled' | 'public' | null;
  mainPublishAt:   string | null;
  shortsPublishAt: string | null;
}

/**
 * Orchestrates the «Связка-запуск» stepper: main + all shorts of a project go out
 * together, cross-linked. Flow (each step gates the next):
 *   1. files      — operator picks mp4 + thumbnail for main and every short
 *   2. subtitles  — transcribe every LOCAL mp4 (whisper) → .srt (gate: all done)
 *   3. upload     — upload all as UNLISTED, attaching the pre-made .srt
 *   4. link       — operator links shorts→main in Studio (manual; API can't) and
 *                   confirms (server verifies uploads+subs, NOT the links)
 *   5. schedule   — videos.update all: main next Tue/Thu 16:00, shorts same day 16:05
 * State lives in Project.settings.youtube.launch (survives reloads/restarts).
 */
@Injectable()
export class YoutubeLaunchService {
  private readonly logger = new Logger(YoutubeLaunchService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly captions: YoutubeCaptionsService,
    private readonly upload:   YoutubeUploadService,
  ) {}

  // ── state persistence (settings.youtube.launch jsonb) ────────────────────────
  private async project(idOrSlug: string) {
    const p = await this.prisma.project.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
    if (!p) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return p;
  }
  private readState(project: { settings: unknown }): LaunchState {
    const yt = ((project.settings ?? {}) as any).youtube ?? {};
    const l  = yt.launch ?? {};
    return {
      items:           l.items ?? [],
      linkedConfirmed: Boolean(l.linkedConfirmed),
      published:       Boolean(l.published),
      publishMode:     l.publishMode,
      mainPublishAt:   l.mainPublishAt ?? null,
      shortsPublishAt: l.shortsPublishAt ?? null,
    };
  }
  private async writeState(projectId: string, state: LaunchState): Promise<void> {
    const p = await this.prisma.project.findUnique({ where: { id: projectId } });
    const settings = ((p?.settings ?? {}) as Record<string, any>);
    settings.youtube = settings.youtube ?? {};
    settings.youtube.launch = state;
    await this.prisma.project.update({ where: { id: projectId }, data: { settings } });
  }

  // ── read (assembles per-item status, reconciles upload jobs → videoId) ───────
  async get(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    let dirty = false;

    const items: LaunchItemView[] = [];
    for (const it of state.items) {
      // reconcile the (in-memory) upload job into persisted state
      let uploadError: string | null = it.uploadError ?? null;
      if (!it.videoId && it.uploadJobId) {
        const job = this.upload.getJob(it.uploadJobId);
        if (job?.status === 'done' && job.result?.videoId) {
          it.videoId = job.result.videoId; it.uploadJobId = undefined; it.uploadError = undefined; uploadError = null; dirty = true;
        } else if (job?.status === 'error') {
          it.uploadError = job.error ?? 'upload failed'; it.uploadJobId = undefined; uploadError = it.uploadError; dirty = true;
        } else if (!job) {
          // job vanished (backend restarted mid-upload) → let the user retry
          it.uploadJobId = undefined; dirty = true;
        }
        // else: still running → keep uploadJobId, uploadError stays null
      }
      const cap = await this.captions.latestForVideoPath(it.videoPath);
      items.push({ ...it, transcribeStatus: cap?.status ?? null, uploaded: Boolean(it.videoId), uploadError });
    }
    if (dirty) await this.writeState(project.id, state);

    const hasShorts      = items.some((i) => i.kind === 'short');
    const allTranscribed = items.length > 0 && items.every((i) => i.transcribeStatus === 'completed');
    const allUploaded    = items.length > 0 && items.every((i) => i.uploaded);
    let step = 1;
    if (items.length > 0)  step = 2;
    if (allTranscribed)    step = 3;
    if (allUploaded)       step = hasShorts ? 4 : 5;               // no shorts → skip linking
    if (allUploaded && (!hasShorts || state.linkedConfirmed)) step = 5;
    return {
      items, linkedConfirmed: state.linkedConfirmed, allTranscribed, allUploaded, hasShorts, step,
      published:       Boolean(state.published),
      publishMode:     state.publishMode ?? null,
      mainPublishAt:   state.mainPublishAt ?? null,
      shortsPublishAt: state.shortsPublishAt ?? null,
    };
  }

  // ── step 2: save the prepared files + kick off transcription of every mp4 ────
  async prepare(idOrSlug: string, items: Array<Pick<LaunchItem, 'key' | 'kind' | 'slug' | 'videoPath' | 'thumbPath'>>): Promise<LaunchView> {
    if (!items?.length) throw new BadRequestException('No items to launch');
    for (const it of items) {
      if (!it.videoPath?.trim() || !existsSync(it.videoPath)) throw new BadRequestException(`Video not found: ${it.videoPath}`);
      if (it.kind === 'main') {   // thumbnail required for the main video only
        if (!it.thumbPath?.trim() || !existsSync(it.thumbPath)) throw new BadRequestException(`Обложка основного видео обязательна: ${it.thumbPath}`);
      } else if (it.thumbPath?.trim() && !existsSync(it.thumbPath)) {
        throw new BadRequestException(`Thumbnail not found for ${it.key}: ${it.thumbPath}`);
      }
    }
    const project = await this.project(idOrSlug);
    const state: LaunchState = {
      items: items.map((it) => ({ key: it.key, kind: it.kind, slug: it.slug, videoPath: it.videoPath.trim(), thumbPath: it.thumbPath.trim() })),
      linkedConfirmed: false,
    };
    await this.writeState(project.id, state);
    // transcribe every mp4 (whisper queue), unless a completed SRT job already exists
    for (const it of state.items) {
      const existing = await this.captions.latestForVideoPath(it.videoPath);
      if (existing?.status === 'completed') continue;
      await this.captions.enqueueTranscribe(idOrSlug, it.videoPath, LANG);
    }
    return this.get(idOrSlug);
  }

  // ── per-asset prep (each main/short goes through its own stepper page) ───────
  /** Add or replace ONE item (main or a short) in the bundle and transcribe its
   *  mp4. Re-preparing an item resets its upload so it can be re-done. */
  async prepareItem(idOrSlug: string, item: Pick<LaunchItem, 'key' | 'kind' | 'slug' | 'videoPath' | 'thumbPath'>): Promise<LaunchView> {
    const videoPath = item.videoPath?.trim();
    const thumbPath = item.thumbPath?.trim();
    if (!videoPath || !existsSync(videoPath)) throw new BadRequestException(`Video not found: ${item.videoPath}`);
    if (item.kind === 'main') {
      if (!thumbPath || !existsSync(thumbPath)) throw new BadRequestException(`Обложка основного видео обязательна: ${item.thumbPath}`);
    } else if (thumbPath && !existsSync(thumbPath)) {
      throw new BadRequestException(`Thumbnail not found: ${item.thumbPath}`);
    }
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const existing = state.items.find((i) => i.key === item.key);
    if (existing) {
      existing.videoPath = videoPath; existing.thumbPath = thumbPath ?? '';
      existing.videoId = undefined; existing.uploadJobId = undefined; existing.uploadError = undefined;
    } else {
      state.items.push({ key: item.key, kind: item.kind, slug: item.slug, videoPath, thumbPath: thumbPath ?? '' });
    }
    await this.writeState(project.id, state);
    const cap = await this.captions.latestForVideoPath(videoPath);
    if (cap?.status !== 'completed') await this.captions.enqueueTranscribe(idOrSlug, videoPath, LANG);
    return this.get(idOrSlug);
  }

  /** Upload ONE item as Unlisted (gated on its subtitles being ready). */
  async uploadItem(idOrSlug: string, key: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const it = state.items.find((i) => i.key === key);
    if (!it) throw new NotFoundException(`Launch item "${key}" not found`);
    const cap = await this.captions.latestForVideoPath(it.videoPath);
    if (cap?.status !== 'completed') throw new BadRequestException('Субтитры ещё не готовы');
    if (!it.videoId && !it.uploadJobId) {
      const { jobId } = this.upload.beginUpload(idOrSlug, it.kind, it.slug, {
        videoPath: it.videoPath, thumbnailPath: it.thumbPath, privacyStatus: 'unlisted',
      });
      it.uploadJobId = jobId; it.uploadError = undefined;
      await this.writeState(project.id, state);
    }
    return this.get(idOrSlug);
  }

  /** Remove ONE item from the bundle. */
  async removeItem(idOrSlug: string, key: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    state.items = state.items.filter((i) => i.key !== key);
    if (!state.items.some((i) => i.kind === 'short')) state.linkedConfirmed = false;
    await this.writeState(project.id, state);
    return this.get(idOrSlug);
  }

  // ── step 3: upload every item as UNLISTED (attaching its pre-made SRT) ────────
  async startUpload(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    if (!state.items.length) throw new BadRequestException('Nothing prepared');
    const view = await this.get(idOrSlug);
    if (!view.allTranscribed) throw new BadRequestException('Субтитры ещё не готовы на всех файлах');

    for (const it of state.items) {
      if (it.videoId || it.uploadJobId) continue;   // already uploading / done
      const { jobId } = this.upload.beginUpload(idOrSlug, it.kind, it.slug, {
        videoPath: it.videoPath, thumbnailPath: it.thumbPath, privacyStatus: 'unlisted',
      });
      it.uploadJobId = jobId; it.uploadError = undefined;
    }
    await this.writeState(project.id, state);
    return this.get(idOrSlug);
  }

  // ── step 4: operator confirms the manual Studio linking is done ──────────────
  async confirmLinked(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const view = await this.get(idOrSlug);
    if (!view.allUploaded)    throw new BadRequestException('Не все видео залиты');
    if (!view.allTranscribed) throw new BadRequestException('Субтитры не готовы');
    const state = this.readState(project);
    state.linkedConfirmed = true;
    await this.writeState(project.id, state);
    return this.get(idOrSlug);
  }

  // ── step 5: schedule everything (gated on subtitles) ─────────────────────────
  async schedule(idOrSlug: string): Promise<{ mainPublishAt: string; shortsPublishAt: string; view: LaunchView }> {
    const project = await this.project(idOrSlug);
    const view = await this.get(idOrSlug);
    if (view.published)        throw new BadRequestException('Связка уже опубликована');
    if (!view.allUploaded)     throw new BadRequestException('Не все видео залиты');
    if (!view.allTranscribed)  throw new BadRequestException('Нельзя публиковать без субтитров');
    if (view.hasShorts && !view.linkedConfirmed) throw new BadRequestException('Сначала подтверди связывание в Studio');

    // main → next Tue/Thu 16:00; shorts → same day 16:05
    const slot = await this.upload.suggestNextSlot('main');
    const mainPublishAt = slot.publishAt;
    const d = new Date(mainPublishAt); d.setMinutes(5, 0, 0);   // 16:05 same day
    const shortsPublishAt = d.toISOString();

    for (const it of view.items) {
      if (!it.videoId) continue;
      const when = it.kind === 'main' ? mainPublishAt : shortsPublishAt;
      await this.upload.setPublish(it.videoId, 'schedule', when);
      this.logger.log(`launch ${idOrSlug}: scheduled ${it.key} (${it.videoId}) → ${when}`);
    }

    // Mark the project published (main video link) so the /actions gates clear.
    const main = view.items.find((i) => i.kind === 'main');
    if (main?.videoId) {
      await this.prisma.project.update({ where: { id: project.id }, data: { youtubeUrl: `https://youtu.be/${main.videoId}` } });
    }
    // Persist the publish fact so the buttons lock and survive reloads.
    const state = this.readState(await this.project(idOrSlug));
    await this.writeState(project.id, { ...state, published: true, publishMode: 'scheduled', mainPublishAt, shortsPublishAt });
    return { mainPublishAt, shortsPublishAt, view: await this.get(idOrSlug) };
  }

  /** Publish everything PUBLIC now (instead of scheduling). Same gates as schedule. */
  async publishNow(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const view = await this.get(idOrSlug);
    if (view.published)        throw new BadRequestException('Связка уже опубликована');
    if (!view.allUploaded)     throw new BadRequestException('Не все видео залиты');
    if (!view.allTranscribed)  throw new BadRequestException('Нельзя публиковать без субтитров');
    if (view.hasShorts && !view.linkedConfirmed) throw new BadRequestException('Сначала подтверди связывание в Studio');
    for (const it of view.items) {
      if (!it.videoId) continue;
      await this.upload.setPublish(it.videoId, 'public');
      this.logger.log(`launch ${idOrSlug}: published ${it.key} (${it.videoId}) now`);
    }
    const main = view.items.find((i) => i.kind === 'main');
    if (main?.videoId) {
      await this.prisma.project.update({ where: { id: project.id }, data: { youtubeUrl: `https://youtu.be/${main.videoId}` } });
    }
    const state = this.readState(await this.project(idOrSlug));
    await this.writeState(project.id, { ...state, published: true, publishMode: 'public', mainPublishAt: null, shortsPublishAt: null });
    return this.get(idOrSlug);
  }

  async reset(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    await this.writeState(project.id, { items: [], linkedConfirmed: false });
    return this.get(idOrSlug);
  }
}
