import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  profileCode: string;

  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(4000)
  promptBase: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(4000)
  negative?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  ageLabel?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1)
  targetImages?: number;

  @ApiPropertyOptional({ description: 'Newline-separated angle prompts (node 152)' })
  @IsOptional() @IsString() @MaxLength(8000)
  promptAngles?: string;

  @ApiPropertyOptional({ description: 'Newline-separated variety prompts (node 385)' })
  @IsOptional() @IsString() @MaxLength(8000)
  promptVariety?: string;

  @ApiPropertyOptional({ description: 'LoRA trigger token (used in captions and scene prompts)' })
  @IsOptional() @IsString() @MaxLength(100)
  triggerToken?: string;
}
