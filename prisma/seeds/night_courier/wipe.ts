import { type Tx } from './_shared';

export async function wipe(tx: Tx, slug: string) {
  const project = await tx.project.findFirst({
    where: { slug },
    select: { id: true },
  });

  if (!project) {
    console.log(`  ✓ wiped  (nothing to remove for slug: ${slug})`);
    return;
  }

  // WorkflowRouteStep references WorkflowTemplate with RESTRICT,
  // so cascade from Project alone won't work.
  // Delete route steps explicitly first, then let cascade handle the rest.
  await tx.workflowRouteStep.deleteMany({
    where: { workflowRoute: { projectId: project.id } },
  });

  await tx.project.delete({ where: { id: project.id } });
  console.log(`  ✓ wiped  (slug: ${slug})`);
}
