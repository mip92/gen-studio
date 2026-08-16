import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsUUID, IsIn } from 'class-validator';

export class CreateShotDto {
  @IsString()
  @IsNotEmpty()
  shotCode: string;

  @IsUUID()
  @IsNotEmpty()
  sceneId: string;

  @IsObject()
  @IsOptional()
  promptFields?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  workflowRouteKey?: string;

  @IsString()
  @IsOptional()
  referenceProfileId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  referenceImagePool?: string[];

  /** FK to a Location row (locations.id). Renderer prepends location.description. */
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  /** Final-cut render mode. "animated" (default) = Wan i2v clip + FHD upscale;
   *  "static" = ship the still PNG only, animated with Ken Burns at CapCut
   *  export. See Shot.renderMode in schema.prisma. */
  @IsOptional()
  @IsIn(['animated', 'static'])
  renderMode?: string;

  /** Which i2v flow this shot animates on — 'i2v' (one pinned frame) or 'flf2v'
   *  (first AND last frame pinned). null/absent = inherit the act, then the
   *  project. See Shot.videoFlow in schema.prisma. */
  @IsOptional()
  @IsIn(['i2v', 'flf2v'])
  videoFlow?: string | null;

  /** Qwen-Image-Edit instruction that turns this shot's chosen still into its
   *  END frame: ONLY what is different a few seconds later. */
  @IsOptional()
  @IsString()
  endFramePrompt?: string | null;
}
