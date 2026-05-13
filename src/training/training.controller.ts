import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { StartTrainingDto } from './dto/start-training.dto';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(private readonly training: TrainingService) {}

  @Post('profiles/:profileId/start')
  @ApiOperation({
    summary: 'Start LoRA training for a character profile',
    description:
      'Prepares dataset from ComfyUI/output, captions images via Florence-2, ' +
      'and runs kohya_ss sdxl_train_network.py in the background. Returns a TrainingJob.',
  })
  start(@Param('profileId') profileId: string, @Body() dto: StartTrainingDto) {
    return this.training.start({ profileId, ...dto });
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get training job status' })
  getJob(@Param('jobId') jobId: string) {
    return this.training.getJob(jobId);
  }

  @Get('jobs/:jobId/progress')
  @ApiOperation({ summary: 'Live training progress (parses kohya train.log)' })
  getProgress(@Param('jobId') jobId: string) {
    return this.training.getProgress(jobId);
  }

  @Get('jobs/:jobId/history')
  @ApiOperation({ summary: 'Full training step series (loss curve + step rate)' })
  @ApiQuery({ name: 'maxPoints', required: false, description: 'Decimate to this many samples (default 500)' })
  getHistory(@Param('jobId') jobId: string, @Query('maxPoints') maxPoints?: string) {
    const max = maxPoints ? Math.max(50, Math.min(5000, parseInt(maxPoints, 10) || 500)) : 500;
    return this.training.getHistory(jobId, max);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({ summary: 'Force-cancel a training job (use for zombie / stuck jobs)' })
  cancel(@Param('jobId') jobId: string) {
    return this.training.cancel(jobId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List recent training jobs' })
  @ApiQuery({ name: 'profileId', required: false })
  listJobs(@Query('profileId') profileId?: string) {
    return this.training.listJobs(profileId);
  }
}
