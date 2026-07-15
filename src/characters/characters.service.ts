import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { scanLoraVariants, loraOutputName, LoraVariant } from '../training/lora-variants.util';
import { loraOutputDirFor } from '../training/character-paths.util';
import { DatasetService } from '../training/dataset.service';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const COMFY_MODELS = process.env.COMFY_MODELS ?? 'E:\\ComfyUI\\models';

interface CreateCharacterWithProfile extends CreateCharacterDto {
  /** Optional initial profile to create alongside the character. */
  profile?: CreateProfileDto;
}

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly dataset: DatasetService,
  ) {}

  /**
   * Returns the per-profile readiness summary the character pages need.
   * Same shape as one element of the project dashboard's `profiles` array,
   * but scoped to a single profile and **completely project-independent** —
   * persona pages don't need to know which projects (if any) attached the
   * character.
   */
  async profileSummary(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where: { id: profileId },
      include: {
        character:    true,
        datasetJobs:  { orderBy: { queuedAt:  'desc' }, take: 1 },
        trainingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const images       = this.dataset.listImages(profile.profileCode);
    const lastDsJob    = profile.datasetJobs[0]    ?? null;
    const lastTrainJob = profile.trainingJobs[0]   ?? null;
    const loraReady    = !!profile.loraPath && existsSync(profile.loraPath);

    let phase: 'idle' | 'queued' | 'generating' | 'has_dataset' | 'training' | 'ready' = 'idle';
    if (loraReady)                                                                phase = 'ready';
    else if (lastTrainJob && lastTrainJob.status === 'training')                  phase = 'training';
    else if (lastTrainJob && lastTrainJob.status === 'preparing')                 phase = 'training';
    else if (lastTrainJob && lastTrainJob.status === 'captioning')                phase = 'training';
    else if (lastDsJob && (lastDsJob.status === 'pending' || lastDsJob.status === 'blocked')) phase = 'queued';
    else if (lastDsJob && lastDsJob.status === 'running')                         phase = 'generating';
    else if (images.length > 0)                                                   phase = 'has_dataset';

    return {
      profileId:     profile.id,
      characterId:   profile.characterId,
      characterCode: profile.character.code,
      displayName:   profile.character.displayName,
      profileCode:   profile.profileCode,
      ageLabel:      profile.ageLabel,
      targetImages:  profile.targetImages,
      triggerToken:  profile.triggerToken,
      datasetCount:  images.length,
      loraReady,
      loraPath:      profile.loraPath,
      loraSizeMB:    loraReady ? Math.round(statSync(profile.loraPath!).size / 1_000_000) : null,
      phase,
      lastDatasetJob: lastDsJob && {
        id: lastDsJob.id, status: lastDsJob.status,
        dependsOnProfileId: lastDsJob.dependsOnProfileId,
        referenceProfileId: lastDsJob.referenceProfileId,
        error: lastDsJob.errorMessage,
        queuedAt: lastDsJob.queuedAt,
      },
      lastTrainingJob: lastTrainJob && {
        id: lastTrainJob.id, status: lastTrainJob.status,
        error: lastTrainJob.errorMessage,
        startedAt: lastTrainJob.startedAt,
        completedAt: lastTrainJob.completedAt,
      },
    };
  }

  // ── Characters ──────────────────────────────────────────────────────────

  /**
   * List characters attached to a project. Reads through `project_characters`
   * (the M:N join introduced in the character library refactor) so library
   * characters attached via /attach show up alongside the legacy ones that
   * have `Character.projectId` set. After the Phase 1 migration every existing
   * row has a join entry, so the result matches the pre-refactor behaviour.
   */
  findAll(projectIdOrSlug: string) {
    return this.prisma.character.findMany({
      where: {
        projectLinks: {
          some: {
            project: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
          },
        },
      },
      include: { profiles: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a character bound to a specific project (legacy behaviour). Sets
   * both `Character.projectId` AND inserts a `project_characters` join row so
   * the new library-aware queries see it. Optionally creates a first profile.
   */
  async create(projectIdOrSlug: string, data: CreateCharacterWithProfile) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    const dup = await this.prisma.character.findFirst({
      where: { projectId: project.id, code: data.code },
    });
    if (dup) throw new BadRequestException(`Character code "${data.code}" already exists in project`);

    return this.prisma.character.create({
      data: {
        projectId:   project.id,
        code:        data.code,
        displayName: data.displayName,
        projectLinks: { create: [{ projectId: project.id }] },
        profiles: data.profile ? {
          create: [{
            profileCode:   data.profile.profileCode,
            promptBase:    data.profile.promptBase,
            negative:      data.profile.negative,
            ageLabel:      data.profile.ageLabel,
            targetImages:  data.profile.targetImages ?? 60,
            promptAngles:  data.profile.promptAngles,
            promptVariety: data.profile.promptVariety,
            triggerToken:  data.profile.triggerToken,
          }],
        } : undefined,
      },
      include: { profiles: true, projectLinks: true },
    });
  }

  // ── Library (project-independent) ───────────────────────────────────────

  /**
   * Create a character in the global library (no `projectId`). The character
   * starts unattached; callers can `attach` it to any number of projects.
   * Library codes have their own partial unique index so two library chars
   * can't share a `code` even though project-bound rows reuse the same scope.
   */
  async createLibrary(data: CreateCharacterWithProfile) {
    const dup = await this.prisma.character.findFirst({
      where: { projectId: null, code: data.code },
    });
    if (dup) throw new BadRequestException(`Library character code "${data.code}" already exists`);

    return this.prisma.character.create({
      data: {
        projectId:   null,
        code:        data.code,
        displayName: data.displayName,
        profiles: data.profile ? {
          create: [{
            profileCode:   data.profile.profileCode,
            promptBase:    data.profile.promptBase,
            negative:      data.profile.negative,
            ageLabel:      data.profile.ageLabel,
            targetImages:  data.profile.targetImages ?? 60,
            promptAngles:  data.profile.promptAngles,
            promptVariety: data.profile.promptVariety,
            triggerToken:  data.profile.triggerToken,
          }],
        } : undefined,
      },
      include: { profiles: true },
    });
  }

  /**
   * List every character in the system. Each row carries its `attachedProjects`
   * so the picker UI can show "in 3 projects" / "library only".
   */
  async listLibrary() {
    return this.prisma.character.findMany({
      include: {
        profiles:     true,
        // visualStyle exposed so UI character cards can pick the right
        // identity-pipeline badge (LoRA for photoreal, anchor for cartoon)
        projectLinks: { include: { project: { select: { id: true, slug: true, name: true, visualStyle: true } } } },
      },
      // Newest first (user 2026-07-04) — freshly created characters surface at
      // the top of the /characters grid instead of drowning in the code sort.
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Paginated library list for the infinite-scroll /characters grid. Returns
   *  one page of characters (same row shape as listLibrary) + the total count,
   *  so the client knows when to stop loading. */
  async listLibraryPage(skip = 0, take = 24) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.character.findMany({
        include: {
          profiles:     true,
          projectLinks: { include: { project: { select: { id: true, slug: true, name: true, visualStyle: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.character.count(),
    ]);
    return { rows, total };
  }

  /**
   * Attach an existing character (library or already in other projects) to a
   * project. Idempotent — re-attaching is a no-op.
   */
  async attach(projectIdOrSlug: string, characterId: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    await this.prisma.projectCharacter.upsert({
      where:  { projectId_characterId: { projectId: project.id, characterId } },
      create: { projectId: project.id, characterId },
      update: {},
    });

    return { projectId: project.id, characterId, code: character.code };
  }

  /**
   * Detach a character from a project. Removes only the `project_characters`
   * row — the character itself stays in the library and remains attached to
   * its other projects. Use `remove` for full deletion.
   */
  async detach(projectIdOrSlug: string, characterId: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${projectIdOrSlug}" not found`);

    await this.prisma.projectCharacter.deleteMany({
      where: { projectId: project.id, characterId },
    });

    return { projectId: project.id, characterId };
  }

  async addProfile(characterId: string, dto: CreateProfileDto) {
    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const dup = await this.prisma.characterProfile.findFirst({
      where: { characterId, profileCode: dto.profileCode },
    });
    if (dup) throw new BadRequestException(`Profile code "${dto.profileCode}" already exists for this character`);

    return this.prisma.characterProfile.create({
      data: {
        characterId,
        profileCode:   dto.profileCode,
        promptBase:    dto.promptBase,
        negative:      dto.negative,
        ageLabel:      dto.ageLabel,
        targetImages:  dto.targetImages ?? 60,
        promptAngles:  dto.promptAngles,
        promptVariety: dto.promptVariety,
        triggerToken:  dto.triggerToken,
      },
    });
  }

  async findOne(projectIdOrSlug: string, characterId: string) {
    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        projectLinks: {
          some: { project: { OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }] } },
        },
      },
      include: { profiles: true },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    return character;
  }

  /** Library lookup by character id (project scope independent). */
  async findOneById(characterId: string) {
    const character = await this.prisma.character.findUnique({
      where:   { id: characterId },
      include: {
        profiles:     true,
        // visualStyle exposed so UI character cards can pick the right
        // identity-pipeline badge (LoRA for photoreal, anchor for cartoon)
        projectLinks: { include: { project: { select: { id: true, slug: true, name: true, visualStyle: true } } } },
      },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    return character;
  }

  /**
   * Returns usage info for a character so the frontend can show "warning,
   * this is referenced in N shots" before delete.
   */
  async getUsage(characterId: string) {
    const character = await this.prisma.character.findUnique({
      where:   { id: characterId },
      include: { profiles: true, project: true },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const participantCount = await this.prisma.shotParticipant.count({
      where: { characterId },
    });
    const shotIds = await this.prisma.shotParticipant.findMany({
      where:  { characterId },
      select: { shotId: true },
      distinct: ['shotId'],
    });
    const shots = await this.prisma.shot.findMany({
      where:   { id: { in: shotIds.map((x) => x.shotId) } },
      select:  { id: true, shotCode: true, sceneId: true },
    });
    const sceneIds = [...new Set(shots.map((s) => s.sceneId))];

    return {
      character: {
        id:          character.id,
        code:        character.code,
        displayName: character.displayName,
      },
      profileCount:     character.profiles.length,
      participantCount,
      shotCount:        shots.length,
      sceneCount:       sceneIds.length,
      shots,
    };
  }

  /**
   * Hard-delete a character with full cleanup:
   *  - Deletes all ShotParticipant rows referencing this character
   *  - Deletes all CharacterProfile rows (cascades DatasetJob, TrainingJob)
   *  - Deletes the Character row
   *  - Removes filesystem artifacts: dataset folders, reference images, LoRA files,
   *    and ComfyUI output images keyed by profileCode prefix.
   */
  async remove(projectId: string, characterId: string) {
    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [{ projectId }, { project: { slug: projectId } }],
      },
      include: { profiles: true, project: true },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    if (!character.project) {
      throw new BadRequestException(
        `Character ${character.code} has no creator project (library character). Use DELETE /library/characters/${characterId} once Phase 2 library deletion lands.`,
      );
    }

    const slug = character.project.slug;
    const profileCodes = character.profiles.map((p) => p.profileCode);

    // 1. DB cleanup in a transaction (cascade handles datasetJobs, trainingJobs)
    await this.prisma.$transaction(async (tx) => {
      await tx.shotParticipant.deleteMany({ where: { characterId } });
      await tx.character.delete({ where: { id: characterId } });
    });

    // 2. Filesystem cleanup (best effort — failures here don't undo DB delete)
    const removed: string[] = [];
    for (const code of profileCodes) {
      // Dataset folder: data/<slug>/datasets/<profileCode>
      const datasetDir = path.join(APP_ROOT, 'data', slug, 'datasets', code);
      if (existsSync(datasetDir)) {
        try { rmSync(datasetDir, { recursive: true, force: true }); removed.push(datasetDir); }
        catch (e: any) { this.logger.warn(`Could not remove ${datasetDir}: ${e.message}`); }
      }

      // Reference image: data/<slug>/reference/<profileCode>
      const refDir = path.join(APP_ROOT, 'data', slug, 'reference', code);
      if (existsSync(refDir)) {
        try { rmSync(refDir, { recursive: true, force: true }); removed.push(refDir); }
        catch (e: any) { this.logger.warn(`Could not remove ${refDir}: ${e.message}`); }
      }

      // LoRA files: ComfyUI/models/loras/gen-studio/<slug>/<profileCode>*.safetensors
      const loraDir = path.join(COMFY_MODELS, 'loras', 'gen-studio', slug);
      if (existsSync(loraDir)) {
        for (const f of readdirSync(loraDir)) {
          if (f.startsWith(code) && (f.endsWith('.safetensors') || f.endsWith('.pt'))) {
            const full = path.join(loraDir, f);
            try { unlinkSync(full); removed.push(full); }
            catch (e: any) { this.logger.warn(`Could not remove ${full}: ${e.message}`); }
          }
        }
      }

      // Generated images in COMFY_OUTPUT: <profileCode>*.png|jpg|webp
      if (existsSync(COMFY_OUTPUT)) {
        for (const f of readdirSync(COMFY_OUTPUT)) {
          if (!f.startsWith(code)) continue;
          const ext = path.extname(f).toLowerCase();
          if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
          const full = path.join(COMFY_OUTPUT, f);
          try {
            const st = statSync(full);
            if (st.isFile()) { unlinkSync(full); removed.push(full); }
          } catch (e: any) {
            this.logger.warn(`Could not remove ${full}: ${e.message}`);
          }
        }
      }
    }

    this.logger.log(`Deleted character "${character.code}" + ${removed.length} files/dirs`);
    return {
      deleted: {
        characterId,
        code: character.code,
        profileCodes,
      },
      filesRemoved: removed.length,
      paths:        removed,
    };
  }

  // ── Profiles ─────────────────────────────────────────────────────────────

  findAllProfiles(characterId: string) {
    return this.prisma.characterProfile.findMany({
      where: { characterId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneProfile(characterId: string, profileId: string) {
    const profile = await this.prisma.characterProfile.findFirst({
      where: { id: profileId, characterId },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    return profile;
  }

  /** Standalone lookup by profileId only — for the frontend detail page.
   * Returns the character's legacy "creator project" AND the live
   * `projectLinks` (M:N attachments) so the UI can pick a project context
   * even for library-only characters where `character.projectId` is null.
   * Both project shapes are projected to (id, slug, name) only — `scriptText`
   * and other heavy fields stay on the project endpoint where they belong. */
  async findProfileById(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: {
        character: {
          include: {
            project:      { select: { id: true, slug: true, name: true } },
            projectLinks: {
              include: { project: { select: { id: true, slug: true, name: true } } },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    return profile;
  }

  async updateProfile(profileId: string, data: Record<string, unknown>) {
    await this.findProfileById(profileId);
    return this.prisma.characterProfile.update({ where: { id: profileId }, data });
  }

  async removeProfile(characterId: string, profileId: string) {
    await this.findOneProfile(characterId, profileId);
    return this.prisma.characterProfile.delete({ where: { id: profileId } });
  }

  // ── LoRA library ─────────────────────────────────────────────────────────

  /**
   * Rescan the LoRA output dir for this profile, reconcile with `loraVariants`
   * in the DB, and return the up-to-date list. Picks up files that appeared
   * (extra training runs, manual copies) or disappeared since training ended.
   */
  async listLoras(profileId: string): Promise<{ active: string | null; variants: LoraVariant[] }> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    // Phase 2: library characters resolve their LoRA dir via the path helper
    // (models/loras/gen-studio/_characters/<charCode>/) instead of the legacy
    // project-bound path.
    const outDir = loraOutputDirFor(profile);
    const variants = scanLoraVariants(outDir, loraOutputName(profile.profileCode));

    // Refresh the cached list. If the active path no longer exists on disk,
    // null it out so the UI doesn't keep claiming a missing LoRA is ready.
    const stillActive = profile.loraPath && variants.some((v) => v.fullPath === profile.loraPath)
      ? profile.loraPath
      : null;

    if (
      stillActive !== profile.loraPath
      || JSON.stringify(profile.loraVariants ?? []) !== JSON.stringify(variants)
    ) {
      await this.prisma.characterProfile.update({
        where: { id: profileId },
        data:  { loraPath: stillActive, loraVariants: variants as any },
      });
    }

    return { active: stillActive, variants };
  }

  /**
   * Pick one variant as the active LoRA for this profile (used by scene
   * rendering as the default). Filename must match a variant on disk.
   */
  async setActiveLora(profileId: string, filename: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const outDir = loraOutputDirFor(profile);
    const variants = scanLoraVariants(outDir, loraOutputName(profile.profileCode));
    const target = variants.find((v) => v.filename === filename);
    if (!target) throw new NotFoundException(`LoRA file "${filename}" not found in ${outDir}`);

    return this.prisma.characterProfile.update({
      where: { id: profileId },
      data:  { loraPath: target.fullPath, loraVariants: variants as any },
      include: { character: { include: { project: true } } },
    });
  }

  /**
   * Delete a single LoRA variant from disk. If it was the active one, repoint
   * to the most recent remaining variant (final → highest epoch → null).
   */
  async deleteLora(profileId: string, filename: string): Promise<{ deleted: string; variants: LoraVariant[] }> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const dir  = loraOutputDirFor(profile);
    const variants = scanLoraVariants(dir, loraOutputName(profile.profileCode));
    const target = variants.find((v) => v.filename === filename);
    if (!target) throw new NotFoundException(`LoRA file "${filename}" not found in ${dir}`);

    // Refuse paths that escaped the profile's output dir — defensive against
    // a future bug or hand-crafted DB row.
    const resolved = path.resolve(target.fullPath);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
      throw new BadRequestException(`Refusing to delete file outside ${dir}`);
    }

    try { unlinkSync(resolved); }
    catch (e: any) { throw new BadRequestException(`Could not delete file: ${e.message}`); }

    const remaining = scanLoraVariants(dir, loraOutputName(profile.profileCode));

    // If the deleted file was active, repoint to the next-best (prefer final,
    // else highest epoch). Null if nothing remains.
    let newActive = profile.loraPath;
    if (newActive === target.fullPath) {
      const finalV = remaining.find((v) => v.epoch === null);
      const lastEpoch = [...remaining].reverse().find((v) => v.epoch !== null);
      newActive = (finalV ?? lastEpoch)?.fullPath ?? null;
    }

    await this.prisma.characterProfile.update({
      where: { id: profileId },
      data:  { loraPath: newActive, loraVariants: remaining as any },
    });

    return { deleted: filename, variants: remaining };
  }
}
