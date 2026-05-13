import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartTrainingDto {
  @ApiPropertyOptional({ description: 'Trigger word baked into every caption (default: derived from profileCode)' })
  @IsOptional() @IsString()
  triggerToken?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @IsInt() @Min(1)
  numRepeats?: number;

  @ApiPropertyOptional({ default: 1500 })
  @IsOptional() @IsInt() @Min(100)
  maxSteps?: number;

  @ApiPropertyOptional({ default: 32, description: 'LoRA rank (network_dim)' })
  @IsOptional() @IsInt() @Min(4)
  networkDim?: number;

  @ApiPropertyOptional({
    description: 'Path relative to ComfyUI/models/checkpoints, or absolute path',
    default:     'SDXL/lustifySDXLNSFW_ggwpV7.safetensors',
  })
  @IsOptional() @IsString()
  baseModel?: string;
}
