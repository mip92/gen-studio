import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateLocationDto {
  @IsString() slug!: string;
  @IsString() name!: string;
  @IsString() description!: string;
}

class UpdateLocationDto {
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
}

class AssignLocationDto {
  /** Pass null/undefined to clear, UUID to assign. */
  @IsOptional() @IsUUID() locationId?: string | null;
}

/**
 * Locations CRUD. Locations are project-scoped reusable settings (train kupe,
 * platform, snow field, etc.). When a shot has its `locationId` set, the
 * SceneRenderService prepends the location's `description` to the shot's
 * positive at render time. Editing the description here updates every shot
 * tagged with this location.
 *
 * Uses $queryRaw to avoid requiring Prisma client regeneration in the running
 * dev server — the underlying table is already in PostgreSQL.
 */
@ApiTags('Locations')
@Controller()
export class LocationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('projects/:projectId/locations')
  @ApiOperation({ summary: 'List locations for a project' })
  async listForProject(@Param('projectId') projectId: string) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, "projectId", slug, name, description, "createdAt", "updatedAt"
      FROM locations
      WHERE "projectId" = ${projectId}
      ORDER BY slug ASC
    `;
    return rows;
  }

  @Post('projects/:projectId/locations')
  @ApiOperation({ summary: 'Create a location for a project' })
  async create(@Param('projectId') projectId: string, @Body() dto: CreateLocationDto) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      INSERT INTO locations (id, "projectId", slug, name, description, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${projectId}, ${dto.slug}, ${dto.name}, ${dto.description}, now(), now())
      RETURNING id, "projectId", slug, name, description, "createdAt", "updatedAt"
    `;
    return rows[0];
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get a location by id' })
  async getOne(@Param('id') id: string) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, "projectId", slug, name, description, "createdAt", "updatedAt"
      FROM locations WHERE id = ${id}
    `;
    if (rows.length === 0) throw new NotFoundException(`Location ${id} not found`);
    return rows[0];
  }

  @Patch('locations/:id')
  @ApiOperation({ summary: 'Update a location' })
  async update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    // Only update fields that were sent. Build the SET clause dynamically.
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (dto.slug        !== undefined) { sets.push(`slug = $${i++}`);        values.push(dto.slug); }
    if (dto.name        !== undefined) { sets.push(`name = $${i++}`);        values.push(dto.name); }
    if (dto.description !== undefined) { sets.push(`description = $${i++}`); values.push(dto.description); }
    if (sets.length === 0) return this.getOne(id);
    sets.push(`"updatedAt" = now()`);
    values.push(id);
    const sql = `UPDATE locations SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, "projectId", slug, name, description, "createdAt", "updatedAt"`;
    const rows = await this.prisma.$queryRawUnsafe<Array<any>>(sql, ...values);
    if (rows.length === 0) throw new NotFoundException(`Location ${id} not found`);
    return rows[0];
  }

  @Delete('locations/:id')
  @ApiOperation({ summary: 'Delete a location (shots referencing it lose their tag)' })
  async remove(@Param('id') id: string) {
    await this.prisma.$queryRaw`DELETE FROM locations WHERE id = ${id}`;
    return { id, deleted: true };
  }

  @Patch('shots/:shotId/location')
  @ApiOperation({ summary: 'Assign or clear a shot\'s location' })
  async assignToShot(@Param('shotId') shotId: string, @Body() dto: AssignLocationDto) {
    const locationId = dto.locationId ?? null;
    const rows = await this.prisma.$queryRaw<Array<any>>`
      UPDATE shots SET "locationId" = ${locationId}, "updatedAt" = now()
      WHERE id = ${shotId}
      RETURNING id, "shotCode", "locationId"
    `;
    if (rows.length === 0) throw new NotFoundException(`Shot ${shotId} not found`);
    return rows[0];
  }
}
