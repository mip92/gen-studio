import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DatasetQueueService } from './dataset-queue.service';

class EnqueueDatasetDto {
  dependsOnProfileId?:     string;
  referenceProfileId?:     string;
  referenceImageFilename?: string;
}

@ApiTags('DatasetQueue')
@Controller('dataset-queue')
export class DatasetQueueController {
  constructor(private readonly queue: DatasetQueueService) {}

  @Post('profiles/:profileId/enqueue')
  @ApiOperation({
    summary: 'Queue a dataset generation job (with optional dependency / chained reference)',
  })
  enqueue(@Param('profileId') profileId: string, @Body() dto: EnqueueDatasetDto) {
    return this.queue.enqueue({ profileId, ...dto });
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List dataset jobs' })
  @ApiQuery({ name: 'profileId', required: false })
  list(@Query('profileId') profileId?: string) {
    return this.queue.list(profileId);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({ summary: 'Cancel a queued/blocked dataset job' })
  cancel(@Param('jobId') jobId: string) {
    return this.queue.cancel(jobId);
  }
}
