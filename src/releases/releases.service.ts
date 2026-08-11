import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExportsService } from '../exports/exports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutoPlanDto } from './releases.dto';
import { DEFAULT_DAYS, DEFAULT_HOUR, DEFAULT_TZ, planSlots, slotDayKey } from './slot-planner';

/**
 * Release calendar: query + planning logic. One date per project (`releaseAt`):
 * factual publish instant for released projects (owned by the backfill sync),
 * planned slot for unreleased ones.
 *
 * "Готов" на этой странице = ExportsService.checkReadiness().ready — ровно тот
 * гейт, который открывает кнопку экспорта в CapCut (клип+апскейл+интерп или
 * static+стилл на каждом кадре, одобренная музыка каждого акта, ни одного
 * пустого акта). Никакой собственной прокси-метрики (user, 2026-08-07:
 * «готово — это когда доступна кнопка экспорта в капкат»).
 *
 * BOUNDARY: this module never reads or writes queuePriorityTier /
 * queuePrioritizedAt. The calendar is informational; render priority stays a
 * manual queue decision (user, 2026-08-07).
 */

export interface ReleaseRow {
  id: string;
  slug: string;
  name: string;
  youtubeUrl: string | null;
  /** ISO UTC instant or null. */
  releaseAt: string | null;
  /** youtubeUrl !== null — залито на YouTube (возможно, отложенная публикация).
   *  Дата залочена от ручного редактирования: её владелец — сверка с YouTube. */
  uploaded: boolean;
  /** Реально вышло: залито И дата публикации уже наступила. Отложенная
   *  публикация (uploaded, дата в будущем) станет published сама собой. */
  published: boolean;
  /** Export gate verdict; null for published projects (deliverable shipped). */
  exportReady: boolean | null;
  totalShots: number;
  /** Кадры, не прошедшие экспорт-гейт (нет клипа / апскейла / интерпа / стилла). */
  missingClips: number;
  /** Акты без полностью одобренной основной музыки (или блоков нет вовсе). */
  missingMusic: number;
  /** Пустые акты (без кадров). */
  missingScenes: number;
}

/** The DB stores UTC instants; a zoneless string would silently shift by the
 *  server's zone, so the API refuses it with an explanation. */
function parseInstant(iso: string): Date {
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) {
    throw new BadRequestException('releaseAt must carry a zone designator (…Z or ±hh:mm) — the DB stores UTC instants');
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new BadRequestException('releaseAt is not a valid ISO-8601 instant');
  return d;
}

@Injectable()
export class ReleasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exports: ExportsService,
  ) {}

  async list(): Promise<ReleaseRow[]> {
    const projects = (await this.prisma.project.findMany({
      where: { slug: { not: 'comic_tpl_debug' } },
      select: { id: true, slug: true, name: true, youtubeUrl: true, releaseAt: true } as any,
      orderBy: [{ releaseAt: 'asc' }, { name: 'asc' }] as any,
    })) as unknown as { id: string; slug: string; name: string; youtubeUrl: string | null; releaseAt: Date | null }[];

    const now = Date.now();
    return Promise.all(projects.map(async (p): Promise<ReleaseRow> => {
      const uploaded = p.youtubeUrl !== null;
      const base = {
        id: p.id, slug: p.slug, name: p.name, youtubeUrl: p.youtubeUrl,
        releaseAt: p.releaseAt ? p.releaseAt.toISOString() : null,
        uploaded,
        // Отложенная публикация (дата в будущем) — ещё не «вышел»; без даты
        // считаем вышедшим консервативно (легаси до первой сверки).
        published: uploaded && (p.releaseAt === null || p.releaseAt.getTime() <= now),
      };
      if (uploaded) {
        // Deliverable уже на YouTube (пусть и отложен) — экспорт-гейт неинтересен.
        return { ...base, exportReady: null, totalShots: 0, missingClips: 0, missingMusic: 0, missingScenes: 0 };
      }
      const r = await this.exports.checkReadiness(p.id);
      return {
        ...base,
        exportReady: r.ready,
        totalShots: r.totals.shots,
        missingClips: r.missingShots.length,
        missingMusic: r.missingMusic.length,
        missingScenes: r.missingScenes.length,
      };
    }));
  }

  /** Лёгкая карточка для подсказок в экспорте/заливке — без экспорт-гейта. */
  async getOne(idOrSlug: string): Promise<{ slug: string; releaseAt: string | null; uploaded: boolean; published: boolean }> {
    const p = await this.findProject(idOrSlug);
    const rows = (await this.prisma.project.findMany({
      where: { id: p.id },
      select: { releaseAt: true } as any,
    })) as unknown as { releaseAt: Date | null }[];
    const releaseAt = rows[0]?.releaseAt ?? null;
    const uploaded = p.youtubeUrl !== null;
    return {
      slug: p.slug,
      releaseAt: releaseAt ? releaseAt.toISOString() : null,
      uploaded,
      published: uploaded && (releaseAt === null || releaseAt.getTime() <= Date.now()),
    };
  }

  /** Set or clear the planned date of an UNPUBLISHED project. */
  async setDate(idOrSlug: string, releaseAtIso: string | null): Promise<{ id: string; slug: string; releaseAt: string | null }> {
    const project = await this.findProject(idOrSlug);
    if (project.youtubeUrl) {
      // Factual dates are backfill-owned; if one is wrong, re-run the backfill
      // (it reads the truth from YouTube) instead of hand-editing history.
      throw new ConflictException({ code: 'PUBLISHED_LOCKED', message: 'Проект уже опубликован — дата факта синхронизируется с YouTube, руками не меняется' });
    }

    if (releaseAtIso == null) {
      await this.updateReleaseAt(project.id, null);
      return { id: project.id, slug: project.slug, releaseAt: null };
    }

    const instant = parseInstant(releaseAtIso);
    const conflict = await this.slotConflict(instant, project.id);
    if (conflict) {
      throw new ConflictException({ code: 'SLOT_TAKEN', conflictSlug: conflict, message: `Слот занят проектом «${conflict}»` });
    }
    await this.updateReleaseAt(project.id, instant);
    return { id: project.id, slug: project.slug, releaseAt: instant.toISOString() };
  }

  /** Assign the given projects (in order) to the nearest free slots. */
  async autoPlan(dto: AutoPlanDto): Promise<{ assigned: { slug: string; releaseAt: string }[] }> {
    const projects = await Promise.all(dto.order.map((key) => this.findProject(key)));
    const publishedInOrder = projects.filter((p) => p.youtubeUrl);
    if (publishedInOrder.length) {
      throw new BadRequestException(`Уже опубликованы, планировать нечего: ${publishedInOrder.map((p) => p.slug).join(', ')}`);
    }
    const planIds = new Set(projects.map((p) => p.id));

    // Busy = slots of every OTHER unpublished project. Projects being re-planned
    // free their old slots naturally; published dates are history, not slots.
    const others = await this.unpublishedWithDates();
    const busy = new Set(others.filter((o) => !planIds.has(o.id)).map((o) => slotDayKey(o.releaseAt, DEFAULT_TZ)));

    const floorCandidate = dto.startFrom ? parseInstant(dto.startFrom) : new Date();
    const floor = new Date(Math.max(floorCandidate.getTime(), Date.now()));
    const plan = planSlots(
      projects.map((p) => p.id),
      busy,
      { floor, days: dto.days ?? DEFAULT_DAYS, hour: dto.hour ?? DEFAULT_HOUR, tz: DEFAULT_TZ },
    );

    // All-or-nothing: a half-applied plan is worse than a failed one.
    await this.prisma.$transaction([...plan.entries()].map(([id, at]) => this.updateReleaseAt(id, at)));
    return {
      assigned: projects.map((p) => ({ slug: p.slug, releaseAt: plan.get(p.id)!.toISOString() })),
    };
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private async findProject(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, slug: true, youtubeUrl: true },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return project;
  }

  /** Casts because `releaseAt` may predate the locally generated client — same
   *  defensive pattern queue-ledger uses for queuePriorityTier. */
  private updateReleaseAt(id: string, value: Date | null) {
    return this.prisma.project.update({ where: { id }, data: { releaseAt: value } as any });
  }

  private async unpublishedWithDates(): Promise<{ id: string; slug: string; releaseAt: Date }[]> {
    const rows = await this.prisma.project.findMany({
      where: { youtubeUrl: null, releaseAt: { not: null } } as any,
      select: { id: true, slug: true, releaseAt: true } as any,
    });
    return rows as unknown as { id: string; slug: string; releaseAt: Date }[];
  }

  /** Slug of the unpublished project already holding this wall-day, if any. */
  private async slotConflict(instant: Date, exceptId: string): Promise<string | null> {
    const key = slotDayKey(instant, DEFAULT_TZ);
    const others = await this.unpublishedWithDates();
    const hit = others.find((o) => o.id !== exceptId && slotDayKey(o.releaseAt, DEFAULT_TZ) === key);
    return hit?.slug ?? null;
  }
}
