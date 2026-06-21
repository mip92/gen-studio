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

  /**
   * Visual style of this project. Drives workflow routing + LoRA pipeline +
   * style-block injection into shot prompts. References visual_styles.id.
   * Defaults to 'photoreal_cinematic' so projects created without explicit
   * style keep last_shift / night_courier behaviour.
   *
   * Today: 'photoreal_cinematic' | 'graphic_novel_cell_shaded'.
   * See docs/VISUAL_STYLE_ARCHITECTURE.md.
   */
  @IsOptional()
  @IsString()
  visualStyle?: string;

  /**
   * Published YouTube URL of the finished video. When set, the project is
   * marked DONE and /actions stops surfacing pipeline gates for it. Send an
   * empty string to clear it (back to "in production"). Optional everywhere.
   */
  @IsOptional()
  @IsString()
  youtubeUrl?: string;
}
