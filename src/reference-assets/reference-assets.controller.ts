import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReferenceAssetsService } from './reference-assets.service';

@ApiTags('Reference Assets')
@Controller('projects/:projectId/reference-assets')
export class ReferenceAssetsController {
  constructor(private readonly referenceAssetsService: ReferenceAssetsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query('profileCode') profileCode?: string,
  ) {
    return this.referenceAssetsService.findAll(projectId, profileCode);
  }

  @Get(':assetId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.referenceAssetsService.findOne(projectId, assetId);
  }

  @Delete(':assetId')
  remove(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.referenceAssetsService.remove(projectId, assetId);
  }
}
