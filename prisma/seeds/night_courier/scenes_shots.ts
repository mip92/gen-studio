import { readdirSync } from 'fs';
import { join } from 'path';
import { type Tx, readJson, PROJECT_ROOT } from './_shared';

interface RefRegistry {
  sceneToProfile: Record<string, string>;
}

interface ShotJson {
  shotId: string;
  scene: { id: string; titleRu: string; order: number };
  narrativeBeat?: string;
  storyFunction?: string;
  frameDescription?: string;
  charactersInFrame?: string[];
  location?: unknown;
  camera?: unknown;
  lightingMood?: string;
  prompt?: {
    positive?: string;
    negative?: string;
    positiveCharacterLocks?: string;
    positiveEnvironment?: string;
    captionGenerator?: string;
  };
  workflow?: { route?: string; params?: unknown };
  continuity?: unknown;
  production?: unknown;
  referenceProfileId?: string;
  referenceImagePool?: string[];
}

export async function seedScenesShots(
  tx: Tx,
  projectId: string,
  characterCodeToId: Record<string, string>,
) {
  const { sceneToProfile } = readJson<RefRegistry>('comfy/ref_registry.json');

  const shotFiles = readdirSync(join(PROJECT_ROOT, 'shots'))
    .filter((f) => f.endsWith('.json'))
    .sort();

  const sceneKeyToId: Record<string, string> = {};
  let shotCount = 0;

  for (const file of shotFiles) {
    const s = readJson<ShotJson>(`shots/${file}`);

    // Create scene on first encounter
    if (!sceneKeyToId[s.scene.id]) {
      const scene = await tx.scene.create({
        data: {
          projectId,
          sceneKey:                    s.scene.id,
          title:                       s.scene.titleRu,
          sortOrder:                   s.scene.order,
          defaultReferenceProfileCode: sceneToProfile[s.scene.id] ?? null,
        },
      });
      sceneKeyToId[s.scene.id] = scene.id;
    }

    const shot = await tx.shot.create({
      data: {
        projectId,
        sceneId:            sceneKeyToId[s.scene.id],
        shotCode:           s.shotId,
        workflowRouteKey:   s.workflow?.route ?? null,
        referenceProfileId: s.referenceProfileId ?? null,
        referenceImagePool: s.referenceImagePool ?? [],
        promptFields: {
          positive:               s.prompt?.positive,
          negative:               s.prompt?.negative,
          positiveCharacterLocks: s.prompt?.positiveCharacterLocks,
          positiveEnvironment:    s.prompt?.positiveEnvironment,
          captionGenerator:       s.prompt?.captionGenerator,
          narrativeBeat:          s.narrativeBeat,
          storyFunction:          s.storyFunction,
          frameDescription:       s.frameDescription,
          location:               s.location,
          camera:                 s.camera,
          lightingMood:           s.lightingMood,
          continuity:             s.continuity,
          production:             s.production,
          workflowParams:         s.workflow?.params,
        },
      },
    });

    // ShotParticipants — match label against known character codes
    if (s.charactersInFrame?.length) {
      await tx.shotParticipant.createMany({
        data: s.charactersInFrame.map((label) => ({
          shotId: shot.id,
          label,
          characterId:
            Object.entries(characterCodeToId).find(([code]) =>
              label.toUpperCase().startsWith(code),
            )?.[1] ?? null,
        })),
      });
    }

    shotCount++;
  }

  console.log(`  ✓ scenes  ${Object.keys(sceneKeyToId).length}`);
  console.log(`  ✓ shots   ${shotCount}`);
}
