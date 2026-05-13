import { type Tx, readJson } from './_shared';

interface RefRegistry {
  profiles: Record<string, string[]>;
}

export async function seedReferenceAssets(tx: Tx, projectId: string) {
  const { profiles } = readJson<RefRegistry>('comfy/ref_registry.json');

  let count = 0;
  for (const [profileCode, paths] of Object.entries(profiles)) {
    for (let i = 0; i < paths.length; i++) {
      await tx.referenceAsset.create({
        data: { projectId, profileCode, path: paths[i], sortOrder: i },
      });
      count++;
    }
  }

  console.log(`  ✓ reference assets  ${count}`);
}
