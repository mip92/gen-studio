import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateKey: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsOptional()
  description?: string;
}
