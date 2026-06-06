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
}
