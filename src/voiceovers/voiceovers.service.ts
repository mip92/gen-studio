import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { createHash, randomUUID } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import youtubeDl from 'youtube-dl-exec';
import { PrismaService } from '../prisma/prisma.service';
import { ARTIFACT_PROFILE_KEYS, isArtifactProfile } from '../tts/artifact-profiles';

const APP_ROOT      = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const VOICES_ROOT   = path.join(APP_ROOT, 'data', '_voices');
// Scratch area for a clip that has been fetched/uploaded but not yet trimmed &
// committed to the library. Lives UNDER _voices but can never collide with a
// real voice slug (SLUG_RE forbids a leading underscore) and is never listed
// (the library list is DB-driven, not a filesystem scan).
const STAGING_ROOT   = path.join(VOICES_ROOT, '_staging');
// The ffmpeg the F5 worker already ships — reused here for trimming to WAV and
// for yt-dlp's audio extraction (passed as --ffmpeg-location).
const FFMPEG_BIN     = process.env.FFMPEG_BIN ?? path.join(APP_ROOT, 'bin', 'ffmpeg.exe');
const MAX_REF_BYTES  = 12 * 1024 * 1024;   // 12 MB — generous for a 15s clip
const MAX_SOURCE_BYTES = 200 * 1024 * 1024; // staging source (full, untrimmed clip) — generous
const MIN_TRIM_MS    = 300;                 // reject a degenerate selection
const MAX_TRIM_MS    = 60_000;              // keep refs sane (F5/XTTS want ~6–15s)
const ALLOWED_EXT    = new Set(['.wav', '.mp3', '.m4a', '.flac', '.ogg']);
const EXT_BY_MIME: Record<string, string> = {
  'audio/wav':   '.wav',
  'audio/x-wav': '.wav',
  'audio/mpeg':  '.mp3',
  'audio/mp4':   '.m4a',
  'audio/flac':  '.flac',
  'audio/ogg':   '.ogg',
};
/** Library slug guard — ASCII kebab/snake, 1–64 chars, must start alnum. */
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function pickAudioExt(originalName: string, mimetype: string): string {
  let ext = EXT_BY_MIME[mimetype];
  if (!ext) ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new BadRequestException(
      `Unsupported audio type "${mimetype}" / "${ext}". Allowed: ${[...ALLOWED_EXT].join(', ')}.`,
    );
  }
  return ext;
}

function slugify(raw: string): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'voice';
}

@Injectable()
export class VoiceoversService {
  constructor(private readonly prisma: PrismaService) {}

  /** Library list, each with the projects that reference it. */
  async list() {
    const rows = await this.prisma.voiceover.findMany({
      orderBy: { name: 'asc' },
      include: {
        projects: { select: { id: true, slug: true, name: true }, orderBy: { name: 'asc' } },
      },
    });
    return rows.map((v) => this.toDto(v));
  }

  async get(id: string) {
    const v = await this.prisma.voiceover.findUnique({ where: { id } });
    if (!v) throw new NotFoundException(`Voiceover ${id} not found`);
    return v;
  }

  /** Single voiceover with the list of projects it's assigned to (detail page). */
  async getWithProjects(id: string) {
    const v = await this.prisma.voiceover.findUnique({
      where:   { id },
      include: {
        projects: { select: { id: true, slug: true, name: true }, orderBy: { name: 'asc' } },
      },
    });
    if (!v) throw new NotFoundException(`Voiceover ${id} not found`);
    return this.toDto(v);
  }

  /** Shape a row (+ its projects) into the UI DTO. */
  private toDto(v: {
    id: string; slug: string; name: string; filePath: string; ext: string;
    bytes: number; checksum: string; sourceUrl: string | null; createdAt: Date;
    sourceFilePath: string | null; trimStartMs: number | null; trimEndMs: number | null;
    artifactProfile: string | null;
    projects: { id: string; slug: string; name: string }[];
  }) {
    return {
      id:            v.id,
      slug:          v.slug,
      name:          v.name,
      filePath:      v.filePath,
      ext:           v.ext,
      bytes:         v.bytes,
      checksum:      v.checksum,
      sourceUrl:     v.sourceUrl,
      // Whether the full source clip was retained on disk — drives the "re-trim"
      // UI on the detail page. Old voices / plain uploads have no source.
      hasSource:     !!v.sourceFilePath,
      trimStartMs:   v.trimStartMs,
      trimEndMs:     v.trimEndMs,
      // Which leading-bleed profile this voice needs; null = none, trimming off.
      artifactProfile: v.artifactProfile,
      assignedCount: v.projects.length,
      projects:      v.projects,
      createdAt:     v.createdAt,
    };
  }

  /** Absolute on-disk path for a voiceover row (handles abs or app-relative). */
  absPath(v: { filePath: string }): string {
    return path.isAbsolute(v.filePath) ? v.filePath : path.join(APP_ROOT, v.filePath);
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = slugify(base);
    if (!SLUG_RE.test(slug)) slug = 'voice';
    let candidate = slug;
    let n = 2;
    // Append -2, -3, … until free.
    while (await this.prisma.voiceover.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${n++}`.slice(0, 64);
    }
    return candidate;
  }

  /**
   * Add a clip to the shared library. Dedupes by md5: an identical file already
   * in the library is returned as-is (no duplicate row, no second copy on disk).
   * Otherwise writes data/_voices/<slug>/voice_reference.<ext> and inserts a row.
   */
  async createFromBuffer(
    buf: Buffer,
    originalName: string,
    mimetype: string,
    opts?: { name?: string; slug?: string; sourceUrl?: string },
  ) {
    if (!buf?.length) throw new BadRequestException('Empty file');
    if (buf.length > MAX_REF_BYTES) {
      throw new BadRequestException(`File too large (${buf.length} bytes); max ${MAX_REF_BYTES}`);
    }
    const ext      = pickAudioExt(originalName, mimetype);
    const checksum = createHash('md5').update(buf).digest('hex');

    // Dedup: same bytes already in the library → reuse it.
    const dup = await this.prisma.voiceover.findUnique({ where: { checksum } });
    if (dup) return dup;

    const slug = await this.uniqueSlug(opts?.slug || opts?.name || path.parse(originalName).name);
    const name = (opts?.name && opts.name.trim()) || slug;

    const dir = path.join(VOICES_ROOT, slug);
    mkdirSync(dir, { recursive: true });
    // One clip per voiceover dir: wipe any stale voice_reference.* first.
    for (const f of readdirSync(dir)) {
      if (f.startsWith('voice_reference.')) {
        try { unlinkSync(path.join(dir, f)); } catch { /* best-effort */ }
      }
    }
    const filename = `voice_reference${ext}`;
    writeFileSync(path.join(dir, filename), buf);
    const relativePath = path.posix.join('data', '_voices', slug, filename);

    return this.prisma.voiceover.create({
      data: {
        slug, name, filePath: relativePath, ext, bytes: buf.length, checksum,
        sourceUrl: normalizeUrl(opts?.sourceUrl),
      },
    });
  }

  /** Edit metadata (label, source link, bleed profile; slug moves the folder +
   *  repoints project mirrors). */
  async rename(
    id: string,
    body: { name?: string; slug?: string; sourceUrl?: string | null; artifactProfile?: string | null },
  ) {
    const v = await this.get(id);
    const data: {
      name?: string; slug?: string; filePath?: string; sourceUrl?: string | null;
      artifactProfile?: string | null;
    } = {};

    // Empty/absent = this voice does not bleed, so the trimmer stays off for it
    // (the safe default — see src/tts/artifact-profiles.ts).
    if (body.artifactProfile !== undefined) {
      const p = body.artifactProfile?.trim() || null;
      if (p !== null && !isArtifactProfile(p)) {
        throw new BadRequestException(
          `Unknown artifactProfile "${p}" — expected one of ${ARTIFACT_PROFILE_KEYS.join(', ')} or empty`,
        );
      }
      data.artifactProfile = p;
    }

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) throw new BadRequestException('name cannot be empty');
      data.name = name;
    }

    // Empty string clears the link; a non-empty value is validated as a URL.
    if (body.sourceUrl !== undefined) {
      data.sourceUrl = body.sourceUrl ? normalizeUrl(body.sourceUrl) : null;
    }

    if (body.slug !== undefined && slugify(body.slug) !== v.slug) {
      const newSlug = await this.uniqueSlug(body.slug);
      const oldDir  = path.dirname(this.absPath(v));
      const newDir  = path.join(VOICES_ROOT, newSlug);
      const filename    = `voice_reference${v.ext}`;
      const newRelative = path.posix.join('data', '_voices', newSlug, filename);
      // Move the folder, then repoint every project mirror to the new path.
      try {
        mkdirSync(VOICES_ROOT, { recursive: true });
        if (existsSync(oldDir)) renameSync(oldDir, newDir);
      } catch (e) {
        throw new BadRequestException(`Failed to move voice folder: ${(e as Error).message}`);
      }
      data.slug     = newSlug;
      data.filePath = newRelative;
      await this.prisma.project.updateMany({
        where: { ttsVoiceoverId: id },
        data:  { ttsVoiceRefPath: newRelative },
      });
    }

    return this.prisma.voiceover.update({ where: { id }, data });
  }

  /** Delete a library voice. Refuses while assigned unless force=true. */
  async remove(id: string, force = false) {
    const v = await this.prisma.voiceover.findUnique({
      where:   { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!v) throw new NotFoundException(`Voiceover ${id} not found`);
    if (v._count.projects > 0 && !force) {
      throw new ConflictException(
        `Voiceover "${v.slug}" is assigned to ${v._count.projects} project(s). ` +
        `Reassign them first, or pass ?force=true to unassign and delete.`,
      );
    }
    if (force && v._count.projects > 0) {
      await this.prisma.project.updateMany({
        where: { ttsVoiceoverId: id },
        data:  { ttsVoiceoverId: null, ttsVoiceRefPath: null },
      });
    }
    try { rmSync(path.dirname(this.absPath(v)), { recursive: true, force: true }); } catch { /* best-effort */ }
    await this.prisma.voiceover.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Assign a library voice to a project (or unassign with voiceoverId=null).
   * Mirrors the shared filePath into Project.ttsVoiceRefPath so the render and
   * gating code keep reading one field. NO file copy — the voice lives once.
   */
  async assignToProject(projectId: string, voiceoverId: string | null) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (!voiceoverId) {
      return this.prisma.project.update({
        where:  { id: projectId },
        data:   { ttsVoiceoverId: null, ttsVoiceRefPath: null },
        select: { id: true, slug: true, ttsEngine: true, ttsVoiceRefPath: true, ttsVoiceoverId: true },
      });
    }

    const v = await this.get(voiceoverId);
    return this.prisma.project.update({
      where:  { id: projectId },
      data:   { ttsVoiceoverId: v.id, ttsVoiceRefPath: v.filePath },
      select: { id: true, slug: true, ttsEngine: true, ttsVoiceRefPath: true, ttsVoiceoverId: true },
    });
  }

  /**
   * Set the EXACT list of projects assigned to this voiceover (from the voice
   * detail page). Projects newly in the list get this voice (+ mirrored path);
   * projects dropped from the list are unassigned (both fields nulled). Projects
   * not touched here keep whatever other voice they had. Returns the refreshed
   * detail DTO.
   */
  async setProjects(voiceoverId: string, projectIds: string[]) {
    const v = await this.get(voiceoverId);
    const want = new Set(projectIds);

    const current = await this.prisma.project.findMany({
      where:  { ttsVoiceoverId: voiceoverId },
      select: { id: true },
    });
    const have = new Set(current.map((p) => p.id));

    const toAdd    = [...want].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !want.has(id));

    if (toRemove.length) {
      await this.prisma.project.updateMany({
        where: { id: { in: toRemove } },
        data:  { ttsVoiceoverId: null, ttsVoiceRefPath: null },
      });
    }
    if (toAdd.length) {
      await this.prisma.project.updateMany({
        where: { id: { in: toAdd } },
        data:  { ttsVoiceoverId: v.id, ttsVoiceRefPath: v.filePath },
      });
    }
    return this.getWithProjects(voiceoverId);
  }

  // ── Import + trim (source → staging → trimmed library clip) ────────────────
  //
  // Flow: get a full source clip onto the server (from YouTube or an upload)
  // into data/_voices/_staging/<token>/, let the browser draw its waveform and
  // pick a [start,end] window, then commit — ffmpeg cuts the window to a mono
  // WAV that becomes the library clip, and the untrimmed source is kept next to
  // it so the selection can be re-cut later without re-fetching. Everything is
  // reached through the API; nothing here touches the DB out of band.

  /** Spawn a short-lived binary, capture stdout/stderr + exit code. */
  private spawnCapture(bin: string, argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const proc = spawn(bin, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      proc.stdout.on('data', (c: Buffer) => { stdout = (stdout + c.toString()).slice(-8000); });
      proc.stderr.on('data', (c: Buffer) => { stderr = (stderr + c.toString()).slice(-8000); });
      proc.on('error', (e) => resolve({ code: 1, stdout, stderr: stderr + String(e) }));
      proc.on('exit',  (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
  }

  /** Duration of any audio file, via ffmpeg's stderr banner. Null if unknown. */
  private async probeDurationMs(absPath: string): Promise<number | null> {
    const { stderr } = await this.spawnCapture(FFMPEG_BIN, ['-hide_banner', '-i', absPath]);
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
    if (!m) return null;
    return Math.round((Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000);
  }

  /** Cut [startMs,endMs] of `srcAbs` into a mono 16-bit WAV at `outAbs`. */
  private async ffmpegTrimToWav(srcAbs: string, startMs: number, endMs: number, outAbs: string): Promise<void> {
    if (!existsSync(FFMPEG_BIN)) throw new BadRequestException(`ffmpeg missing: ${FFMPEG_BIN}`);
    // Output-side -ss/-to = sample-accurate (decodes from 0, fine for short clips).
    const { code, stderr } = await this.spawnCapture(FFMPEG_BIN, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', srcAbs,
      '-ss', (startMs / 1000).toFixed(3),
      '-to', (endMs / 1000).toFixed(3),
      '-ac', '1', '-c:a', 'pcm_s16le',
      outAbs,
    ]);
    if (code !== 0 || !existsSync(outAbs)) {
      throw new BadRequestException(`ffmpeg trim failed: ${stderr.trim() || `exit ${code}`}`);
    }
  }

  /** Trim to a temp WAV in `dir`; return its bytes + md5 + temp path. Enforces
   *  the library size cap and cleans the temp up on overflow. Shared by
   *  saveFromStaging and retrim so the cut→size-guard→checksum step lives once. */
  private async trimToTempWav(
    srcAbs: string, startMs: number, endMs: number, dir: string, tmpName: string,
  ): Promise<{ buf: Buffer; checksum: string; tmpAbs: string }> {
    const tmpAbs = path.join(dir, tmpName);
    await this.ffmpegTrimToWav(srcAbs, startMs, endMs, tmpAbs);
    const buf = readFileSync(tmpAbs);
    if (buf.length > MAX_REF_BYTES) {
      try { unlinkSync(tmpAbs); } catch { /* best-effort */ }
      throw new BadRequestException(`Trimmed clip too large (${buf.length} bytes); shorten the selection`);
    }
    return { buf, checksum: createHash('md5').update(buf).digest('hex'), tmpAbs };
  }

  /** Clamp + validate a trim window; throws on a degenerate/oversized selection. */
  private validateWindow(startMs: unknown, endMs: unknown): { startMs: number; endMs: number } {
    const s = Math.max(0, Math.round(Number(startMs)));
    const e = Math.round(Number(endMs));
    if (!Number.isFinite(s) || !Number.isFinite(e)) throw new BadRequestException('startMs and endMs are required numbers');
    const len = e - s;
    if (len < MIN_TRIM_MS)  throw new BadRequestException(`Selection too short (${len}ms; min ${MIN_TRIM_MS}ms)`);
    if (len > MAX_TRIM_MS)  throw new BadRequestException(`Selection too long (${(len / 1000).toFixed(1)}s; max ${MAX_TRIM_MS / 1000}s)`);
    return { startMs: s, endMs: e };
  }

  /** Resolve+guard a staging dir (token is a uuid; blocks path traversal). */
  private stagingDir(token: string): string {
    if (!/^[0-9a-f-]{8,64}$/i.test(token ?? '')) throw new BadRequestException('Invalid source token');
    return path.join(STAGING_ROOT, token);
  }

  /** Locate the source.* clip inside a staging dir. */
  stagingSource(token: string): { absPath: string; ext: string } {
    const dir = this.stagingDir(token);
    if (!existsSync(dir)) throw new NotFoundException('Source expired or not found — fetch it again');
    const f = readdirSync(dir).find((x) => x.startsWith('source.'));
    if (!f) throw new NotFoundException('Source file missing');
    return { absPath: path.join(dir, f), ext: path.extname(f).toLowerCase() };
  }

  private readStagingMeta(token: string): { ext: string; sourceUrl: string | null; title: string } {
    try { return JSON.parse(readFileSync(path.join(this.stagingDir(token), 'meta.json'), 'utf8')); }
    catch { return { ext: '', sourceUrl: null, title: '' }; }
  }

  /** Drop a staging dir (on cancel or after a successful save). */
  async discardStaging(token: string) {
    try { rmSync(this.stagingDir(token), { recursive: true, force: true }); } catch { /* best-effort */ }
    return { ok: true as const };
  }

  /** Sweep orphaned staging dirs (user fetched a source then navigated away
   *  without saving/cancelling). Runs opportunistically when a new source is
   *  created — no background timer needed. */
  private sweepStaleStaging(maxAgeMs = 6 * 60 * 60 * 1000) {
    try {
      if (!existsSync(STAGING_ROOT)) return;
      const now = Date.now();
      for (const name of readdirSync(STAGING_ROOT)) {
        const p = path.join(STAGING_ROOT, name);
        try { if (now - statSync(p).mtimeMs > maxAgeMs) rmSync(p, { recursive: true, force: true }); }
        catch { /* best-effort */ }
      }
    } catch { /* best-effort */ }
  }

  /** Download the audio track of a YouTube URL into a fresh staging dir. */
  async createYoutubeSource(rawUrl: string) {
    this.sweepStaleStaging();
    const url = normalizeUrl(rawUrl);
    if (!url) throw new BadRequestException('url is required');
    if (!isYoutubeUrl(new URL(url))) {
      throw new BadRequestException('Only YouTube URLs are supported (youtube.com / youtu.be)');
    }
    const token = randomUUID();
    const dir = this.stagingDir(token);
    mkdirSync(dir, { recursive: true });
    try {
      const info: any = await youtubeDl(url, {
        dumpSingleJson: true, noPlaylist: true, noWarnings: true, ffmpegLocation: FFMPEG_BIN,
      });
      const title = String(info?.title ?? '').slice(0, 200);
      await youtubeDl(url, {
        extractAudio: true, audioFormat: 'mp3', audioQuality: 0,
        output: path.join(dir, 'source.%(ext)s'),
        noPlaylist: true, noWarnings: true, ffmpegLocation: FFMPEG_BIN,
      });
      const srcAbs = path.join(dir, 'source.mp3');
      if (!existsSync(srcAbs)) throw new Error('audio extraction produced no file');
      const durationSec = typeof info?.duration === 'number'
        ? info.duration
        : (await this.probeDurationMs(srcAbs).then((ms) => (ms != null ? ms / 1000 : null)));
      writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ ext: '.mp3', sourceUrl: url, title }));
      return { token, streamUrl: `/voiceovers/source/${token}/raw`, durationSec, title };
    } catch (e) {
      await this.discardStaging(token);
      throw new BadRequestException(`YouTube extraction failed: ${(e as Error).message.slice(0, 400)}`);
    }
  }

  /** Stash an uploaded clip as a source in a fresh staging dir. */
  async createUploadSource(buf: Buffer, originalName: string, mimetype: string) {
    this.sweepStaleStaging();
    if (!buf?.length) throw new BadRequestException('Empty file');
    if (buf.length > MAX_SOURCE_BYTES) {
      throw new BadRequestException(`File too large (${buf.length} bytes); max ${MAX_SOURCE_BYTES}`);
    }
    const ext = pickAudioExt(originalName, mimetype);
    const token = randomUUID();
    const dir = this.stagingDir(token);
    mkdirSync(dir, { recursive: true });
    const srcAbs = path.join(dir, `source${ext}`);
    writeFileSync(srcAbs, buf);
    const title = path.parse(originalName).name.slice(0, 200);
    const durationMs = await this.probeDurationMs(srcAbs);
    writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ ext, sourceUrl: null, title }));
    return {
      token, streamUrl: `/voiceovers/source/${token}/raw`,
      durationSec: durationMs != null ? durationMs / 1000 : null, title,
    };
  }

  /**
   * Commit a staged source at the chosen [startMs,endMs] window: cut it to a
   * mono WAV, keep the untrimmed source next to it, and create the library row.
   * Dedupe still applies to the trimmed bytes (identical clip → existing row).
   */
  async saveFromStaging(token: string, opts: { name?: string; startMs: number; endMs: number }) {
    const { absPath: srcAbs, ext: srcExt } = this.stagingSource(token);
    const meta = this.readStagingMeta(token);
    const { startMs, endMs } = this.validateWindow(opts.startMs, opts.endMs);

    const { buf, checksum } = await this.trimToTempWav(srcAbs, startMs, endMs, this.stagingDir(token), 'trimmed.wav');
    const dup = await this.prisma.voiceover.findUnique({ where: { checksum } });
    if (dup) { await this.discardStaging(token); return dup; }

    const slug = await this.uniqueSlug(opts?.name || meta.title || path.parse(srcAbs).name);
    const name = (opts?.name && opts.name.trim()) || meta.title || slug;

    const dir = path.join(VOICES_ROOT, slug);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) {                    // wipe any stale clip/source
      if (f.startsWith('voice_reference.') || f.startsWith('source.')) {
        try { unlinkSync(path.join(dir, f)); } catch { /* best-effort */ }
      }
    }
    writeFileSync(path.join(dir, 'voice_reference.wav'), buf);
    const sourceName = `source${srcExt}`;
    renameSync(srcAbs, path.join(dir, sourceName));        // move the untrimmed source in

    const row = await this.prisma.voiceover.create({
      data: {
        slug, name,
        filePath:       path.posix.join('data', '_voices', slug, 'voice_reference.wav'),
        ext:            '.wav',
        bytes:          buf.length,
        checksum,
        sourceUrl:      meta.sourceUrl ?? undefined,
        sourceFilePath: path.posix.join('data', '_voices', slug, sourceName),
        trimStartMs:    startMs,
        trimEndMs:      endMs,
      },
    });
    await this.discardStaging(token);
    return row;
  }

  /** Absolute path of a voiceover's retained source, or null if none. */
  sourceAbsPath(v: { sourceFilePath: string | null }): string | null {
    if (!v.sourceFilePath) return null;
    return path.isAbsolute(v.sourceFilePath) ? v.sourceFilePath : path.join(APP_ROOT, v.sourceFilePath);
  }

  /** Re-cut an existing library clip from its retained source at a new window. */
  async retrim(id: string, startMs: number, endMs: number) {
    const v = await this.get(id);
    const srcAbs = this.sourceAbsPath(v);
    if (!srcAbs)             throw new BadRequestException('This voice has no retained source to re-trim');
    if (!existsSync(srcAbs)) throw new BadRequestException(`Source missing on disk: ${v.sourceFilePath}`);
    const { startMs: s, endMs: e } = this.validateWindow(startMs, endMs);

    const dir = path.dirname(this.absPath(v));
    const { buf, checksum, tmpAbs } = await this.trimToTempWav(srcAbs, s, e, dir, 'voice_reference.retrim.wav');

    // Guard BEFORE touching the live clip: a checksum collision with ANOTHER
    // voice would make the DB update fail on the unique constraint. Bail now so
    // the current voice_reference.wav is never destroyed by a doomed re-trim.
    const clash = await this.prisma.voiceover.findUnique({ where: { checksum } });
    if (clash && clash.id !== id) {
      try { unlinkSync(tmpAbs); } catch { /* best-effort */ }
      throw new ConflictException('This exact clip already exists in the library (identical to another voice)');
    }

    // A new-flow voice always stores WAV, so filePath/ext are stable; still
    // clear any non-wav leftover defensively before swapping the file in.
    for (const f of readdirSync(dir)) {
      if (f.startsWith('voice_reference.') && f !== 'voice_reference.wav' && f !== 'voice_reference.retrim.wav') {
        try { unlinkSync(path.join(dir, f)); } catch { /* best-effort */ }
      }
    }
    renameSync(tmpAbs, path.join(dir, 'voice_reference.wav'));
    const filePath = path.posix.join('data', '_voices', v.slug, 'voice_reference.wav');
    if (filePath !== v.filePath) {                         // repoint project mirrors if the path moved
      await this.prisma.project.updateMany({ where: { ttsVoiceoverId: id }, data: { ttsVoiceRefPath: filePath } });
    }
    return this.prisma.voiceover.update({
      where: { id },
      data:  { filePath, ext: '.wav', bytes: buf.length, checksum, trimStartMs: s, trimEndMs: e },
    });
  }
}

/**
 * Validate/clean an optional provenance URL. Empty/whitespace → undefined (no
 * link stored). Anything non-empty must parse as an http(s) URL, else 400.
 */
function normalizeUrl(raw?: string): string | undefined {
  const s = (raw ?? '').trim();
  if (!s) return undefined;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new BadRequestException(`Invalid URL: ${s}`);
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new BadRequestException(`URL must be http(s): ${s}`);
  }
  return u.toString();
}

/** Restrict server-side fetching to YouTube hosts (SSRF guard for the import). */
function isYoutubeUrl(u: URL): boolean {
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  return h === 'youtube.com' || h.endsWith('.youtube.com') || h === 'youtu.be';
}
