import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsUUID } from 'class-validator';

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
}
