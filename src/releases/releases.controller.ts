import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReleaseBackfillService } from './release-backfill.service';
import { AutoPlanDto, BackfillDto, SetReleaseDto } from './releases.dto';
import { ReleasesService } from './releases.service';

/**
 * Релизный календарь (страница /releases в UI). Тонкий слой над
 * ReleasesService/ReleaseBackfillService — вся логика там.
 *
 * НЕ трогает queuePriorityTier: календарь информационный, приоритет рендера —
 * ручное решение в очереди (см. заголовок releases.service.ts).
 */
@ApiTags('Releases')
@Controller('releases')
export class ReleasesController {
  constructor(
    private readonly releases: ReleasesService,
    private readonly backfill: ReleaseBackfillService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Все проекты: дата релиза (факт/план) + готовность видео и озвучки' })
  list() {
    return this.releases.list();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Дата релиза одного проекта (подсказка в экспорте/заливке, без гейта)' })
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.releases.getOne(idOrSlug);
  }

  @Patch(':idOrSlug')
  @ApiOperation({ summary: 'Поставить/снять плановую дату (409 у опубликованных и занятых слотов)' })
  setDate(@Param('idOrSlug') idOrSlug: string, @Body() dto: SetReleaseDto) {
    return this.releases.setDate(idOrSlug, dto.releaseAt ?? null);
  }

  @Post('auto-plan')
  @ApiOperation({ summary: 'Разложить проекты в заданном порядке по свободным слотам (деф. вт/чт 13:00)' })
  autoPlan(@Body() dto: AutoPlanDto) {
    return this.releases.autoPlan(dto);
  }

  @Post('backfill-published')
  @ApiOperation({ summary: 'Сверить даты опубликованных с фактом YouTube (dryRun = превью без записи)' })
  backfillPublished(@Body() dto: BackfillDto) {
    return this.backfill.backfillPublished(dto.dryRun ?? false);
  }
}
