/**
 * Live smoke-check of the comic-plan gate (no test runner in this repo):
 *     npx tsx src/comic/comic-plan.check.ts <slug-with-plan> <legacy-slug>
 * Verifies: a seeded plan validates clean, a legacy project short-circuits to
 * ready with zero checks, and a deliberately broken shape is caught (mutated
 * inside a rolled-back transaction — the DB is left untouched).
 */
import { PrismaClient } from '../../generated/prisma/client';
import { PageTemplateRegistryService } from './page-template-registry.service';
import { ComicPlanService } from './comic-plan.service';

async function main() {
  // monotown got a real full-coverage plan on 2026-08-03 — it can no longer serve
  // as either fixture (the partial-plan baseline expects exactly one coverage error).
  const [slugPlan = 'comic_tpl_debug', slugLegacy = 'best_thing'] = process.argv.slice(2);
  const prisma = new PrismaClient();
  const plan = new ComicPlanService(prisma as any, new PageTemplateRegistryService());

  const pid = async (slug: string) => {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM projects WHERE slug=${slug}`;
    if (!rows[0]) throw new Error(`project ${slug} not found`);
    return rows[0].id;
  };

  const planId = await pid(slugPlan);
  const legacyId = await pid(slugLegacy);

  // NOTE: the seeded fixture covers only the film's first shots, so the gate
  // legitimately reports the "full coverage" error — the baseline expectation
  // is "exactly the coverage error, nothing else".
  const a = await plan.check(planId);
  console.log(`${slugPlan}: templateMode=${a.templateMode} ready=${a.ready} pages=${a.pages} errors=${a.errors.length} warnings=${a.warnings.length}`);
  a.errors.forEach((e) => console.log('   ERR', e));
  // A fixture may be partially covered (exactly the one coverage error) or fully
  // seeded (zero errors) — both are healthy baselines; anything else is a defect.
  const baselineOk = a.templateMode
    && (a.errors.length === 0
      || (a.errors.length === 1 && /без назначения/.test(a.errors[0].message)));

  const b = await plan.check(legacyId);
  console.log(`${slugLegacy}: templateMode=${b.templateMode} ready=${b.ready} (legacy short-circuit)`);

  // break one shape inside a transaction, verify the gate catches it, roll back
  let caught = 0;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE shots SET "comicPanelShape"='wide'
      WHERE id = (SELECT id FROM shots WHERE "projectId"=${planId} AND "comicPanelShape"='square' LIMIT 1)
        AND "projectId"=${planId}
    `;
    const broken = new ComicPlanService(tx as any, new PageTemplateRegistryService());
    const c = await broken.check(planId);
    caught = c.errors.length;
    console.log(`broken-shape check: ready=${c.ready} errors=${c.errors.length} (${c.errors[0]?.message ?? ''})`);
    throw new Error('rollback');
  }).catch((e) => { if (e.message !== 'rollback') throw e; });

  const after = await plan.check(planId);
  console.log(`after rollback: errors=${after.errors.length} (DB untouched, ожидалось ${a.errors.length})`);

  await prisma.$disconnect();
  if (!baselineOk || !b.ready || b.templateMode || caught !== a.errors.length + 1
      || after.errors.length !== a.errors.length) {
    console.error('GATE CHECK: FAIL');
    process.exit(1);
  }
  console.log('GATE CHECK: OK');
}

main();
