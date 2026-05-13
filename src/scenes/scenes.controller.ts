import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScenesService } from './scenes.service';
import { CreateSceneDto } from './dto/create-scene.dto';

@ApiTags('Scenes')
@Controller('projects/:projectId/scenes')
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.scenesService.findAll(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a scene under a project (id or slug)' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateSceneDto) {
    return this.scenesService.create(projectId, dto);
  }

  @Get(':sceneId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.scenesService.findOne(projectId, sceneId);
  }

  @Delete(':sceneId')
  remove(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.scenesService.remove(projectId, sceneId);
  }
}
