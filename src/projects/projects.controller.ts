import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  /**
   * List all registered visual styles. Used by the project-creation UI to
   * populate the style picker. Static path declared BEFORE /:id so Nest's
   * router treats 'visual-styles' as a literal segment, not as an id.
   */
  @Get('visual-styles')
  @ApiOperation({
    summary: 'List available visual styles',
    description: 'Returns rows from the visual_styles registry. Each style defines '
              + 'identity-stack strategy + LoRA pipeline kind + which workflow templates '
              + 'to use. See docs/VISUAL_STYLE_ARCHITECTURE.md.',
  })
  listVisualStyles() {
    return this.projectsService.listVisualStyles();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project',
    description: 'Required prompt content: defaultNegative, defaultVideoNegative, '
              + 'defaultMotionPrompt, defaultStaticMotionPrompt. Optional visualStyle '
              + '(default: photoreal_cinematic). See AGENTS.md §1, §6 and '
              + 'docs/VISUAL_STYLE_ARCHITECTURE.md.',
  })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
    description: 'Sending an empty string to a required prompt field is rejected '
              + '(NOT NULL constraint is preserved). Omit the field to keep the existing value.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
