import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Repo root, same env override as the render services. Three levels up because
 *  this file compiles to dist/src/props/ (scene-render sits one level deeper). */
const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

class InstallPropAnchorDto {
  /** Shot whose render dir holds the candidate. */
  @IsString() shotId!: string;
  /** Bare candidate filename, e.g. `scene_A1_SH04_00003_.png`. */
  @IsString() filename!: string;
}

class CreatePropDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsString() description!: string;
  @IsOptional() @IsString() anchorPath?: string;
}

class UpdatePropDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() anchorPath?: string;
}

class AssignPropDto {
  /** Pass null/undefined to clear, prop UUID to assign. */
  @IsOptional() @IsString() propId?: string | null;
}

/**
 * Props (object anchors) CRUD — SEPARATE from characters. A Prop is a project-scoped
 * reusable description of a key STORY OBJECT (a brass token, a yellow scarf, a thermos,
 * tiles, beads…). Characters get anchors via CharacterProfile; objects get them here.
 *
 * Why this exists (user 2026-06-21): the renderer foregrounds people (they have
 * anchors) but loses small props — a macro of an object plus a 600-char location
 * description renders "just a room". A Prop is the object's own anchor: on a
 * prop-hero shot (Shot.propId set) the renderer makes the object dominate the frame
 * and drops the heavy location, so the object actually gets drawn.
 *
 * Mirrors LocationsController: uses $queryRaw so no Prisma client regeneration is
 * needed — the `props` table and `shots.propId` column already exist in PostgreSQL.
 */
@ApiTags('Props')
@Controller()
export class PropsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('projects/:projectId/props')
  @ApiOperation({ summary: 'List props (object anchors) for a project' })
  async listForProject(@Param('projectId') projectId: string) {
    return this.prisma.$queryRaw<Array<any>>`
      SELECT id, "projectId", code, name, description, "anchorPath", "createdAt", "updatedAt"
      FROM props WHERE "projectId" = ${projectId} ORDER BY code ASC
    `;
  }

  @Post('projects/:projectId/props')
  @ApiOperation({ summary: 'Create a prop for a project' })
  async create(@Param('projectId') projectId: string, @Body() dto: CreatePropDto) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      INSERT INTO props (id, "projectId", code, name, description, "anchorPath", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${projectId}, ${dto.code}, ${dto.name}, ${dto.description}, ${dto.anchorPath ?? null}, now(), now())
      RETURNING id, "projectId", code, name, description, "anchorPath", "createdAt", "updatedAt"
    `;
    return rows[0];
  }

  @Get('props/:id')
  @ApiOperation({ summary: 'Get a prop by id' })
  async getOne(@Param('id') id: string) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, "projectId", code, name, description, "anchorPath", "createdAt", "updatedAt"
      FROM props WHERE id = ${id}
    `;
    if (rows.length === 0) throw new NotFoundException(`Prop ${id} not found`);
    return rows[0];
  }

  @Patch('props/:id')
  @ApiOperation({ summary: 'Update a prop' })
  async update(@Param('id') id: string, @Body() dto: UpdatePropDto) {
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (dto.code        !== undefined) { sets.push(`code = $${i++}`);          values.push(dto.code); }
    if (dto.name        !== undefined) { sets.push(`name = $${i++}`);          values.push(dto.name); }
    if (dto.description !== undefined) { sets.push(`description = $${i++}`);   values.push(dto.description); }
    if (dto.anchorPath  !== undefined) { sets.push(`"anchorPath" = $${i++}`);  values.push(dto.anchorPath); }
    if (sets.length === 0) return this.getOne(id);
    sets.push(`"updatedAt" = now()`);
    values.push(id);
    const sql = `UPDATE props SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, "projectId", code, name, description, "anchorPath", "createdAt", "updatedAt"`;
    const rows = await this.prisma.$queryRawUnsafe<Array<any>>(sql, ...values);
    if (rows.length === 0) throw new NotFoundException(`Prop ${id} not found`);
    return rows[0];
  }

  @Delete('props/:id')
  @ApiOperation({ summary: 'Delete a prop (shots referencing it lose their tag)' })
  async remove(@Param('id') id: string) {
    await this.prisma.$queryRaw`UPDATE shots SET "propId" = NULL WHERE "propId" = ${id}`;
    await this.prisma.$queryRaw`DELETE FROM props WHERE id = ${id}`;
    return { id, deleted: true };
  }

  /**
   * Install one of a shot's rendered candidates as this prop's anchor PNG.
   *
   * This is how an object gets locked visually: a described object is reinvented
   * by the model on every render, so the only way to have "the same car" in
   * twenty shots is to show it the same pixels. Render a few frames, pick the
   * one where the object came out right, install it here — from then on
   * scene-render attaches it as an extra `Picture N` reference on every shot
   * tagged with this prop (see stagePropAnchor / SceneJobParams.objectReferenceLabel).
   *
   * The source is a file already on disk under the shot's render dir; nothing is
   * generated here, so this endpoint never touches ComfyUI or the queue.
   */
  @Post('props/:id/anchor/from-render')
  @ApiOperation({ summary: "Install a shot's rendered candidate as this prop's anchor image" })
  async installAnchorFromRender(@Param('id') id: string, @Body() dto: InstallPropAnchorDto) {
    const propRows = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, "projectId", code FROM props WHERE id = ${id}
    `;
    const prop = propRows[0];
    if (!prop) throw new NotFoundException(`Prop ${id} not found`);

    const shotRows = await this.prisma.$queryRaw<Array<any>>`
      SELECT sh."shotCode", pr.slug AS "projectSlug", pr.id AS "projectId"
      FROM shots sh JOIN projects pr ON pr.id = sh."projectId"
      WHERE sh.id = ${dto.shotId}
    `;
    const shot = shotRows[0];
    if (!shot) throw new NotFoundException(`Shot ${dto.shotId} not found`);
    if (shot.projectId !== prop.projectId) {
      throw new BadRequestException('Shot and prop belong to different projects');
    }
    // Reject path traversal — the filename must be a bare candidate name.
    if (!/^[A-Za-z0-9._-]+\.png$/.test(dto.filename)) {
      throw new BadRequestException(`filename must be a plain .png candidate name, got "${dto.filename}"`);
    }

    const src = path.join(APP_ROOT, 'data', shot.projectSlug, 'shots', shot.shotCode, dto.filename);
    if (!existsSync(src)) throw new NotFoundException(`Render not found on disk: ${src}`);

    const destDir  = path.join(APP_ROOT, 'data', shot.projectSlug, 'reference');
    const destName = `OBJ_${prop.code}_anchor.png`;
    mkdirSync(destDir, { recursive: true });
    copyFileSync(src, path.join(destDir, destName));

    // Stored RELATIVE to APP_ROOT so the row survives a move of the install dir.
    const relPath = ['data', shot.projectSlug, 'reference', destName].join('/');
    const rows = await this.prisma.$queryRaw<Array<any>>`
      UPDATE props SET "anchorPath" = ${relPath}, "updatedAt" = now()
      WHERE id = ${id}
      RETURNING id, "projectId", code, name, description, "anchorPath", "updatedAt"
    `;
    return rows[0];
  }

  @Delete('props/:id/anchor')
  @ApiOperation({ summary: "Clear a prop's anchor image (the object falls back to text-only)" })
  async clearAnchor(@Param('id') id: string) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      UPDATE props SET "anchorPath" = NULL, "updatedAt" = now()
      WHERE id = ${id}
      RETURNING id, code, "anchorPath"
    `;
    if (rows.length === 0) throw new NotFoundException(`Prop ${id} not found`);
    return rows[0];
  }

  @Patch('shots/:shotId/prop')
  @ApiOperation({ summary: "Assign or clear a shot's prop (object-hero shot)" })
  async assignToShot(@Param('shotId') shotId: string, @Body() dto: AssignPropDto) {
    const propId = dto.propId ?? null;
    const rows = await this.prisma.$queryRaw<Array<any>>`
      UPDATE shots SET "propId" = ${propId}, "updatedAt" = now()
      WHERE id = ${shotId}
      RETURNING id, "shotCode", "propId"
    `;
    if (rows.length === 0) throw new NotFoundException(`Shot ${shotId} not found`);
    return rows[0];
  }
}
