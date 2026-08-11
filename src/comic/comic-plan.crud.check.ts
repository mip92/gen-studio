/**
 * Live smoke-check of the «Вёрстка» plan CRUD (run: npx tsx src/comic/comic-plan.crud.check.ts).
 * Reads the debug project's plan, a legacy project's virtual pages, then
 * add-page → delete-page round-trip (leaves the DB as it was).
 */
import { PrismaClient } from '../../generated/prisma/client';
import { PageTemplateRegistryService } from './page-template-registry.service';
import { ComicPlanService } from './comic-plan.service';

async function main() {
  const prisma = new PrismaClient();
  const svc = new ComicPlanService(prisma as any, new PageTemplateRegistryService());
  const pid = async (slug: string) => {
    const r = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM projects WHERE slug=${slug}`;
    if (!r[0]) throw new Error(`no project ${slug}`);
    return r[0].id;
  };

  const dbg = await pid('comic_tpl_debug');
  const legacy = await pid('monotown');

  const p1 = await svc.plan(dbg);
  if (!p1.templateMode) throw new Error('debug project must be template mode');
  console.log('debug plan:', p1.pages.length, 'pages; page0 =',
    p1.pages[0].slots.map((s) => `${s.order}:${s.shape}${s.shot ? '@' + s.shot.shotCode : ''}`).join(' '));

  const p2 = await svc.plan(legacy);
  if (p2.templateMode) throw new Error('monotown must be legacy');
  const first = p2.pages[0];
  if (!first || first.slots.length !== 6) throw new Error(`legacy page0 must have 6 panels, got ${first?.slots.length}`);
  console.log('legacy plan:', p2.pages.length, 'virtual pages;',
    `page0: spread ${first.spreadIndex} ${first.side}, panels=${first.slots.length},`,
    'codes:', first.slots.map((s) => s.shot.shotCode).join(','));

  const before = p1.pages.length;
  const added = await svc.addPage(dbg, 'duo_wide');
  console.log('added page:', added.pageIndex, added.templateId);
  const p3 = await svc.plan(dbg);
  if (!p3.templateMode || p3.pages.length !== before + 1) throw new Error('add failed');
  await svc.deletePage(dbg, added.id);
  const p4 = await svc.plan(dbg);
  if (!p4.templateMode || p4.pages.length !== before) throw new Error('delete failed');
  const idx = p4.pages.map((p) => p.pageIndex).join(',');
  if (idx !== Array.from({ length: before }, (_, i) => i).join(',')) throw new Error(`indexes not dense: ${idx}`);
  console.log('after add+delete:', p4.pages.length, 'pages, indexes dense:', idx);
  await prisma.$disconnect();
  console.log('PLAN CRUD CHECK: OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
