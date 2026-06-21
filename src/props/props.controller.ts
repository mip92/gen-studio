import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

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
