import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn, Min } from 'class-validator';

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

  /** Override of the project's i2v flow for every shot in this act — 'i2v' or
   *  'flf2v'. null/absent = inherit the project. */
  @IsOptional()
  @IsIn(['i2v', 'flf2v'])
  defaultVideoFlow?: string | null;
}
