import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { scanLoraVariants, loraOutputDir, loraOutputName, LoraVariant } from '../training/lora-variants.util';

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

  constructor(private readonly prisma: PrismaService) {}

  // ── Characters ──────────────────────────────────────────────────────────

  findAll(projectId: string) {
    return this.prisma.character.findMany({
      where: { OR: [{ projectId }, { project: { slug: projectId } }] },
      include: { profiles: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a character. Accepts project id OR slug as the first arg.
   * Optionally creates a first profile in the same transaction.
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

  async findOne(projectId: string, characterId: string) {
    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [{ projectId }, { project: { slug: projectId } }],
      },
      include: { profiles: true },
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

  /** Standalone lookup by profileId only — for the frontend detail page. */
  async findProfileById(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { project: true } } },
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

    const slug = profile.character.project.slug;
    const variants = scanLoraVariants(loraOutputDir(slug), loraOutputName(profile.profileCode));

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

    const slug = profile.character.project.slug;
    const variants = scanLoraVariants(loraOutputDir(slug), loraOutputName(profile.profileCode));
    const target = variants.find((v) => v.filename === filename);
    if (!target) throw new NotFoundException(`LoRA file "${filename}" not found in ${loraOutputDir(slug)}`);

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

    const slug = profile.character.project.slug;
    const dir  = loraOutputDir(slug);
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
