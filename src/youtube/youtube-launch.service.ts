import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, statSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
// Чистая арифметика слотов релизного календаря (без Nest/Prisma) — часовой пояс
// канала берём оттуда же, где его знает /releases.
import { DEFAULT_TZ } from '../releases/slot-planner';
import { YoutubeCaptionsService } from './youtube-captions.service';
import { YoutubeUploadService } from './youtube-upload.service';

const LANG = 'ru';
/** Data API cap for thumbnails.set. Studio's uploader allows 50MB — anything in
 *  between goes up by hand there rather than being re-encoded here. */
const API_THUMB_LIMIT = 2 * 1024 * 1024;
/** Шорты выходят следом за своим основным видео, тем же слотом. */
const SHORTS_OFFSET_MIN = 5;
/** Инстант из БД (UTC) — по стенным часам канала: сообщения об ошибке читает
 *  человек, а он живёт в той же сетке, что и календарь релизов. */
function wallClock(d: Date): string {
  return d.toLocaleString('ru-RU', { timeZone: DEFAULT_TZ, dateStyle: 'short', timeStyle: 'short' });
}
/** Size of a cover file, 0 when it's gone (a moved/deleted file must not throw
 *  from a plain read of the launch state). */
function thumbBytes(p?: string): number {
  try { return p && existsSync(p) ? statSync(p).size : 0; } catch { return 0; }
}

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
  thumbnailSet?: boolean;             // did the cover actually land on YouTube?
  thumbnailError?: string | null;     // why it didn't (YouTube's own message)
  /** Operator set the cover by hand in Studio (covers over the API's 2MB limit go
   *  that way — we refuse to re-encode the artwork). On trust, like linkedConfirmed. */
  thumbnailManual?: boolean;
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
  /** Uploaded, a cover was given, but it isn't on YouTube yet → set it before publishing. */
  thumbnailMissing: boolean;
  thumbnailError:   string | null;
  /** Cover is too big for the API (2MB) — Studio (50MB) is the only path for it. */
  thumbnailTooBig:  boolean;
}

/**
 * Откуда взялась дата публикации.
 *   calendar — из релизного календаря (`Project.releaseAt`), это норма;
 *   auto     — в календаре даты нет, взят ближайший вт/чт по каналу (запасной путь).
 */
export type SlotSource = 'calendar' | 'auto';

export interface PlannedSlot {
  /** ISO-инстант публикации основного видео. */
  publishAt: string;
  source:    SlotSource;
  /** Пояснение для UI/лога. */
  reason:    string;
}

export interface LaunchView {
  items:           LaunchItemView[];
  linkedConfirmed: boolean;
  allTranscribed:  boolean;
  /**
   * The gate the stepper actually uses: subtitles ready on everything that NEEDS
   * them. Shorts do not — see SUBTITLES_REQUIRED_KINDS.
   */
  subtitlesReady:  boolean;
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
  /** Дата из релизного календаря (`Project.releaseAt`), null — слот не назначен. */
  plannedReleaseAt: string | null;
  /** Дата в календаре уже прошла — планировать по ней нельзя, надо подвинуть слот. */
  plannedReleasePast: boolean;
}

/**
 * Orchestrates the «Связка-запуск» stepper: main + all shorts of a project go out
 * together, cross-linked. Flow (each step gates the next):
 *   1. files      — operator picks mp4 + thumbnail for main and every short
 *   2. subtitles  — transcribe the main mp4 (whisper) → .srt (gate: main only;
 *                   shorts are exempt, see SUBTITLES_REQUIRED_KINDS)
 *   3. upload     — upload all as UNLISTED, attaching the pre-made .srt
 *   4. link       — operator links shorts→main in Studio (manual; API can't) and
 *                   confirms (server verifies uploads+subs, NOT the links)
 *   5. schedule   — videos.update all: main on ITS DATE FROM THE RELEASE CALENDAR
 *                   (Project.releaseAt), shorts 5 min after it
 * State lives in Project.settings.youtube.launch (survives reloads/restarts).
 */
@Injectable()
export class YoutubeLaunchService {
  private readonly logger = new Logger(YoutubeLaunchService.name);

  /**
   * Which items must have an .srt before the bundle may go out.
   *
   * The main video: yes. A 25-40 minute narrated film is watched with the sound
   * off often enough that a real subtitle track earns its whisper run, and it is
   * the only asset whose captions get indexed in a way that matters.
   *
   * A short: NO (user, 2026-08-11). There is no room for them in a 9:16 frame
   * that already carries a burned-in caption band, and YouTube shows its own
   * auto-captions on Shorts anyway, so our uploaded track is a second layer of
   * text competing with the first. It stays POSSIBLE on demand — `POST
   * /youtube/captions` still transcribes any file the operator points at — it is
   * simply no longer generated automatically and no longer blocks the launch.
   */
  private static readonly SUBTITLES_REQUIRED_KINDS: ReadonlyArray<LaunchItem['kind']> = ['main'];

  private static needsSubtitles(item: Pick<LaunchItem, 'kind'>): boolean {
    return YoutubeLaunchService.SUBTITLES_REQUIRED_KINDS.includes(item.kind);
  }

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
  /** Плановая дата фильма из релизного календаря (владелец поля — ReleasesService). */
  private async plannedReleaseAt(projectId: string): Promise<Date | null> {
    const row = await this.prisma.project.findUnique({
      where:  { id: projectId },
      select: { releaseAt: true },
    });
    return row?.releaseAt ?? null;
  }

  /**
   * Дата публикации основного видео.
   *
   * Источник истины — релизный календарь: раз слот проставлен на /releases,
   * заливка обязана встать ровно в него, а не в «следующий свободный вт/чт»
   * (user, 2026-08-12: «мы теперь планируем релизы по календарю»). Ближайший
   * вт/чт остаётся только запасным путём для фильма, которого в календаре нет.
   *
   * Прошедшая дата — не повод молча уехать на другой день: это ошибка плана,
   * её чинят на /releases (или публикуют «сейчас»).
   */
  async resolveSlot(idOrSlug: string): Promise<PlannedSlot> {
    const project = await this.project(idOrSlug);
    const planned = await this.plannedReleaseAt(project.id);
    if (planned) {
      if (planned.getTime() <= Date.now()) {
        throw new BadRequestException(
          `Дата в календаре релизов (${wallClock(planned)}) уже прошла — подвинь слот на /releases `
          + 'или публикуй сейчас.',
        );
      }
      return {
        publishAt: planned.toISOString(),
        source:    'calendar',
        reason:    'дата из релизного календаря',
      };
    }
    const slot = await this.upload.suggestNextSlot('main');
    return {
      publishAt: slot.publishAt,
      source:    'auto',
      reason:    `в календаре даты нет — ${slot.reason}`,
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
          it.thumbnailSet = job.result.thumbnailSet;
          it.thumbnailError = job.result.thumbnailError ?? null;
        } else if (job?.status === 'error') {
          it.uploadError = job.error ?? 'upload failed'; it.uploadJobId = undefined; uploadError = it.uploadError; dirty = true;
        } else if (!job) {
          // job vanished (backend restarted mid-upload) → let the user retry
          it.uploadJobId = undefined; dirty = true;
        }
        // else: still running → keep uploadJobId, uploadError stays null
      }
      const cap = await this.captions.latestForVideoPath(it.videoPath);
      items.push({
        ...it,
        transcribeStatus: cap?.status ?? null,
        uploaded: Boolean(it.videoId),
        uploadError,
        // Only meaningful once uploaded and only when a cover was actually given
        // (shorts often have none — YouTube picks a frame and that's fine).
        thumbnailMissing: Boolean(it.videoId) && Boolean(it.thumbPath?.trim())
                          && it.thumbnailSet !== true && it.thumbnailManual !== true,
        thumbnailError: it.thumbnailError ?? null,
        thumbnailTooBig: Boolean(it.thumbPath?.trim()) && thumbBytes(it.thumbPath) > API_THUMB_LIMIT,
      });
    }
    if (dirty) await this.writeState(project.id, state);

    const hasShorts      = items.some((i) => i.kind === 'short');
    const allTranscribed = items.length > 0 && items.every((i) => i.transcribeStatus === 'completed');
    // Shorts are excluded: their subtitles are optional, so a short without an
    // .srt must not hold the main video's launch. See SUBTITLES_REQUIRED_KINDS.
    const subtitlesReady = items.length > 0
      && items.filter((i) => YoutubeLaunchService.needsSubtitles(i))
              .every((i) => i.transcribeStatus === 'completed');
    const allUploaded    = items.length > 0 && items.every((i) => i.uploaded);
    let step = 1;
    if (items.length > 0)  step = 2;
    if (subtitlesReady)    step = 3;
    if (allUploaded)       step = hasShorts ? 4 : 5;               // no shorts → skip linking
    if (allUploaded && (!hasShorts || state.linkedConfirmed)) step = 5;
    const planned = await this.plannedReleaseAt(project.id);
    return {
      items, linkedConfirmed: state.linkedConfirmed, allTranscribed, subtitlesReady, allUploaded, hasShorts, step,
      published:       Boolean(state.published),
      publishMode:     state.publishMode ?? null,
      mainPublishAt:   state.mainPublishAt ?? null,
      shortsPublishAt: state.shortsPublishAt ?? null,
      plannedReleaseAt:   planned ? planned.toISOString() : null,
      plannedReleasePast: Boolean(planned && planned.getTime() <= Date.now()),
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
    // Transcribe what needs subtitles (whisper queue), unless a completed SRT job
    // already exists. Shorts are skipped — optional subtitles should not spend
    // whisper time by default; `POST /youtube/captions` makes one on demand.
    for (const it of state.items) {
      if (!YoutubeLaunchService.needsSubtitles(it)) continue;
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
      existing.thumbnailSet = undefined; existing.thumbnailError = undefined; existing.thumbnailManual = undefined;
    } else {
      state.items.push({ key: item.key, kind: item.kind, slug: item.slug, videoPath, thumbPath: thumbPath ?? '' });
    }
    await this.writeState(project.id, state);
    if (YoutubeLaunchService.needsSubtitles(item)) {
      const cap = await this.captions.latestForVideoPath(videoPath);
      if (cap?.status !== 'completed') await this.captions.enqueueTranscribe(idOrSlug, videoPath, LANG);
    }
    return this.get(idOrSlug);
  }

  /**
   * Put ONE item on transcription by hand.
   *
   * The main video gets this automatically at `prepare`. A short does not, because
   * its subtitles are optional — but "optional" has to mean CHOOSABLE, not
   * unavailable, so this is the operator's way to ask for a short's .srt. It lands
   * next to the mp4 and `attachExisting` picks it up at upload if it is ready by
   * then; if it is not, the upload goes ahead without it.
   *
   * Idempotent: a job already queued, running or completed is left alone rather
   * than duplicated onto the render queue.
   */
  async transcribeItem(idOrSlug: string, key: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const it = state.items.find((i) => i.key === key);
    if (!it) throw new NotFoundException(`Launch item "${key}" not found`);
    const cap = await this.captions.latestForVideoPath(it.videoPath);
    if (cap && ['completed', 'pending', 'running'].includes(String(cap.status))) {
      return this.get(idOrSlug);
    }
    // WHICH job depends on whether the video is already up. Before upload, a
    // transcribe-only job is right — the .srt waits next to the mp4 and
    // `attachExisting` picks it up. AFTER upload there is nothing left to attach
    // it to, so a transcribe-only job would produce a file nobody ever sends;
    // the full job (whisper → captions.insert onto the existing videoId) is the
    // only thing that puts subtitles on a video that is already on YouTube.
    if (it.videoId) {
      await this.captions.enqueue(idOrSlug, it.videoId, it.videoPath, LANG);
      this.logger.log(`launch: subtitles requested for ALREADY UPLOADED ${key} (${it.videoId})`);
    } else {
      await this.captions.enqueueTranscribe(idOrSlug, it.videoPath, LANG);
      this.logger.log(`launch: subtitles requested by hand for ${key} (${it.videoPath})`);
    }
    return this.get(idOrSlug);
  }

  /** Upload ONE item as Unlisted (gated on its subtitles being ready; shorts exempt). */
  async uploadItem(idOrSlug: string, key: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const it = state.items.find((i) => i.key === key);
    if (!it) throw new NotFoundException(`Launch item "${key}" not found`);
    // Only the main video is held back for its .srt — a short uploads without one.
    if (YoutubeLaunchService.needsSubtitles(it)) {
      const cap = await this.captions.latestForVideoPath(it.videoPath);
      if (cap?.status !== 'completed') throw new BadRequestException('Субтитры ещё не готовы');
    }
    if (!it.videoId && !it.uploadJobId) {
      const { jobId } = this.upload.beginUpload(idOrSlug, it.kind, it.slug, {
        videoPath: it.videoPath, thumbnailPath: it.thumbPath, privacyStatus: 'unlisted',
      });
      it.uploadJobId = jobId; it.uploadError = undefined;
      await this.writeState(project.id, state);
    }
    return this.get(idOrSlug);
  }

  /** Operator says the cover is up in Studio. Covers over the API's 2MB limit can
   *  only go that way (we won't re-encode the artwork), so — like linkedConfirmed —
   *  this is on trust: the API won't tell us whether a thumbnail is custom. */
  async confirmThumbnailManual(idOrSlug: string, key: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const it = state.items.find((i) => i.key === key);
    if (!it) throw new NotFoundException(`Launch item "${key}" not found`);
    if (!it.videoId) throw new BadRequestException('Видео ещё не залито — обложку ставить некуда');
    it.thumbnailManual = true; it.thumbnailError = null;
    await this.writeState(project.id, state);
    this.logger.log(`launch ${idOrSlug}: ${key} (${it.videoId}) — обложка поставлена вручную в Studio`);
    return this.get(idOrSlug);
  }

  /** Send the cover of an ALREADY-uploaded item through the API. Only works for a
   *  file under 2MB — the video itself (gigabytes) stays where it is. Optionally
   *  point at a different image. */
  async retryThumbnail(idOrSlug: string, key: string, thumbPath?: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const state   = this.readState(project);
    const it = state.items.find((i) => i.key === key);
    if (!it) throw new NotFoundException(`Launch item "${key}" not found`);
    if (!it.videoId) throw new BadRequestException('Видео ещё не залито — обложка уйдёт вместе с заливкой');
    const src = (thumbPath ?? it.thumbPath ?? '').trim();
    if (!src) throw new BadRequestException('Для этого ассета не указана обложка');
    try {
      const r = await this.upload.setThumbnailFor(it.videoId, src);
      it.thumbPath = src; it.thumbnailSet = r.thumbnailSet; it.thumbnailError = null;
      await this.writeState(project.id, state);
      this.logger.log(`launch ${idOrSlug}: thumbnail re-sent for ${key} (${it.videoId})`);
    } catch (e) {
      it.thumbnailSet = false;
      it.thumbnailError = e instanceof Error ? e.message : String(e);
      await this.writeState(project.id, state);
      throw e;
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
    if (!view.subtitlesReady) throw new BadRequestException('Субтитры основного видео ещё не готовы');

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
    if (!view.subtitlesReady) throw new BadRequestException('Субтитры основного видео не готовы');
    const state = this.readState(project);
    state.linkedConfirmed = true;
    await this.writeState(project.id, state);
    return this.get(idOrSlug);
  }

  // ── step 5: schedule everything (gated on subtitles) ─────────────────────────
  async schedule(idOrSlug: string): Promise<{ mainPublishAt: string; shortsPublishAt: string; slotSource: SlotSource; view: LaunchView }> {
    const project = await this.project(idOrSlug);
    const view = await this.get(idOrSlug);
    if (view.published)        throw new BadRequestException('Связка уже опубликована');
    if (!view.allUploaded)     throw new BadRequestException('Не все видео залиты');
    if (!view.subtitlesReady)  throw new BadRequestException('Нельзя публиковать без субтитров основного видео');
    if (view.hasShorts && !view.linkedConfirmed) throw new BadRequestException('Сначала подтверди связывание в Studio');

    // main → слот из релизного календаря; shorts → +5 минут к нему (смещением, а
    // не setMinutes: слот необязательно ровно в :00, и час менять нельзя).
    const slot = await this.resolveSlot(idOrSlug);
    const mainPublishAt = slot.publishAt;
    const shortsPublishAt = new Date(new Date(mainPublishAt).getTime() + SHORTS_OFFSET_MIN * 60_000).toISOString();
    this.logger.log(`launch ${idOrSlug}: слот ${mainPublishAt} (${slot.source} — ${slot.reason})`);

    for (const it of view.items) {
      if (!it.videoId) continue;
      const when = it.kind === 'main' ? mainPublishAt : shortsPublishAt;
      await this.upload.setPublish(it.videoId, 'schedule', when);
      this.logger.log(`launch ${idOrSlug}: scheduled ${it.key} (${it.videoId}) → ${when}`);
    }

    // Mark the project published (main video link) so the /actions gates clear.
    // Заодно фиксируем в календаре ровно тот слот, который ушёл на YouTube: для
    // фильма без плановой даты (source='auto') календарь иначе остался бы пустым
    // при уже запланированной публикации.
    const main = view.items.find((i) => i.kind === 'main');
    if (main?.videoId) {
      await this.prisma.project.update({
        where: { id: project.id },
        data: { youtubeUrl: `https://youtu.be/${main.videoId}`, releaseAt: new Date(mainPublishAt) },
      });
    }
    // Persist the publish fact so the buttons lock and survive reloads.
    const state = this.readState(await this.project(idOrSlug));
    await this.writeState(project.id, { ...state, published: true, publishMode: 'scheduled', mainPublishAt, shortsPublishAt });
    return { mainPublishAt, shortsPublishAt, slotSource: slot.source, view: await this.get(idOrSlug) };
  }

  /** Publish everything PUBLIC now (instead of scheduling). Same gates as schedule. */
  async publishNow(idOrSlug: string): Promise<LaunchView> {
    const project = await this.project(idOrSlug);
    const view = await this.get(idOrSlug);
    if (view.published)        throw new BadRequestException('Связка уже опубликована');
    if (!view.allUploaded)     throw new BadRequestException('Не все видео залиты');
    if (!view.subtitlesReady)  throw new BadRequestException('Нельзя публиковать без субтитров основного видео');
    if (view.hasShorts && !view.linkedConfirmed) throw new BadRequestException('Сначала подтверди связывание в Studio');
    for (const it of view.items) {
      if (!it.videoId) continue;
      await this.upload.setPublish(it.videoId, 'public');
      this.logger.log(`launch ${idOrSlug}: published ${it.key} (${it.videoId}) now`);
    }
    const main = view.items.find((i) => i.kind === 'main');
    if (main?.videoId) {
      // Фактическая дата выхода = сейчас; плановая (если была) уже неверна, а
      // календарь по ней считает «залито, публикация отложена».
      await this.prisma.project.update({
        where: { id: project.id },
        data: { youtubeUrl: `https://youtu.be/${main.videoId}`, releaseAt: new Date() },
      });
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
