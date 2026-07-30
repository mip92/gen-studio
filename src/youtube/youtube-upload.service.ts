import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { createReadStream, existsSync, statSync } from 'fs';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeAuthService } from './youtube-auth.service';
import { YoutubeCaptionsService } from './youtube-captions.service';
import { YoutubeService } from './youtube.service';

export type YoutubePrivacy = 'private' | 'unlisted' | 'public';

/** Options shared by MAIN-video and SHORT uploads (everything except which
 *  packaging the title/description/tags come from). */
export interface UploadOptions {
  /** Absolute path to the final rendered mp4 (assembled by the user in CapCut). */
  videoPath: string;
  /** Absolute path to a thumbnail image (jpg/png, ≤50MB). REQUIRED. */
  thumbnailPath: string;
  /** Requested privacy. Ignored when `publishAt` is set (scheduling → private). */
  privacyStatus?: YoutubePrivacy;
  /** RFC3339 time to auto-publish at (forces private). */
  publishAt?: string;
  /** Declare AI/altered content. Default TRUE (this channel is AI-generated). */
  containsSyntheticMedia?: boolean;
  /** Playlist id to add the video to. For shorts, defaults to the «шорты» playlist. */
  playlistId?: string;
  /** YT category id. Default '24' (Entertainment). */
  categoryId?: string;
  /** COPPA self-declaration. Default false. */
  madeForKids?: boolean;
  /** 'youtube' (standard) or 'creativeCommon'. Default 'youtube'. */
  license?: string;
  /** Allow embedding. Default true. */
  embeddable?: boolean;
  /** Show view count publicly. Default true. */
  publicStatsViewable?: boolean;
  /** Auto-generate + upload subtitles right after the video uploads (queues a
   *  CaptionJob with the new videoId + this videoPath). */
  generateCaptions?: boolean;
}
/** @deprecated alias — kept so existing imports keep compiling. */
export type UploadMainOptions = UploadOptions;

export interface UploadResult {
  videoId: string;
  url: string;
  requestedPrivacy: YoutubePrivacy;
  /** What Google ACTUALLY set. */
  actualPrivacy: string | null;
  publishAt: string | null;
  containsSyntheticMedia: boolean;
  thumbnailSet: boolean;
  /** Why the thumbnail didn't stick (null when it did / none was given). Surfaced
   *  in the UI — a silently missing cover used to only show up in Studio. */
  thumbnailError: string | null;
  /** null = no playlist requested; true/false = add outcome. */
  playlistAdded: boolean | null;
  /** True if a pre-made SRT (next to the mp4) was attached during upload. */
  captionsAttached: boolean;
  markedPublished: boolean;
}
export type UploadMainResult = UploadResult;

export interface YoutubePlaylist {
  id: string;
  title: string;
  itemCount: number;
}

/** Background upload job — a 2GB upload takes minutes, far longer than an HTTP
 *  request (or the Next proxy) will stay open, so the POST returns a jobId and
 *  the frontend polls this. In-memory: a backend restart aborts in-flight uploads. */
export interface UploadJob {
  jobId: string;
  kind: 'main' | 'short';
  status: 'uploading' | 'done' | 'error';
  result?: UploadResult;
  error?: string;
  startedAt: number;
}

/** Content language for this channel (RU cautionary tales). */
const CONTENT_LANGUAGE = 'ru';
/**
 * The Data API's custom-thumbnail limit is 2MB of FILE SIZE (docs: thumbnails/set
 * → "Maximum file size: 2MB"). Studio's web uploader allows 50MB, which is why the
 * same cover goes up fine by hand and silently fails here — the old 50MB constant
 * was the Studio limit applied to the wrong surface.
 *
 * Worse, going over it comes back as `400 invalidImage`, NOT `mediaBodyTooLarge`
 * (the docs list no size-specific error at all), so it reads like a corrupt image.
 * Verified live on one cover: 2.43MB PNG → rejected; the same picture at its
 * original 1672x941 re-encoded to 0.43MB → accepted, so pixel dimensions are not
 * the constraint. Lossless PNG recompression only reached 2.36MB — not enough.
 *
 * Nano-Banana covers land at ~2.2-2.5MB, i.e. ALWAYS over. We do NOT re-encode
 * them (that would be a second lossy pass on the artwork); oversized covers are
 * set by hand in Studio instead.
 */
const MAX_THUMB_BYTES = 2 * 1024 * 1024;

// YouTube hard limits — exceeding any of these makes videos.insert 400.
const TITLE_MAX = 100;
const DESC_MAX = 5000;
const TAGS_MAX = 500;

/** YouTube's 500-char tag budget counts: each tag's chars, +2 quotes for a tag
 *  with spaces, AND the commas between tags. (Missing the commas was why a set
 *  that "fit" locally still got rejected with invalidTags.) */
function tagCost(t: string, withSeparator: boolean): number {
  return t.length + (t.includes(' ') ? 2 : 0) + (withSeparator ? 1 : 0);
}
function tagsCharCount(tags: string[]): number {
  return tags.reduce((n, t, i) => n + tagCost(t, i > 0), 0);
}
/** Keep tags from the front while they fit YouTube's budget (with a safety margin
 *  under the 500 hard limit); drop the rest. Front tags are the most important. */
function fitTags(tags: string[], budget = TAGS_MAX - 20): string[] {
  const out: string[] = [];
  let total = 0;
  for (const t of tags) {
    const cost = tagCost(t, out.length > 0);
    if (total + cost > budget) break;
    out.push(t); total += cost;
  }
  return out;
}

// Publish time (Kyiv = server-local on the operator's machine): main 16:00,
// shorts 5 min later so the short rides the same slot right after its main.
const SLOT_HOUR = 16;
const SHORT_SLOT_MIN = 5;

/** First Tuesday(2)/Thursday(4) at `hour`:`minute` (local) strictly AFTER `base`.
 *  Local time = server time = the operator's Kyiv machine (localhost tool). Note:
 *  for a short, passing base = the just-scheduled main (16:00 same Tue/Thu) yields
 *  16:05 that SAME day, since 16:05 > 16:00 and the day is already Tue/Thu. */
function nextTueThuAfter(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  for (let i = 0; i < 15; i++) {
    if ((d.getDay() === 2 || d.getDay() === 4) && d.getTime() > base.getTime()) return d;
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
  }
  return d;
}

export interface NextSlotSuggestion {
  /** RFC3339 timestamp to prefill the schedule picker with. */
  publishAt: string;
  /** The latest occupied slot it built on (null = none found → based on now). */
  basedOn: string | null;
  /** Human note for the UI. */
  reason: string;
}

interface Snippet { title: string; description: string; tags: string[]; }

/** Pull a human-readable message out of a googleapis / Gaxios error. */
function googleErrMessage(e: any): string {
  const d = e?.response?.data?.error;
  if (d?.errors?.length) {
    const reasons = d.errors.map((x: any) => x.reason).filter(Boolean).join(', ');
    return reasons ? `${d.message} [${reasons}]` : d.message;
  }
  if (d?.message) return d.message;
  if (e?.errors?.length) return e.errors[0]?.message ?? String(e);
  return e?.message ?? String(e);
}

/**
 * Uploads a project's MAIN video or one of its SHORTS to YouTube via the Data
 * API v3 (`videos.insert`), sets the (mandatory) thumbnail, optionally schedules
 * (`publishAt`), declares synthetic media, sets language/license/embeddable/etc,
 * and adds it to a playlist. Title/description/tags come from the project's
 * packaging (Project.settings.youtube.{main|shorts[slug]}).
 *
 * Captions are handled separately (YoutubeCaptionsService).
 */
@Injectable()
export class YoutubeUploadService {
  private readonly logger = new Logger(YoutubeUploadService.name);

  /** In-flight + recently-finished background upload jobs, keyed by jobId. */
  private readonly jobs = new Map<string, UploadJob>();
  private jobSeq = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: YoutubeAuthService,
    private readonly youtube: YoutubeService,
    private readonly captions: YoutubeCaptionsService,
  ) { }

  /**
   * Start an upload in the BACKGROUND and return its jobId immediately, so the
   * HTTP request doesn't stay open for the whole (multi-minute, multi-GB) upload
   * and get reset by the proxy. Poll `getJob(jobId)` for the outcome.
   */
  beginUpload(idOrSlug: string, kind: 'main' | 'short', shortSlug: string | undefined, opts: UploadOptions): { jobId: string } {
    const jobId = `${Date.now().toString(36)}-${(this.jobSeq++).toString(36)}`;
    const job: UploadJob = { jobId, kind, status: 'uploading', startedAt: Date.now() };
    this.jobs.set(jobId, job);
    this.pruneJobs();

    const work = kind === 'short'
      ? this.uploadShort(idOrSlug, shortSlug ?? '', opts)
      : this.uploadMain(idOrSlug, opts);
    void work
      .then(async (result) => {
        job.status = 'done'; job.result = result;
        // Auto-generate subtitles after upload — but skip if a pre-made SRT was
        // already attached (launch stepper transcribes before upload).
        if (opts.generateCaptions && result.videoId && !result.captionsAttached) {
          try { await this.captions.enqueue(idOrSlug, result.videoId, opts.videoPath); }
          catch (e: any) { this.logger.warn(`auto-captions enqueue failed for ${result.videoId}: ${e?.message ?? e}`); }
        }
      })
      .catch((e: any) => {
        job.status = 'error';
        job.error = e?.response?.data?.error?.message ?? e?.message ?? String(e);
        this.logger.error(`upload job ${jobId} (${kind}) failed: ${job.error}`);
      });
    return { jobId };
  }

  getJob(jobId: string): UploadJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  /** Drop finished jobs older than 15 min so the map doesn't grow unbounded. */
  private pruneJobs(): void {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [id, j] of this.jobs) {
      if (j.status !== 'uploading' && j.startedAt < cutoff) this.jobs.delete(id);
    }
  }

  /** List the connected channel's playlists (for the upload target dropdown). */
  async listPlaylists(): Promise<YoutubePlaylist[]> {
    const client = this.auth.getClient();
    if (!client) throw new BadRequestException('YouTube is not connected.');
    const youtube = google.youtube({ version: 'v3', auth: client });
    const out: YoutubePlaylist[] = [];
    let pageToken: string | undefined;
    do {
      const res = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'], mine: true, maxResults: 50, pageToken,
      });
      for (const p of res.data.items ?? []) {
        out.push({
          id: p.id ?? '',
          title: p.snippet?.title ?? '(без названия)',
          itemCount: p.contentDetails?.itemCount ?? 0,
        });
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return out;
  }

  /** Suggest the next publish slot: the next Tue/Thu (16:00 Kyiv for main, 16:05
   *  for a short) strictly AFTER the latest already-scheduled/published video on
   *  the channel. Scans the channel's uploads incl. scheduled (private) videos. */
  async suggestNextSlot(kind: 'main' | 'short' = 'main'): Promise<NextSlotSuggestion> {
    const client = this.auth.getClient();
    if (!client) throw new BadRequestException('YouTube is not connected.');
    const youtube = google.youtube({ version: 'v3', auth: client as never });

    // Latest occupied date = max over (publishAt for scheduled, else publishedAt).
    let last: Date | null = null;
    try {
      const ch = await youtube.channels.list({ part: ['contentDetails'], mine: true });
      const uploads = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (uploads) {
        const pl = await youtube.playlistItems.list({ part: ['contentDetails'], playlistId: uploads, maxResults: 50 });
        const ids = (pl.data.items ?? []).map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
        if (ids.length) {
          const vids = await youtube.videos.list({ part: ['status', 'snippet'], id: ids });
          for (const v of vids.data.items ?? []) {
            const raw = v.status?.publishAt ?? v.snippet?.publishedAt;
            if (!raw) continue;
            const d = new Date(raw);
            if (!last || d > last) last = d;
          }
        }
      }
    } catch (e) {
      this.logger.warn(`suggestNextSlot: channel scan failed (${(e as Error).message}) — basing on now`);
    }

    const now = new Date();
    const future = last && last.getTime() > now.getTime() ? last : null;

    let slot: Date;
    let reason: string;
    if (kind === 'short' && future) {
      // Shorts publish the SAME DAY as their main video, 5 min later (16:05).
      slot = new Date(future);
      slot.setHours(SLOT_HOUR, SHORT_SLOT_MIN, 0, 0);
      reason = `тот же день, что и запланированное видео (${slot.toLocaleString('ru-RU')})`;
    } else {
      // Main (or a short with nothing scheduled ahead): next Tue/Thu after the
      // latest occupied slot, at 16:00 (main) / 16:05 (short).
      const base = future ?? now;
      const minute = kind === 'short' ? SHORT_SLOT_MIN : 0;
      slot = nextTueThuAfter(base, SLOT_HOUR, minute);
      reason = future
        ? `следующий вт/чт после запланированного ${future.toLocaleString('ru-RU')}`
        : 'ближайший вт/чт (будущих запланированных не найдено)';
    }
    return {
      publishAt: slot.toISOString(),
      basedOn: last ? last.toISOString() : null,
      reason,
    };
  }

  /**
   * Open a native "Open File" dialog ON THE SERVER MACHINE (which is the user's
   * own machine — localhost tool) and return the chosen absolute path. Lets the
   * UI offer a file picker without uploading the (huge) file through the browser:
   * the backend still reads the path directly at upload time.
   */
  async pickFile(kind: 'video' | 'image'): Promise<{ path: string | null }> {
    const isVideo = kind !== 'image';
    const filter = isVideo
      ? 'Video (*.mp4;*.mov;*.mkv;*.webm)|*.mp4;*.mov;*.mkv;*.webm|All files (*.*)|*.*'
      : 'Image (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png|All files (*.*)|*.*';
    const title = isVideo ? 'Select the final mp4' : 'Select the thumbnail';
    // WinForms OpenFileDialog needs an STA apartment; a TopMost owner form brings
    // the dialog to the front. English strings only (avoids console codepage issues).
    const ps = [
      'Add-Type -AssemblyName System.Windows.Forms | Out-Null',
      '$owner = New-Object System.Windows.Forms.Form -Property @{TopMost=$true;ShowInTaskbar=$false}',
      '$d = New-Object System.Windows.Forms.OpenFileDialog',
      `$d.Filter = '${filter}'`,
      `$d.Title = '${title}'`,
      'if ($d.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($d.FileName) }',
    ].join('; ');
    return new Promise((resolve) => {
      const proc = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', ps], { windowsHide: true });
      let out = '';
      proc.stdout.on('data', (d) => { out += d.toString(); });
      proc.on('error', (e) => { this.logger.warn(`file picker failed: ${e.message}`); resolve({ path: null }); });
      proc.on('close', () => resolve({ path: out.trim() || null }));
    });
  }

  // ── MAIN video ────────────────────────────────────────────────────────────
  async uploadMain(idOrSlug: string, opts: UploadOptions): Promise<UploadResult> {
    const { project, client } = await this.preflight(idOrSlug, opts);
    const pkg = await this.youtube.get(idOrSlug);
    const snippet = this.validatePackaging(
      pkg.main.title ?? '', pkg.main.description ?? '', pkg.main.tags ?? [], 'основного видео',
    );

    // Default the main video's playlist to «…твоя жизнь» unless the caller chose one.
    let playlistId = opts.playlistId;
    if (!playlistId) {
      try {
        playlistId = (await this.listPlaylists()).find((p) => /это вся|жизн/i.test(p.title))?.id;
      } catch { /* non-fatal */ }
    }

    const result = await this.insertVideo(client, snippet, { ...opts, playlistId });

    await this.youtube.patch(idOrSlug, { main: { videoId: result.videoId, url: result.url } });
    if (result.markedPublished) {
      await this.prisma.project.update({ where: { id: project.id }, data: { youtubeUrl: result.url } });
    }
    return result;
  }

  // ── SHORT ─────────────────────────────────────────────────────────────────
  async uploadShort(idOrSlug: string, shortSlug: string, opts: UploadOptions): Promise<UploadResult> {
    const { project, client } = await this.preflight(idOrSlug, opts, false);   // thumb optional for shorts
    const pkg = await this.youtube.get(idOrSlug);
    const short = pkg.shorts?.[shortSlug];
    if (!short) throw new NotFoundException(`Short "${shortSlug}" not found in packaging`);

    // Pick the description: once the main video is published, use `descAfter`
    // (which references {{main_url}}); otherwise the standalone `descBefore`.
    const mainUrl = project.youtubeUrl ?? pkg.main?.url ?? '';
    const rawDesc = (mainUrl ? (short.descAfter || short.descBefore) : short.descBefore) ?? '';
    const description = rawDesc.replace(/\{\{\s*main_url\s*\}\}/g, mainUrl);
    const snippet = this.validatePackaging(
      short.title ?? '', description, short.tags ?? [], `шорта «${shortSlug}»`,
    );

    // Default the playlist to «шорты» unless the caller chose one.
    let playlistId = opts.playlistId;
    if (!playlistId) {
      try {
        playlistId = (await this.listPlaylists()).find((p) => /шорт|shorts?/i.test(p.title))?.id;
      } catch { /* non-fatal — upload without a playlist */ }
    }

    const result = await this.insertVideo(client, snippet, { ...opts, playlistId });

    await this.youtube.patch(idOrSlug, { shorts: { [shortSlug]: { url: result.url } } });
    return result;
  }

  // ── shared internals ────────────────────────────────────────────────────────

  /** Validate files + connection, resolve the project. Thumbnail is required for
   *  the main video but OPTIONAL for shorts (`requireThumb=false`). */
  private async preflight(idOrSlug: string, opts: UploadOptions, requireThumb = true) {
    if (!opts.videoPath?.trim()) throw new BadRequestException('videoPath is required');
    if (!existsSync(opts.videoPath) || !statSync(opts.videoPath).isFile()) {
      throw new BadRequestException(`Video file not found: ${opts.videoPath}`);
    }
    if (requireThumb && !opts.thumbnailPath?.trim()) {
      throw new BadRequestException('thumbnailPath is required (обложка обязательна для основного видео)');
    }
    // Size isn't checked here: an oversized cover is shrunk at upload time
    // (fitThumbnail), so the operator never has to pre-compress by hand.
    if (opts.thumbnailPath?.trim() && !existsSync(opts.thumbnailPath)) {
      throw new BadRequestException(`Thumbnail not found: ${opts.thumbnailPath}`);
    }
    const client = this.auth.getClient();
    if (!client) {
      throw new BadRequestException('YouTube is not connected. Open /youtube/oauth/url to authorise first.');
    }
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return { project, client };
  }

  /** Validate packaging against YouTube's hard limits — fail loud, never
   *  silently truncate. Returns the cleaned snippet. */
  private validatePackaging(rawTitle: string, description: string, rawTags: string[], what: string): Snippet {
    const title = rawTitle.trim();
    const tags = rawTags.map((t) => t.trim()).filter(Boolean);
    if (!title) throw new BadRequestException(`Нет заголовка для ${what} — заполни упаковку.`);
    const v: string[] = [];
    if (title.length > TITLE_MAX) v.push(`заголовок ${title.length}/${TITLE_MAX}`);
    if (description.length > DESC_MAX) v.push(`описание ${description.length}/${DESC_MAX}`);
    const tagChars = tagsCharCount(tags);   // chars + quotes(multiword) + commas — matches YouTube
    if (tagChars > TAGS_MAX) v.push(`теги ${tagChars}/${TAGS_MAX} симв`);
    if (v.length) {
      throw new BadRequestException(`Упаковка ${what} превышает лимиты YouTube: ${v.join('; ')}. Поправь и повтори.`);
    }
    return { title, description, tags };
  }

  /** The videos.insert + thumbnail + playlist core, shared by main & shorts. */
  private async insertVideo(client: unknown, snippet: Snippet, opts: UploadOptions): Promise<UploadResult> {
    const scheduling = Boolean(opts.publishAt);
    const requestedPrivacy: YoutubePrivacy = scheduling ? 'private' : (opts.privacyStatus ?? 'private');
    const synthetic = opts.containsSyntheticMedia ?? true;
    const youtube = google.youtube({ version: 'v3', auth: client as never });

    const requestBody = {
      snippet: {
        title: snippet.title,
        description: snippet.description,
        tags: snippet.tags,
        categoryId: opts.categoryId ?? '24',
        defaultLanguage: CONTENT_LANGUAGE,
        defaultAudioLanguage: CONTENT_LANGUAGE,
      },
      status: {
        privacyStatus: requestedPrivacy,
        ...(scheduling ? { publishAt: opts.publishAt } : {}),
        containsSyntheticMedia: synthetic,
        selfDeclaredMadeForKids: opts.madeForKids ?? false,
        license: opts.license ?? 'youtube',
        embeddable: opts.embeddable ?? true,
        publicStatsViewable: opts.publicStatsViewable ?? true,
      },
    };
    this.logger.log(`Uploading "${snippet.title}" from ${opts.videoPath}${scheduling ? ` (publishAt ${opts.publishAt})` : ''} …`);

    let insertRes;
    try {
      insertRes = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody,
        media: { body: createReadStream(opts.videoPath) },
      });
    } catch (e) {
      const msg = googleErrMessage(e);
      // Full detail to the console so the operator sees the real cause; the
      // request body is logged too (which field YouTube choked on).
      this.logger.error(`videos.insert FAILED: ${msg}`);
      this.logger.error(`  requestBody.status = ${JSON.stringify(requestBody.status)}`);
      this.logger.error((e as Error)?.stack ?? String(e));
      throw new BadRequestException(`YouTube отклонил заливку: ${msg}`);
    }

    const videoId = insertRes.data.id;
    if (!videoId) throw new BadRequestException('YouTube did not return a video id');
    const url = `https://youtu.be/${videoId}`;
    const actualPrivacy = insertRes.data.status?.privacyStatus ?? null;
    this.logger.log(`Uploaded ${videoId} — actual privacy: ${actualPrivacy}`);

    // Thumbnail — set only if provided (required for main, optional for shorts).
    // A failure never loses the upload (the video is the expensive part), but the
    // reason is both logged AND returned so the UI can shout about it instead of
    // reporting a clean "✓ залито" with no cover on the channel.
    let thumbnailSet = false;
    let thumbnailError: string | null = null;
    if (opts.thumbnailPath?.trim()) {
      try {
        thumbnailSet = await this.applyThumbnail(youtube, videoId, opts.thumbnailPath);
      } catch (e) {
        thumbnailError = e instanceof Error ? e.message : String(e);
      }
      if (!thumbnailSet && !thumbnailError) thumbnailError = 'thumbnails.set не сработал — см. лог';
    }

    // Playlist (best-effort).
    let playlistAdded: boolean | null = null;
    if (opts.playlistId?.trim()) {
      try {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: { snippet: { playlistId: opts.playlistId, resourceId: { kind: 'youtube#video', videoId } } },
        });
        playlistAdded = true;
      } catch (e) {
        playlistAdded = false;
        this.logger.warn(`Playlist add failed for ${videoId}: ${(e as Error).message}`);
      }
    }

    // Attach a pre-made SRT (transcribed before upload by the launch stepper), if
    // one sits next to the mp4. Best-effort.
    let captionsAttached = false;
    try {
      captionsAttached = await this.captions.attachExisting(videoId, opts.videoPath, CONTENT_LANGUAGE);
      if (captionsAttached) this.logger.log(`Attached pre-made captions to ${videoId}`);
    } catch (e) {
      this.logger.warn(`attach captions failed for ${videoId}: ${(e as Error).message}`);
    }

    return {
      videoId, url, requestedPrivacy, actualPrivacy,
      publishAt: opts.publishAt ?? null,
      containsSyntheticMedia: synthetic,
      thumbnailSet, thumbnailError, playlistAdded, captionsAttached,
      markedPublished: actualPrivacy === 'public',
    };
  }

  // ── thumbnail ───────────────────────────────────────────────────────────────

  /**
   * Upload a cover for `videoId` — BYTE-FOR-BYTE, never re-encoded. Over the API's
   * 2MB limit we don't send at all: the operator sets that cover by hand in Studio
   * (50MB there), which keeps the original picture untouched. Retries once after a
   * pause because right after insert the video is still processing and the set
   * occasionally doesn't take.
   */
  private async applyThumbnail(youtube: ReturnType<typeof google.youtube>, videoId: string, thumbnailPath: string): Promise<boolean> {
    const size = statSync(thumbnailPath).size;
    if (size > MAX_THUMB_BYTES) {
      throw new BadRequestException(
        `Обложка ${(size / 1048576).toFixed(2)}МБ — API принимает только до 2МБ. Поставь её руками в Studio (там лимит 50МБ), картинка уйдёт как есть.`);
    }
    const mimeType = /\.png$/i.test(thumbnailPath) ? 'image/png' : 'image/jpeg';
    let lastMsg = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt === 2) await new Promise((r) => setTimeout(r, 12000));
      try {
        await youtube.thumbnails.set({ videoId, media: { mimeType, body: createReadStream(thumbnailPath) } });
        this.logger.log(`Thumbnail set for ${videoId} (attempt ${attempt}) from ${thumbnailPath}`);
        return true;
      } catch (e) {
        lastMsg = googleErrMessage(e);
        if (attempt === 1) this.logger.warn(`thumbnails.set will retry once for ${videoId}: ${lastMsg}`);
      }
    }
    this.logger.error(`Thumbnail NOT set for ${videoId}: ${lastMsg} — set it in Studio`);
    throw new BadRequestException(`YouTube не принял обложку: ${lastMsg}`);
  }

  /** Set/replace the cover of an ALREADY-uploaded video — re-uploading gigabytes
   *  just to fix a cover would be absurd. Used by the stepper's retry button. */
  async setThumbnailFor(videoId: string, thumbnailPath: string): Promise<{ videoId: string; thumbnailSet: boolean }> {
    if (!thumbnailPath?.trim()) throw new BadRequestException('Не указан путь к обложке');
    if (!existsSync(thumbnailPath)) throw new BadRequestException(`Обложка не найдена: ${thumbnailPath}`);
    const client = this.auth.getClient();
    if (!client) throw new BadRequestException('YouTube is not connected.');
    const youtube = google.youtube({ version: 'v3', auth: client as never });
    return { videoId, thumbnailSet: await this.applyThumbnail(youtube, videoId, thumbnailPath) };
  }

  /**
   * Publish/schedule an already-uploaded (unlisted) video via videos.update:
   *   mode 'public'   → privacyStatus public now
   *   mode 'schedule' → privacyStatus private + publishAt (goes public at that time)
   * Related-video links set manually in Studio survive this change.
   */
  async setPublish(videoId: string, mode: 'public' | 'schedule', publishAt?: string): Promise<{ videoId: string; privacyStatus: string; publishAt: string | null }> {
    const client = this.auth.getClient();
    if (!client) throw new BadRequestException('YouTube is not connected.');
    const youtube = google.youtube({ version: 'v3', auth: client as never });
    const status = mode === 'schedule'
      ? { privacyStatus: 'private', publishAt }
      : { privacyStatus: 'public' };
    try {
      const res = await youtube.videos.update({
        part: ['status'],
        requestBody: { id: videoId, status },
      });
      return {
        videoId,
        privacyStatus: res.data.status?.privacyStatus ?? (mode === 'schedule' ? 'private' : 'public'),
        publishAt: res.data.status?.publishAt ?? publishAt ?? null,
      };
    } catch (e) {
      const msg = googleErrMessage(e);
      this.logger.error(`videos.update (${mode}) failed for ${videoId}: ${msg}`);
      throw new BadRequestException(`YouTube отклонил публикацию: ${msg}`);
    }
  }
}
