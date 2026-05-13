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
}
