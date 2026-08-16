import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScenesService } from './scenes.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';

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

  @Patch(':sceneId')
  @ApiOperation({
    summary: 'Update an act',
    description:
      'Only the keys present in the body are written. `defaultVideoFlow` sets this act\'s i2v '
      + 'flow override ("i2v" | "flf2v"); null clears it and the act inherits the project.',
  })
  update(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateSceneDto,
  ) {
    return this.scenesService.update(projectId, sceneId, dto);
  }

  @Delete(':sceneId')
  remove(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.scenesService.remove(projectId, sceneId);
  }
}
