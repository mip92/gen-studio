import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PageTemplateRegistryService } from './page-template-registry.service';

/**
 * Integrity gate for a project's comic page-template plan.
 *
 * A project WITHOUT comic_pages rows is a legacy/uniform project: the gate
 * reports ready immediately and runs zero checks — the old export path is
 * never blocked by this feature. With a plan present, the plan must be
 * complete and self-consistent BEFORE the comic export builds a manifest
 * (comic_manifest.py re-verifies the hard invariants and dies with the same
 * messages, but the gate surfaces them as a 400 with the full list instead
 * of a half-built detached process).
 *
 * All reads go through $queryRaw: the comic columns may predate the generated
 * Prisma client (documented repo pattern).
 */

export interface ComicPlanIssue {
  page?: number;
  slot?: number;
  shotCode?: string;
  message: string;
}

export interface ComicPlanReadiness {
  templateMode: boolean;
  ready: boolean;
  pages: number;
  errors: ComicPlanIssue[];
  warnings: ComicPlanIssue[];
}

@Injectable()
export class ComicPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: PageTemplateRegistryService,
  ) {}

  async check(projectId: string): Promise<ComicPlanReadiness> {
    const errors: ComicPlanIssue[] = [];
    const warnings: ComicPlanIssue[] = [];

    const pages = await this.prisma.$queryRaw<Array<{ id: string; pageIndex: number; templateId: string }>>`
      SELECT id, "pageIndex", "templateId" FROM comic_pages
      WHERE "projectId" = ${projectId} ORDER BY "pageIndex"
    `;
    if (pages.length === 0) {
      // Legacy project — no plan, no checks, never blocked.
      return { templateMode: false, ready: true, pages: 0, errors, warnings };
    }

    if (pages.length % 2 !== 0) {
      errors.push({ message: `план из ${pages.length} страниц — число страниц должно быть ЧЁТНЫМ (разворот = пара; хвост закрывайте 3-слотовым шаблоном)` });
    }
    pages.forEach((p, i) => {
      if (p.pageIndex !== i) {
        errors.push({ page: p.pageIndex, message: `pageIndex ${p.pageIndex} — дыра/дубль (ожидался ${i})` });
      }
    });

    const templates = new Map(this.registry.getTemplates().map((t) => [t.id, t]));
    for (const p of pages) {
      if (!templates.has(p.templateId)) {
        errors.push({ page: p.pageIndex, message: `неизвестный шаблон "${p.templateId}" (comic_page_templates.json)` });
      }
    }

    const shots = await this.prisma.$queryRaw<Array<{
      shotCode: string; pageId: string | null; slot: number | null; shape: string | null;
      pcount: bigint; visualStyle: string | null;
    }>>`
      SELECT sh."shotCode" AS "shotCode", sh."comicPageId" AS "pageId", sh."comicSlot" AS slot,
             sh."comicPanelShape" AS shape,
             (SELECT count(*) FROM shot_participants sp WHERE sp."shotId" = sh.id) AS pcount,
             pr."visualStyle" AS "visualStyle"
      FROM shots sh JOIN projects pr ON pr.id = sh."projectId"
      WHERE sh."projectId" = ${projectId}
    `;

    const unassigned = shots.filter((s) => !s.pageId);
    if (unassigned.length > 0) {
      errors.push({
        message: `${unassigned.length} шот(ов) без назначения в панель — template-режим требует полного покрытия ` +
          `(первые: ${unassigned.slice(0, 5).map((s) => s.shotCode).join(', ')})`,
      });
    }

    const pageById = new Map(pages.map((p) => [p.id, p]));
    const seen = new Map<string, string>(); // pageId:slot -> shotCode
    for (const s of shots) {
      if (!s.pageId) continue;
      const page = pageById.get(s.pageId);
      if (!page) {
        errors.push({ shotCode: s.shotCode, message: `назначен на страницу другого проекта / несуществующую (${s.pageId})` });
        continue;
      }
      const tmpl = templates.get(page.templateId);
      if (!tmpl) continue; // template error already reported
      if (s.slot == null || !tmpl.slots.some((x) => x.slot === s.slot)) {
        errors.push({ page: page.pageIndex, shotCode: s.shotCode, message: `comicSlot=${s.slot} вне шаблона ${page.templateId} (0..${tmpl.slots.length - 1})` });
        continue;
      }
      const key = `${s.pageId}:${s.slot}`;
      const prev = seen.get(key);
      if (prev) {
        errors.push({ page: page.pageIndex, slot: s.slot, message: `слот занят дважды (${prev} и ${s.shotCode})` });
      }
      seen.set(key, s.shotCode);
      const wantShape = tmpl.slots.find((x) => x.slot === s.slot)!.shape;
      if (s.shape !== wantShape) {
        errors.push({ page: page.pageIndex, slot: s.slot, shotCode: s.shotCode, message: `comicPanelShape='${s.shape}' != форма слота '${wantShape}'` });
      }
      // Strategy geometry restriction: the cell-shaded dual-character strategy
      // hardcodes a landscape regional split. The Qwen overlay (engaged when
      // both anchors + models are present) renders any shape, so this is a
      // warning, not an error — renderShot() hard-fails if the fallback fires.
      if (s.visualStyle === 'graphic_novel_cell_shaded' && Number(s.pcount) === 2 && wantShape !== 'landscape') {
        warnings.push({ page: page.pageIndex, shotCode: s.shotCode, message: `2 персонажа в '${wantShape}' на cell_shaded: без Qwen-overlay рендер будет отклонён (dual-стратегия только landscape)` });
      }
    }

    // every template slot of every page must be filled
    for (const p of pages) {
      const tmpl = templates.get(p.templateId);
      if (!tmpl) continue;
      for (const slot of tmpl.slots) {
        if (!seen.has(`${p.id}:${slot.slot}`)) {
          errors.push({ page: p.pageIndex, slot: slot.slot, message: `слот ${slot.slot} (${slot.shape}) шаблона ${p.templateId} не заполнен` });
        }
      }
    }

    return { templateMode: true, ready: errors.length === 0, pages: pages.length, errors, warnings };
  }

  // ── Layout-plan CRUD (the «Вёрстка» tab) ────────────────────────────────────

  /**
   * Page-by-page view of the project's layout. Template mode: the comic_pages
   * plan with each slot's assigned shot. No plan: VIRTUAL read-only pages that
   * mirror the LEGACY UNIFORM grid the comic export will actually build
   * (12 panels per spread, 6 per page, --pack chunking) — the tab shows how
   * the shots land on the book's pages, not a flat strip of frames
   * (user 2026-08-01).
   */
  async plan(projectId: string) {
    const pages = await this.prisma.$queryRaw<Array<{ id: string; pageIndex: number; templateId: string }>>`
      SELECT id, "pageIndex", "templateId" FROM comic_pages
      WHERE "projectId" = ${projectId} ORDER BY "pageIndex"
    `;
    if (pages.length === 0) {
      const shots = await this.prisma.$queryRaw<Array<{ id: string; shotCode: string; chosenRender: string | null }>>`
        SELECT sh.id, sh."shotCode", sh."chosenRender"
        FROM shots sh JOIN scenes sc ON sh."sceneId" = sc.id
        WHERE sh."projectId" = ${projectId}
        ORDER BY sc."sortOrder", sh."shotCode"
      `;
      return { templateMode: false as const, pages: this.uniformVirtualPages(shots) };
    }
    const assigned = await this.prisma.$queryRaw<Array<{
      id: string; shotCode: string; chosenRender: string | null; pageId: string; slot: number;
    }>>`
      SELECT id, "shotCode", "chosenRender", "comicPageId" AS "pageId", "comicSlot" AS slot
      FROM shots WHERE "projectId" = ${projectId} AND "comicPageId" IS NOT NULL
    `;
    const byPageSlot = new Map(assigned.map((s) => [`${s.pageId}:${s.slot}`, s]));
    return {
      templateMode: true as const,
      pages: pages.map((p) => {
        const tmpl = this.registry.getTemplate(p.templateId);
        return {
          id: p.id,
          pageIndex: p.pageIndex,
          templateId: p.templateId,
          templateName: tmpl?.name ?? null,
          slots: (tmpl?.slots ?? []).map((s) => {
            const shot = byPageSlot.get(`${p.id}:${s.slot}`);
            return {
              slot: s.slot, order: s.order, shape: s.shape, rect: s.rect,
              shot: shot ? { id: shot.id, shotCode: shot.shotCode, chosenRender: shot.chosenRender } : null,
            };
          }),
        };
      }),
    };
  }

  /**
   * The legacy uniform grid as virtual page objects: chunking mirrors
   * comic_manifest.py --pack (12-panel spreads, left 6 → right 6, a short
   * n<=3 tail as a single page), the page GEOMETRY is the registry's
   * `classic_6` template — the same rects the gallery shows, so the tab and
   * the gallery look identical (user 2026-08-01). Tail pages take the first
   * m slots of classic_6. Read-only: no ids, no delete.
   */
  private uniformVirtualPages(
    shots: Array<{ id: string; shotCode: string; chosenRender: string | null }>,
  ) {
    const tmpl = this.registry.getTemplate('classic_6');
    if (!tmpl) throw new Error('registry is missing classic_6');
    const tmplSlots = [...tmpl.slots].sort((a, b) => a.order - b.order);

    // chunk_sizes(): full 12s, remainder rule «rem-s==1 && s<8 → s+=1»
    const sizes: number[] = [];
    let rem = shots.length;
    while (rem > 0) {
      let s = Math.min(12, rem);
      if (rem - s === 1 && s < 8) s += 1;
      sizes.push(s); rem -= s;
    }

    const pages: Array<{
      pageIndex: number; spreadIndex: number; side: 'single' | 'left' | 'right'; virtual: true;
      templateId: string; templateName: string | null;
      slots: Array<{
        slot: number; order: number; shape: string;
        rect: { x: number; y: number; w: number; h: number };
        shot: { id: string; shotCode: string; chosenRender: string | null };
      }>;
    }> = [];
    let cursor = 0;
    let pageIndex = 0;
    sizes.forEach((n, spreadIndex) => {
      const group = shots.slice(cursor, cursor + n);
      cursor += n;
      // spread_rects(): n<=3 → single page; else left = ceil(n/2), then right
      const split = n <= 3 ? [group] : [group.slice(0, Math.ceil(n / 2)), group.slice(Math.ceil(n / 2))];
      split.forEach((pageShots, si) => {
        pages.push({
          pageIndex: pageIndex++,
          spreadIndex,
          side: (n <= 3 ? 'single' : si === 0 ? 'left' : 'right') as 'single' | 'left' | 'right',
          virtual: true as const,
          templateId: tmpl.id,
          templateName: tmpl.name,
          slots: pageShots.map((s, i) => ({
            slot: i, order: i, shape: tmplSlots[i]?.shape ?? 'landscape',
            rect: tmplSlots[i]?.rect ?? { x: 0, y: 0, w: 0.49, h: 0.25 },
            shot: { id: s.id, shotCode: s.shotCode, chosenRender: s.chosenRender },
          })),
        });
      });
    });
    return pages;
  }

  /** Append a page to the plan. The FIRST page switches the project into template mode. */
  async addPage(projectId: string, templateId: string) {
    if (!this.registry.getTemplate(templateId)) {
      throw new BadRequestException(`неизвестный шаблон "${templateId}"`);
    }
    const [{ next }] = await this.prisma.$queryRaw<Array<{ next: number }>>`
      SELECT COALESCE(MAX("pageIndex") + 1, 0)::int AS next FROM comic_pages WHERE "projectId" = ${projectId}
    `;
    const id = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO comic_pages (id, "projectId", "pageIndex", "templateId", "createdAt", "updatedAt")
      VALUES (${id}, ${projectId}, ${next}, ${templateId}, now(), now())
    `;
    return { id, pageIndex: next, templateId };
  }

  /**
   * Delete a plan page: unassign its shots (comicSlot/comicPanelShape cleared,
   * not just the FK), remove the row, close the pageIndex gap. Deleting the
   * LAST page returns the project to legacy mode.
   */
  async deletePage(projectId: string, pageId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ pageIndex: number }>>`
      SELECT "pageIndex" FROM comic_pages WHERE id = ${pageId} AND "projectId" = ${projectId}
    `;
    if (!rows[0]) throw new BadRequestException('страница не найдена в этом проекте');
    const del = rows[0].pageIndex;
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE shots SET "comicPageId" = NULL, "comicSlot" = NULL, "comicPanelShape" = NULL
        WHERE "projectId" = ${projectId} AND "comicPageId" = ${pageId}
      `,
      this.prisma.$executeRaw`DELETE FROM comic_pages WHERE id = ${pageId} AND "projectId" = ${projectId}`,
      // two-phase shift keeps the (projectId, pageIndex) unique constraint happy
      this.prisma.$executeRaw`
        UPDATE comic_pages SET "pageIndex" = "pageIndex" + 1000000
        WHERE "projectId" = ${projectId} AND "pageIndex" > ${del}
      `,
      this.prisma.$executeRaw`
        UPDATE comic_pages SET "pageIndex" = "pageIndex" - 1000001
        WHERE "projectId" = ${projectId} AND "pageIndex" > 1000000
      `,
    ]);
    return { deleted: pageId };
  }

  /** Throw a 400 with the full issue list when a template plan exists and is broken. */
  async assertReady(projectId: string): Promise<ComicPlanReadiness> {
    const res = await this.check(projectId);
    if (!res.ready) {
      const list = res.errors.slice(0, 20).map((e) => {
        const where = [e.page != null ? `стр.${e.page}` : null, e.slot != null ? `слот ${e.slot}` : null, e.shotCode]
          .filter(Boolean).join(' ');
        return where ? `${where}: ${e.message}` : e.message;
      });
      throw new BadRequestException(
        `Комикс-план не готов (${res.errors.length} ошибок): ${list.join('; ')}`,
      );
    }
    return res;
  }
}
