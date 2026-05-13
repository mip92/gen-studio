import { PartialType } from '@nestjs/mapped-types';
import { CreateReferenceAssetDto } from './create-reference-asset.dto';

export class UpdateReferenceAssetDto extends PartialType(CreateReferenceAssetDto) {}
