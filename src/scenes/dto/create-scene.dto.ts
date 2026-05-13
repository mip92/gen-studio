import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSceneDto {
  @IsString()
  @IsNotEmpty()
  sceneKey: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  defaultReferenceProfileCode?: string;
}
