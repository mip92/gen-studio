import { PrismaClient } from '../../../generated/prisma/client';
import { wipe }               from './wipe';
import { seedProject }        from './project';
import { seedCharacters }     from './characters';
import { seedReferenceAssets } from './reference_assets';
import { seedWorkflow }       from './workflow';
import { seedScenesShots }    from './scenes_shots';

const prisma = new PrismaClient();

const SLUG = 'night_courier';

/**
 * Seeds the Night Courier project inside a single transaction.
 * Steps run in strict order; any failure rolls back everything.
 */
export async function seedNightCourier() {
  console.log(`\n── Seeding: ${SLUG} ──`);

  // Skip if project already has characters (idempotent guard)
  const existing = await prisma.project.findFirst({
    where: { slug: SLUG },
    include: { _count: { select: { characters: true } } },
  });
  if (existing && existing._count.characters > 0) {
    console.log(`  ↷ skipped  (project "${SLUG}" already seeded with ${existing._count.characters} characters)\n`);
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. Remove previous data for this project only
      await wipe(tx, SLUG);

      // 2. Create top-level project record
      const project = await seedProject(tx);

      // 3. Characters + profiles (returns code→id map used in step 7)
      const characterCodeToId = await seedCharacters(tx, project.id);

      // 4. Reference image assets
      await seedReferenceAssets(tx, project.id);

      // 5. Workflow templates + routes with ordered steps
      await seedWorkflow(tx, project.id);

      // 6. Scenes + shots + participants
      await seedScenesShots(tx, project.id, characterCodeToId);
    },
    {
      // Large seeds with 200+ shots need more than the default 5 s
      timeout: 120_000,
    },
  );

  console.log(`── Done: ${SLUG} ✔\n`);
  await prisma.$disconnect();
}
