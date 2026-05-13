import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsUUID()
  @IsOptional()
  characterId?: string;
}
