import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  // ── Prompt content fields. Required for any new project: every render
  //    pipeline (SDXL scene, Wan2.2 video) needs project-level fallbacks
  //    or the workflow can fall back only to the JSON-baked text, which
  //    defeats the multi-project data-driven architecture. See AGENTS.md §1, §6.
  @IsString()
  @IsNotEmpty()
  defaultNegative!: string;

  @IsString()
  @IsNotEmpty()
  defaultVideoNegative!: string;

  @IsString()
  @IsNotEmpty()
  defaultMotionPrompt!: string;

  @IsString()
  @IsNotEmpty()
  defaultStaticMotionPrompt!: string;

  /** Optional at creation — projects often start without a full script. */
  @IsOptional()
  @IsString()
  scriptText?: string;
}
