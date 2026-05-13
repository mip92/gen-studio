import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferenceAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId: string, profileCode?: string) {
    return this.prisma.referenceAsset.findMany({
      where: { projectId, ...(profileCode ? { profileCode } : {}) },
      orderBy: [{ profileCode: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(projectId: string, assetId: string) {
    const asset = await this.prisma.referenceAsset.findFirst({
      where: { id: assetId, projectId },
    });
    if (!asset) throw new NotFoundException(`ReferenceAsset ${assetId} not found`);
    return asset;
  }

  async remove(projectId: string, assetId: string) {
    await this.findOne(projectId, assetId);
    return this.prisma.referenceAsset.delete({ where: { id: assetId } });
  }
}
