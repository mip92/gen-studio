import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const APP_ROOT      = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const VOICES_ROOT   = path.join(APP_ROOT, 'data', '_voices');
const MAX_REF_BYTES  = 12 * 1024 * 1024;   // 12 MB — generous for a 15s clip
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

  /** Edit metadata (label, source link; slug move folder + repoint project mirrors). */
  async rename(id: string, body: { name?: string; slug?: string; sourceUrl?: string | null }) {
    const v = await this.get(id);
    const data: { name?: string; slug?: string; filePath?: string; sourceUrl?: string | null } = {};

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
