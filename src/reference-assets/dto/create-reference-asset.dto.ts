import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateReferenceAssetDto {
  @IsString()
  @IsNotEmpty()
  profileCode: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
