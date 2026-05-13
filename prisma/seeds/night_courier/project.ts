import { type Tx, readJson } from './_shared';
import { IDS } from './_ids';

interface ViewTemplate {
  viewId: string;
  promptAddon: string;
  weight: number;
}

interface CharacterStructure {
  defaultImageSize: { width: number; height: number };
  viewTemplates: ViewTemplate[];
}

export async function seedProject(tx: Tx) {
  const { defaultImageSize, viewTemplates } =
    readJson<CharacterStructure>('character_pipeline/character_structure.json');

  const project = await tx.project.create({
    data: {
      id:   IDS.project,
      slug: 'night_courier',
      name: 'Night Courier',
      settings: {
        defaultImageSize,
        viewTemplates,
        comfyBaseUrl: process.env.COMFY_BASE_URL ?? 'http://127.0.0.1:8188',
      },
    },
  });

  console.log(`  ✓ project  "${project.name}"  id=${project.id}`);
  return project;
}
