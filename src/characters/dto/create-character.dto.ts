import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}
