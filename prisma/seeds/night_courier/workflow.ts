import { type Tx, readJson } from './_shared';

interface Manifest {
  templates: Array<{ id: string; file: string; description: string }>;
  routeToTemplates: Record<string, string[]>;
}

export async function seedWorkflow(tx: Tx, projectId: string) {
  const { templates, routeToTemplates } = readJson<Manifest>('comfy/manifest.json');

  // Templates
  const templateKeyToId: Record<string, string> = {};
  for (const t of templates) {
    const created = await tx.workflowTemplate.create({
      data: {
        projectId,
        templateKey: t.id,
        filePath:    t.file,
        description: t.description,
      },
    });
    templateKeyToId[t.id] = created.id;
  }
  console.log(`  ✓ workflow templates  ${templates.length}`);

  // Routes with ordered steps
  for (const [routeKey, keys] of Object.entries(routeToTemplates)) {
    await tx.workflowRoute.create({
      data: {
        projectId,
        routeKey,
        steps: {
          create: keys.map((key, idx) => ({
            stepOrder:          idx,
            workflowTemplateId: templateKeyToId[key],
          })),
        },
      },
    });
  }
  console.log(`  ✓ workflow routes  ${Object.keys(routeToTemplates).length}`);
}
